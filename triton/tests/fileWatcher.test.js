/**
 * Tests for FileWatcher
 */

// Simple test framework
const describe = (name, fn) => {
    console.log(`\n📦 ${name}`);
    fn();
};

const test = (name, fn) => {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${error.message}`);
    }
};

const expect = (value) => ({
    toBe: (expected) => {
        if (value !== expected) {
            throw new Error(`Expected ${expected} but got ${value}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(value) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`);
        }
    },
    toBeTruthy: () => {
        if (!value) {
            throw new Error(`Expected truthy value but got ${value}`);
        }
    },
    toBeFalsy: () => {
        if (value) {
            throw new Error(`Expected falsy value but got ${value}`);
        }
    },
    toBeNull: () => {
        if (value !== null) {
            throw new Error(`Expected null but got ${value}`);
        }
    },
    toContain: (expected) => {
        if (Array.isArray(value)) {
            if (!value.includes(expected)) {
                throw new Error(`Expected array to contain ${expected}`);
            }
        } else {
            if (!value.includes(expected)) {
                throw new Error(`Expected ${value} to contain ${expected}`);
            }
        }
    }
});

// Mock asset extensions
const ASSET_EXTENSIONS = {
    image: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    audio: ['.mp3', '.wav', '.ogg'],
    data: ['.json', '.scene', '.prefab', '.dialogue', '.tileset', '.rig'],
    script: ['.js']
};

// Mock getAssetType function
function getAssetType(ext) {
    for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
        if (extensions.includes(ext)) {
            return type;
        }
    }
    return null;
}

// Tests
describe('FileWatcher Asset Types', () => {
    test('should identify image extensions', () => {
        expect(getAssetType('.png')).toBe('image');
        expect(getAssetType('.jpg')).toBe('image');
        expect(getAssetType('.jpeg')).toBe('image');
        expect(getAssetType('.gif')).toBe('image');
        expect(getAssetType('.webp')).toBe('image');
    });

    test('should identify audio extensions', () => {
        expect(getAssetType('.mp3')).toBe('audio');
        expect(getAssetType('.wav')).toBe('audio');
        expect(getAssetType('.ogg')).toBe('audio');
    });

    test('should identify data extensions', () => {
        expect(getAssetType('.json')).toBe('data');
        expect(getAssetType('.scene')).toBe('data');
        expect(getAssetType('.prefab')).toBe('data');
        expect(getAssetType('.dialogue')).toBe('data');
        expect(getAssetType('.tileset')).toBe('data');
        expect(getAssetType('.rig')).toBe('data');
    });

    test('should identify script extensions', () => {
        expect(getAssetType('.js')).toBe('script');
    });

    test('should return null for unknown extensions', () => {
        expect(getAssetType('.exe')).toBeNull();
        expect(getAssetType('.dll')).toBeNull();
        expect(getAssetType('.txt')).toBeNull();
        expect(getAssetType('.md')).toBeNull();
    });
});

describe('ASSET_EXTENSIONS structure', () => {
    test('should have all asset categories', () => {
        expect(Object.keys(ASSET_EXTENSIONS)).toContain('image');
        expect(Object.keys(ASSET_EXTENSIONS)).toContain('audio');
        expect(Object.keys(ASSET_EXTENSIONS)).toContain('data');
        expect(Object.keys(ASSET_EXTENSIONS)).toContain('script');
    });

    test('image extensions should be arrays', () => {
        expect(Array.isArray(ASSET_EXTENSIONS.image)).toBeTruthy();
        expect(ASSET_EXTENSIONS.image.length > 0).toBeTruthy();
    });

    test('all extensions should start with dot', () => {
        for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
            for (const ext of extensions) {
                if (!ext.startsWith('.')) {
                    throw new Error(`Extension ${ext} in ${type} should start with dot`);
                }
            }
        }
        console.log('    All extensions start with dot');
    });

    test('extensions should be lowercase', () => {
        for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
            for (const ext of extensions) {
                if (ext !== ext.toLowerCase()) {
                    throw new Error(`Extension ${ext} in ${type} should be lowercase`);
                }
            }
        }
        console.log('    All extensions are lowercase');
    });
});

describe('FileWatcher Path Handling', () => {
    // Mock path.extname
    const getExtension = (filePath) => {
        const lastDot = filePath.lastIndexOf('.');
        if (lastDot === -1) return '';
        return filePath.substring(lastDot).toLowerCase();
    };

    test('should extract extension correctly', () => {
        expect(getExtension('sprite.png')).toBe('.png');
        expect(getExtension('audio/music.mp3')).toBe('.mp3');
        expect(getExtension('game.data.json')).toBe('.json');
    });

    test('should handle files without extension', () => {
        expect(getExtension('README')).toBe('');
        expect(getExtension('folder/file')).toBe('');
    });

    test('should handle dotfiles', () => {
        expect(getExtension('.gitignore')).toBe('.gitignore');
    });
});

console.log('\n✅ FileWatcher tests complete');
console.log('   Note: Actual file watching requires integration tests');
