/** @type {import('./schema.js').ProjectContentModule} */
const placeholder = (id, alt, caption, aspect = 'landscape') => ({
  id,
  src: '',
  alt,
  caption,
  aspect,
});

export default {
  id: 'project-04',
  layout: 'project-04-seer',
  sections: [],
  hero: {
    typedTitleLines: ['SEER', '500'],
    subtitle: '智能芯片鞋的上市视觉与物料体系。',
    description: '从包装合规到电商、众筹与数字触点，搭建可落地、可迭代的全链路设计。',
    video: '/projects/project-04/hero-animation.mov?v=202607031144',
  },
  overview: {
    label: 'Overview',
    role: '品牌设计 / 视觉设计',
    paragraphs: [
      'SEER500 是一款智能鞋品牌项目。',
      '主要负责品牌视觉系统的建立与落地，覆盖官网、电商、包装及社交媒体等多个触点，构建统一的品牌体验。',
    ],
    visual: {
      id: 'overview-01',
      src: '/projects/project-04/vis.jpg?v=20260709150625',
      alt: 'SEER500 项目展示图',
      caption: '',
      aspect: 'wide',
    },
    scopeTags: [
      '品牌视觉设计',
      '包装设计',
      '官网设计',
      '电商设计',
      '社媒视觉设计',
      '上市视觉设计',
      '产品外观协作',
      '功能体验协作',
    ],
  },
  streams: [
    {
      id: 'seer-system',
      layout: 'sticky-tabs',
      theme: 'light',
      navLabel: '渠道视觉',
      label: 'Channels',
      lead: '从品牌系统，到真实的用户触点。',
      detail: '品牌视觉在 Kickstarter、电商、社交媒体等渠道中的统一应用。',
      heroVisual: {
        /* Frame: social-1.png (2584×1918). Screen insets live in global.css on .seer-sticky-tabs__device */
        src: '/projects/project-04/social/social-1.png?v=20260710100000',
        alt: 'SEER500 渠道视觉总览',
      },
      platformTabs: [
        {
          id: 'kickstarter',
          label: 'Kickstarter',
          image: '/projects/project-04/social/social-2.jpg?v=20260710140000',
          alt: 'SEER500 Kickstarter 视觉',
        },
        {
          id: 'jd',
          label: '京东',
          image: '/projects/project-04/social/social-3.jpg?v=20260710140000',
          alt: 'SEER500 京东视觉',
        },
        {
          id: 'douyin',
          label: '抖音',
          image: '/projects/project-04/social/social-4.jpg?v=20260710140000',
          alt: 'SEER500 抖音视觉',
        },
        {
          id: 'xiaohongshu',
          label: '小红书',
          image: '/projects/project-04/social/social-5.jpg?v=20260710140000',
          alt: 'SEER500 小红书视觉',
        },
        {
          id: 'bilibili',
          label: 'bilibili',
          image: '/projects/project-04/social/social-6.jpg?v=20260710140000',
          alt: 'SEER500 bilibili 视觉',
        },
      ],
    },
    {
      id: 'seer-channels',
      layout: 'horizontal-pin',
      theme: 'dark',
      navLabel: '品牌落地',
      label: 'Campaign',
      lead: '从一致的品牌语言，到每一次品牌传播。',
      detail: '围绕产品发布、营销活动与品牌传播，设计系列主视觉、广告海报及推广素材。',
      visuals: Array.from({ length: 14 }, (_, index) => {
        const number = index + 1;
        return {
          id: `poster-${number}`,
          src: `/projects/project-04/posters/${number}.jpg`,
          alt: `SEER500 海报 ${number}`,
          aspect: 'tall',
        };
      }),
    },
    {
      id: 'seer-experience',
      layout: 'split',
      theme: 'light',
      navLabel: '体验延伸',
      label: 'Packaging',
      lead: '品牌体验，从屏幕延伸到产品。',
      detail: '将品牌规范应用于包装、说明书、标签及品牌物料，让每一次接触都保持一致的品牌表达。',
      visuals: [
        placeholder('digital-01', 'Desktop', 'Desktop', 'wide'),
        placeholder('digital-02', 'App 开屏', 'App', 'portrait'),
        placeholder('digital-03', '公众号', '公众号', 'square'),
        placeholder('digital-04', '其它数字触点', 'Touchpoints', 'landscape'),
      ],
    },
  ],
  stories: {
    label: 'Behind the Work',
    title: 'Making Everything Work Together',
    intro: '真正困难的不是完成一份设计，而是让包装、详情页、众筹页面以及数字触点，在不同平台、不同团队之间保持一致。',
    topics: [
      '包装规范调整',
      '字体系统统一',
      '多平台视觉适配',
      '众筹页面信息重组',
    ],
    entries: [
      {
        title: '[待填写，例如：包装规范调整]',
        summary: '选择一个最有代表性的设计故事即可。这一张卡用来承接项目中的关键设计判断。',
        items: [
          { label: '发生了什么', value: '[待填写]' },
          { label: '约束是什么', value: '[待填写]' },
          { label: '我怎么调整', value: '[待填写]' },
          { label: '最后结果', value: '[待填写]' },
        ],
        visuals: [
          placeholder('story-01', '调整前', 'Before', 'landscape'),
          placeholder('story-02', '调整后', 'After', 'landscape'),
        ],
      },
    ],
  },
  closing: {
    label: 'End',
    title: 'One Product. One Visual System.',
    paragraphs: [
      'Seer 500 最终完成的不只是包装、电商或众筹页面。',
      '而是一套能够覆盖产品上市全过程的品牌视觉体系。',
      '这也是整个项目最重要的设计价值。',
    ],
    visual: placeholder('closing-01', 'SEER 500 品牌图形', 'Brand Mark', 'square'),
    tags: ['One Product', 'One Visual System', 'Launch System'],
  },
};
