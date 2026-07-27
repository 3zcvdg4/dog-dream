import ParallaxRolePanel from './ParallaxRolePanel.jsx';
import CircularGallery from './CircularGallery.jsx';
import PackagingPlay from './PackagingPlay.jsx';
import ComicFlipBook from './ComicFlipBook.jsx';

const SECTIONS_BASE = '/projects/project-03/sections';
const GEMS_BASE = '/projects/project-03/gems';

const GEM_DATA = [
  {
    alt: '日光石',
    title: '阳光小石头',
    english: 'SUNSTONE FRAGMENT',
    lines: ['内藏金色矿物颗粒', '当光线转动时，', '会呈现太阳般闪耀的光泽。'],
    rarity: 3,
    color: '金黄色',
    trait: '闪光效应',
  },
  {
    alt: '月光石',
    title: '温柔月亮石',
    english: 'MOONSTONE GLOW',
    lines: ['蓝白柔光在内部轻轻游走', '像把一夜月光', '悄悄封进了石头里。'],
    rarity: 4,
    color: '蓝白色',
    trait: '月光效应',
  },
  {
    alt: '红玛瑙',
    title: '热情小红玛',
    english: 'RED AGATE',
    lines: ['鲜艳红纹层层叠起', '像一颗被暖阳染过的', '小小红色玛瑙果。'],
    rarity: 3,
    color: '鲜红色',
    trait: '层状红纹',
  },
  {
    alt: '琥珀',
    title: '时光小胶囊',
    english: 'AMBER CAPSULE',
    lines: ['远古树脂历经千万年', '有时里面还睡着', '小小的古代虫儿。'],
    rarity: 4,
    color: '蜜琥珀色',
    trait: '古生物包裹',
  },
  {
    alt: '白松石',
    title: '蓝绿小网纹',
    english: 'TURQUOISE VEINS',
    lines: ['蓝绿色底上绕着咖啡网线', '像小动物轻轻踩过', '留下的神秘足迹。'],
    rarity: 3,
    color: '蓝绿色',
    trait: '铁线网纹',
  },
  {
    alt: '白水晶2',
    title: '清水小水晶',
    english: 'CLEAR QUARTZ',
    lines: ['干净得像凝固的清水', '拿手电一照', '整颗都亮晶晶透亮。'],
    rarity: 2,
    color: '无色透明',
    trait: '高通透度',
  },
  {
    alt: '白玉',
    title: '温润小白玉',
    english: 'WHITE JADE',
    lines: ['摸上去滑滑润润', '在故事里象征纯洁', '像藏着弯弯的微笑。'],
    rarity: 4,
    color: '乳白玉色',
    trait: '细腻温润',
  },
  {
    alt: '白玉髓',
    title: '牛奶糖玉髓',
    english: 'WHITE CHALCEDONY',
    lines: ['像一块软软的牛奶糖', '有时还能看见', '淡淡柔和的小条纹。'],
    rarity: 2,
    color: '乳白色',
    trait: '半透明质感',
  },
  {
    alt: '白玛瑙',
    title: '云朵小玛瑙',
    english: 'WHITE AGATE',
    lines: ['白白嫩嫩层层叠叠', '像一小块云朵蛋糕', '是认识玛瑙的好伙伴。'],
    rarity: 2,
    color: '乳白层纹',
    trait: '柔和条带',
  },
  {
    alt: '硅化木',
    title: '化石小木头',
    english: 'PETRIFIED WOOD',
    lines: ['曾经是真正的树木', '被石头慢慢换掉后', '木纹却还清晰可辨。'],
    rarity: 4,
    color: '木纹棕绿',
    trait: '石化木纹',
  },
  {
    alt: '粉晶',
    title: '草莓牛奶晶',
    english: 'ROSE QUARTZ',
    lines: ['粉粉嫩嫩像草莓牛奶', '温柔又明亮', '小朋友们超喜欢。'],
    rarity: 3,
    color: '淡粉色',
    trait: '柔光粉色',
  },
  {
    alt: '紫晶',
    title: '梦幻紫水晶',
    english: 'AMETHYST CRYSTAL',
    lines: ['对着光轻轻一转', '深浅紫色光带', '一层叠一层超梦幻。'],
    rarity: 4,
    color: '紫水晶色',
    trait: '紫色光带',
  },
  {
    alt: '红玉髓',
    title: '甜甜红糖石',
    english: 'CARNELIAN DROP',
    lines: ['橘红圆润亮亮的', '抛光后像一颗', '想咬一口的红糖。'],
    rarity: 3,
    color: '橘红色',
    trait: '温润高光',
  },
  {
    alt: '绿萤石',
    title: '荧光小派对',
    english: 'GREEN FLUORITE',
    lines: ['平常看着翠翠的', '黑光灯一照', '就会偷偷开始发光。'],
    rarity: 3,
    color: '翠绿色',
    trait: '紫外荧光',
  },
  {
    alt: '缠丝玛瑙',
    title: '丝线小玛瑙',
    english: 'BANDED AGATE',
    lines: ['一圈圈像缠紧的丝线', '每一层都是大自然', '慢慢画下的故事。'],
    rarity: 3,
    color: '多层条纹',
    trait: '同心环带',
  },
  {
    alt: '茶水晶',
    title: '茶香小水晶',
    english: 'SMOKY QUARTZ',
    lines: ['淡淡茶色清清亮亮', '像被暖暖茶香', '轻轻染过的清水。'],
    rarity: 2,
    color: '茶褐色',
    trait: '烟晶通透',
  },
  {
    alt: '葡萄石',
    title: '迷你小葡萄',
    english: 'PREHNITE CLUSTER',
    lines: ['淡绿小球球抱成一团', '真的像一串', '刚摘下的迷你葡萄。'],
    rarity: 3,
    color: '淡绿色',
    trait: '葡萄状集合',
  },
  {
    alt: '贵翠',
    title: '贵州小青翠',
    english: 'GUIZHOU JADE',
    lines: ['颜色清新像春日嫩芽', '来自贵州的', '有名绿玉髓朋友。'],
    rarity: 3,
    color: '嫩芽绿',
    trait: '地域特色',
  },
  {
    alt: '青金石',
    title: '星空小深蓝',
    english: 'LAPIS LAZULI',
    lines: ['深蓝底上洒着金星点', '古代人把它当作', '送给远方的大宝贝。'],
    rarity: 5,
    color: '深蓝镶金',
    trait: '金色黄铁矿',
  },
  {
    alt: '鸡血石',
    title: '超精神红石',
    english: 'CHICKEN-BLOOD STONE',
    lines: ['鲜红一抹特别亮眼', '像颜料泼在玉石上', '一眼就忘不掉。'],
    rarity: 5,
    color: '鲜红底色',
    trait: '辰砂血色',
  },
  {
    alt: '黄水晶',
    title: '蜂蜜阳光瓶',
    english: 'CITRINE SUN',
    lines: ['金黄金黄透透亮亮', '像把蜂蜜和阳光', '一起装进了瓶子里。'],
    rarity: 3,
    color: '金黄色',
    trait: '阳光通透',
  },
  {
    alt: '黑曜岩',
    title: '火山小玻璃',
    english: 'BLACK OBSIDIAN',
    lines: ['火山喷发后急速冷却', '摸着凉凉的', '断面亮得像贝壳。'],
    rarity: 2,
    color: '深黑色',
    trait: '天然火山玻璃',
  },
  {
    alt: '黑玛瑙',
    title: '黑珍珠玛瑙',
    english: 'BLACK ONYX',
    lines: ['黑黑亮亮又滑又沉', '抛光后像一颗', '小小的黑珍珠。'],
    rarity: 2,
    color: '墨黑色',
    trait: '致密光泽',
  },
];


const PACKAGING_PACKS = [
  { src: `${SECTIONS_BASE}/pack-choice-01.png`, alt: '神秘探险' },
  { src: `${SECTIONS_BASE}/pack-choice-02.png`, alt: '神秘寻宝' },
  { src: `${SECTIONS_BASE}/pack-choice-03.png`, alt: '神秘考古' },
];

const PACKAGING_GEMS = GEM_DATA.map((gem, index) => ({
  src: `${GEMS_BASE}/gem-${String(index + 1).padStart(2, '0')}.png`,
  alt: gem.alt,
  title: gem.title,
  english: gem.english,
  rarity: gem.rarity,
  color: gem.color,
  trait: gem.trait,
}));

const LOGO_GALLERY_ITEMS = GEM_DATA.map((gem, index) => ({
  image: `${GEMS_BASE}/gem-${String(index + 1).padStart(2, '0')}.png`,
  text: gem.alt,
  title: gem.title,
  english: gem.english,
  lines: gem.lines,
  rarity: gem.rarity,
  color: gem.color,
  trait: gem.trait,
  no: index + 1,
}));

const SECTIONS = [
  {
    id: 'brand-packaging',
    className: 'page-section--packaging',
    label: '01 · Opening',
    title: '开启探索',
    lead: '从选择包装开始，亲手敲开属于自己的第一颗宝石。',
    layout: 'packaging-play',
    packs: PACKAGING_PACKS,
    gems: PACKAGING_GEMS,
  },
  {
    id: 'brand-logo',
    className: 'page-section--logo',
    label: '02 · Discovery',
    title: '宝石图鉴',
    lead: '探索 23 种天然宝石，了解它们的形成与特征。',
    gallery: 'circular',
  },
  {
    id: 'brand-comic',
    className: 'page-section--comic',
    label: '03 · Brand Story',
    title: '品牌世界',
    lead: '漫画、IP 与视觉传播，共同构建完整的品牌体验。',
    layout: 'campaign',
    comic: {
      subtitle: '漫画翻阅',
      note: '拖拽书页，跟随石头一起开启探索故事。',
      images: Array.from({ length: 25 }, (_, index) => {
        const no = index + 1;
        return {
          src: `${SECTIONS_BASE}/comic-${String(no).padStart(2, '0')}.png`,
          alt: `漫画分镜 ${no}`,
        };
      }),
    },
    galleryImages: {
      subtitle: '表情包与海报',
      note: '周边图面延展品牌表情与线下视觉物料。',
      images: [
        { src: `${SECTIONS_BASE}/campaign-sticker-01.png`, alt: '表情包 1' },
        { src: `${SECTIONS_BASE}/campaign-sticker-02.png`, alt: '表情包 2' },
        { src: `${SECTIONS_BASE}/campaign-poster-01.png`, alt: '海报 1' },
        { src: `${SECTIONS_BASE}/campaign-poster-02.png`, alt: '海报 2' },
      ],
      grid: 'page-grid--campaign',
    },
  },
  {
    id: 'brand-poster',
    className: 'page-section--poster',
    label: '04 · Space',
    title: '空间延展',
    lead: '将品牌语言延伸到线下空间，打造沉浸式体验。',
    layout: 'space',
    space: {
      images: [
        {
          src: `${SECTIONS_BASE}/space-01.png`,
          alt: '空间延展主图',
          slot: 'top',
        },
        {
          src: `${SECTIONS_BASE}/space-02.png`,
          alt: '矿石收藏展示',
          slot: 'left',
          tag: {
            label: 'MINERAL DISPLAY',
            title: '矿石收藏展示',
          },
        },
        {
          src: `${SECTIONS_BASE}/space-03.png`,
          alt: '生命演化时间轴',
          slot: 'right',
          tag: {
            label: 'EVOLUTION TIMELINE',
            title: '生命演化时间轴',
          },
        },
      ],
      keywords: ['Natural', 'Discovery', 'Experience'],
    },
  },
];

function SpaceExperience({ space }) {
  if (!space?.images?.length) return null;

  const bySlot = Object.fromEntries(
    space.images.map((image) => [image.slot, image]),
  );
  const top = bySlot.top;
  const left = bySlot.left;
  const right = bySlot.right;

  return (
    <div className="space-experience">
      <div className="space-experience__pin">
        {top ? (
          <figure className="space-experience__cell space-experience__cell--top">
            <img
              className="space-experience__img"
              src={top.src}
              alt={top.alt ?? ''}
              loading="lazy"
              decoding="async"
            />
          </figure>
        ) : null}

        <div className="space-experience__row">
          {[left, right].filter(Boolean).map((item) => (
            <figure
              key={item.slot}
              className={`space-experience__cell space-experience__cell--${item.slot}${
                item.src ? '' : ' is-empty'
              }`}
            >
              {item.src ? (
                <img
                  className="space-experience__img"
                  src={item.src}
                  alt={item.alt ?? ''}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="space-experience__placeholder" aria-hidden="true" />
              )}
              {item.tag ? (
                <div className="space-experience__tag">
                  <span>{item.tag.label}</span>
                  <h3>{item.tag.title}</h3>
                </div>
              ) : null}
            </figure>
          ))}
        </div>
      </div>

      {space.keywords?.length ? (
        <div className="space-experience__keywords">
          {space.keywords.map((word) => (
            <span key={word} className="space-experience__keyword">
              {word}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

function CampaignBlocks({ comic, galleryImages }) {
  return (
    <div className="campaign-blocks">
      {comic ? (
        <div className="campaign-block campaign-block--comic">
          <header className="campaign-block__head">
            <h3 className="campaign-block__subtitle">{comic.subtitle}</h3>
            {comic.note ? <p className="campaign-block__note">{comic.note}</p> : null}
          </header>
          <ComicFlipBook images={comic.images} />
        </div>
      ) : null}

      {galleryImages?.images?.length ? (
        <div className="campaign-block campaign-block--gallery">
          <header className="campaign-block__head">
            <h3 className="campaign-block__subtitle">{galleryImages.subtitle}</h3>
            {galleryImages.note ? (
              <p className="campaign-block__note">{galleryImages.note}</p>
            ) : null}
          </header>
          <SectionImages images={galleryImages.images} grid={galleryImages.grid} />
        </div>
      ) : null}
    </div>
  );
}

function StoneClosingSection({ project, onBackToCorridor }) {
  const brand = project?.brand ?? project?.title ?? 'FINDING STONE';

  return (
    <section className="page-section page-section--closing" aria-label="项目结语">
      <div className="stone-closing">
        <div className="stone-closing__glow" aria-hidden="true" />
        <div className="stone-closing__panel">
          <p className="stone-closing__label">CLOSING</p>
          <p className="stone-closing__brand">{brand}</p>
          <h2 className="stone-closing__title">挖开矿石，遇见宝石</h2>
          <p className="stone-closing__desc">
            从包装体验到探索科普，
            <br />
            再到品牌传播与空间触点，
            <br />
            完成石头总动员的品牌体验构建。
          </p>
          <div className="stone-closing__system" aria-label="项目系统范围">
            <span className="stone-closing__item">Packaging</span>
            <span className="stone-closing__item">Discovery</span>
            <span className="stone-closing__item">Campaign</span>
            <span className="stone-closing__item">Spatial</span>
          </div>
        </div>

        {onBackToCorridor ? (
          <button
            className="stone-closing__back"
            type="button"
            onClick={onBackToCorridor}
          >
            <span className="stone-closing__back-arrow" aria-hidden="true">←</span>
            <span className="stone-closing__back-label">回到走廊</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SectionGallery({ type }) {
  if (type === 'circular') {
    return (
      <div className="parallax-circular-gallery">
        <CircularGallery
          items={LOGO_GALLERY_ITEMS}
          bend={8}
          borderRadius={0}
          itemScale={0.36}
          itemGap={0.85}
          verticalOffset={2.95}
          centerScaleBoost={0.38}
          scrollSpeed={2}
          scrollEase={0.08}
        />
      </div>
    );
  }

  return null;
}

export default function ParallaxScrollSections({ project, onBackToCorridor }) {
  return (
    <div className="page-scroll">
      <section
        id="project-role"
        className="page-section page-section--role"
        aria-label="项目角色与职责"
      >
        <div className="page-section__inner page-section__inner--role parallax-content-rail">
          <ParallaxRolePanel
            brand={project?.brand ?? project?.title}
            role={project?.role}
            services={project?.services}
          />
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={`page-section ${section.className}`}
          aria-label={section.label ?? section.title}
        >
          <div
            className={`page-section__inner${
              section.gallery === 'circular'
                ? ' page-section__inner--circular'
                : ' parallax-content-rail'
            }`}
          >
            <header
              className={`page-section__head${
                section.gallery === 'circular' ? ' parallax-content-rail' : ''
              }`}
            >
              <p className="page-section__label">{section.label}</p>
              <h2 className="page-section__title">{section.title}</h2>
              <p className="page-section__lead">{section.lead}</p>
            </header>
            {section.gallery ? (
              <SectionGallery type={section.gallery} />
            ) : section.layout === 'packaging-play' ? (
              <PackagingPlay packs={section.packs} gems={section.gems} />
            ) : section.layout === 'campaign' ? (
              <CampaignBlocks comic={section.comic} galleryImages={section.galleryImages} />
            ) : section.layout === 'space' ? (
              <SpaceExperience space={section.space} />
            ) : (
              <SectionImages images={section.images} grid={section.grid} />
            )}
          </div>
        </section>
      ))}

      <StoneClosingSection project={project} onBackToCorridor={onBackToCorridor} />
    </div>
  );
}
