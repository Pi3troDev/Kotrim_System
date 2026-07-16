import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

function isValidCpf(rawValue: string): boolean {
  const digits = rawValue.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits[i], 10) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calcCheckDigit(9) === parseInt(digits[9], 10) && calcCheckDigit(10) === parseInt(digits[10], 10);
}

function isValidCnpj(rawValue: string): boolean {
  const digits = rawValue.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const calcCheckDigit = (length: number): number => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits[i], 10) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calcCheckDigit(12) === parseInt(digits[12], 10) && calcCheckDigit(13) === parseInt(digits[13], 10);
}

@ValidatorConstraint({ name: 'isCpfOrCnpj', async: false })
export class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.trim() === '') return true; // optional field — presence checked separately
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false;
  }

  defaultMessage(): string {
    return 'O CPF/CNPJ informado é inválido.';
  }
}

/** Validates a Brazilian CPF or CNPJ (with or without punctuation) via checksum. */
export function IsCpfOrCnpj(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsCpfOrCnpjConstraint,
    });
  };
}
