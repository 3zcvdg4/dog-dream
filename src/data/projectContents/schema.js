/**
 * @typedef {'editorial-dream' | 'gallery-first' | 'split-story' | 'timeline-heavy' | 'minimal-case' | 'stage-dual' | 'project-01-editorial'} ProjectLayout
 */

/**
 * @typedef {Object} ProjectContentModule
 * @property {string} id
 * @property {ProjectLayout} layout
 * @property {ProjectSection[]} sections
 * @property {Record<string, string>} [theme]
 */

/**
 * @typedef {Object} ProjectSectionBase
 * @property {string} type
 * @property {string} [id]
 */

/** @typedef {ProjectSectionBase & { type: 'intro', paragraphs: string[] }} IntroSection */
/** @typedef {ProjectSectionBase & { type: 'heading', text: string, level?: 2|3 }} HeadingSection */
/** @typedef {ProjectSectionBase & { type: 'paragraph', text: string }} ParagraphSection */
/** @typedef {ProjectSectionBase & { type: 'paragraphs', items: string[] }} ParagraphsSection */
/** @typedef {ProjectSectionBase & { type: 'steps', items: { title?: string, text: string }[] }} StepsSection */
/** @typedef {ProjectSectionBase & { type: 'quote', text: string, cite?: string }} QuoteSection */
/** @typedef {ProjectSectionBase & { type: 'divider' }} DividerSection */
/** @typedef {ProjectSectionBase & { type: 'subheading', text: string }} SubheadingSection */
/** @typedef {ProjectSectionBase & { type: 'bulletList', items: string[] }} BulletListSection */
/** @typedef {ProjectSectionBase & { type: 'table', headers: string[], rows: string[][] }} TableSection */
/** @typedef {ProjectSectionBase & { type: 'timeline', items: { date: string, phase: string, event: string, tool?: string }[] }} TimelineSection */
/** @typedef {ProjectSectionBase & { type: 'gallery', columns?: 1|2|3, images: { src: string, alt: string, caption?: string }[] }} GallerySection */
/** @typedef {ProjectSectionBase & { type: 'progress', label: string, value: number, items: { label: string, value: number }[] }} ProgressSection */
/** @typedef {ProjectSectionBase & { type: 'callout', text: string, variant?: 'note'|'warn' }} CalloutSection */
/**
 * @typedef {Object} StageToggleTab
 * @property {string} id
 * @property {string} label
 * @property {string | string[]} [intro]
 * @property {string[]} [paragraphs]
 * @property {{ title?: string, text: string }[]} [steps]
 * @property {{ title?: string, text: string, caption?: string, captionRich?: ({ text: string } | { segments: { type: 'text', value: string }[] | { type: 'link', label: string, href: string }[] | { type: 'doc', label: string, file: string, downloadName: string }[] })[] })[], carousel?: boolean, images?: { src: string, alt: string, caption?: string, mediaType?: 'image'|'video', loop?: boolean, layout?: 'feature'|'split'|'portrait'|'detail' }[] }[]} [entries]
 * @property {{ src: string, alt: string, caption?: string, mediaType?: 'image'|'video', loop?: boolean, layout?: 'feature'|'split'|'portrait'|'detail' }[]} [images]
 */
/** @typedef {ProjectSectionBase & { type: 'stageToggle', title: string, subtitle?: string, tabs: StageToggleTab[] }} StageToggleSection */

/**
 * @typedef {IntroSection | HeadingSection | ParagraphSection | ParagraphsSection | StepsSection | QuoteSection | DividerSection | SubheadingSection | BulletListSection | TableSection | TimelineSection | GallerySection | ProgressSection | CalloutSection | StageToggleSection} ProjectSection
 */

export const SECTION_TYPES = [
  'intro',
  'heading',
  'paragraph',
  'paragraphs',
  'steps',
  'quote',
  'divider',
  'subheading',
  'bulletList',
  'table',
  'timeline',
  'gallery',
  'progress',
  'callout',
  'stageToggle',
];

export const LAYOUT_TYPES = [
  'editorial-dream',
  'gallery-first',
  'split-story',
  'timeline-heavy',
  'minimal-case',
  'stage-dual',
  'project-01-editorial',
];
