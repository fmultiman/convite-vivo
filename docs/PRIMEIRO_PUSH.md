# Primeiro push seguro (repositório PÚBLICO)

Estado em 16/10/2026: **nada foi enviado**. Sem `remote`, sem deploy, sem DNS.
GitHub informado: `https://github.com/fmultiman/convite-vivo` (existe, vazio, sem branches).
Este repositório local tem a raiz em `convite-vivo-web/` (a pasta pai, com a documentação interna
em `.docx`, **não** faz parte do git).

## Antes de qualquer push (decisões pendentes)

1. **E-mail dos commits.** Os 2 commits locais têm o **e-mail pessoal do autor** (conferir com
   `git log --format='%ae'`); ficará público para sempre. Opções: (a) aceitar; (b) reescrever **antes** do 1º push com o e-mail
   `ID+fmultiman@users.noreply.github.com` (GitHub → Settings → Emails). Só com sua aprovação.
2. **Dados da família em texto.** O histórico/árvore contém o primeiro nome da pessoa de contato da família em
   notas internas de `content/events/maite-1-ano.json`, `docs/` e um teste, além de tamanhos de
   roupa dos presentes e um horário candidato **não confirmado** (os valores foram neutralizados no checkpoint da Cena 01, mas continuam nos commits anteriores). Nenhum endereço, telefone
   ou foto. Opções: neutralizar ("a família"), manter o JSON do evento fora do repo público
   até a aprovação da família, ou aceitar.
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
