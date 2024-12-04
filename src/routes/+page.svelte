<script lang="ts">
    import { onMount } from 'svelte';
    import { World, type Entity } from '$lib';
  
    let isGameStarted = false;

    let button: HTMLButtonElement;
  
    onMount(() => {
      // Canvas Setup
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d')!;
  
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
  
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
  
      // ECS Type Definitions
      type GameEntity = Entity & {
        x: number;
        y: number;
        width: number;
        height: number;
        health: number;
        maxHealth: number;
        isAlive: boolean;
        color: string;
        isPlayer?: boolean;
        isBullet?: boolean;
        speed?: number;
        dx?: number; // Direction x
        dy?: number; // Direction y
      };
  
      // Utility Functions
      function drawHealthBar(
        x: number,
        y: number,
        width: number,
        height: number,
        health: number,
        maxHealth: number
      ) {
        const healthWidth = (health / maxHealth) * width;
        ctx.fillStyle = 'gray';
        ctx.fillRect(x, y - 10, width, 5);
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y - 10, healthWidth, 5);
      }
  
      // World Initialization
      const world = new World<GameEntity>();
  
      // Follow Camera State
      let cameraOffset = { x: 0, y: 0 };
  
      // Player Initialization
      const player = world.create({
        x: 400,
        y: 200,
        width: 20,
        height: 20,
        health: 100,
        maxHealth: 100,
        isAlive: true,
        color: 'blue',
        isPlayer: true,
        speed: 20,
        dx: 0,
        dy: 0 // Initial direction
      });
  
      // Enemy Spawner
      setInterval(() => {
        if (world.queryEntities((e) => e.isAlive! && !e.isPlayer).length < 10) {
          world.create({
            x: Math.random() * canvas.width + cameraOffset.x,
            y: Math.random() * canvas.height + cameraOffset.y,
            width: 20,
            height: 20,
            health: 50,
            maxHealth: 50,
            isAlive: true,
            color: 'green'
          });
        }
      }, 1000);
  
      // Bullet Logic (Shoot Event)
      world.on('shoot', {
        conditions: [
          ({ entity }) => entity.isPlayer! && entity.isAlive! // Only players can shoot
        ],
        actions: [
          ({ world, entity }) => {
            // Create a bullet
            const bulletSpeed = 6; // Bullet speed
            world.create({
              x: entity.x! + entity.width! / 2 - 2.5,
              y: entity.y! + entity.height! / 2 - 2.5,
              width: 5,
              height: 5,
              health: 1,
              maxHealth: 1,
              isAlive: true,
              isBullet: true,
              color: 'red',
              speed: bulletSpeed,
              dx: entity.dx, // Direction x
              dy: entity.dy // Direction y
            });
          }
        ]
      });
  
      // Collision Detection (Fixed)
      world.on('update', {
        actions: [
          ({ world }) => {
            const bullets = world.queryEntities((e) => e.isBullet! && e.isAlive!);
            const enemies = world.queryEntities((e) => !e.isPlayer! && !e.isBullet && e.isAlive!);
  
            // Check bullet-enemy collisions
            for (const bullet of bullets) {
              for (const enemy of enemies) {
                if (
                  bullet.x! < enemy.x! + enemy.width! &&
                  bullet.x! + bullet.width! > enemy.x! &&
                  bullet.y! < enemy.y! + enemy.height! &&
                  bullet.y! + bullet.height! > enemy.y!
                ) {
                  // Handle Collision
                  console.log("here i am")
                  bullet.isAlive = false;
                  enemy.health! -= 10;
                  if (enemy.health! <= 0) enemy.isAlive = false;
                }
              }
            }
          }
        ]
      });
  
      // Input Handling
      const keys: Record<string, boolean> = {};
      window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === ' ') {
          world.emitEvent({ name: 'shoot', payload: null });
        }
      });
      window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
      });
  
      // Update Camera
      function updateCamera() {
        cameraOffset.x = player.x! - canvas.width / 2;
        cameraOffset.y = player.y! - canvas.height / 2;
      }
  
      // Main Update Loop
      function update() {
        // Move Player and Update Facing Direction
        if (player.isAlive) {
          if (keys['ArrowUp']) {
            player.y! -= player.speed!;
            player.dx = 0;
            player.dy = -1;
          }
          if (keys['ArrowDown']) {
            player.y! += player.speed!;
            player.dx = 0;
            player.dy = 1;
          }
          if (keys['ArrowLeft']) {
            player.x! -= player.speed!;
            player.dx = -1;
            player.dy = 0;
          }
          if (keys['ArrowRight']) {
            player.x! += player.speed!;
            player.dx = 1;
            player.dy = 0;
          }
        }
  
        // Move Bullets
        const bullets = world.queryEntities((e) => e.isBullet! && e.isAlive!);
        for (const bullet of bullets) {
          bullet.x! += bullet.dx! * bullet.speed!;
          bullet.y! += bullet.dy! * bullet.speed!;
          if (
            bullet.x! < cameraOffset.x ||
            bullet.x! > cameraOffset.x + canvas.width ||
            bullet.y! < cameraOffset.y ||
            bullet.y! > cameraOffset.y + canvas.height
          ) {
            bullet.isAlive = false; // Remove bullets outside the canvas
          }
        }
  
        // Update Camera
        updateCamera();
  
        // Emit Update Event
        world.emitEvent({ name: 'update', payload: null });
      }
  
      // Main Draw Loop
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        // Draw Entities
        const entities = world.queryEntities((e) => e.isAlive!);
        for (const entity of entities) {
          ctx.fillStyle = entity.color;
          ctx.fillRect(
            entity.x! - cameraOffset.x,
            entity.y! - cameraOffset.y,
            entity.width!,
            entity.height!
          );
  
          if (!entity.isBullet) {
            drawHealthBar(
              entity.x! - cameraOffset.x,
              entity.y! - cameraOffset.y,
              entity.width!,
              entity.height!,
              entity.health!,
              entity.maxHealth!
            );
          }
        }
      }
  
      // Game Loop
      function gameLoop() {
        update();
        draw();
        return requestAnimationFrame(gameLoop);
      }
  
      let number: number = 0;
      // Start Game Function
      function startGame() {
        isGameStarted = true;
        button.style = "display: none";
        canvas.style = "display: block"
        number = gameLoop();
      }

      button.onclick = () => {startGame()}
  
      return () => {
        cancelAnimationFrame(number);
        canvas.style = "display: none";
        button.style = "display: block";
      }
    });
  </script>
  
  <div>
      <button bind:this={button}>Play</button>
  </div>
  
  <style>
    :global(body) {
        margin: 0;
    }

    :global(div) {
      margin: 0;
      overflow: hidden;
      background-color: rgb(222, 232, 255);
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100vw;
      height: 100vh;
      font-family: Arial, sans-serif;
    }
  
    :global(canvas) {
      position: absolute;
      top: 0;
      left: 0;
      border: none;
      width: 100%;
      height: 100%;
      display: none;
    }
  
    button {
      position: absolute;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    button:hover {
      background-color: #0056b3;
    }
  
    button:active {
      background-color: #004085;
    }
  </style>
  