import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { DragControls } from './three/examples/jsm/controls/DragControls.js';
import { DeviceOrientationControls } from './three/examples/jsm/controls/DeviceOrientationControls.js';

const thres = 0.040;

var container, controls, dragCon;
var camera, scene, renderer, objects = [], dx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempz, tempy, tempx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], dx, indexSel = 0, finished = false, dragged = false;
var inertia = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], right = [false, false, false, false, false, false, false, false, false, false, false, false, false]
let objMin = -0.24;
let objMax = 0.24;

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

if (isMobile.any()) {
    initMobile();
    animateMobile();
} else{
    init();
    animate();
}


function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 0, 10);
    scene = new THREE.Scene();
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);
    var light = new THREE.SpotLight(0xffffff, 1);

    light.position.set(0, 1, 2);
    light.penumbra = 0;
    light.decay = 1;
    light.distance = 50;		//default; light shining from top
    light.castShadow = true;
    light.angle = 2;
    scene.add(light);

    light.shadow.mapSize.width = 2048 * 4;  // default
    light.shadow.mapSize.height = 2048 * 4; // default
    light.shadow.camera.near = 1;    // default
    light.shadow.camera.far = 200;


    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('studio8_4k.hdr', function (texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();

            //

            // model

            // use of RoughnessMipmapper is optional


            var loader = new GLTFLoader().setPath('assets/');
            var queue = ['CDM7_1.glb', 'CDM7_2.glb', 'CDM7_3.glb', 'CDM7_4.glb', 'CDM7_5.glb', 'CDM7_6.glb', 'CDM7_7.glb', 'CDM7_8.glb', 'CDM7_9.glb', 'CDM7_10.glb', 'CDM7_11.glb', 'CDM7_12.glb', 'CDM7_13.glb']
            loadQueue();
            function loadQueue() {
                if (queue.length == 0) {
                    finished = true;
                    return;
                }
                var name = queue.shift();
                loader.load(name, function (gltf) {
                    //gltf.material = material;
                    var model = gltf.scene.children[0];
                    model.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            //child.receiveShadow = true;
                        }
                    });
                    scene.add(model);
                    objects.push(model);
                    loadQueue();
                });

            }

        });
    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 1.5);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff, dithering: true });
    groundMat.emissiveIntensity = 1;
    //groundMat.color.setHSL(1, 1, 1);

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.5;
    ground.position.z = -0.04;
    ground.rotation.z = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('onclick', animate); // use if there is no animation loop
    controls.minDistance = 3;
    controls.maxDistance = 5;
    controls.minPolarAngle = Math.PI / 2; // radians
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = - Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.update();

    dragCon = new DragControls(objects, camera, renderer.domElement);
    dragCon.addEventListener('dragstart', function (event) {
        tempz = event.object.position.z;
        tempy = event.object.position.y;
        controls.enabled = false;
        indexSel = objects.indexOf(event.object);
    });
    dragCon.addEventListener('dragend', function (event) {
        controls.enabled = true;
        dragged = true;
    });
    dragCon.addEventListener('drag', function (event) {
        event.object.position.y = tempy
        event.object.position.z = tempz;
    });


    window.addEventListener('resize', onWindowResize, false);
}

function initMobile() {

    
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 0, 10);
    scene = new THREE.Scene();
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);
    var light = new THREE.SpotLight(0xffffff, 1);

    light.position.set(0, 1, 2);
    light.penumbra = 0;
    light.decay = 1;
    light.distance = 50;		//default; light shining from top
    light.castShadow = true;
    light.angle = 2;
    scene.add(light);

    light.shadow.mapSize.width = 2048 * 4;  // default
    light.shadow.mapSize.height = 2048 * 4; // default
    light.shadow.camera.near = 1;    // default
    light.shadow.camera.far = 200;


    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('studio8_4k.hdr', function (texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();

            //

            // model

            // use of RoughnessMipmapper is optional


            var loader = new GLTFLoader().setPath('assets/');
            var queue = ['CDM7_1.glb', 'CDM7_2.glb', 'CDM7_3.glb', 'CDM7_4.glb', 'CDM7_5.glb', 'CDM7_6.glb', 'CDM7_7.glb', 'CDM7_8.glb', 'CDM7_9.glb', 'CDM7_10.glb', 'CDM7_11.glb', 'CDM7_12.glb', 'CDM7_13.glb']
            loadQueue();
            function loadQueue() {
                if (queue.length == 0) {
                    finished = true;
                    return;
                }
                var name = queue.shift();
                loader.load(name, function (gltf) {
                    //gltf.material = material;
                    var model = gltf.scene.children[0];
                    model.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            //child.receiveShadow = true;
                        }
                    });
                    scene.add(model);
                    objects.push(model);
                    loadQueue();
                });

            }

        });
    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 1.5);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff, dithering: true });
    groundMat.emissiveIntensity = 1;
    //groundMat.color.setHSL(1, 1, 1);

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.5;
    ground.position.z = -0.04;
    ground.rotation.z = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    controls = new DeviceOrientationControls( camera );

    dragCon = new DragControls(objects, camera, renderer.domElement);
    dragCon.addEventListener('dragstart', function (event) {
        tempz = event.object.position.z;
        tempy = event.object.position.y;
        controls.enabled = false;
        indexSel = objects.indexOf(event.object);
    });
    dragCon.addEventListener('dragend', function (event) {
        controls.enabled = true;
        dragged = true;
    });
    dragCon.addEventListener('drag', function (event) {
        event.object.position.y = tempy
        event.object.position.z = tempz;
    });

    window.addEventListener('resize', onWindowResize, false);


}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePos() {

    let counter = indexSel;

    objects.forEach(loop);

    function loop(item, index) {
        if (item.position.x > objMax) {
            item.position.x = objMax;
            inertia[index] = -0.5 * inertia[index];
        }
        if (item.position.x < objMin) {
            item.position.x = objMin;
            inertia[index] = -0.5 * inertia[index];
        }
        if (dragged) {
            inertia[index] = dx[index];
        }
        dx[index] = tempx[index] - item.position.x;
        tempx[index] = item.position.x;
        if (!dragged) {
            item.position.x = item.position.x - inertia[index];
            inertia[index] = inertia[index] / 1.15;
            if (inertia[index] < 0.00000001 && inertia[index] > 0) {
                inertia[index] = 0;
            }
        }
    }
    if (dragged) {
        dx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        dragged = false;
    }
    while (counter > 0) {


        if (counter > 0) {
            if (Math.abs(objects[counter - 1].position.x - objects[counter].position.x) > thres) {
                if (objects[counter - 1].position.x > objects[counter].position.x) {
                    objects[counter - 1].position.x = objects[counter].position.x + thres;
                }
                else {
                    objects[counter - 1].position.x = objects[counter].position.x - thres;
                }

            }
        }
        counter -= 1;
    }
    counter = indexSel;
    while (counter < 12) {
        if (counter < 12) {
            if (Math.abs(objects[counter + 1].position.x - objects[counter].position.x) > thres) {
                if (objects[counter + 1].position.x > objects[counter].position.x) {
                    objects[counter + 1].position.x = objects[counter].position.x + thres;
                }
                else {
                    objects[counter + 1].position.x = objects[counter].position.x - thres;
                }

            }
        }
        counter += 1;

    }
}

function animate() {
    controls.update();
    window.requestAnimationFrame(animate);
    if (finished) updatePos();
    camera.lookAt(0, 0.45, 0);
    renderer.render(scene, camera);
}

function animateMobile() {
    controls.update();
    window.requestAnimationFrame(animateMobile);
    if (finished) updatePos();
    renderer.render(scene, camera);
}