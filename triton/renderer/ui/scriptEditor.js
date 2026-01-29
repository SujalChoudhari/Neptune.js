/**
 * Triton Editor - Script Editor
 * In-editor code editing with syntax highlighting
 */

/**
 * ScriptEditor - Code editor panel
 */
export class ScriptEditor {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.currentScript = null;
        this.isDirty = false;

        // Simple syntax highlighting patterns
        this.patterns = {
            keyword: /\b(const|let|var|function|class|return|if|else|for|while|switch|case|break|continue|new|this|export|import|from|async|await|try|catch|throw|extends|super)\b/g,
            string: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
            number: /\b\d+\.?\d*\b/g,
            comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            function: /\b([a-zA-Z_]\w*)\s*\(/g,
            builtin: /\b(console|Math|Object|Array|String|Number|Boolean|document|window)\b/g
        };
    }

    /**
     * Initialize the script editor
     */
    init() {
        this.container = document.getElementById('script-editor');
        if (!this.container) return;

        // Subscribe to events
        this.editor.events.on('script:open', (script) => this.open(script));
        this.editor.events.on('script:save', () => this.save());

        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the editor
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="script-editor-wrapper">
                <div class="script-toolbar">
                    <span class="script-name" id="script-name">No script open</span>
                    <div class="script-actions">
                        <button class="script-btn" id="btn-script-save" title="Save (Ctrl+S)" disabled>💾 Save</button>
                        <button class="script-btn" id="btn-script-run" title="Run Script" disabled>▶️ Run</button>
                        <button class="script-btn" id="btn-script-format" title="Format Code" disabled>🔧 Format</button>
                    </div>
                </div>
                <div class="script-content">
                    <div class="line-numbers" id="line-numbers"></div>
                    <textarea class="code-editor" id="code-editor" 
                        spellcheck="false" 
                        placeholder="// Open a script to edit..."
                        disabled></textarea>
                    <div class="syntax-highlight" id="syntax-highlight"></div>
                </div>
                <div class="script-status">
                    <span id="script-status-text">Ready</span>
                    <span id="script-cursor-pos">Ln 1, Col 1</span>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        const codeEditor = this.container.querySelector('#code-editor');
        const saveBtn = this.container.querySelector('#btn-script-save');
        const runBtn = this.container.querySelector('#btn-script-run');
        const formatBtn = this.container.querySelector('#btn-script-format');

        // Code input
        codeEditor?.addEventListener('input', () => {
            this.updateLineNumbers();
            this.updateSyntaxHighlight();
            this.markDirty();
        });

        // Scroll sync
        codeEditor?.addEventListener('scroll', () => {
            const lineNumbers = this.container.querySelector('#line-numbers');
            const syntaxHighlight = this.container.querySelector('#syntax-highlight');
            if (lineNumbers) lineNumbers.scrollTop = codeEditor.scrollTop;
            if (syntaxHighlight) {
                syntaxHighlight.scrollTop = codeEditor.scrollTop;
                syntaxHighlight.scrollLeft = codeEditor.scrollLeft;
            }
        });

        // Cursor position
        codeEditor?.addEventListener('click', () => this.updateCursorPosition());
        codeEditor?.addEventListener('keyup', () => this.updateCursorPosition());

        // Tab handling
        codeEditor?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeEditor.selectionStart;
                const end = codeEditor.selectionEnd;
                codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
                codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
                this.updateSyntaxHighlight();
                this.markDirty();
            }

            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.save();
            }
        });

        // Buttons
        saveBtn?.addEventListener('click', () => this.save());
        runBtn?.addEventListener('click', () => this.run());
        formatBtn?.addEventListener('click', () => this.format());
    }

    /**
     * Open a script file
     */
    open(script) {
        this.currentScript = script;

        const codeEditor = this.container?.querySelector('#code-editor');
        const scriptName = this.container?.querySelector('#script-name');

        if (codeEditor) {
            codeEditor.value = script.content || '';
            codeEditor.disabled = false;
        }

        if (scriptName) {
            scriptName.textContent = script.name || 'Untitled Script';
        }

        // Enable buttons
        this.container?.querySelectorAll('.script-btn').forEach(btn => {
            btn.disabled = false;
        });

        this.isDirty = false;
        this.updateLineNumbers();
        this.updateSyntaxHighlight();
        this.updateStatus('Loaded');
    }

    /**
     * Save current script
     */
    async save() {
        if (!this.currentScript) return;

        const codeEditor = this.container?.querySelector('#code-editor');
        if (!codeEditor) return;

        this.currentScript.content = codeEditor.value;

        try {
            // Emit save event for file system handler
            this.editor.events.emit('script:saved', {
                path: this.currentScript.path,
                content: this.currentScript.content
            });

            this.isDirty = false;
            this.updateScriptName();
            this.updateStatus('Saved');

            this.editor.console.log('info', `Saved: ${this.currentScript.name}`);
        } catch (error) {
            this.editor.console.log('error', `Save failed: ${error.message}`);
        }
    }

    /**
     * Run the script
     */
    async run() {
        if (!this.currentScript) return;

        const codeEditor = this.container?.querySelector('#code-editor');
        if (!codeEditor) return;

        try {
            this.updateStatus('Running...');

            // Basic script execution (sandboxed)
            const code = codeEditor.value;

            // Log to console instead of actual execution for safety
            this.editor.console.log('info', `Running script: ${this.currentScript.name}`);

            // Emit run event
            this.editor.events.emit('script:run', {
                path: this.currentScript.path,
                content: code
            });

            this.updateStatus('Completed');
        } catch (error) {
            this.editor.console.log('error', `Script error: ${error.message}`);
            this.updateStatus('Error');
        }
    }

    /**
     * Format code
     */
    format() {
        const codeEditor = this.container?.querySelector('#code-editor');
        if (!codeEditor) return;

        try {
            // Simple formatting: fix indentation
            const lines = codeEditor.value.split('\n');
            let indent = 0;
            const formatted = lines.map(line => {
                const trimmed = line.trim();

                // Decrease indent for closing braces
                if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                    indent = Math.max(0, indent - 1);
                }

                const formattedLine = '    '.repeat(indent) + trimmed;

                // Increase indent for opening braces
                if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                    indent++;
                }

                return formattedLine;
            });

            codeEditor.value = formatted.join('\n');
            this.updateSyntaxHighlight();
            this.markDirty();
            this.updateStatus('Formatted');
        } catch (error) {
            this.editor.console.log('error', `Format failed: ${error.message}`);
        }
    }

    /**
     * Update line numbers
     */
    updateLineNumbers() {
        const codeEditor = this.container?.querySelector('#code-editor');
        const lineNumbers = this.container?.querySelector('#line-numbers');

        if (!codeEditor || !lineNumbers) return;

        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) =>
            `<span>${i + 1}</span>`
        ).join('');
    }

    /**
     * Update syntax highlighting
     */
    updateSyntaxHighlight() {
        const codeEditor = this.container?.querySelector('#code-editor');
        const syntaxHighlight = this.container?.querySelector('#syntax-highlight');

        if (!codeEditor || !syntaxHighlight) return;

        let html = this.escapeHtml(codeEditor.value);

        // Apply syntax highlighting
        html = html.replace(this.patterns.comment, '<span class="syntax-comment">$&</span>');
        html = html.replace(this.patterns.string, '<span class="syntax-string">$&</span>');
        html = html.replace(this.patterns.keyword, '<span class="syntax-keyword">$1</span>');
        html = html.replace(this.patterns.number, '<span class="syntax-number">$&</span>');
        html = html.replace(this.patterns.builtin, '<span class="syntax-builtin">$1</span>');

        syntaxHighlight.innerHTML = html;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Update cursor position display
     */
    updateCursorPosition() {
        const codeEditor = this.container?.querySelector('#code-editor');
        const cursorPos = this.container?.querySelector('#script-cursor-pos');

        if (!codeEditor || !cursorPos) return;

        const pos = codeEditor.selectionStart;
        const text = codeEditor.value.substring(0, pos);
        const lines = text.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        cursorPos.textContent = `Ln ${line}, Col ${col}`;
    }

    /**
     * Mark as dirty (unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
        this.updateScriptName();
    }

    /**
     * Update script name display
     */
    updateScriptName() {
        const scriptName = this.container?.querySelector('#script-name');
        if (!scriptName || !this.currentScript) return;

        scriptName.textContent = this.currentScript.name + (this.isDirty ? ' *' : '');
    }

    /**
     * Update status
     */
    updateStatus(text) {
        const status = this.container?.querySelector('#script-status-text');
        if (status) status.textContent = text;
    }
}
