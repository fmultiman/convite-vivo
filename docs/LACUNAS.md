# Lacunas, pendências e limitações — V1 (15/10/2026)

## Dados do evento da Maitê (bloqueiam a publicação)

O renderer impede publicar enquanto estes itens não forem confirmados
(`npm run build` falha se o evento for marcado `published` sem eles):

| Item | Situação | Fonte |
| --- | --- | --- |
| Horário | Candidato 13h, roteiro original diz 12h — confirmar com a família | docs 08/09, A-013 |
| Nome do local | Não informado | doc 12 |
| Endereço completo | Recebido sem cidade/UF; **mantido fora do repositório** até autorização | docs 09/12 |
| RSVP | Telefone e formato (WhatsApp ou formulário) indefinidos | doc 12 §5 |
| Mapa | Depende do endereço confirmado | doc 12 §5 |
| Sugestões de presente | Texto recebido, aguardando confirmação final | doc 08 §B |
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
