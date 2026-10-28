mod ddc;
mod tray;
#[cfg(windows)]
mod win_display;

use std::sync::atomic::Ordering;
use tauri::{Manager, WindowEvent};

/// Passed by the autostart entry so NitPick starts quietly in the tray.
const MINIMIZED_ARG: &str = "--minimized";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Must be registered first: a second launch just brings the running window forward.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| tray::show_main(app)))
        .plugin(tauri_plugin_autostart::Builder::new().args([MINIMIZED_ARG]).build())
        .manage(tray::TrayState::default())
        .setup(|app| {
            tray::create(app.handle())?;
            // The window starts hidden (see tauri.conf.json) so autostart doesn't flash it.
            if !std::env::args().any(|a| a == MINIMIZED_ARG) {
                tray::show_main(app.handle());
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.state::<tray::TrayState>().close_to_tray.load(Ordering::Relaxed) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            ddc::ddc_list,
            ddc::ddc_set,
            ddc::sw_set,
            tray::update_tray,
            tray::set_close_to_tray
        ])
        .run(tauri::generate_context!())
        .expect("error while running NitPick");
}
