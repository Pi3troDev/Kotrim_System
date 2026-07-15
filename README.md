# Kotrim System — ERP para Oficinas Mecânicas e Autoelétricas

Sistema de gestão profissional para oficinas mecânicas e autoelétricas, construído para
escalar de uma única oficina a centenas de empresas (multi-tenant) sem reescrita.

Este documento descreve o que foi construído na **Etapa 1 — Arquitetura**. Os módulos de
negócio (Dashboard, Clientes, Veículos, Ordens de Serviço, Estoque, Financeiro,
Funcionários, Relatórios, Configurações) ainda **não têm lógica de negócio implementada**
— cada um já possui rota, lazy loading, guarda de autenticação e uma página placeholder
funcionando de ponta a ponta, pronta para receber a implementação real.

## Sumário

- [Visão geral da arquitetura](#visão-geral-da-arquitetura)
- [Stack técnica](#stack-técnica)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar localmente](#como-rodar-localmente)
- [Banco de dados](#banco-de-dados)
- [Autenticação](#autenticação)
- [Tema e Dark Mode](#tema-e-dark-mode)
- [Testes](#testes)
- [Deploy](#deploy)
- [Decisões de arquitetura (nota do Tech Lead)](#decisões-de-arquitetura-nota-do-tech-lead)
- [Próximos passos](#próximos-passos)

## Visão geral da arquitetura

```
Kotrim System/
├── erp-frontend/   Angular 21 (standalone, signals, Material 3)
├── erp-backend/    NestJS 11 + Prisma 6 + PostgreSQL
└── README.md       este arquivo
```

O sistema é **multi-tenant desde o schema**: praticamente toda tabela do banco é
isolada por `companyId`. Uma única instância de backend/banco pode atender várias
oficinas com isolamento lógico de dados.

## Stack técnica

| Camada     | Tecnologia                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| Frontend   | Angular 21 (standalone components, signals, zoneless), Angular Material 3, SCSS |
| Backend    | NestJS 11, TypeScript, Prisma ORM 6, class-validator, Swagger              |
| Banco      | PostgreSQL 16 (Docker localmente; Supabase/Neon em produção)               |
| Auth       | JWT (access token) + Refresh Token rotativo em cookie httpOnly             |
| Segurança  | Helmet, CORS restrito, rate limiting (`@nestjs/throttler`), bcrypt, class-validator |
| Logs       | Pino (`nestjs-pino`), estruturado, com redaction de headers sensíveis      |
| Deploy     | Frontend → Vercel · Backend → Railway · Banco → Supabase/Neon              |

## Estrutura do repositório

### `erp-frontend/src/app`

```
core/            Serviços singleton (auth, theme), guards, interceptors, config
layout/          Shell, sidebar, topbar — casca visual autenticada
shared/          Componentes/reutilizáveis sem estado de negócio
features/
  auth/          Login, cadastro de oficina
  dashboard/     (placeholder)
  clients/       (placeholder)
  vehicles/      (placeholder)
  work-orders/   (placeholder)
  inventory/     (placeholder)
  finance/       (placeholder)
  employees/     (placeholder)
  reports/       (placeholder)
  settings/      (placeholder)
```

Cada feature é **lazy-loaded** via `loadChildren`/`loadComponent` — confirmado pelo
build (`npm run build`), que gera um chunk JS separado por módulo.

### `erp-backend/src`

```
common/          Decorators, guards, filters, interfaces e utils compartilhados
config/          Configuração tipada + validação de variáveis de ambiente
prisma/          PrismaService/PrismaModule (integração NestJS ↔ Prisma Client)
modules/
  auth/          Login, registro de oficina, refresh, logout (implementado)
  users/         Consulta de usuários (implementado, suporte à auth)
  clients/ vehicles/ work-orders/ inventory/ finance/ reports/
  employees/ settings/ uploads/ notifications/   (estrutura de pastas criada,
                                                    Controller/Service/Module a implementar)
```

## Como rodar localmente

Pré-requisitos: **Node ≥ 24**, npm, e Docker (para o Postgres local) — ou uma
`DATABASE_URL` de um Postgres já existente (Supabase/Neon funcionam também em dev).

### Backend

```bash
cd erp-backend
cp .env.example .env      # já vem preenchido com valores padrão de dev
docker compose up -d      # sobe um Postgres local em localhost:5432
npx prisma migrate dev    # cria as tabelas a partir do schema
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- Health check: `GET /api/v1/health`

### Frontend

```bash
cd erp-frontend
npm start
```

- App: `http://localhost:4200`

O frontend aponta para `http://localhost:3000/api/v1` em desenvolvimento
(`src/environments/environment.ts`).

## Banco de dados

Modelado em `erp-backend/prisma/schema.prisma`. Principais decisões:

- **UUID** como chave primária em todas as tabelas (`@db.Uuid`).
- **Soft delete** (`deletedAt`) nas entidades de negócio (Client, Vehicle, WorkOrder,
  InventoryItem, Supplier, Expense, Income, Employee, User) — nada é apagado de
  verdade, preservando histórico e integridade referencial.
- **Multi-tenancy** via `companyId` em quase todas as tabelas, com índices dedicados
  para consultas por empresa.
- **Auditoria de estoque**: `quantityInStock` nunca é alterado diretamente — toda
  mudança passa por um registro em `StockMovement` (entrada/saída/ajuste), o que
  garante rastreabilidade real do inventário.
- **Histórico completo de OS**: `WorkOrderHistory` guarda cada mudança de status,
  atendendo ao requisito de "histórico completo" da Ordem de Serviço.
- **RBAC preparado**: `Role`, `Permission` e `RolePermission` já modelados; o
  cadastro de oficina cria automaticamente uma role "Admin" por empresa. A
  atribuição granular de permissões fica para o módulo de Configurações/Funcionários.
- **Anexos polimórficos por convenção**: `Attachment` usa `entityType` + `entityId`
  (sem FK de banco, já que Prisma não suporta relações polimórficas nativamente) —
  a integridade é garantida na camada de serviço quando os módulos forem implementados.

Comandos úteis:

```bash
npx prisma studio        # navegar pelos dados visualmente
npx prisma migrate dev   # criar/aplicar migrations em dev
npx prisma generate      # regenerar o Prisma Client após mudar o schema
```

## Autenticação

Fluxo implementado (`erp-backend/src/modules/auth`, `erp-frontend/src/app/core`):

1. **Cadastro de oficina** (`POST /auth/register-company`) cria `Company` + `Role`
   "Admin" + `User` administrador em uma única transação.
2. **Login** (`POST /auth/login`) valida e-mail/senha (bcrypt) e emite:
   - **Access token** (JWT, 15 min) — devolvido no corpo da resposta e mantido
     **em memória** no frontend (signal do `AuthService`, nunca em `localStorage`).
   - **Refresh token** (string opaca de 64 bytes, 7 dias) — guardado com hash
     (SHA-256) no banco e devolvido como **cookie httpOnly, secure em produção**.
3. **Refresh** (`POST /auth/refresh`) troca o cookie por um novo par de tokens
   (rotação — o token antigo é revogado). O frontend chama isso automaticamente:
   - uma vez ao iniciar o app (`provideAppInitializer`), para manter a sessão após
     reload;
   - a cada `401` de uma requisição autenticada (interceptor HTTP com retry único).
4. **Logout** (`POST /auth/logout`) revoga o refresh token no banco e limpa o cookie.

Toda rota do backend é protegida por padrão (`JwtAuthGuard` global); use `@Public()`
para expor uma rota. `RolesGuard` (também global) fica pronto para checar
`@Roles('Admin')` quando o RBAC for expandido nos próximos módulos.

## Tema e Dark Mode

`erp-frontend/src/styles.scss` define dois níveis de tokens:

1. **Material System Tokens** (`--mat-sys-*`), gerados pelo `mat.theme()` com paleta
   azul (primária) e violeta (terciária) — usados pelos componentes do Angular
   Material.
2. **Tokens semânticos próprios** (`--surface`, `--border`, `--text-primary`,
   `--radius-*`, `--shadow-*`, ...) — usados pelos componentes customizados
   (sidebar, topbar, cards) para que tudo mude de cor junto no dark mode.

O dark mode é ativado pela classe `.dark-theme` na tag `<html>`, controlada por
`ThemeService` (persistido em `localStorage`, com fallback para
`prefers-color-scheme`). Um script inline no `index.html` aplica a classe **antes**
do Angular inicializar, evitando flash de tema errado.

## Testes

```bash
# Backend
cd erp-backend
npm run test        # unit
npm run test:e2e    # e2e (requer Postgres rodando)

# Frontend
cd erp-frontend
npm run test
```

## Deploy

- **Frontend → Vercel**: build `ng build`, output em `dist/erp-frontend/browser`.
  Configure `CORS_ORIGIN` no backend para a URL final do Vercel.
- **Backend → Railway**: `npm run build && npm run start:prod`. Configure todas as
  variáveis de `.env.example` nas variáveis de ambiente do serviço.
- **Banco → Supabase/Neon**: use a *connection string pooled* como `DATABASE_URL`
  e rode `npx prisma migrate deploy` no pipeline de deploy (não `migrate dev`).

## Decisões de arquitetura (nota do Tech Lead)

Registrando aqui os pontos onde o Tech Lead ajustou o pedido original por motivos
técnicos, para transparência:

- **Prisma 6, não Prisma 7**: o Prisma 7 (lançado muito recentemente) exige driver
  adapters mesmo para Postgres simples e mudou onde a `DATABASE_URL` é configurada.
  Para um sistema feito para durar anos, preferi fixar na major estável (6.19),
  amplamente documentada e compatível com o ecossistema NestJS atual. Migrar para o
  7 é uma tarefa isolada e de baixo risco quando fizer sentido.
- **Componentes standalone + rotas, não NgModules**: desde o Angular 17 este é o
  padrão recomendado pela equipe do Angular. Os "módulos" pedidos (`clients/`,
  `vehicles/`, etc.) existem como pastas com sua própria rota lazy-loaded — o
  resultado (lazy loading, isolamento, organização) é o mesmo, sem o boilerplate
  de `NgModule`.
- **E-mail de usuário único globalmente**, não por empresa: simplifica o login (não
  é preciso escolher a empresa antes de autenticar) e é o padrão da maioria dos ERPs
  B2B SaaS. Cada conta de usuário pertence a exatamente uma empresa.
- **Refresh token em cookie httpOnly**, não em `localStorage`: reduz a superfície de
  ataque XSS. O access token vive só em memória no frontend.
- **Angular zoneless**: o `ng new` já gerou o projeto sem `zone.js`; mantive esse
  padrão (mais moderno e com menos overhead) e adicionei
  `provideZonelessChangeDetection()` explicitamente.

## Próximos passos

Conforme combinado, a próxima etapa é o desenvolvimento dos módulos de negócio,
um de cada vez, começando pelo **Dashboard** — aguardando sua confirmação para
iniciar.
