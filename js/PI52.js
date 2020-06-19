import * as THREE from './three/build/three.module.js';

import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { DeviceOrientationControls } from './three/examples/jsm/controls/DeviceOrientationControls.js';

var renderer, scene, camera, controls, angle, timer, finished = false,
    hasGyro = false,
    request = false,
    gyro = false,
    textureOut, firstTime = true,
    rx = 0,
    ry = 0,
    deviceCon, boxMesh;

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

var hiddenDiv = document.getElementById("overlay");
try {
    if (typeof(DeviceMotionEvent.requestPermission) === "function") {
        //document.getElementById("text").innerHTML = DeviceMotionEvent.requestPermission().response;
        DeviceMotionEvent.requestPermission().then(response => {
            if (response == "granted") {
                init();
                animate();
            }
        }).catch(request = true);

    } else {
        init();
        animate();
    }
} catch (e) {
    init();
    animate();
}

if (request) {
    hiddenDiv.style.display = "block";
    var startButton = document.getElementById('startButton');
    startButton.addEventListener('click', function() {
        init();
        animate();
    }, false);
}


function init() {
    var overlay = document.getElementById('overlay');
    overlay.remove();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 1.25);
    scene.add(camera);

    var box = new THREE.BoxBufferGeometry(1, 1, 1);
    var mat = new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
    boxMesh = new THREE.Mesh(box, mat);
    boxMesh.position.set(0, 0, 0);
    scene.add(boxMesh);
    boxMesh.visible = false;

    deviceCon = new DeviceOrientationControls(boxMesh);

    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render);
    controls.minDistance = 1.5;
    controls.maxDistance = 1.5;
    controls.minPolarAngle = Math.PI / 4; // radians
    controls.maxPolarAngle = Math.PI * 3 / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.update();

    const manager = new THREE.LoadingManager();

    manager.onProgress = function(item, loaded, total) {
        //console.log(item, loaded, total);
    };

    manager.onLoad = function(item, loaded, total) {
        finished = true;
        var loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.remove();
        }, 1000);

    }

    var light = new THREE.SpotLight(0xffffff, 3);

    light.position.set(-1, 2, 2);
    light.penumbra = 0;
    light.decay = 1;
    light.distance = 50; //default; light shining from top
    light.castShadow = true;
    light.angle = 1;
    scene.add(light);

    light.shadow.mapSize.width = 2048 * 4; // default
    light.shadow.mapSize.height = 2048 * 4; // default
    light.shadow.camera.near = 1; // default
    light.shadow.camera.far = 200;

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('studio3.hdr', function(texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;

            var loader = new GLTFLoader(manager).setPath('assets/PI52/');

            var textureLoader = new THREE.TextureLoader();

            textureOut = textureLoader.load('assets/PI52/texture.png');
            textureOut.rotation = 0.1;
            textureOut.center.set(0.5, 0.5);

            textureOut.repeat.set(1, 1);

            loader.load('PI52.glb', loadObj);

            function loadObj(gltf) {
                var meshFrame = gltf.scene.getObjectByName("Cube");
                meshFrame.traverse((o) => {
                    if (o.isMesh) {
                        o.castShadow = true;
                    }
                });
                var meshIn = gltf.scene.getObjectByName("Plane");
                meshIn.traverse((o) => {
                    if (o.isMesh) {
                        o.material.map = textureOut;
                        o.receiveShadow = true;
                    }
                });
                scene.add(meshFrame);
                scene.add(meshIn);

            }
        });

    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 1.5);
    var groundMat = new THREE.ShadowMaterial();
    groundMat.opacity = 0.1;

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.z = -0.02;
    ground.receiveShadow = true;
    ground.rotation.z = -Math.PI / 2;
    scene.add(ground);

    var ambient = new THREE.AmbientLight(0xff1111);
    scene.add(ambient);
    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener("deviceorientation", () => {
        clearTimeout(timer);
        hasGyro = true;
        timer = setTimeout(() => {
            hasGyro = false;
            gyro = true;
        }, 2000)
    }, false);

}

function animate() {
    if (finished) {
        if (isMobile.any()) {
            var alpha = boxMesh.rotation.y;
            //if (alpha < 0) alpha = alpha + 2*Math.PI;
            var beta = boxMesh.rotation.x;
            //if (beta < 0) beta = beta + 2*Math.PI;
            if (firstTime) {
                rx = alpha;
                ry = beta;
                firstTime = false;
            }

            if (Math.abs(rx - alpha) < Math.PI / 2 && Math.abs(ry - beta) < Math.PI / 6) {
                controls.setPolarAngle(rx - alpha);
                controls.setAzimuthalAngle(ry - beta);
            }
            console.log(rx, ry);

            rx = alpha;
            ry = beta;

        }
        if (finished) {
            angle = controls.getAzimuthalAngle();
            textureOut.rotation = angle * 0.9 + Math.PI / 2;
            //var temp = map(angle, -Math.PI / 4, Math.PI / 4, 0.4, 1);
            //var temp2 = map(angle, Math.PI / 4, -Math.PI / 4, 1, 0.4);
            //textureOut.repeat.set(temp, temp2);
        }
        if (!hasGyro) {
            if (gyro) {
                controls.enabled = true;
                gyro = false;
            }
        } else {
            controls.enabled = false;
        }
        deviceCon.update();
        controls.update();
    }
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