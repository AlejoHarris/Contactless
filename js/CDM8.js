import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { DragControls } from './three/examples/jsm/controls/DragControls.js';
import { DeviceOrientationControls } from './three/examples/jsm/controls/DeviceOrientationControls.js';

const thres = 0.125;

let objMin = -0.5625;
let objMax = 0.5625;

var container, controls, dragCon, timer, deviceCon, firstTime = true,
    hasGyro = false,
    gyro = false,
    request = false,
    rx = 0,
    ry = 0;
var boxMesh, camera, scene, renderer, objects = [],
    dx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempz, tempy, tempx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    dx, indexSel = 0,
    finished = false,
    dragged = false;
var inertia = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


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

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 0.4, 3);

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

    var ambient = new THREE.AmbientLight(0xffffff);
    //scene.add(ambient);
    var light = new THREE.SpotLight(0xffffff, 2);

    light.position.set(0, 2, 2);
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
    light.shadow.radius = 0.1;

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
        .load('studio8_4k.hdr', function(texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();

            var loader = new GLTFLoader(manager).setPath('assets/CDM8/');
            var queue = ['CDM8_1.glb', 'CDM8_2.glb', 'CDM8_3.glb', 'CDM8_4.glb', 'CDM8_5.glb', 'CDM8_6.glb', 'CDM8_7.glb', 'CDM8_8.glb', 'CDM8_9.glb', 'CDM8_10.glb']
            loadQueue();

            function loadQueue() {
                if (queue.length == 0) {
                    finished = true;
                    return;
                }
                var name = queue.shift();
                loader.load(name, function(gltf) {
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
    var groundGeo = new THREE.PlaneBufferGeometry(1.5, 4);
    var groundMat = new THREE.ShadowMaterial();
    groundMat.opacity = 0.1;

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.5;
    ground.position.z = -0.04;
    ground.rotation.z = -Math.PI / 2;
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
    controls.minDistance = 2;
    controls.maxDistance = 2;
    controls.minPolarAngle = Math.PI / 4; // radians
    controls.maxPolarAngle = Math.PI * 3 / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.target.set(0, 0.44155, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.update();

    if (isMobile.any()) {
        camera.position.set(0, 0.4, 3);
        controls.minDistance = 4;
        controls.maxDistance = 4;
    }

    dragCon = new DragControls(objects, camera, renderer.domElement);
    dragCon.addEventListener('dragstart', function(event) {
        tempz = event.object.position.z;
        tempy = event.object.position.y;
        controls.enabled = false;
        indexSel = objects.indexOf(event.object);
    });
    dragCon.addEventListener('dragend', function(event) {
        controls.enabled = true;
        dragged = true;
    });
    dragCon.addEventListener('drag', function(event) {
        event.object.position.y = tempy
        event.object.position.z = tempz;
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
            inertia[index] = inertia[index] / 1.25;
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
                } else {
                    objects[counter - 1].position.x = objects[counter].position.x - thres;
                }

            }
        }
        counter -= 1;
    }
    counter = indexSel;
    while (counter < 9) {
        if (counter < 9) {
            if (Math.abs(objects[counter + 1].position.x - objects[counter].position.x) > thres) {
                if (objects[counter + 1].position.x > objects[counter].position.x) {
                    objects[counter + 1].position.x = objects[counter].position.x + thres;
                } else {
                    objects[counter + 1].position.x = objects[counter].position.x - thres;
                }

            }
        }
        counter += 1;

    }
}

function animate() {
    if (!hasGyro) {
        if (gyro) {
            controls.enabled = true;
            gyro = false;
        }
    } else {
        controls.enabled = false;
    }
    controls.update();
    deviceCon.update();
    window.requestAnimationFrame(animate);
    if (finished) updatePos();
    camera.lookAt(0, 0.44155, 0);
    renderer.render(scene, camera);
}