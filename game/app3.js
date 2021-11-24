

// attributes are inputs/parameters
// varying are outputs/returns
let vs = `
precision mediump float; 

//input
attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec4 vertColor;

//output
varying vec2 fragTexCoord;

//global constants
uniform mat4 mWorld; //World space
uniform mat4 mView;  //Camera view 
uniform mat4 mProj;  //points?

void main() {
    fragTexCoord = vertTexCoord;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}
`;

let fs = `


precision mediump float;

//output
varying vec2 fragTexCoord;

uniform sampler2D sampler;


void main(){
    gl_FragColor = texture2D(sampler, fragTexCoord);
}
`;


function main() {

    // 
    //  Setting up everything 
    // 
    let canvas = document.getElementById("glCanvas");
    let gl = canvas.getContext('webgl');
    if (!gl) {
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        console.log('browser does not support webgl');
    }

    gl.clearColor(0.75,  0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);


    let program = initShaderProgram(gl, vs, fs);

    const programInfo = {
        program: program,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(program, 'vertPosition'),
          vertTexCoord: gl.getAttribLocation(program, 'vertTexCoord'),
        },
        uniformLocations: {
            modelWorldMatrix: gl.getUniformLocation(program, 'mWorld'),
            modelProjMatrix: gl.getUniformLocation(program, 'mProj'),
            modelViewMatrix: gl.getUniformLocation(program, 'mView'),
        },
    };
    
    let buffers = initBuffers(gl);

    function render(){
        draw(gl, programInfo, buffers);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    
};

function draw(gl, programInfo, buffers){


    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]); //eye: position of view, center: point viewer is looking at, up: vec3 pointing up
    mat4.perspective(projMatrix, glMatrix.toRadian(45), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 1000.0);





    

    {
        const numComponents = 3;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 0; // size of an individual vertex
        const offset = 0; // offset from the beginning of a single vertex to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }


    {
        const numComponents = 2;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex
        const offset = 3 * Float32Array.BYTES_PER_ELEMENT; // offset from the beginning of a single vertex to this attribute
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertTexCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertTexCoord);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);


    let boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
        gl.UNSIGNED_BYTE,
        document.getElementById('crate-image'),
        );
    gl.bindTexture(gl.TEXTURE_2D, null);


    gl.uniformMatrix4fv(programInfo.uniformLocations.modelWorldMatrix, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, gl.FALSE, projMatrix);
    



    let xRot = new Float32Array(16);
    let yRot = new Float32Array(16);
    let identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);

    // Mouse event listener
    let angle = 0; 
    let drag = false;
    let click = false; 
    let mouseDownX = 1;
    let mouseDownY = 1; 

    // canvas.add... for clicking on canvas only
    document.addEventListener('mousedown', (event) => {
        click = true; 
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    });

    let mouseUpX = 1;
    let mouseUpY = 1; 
    document.addEventListener('mousemove', (event) => {
        if (!click) return;
        drag = true
        mouseUpX = event.clientX;
        mouseUpY = event.clientY;
    }
    );
    
    document.addEventListener('mouseup', () => 
    {
        click = false; 
        if (drag){
            drag = false; 
        }
    });

    // zoom in and out 
    let zoom = -8;
    document.addEventListener('wheel', (event) => {
        let scale = event.deltaY * -0.01;
        if (zoom + scale >= -3) scale = 0;
        if (zoom + scale <= -20) scale = 0;
        zoom += scale;
    });



    // recreate the matrices for zoom 
    mat4.lookAt(viewMatrix, [0, 0, zoom], [0, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelWorldMatrix, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelProjMatrix, gl.FALSE, projMatrix);

    // rotate the object  //one full rotation every 6 seconds
    // finds x rotation 

    if (drag) {
        angle = getAngle(mouseDownX, mouseDownY, mouseUpX, mouseUpY);
        mat4.rotate(xRot, identityMatrix, angle.x / 4, [0, 1, 0]);
        // finds y rotation
        mat4.rotate(yRot, identityMatrix, angle.y / 16, [1, 0, 0]);
        //multiplies them together to create the new look
        mat4.mul(worldMatrix, xRot, yRot);
    } 

    gl.uniformMatrix4fv(programInfo.uniformLocations.modelWorldMatrix, gl.FALSE, worldMatrix);


    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.activeTexture(gl.TEXTURE0);
    
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

}


function getAngle(x1, y1, x2, y2){
    y1 = -y1; 
    y2 = -y2;

    var distY = y2-y1; //opposite
    var distX = x2-x1; //adjacent



    if (distX == 0) distX = 0.01;
    if (distY == 0) distY = 0.01;
    angles = {
        x: distX/100,
        y: distY/10
    }
    return angles //return angle in degrees
    

}





Math.degrees = function(radians) {
    return radians*(180/Math.PI);
}



function initShaderProgram(gl, vsSource, fsSource){
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;

}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
  
    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
}


function initBuffers(gl) {

    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square.

    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
      
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
      
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
      
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
      
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
      
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ];


    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER,
                    new Float32Array(positions),
                    gl.STATIC_DRAW);

    const faceColors = [
        [1.0,  1.0,  1.0,  1.0],    // Front face: white
        [1.0,  0.0,  0.0,  1.0],    // Back face: red
        [0.0,  1.0,  0.0,  1.0],    // Top face: green
        [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
        [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
        [1.0,  0.0,  1.0,  1.0],    // Left face: purple
        ];

    var colors = [];

    for (var j = 0; j < faceColors.length; ++j){
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
  


	let texIndices = 
	[ // U, V
        // Top
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        // Left
        0, 0,
        1, 0,
        1, 1,
        0, 1,

        // Right
        1, 1,
        0, 1,
        0, 0,
        1, 0,

        // Front
        1, 1,
        1, 0,
        0, 0,
        0, 1,

        // Back
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        // Bottom
        1, 1,
        1, 0,
        0, 0,
        0, 1,
	];

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(texIndices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        tex: texBuffer,
    };
}





