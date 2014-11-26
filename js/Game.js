define("js/Game",
[
	"js/World"
], function (
	World
) {
	"use strict";

	var camera, scene, renderer;
    var effect, controls;
    var element, container;
    var clock;
    var stereo = false;
    var player;
    var light, lightPos;

	function Game (str) {
		if (str !== undefined) {
			stereo = str;
		}

		this.world = new World();

		this.init();
		this.run();
	}

	Game.prototype.init = function () {
		// THREE init
		clock = new THREE.Clock();

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog (0xccffff, 0, 300);

		var ambient = new THREE.AmbientLight( 0x111111 );
		scene.add(ambient);
		light = new THREE.DirectionalLight ( 0xffffff);
		lightPos = new THREE.Vector3(7,17,-4);
		light.position.copy(lightPos);

		light.castShadow = true;
		//light.shadowCameraVisible = true;
		light.shadowCameraNear = 10;
        light.shadowCameraFar = 30;//camera.far;
        light.shadowCameraLeft = -10;
     	light.shadowCameraRight = 10;
     	light.shadowCameraTop = 10;
     	light.shadowCameraBottom = -10;

        light.shadowMapBias = 0.1;
        light.shadowMapDarkness = 0.7;
        light.shadowMapWidth = 256;
        light.shadowMapHeight = 256;

		scene.add(light);

		camera = new THREE.PerspectiveCamera(stereo? 90 : 65, 1, 0.001, 700);
		scene.add(camera);

		renderer = new THREE.WebGLRenderer();
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		renderer.setClearColor(scene.fog.color, 1);

		if (stereo) {
			effect = new THREE.StereoEffect(renderer, 0.3);
		}

		element = renderer.domElement;
		container = document.getElementById('gamecanvas');
		container.appendChild(element);

		window.addEventListener('deviceorientation', setOrientationControls, true);

		this.world.setRenderer(renderer);
		this.world.init(scene);


		// Player
		var texture = THREE.ImageUtils.loadTexture(
			'textures/golf.png'
		);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat = new THREE.Vector2(2, 2);
		texture.anisotropy = renderer.getMaxAnisotropy();

		var ballShape = new CANNON.Sphere(1.0);
        var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
        var playerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture } );
		var playerMesh = new THREE.Mesh(ballGeometry, playerMaterial);
		playerMesh.castShadow = true;
		playerMesh.receiveShadow = true;
		var playerBody = new CANNON.Body({mass: 1});
		playerBody.addShape(ballShape);

		playerMesh.position.set(0,10,0);
		playerBody.position.set(0,10,0);

		player = this.world.add("Player", playerMesh, playerBody);

		camera.position.set(0,3,-4);
		playerMesh.add(camera);

		controls = new THREE.OrbitControls(camera, element);
		controls.rotateUp(Math.PI / 4);
		controls.target.set(
			player.mesh.position.x,
			player.mesh.position.y,
			player.mesh.position.z + 2.0
			);
		controls.noZoom = true;
		controls.noPan = true;

		window.addEventListener('resize', this.resize.bind(this), false);
		setTimeout(this.resize.bind(this), 1);
	}

	Game.prototype.resize = function () {
		var width = container.offsetWidth;
		var height = container.offsetHeight;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		if (stereo) {
			effect.setSize(width, height);
		}
    }

    Game.prototype.update = function (dt) {
    	this.world.update(dt);

    	camera.updateMatrix();

    	controls.target.set(
			player.mesh.position.x,
			player.mesh.position.y + 1,
			player.mesh.position.z
		);

    	light.position.copy(lightPos);
    	light.position.add(player.mesh.position);

    	this.resize();

    	camera.updateProjectionMatrix();

    	controls.update(dt);
    }

    Game.prototype.render = function (dt) {
    	if (stereo) {
    		effect.render(scene, camera);
    	}
    	else {
    		renderer.render(scene, camera);
    	}
    }

    Game.prototype.run = function (t) {
    	requestAnimationFrame(this.run.bind(this));

    	this.update(clock.getDelta());
    	this.render(clock.getDelta());
    }


    function setOrientationControls (e) {
		if (!e.alpha) {
			return;
		}

		controls = new THREE.DeviceOrientationControls(camera, true);
		controls.connect();
		controls.update();

		element.addEventListener('click', fullscreen, false);

		window.removeEventListener('deviceorientation', setOrientationControls, true);
	}

    function fullscreen () {
    	if (container.requestFullscreen) {
    		container.requestFullscreen();
    	} else if (container.msRequestFullscreen) {
    		container.msRequestFullscreen();
    	} else if (container.mozRequestFullScreen) {
    		container.mozRequestFullScreen();
    	} else if (container.webkitRequestFullscreen) {
    		container.webkitRequestFullscreen();
    	}
    }

    return Game;
});