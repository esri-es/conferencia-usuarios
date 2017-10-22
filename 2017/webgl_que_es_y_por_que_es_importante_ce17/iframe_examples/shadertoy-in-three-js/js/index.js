// init camera, scene, renderer
var scene, camera, renderer;
scene = new THREE.Scene();
var fov = 75,
		aspect = window.innerWidth / window.innerHeight;
camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
camera.position.z = 100;
camera.lookAt(scene.position);
renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xc4c4c4);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var clock = new THREE.Clock();

var tuniform = {
	time: {
		type: 'f',
		value: 0.1
	},
	resolution: {
		type: 'v2',
		value: new THREE.Vector2()
	},
	mouse: {
		type: 'v4',
		value: new THREE.Vector2()
	}
};

// Mouse position in - 1 to 1
renderer.domElement.addEventListener('mousedown', function(e) {
	var canvas = renderer.domElement;
	var rect = canvas.getBoundingClientRect();
	tuniform.mouse.value.x = (e.clientX - rect.left) / window.innerWidth * 2 - 1;
	tuniform.mouse.value.y = (e.clientY - rect.top) / window.innerHeight * -2 + 1; 
});
renderer.domElement.addEventListener('mouseup', function(e) {
	var canvas = renderer.domElement;
	var rect = canvas.getBoundingClientRect();
	tuniform.mouse.value.z = (e.clientX - rect.left) / window.innerWidth * 2 - 1;
	tuniform.mouse.value.w = (e.clientY - rect.top) / window.innerHeight * -2 + 1;
});
// resize canvas function
window.addEventListener('resize',function() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

tuniform.resolution.value.x = window.innerWidth;
tuniform.resolution.value.y = window.innerHeight;
// Create Plane
var material = new THREE.ShaderMaterial({
	uniforms: tuniform,
	vertexShader: document.getElementById('vertex-shader').textContent,
	fragmentShader: document.getElementById('fragment-shader').textContent
});
var mesh = new THREE.Mesh(
	new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 40), material
);
scene.add(mesh);

// draw animation
function render(time) {
	tuniform.time.value += clock.getDelta();
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
render();