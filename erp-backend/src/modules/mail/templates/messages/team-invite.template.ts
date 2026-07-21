import { alert, button, esc, heading, paragraph } from '../components';
import { firstName } from '../format';
import { MailTemplateKey, TemplateRenderers } from '../template.types';

export const teamInviteTemplate: TemplateRenderers<MailTemplateKey.TEAM_INVITE> = {
  'pt-BR': (data, ctx) => {
    const first = firstName(data.name);
    const url = `${ctx.appUrl}/auth/create-password?token=${data.token}`;

    return {
      subject: `Você foi convidado para a ${esc(data.companyName)} no Kotrim`,
      preheader: 'Crie sua senha para acessar o sistema.',
      body:
        heading('Você tem um convite') +
        paragraph(`Olá, ${esc(first)}.`) +
        paragraph(
          `A <strong>${esc(data.companyName)}</strong> te cadastrou no Kotrim como <strong>${esc(data.cargoName)}</strong>. ` +
            'Clique no botão abaixo para criar sua senha e acessar o sistema.',
        ) +
        button('Criar minha senha', url) +
        alert(
          'warning',
          'Este link vale por <strong>24 horas</strong> e só pode ser usado <strong>uma vez</strong>.',
        ),
      text:
        `Você foi convidado para a ${data.companyName} no Kotrim, como ${data.cargoName}.\n\n` +
        `Abra o link abaixo para criar sua senha e acessar o sistema. Ele vale por 24 horas e só pode ser usado uma vez:\n\n` +
        `${url}\n`,
    };
  },
};
