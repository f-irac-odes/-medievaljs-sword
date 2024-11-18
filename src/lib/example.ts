// Create an HTML canvas element
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext("2d");

interface GameEntity extends Entity {
    position?: { x: number; y: number };
    velocity?: { x: number; y: number };
    color?: string;
    size?: number;
}

// Initialize the ECS world
const world = new World<GameEntity>([]);

// Register an archetype for moving entities
world.registerArchetype("movingEntity", {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    color: "blue",
    size: 20
});

// System: Move entities based on their velocity
function movementSystem(dt: number) {
    const { entities } = world.query({ has: ["position", "velocity"] });

    for (const entity of entities) {
        entity.position.x += entity.velocity.x * dt;
        entity.position.y += entity.velocity.y * dt;

        // Bounce the entity off the edges of the canvas
        if (entity.position.x < 0 || entity.position.x > canvas.width) {
            entity.velocity.x *= -1;
            entity.color = randomColor();
        }
        if (entity.position.y < 0 || entity.position.y > canvas.height) {
            entity.velocity.y *= -1;
            entity.color = randomColor();
        }
    }
}

// System: Render entities to the canvas
function renderSystem() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { entities } = world.query({ has: ["position", "color", "size"] });

    for (const entity of entities) {
        ctx.fillStyle = entity.color!;
        ctx.beginPath();
        ctx.arc(entity.position.x, entity.position.y, entity.size!, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Utility: Generate a random color
function randomColor(): string {
    return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
}

// Spawn some entities
for (let i = 0; i < 10; i++) {
    world.spawn({
        position: { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
        velocity: { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
        color: randomColor(),
        size: 10 + Math.random() * 20
    });
}

// Add systems to the world
world.addSystem((dt) => movementSystem(dt));
world.addSystem(() => renderSystem());

// Game loop
let lastTime = performance.now();
function gameLoop() {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;

    world.run(deltaTime);
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
