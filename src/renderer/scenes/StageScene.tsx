"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { BubbleCanvas, REVEAL_EVENT } from "../fx/BubbleCanvas";
import { FishDefs, FishSprite, usedVariants } from "../fx/Fish";
import { EXPERIENCE_EVENTS, useFxMode, usePrefersReducedMotion } from "../client/hooks";
import { AssetPlaceholder } from "../primitives/AssetImage";
import { LayerImage } from "../primitives/LayerImage";
import type { ResolvedDecor, ResolvedFeature, ResolvedScene } from "../model";
import styles from "./stage.module.css";

type StageModel = Extract<ResolvedScene, { kind: "stage" }>;

/**
 * Raios de luz vindos de cima. Posição/ângulo/ritmo diferentes por raio, para a luz
 * "respirar" sem repetir. Só opacity/transform animam; a intensidade geral é estática.
 */
const RAYS = [
  { x: 24, w: 11, a: -19, dur: 9, delay: 0, o: 0.55 },
  { x: 40, w: 19, a: -8, dur: 12, delay: -3.5, o: 0.8 },
  { x: 55, w: 15, a: 4, dur: 10, delay: -6, o: 0.7 },
  { x: 69, w: 12, a: 15, dur: 13, delay: -2, o: 0.6 },
  { x: 83, w: 8, a: 24, dur: 8.5, delay: -5, o: 0.45 },
] as const;

function Light({ intensity }: { intensity: number }) {
  if (intensity <= 0) return null;
  return (
    <div className={styles.light} style={{ "--light": intensity } as CSSProperties} aria-hidden="true">
      <div className={styles.surface} />
      {RAYS.map((r, i) => (
        <div
          key={i}
          className={styles.ray}
          style={{ "--x": r.x, "--w": r.w, "--a": r.a, "--o": r.o, "--dur": `${r.dur}s`, "--delay": `${r.delay}s` } as CSSProperties}
        />
      ))}
      <div className={styles.caustics} />
    </div>
  );
}

/** Partículas em CSS: o equivalente simples da neve marinha do canvas (só sem canvas). */
function Motes({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={styles.motes} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": (i * 37 + 13) % 100,
              "--y": (i * 53 + 7) % 82,
              "--s": `${(2.2 + (i % 3) * 1.1).toFixed(1)}px`,
              "--dur": `${(18 + (i % 5) * 3.5).toFixed(1)}s`,
              "--delay": `${(-i * 2.3).toFixed(1)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** % do topo da tela: o texto já subiu até aqui quando o destaque começa a chegar. */
const REVEAL_BAND = 16;

/**
 * Entrada da cena: um sentinela no topo do palco avisa quando o topo cruza 65 % da tela
 * (35 % do palco visível). Daí saem duas coisas, ambas conduzidas por CSS:
 *  - `data-entered`: o palco está "em cena" (liga/desliga com a rolagem; permanece ligado
 *    depois que o topo passa para cima). Em palcos consecutivos é o que dissolve o mundo
 *    do palco no quadro inteiro e avança a câmera.
 *  - `data-revealed`: a revelação do destaque (gatilho próprio, abaixo), uma vez só (e avisa o canvas, que solta
 *    bolhas junto). "Rever o convite" rearma tudo. Com reduced motion o destaque já nasce
 *    revelado, sem animação.
 *
 * A revelação tem gatilho PRÓPRIO (`data-sentinel-reveal`): só dispara quando o topo do palco
 * (onde fica o texto) chega à faixa superior da tela. Assim o texto, que sobe rolando, já passou
 * pelo meio antes de o personagem/concha aparecer e os dois nunca competem pelo mesmo espaço.
 */
function useReveal(ref: RefObject<HTMLElement | null>, hasFeature: boolean, observe: boolean, reduced: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let revealed = false;
    const reveal = (silent: boolean) => {
      if (revealed || !hasFeature) return;
      revealed = true;
      el.setAttribute("data-revealed", "");
      if (!silent) el.dispatchEvent(new CustomEvent(REVEAL_EVENT));
    };
    if (reduced) {
      el.setAttribute("data-revealed", "");
      revealed = true;
    }

    // Quem aparece no quadro: este palco ("data-live", até a dissolução de saída terminar) e o
    // palco anterior, que fica "coberto" (não pintado nem animado em canvas) quando o de baixo
    // já o cobriu por inteiro. O canvas de cada palco só roda enquanto o seu mundo é visto.
    const prev = el.previousElementSibling instanceof HTMLElement && el.previousElementSibling.hasAttribute("data-stage") ? el.previousElementSibling : null;
    const settle = reduced ? 60 : 1900; // um pouco mais que a dissolução (1,8 s)
    let coverTimer = 0;
    let liveTimer = 0;
    const myWorld = () => el.querySelector("[data-world]");
    const prevWorld = () => prev?.querySelector("[data-world]") ?? null;
    const setEntered = (entered: boolean) => {
      window.clearTimeout(coverTimer);
      window.clearTimeout(liveTimer);
      if (entered) {
        const wasLive = el.hasAttribute("data-live");
        el.setAttribute("data-live", ""); // mostra o mundo (ainda transparente)
        if (!wasLive) {
          void el.offsetHeight; // fixa o estado inicial (opacity 0) para a dissolução ter de onde partir
          syncWorld(prevWorld(), myWorld()); // entra em fase com o mundo que está na tela
        }
        el.setAttribute("data-entered", "");
        if (prev) coverTimer = window.setTimeout(() => prev.setAttribute("data-covered", ""), settle);
      } else {
        el.removeAttribute("data-entered");
        if (prev?.hasAttribute("data-covered")) {
          prev.removeAttribute("data-covered"); // o de baixo volta a ser renderizado já...
          void prev.offsetHeight;
          syncWorld(myWorld(), prevWorld()); // ...em fase com o que está saindo
        }
        liveTimer = window.setTimeout(() => el.removeAttribute("data-live"), settle);
      }
    };

    const sentinel = el.querySelector("[data-sentinel]");
    const revealSentinel = el.querySelector("[data-sentinel-reveal]");
    let io: IntersectionObserver | null = null;
    let rio: IntersectionObserver | null = null;
    if (observe && !("IntersectionObserver" in window)) {
      // Sem IntersectionObserver o mundo não pode ficar escondido à espera de um sinal que não vem.
      setEntered(true);
      reveal(true);
    } else if (observe && sentinel) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            // "Entrou" = o sentinela está na faixa útil OU já passou por cima (continua em cena).
            setEntered(e.isIntersecting || e.boundingClientRect.top < 0);
          }
        },
        { rootMargin: "0px 0px -35% 0px", threshold: 0 },
      );
      io.observe(sentinel);
      if (hasFeature && revealSentinel) {
        rio = new IntersectionObserver(
          (entries) => {
            for (const e of entries) if (e.isIntersecting || e.boundingClientRect.top < 0) reveal(false);
          },
          { rootMargin: `0px 0px -${100 - REVEAL_BAND}% 0px`, threshold: 0 },
        );
        rio.observe(revealSentinel);
      } else if (hasFeature) {
        reveal(false);
      }
    }
    const rearm = () => {
      revealed = reduced;
      if (reduced) el.setAttribute("data-revealed", "");
      else el.removeAttribute("data-revealed");
      setEntered(false);
      el.removeAttribute("data-live");
      if (io && sentinel) {
        io.unobserve(sentinel);
        io.observe(sentinel);
      }
      if (rio && revealSentinel) {
        rio.unobserve(revealSentinel);
        rio.observe(revealSentinel);
      }
    };
    window.addEventListener(EXPERIENCE_EVENTS.replay, rearm);
    return () => {
      io?.disconnect();
      rio?.disconnect();
      window.clearTimeout(coverTimer);
      window.clearTimeout(liveTimer);
      window.removeEventListener(EXPERIENCE_EVENTS.replay, rearm);
      prev?.removeAttribute("data-covered");
      for (const attr of ["data-revealed", "data-entered", "data-live"]) el.removeAttribute(attr);
    };
  }, [ref, hasFeature, observe, reduced]);
}

/**
 * Ressincroniza as animações CSS infinitas de um mundo com as do outro (mesma `currentTime`).
 * Mundos escondidos são `display: none` (não animam nem custam nada); ao voltarem, as animações
 * reiniciam do zero e precisam ficar em fase com as do mundo que está na tela, senão a dissolução
 * mostraria dois cardumes e dois conjuntos de bolhas em posições diferentes. Os dois mundos têm
 * a mesma estrutura (mesma decoração, peixes, luz), então pareamos por camada + posição.
 */
function syncWorld(from: Element | null, to: Element | null) {
  if (!from || !to) return;
  const key = (root: Element, a: CSSAnimation) => {
    const target = a.effect && "target" in a.effect ? (a.effect.target as Element | null) : null;
    if (!target) return null;
    const path: number[] = [];
    let node: Element | null = target;
    let top: Element | null = null;
    while (node && node !== root) {
      const parent: Element | null = node.parentElement;
      if (parent === root) top = node;
      if (parent) path.push(Array.prototype.indexOf.call(parent.children, node));
      node = parent;
    }
    if (!top) return null;
    const layer = (top as HTMLElement).dataset.layer ?? top.className; // camada pelo nome, não pela posição
    return `${layer}|${path.slice(0, -1).reverse().join("/")}|${a.animationName}`;
  };
  const infinite = (a: Animation): a is CSSAnimation =>
    "animationName" in a && a.effect?.getComputedTiming().iterations === Infinity;
  const source = new Map<string, number>();
  for (const a of from.getAnimations({ subtree: true })) {
    if (!infinite(a)) continue;
    const k = key(from, a);
    if (k && a.currentTime !== null) source.set(k, Number(a.currentTime));
  }
  for (const a of to.getAnimations({ subtree: true })) {
    if (!infinite(a)) continue;
    const k = key(to, a);
    const t = k ? source.get(k) : undefined;
    if (t !== undefined) a.currentTime = t;
  }
}

/** Faíscas da revelação: saem do centro do destaque em todas as direções, uma vez. */
function Sparkles({ count, on = "reveal" }: { count: number; on?: "reveal" | "open" }) {
  if (count <= 0) return null;
  return (
    <div className={styles.sparks} data-on={on} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          data-reach={["s", "m", "l"][i % 3]}
          style={
            {
              "--a": (i * (360 / count) + (i % 3) * 9).toFixed(1),
              "--s": `${(5 + ((i * 5) % 6)).toFixed(0)}px`,
              "--t": `${((i % 5) * 0.07).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * O destaque da cena: brilho + faíscas + aproximação + idle. Imagem aprovada ou placeholder (prévia).
 * Em cena com painel (`onActivate`), o próprio destaque também aceita o toque (conveniência para
 * mouse/dedo; o botão de verdade, acessível por teclado, fica na interface HTML).
 */
function Feature({ feature, withPanel = false, onActivate }: { feature: ResolvedFeature; withPanel?: boolean; onActivate?: () => void }) {
  const style = {
    "--x": feature.x,
    "--y": feature.y,
    "--w": feature.width,
    "--fx": feature.from.x,
    "--fy": feature.from.y,
    "--fs": feature.from.scale,
    "--fdelay": `${feature.delay}s`,
  } as CSSProperties;
  return (
    <div className={styles.feature} style={style} data-feature data-tap={onActivate ? "" : undefined} onClick={onActivate}>
      {feature.glow ? <div className={styles.glow} aria-hidden="true" /> : null}
      <Sparkles count={feature.sparkles} />
      {withPanel ? <Sparkles count={Math.max(feature.sparkles, 16)} on="open" /> : null}
      <div className={styles.approach}>
        <div className={styles.idle}>
          {feature.image ? (
            <LayerImage image={feature.image} alt={feature.alt} className={styles.featureImg} />
          ) : (
            <AssetPlaceholder label={feature.label} width={7} height={10} className={styles.featurePlaceholder} />
          )}
          {withPanel ? <span className={styles.pearl} aria-hidden="true" /> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Um plano de profundidade, em duas camadas: o plano (parallax do mouse e câmera, via
 * translate/scale) e, dentro dele, a deriva lenta (animação de transform). Separar as duas
 * mantém a deriva no compositor (ver stage.module.css).
 */
function Plane({ name, children }: { name: "bg" | "far" | "mid" | "feature" | "near" | "front"; children: ReactNode }) {
  return (
    <div className={styles.plane} data-layer={name}>
      <div className={styles.drift}>{children}</div>
    </div>
  );
}

/**
 * Parallax do mouse: atualiza duas variáveis CSS no palco (sem estado React) com
 * suavização em rAF, só enquanto o ponteiro se move. Eventos de toque são ignorados
 * (a deriva lenta em CSS já dá profundidade); desligado com reduced motion.
 */
function useStageParallax(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const tick = () => {
      raf = 0;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.003 || Math.abs(ty - cy) > 0.003) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
    };
  }, [ref, enabled]);
}

function Sprite({ item, index }: { item: ResolvedDecor; index: number }) {
  const style = {
    "--x": item.x,
    "--y": item.y,
    "--w": item.width,
    "--rot": `${item.rotate}deg`,
    "--tilt": `${item.tilt}deg`,
    "--flip": item.flip ? -1 : 1,
    "--delay": `${item.delay}s`,
    // Fallback em CSS das bolhas: durações variadas, sem aleatoriedade (SSR = cliente).
    "--dur": `${(15 + (index % 5) * 2.6).toFixed(1)}s`,
    // Balanço das plantas: períodos diferentes (sem aleatoriedade).
    "--sway": `${(4.8 + ((index * 7) % 5) * 0.85).toFixed(2)}s`,
  } as CSSProperties;
  return (
    <div className={styles.item} style={style} data-plane={item.plane} data-appear={item.appear} data-shadow={item.shadow || undefined}>
      <div className={styles.mover} data-motion={item.motion}>
        <div className={styles.tilt}>
          <LayerImage image={item.image} />
        </div>
      </div>
    </div>
  );
}

/**
 * Palco em camadas (cena "stage"), de trás para a frente:
 *   fundo estático · raios de luz (CSS) · distante (decoração + peixes) · intermediária
 *   · partículas CSS (só sem canvas) · canvas atmosférico (microbolhas + neve marinha)
 *   · próxima (decoração + peixe desfocado) · primeiro plano (bolhas CSS) · profundidade
 *   (vinheta) · texto HTML.
 *
 * Híbrido: o CSS carrega o que é visível e decorativo (bolhas grandes, peixes, plantas,
 * luz); o canvas é um aprimoramento opcional, só atmosférico. Sem canvas (indisponível,
 * reduced motion ou "#fx=css") a cena continua completa, com partículas em CSS.
 */
export function StageScene({
  scene,
  first,
  stack,
  tint,
  panel,
}: {
  scene: StageModel;
  first: boolean;
  /** Conteúdo do painel (cenas aninhadas), já renderizado pelo SceneView. */
  panel?: ReactNode;
  /** Presente quando o palco faz parte de um grupo de palcos consecutivos. */
  stack?: { after: boolean; last: boolean; shareFill: boolean };
  tint?: string;
}) {
  const { art } = scene;
  const fx = useFxMode();
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);

  // As imagens da cena só começam a baixar depois do essencial da entrada (ou ao tocar).
  useEffect(() => {
    const hasGate = document.documentElement.dataset.cvPhase !== undefined;
    const timer = window.setTimeout(() => setArmed(true), hasGate ? 1200 : 0);
    const arm = () => setArmed(true);
    window.addEventListener(EXPERIENCE_EVENTS.enter, arm);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(EXPERIENCE_EVENTS.enter, arm);
    };
  }, []);

  const canvas = art?.canvas ?? null;
  const spriteUrls = useMemo(() => canvas?.sprites.map((s) => s.src) ?? [], [canvas]);
  const useCanvas = Boolean(canvas) && fx === "canvas" && !reduced;
  const stageRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const panelId = `${scene.id}-panel`;

  // Trava de progressão: enquanto o painel (o convite) não foi aberto, nada depois deste palco existe
  // na página (ver experience.module.css): a rolagem termina na concha e só o toque na pérola libera.
  // Sem JavaScript, o painel já está aberto e nada trava.
  const hasPanel = Boolean(scene.panel);
  useEffect(() => {
    if (!hasPanel) return;
    const root = document.documentElement;
    if (open) delete root.dataset.cvLock;
    else root.dataset.cvLock = scene.id;
    return () => {
      delete root.dataset.cvLock;
    };
  }, [hasPanel, open, scene.id]);

  // "Rever o convite" fecha o painel de novo.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(EXPERIENCE_EVENTS.replay, close);
    return () => window.removeEventListener(EXPERIENCE_EVENTS.replay, close);
  }, []);

  const openPanel = () => {
    if (open) return;
    setOpen(true);
    stageRef.current?.dispatchEvent(new CustomEvent(REVEAL_EVENT)); // as bolhas do canvas sobem junto
    requestAnimationFrame(() => {
      const el = panelRef.current;
      el?.focus({ preventScroll: true });
      // Dá um instante para a abertura ser vista e então leva o convite à tela.
      window.setTimeout(() => el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), reduced ? 0 : 750);
    });
  };
  useStageParallax(stageRef, (scene.ambience?.parallax ?? true) && !reduced);
  useReveal(stageRef, Boolean(art?.feature), Boolean(art?.feature || stack?.after), reduced);
  const titleId = scene.headline ? `${scene.id}-title` : undefined;

  const text = (
    <div className={styles.text}>
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      {scene.headline ? (
        <h2 id={titleId} className={styles.headline}>
          {scene.headline}
        </h2>
      ) : null}
      {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
    </div>
  );

  if (!art) {
    // Fundo pendente/indisponível: o texto continua legível sobre o fundo do tema.
    return (
      <section id={scene.id} className={styles.plain} aria-labelledby={titleId}>
        {text}
        {scene.panel ? (
          <div id={`${scene.id}-panel`} className={styles.panel} data-plain>
            {panel}
          </div>
        ) : null}
      </section>
    );
  }

  const decor = art.decor.filter((d) => d.appear !== "onOpen");
  const fishList = scene.fish ?? [];
  const fishPrefix = `${scene.id}-fish`;
  const layer = (plane: "far" | "mid" | "near" | "front") => [
    ...decor.filter((d) => d.plane === plane).map((item, i) => <Sprite key={`${plane}-${i}`} item={item} index={i} />),
    ...(plane === "front"
      ? []
      : fishList.flatMap((f, i) => (f.plane === plane ? [<FishSprite key={`fish-${i}`} fish={f} prefix={fishPrefix} index={i} />] : []))),
  ];
  const stageStyle = {
    "--aspect": `${art.background.width} / ${art.background.height}`,
    "--aspect-n": art.background.width / art.background.height,
    "--tint": tint,
    // Enquadramento do fundo (a "câmera"): zoom e ponto focal.
    "--zoom": scene.view?.zoom ?? 1,
    "--vx": `${scene.view?.x ?? 50}%`,
    "--vy": `${scene.view?.y ?? 50}%`,
  } as CSSProperties;

  // O primeiro bloco do painel (o convite) vai dentro da moldura; os demais seguem soltos.
  const panelItems = Array.isArray(panel) ? panel : panel ? [panel] : [];
  const framedPanel =
    scene.panel?.frame && panelItems.length > 0
      ? [
          <div key="frame" className={styles.frame}>
            <div className={styles.frameArt} aria-hidden="true" />
            <div className={styles.frameBody}>{panelItems[0]}</div>
          </div>,
          ...panelItems.slice(1),
        ]
      : panel;

  const screen = (
    <>
      {/* Telas largas: o mesmo fundo desfocado preenche as laterais da coluna central. */}
      <div className={styles.fill} aria-hidden="true">
        {armed ? <LayerImage image={art.background} className={styles.fillImg} lazy /> : null}
      </div>

      <div className={styles.box}>
        <div className={styles.world} data-world>
          {fishList.length > 0 ? <FishDefs prefix={fishPrefix} variants={usedVariants(fishList)} /> : null}
          {/* A — fundo */}
          <Plane name="bg">{armed ? <LayerImage image={art.background} className={styles.bg} /> : null}</Plane>
          {/* Luz vinda de cima */}
          <Light intensity={scene.ambience?.light ?? 0.6} />
          {/* B — decoração distante e intermediária (com os peixes de cada plano) */}
          <Plane name="far">{layer("far")}</Plane>
          <Plane name="mid">{layer("mid")}</Plane>
          {/* Partículas em CSS (somem quando o canvas assume) */}
          <Motes count={scene.ambience?.motes ?? 10} />
          {/* Destaque revelado (brilho, faíscas, aproximação, idle) */}
          {art.feature ? (
            <Plane name="feature">
              <Feature feature={art.feature} withPanel={Boolean(scene.panel)} onActivate={scene.panel && !open ? openPanel : undefined} />
            </Plane>
          ) : null}
          {/* C — canvas atmosférico */}
          {useCanvas && canvas ? (
            <BubbleCanvas sprites={spriteUrls} density={canvas.density} motes={canvas.motes} className={styles.canvas} />
          ) : null}
          {/* D — decoração próxima */}
          <Plane name="near">{layer("near")}</Plane>
          {/* Primeiro plano: bolhas CSS, o elemento mais visível */}
          <Plane name="front">{layer("front")}</Plane>
          <div className={styles.depth} aria-hidden="true" />
          {tint ? <div className={styles.haze} aria-hidden="true" /> : null}
        </div>
      </div>

      {/* E — interface HTML */}
      {text}
      {scene.panel ? (
        <div className={styles.gate}>
          <button type="button" className={styles.gateBtn} onClick={openPanel} aria-expanded={open} aria-controls={panelId} disabled={open}>
            {scene.panel.prompt}
          </button>
        </div>
      ) : null}
      {scene.scrollHint ? (
        <p className={styles.hint}>
          <span>{scene.scrollHint}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </p>
      ) : null}
    </>
  );

  return (
    <section
      ref={stageRef}
      id={scene.id}
      className={styles.stage}
      style={stageStyle}
      data-stage
      data-first={first || undefined}
      data-grouped={stack ? "" : undefined}
      data-after-stage={stack?.after || undefined}
      data-group-last={stack?.last || undefined}
      data-share-fill={stack?.shareFill || undefined}
      data-has-feature={art.feature ? "" : undefined}
      data-has-panel={scene.panel ? "" : undefined}
      data-open={open || undefined}
      aria-labelledby={titleId}
    >
      {art.feature || stack?.after ? <span className={styles.sentinel} data-sentinel aria-hidden="true" /> : null}
      {art.feature ? <span className={styles.sentinel} data-sentinel-reveal aria-hidden="true" /> : null}
      {scene.panel ? <div className={styles.screen}>{screen}</div> : screen}
      {scene.panel ? (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          className={styles.panel}
          data-framed={scene.panel.frame ? "" : undefined}
          style={scene.panel.frame ? ({ "--frame": `url(${scene.panel.frame.src})` } as CSSProperties) : undefined}
        >
          {framedPanel}
        </div>
      ) : null}
    </section>
  );
}
