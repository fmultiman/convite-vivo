/**
 * Simulação das bolhas ambientais (funções puras, sem DOM nem React).
 * O canvas apenas desenha o estado; a física fica aqui para ser testável.
 *
 * Unidades: pixels CSS e segundos.
 */

export interface Bubble {
  /** Posição-base (antes do balanço lateral e do deslocamento do ponteiro). */
  x: number;
  y: number;
  /** Raio em px CSS. */
  r: number;
  /** Profundidade 0.3 (longe) .. 1 (perto): afeta velocidade, opacidade e tamanho. */
  z: number;
  /** Subida em px/s. */
  speed: number;
  phase: number;
  sway: number;
  swayHz: number;
  /** Deslocamento elástico causado pelo ponteiro, e sua velocidade. */
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  alpha: number;
  sprite: number;
  /** Bolhas da rajada de entrada: sobem rápido e somem ao sair da tela. */
  burst: boolean;
  /**
   * Partícula flutuante (neve marinha): minúscula, afunda devagar e cintila.
   * Usa os mesmos campos; `speed` é negativo (desce) e `phase` também dita o brilho.
   */
  mote: boolean;
}

export interface SimConfig {
  width: number;
  height: number;
  density: number;
  /** Ponteiro grosso (toque): menos bolhas e raio de influência maior. */
  coarse: boolean;
  spriteCount: number;
  /**
   * Papel atmosférico (híbrido): as bolhas grandes e visíveis ficam em CSS, no primeiro
   * plano; o canvas só acrescenta microbolhas discretas. Padrão: bolhas "de destaque".
   */
  atmosphere?: boolean;
  /** Multiplicador da quantidade de partículas flutuantes. */
  motesDensity?: number;
}

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export type Rand = () => number;

/** PRNG determinístico (testes e capturas reproduzíveis). */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Quantidade de bolhas: proporcional à área, limitada (custo previsível em celulares). */
export function bubbleCount(width: number, height: number, density: number, coarse: boolean, atmosphere = false): number {
  const perBubble = atmosphere ? (coarse ? 21000 : 16000) : coarse ? 26000 : 21000;
  const max = atmosphere ? 54 : 46;
  return Math.min(max, Math.max(8, Math.round(((width * height) / perBubble) * density)));
}

/** Quantidade de partículas flutuantes (neve marinha), proporcional à área e limitada. */
export function moteCount(width: number, height: number, density: number, coarse: boolean): number {
  const per = coarse ? 30000 : 22000;
  return Math.min(40, Math.max(0, Math.round(((width * height) / per) * density)));
}

/** Raio de influência do ponteiro. */
export function influenceRadius(coarse: boolean): number {
  return coarse ? 118 : 92;
}

function makeBubble(cfg: SimConfig, rand: Rand, startAnywhere: boolean): Bubble {
  const z = lerp(0.3, 1, rand());
  const small = Boolean(cfg.atmosphere);
  const size = (small ? lerp(2.4, 9, Math.pow(rand(), 1.6)) : lerp(4, 22, Math.pow(rand(), 1.7))) * (0.6 + 0.4 * z);
  return {
    x: rand() * cfg.width,
    y: startAnywhere ? rand() * (cfg.height + 40) : cfg.height + size + rand() * 60,
    r: size,
    z,
    speed: (small ? lerp(9, 30, rand()) : lerp(14, 46, rand())) * (0.45 + 0.55 * z),
    phase: rand() * Math.PI * 2,
    sway: lerp(3, 13, rand()) * z,
    swayHz: lerp(0.15, 0.42, rand()),
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    alpha: (small ? lerp(0.2, 0.55, z) : lerp(0.4, 0.95, z)) * lerp(0.75, 1, rand()),
    sprite: cfg.spriteCount > 0 ? Math.floor(rand() * cfg.spriteCount) : 0,
    burst: false,
    mote: false,
  };
}

function makeMote(cfg: SimConfig, rand: Rand, startAnywhere: boolean): Bubble {
  const z = lerp(0.3, 1, rand());
  const r = lerp(0.7, 1.9, rand()) * (0.6 + 0.4 * z);
  return {
    x: rand() * cfg.width,
    y: startAnywhere ? rand() * cfg.height : -r - rand() * 50,
    r,
    z,
    speed: -lerp(2.5, 9, rand()) * (0.5 + 0.5 * z), // negativo: afunda devagar
    phase: rand() * Math.PI * 2,
    sway: lerp(4, 16, rand()) * z,
    swayHz: lerp(0.08, 0.3, rand()),
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    alpha: lerp(0.35, 0.85, z),
    sprite: 0,
    burst: false,
    mote: true,
  };
}

/** Cria o campo inicial, já ordenado do fundo para a frente (z crescente). */
export function createBubbles(cfg: SimConfig, rand: Rand): Bubble[] {
  const n = bubbleCount(cfg.width, cfg.height, cfg.density, cfg.coarse, cfg.atmosphere);
  return Array.from({ length: n }, () => makeBubble(cfg, rand, true)).sort((a, b) => a.z - b.z);
}

/** Partículas flutuantes (neve marinha) do campo atmosférico. */
export function createMotes(cfg: SimConfig, rand: Rand): Bubble[] {
  const n = moteCount(cfg.width, cfg.height, cfg.motesDensity ?? 1, cfg.coarse);
  return Array.from({ length: n }, () => makeMote(cfg, rand, true));
}

/** Brilho momentâneo (0..1) de uma partícula: cintila devagar. */
export function moteGlow(b: Bubble): number {
  return 0.55 + 0.45 * Math.sin(b.phase * 2.3);
}

/** Rajada ao entrar na cena: bolhas rápidas que cruzam a tela de baixo para cima. */
export function spawnBurst(cfg: SimConfig, rand: Rand, count: number): Bubble[] {
  return Array.from({ length: count }, () => {
    const b = makeBubble(cfg, rand, false);
    b.burst = true;
    b.z = lerp(0.6, 1, rand());
    b.r = lerp(6, 20, Math.pow(rand(), 1.3));
    b.speed = lerp(220, 420, rand());
    b.y = cfg.height + b.r + rand() * 420; // escalonadas: chegam em ondas
    b.alpha = lerp(0.6, 0.95, rand());
    b.sway = lerp(6, 18, rand());
    return b;
  });
}

const SPRING_K = 6.2;
const SPRING_C = 3.4;
const PUSH = 560;

/**
 * Avança a simulação em `dt` segundos. Retorna a lista (bolhas da rajada que
 * saíram da tela são removidas; as demais são recicladas no fundo).
 */
export function stepBubbles(
  bubbles: Bubble[],
  dt: number,
  cfg: SimConfig,
  pointer: PointerState,
  rand: Rand,
): Bubble[] {
  const R = influenceRadius(cfg.coarse);
  const out: Bubble[] = [];
  for (const b of bubbles) {
    b.y -= b.speed * dt;
    b.phase += b.swayHz * Math.PI * 2 * dt;

    if (pointer.active) {
      const px = b.x + Math.sin(b.phase) * b.sway + b.ox;
      const py = b.y + b.oy;
      const dx = px - pointer.x;
      const dy = py - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < R && d > 0.001) {
        const f = (1 - d / R) ** 2;
        const push = PUSH * f * (0.6 + 0.4 * b.z);
        b.vx += (dx / d) * push * dt;
        b.vy += (dy / d) * push * dt;
      }
    }
    // Mola amortecida: a bolha volta suavemente ao seu caminho.
    b.vx += (-SPRING_K * b.ox - SPRING_C * b.vx) * dt;
    b.vy += (-SPRING_K * b.oy - SPRING_C * b.vy) * dt;
    b.ox += b.vx * dt;
    b.oy += b.vy * dt;

    if (b.mote) {
      if (b.y - b.r > cfg.height + 12) {
        // Recicla no topo (afunda devagar), com outra posição lateral.
        const fresh = makeMote(cfg, rand, false);
        b.x = fresh.x;
        b.y = fresh.y;
        b.ox = b.oy = b.vx = b.vy = 0;
      }
      out.push(b);
      continue;
    }
    if (b.y + b.r < -12) {
      if (b.burst) continue; // rajada: descartada
      // Recicla no fundo, mantendo a profundidade (e a ordem de desenho).
      const fresh = makeBubble(cfg, rand, false);
      b.x = fresh.x;
      b.y = fresh.y;
      b.ox = b.oy = b.vx = b.vy = 0;
    }
    out.push(b);
  }
  return out;
}

/** Posição de desenho de uma bolha (base + balanço + deslocamento do ponteiro). */
export function drawPosition(b: Bubble): { x: number; y: number } {
  return { x: b.x + Math.sin(b.phase) * b.sway + b.ox, y: b.y + b.oy };
}
