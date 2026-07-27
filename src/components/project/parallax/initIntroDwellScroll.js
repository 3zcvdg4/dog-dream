import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INTRO_COPY = {
  eyebrow: 'STONE STORY',
  title: '挖开矿石，遇见宝石',
  lead: [
    '儿童「挖掘寻宝」宝石科普玩具品牌。',
    '通过挖掘与探索，发现隐藏其中的宝石与自然奥秘，开启孩子的寻宝冒险。',
  ],
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
    y: 100,
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

  return () => {
    triggers.forEach((st) => st.kill());
    tween.scrollTrigger?.kill();
    tween.kill();
    stage.classList.remove('is-active');
  };
}

export { INTRO_COPY };
