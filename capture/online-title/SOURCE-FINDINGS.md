# 线上「标题包」抽屉 · 源码级取证报告

> 目标页面：https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
> 入口：预览区配置表第 4 列「标题包」→「编辑」（表格 `tr.el-table__footer` 第 4 个 td 的非 disabled 按钮）
> 采集日期：2026-11-27 · 视口 1920×1080 · 登录账号 `liuziyuan01@ygsdmedia.com`（标准版）
> 方法：scrapling MCP 驱动真实 Chrome（CDP）→ 抓线上 bundle → **读源码** → DOM/样式实测 → 双���校验

---

## 0. 为什么这次用「读源码」而不是「点 DOM」

标题包抽屉的文案**不在**任何前端 bundle 里（`手动选取标题` / `动态选取标题` / `标题分配方式` / `使用素材名称作为标题` 在全量 1570 个线上 JS 资源中检索为 0 命中），
所以纯 DOM 抓取只能拿到「当前账号、当前状态下渲染出来的样子」，而**渲染条件写在组件源码里**。

实际定位到的源码（Vite/Rolldown 构建，chunk 名带 hash）：

| chunk | 角色 |
|---|---|
| `smart-assistant-BijJ3Xtm.js` (1.06 MB) | **主组件**：TitleSelector / TitlePackage / TitleLibrary / 渲染函数全部在此 |
| `dynamic-title-D6MgkNNy.js` | DynamicTitle（动态选取标题页签） |
| `dynamic-title-DGnKLaF3.js` | 动态规则字段配置与选项常量 |
| `dynamic-area-B5LMTlFJ.js` | DynamicArea（动态选取规则列表区） |
| `dynamic-rule-config-DJPNFkjB.js` | 规则编辑弹窗外壳 |
| `title-info-CMmMG8uQ.js` | 规则编辑 · 「标题信息」面板 |
| `title-data-Dv0UvUZW.js` | 规则编辑 · 「标题数据」面板 |
| `title-select-_xlDT-vk.js` | 规则编辑 · 「标题选取方式」面板 |
| `title-screen-dialog-ITBrOCXY.js` | 随机选择 / 智能优选 / 一键测新 共用弹窗 |
| `title-package-dialog-k8RZ3W8r.js` | 新建 / 编辑 / 复制标题包弹窗 |
| `title-library-*.js`、`title-drawer-*.js` | 标题库列表、短剧版标题抽屉（另一变体） |
| `CompareValue-Bv_9Xf-1.js` | 拒审次数 / 建议次数比较器 |
| `cl-account-list-B3lgCsfq.js` | 账户面板 |
| `copy-to-accounts-btn-Cwlo4Zgb.js` | 复制到其他账户 |

> 同名变体（不同媒体/产品版本共用同一套组件）：`batch-upgrade-D6pAt6R0.js`（转化优化版）、
> `task-source-D2x2NcyO.js`、`oc-batch-gRzRFu4l.js`、`uni-batch--V1wAh35.js`、`new-batch-*.js`、
> `title-drawer-DWFCOob5.js`（**短剧版**，含「分剧选择」，本页不出现）。

---

## 1. 抽屉外壳

| 项 | 线上实测 |
|---|---|
| 容器 | `.cl-drawer` `position:fixed` `x=904` `w=1016` `h=1080` `z-index:1002` |
| 底色 / 阴影 | `rgb(240,242,245)` / `-8px 0 8px rgba(0,0,0,.2)` |
| 头部 | `.simple-tabs.header-tabs` `y=0 h=50`，**无标题文字**，两个页签 |
| 页签 | `手动选取标题` / `动态选取标题`，`el-tabs__item` |
| 内容 | `el-form` `label-width:160px` `size:small` |
| 表单 label | `x=937 w=160 h=32`，`14px` `rgb(102,102,102)` `line-height:32px` `text-align:left` |
| radio-button__inner | `min-width:80` `h=32` `padding:9px 12px` `12px/500` `radius:3px` |
| radio 选中 | 文案 `rgb(25,122,251)` / 底 `rgb(214,234,255)` / 边框 `rgb(25,122,251)` |
| radio 未选中 | 文案 `rgb(96,98,102)` / 底 `#fff` / 边框 `rgb(220,223,230)` |
| 说明行 `.form-item-tips` | `12px` `rgb(153,153,153)` `line-height:24px` |
| 底部 | `取 消` / `确 定`，`12px/500`，`88×32` |

**页签可见性（源码）**
```js
selectMethodTabs() { return [
  { name:'MANUAL',  label:'手动选取标题' },
  { name:'DYNAMIC', label:'动态选取标题', visible: this.assistantIndex.isSupportAutoCreation },
].filter(v => v.visible !== false) }
```
→ 「动态选取标题」页签受 `isSupportAutoCreation` 开关控制（**部分账户不显示**）。

---

## 2. 手动选取标题

### 2.1 标题来源（`config.titleSource`，radio-button）

源码：
```js
e.showTitlePackageSource
  ? <el-radio-button label="titlePackage">标题包</el-radio-button> : _
<el-radio-button label="titleLibrary">标题库</el-radio-button>
e.showMaterialNameTitleSource
  ? <el-radio-button label="materialName">使用素材名称作为标题</el-radio-button> : _
e.showOriginalVideoTitle
  ? <el-radio-button label="originalVideoTitle">投放原视频标题</el-radio-button> : _
```

| value | 文案 | 开关 | 默认 |
|---|---|---|---|
| `titlePackage` | 标题包 | `showTitlePackageSource`（默认 true） | ✅ 默认 |
| `titleLibrary` | 标题库 | 恒显示 | |
| `materialName` | **使用素材名称作为标题** | `showMaterialNameTitleSource`（默认 false） | |
| `originalVideoTitle` | **投放原视频标题** | `showOriginalVideoTitle`（默认 false） | |

- `titleSource === 'materialName'` 时，行末追加说明：
  `每个广告优先使用前10个视频素材的名称作为标题（达人/抖音号主页视频将优先使用视频原标题）。`
- `init()` 兜底：`[materialName, originalVideoTitle].includes(titleSource) || (titleSource = showPackage ? 'titlePackage' : 'titleLibrary')`；
  `!showTitlePackageSource && titleSource==='titlePackage'` → 强制改为 `titleLibrary`。

### 2.2 「修改标题」（仅 materialName / originalVideoTitle 分支）

- `originalVideoTitle` → 不渲染任何内容
- `materialName` → `el-form-item label="修改标题"` + `v-show="showMaterialTitles"` + `<MaterialTitles>` 组件（`material-titles-BqX8jh5I.js`）
  - 表格列：`原标题` / `文案` / `操作`；动作 `重置`、`应用到全部`
  - 校验：`不满足 N 个字，请修改`（`getWordLength`）
  - 提示：`标题已成功应用到全部` / `识别到部分视频名称不符合标题长度要求，请修改文案` / `此操作不影响原视频名称`
  - `material-title-name-BKYgXx1-.js`：`请输入文案`、长度 `55`、去除视频/文件扩展名

### 2.3 标题分配方式（`config.titleSelectMethod`）

源码（**手动/动态页签共用同一份 options，文案随页签变**）：
```js
titleAllocationMethods() {
  const w = this.isDynamicTitle ? '规则' : '标题'
  return [
    { label:'全账户复用', value:'SAME',    tips:`所有账户都使用一样的${w}` },
    { label:'平均分配',   value:'AVERAGE', tips:'标题平均分到每个账户中', visible: !this.isDynamicTitle },
    { label:'分账户选择', value:'ACCOUNT', tips:`每个账户单独选择${w}` },
  ].filter(v => v.visible !== false)
}
```

| value | 手动页签 | 动态页签 | 气泡 tips |
|---|---|---|---|
| `SAME` | 全账户复用 | 全账户复用 | 所有账户都使用一样的标题 / 所有账户都使用一样的规则 |
| `AVERAGE` | 平均分配 | **不显示** | 标题平均分到每个账户中 |
| `ACCOUNT` | 分账户选择 | 分账户选择 | 每个账户单独选择标题 / 每个账户单独选择规则 |

- 气泡：每个选项文字后跟 `mg-icon-question2`（13×13，`#999`），hover 出 `el-popover--plain tiny-popover`
  - 实测 hover「平均分配」→ `标题平均分到每个账户中`
  - 实测 hover「分账户选择」→ `每个账户单独选择标题`
- 选中项的 tips 另在下方 `.form-item-tips` 展示一行（随选中项变化）。
- **切换分配方式会清空已选**：watch `config.titleSelectMethod` → `handleChangeTitleSelectMethod()`
  → 清空 `titlePackage` + 所有 `accountTitlePackage[].selectTitlePackage` + `clearSelection()`。
  （`SAME ⇄ AVERAGE ⇄ ACCOUNT` 之间切换都会触发。）

### 2.4 每个标题包（仅 标题库 / 非标题包 来源时）

条件（源码）：`titleSource !== 'titlePackage' && showPackage && isNeedTitleLimit`

| 控件 | 线上 | 说明 |
|---|---|---|
| el-input-number（新标题） | `width:70px` `min=1` `max=maxTitleCount(10)` `precision=0` `controls=false` `size=mini` | 文案「个新标题 」 |
| el-input-number（固定标题） | `width:70px` `min=0` `max=maxTitleCount-1(9)` 同上 | 文案「个固定标题 」 |
| 说明 | `新标题和固定标题的总和不能超过{maxTitleCount}个`（12px #999） | `maxTitleCount` 默认 10 |

互斥逻辑（`handleTitleBlur`）：总和 > max 时，自动把超出量从另一个框扣掉。

### 2.5 账户面板（`.account-panel`）

| 属性 | 线上 |
|---|---|
| 宽度 | `148px` |
| **透明度** | `opacity: +(titleSelectMethod === 'ACCOUNT')` → **非「分账户选择」时 opacity=0（元素仍在 DOM，占位但不可见）** |
| 位置 | 抽屉内容区左侧，右侧列表起点 `x=1097`（容器 984 − 16×2 − 148 − 16） |
| 组件 | `ClAccountList`，`mediaAccountIdKey="advertiser_id"` |
| 选中态 | 账户名右侧 `mg-icon-right-big` 14×32（选中 `#197afb` / 未选 `#333`） |

> 手动页签**始终渲染**账户面板；动态页签**只在「分账户选择」时渲染**（`v-if="isAccountAllocation"`）。

### 2.6 工具条（`.table-toolbar`，实测 `x=1097 y=313 w=790 h=50`）

| 按钮 | 元素 | 尺寸/样式 | 行为 |
|---|---|---|---|
| 新建标题包 | `el-button.w120` `type=primary` `size=small` `icon=mg-icon-plus` | 120×32，底 `rgb(25,122,251)`，**radius 3px** | 打开「添加标题包」弹窗 |
| 随机选择 | **`div.w120.el-button`**（非 el-button！）`data-type=random` | 120×32，白底 `#dcdee6`，**radius 4px** | 打开 TitleScreenDialog（screenType=random） |
| 智能优选 | 同上 `data-type=smart` | 同上 | screenType=smart |
| 一键测新 | 同上 `data-type=recent` | 同上 | screenType=recent |
| 已选 | `span.selected` → `已选：` + `span.num` + `/limitCount` | — | `limitCount = maxTitlePackageCount - 已选数` |

- 三个副按钮在 `limitCount===0` 时加 `is-disabled` 类。
- 标题来源=标题库时主按钮文案改为「**新建标题**」。
- `isBatch=false` 时三个副按钮**不渲染**。
- 实测：标题包模式 `已选：0/193`；标题库模式 `已选：0/200`（上限由父组件 props 决定，动态）。

### 2.7 表格（`el-table`，`row-key=title_package_id`，`border`，`size=small`，**`max-height=505`**，`default-sort={prop:'',order:'ascending'}`）

**标题包模式（12 列，实测列宽一致）**

| # | 列 | 宽 | 备注 |
|---|---|---|---|
| 1 | 多选 | 50 | `selectable=canSelect` `reserve-selection` `fixed` `align=center` |
| 2 | 标题包名称 | 120 | `fixed` `show-overflow-tooltip`；内容是 `el-popover`(hover, max-width 200)，显示 `tips_message` 或全部 `title_list` |
| 3 | 拒审次数 | 80 | `align=center`；>0 时为 `span.title-tag.title-tag--red`，点击打开「标题拒审建议信息」弹窗 |
| 4 | 建议次数 | 80 | 同上 |
| 5 | 创建者 | 100 | |
| 6 | 近3日点击率 | 110 | `align=center` 可排序 |
| 7 | 近3日消耗 | 110 | `align=center` 可排序 |
| 8 | 近90天点击率 | 120 | `align=center` 可排序 |
| 9 | 近90天消耗 | 110 | `align=center` 可排序 |
| 10 | 标题数 | 80 | `align=center` |
| 11 | 创建时间 | 150 | 可排序 |
| 12 | 操作 | 80 | `align=center` `fixed=right`，内容 `编辑` |

- 列头实测：`h=48`，`12px`，`rgb(144,147,153)`，底 `rgb(250,250,250)`，下边框 `1px solid rgb(232,234,236)`。
- 排序事件 `handleSortChange` → 参数 `asc`/`desc`；排序状态在 `activated` 时恢复（`Zi` 缓存）。
- 空值渲染为 `--`。

**标题库模式（11 列）**：多选 50 / **标题名称 200** / 拒审次数 80 / 建议次数 80 / 创建者 100 / 近3日点击率 110 / 近3日消耗 110 / 近90天点击率 120 / 近90天消耗 110 / 创建时间 150 / 操作 160
→ **无「标题数」列**，「标题包名称」改名「标题名称」。

### 2.8 筛选行（`.mg-filter-wrapper`）

| 标题包模式 | 标题库模式 |
|---|---|
| 优化师（`el-select` filterable/clearable/collapse-tags，placeholder「所有优化师」，w=167） | **创建者**（同 select 结构） |
| — | **分类**（`filter-select` 多选，w=119） |
| 拒审次数（`CompareValue` + 数值输入 w=101） | 同 |
| 建议次数（`CompareValue` + 数值输入 w=101） | 同 |
| 关键词输入（`el-input` placeholder「请输入关键词」，w=240，回车搜索）+ `a.clearall`「清空」 | 同 |

- `CompareValue` 比较符：`大于 / 大于或等于 / 等于 / 小于或等于 / 小于`，默认「小于或等于」。
- 优化师选项来自 `optimizeUsers`（`label=user_name_alias` `value=user_id`），接口 `getMyOptimizeUsersByModule?module_name=title_library`。
- 实测输入框：`优化师` select `x=1169 w=167 h=30`；比较 select `w=99 h=30`；关键词 `w=240 h=32`。

---

## 3. 动态选取标题

### 3.1 表单字段（`dynamic-title-D6MgkNNy.js`）

| 顺序 | 字段 | 控件 | 选项/说明 |
|---|---|---|---|
| 1 | 每个广告标题数量 | `el-radio-group` prop=`promotionNumAllocationMethod` | `SAME`「统一设置」/ `RULE`「分规则设置」 |
| 2 | 每个广告标题数量 | `el-input-number` prop=`promotion_title_count` | **仅当 统一设置 时显示**；`min=1 max=maxTitleCount(10) step=1 precision=0 controls=false` |
| 3 | 规则分配方式 | `ClCheckGroup` prop=`titleSelectMethod` | options = 标题分配方式（**无平均分配**）；`resetUnavailable` `immediateUnavailableCheck` |
| 4 | （说明行） | `.form-item-tips` | 随选中项变化的 tips |
| 5 | 选取标题不足时 | `ClCheckGroup` prop=`titleNotEnoughConfig` | `TERMINATION`「余量广告不搭建」/ `LOOP`「循环使用标题」 |
| 6 | 标题循环使用上限 | `el-input-number` prop=`titleLoopNum` | **仅 LOOP 时显示**；`min=1`、**无 max**、`precision=0`（**controls 保持默认 true**）；数值后跟「 次 」 |
| 7 | （警告） | `div.ml16.fs12.text-warning.inline-block` + `i.mg-icon-warning` | `请勿将循环次数设置过高，以避免只选取1个标题应用到上千广告中，从而产生无效广告` |
| 8 | 账户面板 | `ClAccountList` | **仅「分账户选择」时渲染**（与手动页签不同） |
| 9 | 动态选取规则 | `DynamicArea` | 见 §4 |

### 3.2 校验文案（源码 `rules`）

| 字段 | 触发 | 文案 |
|---|---|---|
| `promotion_title_count` | blur | `请填写每个广告标题数量` |
| `titleSelectMethod` | change | `请选择标题分配方式` |
| `titleLoopNum` | change | `请填写标题循环使用上限` |
| 规则内 count | blur | `请填写每个广告标题数量，或删除多余规则` |
| 无规则 | 提交 | `请添加动态选取规则` |
| 规则合计超限 | 提交 | `每个广告标题数量不能超过10个，请注意多个规则标题分配。` |
| 分账户时 | 提交 | `【{账户名}】：{上述任一文案}` |

---

## 4. 动态选取规则区（`DynamicArea`）

- 头部：`动态选取规则` + （仅分账户且账户>1）`CopyToAccountsBtn`「复制到其他」+ 右侧 `el-button type=primary`「添加动态选取规则」
- **最多 2 条规则**（`maxRules` 默认 2）；达到上限后空态里的「点击添加」变 disabled
- 空态：`暂无动态选取规则，` + `el-link type=primary`「点击添加」
- 每条规则 = `DynamicRuleItem`：列「规则」+ 操作 `复制` / `编辑` / `删除`
- 删除确认：`MessageBox.confirm('是否删除该规则配置？', '提示')`
- 复制到其他账户：成功提示 `规则已复制到其他账户`；复制到选中账户：`规则已复制到选中的N个账户`
  - `CopyToAccountsBtn` 提示「至少需要两个」（少于 2 个账户时不可用）
- 规则表列（`dynamic-title-DGnKLaF3.js` 的列定义）：
  `标题选取模式` / `标题过滤条件` / `标题创建时间` / `每个广告标题数量`（仅分规则设置时出现）

### 4.1 规则编辑弹窗（`DynamicRuleConfig`）

实测：**不是弹窗，是右侧抽屉**（外层 `.el-drawer__wrapper.dynamic-rule-config` 占满 1920×1080，内层 `.el-drawer.rtl.custom-drawer` 实际 **width 1020px** 右对齐），
标题「动态选取规则」，内部 3 个 `FormPanel`，底部 `取消` / `确定`。

**① 标题信息（TitleInfo）**

| 字段 | 控件 | 选项/默认值 |
|---|---|---|
| 标题分类-定向 | `McCheckGroup` prop=`category_include.type` | `包含`(value=1) |
| （分类多选） | `filter-select` w360 | placeholder「请选择定向标题分类」，多选，`collapseTags`，`showLimit=50`，上限 10 |
| 标题分类-排除 | `McCheckGroup` prop=`category_exclude.type` | `包含`(1) |
| （分类多选） | `filter-select` w360 | placeholder「请选择排除标题分类」 |
| 标题过滤条件 | `McCheckGroup` multiple all-check w700 prop=`filter_conditions` | `不限`('') / `当日已使用`(exclude_today_is_used) / `建议次数`(suggestion_num, checked=1) / `拒审次数`(reject_num, checked=1) |
| ↳ 建议次数子项 | `el-form-item.sub-form-item--first` | `过滤建议次数大于` + `el-input.w80`(请输入) + `次的素材` |
| ↳ 拒审次数子项 | `el-form-item.sub-form-item` | `过滤拒审次数大于` + `el-input.w80` + `次的素材` |
| 标题创建时间 | `McCheckGroup` prop=`time_type` | `指定时间`(0) / `相对时间`(1) |
| ↳ 指定时间 | `el-date-picker` w360 daterange | range-separator「至」，「开始日期」「结束日期」，clearable=false，`yyyy-MM-dd`；默认 [今天-30天, 今天] |
| ↳ 相对时间 | `time_days` | `当日`(1) / `仅昨日`(-1) / `2·3·7·14·30·60·90 天内` |

**② 标题数据（TitleData）**
`数据指标`（`不限` + 消耗/点击量/点击率）+ 数值（number, placeholder「数值」）+ `数据时间`（`不限` + `3天内` / `90天内`）

**③ 标题选取方式（TitleSelect）**
`FormPanel title=标题选取方式`，`label-width` = 分规则设置 ? **140px** : **120px**

| 字段 | 控件 | 说明 |
|---|---|---|
| 选取模式 | `McCheckGroup` prop=`fetch_method` | `随机选择`(random) / `最新标题`(new) |
| ↳ 气泡 | `el-popover`(hover, right) + `mg-icon-question2` | `随机选择：所设条件下随机选取标题`<br>`最新标题：所设条件下优先选择最新创建的标题` |
| （提示条） | `el-alert.cl-simple-alert.is-primary` type=info show-icon | `当前每个广告标题总上限为10个，请注意多个规则标题分配。`（**仅分规则设置时显示**） |
| 每个广告标题数量 | `el-input-number` prop=`count` | `min=1 max=maxTitleCount step=1 precision=0 controls=false`（**仅分规则设置时显示**） |

---

## 5. 二级弹窗

### 5.1 新建 / 编辑 标题包（`title-package-dialog-k8RZ3W8r.js`）

实测 `el-dialog` `x=560 y=189 w=800 h=703`

- 标题：`添加标题包` / `编辑标题包` / `复制标题包`
- 字段：`标题包名称` → textarea，placeholder 动态 `请输入标题（{n}/{max}）`
- 按钮：`+插入动态词包`、`清空`
- 说明：`标题长度范围为5~55个字，添加多个标题请换行`
- 校验：`标题包最多只能有 {max} 个标题`
- 提交结果：`编辑后标题包数据将清零，按照新标题包重新统计` / `新建成功` / `编辑成功`

### 5.2 随机选择 / 智能优选 / 一键测新（`title-screen-dialog-ITBrOCXY.js`，共用一个弹窗）

实测 `el-dialog` `x=660 y=324 w=600 h=433`，`close-on-click-modal=false`，`close-on-press-escape=false`，`append-to-body`，`show-close=false`

| screenType | 标题 | 气泡 tip | 接口 |
|---|---|---|---|
| `random` | 随机选择 | 系统将在您设置的范围内随机选择对应数量的标题匹配广告 | `GET /Media/Title/getRandomTitles` |
| `smart` | 智能优选 | 智能优选会自动选择近期效果最好的标题，然后按照您设置的规则自动分组进行测试 | `GET /Media/Title/getSmartChoiceTitles` |
| `recent` | 一键测新 | 一键测新会自动选择近期文案库新创建的文案，然后按照您设置的规则自动分成标题包或直接匹配广告 | `GET /Media/Title/getRecentTitles` |

字段：

| 字段 | 控件 | 说明 |
|---|---|---|
| 选择分类 | `filter-select` w260 | `value-key=id` `label-key=label`，filterable/clearable/collapseTags |
| 标题创建时间 | `el-date-picker` w260 daterange | 至 / 开始日期 / 结束日期 |
| **数据时间** | select | **仅 smart**；`近30天/近15天/近7天/近3天`；smart 默认 30 |
| 选择标题数量 | `el-input` w260 prop=`limit_num` | |
| 计划内标题数上限 | `el-input` w260 prop=`pkgTitleNums` | 静态创意时 label 为「计划内标题数上限」；有固定标题时 label 变「每个标题包」且输入框 w120，后缀「N个新标题+N个固定标题」 |
| ↳ 气泡 | `el-popover` + `mg-icon-question2` | `即每个广告搭配的文案数量` |
| 排除今日已选中的标题 | `el-checkbox` true-label=1 false-label=0 | |

校验：
- `limit_num`：必填 >0 整数；「广告生成规则按创意组*标题包时，文案数量不得超过500」/「按创意组数时…不得超过2000」/「生成的标题包数量超过当前最大限制」
- `pkgTitleNums`：必填 >0 整数；`计划内{新标题数|标题数}上限为1-{10-fixTitleListLength}`；`ceil(limit_num/pkgTitleNums) > pkgLimit` → 「生成的标题包数量超过当前最大限制」

---

## 6. 接口契约（实测）

| 接口 | 方法 | 用途 |
|---|---|---|
| `Media/Title/listTitleCategory?page_size=9999` | GET | 标题分类（`title_category_id` / `name`） |
| `Media/Title/listPackage?keywords=&owner_user_id={uid}&page=1&page_size=10` | GET | 标题包列表 |
| `Media/Title/listTitle?owner_user_id={uid}&category=&keywords=&page=1&page_size=10` | GET | 标题库列表 |
| `User/AdminUser/getMyOptimizeUsersByModule?module_name=title_library&is_lock=` | GET | 优化师 |
| `Media/Title/getRandomTitles` / `getSmartChoiceTitles` / `getRecentTitles` | GET | 三个智能按钮 |
| `Media/Title/getRecentTitles`… | | 提交时携带 `exclude_title_ids` / `biz_type` |

请求参数（`getParams`）：`category`、`start_date`/`end_date`（由 daterange 拆出）、`data_time`（仅 smart）、`limit_num`、`exclude_today_is_used`、`exclude_title_ids`（固定标题 id 列表）、`biz_type`。

---

## 7. 与本地现有 spec 的差异（**必改**）

文件：`frontend/src/views/build/components/batch/spec/title.spec.js`

| # | 现有 spec | 线上真相 | 影响 |
|---|---|---|---|
| 1 | 标题来源只有 `TITLE_PACK` / `TITLE_LIB` | 还有 `materialName`「使用素材名称作为标题」、`originalVideoTitle`「投放原视频标题」 | 缺 2 个选项 + 「修改标题」子区块 |
| 2 | `assign_rule` 三选项在两个页签都可用 | **动态页签无「平均分配」** | 缺 visibleWhen |
| 3 | 账户面板「始终显示」 | 手动页签始终渲染但 **opacity=0**（非分账户时不可见）；动态页签**只在分账户时渲染** | 样式与显示逻辑都要改 |
| 4 | `loop_limit` `min:2 max:50` | `min=1`、**无上限**、controls 默认显示 | 数值错 |
| 5 | `dyn_count` `max:50` | `max=maxTitleCount(10)` | 数值错 |
| 6 | 「每个标题包」`visibleWhen title_source==='TITLE_LIB'` | 条件是 `titleSource!=='titlePackage' && showPackage && isNeedTitleLimit` | 条件表达要换 |
| 7 | 「复制到其他账户」disabled 静态写死 | `disabled = !rules.length`（无规则时禁用） | 应为动态 |
| 8 | 无「添加动态选取规则」上限 | **最多 2 条** | 缺 |
| 9 | 动态规则编辑面板未实现 | 是**全屏抽屉**（1920 宽），含 标题信息/标题数据/标题选取方式 三个 FormPanel | 整块缺失 |
| 10 | 无 新建标题包弹窗 | 800×703 弹窗，含「插入动态词包」「清空」 | 缺 |
| 11 | 无 随机选择/智能优选/一键测新弹窗 | 600×433 共用弹窗，3 种标题/tip/接口，smart 多一个「数据时间」 | 缺 |
| 12 | 工具条只写文案 | 副按钮是 `div.el-button`（radius **4px**），主按钮 radius **3px** | 样式细节 |
| 13 | 已选上限写死 | 由 props `maxTitlePackageCount` / `accountMaxTitlePackageCount` 决定（实测 193 / 200 / 20 随上下文变化） | 需参数化 |
| 14 | 表格列缺「标题库」态差异说明 | 标题库无「标题数」列、列名「标题名称」、操作列宽 160 | 已有，但需核对 |
| 15 | 无接口契约 | 见 §6 | mock 需要 |
| 16 | 无「标题分类-定向/排除」「过滤建议次数大于」等动态规则字段 | 见 §4 | 整块缺失 |

---

## 8. 产物索引（本目录）

| 文件 | 内容 |
|---|---|
| `title_01_manual_default.json` | 手动页签默认态全量结构+样式 |
| `title_02_dynamic.json` | 动态页签默认态 |
| `title_03_dynamic_loop.json` | 动态 + 循环使用标题（标题循环使用上限出现） |
| `title_04_dynamic_rulecount.json` | 动态 + 分规则设置（每广告标题数量隐藏） |
| `title_05_dynamic_account.json` | 动态 + 分账户选择（账户面板 + 复制到其他账户） |
| `title_06_dynamic_rule_drawer.json/.html` | 动态选取规则编辑抽屉（3 面板） |
| `title_07_manual_library.json` | 手动 + 标题库（每个标题包 / 创建者+分类 / 新建标题） |
| `title_08_new_package_dialog.json/.html` | 添加标题包弹窗 |
| `title_09_random_select.html`、`title_09_智能优选.html`、`title_09_一键测新.html` | 三个智能选择弹窗 |
| `title_10_manual_account.json` | 手动 + 分账户选择（账户面板 opacity=1） |

> 采集脚本：`C:/tmp/rea_src/`（bundle 抓取/检索）、`C:/tmp/cap_title.js`（DOM 抽取器）、`C:/tmp/cap_step.js`（交互助手）
> 线上 bundle 缓存：`C:/tmp/rea_src/scan/`（1570 个 JS 资源）
