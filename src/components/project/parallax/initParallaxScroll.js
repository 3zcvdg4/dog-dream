import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wire the isladjan-style SVG parallax timelines to a custom scroller.
 * @param {HTMLElement} root - Element that contains the SVG and `.scrollElement`
 * @param {HTMLElement} scroller - Scroll container (usually the project page)
 * @returns {() => void} cleanup
 */
export function initParallaxScroll(root, scroller) {
  if (!root || !scroller) {
    return () => {};
  }

  const svg = root.querySelector('svg.parallax') || root.querySelector('svg');
  const scrollElement = root.querySelector('.scrollElement');
  if (!svg || !scrollElement) {
    return () => {};
  }

  const q = gsap.utils.selector(root);
  const speed = 100;
  const SUN_RADIUS = 32;
  const SUN_ACTOR_H = 277;
  const sunActorY = (cy) => cy + SUN_RADIUS - SUN_ACTOR_H;
  let height = 500;
  try {
    const box = svg.getBBox();
    if (box.height > 0) {
      height = box.height;
    } else if (svg.viewBox?.baseVal?.height) {
      height = svg.viewBox.baseVal.height;
    }
  } catch {
    height = svg.viewBox?.baseVal?.height || 500;
  }
  const stBase = { scroller, trigger: scrollElement };
  let mm;

  scroller.scrollTop = 0;
  ScrollTrigger.clearScrollMemory();

  const ctx = gsap.context(() => {
    gsap.set(q('#h2-1'), { opacity: 0 });
    gsap.set(q('#h2-3'), { y: 700 });
    gsap.set(q('#h2-5-actor'), { x: -150 });
    gsap.set(q('#h2-6-actor'), { x: 175 });
    gsap.set(q('#sunActor'), { y: sunActorY(-50) });
    gsap.set(q('#dinoL, #dinoR'), { y: 40 });

    mm = gsap.matchMedia();
    mm.add('(max-width: 1922px)', () => {
      gsap.set(q('#cloudStart-L, #cloudStart-R'), { x: 10, opacity: 1 });
    });

    /* SCENE 1 */
    const scene1 = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: scene1,
      start: 'top top',
      end: '45% 100%',
      scrub: 3,
    });

    scene1.to(q('#h1-1'), { y: 3 * speed, x: 1 * speed, scale: 0.9, ease: 'power1.in' }, 0);
    scene1.to(q('#h1-2'), { y: 2.6 * speed, x: -0.6 * speed, ease: 'power1.in' }, 0);
    scene1.to(q('#h1-4'), { y: 3 * speed, x: 1 * speed }, 0.03);
    scene1.to(q('#h1-6'), { y: 2.3 * speed, x: -2.5 * speed }, 0);
    scene1.to(q('#h1-7'), { y: 5 * speed, x: 1.6 * speed }, 0);
    scene1.to(q('#h1-8'), { y: 3.5 * speed, x: 0.2 * speed }, 0);
    scene1.to(q('#cloudsBig-L'), { y: 4.5 * speed, x: -0.2 * speed }, 0);
    scene1.to(q('#cloudsBig-R'), { y: 4.5 * speed, x: -0.2 * speed }, 0);
    scene1.to(q('#cloudStart-L'), { x: -300 }, 0);
    scene1.to(q('#cloudStart-R'), { x: 300 }, 0);
    scene1.to(q('#info'), { y: 8 * speed }, 0);

    /* Bird */
    gsap.fromTo(
      q('#bird'),
      { opacity: 1 },
      {
        y: -250,
        x: 800,
        ease: 'power2.out',
        scrollTrigger: {
          ...stBase,
          start: '15% top',
          end: '60% 100%',
          scrub: 4,
          onEnter() {
            gsap.to(q('#bird'), { scaleX: 1, rotation: 0 });
          },
          onLeave() {
            gsap.to(q('#bird'), { scaleX: -1, rotation: -15 });
          },
        },
      },
    );

    /* Clouds */
    const clouds = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: clouds,
      start: 'top top',
      end: '70% 100%',
      scrub: 1,
    });
    clouds.to(q('#cloud1'), { x: 500 }, 0);
    clouds.to(q('#cloud2'), { x: 1000 }, 0);
    clouds.to(q('#cloud3'), { x: -1000 }, 0);
    clouds.to(q('#cloud4'), { x: -700, y: 25 }, 0);

    /* Sun motion */
    const sun = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: sun,
      start: '1% top',
      end: '2150 100%',
      scrub: 2,
    });
    sun.fromTo(q('#sunActor'), { y: sunActorY(-50) }, { y: sunActorY(330) }, 0);
    sun.to(q('#bg_grad stop:nth-child(1)'), { attr: { 'stop-color': '#8EC5F0' } }, 0);
    sun.to(q('#bg_grad stop:nth-child(2)'), { attr: { 'stop-color': '#5AA8E0' } }, 0);
    sun.to(q('#bg_grad stop:nth-child(3)'), { attr: { 'stop-color': '#3D7AB5' } }, 0);

    /* SCENE 2 */
    const scene2 = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: scene2,
      start: '15% top',
      end: '40% 100%',
      scrub: 3,
    });
    scene2.fromTo(q('#h2-1'), { y: 500, opacity: 0 }, { y: 0, opacity: 1 }, 0);
    scene2.fromTo(q('#h2-3'), { y: 700 }, { y: 0 }, 0.1);
    scene2.fromTo(q('#h2-5-actor'), { x: -150 }, { x: 0 }, 0.1);
    scene2.fromTo(q('#h2-6-actor'), { x: 175 }, { x: 0 }, 0.1);

    /* Bats / storyboard — settle before scene2→3 transition */
    gsap.set(q('#bats'), { transformOrigin: '50% 50%' });
    gsap.fromTo(
      q('#bats'),
      { opacity: 1, y: 400, scale: 0 },
      {
        y: 20,
        scale: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          ...stBase,
          start: '40% top',
          end: '60% 100%',
          scrub: 3,
          onEnter() {
            gsap.set(q('#bats'), { opacity: 1 });
          },
        },
      },
    );

    /* Transition Scene2 → Scene3 */
    gsap.set(q('#scene3'), { y: height - 40, visibility: 'visible' });
    gsap.set(q('#scene3-sky'), { y: height - 40, visibility: 'visible' });
    const sceneTransition = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: sceneTransition,
      start: '60% top',
      end: 'bottom 100%',
      scrub: 3,
    });
    // Keep storyboard rising with the person (same y delta as sunActor).
    const batsExitY = 20 + (sunActorY(-80) - sunActorY(330));
    sceneTransition.to(q('#h2-1'), { y: -height - 100, scale: 1.5, transformOrigin: '50% 50%' }, 0);
    sceneTransition.to(q('#sunActor'), { y: sunActorY(-80) }, 0);
    sceneTransition.to(q('#bats'), { y: batsExitY }, 0);
    sceneTransition.to(q('#bg2'), { y: 0 }, 0);

    /* Scene 3 */
    const scene3 = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: scene3,
      start: '70% 50%',
      end: 'bottom 100%',
      scrub: 3,
    });
    scene3.fromTo(q('#h3-1'), { y: 300 }, { y: -550 }, 0);
    scene3.fromTo(q('#h3-2'), { y: 800 }, { y: -550 }, 0.03);
    scene3.fromTo(q('#h3-3'), { y: 600 }, { y: -550 }, 0.06);
    scene3.fromTo(q('#h3-4'), { y: 800 }, { y: -550 }, 0.09);
    scene3.fromTo(q('#h3-5'), { y: 1000 }, { y: -550 }, 0.12);
    scene3.fromTo(q('#stars'), { opacity: 0 }, { opacity: 0.5, y: -500 }, 0);
    // Scene 3 gem
    scene3.fromTo(q('#info2'), { opacity: 0 }, { opacity: 1, y: -710 }, 0.3);

    gsap.to(q('#text2'), {
      y: -10,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    scene3.to(q('#bg2-grad'), { attr: { cy: 600 } }, 0);
    scene3.to(q('#bg2-grad'), { attr: { r: 500 } }, 0);

    /* Falling star */
    gsap.set(q('#fstar'), { y: -400 });
    const fstarTL = gsap.timeline();
    ScrollTrigger.create({
      ...stBase,
      animation: fstarTL,
      start: '4200 top',
      end: '6000 bottom',
      scrub: 2,
      onEnter() {
        gsap.set(q('#fstar'), { opacity: 1 });
      },
      onLeave() {
        gsap.set(q('#fstar'), { opacity: 0 });
      },
    });
    fstarTL.to(q('#fstar'), { x: -700, y: -250, ease: 'power2.out' }, 0);

    const starPulse = [1, 3, 5, 8, 11, 15, 17, 18, 25, 28, 30, 35, 40, 45, 48];
    const delays = [0.8, 1.8, 1, 1.2, 0.5, 2, 1.1, 1.4, 1.1, 0.9, 1.3, 2, 0.8, 1.8, 1];
    starPulse.forEach((n, i) => {
      gsap.fromTo(
        q(`#stars path:nth-of-type(${n})`),
        { opacity: 0.3 },
        { opacity: 1, duration: 0.3, repeat: -1, repeatDelay: delays[i] },
      );
    });

    ScrollTrigger.refresh();
  }, root);

  // Defer one more refresh so sticky + custom scroller metrics settle after paint.
  const refreshRaf = window.requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });

  scroller.scrollTop = 0;

  return () => {
    window.cancelAnimationFrame(refreshRaf);
    mm?.revert();
    ctx.revert();
  };
}
