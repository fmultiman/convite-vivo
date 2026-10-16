# Integração dos assets da Maitê — inventário, curadoria e plano

Data: 15/10/2026 · Escopo: **inventário, curadoria e planejamento**. Nada foi
movido, convertido, publicado nem implementado. Os originais permanecem
intactos. Dados completos por arquivo: `MAITE_ASSET_MANIFEST.json` (inventário mantido localmente, fora do Git).

> **Privacidade primeiro.** A biblioteca contém imagens com a aparência de uma
> criança real (rostos estilizados a partir de fotos). Nada disso é público por
> padrão. `assets/` está no `.gitignore` e **não deve** ser copiado para
> `public/` sem aprovação explícita (ver §7).

## 1. Resumo da biblioteca encontrada

**Localização real:** `convite-vivo-web/assets/` (dentro do repositório web,
não na raiz do projeto pai). Estava **sem rastreamento e sem nenhum commit**;
foi coberta pelo `.gitignore` antes de qualquer outra ação.

| Item | Valor |
| --- | --- |
| Arquivos | **163** (162 PNG + 1 MP4) · **133,0 MB** |
| Recortes individuais (PNG com alfa) | **139** |
| Folhas-fonte (de onde os recortes saíram) | 9, em `elements/originais/` |
| Com transparência **real** | **148** (139 recortes + 9 folhas) |
| Opacas (sem alfa) | 14 (4 backgrounds + 6 keyframes + 4 referências) |
| Duplicatas exatas | 0 (por SHA-256) |
| Fundo quadriculado embutido | 0 |
| Arquivos restritos (rosto da criança) | 11 |
| Pastas vazias | `elements/personagens/` |
| `private/` | Estava vazia no inventário; **depois** passou a conter 5 PDFs de fotografias originais da Maitê (não abertos, não inventariados, ignorados pelo git) |

Os quatro backgrounds têm **941 × 1672 px (9:16)**, confirmado.

| Papel | Arquivo real |
| --- | --- |
| **BG01 — Praia encantada** | `elements/backgrounds/praia-encantada-abertura.png` |
| **BG02 — Fundo do mar** | `elements/backgrounds/fundo-do-mar-cenário-principal.png` |
| **BG03 — Cenário do convite** | `elements/backgrounds/cenário-do-convite-revelação final.png` (pódio de areia ao centro) |
| **BG04 — Arte complementar** | `elements/backgrounds/arte-complementar.png` (variação do fundo do mar, bolhas grandes à esquerda) |

As quatro imagens são da mesma família visual (mesma paleta, iluminação e
acabamento "CGI de fantasia"). BG02 e BG04 são parecidas, mas **não** são
duplicatas (diferença média 35/255).

## 2. Inventário e categorias

Classificação lógica (**não** aplicada fisicamente). Contagens reais:

| Cat. | Categoria | Arq. | Observação |
| --- | --- | ---: | --- |
| 01 | Backgrounds | 4 | opacos, 941×1672 |
| 02 | Keyframes e cenas completas | 6 | 2 restritos; 1 com texto gravado |
| 03 | Personagem Maitê | 3 | **todos restritos** |
| 04 | Cavalo-marinho | 4 | 3 completos + 1 incompleto |
| 05 | Conchas e ostras | 30 | inclui 10 tronos/pedestais/arranjos |
| 06 | Envelope e cartas | 5 | aberto, fechado e variações |
| 07 | Corais e plantas | 34 | 23 corais + 11 algas/ramos |
| 08 | Peixes e animais marinhos | **0** | **categoria ausente na biblioteca** |
| 09 | Pérolas, estrelas, pedras, decorativos | 27 | 10 + 6 + 6 + 5 |
| 10 | Bolhas e partículas | 28 | tamanhos de ~56 px a ~970 px |
| 11 | Molduras, cartões e ornamentos | 8 | painel, placas, divisor |
| 12 | Referências visuais | 4 | 3 restritos |
| 13 | Privados ou não aprovados | 11 | visão transversal (lista no manifesto) |
| 14 | Outros | 10 | 9 folhas-fonte + 1 vídeo |

### Problemas encontrados

| Problema | Qtde | Detalhe / impacto |
| --- | ---: | --- |
| Privacidade: rosto da criança fora de `private/` | 11 | `private/` guarda as **fotos originais** (5 PDFs); as imagens estilizadas/derivadas continuam espalhadas em `elements/maite/`, `elements/originais/` (2), `keyframes/` (2), `references/` (3) e `videos/` |
| Névoa de alfa 1–8 em volta dos recortes | 135 | Invisível sobre fundo real (testado), mas ocupa 13–29% dos pixels e infla o arquivo. Limpar na otimização |
| Muito pequenos para destaque | 19 | 9 bolhas, pérolas e pedras de 56–100 px. Servem só como partícula/acento |
| Margens transparentes > 50% | 9 | Bolhas e pérolas isoladas. Aparar na otimização |
| Nomes opacos (hash) | 10 | Keyframes e referências (`file_0000…png`) |
| Nomes com espaço/acento/vírgula | 14 | Backgrounds, folhas-fonte, `…torço.png`. Risco de caracteres quebrados em ferramentas |
| Nome ≠ conteúdo | 6 | 4 arquivos "pérola" são **bolhas** (`uma-perola-02/03/04/06`); `conjunto-de-pedras-turquesa` inclui bolha; `concha-leque-aberta-com-perolas-01` parece coral/anêmona (identificação incerta) |
| Recorte incompleto | 1 | `cavalo-marinho-torço.png`: cabeça e nadadeira soltas, sem corpo |
| Texto gravado na imagem | 1 | Keyframe da cartela "Maitê faz 1 aninho! · 8 de novembro" (contraria D-013) |
| Possível franja nas bordas | 3 | `coral-roxo-com-perolas-03`, `ramo-vegetal-com-perolas-01` (escura), `folhagem-marinha-delicada-01` (clara). Testar sobre o fundo real |
| Arquivos grandes | 2 + vídeo | Cavalo-marinho grande 1,4 MB; Maitê+cavalo 1,9 MB; **vídeo 50,9 MB** (12 Mbps) |
| Recortes sem sombra de contato | todos os testados | Observado nas maquetes (envelope, trono, cavalo-marinho); fazer sombra via CSS |
| Fundos com resolução vertical limitada | 4 | Ver §8 |

Método: dimensões, alfa, margens, franjas e hashes por análise automática dos
pixels; classificação por inspeção visual de planilhas de contato de **todas**
as pastas (não só pelo nome). Divergências nome×conteúdo estão listadas acima.
A leitura é por amostragem visual, não item a item; itens marcados
"identificação incerta" devem ser revisados por uma pessoa.

### Estrutura de diretórios proposta (não executada)

```
assets/                          (continua fora do git)
  01-backgrounds/                bg-01-praia-encantada.png … bg-04-arte-complementar.png
  02-keyframes/                  kf-01-concha-submarina.png …    (sem criança)
  04-cavalo-marinho/  05-conchas-e-ostras/  06-envelopes/
  07-corais-e-plantas/  09-perolas-estrelas-decorativos/
  10-bolhas/  11-molduras/  12-referencias/                     (sem criança)
  _fontes/                       folhas-fonte sem criança (7)
  private/                       (já existe; fotos originais) + derivados com a criança:
                                 03-maite/, kf-05/06, ref-01/02/04, folhas 07/08 e videos/
  _quarentena/                   recortes duvidosos (…torço, nome≠conteúdo)
public/events/maite-1-ano/       só derivados APROVADOS (bg/, sprites/, ui/, og/)
```

Regras de nome: ASCII, minúsculas, `kebab-case`, sem espaço/acento; papel do
background no nome (`bg-01-…`). O campo `suggestedPath` de cada arquivo no
manifesto traz o novo nome proposto.

## 3. Seleção de assets prioritários (25)

Critérios: identidade, profundidade, continuidade com o teaser, legibilidade,
narrativa e interatividade. **Nenhum** item restrito entra nos 25.
PNG original total: 17,7 MB → estimativa web (extrapolada das razões medidas na amostra do §8): ~0,9–1,0 MB (AVIF) / ~1,8–2,0 MB (WebP).

| id (sugerido) | Arquivo (`assets/elements/…`) | Dim. (conteúdo) | PNG | Fase | Papel | Cenas |
| --- | --- | --- | ---: | --- | --- | --- |
| bg-praia | backgrounds/praia-encantada-abertura.png | 941×1672 | 2693 KB | P0 | fundo | 1 |
| env-fechado | envelopes/envelope-fechado-frontal-com-perolas-01.png | 655×468 (564×357) | 471 KB | P0 | **interativo** | 1 |
| env-aberto | envelopes/envelope-aberto-com-brilho-e-bolhas-01.png | 562×482 (508×441) | 462 KB | P0 | **interativo** | 1,2 |
| bolhas-trilha | bolhas/trilha-diagonal-de-bolhas-01.png | 391×413 (353×368) | 192 KB | P0 | decorativo | 1,2 |
| bolhas-grupo | bolhas/grupo-de-bolhas-02.png | 279×332 (241×268) | 104 KB | P0 | decorativo | 2 |
| bolha-g / m / p | bolhas/uma-bolha-04 · 09 · 01.png | até 160×165 | 14–38 KB | P0 | decorativo (pool) | 1–3 |
| placa-tag | molduras-e-placas/placa-horizontal-arredondada-com-conchas-01.png | 780×277 | 239 KB | P0 | decorativo | 1 |
| bg-fundo-do-mar | backgrounds/fundo-do-mar-cenário-principal.png | 941×1672 | 2498 KB | P1 | fundo | 2,3 |
| cavalo-marinho | cavalo-marinho/cavalo-marinho-grande.png | 654×1402 (610×1371) | 1368 KB | P1 | decorativo | 3 |
| alga-turquesa / alga-rosa | plantas/alga-marinha-turquesa-01 · rosa-01.png | ≤175×336 | 60–89 KB | P1 | decorativo (sway) | 3 |
| coral-azul | corais/coral-azul-ramificado-com-perolas-01.png | 206×270 | 79 KB | P1 | decorativo | 3 |
| bg-convite | backgrounds/cenário-do-convite-revelação final.png | 941×1672 | 2875 KB | P1 | fundo | 4,5,6 |
| trono-concha | conchas-e-perolas/trono-de-concha-real-01.png | 647×729 (628×686) | 879 KB | P1 | **interativo** | 4,6 |
| concha-perola | conchas-e-perolas/concha-aberta-com-perola-gigante-01.png | 514×385 | 319 KB | P1 | **interativo** | 4,6 |
| moldura-info | molduras-e-placas/moldura-principal-com-conchas-e-corais-01.png | 802×725 (766×694) | 972 KB | P1 | decorativo (painel) | 4,5 |
| divisor | molduras-e-placas/divisor-horizontal-com-concha-e-arabescos-01.png | 1021×203 | 199 KB | P1 | decorativo | 5 |
| placa-botao | molduras-e-placas/placa-horizontal-ondulada-com-concha-01.png | 655×383 | 300 KB | P1 | decorativo | 5 |
| estrela-rosa | estrelas-do-mar/estrela-do-mar-rosa-com-perolas-01.png | 218×256 | 75 KB | P1 | decorativo | 5 |
| cascata-bolhas | bolhas/cascata-vertical-de-bolhas-01.png | 215×405 | 120 KB | P1 | decorativo | 4,6 |
| coracao-bolhas | bolhas/coracao-de-bolhas-01.png | 353×570 (332×538) | 270 KB | P1 | decorativo | 6 |
| bg-complementar | backgrounds/arte-complementar.png | 941×1672 | 2858 KB | P1 | capa / base OG | — |
| garrafa | decorativos/garrafa-com-conchas-e-estrela-01.png | 175×249 | 76 KB | P2 | interativo (presentes), opcional | 5 |

**Interativos × decorativos.** Interativos (alvo de toque, com foco visível e
rótulo acessível): envelope, trono/concha-pérola, e opcionalmente garrafa e
bolhas "estourar". Decorativos (`aria-hidden`, nunca a única navegação):
algas, corais, bolhas, estrela, molduras e placas. Placas e moldura servem só
como **fundo**; o texto e os links continuam HTML real.

**Exclusivo da Maitê × reutilizável.** Exclusivos: tudo com a criança, a tag e a
cartela. Reutilizáveis em outros eventos de tema marinho: os 4 backgrounds,
sprites de conchas/corais/bolhas/molduras e o cavalo-marinho. Comportamentos
100% reutilizáveis: abrir envelope/concha, transição de bolhas, trilha de
partículas, painel com moldura, balanço/flutuação, parallax leve.

**Coerência verificada** em maquetes estáticas (3 cenas; ver §Anexo): paleta,
luz frontal suave, acabamento perolado e escala funcionam muito bem juntos.
Ressalvas: (1) sem sombra de contato os sprites "flutuam" sobre a areia;
(2) a luz quente do pôr do sol não está nos sprites (aplicar leve tinta/sombra
CSS); (3) manter sprites grandes só nos cantos/primeiro plano para não
disputar escala com a perspectiva dos fundos.

**Pendentes de aprovação** (fora dos 25): `maite-cavalo-marinho`, `maite-mao`,
`maite-tchau` — ver §7.

## 4. Mapa dos assets por cena

Legenda — **EXISTENTE** (já funciona hoje) · **AJUSTE** (aproveitável com
ajuste) · **AUSENTE** (não existe: no renderer ou na biblioteca) ·
**PENDENTE** (depende de aprovação).

| Cena | Fundo | 1º plano | Plano intermediário | Componentes reutilizáveis | Falta |
| --- | --- | --- | --- | --- | --- |
| **1 Praia** | bg-praia · **AJUSTE** (`entry.background` existe; ainda aponta para placeholder `kf01`) | env-fechado · **AUSENTE no renderer** (só envelope SVG genérico); placa-tag | bolhas-trilha, bolha-g/m/p | **EXISTENTE**: EntryScene (gate, foco, inert, reduced motion), Particles, transição "bubbles" | imagem como motivo do gate; sombra de contato |
| **2 Mergulho** | bg-fundo-do-mar por baixo do gate (crossfade) · **AUSENTE** | bolhas-grupo | env-aberto, bolhas | **EXISTENTE**: transição bubbles 1,6 s + fade | fundo sob o gate |
| **3 Submarino** | bg-fundo-do-mar · **AUSENTE** (só gradiente) | algas (sway) | cavalo-marinho, coral-azul; maite-cavalo-marinho · **PENDENTE** | **EXISTENTE**: ImageScene, Particles | camada de decoração + parallax; **peixes: AUSENTE** |
| **4 Revelação** | bg-convite · **AUSENTE** | trono-concha, moldura-info | concha-perola, cascata-bolhas; maite-mao · **PENDENTE** | **EXISTENTE**: RevealScene, DetailsScene | imagem como motivo; **concha fechada: AUSENTE** |
| **5 Info e ações** | bg-convite | moldura-info, placa-botao | divisor, estrela-rosa, garrafa (opc.) | **EXISTENTE**: Details, Actions, Gifts, Countdown | variante com imagem de fundo (HTML real mantido); dados confirmados |
| **6 Encerramento** | bg-convite | coracao-bolhas | trono, cascata-bolhas; maite-tchau · **PENDENTE** | **EXISTENTE**: MessageScene + ReplayButton | pose aprovada |

## 5. Proposta de composição visual

Fluxo contínuo de uma página (não um vídeo): o visitante toca em cada marco.

1. **Praia.** BG01 em tela cheia. O envelope fechado repousa na areia, com
   sombra suave; a tag "Maitê — 1 aninho" (HTML) sobre a placa. Pequenas
   bolhas sobem. Toque no envelope.
2. **Mergulho.** Envelope abre (troca para o aberto + brilho), bolhas em três
   camadas sobem pela tela; BG01 esmaece revelando BG02 por baixo.
3. **Mundo submarino.** BG02 fixo; o cavalo-marinho flutua; algas balançam;
   textos curtos em HTML ("Olá! Eu sou a Maitê…"). A criança entra como
   camada **opcional** só depois de aprovada; sem ela, o cavalo-marinho conta a cena.
4. **Revelação.** BG03; o trono de concha no pódio. Toque (na pérola/trono):
   luz, anel de bolhas e o painel emerge com os detalhes em HTML.
5. **Informações e ações.** Painel (moldura) com data, horário, local;
   botões sobre a placa; sugestões de presente. Tudo HTML real.
6. **Encerramento.** Coração de bolhas, mensagem final, "Rever o convite".

Em desktop: coluna central de ~480 px (ver §8) em vez de esticar a arte.

## 6. Animações candidatas

| Movimento | Técnica | Observação |
| --- | --- | --- |
| Envelope flutuando, brilho, abertura (troca fechado→aberto) | **CSS** (transform/opacity) | Sem vídeo |
| Bolhas subindo, trilha, chuva | **CSS** com sprites; ≤ 12 simultâneas em mobile | Já temos o padrão em `Particles` |
| Mergulho | **CSS**: crossfade de fundos + bolhas + blur leve | Sem filtros SVG pesados |
| Balanço de algas, flutuação do cavalo-marinho | **CSS** (rotate + translate, `transform-origin` na base) | |
| Brilho/shimmer em molduras e pérolas | **CSS** (gradiente deslizante com máscara) | |
| Ken Burns do fundo (scale 1→1,04) | **CSS**, 20 s | Opcional |
| Parallax leve | **CSS scroll-driven** (`animation-timeline`) sob `@supports` | Fallback estático; sem listeners de scroll em JS; sem giroscópio |
| Abertura da concha (tampa) | **Sem asset hoje.** Opção A: revelar por luz (sem tampa). B: gerar concha fechada/tampa+base. C: clipe curto (2–3 s) | Decidir após revisão |
| Ondas do mar | CSS não resolve bem. **Vídeo curto em loop** (3–4 s, mudo, ~400–600 KB, poster = BG01), P2 | Só com `saveData`/reduced motion desligados |
| Maitê acenando | Só se aprovada: **vídeo com alfa** (WebM/HEVC) é complexo; preferir imagem estática + movimento CSS | Fora desta fase |

Regras: só `transform` e `opacity`; `will-change` pontual; pausar animações
fora da tela; reduced motion = composição estática + fades curtos (o
renderer já respeita); nada animado atrás de texto de leitura; nunca mover
elementos interativos enquanto o usuário tenta tocar. Sem engine nova.

**Limitações do renderer atual e a menor evolução proposta** (nada foi
implementado; o contrato permanece como está):

1. `background` só existe na cena de entrada → permitir `background` (asset)
   em qualquer cena.
2. Não há camadas de decoração → uma única estrutura opcional por cena:
   `decor: [{ asset, anchor, size, depth?, motion? }]`, com `motion` em
   `float | sway | rise | twinkle | none`. Reutilizável por qualquer evento.
3. Envelope/concha só como SVG → `motifAsset` (e `openAsset`) opcional.
4. `AssetImage` aplica `border-radius` do tema (inadequado para recortes) →
   variante "sprite" sem raio e com sombra de contato.
5. Partículas são bolhas desenhadas em CSS → aceitar sprites (`particleAssets`).

Tudo opcional e retrocompatível; os testes atuais não deveriam mudar.

## 7. Lacunas e cuidados

**Privacidade e aprovação**

- 11 arquivos mostram a criança (estilizada a partir de fotos): `elements/maite/*` (3),
  `originais/…-7` e `…-8`, keyframes 5 e 6, referências 1, 2 e 4 e o **vídeo**.
  Estão todos cobertos pelo `.gitignore` (`/assets/`).
- Nenhum material tem aprovação registrada **para o site**. O teaser foi aprovado
  como peça audiovisual (doc 07, D-033); isso não cobre automaticamente publicar
  imagens da criança em página aberta. Consentimento ≠ aprovação estética (D-027).
- Recomendação: o site deve funcionar **sem a criança**; ela entra como camada
  opcional, aditiva, depois da autorização por escrito da responsável. O
  cavalo-marinho sozinho e o trono vazio já contam a história.
- `private/` já guarda as fotografias originais; os derivados com a criança estão fora dela.
  Consolidá-los em `private/` (proposta acima) quando você autorizar movimentações.
- Derivados web de qualquer item restrito **nunca** vão para o git até haver aprovação.

**Conteúdo ausente**

- **Peixes e outros animais marinhos**: nenhum asset (só peixinhos minúsculos dentro do BG02). O roteiro prevê "peixinhos passando".
- **Concha fechada** como sprite (existe só embutida no keyframe 1 e no vídeo).
- **Cartela/Open Graph horizontal**: a cartela existente é vertical e tem texto gravado.
- **Fundo para telas largas** (ver §8).
- Maitê em poses aprovadas para as cenas 3, 4 e 6.
- Áudio: não há áudio na biblioteca. Existe material em `Aniversário Maitê/music|sfx|voice`
  (fora do projeto); só entra com ação do visitante e escolha de faixas.

**Dados do evento** (inalterados, ver `docs/LACUNAS.md`): horário (12h × 13h),
local, endereço com cidade/UF, RSVP e mapa continuam bloqueando a publicação.

**Cuidados**: texto crítico não deve ser gravado em imagem; sprites precisam de
`alt` vazio e `aria-hidden` quando decorativos; hotspot de toque ≥ 48 px; foco
visível no envelope e no trono; o carregamento não pode depender da biblioteca
inteira.

## 8. Estratégia de otimização

**Princípios.** Originais intocados em `assets/` (fora do git). Derivados
gerados por script reprodutível, revisados por uma pessoa e só então copiados
para `public/events/maite-1-ano/`. Somente os ~25 prioritários; **nunca** os 140.

**Teste real em amostra** (não é conversão em massa; sharp instalado, saída
descartável):

| Arquivo | PNG | WebP q80 | AVIF q50 | WebP + alfa≤8→0 + aparado |
| --- | ---: | ---: | ---: | ---: |
| BG01 praia | 2693 KB | 239 KB | 118 KB | — |
| BG02 fundo do mar | 2498 KB | 215 KB | 110 KB | — |
| BG03 convite | 2875 KB | 290 KB | 141 KB | — |
| BG04 complementar | 2858 KB | 294 KB | 144 KB | — |
| Envelope fechado | 471 KB | 62 KB | 31 KB | 57 KB |
| Trono de concha | 879 KB | 152 KB | 57 KB | 139 KB |
| Cavalo-marinho grande | 1368 KB | 212 KB | 94 KB | 183 KB |
| Moldura principal | 972 KB | 146 KB | 54 KB | 130 KB |
| Coração de bolhas | 270 KB | 71 KB | 24 KB | 60 KB |
| **Total da amostra** | **15 001 KB** | **1 711 KB** | **784 KB** | |

Redução de 9× a 19×. Comparação visual a 100% de **um** recorte do BG01 (original × WebP × AVIF): sem
diferença relevante; o WebP suaviza um pouco o grão da areia. Falta validar os sprites e os demais fundos.

**Receita por tipo**

- *Backgrounds:* AVIF (q≈50) + WebP (q≈80) em 941 px (**sem ampliar**) e uma versão ~640 px para telas pequenas. Alvo ≤ 150 KB (AVIF) / ≤ 300 KB (WebP).
- *Sprites:* aparar margens transparentes, zerar alfa ≤ 8, WebP q80 (alfa q90) / AVIF; manter alfa real. Guardar no manifesto o tamanho de exibição máximo.
- *Entrega:* `next/image` com `images.formats = ['image/avif','image/webp']` e `sizes` coerente; `priority` só no BG01 e envelope. Alternativa: derivados estáticos pré-gerados + `unoptimized` (sem dependência do otimizador, URLs imutáveis). Recomendo começar pelo otimizador do Next **sobre masters WebP aparados**; confirmar limites/custos da hospedagem antes de publicar.
- *OG:* ver abaixo.
- *Vídeo:* não usar o teaser de 50,9 MB. Se houver clipes (ondas, concha), 3–4 s, mudos, H.264/WebM ≤ 600 KB, poster obrigatório, `preload="none"` e desligados com Save-Data/reduced motion.

**Carregamento por cena**

| Fase | Carrega | Meta |
| --- | --- | ---: |
| Cena 1 (crítica) | BG01, envelope fechado, 3 bolhas, trilha, placa | **≤ ~400 KB** (WebP; ~200 KB em AVIF) |
| Ao tocar o envelope (idle/`fetchpriority=low`) | BG02, env-aberto, cavalo-marinho, algas, coral, bolhas | ≤ ~600 KB |
| Ao entrar na cena 4 (lazy) | BG03, trono, concha, moldura, placas, divisor, coração, cascata | ≤ ~900 KB |
| **Total composição completa** | (sem o BG04) | **~1,8–2,0 MB (WebP) / ~0,9 MB (AVIF)** — estimativa a confirmar com os derivados reais |

`loading="lazy"` e `decoding="async"` fora da primeira dobra; sem carregar
sprites de cenas que o visitante ainda não alcançou.

**Resolução dos backgrounds (941×1672).**

| Contexto | Situação |
| --- | --- |
| Celular 390 px (DPR2/3) | Fundo ocupa ~2 px de arte por px CSS: **aceitável** (a imagem é pictórica e macia). Em DPR3 fica levemente suave |
| Tablet retrato | Aceitável (ampliação ~1,2×) |
| Desktop/paisagem | **Inadequado** se esticado: um recorte 16:9 usaria só ~588 px de altura da arte, ampliado ~1,5× |
| Alternativa recomendada | **Coluna central ~480 px** com o fundo à altura total e, nas laterais, o mesmo fundo desfocado/escurecido (CSS, sem novo arquivo) ou o gradiente do tema |
| Só se necessário depois | Versões de fundo largas (nova geração/outpainting) ou ampliação por IA 2× de BG01/BG03, após teste em aparelhos reais. Não ampliar tudo por padrão |

**Arte Open Graph horizontal (separada).** JPEG 1200×630, ≤ 300 KB, **sem a
criança** até aprovação. Montagem offline (não pelo `ImageResponse`, que tem
limite de 500 KB no pacote): fundo BG04 recortado/desfocado + moldura principal
+ envelope ou cavalo-marinho + título e data "8 de novembro" (sem horário nem
endereço). Texto gravado é aceitável aqui por ser peça social. Registrar como
asset `og-capa` aprovado. Atenção ao cache do WhatsApp: só divulgar o link com a arte final.

## 9. Próxima iteração recomendada

**Implementar a Cena 1 (praia + envelope + abertura)** — somente após a sua revisão:

1. Decidir: aprovar os ~25 selecionados e o plano de privacidade/estrutura.
2. Script de derivados (Node + sharp) só para os assets da cena 1: BG01, env-fechado, env-aberto, 3 bolhas, trilha, placa — com revisão visual.
3. Menor evolução do renderer (§6): `motifAsset/openAsset`, `decor` e sprite sem raio. Atualizar `maite-1-ano.json` (ids reais) mantendo os testes verdes.
4. Cena 1 funcional em `/preview/maite-1-ano`: envelope tocável, abertura, bolhas, reduced motion, teste em celular real.
5. Medir peso (meta ≤ 400 KB) e Lighthouse mobile.

Em paralelo, com a família: confirmar horário/local/RSVP e a decisão sobre uso da imagem da criança.

## Anexo — maquetes de revisão

Foram geradas três maquetes estáticas (cenas 1, 3 e 4) na resolução nativa em
`assets/_review/` (**ignorada pelo git**; descartáveis). Servem só para avaliar
escala e coerência; não representam implementação.

## Checkpoint Git

Commit local `894eff1` (fundação do renderer, 76 arquivos, **0 imagens**).
`.gitignore` agora cobre `/assets/`, `/private/`, `/raw/`, `/originals/`,
`*.psd|kra|xcf` e vídeos/áudios na raiz. Sem push, sem remoto, sem deploy.

## Cena 1 — implementação (16/10/2026)

Praia + envelope + abertura, rodando no renderer existente. **Não commitada** (aguarda revisão).
Capturas de revisão: `assets/_review/scene-01/` (ignorada pelo git).

**Assets usados (13 derivados WebP, 537 KB no total; originais intactos):**
`bg-praia` (BG01) · `env-fechado` · `env-aberto` · `placa-tag` · `bolhas-trilha` · `bolhas-grupo` ·
`bolha-g/m/p` · `conchas-leque` · `cordao-perolas` · `perola-a/b`. Nenhuma imagem da criança.
Gerados por `npm run assets:scene-01` (lê só esses 13 arquivos de `assets/`).

**Decisão (muda a recomendação do §8):** derivados servidos como arquivos estáticos
(`unoptimized`), em vez do otimizador do Next sobre masters. Motivo: sprites pequenos já
otimizados, fundo em 941 px (sem variantes por largura), URLs imutáveis e nenhuma
dependência do otimizador. AVIF fica como melhoria futura (~metade do peso).

**Extensões mínimas do contrato** (todas opcionais, só na cena `entry`; Clara & Davi inalterado):
`motifAsset`, `openAsset`, `tagAsset`, `motifPlacement`, `tagPlacement` e `decor[]`
(`asset, x, y, width, rotate, tilt, plane, motion, shadow, flip, delay, appear`).
Posições em % do **palco** (a caixa da arte de fundo), de modo que o envelope fica sobre a
areia em qualquer tela. Sem `art` pronta (fundo pendente etc.), a entrada usa o layout simples.

**Integração das camadas:** perspectiva (`tilt`) para o envelope "deitar" na areia; sombra de
contato caindo para a esquerda (sol à direita); leve tinta quente nos recortes e gradação única
por cima; planos `far/mid/near` com parallax e desfoque de campo no primeiro plano.

**Movimento (só `transform`/`opacity`, sem biblioteca):** brilho do sol na água e pontos de luz;
bolhas flutuando e subindo do envelope; pérolas cintilando; abertura (troca fechado→aberto com
brilho, bolhas liberadas, zoom "mergulho", véu pastel) em 1,7 s; parallax só com mouse.

**Acessibilidade e robustez:** botão real com `aria-describedby`; camadas `alt=""`/`aria-hidden`;
foco visível; Enter/Espaço/clique; **Escape, Enter, Espaço ou um toque pulam a transição**; reduced
motion mostra o envelope aberto estático por 0,5 s; falha de imagem esconde só aquela camada (envelope
cai no vetor); camadas secundárias só baixam depois do fundo; sombras só aparecem após a imagem
carregar; áudio nunca inicia sozinho (a cena não toca som).

**Resultados medidos** (Chrome, build de produção local): cena inteira ~537 KB; botão utilizável
a 1,8 s em ~700 kbps; ver `docs/LACUNAS.md` para limitações.

### Cena 1 — revisão de movimento (16/10/2026)

Revisão feita com o **movimento real** (gravação do Chrome em produção local, não só quadros
estáticos). Mudanças pequenas, sem alterar a direção de arte:

| Aspecto | Observado | Ajuste |
| --- | --- | --- |
| Protagonismo do envelope | pequeno frente às conchas dos cantos | largura 50% → 55% do palco |
| Etiqueta | texto ~12 px, placa encostada em corais | placa 34% → 44% e reposicionada (texto ~15 px) |
| Sombra de contato | elipse solta; envelope "flutuava" | sombra no **plano** do envelope (herda a perspectiva), `box-shadow` externo em 2 camadas, caindo à esquerda |
| Ambiente em repouso | quase imperceptível (Δ luma 0,08/quadro) | "respiração" lenta da câmera (30 s, ≤ 4,5%), +4 pontos de luz, sol mais presente (Δ 0,25) |
| Abertura | glow tímido | pico do brilho maior; texto/botão saem primeiro |
| Bolhas | 8 liberadas, saíam rápido | 17 liberadas em leque, mais visíveis (até 72% da trajetória) e mais altas |
| Mergulho | véu cedo demais e longo trecho quase branco | zoom 1,32 → 1,4, véu entre 32% e 80%, fade da entrada a partir de 74% |
| Bug encontrado na gravação | retângulo escuro na troca fechado→aberto | corrigido (sombra externa nunca é pintada sob o envelope) |

Artefatos de revisão (pasta ignorada pelo git): `assets/_review/scene-01/{antes,depois,video}/`.

### Derivados e reprodutibilidade

`assets/` (biblioteca bruta) é privado e **não vai para o GitHub**. Por isso os 13 WebP de
`public/events/maite-1-ano/scene-01/` (537 KB, sem a criança) **são versionados**; `npm run assets:scene-01`
só roda onde existe a biblioteca bruta e serve para regenerá-los. O build/deploy usa apenas os WebP
commitados. `npm run safety` (parte do `verify`) barra PNG/JPG/PDF/vídeo, pastas `assets|private|raw`,
arquivos > 1,5 MB, caminhos locais e telefones em `content/` e `docs/`.
