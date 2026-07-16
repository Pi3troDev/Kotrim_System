"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsCpfOrCnpjConstraint = void 0;
exports.IsCpfOrCnpj = IsCpfOrCnpj;
const class_validator_1 = require("class-validator");
function isValidCpf(rawValue) {
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits))
        return false;
    const calcCheckDigit = (length) => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += parseInt(digits[i], 10) * (length + 1 - i);
        }
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };
    return calcCheckDigit(9) === parseInt(digits[9], 10) && calcCheckDigit(10) === parseInt(digits[10], 10);
}
function isValidCnpj(rawValue) {
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits))
        return false;
    const calcCheckDigit = (length) => {
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
let IsCpfOrCnpjConstraint = class IsCpfOrCnpjConstraint {
    validate(value) {
        if (typeof value !== 'string' || value.trim() === '')
            return true;
        const digits = value.replace(/\D/g, '');
        return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false;
    }
    defaultMessage() {
        return 'O CPF/CNPJ informado é inválido.';
    }
};
exports.IsCpfOrCnpjConstraint = IsCpfOrCnpjConstraint;
exports.IsCpfOrCnpjConstraint = IsCpfOrCnpjConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isCpfOrCnpj', async: false })
], IsCpfOrCnpjConstraint);
function IsCpfOrCnpj(options) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName,
            options,
            constraints: [],
            validator: IsCpfOrCnpjConstraint,
        });
    };
}
//# sourceMappingURL=cpf-cnpj.validator.js.map