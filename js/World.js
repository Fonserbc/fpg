define("js/World", [
], function (

) {
	"use strict";

	function World () {

		var world = this.physicsWorld = new CANNON.World();
		this.remainingTime = 0;
		
		world.quatNormalizeSkip = 0;
		world.quatNormalizeFast = false;

		var solver = new CANNON.GSSolver();

		world.defaultContactMaterial.contactEquationStiffness = 1e9;
		world.defaultContactMaterial.contactEquationRegularizationTime = 4;

		solver.iterations = 7;
		solver.tolerance = 0.1;
		var split = true;
		if(split)
			world.solver = new CANNON.SplitSolver(solver);
		else
	    	world.solver = solver;

	    world.gravity.set(0, -20, 0);
	    world.broadphase = new CANNON.NaiveBroadphase();

	    this.scene = null;

	    this.gameObjects = {};
	}

	World.prototype.setRenderer = function (renderer) {
		this.renderer = renderer;
	};

	World.prototype.init = function (scene) {
		this.scene = scene;

		var texture = THREE.ImageUtils.loadTexture(
			'textures/grass.png'
		);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat = new THREE.Vector2(50, 50);
		texture.anisotropy = this.renderer.getMaxAnisotropy();

		var material = new THREE.MeshLambertMaterial({
			color: 0xdddddd,
			map: texture
		});

		var floor = new THREE.PlaneGeometry(300, 300, 50, 50);
		var floorMesh = new THREE.Mesh(floor, material);
		floorMesh.rotation.x = -Math.PI / 2;
		floorMesh.receiveShadow = true;
		floorMesh.castShadow = true;
		scene.add(floorMesh);
		var floorShape = new CANNON.Plane();
		var floorBody = new CANNON.Body({mass: 0});
		floorBody.addShape(floorShape);
		floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), floorMesh.rotation.x)
		this.physicsWorld.add(floorBody);
	};

	World.prototype.add = function(name, mesh, body) {
		if (!this.gameObjects[name]) {
			var gameObject = {
				mesh: mesh,
				body: body
			};
			this.gameObjects[name] = gameObject;

			this.scene.add(mesh);
			this.physicsWorld.add(body);

			return gameObject;
		}
	};

	World.prototype.remove = function (name) {

	};

	World.prototype.update = function (dt) {
		var fixedDT = 1/60;
		var aux = this.remainingTime + dt;
		while (aux > fixedDT) {
			this.physicsWorld.step(fixedDT);
			aux -= fixedDT;
		}
		this.remainingTime = aux;

		var o;
		for (var i in this.gameObjects) {
			o = this.gameObjects[i];

			o.mesh.position.copy(o.body.position);
			o.mesh.quaternion.copy(o.body.quaternion);
		}
	};
	
	return World;
});