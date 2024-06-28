<img src="https://github.com/f-irac-odes/-medievaljs-sword/assets/108071425/79d1773a-d181-49a8-9036-964035e6b293" alt="sword image" height="200"/>

# Sword
the agressive entity-component-system for complex games



## 🤨 What is an ECS ?

ECS (Entity-Component-System) is an architectural pattern used in software development, particularly in game development  and simulation systems. It separates data representation (entities), behavior (systems), and data (components) into distinct modules:

* Entity: A generalized object in the world, represented only by a unique identifier.
* Component: Holds data and state relevant to entities, such as position, health, or behavior.
* System: Processes entities that have specific components, performing actions or calculations.
ECS promotes flexibility, scalability, and performance by decoupling data and behavior, allowing for dynamic entity composition and efficient processing of game or simulation logic.

## 📦 Features

* 👾 Entities: Representations of objects in the world, typically identified by unique IDs.

* 🧩 Components: Modular pieces of data that define the attributes or behavior of entities (e.g., position, health, AI state).

* 🧠 Systems: Processes or behaviors that operate on entities with specific components, decoupled from the entities themselves.

* 👨🏼‍🦳 Archetypes: Templates for creating entities with predefined sets of components, facilitating rapid entity creation.

* 🏷 Tags: Lightweight markers or flags attached to entities to categorize or identify them (e.g., "Player", "Enemy").

* 🔎 Querying: Mechanism to retrieve entities based on specific criteria (e.g., components, tags), supporting dynamic entity selection.

* 🪝 Lifecycle Hooks: Callbacks or event handlers triggered when entities are added, removed, or modified, enabling responsive behavior.

* 🎭 Event-driven Architecture: Subscriptions to events such as entity lifecycle changes or query results updates, promoting modular and reactive design patterns.

* 🏃🏼‍♀️ Asynchronous Processing: Capability to handle systems or operations asynchronously, enhancing performance and responsiveness.

* 𝌰 Serialization: Ability to save and load the state of entities and components, facilitating persistence and game state management.

* 📸 Entity Snapshotting: Mechanism to capture and restore the state of entities at specific points in time, useful for undo/redo functionality or game replays.

* 🔦 Advanced Querying: Support for complex queries combining logical conditions (AND, OR, NOT) on components and tags, providing flexible entity selection.

* ᅔ Hierarchical Entities: Ability to organize entities into hierarchical structures or prefabs, enhancing reuse and management of complex entity configurations.

* 🌎 Efficient Rendering and Update: Optimization techniques to minimize processing overhead, suitable for real-time applications like games or simulations.

* 🔌 Extensibility and Modularity: Framework design that supports easy integration of new components, systems, or features, promoting code reuse and scalability.
  
* 🔓 Typescript support with typed entities

## 📘 Usage

1. Setup
Ensure you have the World class and necessary interfaces defined in your TypeScript environment.

2. Creating a World Instance
Initialize the ECS world:

```typescript
const world = new World<MovingEntity>(); // 🌍 Create a new ECS world instance (MovingEntity is a type...)
```
3. Registering Archetypes
Define and register archetypes to create entity templates:

```typescript
// Define archetypes
const BasicArchetype: Archetype<Entity> = {
  position: { x: 0, y: 0 },
}; // 📜 Define a basic archetype with position component

const MovingArchetype: Archetype<Entity & Position & Velocity> = {
  ...BasicArchetype,
  velocity: { dx: 1, dy: 1 },
}; // 🚀 Define a moving archetype with position and velocity components

// Register archetypes
world.registerArchetype('Basic', BasicArchetype);
world.registerArchetype('Moving', MovingArchetype); // 📚 Register archetypes for entity creation
```
4. Creating Entities
Create entities using archetypes or custom components:

```typescript
// Create entities from archetypes
const basicEntity = world.createEntityFromArchetype('Basic');
const movingEntity = world.createEntityFromArchetype('Moving'); // 🌟 Create entities using defined archetypes

// Add components directly to entities
const customEntity = world.createEntity({
  position: { x: 10, y: 20 },
  velocity: { dx: 2, dy: 2 },
}); // ➕ Create a custom entity with specific components
5. Adding and Removing Tags
Categorize entities by adding tags:
```

```typescript
// Add tags to entities
world.addTag(movingEntity, 'TagA');
world.addTag(movingEntity, 'TagB'); // 🏷️ Add tags to categorize entities
```
6. Subscribing to Events
Monitor entity lifecycle changes or query result changes:

```typescript
// Subscribe to entity added event
world.subscribeToEvent('entityAdded', ({ entity }) => {
  console.log('Entity added:', entity);
});

// Subscribe to query result changed event
world.subscribeToEvent('queryChanged', ({ entities, addedEntities, removedEntities }) => {
  console.log('Query result changed:');
  console.log('Current entities:', entities);
  console.log('Added entities:', addedEntities);
  console.log('Removed entities:', removedEntities);
}); // 📢 Subscribe to events for entity lifecycle and query changes
```
7. Querying Entities
Retrieve entities based on specific criteria:

```typescript
// Query entities with specific components and tags
const { entities: taggedEntities, addHook, removeHook } = world.query({
  tags: ['TagA'],
});

console.log('Tagged entities with TagA:', taggedEntities);

// Add hooks to monitor changes in the query result
addHook(entity => console.log('Entity added to TagA query result:', entity));
removeHook(entity => console.log('Entity removed from TagA query result:', entity)); // 🔍 Query entities and monitor changes in the result
````

8. Adding Systems and Running Simulation
Define systems to process entities and run the simulation loop:

```typescript
// Add a system to process entities
world.addSystem((entities, deltaTime) => {
  // Example: Update positions based on velocities
  entities.forEach(entity => {
    if ('position' in entity && 'velocity' in entity) {
      entity.position.x += entity.velocity.dx * deltaTime;
      entity.position.y += entity.velocity.dy * deltaTime;
    }
  });
});

// Run the simulation loop
async function simulateWorld() {
  const deltaTime = 1; // Time step for simulation (e.g., 1 second)
  await world.runSystems(deltaTime);
}

simulateWorld().then(() => {
  console.log('Simulation completed.');
}); // ⚙️ Add systems to process entities and simulate the world
````

# 🎯 Conclusion
This example demonstrates the basic usage of the ECS framework in TypeScript. Customize and expand upon this foundation to suit your specific application needs, such as game development, simulation systems, or any scenario requiring efficient entity management and behavior processing.


## 🚀 Advanced Features of the ECS Framework
In addition to basic entity creation and component management, the ECS framework supports advanced features crucial for complex applications. Lifecycle hooks enable developers to react to entity additions and removals dynamically, facilitating real-time updates and event-driven architectures. Asynchronous systems allow for non-blocking processing of entities, accommodating tasks such as AI computations or network interactions without halting the main simulation loop. Event subscriptions provide granular control over entity lifecycle events and query result changes, empowering developers to implement sophisticated behavior and interaction patterns seamlessly. These features collectively enhance flexibility, scalability, and maintainability in applications ranging from game development to simulation engines and beyond, making the ECS framework a robust choice for managing complex entity behaviors and interactions efficiently.
## License

[MIT](https://choosealicense.com/licenses/mit/)

