# Cena 03 — revelação da Maitê no cavalo-marinho (V2: arte real + mundo contínuo)

Estado em 16/10/2026, sobre o checkpoint `427d6a6` (Cena 02 v2). **Cena 03 ainda sem commit; sem push e sem deploy.** Sem vídeo e sem imagens geradas.

## A Maitê real

- Arte usada: `public/events/maite-1-ano/scene-03/maite-cavalo-marinho.webp` (956 × 1357, 263 KB, fundo transparente), derivada de `assets/_prepared/…` (`npm run assets:scene-03-private`). A autorização de uso no microsite piloto foi dada pelo operador em 16/10/2026 e está registrada no campo `source` do asset.
- O asset `kf03-maite-cavalo-marinho` está `approved` no JSON e o `feature` da cena `chegada` o usa; a prévia e a versão pública mostram a imagem, com o texto alternativo do asset.
- **Fotografias originais, PDFs e o PNG original não saíram de `assets/`** (ignorado pelo Git). Não há rota que sirva essa pasta.
- **Proteção de mídia mantida, com exceção explícita e restrita:** `scripts/check-public-safety.mjs` continua barrando qualquer arquivo com `maite-cavalo-marinho` no nome, **exceto** o caminho exato acima com o SHA-256 fixado no script. Outro caminho, ou o mesmo caminho com outro conteúdo, falha (testado nos dois casos). Trocar a arte exige atualizar o hash de propósito. Um teste confere que o hash do script é o do arquivo do repositório.
- Aviso para o primeiro push: o repositório futuro é público; ao commitar e enviar, essa imagem passa a ser pública. A decisão é do operador (já tomada para o piloto).

## Ajustes de enquadramento da personagem

Com a arte real (que preenche toda a área da imagem, ao contrário do substituto):

| Item | Valor | Motivo |
| --- | --- | --- |
| Posição e tamanho | centro 50 % × 60 %, 64 % da largura | o rosto fica a ≈ 38 % da altura e o título termina a ≈ 24 %: ~14 % de folga, rosto livre |
| Aproximação | parte menor (50 %), um pouco acima e à esquerda, vindo do fundo do caminho | "chega" do mundo, não surge do nada |
| Atraso/duração | 0,9 s de atraso, 3,4 s de aproximação suave | rosto nítido a ≈ 2,8 s do gatilho |
| Idle | ±0,9 vh e ±1,4° em 5,6 s | discreto: a personagem tem rosto e acena |
| Brilho, faíscas, bolhas | brilho atrás (só aparece onde a personagem chega), faíscas atrás dela, bolhas da surpresa nas laterais | nada passa na frente do rosto; os efeitos ficam atrás ou ao lado |

## Causa da emenda visual entre as Cenas 02 e 03

Diagnóstico a partir de capturas "antes" (em `assets/_review/scene-03-real/antes/`):

1. **Cada palco é um quadro completo da mesma pintura** (superfície com raios em cima, areia embaixo). Empilhar dois quadros põe a **areia da Cena 02 em cima da água funda da Cena 03**: duas paisagens com enquadramento (zoom 1,0 × 1,14), luz (raios 0,62 × 0,75 e brilho extra na revelação) e decoração diferentes, unidas por uma máscara de 16 dvh. Aumentar o overlap só alongaria a emenda.
2. **Dois mundos "rolando" juntos**: cada palco tem seus próprios peixes, bolhas e planos, que também se deslocam com a rolagem, então nunca coincidem.
3. Efeitos colaterais da primeira correção (máscara de 16 dvh): faixa lilás (fundo da página) e indicador de rolagem fantasma.

## Solução: um mundo só, câmera que avança

Para palcos **consecutivos**, o renderer os agrupa (`.stageGroup`, no `EventExperience`):

- Com JS, o **mundo de cada palco fica fixo na tela** (`position: fixed`, recortado ao grupo por `clip-path`); só o **texto** (e o destaque, que vive no mundo do segundo palco) acompanha a leitura. O fundo não rola: a pintura permanece e a "câmera" é que se move.
- O segundo palco entra por **dissolução de quadro inteiro** (`opacity`), disparada por um **sentinela** no topo da cena (IntersectionObserver, ao cruzar 65 % da tela), e **avança a câmera** (`scale` nos planos em ritmos diferentes: fundo 1 → zoom da cena × 1,05; distante 1,04; intermediário 1,07; frente 1,10; próximo 1,13).
- **O segundo palco repete exatamente a decoração, os peixes, a luz e o canvas do primeiro** (um teste garante). Como todas as animações são CSS com os mesmos parâmetros, ficam em fase: durante a dissolução os dois mundos coincidem e a troca é imperceptível. Só são novos: o avanço de câmera, o destaque, o brilho e as bolhas da revelação.
- A dissolução vale também no sentido inverso (rolar de volta), e "Rever o convite" rearma tudo.
- **Sem JS:** cai no empilhamento antigo (overlap de 16 dvh com máscara), legível e funcional. **Reduced motion:** a troca de mundo é imediata, sem avanço de câmera.
- O texto da Cena 03 ganhou um halo elíptico que se dissolve em todas as bordas (a caixa retangular anterior aparecia como faixa ao rolar sobre o mundo fixo), limitado à largura da coluna.
- Pegadinha documentada no CSS: **não colocar máscara ou overflow no próprio palco**; a máscara recorta o mundo fixo à caixa da seção e traz a emenda de volta. A dissolução do fim do grupo (para o teaser) é uma máscara no `.stageGroup`.
- Extensão do contrato: nenhuma. Foram reaproveitados `stage`, `feature`, `view`, `appear: "onReveal"`, `motion: "idle"`, `decor`, `BubbleCanvas`. A nova camada é só de apresentação (grupo + sentinela); eventos com um único palco (ou sem palco) não mudam.

## Passagem Cena 01 → Cena 02 (revisão)

Revisada em gravação real: o envelope abre, o brilho cresce, a praia se dilui num véu azul e o mar chega com as bolhas, em ≈ 0,5 s. É uma dissolução intencional e coerente (o véu usa a cor do mar). A revisão encontrou um defeito **introduzido pelo agrupamento** (uma faixa clara de ≈ 4 rem no topo, porque a margem negativa da primeira cena passou a ficar dentro do grupo) e ele foi corrigido movendo essa margem para o grupo. A abertura do envelope não foi alterada.

## Comportamento da revelação (resumo)

Dispara uma vez, quando o topo da cena cruza 65 % da tela (rolagem de toque, mouse, teclado ou foco): o brilho se abre, a luz da cena intensifica (×1,45), a câmera avança, faíscas partem e o canvas solta bolhas; aos 0,9 s a personagem começa a se aproximar; aos 1,6 s o texto entra; depois, idle. CSS puro (transições de `translate/scale/rotate/opacity`), pontos de partida vindos do contrato; sem JS tudo aparece pronto; reduced motion mostra o estado final. Sem rotação 3D.

## Validação

`npm run verify` (typecheck, lint, safety, testes, build) e `npm run safety` passam; 114 testes. Capturas e gravações em `assets/_review/scene-03-real/` (fora do Git): `antes/` (estrutura anterior reproduzida pelo fallback sem JS), `depois/` (folhas de contato da passagem e da revelação, estados finais), `video/` (gravações reais de tela: `cena-01-para-02-mobile`, `cena-02-para-03-mobile`, `cena-02-para-03-desktop`).

Cenários verificados no Chrome (viewport móvel e desktop, preferências emuladas): mobile e desktop; teclado (PageDown, Espaço e seta para baixo revelam, foco no `main`, sem armadilha); reduced motion (estado final imediato, sem canvas, idle, faíscas nem brilho animado); sem JavaScript (personagem e texto visíveis); asset indisponível (imagem some, brilho e texto ficam); Clara & Davi (sem grupos, sentinelas, palcos ou canvas); console sem erros.

**Limites da evidência:** as folhas `*-reveal` congelam a linha do tempo CSS (mostram a coreografia, não a fluidez); os MP4 são screencast do Chrome headless, não medida de FPS nem de desempenho de aparelho; toque em aparelho real e o desempenho em celulares não foram testados. O navegador do Traycer não serviu para medir fluidez (janela sem foco). A máquina estava sob carga externa durante parte das capturas (antivírus e outro projeto), o que tornou o carregamento das imagens e a captura lentos.

## Pendências para a segunda passada artística

- Rever em aparelho real: custo do mundo fixo com dois canvases, brilho e sombra do destaque (`drop-shadow`), e se a máscara do `.stageGroup` pesa; se pesar, trocar por um gradiente de rodapé.
- Faíscas ainda são pontos simples (podem virar estrelas/pérolas); o brilho é discreto por escolha.
- A personagem só se aproxima e flutua (sem acenar/virar): vídeo curto ou quadros extras, se desejado.
- Contraste do texto sobre os raios de luz no topo (reforçado, mas a conferir em tela real).
- Cena 01 aceita provisoriamente; a abertura do envelope continua sendo a V1.

## Correções após o teste manual do operador (16/10/2026)

O operador viu três problemas no Chrome. Todos foram reproduzidos, tiveram a causa isolada e foram corrigidos.

### 1. A Maitê não aparecia no Chrome (aparecia no navegador do Traycer)

- **Causa:** o mundo do segundo palco (com a Maitê) só aparece quando o palco "entra", sinal dado por um IntersectionObserver sobre um **sentinela de 1 × 1 px em `left: 0`**. O palco é "largura total" (`width: 100vw` + margem negativa), e `100vw` **inclui a barra de rolagem clássica** (≈ 15 px no Chrome do Windows): o palco começa em x = −7 px e o sentinela ficava inteiramente fora da janela. O observador nunca o via, `data-entered` e `data-revealed` não eram ligados e o mundo ficava com `opacity: 0`, para sempre. O navegador do Traycer (Chromium 148) usa barra overlay (largura 0) e por isso funcionava; no meu headless com rolagem programática também.
- **Como foi reproduzido:** Chrome real com barra clássica, rolagem por **roda de mouse** (não `scrollTo`), em 1920×1080, 1366×768, 2560×1440 e 1536×864 @1,25: `entered: false` em todos. Um observador espião mostrou que o sentinela de 20 × 20 px disparava e o de 1 × 1 px não, e o grupo estava em `x = −7`.
- **Correção:** o sentinela agora é uma faixa de 1 px com a largura inteira do palco (`left: 0; right: 0`), que cruza a janela com ou sem barra. Sem `IntersectionObserver`, o mundo é mostrado imediatamente (nunca fica escondido à espera de um sinal).
- **Validação:** os mesmos 4 tamanhos com roda de mouse (`entered`/`revealed` ligados, opacidade efetiva 1, imagem dentro da tela), Traycer (Chromium 148), mobile e reduced motion.

### 2. Degradê branco cortado no topo (desktop)

- **Causa:** regressão minha da entrega anterior. Para impedir que o halo do texto virasse uma faixa nas laterais, limitei o `.text` a 36 rem, mas o primeiro palco ainda usava um halo `radial-gradient` ancorado no topo que **não chegava a zero nas bordas** da caixa: apareciam um bloco branco com laterais retas (x ≈ 665 e 1240 a 1920 px) e base reta.
- **Correção:** o halo agora é uma elipse (`52% 100% at 50% 0%`) que chega a zero nas laterais e na base; no segundo palco continua a elipse centrada. Verificado em 1920, 1366 e 2560 de largura.

### 3. Processamento no Chrome

Medido no Chrome real (headless-new, GL por software: serve para **comparar variantes**, não é um celular nem uma GPU), com CPU por processo (`SystemInfo.getProcessInfo`), `Performance.getMetrics` e contadores de rAF/desenhos dos canvases. Janela de 20 s após 6 s de acomodação, 1440 × 900.

| Cenário | Antes (CPU total · thread principal · GPU) | Depois |
| --- | --- | --- |
| Aba vazia | 18 % (ruído de partida) | 1 % |
| Cena 02 só CSS | 105 % · 41 % · 37 % | 78 % · 21 % · 35 % |
| Cena 02 híbrida (CSS + canvas) | 106 % · 40 % · 42 % | 82 % · 22 % · 38 % |
| Transição / Cena 03 em cena | 177 % · 48 % · 90 % | 128 % · 31 % · 69 % |
| Aba em segundo plano | 1,5 % | 1,2 % |

Percentuais de um núcleo (podem passar de 100 %). Há ruído de ±15–30 % entre execuções nesta máquina (antivírus e outro projeto rodando), por isso comparações finas dentro da Cena 03 foram descartadas e só mudanças grandes foram aceitas.

**O que se descobriu:**
- **O canvas não era o culpado**: ≈ 1,4 % de script e ≈ 1.250 desenhos/s por canvas; o custo era das animações CSS. Mas havia **dois canvases rodando o tempo todo** (o mundo é fixo, então ambos "estavam na tela" para o IntersectionObserver): 2 loops de rAF (114/s) e 2 × 28 quadros/s.
- **Mundo escondido não é de graça:** o segundo palco, escondido por `opacity`/`visibility`, custava quase o mesmo que visível (thread principal 42 % → 23 % ao removê-lo), porque animações sem camada composta caem na thread principal.
- **Animações fora do compositor**, isoladas por grupo (cada uma sozinha): deriva dos planos e cauda/nadadeira em SVG; a pista dos peixes em `cqw`; e o `container-type: size` no mundo. Luz, motes e movers (balanço, bolhas) eram baratos.
- Sem nenhuma animação o custo vai a zero: o gargalo é o conjunto de animações, não um filtro ou máscara isolado.

**Otimizações feitas (todas medidas, nenhuma muda a arte):**
1. Mundo fora de cena é `display: none` (palco 2 antes de entrar e depois de sair; palco 1 depois de coberto). Ao voltar, `syncWorld` ressincroniza as animações infinitas pareando por camada e posição (diferença medida de 5 px a 1440 px, ≈ 70 ms), então a dissolução continua imperceptível. Foi a maior economia (thread principal −45 %).
2. Canvas só roda enquanto o seu mundo é visto: um loop de rAF em vez de dois (114/s → 57/s) e um canvas em cena na transição.
3. Plano em duas camadas: parallax/câmera (`translate`/`scale`) no plano e a deriva (`transform`) numa camada interna; mistura na mesma camada atrapalhava o compositor (deriva sozinha: 14 % → 9 % da thread principal).
4. Peixes sem `cqw`/container (pista na largura do palco, em %) e com cauda, corpo e nadadeira em três `<svg>` próprios, para animar elementos HTML em vez de `<g>` dentro do SVG (cauda/nadadeira: 7,4 % → 4,8 %).
5. O fundo desfocado das laterais (desktop) é desenhado uma vez só quando os dois palcos usam a mesma arte.

**Não otimizado por falta de evidência:** brilho (`glow`), sombra do destaque, idle, bolhas da surpresa, faíscas. Remover cada um nesta máquina não reduziu o custo de forma consistente (variação maior que o efeito).

**Vazamentos:** após 8 ciclos de entrar/sair do palco 2 e 3× "Rever o convite": Δ nós 0, Δ listeners 0, Δ heap 0,1 MB; loops de rAF e canvases estáveis.

**Memória (Chrome, headless/software):** a página soma ≈ 270–330 MB a uma aba vazia (renderer ≈ +150 MB, GPU ≈ +120–250 MB). Na transição, com os dois mundos já não renderizados ao mesmo tempo, a GPU caiu de 331 para 265 MB.

### Riscos ainda não testados em celular real
- Custo da composição com a GPU real (as medições usam GL por software) e o consumo de bateria/temperatura.
- O `display: none` ↔ visível do segundo palco pode causar um pequeno engasgo na primeira exibição (decodificação do fundo e do destaque) em aparelhos lentos; a imagem do destaque carrega antes (é `eager`), mas o primeiro desenho do mundo não foi medido em celular.
- Barra de rolagem clássica foi testada em Chrome headless emulando janelas de desktop; outros navegadores (Firefox/Safari) e sistemas com barras diferentes não foram.
