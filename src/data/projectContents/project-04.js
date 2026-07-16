/** @type {import('./schema.js').ProjectContentModule} */

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
    navLabel: 'Overview',
    label: 'Overview',
    role: '品牌设计 / 视觉设计',
    paragraphs: [
      'Seer 500 是一个围绕产品上市展开的品牌视觉项目。',
      '我主要负责品牌视觉系统的建立与落地，覆盖渠道页面、传播视觉、包装物料以及数字触点，让不同阶段出现的内容都能保持统一表达。',
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
      navLabel: 'Touchpoints',
      label: 'Touchpoints',
      lead: '同一套品牌语言，需要进入不同的平台和传播入口。',
      detail: 'Kickstarter、京东、抖音、小红书和 bilibili 拥有不同的内容结构，但它们都需要在第一眼建立一致的品牌识别。',
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
      navLabel: 'Campaign',
      label: 'Campaign',
      lead: '围绕产品发布、营销活动与品牌传播，品牌语言被延展\n为系列主视觉、海报和推广素材。',
      detail: '这一部分展示的不是单张画面，而是品牌如何在不同传播场景中保持连续而统一的表达。',
      visuals: [1, 2, 4, 5, 8, 9, 10, 12, 13].map((number) => {
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
      layout: 'packaging',
      theme: 'light',
      navLabel: 'Packaging System',
      label: 'Packaging System',
      lead: '品牌体验并不止于屏幕，也会落到用户真正接触到的产品物料上。',
      detail: '从外盒、手提袋到刀模、标签与合规物料，这一部分关注的是如何把品牌语言转化为一套可执行、可量产的包装体系。',
      packagingItems: [
        {
          id: 'packaging-overview',
          tab: '合集',
          title: '包装',
          type: '体系总览',
          intro:
            '从外盒、防尘袋、说明书到标签与合格证，完整呈现 SEER500 上市包装体系，覆盖开箱体验、合规标识与数字触点。',
          previewTitle: '包装物料合集',
          previewHint: '上市包装物料总览',
          image: '/projects/project-04/packaging/Packaging-1.png?v=20260711170500',
          alt: 'SEER500 包装物料合集',
          info: [
            {
              label: '系统构成',
              value: '围绕外盒、手提袋、说明书、标签与合规物料，建立完整的产品包装接触体系。',
            },
            {
              label: '体验目标',
              value: '从第一眼识别到开箱触达，让品牌语言在不同物料之间保持统一且连续的体验感受。',
            },
            {
              label: '落地范围',
              value: '覆盖零售出货、渠道陈列与售后交付场景，满足品牌表达与量产执行的双重需求。',
            },
          ],
        },
        {
          id: 'outer-box',
          tab: '外盒',
          title: '外盒',
          type: '效果图',
          intro: '作为 Seer500 包装体系的核心载体，延续品牌视觉语言，强化产品识别度与品牌一致性。',
          previewTitle: '外盒效果图',
          previewHint: '包装盒效果图',
          image: '/projects/project-04/packaging/Packaging-2.png?v=20260711170500',
          alt: 'SEER500 外盒包装效果图',
          info: [
            {
              label: '设计定位',
              value: '作为 Seer500 包装体系的核心载体，延续品牌视觉语言，强化产品识别度与品牌一致性。',
            },
            {
              label: '设计亮点',
              value: '创新采用联动式升降结构，开启包装时，两侧织带同步带动内托上升，让产品自然呈现于用户视线，提升开箱仪式感与交互体验。',
            },
            {
              label: '制作工艺',
              value: '硬质纸盒 CMYK 印刷 + 局部 UV 已完成量产',
            },
          ],
        },
        {
          id: 'box-die-line',
          tab: '盒刀模',
          title: '外盒',
          type: '刀模',
          intro: '围绕联动式升降机构进行结构展开，精确规划折叠、粘贴及连接位置，确保开启动作顺畅稳定，实现内托同步提升效果。',
          previewTitle: '外盒刀模',
          previewHint: '包装盒刀模展开图',
          image: '/projects/project-04/packaging/Packaging-2-1.png?v=20260711170500',
          alt: 'SEER500 外盒刀模',
          info: [
            {
              label: '结构设计',
              value: '围绕联动式升降机构进行结构展开，精确规划折叠、粘贴及连接位置，确保开启动作顺畅稳定，实现内托同步提升效果。',
            },
            {
              label: '工程规范',
              value: '统一折线、模切线、出血及安全边距，满足印刷、模切与后道加工要求，确保包装结构能够稳定量产。',
            },
            {
              label: '生产交付',
              value: '输出符合印前生产标准的刀模文件，覆盖印刷、模切及装配工艺需求，保证设计方案准确落地。',
            },
          ],
        },
        {
          id: 'paper-bag',
          tab: '手提袋',
          title: '手提袋',
          type: '效果图',
          intro: '作为包装体系的延伸载体，将品牌视觉从产品外盒扩展到线下携带场景，增强识别度与整体感。',
          previewTitle: '品牌手提袋',
          previewHint: '包装袋效果图',
          image: '/projects/project-04/packaging/Packaging-3.png?v=20260711170500',
          alt: 'SEER500 品牌手提袋',
          info: [
            {
              label: '设计定位',
              value: '作为包装体系的延伸载体，将品牌视觉从产品外盒扩展到线下携带场景，增强识别度与整体感。',
            },
            {
              label: '视觉策略',
              value: '延续标准色与核心图形语言，通过简洁版式与大面积留白，保持轻量但统一的品牌呈现。',
            },
            {
              label: '制作工艺',
              value: '铜版纸手提袋 CMYK 印刷 织带提手 已量产',
            },
          ],
        },
        {
          id: 'bag-die-line',
          tab: '袋刀模',
          title: '手提袋',
          type: '刀模',
          intro: '围绕袋身展开、提手孔位与折边关系完成刀模设计，确保视觉方案与成型结构准确匹配。',
          previewTitle: '手提袋刀模',
          previewHint: '包装袋刀模展开图',
          image: '/projects/project-04/packaging/Packaging-3-1.png?v=20260711170500',
          alt: 'SEER500 手提袋刀模',
          info: [
            {
              label: '工程结构',
              value: '围绕袋身展开、提手孔位与折边关系完成刀模设计，确保视觉方案与成型结构准确匹配。',
            },
            {
              label: '工艺控制',
              value: '统一出血、安全边距、折线与提手位规范，降低后期加工偏差，保证成品稳定性与承重表现。',
            },
            {
              label: '生产交付',
              value: '刀模文件按印刷与后道加工标准整理，可直接用于印前制作、模切成型与批量生产管理。',
            },
          ],
        },
        {
          id: 'compliance-tags',
          tab: '合规标签',
          title: '合规标签',
          type: '效果图',
          intro:
            '将合格证、三包卡与挂绳整合为统一的品牌附属物料，在满足合规要求的同时提升终端识别与细节质感。',
          previewTitle: '合规标签',
          previewHint: '合格证、三包卡与挂绳',
          image: '/projects/project-04/packaging/Packaging-4.png?v=20260711170500',
          alt: 'SEER500 合格证、三包卡与挂绳',
          info: [
            {
              label: '设计定位',
              value: '将合格证、三包卡与挂绳整合为统一的品牌附属物料，在满足合规要求的同时提升终端识别与细节质感。',
            },
            {
              label: '视觉策略',
              value: '延续品牌标准色与标识系统，在小尺寸物料上保持清晰识别，并通过材质与配件细节增强完成度。',
            },
            {
              label: '制作工艺',
              value: '卡证 CMYK 印刷 挂绳织带 + 五金扣件 已量产',
            },
          ],
        },
      ],
    },
  ],
  stories: null,
  closing: {
    navLabel: 'Closing',
    label: 'CLOSING',
    chapterNumber: '06',
    sideText: 'SEER 500 / BRAND EXPERIENCE',
    title: 'SEER 500',
    descriptionLines: [
      '从品牌识别到用户触点，',
      '完成 Seer 500 的视觉体验构建。',
    ],
    brand: 'EVERY EFFORT',
    systemItems: [
      'Brand Identity',
      'Digital Experience',
      'Marketing Campaign',
      'Packaging System',
    ],
    backLabel: '回到走廊',
  },
};
