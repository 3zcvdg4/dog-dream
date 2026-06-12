/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-03',
  layout: 'minimal-case',
  sections: [
    {
      type: 'heading',
      text: 'Campaign 案例',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'minimal-case 布局适合单点案例：一句核心概念 + 少量关键视觉 + 简短说明。',
    },
    {
      type: 'quote',
      text: '在此处写一句最能代表项目气质的话。',
    },
    {
      type: 'gallery',
      columns: 1,
      images: [
        { src: '/projects/project-03/hero.jpg', alt: 'Project 03 主图占位' },
      ],
    },
  ],
};
