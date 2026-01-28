/**
 * Project I/O - Save, Load, Export functionality
 */

export class ProjectIO {
    constructor(editor) {
        this.editor = editor;
    }

    async save() {
        const project = this.editor.project;
        const json = JSON.stringify(project, null, 2);

        try {
            // Use File System Access API if available
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${project.name}.neptune`,
                    types: [{
                        description: 'Neptune Project',
                        accept: { 'application/json': ['.neptune'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                console.log('Project saved!');
            } else {
                // Fallback: download as file
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.name}.neptune`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Save failed:', err);
        }
    }

    async load() {
        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Neptune Project',
                        accept: { 'application/json': ['.neptune'] }
                    }]
                });
                const file = await handle.getFile();
                const json = await file.text();
                this.loadFromJSON(json);
            } else {
                // Fallback: file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.neptune,.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const json = await file.text();
                        this.loadFromJSON(json);
                    }
                };
                input.click();
            }
        } catch (err) {
            console.error('Load failed:', err);
        }
    }

    loadFromJSON(json) {
        try {
            const project = JSON.parse(json);
            this.editor.project = project;
            this.editor.switchMode('scene');
            console.log('Project loaded!');
        } catch (err) {
            console.error('Parse failed:', err);
        }
    }

    async export() {
        const project = this.editor.project;

        // Generate standalone HTML game
        const html = this.generateGameHTML(project);

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.html`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Game exported!');
    }

    generateGameHTML(project) {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${project.name}</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 1px solid #333; }
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script type="module">
        import * as Neptune from './src/neptune.js';
        
        const projectData = ${JSON.stringify(project)};
        
        // Initialize game from project data
        const app = Neptune.application;
        // TODO: Load scenes, characters, enemies from projectData
        
        console.log('Game loaded:', projectData.name);
    </script>
</body>
</html>`;
    }

    // Run tests in iframe
    runTests() {
        const testWindow = window.open('../tests/index.html', 'Neptune Tests', 'width=800,height=600');
        if (!testWindow) {
            alert('Please allow popups to run tests');
        }
    }
}
