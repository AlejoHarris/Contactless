import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './three/examples/jsm/loaders/RGBELoader.js';
import { Reflector } from './three/examples/jsm/objects/Reflector.js';
import { RoughnessMipmapper } from './three/examples/jsm/utils/RoughnessMipmapper.js';


var container, controls;
var camera, scene, renderer, cubeCamera, mesh, model;

init();
animate();


function init() {

	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	camera.position.set(0, -0, 0);

	scene = new THREE.Scene();

	var ambient = new THREE.AmbientLight(0xffffff);
	scene.add(ambient);


	var cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
		encoding: THREE.sRGBEncoding,
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter
	});
	cubeCamera = new THREE.CubeCamera(0.0001, 10, 256, {
		encoding: THREE.sRGBEncoding,
		generateMipmaps: true,
	});

	var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
	var cube = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), material);
	cube.position.set(0, 0, 0.1);
	scene.add(cube)

	new RGBELoader()
		.setDataType(THREE.UnsignedByteType)
		.setPath('assets/')
		.load('photo_studio_01_2k.hdr', function (texture) {

			var envMap = pmremGenerator.fromEquirectangular(texture).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();


			var roughnessMipmapper = new RoughnessMipmapper(renderer);

			var loader = new GLTFLoader().setPath('assets/');
			loader.load('CIRCLE.glb', function (gltf) {

				model = gltf.scene.getObjectByName('Plane');
				model.position.set(0,0,-10);
				model.scale.set(100,100,100);
				//var rot = model.rotation;
				var materialPhongCube = new THREE.MeshPhysicalMaterial({ shininess: 50, color: 0xffffff, specular: 0x999999, envMap: cubeCamera.renderTarget.texture });
				model.material = materialPhongCube;
				//model.add(cubeCamera);
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
	controls.minDistance = 1;
	controls.maxDistance = 2
	controls.target.set(0, 0, 0);
	controls.update();

	window.addEventListener('resize', onWindowResize, false);
	cube.visible = false;

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

	if (mesh != undefined) {
		mesh.visible = false;
		cubeCamera.position.copy(model.position)
		cubeCamera.update(renderer, scene);
		mesh.visible = true;
	}

	//cubeCamera.update(renderer, scene);
	renderer.render(scene, camera);

}
