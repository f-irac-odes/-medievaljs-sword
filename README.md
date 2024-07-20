# ⚔️ Sword: the agressive ECS for complex games

## 🤨 What is an ECS ?

ECS (Entity-Component-System) is an architectural pattern used in software development, particularly in game development and simulation systems. It separates data representation (entities), behavior (systems), and data (components) into distinct modules:

- Entity: A generalized object in the world, represented only by a unique identifier.
- Component: Holds data and state relevant to entities, such as position, health, or behavior.
- System: Processes entities that have specific components, performing actions or calculations.
  ECS promotes flexibility, scalability, and performance by decoupling data and behavior, allowing for dynamic entity composition and efficient processing of game or simulation logic.

## 📦 Features

- 👾 Entities: Representations of objects in the world, typically identified by unique IDs.

- 🧩 Components: Modular pieces of data that define the attributes or behavior of entities (e.g., position, health, AI state).

- 🧠 Systems: Processes or behaviors that operate on entities with specific components, decoupled from the entities themselves.

- 👨🏼‍🦳 Archetypes: Templates for creating entities with predefined sets of components, facilitating rapid entity creation.

- 🏷 Tags: Lightweight markers or flags attached to entities to categorize or identify them (e.g., "Player", "Enemy").

- 🔎 Querying: Mechanism to retrieve entities based on specific criteria (e.g., components, tags), supporting dynamic entity selection.

- 🪝 Lifecycle Hooks: Callbacks or event handlers triggered when entities are added, removed, or modified, enabling responsive behavior.

- 🎭 Event-driven Architecture: Subscriptions to events such as entity lifecycle changes or query results updates, promoting modular and reactive design patterns.

- 🏃🏼‍♀️ Asynchronous Processing: Capability to handle systems or operations asynchronously, enhancing performance and responsiveness.

- 𝌰 Serialization: Ability to save and load the state of entities and components, facilitating persistence and game state management.

- 📸 Entity Snapshotting: Mechanism to capture and restore the state of entities at specific points in time, useful for undo/redo functionality or game replays.

- 🔦 Advanced Querying: Support for complex queries combining logical conditions (AND, OR, NOT) on components and tags, providing flexible entity selection.

- ᅔ Hierarchical Entities: Ability to organize entities into hierarchical structures or prefabs, enhancing reuse and management of complex entity configurations.

- 🌎 Efficient Rendering and Update: Optimization techniques to minimize processing overhead, suitable for real-time applications like games or simulations.

- 🔌 Extensibility and Modularity: Framework design that supports easy integration of new components, systems, or features, promoting code reuse and scalability.
- 🔓 Typescript support with typed entities

## 📘 Basic Usage

📦 Install the package
```bash
 npm install @medieval/sword
```
🌎 Create a world: 

```typescript
import { World } from '@medieval/sword'

const world = new World()
```
👾 Create an entity:

```typescript
const player = world.createEntity({ 
	speed: {d: 10, max: 100}, 
	health: { current: 100, max: 100}}, 
	({entity, componets}) => {
		console.log('the entity:', entity, 'has components:', components);
	}
);
```

🧩 Add, remove components to the entity and update it:
```typescript
world.addComponent(player, 'position', { x: 0, y: 0 });
world.removeComponent(world, 'position');

// Or a faster way to add and remove multiple components as soon as resources load

//using function
world.updateState(player, (e) => e.position = {x: 0, y: 0});

//using object
world.updateState(player, {position: undefined});
```

🔍 Query entities:
```typescript
const moving = world.query({ has: ['speed', 'position'] }).entities
const frozen = world.query({ where: (e) => if(e.frozen) return e}).entities
const notmoving = world.query({ none: ['speed'], has: ['position']}) 

// create an id 
const playerId = world.genID(player) 

//get entity by an id
const player = world.byID(playerId)
```

🧠 Create and add logic
```typescript

// this system should move only the moving entities
function pyshicsSystem () {
	return function () {
		for( const {position, speed} of moving ) {
			// pretend that the speed is mass 😅
			position.y += speed.d * 9.81
		}
	}
}

function renderSystem () {
	// setup goes here ...
	const renderable = world.query({ has: ['render']});

	// runs every time an entity is added to the query...
	renderable.addHook((e) => {
		console.log('Hi', e);
	})

	// ...and this every time is being removed
	renderable.removeHook((e) => {
		console.log('Bye', e);
	})

	return function () {
		for( const {render} of renderable ) {
			// rendering logic here
		}
	}
}

// add the systems to the world...
world.addSystem(pyshicsSystem());
world.addSystem(renderSystem());

//...and run it in your favorite game loop

/* definitely my favorite */
setInterval(() => {
	world.runSystems();
}, 100)
```

So there you go you have your basic game. But is it enough? 🤔

## 📚 Advanced Usage

Since the ECS is type-safe let's add a typescript Entity type:

```typescript
type Entity = {
	position: {x: number, y: number, z: number},
	speed: {d: number},
	render: {color: string},
	health: {current?: number, max: number}
}

// and now create the world 
const world = new World<Entity>();
```

ECS are also userful to create simple but performant ***game-engines***:

```typescript
	type Entity = {
		position: {x: number, y: number},
		speed: {d: number},
		render: THREE.Object3D,
		health: {current?: number, max: number}
		engine: {
			scene: THREE.Scene,
			renderer: THREE.WebGLRenderer,
			cameraId: number,
			playerId: number,
			playerInput: boolean[],
		}
	}

const world = new World<Entity>();

let { engine } = world.createEntity({ 
	engine: {
		scene: new THREE.Scene(),
		renderer: new THREE.WebGLRenderer(),
		cameraId: 0,
		playerId: 0,
		playerInput: []
	}
})
```

Create archetypes to make the entity creation easier

```typescript
const ColliderE = {
	args: [0, 0, 0],
	shape: 'cuboid',
}

const RigidBodyE = {
	mass: 1,
	velocity: {x: 0, y: 0, z: 0},
	acceleration: {x: 0, y: 0, z: 0},
	angularVelocity: 0,
	angularAcceleration: 0,
}

const PlayerE = {
	//spread both the rigidBody and collider archetypes
	...ColliderE,
	...RigidBodyE,
}

// register all the archetypes 
world.registerArchetype('rigidbody', RigidBodyE);
world.registerArchetype('collider', Collider);
world.registerArchetype('player', PlayerE);

//create an entity from the archetype
const player = world.createEntityFromArchetype('player', {speed: {d: 1}});

const camera = world.createEntity({ render: new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)});

// some game-engine usage example
const playerId = world.genID(player);
const cameraId = world.genID(camera);

engine.playerID = playerId;
engine.cameraID = cameraId;
```

Another cool feature is pub/sub:

```typescript

//create an onKeyDown and onKeyUp function to capture input
const onKeyDown = (e: KeyboardEvent) => {
	world.emitEvent('player-input', [e.key === 'ArrowLeft', e.key === 'ArrowUp', e.key === 'ArrowDown', e.key === 'ArrowRight']);
}

const onKeyUp = (e: KeyboardEvent) => {
	world.emitEvent('player-input', [e.key === 'ArrowLeft', e.key === 'ArrowUp', e.key =='ArrowDown', e.key === 'ArrowRight']);
}

//add the event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// make a function system called playeInput and subscribe to the event

function playerInput () {
	const player = world.byID(engine.playerId);

	return function () {
		// assuming you have a system taking care of the rigidbodies
		world.subscribeToEvent('player-input', (input) => {
			const [left, up, down, right] = input;
			if (left) {
				player.velocity.x += player.speed.d;
			}
			if (up) {
				player.velocity.y += player.speed.d;
			}
			if (down) {
				player.velocity.y -= player.speed.d;
			}
			if (right) {
				player.velocity.x -= player.speed.d;
			}
	}
}
```
So now that you know something about ECS you can start your journey to the cration of your project. Good luck 🍀
