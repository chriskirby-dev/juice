     /************************/
            /*** Orbit Freefly ***/
            /************************/

                // Calculate the current direction from the target
                vec3 offset = aPosition.xyz - target;
                float distance = length(offset);

                // Ensure the distance stays constant
                if (distance != targetRadius) {
                    offset = normalize(offset) * targetRadius;
                }

                float normalizedIndex = float(index) / 10000.0;

                float scaledTime = time * 0.00001; // Scale time to a smaller range
                
                float speedX = 0.001;  // Speed for rotation around X
                float speedY = 0.001; // Speed for rotation around Y
                float speedZ = 0.001;  // Speed for rotation around Z

                // Rotation angles (smoothly changing over time)
                float angleX = normalizedIndex + scaledTime * speedX; // Rotation around X
                float angleY = normalizedIndex + scaledTime * speedY; // Rotation around Y
                float angleZ = normalizedIndex + scaledTime * speedZ; // Rotation around Z


                // Combine all rotations
                mat3 rotMatrix = rotationMatrix( angleX, angleY, angleZ );

                // Rotate the offset
                vec3 rotatedOffset = rotMatrix * offset;

                // Update position
                position.xyz = target + rotatedOffset;

                //position.xyz += velocity.xyz * delta;