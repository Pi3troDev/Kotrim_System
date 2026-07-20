/**
 * Every word the landing page says, in one place.
 *
 * Kept out of the templates so the copy can be rewritten — and it will be, copy
 * always is — without touching markup, and so the FAQ can feed both the visible
 * accordion and the JSON-LD from a single array.
 */

export interface FeatureModule {
  /** Matches the PlanFeature key on the backend, so the two stay recognisable as the same thing. */
  key: string;
  name: string;
  description: string;
  /** Inline SVG path data — no icon font request on the critical path. */
  icon: string;
  /** The cheapest plan that unlocks it; drives the tier tag on the card. */
  tier: 'Todos os planos' | 'Profissional' | 'Oficina Plus';
  /** Optional caveat shown under the tier tag, e.g. a per-plan cap. */
  note?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface Step {
  title: string;
  description: string;
}

export interface ComparisonRow {
  /** The everyday moment being compared — the row's subject. */
  situation: string;
  spreadsheet: string;
  kotrim: string;
}

export const FEATURE_MODULES: FeatureModule[] = [
  {
    key: 'CLIENTS',
    name: 'Clientes',
    description:
      'Histórico completo de cada cliente: todos os veículos, todos os serviços, tudo que já foi conversado.',
    icon: 'M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0ZM4 20a8 8 0 0 1 16 0',
    tier: 'Todos os planos',
  },
  {
    key: 'VEHICLES',
    name: 'Veículos',
    description:
      'Placa, chassi, quilometragem e o histórico de manutenção. Você sabe o que já foi feito antes de abrir o capô.',
    icon: 'M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM3 17v-4l2-5h14l2 5v4M5 13h14',
    tier: 'Todos os planos',
  },
  {
    key: 'WORK_ORDERS',
    name: 'Ordens de Serviço',
    description:
      'Do orçamento à entrega, com status, peças, mão de obra e garantia. O cliente pergunta e você responde na hora.',
    icon: 'M14 3v4a1 1 0 0 0 1 1h4M5 3h9l6 6v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 9h8M8 16h5',
    tier: 'Todos os planos',
  },
  {
    key: 'AGENDA',
    name: 'Agenda',
    description:
      'Quem entra hoje, quem sai amanhã, qual mecânico está livre. O pátio deixa de ser adivinhação.',
    icon: 'M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    tier: 'Todos os planos',
  },
  {
    key: 'INVENTORY',
    name: 'Estoque',
    description:
      'Saldo, custo e alerta de mínimo. A peça baixa sozinha quando entra na OS — e você descobre a falta antes do cliente.',
    icon: 'M3 8l9-5 9 5v8l-9 5-9-5V8Zm0 0 9 5m0 0 9-5m-9 5v10',
    tier: 'Profissional',
  },
  {
    key: 'FINANCE',
    name: 'Financeiro',
    description:
      'Contas a pagar, a receber e fluxo de caixa. Descobrir que o mês fechou no vermelho não deveria levar 30 dias.',
    icon: 'M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3',
    tier: 'Profissional',
  },
  {
    key: 'REPORTS',
    name: 'Relatórios',
    description:
      'Faturamento por período, serviços mais rentáveis, produtividade por mecânico. Números, não sensação.',
    icon: 'M4 20V10m6 10V4m6 16v-7m-13 7h16',
    tier: 'Profissional',
  },
  {
    key: 'EMPLOYEES',
    name: 'Funcionários',
    description:
      'Equipe, funções e quem fez cada serviço. A OS sempre tem um nome por trás, e a agenda sabe quem está livre.',
    icon: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm13 16v-2a4 4 0 0 0-3-3.9M16 4.1a4 4 0 0 1 0 7.8',
    tier: 'Todos os planos',
    note: '3 no Essencial · 10 no Profissional · ilimitado no Plus',
  },
];

export const BENEFITS: Benefit[] = [
  {
    title: 'O caderno não perde histórico',
    description:
      'Só que ele também não te avisa que a garantia vence semana que vem, nem em qual gaveta está o orçamento de março. O Kotrim avisa.',
  },
  {
    title: 'Responder o cliente em segundos',
    description:
      '"Meu carro fica pronto quando?" deixa de exigir uma volta pela oficina. Abre a OS, olha o status, responde.',
  },
  {
    title: 'Saber se o mês fechou no azul',
    description:
      'Sem planilha, sem somar nota no fim do mês. O financeiro já está lançado porque nasceu junto com a ordem de serviço.',
  },
  {
    title: 'Funciona no celular do balcão',
    description:
      'Tudo roda no navegador, do computador da recepção ao telefone do mecânico. Nada para instalar.',
  },
];

export const STEPS: Step[] = [
  {
    title: 'Crie sua conta',
    description:
      'Nome da oficina, CNPJ e e-mail. Leva menos de um minuto e não pede cartão de crédito.',
  },
  {
    title: 'Cadastre o primeiro serviço',
    description:
      'Cliente, veículo e a ordem de serviço. A partir daí o histórico começa a se montar sozinho.',
  },
  {
    title: 'Escolha seu plano',
    description:
      'Ao fim dos 7 dias você já usou o sistema inteiro e sabe do que precisa. Paga por Pix, e a conta é liberada na confirmação.',
  },
];

/**
 * Spreadsheet/notebook vs Kotrim.
 *
 * Every row is a moment a workshop owner has actually lived, not a feature
 * list — the left column has to be recognisable or the right one means nothing.
 * Claims stay to what the product genuinely does today.
 */
export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    situation: 'Cliente liga perguntando do carro',
    spreadsheet: 'Você caminha até o box e pergunta ao mecânico',
    kotrim: 'Abre a OS e vê o status, quem está no serviço e a previsão',
  },
  {
    situation: 'Saber o que já foi feito naquele carro',
    spreadsheet: 'Procurar em cadernos antigos — se ainda existirem',
    kotrim: 'Histórico completo do veículo pela placa, em segundos',
  },
  {
    situation: 'Garantia de um serviço vencendo',
    spreadsheet: 'Ninguém lembra até o cliente reclamar',
    kotrim: 'O sistema avisa antes de vencer',
  },
  {
    situation: 'Peça acabando no estoque',
    spreadsheet: 'Você descobre com o carro já no elevador',
    kotrim: 'Alerta de estoque mínimo, e a peça baixa sozinha na OS',
  },
  {
    situation: 'Fechar o mês',
    spreadsheet: 'Somar notas e recibos no fim do mês, torcendo pra bater',
    kotrim: 'O financeiro já está lançado — nasceu junto com a OS',
  },
  {
    situation: 'Dois carros marcados no mesmo horário',
    spreadsheet: 'Descobre quando os dois chegam',
    kotrim: 'A agenda mostra quem está livre antes de marcar',
  },
  {
    situation: 'Computador queimou',
    spreadsheet: 'A planilha estava só ali',
    kotrim: 'Backup diário automático, e o acesso é pelo navegador',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Preciso de cartão de crédito para testar?',
    answer:
      'Não. O teste de 7 dias começa no cadastro e libera o Kotrim inteiro, com todos os módulos. Não pedimos cartão, e nada é cobrado automaticamente no fim do período.',
  },
  {
    question: 'O que acontece quando os 7 dias acabam?',
    answer:
      'O acesso ao sistema é pausado até você escolher um plano. Seus dados continuam salvos e voltam intactos assim que a assinatura for ativada — nada é apagado.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer:
      'Por Pix. Você escolhe o plano, recebe a chave, faz o pagamento e envia o comprovante. A conta é ativada assim que confirmamos. Pagamento por cartão com renovação automática entra em breve.',
  },
  {
    question: 'Posso trocar de plano depois?',
    answer:
      'Pode, a qualquer momento. Ao subir de plano os módulos novos aparecem na hora. Ao descer, os dados dos módulos que saem continuam guardados e voltam se você fizer o upgrade de novo.',
  },
  {
    question: 'Minha oficina é pequena. Vale a pena?',
    answer:
      'O plano Essencial existe exatamente para isso: clientes, veículos, ordens de serviço e agenda, com até 3 usuários. É o suficiente para sair do caderno sem pagar por módulos que você ainda não usa.',
  },
  {
    question: 'Meus dados ficam seguros?',
    answer:
      'Cada oficina só enxerga os próprios dados — o isolamento é feito no banco, não só na tela. As senhas são criptografadas e o banco tem backup automático diário.',
  },
  {
    question: 'Preciso instalar alguma coisa?',
    answer:
      'Não. O Kotrim roda no navegador, em qualquer computador, tablet ou celular. Atualizações chegam sozinhas, sem você fazer nada.',
  },
  {
    question: 'E se eu quiser cancelar?',
    answer:
      'É só parar de renovar — não há fidelidade nem multa. O acesso vale até o fim do período já pago.',
  },
];
