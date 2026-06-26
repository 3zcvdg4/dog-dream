/** @type {import('./schema.js').ProjectContentModule} */
const asset = (fileName) => `/projects/project-02/${fileName}`;

const assetImage = (fileName) => ({
  src: asset(fileName),
  webp: asset(fileName.replace(/\.(jpe?g|png)$/i, '.webp')),
});

const brandCarouselItems = Array.from({ length: 4 }, (_, index) => {
  const num = String(index + 1).padStart(2, '0');
  const fileName = `brand-system/block-brand-system-${num}.jpg`;
  const media = assetImage(fileName);

  return {
    id: `brand-vi-${num}`,
    alt: `品牌视觉系统 ${index + 1}`,
    fileName: `block-brand-system-${num}.jpg`,
    src: media.src,
    webp: media.webp,
  };
});

const productItems = [
  {
    id: 'product-h10',
    alt: 'H10',
    fileName: 'block-product-01.jpg',
    src: asset('product-system/block-product-01.jpg'),
    captionLead: 'H10。',
    captionBody: '激光雕刻旗舰系列',
  },
  {
    id: 'product-h20',
    alt: 'H20',
    fileName: 'block-product-02.jpg',
    src: asset('product-system/block-product-02.jpg'),
    captionLead: 'H20。',
    captionBody: '可拆层叠式激光雕刻机',
  },
  {
    id: 'product-olm2pro-s2',
    alt: 'OLM2Pro S2',
    fileName: 'block-product-03.jpg',
    src: asset('product-system/block-product-03.jpg'),
    captionLead: 'OLM2Pro S2。',
    captionBody: '最畅销激光雕刻机',
  },
  {
    id: 'product-r2',
    alt: 'R2',
    fileName: 'block-product-04.jpg',
    src: asset('product-system/block-product-04.jpg'),
    captionLead: 'R2。',
    captionBody: '全封闭激光雕刻机',
  },
  {
    id: 'product-al3',
    alt: 'AL3',
    fileName: 'block-product-05.jpg',
    src: asset('product-system/block-product-05.jpg'),
    captionLead: 'AL3。',
    captionBody: '入门系列',
  },
  {
    id: 'product-al2',
    alt: 'AL2',
    fileName: 'block-product-06.jpg',
    src: asset('product-system/block-product-06.jpg'),
    captionLead: 'AL2。',
    captionBody: '入门系列',
  },
];

const pptCaptions = [
  '招商PPT',
  '规划设计企业产品手册',
  '包装设计与渲染',
  '包装设计与渲染',
  '名片设计',
  '说明书设计',
];

const pptItems = Array.from({ length: 6 }, (_, index) => {
  const num = String(index + 1).padStart(2, '0');
  const fileName = `招商与物料-${num}.jpg`;
  const media = assetImage(`ppt-system/${fileName}`);

  return {
    id: `ppt-${num}`,
    alt: pptCaptions[index],
    fileName,
    src: media.src,
    webp: media.webp,
    captionBody: pptCaptions[index],
  };
});

const exhibitionCarouselItems = Array.from({ length: 3 }, (_, index) => {
  const num = String(index + 1).padStart(2, '0');
  const fileName = `exhibition-system/空间陈列-${num}.jpg`;

  return {
    id: `exhibition-${num}`,
    alt: `空间陈列 ${index + 1}`,
    fileName: `空间陈列-${num}.jpg`,
    src: asset(fileName),
  };
});

// 电商飞图：每张图片可单独调；startX/startY/startScale/endX/endY/endScale/float 见下方 ecommerceSharedMotion 统一块。
// 坐标说明：
// - startX 初始位置：1.3 表示从右侧外面进入；数值越大越靠右。
// - focusX 最大时位置：0 表示屏幕中心；负数偏左，正数偏右。
// - shrinkStartX 开始变小位置：图片放到最大后，到达这个位置才开始缩小；应小于 focusX。
// - endX 最后位置：-1.3 表示从左侧外面离开；数值越小越靠左。
// - startY 初始上下：0 是垂直中心，负数向上，正数向下。
// - peakY 最大时上下：图片最大时的上下位置。
// - endY 结束上下：图片离开时的上下位置。
// 大小说明：
// - startScale 初始大小、peakScale 最大时大小、endScale 最后大小。
// - maxScale 最大限制；如果 peakScale 比 maxScale 大，会被 maxScale 压住。
// 排版说明：
// - trackIndex 控制这张图在队列里的先后位置；数字越大越晚出现。
// - spacing 控制与相邻图片的间距；越小越密，越大越疏。
// - variant 控制 CSS 里的基础宽度类型：portrait / tall / wide / landscape / square。
// - scale 是单张图片的个体大小修正，最终仍受 maxScale 限制。
// - float 控制上下轻微漂浮幅度；不想漂浮就改成 0。
// - layer 图层层级：数字越大越靠上，与大小/位置无关，只按这个值决定谁盖谁。

/** 统一参数 · 改这里会作用于全部 21 张图（单张可在下方单独覆盖同名参数） */
const ecommerceSharedMotion = {
  startX: 0.5, // 统一·初始左右位置：越大越靠右
  startY: 0, // 统一·初始上下位置：负数向上，正数向下
  startScale: 0.1, // 统一·初始大小
  endX: -0.55, // 统一·结束左右位置：越小越靠左
  endY: 0, // 统一·结束上下位置
  endScale: 0, // 统一·结束大小
  float: 0.01, // 统一·上下漂浮幅度：0 表示不漂浮
};
const ecommerceImageSettings = [
  // 第01张图片：1.jpg -> block-ecommerce-system-01.jpg
  {

    num: '01', // 图片编号：对应 block-ecommerce-system-01.jpg
    variant: 'portrait', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 0, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0.2, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.3, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1, // 单张图片整体大小修正
    layer: 1, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第02张图片：2.jpg -> block-ecommerce-system-02.jpg
  {

    num: '02', // 图片编号：对应 block-ecommerce-system-02.jpg
    variant: 'landscape', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 1, // 出现顺序：数字越大越晚出现
    spacing: 0.1, // 图片间距：越小越密，越大越疏
    focusX: 0.0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.2, // 最大时上下位置
    peakScale: 1, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 2, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第03张图片：3.jpg -> block-ecommerce-system-03.jpg
  {

    num: '03', // 图片编号：对应 block-ecommerce-system-03.jpg
    variant: 'tall', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 2, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.15, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 3, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第04张图片：4.jpg -> block-ecommerce-system-04.jpg
  {

    num: '04', // 图片编号：对应 block-ecommerce-system-04.jpg
    variant: 'wide', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 3, // 出现顺序：数字越大越晚出现
    spacing: 0.07, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.18, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 4, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第05张图片：5.jpg -> block-ecommerce-system-05.jpg
  {

    num: '05', // 图片编号：对应 block-ecommerce-system-05.jpg
    variant: 'square', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 4, // 出现顺序：数字越大越晚出现
    spacing: 0.12, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.08, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 5, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第06张图片：6.jpg -> block-ecommerce-system-06.jpg
  {

    num: '06', // 图片编号：对应 block-ecommerce-system-06.jpg
    variant: 'portrait', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 5, // 出现顺序：数字越大越晚出现
    spacing: 0.12, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.3, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 6, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第07张图片：7.jpg -> block-ecommerce-system-07.jpg
  {

    num: '07', // 图片编号：对应 block-ecommerce-system-07.jpg
    variant: 'landscape', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 6, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.1, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 7, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第08张图片：8.jpg -> block-ecommerce-system-08.jpg
  {

    num: '08', // 图片编号：对应 block-ecommerce-system-08.jpg
    variant: 'tall', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 7, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.17, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 8, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第09张图片：9.jpg -> block-ecommerce-system-09.jpg
  {

    num: '09', // 图片编号：对应 block-ecommerce-system-09.jpg
    variant: 'wide', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 8, // 出现顺序：数字越大越晚出现
    spacing: 0.1, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.26, // 最大时上下位置
    peakScale: 1, // 最大时大小
    maxScale: 1, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1, // 单张图片整体大小修正
    layer: 9, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第10张图片：10.jpg -> block-ecommerce-system-10.jpg
  {

    num: '10', // 图片编号：对应 block-ecommerce-system-10.jpg
    variant: 'square', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 9, // 出现顺序：数字越大越晚出现
    spacing: 0.14, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.2, // 最大时上下位置
    peakScale: 3, // 最大时大小
    maxScale: 3.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2, // 单张图片整体大小修正
    layer: 10, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第11张图片：11.jpg -> block-ecommerce-system-11.jpg
  {

    num: '11', // 图片编号：对应 block-ecommerce-system-11.jpg
    variant: 'portrait', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 10, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.08, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 11, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第12张图片：12.jpg -> block-ecommerce-system-12.jpg
  {

    num: '12', // 图片编号：对应 block-ecommerce-system-12.jpg
    variant: 'landscape', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 11, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.22, // 最大时上下位置
    peakScale: 1, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.2, // 单张图片整体大小修正
    layer: 12, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第13张图片：13.jpg -> block-ecommerce-system-13.jpg
  {

    num: '13', // 图片编号：对应 block-ecommerce-system-13.jpg
    variant: 'tall', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 12, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.14, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 13, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第14张图片：14.jpg -> block-ecommerce-system-14.jpg
  {

    num: '14', // 图片编号：对应 block-ecommerce-system-14.jpg
    variant: 'wide', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 13, // 出现顺序：数字越大越晚出现
    spacing: 0.07, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: 0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.15, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 1.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 12, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第15张图片：15.jpg -> block-ecommerce-system-15.jpg
  {

    num: '15', // 图片编号：对应 block-ecommerce-system-15.jpg
    variant: 'square', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 14, // 出现顺序：数字越大越晚出现
    spacing: 0.06, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.35, // 最大时上下位置
    peakScale: 2.5, // 最大时大小
    maxScale: 3.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2.5, // 单张图片整体大小修正
    layer: 10, // 图层层级：数字越大越靠上，与大小位置无关
  },
  // 第16张图片：16.jpg -> block-ecommerce-system-16.jpg
  {

    num: '16', // 图片编号：对应 block-ecommerce-system-16.jpg
    variant: 'portrait', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 15, // 出现顺序：数字越大越晚出现
    spacing: 0.07, // 图片间距：越小越密，越大越疏
    focusX: 0.1, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.3, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2, // 单张图片整体大小修正
    layer: 13, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.1, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
  // 第17张图片：17.jpg -> block-ecommerce-system-17.jpg
  {

    num: '17', // 图片编号：对应 block-ecommerce-system-17.jpg
    variant: 'landscape', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 16, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.3, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 1.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 14, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.11, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
  // 第18张图片：18.jpg -> block-ecommerce-system-18.jpg
  {

    num: '18', // 图片编号：对应 block-ecommerce-system-18.jpg
    variant: 'tall', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 17, // 出现顺序：数字越大越晚出现
    spacing: 0.1, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.2, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2, // 单张图片整体大小修正
    layer: 15, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.12, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
  // 第19张图片：19.jpg -> block-ecommerce-system-19.jpg
  {

    num: '19', // 图片编号：对应 block-ecommerce-system-19.jpg
    variant: 'wide', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 18, // 出现顺序：数字越大越晚出现
    spacing: 0.04, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.1, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2, // 单张图片整体大小修正
    layer: 6, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.13, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
  // 第20张图片：20.jpg -> block-ecommerce-system-20.jpg
  {

    num: '20', // 图片编号：对应 block-ecommerce-system-20.jpg
    variant: 'square', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 19, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: 0.14, // 最大时上下位置
    peakScale: 2, // 最大时大小
    maxScale: 2, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 2, // 单张图片整体大小修正
    layer: 7, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.14, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
  // 第21张图片：21.jpg -> block-ecommerce-system-21.jpg
  {

    num: '21', // 图片编号：对应 block-ecommerce-system-21.jpg
    variant: 'portrait', // 基础尺寸类型：portrait/tall/wide/landscape/square
    trackIndex: 20, // 出现顺序：数字越大越晚出现
    spacing: 0.09, // 图片间距：越小越密，越大越疏
    focusX: 0, // 最大时左右位置：0 是屏幕中心
    shrinkStartX: -0.1, // 开始变小位置：放到最大后，到达这里才开始缩小
    peakY: -0.22, // 最大时上下位置
    peakScale: 1.5, // 最大时大小
    maxScale: 1.5, // 最大限制：会限制 peakScale 的实际显示上限
    scale: 1.5, // 单张图片整体大小修正
    layer: 8, // 图层层级：数字越大越靠上，与大小位置无关
    endY: 0.15, // 结束上下位置：负数向上，正数向下；离开画面时的 Y
  },
];

const ecommerceCollageItems = ecommerceImageSettings.map((item, index) => ({
  ...ecommerceSharedMotion,
  ...item,
  id: `ecommerce-collage-${item.num}`,
  alt: `电商详情页系统 ${index + 1}`,
  fileName: `block-ecommerce-system-${item.num}.jpg`,
  src: asset(`ecommerce-system/block-ecommerce-system-${item.num}.jpg`),
  variant: item.variant,
  motion: 'mwg-collection',
  trackIndex: item.trackIndex,
  focusX: item.focusX,
  shrinkStartX: item.shrinkStartX,
  peakY: item.peakY,
  peakScale: item.peakScale,
  maxScale: item.maxScale,
  spacing: item.spacing,
  scale: item.scale,
}));

export default {
  id: 'project-02',
  layout: 'project-02-ortur',
  preloadPriorityAssets: brandCarouselItems,
  hero: {
    label: 'ORTUR / SYSTEM CASE STUDY',
    titleBefore: '品牌 × 产品 ×',
    titleAccent: '内容系统设计',
    description:
      '从视觉体系到产品表达，再到电商、视频、PPT 与线下空间，构建一个完整可扩展的品牌内容系统。',
  },
  metrics: [
    { count: 50, suffix: '+', label: '内容页面' },
    { count: 300, suffix: '+', label: '视频资产' },
    { count: 100, suffix: '+', label: '物料设计' },
    { count: 20, suffix: '+', label: '空间内容' },
  ],
  blocks: [
    {
      id: 'brand-system',
      label: 'BRAND SYSTEM',
      title: '品牌视觉系统',
      intro: '统一 LOGO、色彩、KV 与视觉语言，建立跨渠道可复用的品牌基础层。',
      visual: {
        type: 'carousel',
        layout: 'feature',
        intervalMs: 4500,
        preloadImmediately: true,
        items: brandCarouselItems,
      },
    },
    {
      id: 'product-system',
      label: 'PRODUCT SYSTEM',
      title: '产品表达',
      intro: '按产品线建立模块化表达框架，让每款机器都有清晰、一致的内容结构。',
      visual: {
        type: 'horizontal',
        items: productItems,
      },
    },
    {
      id: 'ecommerce',
      label: 'E-COMMERCE',
      title: '电商详情',
      intro: '统一详情页结构与视觉模块，支撑多产品线在电商渠道的一致表达与快速产出。',
      visual: {
        type: 'wheel-collage',
        items: ecommerceCollageItems,
        tailSyncCount: 6, // 最后 N 张飞图与下方区块同步滚动
        tailEndSectionId: 'video', // 同步滚动时露出的下一区块 id
        tailEndAt: 'top 65%', // 下一区块标题进入视口的位置
        scrollStart: 'top bottom', // 飞图进入视口底部即开始，不必等滚到顶部
      },
    },
    {
      id: 'video',
      label: 'VIDEO SYSTEM',
      title: '视频内容',
      intro: '覆盖分镜脚本、拍摄现场到成片输出，形成可复用的视频内容生产结构。',
      visual: {
        type: 'video-carousel',
        items: [
          {
            id: 'video-storyboard',
            alt: 'Storyboard',
            fileName: '视频内容体系01.jpg',
            ...assetImage('video-system/视频内容体系01.jpg'),
            caption: '视频分镜 / 脚本结构',
            layout: 'split',
          },
          {
            id: 'video-shooting',
            alt: 'Shooting',
            fileName: '视频内容体系02.mov',
            src: asset('video-system/视频内容体系02.mov'),
            mediaType: 'video',
            caption: '拍摄现场 / 成片帧',
            layout: 'split',
          },
          {
            id: 'video-social-plan',
            alt: '社媒拍摄发帖规划',
            fileName: '视频内容体系03.jpg',
            ...assetImage('video-system/视频内容体系03.jpg'),
            caption: '社媒拍摄发帖规划',
            layout: 'split',
          },
          {
            id: 'video-montage',
            alt: '视频成品拼接展示',
            fileName: '视频内容体系04.mov',
            src: asset('video-system/视频内容体系04.mov'),
            mediaType: 'video',
            caption: '视频成品拼接展示',
            layout: 'split',
          },
        ],
      },
    },
    {
      id: 'ppt',
      label: 'PPT SYSTEM',
      title: '招商与物料',
      intro: '面向渠道与 B 端客户的 Pitch Deck 与招商物料，与品牌视觉保持同一套语言。',
      visual: {
        type: 'horizontal',
        items: pptItems,
      },
    },
    {
      id: 'exhibition',
      label: 'EXHIBITION',
      title: '空间陈列',
      intro: '将品牌视觉与产品表达延伸至线下空间，展位、陈列与物料保持同一套系统语言。',
      visual: {
        type: 'carousel',
        layout: 'feature',
        intervalMs: 4500,
        items: exhibitionCarouselItems,
      },
    },
  ],
  impact: {
    label: 'IMPACT',
    title: '系统化成果',
    text: '从单点视觉输出升级为完整品牌内容系统，实现跨渠道一致性与内容生产效率提升。',
    cards: [
      {
        id: 'channels',
        title: '跨渠道一致性',
        text: '品牌、产品、电商、视频与线下空间共享同一视觉与内容框架。',
      },
      {
        id: 'efficiency',
        title: '生产效率提升',
        text: '模块化模板与组件库，让新内容产出从定制变为组装。',
      },
      {
        id: 'scale',
        title: '可扩展架构',
        text: '20+ 产品线、50+ 详情页与 100+ 视频内容持续复用同一系统。',
      },
    ],
  },
  sections: [],
};
