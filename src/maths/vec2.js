export class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(v){
		this.x += v.x;
		this.y += v.y;
	}

	sub(v){
		this.x -= v.x;
		this.y -= v.y;
	}

	mul(v){
		this.x *= v.x;
		this.y *= v.y;
	}

	div(v){
		this.x /= v.x;
		this.y /= v.y;
	}

	negetive(){
		this.x = -this.x;
		this.y = -this.y;
	}

	static zero(){
		return new Vector2(0,0);
	}

	equal(v){
		return this.x == v.x && this.y == v.y;
	}

}