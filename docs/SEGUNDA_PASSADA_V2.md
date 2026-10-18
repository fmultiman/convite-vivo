# Segunda passada artística e de UX (17/10/2026)

Rodada sobre a versão já publicada, com o feedback do teste real no celular. Implementada e validada **localmente**
(prévia local, dados completos na cópia local). Sem push nem deploy: ver o checkpoint no fim.

## 1. O que mudou, por cena

### Fluxo (P0)
| Problema | Causa | Correção |
| --- | --- | --- |
| O texto passava por cima da Maitê e da concha | A revelação do destaque disparava quando o topo do palco cruzava 65 % da tela, com o texto ainda embaixo | A revelação tem **gatilho próprio** (`data-sentinel-reveal`): só dispara quando o topo do palco chega aos 16 % superiores da tela. O texto sobe rolando por água vazia e o personagem/concha chega depois, como um *beat*. O texto deixou de depender da revelação |
| O texto da cena seguinte cruzava a Maitê que estava saindo | O texto do palco seguinte aparecia assim que entrava na tela | O texto de um palco "depois de outro" só aparece quando o mundo dele começa a entrar (a 65 %), com 0,5 s de atraso |
| Dava para rolar além da concha sem tocar na pérola | Nada impedia a rolagem | **Trava**: enquanto o convite não é aberto, o que vem depois do grupo (mensagem final, rodapé) não existe na página e o fim da rolagem é a tela da concha. Sem JavaScript nada trava. Atributo `html[data-cv-lock]` |

Validado por medição em Chrome (390×844 e 1440×900, passos de 0,15 tela): **0 quadros com texto sobre o personagem**
(antes, o texto cruzava o rosto da Maitê nas capturas da revisão anterior; não havia medição); com a concha fechada o limite da rolagem é exatamente o início da tela da concha (1688 px no
celular) e a roda do mouse não passa; ao abrir o limite sobe (4028 px), o final aparece e o foco vai ao painel.

### Cena 1 — praia e envelope
- **Contraste e hierarquia:** névoa de leitura mais alta e mais densa (56 % da tela); frase de abertura em itálico
  gracioso cor ameixa; título maior (até 3 rem), peso 600 e brilho branco em volta das letras; complemento em peso 600.
- **Botão:** de roxo "de UI" para **pérola e areia com aro dourado** (mesmo material do selo do envelope), com um brilho
  que passa de vez em quando. O mesmo botão em "Rever o convite".
- **Atmosfera:** halo do sol que respira e quatro raios suaves atravessando a água e a areia (só `opacity`/`transform`).
- **Semântica das bolhas:** as três bolhas que "subiam" do envelope fechado agora sobem da água (à direita). Na abertura,
  as bolhas só saem **depois** que o envelope abriu.
- **Abertura em batidas (≈ 2,5 s, antes 1,7 s):** antecipação (o envelope "respira" e a luz sobe) → o aberto entra no pico do
  brilho (esconde a troca de imagem) → o envelope se desdobra e sobe → **raios de luz saem de dentro** → bolhas → mergulho.
  Com reduced motion segue instantâneo. Ver a recomendação de técnica na seção 4.

### Cena 2 — fundo do mar
- **Contraste e profundidade:** vinheta e base mais azuis, um tom médio mais escuro no meio da água (separa os corais claros do
  fundo) e luz mais forte no alto.
- **Trilha de bolhas:** 10 bolhas fazem o **mesmo caminho em S**, saindo do ponto da seta e subindo pelo caminho de areia
  (novo movimento `trail`, atrasos escalonados): "siga as bolhas" agora tem um caminho. Some na dissolução para a Maitê.
- **Meio da tela:** cardume pequeno (6 peixes) atravessando o centro. Retirei os 3 peixes minúsculos do fundo distante, que
  disputavam atenção com os peixes pintados.
- **Texto:** continua no alto (o centro agora tem vida: trilha e cardume; o texto no centro cobriria exatamente o caminho).
- **Peixes pintados no fundo:** continuam parados (não dá para removê-los sem refazer o fundo); o cardume e a trilha
  compensam. Ver "fundos a redesenhar" (seção 5).

### Cena 3 — Maitê
Texto sobe primeiro, Maitê chega quando o texto já está no alto (reveal a 16 %). O estado final é o "bom" observado.

### Cena 4 — concha
Texto primeiro, concha chega depois; **trava de rolagem** até tocar na pérola ou em "Revelar meu convite". Abertura
mais rica da concha: ver a seção 4 (depende de assets novos).

### Cena 5 — final
O encerramento ganhou fundo próprio: **de volta à praia ao entardecer** (o mesmo cenário da abertura, já em cache: sem
download extra), nascendo do lilás da página e dissolvendo no rodapé, com conchas e pérolas no chão e brilhos na água.
Fecha o arco da história (começa e termina na praia). Sem asset novo; configurável (`message.backdrop` e `message.ornaments`).

## 2. Tipografia

| Onde | Antes | Agora | Por quê / ganho |
| --- | --- | --- | --- |
| Títulos (todas as cenas) | Fraunces 500 | **Fraunces 600** com eixos **SOFT** (terminais arredondados), **WONK** (itálico gracioso) e **opsz** (desenho se adapta ao tamanho) | Mais legível sobre a arte sem perder o ar de conto; deixa de parecer "serifa genérica". Custo: dois arquivos de fonte (normal ≈ 120 KB e itálico ≈ 105 KB), carregados com `swap`, sem *preload* |
| Frase de abertura (eyebrow) | itálico claro, cinza-lilás | itálico 500, **ameixa** (mistura de acento com texto), maior, com brilho branco | Contraste da cor sobre branco ≈ 6,8:1 (antes ≈ 4,5:1 sobre o halo); sobre a arte depende do fundo, por isso o brilho branco |
| Título da primeira tela | até 2,6 rem | até 3 rem, peso 600, entrelinha 1,04 | Primeira tela mais chamativa e hierarquia clara |
| Corpo sobre a arte | Nunito 400 | Nunito **600** | Letras finas se perdiam sobre raios e espuma |
| Cartões e final | peso 500 | 600, eyebrow ameixa | Coerência com as cenas |

Não troquei de família: a combinação Fraunces + Nunito já combina com a arte; o problema era peso, cor e tamanho.

## 3. Dados

**Por que o endereço não aparecia (três camadas):**
1. **Repositório/GitHub/Vercel:** `content/events/maite-1-ano.json` versionado tem `venue.address.value: null` de propósito
   (repositório público; o endereço nunca entrou no histórico). Por isso o site publicado não o tem.
2. **Regra do renderer:** na versão pública, qualquer campo com `confirmed: false` é omitido (a prévia o mostra com selo
   "a confirmar"). Mesmo com o valor presente, o endereço ficava oculto.
3. **Falta de dados:** nome do local, município/UF, CEP e link do mapa nunca foram informados.

**Agora, na cópia local** (`private/maite-1-ano.dados-locais.json` → `content/events/maite-1-ano.json` local):
horário, endereço (rua e bairro) e os 3 presentes do briefing estão `confirmed: true`, então aparecem inclusive na
rota pública local (`/e/maite-1-ano`). A versão versionada continua sanitizada.

**Traje de banho / piscina:** entrou como informação prática **confirmada** (a família informou) no cartão
"Onde vai ser": *Traje de banho — Leve o seu! O salão tem piscina.* Isso vai também na versão pública (não é dado pessoal).

**Ainda faltando ou ambíguo:** nome do local; município/UF e CEP; link do mapa (e, sem município, não há destino
validado); telefone/WhatsApp do RSVP; texto final dos presentes (as três ideias vieram do briefing da família); confirmação formal do horário (o roteiro original divergia do briefing); se "salão" é o nome ou o tipo do local.

## 4. Vídeo, sequência de frames ou CSS/JS: recomendação aplicada

Dados do projeto: o teaser existente tem 33 s, 1080×1914, H.264 a 12,1 Mbps (50,9 MB); os recortes atuais pesam 58–77 KB
cada (`env-fechado` 70 KB, `env-aberto` 77 KB, `concha-perola` 59 KB). Peso estimado de alternativas (estimativas, não
medidas): 12–16 quadros WebP com transparência ≈ 0,8–1,2 MB; clipe H.264 de 3 s em 720×1280 ≈ 0,4–0,7 MB.

| | Abertura do envelope (Cena 1) | Concha / pérola (Cena 4) |
| --- | --- | --- |
| **Recomendação** | **Sequência de quadros WebP com transparência** (opção A) tocada por cima da praia em CSS/Canvas | **Sequência de quadros** (folha de sprites, 16–20 quadros) da concha fechada → aberta, com o brilho da pérola |
| Por quê | O envelope é um recorte sobre um fundo vivo (raios, brilhos, parallax, placa "Maitê — 1 aninho"). Vídeo teria de embutir a praia e perderia essas camadas; vídeo com transparência não é confiável no Safari/iOS (WebM alpha). A sequência mantém tudo por cima, dá controle total (tocar, pausar, só avançar com o toque) e cai de volta para a coreografia CSS atual | Mesma razão, e a abertura é **interativa** (o toque dispara, a trava de rolagem espera): quadros dão controle exato e mantêm bolhas, faíscas e câmera do mundo por cima. Vídeo é um bloco opaco, mal integrado ao zoom dos planos |
| Peso | ≈ 1 MB, só depois do primeiro desenho; o primeiro quadro é o recorte atual | ≈ 1 MB, só depois do mundo entrar |
| Manutenção | Uma folha de sprites + 2 números (quadros, duração); o resto é configuração | Idem |
| Plano B | Vídeo curto **opaco** só para os 2,5 s da abertura (praia + envelope + luz, 720p, ≈ 0,6 MB), com o primeiro quadro igual ao fundo atual como *poster*; texto e botão ficam em HTML por cima, esmaecendo ao toque | Não recomendado |
| Manter em CSS/JS | Luz, bolhas, peixes, faíscas, trava, textos e botões | Idem |
| **Depende de asset novo?** | **Sim**: os quadros intermediários não existem na biblioteca (só fechado e aberto). Gerar por imagem-para-vídeo a partir dos dois recortes e extrair/limpar quadros | **Sim**: não há concha fechada nem quadros de abertura |

**O que vale fazer agora:** nada de vídeo. A coreografia CSS entregue nesta rodada (batidas + luz saindo do envelope) e
a trava da concha cobrem o problema de fluxo e já melhoram a leitura física. **Terceira passada:** gerar os quadros do
envelope e da concha (e decidir o Plano B se os quadros não ficarem bons), e só então trocar a coreografia CSS por quadros.

## 5. Fundos a redesenhar (anotado para a próxima etapa de arte)

- **Cena 2 (`bg-mar`):** sem peixes pintados (hoje ficam parados); centro com uma **nascente de bolhas** no pé do caminho
  (de onde sai a trilha); faixa calma e mais escura no terço superior para o texto; foco no terço central onde a Maitê
  pousa; entregar em **camadas** (fundo, recife distante, corais do meio, primeiro plano) para parallax real.
- **Cena 4 (`bg-convite`):** idem sem peixes; reservar o centro para a concha.
- **Final:** a praia atual funciona; um fundo próprio (praia ao entardecer, sem a placa e sem o envelope) permitiria
  conchas e pérolas já integradas.

## 6. Pendências e próxima passada
- Teste em celular e tablet reais (toque, rolagem inercial, trava da concha no iOS).
- Quadros do envelope e da concha (seção 4).
- Cartões das informações com a linguagem da moldura (plaquinhas de concha); data longa tocando a moldura no desktop.
- Fundos redesenhados (seção 5).
