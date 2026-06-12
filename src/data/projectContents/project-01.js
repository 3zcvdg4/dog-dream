import project01Theme from './project-01-theme.js';

/** @type {import('./schema.js').ProjectContentModule} */
export default {
  id: 'project-01',
  layout: 'project-01-editorial',
  theme: project01Theme,
  sections: [
    {
      type: 'intro',
      id: 'opening',
      paragraphs: [
        '这个网站最开始不是一套完整结构，而是一幅很模糊的画面：一只睡着的狗、一个梦泡、一条安静向前延伸的走廊。它更像一段凌晨时分的情绪，一次关于个人表达的尝试。',
        '所以《Dogdream》我不想把它写成普通案例页，而是写成一篇可以慢慢读的特稿。它既记录这个网站如何搭建，也记录我在 AI、代码、视觉和叙事之间反复试错的过程。',
        '下面的五个章节，分别对应这个网站真正成形的五个阶段。每一段都保留两面：一面是我当时的感受与判断，一面是实际的制作记录。',
      ],
    },
    {
      type: 'stageToggle',
      id: 'stage-beginning',
      title: '开始',
      subtitle: '从想法到动手',
      tabs: [
        {
          id: 'narrative',
          label: '叙事',
          intro: ['让工具能工作这件事，', '本身就成了工作。'],
          paragraphs: [
            '我是一名设计师，工作原因经常需要找设计素材，自然而然的会浏览其他设计师、艺术家或者独立开发者的个人网站。',
            '有些网站做得很好，他们整体的交互、排版、动画、风格，会让你觉得「这个人真厉害」。',
            '看到优秀的网站，也会有要不要做一个自己的个人网站的念头。不过因为不会写代码，当时积累的作品也还不多，又不想做一个很普通的个人网站，就总有理由把这个想法搁置着。',
            '后来 AI 工具慢慢兴起，像 GPT、Midjourney，也算比较早一批尝试的用户。平时会用来做图、写文案、生成视频。但使用这些工具一直是分散的，没有真正连成一条完整的创作流程。',
            '我就一个感受：这些工具是可以串起来的，但我当时做不到。主要困难的地方就是在代码上。所以「做一个自己的网站」这个想法时不时冒一下，但一直没有真正开始。',
            '后来朋友推荐了WorkBuddy，让我第一次接触和了解到Agent工具和vibecoding强大的功能性与便捷性之后，才正式开始动手做这个网站。',
            '最开始其实没想「要做成什么样」，更多是想试试这个工具能不能把想法跑起来。WorkBuddy 很快给我出了一个简单的雏形。看到它真的能跑起来的时候，虽然很简陋，不过很多以前在我这儿是「做不了」的，现在突然变成了「可以先出来一个版本了」——我有点惊讶，和兴奋。',
            '但这个状态没有持续两天。WorkBuddy 版本更新之后开始变得不太稳定，速度变慢，生成经常出问题，整个流程开始反复。于是只能去寻找更合适的工具。WorkBuddy、VS Code、Cursor、Codex 都用过一段时间，每个都在一段时间里是适用的，可都不算稳定。因为有很多现实的问题，比如 API 地区限制、账号购买、网络、价格、Agent 的上手难度。当时很多时候不是在做设计，而是在「让工具终于能工作」的痛苦中。最后在前端大神的推荐和教导下，采用了 Cursor 会员，加 VS Code + API 来进行这个网站的搭建。',
            '这个阶段真的很感谢那些愿意分享、真心帮忙、花时间帮我理清方向的朋友们。',
          ],
        },
        {
          id: 'making',
          label: '制作记录',
          intro: '制作记录',
          entries: [
            {
              title: 'WorkBuddy 的尝试',
              images: [
                {
                  src: '/projects/project-01/stage-beginning-build-step-01.png',
                  alt: '开始阶段制作记录步骤图 01',
                  caption: '①下载 WorkBuddy\n②编写自己的个人信息\n③简单编写你对网站的想法\n④把上面编写的信息扔给 workbuddy',
                  layout: 'feature',
                },
              ],
            },
            {
              title: '第一个雏形',
              images: [
                {
                  src: '/projects/project-01/stage-beginning-build-step-02.jpg',
                  alt: '开始阶段制作记录步骤图 02',
                  caption: '第一版可滚动的走廊',
                  layout: 'feature',
                },
              ],
            },
            {
              title: '工具的崩溃',
              images: [
                {
                  src: '/projects/project-01/stage-beginning-build-step-03.mov?v=2026061112',
                  alt: '开始阶段制作记录步骤图 03',
                  mediaType: 'video',
                  caption: '①WorkBuddy 因为使用人数过多，请求速度变慢且智能降级，需要寻找新的 Agent\n②尝试使用 VS Code，在没有 API 且没法购买会员的情况下，低级模型生成的东西不尽人意且月内内使用的限额很少\n③尝试 Cursor，由于地区问题，一开始没法使用高级模型\n④尝试 Codex，地区原因没法购买会员',
                  layout: 'feature',
                },
              ],
            },
            {
              title: '最终的工具',
              carousel: true,
              captionRich: [
                { text: '①最终选定了 vscode 搭配 API 为主要工具（价格相对便宜）' },
                {
                  segments: [
                    { type: 'text', value: '下载链接：' },
                    {
                      type: 'link',
                      label: 'https://code.visualstudio.com/',
                      href: 'https://code.visualstudio.com/',
                    },
                    { type: 'text', value: '   API 购买链接：' },
                    {
                      type: 'link',
                      label: 'https://www.zeoapi.com/',
                      href: 'https://www.zeoapi.com/',
                    },
                  ],
                },
                {
                  segments: [
                    { type: 'text', value: 'api 配置文档：' },
                    {
                      type: 'doc',
                      label: '《VSCode-Copilot-接入ZeoAPI-操作文档》',
                      file: '/projects/project-01/VSCode-Copilot-接入ZeoAPI-操作文档.md',
                      downloadName: 'VSCode-Copilot-接入ZeoAPI-操作文档.md',
                    },
                    { type: 'text', value: '（把文档提供给 vscode 让他自行配置就可以了）' },
                  ],
                },
                { text: '②cursor 作为辅助工具（价格较高）' },
                { text: '需要 vpn 开 tun 模式才能使用高级模型，较 vscode 更新手，ai 功能相对强大一点' },
                { text: '③网站搭建主要使用的模型是 GPT-5.4 high（能较好听懂自然语言），偶尔会用 GPT-5.5 Medium（价格会更高），较简单的任务如上传图片、改文案之类则使用低级模型' },
              ],
              images: [
                {
                  src: '/projects/project-01/stage-beginning-build-step-05.png',
                  alt: '开始阶段制作记录步骤图 05',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-beginning-build-step-05-1.png',
                  alt: '开始阶段制作记录步骤图 05-1',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-beginning-build-step-05-2.png',
                  alt: '开始阶段制作记录步骤图 05-2',
                  layout: 'feature',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'stageToggle',
      id: 'stage-home',
      title: '首页',
      subtitle: '狗狗与入梦起点',
      tabs: [
        {
          id: 'narrative',
          label: '叙事',
          intro: ['首页的想法很简单，', '就是让用户先进入这个梦。'],
          paragraphs: [
            '首页的想法画面出现的很简单，简单到几乎没有思考，这个画面就在那里等着我把他设计出来一样。',
            '我喜欢狗，也养了一只小狗——我想，要不就让他代替我带着用户浏览这个网站吧，于是就有了首页的画面：极简的风格，纯白色的画布，一段表达情绪的衬线大写标题「EVERYTHING YOU SEE IS PART OF A DREAM」、梦泡、坐垫，和一只会走过来、躺下、然后进入梦乡的狗狗。',
            '狗狗的表现方式，是我做网站遇到的第一个难点。',
            '因为狗狗模型必须要统一，所以原本是想做成 3D 模型的。但后来尝试了几种方案，无论是用哪个3Dai网站生成模型直接使用还是生成后导入3D软件编辑后使用，都存在一个问题，至少以当前 AI + 我的能力，很难稳定生成能按我想法动起来的角色资产，就算能实现，也要耗费大量的时间，得不偿失，于是就改成了视频方案，当然视频方案也不是一帆风顺的，测试了runway、kling、vidu等多个ai视频生成网站，考虑了性价比和功能对比后，最终选定了即梦的seedance2.0模型。',
          ],
        },
        {
          id: 'making',
          label: '制作记录',
          intro: '制作记录',
          entries: [
            {
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-01.mov?v=20260612',
                  alt: '首页制作记录步骤图 01',
                  mediaType: 'video',
                  loop: false,
                  caption: '①上素材网站找自己想要的风格参考\n②与ai合作编写主题文案\n③摆放自己想要的元素排版',
                  layout: 'feature',
                },
              ],
            },
            {
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-02.mov?v=20260612',
                  alt: '首页制作记录步骤图 02',
                  mediaType: 'video',
                  caption: '上素材网站找自己想要的风格参考（这里因为其实要找的是模型风格，所以找的参考的时候不用被局限于仅找「狗狗」）',
                  layout: 'feature',
                },
              ],
            },
            {
              carousel: true,
              caption: '①确认风格后，在gemini上传自己想转化的图片和找到的风格参考\n②不断调整提示词得到最终自己想要的模型图片\n③确认模型图片后，调整提示词让gemini生成不同的角度/姿势\n④用PS修图抠图，并把所有生成的图片统一尺寸，以便视频生成后方便统一上传调整',
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-03.jpg',
                  alt: '首页制作记录步骤图 03',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-03-1.jpg',
                  alt: '首页制作记录步骤图 03-1',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-03-2.jpg',
                  alt: '首页制作记录步骤图 03-2',
                  layout: 'feature',
                },
              ],
            },
            {
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-04.png?v=20260612',
                  alt: '首页制作记录步骤图 04',
                  caption: '①确认想要的动作，把之前生成的图片根据首尾帧提供给即梦\n②与GPT/即梦一起调整适合即梦的提示词，最好是绿幕背景方便后续抠图\n③抽奖（这个阶段的难点是即梦会比较固执的认为狗狗的鼻子是黑色，而我的模型的狗狗鼻子是白色的，浪费了好多额度）',
                  layout: 'feature',
                },
              ],
            },
            {
              carousel: true,
              caption: '①使用剪映剪掉多余视频长度，与调整统一所有视频的狗狗色彩\n②使用AE扣出透明底\n③使用ffmpeg把AE导出的视频格式转化成WebM格式',
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-05.png?v=20260613',
                  alt: '首页制作记录步骤图 05',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-05-1.png?v=20260613',
                  alt: '首页制作记录步骤图 05-1',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-05-2.png?v=20260613',
                  alt: '首页制作记录步骤图 05-2',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-05-3.webm?v=20260613',
                  alt: '首页制作记录步骤图 05-3',
                  mediaType: 'video',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-05-4.webm?v=20260613',
                  alt: '首页制作记录步骤图 05-4',
                  mediaType: 'video',
                  layout: 'feature',
                },
                {
                  src: '/projects/project-01/stage-home-build-step-05-5.webm?v=20260613',
                  alt: '首页制作记录步骤图 05-5',
                  mediaType: 'video',
                  layout: 'feature',
                },
              ],
            },
            {
              images: [
                {
                  src: '/projects/project-01/stage-home-build-step-06.png?v=20260612',
                  alt: '首页制作记录步骤图 06',
                  caption: '①把视频交给Agent\n②用自然语言让Agent调整尺寸、落地、时序',
                  layout: 'feature',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'stageToggle',
      id: 'stage-corridor',
      title: '走廊页面',
      subtitle: '无限走廊与画框',
      tabs: [
        {
          id: 'narrative',
          label: '叙事',
          intro: ['梦开始向前延伸，', '走廊便出现了。'],
          paragraphs: [
            '这个网站最开始，其实并没有明确的「走廊」概念，也没有完整的结构。脑海里只有一个模糊的画面：一只狗正在做梦，而梦的深处似乎有一条不断向前延伸的走廊。',
            '后来和 Agent 一起讨论网站风格时，我描述了自己想要的大致方向。讨论结束后，WorkBuddy 根据这些想法生成了第一个雏形，「走廊」也是在那个时候第一次清晰地出现在我面前。',
            '当看到第一个草图里，画面能够顺滑地向前延伸、滑动时，我是惊讶的，也是兴奋的。因为那一刻，我第一次觉得这个网站真的有机会被做出来，也第一次有了继续做下去的信心。',
            '我喜欢那种安静、留白、像凌晨一样的氛围。不想做太强烈的赛博朋克风，也不想做刻意炫技的科技感。因为我希望用户看到它时，不是在浏览一个作品集，而是在进入一个梦境。',
            '后来，「进入梦里」这个概念开始慢慢往下生长。于是有了不断向前延伸的空间，有了漂浮在两侧的画框，也有了烟雾、水波等氛围特效。',
            '两侧的画框灵感其实来自画展。走在展厅里时，作品总是安静地悬挂在两侧，等待观众停下脚步观看。我希望这个网站也有类似的体验。每一个画框既是一件展品，也是一个入口。当靠近某个画框时，也就意味着走进了那个作品的故事里。这样既符合整个空间的逻辑，也让作品能够自然地融入这个梦境世界。',
          ],
        },
        {
          id: 'making',
          label: '制作记录',
          intro: '制作记录',
          entries: [
            {
              text: '搭建基础走廊场景，建立无限延伸规则。',
              images: [
                {
                  src: '/projects/project-01/stage-corridor-build-step-01.jpg',
                  alt: '走廊制作记录步骤图 01',
                  caption: '①从这里起由于不懂代码，所以只能不停的与agent对话修改，一点点把想要的效果设计出来，是一个漫长的过程\n②让agent构建出画框，添加漂浮动态，\n③让画框按想法分布\n④让走廊无限循环',
                  layout: 'feature',
                },
              ],
            },
            {
              text: '增加走廊出口光与走廊贴图材质',
              images: [
                {
                  src: '/projects/project-01/stage-corridor-build-step-02.jpg',
                  alt: '走廊制作记录步骤图 02',
                  caption: '①寻找想要的走廊风格\n②使用PS与生图ai把自己想要的走廊效果做出来，然后根据画面做一个展开图，分别是左右墙壁，天花板，地板四个贴图\n③把贴图交给agent',
                  layout: 'feature',
                },
              ],
            },
            {
              text: '增加画框材质与灯光效果',
              images: [
                {
                  src: '/projects/project-01/stage-corridor-build-step-03.jpg',
                  alt: '走廊制作记录步骤图 03',
                  caption: '①这里需要稍微了解一些3D建模软件如何打灯与材质受光的知识\n②根据想要的效果与agent描述画框的材质\n③单独给画框打上合适的灯光效果（通常为一主灯，多补光灯组合）',
                  layout: 'feature',
                },
              ],
            },
            {
              text: '增加烟雾与流光特效',
              captionRich: [
                { text: '特效靠自然语言描述目前agent几乎无法做到，只能去找合适的特效代码网站，复制合适的代码后自己调整成适合的效果' },
                {
                  segments: [
                    { type: 'text', value: '烟雾特效代码链接：' },
                    {
                      type: 'link',
                      label: 'https://z2586300277.github.io/three-cesium-examples/#/codeMirror?navigation=ThreeJS&classify=particle&id=steamParticle',
                      href: 'https://z2586300277.github.io/three-cesium-examples/#/codeMirror?navigation=ThreeJS&classify=particle&id=steamParticle',
                    },
                  ],
                },
                {
                  segments: [
                    { type: 'text', value: '水波纹流光特效代码链接：' },
                    {
                      type: 'link',
                      label: 'https://z2586300277.github.io/three-cesium-examples/#/codeMirror?navigation=ThreeJS&classify=shader&id=waterA',
                      href: 'https://z2586300277.github.io/three-cesium-examples/#/codeMirror?navigation=ThreeJS&classify=shader&id=waterA',
                    },
                  ],
                },
              ],
              images: [
                {
                  src: '/projects/project-01/stage-corridor-build-step-04.jpg',
                  alt: '走廊制作记录步骤图 04',
                  layout: 'feature',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'stageToggle',
      id: 'stage-focus',
      title: '聚焦页面',
      subtitle: '浏览到阅读的过渡',
      tabs: [
        {
          id: 'narrative',
          label: '叙事',
          intro: ['聚焦页负责停留，', '它是浏览和阅读之间的过渡。'],
          paragraphs: [
            '聚焦页的设计理念很简单，走廊负责浏览，聚焦页负责停留。',
            '用户点击画框之后，不会直接进入项目详情，而是先来到聚焦页。',
            '这一页更像一个过渡空间，让用户从浏览状态切换到阅读状态，同时也能突出当前项目本身。',
            '最难的点在于制作画框的特效。',
            '目前这一页其实经历过很多次调整，因为一直在寻找一个平衡点：既要保留网站整体氛围，又要保证项目内容足够清晰。',
          ],
        },
        {
          id: 'making',
          label: '制作记录',
          intro: '制作记录',
          entries: [
            {
              text: '设计项目主视觉展示区域。',
              images: [
                { src: '/projects/project-01/stage-focus-build-step-01.jpg', alt: '聚焦制作记录步骤图 01', caption: '可放主视觉区设计图', layout: 'feature' },
              ],
            },
            {
              text: '设计项目标题与简介排版。',
              images: [
                { src: '/projects/project-01/stage-focus-build-step-02.jpg', alt: '聚焦制作记录步骤图 02', caption: '可放标题与简介排版图', layout: 'feature' },
              ],
            },
            {
              text: '设计进入详情页的交互方式。',
              images: [
                { src: '/projects/project-01/stage-focus-build-step-03.jpg', alt: '聚焦制作记录步骤图 03', caption: '可放进入详情页交互图', layout: 'feature' },
              ],
            },
            {
              text: '调整与走廊页面之间的过渡动画。',
              images: [
                { src: '/projects/project-01/stage-focus-build-step-04.jpg', alt: '聚焦制作记录步骤图 04', caption: '可放过渡动画调试图', layout: 'feature' },
              ],
            },
            {
              text: '优化移动端阅读体验。',
              images: [
                { src: '/projects/project-01/stage-focus-build-step-05.jpg', alt: '聚焦制作记录步骤图 05', caption: '可放移动端阅读优化图', layout: 'feature' },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'stageToggle',
      id: 'stage-detail',
      title: '详情页',
      subtitle: '过程与结果并置',
      tabs: [
        {
          id: 'narrative',
          label: '叙事',
          intro: ['详情页在我看来，', '不只是展示结果，而是展示过程。'],
          paragraphs: [
            '详情页因为在我看来，这里展示的不只是项目结果，还有项目背后的过程。',
            '所以最终决定把项目拆成：设计思路、制作过程、遇到的问题、最终成果。',
            '让用户不仅能看到作品，也能看到它是怎么被做出来的。',
          ],
        },
        {
          id: 'making',
          label: '制作记录',
          intro: '制作记录',
          entries: [
            {
              text: '规划整体内容结构。',
              images: [
                { src: '/projects/project-01/stage-detail-build-step-01.jpg', alt: '三级页制作记录步骤图 01', caption: '可放内容结构草图', layout: 'feature' },
              ],
            },
            {
              text: '设计图片与文字混排方式。',
              images: [
                { src: '/projects/project-01/stage-detail-build-step-02.jpg', alt: '三级页制作记录步骤图 02', caption: '可放图文混排版式图', layout: 'feature' },
              ],
            },
            {
              text: '整理项目过程资料。',
              images: [
                { src: '/projects/project-01/stage-detail-build-step-03.jpg', alt: '三级页制作记录步骤图 03', caption: '可放资料整理过程图', layout: 'feature' },
              ],
            },
            {
              text: '增加开发记录与设计记录。',
              images: [
                { src: '/projects/project-01/stage-detail-build-step-04.jpg', alt: '三级页制作记录步骤图 04', caption: '可放记录归档图', layout: 'feature' },
              ],
            },
            {
              text: '优化长页面阅读体验。',
              images: [
                { src: '/projects/project-01/stage-detail-build-step-05.jpg', alt: '三级页制作记录步骤图 05', caption: '可放阅读节奏调整图', layout: 'feature' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
