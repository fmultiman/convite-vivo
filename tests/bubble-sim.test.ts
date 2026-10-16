import { describe, expect, it } from "vitest";
import {
  bubbleCount,
  createBubbles,
  createMotes,
  moteCount,
  moteGlow,
  drawPosition,
  influenceRadius,
  mulberry32,
  spawnBurst,
  stepBubbles,
  type PointerState,
  type SimConfig,
} from "@/renderer/fx/bubbleSim";

const cfg = (over: Partial<SimConfig> = {}): SimConfig => ({ width: 390, height: 844, density: 1, coarse: true, spriteCount: 3, ...over });
const idle: PointerState = { x: -9999, y: -9999, active: false };

describe("simulação das bolhas (função pura)", () => {
  it("a quantidade acompanha a área e a densidade, com limites", () => {
    expect(bubbleCount(390, 844, 1, true)).toBeLessThan(bubbleCount(1440, 900, 1, false));
    expect(bubbleCount(390, 844, 2, true)).toBeGreaterThan(bubbleCount(390, 844, 1, true));
    expect(bubbleCount(10, 10, 1, true)).toBe(8);
    expect(bubbleCount(5000, 5000, 2, false)).toBe(46);
  });

  it("é determinística com a mesma semente e varia profundidade, tamanho e velocidade", () => {
    const a = createBubbles(cfg(), mulberry32(7));
    const b = createBubbles(cfg(), mulberry32(7));
    expect(a).toEqual(b);
    expect(new Set(a.map((x) => x.r.toFixed(1))).size).toBeGreaterThan(5);
    expect(Math.min(...a.map((x) => x.speed))).toBeLessThan(Math.max(...a.map((x) => x.speed)));
    // ordenadas do fundo para a frente (z crescente) para desenhar na ordem certa
    expect(a.every((x, i) => i === 0 || a[i - 1].z <= x.z)).toBe(true);
    expect(a.every((x) => x.z >= 0.3 && x.z <= 1 && x.sprite >= 0 && x.sprite < 3)).toBe(true);
  });

  it("as bolhas sobem, balançam suavemente e são recicladas no fundo", () => {
    const rand = mulberry32(3);
    let bubbles = createBubbles(cfg(), rand);
    const y0 = bubbles.map((b) => b.y);
    bubbles = stepBubbles(bubbles, 0.5, cfg(), idle, rand);
    expect(bubbles.filter((b, i) => b.y < y0[i]).length).toBeGreaterThan(bubbles.length * 0.9);
    for (let i = 0; i < 400; i++) bubbles = stepBubbles(bubbles, 0.1, cfg(), idle, rand); // 40 s
    expect(bubbles.length).toBe(createBubbles(cfg(), mulberry32(3)).length); // nada some nem se acumula
    for (const b of bubbles) {
      expect(b.y).toBeGreaterThan(-40);
      expect(b.y).toBeLessThan(844 + 140);
      expect(Math.abs(drawPosition(b).x - b.x)).toBeLessThanOrEqual(b.sway + 0.001); // balanço limitado
    }
  });

  it("o ponteiro empurra bolhas próximas e elas voltam ao caminho depois", () => {
    const rand = mulberry32(11);
    const c = cfg({ density: 1 });
    let bubbles = createBubbles(c, rand);
    const target = bubbles[bubbles.length - 1];
    target.y = 400;
    target.x = 200;
    const pointer: PointerState = { x: 180, y: 400, active: true };
    for (let i = 0; i < 20; i++) bubbles = stepBubbles(bubbles, 1 / 60, c, pointer, rand);
    expect(target.ox).toBeGreaterThan(2); // afastou-se do dedo (que estava à esquerda)
    const far = bubbles.find((b) => Math.hypot(drawPosition(b).x - pointer.x, drawPosition(b).y - pointer.y) > influenceRadius(true) * 1.5 && b !== target)!;
    expect(Math.abs(far.ox)).toBeLessThan(0.5); // longe do dedo: sem efeito
    pointer.active = false;
    for (let i = 0; i < 300; i++) bubbles = stepBubbles(bubbles, 1 / 60, c, pointer, rand);
    expect(Math.abs(target.ox)).toBeLessThan(0.5); // mola: volta à trajetória
  });

  it("a rajada de entrada sobe rápido e é descartada ao sair da tela", () => {
    const rand = mulberry32(5);
    const c = cfg();
    const burst = spawnBurst(c, rand, 18);
    expect(burst).toHaveLength(18);
    expect(burst.every((b) => b.burst && b.speed >= 220)).toBe(true);
    let live = stepBubbles(burst, 0.016, c, idle, rand);
    expect(live).toHaveLength(18);
    for (let i = 0; i < 600 && live.length; i++) live = stepBubbles(live, 0.05, c, idle, rand);
    expect(live).toHaveLength(0);
  });

  it("dt grande (aba voltando) não teletransporta a simulação além do limite do chamador", () => {
    const rand = mulberry32(9);
    const bubbles = createBubbles(cfg(), rand);
    const before = bubbles.map((b) => b.y);
    const after = stepBubbles(bubbles, 0.05, cfg(), idle, rand);
    after.forEach((b, i) => expect(before[i] - b.y).toBeLessThanOrEqual(0.05 * 46 + 0.001));
  });
});

describe("camada atmosférica (híbrido: CSS em destaque, canvas sutil)", () => {
  const atmo = (over: Partial<SimConfig> = {}) => cfg({ atmosphere: true, ...over });

  it("as microbolhas são menores, mais discretas e mais numerosas que as de destaque", () => {
    const big = createBubbles(cfg(), mulberry32(4));
    const small = createBubbles(atmo(), mulberry32(4));
    const max = (xs: { r: number }[]) => Math.max(...xs.map((x) => x.r));
    expect(max(small)).toBeLessThan(max(big));
    expect(max(small)).toBeLessThanOrEqual(9);
    expect(Math.max(...small.map((x) => x.alpha))).toBeLessThanOrEqual(0.55);
    expect(small.length).toBeGreaterThan(big.length);
    expect(bubbleCount(5000, 5000, 2, false, true)).toBe(54);
  });

  it("partículas flutuantes: quantidade limitada, minúsculas, afundam devagar e são recicladas no topo", () => {
    const c = atmo();
    expect(moteCount(c.width, c.height, 1, true)).toBeGreaterThan(5);
    expect(moteCount(5000, 5000, 2, false)).toBe(40);
    expect(moteCount(390, 844, 0, true)).toBe(0);
    const rand = mulberry32(21);
    let motes = createMotes(c, rand);
    expect(motes.every((m) => m.mote && m.r <= 1.9 && m.speed < 0)).toBe(true);
    expect(createMotes(c, mulberry32(21))).toEqual(motes); // determinística
    const y0 = motes.map((m) => m.y);
    motes = stepBubbles(motes, 1, c, idle, rand);
    expect(motes.filter((m, i) => m.y > y0[i]).length).toBe(motes.length); // descem
    for (let i = 0; i < 1200; i++) motes = stepBubbles(motes, 0.1, c, idle, rand); // 2 min
    expect(motes).toHaveLength(createMotes(c, mulberry32(21)).length); // nada some nem se acumula
    for (const m of motes) expect(m.y).toBeLessThan(c.height + 14);
  });

  it("o brilho das partículas cintila dentro de 0..1 e o ponteiro as afasta de leve", () => {
    const c = atmo();
    const rand = mulberry32(2);
    const motes = createMotes(c, rand);
    for (const m of motes) {
      m.phase = Math.random() * 20;
      expect(moteGlow(m)).toBeGreaterThanOrEqual(0.1);
      expect(moteGlow(m)).toBeLessThanOrEqual(1);
    }
    const target = motes[0];
    target.x = 200;
    target.y = 300;
    stepBubbles(motes, 1 / 60, c, { x: 190, y: 300, active: true }, rand);
    expect(target.vx).toBeGreaterThan(0);
  });
});

