import { Collection, type AnyEntity } from './collection';
import type { IComponentValue, Component } from './components';
import { Runner } from './Runner';
import type { ISystem } from './System';

type EventC<T> = (e: T) => void;

export class World<T extends AnyEntity> extends Collection<T> {
	added: Array<EventC<Partial<T>>> = [];
	removed: Array<EventC<Partial<T>>> = [];
	_runner: Runner<Partial<T>> = new Runner();

	add<V extends IComponentValue>(
		entity: Partial<T>,
		component: Component<V> | keyof T,
		value?: T[keyof T] | undefined
	): void {
		super.add(entity, component, value);
		this.added.forEach((listener) => listener(entity));
	}


	destroy(entity: Partial<T>): void {
		super.destroy(entity);
		this.removed.forEach((listener) => listener(entity));
	}


	on = {
		entityAdded: (callback: EventC<Partial<T>>) => {
			this.added.push(callback);
		},
		entityRemoved: (callback: EventC<Partial<T>>) => {
			this.removed.push(callback);
		}
	};


	run(dt: number): void {
		this._runner.update(dt, this._entities);
	}


	addSystem(system: ISystem<Partial<T>>): void {
		this._runner.addSystem(system);
	}

	removeSystem(system: ISystem<Partial<T>>) {
		this._runner.removeSystem(system);
	}

	get entities() {
		return this._entities;
	}

	get runner() {
		return this._runner;
	}
}
