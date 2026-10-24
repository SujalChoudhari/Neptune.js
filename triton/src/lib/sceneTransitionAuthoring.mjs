export function isSafeSceneAssetPath(path) {
    if (typeof path !== 'string' || !path || path !== path.trim()) return false;
    if (path.startsWith('/') || path.includes('\\') || path.includes(':')) return false;
    if (path.split('/').some(segment => !segment || segment === '.' || segment === '..')) return false;
    return path.toLowerCase().endsWith('.scene');
}
