# Kotrim System — ERP (Backend)

Documentação completa do projeto (arquitetura, setup, decisões técnicas) está no
[README raiz](../README.md).

Comandos rápidos:

```bash
docker compose up -d       # Postgres local
npx prisma migrate dev     # aplica o schema no banco
npm run start:dev          # dev server em http://localhost:3000
```

- Swagger: `http://localhost:3000/docs`
- Health check: `GET /api/v1/health`
