import type { AnyEntity } from "./collection";
import type { World } from "./ecs";

export class WorldRunner<T extends AnyEntity> {
    private world: World<T>;
    private lastTime: number;
    private targetRefreshRate: number;
    private interval: ReturnType<typeof setInterval> | undefined;

    constructor(world: World<T>, targetRefreshRate = 60) {
        this.world = world;
        this.lastTime = Date.now();
        this.targetRefreshRate = targetRefreshRate;
    }

    private loop = () => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000 || 0;
        this.lastTime = currentTime;

        // Call the world's update method
        this.world.run(deltaTime);
    };

    public begin(): void {
        if (this.interval) return; // Prevent starting multiple intervals
        this.interval = setInterval(this.loop, 1000 / this.targetRefreshRate);
    }

    public pause(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = undefined;
    }

    public resume(): void {
        if (!this.interval) {
            this.lastTime = Date.now();
            this.interval = setInterval(this.loop, 1000 / this.targetRefreshRate);
        }
    }

    public togglePause(): void {
        if (this.interval) {
            this.pause();
        } else {
            this.resume();
        }
    }
}
