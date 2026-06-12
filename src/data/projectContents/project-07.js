/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-07',
  layout: 'timeline-heavy',
  sections: [
    {
      type: 'intro',
      paragraphs: ['timeline-heavy 布局以时间线为主轴，适合有明确阶段推进的项目。'],
    },
    {
      type: 'timeline',
      items: [
        { date: 'Phase 1', phase: '调研', event: '用户与竞品分析', tool: '—' },
        { date: 'Phase 2', phase: '概念', event: '视觉方向确定', tool: '—' },
        { date: 'Phase 3', phase: '交付', event: '最终物料输出', tool: '—' },
      ],
    },
  ],
};
