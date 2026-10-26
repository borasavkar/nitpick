//! Read-only DDC/CI probe: lists monitors and reads a few settings without changing anything.
//! Run with: cargo run --example ddc_probe
use ddc_hi::{Ddc, Display};
use std::time::Instant;

fn main() {
    let t = Instant::now();
    let mut displays = Display::enumerate();
    println!("enumerate: {} display(s) in {:?}", displays.len(), t.elapsed());
    for d in displays.iter_mut() {
        let t = Instant::now();
        let _ = d.update_capabilities();
        println!(
            "\n[{}] backend={:?} model={:?} mfr={:?} serial={:?} (caps {:?})",
            d.info.id, d.info.backend, d.info.model_name, d.info.manufacturer_id, d.info.serial_number, t.elapsed()
        );
        for (name, code) in [("brightness", 0x10u8), ("contrast", 0x12), ("color preset", 0x14), ("red gain", 0x16), ("green gain", 0x18), ("blue gain", 0x1A), ("sharpness", 0x87)] {
            let t = Instant::now();
            match d.handle.get_vcp_feature(code) {
                Ok(v) => println!("  {name:13} = {:>4} / {:<4} ({:?})", v.value(), v.maximum(), t.elapsed()),
                Err(e) => println!("  {name:13} unsupported: {e}"),
            }
        }
    }
}
