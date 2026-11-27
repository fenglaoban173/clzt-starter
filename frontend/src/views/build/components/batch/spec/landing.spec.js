/**
 * 落地页抽屉 —— 线上基准 spec
 *
 * 线上：https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *   → 预览表第 5 列「落地页」→「编辑」（表格第 5 个「编辑」按钮）
 *
 * 线上实测（2026-11-26 实测，1920×1080 视口，证据见 C:/tmp/verify/diff/）：
 *   diff/media_probe_online.json / diff/state_probe_online.json / diff/focus2_online.json
 *   diff/iconfont_glyphs.json（线上 iconfont 字形 → 内联 SVG）
 *
 *   外壳  .cl-drawer  x=904 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
 *   头部  .drawer-header  x=904 y=0 w=1016 h=49  白底  padding 0 16px  下边框 1px #e8eaec
 *         头部标题 .header-title「选择落地页」16px/700/#333 lh48
 *   内容  .drawer-content  x=920 y=65 w=984 h=932  白底 1px #e8eaec radius 3px padding 16px
 *   底部  .drawer-footer  x=904 y=1010 w=1016 h=70  白底 上边框 1px #e8eaec padding 12px 16px 24px
 *         按钮：取 消 / 确 定   各 88×32  12px/500
 *   关闭键 .drawer-close  x=872 y=10 32×32
 *   表单   form.el-form.content-table.el-form--label-left
 *         label 宽 140px（14px #666 lh32），右侧内容 margin-left 140px
 *
 * 线上行矩形（1920×1080 实测）：
 *   每个广告配置   y=82  h=32（输入框 80×32 + 后缀「个落地页链接」，mr8）
 *   落地页类型     y=138 h=33（无说明行）/ h=57（有说明行，说明行 form-item-tips 12px #999 h24）
 *   落地页分配方式 y=195（手动填写）/ 219（有说明行的类型）/ 276（第三方落地页，前面多一行选择方式）h=33
 *   落地页选择方式 y=219 h=33（仅第三方落地页）
 *   输入落地页     y=244 h=32（输入框 500×32，placeholder「请输入落地页」）
 *
 * 依赖关系（线上逐项点击实测，focus2_online.json）：
 *   落地页类型（默认「手动填写」）
 *     手动填写     → 出现「输入落地页」；分配方式只有【全部相同 / 按账户分配】；无说明行
 *     橙子落地页   → 「输入落地页」消失；出现说明行；分配方式多出【按项目分配 / 按广告分配】
 *     橙子建站模板 → 「输入落地页」消失；出现说明行；分配方式**去掉「全部相同」**，
 *                    只剩【按账户分配 / 按项目分配 / 按广告分配】（自动回退选中「按账户分配」）
 *     智投落地页模板 → 「输入落地页」消失；**无说明行**；分配方式【全部相同 / 按账户分配 / 按项目分配 / 按广告分配】
 *     第三方落地页 → 「输入落地页」消失；出现说明行 +「落地页选择方式」【手动选择 / 自动选择】（默认手动选择）
 *     动态链接生成 → 线上当前账号下**置灰**（推广目的不支持）
 *     商品库链接   → 线上当前账号下**置灰**（推广目的不支持）
 *   落地页分配方式
 *     按账户分配 → 出现「复制到其他账户」按钮（el-button--text el-button--small）
 *
 * 注：置灰集合随「投放内容 / 推广目的」变化。2026-11-26 实测当前账号为
 *     【动态链接生成 / 商品库链接】置灰（早前一次采集为【智投落地页模板 / 商品库链接】置灰）。
 *     这里按最新实测值记录。
 */

export default {
  id: 'landing',
  title: '选择落地页',
  width: 1016,
  shell: 'cl-drawer',
  /** 线上落地页抽屉头部是标题文字，不是页签 */
  headerTitle: '选择落地页',

  /** 线上实测几何（1920×1080 视口，抽屉右侧 1016px） */
  geometry: {
    drawer: { width: 1016, headerHeight: 49, contentMargin: 16, contentPadding: 16, contentHeight: 932 },
    labelWidth: 140,
    labelFontSize: '14px',
    labelColor: '#666',
    labelLineHeight: '32px',
    footer: { height: 70, buttonWidth: 88, buttonHeight: 32, buttonFontSize: '12px', gap: 16 },
    headerTitle: { fontSize: '16px', fontWeight: 700, color: '#333', lineHeight: '48px' },
    /** 线上 el-radio-button__inner 计算样式 */
    radio: {
      minWidth: 80, height: 32, padding: '9px 12px', fontSize: '12px', radius: 3,
      color: '#606266', bg: '#fff', border: '#dcdfe6',
      activeBg: '#d6eaff', activeColor: '#197afb', activeBorder: '#197afb',
      disabledColor: '#c0c4cc', disabledBg: '#fff', disabledBorder: '#ebeef5',
    },
    /** 说明行（线上 .form-item-tips）：12px #999，行高 24px */
    tips: { fontSize: '12px', color: '#999', lineHeight: '24px' },
  },

  /**
   * 线上 iconfont 字形 → 内联 SVG path（本地无 iconfont 字体文件）
   * viewBox 统一 0 0 1024 1024（线上 upm = 1024）
   */
  icons: {
    quickselect: {
      d: 'M688 800Q707 800 715.5 785.5Q724 771 718.0 755.5Q712 740 695 737L688 736H123Q114 736 106.0 729.5Q98 723 96 713V709V-4Q96 -14 102.5 -22.0Q109 -30 119 -31L123 -32H836Q846 -32 854.0 -25.5Q862 -19 863 -9L864 -4V263L865 270Q867 286 881.5 292.0Q896 298 910.5 292.0Q925 286 927 270L928 263V-5Q928 -40 904.0 -66.0Q880 -92 845 -96H836H124Q88 -96 62.0 -72.5Q36 -49 33 -13L32 -5V708Q32 744 56.0 770.0Q80 796 115 799L123 800ZM323 454Q333 463 346.0 463.0Q359 463 368 454L527 295L911 680Q921 689 934.0 689.0Q947 689 956.5 679.5Q966 670 966.0 657.0Q966 644 957 634L550 227Q540 218 527.0 218.0Q514 218 504 227L323 408Q314 418 314.0 431.0Q314 444 323 454Z',
      size: 12, color: '#606266', marginLeft: 4,
    },
    refreshRight: {
      d: 'M721 453 671 483Q660 490 647.0 487.0Q634 484 627.5 472.5Q621 461 624.0 448.0Q627 435 638 428L776 345L859 484Q866 496 863.0 508.5Q860 521 848.5 528.0Q837 535 824.5 531.5Q812 528 805 517L780 475Q760 544 713.0 597.0Q666 650 601 678Q521 712 437 701Q354 691 288 640Q219 589 185.5 509.0Q152 429 163 343Q173 260 223 193Q274 123 353 89Q410 65 471.5 64.0Q533 63 590.5 85.0Q648 107 693 150Q703 159 703.0 172.5Q703 186 694.5 195.5Q686 205 672.5 205.5Q659 206 650 197Q595 145 521.0 132.0Q447 119 378 148Q314 175 274.0 230.0Q234 285 225.5 352.5Q217 420 243.5 484.0Q270 548 324.5 588.5Q379 629 445.5 638.0Q512 647 576 620Q629 597 667.0 553.0Q705 509 721 453Z',
      size: 12, color: '#197afb', marginLeft: 4,
    },
  },

  /** 抽屉内表单值（线上默认值）；组件用 reactive(spec.values) 初始化 */
  values: {
    per_ad_count: '1',
    landing_page_type: 'MANUAL',
    landing_page_rule: 'ALL',
    landing_select_way: 'MANUAL',
    loop_account: 'OFF',
    link_template: '',
  },

  sections: [
    {
      key: 'landing_settings',
      title: '',
      fields: [
        {
          key: 'per_ad_count',
          label: '每个广告配置',
          type: 'number',
          default: 1,
          min: 1,
          max: 10,
          width: 80,
          rowHeight: 32,
          gapAfter: 24,
          suffix: '个落地页链接',
          note: '线上：el-input w80 mr8 + 后缀文案「个落地页链接」；无必填星号',
        },
        {
          key: 'landing_page_type',
          label: '落地页类型',
          type: 'radio',
          required: true,
          default: 'MANUAL',
          rowHeight: 33,
          tipHeight: 24,
          gapAfter: 24,
          options: [
            { value: 'ORANGE', label: '橙子落地页' },
            { value: 'ORANGE_SITE', label: '橙子建站模板' },
            { value: 'THIRDPARTY', label: '第三方落地页' },
            { value: 'MANUAL', label: '手动填写' },
          ],
          /** 各类型下方的说明行（线上 .form-item-tips） */
          tip: {
            ORANGE: '选择已有橙子落地页时，请尽量保证落地页中的应用分包和项目中选择的分包一致。',
            ORANGE_SITE: '选择模板后，系统将基于模板自动创建橙子建站落地页并替换应用下载链接，确保您每条广告的下载链接与对应落地页中的下载链接一致。',
            THIRDPARTY: '第三方落地页需要先在本地导入',
            MANUAL: '',
          },
          note: '线上默认「手动填写」；每个选项都带 el-popover__reference（tiny-popover）；'
            + '置灰项 color #c0c4cc / border #ebeef5',
        },
        {
          key: 'landing_page_rule',
          label: '落地页分配方式',
          type: 'radio',
          required: true,
          default: 'ALL',
          rowHeight: 33,
          gapAfter: 16,
          options: [
            { value: 'ALL', label: '全部相同' },
            { value: 'PER_ACCOUNT', label: '按账户分配' },
            { value: 'PER_PROJECT', label: '按项目分配' },
            { value: 'PER_AD', label: '按广告分配' },
          ],
          /** 选项可见性（随落地页类型变化） */
          optionVisibleWhen: {
            ALL: { field: 'landing_page_type', neq: 'ORANGE_SITE' },
            PER_ACCOUNT: null,
            PER_PROJECT: { field: 'landing_page_type', neq: 'MANUAL' },
            PER_AD: { field: 'landing_page_type', neq: 'MANUAL' },
          },
          note: '线上：分配方式始终显示【全部相同 / 按账户分配】；类型 ≠ 手动填写 时追加【按项目分配 / 按广告分配】；'
            + '「橙子建站模板」时【全部相同】不出现（当前选中项被隐藏时自动回退到第一个可用项）',
        },
        {
          key: 'copy_to_other_account',
          label: '',
          type: 'button',
          text: '复制到其他账户',
          disabled: false,
          visibleWhen: { field: 'landing_page_rule', eq: 'PER_ACCOUNT' },
          note: '线上：分配方式 = 按账户分配 时，出现在该行右侧（x=1776, 86×32, el-button--text el-button--small）',
        },
        {
          key: 'landing_select_way',
          label: '落地页选择方式',
          type: 'radio',
          default: 'MANUAL',
          rowHeight: 33,
          gapAfter: 24,
          options: [
            { value: 'MANUAL', label: '手动选择' },
            { value: 'AUTO', label: '自动选择' },
          ],
          visibleWhen: { field: 'landing_page_type', eq: 'THIRDPARTY' },
          note: '线上：第三方落地页独有字段，出现在「落地页类型」与「落地页分配方式」之间；默认「手动选择」',
        },
        {
          key: 'manual_url',
          label: '输入落地页',
          type: 'input',
          width: 500,
          placeholder: '请输入落地页',
          rowHeight: 32,
          repeat: true,
          visibleWhen: { field: 'landing_page_type', eq: 'MANUAL' },
          note: '线上：手动填写时右侧面板（form.el-form.right-panel），按「每个广告配置」数量给出 N 个输入框',
        },
        {
          key: 'link_template',
          label: '选择链接模板',
          type: 'custom',
          visibleWhen: { field: 'landing_page_type', eq: 'DYNAMIC' },
          note: '线上：动态链接生成独有字段（模板选择器 + 刷新 / 新建按钮）',
        },
        {
          key: 'asset_panel',
          label: '',
          type: 'landingAssets',
          visibleWhen: {
            field: 'landing_page_type',
            in: ['ORANGE', 'ORANGE_SITE', 'THIRDPARTY'],
          },
          note: '线上：资产类落地页右侧面板（快速选择 / 清空所有资产 + 搜索 + 列表 + 已选）',
        },
      ],
    },
  ],

  /**
   * 各落地页类型下的面板结构（线上实测，见 focus2_online.json）
   *   head   —— 面板顶部一行（线上 .flex.asset-dialog-head > .head-title + .operate-button）
   *   jump   —— 搜索框右侧的跳转按钮（线上 el-button--text el-button--small）
   *   panel  —— 卡片区表头右侧按钮（线上 .mg-card-header：快速选择 / 清空）
   */
  typePanels: {
    ORANGE: {
      headTitle: '选择落地页',
      head: ['多账户刷新', '获取共享建站', '清空所有账户'],
      jump: '跳转橙子建站',
      panel: ['快速选择', '清空'],
      extraTip: '没找到已有落地页？去列表同步后再刷新',
    },
    ORANGE_SITE: {
      headTitle: '',
      head: [],
      jump: '跳转橙子建站模板',
      panel: ['快速选择', '清空'],
      extraTip: '没找到已有落地页？去列表同步后再刷新',
    },
    THIRDPARTY: {
      headTitle: '选择落地页',
      head: ['清空所有资产', '多账户快速选择'],
      jump: '跳转第三方落地页',
      panel: ['快速选择', '清空'],
      extraTip: '',
    },
    MANUAL: { headTitle: '', head: [], jump: '', panel: [], extraTip: '' },
  },

  /** 资产面板表格列（线上 mg-card-wrapper 表头） */
  assetColumns: [
    { key: 'title', label: '落地页名称', width: 220 },
    { key: 'url', label: '落地页地址', width: 320 },
    { key: 'status', label: '状态', width: 120 },
    { key: 'op', label: '操作', width: 120 },
  ],

  /** 资产面板通用按钮 */
  assetButtons: ['快速选择', '清空所有资产'],
  assetSearch: { placeholder: '请输入关键词', buttons: ['搜索', '清空'] },

  footer: { buttons: ['取消', '确定'], cancelText: '取 消', okText: '确 定' },
};
