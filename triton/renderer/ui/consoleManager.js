/**
 * Triton Editor - Console Manager
 * Manages console output for logging and test results
 */

/**
 * Console Manager class
 */
export class ConsoleManager {
    constructor(editor) {
        this.editor = editor;
        this.logs = [];
        this.maxLogs = 500;
        this.filter = 'all';
        this.outputElement = null;
    }

    /**
     * Initialize console manager
     */
    init() {
        this.outputElement = document.getElementById('console-output');

        // Setup clear button
        document.getElementById('console-clear')?.addEventListener('click', () => {
            this.clear();
        });

        // Setup filter
        document.getElementById('console-filter')?.addEventListener('change', (e) => {
            this.setFilter(e.target.value);
        });

        // Intercept console methods
        this.interceptConsole();
    }

    /**
     * Intercept browser console methods
     */
    interceptConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            this.log('info', args.map(a => String(a)).join(' '));
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.log('warn', args.map(a => String(a)).join(' '));
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.log('error', args.map(a => String(a)).join(' '));
            originalError.apply(console, args);
        };
    }

    /**
     * Log a message
     * @param {string} level - Log level (info, warn, error)
     * @param {string} message - Message to log
     * @param {string} source - Optional source identifier
     */
    log(level, message, source = '') {
        const entry = {
            level,
            message,
            source,
            time: new Date()
        };

        this.logs.push(entry);

        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Render if visible
        this.renderLog(entry);
    }

    /**
     * Render a single log entry
     * @param {Object} entry - Log entry
     */
    renderLog(entry) {
        if (!this.outputElement) return;
        if (this.filter !== 'all' && entry.level !== this.filter) return;

        const timeStr = entry.time.toLocaleTimeString();
        const div = document.createElement('div');
        div.className = `console-line ${entry.level}`;
        div.innerHTML = `
            <span class="console-time">[${timeStr}]</span>
            ${entry.source ? `<span class="console-source">[${entry.source}]</span>` : ''}
            <span class="console-message">${this.escapeHtml(entry.message)}</span>
        `;

        this.outputElement.appendChild(div);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    /**
     * Escape HTML in message
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set log filter
     * @param {string} filter - Filter value (all, info, warn, error)
     */
    setFilter(filter) {
        this.filter = filter;
        this.render();
    }

    /**
     * Re-render all logs with current filter
     */
    render() {
        if (!this.outputElement) return;

        this.outputElement.innerHTML = '';
        for (const entry of this.logs) {
            if (this.filter === 'all' || entry.level === this.filter) {
                this.renderLog(entry);
            }
        }
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }

    /**
     * Get logs as array
     * @returns {Array}
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Get log count by level
     * @returns {Object}
     */
    getLogCounts() {
        return {
            info: this.logs.filter(l => l.level === 'info').length,
            warn: this.logs.filter(l => l.level === 'warn').length,
            error: this.logs.filter(l => l.level === 'error').length,
            total: this.logs.length
        };
    }
}
