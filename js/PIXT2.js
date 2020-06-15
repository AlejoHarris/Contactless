import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { DeviceOrientationControls } from './three/examples/jsm/controls/DeviceOrientationControls.js';

var container, firstTime = true,
    rx = 0,
    ry = 0,
    renderer, scene, camera, controls, angle, timer, finished = false,
    hasGyro = false,
    request = false,
    textureOut, deviceCon, boxMesh;

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

    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(7, 0, 0);
    scene.add(camera);
    var box = new THREE.BoxBufferGeometry(1, 1, 1);
    var mat = new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
    boxMesh = new THREE.Mesh(box, mat);
    boxMesh.position.set(-0.465, 0, 0);
    scene.add(boxMesh);
    boxMesh.visible = false
    deviceCon = new DeviceOrientationControls(boxMesh);

    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render);
    controls.minDistance = 5;
    controls.maxDistance = 7;
    controls.minPolarAngle = Math.PI / 4; // radians
    controls.maxPolarAngle = Math.PI * 3 / 4;
    controls.minAzimuthAngle = Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI * 3 / 4;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.update();

    var light = new THREE.SpotLight(0xffffff, 0.5);

    light.position.set(1, 3, 0);
    light.penumbra = 0;
    light.decay = 1;
    light.distance = 50; //default; light shining from top
    light.castShadow = true;
    light.angle = 2;
    scene.add(light);

    light.shadow.mapSize.width = 2048 * 4; // default
    light.shadow.mapSize.height = 2048 * 4; // default
    light.shadow.camera.near = 1; // default
    light.shadow.camera.far = 200;

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

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./assets/')
        .load('studio3.hdr', function(texture) {
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;
            var loader = new GLTFLoader(manager).setPath('assets/PIXT2/');

            var textureLoader = new THREE.TextureLoader();

            textureOut = textureLoader.load('assets/PIXT2/texture.jpeg');
            textureOut.rotation = 0;
            textureOut.center.set(0.55, 0.5);
            textureOut.offset.set(-0.05, 0);

            textureOut.repeat.set(1, 1);

            loader.load('PIXT2.glb', loadObj);

            function loadObj(gltf) {

                var transparent = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(0xffffff),
                    metalness: 0,
                    roughness: 1,
                    alphaTest: 0.1,
                    depthWrite: false,
                    transparency: 0.5,
                    opacity: 1,
                    transparent: true
                });

                var meshFrame = gltf.scene.getObjectByName("Frame");
                var meshIn = gltf.scene.getObjectByName("Out");
                var meshOut = gltf.scene.getObjectByName("Transparent");
                meshFrame.traverse((o) => {
                    if (o.isMesh) {
                        o.castShadow = true;;

                    }
                });
                meshOut.traverse((o) => {
                    if (o.isMesh) {
                        o.material = transparent;
                        o.receiveShadow = true;
                    }
                });
                meshIn.traverse((o) => {
                    if (o.isMesh) {
                        // note: for a multi-material mesh, `o.material` may be an array,
                        // in which case you'd need to set `.map` on each value.
                        o.material.map = textureOut;
                        o.receiveShadow = true;
                    }
                });
                scene.add(meshFrame);
                scene.add(meshIn);
                scene.add(meshOut);
            }
        });
    var groundGeo = new THREE.PlaneBufferGeometry(6, 6);
    var groundMat = new THREE.ShadowMaterial();
    groundMat.opacity = 0.1;
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.rotation.y = Math.PI / 2;
    ground.position.x = 0.08;

    scene.add(ground);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener("deviceorientation", () => {
        clearTimeout(timer);
        hasGyro = true;
        timer = setTimeout(() => {
            hasGyro = false;
        }, 10000)
    }, false);
}

function animate() {
    if (isMobile.any()) {
        var alpha = boxMesh.rotation.y;
        //if (alpha < 0) alpha = alpha + 2*Math.PI;
        var beta = boxMesh.rotation.x;
        //if (beta < 0) beta = beta + 2*Math.PI;
        if (firstTime) {
            rx = alpha;
            if (isMobile.any()) {
                ry = beta - Math.PI / 2;
            } else {
                ry = beta - Math.PI / 4;
            }
            firstTime = false;
        }

        if (Math.abs(rx - alpha) < Math.PI / 2) {
            controls.setPolarAngle(rx - alpha);
            controls.setAzimuthalAngle(ry - beta);
        }

        rx = alpha;
        ry = beta;
    }
    if (finished) {
        angle = controls.getAzimuthalAngle();

        var temp = map(angle, Math.PI / 4, Math.PI * 3 / 4, 0.4, 1);
        var temp2 = map(angle, Math.PI / 4, Math.PI * 3 / 4, 1, 0.4);

        textureOut.repeat.set(temp, temp2);
        textureOut.rotation = angle * 0.9 + 0.5 + temp;
    }
    if (!hasGyro) {
        controls.enabled = true;
    } else {
        controls.enabled = false;
    }
    deviceCon.update();
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