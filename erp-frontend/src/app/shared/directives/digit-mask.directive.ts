import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatCep, formatCpfCnpj, formatPhone } from '../utils/br-mask.util';

export type DigitMaskType = 'cpfCnpj' | 'phone' | 'cep';

const FORMATTERS: Record<DigitMaskType, (value: string) => string> = {
  cpfCnpj: formatCpfCnpj,
  phone: formatPhone,
  cep: formatCep,
};

/** Applies a live Brazilian mask (CPF/CNPJ, phone or CEP) to a reactive-form text input. */
@Directive({ selector: '[appDigitMask]' })
export class DigitMaskDirective {
  readonly appDigitMask = input.required<DigitMaskType>();

  private readonly ngControl = inject(NgControl, { self: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const formatted = FORMATTERS[this.appDigitMask()](target.value);
    target.value = formatted;
    this.ngControl.control?.setValue(formatted);
  }
}
