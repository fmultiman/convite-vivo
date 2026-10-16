# Cena 02 — experimento submarino V1

Entrega local em 16/10/2026. Implementação técnica concluída; aprovação artística e validação de movimento em primeiro plano pendentes. Nenhum commit da Cena 02, push ou deploy realizado.

## Checkpoint e escopo

- Cena 01 preservada no commit local `87ae4b4` (34 arquivos, incluindo 13 WebP públicos). Os commits anteriores permanecem intactos.
- Cena 02 usa BG02 e sprites decorativos existentes. Os 8 novos WebP somam 391.418 bytes (382,2 KiB), sem imagens identificáveis da criança. Bolhas e duas pérolas reutilizam derivados da Cena 01.
- A alteração na entrada limita-se à ponte: tinta azul configurável, saída da praia e chegada em profundidade no palco submarino. A animação do envelope continua sendo a V1.
- A Cena 03 e a concha final não foram desenvolvidas nesta iteração. Os placeholders e o comportamento genérico que já existiam continuam presentes.

## Composição e comportamento

O novo tipo reutilizável `stage` recebe fundo, decoração por planos, texto HTML, dica de rolagem e configuração opcional de Canvas. Contrato e modelo resolvem essas referências antes da renderização.

| Camada | Conteúdo |
| --- | --- |
| A | BG02 em WebP; começa a carregar após 1,2 s da montagem ou ao abrir o envelope |
| B | Corais e algas distantes/intermediários, com escala, opacidade e balanço diferentes |
| C | Canvas transparente; bolhas com profundidade, velocidades e tamanhos variados |
| D | Conchas, corais, estrelas e pérolas próximos, com sombras e desfoque discreto |
| E | Título, texto e dica de rolagem em HTML real |

O toque inicial inicia a ponte, com rajada de bolhas e aproximação das camadas. O véu da entrada e o da chegada compartilham `transitionTint`. A entrada libera o conteúdo em 1,7 s; a acomodação visual pode continuar depois disso. Escape permite encerrar a entrada.

O Canvas não intercepta o ponteiro: `pointer-events: none`, ouvintes passivos na janela e nenhuma atualização de React por quadro. A simulação usa `requestAnimationFrame`, limita o passo a 50 ms, o DPR a 1,5 e as bolhas ambientais a 46, além de até 18 na rajada inicial. Economia de dados reduz a densidade. Há pausa por visibilidade da aba e interseção com a tela; desmontagem cancela o loop e remove observadores e ouvintes.

## Comparação A/B

Na prévia, expandir o painel inferior e usar os botões **A · só CSS** e **B · com Canvas**.

| Modo | Como abrir | Diferença |
| --- | --- | --- |
| A — CSS | `/preview/maite-1-ano#fx=css` | 12 sprites de bolhas em trajetórias CSS; sem reação ao dedo |
| B — Canvas | `/preview/maite-1-ano` | Campo de bolhas com velocidades, profundidade e deslocamento elástico pelo ponteiro |

O código atual seleciona B quando não há hash, desde que Canvas esteja disponível e reduced motion não esteja ativo. O atributo `data-canvas` só oculta as bolhas CSS quando o contexto 2D foi obtido. Se o contexto falhar, A permanece visível. Os dois modos compartilham fundo, decoração e interface.

**Recomendação:** manter A e B para revisão. O ganho técnico de B é a interação e a variação de trajetórias; o ganho visual perceptível e o custo em celulares ainda não foram confirmados nesta retomada. Não considerar Canvas aprovado para adoção definitiva apenas pelos testes ou pelas capturas.

## Validação realizada

`ENABLE_DRAFT_PREVIEW=true npm run verify` passou: typecheck, ESLint, safety, **87 testes em 10 arquivos** e build de produção. Não foram adicionadas bibliotecas.

Os testes cobrem contrato, resolução de assets, HTML da cena, independência do evento fictício, quantidade e reciclagem das bolhas, rajada, impulso do ponteiro e retorno amortecido. Algumas verificações de ciclo de vida são guardas estáticas do código, não testes de integração do navegador.

No navegador, com o build local de produção:

| Cenário | Evidência |
| --- | --- |
| A/B | A: zero Canvas e 12 bolhas CSS visíveis; B: um Canvas e fallback oculto |
| Canvas 2D indisponível | Contexto simulado como indisponível: `data-canvas` ausente e 12 bolhas CSS visíveis |
| Reduced motion no componente | `matchMedia` simulado: Canvas desmontado e 12 bolhas CSS presentes; regras CSS de redução existem, mas a preferência real do sistema não foi emulada |
| Falha de imagens | 25 instâncias de imagem da cena forçadas a falhar: todas ocultas, título HTML preservado |
| Entrada e Escape | Estado final `open`, entrada oculta e `main` sem `inert` |
| Rolagem e eventos | Conteúdo rolável; Canvas com `pointer-events: none`; eventos de mouse/toque sintéticos enviados sem erro |
| Reutilização | Clara & Davi abre e mostra seus dados, com zero `stage` e zero Canvas |
| Rotas | Demo 200; prévia da Maitê 200; Maitê na rota pública 404; slug inexistente 404 |
| Console normal | Nenhum erro ou aviso antes da injeção deliberada de falhas de imagem |

### Limite importante da evidência visual

As sessões do navegador desta retomada permaneceram com `document.visibilityState === "hidden"`, inclusive uma nova sessão. O loop de Canvas ficou pausado, como previsto. Por isso, contagens de desenho iguais a zero nesta condição **não demonstram** desempenho, reação ao toque, pausa/retomada em primeiro plano ou suavidade. O foco agendado por `requestAnimationFrame` também não teve validação conclusiva nessa condição. O mecanismo normal da tecla Enter em um botão não pôde ser exercitado pela API disponível; Escape foi enviado como evento sintético.

Não foi produzida gravação MP4/WebM nesta retomada. Os cinco vídeos mencionados pelo agente anterior não foram localizados na pasta de revisão; não são usados como evidência desta entrega. As capturas sequenciais têm intervalos irregulares e não substituem vídeo de movimento contínuo. Não foram calculadas métricas de FPS.

As capturas apresentam artefatos de texto e repetição na borda inferior; a geometria consultada no DOM mede corretamente a cena em 844/900 px de altura. A origem desses artefatos não foi determinada. Nitidez e transição devem ser conferidas em navegador visível antes da aprovação artística.

## Evidências locais, fora do Git

Pasta `assets/_review/scene-02/`:

- `mobile-css.png` — A, 390 × 844.
- `mobile-canvas.png` — B pausado pela visibilidade, 390 × 844.
- `desktop-canvas.png` — B pausado, 1440 × 900.
- `transicao-00.png` — praia antes da abertura.
- `transicao-01.png` — captura iniciada cerca de 1,66 s após a ativação, ainda em `opening` na leitura anterior à captura.
- `transicao-02.png` a `transicao-05.png` — estado `open`; capturas iniciadas aproximadamente em 5,70 / 9,91 / 14,08 / 18,07 s.

## Arquivos da implementação

| Área | Arquivos |
| --- | --- |
| Novos componentes | `src/renderer/scenes/StageScene.tsx`, `stage.module.css`; `src/renderer/fx/BubbleCanvas.tsx`, `bubbleSim.ts`; `src/renderer/primitives/LayerImage.tsx`, `layer-image.module.css`; `src/renderer/client/FxSwitch.tsx` |
| Contrato e conteúdo | `src/contract/event.schema.ts`, `rules.ts`; `content/event.schema.json`, `content/events/maite-1-ano.json`; `src/renderer/model.ts` |
| Integração | `EventExperience.tsx`, `SceneView.tsx`, `PreviewPanel.tsx`, `experience.module.css`, `client/hooks.ts` |
| Ponte e efeitos | `scenes/EntryArt.tsx`, `EntryScene.tsx`, `entry-art.module.css`; `primitives/Particles.tsx`, `primitives.module.css` |
| Assets e comandos | `public/events/maite-1-ano/scene-02/` (8 WebP); `scripts/build-scene-assets.mjs`; `package.json` (`assets:scene-02`) |
| Testes | Novos `tests/bubble-sim.test.ts`, `stage-scene.test.tsx`; ajustes em `contract.test.ts`, `entry-art.test.ts`, `helpers.ts` |
| Documentação | Este relatório e README |

Os derivados podem ser regenerados com `npm run assets:scene-02` por quem possui a biblioteca privada. Build e deploy usam os WebP prontos, sem depender de `assets/`.

## Vídeo ambiental futuro

Não há vídeo ambiental novo nem abstração de vídeo nesta entrega. O contrato `stage.background` aceita imagem atualmente. Uma integração futura exigiria:

1. Acrescentar a opção de vídeo com poster aprovado no contrato, nas regras de referência, no modelo e no JSON Schema gerado.
2. Substituir somente a camada A por um vídeo mudo, `playsInline` e em loop, mantendo o poster até ele estar disponível; preservar Canvas, sprites e HTML nas camadas acima.
3. Aplicar a política já usada em `VideoScene`: reduced motion/economia de dados mantêm imagem; erro também retorna ao poster. Pausar fora da tela/aba e limitar o carregamento.
4. Verificar o fluxo em iOS/Android e comparar peso, nitidez e consumo antes de adotar.

## Revisão humana e próxima cena

Antes de commitar a Cena 02: comparar A/B em primeiro plano, mouse e touch reais, abertura por teclado/foco, preferência real de movimento reduzido, rolagem e ida/volta de aba. Conferir principalmente legibilidade do topo, nitidez e continuidade do mergulho.

Depois da aprovação, a próxima cena recomendada é a chegada da personagem com o cavalo-marinho, condicionada aos assets e às autorizações pertinentes. Não foi iniciada. A auditoria do histórico para o primeiro push continua sendo uma tarefa separada; passar no scanner atual não equivale a auditar todo o histórico.
