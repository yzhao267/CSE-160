// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() { 
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_position;
let u_FragColor;
let u_Size;
var g_shapesList = [];


function setUpWebGL() {
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Constants 
const POINT = 1;
const TRIANGLE = 2;
const CIRCLE = 3;

// Global Var for UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 8;

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes(); };
  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; };
  document.getElementById('TriButton').onclick = function() { g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };
  document.getElementById('redSlide').addEventListener('mouseup', function ()  {g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function ()  {g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function ()  {g_selectedColor[2] = this.value/100; });
  document.getElementById('sizeSlide').addEventListener('mouseup', function ()  {g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function ()  {g_selectedSegment = this.value; });
  document.getElementById('drawImageButton').onclick = function() {
  const img = document.getElementById('golden_sword'); 
  img.style.display = 'block'; 
  drawPicture();
};
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) } };
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function drawPicture() {
  // Example triangles representing your picture
  const triangles = [
    { vertices: [-0.3, 0.4, 0.0, 1, -0.4, 0.5], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [0.3, 0.4, 0.0, 1, 0.4, 0.5], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.2, 0.4, 0.0, 0.7, 0.0, 0.9], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [0.2, 0.4, 0.0, 0.7, 0.0, 0.9], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.1, 0.1, 0.0, 0.6, 0.1, 0.1], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.1, 0, 0.0, -0.4, 0.1, 0], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.05, 0.05, 0.0, 0.1, 0.05, 0.05], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.05, 0.05, 0, 0, 0.05, 0.05], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.2, 0.1, -0.1, 0.5, -0.15, 0.1], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [0.2, 0.1, 0.1, 0.5, 0.15, 0.1], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.2, 0, -0.05, -0.4, -0.15, 0], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [0.2, 0, 0.05, -0.4, 0.15, 0], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.1, 0, -0.1, 0.1, -0.25, 0.05], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [0.1, 0, 0.1, 0.1, 0.25, 0.05], color: [1.0, 0.92, 0.016, 1.0] }, 
    { vertices: [-0.4, 0.5, -0.3, 0.4, -0.2, -0.4], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [0.4, 0.5, 0.3, 0.4, 0.2, -0.4], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.3, -0.4, 0.3, -0.4, 0.3, -0.5], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.3, -0.5, -0.3, -0.4, 0.3, -0.5], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.1, -0.5, 0.1, -0.5, 0.1, -0.8], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.1, -0.5, -0.1, -0.8, 0.1, -0.8], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.2, -0.8, 0.2, -0.8, 0.2, -0.9], color: [0.5, 0.5, 0.5, 1.0] }, 
    { vertices: [-0.2, -0.8, -0.2, -0.9, 0.2, -0.9], color: [0.5, 0.5, 0.5, 1.0] }, 
  ];
  // 1.0, 1.0, 1.0, 1.0 white
  // 0.0, 0.0, 0.0, 1.0 black
  // 0.5, 0.5, 0.5, 1.0 gray
  // 1.0, 0.0, 0.0, 1.0 red
  // 0.0, 1.0, 0.0, 1.0 green
  // 0.0, 0.0, 1.0, 1.0 blue
  // 1.0, 0.92, 0.016, 1.0 yellow


  triangles.forEach(({ vertices, color }) => {
    drawTrianglesColor(vertices, color);
  });
}

function drawTrianglesColor(vertices, color) {
  const n = 3; 

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  return n;
}

function click(ev) {
  let [x, y] = connectCoordinatesEventToGL(ev);
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle;
    point.segments = g_selectedSegment;
  }
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);
  renderAllShapes();
}

function connectCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return ([x,y]);
}

function renderAllShapes(){
  var startTime = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT);
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " +  htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

