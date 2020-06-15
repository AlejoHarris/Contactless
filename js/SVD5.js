import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { TrackballControls } from './three/examples/jsm/controls/TrackballControls.js';

var container, controls, controls2;
var camera, scene, renderer;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(0.7, 0.7, 0.7);

    scene = new THREE.Scene();

    var ambient = new THREE.AmbientLight(0x777777);
    scene.add(ambient);

    const manager = new THREE.LoadingManager();

    manager.onProgress = function(item, loaded, total) {
        //console.log(item, loaded, total);
    };

    manager.onLoad = function(item, loaded, total) {
        var loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.remove();
        }, 1000);

    }

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('assets/')
        .load('FP.hdr', function(texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
            let i = 0;
            var loader = new GLTFLoader(manager).setPath('assets/SVD5/');
            loader.load('SVD5_1.glb', function(gltf) {

                var model = gltf.scene
                model.children.forEach(function(element) {
                    element.renderOrder = i;
                    i += 1;
                    element.material.color = new THREE.Color(0xffffff);
                    element.material.side = THREE.FrontSide;
                    element.material.blending = THREE.NoBlending;
                    //element.material.depthTest = false;
                    //element.material.DepthWrite = false;
                });

                model.renderOrder = 0;
                scene.add(model);
            });
            loader.load('SVD5_2.glb', function(gltf) {
                var model = gltf.scene

                model.children.forEach(function(element) {
                    element.renderOrder = i;
                    i += 1;
                    element.material.side = THREE.FrontSide;
                    element.material.depthTest = false;
                    //element.material.DepthWrite = false;
                    element.material.blending = THREE.CustomBlending;
                    element.material.blendEquation = THREE.AddEquation;
                    element.material.blendSrc = THREE.DstColorFactor;
                    element.material.blendDst = THREE.OneMinusSrcAlphaFactor;
                });

                //model.renderOrder = 1;
                model.children.sort()
                model.onBeforeRender = function(renderer) { renderer.clearDepth(); };
                scene.add(model);
                //render();
            });



        });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('onclick', render); // use if there is no animation loop
    controls.minDistance = 0.25;
    controls.maxDistance = 0.5;
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;

    controls2 = new TrackballControls(camera, renderer.domElement);
    controls2.addEventListener('onclick', render); // use if there is no animation loop
    controls2.minDistance = 0.25;
    controls2.maxDistance = 0.5;
    controls2.rotateSpeed = 2.0;
    controls2.enableDamping = true;
    controls2.dynamicDampingFactor = 0.1;
    controls2.noPan = true;
    controls2.enabled = false;
    controls2.update();

    controls.addEventListener('start', function() {
        controls.enabled = false;
        controls2.enabled = true;
    });

    controls.update();

    //cube.visible = false;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

//
function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {
    //deviceCon.update();
    controls2.update();
    controls.update();
    renderer.render(scene, camera);

}