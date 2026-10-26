mod ddc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ddc::ddc_list, ddc::ddc_set])
        .run(tauri::generate_context!())
        .expect("error while running NitPick");
}
