import * as THREE from './three/build/three.module.js';
import { TrackballControls } from './three/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';

var container, controls, controls2;
var camera, scene, renderer;

init();
animate();


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


function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(1, 1, 1);

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
        .load('autoshop_01_1k.hdr', function(texture) {

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = new THREE.Color(0xffffff);
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
            let i = 0;
            var loader = new GLTFLoader(manager).setPath('assets/SVD6/');
            loader.load('SVD6_1.glb', function(gltf) {

                var model = gltf.scene
                model.children.forEach(function(element) {
                    //element.renderOrder = i;
                    i += 1;
                    element.material.color = new THREE.Color(0xffffff);
                    element.material.side = THREE.FrontSide;
                    element.material.blending = THREE.NoBlending;
                    //element.material.depthTest = false;
                    //element.material.DepthWrite = false;
                });

                //model.renderOrder = 0;
                scene.add(model);
                //render();

            });
            loader.load('SVD6_2.glb', function(gltf) {
                var model = gltf.scene

                model.children.forEach(function(element) {
                    element.renderOrder = i;
                    i += 1;
                    if (isMobile.iOS()) {
                        element.material.side = THREE.DoubleSide;
                    } else {
                        element.material.side = THREE.FrontSide;
                    }
                    element.material.depthTest = false;
                    element.material.DepthWrite = false;
                    element.material.blending = THREE.CustomBlending;
                    element.material.blendEquation = THREE.ReverseSubtractEquation;
                    element.material.blendSrc = THREE.DstAlphaFactor;
                    element.material.blendDst = THREE.OneMinusSrcColorFactor;
                });

                //model.renderOrder = 1;
                //model.children.sort()
                //model.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
                scene.add(model);
                render();
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
    controls.minDistance = 1.5;
    controls.maxDistance = 2;
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;

    controls2 = new TrackballControls(camera, renderer.domElement);
    controls2.addEventListener('onclick', render); // use if there is no animation loop
    controls2.minDistance = 1.5;
    controls2.maxDistance = 2;
    controls2.rotateSpeed = 0.7;
    controls2.enableDamping = true;
    controls2.dynamicDampingFactor = 0.2;
    controls2.noPan = true;
    controls2.enabled = false;
    controls2.update();

    controls.addEventListener('start', function() {
        controls.enabled = false;
        controls2.enabled = true;
    });

    controls.update();

    window.addEventListener('resize', onWindowResize, false);

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