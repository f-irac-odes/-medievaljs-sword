// Define interfaces and types
export interface Entity {
	[key: string]: any;
}

function keyValue(map: Map<any, any>, searchKey: any) {
    for (const [key, value] of map.entries()) {
        if (value === searchKey)
            return key;
    }
    return undefined;
}

type LifecycleHook<T extends Entity> = (entity: T) => void;
type UpdateHook = (deltaTime: number) => void;
type EventCallback<T> = (eventData: T) => void;

export interface EntityEvent<T extends Entity> {
	entity: T;
}

export interface QueryEvent<T extends Entity> {
	entities: T[];
	addedEntities: T[];
	removedEntities: T[];
}

export type Archetype<T> = Partial<T>;

// Define World class
export class World<T extends Entity> {
	entities: T[] = [];
	archetypes: Map<string, Archetype<any>> = new Map();
	systems: ((dt: number) => void | Promise<void>)[] = [];
	onEntityAddedHooks: LifecycleHook<T>[] = [];
	onEntityRemovedHooks: LifecycleHook<T>[] = [];
	onUpdateHooks: UpdateHook[] = [];
	eventListeners: Map<string, EventCallback<any>[]> = new Map();
	private entityById: Map<number, T> = new Map();
	private nextId: number = 1;
	private entityCreationQueue: Partial<T>[] = []; // Queue for deferred entity creation

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
	 * Retrieves an entity by its ID.
	 * @param id The ID of the entity to retrieve.
	 * @returns The entity with the specified ID.
	 */
	byID(id: number): T | undefined {
		return this.entityById.get(id);
	}

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
		this.genID(entity);
		this.emitEvent('entityAdded', { entity });
		this.onEntityAddedHooks.forEach((hook) => hook(entity));
		return entity;
	}

	/**
	 * Function used to update multiple properties
	 * @param e the entity to update
	 * @param updateOrFn an object or function
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
	 * @param componentValue The value of the component.
	 */
	addComponent<K extends keyof T>(entity: T, componentKey: K, componentValue: T[K]) {
		entity[componentKey] = componentValue;
		this.emitQueryEvents([entity]);
	}

	/**
	 * Removes a component from the specified entity.
	 * @param entity The entity from which the component will be removed.
	 * @param componentKey The key of the component to remove.
	 */
	removeComponent<K extends keyof T>(entity: T, componentKey: K) {
		delete entity[componentKey];
		this.emitQueryEvents([entity]);
	}

	/**
	 * Removes the specified entity from the world.
	 * @param entity The entity to remove.
	 */
	removeEntity(entity: T) {
		const index = this.entities.indexOf(entity);
		if (index !== -1) {
			this.entities.splice(index, 1);
			let id = keyValue(this.entityById, entity)
			this.entityById.delete(id);
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

		// Execute systems
		for (const system of this.systems) {
			await system(deltaTime);
		}

		// Process deferred entity creation queue
		while (this.entityCreationQueue.length > 0) {
			const entityData = this.entityCreationQueue.shift();
			if (entityData) {
				this.createEntity(entityData); // Assuming `createEntity` handles actual entity creation
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
		where?: (entity: T) => void;
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
	fromJSON(json: any) {
		this.entities = JSON.parse(json.entities) as T[];
		this.systems = JSON.parse(json.systems);
		this.archetypes = new Map<string, Archetype<T>>();
		for (const [name, archetype] of JSON.parse(json.archetypes)) {
			this.archetypes.set(name, archetype);
		}
		for (const [name, eventListener] of JSON.parse(json.eventListeners)) {
			this.eventListeners.set(name, eventListener);
		}
		this.onUpdateHooks = JSON.parse(json.onUpdateHooks);
		this.onEntityAddedHooks = JSON.parse(json.onEntityAddedHooks);
		this.onEntityRemovedHooks = JSON.parse(json.onEntityRemovedHooks);
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

	emitEvent<T>(eventName: string, eventData: T) {
		const listeners = this.eventListeners.get(eventName);
		if (listeners) {
			listeners.forEach((listener) => listener(eventData));
		}
	}
}
