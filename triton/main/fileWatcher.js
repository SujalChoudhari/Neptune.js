/**
 * Triton Editor - File Watcher
 * Monitors project folder for file changes using chokidar
 */

import chokidar from 'chokidar';
import path from 'path';

/**
 * Supported asset extensions
 */
const ASSET_EXTENSIONS = {
    image: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    audio: ['.mp3', '.wav', '.ogg'],
    data: ['.json', '.scene', '.prefab', '.dialogue', '.tileset', '.rig'],
    script: ['.js']
};

/**
 * FileWatcher class for monitoring project assets
 */
export class FileWatcher {
    /**
     * @param {string} projectPath - Path to project root
     * @param {Function} callback - Callback for file events (event, path)
     */
    constructor(projectPath, callback) {
        this.projectPath = projectPath;
        this.callback = callback;
        this.watcher = null;
    }

    /**
     * Start watching the project folder
     */
    start() {
        if (this.watcher) {
            this.stop();
        }

        this.watcher = chokidar.watch(this.projectPath, {
            ignored: [
                /(^|[\/\\])\../, // Ignore dotfiles
                /node_modules/,
                /exports/,
                /\.triton$/
            ],
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            }
        });

        this.watcher
            .on('add', (filePath) => this.onFileEvent('added', filePath))
            .on('change', (filePath) => this.onFileEvent('changed', filePath))
            .on('unlink', (filePath) => this.onFileEvent('removed', filePath))
            .on('error', (error) => console.error('FileWatcher error:', error));

        console.log(`FileWatcher started for: ${this.projectPath}`);
    }

    /**
     * Stop watching
     */
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            console.log('FileWatcher stopped');
        }
    }

    /**
     * Handle file event
     * @param {string} event - Event type (added, changed, removed)
     * @param {string} filePath - Absolute file path
     */
    onFileEvent(event, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const type = this.getAssetType(ext);

        if (type) {
            const relativePath = path.relative(this.projectPath, filePath);
            this.callback(event, {
                absolute: filePath,
                relative: relativePath,
                type,
                extension: ext
            });
        }
    }

    /**
     * Get asset type from extension
     * @param {string} ext - File extension
     * @returns {string|null} Asset type or null if not supported
     */
    getAssetType(ext) {
        for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Check if file is a supported asset
     * @param {string} filePath - File path to check
     * @returns {boolean}
     */
    isAsset(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.getAssetType(ext) !== null;
    }
}

export { ASSET_EXTENSIONS };
