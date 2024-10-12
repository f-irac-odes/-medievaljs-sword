# Sword ECS ⚔️

> 🧙‍♂️ _"Why manage components manually, when you can let the **engine** do it for you?"_  
> – Some wise developer

🏰 Welcome to **Sword ECS** – the magical world where **entities** roam free, systems take care of all the heavy lifting, and components live happily ever after!

## 💡 Features

- 🎮 **ECS Awesomeness**: Build your game with an Entity Component System, because who needs OOP? 🤷‍♂️
- 🤖 **Super-Smart Systems**: Let systems update your entities while you sit back and sip coffee ☕.
- 🧙‍♀️ **Archetype Wizards**: Create entities from archetypes like a magician conjuring spells.
- 📡 **Event Chaos**: Built-in events to make everything more dramatic.
- ⏳ **Deferred Magic**: Entities appear *right on time* thanks to deferred creation.
- 🔍 **Query Like a Pro**: Retrieve entities like searching for your TV remote.
- 🍲 **Custom Hooks**: Insert your special logic like a master chef.

---

##  📓 Installation

Installing is as simple as:

```bash
npm install sword-ecs
```

💡 **Pro Tip:** 🧙‍♂️ Don't forget to run `npm install` – your code won't magically work without it!

---

## 🚀 Getting Started

Here’s how you start creating your next **award-winning** game:

```typescript
import { World, Entity } from 'sword-ecs';

// Create your first epic entity
interface MyEntity extends Entity {
  position: { x: number, y: number };
  velocity: { x: number, y: number };
  health: number;
}

const world = new World<MyEntity>([
  (dt: number) => {
    world.query({ has: ['position', 'velocity'] }).entities.forEach(entity => {
      entity.position.x += entity.velocity.x * dt;
      entity.position.y += entity.velocity.y * dt;
    });
  }
]);

const player = world.createEntity({
  position: { x: 0, y: 0 },
  velocity: { x: 1, y: 1 },
  health: 100, // Because you don't want your player dying too soon! 💀
});

function gameLoop(dt: number) {
  world.runSystems(dt);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

> 📜 **Disclaimer**: No real entities were harmed during this loop! 

## 🔍 Systems and Queries

Systems are your **game engine ninjas** 🥷, silently doing their job every frame. Define them and let them work their magic!

```typescript
world.addSystem((dt) => {
  const { entities } = world.query({
    has: ['position', 'velocity'],
    where: (entity) => entity.health > 0,
  });

  entities.forEach(entity => {
    entity.position.x += entity.velocity.x * dt;
    entity.position.y += entity.velocity.y * dt;
  });
});
```

> 🧑‍💻 _"Just one query a day keeps the bugs away!"_ – Random dev wisdom

## <🧠 Events

**Life's more fun with events!** 

```typescript
world.subscribeToEvent('entityAdded', (event) => {
  console.log('🚀 Entity added:', event.entity);
});

world.emitEvent('customEvent', { message: 'Hello, World! 🌍' });
```

> 💌 Fun fact: Emitting custom events is like sending a postcard to all your entities.

## Advanced Features

- ⌛ **Deferred Entity Creation**: Because some entities like to make a dramatic entrance.
- 🎫 **Custom Hooks**: Use lifecycle hooks like an exclusive backstage pass to control entity behavior.
---

## 🤝 Contributing

We would love your help to make this engine even more **awesome**! Submit issues, PRs, or just send us a virtual high-five!

> 🕸️ _"With great engines, comes great responsibility."_ – Not Spider-Man, but close

Feel free to contribute at the [GitHub repository]((https://github.com/f-irac-odes/-medievaljs-sword)).

## 📜 License

This project is licensed under the **MIT License**.

---

🎮 Now go ahead and build something epic with **Sword ECS**! **Enjoy the ride!**
```
