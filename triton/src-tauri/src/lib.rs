
use tauri::menu::{Menu, MenuItem, Submenu};
use tauri::{Emitter, Manager};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use serde_json::Value;

const PROJECT_SCHEMA_VERSION: i64 = 1;
const SCENE_SCHEMA_VERSION: i64 = 1;
const DATA_VERSION: &str = "1.0.0";

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

fn parse_major_version(value: &Value) -> Option<i64> {
    match value {
        Value::Number(number) => number.as_i64(),
        Value::String(version) => version.split('.').next()?.parse::<i64>().ok(),
        _ => None,
    }
}

fn validate_version(value: Option<&Value>, kind: &str, expected: i64) -> Result<(), String> {
    let Some(value) = value else { return Ok(()); };
    if parse_major_version(value) != Some(expected) {
        return Err(format!(
            "Unsupported {kind} schema version '{}'. Supported version is {expected}. Migrate the {kind} before loading it.",
            value
        ));
    }
    Ok(())
}

fn resource_target(value: &Value) -> Option<String> {
    match value {
        Value::String(value) if !value.trim().is_empty() => Some(value.trim().to_string()),
        Value::Object(object) => ["path", "uri", "id", "key", "ref"]
            .iter()
            .find_map(|key| object.get(*key).and_then(Value::as_str))
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string),
        _ => None,
    }
}

fn require_resource(value: Option<&Value>, kind: &str, location: &str) -> Result<(), String> {
    if value.and_then(resource_target).is_none() {
        return Err(format!(
            "[RESOURCE_REFERENCE_INVALID] Invalid {kind} resource reference at {location}: missing or empty target. Expected a non-empty path, id, uri, or key."
        ));
    }
    Ok(())
}

fn validate_resource_references(value: &Value, location: &str) -> Result<(), String> {
    let Some(object) = value.as_object() else {
        if value.is_array() {
            for (index, child) in value.as_array().unwrap().iter().enumerate() {
                validate_resource_references(child, &format!("{location}[{index}]"))?;
            }
        }
        return Ok(());
    };

    let kind = object
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_ascii_lowercase();
    let props = object.get("props").and_then(Value::as_object);
    match kind.as_str() {
        "sprite" => require_resource(
            props.and_then(|props| props.get("path").or_else(|| props.get("texture")).or_else(|| props.get("asset")).or_else(|| props.get("reference"))),
            "sprite",
            &format!("{location}.props.path"),
        )?,
        "sound" | "soundpool" | "audio" => require_resource(
            props.and_then(|props| props.get("src").or_else(|| props.get("path")).or_else(|| props.get("audio")).or_else(|| props.get("asset")).or_else(|| props.get("reference"))),
            "audio",
            &format!("{location}.props.src"),
        )?,
        "tilemap" => require_resource(
            object.get("src").or_else(|| props.and_then(|props| props.get("tileset")).or_else(|| props.and_then(|props| props.get("asset")))),
            "tilemap",
            &format!("{location}.src"),
        )?,
        "animation" => require_resource(
            props.and_then(|props| props.get("path").or_else(|| props.get("animation")).or_else(|| props.get("asset")).or_else(|| props.get("reference"))),
            "animation",
            &format!("{location}.props.animation"),
        )?,
        _ => {}
    }

    if let Some(prefab) = object.get("prefab").or_else(|| object.get("prefabRef")) {
        require_resource(Some(prefab), "prefab", &format!("{location}.prefab"))?;
    }
    for (key, child) in object {
        validate_resource_references(child, &format!("{location}.{key}"))?;
    }
    Ok(())
}

fn normalize_scene_payload(mut payload: Value) -> Result<Value, String> {
    let object = payload
        .as_object_mut()
        .ok_or_else(|| "Invalid scene payload: expected a JSON object.".to_string())?;
    if let Some(kind) = object.get("type").and_then(Value::as_str) {
        if kind != "scene" {
            return Err(format!("Invalid scene payload type '{kind}'. Expected 'scene'."));
        }
    }
    validate_version(object.get("schemaVersion").or_else(|| object.get("version")), "scene", SCENE_SCHEMA_VERSION)?;
    validate_resource_references(&Value::Object(object.clone()), "scene")?;
    object.insert("type".to_string(), Value::String("scene".to_string()));
    object.insert("version".to_string(), Value::String(DATA_VERSION.to_string()));
    object.insert("schemaVersion".to_string(), Value::Number(SCENE_SCHEMA_VERSION.into()));
    Ok(payload)
}

fn normalize_project_payload(mut payload: Value) -> Result<Value, String> {
    let object = payload
        .as_object_mut()
        .ok_or_else(|| "Invalid project payload: expected a JSON object.".to_string())?;
    if let Some(kind) = object.get("type").and_then(Value::as_str) {
        if kind != "project" {
            return Err(format!("Invalid project payload type '{kind}'. Expected 'project'."));
        }
    }
    validate_version(object.get("schemaVersion").or_else(|| object.get("version")), "project", PROJECT_SCHEMA_VERSION)?;
    if let Some(scenes) = object.get_mut("scenes") {
        let scenes = scenes
            .as_array_mut()
            .ok_or_else(|| "Invalid project payload: 'scenes' must be an array.".to_string())?;
        for scene in scenes.iter_mut() {
            *scene = normalize_scene_payload(scene.take())?;
        }
    } else {
        object.insert("scenes".to_string(), Value::Array(Vec::new()));
    }
    validate_resource_references(&Value::Object(object.clone()), "project")?;
    object.insert("type".to_string(), Value::String("project".to_string()));
    object.insert("version".to_string(), Value::String(DATA_VERSION.to_string()));
    object.insert("schemaVersion".to_string(), Value::Number(PROJECT_SCHEMA_VERSION.into()));
    Ok(payload)
}

fn parse_json_payload(content: &str, kind: &str) -> Result<Value, String> {
    serde_json::from_str(content).map_err(|error| format!("Invalid {kind} payload: invalid JSON ({error})."))
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
    fn opening_existing_project_requires_marker_and_never_creates_it() {
        let (state, root, outside) = test_root();
        let project = root.join("existing");
        fs::create_dir_all(&project).unwrap();
        let before = selected_root(&state).unwrap();
        let error = open_existing_project_impl(project.to_str().unwrap(), &state).unwrap_err();
        assert!(error.contains("does not contain project.npt"));
        assert!(!project.join("project.npt").exists());
        assert_eq!(selected_root(&state).unwrap(), before);

        let marker = serde_json::json!({
            "type": "project", "schemaVersion": PROJECT_SCHEMA_VERSION, "scenes": []
        });
        fs::write(project.join("project.npt"), marker.to_string()).unwrap();
        assert!(open_existing_project_impl(project.to_str().unwrap(), &state).unwrap());
        assert_eq!(selected_root(&state).unwrap(), fs::canonicalize(&project).unwrap());
        cleanup(&root, &outside);
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

    #[test]
    fn normalizes_versioned_project_and_scene_without_dropping_ids() {
        let payload = serde_json::json!({
            "name": "Bridge Project",
            "scenes": [{
                "id": "scene-main",
                "name": "Main",
                "layers": []
            }]
        });

        let normalized = normalize_project_payload(payload).unwrap();
        assert_eq!(normalized["type"], "project");
        assert_eq!(normalized["schemaVersion"], PROJECT_SCHEMA_VERSION);
        assert_eq!(normalized["scenes"][0]["id"], "scene-main");
        assert_eq!(normalized["scenes"][0]["schemaVersion"], SCENE_SCHEMA_VERSION);
    }

    #[test]
    fn rejects_invalid_payloads_before_persistence() {
        let unsupported = serde_json::json!({ "type": "scene", "schemaVersion": 99 });
        let error = normalize_scene_payload(unsupported).unwrap_err();
        assert!(error.contains("Unsupported scene schema version '99'"));

        let invalid_resource = serde_json::json!({
            "type": "scene",
            "schemaVersion": 1,
            "layers": [{
                "type": "tilemap",
                "src": ""
            }]
        });
        let error = normalize_scene_payload(invalid_resource).unwrap_err();
        assert!(error.contains("RESOURCE_REFERENCE_INVALID"));
        assert!(error.contains("non-empty path"));
    }

    #[test]
    fn project_and_scene_commands_round_trip_through_selected_root() {
        let (state, root, outside) = test_root();
        fs::create_dir_all(root.join("scenes")).unwrap();

        let project = serde_json::json!({
            "type": "project",
            "version": "1.0.0",
            "schemaVersion": 1,
            "name": "Bridge Project",
            "scenes": [{
                "type": "scene",
                "version": "1.0.0",
                "schemaVersion": 1,
                "id": "scene-main",
                "name": "Main",
                "layers": []
            }]
        });
        let scene = serde_json::json!({
            "type": "scene",
            "version": "1.0.0",
            "schemaVersion": 1,
            "id": "scene-main",
            "name": "Main",
            "layers": []
        });

        write_project_impl(&project.to_string(), &state).unwrap();
        write_scene_impl("scenes/main.scene", &scene.to_string(), &state).unwrap();

        let restored_project: Value = serde_json::from_str(&read_project_impl(&state).unwrap()).unwrap();
        let restored_scene: Value = serde_json::from_str(
            &read_scene_impl("scenes/main.scene", &state).unwrap(),
        )
        .unwrap();

        assert_eq!(restored_project["schemaVersion"], PROJECT_SCHEMA_VERSION);
        assert_eq!(restored_project["scenes"][0]["id"], "scene-main");
        assert_eq!(restored_project["scenes"][0]["schemaVersion"], SCENE_SCHEMA_VERSION);
        assert_eq!(restored_scene["id"], "scene-main");
        assert_eq!(restored_scene["schemaVersion"], SCENE_SCHEMA_VERSION);
        assert!(root.join("project.npt").starts_with(fs::canonicalize(&root).unwrap()));
        assert!(root.join("scenes/main.scene").starts_with(fs::canonicalize(&root).unwrap()));

        cleanup(&root, &outside);
    }

    #[test]
    fn invalid_payloads_are_rejected_before_existing_files_are_overwritten() {
        let (state, root, outside) = test_root();
        fs::create_dir_all(root.join("scenes")).unwrap();

        let valid_project = serde_json::json!({
            "type": "project",
            "schemaVersion": 1,
            "scenes": []
        });
        let valid_scene = serde_json::json!({
            "type": "scene",
            "schemaVersion": 1,
            "id": "scene-main",
            "layers": []
        });
        write_project_impl(&valid_project.to_string(), &state).unwrap();
        write_scene_impl("scenes/main.scene", &valid_scene.to_string(), &state).unwrap();
        let project_before = fs::read_to_string(root.join("project.npt")).unwrap();
        let scene_before = fs::read_to_string(root.join("scenes/main.scene")).unwrap();

        let json_error = write_project_impl("{not valid json", &state).unwrap_err();
        assert!(json_error.contains("Invalid project payload: invalid JSON"));
        assert_eq!(fs::read_to_string(root.join("project.npt")).unwrap(), project_before);

        let resource_error = write_scene_impl(
            "scenes/main.scene",
            &serde_json::json!({
                "type": "scene",
                "schemaVersion": 1,
                "layers": [{ "type": "tilemap", "src": "" }]
            })
            .to_string(),
            &state,
        )
        .unwrap_err();
        assert!(resource_error.contains("RESOURCE_REFERENCE_INVALID"));
        assert_eq!(fs::read_to_string(root.join("scenes/main.scene")).unwrap(), scene_before);

        cleanup(&root, &outside);
    }

    #[test]
    fn image_asset_reader_returns_data_uri_and_rejects_project_escape() {
        let (state, root, outside) = test_root();
        fs::create_dir_all(root.join("assets")).unwrap();
        fs::write(root.join("assets/hero.png"), b"\x89PNG\r\n\x1a\n").unwrap();
        fs::write(outside.join("escape.png"), b"\x89PNG\r\n\x1a\n").unwrap();
        assert_eq!(read_image_asset_impl("assets/hero.png", &state).unwrap(), "data:image/png;base64,iVBORw0KGgo=");
        let escape_path = format!("../{}/escape.png", outside.file_name().unwrap().to_string_lossy());
        assert!(read_image_asset_impl(&escape_path, &state).is_err());
        cleanup(&root, &outside);
    }
}

fn image_data_uri(path: &Path, bytes: &[u8]) -> Result<String, String> {
    if bytes.len() > 16 * 1024 * 1024 { return Err("Image asset exceeds the 16 MiB runtime resource limit".to_string()); }
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or_default().to_ascii_lowercase();
    let (mime, valid) = match extension.as_str() {
        "png" => ("image/png", bytes.starts_with(b"\x89PNG\r\n\x1a\n")),
        "jpg" | "jpeg" => ("image/jpeg", bytes.starts_with(&[0xff, 0xd8, 0xff])),
        "webp" => ("image/webp", bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP"),
        _ => return Err("Runtime images support PNG, JPEG, and WebP assets only".to_string()),
    };
    if !valid { return Err("Image content does not match its file extension".to_string()); }
    const BASE64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut encoded = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let first = chunk[0] as usize;
        let second = chunk.get(1).copied().unwrap_or_default() as usize;
        let third = chunk.get(2).copied().unwrap_or_default() as usize;
        encoded.push(BASE64[first >> 2] as char);
        encoded.push(BASE64[((first & 3) << 4) | (second >> 4)] as char);
        encoded.push(if chunk.len() > 1 { BASE64[((second & 15) << 2) | (third >> 6)] as char } else { '=' });
        encoded.push(if chunk.len() > 2 { BASE64[third & 63] as char } else { '=' });
    }
    Ok(format!("data:{mime};base64,{encoded}"))
}

fn read_image_asset_impl(raw_path: &str, state: &SelectedProjectRoot) -> Result<String, String> {
    let path = resolve_existing_path(state, raw_path)?;
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    image_data_uri(&path, &bytes)
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
    
    // Create a versioned marker file for a clean project. Existing project data
    // is validated below and is never replaced implicitly.
    let marker_file = project_path.join("project.npt");
    if !marker_file.exists() {
        let initial_config = serde_json::json!({
            "type": "project",
            "name": project_name,
            "version": DATA_VERSION,
            "schemaVersion": PROJECT_SCHEMA_VERSION,
            "scenes": []
        });
        let initial_config = serde_json::to_string_pretty(&initial_config).map_err(|e| e.to_string())?;
        fs::write(&marker_file, initial_config).map_err(|e| e.to_string())?;
    } else {
        let content = fs::read_to_string(&marker_file)
            .map_err(|e| format!("Could not read project.npt: {e}"))?;
        let payload = parse_json_payload(&content, "project")?;
        normalize_project_payload(payload)
            .map_err(|error| format!("Could not open project: {error}"))?;
    }

    set_selected_root(&state, project_path)?;
    
    Ok(true)
}

fn open_existing_project_impl(path: &str, state: &SelectedProjectRoot) -> Result<bool, String> {
    let project_path = fs::canonicalize(path)
        .map_err(|error| format!("Could not open existing project folder: {error}"))?;
    if !project_path.is_dir() {
        return Err("Could not open existing project: selected path is not a folder".to_string());
    }
    let marker_file = project_path.join("project.npt");
    if !marker_file.is_file() {
        return Err(format!(
            "Could not open existing project: '{}' does not contain project.npt",
            project_path.display()
        ));
    }
    let content = fs::read_to_string(&marker_file)
        .map_err(|error| format!("Could not read project.npt: {error}"))?;
    let payload = parse_json_payload(&content, "project")?;
    normalize_project_payload(payload)
        .map_err(|error| format!("Could not open project: {error}"))?;
    set_selected_root(state, project_path)?;
    Ok(true)
}

#[tauri::command]
async fn open_existing_project(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    open_existing_project_impl(&path, state.inner())
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
async fn read_image_asset(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    read_image_asset_impl(&path, state.inner())
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
async fn read_project(
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    read_project_impl(state.inner())
}

fn read_project_impl(state: &SelectedProjectRoot) -> Result<String, String> {
    let path = resolve_existing_path(state, "project.npt")?;
    let content = fs::read_to_string(path).map_err(|e| format!("Could not read project.npt: {e}"))?;
    let payload = normalize_project_payload(parse_json_payload(&content, "project")?)?;
    serde_json::to_string_pretty(&payload).map_err(|e| format!("Could not serialize project payload: {e}"))
}

#[tauri::command]
async fn write_project(
    content: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    write_project_impl(&content, state.inner())
}

fn write_project_impl(content: &str, state: &SelectedProjectRoot) -> Result<bool, String> {
    let payload = normalize_project_payload(parse_json_payload(content, "project")?)?;
    let path = resolve_scoped_path(state, "project.npt", false)?;
    let serialized = serde_json::to_string_pretty(&payload)
        .map_err(|e| format!("Could not serialize project payload: {e}"))?;
    fs::write(path, serialized).map_err(|e| format!("Could not write project.npt: {e}"))?;
    Ok(true)
}

#[tauri::command]
async fn read_scene(
    path: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<String, String> {
    read_scene_impl(&path, state.inner())
}

fn read_scene_impl(path: &str, state: &SelectedProjectRoot) -> Result<String, String> {
    let path_buf = resolve_existing_path(state, path)?;
    let content = fs::read_to_string(path_buf)
        .map_err(|e| format!("Could not read scene '{path}': {e}"))?;
    let payload = normalize_scene_payload(parse_json_payload(&content, "scene")?)?;
    serde_json::to_string_pretty(&payload).map_err(|e| format!("Could not serialize scene payload: {e}"))
}

#[tauri::command]
async fn write_scene(
    path: String,
    content: String,
    state: tauri::State<'_, SelectedProjectRoot>,
) -> Result<bool, String> {
    write_scene_impl(&path, &content, state.inner())
}

fn write_scene_impl(path: &str, content: &str, state: &SelectedProjectRoot) -> Result<bool, String> {
    let payload = normalize_scene_payload(parse_json_payload(content, "scene")?)?;
    let path_buf = resolve_scoped_path(state, path, false)?;
    let serialized = serde_json::to_string_pretty(&payload)
        .map_err(|e| format!("Could not serialize scene payload: {e}"))?;
    fs::write(path_buf, serialized)
        .map_err(|e| format!("Could not write scene '{path}': {e}"))?;
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
        open_existing_project,
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
        read_image_asset,
        write_file,
        read_project,
        write_project,
        read_scene,
        write_scene
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
