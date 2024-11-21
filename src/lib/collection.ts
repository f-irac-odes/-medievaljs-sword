import { Component, type IComponentValue } from "./components";

type EventC<T> = (e: T) => void;

type Query<T> = {
    has?: Array<keyof T>;
    not?: Array<keyof T>;
    some?: Array<keyof T>;
    where?: (e: Partial<T>) => boolean;
};

type EntityUtilities<T> = {
    has: (component: keyof T) => boolean;
    not: (component: keyof T) => boolean;
    some: (components: (keyof T)[]) => boolean;
};

export type AnyEntity = {}

export class Collection<T extends AnyEntity = any> {
    _entities: Array<Partial<T>> = [];
    _queries: Array<Query<T>> = [];
    _groups: Array<Group<T>> = [];
    _listeners: Map<string, Array<EventC<any>>> = new Map();

    create(entity: Partial<T>): T {
        this._entities.push(entity);
        this.updateQuery([entity]);
        return entity as T;
    }

    destroy(entity: Partial<T>) {
        const index = this._entities.indexOf(entity);
        if (index > -1) {
            this._entities.splice(index, 1);
            this.updateQuery([entity]);
        }
    }

    add<V extends IComponentValue>(
        entity: Partial<T>,
        component: Component<V> | keyof T,
        value?: T[keyof T]
    ) {
        if (component instanceof Component) {
            entity[component.name as keyof T] = component.value as T[keyof T];
        } else if (value !== undefined) {
            entity[component] = value;
        }
        this.updateQuery([entity]);
    }

    remove(entity: Partial<T>, component: Component<any> | keyof T) {
        if (component instanceof Component) {
            delete entity[component.name as keyof T];
        } else {
            delete entity[component];
        }
        this.updateQuery([entity]);
    }

    update<V extends IComponentValue>(
        entity: Partial<T>,
        component: Component<V> | Partial<T> | ((e: Partial<T>) => void)
    ) {
        if (component instanceof Component) {
            entity[component.name as keyof T] = component.value as T[keyof T];
        } else if (typeof component === "function") {
            component(entity);
        } else {
            Object.assign(entity, component);
        }
        this.updateQuery([entity]);
    }

    freeze(entity: Partial<T>): Readonly<Partial<T>> {
        return Object.freeze(entity);
    }

    addGroup(group: Group<T>) {
        this._groups.push(group);
    }

    removeGroup(group: Group<T>) {
        const index = this._groups.indexOf(group);
        if (index > -1) {
            this._groups.splice(index, 1);
        }
    }

    query(
        filter:
            | Query<T> // Object-based query
            | ((e: Partial<T> & EntityUtilities<T>) => boolean) // Function-based query
    ): Partial<T>[] {
        if (typeof filter === "function") {
            return this._entities
                .map((entity) => this._withUtilities(entity))
                .filter(filter);
        } else {
            return this._entities.filter((entity) => {
                const hasComponents = filter.has!.every((key) => key in entity);
                const notComponents = filter.not!.every((key) => !(key in entity));
                const someComponents =
                    filter.some!.length === 0 || filter.some!.some((key) => key in entity);
                const matchesWhere = filter.where!(entity);
                return hasComponents && notComponents && someComponents && matchesWhere;
            });
        }
    }

    private _withUtilities(entity: Partial<T>): Partial<T> & EntityUtilities<T> {
        return {
            ...entity,
            has: (component: keyof T) => component in entity,
            not: (component: keyof T) => !(component in entity),
            some: (components: (keyof T)[]) => components.some((key) => key in entity),
        };
    }
    

    emitEvent<T>(eventName: string, eventData: T) {
        const listeners = this._listeners.get(eventName);
        if (listeners) {
            listeners.forEach((listener) => listener(eventData));
        }
    }

    subscribe<T>(eventName: string, callback: EventC<T>) {
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
        }
        this._listeners.get(eventName)!.push(callback);
    }

    private updateQuery(matchedEntities: Partial<T>[]) {
        const addedEntities = matchedEntities.filter(
            (entity) => !this._entities.includes(entity)
        );
        const removedEntities = this._entities.filter(
            (entity) => !matchedEntities.includes(entity)
        );

        if (addedEntities.length > 0 || removedEntities.length > 0) {
            this.emitEvent("queryChanged", {
                entities: matchedEntities,
                addedEntities,
                removedEntities,
            });
        }
    }

    clear() {
        this._listeners = new Map();
        this._entities = [];
        this._queries = [];
        this._groups = [];
    }
}

class Group<T> {
    entities: Partial<T>[] = [];

    add(entity: Partial<T>) {
        this.entities.push(entity);
    }

    remove(entity: Partial<T>) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    iterate(fn: (e: Partial<T>) => void) {
        for (const entity of this.entities) {
            fn(entity);
        }
    }
}