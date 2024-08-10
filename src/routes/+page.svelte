<script lang="ts">
	import { World, type Archetype, type With } from '$lib/ecs';

	type Entity = {
		health: { current: number; max: number };
		position: { x: number; y: number; z: number };
		type: 'enemy' | 'player' | 'teammate';
	};

	const world = new World<Entity>([]);

	const enemy: Archetype<Entity> = {
		type: 'enemy'
	};

	const player: Archetype<Entity> = {
		type: 'player'
	};

	const teammate: Archetype<Entity> = {
		type: 'teammate'
	};

	world.registerArchetype('player', player);
	world.registerArchetype('enemy', enemy);

	world.createEntityFromArchetype('player', {
		health: { current: 100, max: 100 },
		position: { x: 0, y: 0, z: 0 }
	});

	const { addHook, entities, removeHook } = world.query({ has: ['health'] });

	entities.filter((e) => e.health.max === 100);


	addHook((e) => console.log(e));
	removeHook((e) => console.log(e));

	const p = world.createEntityFromArchetype('enemy', {
		health: { current: 100, max: 100 },
		position: { x: 0, y: 0, z: 0 }
	});

	const teamate = world.createEntity({ type: 'teammate', health: { max: 100, current: 90 }, position: {x: 0, y: 0, z: 0} });

	function damage(entity: With<Entity, 'health'>, amount: number) {
		entity.health.current -= amount;
	}

	damage(teamate, 10);

	world.removeEntity(p)
</script>

{#each entities as { type, health, position }}
	<p>{type} health: {health.current} hp</p>
	<p style="color: red;"> position: {position.x}, {position.y}, {position.z}</p>
{/each}