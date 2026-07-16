function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(rawDigits: string): string {
  const d = rawDigits.slice(0, 11);
  let out = '';
  for (let i = 0; i < d.length; i++) {
    if (i === 3 || i === 6) out += '.';
    if (i === 9) out += '-';
    out += d[i];
  }
  return out;
}

export function formatCnpj(rawDigits: string): string {
  const d = rawDigits.slice(0, 14);
  let out = '';
  for (let i = 0; i < d.length; i++) {
    if (i === 2 || i === 5) out += '.';
    if (i === 8) out += '/';
    if (i === 12) out += '-';
    out += d[i];
  }
  return out;
}

/** CPF while <= 11 digits are typed, CNPJ once a 12th digit appears. */
export function formatCpfCnpj(value: string): string {
  const digits = onlyDigits(value);
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

/** Landline (00) 0000-0000 while <= 10 digits, mobile (00) 00000-0000 at 11. */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const mobile = d.length > 10;
  let out = '';
  for (let i = 0; i < d.length; i++) {
    if (i === 0) out += '(';
    if (i === 2) out += ') ';
    if ((mobile && i === 7) || (!mobile && i === 6)) out += '-';
    out += d[i];
  }
  return out;
}

export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  let out = '';
  for (let i = 0; i < d.length; i++) {
    if (i === 5) out += '-';
    out += d[i];
  }
  return out;
}
