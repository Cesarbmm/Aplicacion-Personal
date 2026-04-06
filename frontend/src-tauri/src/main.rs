#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let _child = app
                    .shell()
                    .sidecar("bapp-api")
                    .expect("failed to resolve sidecar")
                    .args(["--host", "127.0.0.1", "--port", "8765"])
                    .spawn()
                    .expect("failed to launch api sidecar");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
