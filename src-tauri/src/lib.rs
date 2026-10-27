pub mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::launch_game,
            commands::check_game_installed,
            commands::kill_game_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running OneEngine Store launcher");
}
