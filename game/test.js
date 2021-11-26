
const m4 = twgl.m4 
const v3 = twgl.v3

const vs = `#version 300 es

    in vec3 position; // Attribute
    in vec3 normal;   // Attribute
    uniform float asp; // Windo aspect ratio: hindow.width/window.height

    out vec3 fragNormal; // Variable whose value will be associated with the gl_position.

    void main () {
    gl_Position = vec4(position.x/asp, position.yz, 1); 
        // Note: gl_Position is a A predefined vec4 variable.  It must be set with a vec4 value.
    fragNormal = normalize(normal);
    }`;

const fs = `#version 300 es
    precision mediump float;

    in vec3 fragNormal;

    out vec4 outColor; // User-defined output variable for  

    void main () {
    vec3 N = normalize(fragNormal);
    //vec3 color = (N+1.0)/2.0;
    outColor = vec4(abs(N), 1);
    }`;
    
import { Models } from "./models/models.js"

function main(){

    let canvas = document.getElementById("glCanvas");
    let gl = canvas.getContext('webgl2');
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
    
    let radius = 1 
    let x_angle = 0
    let y_angle = 0 
    // let viewMatrix = getViewMatrix(
        // radius,
        // deg2rad(x_angle),
        // deg2rad(y_angle)
    // )

    let modelLoader = new Models();




    // let programInfo = programInfoInit(gl, [vs, fs])

    // let vertexAttributes = [
    //     {
    //       position: {
    //         numComponents: 3,
    //         data: [1, 0, 0, 0, 1, 0, -1, -1, 0]
    //       }, // Attribute position
    //       normal: {
    //         numComponents: 3,
    //         data: [1, 0, 1, 0, 1, 1, -1, -1, -1]
    //       } // Attribtue normal
    //     }
    // ]
    
    // let bufferInfoArray = vertexAttributes.map((d) =>
    //     twgl.createBufferInfoFromArrays(gl, d)
    // )


    // const uniforms = {asp: gl.canvas.width / gl.canvas.height}
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // gl.useProgram(programInfo.program)


    // bufferInfoArray.forEach(bufferInfo => {
    //     twgl.setUniforms(programInfo, uniforms);
    //     twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    //     twgl.drawBufferInfo(gl, bufferInfo);
    // });

}

function deg2rad(deg){
    return (Math.PI * deg) / 180
}
function getViewMatrix(r, x_angle, y_angle){
    const gazeDirection = m4.transformDirection(
      m4.multiply(m4.rotationY(y_angle), m4.rotationX(x_angle)),
      [0, 0, 1]
    );
    const eyePosition = v3.add(
      cameraLookAt,
      v3.mulScalar(gazeDirection, r * modelDim.dia)
    );
  
    const cameraMatrix = m4.lookAt(eyePosition, cameraLookAt, [0, 1, 0]);
    return m4.inverse(cameraMatrix);
  }


function programInfoInit(gl, shaders) {
    return twgl.createProgramInfo(gl, shaders, (message) => { // Combile the shaders and create a shader program.
      errorBlock.style.height = "400px";
      errorBlock.innerHTML = "Program Shader compilation error\n" + message;
    });
  }

window.onload = main