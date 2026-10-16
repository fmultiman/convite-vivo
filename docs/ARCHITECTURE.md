# Arquitetura — Event Renderer V1

Data: 15/10/2026. Referências: corpus Convite Vivo docs 03 (arquitetura),
05 (microsites e contrato), 07 (decisões), 09 (briefing Maitê), 12 (adaptação
do roteiro). Este documento registra o que **foi implementado** e por quê.

## Fronteiras

| Responsabilidade | Nesta etapa |
| --- | --- |
| Content Studio (fábrica) | Intocado. Sem dependência em runtime. Assets entram como arquivos aprovados em `public/events/<slug>/`. |
| Experience Platform (controle) | Não existe ainda. O "plano de controle" mínimo é o JSON versionado + regras de publicação + rota de prévia. |
| Event Renderer (entrega) | Este projeto. |

## Fluxo de dados

```
content/events/<slug>.json
  └─ src/events/repository.ts   valida (zod) + regras de publicação; falha o build se inválido
       └─ src/renderer/model.ts resolve assets/ações, formata datas,
          │                     REMOVE dados não confirmados no modo público
          └─ EventExperience → SceneView → componentes de cena
```

Os componentes não leem a configuração: recebem o **modelo resolvido**. Assim
a política "nada provisório no público" fica em um único lugar testável
(`resolveExperience`) e o formato da config pode evoluir sem tocar a UI.

## Decisões

| # | Decisão | Motivo |
| --- | --- | --- |
| R-01 | Next.js 16.4 App Router + React 19.3 + TypeScript 5.9, CSS Modules + custom properties | Stack candidata do briefing; versões atuais em 10/2026. TS 7 (nativo) ainda não é o que o Next usa. Sem Tailwind: os temas são tokens por evento, não classes utilitárias. |
| R-02 | Configuração em JSON local, importada estaticamente e validada com **zod 4** | Validável, versionável (`schemaVersion` + `revision`), independente de React, trocável por banco/API sem mudar consumidores (`EventRepository`). Import estático = zero I/O em requisição, compatível com Cache Components. |
| R-03 | `confirmable` em dados críticos (horário, local, endereço) + `confirmed` em ações, presentes e infos práticas | O briefing proíbe publicar dado provisório como definitivo (12h × 13h). O valor candidato pode existir no rascunho; o modo público nunca o renderiza. |
| R-04 | Regras de publicação separadas do schema (`rules.ts`) | Forma ≠ prontidão. Um rascunho pode estar incompleto; um evento `published` com bloqueio **não builda**. |
| R-05 | Estado editorial (`status`) separado do temporal (fase) | Doc 05 §6. Fase calculada pela data **no fuso do evento**, com `phaseOverride` para o operador. |
| R-06 | `/e/[slug]` só serve `published`; `/preview/[slug]` serve qualquer estado, com painel de pendências, `noindex`, ligada só em dev ou com `ENABLE_DRAFT_PREVIEW=true` | Separação draft/published sem autenticação nesta fase. |
| R-07 | `generateStaticParams` pré-renderiza eventos publicados (HTML estático com OG) + `proxy.ts` para 404 real | Com Cache Components, `dynamicParams=false` não é suportado e slugs desconhecidos recebem o shell em streaming (200 "soft 404"). O Proxy checa a lista em memória antes de renderizar. |
| R-08 | Metadados OG/Twitter/canonical gerados no servidor por evento; imagem = asset aprovado ou `/og/<slug>` gerada da identidade visual | WhatsApp lê só o HTML inicial (doc 05 §7). A imagem gerada contém apenas título + data — nunca a criança. |
| R-09 | `noindex` por padrão; indexação só com `seo.indexable: true` (proibido para demo) | Convites de crianças não devem ser indexados por padrão (doc 03 §7). |
| R-10 | Componentes = comportamentos (`entry`, `reveal`, `image`, `video`, `details`, `actions`, `gifts`, `countdown`, `message`); estética = tokens + motivos genéricos (envelope, concha, cortina, presente, selo) | Doc 05 §3 e doc 12 §9. O switch em `SceneView` é exaustivo: novo tipo de cena não compila sem componente. |
| R-11 | Revelação com conteúdo aninhado (`reveal.children`) | "Grande concha revelando o convite": detalhes e ações ficam dentro da concha. Sem JS, tudo visível. |
| R-12 | Aprimoramento progressivo: classe `js` no `<html>` antes da pintura | Sem JS, entrada e revelações viram blocos normais; nada essencial depende de animação. |
| R-13 | Reduced motion: CSS (`prefers-reduced-motion`) + hook que pula a transição de entrada; partículas congeladas | Doc 05 §4. |
| R-14 | Áudio só após gesto (botão, ou o toque de entrada se `playOnEnter`), `preload="none"`, sempre com botão de pausa | Doc 05 §10. |
| R-15 | Vídeo: com controles usa `preload="none"`; ambiente (mudo/loop) não carrega com reduced motion ou Save-Data; erro → poster | Performance mobile e fallback (R-008 do doc 07). |
| R-16 | Links externos: somente `https://` sem credenciais (validado no contrato), `target=_blank rel="noopener noreferrer"` | Requisito "links externos seguros". |
| R-17 | Assets públicos só em `/events/<slug>/` do próprio evento; originais e privados nunca entram no repositório | Separação público/privado (doc 03 §7). |
| R-18 | `instant = false` nas rotas de evento | Validação de navegação instantânea do Cache Components; convites são abertos por link direto. |

## O que deliberadamente NÃO foi feito

Painel/admin, login, banco, CMS, pagamentos, RSVP próprio (RSVP usa
WhatsApp ou link externo), upload, galeria, integração com Content Studio,
domínio/subdomínio, deploy. Tudo isso está fora do escopo desta iteração.

## Pontos de extensão previstos

- **Banco/API**: implementar `EventRepository` com a mesma interface.
- **Admin**: usar `content/event.schema.json` + `getPublicationIssues()` para formulários e "pronto para publicar".
- **Nova cena**: adicionar ao `sceneSchema`, ao modelo e ao `SceneView` (o compilador aponta os três).
- **Nova fonte**: adicionar a `fontKeys` e a `src/renderer/fonts.ts`.
- **Assets em CDN**: o contrato já aceita `src` https; incluir `images.remotePatterns` quando houver CDN definida.
