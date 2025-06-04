import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

function setupCamera(canvas) {
    const fov = 75;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-15, 0, 0);
    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
            this.obj = obj;
            this.minProp = minProp;
            this.maxProp = maxProp;
            this.minDif = minDif;
        }
        get min() {
            return this.obj[this.minProp];
        }
        set min(v) {
            this.obj[this.minProp] = v;
            this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }
        get max() {
            return this.obj[this.maxProp];
        }
        set max(v) {
            this.obj[this.maxProp] = v;
            this.min = this.min;
        }
    }
    const gui = new GUI();
    gui.add(camera, 'fov', 1, 180).onChange(() => camera.updateProjectionMatrix());
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(() => camera.updateProjectionMatrix());
    gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(() => camera.updateProjectionMatrix());
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();
    return { camera, controls };
}

function Skybox(scene) {
    const loader = new THREE.TextureLoader();
    const skyTexture = loader.load('sky.jpg');
    const desertWallTexture = loader.load('desert_wall.jpg');
    const groundTexture = loader.load('desert.jpg');
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    const materials = [
        new THREE.MeshBasicMaterial({ map: desertWallTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: desertWallTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), 
        new THREE.MeshBasicMaterial({ map: groundTexture, side: THREE.BackSide }), 
        new THREE.MeshBasicMaterial({ map: desertWallTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: desertWallTexture, side: THREE.BackSide }),
    ];
    const skyboxGeometry = new THREE.BoxGeometry(50, 20, 50);
    const skybox = new THREE.Mesh(skyboxGeometry, materials);
    scene.add(skybox);
}

function drawCamel(scene) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('Camel/camel.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('Camel/camel_base.obj', (object) => {
            object.position.set(-5, -10, -4);
            scene.add(object);

            const camel2 = object.clone(true);
            camel2.position.set(-3, -10, 4);
            camel2.rotation.y = 180;
            scene.add(camel2);

            const camel3 = object.clone(true);
            camel3.position.set(-1, -10, 0);
            camel3.rotation.y = 90;
            scene.add(camel3);

            const camel4 = object.clone(true);
            camel4.position.set(0, -10, -3);
            camel4.rotation.y = 0;
            scene.add(camel4);

            const camel5 = object.clone(true);
            camel5.position.set(1, -10, 2);
            camel5.rotation.y = 120;
            scene.add(camel5);
        });
    });
}

function drawPyramid(scene) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('Pyramid/pyramid.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('Pyramid/pyramid_base.obj', (object) => {
            object.position.set(15, -10, 0);
            object.scale.set(10, 10, 10);
            scene.add(object);
        });
    });
}

function drawSphinx(scene) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('Sphinx/sphinx.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('Sphinx/sphinx_base.obj', (object) => {
            object.position.set(4, -10, -5);
            object.scale.set(5, 5, 5);
            object.rotation.y = 180;
            scene.add(object);

            const sphinx2 = object.clone(true);
            sphinx2.position.set(4, -10, 5);
            sphinx2.rotation.y = 180;
            scene.add(sphinx2);
        });
    });
}

function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    const { camera, controls } = setupCamera(canvas);
    const scene = new THREE.Scene();

    const radiusTop = 0.5;
    const radiusBottom = 0.5;  
    const height = 2; 
    const radialSegments = 32;  
    const textureLoader = new THREE.TextureLoader();
    const cactusTexture = textureLoader.load('cactus.jpg');
    const cylinderGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    const cylinderMaterial = new THREE.MeshStandardMaterial({ map: cactusTexture });
    const cactus = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus.position.set(-20, -9, 16);
    scene.add(cactus);

    const cactus2 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus2.position.set(-20, -9, 8);
    scene.add(cactus2);

    const cactus3 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus3.position.set(-20, -9, 0);
    scene.add(cactus3);

    const cactus4 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus4.position.set(-20, -9, -8);
    scene.add(cactus4);

    const cactus5 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus5.position.set(-15, -9, 0);
    scene.add(cactus5);

    const cactus6 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus6.position.set(-15, -9, -10);
    scene.add(cactus6);

    const cactus7 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus7.position.set(2, -9, -10);
    scene.add(cactus7);

    const cactus8 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus8.position.set(2, -9, 10);
    scene.add(cactus8);

    const cactus9 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus9.position.set(-15, -9, 10);
    scene.add(cactus9);

    const cactus10 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cactus10.position.set(-20, -9, -16);
    scene.add(cactus10);

    const textureLoader1 = new THREE.TextureLoader();
    const tumbleweedTexture = textureLoader1.load('tumbleweed.jpg');
    const sphereRadius = 0.5;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry( sphereRadius, sphereWidthDivisions, sphereHeightDivisions );
    const sphereMat = new THREE.MeshPhongMaterial( { map: tumbleweedTexture } );
    const mesh = new THREE.Mesh( sphereGeo, sphereMat );
    mesh.position.set(10, 3, -15);
    scene.add(mesh);

    const tumbleweed2 = mesh.clone();
    tumbleweed2.position.set(-10, 3, -15);
    scene.add(tumbleweed2);

    const geometry = new THREE.BoxGeometry(2, 2, 2); 
    const material = new THREE.MeshStandardMaterial({ color: 0xA68D5D }); 
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(10, -9, 15);
    scene.add(cube);

    const cube2 = cube.clone();
    cube2.position.set(10, -9, -15);
    scene.add(cube2);

    Skybox(scene);
    drawCamel(scene);
    drawPyramid(scene);
    drawSphinx(scene);

    const light = new THREE.DirectionalLight(0xFFFFFF, 3);
    light.position.set(0, 2, 4);
    scene.add(light);
    
    const hemisphereLight = new THREE.HemisphereLight(0xFFA500, 0x442200, 0.6);
    scene.add(hemisphereLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    function render(time) {
        time *= 0.001;
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        const radius = 10;
        const tumbleweedX = Math.sin(time) * 2 * radius;
        const tumbleweedZ = -Math.sin(time) * 2 * radius; 
        mesh.position.set(-8, -9.5, tumbleweedX);
        tumbleweed2.position.set(-10, -9.5, tumbleweedZ);

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
main();