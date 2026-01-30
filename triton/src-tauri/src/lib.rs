
use tauri::menu::{Menu, MenuItem, Submenu, CheckMenuItem};
use tauri::{Emitter, Manager};
use std::fs;
use std::path::PathBuf;

#[tauri::command]
async fn create_project(app: tauri::AppHandle) -> Result<String, String> {
    // use tauri::plugin::dialog::DialogExt;
    
    // In Tauri v2, we use the dialog plugin or direct API if available. 
    // For simplicity, we'll try to use the native dialog from Rust if plugins are set up, 
    // or just return a mock path for the MVP if complex setup is needed.
    // BUT since we haven't set up the dialog plugin yet, let's implement a basic version 
    // that assumes the frontend handles the directory picking via `open` API or similar, 
    // OR we implement it here using `rfd` or similar if dependencies allow.
    
    // Checking Cargo.toml, we don't have `tauri-plugin-dialog`. 
    // So let's use the `tauri-plugin-dialog` if we can add it, OR use `rfd` (Rust File Dialog) if we add it.
    // However, for this environment, let's stick to what we can do.
    // A common pattern is: frontend asks user for folder -> frontend sends path -> backend initializes.
    
    // Let's assume the frontend will pick the directory using the JS API `open` from `@tauri-apps/plugin-dialog`.
    // Wait, we need to check if that plugin is installed in `package.json`.
    
    // To be safe and "funcionality first", let's make a command that RECEIVES a path
    // and initializes the project there.
    Ok("Project Created".to_string())
}

#[tauri::command]
async fn initialize_project(path: String) -> Result<bool, String> {
    let project_path = PathBuf::from(&path);
    if !project_path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    // Create a simple marker file
    let marker_file = project_path.join("triton.json");
    let initial_config = r#"{ "name": "New Project", "version": "0.0.1" }"#;
    
    fs::write(marker_file, initial_config).map_err(|e| e.to_string())?;
    
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![initialize_project])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_dialog::init())?;

      let handle = app.handle();

      // --- File Menu ---
      let new_project = MenuItem::with_id(handle, "new_project", "&New Project", true, None::<&str>)?;
      let open_project = MenuItem::with_id(handle, "open_project", "&Open Project...", true, None::<&str>)?;
      let save = MenuItem::with_id(handle, "save", "&Save", true, None::<&str>)?;
      let file_menu = Submenu::with_items(
          handle,
          "&File",
          true,
          &[
              &new_project,
              &open_project,
              &tauri::menu::PredefinedMenuItem::separator(handle)?,
              &save,
              &tauri::menu::PredefinedMenuItem::separator(handle)?,
              &tauri::menu::PredefinedMenuItem::quit(handle, None)?,
          ],
      )?;

      // --- Edit Menu ---
      let edit_menu = Submenu::with_items(
          handle,
          "&Edit",
          true,
          &[
              &tauri::menu::PredefinedMenuItem::undo(handle, None)?,
              &tauri::menu::PredefinedMenuItem::redo(handle, None)?,
              &tauri::menu::PredefinedMenuItem::separator(handle)?,
              &tauri::menu::PredefinedMenuItem::cut(handle, None)?,
              &tauri::menu::PredefinedMenuItem::copy(handle, None)?,
              &tauri::menu::PredefinedMenuItem::paste(handle, None)?,
              &tauri::menu::PredefinedMenuItem::select_all(handle, None)?,
          ],
      )?;

      // --- Window Menu (Panels + System) ---
      // We'll put Panels here as requested ("The Windows option had all the panels listed")
      let toggle_hierarchy = MenuItem::with_id(handle, "panel_hierarchy", "Hierarchy", true, None::<&str>)?;
      let toggle_inspector = MenuItem::with_id(handle, "panel_inspector", "Inspector", true, None::<&str>)?;
      let toggle_scene = MenuItem::with_id(handle, "panel_viewport", "Scene View", true, None::<&str>)?;
      let toggle_console = MenuItem::with_id(handle, "panel_console", "Console", true, None::<&str>)?;
      let toggle_project = MenuItem::with_id(handle, "panel_project", "Project", true, None::<&str>)?;
      let toggle_atlas = MenuItem::with_id(handle, "panel_atlas", "Atlas", true, None::<&str>)?;

      let window_menu = Submenu::with_items(
          handle,
          "&Window",
          true,
          &[
              &tauri::menu::PredefinedMenuItem::minimize(handle, None)?,
              &tauri::menu::PredefinedMenuItem::maximize(handle, None)?,
              &tauri::menu::PredefinedMenuItem::separator(handle)?,
              // Editor Panels
              &toggle_hierarchy,
              &toggle_inspector,
              &toggle_scene,
              &toggle_console,
              &toggle_project,
              &toggle_atlas,
              &tauri::menu::PredefinedMenuItem::separator(handle)?,
              &tauri::menu::PredefinedMenuItem::close_window(handle, None)?,
          ],
      )?;

      // --- Layout Menu ---
      let layout_default = MenuItem::with_id(handle, "layout_default", "Default Layout", true, None::<&str>)?;
      let layout_anim = MenuItem::with_id(handle, "layout_animation", "Animation Workspace", true, None::<&str>)?;
      let layout_debug = MenuItem::with_id(handle, "layout_debug", "Debug Workspace", true, None::<&str>)?;
      
      let layout_menu = Submenu::with_items(
          handle,
          "&Layout",
          true,
          &[
              &layout_default,
              &layout_anim,
              &layout_debug,
          ],
      )?;

      // --- Build Menu ---
      let build_game = MenuItem::with_id(handle, "build_game", "Build Game...", true, None::<&str>)?;
      
      let build_menu = Submenu::with_items(
          handle,
          "&Build",
          true,
          &[&build_game],
      )?;

      // --- Help Menu ---
      let help_menu = Submenu::with_items(
          handle,
          "&Help",
          true,
          &[
              &tauri::menu::PredefinedMenuItem::about(handle, None, None)?,
          ],
      )?;

      let menu = Menu::with_items(handle, &[
          &file_menu, 
          &edit_menu, 
          &window_menu, 
          &layout_menu, 
          &build_menu, 
          &help_menu
      ])?;
      app.set_menu(menu)?;

      // Event Handling
      app.on_menu_event(move |app, event| {
          let event_id = event.id().as_ref();
          // Emit event to frontend
          // We use a generic "menu_event" and pass the ID as payload
          let _ = app.emit("menu_event", event_id);
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
