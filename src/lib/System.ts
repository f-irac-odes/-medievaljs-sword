export interface ISystem <T>{
	name: string
    order?: { auto: boolean, number: number }
	update: (params: { deltaTime: number; entities: T[] }) => void
}

export class BaseSystem<T> implements ISystem<T> {
	public name: string

	constructor(name: string) {
		this.name = name
	}

	filter(): boolean {
		return false
	}

	public update(): void {
		// do nothing
	}
}