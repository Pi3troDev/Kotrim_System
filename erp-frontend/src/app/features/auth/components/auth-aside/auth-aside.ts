import { Component, input } from '@angular/core';

/**
 * The navy pitch panel beside every auth form. Copy is per-screen: someone
 * resetting a password does not need the sales pitch a new signup does.
 */
@Component({
  selector: 'app-auth-aside',
  templateUrl: './auth-aside.html',
})
export class AuthAside {
  readonly quote = input('Sua oficina inteira em uma tela só.');
  readonly lead = input(
    'Ordens de serviço, clientes, veículos, estoque, financeiro e agenda — conectados, sem digitar nada duas vezes.',
  );
  readonly points = input<string[]>([
    'Teste 7 dias grátis, sem cartão',
    'Todos os módulos liberados no teste',
    'Cancele quando quiser',
  ]);
}
