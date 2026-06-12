/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-04',
  layout: 'split-story',
  sections: [
    {
      type: 'intro',
      paragraphs: ['split-story 布局适合「概念 / 执行」交替叙述，左右视觉节奏会有变化。'],
    },
    { type: 'divider' },
    {
      type: 'subheading',
      text: '设计思路',
    },
    {
      type: 'paragraph',
      text: '在此描述品牌识别系统的核心概念、字体与色彩方向。',
    },
    {
      type: 'subheading',
      text: '执行细节',
    },
    {
      type: 'bulletList',
      items: [
        '标志系统与规范',
        '应用物料延展',
        '动态识别（如有）',
      ],
    },
  ],
};
