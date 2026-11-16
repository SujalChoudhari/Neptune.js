import { application, Storage, Color } from '../../src/neptune.js';
const response = await fetch('./project.npt');
if (!response.ok) throw new Error('Could not load Emberfall project.npt');
const project = await response.json();
Storage.DeserializeProject(project);
application.clearColor = Color.FromHex(0x12232c);
await application.loadScene(project.mainScene);
