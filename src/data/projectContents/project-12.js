/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-12',
  layout: 'timeline-heavy',
  sections: [
    {
      type: 'heading',
      text: 'Digital + Motion',
      level: 2,
    },
    {
      type: 'paragraph',
      text: '最后一个画框位占位。可按项目实际节奏选择 timeline-heavy 或 gallery-first。',
    },
    {
      type: 'timeline',
      items: [
        { date: 'TBD', phase: '概念', event: '待补充', tool: '—' },
        { date: 'TBD', phase: '制作', event: '待补充', tool: '—' },
        { date: 'TBD', phase: '发布', event: '待补充', tool: '—' },
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      text: '12 个项目内容包均已建立占位结构，可按 project-01 的方式逐个替换为真实内容。',
    },
  ],
};
