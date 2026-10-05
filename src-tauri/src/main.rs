#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine_runtime;

use std::sync::Mutex;

use engine_runtime::{engine_command, engine_status, engine_stop, EngineState};

fn main() {
    tauri::Builder::default()
        .manage(EngineState {
            process: Mutex::new(None),
            stdin: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            engine_command,
            engine_status,
            engine_stop
        ])
        .run(tauri::generate_context!())
        .expect("error while running Chupacabra");
}
