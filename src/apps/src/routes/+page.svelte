<script lang="ts">
	import { World, type Entity } from '@medieval/sword';

	let isGameStarted = false;

	let button: HTMLButtonElement;
	let div: HTMLDivElement;
	let start: HTMLDivElement;

	$effect(() => {
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
			if (world.queryEntities((e) => e.isAlive! && !e.isPlayer).length < 3) {
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
		}, 3000);

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
					const [player] = world.queryEntities((e) => e.isPlayer! && e.isAlive!);

					// Check bullet-enemy collisions
					for (const bullet of bullets) {
						for (const enemy of enemies) {
							if (!player) return;
							if (
								bullet.x! < enemy.x! + enemy.width! &&
								bullet.x! + bullet.width! > enemy.x! &&
								bullet.y! < enemy.y! + enemy.height! &&
								bullet.y! + bullet.height! > enemy.y!
							) {
								bullet.isAlive = false;
								world.destroy(bullet);
								enemy.health -= 10;
								if (enemy.health! <= 0){
                                    enemy.isAlive = false;
                                    world.destroy(enemy);
                                };
								break
							}
						}
					}

					for (const enemy of enemies) {
						if (!player) return;
						if (
							player.x! < enemy.x! + enemy.width! &&
							player.x! + player.width! > enemy.x! &&
							player.y! < enemy.y! + enemy.height! &&
							player.y! + player.height! > enemy.y!
						) {
							player.health -= 1;
							if (player.health! <= 0) {
								window.removeEventListener('keydown', () => {});
								window.removeEventListener('keyup', () => {});
								player.isAlive = false;
							}

							if (!player.isAlive) {
								world.destroy(player);
								canvas.style = 'display: none';
								div.style = 'display: flex';
							}
							break;
						}
					}
				},
				({ world }) => {
					const enemies = world.queryEntities((e) => !e.isPlayer! && !e.isBullet && e.isAlive!);
					const [player] = world.queryEntities((e) => e.isPlayer! && e.isAlive!);

					if (!player) return; // Check for the player's existence just once.

					for (const enemy of enemies) {
						// Calculate movement direction based on the player's position relative to the enemy.
						const dxToPlayer = player.x! - enemy.x!;
						const dyToPlayer = player.y! - enemy.y!;

						// Set horizontal movement
						if (dxToPlayer > 0) {
							enemy.x += 0.1; // Move right
							enemy.dx = 1;
						} else if (dxToPlayer < 0) {
							enemy.x -= 0.1; // Move left
							enemy.dx = -1;
						} else {
							enemy.dx = 0; // No horizontal movement
						}

						// Set vertical movement
						if (dyToPlayer > 0) {
							enemy.y += 0.1; // Move down (player is below)
							enemy.dy = 1;
						} else if (dyToPlayer < 0) {
							enemy.y -= 0.1; // Move up (player is above)
							enemy.dy = -1;
						} else {
							enemy.dy = 0; // No vertical movement
						}
					}
				}
			]
		});

		// Input Handling
		const keys: Record<string, boolean> = {};
		window.addEventListener('keydown', (e) => {
			e.stopPropagation();
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
					player.y -= player.speed!;
					player.dx = 0;
					player.dy = -1;
				}
				if (keys['ArrowDown']) {
					player.y += player.speed!;
					player.dx = 0;
					player.dy = 1;
				}
				if (keys['ArrowLeft']) {
					player.x -= player.speed!;
					player.dx = -1;
					player.dy = 0;
				}
				if (keys['ArrowRight']) {
					player.x += player.speed!;
					player.dx = 1;
					player.dy = 0;
				}
			}

			// Move Bullets
			const bullets = world.queryEntities((e) => e.isBullet! && e.isAlive!);
			for (const bullet of bullets) {
				bullet.x += bullet.dx! * bullet.speed!;
				bullet.y += bullet.dy! * bullet.speed!;
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
			button.style = 'display: none';
			start.style = 'display: none';
			canvas.style = 'display: block';
			number = gameLoop();
		}

		button.onclick = () => {
			startGame();
		};

		return () => {
			cancelAnimationFrame(number);
			canvas.style = 'display: none';
			button.style = 'display: block';
		};
	});
</script>

<div bind:this={start}>
	<button bind:this={button}>Play</button>
</div>

<div style="display: none;" bind:this={div}>
	<h1>DEFEAT</h1>
</div>

<style>
	h1 {
		color: white;
		font-size: 50px;
	}
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
