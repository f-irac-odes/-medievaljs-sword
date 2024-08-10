// Define interfaces and types
export interface Entity {
	[key: string]: any;
}

/**
 * A utility type that marks the specified properties as required.
 */
export type With<E, P extends keyof E> = E & Required<Pick<E, P>>;

export type Without<E, P extends keyof E> = Omit<E, P>;

/**
 * Represents a lifecycle hook function that operates on an entity.
 */
type LifecycleHook<T extends Entity> = (entity: T) => void;

/**
 * Represents an update hook function that runs on each update tick.
 */
type UpdateHook = (deltaTime: number) => void;

/**
 * Represents a callback function for handling events with specific data.
 */
type EventCallback<T> = (eventData: T) => void;

/**
 * Represents an event associated with an entity.
 */
export interface EntityEvent<T extends Entity> {
	entity: T;
}

/**
 * Represents an event associated with a query operation on entities.
 */
export interface QueryEvent<T extends Entity> {
	entities: T[];
	singleton: T;
	addedEntities: T[];
	removedEntities: T[];
}

/**
 * Represents a partial archetype definition for entities.
 */
export type Archetype<T> = Partial<T>;

/**
 * The World class manages entities, archetypes, systems, and event listeners.
 * It provides methods to create, query, and manipulate entities in an ECS (Entity Component System) setup.
 */
export class World<T extends Entity> {
	entities: T[] = []; // Array to store all entities in the world
	archetypes: Map<string, Archetype<any>> = new Map(); // Map to store archetype definitions
	systems: ((dt: number) => void | Promise<void>)[] = []; // Array to store system functions
	onEntityAddedHooks: LifecycleHook<T>[] = []; // Array of hooks to run when an entity is added
	onEntityRemovedHooks: LifecycleHook<T>[] = []; // Array of hooks to run when an entity is removed
	onUpdateHooks: UpdateHook[] = []; // Array of hooks to run on each update tick
	eventListeners: Map<string, EventCallback<any>[]> = new Map(); // Map of event listeners for different events
	private entityById: Map<number, T> = new Map(); // Map to store entities by their numeric ID
	private nextId: number = 1; // Counter for generating unique numeric IDs
	private entityCreationQueue: Partial<T>[] = []; // Queue for deferred entity creation

	constructor(systems: Array<(dt: number) => void | Promise<void>>) {
		this.systems.push(...systems);
	}

	/**
	 * Generates a unique numeric ID for an entity.
	 * @param entity The entity to generate the ID for.
	 * @returns The generated unique ID.
	 */
	genID(entity: T): number {
		const id = this.nextId++;
		this.entityById.set(id, entity);
		return id;
	}

	/**
	 * Retrieves an entity by its numeric ID.
	 * @param id The ID of the entity to retrieve.
	 * @returns The entity with the specified ID, or undefined if not found.
	 */
	byID(id: number): T | undefined {
		return this.entityById.get(id);
	}

	/**
	 * Creates a new entity with the given components.
	 * @param components The components to initialize the entity with.
	 * @param onAdd Optional callback function invoked when the entity is added.
	 * @returns The created entity.
	 */
	createEntity(components: Partial<T>, onAdd?: Function): T {
		const entity = { ...components } as T;
		this.entities.push(entity);
		if (onAdd) onAdd({ entity, components });
		this.emitEvent('entityAdded', { entity });
		this.onEntityAddedHooks.forEach((hook) => hook(entity));
		return entity;
	}

	/**
	 * Creates a new entity from a registered archetype.
	 * @param archetypeName The name of the archetype to use for creating the entity.
	 * @param newState The state to initialize the new entity with.
	 * @returns The created entity.
	 * @throws Error if the archetype with the given name is not found.
	 */
	createEntityFromArchetype(archetypeName: string, newState: any): T {
		const archetype = this.archetypes.get(archetypeName);
		if (!archetype) {
			throw new Error(`Archetype "${archetypeName}" not found.`);
		}
		const entity = { ...archetype, ...newState } as T;
		this.entities.push(entity);
		this.emitEvent('entityAdded', { entity });
		this.onEntityAddedHooks.forEach((hook) => hook(entity));
		return entity;
	}

	/**
	 * Updates an entity with new components or modifies existing components.
	 * @param e The entity to update.
	 * @param updateOrFn An object or function specifying the updates.
	 */
	updateEntity(e: T, updateOrFn: Function | object) {
		if (typeof updateOrFn === 'function') {
			updateOrFn(e);
		} else {
			Object.assign(e, updateOrFn);
		}
	}

	/**
	 * Adds a component to the specified entity.
	 * @param entity The entity to which the component will be added.
	 * @param componentKey The key of the component to add.
	 * @param componentValue The value of the component to add.
	 */
	addComponent<K extends keyof T>(entity: T, componentKey: K, componentValue: T[K]) {
		entity[componentKey] = componentValue;
		this.emitEvent('state-changed', { entity });
		this.emitQueryEvents([entity]);
	}

	/**
	 * Removes a component from the specified entity.
	 * @param entity The entity from which the component will be removed.
	 * @param componentKey The key of the component to remove.
	 */
	removeComponent<K extends keyof T>(entity: T, componentKey: K) {
		delete entity[componentKey];
		this.emitEvent('state-changed', { entity });
		this.emitQueryEvents([entity]);
	}

	/**
	 * Removes the specified entity from the world.
	 * @param entity The entity to remove from the world.
	 * @param onRemove Optional callback function invoked when the entity is removed.
	 */
	removeEntity(entity: any, onRemove?: Function) {
		const index = this.entities.indexOf(entity);
		if (index > -1) {
			this.entities.splice(index, 1);
			const id = this.getKeyByValue(this.entityById, entity);
			if (id !== undefined) {
				this.entityById.delete(id);
			}
			if (onRemove) onRemove({ entity });
			this.emitEvent('entityRemoved', { entity });
			this.onEntityRemovedHooks.forEach((hook) => hook(entity));
		}
	}

	/**
	 * Adds a system to the world for processing entities.
	 * @param system The system function that processes entities.
	 */
	addSystem(system: (dt: number) => void | Promise<void>) {
		this.systems.push(system);
	}

	/**
	 * Runs all systems in the world with the given delta time.
	 * @param deltaTime The time elapsed since the last update.
	 */
	async runSystems(deltaTime: number) {
		this.onUpdateHooks.forEach((hook) => hook(deltaTime));

		for (const system of this.systems) {
			await system(deltaTime);
		}

		// Process deferred entity creation queue
		while (this.entityCreationQueue.length > 0) {
			const entityData = this.entityCreationQueue.shift();
			if (entityData) {
				this.createEntity(entityData);
			}
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
		singleton: T | null;
		addHook: (hook: LifecycleHook<T>) => void;
		removeHook: (hook: LifecycleHook<T>) => void;
	} {
		const match = () => {
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

			return matchedEntities;
		};

		let matchedEntities = match();

		const addHook = (hook: LifecycleHook<T>) => {
			for (const e of matchedEntities) {
				hook(e);
			}

			this.onEntityAddedHooks.push((entity) => {
				const m = match();

				if (m.includes(entity)) {
					hook(entity);
					matchedEntities.push(entity);
				}

			});
		};

		const removeHook = (hook: LifecycleHook<T>) => {

			this.subscribeToEvent('entityRemoved', ({ entity }) => {
				hook(entity);
				matchedEntities.splice(matchedEntities.indexOf(entity), 1)
			})
		};

		this.emitQueryEvents(matchedEntities);

		const singleton = matchedEntities.length === 1 ? matchedEntities[0] : null;

		return {
			entities: matchedEntities,
			singleton,
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
	 * Adds a tag to the specified entity.
	 * @param entity The entity to add the tag to.
	 * @param tag The tag to add.
	 */
	addTag(entity: T, tag: keyof T | string) {
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
		return JSON.stringify({
			entities: this.entities,
			systems: this.systems,
			archetypes: Array.from(this.archetypes.entries()),
			eventListeners: Array.from(this.eventListeners.entries()),
			onUpdateHooks: this.onUpdateHooks,
			onEntityAddedHooks: this.onEntityAddedHooks,
			onEntityRemovedHooks: this.onEntityRemovedHooks
		});
	}

	/**
	 * Restores the world state from JSON format.
	 * @param json The JSON representation of the world state.
	 */
	fromJSON(json: string) {
		const Njson = JSON.parse(json);
		this.entities = Njson.entities as T[];
		this.systems = Njson.systems;
		this.archetypes = new Map<string, Archetype<T>>();
		for (const [name, archetype] of Njson.archetypes) {
			this.archetypes.set(name, archetype);
		}
		for (const [name, eventListener] of Njson.eventListeners) {
			this.eventListeners.set(name, eventListener);
		}
		this.onUpdateHooks = Njson.onUpdateHooks;
		this.onEntityAddedHooks = Njson.onEntityAddedHooks;
		this.onEntityRemovedHooks = Njson.onEntityRemovedHooks;
	}

	/**
	 * Emits query events for the matched entities.
	 * @param matchedEntities The entities that match the query criteria.
	 */
	private emitQueryEvents(matchedEntities: T[]) {
		const addedEntities = matchedEntities.filter((entity) => !this.entities.includes(entity));
		const removedEntities = this.entities.filter((entity) => !matchedEntities.includes(entity));

		if (addedEntities.length > 0 || removedEntities.length > 0) {
			this.emitEvent('queryChanged', {
				entities: matchedEntities,
				addedEntities,
				removedEntities
			});
		}
	}

	/**
	 * Emits an event with associated data.
	 * @param eventName The name of the event to emit.
	 * @param eventData The data associated with the event.
	 */
	emitEvent<T>(eventName: string, eventData: T) {
		const listeners = this.eventListeners.get(eventName);
		if (listeners) {
			listeners.forEach((listener) => listener(eventData));
		}
	}

	/**
	 * Adds an entity to the deferred creation queue for deferred entity creation.
	 * @param entityData The data of the entity to be created.
	 * @returns A new entity object created from the provided entity data.
	 */
	addEntityToQueue(entityData: Partial<T>): T {
		this.entityCreationQueue.push(entityData);
		return { ...entityData } as T;
	}

	/**
	 * Helper function to find a key in a Map by its value.
	 * @param map The Map object to search.
	 * @param searchKey The value to search for.
	 * @returns The key associated with the search value, or undefined if not found.
	 */
	private getKeyByValue(map: Map<any, any>, searchKey: any): any {
		for (const [key, value] of map.entries()) {
			if (value === searchKey) return key;
		}
		return undefined;
	}
}
