
export default class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        
    }
    sub(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    }
    mulInt(int){
        this.x *= int;
        this.y *= int;
        return this
    }
    mul(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        return this
    }
    divInt(int){
        this.x /= int;
        this.y /= int;
    }
    div(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalise() {
        let mag = this.mag();
        this.x /= mag;
        this.y /= mag;
    }
    limit(max){
        if(this.mag() > max){
            this.normalise();
            this.mulInt(max);
        }
    }
    copy(){
        return new Vector2(this.x, this.y);
    }
    rotate(degrees){
        let rad = degrees * Math.PI / 180;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);
        let x = this.x;
        let y = this.y;
        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;
    }

    
    static add(vec1, vec2) {
        return new Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
    }

    static sub(vec1, vec2) {
        return new Vector2(vec1.x - vec2.x, vec1.y - vec2.y);
    }

    static mul(vec1, vec2) {
        return new Vector2(vec1.x * vec2.x, vec1.y * vec2.y);
    }

    static div(vec1, vec2) {
        return new Vector2(vec1.x / vec2.x, vec1.y / vec2.y);
    }

    static mag(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    }

    static normalise(vec) {
        let mag = this.mag(vec);
        return new Vector2(vec.x / mag, vec.y / mag);
    }

    static dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }

    static cross(vec1, vec2) {
        return vec1.x * vec2.y - vec1.y * vec2.x;
    }

    static angle(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }

    static project(vec1, vec2) {
        let mag = this.mag(vec2);
        return new Vector2(vec2.x / mag, vec2.y / mag);
    }

    static rotate(vec, angle) {
        let x = vec.x * Math.cos(angle) - vec.y * Math.sin(angle);
        let y = vec.x * Math.sin(angle) + vec.y * Math.cos(angle);
        return new Vector2(x, y);
    }

    static distance(vec1, vec2) {
        return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
    }

    static lerp(vec1, vec2, t) {
        return new Vector2(vec1.x + (vec2.x - vec1.x) * t, vec1.y + (vec2.y - vec1.y) * t);
    }

    static angleBetween(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }

    static random(){
        return new Vector2(Math.random(),Math.random());
    }

    static randomUnit(){
        return this.random().normalise();
    }

    static randomRange(min, max){
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    }


}