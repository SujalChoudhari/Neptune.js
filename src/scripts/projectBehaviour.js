import { Behaviour } from './script.js';
import { Transform } from '../components/transform.js';
import { Shape } from '../rendering/shape.js';
import { Sprite } from '../rendering/sprite.js';
import { Color } from '../rendering/color.js';
import { KeyboardInput } from '../input/keyboardinput.js';
import { SceneManager } from '../core/sceneManager.js';
import { SaveManager } from '../core/saveManager.js';
import { BoxCollider } from '../components/boxCollider.js';
import { Camera } from '../thalassa/camera.js';
import * as Larissa from '../larissa/index.js';
import * as Nereid from '../nereid/index.js';
import { InputActions } from '../input/actions.js';
import { FixedStepper } from '../core/fixedStepper.js';

const api = Object.freeze({ Transform, Shape, Sprite, Color, KeyboardInput, InputActions, FixedStepper, SceneManager, SaveManager, BoxCollider, Camera, Larissa, Nereid });

export function validateProjectModulePath(path) {
    if (typeof path !== 'string' || path !== path.trim() || !path.endsWith('.js') || /[:\\?#%\0]/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) {
        throw new Error('ProjectBehaviour.module must be a project-relative .js path');
    }
    return path;
}

/** A project-local ES module exporting create({ entity, engine, properties }).
 * Modules use the injected engine API; bundle additional dependencies into the module.
 * Loading starts on Play, never during scene parsing or editor authoring.
 */
export class ProjectBehaviour extends Behaviour {
    constructor() {
        super('ProjectBehaviour');
        this._properties = { module: '', settings: {} };
        this.instance = null;
        this.error = null;
        this.disposed = false;
    }

    async loadModule() {
        let url;
        try {
            const path = validateProjectModulePath(this.properties.module);
            const response = await fetch(globalThis.__neptuneProjectResources ? `/${path}` : path);
            if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
            url = URL.createObjectURL(new Blob([await response.text()], { type: 'text/javascript' }));
            const module = await import(/* @vite-ignore */ url);
            if (this.disposed) return;
            if (typeof module.create !== 'function') throw new Error(`${path} must export create(context)`);
            this.instance = module.create({ entity: this.entity, engine: api, properties: this.properties.settings });
            this.instance?.start?.();
        } catch (error) {
            if (!this.disposed) {
                this.error = error;
                try { this.instance?.destroy?.(); } finally { this.instance = null; }
                console.error('PROJECT_BEHAVIOUR_LOAD_FAILED', error);
            }
        } finally {
            if (url) URL.revokeObjectURL(url);
        }
    }

    Update(deltaTime) {
        if (!this.loading) { this.loading = true; void this.loadModule(); }
        this.instance?.update?.(deltaTime);
    }

    destroy() {
        this.disposed = true;
        try { this.instance?.destroy?.(); } finally { this.instance = null; super.destroy(); }
    }
}
