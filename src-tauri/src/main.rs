use std::{
    io::{BufRead, BufReader, Write},
    process::{Child, ChildStdin, Command, Stdio},
    sync::Mutex,
    thread,
};

use serde::Deserialize;
use tauri::{Emitter, State};

struct EngineState {
    process: Mutex<Option<Child>>,
    stdin: Mutex<Option<ChildStdin>>,
}

#[derive(Debug, Deserialize)]
struct EngineCommand {
    command: String,
    #[serde(flatten)]
    payload: serde_json::Value,
}

fn ensure_engine(app: &tauri::AppHandle, state: &EngineState) -> Result<(), String> {
    let mut process_guard = state.process.lock().map_err(|_| "engine process lock poisoned")?;
    if process_guard
        .as_ref()
        .is_some_and(|child| child.try_wait().ok().flatten().is_none())
    {
        return Ok(());
    }

    let python = std::env::var("CHUPACABRA_PYTHON").unwrap_or_else(|_| "python".to_string());
    let root = std::env::var("CHUPACABRA_ROOT")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("."));

    let mut child = Command::new(python)
        .current_dir(root)
        .args(["-m", "engine.daemon"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("failed to start Python engine: {error}"))?;

    let stdout = child.stdout.take().ok_or("failed to open engine stdout")?;
    let stderr = child.stderr.take().ok_or("failed to open engine stderr")?;
    let stdin = child.stdin.take().ok_or("failed to open engine stdin")?;

    let app_handle = app.clone();
    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&line) {
                let _ = app_handle.emit("engine-event", value);
            }
        }
    });

    let app_handle = app.clone();
    thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            let _ = app_handle.emit("engine-stderr", line);
        }
    });

    *process_guard = Some(child);
    drop(process_guard);
    let mut stdin_guard = state.stdin.lock().map_err(|_| "engine stdin lock poisoned")?;
    *stdin_guard = Some(stdin);
    Ok(())
}

#[tauri::command]
fn engine_command(
    app: tauri::AppHandle,
    state: State<'_, EngineState>,
    command: EngineCommand,
) -> Result<(), String> {
    ensure_engine(&app, &state)?;
    let mut stdin = state.stdin.lock().map_err(|_| "engine stdin lock poisoned")?;
    let handle = stdin.as_mut().ok_or("engine stdin is unavailable")?;
    let mut payload = serde_json::Map::new();
    payload.insert("command".into(), serde_json::Value::String(command.command));
    if let serde_json::Value::Object(fields) = command.payload {
        payload.extend(fields);
    }
    serde_json::to_writer(&mut *handle, &serde_json::Value::Object(payload))
        .map_err(|error| format!("failed to send engine command: {error}"))?;
    handle
        .write_all(b"\n")
        .map_err(|error| format!("failed to write engine command: {error}"))?;
    handle
        .flush()
        .map_err(|error| format!("failed to flush engine command: {error}"))?;
    Ok(())
}

#[tauri::command]
fn engine_status(state: State<'_, EngineState>) -> Result<String, String> {
    let process = state.process.lock().map_err(|_| "engine process lock poisoned")?;
    Ok(
        if process
            .as_ref()
            .is_some_and(|child| child.try_wait().ok().flatten().is_none())
        {
            "running".to_string()
        } else {
            "stopped".to_string()
        },
    )
}

fn main() {
    tauri::Builder::default()
        .manage(EngineState {
            process: Mutex::new(None),
            stdin: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![engine_command, engine_status])
        .run(tauri::generate_context!())
        .expect("error while running Chupacabra");
}
