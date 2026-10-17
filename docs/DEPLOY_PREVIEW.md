# Prévia remota (Vercel)

Projeto Vercel `convite-vivo` (time `fmultimans-projects`), ligado a `fmultiman/convite-vivo`.

| Ambiente | Branch | `ENABLE_DRAFT_PREVIEW` | O que existe |
| --- | --- | --- | --- |
| Production | `main` | **não definida** | `/` e `/e/<slug>` (só eventos publicados); `/preview/*` não existe |
| Preview | qualquer outra (ex.: `preview/maite-piloto`) | `true` (só em Preview) | `/preview/<slug>` com a jornada completa e o que ainda é "a confirmar" |

- A variável é lida no **build** e na execução: mudar o valor exige novo deployment.
- Dados familiares ainda não confirmados (horário, endereço, presentes) **não estão no repositório**: a prévia remota
  mostra campos "a confirmar" com textos-modelo. Ver `docs/PRIMEIRO_PUSH.md`.
- `NEXT_PUBLIC_SITE_URL` não é definida na prévia; canonical e Open Graph usam a URL do deployment (`VERCEL_URL`).
- Os links `*.vercel.app` ficam atrás da proteção da Vercel (Vercel Authentication). Para abrir no celular: entrar na
  conta Vercel do time, ou usar um link de compartilhamento temporário gerado pelo painel (Share).
- O domínio personalizado só será ativado após aprovação explícita.

Rota da Maitê: `/preview/maite-1-ano`. Evento fictício: `/e/demo-clara-e-davi` (e `/preview/demo-clara-e-davi`).
