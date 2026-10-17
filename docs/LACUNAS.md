# Lacunas, pendências e limitações — V1 (15/10/2026)

## Dados do evento da Maitê (bloqueiam a publicação)

O renderer impede publicar enquanto estes itens não forem confirmados
(`npm run build` falha se o evento for marcado `published` sem eles):

| Item | Situação | Fonte |
| --- | --- | --- |
| Horário | Candidato recebido da família (briefing), ainda **fora do repositório**: fica em `private/` (ignorada) e só entra no JSON local da máquina. O roteiro original dizia 12h; confirmação final antes de publicar | briefing, A-013 |
| Nome do local | Não informado | doc 12 |
| Endereço | Rua e bairro recebidos da família (briefing), **fora do repositório** (ver `docs/PRIMEIRO_PUSH.md`). **Faltam município/UF e CEP** (não inventar); confirmação final e decisão sobre o repositório público antes do 1º push | briefing, docs 09/12 |
| RSVP | Sem telefone/WhatsApp informado: ação pendente e desabilitada (sem destino fictício); formato indefinido | doc 12 §5 |
| Mapa | Sem município/UF não há destino validado: ação pendente, sem coordenadas inventadas | doc 12 §5 |
| Sugestões de presente | Três ideias recebidas no briefing (roupa, calçado e brinquedo), **fora do repositório** até a aprovação; no JSON versionado há três textos-modelo "a confirmar" | briefing |
| Grafia "Maitê" | Confirmar acento na arte final | doc 09 §1 |
| Autorização de imagem | Uso público da personagem/teaser no site | A-014, A-025 |

Avisos (não bloqueiam): todos os assets pendentes; sem arte OG aprovada (usa
imagem gerada); trilha não escolhida.

## Decisões em aberto (não bloquearam o código)

- Domínio/URL pública e `NEXT_PUBLIC_SITE_URL` (A-008).
- RSVP: WhatsApp vs formulário próprio (A-010). V1 suporta WhatsApp e link externo.
- Mensagem pós-evento e quem aprova fotos (doc 12 §10). `postEvent.enabled` está `false` para a Maitê.
- Personagem fala ou só aparece; uso de narração no site (A-014).
- Cena 3 do roteiro ("preparativos") não foi incluída: o doc 12 permite reduzi-la; pode virar uma cena `image` com partículas quando houver asset.

## Limitações técnicas conhecidas

- **Estados `paused`/`archived`** respondem 404 na rota pública. Uma página
  "digna" para expirado/arquivado (doc 05 §11) fica para depois.
- **Fase temporal** (contagem, "É hoje", pós-evento) é calculada no navegador;
  o HTML estático mostra a data. Sem JS, não há mensagem de fase.
- **Prévia** é ligada por variável de ambiente lida **no build**; não há
  autenticação. Não usar `ENABLE_DRAFT_PREVIEW=true` em ambiente aberto.
- **Mudança de config exige novo build** (sem banco). Isso atende "sem deploy
  por cliente", mas não "editar horário sem novo build" (critério do doc 05 §12) — depende do banco/admin.
- **Rollback** = reverter o JSON no git e rebuildar; não há histórico de versões publicado.
- **Fontes**: quatro famílias no catálogo, todas com `preload: false` (pode
  haver troca visível de fonte em conexões lentas).
- **Reduced motion** foi implementado (CSS + hook) e revisado no código, mas
  não pôde ser emulado no navegador usado na verificação.
- **Prévia OG no WhatsApp real** não foi testada (exige URL pública).
- `npm audit`: 0 vulnerabilidades nas dependências de produção; 5 "high" em
  dependências de desenvolvimento (cadeia do `braces`, via tooling de lint/teste),
  não corrigidas nesta iteração.
- Teste em dispositivos reais (iOS/Android) ainda não realizado.

## Documentos do Drive

Os documentos foram lidos a partir das cópias .docx em
`../docs/google drive`. Nenhuma lacuna de acesso.

## Cena 1 da Maitê — limitações observadas (16/10/2026)

- **Dev server (Turbopack) em loop de recompilação** neste ambiente (Windows, disco D:, "slow filesystem"):
  a página nunca estabiliza com o navegador aberto. A revisão foi feita com `next build` + `next start`.
  Não investigado a fundo; não afeta produção.
- **Revisão em aparelhos reais pendente** (iOS Safari/Android): `dvh`, `aspect-ratio`, `translate`, `:has()` e
  `container queries` foram usados; validar. Parallax por giroscópio não implementado (de propósito).
- **Mergulho sem fundo submarino:** a transição termina em um véu pastel que se funde à próxima cena (ainda
  sem BG02). A próxima cena atual é a de placeholders (Maitê pendente).
- **Sem concha fechada/peixes** (ver §7); a Cena 1 não precisa deles.
- **Telas largas:** coluna central de ~560 px com laterais desfocadas; sem versão larga da arte.
- **Camadas sem sombra baked:** sombras de contato são aproximações CSS (elipses); revisar o realismo em aparelhos.
- **Envelope falha de imagem:** cai no vetor genérico (estilo diferente, intencional como último recurso).
- A prévia do rascunho continua exigindo `ENABLE_DRAFT_PREVIEW=true` **no build e no start** em produção local.
