import RAPIER, { World } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

type RigidBodyOptions = {
	type?: RAPIER.RigidBodyType;
};

type ColliderOptions = {
	args?: any[];
};

export class Newton {
	world: RAPIER.World;
	bodies: RAPIER.RigidBody[] = [];
	colliders: RAPIER.Collider[] = [];

	constructor(world?: World) {
		this.world = world ?? new RAPIER.World({ x: 0, y: -9.81, z: 0 });
	}

	addRigidBody(options: RigidBodyOptions = {}): RAPIER.RigidBody {
		const bodyDesc = new RAPIER.RigidBodyDesc(options.type || RAPIER.RigidBodyType.Dynamic);
		const body = this.world.createRigidBody(bodyDesc);
		this.bodies.push(body);
		return body;
	}

	addCollider(
		shapeS: string,
		body?: RAPIER.RigidBody,
		options: ColliderOptions = {}
	): RAPIER.Collider {
		const shape = (RAPIER.ColliderDesc as any)[shapeS](...(options.args || [1]));
		const collider = this.world.createCollider(shape, body);
		this.colliders.push(collider);
		return collider;
	}

	step(): void {
		this.world.step();
	}
}
