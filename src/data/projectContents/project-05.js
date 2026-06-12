/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-05',
  layout: 'gallery-first',
  sections: [
    {
      type: 'heading',
      text: 'Poster / Print',
      level: 2,
    },
    {
      type: 'paragraph',
      text: '海报与印刷类项目可优先展示成品图，再补充创作过程。',
    },
    {
      type: 'gallery',
      columns: 3,
      images: [
        { src: '/projects/project-05/poster-01.jpg', alt: '海报 1 占位' },
        { src: '/projects/project-05/poster-02.jpg', alt: '海报 2 占位' },
        { src: '/projects/project-05/poster-03.jpg', alt: '海报 3 占位' },
      ],
    },
  ],
};
