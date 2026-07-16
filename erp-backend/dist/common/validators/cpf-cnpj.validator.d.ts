import { ValidatorConstraintInterface, ValidationOptions } from 'class-validator';
export declare class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
export declare function IsCpfOrCnpj(options?: ValidationOptions): (object: object, propertyName: string) => void;
