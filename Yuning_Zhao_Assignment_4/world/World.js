var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV; 
    v_Normal = a_Normal; 
    v_VertPos = u_ModelMatrix * a_Position;
  }`

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform vec3 u_lightPos;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform int u_whichTexture;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      gl_FragColor = vec4(1.0); 
    }
    vec3 lightVector = vec3(v_VertPos)-u_lightPos;
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    vec3 R = reflect(-L, N);
    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));
    float specular = pow(max(dot(E, R), 0.0), 20.0);
    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.2;
    if (u_lightOn) {
      if (u_whichTexture == -1) {
        gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
      } else {
        gl_FragColor = vec4(diffuse+ambient, 1.0);
      }
      
    } 
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
let camera = new Camera();
let a_Normal;
let u_lightPos;
let u_lightOn;
let u_cameraPos;

function setUpWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE)
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

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
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

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
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
let g_NormalsOn = false;
let g_lightPos = [0, 1, 2];
let g_lightAnimation = true;
let g_lightOn = true;

function addActionsForHtmlUI() {
  document.getElementById('normalOn').onclick = function() {g_NormalsOn = true; renderScene();};
  document.getElementById('normalOff').onclick = function() {g_NormalsOn = false; renderScene();};
  document.getElementById('lightsOn').onclick = function() {g_lightOn = true;};
  document.getElementById('lightsOff').onclick = function() {g_lightOn = false;};
  document.getElementById('lightAnimationOn').onclick = function() {g_lightAnimation = true;};
  document.getElementById('lightAnimationOff').onclick = function() {g_lightAnimation = false;}
  document.getElementById('angleSlide').addEventListener('mousemove', function ()  {g_globalAngle = this.value; renderScene(); });
  document.getElementById('lightslideX').addEventListener('mousemove', function () {g_lightPos[0] = this.value/100; renderScene(); });
  document.getElementById('lightslideY').addEventListener('mousemove', function () {g_lightPos[1] = this.value/100; renderScene(); });
  document.getElementById('lightslideZ').addEventListener('mousemove', function () {g_lightPos[2] = this.value/100; renderScene(); });

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
  updateAnimationAngles();
  renderScene();
  measurePerformance()
  requestAnimationFrame(tick);
}

function click(ev) {
  renderScene();
}

function keydown(ev) {
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
  renderScene();
}

function updateAnimationAngles() {
  if (g_lightAnimation) {
    g_lightPos[0] = Math.cos(g_seconds) * 2;
  }
}

function measurePerformance() {
  let currentTime = performance.now();
  let frameTime = currentTime - g_lastFrameTime;
  g_lastFrameTime = currentTime;

  let fps = Math.floor(1000 / frameTime); 
  sendTextToHTML(`FPS: ${fps}`, "performanceIndicator"); 
}

function drawCamel() {
  var body = new Cube();
  body.textureNum = -2;
  body.color = [1.0, 0.65, 0.0, 1.0]; 
  body.matrix.translate(-0.6, -0.4, 0.4);
  body.matrix.scale(1.2, 0.3, 0.4);
  body.renderFaster(); 

  var neck = new Cube();
  neck.textureNum = -2;
  neck.color = [1.0, 0.65, 0.0, 1.0];
  neck.matrix.setTranslate(-0.6, -0.1, 0.3);
  neck.matrix.scale(0.2, 0.5, 0.2);
  neck.renderFaster(); 
  
  var head = new Cube();
  head.textureNum = -2;
  head.color = [1.0, 0.65, 0.0, 1.0];
  head.matrix.setTranslate(-0.4, 0.4, 0.3);
  head.matrix.scale(-0.3, 0.2, 0.2);
  head.renderFaster(); 

  var nose = new Cube();
  nose.textureNum = -2;
  nose.color = [0.5, 0.5, 0.5, 1.0];
  nose.matrix.setTranslate(-0.7, 0.4, 0.3);
  nose.matrix.scale(-0.15, 0.125, 0.2);
  nose.renderFaster(); 

  var ear1 = new Cube();
  ear1.textureNum = -2;
  ear1.color = [1.0, 0.65, 0.0, 1.0];
  ear1.matrix.setTranslate(-0.5, 0.6, 0.3);
  ear1.matrix.scale(0.05, 0.05, 0.2);
  ear1.renderFaster(); 

  var ear2 = new Cube();
  ear2.textureNum = -2;
  ear2.color = [1.0, 0.65, 0.0, 1.0];
  ear2.matrix.setTranslate(-0.6, 0.6, 0.3);
  ear2.matrix.scale(0.05, 0.05, 0.2);
  ear2.renderFaster(); 

  var hump1 = new Cube();
  hump1.textureNum = -2;
  hump1.color = [1.0, 0.65, 0.0, 1.0];
  hump1.matrix.setTranslate(-0.0, -0.1, 0.3);
  hump1.matrix.scale(-0.3, 0.3, 0.2);
  hump1.renderFaster(); 

  var hump2 = new Cube();
  hump2.textureNum = -2;
  hump2.color = [1.0, 0.65, 0.0, 1.0];
  hump2.matrix.setTranslate(0.4, -0.1, 0.3);
  hump2.matrix.scale(-0.3, 0.3, 0.2);
  hump2.renderFaster(); 

  var smallhump1 = new Cube();
  smallhump1.textureNum = -2;
  smallhump1.color = [1.0, 0.65, 0.0, 1.0];
  smallhump1.matrix.setTranslate(-0.25, 0.2, 0.3);
  smallhump1.matrix.scale(0.2, 0.15, 0.2);
  smallhump1.renderFaster(); 

  var smallhump2 = new Cube();
  smallhump2.textureNum = -2;
  smallhump2.color = [1.0, 0.65, 0.0, 1.0];
  smallhump2.matrix.setTranslate(0.15, 0.2, 0.3);
  smallhump2.matrix.scale(0.2, 0.15, 0.2);
  smallhump2.renderFaster(); 
  
  var upperLeg1 = new Cube();
  upperLeg1.textureNum = -2;
  upperLeg1.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg1.matrix.translate(-0.5, -0.55, 0.4);
  upperLeg1.matrix.scale(0.2, 0.35, 0.1);
  upperLeg1.renderFaster(); 
  
  var lowerLeg1 = new Cube();
  lowerLeg1.textureNum = -2;
  lowerLeg1.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg1.matrix.translate(-0.4, -0.85, 0.4); 
  lowerLeg1.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg1.matrix.translate(-.5,0,-.001);
  lowerLeg1.renderFaster()

  var upperLeg2 = new Cube();
  upperLeg2.textureNum = -2;
  upperLeg2.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg2.matrix.translate(-0.5, -0.55, 0.1);
  upperLeg2.matrix.scale(0.2, 0.35, 0.1);
  upperLeg2.renderFaster(); 
  
  var lowerLeg2 = new Cube();
  lowerLeg2.textureNum = -2;
  lowerLeg2.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg2.matrix.translate(-0.4, -0.85, 0.1); 
  lowerLeg2.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg2.matrix.translate(-.5,0,-.001);
  lowerLeg2.renderFaster()
  
  var upperLeg3 = new Cube();
  upperLeg3.textureNum = -2;
  upperLeg3.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg3.matrix.translate(0.3, -0.55, 0.4);
  upperLeg3.matrix.scale(0.2, 0.35, 0.1);
  upperLeg3.renderFaster(); 
  
  var lowerLeg3 = new Cube();
  lowerLeg3.textureNum = -2;
  lowerLeg3.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg3.matrix.translate(0.4, -0.85, 0.4); 
  lowerLeg3.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg3.matrix.translate(-.5,0,-.001);
  lowerLeg3.renderFaster()

  var upperLeg4 = new Cube();
  upperLeg4.textureNum = -2;
  upperLeg4.color = [1.0, 0.65, 0.0, 1.0]; 
  upperLeg4.matrix.translate(0.3, -0.55, 0.1);
  upperLeg4.matrix.scale(0.2, 0.35, 0.1);
  upperLeg4.renderFaster(); 
  
  var lowerLeg4 = new Cube();
  lowerLeg4.textureNum = -2;
  lowerLeg4.color = [0.5, 0.5, 0.5, 1.0];
  lowerLeg4.matrix.translate(0.4, -0.85, 0.1); 
  lowerLeg4.matrix.scale(0.1, 0.3, 0.1);
  lowerLeg4.matrix.translate(-.5,0,-.001);
  lowerLeg4.renderFaster()

  var tail1 = new Cube();
  tail1.textureNum = -2;
  tail1.color = [1.0, 0.65, 0.0, 1.0]; 
  tail1.matrix.translate(0.6, -0.3, 0.2);
  var Tail1Coordinates = new Matrix4(tail1.matrix); 
  tail1.matrix.scale(0.2, 0.1, 0.1);
  tail1.matrix.translate(-0.25, 0, -.001);
  tail1.renderFaster();

  var tail2 = new Cube();
  tail2.textureNum = -2;
  tail2.color = [0.5, 0.5, 0.5, 1.0];
  tail2.matrix.set(Tail1Coordinates);  
  tail2.matrix.translate(0.15, 0.0, 0.01);  
  tail2.matrix.scale(0.2, 0.1, 0.1); 
  tail2.renderFaster();
}

function renderScene(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var ProjMat= new Matrix4();
  ProjMat.setPerspective(60, canvas.width/canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, ProjMat.elements);

  var ViewMat = camera.getViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, ViewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_xRotation, 1, 0, 0); 
  globalRotMat.rotate(g_yRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos, camera.eye.x, camera.eye.y, camera.eye.z);
  gl.uniform1i(u_lightOn, g_lightOn);

  var light = new Cube();
  light.textureNum = -2;
  light.color = [2,2,0,1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.1,-.1,-.1);
  light.matrix.translate(0.25, 1.0, 10.0);
  light.renderFaster();

  var sphere1 = new Sphere();
  sphere1.textureNum = -1;
  if (g_NormalsOn) {
    sphere1.textureNum = -3;
  }
  sphere1.matrix.translate(0, 2, 0);
  sphere1.matrix.scale(0.75, 0.75, 0.75);
  sphere1.render();

  var sphere2 = new Sphere();
  sphere2.textureNum = -1;
  if (g_NormalsOn) {
    sphere2.textureNum = -3;
  }
  sphere2.matrix.translate(-3, 2, 0);
  sphere2.matrix.scale(0.75, 0.75, 0.75);
  sphere2.render();

  var sphere3 = new Sphere();
  sphere3.textureNum = -1;
  if (g_NormalsOn) {
    sphere3.textureNum = -3;
  }
  sphere3.matrix.translate(3, 2, 0);
  sphere3.matrix.scale(0.75, 0.75, 0.75);
  sphere3.render();
  
  var world = new Cube();
  world.textureNum = -2;
  if (g_NormalsOn) {
    world.textureNum = -3;
  }
  world.color = [0.5, 0.5, 0.5, 1];
  world.matrix.scale(10, 10, 10);
  world.matrix.translate(-0.5, -0.08, 0.85);
  world.renderFaster();
  drawCamel();

}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
      console.log("Failed to get " +  htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text;
  }
  