import { LegalDocumentType, PrismaClient } from '@prisma/client';

/**
 * Initial published version of the Terms of Use and Privacy Policy, seeded
 * once and then only ever changed by publishing a new version (see
 * `LegalDocumentService.publish`, exposed as `POST /admin/legal/documents`).
 *
 * `[PREENCHER: ...]` marks the one thing this seed cannot know on its own —
 * Kotrim's registered legal entity name and CNPJ. Search for that token
 * before going to production; nothing else here is a placeholder.
 */
const VERSION = '2026-07-17';

const TERMS_CONTENT = `
<h2>1. Aceitação</h2>
<p>Estes Termos de Uso regem o acesso e uso do Kotrim System ("Kotrim"), uma plataforma de gestão para oficinas
mecânicas e autoelétricas, oferecida por <strong>[PREENCHER: razão social do Kotrim, CNPJ]</strong>
("nós", "Kotrim"). Ao criar uma conta, você declara que leu, entendeu e concorda com estes Termos e com a
<a href="/privacidade">Política de Privacidade</a>.</p>

<h2>2. Cadastro e conta</h2>
<p>Para usar o Kotrim, é necessário criar uma conta com dados verdadeiros, completos e atualizados sobre você e
sua oficina. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas
na sua conta. Avise-nos imediatamente se suspeitar de uso não autorizado.</p>

<h2>3. Teste gratuito e assinatura</h2>
<p>Novas contas podem começar com um período de teste gratuito de 7 (sete) dias, sem necessidade de pagamento
antecipado. Ao final do teste, ou imediatamente para quem optar por assinar direto, o acesso à plataforma depende
de uma assinatura paga ativa, em um dos planos disponíveis na página de preços.</p>

<h2>4. Pagamento</h2>
<p>Hoje, os pagamentos são feitos via Pix e confirmados manualmente pela nossa equipe após a compensação. A
ativação do plano ocorre após essa confirmação — pode levar algum tempo entre o pagamento e a liberação do
acesso. Não coletamos nem armazenamos dados de cartão de crédito.</p>

<h2>5. Cancelamento</h2>
<p>Você pode cancelar sua assinatura a qualquer momento, encerrando as cobranças futuras. O cancelamento não
resulta em exclusão imediata dos seus dados: eles permanecem acessíveis para reativação, e você pode solicitar
sua remoção ou anonimização conforme a seção de privacidade. Reduzir de plano ("downgrade") nunca apaga dados já
cadastrados — apenas oculta, temporariamente, as funcionalidades que o novo plano não inclui.</p>

<h2>6. Seus dados e os dados dos seus clientes</h2>
<p>Ao usar o Kotrim, você (a oficina) é responsável pelos dados pessoais de terceiros que cadastra na
plataforma — nomes, contatos e veículos dos seus próprios clientes. Nessa relação, você atua como
<strong>controlador</strong> desses dados perante a Lei Geral de Proteção de Dados (LGPD), e o Kotrim atua como
<strong>operador</strong>, processando-os apenas para fornecer o serviço a você. Cabe a você garantir que tem
base legal adequada para tratar os dados dos seus próprios clientes.</p>

<h2>7. Uso adequado</h2>
<p>Você concorda em não usar o Kotrim para fins ilícitos, para armazenar conteúdo que viole direitos de
terceiros, ou para tentar acessar áreas ou dados de outras oficinas sem autorização. Contas usadas de forma
abusiva podem ser suspensas.</p>

<h2>8. Propriedade intelectual</h2>
<p>O software, a marca e o design do Kotrim são de propriedade exclusiva do Kotrim. Nada nestes Termos transfere
qualquer direito de propriedade intelectual a você, além do direito de uso da plataforma conforme sua
assinatura. Os dados que você insere continuam seus.</p>

<h2>9. Disponibilidade</h2>
<p>Nos esforçamos para manter o Kotrim disponível continuamente, mas não garantimos operação ininterrupta.
Manutenções programadas e eventuais indisponibilidades podem ocorrer, e comunicaremos interrupções relevantes
quando possível.</p>

<h2>10. Limitação de responsabilidade</h2>
<p>O Kotrim é fornecido "como está". Na máxima extensão permitida por lei, não nos responsabilizamos por danos
indiretos, lucros cessantes ou perda de dados decorrentes de uso indevido, falhas de terceiros ou casos
fortuitos/força maior. Recomendamos que você mantenha seus próprios backups de informações críticas do negócio.</p>

<h2>11. Alterações nestes Termos</h2>
<p>Podemos atualizar estes Termos para refletir mudanças no serviço ou na legislação. Quando isso acontecer, uma
nova versão é publicada com data própria, e será necessário aceitar a nova versão para continuar usando o
Kotrim — sua conta permanece protegida pelos termos que você já aceitou até lá.</p>

<h2>12. Rescisão</h2>
<p>Podemos suspender ou encerrar contas que violem estes Termos, mediante aviso prévio sempre que possível,
exceto em casos de violação grave ou risco à plataforma ou a terceiros.</p>

<h2>13. Lei aplicável e foro</h2>
<p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do
Kotrim para dirimir eventuais controvérsias, ressalvada disposição legal em contrário.</p>

<h2>14. Contato</h2>
<p>Dúvidas sobre estes Termos podem ser enviadas para <strong>suporte@kotrim.com.br</strong>.</p>
`.trim();

const PRIVACY_CONTENT = `
<h2>1. Quem somos e nosso papel</h2>
<p>Esta Política explica como o Kotrim System, oferecido por <strong>[PREENCHER: razão social do Kotrim,
CNPJ]</strong>, trata dados pessoais. Em relação aos dados da sua conta (você e sua equipe), o Kotrim é
<strong>controlador</strong>. Em relação aos dados que você cadastra sobre os seus próprios clientes finais
(nomes, veículos, contatos), o Kotrim atua apenas como <strong>operador</strong>, seguindo as instruções da sua
oficina, que é a controladora desses dados.</p>

<h2>2. Quais dados coletamos</h2>
<ul>
  <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, nome e documento (CPF/CNPJ) da empresa.</li>
  <li><strong>Dados inseridos por você:</strong> clientes, veículos, ordens de serviço, agenda, estoque e
  registros financeiros da sua oficina.</li>
  <li><strong>Dados de uso e acesso:</strong> endereço IP, navegador (user agent), data e hora de acesso, e
  registros de auditoria de ações relevantes (login, alterações de assinatura, etc.).</li>
  <li><strong>Cookies:</strong> usamos apenas o essencial para manter sua sessão autenticada. Não usamos cookies
  de rastreamento ou publicidade de terceiros.</li>
</ul>

<h2>3. Base legal</h2>
<p>Tratamos seus dados de cadastro com base na <strong>execução do contrato</strong> firmado ao criar sua conta
(art. 7º, V, da LGPD). Dados financeiros de assinatura são tratados também para
<strong>cumprimento de obrigação legal/regulatória</strong> (art. 7º, II). Registros de segurança e auditoria são
tratados com base em <strong>legítimo interesse</strong> (art. 7º, IX), para prevenir fraude e proteger a
plataforma.</p>

<h2>4. Como usamos os dados</h2>
<p>Usamos seus dados para: operar sua conta e a plataforma; processar pagamentos da assinatura; enviar
comunicações transacionais (confirmação de cadastro, avisos de teste terminando, cobrança, redefinição de senha);
dar suporte; e manter a segurança do serviço.</p>

<h2>5. Com quem compartilhamos</h2>
<p>Não vendemos dados pessoais. Compartilhamos o mínimo necessário com prestadores que nos ajudam a operar o
serviço, sob contrato:</p>
<ul>
  <li><strong>Envio de e-mail transacional</strong> (confirmações, avisos, redefinição de senha) — processado por
  um provedor especializado, que pode processar dados fora do Brasil.</li>
  <li><strong>Hospedagem do banco de dados</strong> — nosso banco de dados roda na região Brasil (São Paulo).</li>
</ul>
<p>Quando um prestador processa dados fora do Brasil, isso ocorre sob salvaguardas contratuais compatíveis com a
LGPD (art. 33).</p>

<h2>6. Retenção</h2>
<p>Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados permanecem por um período
adicional para permitir reativação e cumprir obrigações legais/fiscais (registros financeiros, por exemplo,
seguem os prazos de guarda exigidos pela legislação tributária brasileira), após o que podem ser anonimizados
mediante solicitação. Registros de auditoria e de envio de e-mail têm retenção própria, limitada ao necessário
para segurança e suporte.</p>

<h2>7. Seus direitos</h2>
<p>Como titular de dados, você pode, a qualquer momento:</p>
<ul>
  <li>Confirmar a existência de tratamento e acessar seus dados;</li>
  <li>Corrigir dados incompletos, inexatos ou desatualizados (diretamente em Configurações);</li>
  <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
  <li>Solicitar a portabilidade dos seus dados a outro fornecedor — disponível a qualquer momento em
  <strong>Configurações → Baixar meus dados</strong>, que gera um arquivo com tudo o que sua oficina cadastrou;</li>
  <li>Ser informado sobre com quem compartilhamos seus dados;</li>
  <li>Revogar o consentimento, quando aplicável, e solicitar o encerramento da conta.</li>
</ul>
<p>Para exercer qualquer um desses direitos, escreva para <strong>privacidade@kotrim.com.br</strong>.</p>

<h2>8. Segurança</h2>
<p>Senhas são armazenadas com hash (nunca em texto puro), o tráfego é criptografado (HTTPS), o acesso é
segmentado por empresa e por papel de usuário, e ações sensíveis ficam registradas em um log de auditoria interno.
Nenhum sistema é infalível, e trabalhamos continuamente para reduzir riscos.</p>

<h2>9. Dados dos clientes finais da sua oficina</h2>
<p>Se você cadastra clientes, veículos ou outros dados de terceiros no Kotrim, você é responsável por ter base
legal adequada para tratá-los (em geral, a execução do serviço que presta a eles) e por atender às solicitações
desses titulares. O Kotrim processa esses dados apenas conforme suas instruções, como operador.</p>

<h2>10. Crianças e adolescentes</h2>
<p>O Kotrim não é direcionado a menores de 18 anos e não coletamos intencionalmente dados de crianças ou
adolescentes.</p>

<h2>11. Alterações nesta Política</h2>
<p>Podemos atualizar esta Política quando o serviço ou a legislação mudarem. Uma nova versão, com data própria,
passa a valer a partir da sua publicação, e pediremos que você a revise e aceite para continuar usando o Kotrim.</p>

<h2>12. Encarregado de Dados (DPO)</h2>
<p>Dúvidas, solicitações ou reclamações sobre o tratamento de dados pessoais podem ser enviadas para
<strong>privacidade@kotrim.com.br</strong>.</p>
`.trim();

export async function seedLegalDocuments(prisma: PrismaClient): Promise<void> {
  for (const type of [LegalDocumentType.TERMS, LegalDocumentType.PRIVACY] as const) {
    const alreadyActive = await prisma.legalDocument.findFirst({ where: { type, isActive: true } });
    if (alreadyActive) {
      console.log(`Legal document ${type} already has an active version (${alreadyActive.version}); skipped.`);
      continue;
    }

    await prisma.legalDocument.create({
      data: {
        type,
        version: VERSION,
        title: type === LegalDocumentType.TERMS ? 'Termos de Uso' : 'Política de Privacidade',
        content: type === LegalDocumentType.TERMS ? TERMS_CONTENT : PRIVACY_CONTENT,
        isActive: true,
      },
    });
    console.log(`Legal document ${type} seeded at version ${VERSION}.`);
  }
}
