var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() { 
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_lastFrameTime = performance.now();
let g_xRotation = 0;
let g_yRotation = 0; 
let isDragging = false; 
let lastMouseX, lastMouseY;

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

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
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

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 1;
const TRIANGLE = 2;
const CIRCLE = 3;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 8;
let g_globalAngle = 0;
let g_grayAngle = 0;
let g_orangeAngle = 0;
let g_grayAnimation = false;
let g_orangeAnimation = false;
let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_specialAngle = 0

function addActionsForHtmlUI() {
  document.getElementById('animationGrayOnButton').onclick = function() {g_grayAnimation = true;};
  document.getElementById('animationGrayOffButton').onclick = function() {g_grayAnimation = false;};
  document.getElementById('animationOrangeOnButton').onclick = function() {g_orangeAnimation = true;};
  document.getElementById('animationOrangeOffButton').onclick = function() {g_orangeAnimation = false;};
  document.getElementById('angleSlide').addEventListener('mousemove', function ()  {g_globalAngle = this.value; renderScene(); });
  document.getElementById('graySlide').addEventListener('mousemove', function () {g_grayAngle = -this.value; renderScene(); });
  document.getElementById('orangeSlide').addEventListener('mousemove', function () {g_orangeAngle = -this.value; renderScene(); });
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
  canvas.addEventListener("mousedown", (event) => {
    if (event.shiftKey) {
        startPokeAnimation();
    }
  });
  canvas.addEventListener("mousedown", (event) => {
    if (event.shiftKey) {
        g_pokeAnimation = true;
        g_pokeStartTime = performance.now();
    }
  });
  document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
        g_pokeAnimation = false;
    }
  });
}

function startPokeAnimation() {
  g_pokeAnimation = true;
  g_pokeStartTime = performance.now(); 
}
function measurePerformance() {
  let currentTime = performance.now();
  let frameTime = currentTime - g_lastFrameTime;
  g_lastFrameTime = currentTime;

  let fps = Math.floor(1000 / frameTime); 
  sendTextToHTML(`FPS: ${fps}`, "performanceIndicator"); 
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
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
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {
  renderScene();
}

function connectCoordinatesEventToGL(ev) {
  var x = ev.clientX; 
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return ([x,y]);
}


function updateAnimationAngles() {
  if (g_grayAnimation) {
    g_grayAngle = (10*Math.sin(1.5*g_seconds));
  } 
  if (g_pokeAnimation) {
    let pokeDuration = (performance.now() - g_pokeStartTime) / 1000; 
    g_specialAngle = 20 * Math.sin(pokeDuration * 5); 
    if (!g_pokeAnimation) {
      g_specialAngle = 20 * Math.sin(g_seconds);
    }
  }
  if (g_orangeAnimation) {
    g_orangeAngle = (5 * Math.sin(1.5*g_seconds));
  }
}

function startPokeAnimation() {
  g_pokeAnimation = true;
  g_pokeStartTime = performance.now();
}

function renderScene(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.BLEND);
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_xRotation, 1, 0, 0); 
  globalRotMat.rotate(g_yRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  var body = new Cube();
  body.color = [1.0, 0.65, 0.0, 1.0]; 
  body.matrix.translate(-0.6, -0.4, 0.4);
  body.matrix.scale(1.2, 0.3, 0.4);
  body.render(); 

  var neck = new Cube();
  neck.color = [1.0, 0.65, 0.0, 1.0];
  neck.matrix.setTranslate(-0.6, -0.1, 0.3);
  neck.matrix.scale(0.2, 0.5, 0.2);
  neck.render(); 
  
  var head = new Cube();
  head.color = [1.0, 0.65, 0.0, 1.0];
  head.matrix.setTranslate(-0.4, 0.4, 0.3);
  head.matrix.scale(-0.3, 0.2, 0.2);
  head.render(); 

  var nose = new Cube();
  nose.color = [0.5, 0.5, 0.5, 1.0];
  nose.matrix.setTranslate(-0.7, 0.4, 0.3);
  nose.matrix.scale(-0.15, 0.125, 0.2);
  nose.render(); 

  var ear1 = new Cube();
  ear1.color = [1.0, 0.65, 0.0, 1.0];
  ear1.matrix.setTranslate(-0.5, 0.6, 0.3);
  ear1.matrix.scale(0.05, 0.05, 0.2);
  ear1.render(); 

  var ear2 = new Cube();
  ear2.color = [1.0, 0.65, 0.0, 1.0];
  ear2.matrix.setTranslate(-0.6, 0.6, 0.3);
  ear2.matrix.scale(0.05, 0.05, 0.2);
  ear2.render(); 

  var hump1 = new Cube();
  hump1.color = [1.0, 0.65, 0.0, 1.0];
  hump1.matrix.setTranslate(-0.0, -0.1, 0.3);
  hump1.matrix.scale(-0.3, 0.3, 0.2);
  hump1.render(); 

  var hump2 = new Cube();
  hump2.color = [1.0, 0.65, 0.0, 1.0];
  hump2.matrix.setTranslate(0.4, -0.1, 0.3);
  hump2.matrix.scale(-0.3, 0.3, 0.2);
  hump2.render(); 

  var smallhump1 = new Cube();
  smallhump1.color = [1.0, 0.65, 0.0, 1.0];
  smallhump1.matrix.setTranslate(-0.25, 0.2, 0.3);
  smallhump1.matrix.scale(0.2, 0.15, 0.2);
  smallhump1.render(); 

  var smallhump2 = new Cube();
  smallhump2.color = [1.0, 0.65, 0.0, 1.0];
  smallhump2.matrix.setTranslate(0.15, 0.2, 0.3);
  smallhump2.matrix.scale(0.2, 0.15, 0.2);
  smallhump2.render(); 
  
  var upperLeg1 = new Cube();
  upperLeg1.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg1.matrix.translate(-0.5, -0.55, 0.4);
  upperLeg1.matrix.rotate(-g_orangeAngle, 0, 0, 1);
  upperLeg1.matrix.scale(0.2, 0.35, 0.1);
  upperLeg1.render(); 
  
  var lowerLeg1 = new Cube();
  lowerLeg1.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg1.matrix.translate(-0.4, -0.85, 0.4); 
  lowerLeg1.matrix.rotate(g_grayAngle, 0, 0, 1); 
  lowerLeg1.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg1.matrix.translate(-.5,0,-.001);
  lowerLeg1.render()

  var upperLeg2 = new Cube();
  upperLeg2.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg2.matrix.translate(-0.5, -0.55, 0.1);
  upperLeg2.matrix.rotate(-g_orangeAngle, 0, 0, 1);
  upperLeg2.matrix.scale(0.2, 0.35, 0.1);
  upperLeg2.render(); 
  
  var lowerLeg2 = new Cube();
  lowerLeg2.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg2.matrix.translate(-0.4, -0.85, 0.1); 
  lowerLeg2.matrix.rotate(g_grayAngle, 0, 0, 1); 
  lowerLeg2.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg2.matrix.translate(-.5,0,-.001);
  lowerLeg2.render()
  
  var upperLeg3 = new Cube();
  upperLeg3.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg3.matrix.translate(0.3, -0.55, 0.4);
  upperLeg3.matrix.rotate(-g_orangeAngle, 0, 0, 1);
  upperLeg3.matrix.scale(0.2, 0.35, 0.1);
  upperLeg3.render(); 
  
  var lowerLeg3 = new Cube();
  lowerLeg3.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg3.matrix.translate(0.4, -0.85, 0.4); 
  lowerLeg3.matrix.rotate(g_grayAngle, 0, 0, 1); 
  lowerLeg3.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg3.matrix.translate(-.5,0,-.001);
  lowerLeg3.render()

  var upperLeg4 = new Cube();
  upperLeg4.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg4.matrix.translate(0.3, -0.55, 0.1);
  upperLeg4.matrix.rotate(-g_orangeAngle, 0, 0, 1);
  upperLeg4.matrix.scale(0.2, 0.35, 0.1);
  upperLeg4.render(); 
  
  var lowerLeg4 = new Cube();
  lowerLeg4.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg4.matrix.translate(0.4, -0.85, 0.1); 
  lowerLeg4.matrix.rotate(g_grayAngle, 0, 0, 1); 
  lowerLeg4.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg4.matrix.translate(-.5,0,-.001);
  lowerLeg4.render()

  var tail1 = new Cube();
  tail1.color = [1.0, 0.65, 0.0, 1.0]; 
  tail1.matrix.translate(0.6, -0.3, 0.2);
  tail1.matrix.rotate(-5, 1, 0, 0);
  var Tail1Coordinates = new Matrix4(tail1.matrix); 
  tail1.matrix.scale(0.2, 0.1, 0.1);
  tail1.matrix.translate(-0.25, 0, -.001);
  tail1.render();

  var tail2 = new Cube();
  tail2.color = [0.5, 0.5, 0.5, 1.0];
  tail2.matrix.set(Tail1Coordinates);  
  tail2.matrix.translate(0.15, 0.0, 0.01); 
  tail2.matrix.rotate(g_specialAngle, 0, 0, 1); 
  tail2.matrix.scale(0.2, 0.1, 0.1); 
  tail2.render();
  
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
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
