export type Value = string | number | boolean;
export type IComponentValue = Value | Value[] | object;

export interface IComponentInstance<ValueType extends IComponentValue> {
    value: ValueType;
    name: string;
}

export interface IComponentType<ValueType extends IComponentValue> {
    new (value: any): Component<ValueType>;
    name: string;
}

export abstract class Component<ValueType extends IComponentValue>
    implements IComponentInstance<ValueType>
{
    public value: ValueType;
    public name: string;

    public constructor(value: ValueType, name: string) {
        this.value = value;
        this.name = name;
    }
}

function extend<T extends IComponentValue>(component: Component<T>) {
    return { [component.name]: component.value };
}
