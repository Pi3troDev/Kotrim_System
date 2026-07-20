import { alert, button, card, esc, heading, paragraph } from '../components';
import { formatDate, firstName } from '../format';
import { MailTemplateKey, TemplateRenderers } from '../template.types';

/**
 * The first e-mail anyone ever gets from Kotrim.
 *
 * Covers the whole signup moment in one message — account created, workshop
 * created, trial started, and exactly when it ends. Splitting that into four
 * e-mails would put four unread badges on someone who has been a customer for
 * ten seconds.
 */
export const welcomeTrialTemplate: TemplateRenderers<MailTemplateKey.WELCOME_TRIAL> = {
  'pt-BR': (data, ctx) => {
    const endsAt = formatDate(data.trialEndsAt, ctx.locale);
    const first = firstName(data.name);

    return {
      subject: `Bem-vindo ao Kotrim, ${first}!`,
      preheader: `A ${data.companyName} está no ar. Seu teste vai até ${endsAt}.`,
      body:
        heading('Sua oficina está no ar') +
        paragraph(`Olá, ${esc(first)}. Que bom ter você aqui.`) +
        paragraph(
          `A conta da <strong>${esc(data.companyName)}</strong> foi criada e já está pronta para uso. ` +
            `Seus ${data.trialDays} dias de teste começaram agora.`,
        ) +
        card('Seu teste grátis', [
          { label: 'Oficina', value: data.companyName },
          { label: 'Acesso', value: 'Todos os módulos liberados' },
          { label: 'Termina em', value: endsAt },
        ]) +
        alert(
          'info',
          `<strong>Nenhuma cobrança automática.</strong> Não pedimos cartão. Ao fim do teste você escolhe um plano — ou simplesmente não escolhe.`,
        ) +
        paragraph(
          'Comece cadastrando um cliente e abrindo a primeira ordem de serviço. A partir daí o histórico do ' +
            'veículo, a agenda e o financeiro se conectam sozinhos.',
        ) +
        button('Abrir minha oficina', `${ctx.appUrl}/dashboard`),
      text:
        `Bem-vindo ao Kotrim, ${first}!\n\n` +
        `A conta da ${data.companyName} foi criada e seus ${data.trialDays} dias de teste começaram agora, ` +
        `com todos os módulos liberados.\n\n` +
        `Seu teste termina em ${endsAt}. Não pedimos cartão e não há cobrança automática.\n\n` +
        `Acesse: ${ctx.appUrl}/dashboard\n`,
    };
  },
};
