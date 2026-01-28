/**
 * DialogueBox handles text display with typewriter effect.
 * @class DialogueBox
 */
export class DialogueBox {
    constructor() {
        this.lines = [];
        this.currentLine = 0;
        this.displayedText = "";
        this.fullText = "";
        this.charIndex = 0;
        this.typeSpeed = 30; // chars per second
        this.typeTimer = 0;
        this.isTyping = false;
        this.isVisible = false;

        this.speaker = "";
        this.portrait = null;

        this.onLineComplete = null;
        this.onDialogueComplete = null;
    }

    /**
     * Start a dialogue sequence.
     * @param {Array<{speaker: string, text: string, portrait?: string}>} lines 
     */
    start(lines) {
        this.lines = lines;
        this.currentLine = 0;
        this.isVisible = true;
        this._startLine();
    }

    /**
     * Start displaying current line.
     * @private
     */
    _startLine() {
        if (this.currentLine >= this.lines.length) {
            this.isVisible = false;
            if (this.onDialogueComplete) this.onDialogueComplete();
            return;
        }

        const line = this.lines[this.currentLine];
        this.speaker = line.speaker || "";
        this.fullText = line.text || "";
        this.displayedText = "";
        this.charIndex = 0;
        this.isTyping = true;
        this.typeTimer = 0;

        if (line.portrait) {
            this.portrait = new Image();
            this.portrait.src = line.portrait;
        } else {
            this.portrait = null;
        }
    }

    /**
     * Advance to next line or complete current typing.
     */
    advance() {
        if (this.isTyping) {
            // Complete current line instantly
            this.displayedText = this.fullText;
            this.isTyping = false;
            if (this.onLineComplete) this.onLineComplete(this.currentLine);
        } else {
            // Move to next line
            this.currentLine++;
            this._startLine();
        }
    }

    /**
     * Skip entire dialogue.
     */
    skip() {
        this.isVisible = false;
        if (this.onDialogueComplete) this.onDialogueComplete();
    }

    /**
     * Update typewriter effect.
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (!this.isTyping) return;

        this.typeTimer += deltaTime;
        const charsToAdd = Math.floor(this.typeTimer * this.typeSpeed);

        if (charsToAdd > 0) {
            this.typeTimer = 0;
            for (let i = 0; i < charsToAdd && this.charIndex < this.fullText.length; i++) {
                this.displayedText += this.fullText[this.charIndex];
                this.charIndex++;
            }

            if (this.charIndex >= this.fullText.length) {
                this.isTyping = false;
                if (this.onLineComplete) this.onLineComplete(this.currentLine);
            }
        }
    }

    /**
     * Draw the dialogue box.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     */
    draw(ctx, x, y, width, height) {
        if (!this.isVisible) return;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Portrait
        let textX = x + 20;
        if (this.portrait && this.portrait.complete) {
            ctx.drawImage(this.portrait, x + 10, y + 10, 64, 64);
            textX = x + 84;
        }

        // Speaker name
        if (this.speaker) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(this.speaker, textX, y + 24);
        }

        // Text
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        this._wrapText(ctx, this.displayedText, textX, y + 45, width - textX + x - 20, 18);

        // Continue indicator
        if (!this.isTyping) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('▼', x + width - 20, y + height - 10);
        }
    }

    /**
     * Wrap text within width.
     * @private
     */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (const word of words) {
            const testLine = line + word + ' ';
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && line !== '') {
                ctx.fillText(line, x, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}
