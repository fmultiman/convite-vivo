# Cena 04 — a grande concha e o convite (V1)

Implementação local de 17/10/2026, sobre o checkpoint da Cena 03 (commit `22f2e7f`). **Sem commit da Cena 04, sem push e sem deploy.** Sem vídeo, sem imagens geradas e sem a criança nos assets novos. A passada "dados reais e revisão da jornada" (mesma data) está registrada no fim.

## O que o visitante vê

1. Depois da Maitê, o mundo submarino **se dilui** (dissolução de quadro inteiro, a mesma da Cena 03) no cenário do convite (BG03: caminho de areia com degraus, conchas e pérolas). A concha chega devagar, sobe da areia e se ilumina.
2. A **grande concha já aberta, com uma pérola enorme**, é a protagonista. O título é "Toque na pérola"; o botão logo abaixo diz **"Revelar meu convite"** (a própria concha/pérola também aceita o toque). A pérola respira (brilho suave) para convidar ao toque. Não há tampa artificial abrindo.
3. Ao tocar: a pérola floresce, faíscas e bolhas sobem, e o **convite emerge** numa moldura de pérolas, conchas e corais: "Maitê faz **1 aninho**", data e horário. A página rola sozinha até o convite (suavemente; sem animação com reduced motion) e o foco vai para ele.
4. Abaixo, ainda sobre o mesmo mundo fixo: cartão "Onde vai ser" (local), contagem regressiva, botões (confirmar presença, mapa, presentes) e sugestões de presente. No fim, o mundo se dissolve no fundo da página e segue a mensagem final.

## Estrutura (nada de renderer novo)

A Cena 04 é um `stage`, como as Cenas 02 e 03, e entra no mesmo grupo de palcos (mundo fixo, dissolução, câmera que avança). Reaproveitado: `StageScene`, `feature` (a concha: brilho, faíscas, idle), `Sparkles`, `BubbleCanvas` (bolhas sobem na abertura), `useReveal`/`syncWorld`, `DetailsScene`/`CountdownScene`/`ActionsScene`/`GiftsScene`. A extensão do contrato é pequena, genérica e opcional:

| Campo | Função |
| --- | --- |
| `stage.panel.prompt` | texto do botão que abre o painel ("Revelar meu convite") |
| `stage.panel.frame` | moldura (imagem de asset aprovado) atrás do primeiro bloco; o texto continua HTML |
| `stage.panel.children` | cenas de conteúdo aninhadas, as mesmas de um `reveal` |
| `details.fields` | quais campos (`date`, `time`, `venue`, `practical`) um bloco de detalhes mostra |
| `enabled` (qualquer cena) | `false` = a cena fica na configuração, com assets preservados, mas não entra na jornada nem gera avisos |

- O conteúdo está **no HTML desde o início**: sem JavaScript o painel aparece aberto e o botão some; com JavaScript fica escondido até o toque (`display: none`, fora da árvore de acessibilidade).
- O `reveal` clássico (concha/selo SVG) **continua** para eventos sem arte (o Clara & Davi o usa e não mudou).
- **Moldura sem deformar:** `border-image` em nove fatias (topo e base em escala natural, só uma fatia fina do meio estica, na vertical). O contêiner `.frame` não tem padding e o corpo `.frameBody` tem, em `cqw`, para as bordas não esticarem. O conteúdo da moldura é compacto (headline, data, horário); o local vai num cartão próprio ("Onde vai ser"), então um endereço longo não estica a arte. A imagem da moldura não foi alterada.
- **Teaser:** a cena `teaser` está `enabled: false` no JSON. Os assets e a capacidade de vídeo do renderer seguem intactos; para reativar, basta `enabled: true` (ver `docs/` do teaser). Não faz mais parte do percurso obrigatório.

## Assets (4 WebP, 551 KB, sem a criança)

`public/events/maite-1-ano/scene-04/` (regeneráveis com `npm run assets:scene-04`): `bg-convite` (BG03, 305 KB, é o único pesado), `concha-perola` (57 KB), `moldura-convite` (144 KB) e `divisor-conchas` (44 KB, ainda sem uso). Bolhas, peixes e luz são reaproveitados das cenas anteriores; o fundo só baixa depois do essencial (como nas outras cenas).

## Dados reais: candidatos, ainda a confirmar

Da proposta da família chegaram horário, endereço (rua e bairro) e três sugestões de presente. Como o repositório será **público**, esses valores **não são versionados**: o JSON do commit traz esses campos vazios ou com textos-modelo ("a confirmar"), e os valores reais ficam só na máquina local, em `private/maite-1-ano.dados-locais.json` (pasta ignorada) aplicados ao `content/events/maite-1-ano.json` de trabalho (ver `docs/PRIMEIRO_PUSH.md`). Todos seguem com `confirmed: false`: a prévia os mostra "a confirmar" e a **versão pública os omite**. Os testes usam candidatos fictícios (`tests/helpers.ts`), então não dependem dos dados reais.

**Ainda pendentes (nada foi inventado):** nome do local, município/cidade, CEP, link do mapa e coordenadas, telefone/WhatsApp da confirmação de presença (a ação fica desabilitada e sem destino), texto final dos presentes e confirmação formal de data/horário/endereço. Contagem: dias de calendário no fuso do evento; depois do evento aparece só texto, nunca número negativo (testado). Ver `docs/LACUNAS.md` e, para o repositório público, `docs/PRIMEIRO_PUSH.md` (o endereço está no JSON versionado).

## Validação

`npm run verify` e `npm run safety` passam. Chrome headless, capturas em `assets/_review/` (fora do Git): `scene-04/`, `scene-04-dados/`, `jornada/` (percurso completo mobile e desktop) e `jornada-cenarios/`.

- **Mobile (390×844) e desktop (1440×900):** fechada, aberta e painel rolado; sem erros no console.
- **Teclado:** Tab chega ao botão "Revelar meu convite"; Enter abre; `aria-expanded` vira `true`; o foco vai para o painel (`#concha-panel`); as ações pendentes ficam desabilitadas e fora da ordem de Tab.
- **Touch:** emulação de viewport móvel; o gesto de toque real em aparelho não foi testado.
- **Reduced motion:** abre na hora, sem animação do painel, sem canvas, sem rolagem animada.
- **Sem JavaScript:** painel visível e botão oculto.
- **Falha de assets (`scene-04/*` bloqueados):** o botão e o painel funcionam, só sem a arte.
- **Clara & Davi:** sem palcos nem painel; reveal clássico intacto.
- **Passagem 03 → 04:** dissolução limpa, sem faixa nem emenda.
- **Custo (headless/software, só comparativo, ruído ±15–30 %):** Cena 04 fechada ≈ 124 % de CPU (Cena 03: 114 %), com o painel aberto ≈ 90 %; um único canvas roda por vez.

## Limitações e próximos passos

- A abertura é delicada de propósito (brilho da pérola, faíscas e bolhas); não há "tampa" (a biblioteca não tem concha fechada).
- No desktop a data longa ("domingo, 8 de novembro de 2026") fica larga e encosta nos corais laterais da moldura; legível, mas candidato a quebrar em duas linhas ou a abreviar o dia da semana numa segunda passada.
- O divisor de conchas está pronto e não foi usado; os cartões de local, contagem, ações e presentes usam o estilo neutro (podem ganhar plaquinhas de concha numa segunda passada).
- Toque em aparelho real, desempenho em celular e a copy final seguem pendentes de revisão da família.
