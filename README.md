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
| `npm run safety` | Trava para repositório público: mídia/pastas privadas, arquivos grandes, caminhos locais |
| `npm run verify` | typecheck + lint + safety + testes + build |
| `npm run schema` | Regenera `content/event.schema.json` a partir do contrato |
| `npm run assets:scene-01` | Regenera os WebP da Cena 1 a partir de `assets/` (privado, fora do git). Os WebP resultantes **são versionados** |
| `npm run assets:scene-02` | Regenera os 12 WebP da cena submarina; reutiliza bolhas e pérolas da Cena 1 |
| `npm run assets:scene-04` | Regenera os 4 WebP da Cena 04 (BG03, grande concha, moldura e divisor); sem a criança |
| `npm run assets:scene-03-private` | Regenera o derivado da Maitê no cavalo-marinho em `assets/_prepared/` (fora do Git); a cópia autorizada para o piloto está em `public/events/maite-1-ano/scene-03/` |
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
                             Countdown, Message, Stage (palco em camadas)
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
- [docs/SCENE_02.md](docs/SCENE_02.md) — experimento submarino V1, comparação CSS/Canvas, evidências e limites da validação
- [docs/SCENE_04.md](docs/SCENE_04.md) — Cena 04 (grande concha e convite): palco com painel, assets, pendências e validação
- [docs/SCENE_03.md](docs/SCENE_03.md) — Cena 03 (revelação da Maitê real): enquadramento, mundo contínuo entre palcos, exceção de segurança restrita ao asset autorizado
- [docs/SCENE_02_V2.md](docs/SCENE_02_V2.md) — Cena 02 v2 (híbrida): luz, peixes, plantas, camadas e preparação da Cena 03
- [docs/ASSETS.md](docs/ASSETS.md) — como integrar os assets reais da Maitê
- [docs/MAITE_ASSET_INTEGRATION.md](docs/MAITE_ASSET_INTEGRATION.md) — inventário, curadoria e plano de integração da biblioteca visual
- [docs/LACUNAS.md](docs/LACUNAS.md) — pendências, limitações e próximos passos
- [docs/PRIMEIRO_PUSH.md](docs/PRIMEIRO_PUSH.md) — checklist para publicar o repositório com segurança

Deploy: preparado para Vercel, **não realizado** (requer aprovação explícita).
