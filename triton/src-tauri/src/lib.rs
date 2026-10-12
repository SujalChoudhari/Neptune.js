
use tauri::menu::{Menu, MenuItem, Submenu};
use tauri::{Emitter, Manager};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;

#[derive(Default)]
struct SelectedProjectRoot(Mutex<Option<PathBuf>>);

fn scoped_error() -> String {
    "Path must be a relative path inside the selected project".to_string()
}

fn validate_relative_path(path: &Path) -> Result<(), String> {
    if path.as_os_str().is_empty() || path.is_absolute() {
        return Err(scoped_error());
    }

    for component in path.components() {
        match component {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(scoped_error());
            }
            Component::CurDir | Component::Normal(_) => {}
        }
    }
    Ok(())
}

fn selected_root(state: &SelectedProjectRoot) -> Result<PathBuf, String> {
    state
        .0
        .lock()
        .map_err(|_| "Selected project state is unavailable".to_string())?
        .clone()
        .ok_or_else(|| "No project is selected".to_string())
}

fn set_selected_root(state: &SelectedProjectRoot, root: PathBuf) -> Result<(), String> {
    *state
        .0
        .lock()
        .map_err(|_| "Selected project state is unavailable".to_string())? = Some(root);
    Ok(())
}

/// Resolve a client path using the selected root. Existing path components are
/// canonicalized, so symlinks cannot move the operation outside the project.
/// For a new target, the nearest existing ancestor is canonicalized and the
/// remaining normal components are appended to that safe ancestor.
fn resolve_scoped_path(
    state: &SelectedProjectRoot,
    raw_path: &str,
    allow_root: bool,
) -> Result<PathBuf, String> {
    let relative = Path::new(raw_path);
    validate_relative_path(relative)?;
    let root = selected_root(state)?;

    let mut existing = root.join(relative);
    let mut suffix = Vec::new();
    while !existing.exists() {
        let name = existing
            .file_name()
            .ok_or_else(scoped_error)?
            .to_os_string();
        suffix.push(name);
        existing = existing.parent().ok_or_else(scoped_error)?.to_path_buf();
    }

    let canonical_existing = fs::canonicalize(&existing).map_err(|_| scoped_error())?;
    if !canonical_existing.starts_with(&root)
        || (!allow_root && canonical_existing == root && suffix.is_empty())
    {
        return Err(scoped_error());
    }

    let mut resolved = canonical_existing;
    for component in suffix.iter().rev() {
        resolved.push(component);
    }
    if !resolved.starts_with(&root) || (!allow_root && resolved == root) {
        return Err(scoped_error());
    }
    Ok(resolved)
}

fn resolve_existing_path(state: &SelectedProjectRoot, raw_path: &str) -> Result<PathBuf, String> {
    let path = resolve_scoped_path(state, raw_path, false)?;
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    Ok(fs::canonicalize(path).map_err(|_| scoped_error())?)
}

#[tauri::command]
fn get_startup_config() -> Option<String> {
    if cfg!(debug_assertions) {
        // In debug mode, check for a "debug_project" in the workspace root
        // Assuming we are running from project root or similar. 
        // Let's look for it relative to current dir.
        let debug_path = PathBuf::from("../debug_project");
        if debug_path.exists() {
             // Return absolute path if possible, or just the relative one if frontend handles it
             // Let's canonicalize to be safe
             if let Ok(abs_path) = fs::canonicalize(&debug_path) {
                 return Some(abs_path.to_string_lossy().to_string());
             }
        }
    }
    None
}

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


#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
struct FileNode {
    id: String,
    parentId: Option<String>,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    children: Vec<String>,
}

fn get_asset_type(path: &std::path::Path) -> String {
    if path.is_dir() {
        return "folder".to_string();
    }
    match path.extension().and_then(|e| e.to_str()) {
        Some("png") | Some("jpg") | Some("jpeg") | Some("webp") => "image".to_string(),
        Some("ts") | Some("js") | Some("rs") => "script".to_string(),
        Some("scene") => "scene".to_string(),
        Some("mat") => "material".to_string(),
        Some("prefab") => "prefab".to_string(),
        Some("glb") | Some("gltf") | Some("obj") | Some("fbx") => "model".to_string(),
        Some("mp3") | Some("wav") | Some("ogg") => "audio".to_string(),
        _ => "file".to_string(),
    }
}

// Helper to recursively scan
fn scan_directory(
    base_path: &std::path::Path, 
    current_path: &std::path::Path, 
    nodes: &mut std::collections::HashMap<String, FileNode>,
    parent_id: Option<String>
) -> Result<String, String> {
    let current_id = if current_path == base_path {
        "root".to_string()
    } else {
        current_path
            .strip_prefix(base_path)
            .map_err(|_| "Scanned path escaped the selected project".to_string())?
            .to_string_lossy()
            .to_string()
            .replace("\\", "/")
    };

    let name = current_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let kind = get_asset_type(current_path);

    let mut children_ids = Vec::new();

    if current_path.is_dir() {
        if let Ok(entries) = fs::read_dir(current_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    let canonical_path = fs::canonicalize(&path)
                        .map_err(|_| "Could not canonicalize scanned path".to_string())?;
                    if !canonical_path.starts_with(base_path) {
                        return Err(scoped_error());
                    }
                    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    
                    // Ignore dotfiles/folders
                    if file_name.starts_with('.') {
                        continue;
                    }

                    // Ignore .npt files
                    if path.extension().and_then(|e| e.to_str()) == Some("npt") {
                        continue;
                    }

                    // Ignore lib folder
                    if file_name == "lib" && canonical_path.is_dir() {
                        continue;
                    }
                    
                    let child_id = scan_directory(
                        base_path,
                        &canonical_path,
                        nodes,
                        Some(current_id.clone()),
                    )?;
                    children_ids.push(child_id);
                }
            }
        }
    }

    let node = FileNode {
        id: current_id.clone(),
        parentId: parent_id,
        name,
        kind,
        children: children_ids,
    };

    nodes.insert(current_id.clone(), node);
    Ok(current_id)
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let path = entry.path();
        let name = path.file_name().unwrap();
        let dst_path = dst.join(name);

        if ty.is_dir() {
            copy_dir_recursive(&path, &dst_path)?;
        } else {
            fs::copy(&path, &dst_path)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_root() -> (SelectedProjectRoot, PathBuf, PathBuf) {
        let id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::env::temp_dir().join(format!("triton-containment-{id}"));
        let outside = std::env::temp_dir().join(format!("triton-containment-outside-{id}"));
        fs::create_dir_all(&root).unwrap();
        fs::create_dir_all(&outside).unwrap();
        let canonical_root = fs::canonicalize(&root).unwrap();
        let state = SelectedProjectRoot(Mutex::new(Some(canonical_root)));
        (state, root, outside)
    }

    fn cleanup(root: &Path, outside: &Path) {
        let _ = fs::remove_dir_all(root);
        let _ = fs::remove_dir_all(outside);
    }

    #[test]
    fn rejects_absolute_and_traversal_paths() {
        let (state, root, outside) = test_root();
        assert!(resolve_scoped_path(&state, "/tmp", false).is_err());
        assert!(resolve_scoped_path(&state, "../outside.txt", false).is_err());
        assert!(resolve_scoped_path(&state, "child/../../outside.txt", false).is_err());
        if let Some(home) = std::env::var_os("HOME") {
            assert!(resolve_scoped_path(&state, &home.to_string_lossy(), false).is_err());
        }
        cleanup(&root, &outside);
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escape() {
        use std::os::unix::fs::symlink;

        let (state, root, outside) = test_root();
        fs::write(outside.join("secret.txt"), "secret").unwrap();
        symlink(&outside, root.join("escape")).unwrap();

        assert!(resolve_scoped_path(&state, "escape/secret.txt", false).is_err());
        cleanup(&root, &outside);
    }

    #[test]
    fn valid_project_relative_flow_stays_contained() {
        let (state, root, outside) = test_root();
        let source = resolve_scoped_path(&state, "assets/source.txt", false).unwrap();
        fs::create_dir_all(source.parent().unwrap()).unwrap();
        fs::write(&source, "valid").unwrap();

        let read_target = resolve_existing_path(&state, "assets/source.txt").unwrap();
        assert_eq!(fs::read_to_string(read_target).unwrap(), "valid");

        let destination = resolve_scoped_path(&state, "assets/moved.txt", false).unwrap();
        fs::rename(source, &destination).unwrap();
        assert!(resolve_existing_path(&state, "assets/moved.txt").is_ok());

        fs::remove_file(resolve_existing_path(&state, "assets/moved.txt").unwrap()).unwrap();
        assert!(resolve_existing_path(&state, "assets/moved.txt").is_err());
        assert!(destination.starts_with(fs::canonicalize(&root).unwrap()));
        assert!(!destination.starts_with(&outside));
        cleanup(&root, &outside);
    }

    #[test]
    fn rename_and_duplicate_use_sibling_destinations() {
        let (state, root, outside) = test_root();
        fs::create_dir_all(root.join("assets")).unwrap();
        fs::write(root.join("root.txt"), "root").unwrap();
        fs::write(root.join("assets/nested.txt"), "nested").unwrap();

        assert_eq!(
            rename_fs_node_impl("root.txt", "renamed.txt", &state).unwrap(),
            "renamed.txt"
        );
        assert!(!root.join("root.txt").exists());
        assert_eq!(
            fs::read_to_string(root.join("renamed.txt")).unwrap(),
            "root"
        );

        assert_eq!(
            rename_fs_node_impl("assets/nested.txt", "renamed.txt", &state).unwrap(),
            "assets/renamed.txt"
        );
        assert!(!root.join("assets/nested.txt").exists());
        assert_eq!(
            fs::read_to_string(root.join("assets/renamed.txt")).unwrap(),
            "nested"
        );

        fs::write(root.join("duplicate.txt"), "root duplicate").unwrap();
        fs::write(root.join("assets/duplicate.txt"), "nested duplicate").unwrap();
        assert_eq!(
            duplicate_fs_node_impl("duplicate.txt", &state).unwrap(),
            "duplicate (1).txt"
        );
        assert_eq!(
            duplicate_fs_node_impl("assets/duplicate.txt", &state).unwrap(),
            "assets/duplicate (1).txt"
        );
        assert_eq!(
            fs::read_to_string(root.join("duplicate (1).txt")).unwrap(),
            "root duplicate"
        );
        assert_eq!(
            fs::read_to_string(root.join("assets/duplicate (1).txt")).unwrap(),
            "nested duplicate"
        );

        cleanup(&root, &outside);
    }

    #[test]
    fn rename_and_duplicate_reject_out_of_scope_sources() {
        let (state, root, outside) = test_root();
        fs::write(outside.join("secret.txt"), "secret").unwrap();

        assert!(rename_fs_node_impl("../secret.txt", "renamed.txt", &state).is_err());
        assert!(duplicate_fs_node_impl("/tmp/secret.txt", &state).is_err());

        cleanup(&root, &outside);
    }
}

#[tauri::command]
async fn sync_neptune_lib(state: tauri::State<'_, SelectedProjectRoot>) -> Result<String, String> {
    let project_dir = resolve_scoped_path(&state, ".", true)?;

    // Engine source path: ../../src (Relative to src-tauri)
    // We need to resolve this robustly.
    // Try to find the root "Neptune.js" directory or just the "src" folder that contains "core".
    
    let mut current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let mut engine_src = None;

    for _ in 0..5 { // Search up to 5 levels
        let check_path = current_dir.join("src");
        if check_path.exists() && check_path.join("core").exists() {
            engine_src = Some(check_path);
            break;
        }
        
        // Also check if we are in the root and src is here
        if current_dir.join("core").exists() {
             engine_src = Some(current_dir.clone());
             break;
        }

        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
        } else {
            break;
        }
    }

    let engine_src = engine_src.ok_or("Could not locate Neptune.js engine source (looked for src/core)")?;

    if !engine_src.exists() {
        return Err(format!("Engine source not found at {:?}", engine_src));
    }

    let lib_dir = project_dir.join("lib");
    
    // Copy recursively
    copy_dir_recursive(&engine_src, &lib_dir).map_err(|e| format!("Failed to copy lib: {}", e))?;

    Ok("Synced".to_string())
}

#[tauri::command]
async fn scan_project(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<std::collections::HashMap<String, FileNode>, String> {
    let project_path = resolve_scoped_path(&state, &path, true)?;

    let mut nodes = std::collections::HashMap::new();
    scan_directory(&project_path, &project_path, &mut nodes, None)?;
    
    Ok(nodes)
}

#[tauri::command]
async fn initialize_project(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    let mut project_path = PathBuf::from(&path);
    
    // If input is a file (e.g., .npt), get its parent
    if project_path.extension().map_or(false, |ext| ext == "npt") {
        if let Some(parent) = project_path.parent() {
            project_path = parent.to_path_buf();
        }
    }

    // Create directory if it doesn't exist
    if !project_path.exists() {
        fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;
    }
    
    // Get project name from folder name
    let project_path = fs::canonicalize(&project_path).map_err(|e| e.to_string())?;
    let project_name = project_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("New Project");
    
    // Create marker file (.npt)
    let marker_file = project_path.join("project.npt");
    
    // Only write if not exists
    if !marker_file.exists() {
        let initial_config = format!(r#"{{ "name": "{}", "version": "0.0.1" }}"#, project_name);
        fs::write(marker_file, initial_config).map_err(|e| e.to_string())?;
    }

    set_selected_root(&state, project_path)?;
    
    Ok(true)
}

#[tauri::command]
async fn read_file(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    let path_buf = resolve_existing_path(&state, &path)?;
    fs::read_to_string(path_buf).map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file(
    path: String,
    content: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
     let path_buf = resolve_scoped_path(&state, &path, false)?;
     fs::write(path_buf, content).map_err(|e| e.to_string())?;
     Ok(true)
}

#[tauri::command]
async fn move_fs_node(
    source: String,
    target: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    let source_path = resolve_existing_path(&state, &source)?;
    let target_path = resolve_scoped_path(&state, &target, false)?;

    // Check if target directory exists if we are moving into it? 
    // Actually target argument here is the Full Destination Path including filename.
    // So usually we just rename.
    
    // Ensure parent of target exists
    if let Some(parent) = target_path.parent() {
        if !parent.is_dir() {
            return Err("Target directory does not exist".to_string());
        }
    }

    fs::rename(source_path, target_path).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
async fn create_directory(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    let path_buf = resolve_scoped_path(&state, &path, false)?;
    if path_buf.exists() {
        return Err("Directory already exists".to_string());
    }
    fs::create_dir_all(&path_buf).map_err(|e| e.to_string())?;
    Ok(path.replace("\\", "/"))
}

#[tauri::command]
async fn create_asset(
    path: String,
    content: Option<String>,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    let path_buf = resolve_scoped_path(&state, &path, false)?;
    if path_buf.exists() {
        return Err("File already exists".to_string());
    }
    fs::write(&path_buf, content.unwrap_or_default()).map_err(|e| e.to_string())?;
    Ok(path.replace("\\", "/"))
}

#[tauri::command]
async fn delete_fs_node(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    let path_buf = resolve_existing_path(&state, &path)?;
    if path_buf.is_dir() {
        fs::remove_dir_all(path_buf).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(path_buf).map_err(|e| e.to_string())?;
    }
    Ok(true)
}

fn sibling_relative_path(path: &str, new_name: &str) -> Result<PathBuf, String> {
    let source_path = Path::new(path);
    validate_relative_path(source_path)?;

    let name_path = Path::new(new_name);
    validate_relative_path(name_path)?;
    if !matches!(name_path.components().next(), Some(Component::Normal(_)))
        || name_path.components().count() != 1
    {
        return Err("Name must be a single path component".to_string());
    }

    let parent = source_path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    Ok(parent.join(name_path))
}

fn rename_fs_node_impl(
    path: &str,
    new_name: &str,
    state: &SelectedProjectRoot,
) -> Result<String, String> {
    let old_path = resolve_existing_path(state, path)?;
    let new_relative_path = sibling_relative_path(path, new_name)?;
    let new_path = resolve_scoped_path(
        state,
        &new_relative_path.to_string_lossy(),
        false,
    )?;

    if new_path.exists() {
        return Err("Destination already exists".to_string());
    }

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_relative_path.to_string_lossy().replace('\\', "/"))
}

#[tauri::command]
async fn rename_fs_node(
    path: String,
    new_name: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    rename_fs_node_impl(&path, &new_name, state.inner())
}

fn duplicate_fs_node_impl(
    path: &str,
    state: &SelectedProjectRoot,
) -> Result<String, String> {
    let old_path = resolve_existing_path(state, path)?;

    let file_stem = old_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let extension = old_path.extension().and_then(|s| s.to_str());
    let parent = Path::new(path)
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));

    // Find a unique sibling name, then resolve it through the selected root.
    let mut counter = 1;
    let (new_path, new_relative_path) = loop {
        let new_name = match extension {
            Some(ext) => format!("{} ({}).{}", file_stem, counter, ext),
            None => format!("{} ({})", file_stem, counter),
        };
        let relative_path = parent.join(new_name);
        let resolved_path = resolve_scoped_path(
            state,
            &relative_path.to_string_lossy(),
            false,
        )?;
        if !resolved_path.exists() {
            break (resolved_path, relative_path);
        }
        counter += 1;
    };

    if old_path.is_dir() {
        return Err(
            "Duplicating directories is not supported yet (requires crate `fs_extra` or manual recursion)"
                .to_string(),
        );
    }

    fs::copy(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_relative_path.to_string_lossy().replace('\\', "/"))
}

#[tauri::command]
async fn duplicate_fs_node(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    duplicate_fs_node_impl(&path, state.inner())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SelectedProjectRoot::default())
    .invoke_handler(tauri::generate_handler![
        initialize_project, 
        get_startup_config, 
        scan_project, 
        move_fs_node,
        create_directory,
        create_asset,
        delete_fs_node,
        rename_fs_node,
        duplicate_fs_node,
        sync_neptune_lib,
        read_file,
        write_file
    ])
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
