//! System tray icon: open the window, switch profiles, quit.
//!
//! The frontend owns the profiles and the menu wording (it knows the language), so it sends
//! the menu contents with `update_tray`; picking a profile emits `apply-profile` back to it.

use serde::Deserialize;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State, Wry};

const TRAY_ID: &str = "main";

#[derive(Default)]
pub struct TrayState {
    /// When true, closing the window hides it to the tray instead of quitting.
    pub close_to_tray: AtomicBool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrayMenu {
    open: String,
    quit: String,
    no_profiles: String,
    profiles: Vec<TrayProfile>,
    active: Option<String>,
}

#[derive(Deserialize)]
pub struct TrayProfile {
    id: String,
    label: String,
}

pub fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn build_menu(app: &AppHandle, m: &TrayMenu) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::new(app)?;
    menu.append(&MenuItem::with_id(app, "open", &m.open, true, None::<&str>)?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    if m.profiles.is_empty() {
        menu.append(&MenuItem::with_id(app, "none", &m.no_profiles, false, None::<&str>)?)?;
    }
    for p in &m.profiles {
        let checked = m.active.as_deref() == Some(p.id.as_str());
        let id = format!("profile:{}", p.id);
        menu.append(&CheckMenuItem::with_id(app, id, &p.label, true, checked, None::<&str>)?)?;
    }
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(app, "quit", &m.quit, true, None::<&str>)?)?;
    Ok(menu)
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    // Placeholder until the frontend sends the localized menu.
    let menu = build_menu(
        app,
        &TrayMenu {
            open: "Open NitPick".into(),
            quit: "Quit".into(),
            no_profiles: "No profiles saved yet".into(),
            profiles: Vec::new(),
            active: None,
        },
    )?;
    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("NitPick")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_main(app),
            "quit" => app.exit(0),
            id => {
                if let Some(profile) = id.strip_prefix("profile:") {
                    let _ = app.emit("apply-profile", profile.to_string());
                }
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

#[tauri::command]
pub fn update_tray(app: AppHandle, menu: TrayMenu) -> Result<(), String> {
    let built = build_menu(&app, &menu).map_err(|e| e.to_string())?;
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(built)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_close_to_tray(state: State<TrayState>, enabled: bool) {
    state.close_to_tray.store(enabled, Ordering::Relaxed);
}
