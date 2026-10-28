//! Windows-only display helpers: real monitor names and software (gamma ramp) adjustment.

use std::collections::HashMap;
use std::ptr;
use windows_sys::Win32::Devices::Display::{
    DisplayConfigGetDeviceInfo, GetDisplayConfigBufferSizes, GetNumberOfPhysicalMonitorsFromHMONITOR,
    QueryDisplayConfig, DISPLAYCONFIG_DEVICE_INFO_GET_SOURCE_NAME, DISPLAYCONFIG_DEVICE_INFO_GET_TARGET_NAME,
    DISPLAYCONFIG_MODE_INFO, DISPLAYCONFIG_PATH_INFO, DISPLAYCONFIG_SOURCE_DEVICE_NAME,
    DISPLAYCONFIG_TARGET_DEVICE_NAME, QDC_ONLY_ACTIVE_PATHS,
};
use windows_sys::Win32::Foundation::{LPARAM, RECT};
use windows_sys::Win32::Graphics::Gdi::{
    CreateDCW, DeleteDC, EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO, MONITORINFOEXW,
};
use windows_sys::Win32::UI::ColorSystem::SetDeviceGammaRamp;

pub struct WinMonitor {
    /// GDI device name such as `\\.\DISPLAY2`; used to address the monitor.
    pub gdi_name: String,
    /// Name from the monitor's EDID, such as "ASUS VW193D".
    pub friendly_name: Option<String>,
    /// Physical monitors behind this HMONITOR (more than one only when displays are cloned).
    pub physical_count: usize,
}

fn wide_to_string(buf: &[u16]) -> String {
    let end = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    String::from_utf16_lossy(&buf[..end])
}

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

unsafe extern "system" fn collect_monitor(hmon: HMONITOR, _: HDC, _: *mut RECT, data: LPARAM) -> i32 {
    let list = unsafe { &mut *(data as *mut Vec<HMONITOR>) };
    list.push(hmon);
    1
}

/// Maps GDI device names to EDID friendly names using the DisplayConfig API.
fn friendly_names() -> HashMap<String, String> {
    let mut names = HashMap::new();
    unsafe {
        let (mut n_paths, mut n_modes) = (0u32, 0u32);
        if GetDisplayConfigBufferSizes(QDC_ONLY_ACTIVE_PATHS, &mut n_paths, &mut n_modes) != 0 {
            return names;
        }
        let mut paths: Vec<DISPLAYCONFIG_PATH_INFO> = vec![std::mem::zeroed(); n_paths as usize];
        let mut modes: Vec<DISPLAYCONFIG_MODE_INFO> = vec![std::mem::zeroed(); n_modes as usize];
        if QueryDisplayConfig(
            QDC_ONLY_ACTIVE_PATHS,
            &mut n_paths,
            paths.as_mut_ptr(),
            &mut n_modes,
            modes.as_mut_ptr(),
            ptr::null_mut(),
        ) != 0
        {
            return names;
        }
        for path in paths.iter().take(n_paths as usize) {
            let mut source: DISPLAYCONFIG_SOURCE_DEVICE_NAME = std::mem::zeroed();
            source.header.r#type = DISPLAYCONFIG_DEVICE_INFO_GET_SOURCE_NAME;
            source.header.size = std::mem::size_of::<DISPLAYCONFIG_SOURCE_DEVICE_NAME>() as u32;
            source.header.adapterId = path.sourceInfo.adapterId;
            source.header.id = path.sourceInfo.id;

            let mut target: DISPLAYCONFIG_TARGET_DEVICE_NAME = std::mem::zeroed();
            target.header.r#type = DISPLAYCONFIG_DEVICE_INFO_GET_TARGET_NAME;
            target.header.size = std::mem::size_of::<DISPLAYCONFIG_TARGET_DEVICE_NAME>() as u32;
            target.header.adapterId = path.targetInfo.adapterId;
            target.header.id = path.targetInfo.id;

            if DisplayConfigGetDeviceInfo(&mut source.header) == 0 && DisplayConfigGetDeviceInfo(&mut target.header) == 0 {
                let name = wide_to_string(&target.monitorFriendlyDeviceName);
                if !name.trim().is_empty() {
                    names.insert(wide_to_string(&source.viewGdiDeviceName), name);
                }
            }
        }
    }
    names
}

/// Monitors in the same order ddc-winapi uses (EnumDisplayMonitors, then physical monitors).
pub fn monitors() -> Vec<WinMonitor> {
    let mut handles: Vec<HMONITOR> = Vec::new();
    unsafe {
        EnumDisplayMonitors(ptr::null_mut(), ptr::null(), Some(collect_monitor), &mut handles as *mut _ as LPARAM);
    }
    let names = friendly_names();
    handles
        .into_iter()
        .map(|h| unsafe {
            let mut info: MONITORINFOEXW = std::mem::zeroed();
            info.monitorInfo.cbSize = std::mem::size_of::<MONITORINFOEXW>() as u32;
            GetMonitorInfoW(h, &mut info as *mut MONITORINFOEXW as *mut MONITORINFO);
            let gdi_name = wide_to_string(&info.szDevice);
            let mut count = 0u32;
            GetNumberOfPhysicalMonitorsFromHMONITOR(h, &mut count);
            WinMonitor {
                friendly_name: names.get(&gdi_name).cloned(),
                gdi_name,
                physical_count: count.max(1) as usize,
            }
        })
        .collect()
}

/// Windows rejects gamma ramps that dim a channel below about half (tested on Windows 11).
const MIN_FACTOR: f64 = 0.5;

/// Scales the GPU's output curve for one monitor. 1.0 everywhere restores the identity ramp.
/// `brightness` and each gain are factors between 0 and 1; each channel's combined factor is
/// kept at or above `MIN_FACTOR` so Windows accepts the ramp.
pub fn set_gamma(gdi_name: &str, brightness: f64, gains: [f64; 3]) -> Result<(), String> {
    let mut ramp = [0u16; 3 * 256];
    for (c, gain) in gains.iter().enumerate() {
        let factor = (brightness * gain).clamp(MIN_FACTOR, 1.0);
        for i in 0..256 {
            ramp[c * 256 + i] = ((i as f64 / 255.0) * factor * 65535.0).round() as u16;
        }
    }
    let name = to_wide(gdi_name);
    unsafe {
        let hdc = CreateDCW(ptr::null(), name.as_ptr(), ptr::null(), ptr::null());
        if hdc.is_null() {
            return Err("Could not open the display".into());
        }
        let ok = SetDeviceGammaRamp(hdc, ramp.as_ptr() as *const _);
        DeleteDC(hdc);
        if ok == 0 {
            return Err("Windows rejected the adjustment".into());
        }
    }
    Ok(())
}
