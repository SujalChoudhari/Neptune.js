import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

test("Game View relays only child-frame text and image requests to selected-project readers", () => {
    const source = fs.readFileSync(path.resolve("triton/src/components/panels/GameViewPanel.tsx"), "utf8");
    assert.match(source, /installProjectResourceBridge\(\)[\s\S]*import\("\$\{neptuneEntryUrl\}"\)/);
    assert.match(source, /event\.source !== iframeRef\.current\?\.contentWindow/);
    assert.match(source, /payload\.kind === 'image' \? 'read_image_asset' : payload\.kind === 'audio' \? 'read_audio_asset' : payload\.kind === 'text' \? 'read_file'/);
    assert.match(source, /type: 'editor:project-resource-response'/);
});
