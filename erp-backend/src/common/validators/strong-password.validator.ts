import { applyDecorators } from '@nestjs/common';
import { MinLength, NotContains, registerDecorator, ValidationOptions } from 'class-validator';

/**
 * The passwords that actually get used.
 *
 * A blocklist, not a complexity rule. "One uppercase, one digit, one symbol"
 * reliably produces `Senha@123` — which is on every wordlist — while rejecting
 * a genuinely strong passphrase. Length plus a ban on the obvious does more,
 * and annoys people less.
 *
 * Kept short on purpose: this is the tail everyone actually types, not a
 * pretence at a breach database. A real check would query HaveIBeenPwned's
 * k-anonymity API, which is worth doing when there is a reason to add an
 * outbound call to the signup path.
 */
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'senha123', 'password', 'password1', 'password123',
  'qwerty123', 'abc12345', '11111111', '00000000', 'admin123', 'kotrim123', 'mudar123',
  'senha1234', '12341234', 'iloveyou', 'principal', 'brasil123', 'oficina123',
]);

export function IsNotCommonPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isNotCommonPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          return !COMMON_PASSWORDS.has(value.toLowerCase());
        },
        defaultMessage(): string {
          return 'Esta senha é muito comum. Escolha outra.';
        },
      },
    });
  };
}

/**
 * The one place the password rule lives.
 *
 * Applied to every field that sets a password — signup, reset, super-admin
 * setup — so the rule cannot drift between them.
 */
export function IsStrongPassword(): PropertyDecorator {
  return applyDecorators(
    MinLength(10, { message: 'A senha deve ter pelo menos 10 caracteres.' }),
    NotContains(' ', { message: 'A senha não pode conter espaços.' }),
    IsNotCommonPassword(),
  );
}
