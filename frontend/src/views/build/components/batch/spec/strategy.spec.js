/**
 * 选择策略（策略组） —— 线上 cl.mobgi.com「批量新建（巨量）」→ 步骤区「选择策略」
 *
 * 线上基准（2026-11-26 实测）：
 *   el-dialog.cl-modal  990×728  垂直居中
 *   header 47px(14px 24px) —— 线上无标题栏，页签直接放在弹窗顶部
 *   body 620px(padding 0) / footer 61px(14px 24px)
 *   页签：策略组 / 铺剧策略（按用户要求本轮移除「铺剧策略」，只保留「策略组」）
 *   筛选：2 行 × 3 组，每组 252px（标签 60px + 下拉 169px），行距 8px
 *         第 2 行第 3 组 = 名称维度下拉 60px + 关键词 + 放大镜（整组 244px）+ 清空
 *         右侧「自定义列」按钮 98×34
 *   表格：el-table--small，height 452px，表头/行高 40px
 *         列：☐45 / 策略组ID 80 / 策略组名称 160 / 搭建模式 80 / 推广目的 100 /
 *             投放模式 120 / 营销场景 100 / 广告类型 100 / 投放类型 100 / 描述 80 / 操作 100
 *         前 3 列固定左侧，操作列固定右侧
 *   分页：无「每页条数」下拉
 *
 * 依赖：
 *   - 5 个下拉 + 名称维度下拉只影响检索结果，不改列
 *   - 「自定义列」子弹窗勾选结果决定表格哪些列显示（操作列可单独取消）
 *   - 「确 定」未选中策略组时置灰
 */
export default {
  id: 'strategy',
  title: '选择策略组',
  width: 990,
  height: 728,
  shell: 'cl-dialog',
  size: 'modal',

  header: { padding: '14px 24px' },
  body: { padding: '0' },
  footer: {
    padding: '14px 24px',
    buttons: [
      { key: 'cancel', text: '取消', plain: true, width: 80, height: 32, fontSize: 12, radius: 3 },
      {
        key: 'ok',
        text: '确定',
        type: 'primary',
        width: 80,
        height: 32,
        fontSize: 12,
        radius: 3,
        disabledWhen: { field: 'selected', truthy: false },
      },
    ],
  },

  /* ---------- 页签（线上：策略组 / 铺剧策略；本轮按用户要求只保留「策略组」） ---------- */
  tabs: {
    key: 'tab',
    height: 40,
    fontSize: 16,
    options: [
      { value: 'group', label: '策略组' },
      // { value: 'play', label: '铺剧策略' } —— 按用户要求移除
    ],
  },

  sections: [
    /* ---------- 筛选区 ---------- */
    {
      key: 'filter',
      type: 'filter',
      padding: '12px 16px',
      rowGap: 8,
      rows: [
        [
          {
            key: 'objective',
            type: 'select',
            label: '推广目的：',
            labelWidth: 60,
            width: 169,
            areaWidth: 244,
            clearable: true,
            options: ['应用推广', '销售线索', '小程序', '电商', '快应用', '商品', '内容营销'],
          },
          {
            key: 'delivery_mode',
            type: 'select',
            label: '投放模式：',
            labelWidth: 60,
            width: 169,
            areaWidth: 244,
            clearable: true,
            options: ['手动投放', '自动投放(UBMax)'],
          },
          {
            key: 'marketing_goal',
            type: 'select',
            label: '营销场景：',
            labelWidth: 60,
            width: 169,
            areaWidth: 244,
            clearable: true,
            options: ['短视频/图片', '直播'],
          },
        ],
        [
          {
            key: 'ad_type',
            type: 'select',
            label: '广告类型：',
            labelWidth: 60,
            width: 169,
            areaWidth: 244,
            clearable: true,
            options: ['通投广告', '搜索广告'],
          },
          {
            key: 'delivery_type',
            type: 'select',
            label: '投放类型：',
            labelWidth: 60,
            width: 169,
            areaWidth: 244,
            clearable: true,
            options: ['常规投放', '周期稳投', '智能托管'],
          },
          {
            key: 'keyword',
            type: 'search',
            width: 244,
            areaWidth: 244,
            dimensionWidth: 60,
            dimension: 'nameType',
            dimensions: [
              { value: 'name', label: '名称' },
              { value: 'id', label: 'ID' },
            ],
            placeholder: '请输入关键词',
            appendSearch: true,
          },
          { key: 'clear', type: 'clear', text: '清空' },
        ],
      ],
      /* 右侧「自定义列」按钮（线上为 .el-button.w96.custom-column，plain 样式 + 14×14 图标） */
      customColumn: { key: 'custom_column', text: '自定义列', width: 98, height: 34 },
    },

    /* ---------- 策略组表 ---------- */
    {
      key: 'table',
      type: 'table',
      height: 452,
      size: 'small',
      rowHeight: 40,
      columns: [
        { key: 'radio', type: 'radio', width: 45, align: 'center' },
        { key: 'id', label: '策略组ID', prop: 'id', width: 80, fixed: 'left', showOverflowTooltip: true },
        { key: 'name', label: '策略组名称', prop: 'name', width: 160, fixed: 'left', showOverflowTooltip: true },
        { key: 'build_mode', label: '搭建模式', prop: 'build_mode', width: 80, customizable: true, showOverflowTooltip: true },
        { key: 'objective', label: '推广目的', prop: 'objective', width: 100, customizable: true, showOverflowTooltip: true },
        { key: 'delivery_mode', label: '投放模式', prop: 'delivery_mode', width: 120, customizable: true, showOverflowTooltip: true },
        { key: 'marketing_goal', label: '营销场景', prop: 'marketing_goal', width: 100, customizable: true, showOverflowTooltip: true },
        { key: 'ad_type', label: '广告类型', prop: 'ad_type', width: 100, customizable: true, showOverflowTooltip: true },
        { key: 'delivery_type', label: '投放类型', prop: 'delivery_type', width: 100, customizable: true, showOverflowTooltip: true },
        { key: 'description', label: '描述', prop: 'description', width: 80, customizable: true, showOverflowTooltip: true },
        { key: 'action', label: '操作', prop: '', width: 100, align: 'center', fixed: 'right', customizable: true },
      ],
    },

    /* ---------- 分页 ---------- */
    { key: 'pager', type: 'pager', showSizes: false, jump: true },
  ],

  /* ---------- 「自定义列」二级弹窗（线上 560×288） ---------- */
  customColumnDialog: {
    key: 'custom_column',
    title: '自定义指标',
    width: 560,
    height: 288,
    headerPadding: '16px 32px',
    bodyPadding: '24px',
    footerPadding: '11px 32px 30px',
    allLabel: '全选',
    itemWidth: 120,
    itemMarginBottom: 8,
    itemMarginRight: 30,
    gap: 15,
    columns: [
      { key: 'build_mode', label: '搭建模式' },
      { key: 'objective', label: '推广目的' },
      { key: 'delivery_mode', label: '投放模式' },
      { key: 'marketing_goal', label: '营销场景' },
      { key: 'ad_type', label: '广告类型' },
      { key: 'delivery_type', label: '投放类型' },
      { key: 'description', label: '描述' },
      { key: 'action', label: '操作' },
    ],
    footerButtons: [
      { key: 'cancel', text: '取消', plain: true, width: 120, height: 32, fontSize: 14, radius: 2 },
      { key: 'ok', text: '确定', type: 'primary', width: 120, height: 32, fontSize: 14, radius: 2 },
    ],
  },
};
