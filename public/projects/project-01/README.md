# project-01 配图目录

三级页运行时引用的图片请放在此目录，例如 /projects/project-01/hero.jpg。

## 当前占位文件命名（阶段式）

页面已经预留了以下图片路径，后续可直接按同名文件覆盖：

- `stage-beginning-mood-01.jpg`
- `stage-beginning-build-step-01.jpg`
- `stage-beginning-build-step-02.jpg`
- `stage-beginning-build-step-03.jpg`
- `stage-beginning-build-step-04.jpg`
- `stage-beginning-build-step-05.jpg`
- `stage-home-mood-01.jpg`
- `stage-home-mood-02.jpg`
- `stage-home-build-step-01.jpg`
- `stage-home-build-step-02.jpg`
- `stage-home-build-step-03.jpg`
- `stage-home-build-step-04.jpg`
- `stage-home-build-step-05.jpg`
- `stage-home-build-step-06.jpg`
- `stage-corridor-mood-01.jpg`
- `stage-corridor-mood-02.jpg`
- `stage-corridor-build-step-01.jpg`
- `stage-corridor-build-step-02.jpg`
- `stage-corridor-build-step-03.jpg`
- `stage-corridor-build-step-04.jpg`
- `stage-focus-mood-01.jpg`
- `stage-focus-mood-02.jpg`
- `stage-focus-build-step-01.jpg`
- `stage-focus-build-step-02.jpg`
- `stage-focus-build-step-03.jpg`
- `stage-focus-build-step-04.jpg`
- `stage-focus-build-step-05.jpg`
- `stage-detail-mood-01.jpg`
- `stage-detail-mood-02.jpg`
- `stage-detail-build-step-01.jpg`
- `stage-detail-build-step-02.jpg`
- `stage-detail-build-step-03.jpg`
- `stage-detail-build-step-04.jpg`
- `stage-detail-build-step-05.jpg`

命名规则：

- `mood` = 叙事侧图片（心路/感受）
- `build` = 制作侧图片（步骤/过程）

## 当前版式逻辑（高级特稿式）

`project-01` 现在不是普通网格图，而是按特稿节奏排版：

- 每个阶段的第 1 张图通常作为主图
- 后续图片作为补充图、对照图或细节图
- 主图优先放结果图、整页图、空间图
- 补充图优先放过程截图、局部细节、版本对比
- 制作记录区现在是“每一步文字下面接对应图片”的记录模式

代码里当前会按以下思路使用图片：

- `feature` = 全宽主图 / 章节主视觉
- `portrait` = 偏竖向的封面感图片
- `split` = 适合和另一张图并列的过程图
- `detail` = 辅助说明图 / 局部细节图
