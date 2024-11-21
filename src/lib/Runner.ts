import type { ISystem } from "./System";

export class Runner<T> {
    private _systems: Array<ISystem<T>> = [];

    /**
     * Adds a system to the runner.
     * If `order.auto` is `true`, sorts systems based on their `order.number`.
     */
    addSystem(system: ISystem<T>): void {
        this._systems.push(system);
        if (system.order?.auto) {
            this._systems.sort((a, b) => {
                const orderA = a.order?.number ?? 0;
                const orderB = b.order?.number ?? 0;
                return orderA - orderB;
            });
        }
    }

    /**
     * Removes a system from the runner.
     */
    removeSystem(system: ISystem<T>): void {
        const index = this._systems.indexOf(system);
        if (index > -1) {
            this._systems.splice(index, 1);
        }
    }

    /**
     * Executes all systems in order.
     * Passes the provided `deltaTime` and `entities` to each system's `update` method.
     */
    update(deltaTime: number, entities: T[]): void {
        for (const system of this._systems) {
            system.update({ deltaTime, entities });
        }
    }

    /**
     * Clears all systems from the runner.
     */
    clear(): void {
        this._systems.length = 0;
    }

    /**
     * Retrieves the list of systems.
     */
    get systems(): ISystem<T>[] {
        return [...this._systems]; // Return a copy to prevent external mutation
    }
}
