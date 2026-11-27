/**
 * 标题包抽屉 —— 线上基准 spec
 *
 * 线上：https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *   → 预览表第 4 列「标题包」→「编辑」（表格第 4 个「编辑」按钮）
 *
 * 线上实测（2026-11-26 实测，1920×1080 视口，证据见 C:/tmp/verify/diff/）：
 *   diff/media_probe_online.json / diff/state_probe_online.json / diff/focus2_online.json
 *   diff/iconfont_glyphs.json（线上 iconfont 字形 → 内联 SVG）
 *
 *   外壳  .cl-drawer  x=904 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
 *   头部  .drawer-header  h=50  白底  padding 0 16px  下边框 1px #e8eaec
 *         头部里放的是「simple-tabs header-tabs」页签，**没有标题文字**
 *         页签：手动选取标题 / 动态选取标题   各 116×50，x=920 / x=1036
 *         文字 16px/700；激活 #197afb，未激活 #666；激活下划线 96×2 @ y=48
 *   内容  .drawer-content  x=920 y=66 w=984 h=944  白底 1px #e8eaec radius 3px padding 16px
 *   底部  .drawer-footer  x=904 y=1024 w=1016 h=56  白底 上边框 1px #e8eaec padding 12px 16px
 *         按钮：取 消 / 确 定   各 88×32  12px/500
 *   关闭键 .drawer-close  x=872 y=10 32×32
 *   表单   form.el-form  label 宽 160px（14px #666 lh32），右侧内容 margin-left 160px
 *
 * 线上行矩形（1920×1080 实测）：
 *   手动选取标题   标题来源 y=83 h=33 / 标题分配方式 y=140 h=57
 *                  每个标题包（标题来源=标题库）y=221 h=65
 *   动态选取标题   每个广告标题数量(模式) y=83 h=33 / 每个广告标题数量(数值) y=136 h=32
 *                  规则分配方式 y=188 h=57 / 选取标题不足时 y=265 h=33
 *
 * 依赖关系（线上逐项点击实测）：
 *   手动选取标题
 *     标题来源 = 标题库 → 表格整体换成标题库表格（列头 标题名称/…，无「标题数」列），
 *                     工具条主按钮「新建标题包」→「新建标题」，
 *                     新增「每个标题包」字段（2 个 el-input-number：新标题 / 固定标题），
 *                     说明行变为「新标题和固定标题的总和不能超过10个」，
 *                     筛选行「优化师」换成「创建者 / 分类」
 *     标题分配方式 = 平均分配 → 说明行「所有账户都使用一样的标题」→「标题平均分到每个账户中」
 *     标题分配方式 = 分账户选择 → 说明行→「每个账户单独选择标题」
 *   动态选取标题
 *     每个广告标题数量 = 分规则设置 → 「每个广告标题数量」数值行消失（只在规则里设置）
 *     规则分配方式 = 分账户选择 → 出现「复制到其他账户」（置灰），说明行→「每个账户单独选择规则」
 *     选取标题不足时 = 循环使用标题 → 出现「标题循环使用上限」+ 一条说明
 *
 * ------------------------------------------------------------------
 * 【2026-11-27 源码级复核】scrapling MCP 驱动真实 Chrome 抓线上 bundle，
 * 直接读生产构建源码（chunk `smart-assistant-BijJ3Xtm.js` 等），与 DOM 实测双向校验。
 * 完整取证报告：capture/online-title/SOURCE-FINDINGS.md
 * 证据：capture/online-title/title_01..10_*.json（DOM+样式实测）
 *
 * 源码级发现（DOM 抓取看不到 / 与旧结论不同）：
 *   ① 标题来源实际有 **4 个** radio（线上 DOM 只渲染 2 个，另两个受 props 开关控制）：
 *      titlePackage「标题包」/ titleLibrary「标题库」/
 *      materialName「使用素材名称作为标题」(showMaterialNameTitleSource，默认 false)/
 *      originalVideoTitle「投放原视频标题」(showOriginalVideoTitle，默认 false)。
 *      materialName 时表单换成「修改标题」区块（MaterialTitles 组件）。
 *   ② 标题分配方式的 options 由同一个 computed 生成，**动态页签没有「平均分配」**
 *      （`visible: !isDynamicTitle`），且 tips 文案随页签变（标题 / 规则）。
 *   ③ 账户面板：手动页签**始终渲染**，但 `opacity: +(titleSelectMethod==='ACCOUNT')`
 *      → 非「分账户选择」时不可见但占位 148px；动态页签则**只在分账户时渲染**。
 *   ④ 切换标题分配方式会 **清空已选标题包**（watch → handleChangeTitleSelectMethod）。
 *   ⑤ 「标题循环使用上限」线上是 `min=1`、**没有上限**、且 el-input-number 的
 *      controls 保持默认（+/- 可见）；旧 spec 写的 min:2 / max:50 与线上不符。
 *   ⑥ 动态页签「每个广告标题数量」上限是 maxTitleCount（10），不是 50。
 *   ⑦ 「每个标题包」的出现条件是 `titleSource!=='titlePackage' && showPackage && isNeedTitleLimit`。
 *   ⑧ 「复制到其他账户」是 `disabled = !rules.length`（没有规则时才置灰），不是常灰。
 *   ⑨ 动态选取规则 **最多 2 条**（maxRules 默认 2）；规则编辑是**全屏宽抽屉**
 *      （.el-drawer__wrapper.dynamic-rule-config，1920 宽），内含 3 个 FormPanel：
 *      标题信息 / 标题数据 / 标题选取方式。
 *   ⑩ 工具条三个副按钮是 `div.w120.el-button`（radius 4px），主按钮 radius 3px。
 *   ⑪ 「已选：n/N」的上限 N 由父组件 props 决定（线上实测 193 / 200 / 20 随上下文变化）。
 */

export default {
  id: 'title',
  title: '标题包',
  width: 1016,
  shell: 'cl-drawer',
  headerTabs: [
    { value: 'manual', label: '手动选取标题' },
    { value: 'dynamic', label: '动态选取标题' },
  ],
  defaultTab: 'manual',

  /** 线上实测几何（1920×1080 视口，抽屉右侧 1016px） */
  geometry: {
    drawer: { width: 1016, headerHeight: 50, contentMargin: 16, contentPadding: 16, contentHeight: 944 },
    labelWidth: 160,
    labelFontSize: '14px',
    labelColor: '#666',
    labelLineHeight: '32px',
    footer: { height: 56, buttonWidth: 88, buttonHeight: 32, buttonFontSize: '12px', gap: 16 },
    tabs: { itemWidth: 116, itemHeight: 50, fontSize: '16px', fontWeight: 700, activeColor: '#197afb', inactiveColor: '#666', activeBar: { width: 96, height: 2 } },
    /** 线上 el-radio-button__inner 计算样式 */
    radio: {
      minWidth: 80, height: 32, padding: '9px 12px', fontSize: '12px', radius: 3,
      color: '#606266', bg: '#fff', border: '#dcdfe6',
      activeBg: '#d6eaff', activeColor: '#197afb', activeBorder: '#197afb',
      disabledColor: '#c0c4cc', disabledBg: '#fff', disabledBorder: '#ebeef5',
    },
    /** 说明行（线上 .form-item-tips）：12px #999，行高 24px */
    tips: { fontSize: '12px', color: '#999', lineHeight: '24px' },
    table: { maxHeight: 505, selectionWidth: 50, nameWidth: 120 },
  },

  /**
   * 线上 iconfont 字形 → 内联 SVG path（本地无 iconfont 字体文件）
   * viewBox 统一 0 0 1024 1024（线上 upm = 1024）
   */
  icons: {
    question2: {
      d: 'M512 896Q616 896 711 856Q803 817 874.0 746.0Q945 675 984 583Q1024 488 1024.0 384.0Q1024 280 984 185Q945 93 874.0 22.0Q803 -49 711 -88Q616 -128 512.0 -128.0Q408 -128 313 -88Q221 -49 150.0 22.0Q79 93 40 185Q0 280 0.0 384.0Q0 488 40 583Q79 675 150.0 746.0Q221 817 313 856Q408 896 512 896ZM512 832Q390 832 286 771Q185 711 125 610Q64 506 64.0 384.0Q64 262 125 158Q185 57 286 -3Q390 -64 512.0 -64.0Q634 -64 738 -3Q839 57 899 158Q960 262 960.0 384.0Q960 506 899 610Q839 711 738 771Q634 832 512 832ZM543 264V277Q543 306 556 329Q566 349 587 368Q641 414 652 428Q681 466 681 521Q681 591 635.5 631.5Q590 672 515 672Q430 672 381.5 623.5Q333 575 333 491H414Q414 542 435 570Q458 602 510 602Q552 602 574.5 579.0Q597 556 597 516Q597 487 576 460L563 445Q491 382 476 350Q461 321 461 277V264ZM502 113Q525 113 542.0 129.0Q559 145 559.0 168.0Q559 191 543.0 207.0Q527 223 502.0 223.0Q477 223 463 207Q445 192 445.0 168.5Q445 145 463 129Q478 113 502 113Z',
      size: 12, color: '#999', marginLeft: 4,
    },
    plus: {
      d: 'M0 441H1024V327H0ZM569 896V-128H455V896Z',
      size: 12, color: '#fff', marginLeft: 4,
    },
    rightBig: {
      d: 'M512 896Q408 896 313 856Q221 817 150.0 746.0Q79 675 40 583Q0 488 0.0 384.0Q0 280 40 185Q79 94 150.0 23.0Q221 -48 313 -87Q408 -127 512.0 -127.0Q616 -127 711 -87Q803 -48 874.0 23.0Q945 94 984 185Q1024 280 1024.0 384.0Q1024 488 984 583Q945 675 874.0 746.0Q803 817 711 856Q616 896 512 896ZM512 -57Q392 -57 289 3Q189 62 130 162Q70 265 70.0 384.5Q70 504 130 607Q189 707 289 766Q392 826 512.0 826.0Q632 826 735 766Q835 707 894 607Q954 504 954.0 384.5Q954 265 894 162Q835 62 735 3Q632 -57 512 -57ZM734 534 463 263 313 412Q303 422 289.0 421.5Q275 421 265.0 411.0Q255 401 254.5 387.0Q254 373 264 363L438 189Q448 178 462.5 178.0Q477 178 487 189L783 485Q790 491 792.5 500.0Q795 509 792.5 518.0Q790 527 783.5 533.5Q777 540 768.0 542.5Q759 545 750.0 542.5Q741 540 734 534Z',
      size: 14, color: '#197afb',
    },
  },

  /**
   * 抽屉内表单值（线上默认值）；组件用 reactive(spec.values) 初始化。
   */
  values: {
    title_source: 'TITLE_PACK',
    assign_rule: 'REUSE',
    new_title_count: '10',
    fixed_title_count: '0',
    dyn_count_mode: 'SAME',
    dyn_count: '1',
    dyn_rule_match: 'REUSE',
    dyn_shortage: 'SKIP',
    loop_limit: '2',
    dyn_rule_count: 0,
  },

  tabs: [
    /* ============================================================
     * ① 手动选取标题
     * ========================================================== */
    {
      value: 'manual',
      label: '手动选取标题',
      sections: [
        {
          key: 'title_settings',
          title: '',
          fields: [
            {
              key: 'title_source',
              label: '标题来源',
              type: 'radio',
              default: 'TITLE_PACK',
              rowHeight: 33,
              gapAfter: 24,
              options: [
                { value: 'TITLE_PACK', label: '标题包' },
                { value: 'TITLE_LIB', label: '标题库' },
                // 线上源码里还有 2 个选项，受 props 开关控制，默认不显示。
                // flag 为空 → 恒显示；flag 非空 → 仅当父组件开启对应开关时才渲染。
                { value: 'MATERIAL_NAME', label: '使用素材名称作为标题', flag: 'showMaterialNameTitleSource' },
                { value: 'ORIGINAL_VIDEO_TITLE', label: '投放原视频标题', flag: 'showOriginalVideoTitle' },
              ],
              /** materialName 时的行末说明（线上 <p class="form-item-tips">） */
              materialNameTips: '每个广告优先使用前10个视频素材的名称作为标题（达人/抖音号主页视频将优先使用视频原标题）。',
              note: '线上 label 宽 160px；el-radio-button__inner min-width 80px。'
                + '源码实测共 4 个 radio-button：titlePackage(showTitlePackageSource) / titleLibrary(恒显示) / '
                + 'materialName(showMaterialNameTitleSource,默认 false) / originalVideoTitle(showOriginalVideoTitle,默认 false)',
            },
            {
              key: 'assign_rule',
              label: '标题分配方式',
              type: 'radio',
              default: 'REUSE',
              rowHeight: 57,
              gapAfter: 24,
              options: [
                { value: 'REUSE', label: '全账户复用', desc: '所有账户都使用一样的标题' },
                { value: 'AVERAGE', label: '平均分配', desc: '标题平均分到每个账户中', visibleInTabs: ['manual'] },
                { value: 'PER_ACCOUNT', label: '分账户选择', desc: '每个账户单独选择标题' },
              ],
              optionBubble: [
                { value: 'REUSE', text: '所有账户都使用一样的标题' },
                { value: 'AVERAGE', text: '标题平均分到每个账户中' },
                { value: 'PER_ACCOUNT', text: '每个账户单独选择标题' },
              ],
              tip: '所有账户都使用一样的标题',
              note: '线上三个选项各自带 mg-icon-question2 12×13 #999 气泡（选项文字后），'
                + '下方有一行 form-item-tips 说明（12px #999，行高 24px），随选中项变化。'
                + '源码：options 由同一个 computed 生成，tips 文案随页签变（标题/规则），'
                + '且「平均分配」visible: !isDynamicTitle → 动态页签只有 2 个选项。'
                + 'watch config.titleSelectMethod → 切换分配方式会清空已选标题包',
            },
            {
              key: 'title_pack_count',
              label: '每个标题包',
              type: 'custom',
              visibleWhen: { field: 'title_source', neq: 'TITLE_PACK' },
              rowHeight: 65,
              newTitleMax: 10,
              newTitleDefault: 10,
              fixedTitleMax: 9,
              fixedTitleDefault: 0,
              newTitleLabel: '新标题',
              fixedTitleLabel: '固定标题',
              tip: '新标题和固定标题的总和不能超过10个',
              note: '线上出现条件（源码）：titleSource !== "titlePackage" && showPackage && isNeedTitleLimit；'
                + '两个 el-input-number（宽 70px，min 1 / min 0，max 10 / max 9，precision 0，controls 关闭，size mini）：'
                + '「N个新标题」「N个固定标题」，默认 10 / 0；说明行 form-item-tips 12px #999；'
                + '两者之和超过 maxTitleCount 时互相扣减（handleTitleBlur）',
            },
            {
              key: 'account_panel',
              label: '',
              type: 'accountPanel',
              width: 148,
              /** 线上：非「分账户选择」时 opacity=0（元素仍在 DOM、占位，但不可见） */
              opacityWhen: { field: 'assign_rule', neq: 'PER_ACCOUNT' },
              opacity: 0,
              note: '线上左侧账户面板 **始终渲染**（.account-panel 实测 x=937 w=148 h=588，'
                + '右侧列表起点 x=1097）；源码 `style="opacity: +(titleSelectMethod===\'ACCOUNT\')"` '
                + '→ 非「分账户选择」时 opacity=0（占位但不可见）；'
                + '每个账户右侧 mg-icon-right-big 14×32 勾选标记（选中 #197afb，未选中 #333）。'
                + '注意：动态页签的账户面板是 v-if（只在分账户选择时渲染），与手动页签不同',
            },
            {
              key: 'title_pack_list',
              label: '',
              type: 'titlePackList',
              note: '线上：右侧筛选行 + 工具条 + 表格 + 分页',
            },
          ],
        },
      ],
      /** 筛选行（线上 mg-filter-wrapper） */
      filter: {
        optimizer: {
          label: '优化师',
          type: 'select',
          placeholder: '所有优化师',
          width: 167,
          visibleWhen: { field: 'title_source', eq: 'TITLE_PACK' },
          note: '线上：标题来源 = 标题包 时的筛选：优化师 / 拒审次数 / 建议次数 / 关键词 / 清空',
        },
        creator: {
          label: '创建者',
          type: 'select',
          placeholder: '所有创建者',
          width: 167,
          visibleWhen: { field: 'title_source', eq: 'TITLE_LIB' },
          note: '线上：标题来源 = 标题库 时「优化师」换成「创建者」',
        },
        category: {
          label: '分类',
          type: 'select',
          placeholder: '全部',
          width: 119,
          visibleWhen: { field: 'title_source', eq: 'TITLE_LIB' },
          note: '线上：标题来源 = 标题库 时新增「分类」多选下拉（宽 119px）',
        },
        reject_count: {
          label: '拒审次数',
          type: 'compare',
          opWidth: 99,
          valueWidth: 101,
          opOptions: ['大于', '大于或等于', '等于', '小于或等于', '小于'],
          defaultOp: '小于或等于',
          defaultValue: '',
        },
        suggest_count: {
          label: '建议次数',
          type: 'compare',
          opWidth: 99,
          valueWidth: 101,
          opOptions: ['大于', '大于或等于', '等于', '小于或等于', '小于'],
          defaultOp: '小于或等于',
          defaultValue: '',
        },
        keyword: {
          type: 'input',
          placeholder: '请输入关键词',
          width: 240,
        },
        clear: { type: 'link', text: '清空' },
      },
      /** 工具条（线上 table-toolbar） */
      toolbar: {
        buttons: ['新建标题包', '随机选择', '智能优选', '一键测新'],
        primaryButtons: ['新建标题包'],
        /** 标题来源 = 标题库 时主按钮改名 */
        primaryButtonRename: { '新建标题包': '新建标题' },
        primaryIcon: 'plus',
        selectedText: '已选：{n}/{limit}',
        note: '线上：新建标题包 120×32 主色带 + 前置 mg-icon-plus 12×13 白；'
          + '随机选择/智能优选/一键测新 120×32 白底描边；右侧「已选：0/200」',
      },
      /** 表格列（线上 12 列：多选 + 10 列 + 操作） */
      table: {
        maxHeight: 505,
        columns: [
          { key: '__selection', type: 'selection', width: 50 },
          { key: 'name', label: '标题包名称', width: 120, fixed: true },
          { key: 'reject', label: '拒审次数', width: 80, align: 'center' },
          { key: 'suggest', label: '建议次数', width: 80, align: 'center' },
          { key: 'creator', label: '创建者', width: 100 },
          { key: 'ctr3', label: '近3日点击率', width: 110, align: 'center', sortable: true },
          { key: 'cost3', label: '近3日消耗', width: 110, align: 'center', sortable: true },
          { key: 'ctr90', label: '近90天点击率', width: 120, align: 'center', sortable: true },
          { key: 'cost90', label: '近90天消耗', width: 110, align: 'center', sortable: true },
          { key: 'count', label: '标题数', width: 80, align: 'center' },
          { key: 'created', label: '创建时间', width: 150, sortable: true },
          { key: 'op', label: '操作', width: 80, align: 'center', fixed: 'right' },
        ],
      },
      /** 标题来源 = 标题库 时的表格列（无线上「标题数」列，多「标题名称」/「操作」） */
      titleLibTable: {
        columns: [
          { key: '__selection', type: 'selection', width: 50 },
          { key: 'name', label: '标题名称', width: 160 },
          { key: 'reject', label: '拒审次数', width: 76, align: 'center' },
          { key: 'suggest', label: '建议次数', width: 76, align: 'center' },
          { key: 'creator', label: '创建者', width: 96 },
          { key: 'ctr3', label: '近3日点击率', width: 100, align: 'center' },
          { key: 'cost3', label: '近3日消耗', width: 96, align: 'center' },
          { key: 'ctr90', label: '近90天点击率', width: 110, align: 'center' },
          { key: 'cost90', label: '近90天消耗', width: 100, align: 'center' },
          { key: 'created', label: '创建时间', width: 130 },
          { key: 'op', label: '操作', width: 160, align: 'center', fixed: 'right' },
        ],
        tip: '新标题和固定标题的总和不能超过10个',
      },
      pagination: { layout: 'total, sizes, prev, pager, next, jumper', pageSizes: [10, 20, 50, 100], pagerCount: 5 },
    },

    /* ============================================================
     * ② 动态选取标题
     * ========================================================== */
    {
      value: 'dynamic',
      label: '动态选取标题',
      sections: [
        {
          key: 'title_settings',
          title: '',
          fields: [
            {
              key: 'dyn_count_mode',
              label: '每个广告标题数量',
              type: 'radio',
              default: 'SAME',
              rowHeight: 33,
              gapAfter: 20,
              options: [
                { value: 'SAME', label: '统一设置' },
                { value: 'RULE', label: '分规则设置' },
              ],
            },
            {
              key: 'dyn_count',
              label: '每个广告标题数量',
              type: 'number',
              default: 1,
              min: 1,
              max: 10,
              width: 130,
              rowHeight: 32,
              gapAfter: 20,
              visibleWhen: { field: 'dyn_count_mode', eq: 'SAME' },
              note: '线上：分规则设置 时该数值框隐藏（改为在每条规则里设置）；'
                + 'el-input-number 实测 min=1 max=maxTitleCount(10) step=1 precision=0 controls=false',
            },
            {
              key: 'dyn_rule_match',
              label: '规则分配方式',
              type: 'radio',
              default: 'REUSE',
              rowHeight: 57,
              gapAfter: 20,
              options: [
                { value: 'REUSE', label: '全账户复用', desc: '所有账户都使用一样的规则' },
                { value: 'PER_ACCOUNT', label: '分账户选择', desc: '每个账户单独选择规则' },
              ],
              optionBubble: [
                { value: 'REUSE', text: '所有账户都使用一样的规则' },
                { value: 'PER_ACCOUNT', text: '每个账户单独选择规则' },
              ],
              tip: '所有账户都使用一样的规则',
              note: '线上：规则分配方式 = 分账户选择 时出现「复制到其他账户」（置灰）',
            },
            {
              key: 'copy_to_other_account',
              label: '',
              type: 'button',
              text: '复制到其他账户',
              visibleWhen: { field: 'dyn_rule_match', eq: 'PER_ACCOUNT' },
              disabledWhen: { field: 'dyn_rule_count', eq: 0 },
              note: '线上：规则分配方式 = 分账户选择 时出现；'
                + '源码 CopyToAccountsBtn `disabled: !rules.length` → **没有规则时置灰**，有规则后可点；'
                + '成功提示「规则已复制到其他账户」/「规则已复制到选中的N个账户」；'
                + '少于 2 个账户时不可用（「至少需要两个」）',
            },
            {
              key: 'dyn_shortage',
              label: '选取标题不足时',
              type: 'radio',
              default: 'SKIP',
              rowHeight: 33,
              gapAfter: 20,
              options: [
                { value: 'SKIP', label: '余量广告不搭建' },
                { value: 'LOOP', label: '循环使用标题' },
              ],
            },
            {
              key: 'loop_limit',
              label: '标题循环使用上限',
              type: 'number',
              default: 2,
              min: 1,
              rowHeight: 33,
              unit: '次',
              visibleWhen: { field: 'dyn_shortage', eq: 'LOOP' },
              tips: ['请勿将循环次数设置过高，以避免只选取1个标题应用到上千广告中，从而产生无效广告'],
              note: '线上：选取标题不足时 = 循环使用标题 时新增此字段 + 一条说明（数值后带「次」）。'
                + '源码实测 el-input-number **min=1、没有 max**、precision=0（controls 保持默认可见）；'
                + '警告行是 div.ml16.fs12.text-warning.inline-block + i.mg-icon-warning。'
                + '旧 spec 写的 min:2 / max:50 与线上不符，已修正',
            },
            {
              key: 'account_panel',
              label: '',
              type: 'accountPanel',
              width: 148,
              visibleWhen: { field: 'dyn_rule_match', eq: 'PER_ACCOUNT' },
              note: '线上：动态选取标题页签在「规则分配方式 = 分账户选择」时，'
                + '表单下方出现账户列表（红果-央广-199 / 198 / 197 / 196 …）',
            },
          ],
        },
        {
          key: 'dynamic_rules',
          title: '动态选取规则',
          fields: [
            {
              key: 'dyn_rules',
              label: '',
              type: 'dynamicRules',
              emptyText: '暂无动态选取规则， 点击添加',
              maxRules: 2,
              ruleColumns: ['标题选取模式', '标题过滤条件', '标题创建时间', '每个广告标题数量'],
              ruleActions: ['复制', '编辑', '删除'],
              note: '线上：工具条「添加动态选取规则」，空态「暂无动态选取规则， 点击添加」。'
                + '源码 DynamicArea maxRules 默认 **2** → 最多 2 条规则，达到上限空态「点击添加」置灰；'
                + '每条规则操作：复制 / 编辑 / 删除，删除前 MessageBox 确认「是否删除该规则配置？」；'
                + '「每个广告标题数量」列仅在「分规则设置」时出现',
            },
          ],
        },
      ],
      toolbar: ['添加动态选取规则'],
    },
  ],

  footer: { buttons: ['取消', '确定'], cancelText: '取 消', okText: '确 定' },

  /* ==================================================================
   * 【2026-11-27 源码级取证新增】以下结构旧 spec 完全没有
   * 证据：capture/online-title/SOURCE-FINDINGS.md §3.4 / §4 / §5 / §6
   * ================================================================== */

  /**
   * 「添加动态选取规则」打开的是**右侧抽屉**（不是弹窗）：
   *   外层 .el-drawer__wrapper.dynamic-rule-config 占满 1920×1080
   *   内层 .el-drawer.rtl.custom-drawer 实际 width=1020px，右对齐
   * 内部 3 个 FormPanel（.form-panel），底部 .custom-drawer__footer 取消 / 确定。
   */
  dynamicRuleEditor: {
    shell: 'el-drawer-right',
    title: '动态选取规则',
    width: 1020,
    panels: [
      {
        key: 'title_info',
        title: '标题信息',
        fields: [
          { key: 'category_include_type', label: '标题分类-定向', type: 'radio', options: [{ value: 1, label: '包含' }], default: 1 },
          { key: 'category_include_ids', label: '', type: 'multiSelect', placeholder: '请选择定向标题分类', width: 360, multipleLimit: 10, collapseTags: true, showLimit: 50 },
          { key: 'category_exclude_type', label: '标题分类-排除', type: 'radio', options: [{ value: 1, label: '包含' }], default: 1 },
          { key: 'category_exclude_ids', label: '', type: 'multiSelect', placeholder: '请选择排除标题分类', width: 360, multipleLimit: 10, collapseTags: true, showLimit: 50 },
          {
            key: 'filter_conditions',
            label: '标题过滤条件',
            type: 'checkbox',
            multiple: true,
            allCheck: true,
            width: 700,
            options: [
              { value: '', label: '不限' },
              { value: 'exclude_today_is_used', label: '当日已使用' },
              { value: 'suggestion_num', label: '建议次数', checkedValue: 1, unchecked: '' },
              { value: 'reject_num', label: '拒审次数', checkedValue: 1, unchecked: '' },
            ],
            default: [''],
          },
          { key: 'suggestion_num', label: '', type: 'number', visibleWhen: { field: 'filter_conditions', in: ['suggestion_num'] }, prefix: '过滤建议次数大于', suffix: '次的素材', placeholder: '请输入', width: 80, subFormItem: 'sub-form-item--first' },
          { key: 'reject_num', label: '', type: 'number', visibleWhen: { field: 'filter_conditions', in: ['reject_num'] }, prefix: '过滤拒审次数大于', suffix: '次的素材', placeholder: '请输入', width: 80, subFormItem: 'sub-form-item' },
          { key: 'time_type', label: '标题创建时间', type: 'radio', options: [{ value: 0, label: '指定时间' }, { value: 1, label: '相对时间' }], default: 0 },
          {
            key: 'start_time',
            label: '',
            type: 'dateRange',
            visibleWhen: { field: 'time_type', eq: 0 },
            width: 360,
            rangeSeparator: '至',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            clearable: false,
            valueFormat: 'yyyy-MM-dd',
            default: ['今天-30天', '今天'],
          },
          {
            key: 'time_days',
            label: '',
            type: 'radio',
            visibleWhen: { field: 'time_type', eq: 1 },
            default: 7,
            options: [
              { value: 1, label: '当日' },
              { value: -1, label: '仅昨日' },
              { value: 2, label: '2天内' },
              { value: 3, label: '3天内' },
              { value: 7, label: '7天内' },
              { value: 14, label: '14天内' },
              { value: 30, label: '30天内' },
              { value: 60, label: '60天内' },
              { value: 90, label: '90天内' },
            ],
          },
        ],
      },
      {
        key: 'title_data',
        title: '标题数据',
        fields: [
          { key: 'select_kpis', label: '数据指标', type: 'multiSelect', placeholder: '不限', options: [{ value: 'stat_cost', label: '消耗' }, { value: 'click_cnt', label: '点击量' }, { value: 'click_rate', label: '点击率' }], default: [''] },
          { key: 'quota_value', label: '数值', type: 'number', placeholder: '数值', compareOptions: [{ value: '>=', label: '大于等于' }, { value: '<=', label: '小于等于' }], defaultCompare: '大于等于' },
          { key: 'data_last_day', label: '数据时间', type: 'radio', placeholder: '不限', options: [{ value: 3, label: '3天内' }, { value: 90, label: '90天内' }], default: '' },
        ],
      },
      {
        key: 'title_select',
        title: '标题选取方式',
        /** label-width：分规则设置 140px / 统一设置 120px */
        labelWidth: { rule: 140, same: 120 },
        fields: [
          {
            key: 'fetch_method',
            label: '选取模式',
            type: 'radio',
            default: 'random',
            options: [
              { value: 'random', label: '随机选择' },
              { value: 'new', label: '最新标题' },
            ],
            bubble: {
              trigger: 'hover',
              placement: 'right',
              paragraphs: ['随机选择：所设条件下随机选取标题', '最新标题：所设条件下优先选择最新创建的标题'],
            },
          },
          {
            key: 'count',
            label: '每个广告标题数量',
            type: 'number',
            visibleWhen: { field: 'isDynamicRuleCount', eq: true },
            min: 1,
            max: 10,
            step: 1,
            precision: 0,
            controls: false,
          },
        ],
        alert: {
          visibleWhen: { field: 'isDynamicRuleCount', eq: true },
          cls: 'cl-simple-alert is-primary',
          type: 'info',
          showIcon: true,
          closable: false,
          text: '当前每个广告标题总上限为10个，请注意多个规则标题分配。',
        },
      },
    ],
    footer: { buttons: ['取消', '确定'] },
    /** 校验文案（源码 rules） */
    validation: {
      start_time: '请选择标题创建时间',
      time_days: '请选择标题创建时间',
      count: '请填写每个广告标题数量',
      noRule: '请添加动态选取规则',
      ruleCountEmpty: '请填写每个广告标题数量，或删除多余规则',
      countOverflow: '每个广告标题数量不能超过10个，请注意多个规则标题分配。',
      accountPrefix: '【{账户名}】：{文案}',
    },
  },

  /**
   * 工具条三个副按钮 + 主按钮打开的弹窗。
   * 线上实测：副按钮是 `div.w120.el-button`（data-type=random/smart/recent），三者共用一个弹窗。
   */
  subDialogs: [
    {
      key: 'new_title_package',
      label: '新建标题包',
      trigger: 'toolbar.primary',
      shell: 'el-dialog',
      width: 800,
      height: 703,
      rect: { x: 560, y: 189 },
      title: '添加标题包',
      titles: ['添加标题包', '编辑标题包', '复制标题包'],
      fields: [
        { key: 'title_package_name', label: '标题包名称', type: 'textarea', placeholder: '请输入标题（{n}/{max}）', minLength: 5, maxLength: 55 },
      ],
      buttons: ['+插入动态词包', '清空'],
      tip: '标题长度范围为5~55个字，添加多个标题请换行',
      counter: true,
      footer: { buttons: ['取消', '确定'] },
      validation: { max: '标题包最多只能有{max}个标题' },
      success: ['新建成功', '编辑成功', '编辑后标题包数据将清零，按照新标题包重新统计'],
    },
    {
      key: 'title_screen_dialog',
      label: '随机选择 / 智能优选 / 一键测新',
      trigger: 'toolbar.secondary',
      shell: 'el-dialog',
      width: 600,
      height: 433,
      rect: { x: 660, y: 324 },
      closeOnClickModal: false,
      closeOnPressEscape: false,
      appendToBody: true,
      showClose: false,
      variants: {
        random: {
          title: '随机选择',
          tip: '系统将在您设置的范围内随机选择对应数量的标题匹配广告',
          api: '/Media/Title/getRandomTitles',
          dataType: 'random',
          fields: ['category', 'daterange', 'limit_num', 'pkgTitleNums', 'exclude_today_is_used'],
        },
        smart: {
          title: '智能优选',
          tip: '智能优选会自动选择近期效果最好的标题，然后按照您设置的规则自动分组进行测试',
          api: '/Media/Title/getSmartChoiceTitles',
          dataType: 'smart',
          fields: ['category', 'daterange', 'data_time', 'limit_num', 'pkgTitleNums', 'exclude_today_is_used'],
        },
        recent: {
          title: '一键测新',
          tip: '一键测新会自动选择近期文案库新创建的文案，然后按照您设置的规则自动分成标题包或直接匹配广告',
          api: '/Media/Title/getRecentTitles',
          dataType: 'recent',
          fields: ['category', 'daterange', 'limit_num', 'pkgTitleNums', 'exclude_today_is_used'],
        },
      },
      fields: [
        { key: 'category', label: '选择分类', type: 'multiSelect', width: 260, valueKey: 'id', labelKey: 'label', filterable: true, clearable: true, collapseTags: true },
        { key: 'daterange', label: '标题创建时间', type: 'dateRange', width: 260, rangeSeparator: '至' },
        { key: 'data_time', label: '数据时间', type: 'radio', onlyVariants: ['smart'], default: 30, options: [{ value: 30, label: '近30天' }, { value: 15, label: '近15天' }, { value: 7, label: '近7天' }, { value: 3, label: '近3天' }] },
        { key: 'limit_num', label: '选择标题数量', type: 'input', width: 260 },
        { key: 'pkgTitleNums', label: '计划内标题数上限', type: 'input', width: 260, altLabel: '每个标题包', altWidth: 120, altSuffix: '{n}个新标题+{m}个固定标题', bubble: '即每个广告搭配的文案数量' },
        { key: 'exclude_today_is_used', label: '', type: 'checkbox', text: '排除今日已选中的标题', trueLabel: 1, falseLabel: 0 },
      ],
      footer: { buttons: ['取消', '确定'] },
      validation: {
        limit_num: ['请输入大于0整数', '输入不能为空', '广告生成规则按创意组*标题包时，文案数量不得超过500', '广告生成规则按创意组数时，文案数量不得超过2000', '生成的标题包数量超过当前最大限制'],
        pkgTitleNums: ['请输入大于0整数', '输入不能为空', '计划内{新标题数|标题数}上限为1-{max}', '生成的标题包数量超过当前最大限制'],
      },
    },
  ],

  /** 接口契约（线上实测，mock 用） */
  apiContracts: [
    { method: 'GET', path: '/Media/Title/listTitleCategory', query: { page_size: 9999 }, desc: '标题分类（title_category_id / name）' },
    { method: 'GET', path: '/Media/Title/listPackage', query: { keywords: '', owner_user_id: '{uid}', page: 1, page_size: 10 }, desc: '标题包列表' },
    { method: 'GET', path: '/Media/Title/listTitle', query: { owner_user_id: '{uid}', category: '', keywords: '', page: 1, page_size: 10 }, desc: '标题库列表' },
    { method: 'GET', path: '/User/AdminUser/getMyOptimizeUsersByModule', query: { module_name: 'title_library', is_lock: '' }, desc: '优化师（user_id / user_name_alias）' },
    { method: 'GET', path: '/Media/Title/getRandomTitles', desc: '随机选择' },
    { method: 'GET', path: '/Media/Title/getSmartChoiceTitles', desc: '智能优选' },
    { method: 'GET', path: '/Media/Title/getRecentTitles', desc: '一键测新' },
  ],

  /** 线上 props（父组件下发，决定开关与上限） */
  onlineProps: {
    showPackage: true,
    showTitlePackageSource: true,
    showMaterialNameTitleSource: false,
    showOriginalVideoTitle: false,
    isNeedTitleLimit: true,
    maxTitleCount: 10,
    maxTitlePackageCount: '动态（实测 193 / 200 / 20）',
    accountMaxTitlePackageCount: '动态',
    isSupportAutoCreation: '决定「动态选取标题」页签是否显示',
  },
};
