import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { DragControls } from './three/examples/jsm/controls/DragControls.js';
import { DeviceOrientationControls } from './three/examples/jsm/controls/DeviceOrientationControls.js';

var container, controls, dragCon, timer, firstTime = true,
    lastLoop = new Date(),
    hasGyro = false,
    gyro = false,
    deviceCon, boxMesh, request = false;
var camera, scene, renderer, objects = [],
    dy = 0,
    angle = 0;
var tempz, tempy, tempx, draggin = false,
    finished = false,
    dragged = false;
var inertia = 0,
    dragy = 0,
    rx = 0,
    ry = 0;

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

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 0, 1);
    scene = new THREE.Scene();

    var box = new THREE.BoxBufferGeometry(1, 1, 1);
    var mat = new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
    boxMesh = new THREE.Mesh(box, mat);
    boxMesh.position.set(-0.465, 0, 0);
    scene.add(boxMesh);
    boxMesh.visible = false
    deviceCon = new DeviceOrientationControls(boxMesh);

    var ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);
    var light = new THREE.SpotLight(0xffffff, 3);

    light.position.set(0, 3, 2);
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
        .load('studio.hdr', function(texture) {

            texture.repeat.set(1, 1);
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();

            //

            // model
            let texture1 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-C-01.png');
            let texture2 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-M-01.png');
            let texture3 = new THREE.TextureLoader().load('./assets/SVC8/SVC8-Y-01.png');
            texture1.encoding = THREE.sRGBEncoding;
            texture1.flipY = false;
            //texture1.center.set(0.5, 0.1);
            // texture1.repeat.set(0.4, 0.4);
            texture2.encoding = THREE.sRGBEncoding;
            texture2.flipY = false;
            texture2.center.set(0.9, 0.5);
            texture2.repeat.set(0.5, 0.5);
            texture3.encoding = THREE.sRGBEncoding;
            texture3.flipY = false;
            texture3.center.set(0.9, 0.5);
            texture3.repeat.set(0.5, 0.5);
            let material1 = new THREE.MeshPhongMaterial({
                map: texture1,
                specular: 0.5,
                transparent: true,
            });
            let material2 = new THREE.MeshPhongMaterial({
                map: texture2,
                specular: 0.5,
                transparent: true,
            });
            let material3 = new THREE.MeshPhongMaterial({
                map: texture3,
                specular: 0.5,
                transparent: true,
            });


            var geometry1 = new THREE.CylinderGeometry(0.6, 0.6, 0.01, 50);
            var geometry2 = new THREE.CylinderGeometry(0.6, 0.6, 0.008, 50);
            //var geometry3 = new THREE.CylinderGeometry(0.6, 0.6, 0.002, 50);

            var mesh1 = new THREE.Mesh(geometry1, material3);
            var mesh2 = new THREE.Mesh(geometry1, material2);
            var mesh3 = new THREE.Mesh(geometry2, material1);
            //var mesh4 = new THREE.Mesh(geometry3, material4);

            mesh1.rotation.set(Math.PI / 2, 0, 0);
            mesh1.position.set(0, 0, -0.02);
            mesh2.rotation.set(Math.PI / 2, Math.PI / 2, 0);
            mesh3.rotation.set(Math.PI / 2, 0, 0);
            mesh3.position.set(0, 0, 0.02);
            //mesh4.rotation.set(Math.PI / 2, 0, 0);
            mesh1.castShadow = true;
            scene.add(mesh3);
            scene.add(mesh2);
            scene.add(mesh1);

            objects.push(mesh1);
            objects.push(mesh2);
            objects.push(mesh3);
            // use of RoughnessMipmapper is optional

            mesh1.material.blending = THREE.CustomBlending;
            mesh1.material.blendEquation = THREE.AddEquation;
            mesh1.material.blendSrc = THREE.DstColorFactor;
            mesh1.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            mesh2.material.blending = THREE.CustomBlending;
            mesh2.material.blendEquation = THREE.AddEquation;
            mesh2.material.blendSrc = THREE.DstColorFactor;
            mesh2.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            mesh3.material.blending = THREE.CustomBlending;
            mesh3.material.blendEquation = THREE.AddEquation;
            mesh3.material.blendSrc = THREE.DstColorFactor;
            mesh3.material.blendDst = THREE.OneMinusSrcAlphaFactor;

            var loader = new GLTFLoader(manager).setPath('assets/SVC8/');
            loader.load('SVC8.glb', function(gltf) {
                //gltf.material = material;
                var model = gltf.scene;
                scene.add(model)
            })


        });


    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 1.5);
    var groundMat = new THREE.ShadowMaterial();
    groundMat.opacity = 0.1;
    //groundMat.color.setHSL(1, 1, 1);

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    ground.position.z = -0.05;
    ground.rotation.z = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(10, window.devicePixelRatio));
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
    controls.addEventListener('onclick', render); // use if there is no animation loop
    controls.minDistance = 1;
    controls.maxDistance = 1;
    controls.minPolarAngle = Math.PI / 4; // radians
    controls.maxPolarAngle = Math.PI * 3 / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.update();

    dragCon = new DragControls(objects, camera, renderer.domElement);
    dragCon.addEventListener('dragstart', function(event) {
        tempz = event.object.position.z;
        tempy = event.object.position.y;
        tempx = event.object.position.x;
        controls.enabled = false;
        dragged = true;
    });
    dragCon.addEventListener('dragend', function(event) {
        controls.enabled = true;
        draggin = false;
        dy = 0;
    });
    dragCon.addEventListener('drag', function(event) {
        draggin = true;
        objects[0].rotation.y = objects[0].rotation.y + angle / 20;
        objects[1].rotation.y = objects[1].rotation.y + angle / 15;
        objects[2].rotation.y = objects[2].rotation.y + angle / 10;
        dragy = event.object.position.y;
        angle = dy - dragy;
        dy = dragy;
        inertia = angle * 7

        event.object.position.y = tempy
        event.object.position.z = tempz;
        event.object.position.x = tempx;
    });

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePos() {
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

        if (Math.abs(rx - alpha) < Math.PI / 2) {
            controls.setPolarAngle(rx - alpha);
            controls.setAzimuthalAngle(ry - beta);
        }

        rx = alpha;
        ry = beta;
    }

    if (dragged) {
        dragged = false;
    }
    if (!dragged) {
        objects[0].rotation.y = objects[0].rotation.y + inertia / 7;
        objects[1].rotation.y = objects[1].rotation.y + inertia / 5;
        objects[2].rotation.y = objects[2].rotation.y + inertia / 3;
        inertia = inertia / 1.15;
        if (Math.abs(inertia) < 0.00000001) {
            inertia = 0;
        }
    }
}

function animate() {
    //console.log(objects)
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
    requestAnimationFrame(animate);
    render();
}

function render() {
    if (objects[2] != undefined) updatePos();
    camera.lookAt(0, 0, 0);
    //requestAnimationFrame( render );
    //camera.updateMatrixWorld();
    renderer.render(scene, camera);
}