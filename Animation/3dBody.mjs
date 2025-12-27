/**
 * 3D body and point classes for spatial calculations (stub implementation).
 * Provides basic 3D point and body representations.
 * @module Animation/3dBody
 * @todo Complete implementation of 3D body physics and collision detection
 */

/**
 * Represents a 3D point in space.
 * @class Point
 * @todo Add coordinate properties and methods
 */
class Point {
    
}

/**
 * Represents a 3D body with position and dimensions.
 * @class Body
 * @todo Complete implementation with physics properties
 */
class Body {

    x;
    y;
    w;
    h;

    constructor( point, w=0, h=0 ){
        this.x = point.x;
        this.y = point.y; 
        this.w = w;
        this.h = h;
    
    }
}


class Body3d {

	constructor( point, mass, radius){
		this.x = x;
		this.y = y;
		this.z = z;
		this.mass = mass;
		this.radius = radius;
	}
	
	get position(){
		return { x: this.x, y: this.y, z: this.z };
	}
	
	get_radius(){
		return this.radius;
	}
	
	get_mass(){
		return this.mass;
	}
	
	get_velocity(){
		return this.velocity;
	}
	
	set_velocity(velocity){
		this.velocity = velocity;
	}
	
	set_position(position){
		this.x = position[0];
		this.y = position[1];
		this.z = position[2];
	}
	
	set_radius(radius){
		this.radius = radius;
	}
	
	set_mass(mass){
		this.mass = mass;
	}
	
	get_force(body){

	}

}