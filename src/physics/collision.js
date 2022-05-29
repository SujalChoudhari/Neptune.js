/**
 * @class Collision
 * @classdesc A class for collision detection
 * @static
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
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

    /**
     * @method
     * @static
     * @description Check if a circle is colliding with a convex polygon
     * @param {Circle} circle - The circle
     * @param {Polygon} polygon - The convex polygon    
     * @returns {boolean} - True if the circle and the polygon are colliding. Calculates based on the points of the polygon
     * 
     * @example
     * if (!Collision.circlePolygon(circle, polygon)){
     *   //do something
     * }
     */
    static circlePolygon(circle, polygon){
        var point = new Vector2();
        var closestPoint = new Vector2();
        var closestPointDistance = Number.MAX_VALUE;
        var closestPointIndex = 0;
        var closestPointDistanceSquared = 0;
        var circleDistanceX = 0;
        var circleDistanceY = 0;
        var circleDistanceSquared = 0;
        var circleDistance = 0;
        var polygonPoints = polygon.points;
        var polygonPointsLength = polygonPoints.length;
        var i = 0;
        for (i = 0; i < polygonPointsLength; i++) {
            point.x = polygonPoints[i].x;
            point.y = polygonPoints[i].y;
            circleDistanceX = circle.worldPos.x - point.x;
            circleDistanceY = circle.worldPos.y - point.y;
            circleDistanceSquared = circleDistanceX * circleDistanceX + circleDistanceY * circleDistanceY;
            if (circleDistanceSquared < closestPointDistanceSquared) {
                closestPointDistanceSquared = circleDistanceSquared;
                closestPointIndex = i;
            }
        }
        closestPoint.x = polygonPoints[closestPointIndex].x;
        closestPoint.y = polygonPoints[closestPointIndex].y;
        circleDistanceX = circle.worldPos.x - closestPoint.x;
        circleDistanceY = circle.worldPos.y - closestPoint.y;
        circleDistance = Math.sqrt(circleDistanceX * circleDistanceX + circleDistanceY * circleDistanceY);
        return circleDistance < circle.radius;
    }

    /**
     * @method  
     * @static
     * @description Check if a rectangle and a convex polygon are colliding. Calculates based of the points of the polygon
     * @param {Rect} rect - The rectangle   
     * @param {Polygon} polygon - The convex polygon    
     * @returns {boolean} - True if the rectangle and the polygon are colliding
     * 
     * @example
     * if (!Collision.rectPolygon(rect, polygon)){
     *  //do something
     * }
     */
    static rectPolygon(rect, polygon){
        var rectPoints = rect.points;
        var polygonPoints = polygon.points;
        var rectPointsLength = rectPoints.length;
        var polygonPointsLength = polygonPoints.length;
        var i = 0;
        var j = 0;
        var rectPoint = new Vector2();
        var polygonPoint = new Vector2();
        var rectPointDistance = 0;
        var polygonPointDistance = 0;
        var rectPointDistanceSquared = 0;
        var polygonPointDistanceSquared = 0;
        var rectPointDistanceSquared = 0;
        for (i = 0; i < rectPointsLength; i++) {
            rectPoint.x = rectPoints[i].x;
            rectPoint.y = rectPoints[i].y;
            for (j = 0; j < polygonPointsLength; j++) {
                polygonPoint.x = polygonPoints[j].x;
                polygonPoint.y = polygonPoints[j].y;
                rectPointDistanceX = rectPoint.x - polygonPoint.x;
                rectPointDistanceY = rectPoint.y - polygonPoint.y;
                rectPointDistanceSquared = rectPointDistanceX * rectPointDistanceX + rectPointDistanceY * rectPointDistanceY;
                if (rectPointDistanceSquared < rectPointDistanceSquared) {
                    rectPointDistanceSquared = rectPointDistanceSquared;
                }
            }
            if (rectPointDistanceSquared > 0) {
                return false;
            }
        }
        return true;
    }
}