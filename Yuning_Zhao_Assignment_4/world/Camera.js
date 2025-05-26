class Camera {
    constructor() {
      this.eye = new Vector3([-0.2, 1.5, 4.5]);
      this.at = new Vector3([-0.15, 1.65, -100]);
      this.up = new Vector3([0, 1, 0]);
    }
  
    rotate(angleDeg) {
      let angleRad = angleDeg * (Math.PI / 180);
      let dirX = this.at.elements[0] - this.eye.elements[0];
      let dirZ = this.at.elements[2] - this.eye.elements[2];
      let newX = dirX * Math.cos(angleRad) - dirZ * Math.sin(angleRad);
      let newZ = dirX * Math.sin(angleRad) + dirZ * Math.cos(angleRad);
      this.at.elements[0] = this.eye.elements[0] + newX;
      this.at.elements[2] = this.eye.elements[2] + newZ;
    }
  
    moveForward(speed) {
      let forward = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
      ]);
      forward.normalize();
      forward.mul(speed);
      this.eye.add(forward);
      this.at.add(forward);
    }
  
    moveRight(speed) {
      let dir = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
    ]);
      let right = Vector3.cross(dir, this.up);
      right.normalize();
      right.mul(speed);
      this.eye.add(right);
      this.at.add(right);
    }

    moveLeft(speed) {
      this.moveRight(-speed);
    }

    moveUp(d) {
      this.eye.elements[1] += d;
      this.at.elements[1] += d;
    }

    moveDown(d) {
      this.eye.elements[1] -= d;
      this.at.elements[1] -= d;
    }

    getViewMatrix() {
      let view = new Matrix4();
      view.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
      return view;
    }
  }
  