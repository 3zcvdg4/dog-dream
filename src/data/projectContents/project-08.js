/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-08',
  layout: 'gallery-first',
  sections: [
    {
      type: 'heading',
      text: 'Campaign + Motion',
      level: 2,
    },
    {
      type: 'paragraph',
      text: '动态类项目可在此嵌入视频或 GIF 占位，当前先用静态图占位。',
    },
    {
      type: 'gallery',
      columns: 2,
      images: [
        { src: '/projects/project-08/frame-01.jpg', alt: '动效帧 1' },
        { src: '/projects/project-08/frame-02.jpg', alt: '动效帧 2' },
      ],
    },
  ],
};
