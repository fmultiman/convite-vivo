# Integração dos assets da Maitê

> **Atualização 15/10/2026:** a biblioteca visual real da Maitê já existe em `assets/` (fora do git). Os ids de assets abaixo (`kf01…`) eram provisórios; inventário, seleção, mapa por cena e estratégia de otimização estão em [MAITE_ASSET_INTEGRATION.md](MAITE_ASSET_INTEGRATION.md) e `MAITE_ASSET_MANIFEST.json` (inventário mantido localmente, fora do Git). As regras de privacidade abaixo continuam valendo.

Todos os assets da Maitê estão declarados em `content/events/maite-1-ano.json`
com `status: "pending"`. Enquanto pendentes, o renderer mostra placeholders
(com rótulo só na prévia). **Nenhuma imagem da criança foi gerada, copiada ou
substituída por imagem externa.**

## Pontos de integração

| Asset (id) | Uso | Origem prevista |
| --- | --- | --- |
| `kf01-praia-envelope` | Fundo da entrada (praia com envelope) | Content Studio · KF-01 |
| `kf03-maite-cavalo-marinho` | Cena "Olá! Eu sou a Maitê" | Content Studio · KF-03 — **exige autorização de uso** |
| `kf04-concha` | Poster/fallback do teaser | Content Studio · KF-04 |
| `teaser` | Vídeo do convite (33 s, 1080×1914) | `convite_vivo_maite.mp4` — **exige versão web e autorização** |
| `og-capa` | Imagem de compartilhamento (WhatsApp) | KF-05 — arte aprovada, texto nítido |
| `trilha` | Trilha opcional | `Aniversário Maitê/music` — escolher faixa |

## Como ativar um asset

1. Obter a versão **aprovada e autorizada** para publicação (consentimento é
   distinto de aprovação estética — doc 07, D-027).
2. Exportar para web e salvar em `public/events/maite-1-ano/`:
   - imagens: WebP/AVIF ou JPEG, lado maior ≤ 2000 px (o Next gera variantes);
   - vídeo: MP4 H.264, ~2–4 Mbps, sem áudio se for ambiente; manter o poster;
   - OG: 1200×630 JPEG/PNG, < 600 KB;
   - áudio: MP3/AAC, mono ou estéreo leve.
3. No JSON, atualizar o asset:
   ```json
   "kf03-maite-cavalo-marinho": {
     "kind": "image",
     "status": "approved",
     "src": "/events/maite-1-ano/kf03-maite-cavalo-marinho.webp",
     "width": 1080,
     "height": 1350,
     "alt": "…",
     "placeholderLabel": "…"
   }
   ```
4. `npm run verify`.

## Regras

- Somente arquivos **aprovados e autorizados** em `public/` — tudo em
  `public/` é publicamente acessível por URL.
- Fotos originais/referências da família **nunca** entram no repositório.
- `src` precisa estar na pasta do próprio evento (validado no contrato).
- Textos críticos (nome, data, horário, local) **não** devem estar gravados
  dentro de imagens ou vídeos: o HTML é a fonte editável.
