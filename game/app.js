const m4 = twgl.m4;
const v3 = twgl.v3;

// let boardURL = [
//     "./assets/board/new/mancala.obj",
//     "./assets/raymanModel.obj",
// ];

// let boardURL = ["./assets/raymanModel.obj",]

let boardURL = ["./assets/board/new/mancala2.obj"];

let beanURL = ["./assets/pebble_OBJ/pebble2.obj"];

let board = new Models();
let bean = new Models();

import { Models } from "./assets/models.js";
import { Mancala } from "./mancala.js";
let canvas = document.getElementById("glCanvas");
let gl = canvas.getContext("webgl2");
if (!gl) {
    gl = canvas.getContext("experimental-webgl");
}
if (!gl) {
    console.log("browser does not support webgl");
}

let texture = twgl.createTexture(gl, {
    // see more info on options from: https://twgljs.org/docs/module-twgl.html#.TextureOptions
    // Also see https://twgljs.org/docs/
    src: "./assets/board/boardTexture.jpeg", //or imageURL,
    // flipY: true,
});

let cubemap = twgl.createTexture(gl, {
    target: gl.TEXTURE_CUBE_MAP,
    src: [
        "./assets/skybox/pos-x.jpg",
        "./assets/skybox/neg-x.jpg",
        "./assets/skybox/pos-y.jpg",
        "./assets/skybox/neg-y.jpg",
        "./assets/skybox/pos-z.jpg",
        "./assets/skybox/neg-z.jpg",
    ],
    // flipY: true
});

// let cubemap = twgl.createTexture(gl, {
//     target: gl.TEXTURE_CUBE_MAP,
//     src: [
//         "./assets/skybox/space/1.png",
//         "./assets/skybox/space/2.png",
//         "./assets/skybox/space/3.png",
//         "./assets/skybox/space/4.png",
//         "./assets/skybox/space/5.png",
//         "./assets/skybox/space/6.png",
//     ],
//     flipY: true,
// });

let skyboxProgram = skyboxProgramInfo(gl);
let sceneProgram = sceneProgramInfo(gl);

let canvasWidth = gl.canvas.width;
let canvasHeight = gl.canvas.height;
let aspect = canvasWidth / canvasHeight;
let fov = 60;
let near = 0.01;
let far = 20;
let dia = 8.328817059949166;
let radius = dia / 2;
let center = [0, 0, 0];

let drag = false;
let click = false;
let mouseDownX = 0;
let mouseDownY = 0;
let mouseUpX = 0;
let mouseUpY = 0;

// canvas.add... for clicking on canvas only
canvas.addEventListener("mousedown", (event) => {
    click = true;
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
});

canvas.addEventListener("mousemove", (event) => {
    if (!click) return;
    drag = true;
    mouseUpX = event.clientX;
    mouseUpY = event.clientY;
});

canvas.addEventListener("mouseup", () => {
    click = false;
    if (drag) {
        drag = false;
    }
});

// zoom in and out
// let zoom = -7;
let zoom = 0;
canvas.addEventListener("wheel", (event) => {
    let scale = event.deltaY * -0.01;
    if (zoom + scale >= 100) scale = 0;
    if (zoom + scale <= -100) scale = 0;
    zoom += scale;
});

let board1 = document.getElementById("0").addEventListener("click", () => {
    clickedCell = 0;
});
let board2 = document.getElementById("1").addEventListener("click", () => {
    clickedCell = 1;
});
let board3 = document.getElementById("2").addEventListener("click", () => {
    clickedCell = 2;
});
let board4 = document.getElementById("3").addEventListener("click", () => {
    clickedCell = 3;
});
let board5 = document.getElementById("4").addEventListener("click", () => {
    clickedCell = 4;
});
let board6 = document.getElementById("5").addEventListener("click", () => {
    clickedCell = 5;
});
let board7 = document.getElementById("7").addEventListener("click", () => {
    clickedCell = 7;
});
let board8 = document.getElementById("8").addEventListener("click", () => {
    clickedCell = 8;
});
let board9 = document.getElementById("9").addEventListener("click", () => {
    clickedCell = 9;
});
let board10 = document.getElementById("10").addEventListener("click", () => {
    clickedCell = 10;
});
let board11 = document.getElementById("11").addEventListener("click", () => {
    clickedCell = 11;
});
let board12 = document.getElementById("12").addEventListener("click", () => {
    clickedCell = 12;
});

let rotate = false;
document.getElementById("rotate").addEventListener("click", () => {
    rotate = !rotate;
    if (rotate) document.getElementById("rotate").innerHTML = "STOP ROTATING";
    if (!rotate) document.getElementById("rotate").innerHTML = "ROTATE BOARD";
});

document.getElementById("AI_checkbox").addEventListener("click", () => {
    let val =
        document.getElementById("AI_checkbox").value == "true"
            ? "false"
            : "true";
    document.getElementById("AI_checkbox").value = val;
});

let modelMatrix = m4.identity();
let viewMatrix = m4.identity();
let projectionMatrix = m4.identity();
let identityMatrix = m4.identity();

let xRot = m4.identity();
let yRot = m4.identity();
let angle = { x: 0, y: 0 };

let beans = [];
let cells = [];
let clickedCell = undefined;
let prevBoard = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
let beanPos = [];
let mancala = new Mancala();
document.getElementById("reset").addEventListener("click", () => {
    mancala.gameInit();
    beanPos = [];
    mancala.board.forEach((numberOfBeans, index) => {
        for (let i = 0; i < numberOfBeans; i++) {
            beanPos.push(getTranslations(beans[index]));
        }
    });
});

async function main() {
    await board.getModelData(boardURL);
    await bean.getModelData(beanURL);

    let boardExtents = board.modelExtents[0];
    let boardAttributes = board.vertexAttributes[0];
    let beanExtents = bean.modelExtents[0];
    let beanAttributes = bean.vertexAttributes[0];

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    getViewMatrix();
    beans = getPositions();

    let playerTurn = document.getElementById("turn");
    let score = document.getElementById("score");
    let gameEnd = false;

    mancala.board.forEach((numberOfBeans, index) => {
        for (let i = 0; i < numberOfBeans; i++) {
            beanPos.push(getTranslations(beans[index]));
        }
    });

    let render = () => {
        let p1Score = mancala.board[6];
        let p2Score = mancala.board[13];
        score.innerHTML = `Score: ${p1Score}:${p2Score}`;
        // displays number of beans in each button
        for (let i = 0; i < mancala.board.length; i++) {
            if (i == 6 || i == 13) continue;
            let id = `${i}`;
            let num = `${mancala.board[i]}`;
            document.getElementById(id).innerHTML = num;
        }

        // ends or changes turn text
        if (gameEnd) {
            playerTurn.innerHTML = mancala.winner + " won!";
        } else {
            playerTurn.innerHTML = mancala.isHeroTurn
                ? "Player 1's turn"
                : "Player 2's turn";
        }

        if (!gameEnd) {
            if (
                document.getElementById("AI_checkbox").value == "true" &&
                !mancala.isHeroTurn
            ) {
                let availablePits = () => {
                    for (let i = 7; i < 13; i++) {
                        if (mancala.checkPit(i)) return i;
                    }
                    return 0;
                };

                clickedCell = availablePits();
            }

            if (mancala.checkPit(clickedCell)) {
                gameEnd = mancala.move(clickedCell);
                let prevPos = beanPos;
                beanPos = [];
                mancala.board.forEach((numberOfBeans, index) => {
                    if (prevBoard[index] == numberOfBeans) {
                        console.log("Same number of beans");
                        for (let i = 0; i < numberOfBeans; i++) {
                            beanPos.push(prevPos.shift());
                        }
                    } else {
                        for (let i = 0; i < numberOfBeans; i++) {
                            beanPos.push(getTranslations(beans[index], index));
                            prevPos.shift();
                        }
                    }
                });
            }
            prevBoard = mancala.board.slice();
        }

        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        projectionMatrix = m4.perspective(deg2rad(fov), aspect, 1, 2000);

        if (drag) {
            getAngle(mouseUpX, mouseUpY);
        }
        getViewMatrix();

        renderScene(
            sceneProgram,
            boardAttributes,
            texture,
            false,
            boardExtents
        );

        // mancala.board.forEach((numberOfBeans, index) => {
        for (let i = 0; i < 48; i++) {
            renderScene(
                sceneProgram,
                beanAttributes,
                texture,
                true,
                beanPos[i],
                boardExtents
            );
        }
        // });

        renderSkybox(skyboxProgram.program);
        clickedCell = undefined;
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}

function renderScene(
    programInfo,
    attributes,
    texture,
    bean,
    translations,
    boardExtents
) {
    let materialColor = [1, 0, 0];
    let specularColor = [
        0.6901960784313725, 0.09019607843137255, 0.09019607843137255,
    ];
    let K_s = 0;
    let shininess = 100;
    let ambient = 0;
    let light = [-1.1137182712554932, 8.420951843261719, 0, 1];
    let eyePosition = center;

    let angleSeconds = (performance.now() / 1000 / 6) * 2 * Math.PI;

    let matrix = modelMatrix;

    if (bean) {
        // bean translations
        let x = translations[0];
        let z = translations[1];
        let y = translations[2];

        matrix = m4.translate(matrix, [x, z, y]);
        matrix = m4.scale(matrix, [0.015, 0.015, 0.015]);
        matrix = m4.rotateX(matrix, deg2rad(90));
        // matrix = m4.rotateX(matrix, angleSeconds);
    } else {
        //rotating the board 90 degrees so it you can see the face
        matrix = m4.rotateX(matrix, deg2rad(90));
    }

    const uniforms = {
        modelMatrix: matrix,
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
        bean: bean,
    };

    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, uniforms);

    let bufferInfoArr = bufferInfoArray(attributes);

    bufferInfoArr.forEach((bufferInfo) => {
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, bufferInfo, gl["TRIANGLES"]);
    });
}

function renderSkybox(program) {
    let skyboxLocation = gl.getUniformLocation(program, "cubemap");
    let viewDirectionProjectionInverseLocation = gl.getUniformLocation(
        program,
        "invViewProjectionMatrix"
    );
    let skyboxBuffer = skyboxBufferInfo();
    gl.useProgram(program);

    var viewDirectionProjectionMatrix = m4.multiply(
        projectionMatrix,
        viewMatrix
    );
    var viewDirectionProjectionInverseMatrix = m4.inverse(
        viewDirectionProjectionMatrix
    );
    gl.uniformMatrix4fv(
        viewDirectionProjectionInverseLocation,
        false,
        viewDirectionProjectionInverseMatrix
    );
    gl.uniform1i(skyboxLocation, 0);

    // const uniforms = {
    //   cubemap: cubemap,
    //   invViewProjectionMatrix: viewDirectionProjectionInverseMatrix
    // };
    // twgl.setUniforms(skyboxProgram, uniforms);
    gl.depthFunc(gl.LEQUAL);
    twgl.setBuffersAndAttributes(gl, skyboxProgram, skyboxBuffer);
    twgl.drawBufferInfo(gl, skyboxBuffer);
    gl.depthFunc(gl.LESS);
}

function bufferInfoArray(model) {
    return model.map((vertexAttributes) =>
        twgl.createBufferInfoFromArrays(gl, vertexAttributes)
    );
}

function getViewMatrix() {
    let cameraLookAt = [0, 0, 0];
    if (rotate) {
        angle.x += 0.4;
        angle.y += 0.4;
    }
    //where are we looking
    let rotationMatrix = m4.multiply(
        m4.rotationY(deg2rad(angle.x)),
        m4.rotationX(deg2rad(angle.y))
    );
    const gazeDirection = m4.transformDirection(rotationMatrix, [0, 0, 1]);

    // where are we located
    // radius * 2 changes how much the skybox rotates
    const eyePosition = v3.add(
        cameraLookAt,
        v3.mulScalar(gazeDirection, radius * 2)
    );

    const cameraMatrix = m4.lookAt(eyePosition, cameraLookAt, [0, 1, 0]);
    viewMatrix = m4.inverse(cameraMatrix);
}

function skyboxBufferInfo() {
    return twgl.createBufferInfoFromArrays(gl, {
        position: {
            numComponents: 2,
            data: [-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1],
        },
    });
}

function getAngle(x, y) {
    x -= canvasWidth / 2;
    y -= canvasHeight / 2;

    let distX = mouseUpX - mouseDownX;
    distX = distX / (mouseUpX - distX);

    let distY = mouseUpY - mouseDownY;
    distY = distY / (mouseUpY - distY);

    y *= -1;
    angle.x += distX;
    angle.y += distY;
}

function getPositions() {
    return {
        0: [-2.4, -0.5, 0],
        1: [-1.4, -0.5, 0],
        2: [-0.4, -0.5, 0],
        3: [0.4, -0.5, 0],
        4: [1.4, -0.5, 0],
        5: [2.4, -0.5, 0],
        6: [3.3, 0, 0],
        7: [2.4, 0.3, 0],
        8: [1.4, 0.3, 0],
        9: [0.4, 0.3, 0],
        10: [-0.4, 0.3, 0],
        11: [-1.4, 0.3, 0],
        12: [-2.4, 0.3, 0],
        13: [-3.3, 0, 0],
    };
}

function getTranslations(position, index) {
    let deltaX = 0.2;
    let deltaY = 0.2;
    let deltaZ = 0.1;
    if (index == 6 || index == 13) deltaY = 0.5;
    let trans = [rand(-deltaX, deltaX), rand(-deltaY, deltaY), rand(0, deltaZ)];
    return v3.add(position, trans);
}
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function deg2rad(deg) {
    return (Math.PI * deg) / 180;
}

function sceneProgramInfo(gl) {
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

      uniform vec4 light;
      uniform vec3 eyePosition;
      uniform vec3 materialColor;
      uniform float K_s, shininess, ambient;
      uniform vec3 specularColor;
      uniform sampler2D tex;
      uniform bool bean;


      void main () {
        
        vec3 N = normalize(fragNormal);
        vec3 L;
        if (light.w == 1.) L = normalize(light.xyz - fragPosition);
        else L = normalize(light.xyz);
  
        vec3 diffuse = materialColor*clamp(dot(L,N), 0.,1.); //Compute diffuse color
  
        vec3 V = normalize(eyePosition - fragPosition);
        vec3 H = normalize(L + V);
        
        if(bean){

            // for colour 
            vec3 specular = specularColor*pow( clamp(dot(H,N),0.,1.),shininess); //Compute specular color
            vec3 color = ambient*materialColor + (1.-K_s)*diffuse + K_s*specular;
            outColor = vec4(color, 1);
        }
        else{
            vec3 R = reflect(-V, N);
            vec3 texColor = texture( tex, fragUV ).rgb;
            outColor = vec4(texColor, 1);
        }


      }`,
    };
    return twgl.createProgramInfo(gl, [shaders.vs, shaders.fs], (message) => {
        console.log("Program Shader compilation error\n" + message);
    });
}

function skyboxProgramInfo() {
    const vert = `#version 300 es
    precision mediump float;

    in vec4 position;
    out vec4 fragPosition;
    void main() {
        fragPosition = position;
        gl_Position = position;
        gl_Position.z = 1.0; 
    }`,
        frag = `#version 300 es

    precision mediump float;

    uniform samplerCube cubemap;
    uniform mat4 invViewProjectionMatrix;

    in vec4 fragPosition;
    out vec4 outColor;

    void main () {
    vec4 direction = invViewProjectionMatrix * fragPosition;
    outColor = texture(cubemap, normalize(direction.xyz/direction.w));
    }`;
    return twgl.createProgramInfo(gl, [vert, frag], (message) => {
        console.log("Skybox Shader compilation error\n" + message);
    });
}

window.onload = main;
