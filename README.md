# Chat Observability

Painel das conversas do chatbot do portfólio. O chat responde na hora; o log segue **depois**, via `waitUntil` na Vercel, para este ingest. Dá para ver as perguntas no dashboard e, se quiser, no Grafana Loki.

```text
Visitante → chatbot (Cohere) → resposta imediata
                         └ waitUntil → POST /api/ingest
                                         ├ Postgres / arquivo / demo
                                         └ Loki (opcional)
```

---

## O que o produto faz

- Ingest autenticado (`POST /api/ingest`)
- KPIs: volume, hoje, visitantes, latência, erros
- Série dos últimos 14 dias e ranking de nomes
- Lista pesquisável com pergunta/resposta
- Encaminhamento opcional para Grafana Cloud Loki
- Modo demo na Vercel, sem banco

---

## Como rodar

```bash
git clone git@github.com:exkgred/chat-observability.git
cd chat-observability
cp .env.example .env.local
npm install
npm run dev
```

App: [http://localhost:3002](http://localhost:3002) (já abre em demo).

### Persistência real (Postgres)

```bash
docker compose up -d postgres
```

No `.env.local`:

```
NEXT_PUBLIC_DEMO=false
DASHBOARD_PASSWORD=uma-senha
SESSION_SECRET=uma-chave-longa
INGEST_SECRET=um-segredo
DATABASE_URL=postgresql://chatobs:chatobs@localhost:5435/chatobs
```

A tabela `conversation_logs` é criada sozinha na primeira escrita. Login do painel usa `DASHBOARD_PASSWORD`.

Sem `DATABASE_URL` e fora da Vercel, os eventos vão para `data/conversations.json`.

### Grafana Cloud + Loki (produção)

Grafana é o painel. Loki é o banco de logs. O app já envia cada conversa no `POST /api/ingest`.

1. Crie um stack gratuito em [grafana.com](https://grafana.com/auth/sign-up/create-user).
2. No [portal](https://grafana.com/orgs): stack → **Loki** → **Details**.
   - **URL**: `https://logs-prod-XX.grafana.net` (a região muda por conta)
   - **User**: número (instance ID)
3. Crie um token com permissão de escrita:
   - Portal → **Security** → **Access Policies** → **Create access policy**
   - Realm: o stack
   - Scope: `logs:write`
   - **Add token** e copie o valor (`glc_...`)
4. Variáveis na Vercel (Production **e** Preview, e **redeploy** depois):

```
NEXT_PUBLIC_DEMO=false
INGEST_SECRET=<segredo longo>
DASHBOARD_PASSWORD=<senha do painel>
SESSION_SECRET=<chave longa>
DATABASE_URL=<connection string do Neon, sslmode=require>
DATABASE_SSL=true
LOKI_PUSH_URL=https://logs-prod-XX.grafana.net/loki/api/v1/push
LOKI_USER=<instance id do passo 2>
LOKI_TOKEN=<glc_...>
LOKI_ENV=production
```

Pode colar só o host do Loki; o app completa `/loki/api/v1/push`.

5. Confira `GET /api/health`: `demo` false, `postgres` e `loki` true.
6. No Grafana (Launch) → **Explore** → datasource Loki:

```
{app="joshua-chat"}
{app="joshua-chat"} | json
{app="joshua-chat", has_error="true"}
```

7. **Dashboards** → **New** → **Import** → arquivo `grafana/joshua-chat.json` deste repo.

No chatbot (Vercel):

```
LOGS_INGEST_URL=https://<seu-app>.vercel.app/api/ingest
LOGS_INGEST_SECRET=<o mesmo INGEST_SECRET>
```

---

## Ligar o chatbot

No projeto `chatbot-cohere`:

```
LOGS_INGEST_URL=http://localhost:3002/api/ingest
LOGS_INGEST_SECRET=dev-ingest-secret
```

Em produção, use a URL do dashboard na Vercel e o mesmo `INGEST_SECRET`. O `api/chat.js` dispara o POST com `waitUntil`, sem atrasar a resposta do visitante.

Teste local do ingest:

```bash
curl -X POST http://localhost:3002/api/ingest \
  -H 'Authorization: Bearer dev-ingest-secret' \
  -H 'Content-Type: application/json' \
  -d '{"pergunta":"Quais projetos você tem?","resposta":"Smarty Hardware e Kanban.","visitante":"Ana","latenciaMs":1200}'
```

Em demo, recarregar a página volta ao seed (memória). Com Postgres, o evento permanece.

---

## Demo na Vercel

1. No [Vercel](https://vercel.com/new) importe `exkgred/chat-observability`
2. Framework: Next.js
3. Variáveis: `NEXT_PUBLIC_DEMO=true`

Ou, na pasta do projeto: `npx vercel --prod`.

`NEXT_PUBLIC_DEMO` entra no **build**. Depois de mudar para `false`, faça **Redeploy**.

---

## API

Envelope: `{ success, data, meta }`.

| Rota | Auth | Descrição |
|---|---|---|
| `POST /api/ingest` | Bearer `INGEST_SECRET` | Recebe um turno do chat |
| `GET /api/logs` | cookie / demo | Lista (`q`, `page`, `perPage`) |
| `GET /api/logs/:id` | cookie / demo | Detalhe |
| `GET /api/stats?days=14` | cookie / demo | KPIs |
| `GET /api/health` | público | Status |
| `POST /api/auth/login` | senha | Sessão do painel |

Body do ingest:

```json
{
  "timestamp": "2026-09-04T13:00:00.000Z",
  "sessionId": "uuid",
  "visitante": "Ana",
  "pergunta": "...",
  "resposta": "...",
  "latenciaMs": 1500,
  "modelo": "command-a-03-2025",
  "origemHash": "abc123",
  "erro": null,
  "source": "chatbot"
}
```

Não envie IP cru — só hash.
