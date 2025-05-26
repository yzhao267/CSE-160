class Sphere {
    constructor() {
      this.type = 'cube';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -1;
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        if (this.textureNum == null || this.textureNum === -999) {
            gl.uniform1i(u_whichTexture, -999); 
        } else {
            gl.uniform1i(u_whichTexture, this.textureNum);
        }
        var d=Math.PI/10;
        var dd=Math.PI/10;
        for (let t = 0; t < Math.PI; t += d) {
            for (let r = 0; r < 2 * Math.PI; r += d) {
                var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
                var p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
                var p3 = [Math.sin(t) * Math.cos(r + d), Math.sin(t) * Math.sin(r + d), Math.cos(t)];
                var p4 = [Math.sin(t + dd) * Math.cos(r + d), Math.sin(t + dd) * Math.sin(r + d), Math.cos(t + dd)];
                var uv1 = [t/Math.PI, r/2 * Math.PI];
                var uv2 = [(t + dd)/Math.PI, r/2 * Math.PI];
                var uv3 = [t/Math.PI, r+dd/2 * Math.PI];
                var uv4 = [(t + dd)/Math.PI, r+dd/2 * Math.PI];
                let v = [];
                let uv = [];
                v = v.concat(p1); uv = uv.concat(uv1);
                v = v.concat(p2); uv = uv.concat(uv2);
                v = v.concat(p4); uv = uv.concat(uv4);
                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUVNormal(v, uv, v);
                v = [];
                uv = [];
                v = v.concat(p1); uv = uv.concat(uv1);
                v = v.concat(p4); uv = uv.concat(uv4);
                v = v.concat(p3); uv = uv.concat(uv3);
                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUVNormal(v, uv, v);
            }
        } 
    }
}     
