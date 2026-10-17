# Publicação: GitHub e Vercel (repositório PÚBLICO)

Repositório: `https://github.com/fmultiman/convite-vivo` (público). Branch de produção: `main`.
A raiz do git é `convite-vivo-web/` (a pasta pai, com documentos internos em `.docx` e a biblioteca visual
bruta, **não** faz parte do repositório).

## O que ficou de fora do repositório de propósito

| Item | Onde fica | Por quê |
| --- | --- | --- |
| Biblioteca visual bruta (`assets/`), fotos, PDFs, vídeo | só na máquina local | contêm a criança e originais pesados; ignorados pelo `.gitignore` e barrados por `npm run safety` |
| Dados familiares provisórios (horário, endereço, presentes) | `private/maite-1-ano.dados-locais.json` (ignorada) | ainda não confirmados pela família; o JSON versionado tem campos vazios/textos-modelo |
| `MAITE_ASSET_MANIFEST.json` | `private/` (ignorada) | lista nomes e hashes de arquivos restritos da criança |
| Capturas de revisão, `.env*` | locais | não pertencem ao produto |

Única arte da criança no repositório: `public/events/maite-1-ano/scene-03/maite-cavalo-marinho.webp`
(autorizada para o piloto; caminho e SHA-256 fixados em `scripts/check-public-safety.mjs`).

## Cópia local de trabalho com os dados reais

A cópia local de `content/events/maite-1-ano.json` pode carregar os valores reais (de `private/`) marcada com
`git update-index --skip-worktree`. **Não confie só em `git status`**: confira o que vai ao GitHub com
`git show HEAD:content/events/maite-1-ano.json`. Para uma mudança estrutural versionável nesse arquivo:
`git update-index --no-skip-worktree content/events/maite-1-ano.json`, restaurar a versão sanitizada, editar,
commitar e reaplicar os dados locais.

## Vercel

- Projeto `convite-vivo` (time `fmultimans-projects`), Framework Next.js, raiz do repositório, branch de produção `main`.
- Produção **sem** `ENABLE_DRAFT_PREVIEW` (a rota `/preview/*` não existe em produção). A prévia só no ambiente
  Preview, com `ENABLE_DRAFT_PREVIEW=true` (lido no **build**).
- Domínio `convitevivo.multihuman.com.br`: **não ativado** até haver aprovação explícita da família e dos dados.

## Antes de publicar no domínio final

1. A família confirma horário, endereço completo (com município/UF), nome do local, RSVP e presentes.
2. Decidir se esses dados entram no JSON versionado (repositório público) ou vêm de fonte privada.
3. Remover o aviso de prévia/rascunho, revisar `robots` e Open Graph, e conferir o `NEXT_PUBLIC_SITE_URL`.
