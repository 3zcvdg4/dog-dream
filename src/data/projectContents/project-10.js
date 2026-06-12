/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-10',
  layout: 'minimal-case',
  sections: [
    {
      type: 'quote',
      text: '展览类项目可用一句展览主题开场。',
    },
    {
      type: 'paragraph',
      text: '空间、导视、主视觉的简要说明占位。',
    },
    {
      type: 'gallery',
      columns: 1,
      images: [
        { src: '/projects/project-10/exhibition.jpg', alt: '展览主视觉占位' },
      ],
    },
  ],
};
