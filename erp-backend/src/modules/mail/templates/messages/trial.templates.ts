import { alert, button, card, esc, heading, paragraph, secondaryLink } from '../components';
import { formatDate, firstName } from '../format';
import { MailTemplateKey, TemplateRenderers } from '../template.types';

/** Two days out — enough time to decide, close enough to matter. */
export const trialEndingTemplate: TemplateRenderers<MailTemplateKey.TRIAL_ENDING> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const endsAt = formatDate(data.trialEndsAt, ctx.locale);
    const when = data.daysLeft === 1 ? 'amanhã' : `em ${data.daysLeft} dias`;

    return {
      subject: `Seu teste do Kotrim termina ${when}`,
      preheader: `Escolha um plano para a ${data.companyName} continuar sem interrupção.`,
      body:
        heading(`Seu teste termina ${when}`) +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          `O teste da <strong>${esc(data.companyName)}</strong> vai até <strong>${esc(endsAt)}</strong>. ` +
            `Depois disso o acesso fica pausado até você escolher um plano.`,
        ) +
        // The reassurance that matters most at this moment: nobody abandons a
        // trial because of the price, they abandon it fearing they lose the work.
        alert(
          'info',
          '<strong>Seus dados não vão a lugar nenhum.</strong> Clientes, veículos e ordens de serviço continuam ' +
            'salvos e voltam intactos assim que a assinatura for ativada.',
        ) +
        paragraph('Nos últimos dias você usou o Kotrim inteiro. Agora é escolher o plano que faz sentido para a sua operação.') +
        button('Escolher meu plano', `${ctx.appUrl}/subscription`) +
        secondaryLink('Tenho uma dúvida antes de decidir', `https://wa.me/5511989985090`),
      text:
        `Seu teste do Kotrim termina ${when} (${endsAt}).\n\n` +
        `Depois disso o acesso fica pausado até você escolher um plano. Seus dados continuam salvos e voltam ` +
        `intactos quando a assinatura for ativada.\n\n` +
        `Escolha seu plano: ${ctx.appUrl}/subscription\n`,
    };
  },
};

export const trialExpiredTemplate: TemplateRenderers<MailTemplateKey.TRIAL_EXPIRED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);

    return {
      subject: 'Seu teste do Kotrim terminou',
      preheader: `Os dados da ${data.companyName} estão salvos. Escolha um plano para voltar.`,
      body:
        heading('Seu teste terminou') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          `O acesso da <strong>${esc(data.companyName)}</strong> está pausado — mas nada foi perdido.`,
        ) +
        alert(
          'success',
          'Tudo que você cadastrou continua no lugar: clientes, veículos, ordens de serviço e histórico. ' +
            'Escolher um plano devolve o acesso exatamente como estava.',
        ) +
        card('Como contratar', [
          { label: 'Passo 1', value: 'Escolha o plano na página de assinatura' },
          { label: 'Passo 2', value: 'Pague por Pix' },
          { label: 'Passo 3', value: 'Envie o comprovante' },
          { label: 'Passo 4', value: 'Liberamos o acesso na confirmação' },
        ]) +
        button('Reativar minha conta', `${ctx.appUrl}/subscription`) +
        secondaryLink('Prefiro falar com alguém antes', 'https://wa.me/5511989985090'),
      text:
        `Seu teste do Kotrim terminou.\n\n` +
        `O acesso da ${data.companyName} está pausado, mas nada foi perdido — clientes, veículos e ordens de ` +
        `serviço continuam salvos.\n\n` +
        `Para voltar: escolha um plano, pague por Pix e envie o comprovante. Liberamos o acesso na confirmação.\n\n` +
        `Reative: ${ctx.appUrl}/subscription\n`,
    };
  },
};
