import { alert, button, esc, heading, paragraph } from '../components';
import { firstName } from '../format';
import { MailTemplateKey, TemplateRenderers } from '../template.types';

export const passwordResetTemplate: TemplateRenderers<MailTemplateKey.PASSWORD_RESET> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const url = `${ctx.appUrl}/auth/reset-password?token=${data.token}`;

    return {
      subject: 'Redefinir sua senha do Kotrim',
      preheader: 'Link válido por 1 hora e de uso único.',
      body:
        heading('Redefinir sua senha') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova.',
        ) +
        button('Criar nova senha', url) +
        alert(
          'warning',
          'Este link vale por <strong>1 hora</strong> e só pode ser usado <strong>uma vez</strong>.',
        ) +
        // Never a "click here if it wasn't you" link: that turns the e-mail into
        // a phishing target of its own. Doing nothing is the safe action.
        paragraph(
          'Se não foi você quem pediu, <strong>ignore este e-mail</strong>. Sua senha atual continua valendo e ' +
            'nada muda na sua conta.',
        ),
      text:
        `Redefinir sua senha do Kotrim.\n\n` +
        `Abra o link abaixo para criar uma nova senha. Ele vale por 1 hora e só pode ser usado uma vez:\n\n` +
        `${url}\n\n` +
        `Se não foi você quem pediu, ignore este e-mail — sua senha atual continua valendo.\n`,
    };
  },
};

export const passwordChangedTemplate: TemplateRenderers<MailTemplateKey.PASSWORD_CHANGED> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);

    return {
      subject: 'Sua senha do Kotrim foi alterada',
      preheader: 'Se não foi você, fale com a gente agora.',
      body:
        heading('Sua senha foi alterada') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          'A senha da sua conta acabou de ser alterada e todas as sessões abertas foram encerradas. ' +
            'Você precisará entrar novamente nos seus aparelhos.',
        ) +
        alert(
          'danger',
          `<strong>Não foi você?</strong> Fale com a gente imediatamente — ${esc(ctx.supportContact)}.`,
        ) +
        button('Entrar com a nova senha', `${ctx.appUrl}/auth/login`),
      text:
        `A senha da sua conta Kotrim foi alterada e todas as sessões abertas foram encerradas.\n\n` +
        `Se não foi você, fale com a gente imediatamente: ${ctx.supportContact}\n\n` +
        `Entrar: ${ctx.appUrl}/auth/login\n`,
    };
  },
};
