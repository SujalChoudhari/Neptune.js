export interface SceneNavigationNode {
    id?: string;
    name?: string;
    type?: string;
}

export function getSceneNavigationPath(node: SceneNavigationNode | null | undefined): string | null;
