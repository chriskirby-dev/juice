import { createProgram } from "./Lib/Helper.mjs";
import { random, randomInt, randomBetween, diff } from "../../Util/Math.mjs";
import WebGL from "./Lib/WebGL.mjs";
const { VariableTypes, ShaderTypes } = WebGL;
import { mat4 } from "gl-matrix";
import { Vector2D, Vector3D, Vector4D } from "../../Animation/Properties/Vectors.mjs";
import Particles from "../Particles/Particles.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import TransformFeedback from "./Lib/TransformFeedback.mjs";

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

        this.targetPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);
        this.speed = new AnimationValue(0.1);

        this.repel = new AnimationValue(0, { type: "int" });
        //Dimentions, Speed, Radius
        this.repelParams = new Vector3D(0.5, 0.0, 0.0);
        this.repelPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);

        this.orbit = new AnimationValue(0, { type: "int" });
        //Dimentions, Speed, Radius
        this.orbitParams = new Vector3D(0.5, 0.0, 0.0);
        this.orbitPoint = new Vector4D(0.0, 0.0, 0.0, 0.0);

        this.particles = new Particles(maxParticles, canvas.width, canvas.height);

        this.setupWebGL();

        // Initialize particle buffers
    }

    get aspectRatio() {
        return this.canvas.width / this.canvas.height;
    }

    normalize() {
        return this.webgl.normalize;
    }

    setViewMatrix(type) {
        if (type == "perspective") {
            var fieldOfView = (45 * Math.PI) / 180; // Try 45 degrees FOV
            var aspect = this.canvas.width / this.canvas.height;
            var near = -1;
            var far = 5.0; // Increase far plane for testing

            console.log("Aspect Ratio:", aspect); // Debug aspect ratio
            console.log("Field of View:", fieldOfView); // Debug FOV

            var perspectiveMatrix = mat4.create();
            mat4.perspective(perspectiveMatrix, fieldOfView, aspect, near, far);
            this.projectionMatrix = perspectiveMatrix;

            console.log("Perspective Projection Matrix:", this.projectionMatrix); // Debug matrix
        } else {
            const left = -1.0;
            const right = 1.0;
            const bottom = -1.0;
            const top = 1.0;
            const near = -1.0; // Orthographic near
            const far = 1.0; // Orthographic far

            const projectionMatrix = mat4.create();
            mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
            this.projectionMatrix = projectionMatrix;
        }
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

        /*
        this.uniformBuffer = vertex.createUniformBuffer("ParticleProps", {
            positions: {
                type: "vec4",
                size: this.maxParticles * 4,
                bytes: 4 * 4,
            },
            ages: {
                type: "float",
                size: this.maxParticles,
                bytes: 4,
            },
        });
*/
        const maxVaryings = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS);
        console.log("Max Transform Feedback Varyings:", maxVaryings);

        //insert Wraping Function
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

        this.feedback.addFunction("float", "random", ["float x"], "return fract(sin(x) * 43758.5453123);");

        //Initialize uniforms describing environment
        this.uDeltaTime = this.feedback.addUniform("uDeltaTime", VariableTypes.FLOAT, 0.1);
        // this.feedback.addUniform("uAspectRatio", VariableTypes.FLOAT, this.canvas.width / this.canvas.height);

        this.uTargetPoint = this.feedback.addUniform("uTargetPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        this.uSpeed = this.feedback.addUniform("uSpeed", VariableTypes.FLOAT, this.speed.value);

        this.uSceneWidth = this.feedback.addUniform("uSceneWidth", VariableTypes.FLOAT, this.canvas.width);
        this.uSceneHeight = this.feedback.addUniform("uSceneHeight", VariableTypes.FLOAT, this.canvas.height);

        this.uTime = this.feedback.addUniform("uTime", VariableTypes.FLOAT, 0.0);
        this.uForce = this.feedback.addUniform("uForce", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);

        this.uRepel = this.feedback.addUniform("uRepel", VariableTypes.BOOL, false);
        // this.uRepelPoint = this.feedback.addUniform("uRepelPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        //  this.uRepelParams = this.feedback.addUniform("uRepelParams", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);

        this.uOrbit = this.feedback.addUniform("uOrbit", VariableTypes.BOOL, false);
        // this.uOrbitPoint = this.feedback.addUniform("uOrbitPoint", VariableTypes.FLOAT_VEC4, [0.0, 0.0, 0.0, 0.0]);
        // this.uOrbitParams = this.feedback.addUniform("uOrbitParams", VariableTypes.FLOAT_VEC3, [0.0, 0.0, 0.0]);
        //this.uState = this.feedback.addUniform("uState", VariableTypes.INT, 0);

        /*
        this.feedback.addStruct("Particle", [
            "vec3 position",
            "vec3 velocity",
            "vec4 transition",
            "vec3 aDestination",
            "float age",
        ]);
        */
        //Initialize Variables describing particles
        /*  this.feedbackAge = this.feedback.addVariable("aAge", VariableTypes.FLOAT, this.particles.lifes, {
            location: 0,
        });*/
        this.feedbackPosition = this.feedback.addVariable(
            "aPosition",
            VariableTypes.FLOAT_VEC3,
            this.particles.positions,
            { location: 0 }
        );
        this.feedbackDestination = this.feedback.addVariable(
            "aDestination",
            VariableTypes.FLOAT_VEC3,
            this.particles.positions,
            { location: 1 }
        );

        this.feedbackState = this.feedback.addVariable("aState", VariableTypes.FLOAT_VEC3, this.particles.states, {
            location: 2,
        });
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
            int index = gl_VertexID;
            vec3 state = aState;
            float transitionState = state[0];
            float ageState = state[1];

            float time = uTime;
            float delta = uDeltaTime;
            float aspectRatio = uSceneWidth / uSceneHeight;
            vec3 position = aPosition;
            vec3 destination = aDestination;
         //   float age = aAge;
         //   age += delta;
            float speed = uSpeed;

            position += uForce;

           
            position = wrapPosition( position, aspectRatio );


        
       
            if(uOrbit){



                vec3 orbitPoint = vec3(uTargetPoint.x, uTargetPoint.y, uTargetPoint.z);
                float orbitRadius = uTargetPoint.w;
                
                if(transitionState == 0.0){
                    vec3 orbitPoint = vec3(uTargetPoint.x, uTargetPoint.y, uTargetPoint.z);
                    float orbitRadius = uTargetPoint.w;

                    vec3 directionToOrbitPoint = orbitPoint - position; // Direction towards the orbit point
                    float distanceToOrbitPoint = length(directionToOrbitPoint); // Distance to the orbit point

                    vec3 normalizedDirection = normalize(directionToOrbitPoint);
                    float currentAngle = atan(position.y - orbitPoint.y, position.x - orbitPoint.x);
                    vec3 targetOrbitPosition = vec3(
                        orbitPoint.x + cos(currentAngle) * orbitRadius,
                        orbitPoint.y + sin(currentAngle) * orbitRadius,
                        position.z // You can also consider a circular orbit in 3D if needed
                    );

                    destination = targetOrbitPosition;
                    position = mix(position, destination, speed * delta);
                    transitionState = 1.0;
                }else if(transitionState == 1.0 ){

                     position = mix(position, destination, speed * delta);


                  //  transitionState = 2.0;
                }else if(transitionState == 2.0 ){

                     position = mix(position, destination, speed * delta);

                     float angle = speed * uTime;
                    float x = orbitRadius * cos(angle);
                    float y = 0.0;  // Assume orbiting on the XY plane, you can adjust the axis of rotation
                    float z = orbitRadius * sin(angle);

                    position = orbitPoint + vec3(x, y, z);

                }
                
        

            }

            if(uRepel){
                vec3 repelPoint = vec3(uTargetPoint.x, uTargetPoint.y, uTargetPoint.z);
                float repelRadius = uTargetPoint.w;
            }
            ageState += delta;

            aPositionOut = position;
            aDestinationOut = destination;
            aStateOut = vec3(transitionState, ageState, 0.0);
            //aAgeOut = age;
        `);
        /*
        this.feedback.setScript(`
            float aspectRatio = uSceneWidth / uSceneHeight;
            vec3 center = vec3(0.0, 0.0, 0.0);
            // Index of the current particle
            int index = gl_VertexID;
            float time = uTime + uDelta;
            // Compute particle's current life
            float life = time / aLife;

            vec3 truePosition = wrapPosition( vec3(aPosition.x, aPosition.y, aPosition.z), aspectRatio );
            
            // Update position based on time and velocity
            vec3 position = truePosition + aVelocity * uTime;

            // Apply external force (e.g., gravity or wind)
            position += uForce * uTime;

            if(uMask){
            
            
            }

            if(uOrbit){

                float orbitDims = uOrbitParams.x;
                float oRadius = uOrbitParams.y;
    
            float uOrbitSpeed = 0.01;
                vec3 directionToOrbitPoint = uOrbitPoint - position; // Direction towards the orbit point
                float distanceToOrbitPoint = length(directionToOrbitPoint); // Distance to the orbit point

                // Normalize direction
                vec3 normalizedDirection = normalize(directionToOrbitPoint);

                // Calculate the current angle relative to the orbit point in the x-y plane
                float currentAngle = atan(position.y - uOrbitPoint.y, position.x - uOrbitPoint.x);

                // Calculate the target position on the orbit at the defined radius
                vec3 targetOrbitPosition = vec3(
                    uOrbitPoint.x + cos(currentAngle) * oRadius,
                    uOrbitPoint.y + sin(currentAngle) * oRadius,
                    position.z // You can also consider a circular orbit in 3D if needed
                );
                
                 // Smoothly transition to the orbit position
                position = mix(position, targetOrbitPosition, uTransitionSpeed * uTime);

                // Apply the orbital rotation when close to the orbit radius
                if (distanceToOrbitPoint <= oRadius) {
                    float angle = uOrbitSpeed * uTime; // Angle of rotation based on speed
                    float cosAngle = cos(angle);
                    float sinAngle = sin(angle);

                    // Update the position based on the circular motion
                    position.x = uOrbitPoint.x + cos(currentAngle + angle) * oRadius;
                    position.y = uOrbitPoint.y + sin(currentAngle + angle) * oRadius;
                }
                /
                //float attractionStrength = 0.1; // Adjust this value as needed
                //position += directionToOrbitPoint * attractionStrength * uTime;

                
                vec3 oPosition = position;
                vec3 oPoint = uOrbitPoint;
                float uOrbitSpeed = 0.01;

                if(uOrbitParams.x == 2.0){
                    oPosition.z = 0.0;
                    oPoint.z = 0.0;
                }

                vec3 orbitDir = normalize(oPosition - oPoint);
                float dist = distance(oPosition, oPoint);

                if (distanceToOrbitPoint < oRadius) {
                    // Calculate the angle of rotation around the orbit point
                    float angle = uOrbitSpeed * uTime; // The angle to rotate each frame
                    float cosAngle = cos(angle);
                    float sinAngle = sin(angle);

                    // Calculate the new position around the orbit point
                    position.x = uOrbitPoint.x + cos(angle) * oRadius;
                    position.y = uOrbitPoint.y + sin(angle) * oRadius;
                    position.z = truePosition.z; // Keep the z position the same, or adjust if needed
                } else {
                    // If the particle moves beyond the orbit radius, stop moving towards the point
                    position = position - directionToOrbitPoint * (distanceToOrbitPoint - oRadius);
                }
                    
            }

           if(uRepel){
                //Get Dimention
                float repelDims = uRepelParams.x;
                float rRadius = uRepelParams.y;
                vec3 rPosition = position;
                vec3 rPoint = uRepelPoint;

                if(uRepelParams.x == 2.0){
                    rPosition.z = 0.0;
                    rPoint.z = 0.0;
                }

                vec3 repelDir = normalize(rPosition - rPoint);
                float dist = distance(rPosition, rPoint);

        
                if (dist < rRadius) {
                    //Particle is inside the repel radius
                    position = rPoint + repelDir * rRadius;
                }
           }

            // Clamp the particle's life to 0 and 1

            // Pass the updated position to the next stage
            gl_Position = vec4(position.x/aspectRatio, position.y, position.z, 1.0);

            // Send the updated life value to the fragment shader for fading
            vLife = 1.0;

           // fragColor = vec4(normalize(aVelocity), 1.0);
            fragColor = vec4((position + 1.0) / 2.0, 1.0);

            gl_PointSize = 2.0;
        `);
        */

        //Compile and build shaders
        this.feedback.build();

        const { vertex, fragment } = shaders;

        vertex.setPrecision("high", "float");
        //Begin Render Context
        this.setViewMatrix("ortho");

        this.aPosition = vertex.addInput("aPosition", VariableTypes.FLOAT_VEC3);
        // this.aDestination = vertex.addInput("aDestination", VariableTypes.FLOAT_VEC3);

        this.uProjectionMatrix = vertex.addUniform(
            "uProjectionMatrix",
            VariableTypes.FLOAT_MAT4,
            this.projectionMatrix
        );

        vertex.main(`
            gl_Position =  uProjectionMatrix * vec4(aPosition, 1.0);
            gl_PointSize = ${this.particleSize};
        `);

        fragment.setPrecision("high", "float");
        fragment.addOutput("fragColor", VariableTypes.FLOAT_VEC4);

        fragment.main(`
            fragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
        if (this[name] === undefined) return;
        console.log(name, index, value);
        if (this[name] instanceof AnimationValue) {
            console.log("Instance of AnimationValue");
            this[name].value = value;
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
        this.update = this.update.bind(this);
        requestAnimationFrame((time) => {
            this.lastTime = time / 1000;
            requestAnimationFrame(this.update);
        });
    }

    time = 0;

    update(time) {
        time = time / 1000;
        const { gl } = this;
        if (!this.feedback) return;

        gl.useProgram(this.feedback.program);

        const timeDelta = time - this.lastTime;
        this.lastTime = time;
        this.time += timeDelta;

        this.uDeltaTime.value = timeDelta;
        this.uTime.value = this.time;

        if (this.state.dirty && (this.uState.value = this.state.value)) {
            this.state.save();
        }

        if (this.speed.dirty && (this.uSpeed.value = this.speed.value)) {
            this.speed.save();
        }

        if (this.repel.dirty && (this.uRepel.value = this.repel.value)) {
            this.repel.save();
        }

        if (this.repel.value == 1) {
            if (this.repelPoint.dirty && (this.uTargetPoint.value = this.repelPoint.toArray())) {
                this.repelPoint.clean();
            }

            if (this.repelParams.dirty && (this.uRepelParams.value = this.repelParams.toArray())) {
                this.repelParams.clean();
            }
        }

        if (this.orbit.dirty && (this.uOrbit.value = this.orbit.value)) {
            this.orbit.save();
        }

        if (this.orbitPoint.dirty && (this.uTargetPoint.value = this.orbitPoint.toArray())) {
            this.orbitPoint.clean();
        }

        if (this.orbitParams.dirty && (this.uOrbitParams.value = this.orbitParams.toArray())) {
            this.orbitParams.clean();
        }

        // console.log(this.feedback.uniform("uDeltaTime").download());

        this.feedback.update(timeDelta);

        gl.flush();

        gl.useProgram(this.program);

        gl.clearColor(0, 0, 0, 0); // Set clear color to black
        gl.clear(gl.COLOR_BUFFER_BIT); // Clear the screen
        gl.enable(gl.DEPTH_TEST);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.feedbackPosition.buffer.output);

        this.feedback.var("aPosition").download();

        gl.vertexAttribPointer(this.aPosition.location, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.aPosition.location); // Enable the attribute

        gl.bindBuffer(gl.ARRAY_BUFFER, this.feedbackDestination.buffer.output);

        gl.finish();
        gl.drawArrays(gl.POINTS, 0, this.particles.count);

        requestAnimationFrame(this.update);
    }
}

export default GLParticles;
