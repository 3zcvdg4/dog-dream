const SECTIONS_BASE = '/projects/project-03/sections';

const SECTIONS = [
  {
    id: 'brand-intro',
    className: 'page-section--intro',
    label: null,
    title: '挖开矿石，遇见宝石',
    lead: '儿童「挖掘寻宝」宝石科普玩具品牌——把动手能力、宝石认知与科普知识，做成一套可玩的玩具体验。',
    images: null,
  },
  {
    id: 'brand-logo',
    className: 'page-section--logo',
    label: '01 · Logo',
    title: '品牌标识',
    lead: '以宝石与探索为意象，建立清晰、亲切、适合儿童产品的品牌识别。',
    images: [{ src: `${SECTIONS_BASE}/logo.png`, alt: 'FINDING STONE 品牌 Logo', className: 'page-media--logo' }],
  },
  {
    id: 'brand-packaging',
    className: 'page-section--packaging',
    label: '02 · Packaging',
    title: '产品包装',
    lead: '从袋装到展开结构，包装承载玩法说明与宝石科普的第一印象。',
    images: [
      { src: `${SECTIONS_BASE}/packaging-01.jpg`, alt: '淘石袋包装正面 1' },
      { src: `${SECTIONS_BASE}/packaging-02.jpg`, alt: '淘石袋包装正面 2' },
      { src: `${SECTIONS_BASE}/packaging-03.jpg`, alt: '淘石袋包装正面 3' },
      { src: `${SECTIONS_BASE}/packaging-unfold-01.jpg`, alt: '包装展开结构' },
    ],
    grid: 'page-grid--packaging',
  },
  {
    id: 'brand-comic',
    className: 'page-section--comic',
    label: '03 · Comic',
    title: '漫画叙事',
    lead: '用连续画面讲述挖掘、发现与认识宝石的过程，让科普内容更有故事感。',
    images: [
      { src: `${SECTIONS_BASE}/comic-01.jpg`, alt: '漫画分镜 1' },
      { src: `${SECTIONS_BASE}/comic-02.jpg`, alt: '漫画分镜 2' },
      { src: `${SECTIONS_BASE}/comic-03.jpg`, alt: '漫画分镜 3' },
      { src: `${SECTIONS_BASE}/comic-04.jpg`, alt: '漫画分镜 4' },
      { src: `${SECTIONS_BASE}/comic-05.jpg`, alt: '漫画分镜 5' },
      { src: `${SECTIONS_BASE}/comic-06.jpg`, alt: '漫画分镜 6' },
    ],
    grid: 'page-grid--comic',
  },
  {
    id: 'brand-poster',
    className: 'page-section--poster',
    label: '04 · Poster',
    title: '海报与物料',
    lead: '横幅、宣传单与三折页等线下传播物料，延展品牌视觉到更多触点。',
    images: [
      { src: `${SECTIONS_BASE}/poster-banner.jpg`, alt: '品牌横幅', className: 'page-media--wide' },
      { src: `${SECTIONS_BASE}/poster-flyer-01.jpg`, alt: '宣传单' },
      { src: `${SECTIONS_BASE}/poster-trifold-01.jpg`, alt: '三折页 1' },
      { src: `${SECTIONS_BASE}/poster-trifold-02.jpg`, alt: '三折页 2' },
    ],
    grid: 'page-grid--poster',
  },
  {
    id: 'brand-storefront',
    className: 'page-section--storefront',
    label: '05 · Storefront',
    title: '门头空间',
    lead: '门店门头将品牌世界观落到真实空间，形成完整的线下体验入口。',
    images: [
      { src: `${SECTIONS_BASE}/storefront-final.png`, alt: '门头终稿', className: 'page-media--wide' },
      { src: `${SECTIONS_BASE}/storefront-alt.png`, alt: '门头方案参考' },
    ],
    grid: 'page-grid--storefront',
  },
];

function SectionImages({ images, grid }) {
  if (!images?.length) return null;

  return (
    <div className={`page-grid${grid ? ` ${grid}` : ''}`}>
      {images.map((image) => (
        <figure
          key={image.src}
          className={`page-media${image.className ? ` ${image.className}` : ''}`}
        >
          <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
        </figure>
      ))}
    </div>
  );
}

export default function ParallaxScrollSections() {
  return (
    <div className="page-scroll">
      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={`page-section ${section.className}`}
          aria-label={section.label ?? '项目介绍'}
        >
          <div className="page-section__inner">
            {section.label ? (
              <header className="page-section__head">
                <p className="page-section__label">{section.label}</p>
                <h2 className="page-section__title">{section.title}</h2>
                <p className="page-section__lead">{section.lead}</p>
              </header>
            ) : (
              <header className="page-section__head page-section__head--intro">
                <p className="page-section__eyebrow">FINDING STONE</p>
                <h2 className="page-section__title">{section.title}</h2>
                <p className="page-section__lead">{section.lead}</p>
              </header>
            )}
            <SectionImages images={section.images} grid={section.grid} />
          </div>
        </section>
      ))}
    </div>
  );
}
