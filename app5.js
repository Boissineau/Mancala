const m4 = twgl.m4;
const v3 = twgl.v3;
let time = 0;

// let objURL = [
//     "./assets/board/new/mancala.obj",
//     "./assets/raymanModel.obj",
// ];

// https://stackoverflow.com/questions/3798848/most-efficient-way-to-draw-multiple-identical-objects
// https://stackoverflow.com/questions/3846359/efficient-way-of-drawing-in-opengl-es
// https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html

let objURL = [
    // "./assets/board/new/mancala2.obj",
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
// let boxProgram = boxProgramInfo(gl);

let models = new Models();

let near = 0.1;
let far = 2.5;
let radius = 1;
let canvasWidth = gl.canvas.width;
let canvasHeight = gl.canvas.height;
let aspect = canvasWidth / canvasHeight;
let modelDim = undefined;
let cameraLookAt = undefined;
let modelObj = undefined;
let y_angle = 0;
// let x_angle = document.getElementById("myRange").value
let fov_Y = 75;

let slider = document.getElementById("myRange");
let x_angle = undefined;

async function main() {
    await models.getModelData(objURL);
    modelDim = models.modelExtents[0];
    cameraLookAt = modelDim.center;
    modelObj = models.vertexAttributes[0];

    let render = () => {
        x_angle = slider.value;



        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.3, 0.4, 0.5, 1);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        renderScene(
            sceneProgram,
            getViewMatrix(radius, deg2rad(x_angle), deg2rad(y_angle)),
            getProjectionMatrix(fov_Y, near, far)
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

// function getCameraTransformationMatrix (scale) {
//     const s = modelDim.dia / 8;
//     const rotationTransformation = m4.multiply(
//       m4.rotationY(deg2rad(y_angle)),
//       m4.rotationX(deg2rad(x_angle))
//     );
//     const translationVector = v3.add(
//       cameraLookAt,
//       v3.mulScalar(
//         m4.transformDirection(rotationTransformation, [0, 0, 1]),
//         radius * modelDim.dia
//       )
//     );

//     return m4.multiply(
//       m4.multiply(m4.translation(translationVector), rotationTransformation),
//       scale ? m4.scaling([s, s, s]) : m4.identity()
//     );
// }

function renderScene(programInfo, viewMatrix, projectionMatrix) {
    gl.useProgram(programInfo.program);
    const uniforms = {
        n2c: 0,
        modelMatrix: m4.identity(),
        viewMatrix,
        projectionMatrix,
    };
    twgl.setUniforms(programInfo, uniforms);
    let bufferInfoArr = bufferInfoArray();
    bufferInfoArr.forEach((bufferInfo) => {
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, bufferInfo, gl["TRIANGLES"]);
    });
}

// function renderCamera() {
//     const viewMatrix =  getViewMatrix(7.5, 0, 0, cameraLookAt, modelDim),
//     projectionMatrix =  getProjectionMatrix(25, 0.1, 10, aspect, modelDim)

//     const uniforms = {
//       n2c: 1,
//       modelMatrix: m4.identity(),
//       viewMatrix,
//       projectionMatrix
//     };

//     renderScene(sceneProgram,viewMatrix,projectionMatrix);
//     /*
//     gl.useProgram(programInfo.program);
//     twgl.setUniforms(programInfo, uniforms);
//     bufferInfoArray.forEach((bufferInfo) => {
//       twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
//       twgl.drawBufferInfo(gl, bufferInfo, gl[type.toUpperCase()]);
//     });
//     */
//     gl.useProgram(boxProgram.program);

//     // Camera Body
//     let modelMatrix = getCameraTransformationMatrix(true);
//     twgl.setBuffersAndAttributes(gl, boxProgramInfo, boxBufferInfo);
//     uniforms.modelMatrix = m4.multiply(modelMatrix, m4.translation([0, 0, 1]));
//     (uniforms.color = [1, 1, 1]), twgl.setUniforms(boxProgramInfo, uniforms);
//     twgl.drawBufferInfo(gl, boxBufferInfo, gl.LINES);
//     // Camera eye piece
//     uniforms.modelMatrix = m4.multiply(
//       m4.multiply(modelMatrix, m4.translation([0, 0, -0.5])),
//       m4.scaling([0.5, 0.5, 0.5])
//     );
//     twgl.setUniforms(boxProgramInfo, uniforms);
//     twgl.drawBufferInfo(gl, boxBufferInfo, gl.LINES);

//     // Camera Frustum
//     modelMatrix = getCameraTransformationMatrix(false);

//     uniforms.modelMatrix = m4.multiply(
//       modelMatrix,
//       m4.inverse(getProjectionMatrix(fov_Y, near, far))
//     );
//     uniforms.color = [0.5, 0.5, 0.5];
//     twgl.setUniforms(boxProgramInfo, uniforms);
//     twgl.drawBufferInfo(gl, boxBufferInfo, gl.LINES);
// }

// function boxBufferInfo(gl) {
//     const boxAttributes = {
//       position: [
//         -1,
//         -1,
//         -1,

//         1,
//         -1,
//         -1,

//         1,
//         1,
//         -1,

//         -1,
//         1,
//         -1,

//         -1,
//         -1,
//         1,

//         1,
//         -1,
//         1,

//         1,
//         1,
//         1,

//         -1,
//         1,
//         1
//       ],
//       indices: [
//         0,
//         1,
//         1,
//         2,
//         2,
//         3,
//         3,
//         0,
//         4,
//         5,
//         5,
//         6,
//         6,
//         7,
//         7,
//         4,
//         0,
//         4,
//         1,
//         5,
//         2,
//         6,
//         3,
//         7
//       ]
//     };
//     return twgl.createBufferInfoFromArrays(gl, boxAttributes);
// }

function bufferInfoArray() {
    return modelObj.map((vertexAttributes) =>
        twgl.createBufferInfoFromArrays(gl, vertexAttributes)
    );
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

// function boxProgramInfo(gl) {
//     const vs = `#version 300 es
//       precision highp float;
//       in vec3 position;
    
//       uniform mat4 modelMatrix;
//       uniform mat4 viewMatrix;
//       uniform mat4 projectionMatrix;
//       void main () {
//         gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1);
//       }`,
//         fs = `#version 300 es
//       precision highp float;
//       out vec4 outColor;
//       uniform vec3 color;
//       void main () {
//         outColor = vec4(color,1);
//       }`;
//     return twgl.createProgramInfo(gl, [vs, fs]);
// }

window.onload = main;
