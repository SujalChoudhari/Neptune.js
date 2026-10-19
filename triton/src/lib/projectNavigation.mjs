export function getSceneNavigationPath(node) {
    if (!node || typeof node.id !== "string" || typeof node.name !== "string" || node.type === "folder") {
        return null;
    }

    return /\.(?:scene|scn)$/i.test(node.name) ? node.id : null;
}
