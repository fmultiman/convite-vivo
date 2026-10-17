# Primeiro push seguro (repositório PÚBLICO)

Estado em 16/10/2026: **nada foi enviado**. Sem `remote`, sem deploy, sem DNS.
GitHub informado: `https://github.com/fmultiman/convite-vivo` (existe, vazio, sem branches).
Este repositório local tem a raiz em `convite-vivo-web/` (a pasta pai, com a documentação interna
em `.docx`, **não** faz parte do git).

## Antes de qualquer push (decisões pendentes)

1. **E-mail dos commits.** Os 2 commits locais têm o **e-mail pessoal do autor** (conferir com
   `git log --format='%ae'`); ficará público para sempre. Opções: (a) aceitar; (b) reescrever **antes** do 1º push com o e-mail
   `ID+fmultiman@users.noreply.github.com` (GitHub → Settings → Emails). Só com sua aprovação.
2. **Dados da família em texto.** O horário (13h), o **endereço de rua e o bairro** e as sugestões de presente
   (com tamanhos de roupa/calçado da criança) chegaram como candidatos **ainda não confirmados**. Para não os levar ao
   repositório público, **o JSON versionado não os contém** (campos vazios e textos-modelo "a confirmar") e os testes usam
   valores fictícios. Os valores reais ficam em `private/maite-1-ano.dados-locais.json` (pasta ignorada) e a cópia de
   trabalho local de `content/events/maite-1-ano.json` os usa, marcada com `git update-index --skip-worktree` para o
   Git ignorar essa diferença. Para editar o JSON de verdade (mudança estrutural a versionar): `git update-index
   --no-skip-worktree content/events/maite-1-ano.json`, editar sem os dados reais, commitar e reaplicar. Notas e docs
   antigos ainda citam o primeiro nome da pessoa de contato. `npm run safety` **avisa** (não bloqueia) se houver endereço
   de rua no conteúdo versionado. Quando a família confirmar e você decidir publicar: colocar os valores com
   `confirmed: true` no JSON versionado (decisão sua) ou mantê-los fora.
3. **`MAITE_ASSET_MANIFEST.json` (local, fora do Git)** lista nomes e hashes de arquivos restritos (da criança) e
   descreve seus conteúdos. Não expõe imagens, mas revela a existência dos arquivos. Opções: manter, reduzir ou
   mover para pasta ignorada.
4. **Branch:** local é `master`; o GitHub usa `main`.

## Comandos (NÃO executados; rode só após aprovar)

```bash
git branch -M main
git remote add origin https://github.com/fmultiman/convite-vivo.git
npm run verify        # inclui npm run safety
git status --short    # conferir: nada em assets/, private/, nenhum PNG/PDF/MP4
git push -u origin main
```

## Depois do push

Conectar o projeto da Vercel ao repositório (Preview protegido; sem `ENABLE_DRAFT_PREVIEW` em
produção). O domínio `convitevivo.multihuman.com.br` só após aprovação explícita.
