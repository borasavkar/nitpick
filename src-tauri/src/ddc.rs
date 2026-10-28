//! Monitor control over DDC/CI: read and change brightness, contrast and RGB gain.
//!
//! Display handles are not thread-safe on every platform, so each command enumerates
//! the displays on a blocking thread, does its work and drops them again. Enumeration
//! is cheap (about 1 ms); a global lock keeps commands from talking over each other on
//! the monitor's I²C bus.

use ddc_hi::{Ddc, Display};
use serde::Serialize;
use std::sync::Mutex;

/// VCP feature codes NitPick reads and writes: brightness, contrast, red/green/blue gain.
const FEATURES: [u8; 5] = [0x10, 0x12, 0x16, 0x18, 0x1A];

static DDC_LOCK: Mutex<()> = Mutex::new(());

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Feature {
    code: u8,
    value: u16,
    max: u16,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DdcDisplay {
    /// Stable within a session: enumeration index plus the OS display id.
    key: String,
    name: String,
    /// False when the monitor doesn't answer DDC/CI (unsupported, or turned off in its menu).
    supported: bool,
    features: Vec<Feature>,
    /// OS device name used for software adjustment; `None` where that isn't available.
    gdi_name: Option<String>,
}

/// OS-level identity of each display, in DDC enumeration order: (device name, friendly name).
#[cfg(windows)]
fn os_identities() -> Vec<(Option<String>, Option<String>)> {
    crate::win_display::monitors()
        .into_iter()
        .flat_map(|m| std::iter::repeat_n((Some(m.gdi_name), m.friendly_name), m.physical_count))
        .collect()
}

#[cfg(not(windows))]
fn os_identities() -> Vec<(Option<String>, Option<String>)> {
    Vec::new()
}

fn display_key(index: usize, d: &Display) -> String {
    format!("{index}:{}", d.info.id)
}

fn display_name(d: &Display) -> String {
    let id = d.info.id.trim();
    if !id.is_empty() && !id.eq_ignore_ascii_case("Generic PnP Monitor") {
        return id.to_string();
    }
    d.info
        .model_name
        .clone()
        .filter(|m| !m.trim().is_empty())
        .unwrap_or_else(|| id.to_string())
}

fn with_display<T>(key: &str, f: impl FnOnce(&mut Display) -> Result<T, String>) -> Result<T, String> {
    let _guard = DDC_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let mut displays = Display::enumerate();
    let display = displays
        .iter_mut()
        .enumerate()
        .find(|(i, d)| display_key(*i, d) == key)
        .map(|(_, d)| d)
        .ok_or_else(|| "Display not found".to_string())?;
    f(display)
}

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(|e| e.to_string())?
}

/// Lists connected displays with the current value of each supported feature.
#[tauri::command]
pub async fn ddc_list() -> Result<Vec<DdcDisplay>, String> {
    blocking(|| {
        let _guard = DDC_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        let mut displays = Display::enumerate();
        let identities = os_identities();
        Ok(displays
            .iter_mut()
            .enumerate()
            .map(|(i, d)| {
                let (gdi_name, friendly) = identities.get(i).cloned().unwrap_or((None, None));
                let features: Vec<Feature> = FEATURES
                    .iter()
                    .filter_map(|&code| {
                        let v = d.handle.get_vcp_feature(code).ok()?;
                        (v.maximum() > 0).then(|| Feature { code, value: v.value(), max: v.maximum() })
                    })
                    .collect();
                DdcDisplay {
                    key: display_key(i, d),
                    // Prefer the longer DDC name when it already contains the EDID name ("AOC CU34G2XP").
                    name: match friendly {
                        Some(f) if !display_name(d).contains(&f) => f,
                        _ => display_name(d),
                    },
                    supported: !features.is_empty(),
                    features,
                    gdi_name,
                }
            })
            .collect())
    })
    .await
}

/// Sets one feature on one display. Only the features in `FEATURES` can be changed.
#[tauri::command]
pub async fn ddc_set(key: String, code: u8, value: u16) -> Result<(), String> {
    if !FEATURES.contains(&code) {
        return Err(format!("Feature 0x{code:02X} is not allowed"));
    }
    blocking(move || {
        with_display(&key, |d| {
            let max = d.handle.get_vcp_feature(code).map_err(|e| e.to_string())?.maximum();
            d.handle
                .set_vcp_feature(code, value.min(max))
                .map_err(|e| e.to_string())
        })
    })
    .await
}

/// Software adjustment through the graphics card's output curve, for monitors without DDC/CI.
/// Values are percentages (100 = unchanged). It changes the picture, not the backlight.
#[tauri::command]
pub async fn sw_set(gdi_name: String, brightness: f64, red: f64, green: f64, blue: f64) -> Result<(), String> {
    #[cfg(windows)]
    {
        let f = |v: f64| (v / 100.0).clamp(0.0, 1.0);
        blocking(move || crate::win_display::set_gamma(&gdi_name, f(brightness), [f(red), f(green), f(blue)])).await
    }
    #[cfg(not(windows))]
    {
        let _ = (gdi_name, brightness, red, green, blue);
        Err("Software adjustment is only available on Windows".into())
    }
}
