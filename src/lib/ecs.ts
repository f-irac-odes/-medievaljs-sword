interface Entity {
	[key: string]: any;
}
type LifecycleHook<T extends Entity> = (entity: T) => void;
type UpdateHook = (deltaTime: number) => void;

type EventCallback<T> = (eventData: T) => void;

interface EntityEvent<T extends Entity> {
	entity: T;
}

interface QueryEvent<T extends Entity> {
	entities: T[];
	addedEntities: T[];
	removedEntities: T[];
}

type Archetype<T extends Entity> = Partial<T>;

/**
 * Represents an Entity-Component-System (ECS) world.
 */
class World<T extends Entity> {
	private entities: T[] = []; // List of all entities in the world
	private archetypes: Map<string, Archetype<T>> = new Map(); // Map of archetype names to archetype definitions
	private systems: ((entities: T[], deltaTime: number) => void | Promise<void>)[] = []; // List of systems to process entities
	private onEntityAddedHooks: LifecycleHook<T>[] = []; // List of hooks to execute when an entity is added
	private onEntityRemovedHooks: LifecycleHook<T>[] = []; // List of hooks to execute when an entity is removed
	private onUpdateHooks: UpdateHook[] = []; // List of hooks to execute on each update tick
	private eventListeners: Map<string, EventCallback<any>[]> = new Map(); // Map of event names to event listener callbacks

	/**
	 * Creates a new entity with the given components.
	 * @param components The components to initialize the entity with.
	 * @returns The created entity.
	 */
	createEntity(components: Partial<T>): T {
		const entity = { ...components } as T;
		this.entities.push(entity);
		this.emitEvent('entityAdded', { entity });
		this.onEntityAddedHooks.forEach((hook) => hook(entity));
		return entity;
	}

	/**
	 * Creates a new entity from a registered archetype.
	 * @param archetypeName The name of the archetype to use for creating the entity.
	 * @returns The created entity.
	 * @throws Error if the archetype with the given name is not found.
	 */
	createEntityFromArchetype(archetypeName: string): T {
		const archetype = this.archetypes.get(archetypeName);
		if (!archetype) {
			throw new Error(`Archetype "${archetypeName}" not found.`);
		}
		const entity = { ...archetype } as T;
		this.entities.push(entity);
		this.emitEvent('entityAdded', { entity });
		this.onEntityAddedHooks.forEach((hook) => hook(entity));
		return entity;
	}

	/**
	 * Removes the specified entity from the world.
	 * @param entity The entity to remove.
	 */
	removeEntity(entity: T) {
		const index = this.entities.indexOf(entity);
		if (index !== -1) {
			this.entities.splice(index, 1);
			this.emitEvent('entityRemoved', { entity });
			this.onEntityRemovedHooks.forEach((hook) => hook(entity));
		}
	}

	/**
	 * Adds a system to the world for processing entities.
	 * @param system The system function that processes entities.
	 */
	addSystem(system: (entities: T[], deltaTime: number) => void | Promise<void>) {
		this.systems.push(system);
	}

	/**
	 * Adds a hook to execute when an entity is added to the world.
	 * @param hook The hook function to execute.
	 */
	addOnEntityAddedHook(hook: LifecycleHook<T>) {
		this.onEntityAddedHooks.push(hook);
	}

	/**
	 * Adds a hook to execute when an entity is removed from the world.
	 * @param hook The hook function to execute.
	 */
	addOnEntityRemovedHook(hook: LifecycleHook<T>) {
		this.onEntityRemovedHooks.push(hook);
	}

	/**
	 * Adds a hook to execute on each update tick of the world.
	 * @param hook The hook function to execute.
	 */
	addOnUpdateHook(hook: UpdateHook) {
		this.onUpdateHooks.push(hook);
	}

	/**
	 * Runs all systems in the world with the given delta time.
	 * @param deltaTime The time elapsed since the last update.
	 */
	async runSystems(deltaTime: number) {
		this.onUpdateHooks.forEach((hook) => hook(deltaTime));
		for (const system of this.systems) {
			await system(this.entities, deltaTime);
		}
	}

	/**
	 * Queries entities in the world based on the specified filter criteria.
	 * @param filter The filter criteria for querying entities.
	 * @returns An object containing matched entities and hooks for monitoring entity additions and removals from the query result.
	 */
	query(filter: {
		has?: (keyof T)[];
		where?: (entity: T) => boolean;
		none?: (keyof T)[];
		tags?: (keyof T)[];
	}): {
		entities: T[];
		addHook: (hook: LifecycleHook<T>) => void;
		removeHook: (hook: LifecycleHook<T>) => void;
	} {
		const matchedEntities = this.entities.filter((entity) => {
			const hasComponents = filter.has
				? filter.has.every((component) => component in entity)
				: true;
			const passesCondition = filter.where ? filter.where(entity) : true;
			const lacksComponents = filter.none
				? filter.none.every((component) => !(component in entity))
				: true;
			const hasTags = filter.tags ? filter.tags.every((tag) => !!entity[tag]) : true;
			return hasComponents && passesCondition && lacksComponents && hasTags;
		});

		const addHook = (hook: LifecycleHook<T>) => {
			matchedEntities.forEach((entity) => hook(entity));
		};

		const removeHook = (hook: LifecycleHook<T>) => {
			const removalSet = new Set(matchedEntities);
			this.onEntityRemovedHooks.push((entity) => {
				if (removalSet.has(entity)) {
					hook(entity);
				}
			});
		};

		// Emit query events
		this.emitQueryEvents(matchedEntities);

		return {
			entities: matchedEntities,
			addHook,
			removeHook
		};
	}

	/**
	 * Subscribes to events triggered by the world.
	 * @param eventName The name of the event to subscribe to.
	 * @param callback The callback function to invoke when the event occurs.
	 */
	subscribeToEvent(eventName: string, callback: EventCallback<any>) {
		if (!this.eventListeners.has(eventName)) {
			this.eventListeners.set(eventName, []);
		}
		const listeners = this.eventListeners.get(eventName);
		if (listeners) {
			listeners.push(callback);
		}
	}

	/**
	 * Registers an archetype with the given name and definition.
	 * @param name The name of the archetype.
	 * @param archetype The archetype definition.
	 */
	registerArchetype(name: string, archetype: Archetype<T>) {
		this.archetypes.set(name, archetype);
	}

	/**
	 * Adds a tag to the specified entity.
	 * @param entity The entity to add the tag to.
	 * @param tag The tag to add.
	 */
	addTag(entity: T, tag: keyof T) {
		entity[tag] = {} as T[keyof T];
	}

	/**
	 * Removes a tag from the specified entity.
	 * @param entity The entity to remove the tag from.
	 * @param tag The tag to remove.
	 */
	removeTag(entity: T, tag: keyof T) {
		delete entity[tag];
	}

	/**
	 * Converts the world state to JSON format.
	 * @returns The JSON representation of the world state.
	 */
	toJSON(): string {
		return JSON.stringify(this.entities);
	}

	/**
	 * Restores the world state from JSON format.
	 * @param json The JSON representation of the world state.
	 */
	fromJSON(json: string) {
		this.entities = JSON.parse(json) as T[];
	}

	private emitQueryEvents(matchedEntities: T[]) {
		const currentEntities = new Set(this.entities);
		const previousEntities = new Set(matchedEntities);

		const addedEntities = [...currentEntities].filter((entity) => !previousEntities.has(entity));
		const removedEntities = [...previousEntities].filter((entity) => !currentEntities.has(entity));

		if (addedEntities.length > 0 || removedEntities.length > 0) {
			this.emitEvent('queryChanged', {
				entities: matchedEntities,
				addedEntities,
				removedEntities
			});
		}
	}

	private emitEvent<T>(eventName: string, eventData: T) {
		const listeners = this.eventListeners.get(eventName);
		if (listeners) {
			listeners.forEach((listener) => listener(eventData));
		}
	}
}
