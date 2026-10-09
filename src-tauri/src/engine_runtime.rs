use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Child, ChildStdin, Command, Stdio},
    sync::Mutex,
    thread,
};

use serde::Deserialize;
use tauri::{path::BaseDirectory, Emitter, Manager, State};

pub struct EngineState {
    process: Mutex<Option<Child>>,
    stdin: Mutex<Option<ChildStdin>>,
}

impl EngineState {
    pub fn new() -> Self {
        Self {
            process: Mutex::new(None),
            stdin: Mutex::new(None),
        }
    }
}

impl Drop for EngineState {
    fn drop(&mut self) {
        stop_process(self);
    }
}

#[derive(Debug, Deserialize)]
pub struct EngineCommand {
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
        .app_data_dir()
        .map_err(|error| format!("failed to resolve application data directory: {error}"))?
        .join("Chupacabra System");

    std::fs::create_dir_all(&root)
        .map_err(|error| format!("failed to create Chupacabra data directory: {error}"))?;
    Ok(root)
}

fn reports_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .document_dir()
        .map_err(|error| format!("failed to resolve Documents directory: {error}"))?
        .join("Chupacabra System")
        .join("Relatórios");

    std::fs::create_dir_all(&root)
        .map_err(|error| format!("failed to create Chupacabra reports directory: {error}"))?;
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

fn process_running(state: &EngineState) -> Result<bool, String> {
    let mut process = state
        .process
        .lock()
        .map_err(|_| "engine process lock poisoned")?;

    match process.as_mut() {
        Some(child) => Ok(child
            .try_wait()
            .map_err(|error| format!("failed to inspect Chupacabra engine: {error}"))?
            .is_none()),
        None => Ok(false),
    }
}

fn ensure_engine(app: &tauri::AppHandle, state: &EngineState) -> Result<(), String> {
    if process_running(state)? {
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
        command.current_dir(root).args(["-m", "engine.daemon"]);
    }

    command.env("PYTHONUTF8", "1");
    command.env("PYTHONIOENCODING", "utf-8");
    hide_console_window(&mut command);

    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("failed to start Chupacabra engine: {error}"))?;

    for _ in 0..20 {
        if let Some(status) = child
            .try_wait()
            .map_err(|error| format!("failed to inspect Chupacabra engine: {error}"))?
        {
            return Err(format!("Chupacabra engine encerrou ao iniciar: {status}"));
        }
        thread::sleep(std::time::Duration::from_millis(25));
    }

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
            let _ = app_handle.emit(
                "engine-event",
                serde_json::json!({
                    "type": "engine_stderr",
                    "error": line
                }),
            );
        }
    });

    let mut process = state
        .process
        .lock()
        .map_err(|_| "engine process lock poisoned")?;
    *process = Some(child);
    drop(process);

    let mut stdin_guard = state
        .stdin
        .lock()
        .map_err(|_| "engine stdin lock poisoned")?;
    *stdin_guard = Some(stdin);

    Ok(())
}

fn stop_process(state: &EngineState) {
    if let Ok(mut stdin) = state.stdin.lock() {
        *stdin = None;
    }

    if let Ok(mut process) = state.process.lock() {
        if let Some(child) = process.as_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }
        *process = None;
    }
}

#[tauri::command]
pub fn engine_command(
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
        serde_json::Value::String(command.command.clone()),
    );

    if let serde_json::Value::Object(fields) = command.payload {
        payload.extend(fields);
    }

    if matches!(
        command.command.as_str(),
        "start_run"
            | "export_run_report"
            | "list_runs"
            | "load_run_leads"
            | "list_profiles"
            | "save_profile"
    ) {
        payload.insert(
            "runs_dir".into(),
            serde_json::Value::String(data_root(&app)?.join("runs").to_string_lossy().into_owned()),
        );
        payload.insert(
            "reports_dir".into(),
            serde_json::Value::String(reports_root(&app)?.to_string_lossy().into_owned()),
        );
        payload.insert(
            "profile_settings_file".into(),
            serde_json::Value::String(
                data_root(&app)?
                    .join("profile-settings.json")
                    .to_string_lossy()
                    .into_owned(),
            ),
        );
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
pub fn engine_status(
    app: tauri::AppHandle,
    state: State<'_, EngineState>,
) -> Result<String, String> {
    ensure_engine(&app, &state)?;

    if process_running(&state)? {
        Ok("running".to_string())
    } else {
        Ok("stopped".to_string())
    }
}

#[tauri::command]
pub fn engine_stop(state: State<'_, EngineState>) -> Result<(), String> {
    stop_process(&state);
    Ok(())
}
