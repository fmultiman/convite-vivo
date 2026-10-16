# Cena 02 v2 — ambiente submarino híbrido

Entrega local de 16/10/2026. Sem commit, push ou deploy. Sem vídeo. A Cena 03 **não** foi implementada; só foi preparada (ver o fim deste documento).

## Decisão: híbrido, sem abandonar nenhum dos modos

A comparação da V1 mostrou bolhas CSS mais visíveis e Canvas mais sutil. A v2 dá a cada técnica o papel em que ela é melhor:

| Técnica | Papel na v2 | Por quê |
| --- | --- | --- |
| **CSS** | Tudo o que precisa ser *visível e decorativo*: bolhas grandes em primeiro plano, raios de luz, peixes, plantas que balançam, deriva dos planos, partículas de reserva | Roda no compositor, funciona sem JS e é previsível em celulares |
| **Canvas 2D** | Só a *atmosfera*: microbolhas discretas e neve marinha (partículas que afundam e cintilam), com reação suave ao dedo/mouse | Muitas partículas pequenas com trajetórias diferentes e interação, sem criar centenas de nós no DOM |

A cena **não depende** do Canvas. Sem ele (indisponível, reduced motion ou `#fx=css`) continuam todas as camadas CSS, e 10 partículas em CSS assumem o lugar da neve marinha.

## Camadas (de trás para a frente)

```
 texto HTML (E) ........................ título, corpo e dica de rolagem; sempre acima, sem ponteiro
 profundidade (vinheta) ................ topo clareia, fundo e bordas escurecem para o azul
 plano FRONT  ... bolhas CSS ........... 10 bolhas grandes, as mais visíveis (CSS, sobem a tela toda)
 plano NEAR   ... conchas/corais, algas desfocadas, 1 peixe grande translúcido
 canvas atmosférico .................... microbolhas (raio ≤ 9 px, alfa ≤ 0,55) + neve marinha
 partículas CSS ........................ só quando o canvas não está ativo
 plano MID    ... algas, estrela, pérolas, 3 peixes
 plano FAR    ... corais, folhagens, 5 peixes (um cardume de 3) e partículas distantes
 luz de cima ........................... brilho de superfície + 5 raios + cáusticas na areia
 plano BG     ... fundo BG02 (imagem estática)
```

Cada plano tem **deriva lenta própria** (CSS, amplitudes de 0,5 % no fundo a 2 % perto) e **parallax do mouse** proporcional à profundidade (variáveis `--px/--py`, atualizadas por rAF só enquanto o mouse se move, sem estado React). Em toque, o parallax do ponteiro não existe; a deriva dá a sensação de profundidade.

### Luz vinda de cima
- Brilho de superfície (elipse no topo) que respira a cada 8 s.
- 5 raios, cada um com ângulo, largura, ritmo (8,5–13 s) e fase próprios; só `opacity` e `transform` animam. Gradiente elíptico (sem `mask-image`).
- Cáusticas: três manchas de luz na areia, deslizando devagar.
- Intensidade geral por evento: `ambience.light` (0 desliga).

### Peixes (sprites SVG independentes)
- Não dependem dos peixes pintados no fundo. 9 peixes, duas silhuetas (`fino`, `disco`), quatro paletas (`coral`, `lilas`, `aqua`, `perola`), três planos de profundidade.
- Cada peixe: pista (atravessa o palco em 30–60 s) > balanço vertical > espelho > SVG. A cauda e a nadadeira batem com ritmos diferentes.
- `phase` define quanto da travessia já foi feito ao carregar; assim não nascem todos juntos.
- Unidades `cqw` (o `.world` é um container); sem suporte, os peixes não aparecem e a cena segue completa.
- Sem imagem, sem texto, `aria-hidden`. Servidor e cliente geram o mesmo HTML (nada aleatório).

### Plantas e partículas
- 6 plantas novas (4 sprites do inventário: alga rosa, alga turquesa, folhagem rosa e roxa), mais as 2 algas da V1, com balanço orgânico (rotação + inclinação) e **período próprio** por planta.
- Neve marinha no Canvas: ≤ 40 partículas, raio ≤ 1,9 px, afundam 2,5–9 px/s e cintilam. Em CSS: até 24 (`ambience.motes`), 10 na Maitê.

## Contrato (menor evolução possível, genérica)

Em `stage`: `fish[]`, `ambience { light, motes, parallax }` e `canvas.motes`. Em `decor`: plano `front` e movimento `idle`. Tudo opcional, com padrões; Clara & Davi não muda. O JSON Schema foi regenerado.

## Acessibilidade, reduced motion e fallbacks

- Texto, título e dica são HTML real; o Canvas e as camadas têm `pointer-events: none` e `aria-hidden`.
- **Reduced motion:** sem Canvas, sem deriva dos planos, sem parallax, sem raios pulsando e sem peixes nadando. Raios e partículas ficam estáticos; peixes ficam parados em pontos discretos; bolhas CSS ficam paradas nas posições configuradas.
- **Sem Canvas 2D:** o elemento pode existir, mas sem contexto `data-canvas` não é marcado e as partículas CSS aparecem.
- **Imagens indisponíveis:** camadas que falham somem (`data-failed`); título e texto permanecem. Peixes são SVG e não dependem de rede.
- **Aba oculta / fora da tela:** o Canvas pausa; CSS é pausado pelo navegador.
- **Mobile-first:** DPR do Canvas ≤ 1,5; densidade menor em economia de dados e em ponteiro grosso; filtros não ficam em ancestrais de elementos animados.

## Mudanças de custo feitas durante a revisão

Cada animação usa só `transform`/`opacity`; nenhum `@keyframes` usa `var()` (o que forçaria a thread principal). Foram retirados: `mask-image` dos raios, o desfoque dos peixes e o `filter` em itens que têm filhos animados (o filtro foi para a imagem estática).

## Assets

12 WebP em `public/events/maite-1-ano/scene-02/` (4 novos: `alga-rosa`, `alga-turquesa`, `folha-rosa`, `folha-roxa`). Regeneráveis com `npm run assets:scene-02` por quem tem a biblioteca privada. Nenhum contém a criança.

## Preparação da Cena 03 (sem implementar a cena)

Já existe o PNG da Maitê sentada no cavalo-marinho (`assets/elements/maite/maite-cavalo-marinho.png`, 1108 × 1383, RGBA com alfa real). **Ele não foi para `public/`, não entrou no Git e continua `pending` no JSON.** Foi preparado apenas o necessário:

1. **Derivado privado:** `npm run assets:scene-03-private` gera `assets/_prepared/maite-1-ano/scene-03-private/maite-cavalo-marinho.webp` (956 × 1357, 257 KB, alfa preservado, margens aparadas). Fica em `assets/`, ignorado pelo Git. Só deve ir para `public/` após a autorização da família.
2. **Movimento idle:** `motion: "idle"` em qualquer item de decoração (flutua ~2,4 vh e inclina ±1,7° em 5,6 s, com origem no centro-baixo). É genérico: serve para qualquer personagem ou objeto principal de outro evento. Desligado em reduced motion.
3. **Segurança por construção:** um item de decoração cujo asset não está aprovado é descartado na resolução. Mesmo que o JSON já apontasse para o asset pendente da Maitê, nada dela seria renderizado ou publicado. Testes garantem que nenhum `maite-cavalo-marinho.*` aparece no JSON ou no HTML.

### Como a Cena 03 deve usar isso
```jsonc
// quando houver autorização: copiar o WebP para public/events/maite-1-ano/scene-03/,
// marcar o asset como approved (com src, width, height, alt) e acrescentar à cena:
{ "asset": "kf03-maite-cavalo-marinho", "x": 50, "y": 56, "width": 62,
  "plane": "mid", "motion": "idle", "shadow": false }
```
Sugestão de composição: um segundo `stage` com BG02 (ou BG03), a Maitê no plano `mid` com `idle`, peixes e bolhas CSS ao redor, e a chegada animada reaproveitando `data-appear` e as animações `arrive-*`. Falta decidir com a família: autorização de uso, texto de apresentação e se a personagem acena (o PNG é sentado, de braço levantado; um vídeo curto só seria justificável aqui).

## Vídeo ambiental futuro (inalterado)

O ponto de integração segue sendo a camada A (`stage.background`): trocar a imagem por vídeo mudo em loop com poster, mantendo luz, planos, peixes, Canvas e HTML por cima. Não há abstração de vídeo nesta entrega.
