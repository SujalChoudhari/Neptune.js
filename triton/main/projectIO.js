/**
 * Triton Editor - Project I/O
 * Handles project creation, loading, and saving
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Default project configuration
 */
const DEFAULT_PROJECT = {
    name: 'New Project',
    version: '1.0.0',
    neptuneVersion: '3.3.1',
    resolution: { width: 1920, height: 1080 },
    uiTheme: 'styles/ui-theme.css',
    entryScene: 'scenes/main.scene'
};

/**
 * Default project folder structure
 */
const PROJECT_FOLDERS = [
    'assets',
    'assets/characters',
    'assets/tilesets',
    'assets/audio',
    'assets/audio/music',
    'assets/audio/sfx',
    'assets/fonts',
    'scenes',
    'entities',
    'entities/prefabs',
    'scripts',
    'dialogues',
    'styles',
    'exports'
];

/**
 * ProjectIO class for project file operations
 */
export class ProjectIO {
    constructor() {
        this.currentProject = null;
        this.projectPath = null;
    }

    /**
     * Create a new project
     * @param {string} projectPath - Path for the new project
     * @param {Object} config - Project configuration
     * @returns {Object} Created project data
     */
    async createProject(projectPath, config = {}) {
        // Create project folder
        await fs.mkdir(projectPath, { recursive: true });

        // Create subfolder structure
        for (const folder of PROJECT_FOLDERS) {
            await fs.mkdir(path.join(projectPath, folder), { recursive: true });
        }

        // Create project.triton file
        const projectData = { ...DEFAULT_PROJECT, ...config };
        const projectFile = path.join(projectPath, 'project.triton');
        await fs.writeFile(projectFile, JSON.stringify(projectData, null, 2));

        // Create default scene
        const defaultScene = {
            name: 'main',
            type: 'scene',
            layers: [
                { type: 'background-image', src: null },
                { type: 'parallax', depth: 'back', blur: 2, scrollSpeed: 0.3 },
                { type: 'tilemap', collision: false, data: [] },
                { type: 'main', mode: 'freeform', entities: [] },
                { type: 'tilemap', collision: false, data: [] },
                { type: 'parallax', depth: 'front', blur: 1, scrollSpeed: 1.2 }
            ],
            transitions: [],
            camera: { bounds: { x: 0, y: 0, width: 1920, height: 1080 } }
        };
        await fs.writeFile(
            path.join(projectPath, 'scenes', 'main.scene'),
            JSON.stringify(defaultScene, null, 2)
        );

        // Create default UI theme CSS
        const defaultTheme = `/* Triton UI Theme */
:root {
    --primary-color: #4a90d9;
    --background-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #333333;
}

.triton-ui {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: var(--text-color);
    background: var(--background-color);
}
`;
        await fs.writeFile(path.join(projectPath, 'styles', 'ui-theme.css'), defaultTheme);

        this.projectPath = projectPath;
        this.currentProject = projectData;

        return projectData;
    }

    /**
     * Load an existing project
     * @param {string} projectPath - Path to project folder
     * @returns {Object} Loaded project data
     */
    async loadProject(projectPath) {
        const projectFile = path.join(projectPath, 'project.triton');

        // Check if project file exists
        try {
            await fs.access(projectFile);
        } catch {
            throw new Error(`Not a valid Triton project: ${projectPath}`);
        }

        // Read project file
        const content = await fs.readFile(projectFile, 'utf-8');
        const projectData = JSON.parse(content);

        // Add metadata
        projectData._path = projectPath;
        projectData._projectFile = projectFile;

        this.projectPath = projectPath;
        this.currentProject = projectData;

        return projectData;
    }

    /**
     * Save the current project
     * @returns {boolean} Success status
     */
    async saveProject() {
        if (!this.currentProject || !this.projectPath) {
            throw new Error('No project loaded');
        }

        const projectFile = path.join(this.projectPath, 'project.triton');

        // Remove metadata before saving
        const saveData = { ...this.currentProject };
        delete saveData._path;
        delete saveData._projectFile;

        await fs.writeFile(projectFile, JSON.stringify(saveData, null, 2));
        return true;
    }

    /**
     * Load a scene file
     * @param {string} scenePath - Path to scene file (relative to project)
     * @returns {Object} Scene data
     */
    async loadScene(scenePath) {
        if (!this.projectPath) {
            throw new Error('No project loaded');
        }

        const fullPath = path.join(this.projectPath, scenePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Save a scene file
     * @param {string} scenePath - Path to scene file (relative to project)
     * @param {Object} sceneData - Scene data to save
     */
    async saveScene(scenePath, sceneData) {
        if (!this.projectPath) {
            throw new Error('No project loaded');
        }

        const fullPath = path.join(this.projectPath, scenePath);
        await fs.writeFile(fullPath, JSON.stringify(sceneData, null, 2));
    }

    /**
     * List all assets in the project
     * @returns {Array} List of asset paths
     */
    async listAssets() {
        if (!this.projectPath) {
            return [];
        }

        const assets = [];
        const assetsPath = path.join(this.projectPath, 'assets');

        async function scanDir(dir, basePath) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(basePath, fullPath);

                    if (entry.isDirectory()) {
                        await scanDir(fullPath, basePath);
                    } else {
                        assets.push(relativePath);
                    }
                }
            } catch (e) {
                // Folder doesn't exist yet
            }
        }

        await scanDir(assetsPath, this.projectPath);
        return assets;
    }
}

export { DEFAULT_PROJECT, PROJECT_FOLDERS };
