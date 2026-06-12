/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-02',
  layout: 'gallery-first',
  sections: [
    {
      type: 'intro',
      paragraphs: [
        '这是一个预留的品牌视觉项目入口。后续可替换为真实案例的封面叙事与主视觉说明。',
      ],
    },
    {
      type: 'heading',
      text: '项目概述',
      level: 2,
    },
    {
      type: 'paragraph',
      text: '此处放置项目背景、品牌目标与你的角色说明。gallery-first 布局适合以大图开场、文字为辅的展示方式。',
    },
    {
      type: 'gallery',
      columns: 2,
      images: [
        { src: '/projects/project-02/placeholder-01.jpg', alt: 'Project 02 主视觉占位', caption: '主视觉占位' },
        { src: '/projects/project-02/placeholder-02.jpg', alt: 'Project 02 延展占位', caption: '延展物料占位' },
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      text: '配图请放入 public/projects/project-02/ 后更新 src 路径。',
    },
  ],
};
