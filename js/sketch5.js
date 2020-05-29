import * as THREE from './three/build/three.module.js';

import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';

var renderer, scene, camera, controls, angle, finished = false, textureOut;

init();


function init() {

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(1, 0, 0);
    scene.add(camera);


    var ambient = new THREE.AmbientLight(0x111111);
    //scene.add(ambient);

    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render);
    controls.minDistance = 3;
    controls.maxDistance = 5;
    controls.minPolarAngle = Math.PI / 2; // radians
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = Math.PI/6;
    controls.maxAzimuthAngle = Math.PI*5/6;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.update();



    var manager = new THREE.LoadingManager();

    manager.onProgress = function (item, loaded, total) {

        //console.log(item, loaded, total);

    };

    manager.onLoad = function (item, loaded, total) {

        finished = true;
    }

    // texture





    // model

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('photo_studio_01_2k.hdr', function (texture) {
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;
            var loader = new GLTFLoader(manager).setPath('assets/');

            var textureLoader = new THREE.TextureLoader();
        


            textureOut = textureLoader.load('assets/test5.png');
            textureOut.rotation = 0;
            textureOut.center.set(0.5, 0.5);

            
            textureOut.repeat.set(0.9, 1);

            loader.load('IrisGradient.glb', loadObj);
            function loadObj(gltf) {
                
                var transparent = new THREE.MeshPhysicalMaterial( {
                    color: new THREE.Color(0xffffff),
                    //envMapIntensity: 5,
					metalness: 0,
					roughness: 1,
					alphaTest: 0.1,
					depthWrite: false,
					transparency: 0.5, // use material.transparency for glass materials
					opacity: 1,                        // set material.opacity to 1 when material.transparency is non-zero
					transparent: true
				} );

                var meshFrame = gltf.scene.children[0];
                var meshIn = gltf.scene.children[1];
                meshIn.traverse((o) => {
                    if (o.isMesh) {
                        // note: for a multi-material mesh, `o.material` may be an array,
                        // in which case you'd need to set `.map` on each value.
                        o.material.map = textureOut;
                    }
                });
                scene.add(meshFrame);
                scene.add(meshIn);
            }

            animate();

        }
        );

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();


    window.addEventListener('resize', onWindowResize, false);

}

function animate() {
    
    angle = controls.getAzimuthalAngle();
    //textureOut.rotation = angle+0.5;
    var temp = map(angle, 0, Math.PI, 0.1, 1);
    var temp2 = map(angle, 0, Math.PI, 1, 0.1);
    //textureOut.repeat.set(temp, temp2);
    controls.update();
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}


function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

