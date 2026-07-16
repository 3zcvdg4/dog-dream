import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INTRO_COPY = {
  eyebrow: 'FINDING STONE',
  title: '挖开矿石，遇见宝石',
  lead: '儿童「挖掘寻宝」宝石科普玩具品牌——把动手能力、宝石认知与科普知识，做成一套可玩的玩具体验。',
};

/**
 * gem hold → text rise (scroll-intro) → pause (scroll-dwell)
 * @param {HTMLElement} scroller
 * @returns {() => void}
 */
export function initIntroDwellScroll(scroller) {
  const introRunway = document.querySelector('.scroll-intro');
  const stage = document.querySelector('.intro-dwell-stage');
  const actor = document.querySelector('#brand-intro-actor');
  const intro = document.querySelector('#brand-intro');
  if (!introRunway || !stage || !actor) {
    return () => {};
  }

  const stBase = scroller ? { scroller } : {};
  const triggers = [];

  gsap.set(actor, { y: '48vh', opacity: 0 });

  triggers.push(
    ScrollTrigger.create({
      ...stBase,
      trigger: introRunway,
      start: 'top bottom',
      end: 'bottom bottom',
      onEnter: () => stage.classList.add('is-active'),
      onLeaveBack: () => stage.classList.remove('is-active'),
    }),
  );

  const tween = gsap.to(actor, {
    y: 90,
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      ...stBase,
      trigger: introRunway,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 1.2,
      invalidateOnRefresh: true,
    },
  });

  if (intro) {
    triggers.push(
      ScrollTrigger.create({
        ...stBase,
        trigger: intro,
        start: 'top bottom',
        onEnter: () => intro.classList.add('is-revealed'),
        onLeaveBack: () => intro.classList.remove('is-revealed'),
      }),
    );
  }

  return () => {
    triggers.forEach((st) => st.kill());
    tween.scrollTrigger?.kill();
    tween.kill();
    stage.classList.remove('is-active');
    intro?.classList.remove('is-revealed');
  };
}

export { INTRO_COPY };
