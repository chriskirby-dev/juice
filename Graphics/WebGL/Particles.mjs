import { createProgram } from "./Lib/Helper.mjs";
import { random, randomInt, randomBetween, diff } from "../../Util/Math.mjs";
import WebGL from "./Lib/WebGL.mjs";
const { VariableTypes, ShaderTypes } = WebGL;
import { mat4 } from "gl-matrix";
import { Vector2D, Vector3D, Vector4D } from "../../Animation/Properties/Vectors.mjs";
import Particles from "../Particles/Particles.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import TransformFeedback from "./Lib/TransformFeedback.mjs";
import WebGLDebugUtils from "./debug/webgl-debug.js";
function checkGLError(gl, operation) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error(`GL Error during ${operation}: ${error}`);
        return true;
    }
    return false;
}

class GLParticles {
    tiome = 0;
    mouseX = 0;
    mouseY = 0;

    particleSize = "3.0";
    constructor(canvas, maxParticles, emitRate = 10) {
        this.canvas = canvas;

        this.maxParticles = maxParticles;
        this.emitRate = emitRate; // Particles per second
        this.time = 0;
        this.emitterPosition = new Vector3D(0, 0, 0); // Emitter position
        this.force = new Vector3D(0.0, 0.0, 0.0); // Default force (gravity)

        /**
         * State:
         * 0: transitionState
         * 2:
         * 3:
         * 4:
         * 5:
         */
        this.state = new Vector3D(0.0, 0.0, 0.0);

        this.aspectRatio = new AnimationValue(0, { type: "float" });
        this.aspectRatio.value = this.canvas.width / this.canvas.height;

        this.targetPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);
        this.speed = new AnimationValue(0.1);
        this.direction = new Vector3D(0.0, 0.0, 0.0);

        this.repel = new AnimationValue(0, { type: "int" });
        //Dimentions, Speed, Radius
        this.repelParams = new Vector3D(0.5, 0.0, 0.0);
        this.repelPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);

        this.orbit = new AnimationValue(0, { type: "int" });
        //Dimentions, Speed, Radius
        this.orbitParams = new Vector3D(0.5, 0.0, 0.0);
        this.orbitPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);

        this.particles = new Particles(maxParticles, canvas.width, canvas.height);
        this.particles.setProjection("perspective", { fov: 45, near: 0.01, far: 20 });

        this.setupWebGL();

        // Initialize particle buffers
    }

    normalize() {
        return this.webgl.normalize;
    }

    setupWebGL() {
        //Create WebGL context
        this.webgl = new WebGL(this.canvas);
        const { gl, shaders } = this.webgl;
        this.gl = gl;
        //Initialize particles
        this.particles.build();

        //Create Transform Feedback Worker
        this.feedback = new TransformFeedback(this.maxParticles, gl);
        // Enable transform-feedback build diagnostics (must be set before build())
        //this.feedback.debug = true;

        // this.feedback.debugReadback = true;

        const maxVaryings = this.feedback.MAX_VARYINGS;
        console.log("Max Transform Feedback Varyings:", maxVaryings);

        //insert Wraping Function from left to right top to bottom
        this.feedback.addFunction(
            "vec3",
            "wrapPosition",
            ["vec3 position", "float aspectRatio"],
            `
            float xRange = aspectRatio;

            position.x = mod(position.x + aspectRatio, 3.0 ) - aspectRatio;
            position.y = mod(position.y + 1.0, 2.0) - 1.0;
            return position;
        `
        );

        this.feedback.addFunction("float", "easeIn", ["float t"], "return t * t * t * t * t;");
        this.feedback.addFunction(
            "float",
            "easeOut",
            ["float t"],
            "return (1.0 - t) * (1.0 - t) * (1.0 - t) * (1.0 - t) * (1.0 - t);"
        );
        this.feedback.addFunction(
            "float",
            "easeInOut",
            ["float t"],
            "return t < 0.5 ? easeIn(t * 2.0) / 2.0 : easeOut((t - 0.5) * 2.0) / 2.0 + 0.5;"
        );

        this.feedback.addFunction(
            "mat3",
            "rotationMatrix",
            ["vec3 axis", "float angle"],
            `
            float x = axis.x;
            float y = axis.y;
            float z = axis.z;

            float c = cos(angle);
            float s = sin(angle);
            float t = 1.0 - c;

            return mat3(
                t * x * x + c, t * x * y - s * z, t * x * z + s * y,
                t * x * y + s * z, t * y * y + c, t * y * z - s * x,
                t * x * z - s * y, t * y * z + s * x, t * z * z + c
            );

            `
        );

        this.feedback.addFunction(
            "vec4 ",
            "calculateVisibleDimensions",
            ["mat4 projectionMatrix", "float depth"],
            `float near = -1.0 / projectionMatrix[2][2];
            float far = projectionMatrix[2][3] / (1.0 + projectionMatrix[2][2]);

            if (depth < near || depth > far) {
                return vec4(0.0);
            }

            float halfHeight = depth * tan(radians(45.0)); // Replace 45.0 with your FOV
            float aspectRatio = projectionMatrix[0][0] / projectionMatrix[1][1];
            float halfWidth = halfHeight * aspectRatio;

            return vec4(-halfWidth, halfWidth, halfHeight, -halfHeight);`
        );

        this.feedback.addFunction("float", "random", ["float x"], "return fract(sin(x) * 43758.5453123);");

        this.feedback.addFunction(
            "vec3",
            "multiplyMatrixVector",
            ["mat3 matrix", "vec3 vector"],
            "return matrix * vector;"
        );

        //Initialize uniforms describing environment
        //Uniforms stay constant between draw call

        this.uTargetPoint = this.feedback.addUniform("uTargetPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, -2.0, 0.0], {
            debug: true
        });
        //this.uTime = this.feedback.addUniform("uTime", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        //this.uSpeed = this.feedback.addUniform("uSpeed", VariableTypes.FLOAT, this.speed.value);
        //this.uMovement = this.feedback.addUniform("uMovement", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.3]);
        this.uScene = this.feedback.addUniform(
            "uScene",
            VariableTypes.FLOAT_VEC4,
            [
                parseFloat(this.canvas.width), //Width
                parseFloat(this.canvas.height), //Height
                0.0, //Time
                -1.0 //Time Delta
            ],
            { debug: false, clearGLErrors: false }
        );

        // this.uForce = this.feedback.addUniform("uForce", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);
        this.projectionMatrix = this.feedback.addUniform(
            "uProjectionMatrix",
            VariableTypes.FLOAT_MAT4,
            this.particles.projection.matrix
        );
        // this.uRepel = this.feedback.addUniform("uRepel", VariableTypes.BOOL, false);
        // this.uRepelPoint = this.feedback.addUniform("uRepelPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        //  this.uRepelParams = this.feedback.addUniform("uRepelParams", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);

        //Orbit around a point 0 or 1
        this.uOrbit = this.feedback.addUniform("uOrbit", VariableTypes.BOOL, false);
        // this.uOrbitPoint = this.feedback.addUniform("uOrbitPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        // this.uOrbitParams = this.feedback.addUniform("uOrbitParams", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);

        //Initialize Variables describing particles

        //Feedback list of all positions
        this.feedbackPosition = this.feedback.addVariable(
            "aPosition",
            VariableTypes.FLOAT_VEC3,
            this.particles.positions,
            { debug: true }
        );
        /*
        this.feedbackVelocity = this.feedback.addVariable(
            "aVelocity",
            VariableTypes.FLOAT_VEC3,
            this.particles.positions.map((p) => [0.0, 0.0, 0.0]),
            {}
        );
        /*
        this.feedbackDestination = this.feedback.addVariable(
            "aDestination",
            VariableTypes.FLOAT_VEC3,
            this.particles.positions,
            { location: 1 }
        );
    */
        this.feedbackState = this.feedback.addVariable(
            "aState",
            VariableTypes.FLOAT_VEC4,
            new Float32Array(this.particles.maxCount * 4),
            {}
        );
        /*
        this.feedbackTransitionn = this.feedback.addVariable(
            "aTransition",
            VariableTypes.FLOAT_VEC4,
            new Float32Array(this.maxParticles * 4)
        );
*/
        //  this.feedback.addVariable("aVelocity", VariableTypes.FLOAT_VEC3, this.particles.velocities);
        // this.feedback.addVariable("aLife", VariableTypes.FLOAT, this.particles.lifes);

        //Create Transform Feedback Script

        this.feedback.setScript(`
            
            //Get index of current particle
            int index = gl_VertexID;
            float r = random(float(index));

            //Initialize Scene Variables
            float sceneWidth = uScene[0];
            float sceneHeight = uScene[1];
            float aspectRatio = uScene[0]/uScene[1];

            float time = uScene[2];
            float delta = uScene[3];

            float near = -1.0 / uProjectionMatrix[2][2];
            float far = uProjectionMatrix[2][3] / (1.0 + uProjectionMatrix[2][2]);

           // vec3 velocity = aVelocity;
            vec3 position = aPosition;

            float particleState = aState[0];
            float particleAge = aState[1];


            vec4 bounds = calculateVisibleDimensions(uProjectionMatrix, -position.z);
            float boundLeft = bounds[0];
            float boundRight = bounds[1];
            float boundTop = bounds[2];
            float boundBottom = bounds[3];

            

            
            if (uOrbit) {
            
                // Orbit around a target
                vec3 target = vec3(uTargetPoint.x, uTargetPoint.y, uTargetPoint.z);
                float targetRadius = uTargetPoint.w;
                float targetDistance = distance(target, position);
                vec3 targetDirection = normalize(target - position); // Direction to target

                float orbitDistance = targetDistance - targetRadius;
                vec3 orbitEntry = position + targetDirection * orbitDistance;


                vec3 entryDirection = normalize(orbitEntry - position); // Direction to target

                

                float convergenceSpeed = 0.001;

                float convergenceFactor = min(1.0, time * convergenceSpeed); // Smooth interpolation

                vec3 interpolatedPosition = mix(position, orbitEntry, convergenceFactor);

                // Step 2: Orbit once converged
            
                if(convergenceFactor >= 0.98){
                    particleState = 1.0;
                    vec3 axis = cross(entryDirection, vec3(0.0, 1.0, 0.0));
                    axis = normalize(axis);

                    mat3 rotationMat = rotationMatrix(axis, targetRadius);

                    vec3 rotated = multiplyMatrixVector(rotationMat, interpolatedPosition);
                    position.x = rotated.x * targetRadius + target.x;
                    position.y = rotated.y * targetRadius + target.y;                    
                    position.z = rotated.z * targetRadius + target.z;
                }else{
                    particleState = 0.0;
                    position = interpolatedPosition;
                }

                
           
            }else{
                position.x -= 0.001;
            }

            //Wrap around the screen
            if( position.x < boundLeft ) position.x = boundRight;
            if( position.x > boundRight ) position.x = boundLeft;
            if( position.y < boundBottom ) position.y = boundTop;
            if( position.y > boundTop ) position.y = boundBottom;
            if( position.z < -far ) position.z = -near;
            if( position.z > -near ) position.z = -far;


            aPositionOut = position;
            aStateOut = vec4(particleState, particleAge, 0.0, 0.0);

        `);
        /*
        this.feedback.setScript(`
            //Get index of current particle
            int index = gl_VertexID;

            float near = -1.0 / uProjectionMatrix[2][2];
            float far = uProjectionMatrix[2][3] / (1.0 + uProjectionMatrix[2][2]);

            vec3 state = aState;
            float transitionState = state[0];
            float ageState = state[1];
            float randomState = state[2];

            vec3 movementVector = vec3( uMovement.x, uMovement.y, uMovement.z ); //uMovement;
            float movementSpeed = uMovement.w;

            float time = uTime[0];
            float delta = uTime[1];
            float aspectRatio = uScene[0]/uScene[1];
          // vec3 destination = aDestination;

            float speed = movementSpeed;


            vec3 position = aPosition;
            position += uForce;

            vec4 bounds = calculateVisibleDimensions(uProjectionMatrix, -aPosition.z);
            float boundLeft = bounds[0];
            float boundRight = bounds[1];
            float boundTop = bounds[2];
            float boundBottom = bounds[3];


           if(position.x < boundLeft ) position.x = boundRight;
        
           if(position.x > boundRight ) position.x = boundLeft;
    
           if( position.y < boundBottom ) position.y = boundTop;
        
           if( position.y > boundTop) position.y = boundBottom;
    
         if(position.z < -far) position.z = -near;
        
           if(position.z > -near) position.z = -far;


        
       
        if (uOrbit) {
            // Orbit around a target
            vec3 orbitPoint = vec3(uTargetPoint.x, uTargetPoint.y, uTargetPoint.z);
            float orbitRadius = uTargetPoint.w;

            
            // Assign spherical coordinates for unique target position
            float randomTheta = mod(randomState + 0.0, 6.28318); // Azimuthal angle (XY plane)
            float randomPhi = mod(randomState * 1.5 + 0.0 * 0.5, 3.14159);

            // Calculate target orbit position on the sphere
            vec3 targetOrbitPosition = vec3(
                orbitPoint.x + orbitRadius * sin(randomPhi) * cos(randomTheta), // X
                orbitPoint.y + orbitRadius * sin(randomPhi) * sin(randomTheta), // Y
                orbitPoint.z + orbitRadius * cos(randomPhi)                    // Z
            );

           // position = targetOrbitPosition * rotationMatrix(randomTheta,randomTheta,randomTheta);


           // 
           // position.y += 0.01;

           if (transitionState == 0.0) {
    // Attracted to the orbit radius
    vec3 directionToOrbitPoint = targetOrbitPosition - position; // Direction vector
    float distanceToOrbitPoint = length(directionToOrbitPoint); // Distance to center
    vec3 normalizedDirection = normalize(directionToOrbitPoint);

    // Smoothly move toward the orbit radius
    position = mix(position, targetOrbitPosition, speed * delta);

    // If close enough to the radius, transition to state 1
    if (distanceToOrbitPoint < 0.2) {  // Increase the threshold for transition
        transitionState = 1.0; // Transition to alignment state
    }


} else if (transitionState == 1.0) {
    // Fine-tune alignment to the orbit radius
    vec3 directionToOrbitPoint = orbitPoint - position; // Vector to center
    vec3 normalizedDirection = normalize(directionToOrbitPoint);

    // Refine spherical position for smoother entry to orbit
    float refinedTheta = randomState * 6.28318; // Same random angles as state 0
    float refinedPhi = randomState * 3.14159;

    vec3 refinedTargetPosition = vec3(
        orbitPoint.x + orbitRadius * sin(refinedPhi) * cos(refinedTheta),
        orbitPoint.y + orbitRadius * sin(refinedPhi) * sin(refinedTheta),
        orbitPoint.z + orbitRadius * cos(refinedPhi)
    );

    // Interpolate position toward refined target
    position = mix(position, refinedTargetPosition, speed * delta * 0.5);

    // Transition to full orbit when aligned
    if (all(lessThan(abs(position - refinedTargetPosition), vec3(0.05)))) {
        transitionState = 2.0; // Begin orbit
    }

} else if (transitionState == 2.0) {
    // Orbit around the target in 3D
    float orbitSpeed = time * speed;

    // Compute the angles for the current orbit path
    float theta = mod(randomState + orbitSpeed, 6.28318); // Azimuthal angle
    float phi = mod(randomState * 1.5 + orbitSpeed * 0.5, 3.14159); // Polar angle

    // Update position based on spherical coordinates
    position = vec3(
        orbitPoint.x + orbitRadius * sin(phi) * cos(theta), // X
        orbitPoint.y + orbitRadius * sin(phi) * sin(theta), // Y
        orbitPoint.z + orbitRadius * cos(phi)              // Z
    );
}
} else {
    // Reset transition state when orbiting is disabled
    transitionState = 0.0;
}
           // ageState += delta;
            aPositionOut = position;
          //  aDestinationOut = destination;
            aStateOut = vec3(transitionState, ageState, randomState);
            //aAgeOut = age;
        `);
*/
        //Compile and build shaders
        this.feedback.build();

        const { vertex, fragment } = shaders;

        vertex.setPrecision("high", "float");
        //Begin Render Context
        // this.setViewMatrix("perspective");

        this.aState = vertex.addInput(
            "aState",
            VariableTypes.FLOAT_VEC4,
            new Float32Array(this.particles.maxCount * 4)
        );
        this.feedbackState.addChild(this.aState);

        this.aPosition = vertex.addInput("aPosition", VariableTypes.FLOAT_VEC3);
        this.feedbackPosition.addChild(this.aPosition);

        vertex.addOutput("particleStateColor", VariableTypes.FLOAT_VEC3);
        // this.aDestination = vertex.addInput("aDestination", VariableTypes.FLOAT_VEC3);

        this.uProjectionMatrix = vertex.addUniform(
            "uProjectionMatrix",
            VariableTypes.FLOAT_MAT4,
            this.particles.projection.matrix
        );

        vertex.main(`
            int index = gl_VertexID;
            float particleState = aState[0];
            float particleAge = aState[1];

            gl_Position =  uProjectionMatrix * vec4(aPosition, 1.0);
       
            gl_PointSize = ${this.particleSize} / abs(aPosition.z);
        
            if (particleState == 0.0) {
                particleStateColor = vec3(0.0, 1.0, 0.0);  // Green for state 0
            } else if (particleState == 1.0) {
                particleStateColor = vec3(1.0, 1.0, 0.0);  // Yellow for state 1
            } else if (particleState == 2.0) {
                particleStateColor = vec3(0.0, 0.0, 1.0);  // Blue for state 2 (orbiting)
            }else{
                particleStateColor = vec3(1.0, 1.0, 1.0);
            }
        `);
        /*
        vertex.main(`
            float viewDepth = abs(aPosition.z);
           
            gl_Position =  uProjectionMatrix * vec4(aPosition, 1.0);
            gl_PointSize = 7.5 / (viewDepth + 0.1); // Adjust 0.1 as needed
            
            particleStateColor = vec3(1.0, 1.0, 1.0);
        `);
*/
        fragment.setPrecision("high", "float");
        fragment.addOutput("fragColor", VariableTypes.FLOAT_VEC4);
        fragment.addInput("particleStateColor", VariableTypes.FLOAT_VEC3);
        fragment.main(`
            fragColor = vec4(particleStateColor, 1.0);  // Use state color
        `);

        const program = this.webgl.build();
        this.program = program;

        // gl.enable(gl.DEPTH_TEST);
        // this.aDestination.createBuffer();
        //this.initBuffers();
    }

    loadMask(source) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const image = new Image();

        return new Promise((resolve) => {
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;

                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data; // RGBA array
                const mapped = [];
                // Iterate over every pixel
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const index = (y * canvas.width + x) * 4; // Each pixel has 4 values (R, G, B, A)

                        // Check if the pixel is non-transparent (A > 0)
                        if (pixels[index + 3] > 0) {
                            mapped.push({ x, y });
                        }
                    }
                }
                const mask = new Float32Array(mapped.length * 2);
                for (let i = 0; i < mapped.length; i++) {
                    mask[i * 2] = (mapped[i].x / canvas.width) * 2 - 1; // Normalize X to [-1, 1]
                    mask[i * 2 + 1] = 1 - (mapped[i].y / canvas.height) * 2; // Normalize Y to [1, -1]
                }

                resolve(mask);
            };
            image.src = source;
        });
    }

    setValue(name, value) {
        let index;
        if (name.includes("[")) {
            [name, index] = name.split(/[\[\]]/);
            // index = index;
            //test if index is a number or a string number
            if (!isNaN(index)) {
                index = parseInt(index);
            }
        }

        if (!isNaN(value)) {
            value = Number(value);
        }
        if (this[name] === undefined || this[name] === value) return;
        console.log(name + (index ? `[${index}]` : ""), value);
        if (this[name] instanceof AnimationValue) {
            console.log(name, "Instance of AnimationValue");
            this[name].value = value;
            console.log("Is Dirty", this[name].dirty);
        } else if (this[name] instanceof Vector4D) {
            console.log("Instance of Vector4D");
            this[name][index.toString()] = value;
            console.log(this[name].toArray());
        } else {
            if (index === undefined) {
                console.log("index undefined", name, index, value);
                this[name] = value;
            } else {
                console.log("index defined", name, index, value);
                this[name][index.toString()] = value;
            }
        }

        // console.log("Cant Set:", this[name], name, value);
    }

    start() {
        this.time = { current: 0, last: 0, delta: 0 };
        this.update = this.update.bind(this);
        let timeLast = 0,
            timeCurrent,
            timeDelta;
        requestAnimationFrame((time) => {
            //Set Last Time
            if (timeCurrent) timeLast = timeCurrent;
            timeCurrent = time / 1000;
            timeDelta = timeCurrent - timeLast;

            this.time.last = timeLast;
            this.time.current += timeDelta;
            this.time.delta = timeDelta;
            requestAnimationFrame(this.update);
        });
    }

    time = 0;

    update(time) {
        const { gl } = this;
        if (!this.feedback) return;

        this.time.last = this.time.current || 0;
        this.time.current = time / 1000;
        this.time.delta = this.time.current - this.time.last;

        gl.useProgram(this.feedback.program);

        try {
            this.uScene.value = [
                parseFloat(this.canvas.width),
                parseFloat(this.canvas.height),
                parseFloat(this.time.current),
                parseFloat(this.time.delta)
            ];
        } catch (error) {
            console.error("Error updating uScene:", error);
            console.error("uScene object:", this.uScene);
            console.error("uScene type:", typeof this.uScene);
            throw error;
        }

        //this.uTime.value = [this.time, this.time.delta, 0.0, 0.0];

        if (this.state.dirty && (this.uState.value = this.state.value) !== false) {
            this.state.save();
        }

        if (this.speed.dirty && (this.uSpeed.value = this.speed.value) !== false) {
            this.speed.save();
        }

        if (this.direction.dirty && (this.uDirection.value = this.direction.toArray()) !== false) {
            this.direction.save();
        }

        if (this.repel.dirty && (this.uRepel.value = this.repel.value) !== false) {
            this.repel.save();
        }

        if (this.repel.value == 1) {
            if (this.repelPoint.dirty && (this.uTargetPoint.value = this.repelPoint.toArray()) !== false) {
                this.repelPoint.clean();
            }

            if (this.repelParams.dirty && (this.uRepelParams.value = this.repelParams.toArray()) !== false) {
                this.repelParams.clean();
            }
        }

        if (this.orbit.dirty && (this.uOrbit.value = this.orbit.value) !== false) {
            this.orbit.save();
        }

        if (this.orbitPoint.dirty && (this.uTargetPoint.value = this.orbitPoint.toArray())) {
            this.orbitPoint.clean();
        }
        /*
        if (this.orbitParams.dirty && (this.uOrbitParams.value = this.orbitParams.toArray())) {
            this.orbitParams.clean();
        }
*/
        // console.log(this.feedback.uniform("uDeltaTime").download());

        this.feedback.update(this.time.delta);

        gl.flush();

        gl.useProgram(this.program);

        //gl.enable(gl.PROGRAM_POINT_SIZE);

        gl.clearColor(0, 0, 0, 0); // Set clear color to black
        gl.clear(gl.COLOR_BUFFER_BIT); // Clear the screen
        gl.enable(gl.DEPTH_TEST);

        this.feedback.applyDownStreamData();

        //gl.bindBuffer(gl.ARRAY_BUFFER, this.feedbackDestination.buffer.output);

        gl.finish();
        gl.drawArrays(gl.POINTS, 0, this.particles.count);

        requestAnimationFrame(this.update);
    }
}

export default GLParticles;