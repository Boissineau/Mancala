

// attributes are inputs/parameters
// varying are outputs/returns
let vs = `
precision mediump float; 

//input
attribute vec3 vertPosition;
attribute vec2 vertTexCoord;


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


    // shader stuff
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vs);
    gl.shaderSource(fragmentShader, fs);


    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('ERROR compiling vertex shader', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('ERROR compiling fragment shader', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.log('ERROR linking program', gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program)
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
        console.log('ERROR validating progmra', gl.getProgramInfoLog(program));
        return;
    }

    // 
    //  Create buffer
    // 

	let boxVertices = 
	[ // X, Y, Z           U, V
		// Top
		-1.0, 1.0, -1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,
		1.0, 1.0, 1.0,     1, 1,
		1.0, 1.0, -1.0,    1, 0,

		// Left
		-1.0, 1.0, 1.0,    0, 0,
		-1.0, -1.0, 1.0,   1, 0,
		-1.0, -1.0, -1.0,  1, 1,
		-1.0, 1.0, -1.0,   0, 1,

		// Right
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,   0, 1,
		1.0, -1.0, -1.0,  0, 0,
		1.0, 1.0, -1.0,   1, 0,

		// Front
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,    1, 0,
		-1.0, -1.0, 1.0,    0, 0,
		-1.0, 1.0, 1.0,    0, 1,

		// Back
		1.0, 1.0, -1.0,    0, 0,
		1.0, -1.0, -1.0,    0, 1,
		-1.0, -1.0, -1.0,    1, 1,
		-1.0, 1.0, -1.0,    1, 0,

		// Bottom
		-1.0, -1.0, -1.0,   1, 1,
		-1.0, -1.0, 1.0,    1, 0,
		1.0, -1.0, 1.0,     0, 0,
		1.0, -1.0, -1.0,    0, 1,
	];

	let boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];


    let boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    let boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    {
        const numComponents = 3;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex
        const offset = 0; // offset from the beginning of a single vertex to this attribute
        let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(positionAttribLocation);
    }

    {
        const numComponents = 2;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex
        const offset = 3 * Float32Array.BYTES_PER_ELEMENT; // offset from the beginning of a single vertex to this attribute
        let texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
        gl.vertexAttribPointer(
            texCoordAttribLocation,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(texCoordAttribLocation);
    }


    // 
    // Create texture
    //
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

    //
    // tell OpenGL state machine which program should be active
    //
    gl.useProgram(program); 

    let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    let matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');


    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);




    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]); //eye: position of view, center: point viewer is looking at, up: vec3 pointing up
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    // 
    // Main render loop
    // 
    
    let xRot = new Float32Array(16);
    let yRot = new Float32Array(16);
    

    let identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);

    let angle = 0; 

    // Mouse event listener
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


    let render = function(){

        // recreate the matrices for zoom 
        mat4.lookAt(viewMatrix, [0, 0, zoom], [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
    
        // rotate the object  //one full rotation every 6 seconds
        // finds x rotation 

        if (drag) {
            angle = getAngle(mouseDownX, mouseDownY, mouseUpX, mouseUpY);
            mat4.rotate(xRot, identityMatrix, angle.x / 4, [0, 1, 0]);
            // finds y rotation
            mat4.rotate(yRot, identityMatrix, angle.y / 16, [1, 0, 0]);
            //multiplies them together to create the new look
            mat4.mul(worldMatrix, xRot, yRot);
        } else {

            // angle = performance.now() / 1000 / 6 * 2 * Math.PI;
            // mat4.rotate(xRot, identityMatrix, angle, [0, 1, 0]);
            // // finds y rotation
            // mat4.rotate(yRot, identityMatrix, angle / 4, [1, 0, 0]);
            // //multiplies them together to create the new look
            // mat4.mul(worldMatrix, xRot, yRot);

        }







        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);


        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);



    
};


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







