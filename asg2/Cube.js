class Cube {
    constructor() {
      this.type = 'cube';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
    }

    render() {
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      drawCube(this.matrix, this.color);
    }
}

function drawCube(M, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  drawTriangles3D([0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0]);
  drawTriangles3D([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0]);
  drawTriangles3D([0.0, 0.0, -1.0,  1.0, 1.0, -1.0,  1.0, 0.0, -1.0]);
  drawTriangles3D([0.0, 0.0, -1.0,  0.0, 1.0, -1.0,  1.0, 1.0, -1.0]);
  drawTriangles3D([1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, -1.0]);
  drawTriangles3D([1.0, 0.0, 0.0,  1.0, 0.0, -1.0,  1.0, 1.0, -1.0]);
  drawTriangles3D([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, -1.0]);
  drawTriangles3D([0.0, 0.0, 0.0,  0.0, 0.0, -1.0,  0.0, 1.0, -1.0]);
  drawTriangles3D([0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, -1.0]);
  drawTriangles3D([0.0, 1.0, 0.0,  0.0, 1.0, -1.0,  1.0, 1.0, -1.0]);
  drawTriangles3D([0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, -1.0]);
  drawTriangles3D([0.0, 0.0, 0.0,  0.0, 0.0, -1.0,  1.0, 0.0, -1.0]);
}