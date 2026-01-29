/**
 * Triton Editor - Main Process Entry
 * Electron main process handling window creation, IPC, and file system operations
 */

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileWatcher } from './fileWatcher.js';
import { ProjectIO } from './projectIO.js';
import { setupIpcHandlers } from './ipcHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TritonMain {
    constructor() {
        this.mainWindow = null;
        this.fileWatcher = null;
        this.projectIO = new ProjectIO();
        this.currentProject = null;
    }

    /**
     * Create the main application window
     */
    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1600,
            height: 900,
            minWidth: 1024,
            minHeight: 768,
            backgroundColor: '#1a1a1a',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            },
            title: 'Triton Editor',
            show: true  // Show immediately for debugging
        });

        console.log('Loading renderer HTML...');

        // Load the renderer
        await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        console.log('Renderer loaded successfully');

        // Open DevTools for debugging
        this.mainWindow.webContents.openDevTools();

        // Handle window close
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            if (this.fileWatcher) {
                this.fileWatcher.stop();
            }
        });

        this.setupMenu();
    }

    /**
     * Setup application menu
     */
    setupMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Project',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.sendToRenderer('menu:new-project')
                    },
                    {
                        label: 'Open Project',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.sendToRenderer('menu:open-project')
                    },
                    {
                        label: 'Open Demo Project',
                        click: () => this.openDemoProject()
                    },
                    { type: 'separator' },
                    {
                        label: 'Save',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.sendToRenderer('menu:save')
                    },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    {
                        label: 'Undo',
                        accelerator: 'CmdOrCtrl+Z',
                        click: () => this.sendToRenderer('menu:undo')
                    },
                    {
                        label: 'Redo',
                        accelerator: 'CmdOrCtrl+Y',
                        click: () => this.sendToRenderer('menu:redo')
                    },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Test',
                submenu: [
                    {
                        label: 'Run Tests',
                        accelerator: 'F6',
                        click: () => this.sendToRenderer('menu:run-tests')
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Open Demo Project',
                        click: () => this.openDemoProject()
                    },
                    { type: 'separator' },
                    {
                        label: 'About Triton',
                        click: () => this.sendToRenderer('menu:about')
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    /**
     * Send message to renderer process
     */
    sendToRenderer(channel, data = {}) {
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    /**
     * Open the built-in demo project
     */
    async openDemoProject() {
        const demoPath = path.join(__dirname, '../demo');
        await this.openProject(demoPath);
    }

    /**
     * Open a project at the given path
     */
    async openProject(projectPath) {
        try {
            const project = await this.projectIO.loadProject(projectPath);
            this.currentProject = project;

            // Stop existing watcher
            if (this.fileWatcher) {
                this.fileWatcher.stop();
            }

            // Start watching project folder
            this.fileWatcher = new FileWatcher(projectPath, (event, filePath) => {
                this.sendToRenderer(`file:${event}`, { path: filePath });
            });
            this.fileWatcher.start();

            // Send project data to renderer
            this.sendToRenderer('project:loaded', { project });

            return project;
        } catch (error) {
            console.error('Failed to open project:', error);
            this.sendToRenderer('project:error', { error: error.message });
            return null;
        }
    }
}

// Application instance
const triton = new TritonMain();

// App lifecycle
app.whenReady().then(async () => {
    setupIpcHandlers(triton);
    await triton.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            triton.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

export { TritonMain };
