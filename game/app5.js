const m4 = twgl.m4;
const v3 = twgl.v3;
let time = 0;


let boardURL = [
    "./assets/board/new/mancala2.obj",
    // "./assets/pebble_OBJ/pebble2.obj"
];

let beanURL = [
    "./assets/pebble_OBJ/pebble2.obj"
];

import { Models } from "./assets/models.js";

let canvas = document.getElementById("glCanvas");
let gl = canvas.getContext("webgl2");
if (!gl) {
    gl = canvas.getContext("experimental-webgl");
}
if (!gl) {
    console.log("browser does not support webgl");
}

let sceneProgram = sceneProgramInfo(gl);
let beanProgram = beanProgramInfo(gl);


let board = new Models();
let bean = new Models();


let near = 0.1;
let far = 2;
let radius = 1;
let canvasWidth = gl.canvas.width;
let canvasHeight = gl.canvas.height;
let aspect = canvasWidth / canvasHeight;
let modelDim = undefined;
let cameraLookAt = undefined;
let modelObj = undefined;
let beanObj = undefined;

let y_angle = 0;
// let x_angle = document.getElementById("myRange").value
let fov_Y = 90;

let x_angle = undefined;

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

let modelMatrix = m4.identity();
let xRot = m4.identity();
let yRot = m4.identity();
let identityMatrix = m4.identity();
let angle = { x: 0, y: 0 };
async function main() {
    await board.getModelData(boardURL);
    await bean.getModelData(beanURL);


    modelDim = board.modelExtents[0];
    cameraLookAt = modelDim.center;
    modelObj = board.vertexAttributes[0];
    beanObj = bean.vertexAttributes[0];

    let render = () => {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.3, 0.4, 0.5, 1);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        if (drag) {
            angle = getAngle(mouseDownX, mouseDownY, mouseUpX, mouseUpY);
            mat4.rotate(xRot, identityMatrix, angle.x / 4, [0, 1, 0]);
            // finds y rotation
            mat4.rotate(yRot, identityMatrix, angle.y / 16, [1, 0, 0]);
            //multiplies them together to create the new look
            mat4.mul(modelMatrix, xRot, yRot);
        } else {
            // let angleSeconds = performance.now() / 1000 / 6 * 2 * Math.PI;
            // angle.x = angleSeconds
            // angle.y = angleSeconds / 4
            // mat4.rotate(xRot, identityMatrix, angle.x, [0, 1, 0]);
            // // finds y rotation
            // mat4.rotate(yRot, identityMatrix, angle.y, [1, 0, 0]);
            // //multiplies them together to create the new look
            // mat4.mul(modelMatrix, xRot, yRot);
        }


        renderScene(
            sceneProgram,
            getViewMatrix(radius, deg2rad(angle.x), deg2rad(angle.y)),
            getProjectionMatrix(fov_Y, near, far),
            modelObj
        );

        renderBeans(
            beanProgram,
            getViewMatrix(radius, deg2rad(angle.x), deg2rad(angle.y)),
            beanObj
        );




        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}

function deg2rad(deg) {
    return (Math.PI * deg) / 180;
}

function getViewMatrix(r, x_angle, y_angle) {
    const gazeDirection = m4.transformDirection(
        m4.multiply(m4.rotationY(y_angle), m4.rotationX(x_angle)),
        [0, 0, 1]
    );
    const eye = v3.add(
        cameraLookAt,
        v3.mulScalar(gazeDirection, r * modelDim.dia)
    );
    const cameraMatrix = m4.lookAt(eye, cameraLookAt, [0, 1, 0]);
    return m4.inverse(cameraMatrix);
}

function getProjectionMatrix(fov, near, far) {
    return m4.perspective(
        deg2rad(fov),
        aspect,
        near * modelDim.dia,
        far * modelDim.dia
    );
}

function renderScene(programInfo, viewMatrix, projectionMatrix, model) {
    gl.useProgram(programInfo.program);
    const uniforms = {
        n2c: 0,
        modelMatrix: modelMatrix,
        viewMatrix,
        projectionMatrix,
    };
    twgl.setUniforms(programInfo, uniforms);
    let bufferInfoArr = bufferInfoArray(model);
    bufferInfoArr.forEach((bufferInfo) => {
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, bufferInfo, gl["TRIANGLES"]);
    });
}

function renderBeans(programInfo, viewMatrix, model) {

    // Scaling beans
    // let beanSX = 0.00125, beanSY = 0.00125, beanSZ = 0.00125;
    let beanSX = 0.1, beanSY = 0.1, beanSZ = 0.1;

    let beanMatrix =  new Float32Array([
        beanSX, 0.0, 0.0, 0.0,
        0.0, beanSY, 0.0, 0.0,
        0.0, 0.0, beanSZ, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
    let scaleMatrix = gl.getUniformLocation(programInfo.program, 'scaleMatrix');

    // Translating beans
    let beanTX = 0.0, beanTY = 0.0, beanTZ = 0.0
    let translation = gl.getUniformLocation(programInfo.program, 'translation' );
    
    gl.useProgram(programInfo.program);
    const uniforms = {
        n2c: 0,
        modelMatrix: viewMatrix,

    };
    twgl.setUniforms(programInfo, uniforms);
    let bufferInfoArr = bufferInfoArray(model);
    bufferInfoArr.forEach((bufferInfo) => {
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, bufferInfo, gl["TRIANGLES"]);
    });

    gl.uniformMatrix4fv(scaleMatrix,false,beanMatrix);
    gl.uniform3f(translation, beanTX, beanTY, beanTZ);
}

function bufferInfoArray(model) {
    return model.map((vertexAttributes) =>
        twgl.createBufferInfoFromArrays(gl, vertexAttributes)
    );
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

function sceneProgramInfo(gl) {
    const shaders = {
        vs: `#version 300 es
      precision mediump float;
      in vec3 position;
      in vec3 normal;
    
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      out vec3 fragNormal;
      void main () {
        vec4 newPosition = modelMatrix*vec4(position,1);
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1);
        mat4 normalMatrix = transpose(inverse(modelMatrix));
        fragNormal = normalize((normalMatrix*vec4(normal,0)).xyz);
        gl_PointSize = 2.;
      }`,

        fs: `#version 300 es
      precision mediump float;
      out vec4 outColor;
      in vec3 fragNormal;
      uniform int n2c;
      void main () {
        vec3 N = normalize(fragNormal);
        vec3 color = (n2c==0)?abs(N):(N+1.)/2.;
        outColor = vec4(color, 1);
      }`,
    };
    return twgl.createProgramInfo(gl, [shaders.vs, shaders.fs], (message) => {
        console.log("Program Shader compilation error\n" + message);
    });
}

function beanProgramInfo(gl) {
    const shaders = {
        vs: `#version 300 es
      precision mediump float;
      in vec3 position;
      in vec3 normal;
    
      uniform vec3 translation;
      uniform mat4 scaleMatrix;
      uniform mat4 modelMatrix;

      out vec3 fragNormal;
      void main () {
        vec4 newPosition = modelMatrix*vec4(position,1.0);
        gl_Position = modelMatrix*vec4(position+translation,1.0)*scaleMatrix;
        mat4 normalMatrix = transpose(inverse(modelMatrix));
        fragNormal = normalize((normalMatrix*vec4(normal,0)).xyz);
        gl_PointSize = 2.;
      }`,

        fs: `#version 300 es
      precision mediump float;
      out vec4 outColor;
      in vec3 fragNormal;
      uniform int n2c;
      void main () {
        vec3 N = normalize(fragNormal);
        vec3 color = (n2c==0)?abs(N):(N+1.)/2.;
        outColor = vec4(color, 1);
      }`,
    };
    return twgl.createProgramInfo(gl, [shaders.vs, shaders.fs], (message) => {
        console.log("Program Shader compilation error\n" + message);
    });
}

window.onload = main;
