type IGameEvent<T> = { name: string; payload: T };

export type Entity = { id: string; [key: string]: any };

type QueryPredicate<T> = (entity: Partial<T>) => boolean;

type EventContext<T extends Entity, P> = {
	world: World<T>;
	entity: Partial<T>;
	payload: P;
};

type Condition<T, P = any> = (context: EventContext<T, P>) => boolean;

type Action<T, P = any> = (context: EventContext<T, P>) => void;

type IEvent<T, P = any> = {
	priority?: number; // Higher priority executes earlier
	conditions?: Condition<T, P>[];
	actions: Action<T, P>[];
};

type Middleware<T extends Entity> = (
	event: IGameEvent<any>,
	world: World<T>,
	next: () => void
) => void;

export class World<T extends Entity> {
	private entities: Array<Partial<T>> = [];
	private eventListeners: Record<string, IEvent<T, any>[]> = {};
	private middlewares: Middleware<T>[] = [];

	// Cache to hold query results (optional optimization)
	private cachedQueries: Record<string, Array<Partial<T>>> = {};

	/**
	 * Add an entity to the world.
	 */
	create(entity: Partial<T>): Partial<T> {
		if (!entity.id) entity.id = Math.random().toString(36).substring(2); // Generate unique ID
		this.entities.push(entity);
		this.emitEvent({ name: 'entityCreated', payload: entity });
		this.updateQueries(); // Invalidate cached queries after creation
		return entity;
	}

	/**
	 * Remove an entity from the world.
	 */
	destroy(entity: Partial<T>): void {
		const index = this.entities.findIndex((e) => e.id === entity.id);
		if (index !== -1) {
			this.entities.splice(index, 1);
			this.emitEvent({ name: 'entityDestroyed', payload: entity });
			this.updateQueries(); // Invalidate cached queries after deletion
		}
	}

	/**
	 * Update an entity in the world.
	 */
	update(entity: Partial<T>, changes: Partial<T>): void {
		const index = this.entities.findIndex((e) => e.id === entity.id);
		if (index !== -1) {
			this.entities[index] = { ...this.entities[index], ...changes };
			this.emitEvent({ name: 'entityUpdated', payload: changes });
			this.updateQueries(); // Invalidate cached queries after update
		}
	}

	/**
	 * Add an event listener.
	 */
	on<P>(eventName: string, event: IEvent<T, P>): void {
		if (!this.eventListeners[eventName]) {
			this.eventListeners[eventName] = [];
		}
		this.eventListeners[eventName].push(event);
		this.eventListeners[eventName].sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority
	}

	/**
	 * Emit an event.
	 */
	emitEvent<P>(event: IGameEvent<P>): void {
		const processMiddlewares = (index: number) => {
			if (index >= this.middlewares.length) {
				this.processEvent(event);
			} else {
				this.middlewares[index](event, this, () => processMiddlewares(index + 1));
			}
		};
		processMiddlewares(0);
	}

	/**
	 * Process an event.
	 */
	private processEvent<P>(event: IGameEvent<P>): void {
		const listeners = this.eventListeners[event.name] || [];

		listeners.forEach((evt) => {
			this.entities.forEach((entity) => {
				const context = { world: this, entity, payload: event.payload };

				// Check if conditions are present, otherwise proceed to actions
				const conditionsMet = evt.conditions ? evt.conditions.every((cond) => cond(context)) : true; // If no conditions, actions are executed unconditionally

				if (conditionsMet) {
					evt.actions.forEach((action) => action(context));
				}
			});
		});
	}

	/**
	 * Add middleware.
	 */
	use(middleware: Middleware<T>): void {
		this.middlewares.push(middleware);
	}

	/**
	 * Query entities based on a predicate.
	 */
	queryEntities(predicate: QueryPredicate<T>): Array<Partial<T>> {
		// Query logic with potential caching optimization
		const cacheKey = this.getCacheKey(predicate);
		if (this.cachedQueries[cacheKey]) {
			return this.cachedQueries[cacheKey];
		}

		const result = this.entities.filter(predicate);
		this.cachedQueries[cacheKey] = result;
		return result;
	}

	/**
	 * Generate a unique cache key based on the query predicate.
	 */
	private getCacheKey(predicate: QueryPredicate<T>): string {
		// Example: cache key could be based on some stringified version of the predicate
		return JSON.stringify(predicate.toString());
	}

	/**
	 * Helper to update query results after an entity is created, updated, or destroyed.
	 */
	private updateQueries(): void {
		// Invalidate the cache for all queries, as entities have changed.
		this.cachedQueries = {}; // Clear all cached query results
	}
}
