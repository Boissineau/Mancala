
const m4 = twgl.m4 
const v3 = twgl.v3
let time = 0

// let boardURL = [
//     "./assets/board/new/mancala.obj",
//     "./assets/raymanModel.obj", 
// ];

// let boardURL = ["./assets/raymanModel.obj",]

let boardURL = [
  "./assets/board/new/mancala2.obj",
];

let beanURL = [
  "./assets/pebble_OBJ/pebble2.obj"
];

import { Models } from "./assets/models.js";

let canvas = document.getElementById("glCanvas");
let gl = canvas.getContext('webgl2');
if (!gl) {
    gl = canvas.getContext('experimental-webgl');
}
if (!gl) {
    console.log('browser does not support webgl');
}



let texture = twgl.createTexture(gl, {
    // see more info on options from: https://twgljs.org/docs/module-twgl.html#.TextureOptions
    // Also see https://twgljs.org/docs/
    src: './assets/board/boardTexture.jpeg', //or imageURL,
    // flipY: true,
})

// let cubemap = twgl.createTexture(gl, {
//     target: gl.TEXTURE_CUBE_MAP,
//     src: [
//         './assets/skybox/pos-x.jpg',
//         './assets/skybox/neg-x.jpg',
//         './assets/skybox/pos-y.jpg',
//         './assets/skybox/neg-y.jpg',
//         './assets/skybox/pos-z.jpg',
//         './assets/skybox/neg-z.jpg',
//     ],
// })

let cubemap = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    src: [
        './assets/skybox/space/1.png',
        './assets/skybox/space/2.png',
        './assets/skybox/space/3.png',
        './assets/skybox/space/4.png',
        './assets/skybox/space/5.png',
        './assets/skybox/space/6.png',
    ],
})


let sceneProgram = sceneProgramInfo(gl);
let skyboxProgram = skyboxProgramInfo(gl);
let beanProgram = beanProgramInfo(gl);


let board = new Models();
let bean = new Models();


let near = 0.1
let far = 2
let radius = 1
let canvasWidth = gl.canvas.width
let canvasHeight = gl.canvas.height
let aspect = canvasWidth / canvasHeight
let modelDim = undefined
let cameraLookAt = undefined
let modelObj = undefined 
let beanObj = undefined 
let y_angle = 0
let fov_Y = 90

let x_angle = undefined

let drag = false;
let click = false; 
let mouseDownX = 1;
let mouseDownY = 1; 
let mouseUpX = 1;
let mouseUpY = 1; 
let clicked = false; 

// canvas.add... for clicking on canvas only
document.addEventListener('mousedown', (event) => {
    click = true; 
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
});


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
    if (zoom + scale <= -10) scale = 0;
    zoom += scale;
});


let modelMatrix = m4.identity();
let viewMatrix = undefined
let projectionMatrix = undefined
let identityMatrix = m4.identity();
let xRot = m4.identity();
let yRot = m4.identity();
let angle = {x: 0, y: 0}; 







async function main(){

    
    await board.getModelData(boardURL);
    await bean.getModelData(beanURL);

    modelDim = board.modelExtents[0]
    cameraLookAt = modelDim.center
    modelObj = board.vertexAttributes[0]
    beanObj = bean.vertexAttributes[0];


    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    
    // gl.clearColor(0.3, 0.4, 0.5, 1);
    

    let render = () => {
        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        
        
        if (drag) {
            angle = getAngle(mouseDownX, mouseDownY, mouseUpX, mouseUpY);
            mat4.rotate(xRot, xRot, angle.x / 40, [0, 1, 0]);
            // finds y rotation
            mat4.rotate(yRot, yRot, angle.y / 160, [1, 0, 0]);
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
        
        viewMatrix = getViewMatrix(
            radius,
            deg2rad(angle.x),
            deg2rad(angle.y)
        )
        mat4.lookAt(viewMatrix, [0, 0, zoom], [0, 0, 0], [0, 1, 0]);

        projectionMatrix = getProjectionMatrix(fov_Y, near, far)
        renderScene(
          sceneProgram,
          viewMatrix,
          projectionMatrix,
          modelObj
        );

        renderBeans(
          beanProgram,
          beanObj
        );

        renderSkybox();

        // console.log(pixel)
      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)

    
}

function deg2rad(deg){
    return (Math.PI * deg) / 180
}

function getViewMatrix(r, x_angle, y_angle) {
    const gazeDirection = m4.transformDirection(
      m4.multiply(m4.rotationY(y_angle), m4.rotationX(x_angle)),
      [0, 0, 1]
    );
    const eye = v3.add(cameraLookAt, v3.mulScalar(gazeDirection, r*modelDim.dia));
    
    
    const cameraMatrix = m4.lookAt(eye, cameraLookAt, [0, 1, 0]);
    return m4.inverse(cameraMatrix);
}

function getProjectionMatrix (fov, near, far) {
    return m4.perspective(
      deg2rad(fov),
      aspect,
      near * modelDim.dia,
      far * modelDim.dia
    );
}


function renderScene(programInfo, viewMatrix, projectionMatrix, model){
    
    let materialColor = [0, 0.6823529411764706, 1];
    let specularColor = [0.6901960784313725, 0.09019607843137255, 0.09019607843137255]; 
    let K_s = 0; 
    let shininess = 100;
    let ambient = 0;
    let light = [-1.1137182712554932, 8.420951843261719, 0, 1];
    let eyePosition = cameraLookAt;
    

    const uniforms = {
        n2c: 0,
        modelMatrix: modelMatrix,
        viewMatrix: viewMatrix,
        projectionMatrix: projectionMatrix,
        materialColor,
        specularColor,
        K_s,
        shininess,
        ambient,
        light,
        eyePosition,
        tex: texture, 
        clicked: clicked
    };

    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, uniforms);
    let bufferInfoArr = bufferInfoArray(model)

    bufferInfoArr.forEach((bufferInfo) => {
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.drawBufferInfo(gl, bufferInfo, gl["TRIANGLES"]);
    });
}

function renderSkybox() {
    gl.depthFunc(gl.LEQUAL);
    let invMatrix = invViewProjectionMatrix();
    const uniforms = {
      cubemap: cubemap,
      invViewProjectionMatrix: invMatrix
    };

    gl.useProgram(skyboxProgram.program);
    twgl.setUniforms(skyboxProgram, uniforms);
    let skyboxBuffer = skyboxBufferInfo();
    twgl.setBuffersAndAttributes(gl, skyboxProgram, skyboxBuffer);
    twgl.drawBufferInfo(gl, skyboxBuffer);
    gl.depthFunc(gl.LESS);
  }

  function renderBeans(programInfo, model) {

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

function skyboxBufferInfo(){
    return twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]
        }
      })
} 


function getAngle(x1, y1, x2, y2){
    y1 = -y1; 
    y2 = -y2;

    var distY = y2-y1; //opposite
    var distX = x2-x1; //adjacent



    if (distX == 0) distX = 0.01;
    if (distY == 0) distY = 0.01;
    let angles = {
        x: distX/100,
        y: distY/10
    }
    return angles //return angle in degrees
    

}

function invViewProjectionMatrix() {
    const view = modelMatrix.slice();
    const viewD = m4.setTranslation(view, [0, 0, 0]);
    const viewDirectionProjection = m4.multiply(projectionMatrix, viewD);
    return m4.inverse(viewDirectionProjection);
}



function sceneProgramInfo(gl){
    const shaders = {
      vs: `#version 300 es
      precision mediump float;

      in vec3 position;
      in vec3 normal;
      in vec2 uv; 

      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
 
      out vec3 fragNormal;
      out vec3 fragPosition; 
      out vec2 fragUV; 

      void main () {
        vec4 newPosition = modelMatrix*vec4(position,1);
        fragPosition = newPosition.xyz; 
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1);
        mat4 normalMatrix = transpose(inverse(modelMatrix));
        fragNormal = normalize((normalMatrix*vec4(normal,0)).xyz);
        gl_PointSize = 2.;
        fragUV = uv;
      }`,
  
      fs: `#version 300 es


      precision mediump float;

      
      
      in vec3 fragNormal; 
      in vec3 fragPosition; 
      in vec2 fragUV;

      out vec4 outColor;

      uniform int n2c;
      uniform vec4 light;
      uniform vec3 eyePosition;
      uniform vec3 materialColor;
      uniform float K_s, shininess, ambient;
      uniform vec3 specularColor;
      uniform sampler2D tex;
      uniform bool clicked; 

      void main () {
        
        vec3 N = normalize(fragNormal);
        // vec3 color = (n2c==0)?abs(N):(N+1.)/2.;
        vec3 L;
        if (light.w == 1.) L = normalize(light.xyz - fragPosition);
        else L = normalize(light.xyz);
  
        vec3 diffuse = materialColor*clamp(dot(L,N), 0.,1.); //Compute diffuse color
  
        vec3 V = normalize(eyePosition - fragPosition);
        vec3 H = normalize(L + V);
        
        if (clicked) {

            // for colour 
            vec3 specular = specularColor*pow( clamp(dot(H,N),0.,1.),shininess); //Compute specular color
            vec3 color = ambient*materialColor + (1.-K_s)*diffuse + K_s*specular;
            outColor = vec4(color, 1);
        } else {
            vec3 R = reflect(-V, N);
            vec3 texColor = texture( tex, fragUV ).rgb;
            outColor = vec4(texColor, 1);
        }

      }`
    };
    return twgl.createProgramInfo(gl, [shaders.vs, shaders.fs], (message) => {
      console.log("Program Shader compilation error\n" + message);
    });
  }

function skyboxProgramInfo() {
const vert = `#version 300 es
    precision mediump float;
    in vec2 position;
    out vec2 fragPosition;
    void main() {
    fragPosition = position;
    gl_Position = vec4(position, 1, 1);
}`,
    frag = `#version 300 es
    precision mediump float;
    uniform samplerCube cubemap;
    in vec2 fragPosition;
    out vec4 outColor;
    uniform mat4 invViewProjectionMatrix;

    void main () {
    vec4 direction = invViewProjectionMatrix * vec4(fragPosition, 1, 1);
    outColor = texture(cubemap, normalize(direction.xyz/direction.w));
    }`;
return twgl.createProgramInfo(gl, [vert, frag], (message) => {
    console.log("Skybox Shader compilation error\n" + message);
});
}

function pickingProgramInfo(){
    const vert = `#version 300 es
    attribute vec4 a_position;
 
    uniform mat4 u_matrix;
   
    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * a_position;
    }
}`,
    frag = `#version 300 es
    precision mediump float;
 
    uniform vec4 u_id;
   
    void main() {
       gl_FragColor = u_id;
    }`;
return twgl.createProgramInfo(gl, [vert, frag], (message) => {
    console.log("Skybox Shader compilation error\n" + message);
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


window.onload = main