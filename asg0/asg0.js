// DrawRectangle.js

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(200, 200); 
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20); 
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
               
  var ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 400, 400);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
  var x1 = parseFloat(document.getElementById("xInput1").value);
  var y1 = parseFloat(document.getElementById("yInput1").value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  var x2 = parseFloat(document.getElementById("xInput2").value);
  var y2 = parseFloat(document.getElementById("yInput2").value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  if (!canvas) {
      console.log('Failed to retrieve the <canvas> element');
      return;
  }

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 400, 400);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
  
  var x1 = parseFloat(document.getElementById("xInput1").value);
  var y1 = parseFloat(document.getElementById("yInput1").value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  var x2 = parseFloat(document.getElementById("xInput2").value);
  var y2 = parseFloat(document.getElementById("yInput2").value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");

  var operation = document.getElementById("operation").value;
  var scalar = parseFloat(document.getElementById("scalarInput").value);

  if (operation === "add") {
    var v3 = new Vector3([...v1.elements]);
    v3.add(v2);  
    drawVector(v3, "green");
  } else if (operation === "sub") {
    var v3 = new Vector3([...v1.elements]);
    v3.sub(v2);  
    drawVector(v3, "green");
  } else if (operation === "mul") {
    var v3 = new Vector3([...v1.elements]);
    v3.mul(scalar); 
    drawVector(v3, "green");
    var v4 = new Vector3([...v2.elements]);
    v4.mul(scalar);  
    drawVector(v4, "green");
  } else if (operation === "div") {
    if (scalar !== 0) {
      var v3 = new Vector3([...v1.elements]);
      v3.div(scalar); 
      drawVector(v3, "green");
      var v4 = new Vector3([...v2.elements]);
      v4.div(scalar);  
      drawVector(v4, "green");
    }
  } else if (operation == "magnitude") {
    var v3 = new Vector3([...v1.elements]);
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
  } else if (operation == "normalize") {
    v1.normalize();
    v2.normalize();
    drawVector(v1, "green");
    drawVector(v2, "green");
  } else if (operation == "Angle Between") {
    console.log("Angle:", angleBetween(v1, v2));
  } else if (operation == "Area") {
    console.log("Area of the triangle:", areaTriangle(v1, v2));
  }
}

function angleBetween(v1, v2) {
  var dotProduct = Vector3.dot(v1, v2);
  var V1Magnitude = v1.magnitude();
  var V2Magnitude = v2.magnitude();
  var cosTheta = dotProduct / (V1Magnitude * V2Magnitude);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  var angle = Math.acos(cosTheta);
  var angleinDegrees = angle * (180 / Math.PI);
  return angleinDegrees;
}

function areaTriangle(v1, v2) {
  var crossProduct = Vector3.cross(v1, v2);
  var magnitude = Math.sqrt(
      crossProduct.elements[0]**2 +
      crossProduct.elements[1]**2 + 
      crossProduct.elements[2]**2
  );
  var area = magnitude / 2;
  return area;
}

function main() {
  handleDrawEvent();
}
