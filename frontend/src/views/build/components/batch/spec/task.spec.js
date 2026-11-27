/**
 * 选择任务 —— 线上 cl.mobgi.com「批量新建（巨量）」→ 步骤区「选择任务」
 *
 * 线上基准（2026-11-26 实测）：
 *   el-dialog.cl-dialog--large  1025×710  垂直居中
 *   header 51px(16px 32px) / body 585px(24px 32px) / footer 74px(11px 32px 30px)
 *   筛选：媒体账户（标签 60 + 下拉 169）/ 创建时间（标签 74 + 日期区间 240）
 *         / 搜索组 300px = [维度下拉 80px][关键词][放大镜按钮 40×26] / 清空
 *   表格：el-table--small，height 441px，表头/行高 40px
 *   分页：无「每页条数」下拉（与选择媒体账户不同）
 *   页脚按钮文案为「取 消 / 确 认」（带空格），非 plain 样式
 *
 * 依赖：
 *   - 维度下拉 2 项（任务名称 / 任务ID）只影响关键词检索字段，不改列
 *   - 表格列恒定 4 列
 *   - 「确 认」未选中任务时置灰
 */
export default {
  id: 'task',
  title: '选择任务',
  width: 1025,
  height: 710,
  shell: 'cl-dialog',
  size: 'large',

  header: { padding: '16px 32px' },
  body: { padding: '24px 32px' },
  footer: {
    padding: '11px 32px 30px',
    buttons: [
      { key: 'cancel', text: '取 消', width: 120, height: 32, fontSize: 14, radius: 2 },
      {
        key: 'ok',
        text: '确 认',
        type: 'primary',
        width: 120,
        height: 32,
        fontSize: 14,
        radius: 2,
        disabledWhen: { field: 'selected', truthy: false },
      },
    ],
  },

  sections: [
    /* ---------- 筛选区 ---------- */
    {
      key: 'filter',
      type: 'filter',
      padding: '0 0 16px 0',
      rowGap: 16,
      rows: [
        [
          {
            key: 'account_id',
            type: 'select',
            label: '媒体账户：',
            labelWidth: 60,
            width: 169,
            areaWidth: 263,
            hasIcon: true,
            clearable: true,
            source: 'accounts',
            placeholder: '全部',
          },
          {
            key: 'date_range',
            type: 'daterange',
            label: '创建时间：',
            labelWidth: 74,
            width: 240,
            areaWidth: 329,
            hasIcon: false,
            rangeSeparator: '至',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
          },
          {
            key: 'keyword',
            type: 'search',
            width: 300,
            dimensionWidth: 80,
            dimension: 'name_type',
            dimensions: [
              { value: 'name', label: '任务名称' },
              { value: 'id', label: '任务ID' },
            ],
            placeholder: '请输入关键词',
            appendSearch: true,
          },
          { key: 'clear', type: 'clear', text: '清空' },
        ],
      ],
    },

    /* ---------- 任务表 ---------- */
    {
      key: 'table',
      type: 'table',
      height: 441,
      size: 'small',
      rowHeight: 40,
      columns: [
        { key: 'radio', type: 'radio', width: 45, align: 'center' },
        { key: 'task_no', label: '任务ID', prop: 'task_no', width: 159 },
        { key: 'name', label: '任务名称', prop: 'name', minWidth: 320, showOverflowTooltip: true },
        { key: 'created_at', label: '创建时间', prop: 'created_at', width: 160 },
      ],
    },

    /* ---------- 分页 ---------- */
    { key: 'pager', type: 'pager', showSizes: false, jump: true },
  ],
};
