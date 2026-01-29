/**
 * Triton Editor - Preload Script
 * Exposes safe IPC methods to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Project operations
    openProject: (path) => ipcRenderer.invoke('project:open', path),
    createProject: (config) => ipcRenderer.invoke('project:create', config),
    saveProject: () => ipcRenderer.invoke('project:save'),
    openDemo: () => ipcRenderer.invoke('project:open-demo'),

    // Scene operations
    loadScene: (scenePath) => ipcRenderer.invoke('scene:load', scenePath),
    saveScene: (sceneData) => ipcRenderer.invoke('scene:save', sceneData),

    // Asset operations
    getAssets: () => ipcRenderer.invoke('assets:list'),
    watchAssets: (callback) => {
        ipcRenderer.on('file:added', (_, data) => callback('added', data.path));
        ipcRenderer.on('file:changed', (_, data) => callback('changed', data.path));
        ipcRenderer.on('file:removed', (_, data) => callback('removed', data.path));
    },

    // Build operations
    buildProject: (config) => ipcRenderer.invoke('build:start', config),
    onBuildProgress: (callback) => {
        ipcRenderer.on('build:progress', (_, data) => callback(data));
    },

    // Test operations
    runTests: (testFiles) => ipcRenderer.invoke('tests:run', testFiles),
    onTestOutput: (callback) => {
        ipcRenderer.on('tests:output', (_, data) => callback(data));
    },

    // Menu events
    onMenuEvent: (channel, callback) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },

    // Project events
    onProjectLoaded: (callback) => {
        ipcRenderer.on('project:loaded', (_, data) => callback(data.project));
    },
    onProjectError: (callback) => {
        ipcRenderer.on('project:error', (_, data) => callback(data.error));
    },

    // Dialog operations
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),

    // Console logging
    log: (level, message) => ipcRenderer.send('console:log', { level, message })
});
