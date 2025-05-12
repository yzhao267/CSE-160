var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV; 
  }`

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform float u_texColorWeight;
  uniform int u_whichTexture;
  void main() {
    vec4 baseColor = u_FragColor;
    vec4 texColor;
    if (u_whichTexture == -2) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    }
    if (u_whichTexture == -1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    } else {
      texColor = vec4(1.0); 
    }
    gl_FragColor = mix(baseColor, texColor, u_texColorWeight);
  }`

let canvas;
let gl;
let a_position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_whichTexture;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let camera = new Camera([0, 0, 3], [0, 0, -100], [0, 1, 0]);
let u_TexColorWeight;

function setUpWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_TexColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_TexColorWeight) {
    console.log('Failed to get the storage location of u_TexColorWeight');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; 
let g_globalAngle = 0;
let g_lastFrameTime = performance.now();
let g_xRotation = 0;
let g_yRotation = 0; 
let isDragging = false;
let lastMouseX, lastMouseY;

function addActionsForHtmlUI() {
  
  canvas.addEventListener("mousedown", (event) => {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
      let deltaX = event.clientX - lastMouseX;
      let deltaY = event.clientY - lastMouseY;

      g_xRotation += deltaY * 0.5; 
      g_yRotation += deltaX * 0.5;

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      renderScene(); 
    }
  });

  canvas.addEventListener("mouseup", () => {
      isDragging = false;
  });
}

function initTextures() {
  const texturesLoaded = [false, false];
  const files = ["desert.png", "bricks.jpg"];
  files.forEach((file, index) => {
    const image = new Image();
    image.onload = function () {
      loadTexture(image, index);
      texturesLoaded[index] = true;
      if (texturesLoaded.every(loaded => loaded)) {
        requestAnimationFrame(tick); 
      }
    };
    image.src = file;
  });
}

function loadTexture(image, textureUnit) {
  let texture = gl.createTexture();
  gl.activeTexture(gl[`TEXTURE${textureUnit}`]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(gl.program, `u_Sampler${textureUnit}`), textureUnit);

  console.log(`Loaded texture into unit ${textureUnit}: ${image.src}`);
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  document.onkeydown = keydown;
  initTextures(gl, 0);
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) } };
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;
function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  console.log(g_seconds);
  renderScene();
  requestAnimationFrame(tick);
}

function click(ev) {
  renderScene();
}

function keydown(ev) {
  console.log("Before move:", Array.from(camera.eye.elements), Array.from(camera.at.elements));
  if (ev.keyCode == 68) { 
    camera.moveRight(0.2);
  } else if (ev.keyCode == 65) { 
    camera.moveLeft(0.2);
  } else if (ev.keyCode == 87) {
    camera.moveForward(0.2);
  } else if (ev.keyCode == 83) { 
    camera.moveForward(-0.2);
  } else if (ev.keyCode == 81) { 
    camera.rotate(-5); 
  } else if (ev.keyCode == 69) { 
    camera.rotate(5); 
  }
  console.log("After move:", Array.from(camera.eye.elements), Array.from(camera.at.elements));
  renderScene();
}

function measurePerformance() {
  let currentTime = performance.now();
  let frameTime = currentTime - g_lastFrameTime;
  g_lastFrameTime = currentTime;

  let fps = Math.floor(1000 / frameTime); 
  sendTextToHTML(`FPS: ${fps}`, "performanceIndicator"); 
}

let map = [];
for (let x = 0; x < 32; x++) {
  map[x] = [];
  for (let z = 0; z < 32; z++) {
    let isWall = (x < 2 || z < 2 || x >= 31 || z >= 31);
    map[x][z] = isWall ? 7 : 0;
  }
}

let wallCubes = [];
function initWorldFromMap(map) {
  for (let x = 0; x < map.length; x++) {
    for (let z = 0; z < map[0].length; z++) {
      for (let y = 0; y < map[x][z]; y++) {
        let cube = new Cube();
        cube.x = x;
        cube.y = y;
        cube.z = z;
        wallCubes.push(cube);
      }
    }
  }
}

initWorldFromMap(map);


function drawCamel() {
  var body = new Cube();
  body.textureNum = null;
  body.color = [1.0, 0.65, 0.0, 1.0]; 
  body.matrix.translate(-0.6, -0.4, 0.4);
  body.matrix.scale(1.2, 0.3, 0.4);
  body.renderFaster(); 

  var neck = new Cube();
  neck.textureNum = null;
  neck.color = [1.0, 0.65, 0.0, 1.0];
  neck.matrix.setTranslate(-0.6, -0.1, 0.3);
  neck.matrix.scale(0.2, 0.5, 0.2);
  neck.renderFaster(); 
  
  var head = new Cube();
  head.textureNum = null;
  head.color = [1.0, 0.65, 0.0, 1.0];
  head.matrix.setTranslate(-0.4, 0.4, 0.3);
  head.matrix.scale(-0.3, 0.2, 0.2);
  head.renderFaster(); 

  var nose = new Cube();
  nose.textureNum = null;
  nose.color = [0.5, 0.5, 0.5, 1.0];
  nose.matrix.setTranslate(-0.7, 0.4, 0.3);
  nose.matrix.scale(-0.15, 0.125, 0.2);
  nose.renderFaster(); 

  var ear1 = new Cube();
  ear1.textureNum = null;
  ear1.color = [1.0, 0.65, 0.0, 1.0];
  ear1.matrix.setTranslate(-0.5, 0.6, 0.3);
  ear1.matrix.scale(0.05, 0.05, 0.2);
  ear1.renderFaster(); 

  var ear2 = new Cube();
  ear2.textureNum = null;
  ear2.color = [1.0, 0.65, 0.0, 1.0];
  ear2.matrix.setTranslate(-0.6, 0.6, 0.3);
  ear2.matrix.scale(0.05, 0.05, 0.2);
  ear2.renderFaster(); 

  var hump1 = new Cube();
  hump1.textureNum = null;
  hump1.color = [1.0, 0.65, 0.0, 1.0];
  hump1.matrix.setTranslate(-0.0, -0.1, 0.3);
  hump1.matrix.scale(-0.3, 0.3, 0.2);
  hump1.renderFaster(); 

  var hump2 = new Cube();
  hump2.textureNum = null;
  hump2.color = [1.0, 0.65, 0.0, 1.0];
  hump2.matrix.setTranslate(0.4, -0.1, 0.3);
  hump2.matrix.scale(-0.3, 0.3, 0.2);
  hump2.renderFaster(); 

  var smallhump1 = new Cube();
  smallhump1.textureNum = null;
  smallhump1.color = [1.0, 0.65, 0.0, 1.0];
  smallhump1.matrix.setTranslate(-0.25, 0.2, 0.3);
  smallhump1.matrix.scale(0.2, 0.15, 0.2);
  smallhump1.renderFaster(); 

  var smallhump2 = new Cube();
  smallhump2.textureNum = null;
  smallhump2.color = [1.0, 0.65, 0.0, 1.0];
  smallhump2.matrix.setTranslate(0.15, 0.2, 0.3);
  smallhump2.matrix.scale(0.2, 0.15, 0.2);
  smallhump2.renderFaster(); 
  
  var upperLeg1 = new Cube();
  upperLeg1.textureNum = null;
  upperLeg1.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg1.matrix.translate(-0.5, -0.55, 0.4);
  upperLeg1.matrix.scale(0.2, 0.35, 0.1);
  upperLeg1.renderFaster(); 
  
  var lowerLeg1 = new Cube();
  lowerLeg1.textureNum = null;
  lowerLeg1.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg1.matrix.translate(-0.4, -0.85, 0.4); 
  lowerLeg1.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg1.matrix.translate(-.5,0,-.001);
  lowerLeg1.renderFaster()

  var upperLeg2 = new Cube();
  upperLeg2.textureNum = null;
  upperLeg2.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg2.matrix.translate(-0.5, -0.55, 0.1);
  upperLeg2.matrix.scale(0.2, 0.35, 0.1);
  upperLeg2.renderFaster(); 
  
  var lowerLeg2 = new Cube();
  lowerLeg2.textureNum = null;
  lowerLeg2.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg2.matrix.translate(-0.4, -0.85, 0.1); 
  lowerLeg2.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg2.matrix.translate(-.5,0,-.001);
  lowerLeg2.renderFaster()
  
  var upperLeg3 = new Cube();
  upperLeg3.textureNum = null;
  upperLeg3.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg3.matrix.translate(0.3, -0.55, 0.4);
  upperLeg3.matrix.scale(0.2, 0.35, 0.1);
  upperLeg3.renderFaster(); 
  
  var lowerLeg3 = new Cube();
  lowerLeg3.textureNum = null;
  lowerLeg3.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg3.matrix.translate(0.4, -0.85, 0.4); 
  lowerLeg3.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg3.matrix.translate(-.5,0,-.001);
  lowerLeg3.renderFaster()

  var upperLeg4 = new Cube();
  upperLeg4.textureNum = null;
  upperLeg4.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg4.matrix.translate(0.3, -0.55, 0.1);
  upperLeg4.matrix.scale(0.2, 0.35, 0.1);
  upperLeg4.renderFaster(); 
  
  var lowerLeg4 = new Cube();
  lowerLeg4.textureNum = null;
  lowerLeg4.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg4.matrix.translate(0.4, -0.85, 0.1); 
  lowerLeg4.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg4.matrix.translate(-.5,0,-.001);
  lowerLeg4.renderFaster()

  var tail1 = new Cube();
  tail1.textureNum = null;
  tail1.color = [1.0, 0.65, 0.0, 1.0]; 
  tail1.matrix.translate(0.6, -0.3, 0.2);
  var Tail1Coordinates = new Matrix4(tail1.matrix); 
  tail1.matrix.scale(0.2, 0.1, 0.1);
  tail1.matrix.translate(-0.25, 0, -.001);
  tail1.renderFaster();

  var tail2 = new Cube();
  tail2.textureNum = null;
  tail2.color = [0.5, 0.5, 0.5, 1.0];
  tail2.matrix.set(Tail1Coordinates);  
  tail2.matrix.translate(0.15, 0.0, 0.01);  
  tail2.matrix.scale(0.2, 0.1, 0.1); 
  tail2.renderFaster();
}




function renderScene(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.BLEND);

  var ProjMat= new Matrix4();
  ProjMat.setPerspective(60, canvas.width/canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, ProjMat.elements);

  var ViewMat = camera.getViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, ViewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_xRotation, 1, 0, 0); 
  globalRotMat.rotate(g_yRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  var floor = new Cube();
  floor.color = [0.0, 0.0, 1.0, 1.0];
  floor.textureNum = 0;
  floor.matrix.translate(0, -.78, 2);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 3, 0.4);
  floor.renderFaster();

  var sky = new Cube();
  sky.textureNum = null;  
  sky.color = [0.0, 0.6, 1.0, 1.0]; 
  sky.matrix.translate(0, 6.3, 2.1);
  sky.matrix.scale(32, 0, 32);
  sky.matrix.translate(-0.5, 0.5, 0.4);
  sky.renderFaster();

  const offsetX = -map.length / 2;
  const offsetZ = -map[0].length / 2;

  for (let cube of wallCubes) {
    cube.matrix.setIdentity();
    cube.matrix.translate(cube.x + offsetX, cube.y - 0.75, cube.z + offsetZ);
    cube.matrix.scale(1.0, 1.0, 1.0);
    cube.renderFaster();
  }

  drawCamel();
  
  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(0.3, -0.6, 10.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1, 0.1);
  cactus.matrix.translate(10.3, -0.6, 6.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(-8.3, -0.6, 3.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(-9.3, -0.6, -8.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(3.3, -0.6, 1.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(-9.3, -0.6, -2.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(1.3, -0.6, 4.5);
  cactus.renderFaster();

  var cactus = new Cube();
  cactus.color = [0, 0.7, 0, 1];
  cactus.textureNum = null;
  cactus.matrix.scale(0.2, 1.5, 0.1);
  cactus.matrix.translate(7.3, -0.6, 5.5);
  cactus.renderFaster();

  
  var wall = new Cube();
  wall.color = [0.5, 0.5,0.5, 1.0];
  wall.matrix.scale(2,3, 9);
  wall.matrix.translate(-1, -0.25, -0.68);
  wall.renderFaster();

  var wall2 = new Cube();
  wall2.color = [0.5, 0.5, 0.5, 1.0];
  wall2.matrix.scale(10, 3, 2);
  wall2.matrix.translate(-1.45, -0.25, -0.7);
  wall2.renderFaster();

  var roof2 = new Cube();
  roof2.color = [0.5, 0.5, 0.5, 1];
  roof2.matrix.scale(14,1, 14);
  roof2.matrix.translate(-1,2.3,-0.1);
  roof2.renderFaster();

  measurePerformance();
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
      console.log("Failed to get " +  htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text;
  }
  