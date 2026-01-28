import { Body } from "./body.js";
import { Collider } from "./collider.js";
import { Transform } from "../components/transform.js";

/**
 * TileCollision handles collision between entities and tilemaps.
 * @class TileCollision
 */
export class TileCollision {
    /**
     * @param {Tilemap} tilemap - The tilemap to check against.
     */
    constructor(tilemap) {
        this.tilemap = tilemap;
    }

    /**
     * Resolve collision for an entity with Body and Collider.
     * @param {Entity} entity 
     * @param {number} deltaTime 
     */
    resolve(entity, deltaTime) {
        const transform = entity.GetComponent(Transform);
        const body = entity.GetComponent(Body);
        const collider = entity.GetComponent(Collider);

        if (!transform || !body || !collider) return;

        const tw = this.tilemap.tileset.tileWidth * this.tilemap.scale;
        const th = this.tilemap.tileset.tileHeight * this.tilemap.scale;

        // Move X first
        const newX = transform.position.x + body.velocity.x * deltaTime;
        const boundsX = collider.getBounds(newX, transform.position.y);

        // Check horizontal tiles
        const leftTile = Math.floor(boundsX.left / tw);
        const rightTile = Math.floor(boundsX.right / tw);
        const topTile = Math.floor(boundsX.top / th);
        const bottomTile = Math.floor(boundsX.bottom / th);

        let collisionX = false;
        for (let ty = topTile; ty <= bottomTile && !collisionX; ty++) {
            for (let tx = leftTile; tx <= rightTile && !collisionX; tx++) {
                if (this.tilemap.isSolid(tx, ty)) {
                    collisionX = true;
                    if (body.velocity.x > 0) {
                        transform.position.x = tx * tw - collider.width - collider.offsetX;
                    } else if (body.velocity.x < 0) {
                        transform.position.x = (tx + 1) * tw - collider.offsetX;
                    }
                    body.velocity.x = 0;
                }
            }
        }

        if (!collisionX) {
            transform.position.x = newX;
        }

        // Move Y
        const newY = transform.position.y + body.velocity.y * deltaTime;
        const boundsY = collider.getBounds(transform.position.x, newY);

        const leftTile2 = Math.floor(boundsY.left / tw);
        const rightTile2 = Math.floor(boundsY.right / tw);
        const topTile2 = Math.floor(boundsY.top / th);
        const bottomTile2 = Math.floor(boundsY.bottom / th);

        let collisionY = false;
        body.grounded = false;

        for (let ty = topTile2; ty <= bottomTile2 && !collisionY; ty++) {
            for (let tx = leftTile2; tx <= rightTile2 && !collisionY; tx++) {
                if (this.tilemap.isSolid(tx, ty)) {
                    collisionY = true;
                    if (body.velocity.y > 0) {
                        transform.position.y = ty * th - collider.height - collider.offsetY;
                        body.grounded = true;
                    } else if (body.velocity.y < 0) {
                        transform.position.y = (ty + 1) * th - collider.offsetY;
                    }
                    body.velocity.y = 0;
                }
            }
        }

        if (!collisionY) {
            transform.position.y = newY;
        }
    }
}
