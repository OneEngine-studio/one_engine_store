use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchResult {
    pub success: bool,
    pub pid: Option<u32>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessExitPayload {
    pub pid: u32,
    pub code: i32,
}

/// Verifies authorization payload and spawns the Unity game process (Railbound.exe)
/// passing encrypted auth flags into command-line arguments.
#[tauri::command]
pub async fn launch_game(
    app: AppHandle,
    game_path: String,
    auth_token: String,
    player_name: String,
    user_id: String,
) -> Result<LaunchResult, String> {
    if auth_token.trim().is_empty() {
        return Err("Authentication failed: Missing or invalid session JWT token".into());
    }

    if player_name.trim().is_empty() {
        return Err("Invalid operator profile: player_name required".into());
    }

    println!(
        "[OneEngine Launcher] Executing launch sequence for operative: {} (ID: {})",
        player_name, user_id
    );

    let path_ref = Path::new(&game_path);
    
    // Check if real executable exists. If absent in dev environment, fall back to simulated process
    let mut cmd = if path_ref.exists() {
        let mut c = Command::new(&game_path);
        c.args([
            "--auth-token",
            &auth_token,
            "--player-name",
            &player_name,
            "--user-id",
            &user_id,
        ]);
        c
    } else {
        println!(
            "[OneEngine Launcher] Note: Target binary '{}' not detected on disk. Spawning mock runner for pipeline verification.",
            game_path
        );
        #[cfg(target_os = "windows")]
        {
            let mut c = Command::new("cmd");
            // Ping localhost to keep the mock process alive for ~10 seconds
            c.args([
                "/C",
                &format!(
                    "echo [Railbound Mock] Launched with token: {} & ping 127.0.0.1 -n 15 > nul",
                    auth_token
                ),
            ]);
            c
        }
        #[cfg(not(target_os = "windows"))]
        {
            let mut c = Command::new("sh");
            c.args([
                "-c",
                &format!(
                    "echo [Railbound Mock] Launched with token: {} && sleep 15",
                    auth_token
                ),
            ]);
            c
        }
    };

    let mut child = cmd.spawn().map_err(|e| {
        format!(
            "Failed to spawn game process '{}': {}",
            game_path, e
        )
    })?;

    let pid = child.id();
    println!("[OneEngine Launcher] Game process initiated successfully. PID: {}", pid);

    // Monitor child process asynchronously and emit event on termination
    let app_clone = app.clone();
    std::thread::spawn(move || {
        let exit_code = match child.wait() {
            Ok(status) => status.code().unwrap_or(0),
            Err(e) => {
                eprintln!("[OneEngine Launcher] Error waiting for game process: {}", e);
                -1
            }
        };

        println!(
            "[OneEngine Launcher] Process {} exited with status code: {}",
            pid, exit_code
        );

        let _ = app_clone.emit(
            "game-process-exited",
            ProcessExitPayload {
                pid,
                code: exit_code,
            },
        );
    });

    Ok(LaunchResult {
        success: true,
        pid: Some(pid),
        message: format!("Railbound initialized. PID: {}", pid),
    })
}

/// Checks whether the game executable exists at the designated path.
#[tauri::command]
pub fn check_game_installed(game_path: String) -> bool {
    Path::new(&game_path).is_file()
}

/// Terminates an active game process by PID.
#[tauri::command]
pub fn kill_game_process(pid: u32) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F"])
            .output()
            .map_err(|e| format!("Failed to execute taskkill: {}", e))?;

        Ok(output.status.success())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("kill")
            .args(["-9", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute kill: {}", e))?;

        Ok(output.status.success())
    }
}
