- **Interfaces and Types**:
  - Defines entities, events, lifecycle hooks, and types that modify properties (`With`, `Without`) and perform operations on entities.
  - Lifecycle and update hooks manage entity lifecycle and system updates.
- **Core Functionality**: Implements event-driven mechanisms for managing entities, possibly through query and update hooks, which are typical in ECS patterns.

I'll create a README with sections explaining how to use this file, its features, and necessary dependencies. I'll also include emojis to add clarity and friendliness to each section.

---

### README

# 🏰 Medieval ECS TypeScript Library

A TypeScript library implementing an **Entity-Component-System (ECS)** architecture, ideal for game development or simulations where entities require flexible and reusable components. 

## 📋 Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Types & Interfaces](#types--interfaces)
- [Hooks & Events](#hooks--events)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## ✨ Introduction

This library provides a streamlined way to manage entities in a game or simulation, using a modular ECS pattern. With **lifecycle hooks** and **event-driven updates**, entities can interact, update, and respond to game-state changes efficiently.

## 🌟 Features
- **Entity Management**: Easily create and manage entities with flexible attributes.
- **Lifecycle Hooks**: Control entities through customizable hooks that respond to lifecycle events.
- **Event System**: Manage events between entities, allowing complex interactions.
- **Type Utilities**: Use helper types like `With` and `Without` to simplify entity property management.

## ⚙️ Installation

Install the necessary packages using npm:

```bash
npm install @medieval/martingale
```

Then, add this library to your project.

## 🚀 Usage

1. **Define Entities**: Create entities with required attributes.
2. **Setup Hooks**: Use lifecycle and update hooks to manage entity behavior.
3. **Emit Events**: Utilize event callbacks to allow entities to interact in response to game updates.

## 📖 Types & Interfaces

- **Entity**: Basic unit with flexible attributes.
- **With**: Utility type to mark specified entity properties as required.
- **Without**: Utility type to omit specific properties.
- **LifecycleHook**: A function type for lifecycle event handling on entities.
- **UpdateHook**: A function type that runs on each update tick.
- **EntityEvent**: Event object associated with an entity.
- **QueryEvent**: Event object for querying multiple entities.

## 🔄 Hooks & Events

The library includes the following hooks and events:
- **LifecycleHook**: Operates on entities, handling initialization, updates, and destruction.
- **UpdateHook**: Runs every update cycle (e.g., on every game frame).
- **EventCallback**: Responds to data-based events.
  
### Example Hook

```typescript
const onEntityCreate: LifecycleHook<MyEntity> = (entity) => {
  console.log(`Entity created: ${entity}`);
};
```

### Event Usage

```typescript
const onPlayerAttack: EventCallback<AttackEvent> = (eventData) => {
  console.log(`Player attacked with power: ${eventData.power}`);
};
```

## 📝 Examples

Check out the examples below to start integrating this ECS library into your project:

```typescript
import { Entity, With, Without, LifecycleHook, UpdateHook } from './ecs';

// Define a new entity
interface Player extends Entity {
  health: number;
  power: number;
}

// Create lifecycle hooks
const onPlayerSpawn: LifecycleHook<Player> = (player) => {
  player.health = 100;
  console.log("Player spawned with full health.");
};

// Update hook
const gameTick: UpdateHook = (deltaTime) => {
  console.log(`Game tick: ${deltaTime}`);
};
```

## 🤝 Contributing

Contributions are welcome! If you’d like to improve this library, please fork the repository, make changes, and submit a pull request.

## 📄 License

This project is licensed under the MIT License.
