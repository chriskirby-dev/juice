class AnimationUtil {
    
    static pointDistance( point1, point2 ){
        
        const deltas = [];
        deltas = [ ( point1.x - point2.x ), ( point1.y - point2.y ) ];
        if( point1.z !== undefined ) deltas.push( point1.z - point2.z ); 

        return Math.hypot( ...deltas );
    }

    static toSeconds(ms){
        return ms/1000;
    }

    static diff( a, b ){
        return a - b;
    }

    static deltaMS( last, now ){
        return ( now - last );
    }

    static delta( last, now ){
        return ( now - last ) / 1000;
    }

    static FPS( delta ){
        return 1/delta;
    }

    static degreesToRadians( degrees ){
        return degrees * (Math.PI / 180);
    }
}

export default AnimationUtil;