#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Child, ChildStdin, Command, Stdio},
    sync::Mutex,
    thread,
};

use serde::Deserialize;
use tauri::{path::BaseDirectory, Emitter, Manager, State};

struct EngineState {
    process: Mutex<Option<Child>>,
    stdin: Mutex<Option<ChildStdin>>,
}

impl Drop for EngineState {
    fn drop(&mut self) {
        if let Ok(mut process) = self.process.lock() {
            if let Some(child) = process.as_mut() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

#[derive(Debug, Deserialize)]
struct EngineCommand {
    command: String,
    #[serde(flatten)]
    payload: serde_json::Value,
}

fn data_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(root) = std::env::var("CHUPACABRA_DATA_ROOT") {
        let root = PathBuf::from(root);
        std::fs::create_dir_all(&root)
            .map_err(|error| format!("failed to create engine data directory: {error}"))?;
        return Ok(root);
    }

    let root = app
        .path()
        .document_dir()
        .map_err(|error| format!("failed to resolve Documents directory: {error}"))?
        .join("Chupacabra System");
    std::fs::create_dir_all(&root)
        .map_err(|error| format!("failed to create Chupacabra data directory: {error}"))?;
    Ok(root)
}

fn bundled_engine(app: &tauri::AppHandle) -> Result<Option<PathBuf>, String> {
    if let Ok(path) = std::env::var("CHUPACABRA_ENGINE") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Ok(Some(path));
        }
    }

    let extension = if cfg!(windows) { ".exe" } else { "" };
    let relative = format!("engine/chupacabra-engine{extension}");
    let path = app
        .path()
        .resolve(relative, BaseDirectory::Resource)
        .map_err(|error| format!("failed to resolve bundled engine: {error}"))?;

    Ok(path.exists().then_some(path))
}

fn hide_console_window(command: &mut Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
}

fn ensure_engine(app: &tauri::AppHandle, state: &EngineState) -> Result<(), String> {
    let mut process_guard = state
        .process
        .lock()
        .map_err(|_| "engine process lock poisoned")?;
    if process_guard
        .as_mut()
        .is_some_and(|child| child.try_wait().ok().flatten().is_none())
    {
        return Ok(());
    }

    let data_root = data_root(app)?;
    let mut command;

    if let Some(engine) = bundled_engine(app)? {
        command = Command::new(engine);
        command.current_dir(&data_root);
    } else {
        let python = std::env::var("CHUPACABRA_PYTHON").unwrap_or_else(|_| "python".to_string());
        let root = std::env::var("CHUPACABRA_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("."));
        command = Command::new(python);
        command
            .current_dir(root)
            .args(["-m", "engine.daemon"]);
    }

    hide_console_window(&mut command);
    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("failed to start Chupacabra engine: {error}"))?;

    // Give the bundled process a short window to fail fast (for example,
    // missing PyInstaller imports) instead of reporting a false-positive
    // successful start to the frontend.
    for _ in 0..20 {
        if let Some(status) = child
            .try_wait()
            .map_err(|error| format!("failed to inspect Chupacabra engine: {error}"))?
        {
            return Err(format!("Chupacabra engine encerrou ao iniciar: {status}"));
        }
        thread::sleep(std::time::Duration::from_millis(25));
    }

    let stdout = child
        .stdout
        .take()
        .ok_or("failed to open engine stdout")?;
    let stderr = child
        .stderr
        .take()
        .ok_or("failed to open engine stderr")?;
    let stdin = child
        .stdin
        .take()
        .ok_or("failed to open engine stdin")?;

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

    let mut stdin_guard = state
        .stdin
        .lock()
        .map_err(|_| "engine stdin lock poisoned")?;
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
    let mut stdin = state
        .stdin
        .lock()
        .map_err(|_| "engine stdin lock poisoned")?;
    let handle = stdin.as_mut().ok_or("engine stdin is unavailable")?;

    let mut payload = serde_json::Map::new();
    payload.insert(
        "command".into(),
        serde_json::Value::String(command.command),
    );
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
fn engine_status(
    app: tauri::AppHandle,
    state: State<'_, EngineState>,
) -> Result<String, String> {
    ensure_engine(&app, &state)?;

    let mut process = state
        .process
        .lock()
        .map_err(|_| "engine process lock poisoned")?;

    if process
        .as_mut()
        .is_some_and(|child| child.try_wait().ok().flatten().is_none())
    {
        Ok("running".to_string())
    } else {
        Ok("stopped".to_string())
    }
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
