/**
 * Triton Editor - IPC Handlers
 * Main process IPC handler setup
 */

import { ipcMain, dialog } from 'electron';
import path from 'path';

/**
 * Setup all IPC handlers
 * @param {TritonMain} triton - Main application instance
 */
export function setupIpcHandlers(triton) {
    // Project operations
    ipcMain.handle('project:open', async (event, projectPath) => {
        if (!projectPath) {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: 'Open Triton Project'
            });
            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }
            projectPath = result.filePaths[0];
        }
        return await triton.openProject(projectPath);
    });

    ipcMain.handle('project:open-demo', async () => {
        return await triton.openDemoProject();
    });

    ipcMain.handle('project:create', async (event, config) => {
        const result = await dialog.showSaveDialog({
            title: 'Create New Project',
            buttonLabel: 'Create Project'
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        // Create the project
        const project = await triton.projectIO.createProject(result.filePath, config);
        if (project) {
            // Open the newly created project
            await triton.openProject(result.filePath);
        }
        return project;
    });

    ipcMain.handle('project:save', async () => {
        return await triton.projectIO.saveProject();
    });

    // Scene operations
    ipcMain.handle('scene:load', async (event, scenePath) => {
        return await triton.projectIO.loadScene(scenePath);
    });

    ipcMain.handle('scene:save', async (event, { path: scenePath, data }) => {
        return await triton.projectIO.saveScene(scenePath, data);
    });

    // Asset operations
    ipcMain.handle('assets:list', async () => {
        return await triton.projectIO.listAssets();
    });

    // Dialog operations
    ipcMain.handle('dialog:open', async (event, options) => {
        return await dialog.showOpenDialog(options);
    });

    ipcMain.handle('dialog:save', async (event, options) => {
        return await dialog.showSaveDialog(options);
    });

    // Build operations
    ipcMain.handle('build:start', async (event, config) => {
        // TODO: Implement build system
        triton.sendToRenderer('build:progress', { percent: 0, message: 'Starting build...' });
        // Placeholder for now
        triton.sendToRenderer('build:progress', { percent: 100, message: 'Build complete!' });
        return { success: true, outputPath: '' };
    });

    // Test operations
    ipcMain.handle('tests:run', async (event, testFiles) => {
        // TODO: Implement test runner
        triton.sendToRenderer('tests:output', {
            level: 'info',
            message: 'Test runner not yet implemented'
        });
        return { success: true };
    });

    // Console logging from renderer
    ipcMain.on('console:log', (event, { level, message }) => {
        console[level](`[Renderer] ${message}`);
    });
}
