/**
 * @class Collision
 * @classdesc A class for collision detection
 * @static
 * 
 */
export class Collision{

    /**
     * @method 
     * @static
     * @description Check if a circle and anonther circle are colliding
     * @param {Circle} circle1 - The first circle
     * @param {Circle} circle2 - The second circle
     * @returns {boolean} - True if the circles are colliding
     * 
     * @example
     * if (!Collision.circleCircle(circle1, circle2)){
     *     //do something
     * }
     */
    static circleCircle(circle1, circle2){
        var dx = circle1.worldPos.x - circle2.worldPos.x;
        var dy = circle1.worldPos.y - circle2.worldPos.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }


    /**
     * @method
     * @static
     * @description Check if a circle and a rectangle are colliding
     * @param {Circle} circle - The circle
     * @param {Rect} rect - The rectangle
     * @returns {boolean} - True if the circle and the rectangle are colliding
     * 
     * @example
     * if (!Collision.circleRect(circle, rect)){
     *    //do something
     * }
     */
    static circleRect(circle, rect){
        var circleDistanceX = Math.abs(circle.worldPos.x - rect.worldPos.x - rect.size.x / 2);
        var circleDistanceY = Math.abs(circle.worldPos.y - rect.worldPos.y - rect.size.y / 2);
        if (circleDistanceX > (rect.size.x / 2 + circle.radius)) {
            return false;
        }
        if (circleDistanceY > (rect.size.y / 2 + circle.radius)) {
            return false;
        }
        if (circleDistanceX <= (rect.size.x / 2)) {
            return true;
        }
        if (circleDistanceY <= (rect.size.y / 2)) {
            return true;
        }
        var cornerDistance_sq = (circleDistanceX - rect.size.x / 2) * (circleDistanceX - rect.size.x / 2) + (circleDistanceY - rect.size.y / 2) * (circleDistanceY - rect.size.y / 2);
        return cornerDistance_sq <= (circle.radius * circle.radius);
    }


    /**
     * @method
     * @static
     * @description Check if a rectangle and another rectangle are colliding
     * @param {Rect} rect1 - The first rectangle
     * @param {Rect} rect2 - The second rectangle
     * @returns {boolean} - True if the rectangles are colliding
     * 
     * @example
     * if (!Collision.rectRect(rect1, rect2)){
     *    //do something
     * }
     */
    static rectRect(rect1, rect2){
        return !(
            rect1.worldPos.x > rect2.worldPos.x + rect2.size.x ||
            rect1.worldPos.x + rect1.size.x < rect2.worldPos.x ||
            rect1.worldPos.y > rect2.worldPos.y + rect2.size.y ||
            rect1.worldPos.y + rect1.size.y < rect2.worldPos.y
        );
    }
}