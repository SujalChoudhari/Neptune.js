# Editor extension example

This opt-in editor extension adds BoxCollider-specific Inspector metadata, a
context action, and a Scene View area tool. It reads and edits the existing
`BoxCollider.size` component data. The extension's resize tool opens one scene
edit transaction at drag start, sends size updates through the editor command
bridge, then commits or cancels that transaction. Saving and reopening use the
ordinary scene file.

Add the shown `editorExtensions` v1 metadata to a project file to opt in. The
host reads the listed project-relative `.mjs` file, imports it, then passes the
default export to the versioned editor extension API. Project scripts are trusted
code. The current loader expects single-file modules with no relative or bare
module imports.

Supported UI preview data is a separate `scene.ui` v1 JSON object rendered by
the same DOM helper in Game View and Scene View. It supports safe `panel`,
`text`, and inert preview `button` records with pixel dimensions, edge/center
anchors, stacking, visibility, colors, and text. It does not execute HTML, CSS,
gameplay behaviors, or Canvas UI components. In Scene View, input capture is
off by default and must be enabled explicitly.

Extension drawings, registrations, and overlay objects live in an editor-owned
host registry. They are not entities and are not included in runtime scenes,
physics, project saves, gameplay saves, or exports. Scene changes dispose and
reactivate enabled tools; project changes dispose all tools and require the
new project's opt-in list to be loaded.
