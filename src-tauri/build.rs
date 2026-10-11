fn main() {
    // tauri_build only watches its own inputs, so a regenerated icon would otherwise keep the old embedded one.
    println!("cargo:rerun-if-changed=icons/icon.ico");
    tauri_build::build()
}
