import {
  alert,
  button,
  card,
  copyValue,
  esc,
  heading,
  paragraph,
  secondaryLink,
  steps,
} from '../components';
import { formatDate, formatMoney, firstName } from '../format';
import { MailTemplateKey, TemplateRenderers } from '../template.types';

const SUPPORT_WHATSAPP = 'https://wa.me/5511989985090';

/**
 * Sent the moment a plan is chosen — before any money moves.
 *
 * The one e-mail that has to carry instructions rather than just news: the
 * customer is holding their phone deciding whether to trust a Pix key.
 */
export const orderPendingTemplate: TemplateRenderers<MailTemplateKey.ORDER_PENDING> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const amount = formatMoney(data.amountCents, ctx.locale);

    return {
      subject: `Pedido recebido — plano ${data.planName}`,
      preheader: `Falta o pagamento de ${amount} por Pix para liberarmos seu acesso.`,
      body:
        heading('Recebemos seu pedido') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          `Registramos seu pedido do plano <strong>${esc(data.planName)}</strong>. ` +
            `Falta só o pagamento para liberarmos o acesso.`,
        ) +
        card('Seu pedido', [
          { label: 'Plano', value: data.planName },
          { label: 'Valor', value: `${amount}/mês` },
          { label: 'Forma de pagamento', value: 'Pix' },
          { label: 'Status', value: 'Aguardando pagamento' },
        ]) +
        steps([
          `Faça um Pix de <strong>${esc(amount)}</strong> para a chave abaixo.`,
          'Envie o comprovante para a gente pelo WhatsApp.',
          'Confirmamos o pagamento e liberamos seu acesso.',
        ]) +
        copyValue('Chave Pix', ctx.pixKey) +
        alert(
          'info',
          '<strong>Garantia de 7 dias.</strong> Até 7 dias corridos após a confirmação do pagamento, você pode ' +
            'pedir o estorno total, sem precisar justificar.',
        ) +
        alert(
          'warning',
          '<strong>O acesso ainda não está liberado.</strong> Assim que confirmarmos o pagamento, você recebe ' +
            'um e-mail avisando e já pode entrar.',
        ) +
        button('Enviar comprovante no WhatsApp', SUPPORT_WHATSAPP) +
        secondaryLink('Acompanhar minha assinatura', `${ctx.appUrl}/subscription`),
      text:
        `Recebemos seu pedido do plano ${data.planName}.\n\n` +
        `1. Faça um Pix de ${amount} para a chave: ${ctx.pixKey}\n` +
        `2. Envie o comprovante pelo WhatsApp: ${ctx.supportContact}\n` +
        `3. Confirmamos o pagamento e liberamos seu acesso.\n\n` +
        `Garantia de 7 dias: até 7 dias corridos após a confirmação do pagamento, você pode pedir o estorno ` +
        `total, sem precisar justificar.\n\n` +
        `O acesso ainda não está liberado. Avisamos por e-mail assim que confirmarmos.\n\n` +
        `Acompanhe: ${ctx.appUrl}/subscription\n`,
    };
  },
};

export const paymentConfirmedTemplate: TemplateRenderers<MailTemplateKey.PAYMENT_CONFIRMED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const amount = formatMoney(data.amountCents, ctx.locale);

    return {
      subject: 'Pagamento confirmado — Kotrim',
      preheader: `Recebemos seu pagamento de ${amount}. Sua assinatura já está ativa.`,
      body:
        heading('Pagamento confirmado') +
        paragraph(`Olá, ${esc(first)}. Recebemos seu pagamento — obrigado!`) +
        card('Comprovante', [
          { label: 'Plano', value: data.planName },
          { label: 'Valor pago', value: amount },
          { label: 'Forma de pagamento', value: data.method },
          { label: 'Status', value: 'Confirmado' },
        ]) +
        paragraph('Sua assinatura já está ativa. Enviamos os detalhes do período em um e-mail separado.') +
        button('Ir para o Kotrim', `${ctx.appUrl}/dashboard`),
      text:
        `Pagamento confirmado.\n\n` +
        `Plano: ${data.planName}\nValor: ${amount}\nForma: ${data.method}\n\n` +
        `Sua assinatura já está ativa. Acesse: ${ctx.appUrl}/dashboard\n`,
    };
  },
};

export const subscriptionActivatedTemplate: TemplateRenderers<MailTemplateKey.SUBSCRIPTION_ACTIVATED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const until = formatDate(data.periodEnd, ctx.locale);

    return {
      subject: `Assinatura ativada — plano ${data.planName}`,
      preheader: `Tudo liberado até ${until}. Bom trabalho!`,
      body:
        heading('Sua assinatura está ativa') +
        paragraph(`Olá, ${esc(first)}. Está tudo pronto.`) +
        card('Sua assinatura', [
          { label: 'Plano', value: data.planName },
          { label: 'Status', value: 'Ativa' },
          { label: 'Válida até', value: until },
        ]) +
        alert('success', `Todos os módulos do plano <strong>${esc(data.planName)}</strong> já estão disponíveis.`) +
        paragraph(
          `Avisamos você antes de <strong>${esc(until)}</strong> para renovar, sem surpresa e sem corte de acesso.`,
        ) +
        button('Abrir minha oficina', `${ctx.appUrl}/dashboard`),
      text:
        `Sua assinatura está ativa.\n\n` +
        `Plano: ${data.planName}\nVálida até: ${until}\n\n` +
        `Todos os módulos do seu plano já estão disponíveis.\n\nAcesse: ${ctx.appUrl}/dashboard\n`,
    };
  },
};

export const subscriptionRenewedTemplate: TemplateRenderers<MailTemplateKey.SUBSCRIPTION_RENEWED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const until = formatDate(data.periodEnd, ctx.locale);

    return {
      subject: `Assinatura renovada — válida até ${until}`,
      preheader: `Seu plano ${data.planName} seguiu em frente sem interrupção.`,
      body:
        heading('Assinatura renovada') +
        paragraph(`Olá, ${esc(first)}. Renovamos sua assinatura — obrigado por continuar com a gente.`) +
        card('Novo período', [
          { label: 'Plano', value: data.planName },
          { label: 'Válida até', value: until },
        ]) +
        paragraph('Nada muda na sua rotina: tudo continua exatamente como estava.') +
        button('Ir para o Kotrim', `${ctx.appUrl}/dashboard`),
      text:
        `Assinatura renovada.\n\nPlano: ${data.planName}\nVálida até: ${until}\n\n` +
        `Acesse: ${ctx.appUrl}/dashboard\n`,
    };
  },
};

export const subscriptionUpgradedTemplate: TemplateRenderers<MailTemplateKey.SUBSCRIPTION_UPGRADED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const until = formatDate(data.periodEnd, ctx.locale);

    return {
      subject: `Upgrade feito — bem-vindo ao ${data.planName}`,
      preheader: `Os módulos do ${data.planName} já estão liberados na sua oficina.`,
      body:
        heading(`Você agora está no ${data.planName}`) +
        paragraph(`Olá, ${esc(first)}. Seu upgrade foi aplicado.`) +
        card('Mudança de plano', [
          { label: 'Plano anterior', value: data.previousPlanName },
          { label: 'Plano atual', value: data.planName },
          { label: 'Válido até', value: until },
        ]) +
        alert('success', 'Os módulos novos já aparecem no menu — não é preciso fazer mais nada.') +
        button('Ver o que mudou', `${ctx.appUrl}/dashboard`),
      text:
        `Upgrade aplicado: ${data.previousPlanName} → ${data.planName}.\n\n` +
        `Válido até ${until}. Os módulos novos já estão liberados.\n\nAcesse: ${ctx.appUrl}/dashboard\n`,
    };
  },
};

export const subscriptionDowngradedTemplate: TemplateRenderers<MailTemplateKey.SUBSCRIPTION_DOWNGRADED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const until = formatDate(data.periodEnd, ctx.locale);

    return {
      subject: `Plano alterado para ${data.planName}`,
      preheader: 'Seus dados continuam salvos — nada foi apagado.',
      body:
        heading(`Seu plano agora é o ${data.planName}`) +
        paragraph(`Olá, ${esc(first)}. Sua alteração de plano foi aplicada.`) +
        card('Mudança de plano', [
          { label: 'Plano anterior', value: data.previousPlanName },
          { label: 'Plano atual', value: data.planName },
          { label: 'Válido até', value: until },
        ]) +
        // The single most important sentence in this e-mail. A downgrade is when
        // a customer is most afraid they just lost work.
        alert(
          'info',
          '<strong>Nada foi apagado.</strong> Os módulos que saíram do seu plano deixam de aparecer no menu, ' +
            'mas todos os dados continuam guardados e voltam intactos se você fizer upgrade de novo.',
        ) +
        button('Acompanhar minha assinatura', `${ctx.appUrl}/subscription`) +
        secondaryLink('Quero rever essa mudança', SUPPORT_WHATSAPP),
      text:
        `Seu plano foi alterado: ${data.previousPlanName} → ${data.planName}, válido até ${until}.\n\n` +
        `Nada foi apagado. Os módulos que saíram deixam de aparecer no menu, mas os dados continuam guardados ` +
        `e voltam se você fizer upgrade novamente.\n\n` +
        `Acompanhe: ${ctx.appUrl}/subscription\n`,
    };
  },
};

export const subscriptionCancelledTemplate: TemplateRenderers<MailTemplateKey.SUBSCRIPTION_CANCELLED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);

    return {
      subject: 'Sua assinatura do Kotrim foi cancelada',
      preheader: 'O acesso foi encerrado, mas seus dados continuam salvos.',
      body:
        heading('Assinatura cancelada') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          data.planName
            ? `Sua assinatura do plano <strong>${esc(data.planName)}</strong> foi cancelada e o acesso ao sistema foi encerrado.`
            : 'Sua assinatura foi cancelada e o acesso ao sistema foi encerrado.',
        ) +
        alert(
          'info',
          '<strong>Seus dados continuam salvos.</strong> Se um dia quiser voltar, é só escolher um plano — ' +
            'tudo estará onde você deixou.',
        ) +
        paragraph(
          'Se o cancelamento não foi você quem pediu, ou se mudou de ideia, fala com a gente. Resolvemos rápido.',
        ) +
        button('Falar com o suporte', SUPPORT_WHATSAPP) +
        secondaryLink('Reativar minha conta', `${ctx.appUrl}/subscription`),
      text:
        `Sua assinatura do Kotrim foi cancelada e o acesso foi encerrado.\n\n` +
        `Seus dados continuam salvos. Para voltar, escolha um plano em ${ctx.appUrl}/subscription\n\n` +
        `Se não foi você quem pediu, fale com a gente: ${ctx.supportContact}\n`,
    };
  },
};
