# Convite Vivo Web — Event Renderer

Aplicação pública que monta experiências digitais de eventos a partir de
configuração. **Uma aplicação, vários eventos**: nenhum deploy ou código por
cliente — cada evento é um arquivo de configuração + assets.

Primeiro caso real: aniversário de 1 ano da Maitê (08/11/2026), ainda em
**rascunho** até a família confirmar horário, local e RSVP.

## Como rodar

Requisitos: Node 24+.

```bash
npm install
npm run dev            # http://localhost:3000 (prévia de rascunhos ligada)
```

| URL | O que mostra |
| --- | --- |
| `/` | Página institucional (em dev, lista os eventos configurados) |
| `/e/demo-clara-e-davi` | Evento fictício **publicado** (prova de reutilização) |
| `/e/maite-1-ano` | **404** — rascunho não é público |
| `/preview/maite-1-ano` | Prévia do rascunho com pendências marcadas "a confirmar" |
| `/og/<slug>` | Imagem Open Graph gerada pela identidade visual |

## Comandos

| Comando | Função |
| --- | --- |
| `npm run typecheck` | Tipos das rotas + `tsc --noEmit` |
| `npm run lint` | ESLint (config Next + a11y) |
| `npm test` | Testes do contrato, regras, ciclo de vida, metadados e renderer |
| `npm run build` | Build de produção (falha se alguma config for inválida) |
| `npm run verify` | Todos os anteriores em sequência |
| `npm run schema` | Regenera `content/event.schema.json` a partir do contrato |
| `npm run smoke -- <url> [--preview]` | Smoke HTTP contra um servidor rodando (status, OG, headers) |

Smoke de produção: `npm run build && npx next start -p 3100` e, em outro
terminal, `node scripts/smoke.mjs http://localhost:3100`.

## Estrutura

```
content/
  event.schema.json          JSON Schema gerado (autocompletar no editor)
  events/<slug>.json         Configuração de cada evento (fonte de dados)
public/events/<slug>/        Assets PÚBLICOS e aprovados de cada evento
src/
  contract/                  Contrato (sem React): schema zod, regras de publicação,
                             ciclo de vida, política de links
  events/                    Registro + repositório (carrega e valida as configs)
  renderer/                  Engine: config → modelo → componentes
    model.ts                 Resolve referências e aplica a política público/prévia
    EventExperience.tsx      Componente raiz (igual para todos os eventos)
    SceneView.tsx            Registro exaustivo cena → componente
    scenes/                  Entry, Image, Video, Reveal, Details, Actions, Gifts,
                             Countdown, Message
    primitives/              Motivos SVG, partículas, imagem/placeholder, "a confirmar"
    client/                  Áudio, aviso de fase, replay, hooks
  app/                       Rotas Next: /e/[slug], /preview/[slug], /og/[slug]
  lib/                       Metadados (OG/canonical/robots) e configuração do site
  proxy.ts                   404 real para slugs inexistentes/não publicados
tests/                       Vitest
scripts/                     Geração de schema e smoke HTTP
docs/                        Arquitetura, lacunas e guia de assets
```

## Adicionar um evento

1. Criar `content/events/<slug>.json` (o `$schema` dá autocompletar).
2. Registrar o import em `src/events/index.ts` (um teste acusa se esquecer).
3. Colocar assets aprovados em `public/events/<slug>/` e marcar `status: "approved"`.
4. `npm run verify`. Um evento `published` com pendência bloqueante **não builda**.

Nenhum componente precisa mudar — um teste garante que o código em `src/`
não referencia eventos específicos.

## Documentação

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — decisões técnicas e porquês
- [docs/ASSETS.md](docs/ASSETS.md) — como integrar os assets reais da Maitê
- [docs/MAITE_ASSET_INTEGRATION.md](docs/MAITE_ASSET_INTEGRATION.md) — inventário, curadoria e plano de integração da biblioteca visual
- [docs/LACUNAS.md](docs/LACUNAS.md) — pendências, limitações e próximos passos

Deploy: preparado para Vercel, **não realizado** (requer aprovação explícita).
