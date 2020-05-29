import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { Reflector } from './three/examples/jsm/objects/Reflector.js';

var container, controls;
var camera, scene, renderer;

init();
animate();

function init() {

	container = document.createElement('div');
	document.body.appendChild(container);

	scene = new THREE.Scene();

	var ambient = new THREE.AmbientLight(0xffffff);
	scene.add(ambient);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	camera.position.set(- 1.8, 0.6, 2.7);

	console.log( THREE.REVISION );

	new RGBELoader()
		.setDataType(THREE.UnsignedByteType)
		.setPath('assets/')
		.load('photo_studio_01_2k.hdr', function (texture) {

			var envMap = pmremGenerator.fromEquirectangular(texture).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();

			var geometry = new THREE.BoxBufferGeometry( 1, 1 );
			var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
			var mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
			var geometry = new THREE.CircleBufferGeometry( 1, 32 );
			
			var mirror = new Reflector(geometry, {
				clipBias: 0.003,
				textureWidth: window.innerWidth * window.devicePixelRatio,
				textureHeight: window.innerHeight * window.devicePixelRatio,
				color: 0x777777,
				recursion: 1
			});
			mirror.position.set(0,0,-0.2)
			scene.add(mirror)
			

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
	controls.minDistance = 2;
	controls.maxDistance = 10
	controls.target.set(0, 0, - 0.2);
	controls.update();

	window.addEventListener('resize', onWindowResize, false);

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

	renderer.render(scene, camera);

}
