// This class is legacy/unused now that GameViewPanel handles the Iframe logic directly.
// Keeping it as a placeholder or utility if needed later.

export class EditorGameRunner {
    static isPlaying = false;

    static async start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        console.log("Starting Game via Iframe (GameViewPanel handled)...");
    }

    static stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        console.log("Stopping Game via Iframe (GameViewPanel handled)...");
    }
}
