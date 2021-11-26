import { MTLLoader } from "./libraries/three.js/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "./libraries/three.js/examples/jsm/loaders/OBJLoader.js";

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
varying lowp vec4 vColor;

//global constants
uniform mat4 mWorld; //World space
uniform mat4 mView;  //Camera view 
uniform mat4 mProj;  //points?

void main() {
    fragTexCoord = vertTexCoord;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    vColor = vertColor; 
}
`;

let fs = `


precision mediump float;

//output
varying vec2 fragTexCoord;
varying lowp vec4 vColor;

uniform sampler2D sampler;


void main(){
    gl_FragColor = texture2D(sampler, fragTexCoord);
    // gl_FragColor = vColor; 
}
`;

 function  main() {
    let canvas = document.getElementById("glCanvas");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        gl = canvas.getContext("experimental-webgl");
    }
    if (!gl) {
        console.log("browser does not support webgl");
    }

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    let program = initShaderProgram(gl, vs, fs);
    //
    //  Create buffer
    //

    const programInfo = {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(program, "vertPosition"),
            vertTexCoord: gl.getAttribLocation(program, "vertTexCoord"),
            vertColor: gl.getAttribLocation(program, "vertColor"),
        },
        uniformLocations: {
            modelWorldMatrix: gl.getUniformLocation(program, "mWorld"),
            modelProjMatrix: gl.getUniformLocation(program, "mProj"),
            modelViewMatrix: gl.getUniformLocation(program, "mView"),
        },
    };

    let mtlURL = "imports/board/new/mancala.mtl";
    let boardURL = "imports/board/new/mancala.obj";
    let mtls =  loadMaterial(mtlURL);
    console.log(mtls);

    let boardObj =  loadObject(boardURL, mtls);
    console.log(boardObj);
    let boardSCs = createSCs(boardObj);
    console.log(boardSCs);

    let buffers = initBuffers(gl);

    // Tell WebGL how to pull out the position from the position buffer
    {
        const numComponents = 3;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex
        const offset = 0; // offset from the beginning of a single vertex to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the texture from the texture buffer
    // into the vertTex attribute
    {
        const numComponents = 2;
        const type = gl.FLOAT; //Type of elements
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex
        const offset = 3 * Float32Array.BYTES_PER_ELEMENT; // offset from the beginning of a single vertex to this attribute
        gl.bindTexture(gl.TEXTURE_2D, buffers.tex);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertTexCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertTexCoord);
    }

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertColor,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertColor);
    }

    //
    // tell OpenGL state machine which program should be active
    //
    gl.useProgram(program);
    let matWorldUniformLocation = gl.getUniformLocation(program, "mWorld");
    let matViewUniformLocation = gl.getUniformLocation(program, "mView");
    let matProjUniformLocation = gl.getUniformLocation(program, "mProj");

    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]); //eye: position of view, center: point viewer is looking at, up: vec3 pointing up
    mat4.perspective(
        projMatrix,
        glMatrix.toRadian(45),
        canvas.width / canvas.height,
        0.1,
        1000.0
    );

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
    document.addEventListener("mousedown", (event) => {
        click = true;
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    });

    let mouseUpX = 1;
    let mouseUpY = 1;
    document.addEventListener("mousemove", (event) => {
        if (!click) return;
        drag = true;
        mouseUpX = event.clientX;
        mouseUpY = event.clientY;
    });

    document.addEventListener("mouseup", () => {
        click = false;
        if (drag) {
            drag = false;
        }
    });

    // zoom in and out
    let zoom = -8;
    document.addEventListener("wheel", (event) => {
        let scale = event.deltaY * -0.01;
        if (zoom + scale >= -3) scale = 0;
        if (zoom + scale <= -20) scale = 0;
        zoom += scale;
    });

    //draw scene
    let render = function () {
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

        gl.bindTexture(gl.TEXTURE_2D, buffers.tex);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}

function getAngle(x1, y1, x2, y2) {
    y1 = -y1;
    y2 = -y2;

    var distY = y2 - y1; //opposite
    var distX = x2 - x1; //adjacent

    if (distX == 0) distX = 0.01;
    if (distY == 0) distY = 0.01;
    let angles = {
        x: distX / 100,
        y: distY / 10,
    };
    return angles; //return angle in degrees
}

Math.degrees = function (radians) {
    return radians * (180 / Math.PI);
};

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            "Unable to initialize the shader program: " +
                gl.getProgramInfoLog(shaderProgram)
        );
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
        alert(
            "An error occurred compiling the shaders: " +
                gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl) {
    // Create a buffer for the square's positions.

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    // Now create an array of positions for the square.

    const positions = [
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ];

    // // Now pass the list of positions into WebGL to build the
    // // shape. We do this by creating a Float32Array from the
    // // JavaScript array, then use it to fill the current buffer.

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // // This array defines each face as two triangles, using the
    // // indices into the vertex array to specify each triangle's
    // // position.

    const indices = [
        0,
        1,
        2,
        0,
        2,
        3, // front
        4,
        5,
        6,
        4,
        6,
        7, // back
        8,
        9,
        10,
        8,
        10,
        11, // top
        12,
        13,
        14,
        12,
        14,
        15, // bottom
        16,
        17,
        18,
        16,
        18,
        19, // right
        20,
        21,
        22,
        20,
        22,
        23, // left
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ];

    var colors = [];

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    let boxVertices = [
        // X, Y, Z           U, V
        // Top
        -1.0, 1.0, -1.0, 0, 0, -1.0, 1.0, 1.0, 0, 1, 1.0, 1.0, 1.0, 1, 1, 1.0,
        1.0, -1.0, 1, 0,

        // Left
        -1.0, 1.0, 1.0, 0, 0, -1.0, -1.0, 1.0, 1, 0, -1.0, -1.0, -1.0, 1, 1,
        -1.0, 1.0, -1.0, 0, 1,

        // Right
        1.0, 1.0, 1.0, 1, 1, 1.0, -1.0, 1.0, 0, 1, 1.0, -1.0, -1.0, 0, 0, 1.0,
        1.0, -1.0, 1, 0,

        // Front
        1.0, 1.0, 1.0, 1, 1, 1.0, -1.0, 1.0, 1, 0, -1.0, -1.0, 1.0, 0, 0, -1.0,
        1.0, 1.0, 0, 1,

        // Back
        1.0, 1.0, -1.0, 0, 0, 1.0, -1.0, -1.0, 0, 1, -1.0, -1.0, -1.0, 1, 1,
        -1.0, 1.0, -1.0, 1, 0,

        // Bottom
        -1.0, -1.0, -1.0, 1, 1, -1.0, -1.0, 1.0, 1, 0, 1.0, -1.0, 1.0, 0, 0,
        1.0, -1.0, -1.0, 0, 1,
    ];

    let boxIndices = [
        // Top
        0, 1, 2, 0, 2, 3,

        // Left
        5, 4, 6, 6, 4, 7,

        // Right
        8, 9, 10, 8, 10, 11,

        // Front
        13, 12, 14, 15, 14, 12,

        // Back
        16, 17, 18, 16, 18, 19,

        // Bottom
        21, 20, 22, 22, 20, 23,
    ];

    let boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(boxVertices),
        gl.STATIC_DRAW
    );

    let boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(boxIndices),
        gl.STATIC_DRAW
    );

    let boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        document.getElementById("crate-image")
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    return {
        position: boxVertexBufferObject,
        indices: boxIndexBufferObject,
        color: colorBuffer,
        tex: boxTexture,
    };
}

function loadObject(url, mtls) {
    const loader = new OBJLoader();
    return new Promise(function (resolve, reject) {
        // instantiate a loader
        if (mtls) loader.setMaterials(mtls);
        loader.load(
            // resource URL
            url,
            // called when resource is loaded
            function (object) {
                scene.add(object);
                resolve(object);
            },
            // called when loading is in progresses
            function (xhr) {
                return (xhr.loaded / xhr.total) * 100 + "% loaded";
            },
            // called when loading has errors
            function (error) {
                reject("Error in loading");
            }
        );
    });
}

function loadMaterial(url) {
    {
        let mtlLoader = new MTLLoader();

        // console.log(mtlLoader)
        return new Promise(function (resolve, reject) {
            // instantiate a loader
            mtlLoader.load(
                // resource URL
                url,
                resolve
                // called when resource is loaded
                /*
            function (mtls) {
              mtls.preload();
              resolve(mtls);
            }
            */
            );
        });
        // const mtlLoader = new MTLLoader();
    }
}

function createSCs(obj) {
    const sceneGraph = {};
    let scs = [];
    if (obj.scene) getNode(obj.scene, mat4.create());
    else getNode(obj, mat4.create());

    function getNode(node, M) {
        const sc = {};
        sc.name = node.name;

        const translation = node.position
            ? [node.position.x, node.position.y, node.position.z]
            : [0, 0, 0];
        const quaternion = node.quaternion
            ? [
                  node.quaternion.x,
                  node.quaternion.y,
                  node.quaternion.z,
                  node.quaternion.w,
              ]
            : [0, 0, 0, 1];
        //const rotation = node.rotation?[node.rotation.x,node.rotation.y,node.rotation.z]:[0,0,0];// XYZ order
        const scale =
            node.scale && node.scale.x
                ? [node.scale.x, node.scale.y, node.scale.z]
                : [1, 1, 1];

        sc.modelMatrix = mat4.multiply(
            M,
            mat4.fromRotationTranslationScale(quaternion, translation, scale)
        );

        if (node.geometry || node.attributes) {
            const attributes = node.geometry
                ? node.geometry.attributes
                : node.attributes;
            if (
                node.geometry &&
                node.geometry.groups &&
                node.geometry.groups.length > 0
            ) {
                const groups = node.geometry.groups;
                const localScs = d3.range(0, groups.length, 1).map((i) => {
                    /*
                return{
                  positions : array2Darray(attributes.position.array.slice(groups[i].start*3, (groups[i].start+groups[i].count)*3),3),
                  normals : array2Darray(attributes.normal.array.slice(groups[i].start*3, (groups[i].start+groups[i].count)*3),3),
                  uvs : array2Darray(attributes.uv.array.slice(groups[i].start*2, (groups[i].start+groups[i].count)*2),2)
                }
                */
                    return createSC(attributes, {
                        start: groups[i].start,
                        count: groups[i].count,
                    });
                });
                //return scs
                localScs.forEach((d, i) => {
                    //d.cells = d3.range(0,d.positions.length/3,1).map(i=>[i*3+0,i*3+1,i*3+2]);
                    scs.push({
                        name: sc.name,
                        sc: d,
                        modelMatrix: sc.modelMatrix,
                    });
                });
            } else {
                sc.sc = createSC(attributes);
                scs.push(sc);
            }
        }
        if (node.children)
            node.children.forEach((d) => getNode(d, sc.modelMatrix));
    }
    return scs;
}

function createSC(attributes, offset) {
    let positions = offset
        ? attributes.position.array.slice(
              offset.start * 3,
              (offset.start + offset.count) * 3
          )
        : attributes.position.array.slice();
    let normals = undefined,
        uvs = undefined;
    if (attributes.normal)
        normals = offset
            ? attributes.normal.array.slice(
                  offset.start * 3,
                  (offset.start + offset.count) * 3
              )
            : attributes.normal.array.slice();
    else {
        let count = positions.length / 3;
        let Ns = [];
        for (let i = 0; i < offset.count; i += 3) {
            const k = offset.start + i;
            const v0 = positions.slice(k * 9, k * 9 + 3),
                v1 = positions.slice(k * 9 + 3, k * 9 + 6),
                v2 = positions.slice(k * 9 + 6, k * 9 + 9);
            const N = Array.from(
                vec3.normalize(
                    vec3.cross(vec3.subtract(v1, v0), vec3.subtract(v2, v0))
                )
            );
            Ns.push(N, N, N);
        }
        normals = Ns.flat();
    }
    if (attributes.uv)
        uvs = offset
            ? attributes.uv.array.slice(
                  offset.start * 2,
                  (offset.start + offset.count) * 2
              )
            : attributes.uv.array.slice();
    return {
        positions,
        normals,
        uvs,
    };
}

window.onload = main;
