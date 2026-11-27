/**
 * 选择媒体账户 —— 线上 cl.mobgi.com「批量新建（巨量）」→ 配置行「媒体账户 / 更改」
 *
 * 线上基准（2026-11-26 实测，storage_state=C:/tmp/rpt_auth.json）：
 *   el-dialog.cl-dialog--large  1136×725  垂直居中
 *   header 51px(padding 16px 32px) / body 600px(padding 24px 32px) / footer 74px(padding 11px 32px 30px)
 *   筛选：智投项目 / 账户主体 / 开发者（标签在外 + 下拉 169px + ⨯）
 *         搜索组 360px = [维度下拉 110px][关键词][放大镜按钮 40×26] + 清空
 *   表格：el-table--mini，height 400px，表头/行高 56px
 *   已选面板：200×402，头 48px(#f2f2f2) + 体 352px
 *
 * 依赖（逐项实测）：
 *   - 维度下拉 4 项（账户ID / 账户名称 / 账户备注(智投) / 账户备注(巨量)）只影响关键词检索的字段，不改列
 *   - 表格列恒定 8 列；「账户名称」列线上确实存在（含防出错标记 + 账户名 + 账户ID）
 *   - 确定按钮：未选任何账户时置灰
 */
export default {
  id: 'account',
  title: '选择媒体账户',
  width: 1136,
  height: 725,
  shell: 'cl-dialog',
  size: 'large',

  header: { padding: '16px 32px' },
  body: { padding: '24px 32px' },
  footer: {
    padding: '11px 32px 30px',
    buttons: [
      { key: 'cancel', text: '取消', plain: true, width: 120, height: 32, fontSize: 14, radius: 2 },
      {
        key: 'ok',
        text: '确定',
        type: 'primary',
        width: 120,
        height: 32,
        fontSize: 14,
        radius: 2,
        // 未选中任何账户时「确定」置灰（线上实测）
        disabledWhen: { field: 'pickedCount', eq: 0 },
      },
    ],
  },

  sections: [
    /* ---------- 筛选区 ---------- */
    {
      key: 'filter',
      type: 'filter',
      padding: '12px 16px 12px 0',
      rowGap: 16,
      rows: [
        [
          {
            key: 'project',
            type: 'select',
            label: '智投项目：',
            labelWidth: 60,
            width: 169,
            // 线上 .select-area 整组宽（含左侧 9px 标签缩进 + 右侧 ⨯ 与留白）
            areaWidth: 263,
            hasIcon: true,
            clearable: true,
            source: 'projectOptions',
            placeholder: '全部',
          },
          {
            key: 'subject',
            type: 'select',
            label: '账户主体：',
            labelWidth: 60,
            width: 169,
            areaWidth: 263,
            hasIcon: true,
            clearable: true,
            source: 'subjectOptions',
            placeholder: '全部',
          },
          {
            key: 'developer',
            type: 'select',
            label: '开发者：',
            labelWidth: 48,
            width: 169,
            // 开发者是多选下拉，线上没有 ⨯
            areaWidth: 232,
            hasIcon: false,
            clearable: true,
            source: 'developerOptions',
            placeholder: '全部',
          },
        ],
        [
          {
            key: 'keyword',
            type: 'search',
            width: 360,
            dimensionWidth: 110,
            dimension: 'id_type',
            dimensions: [
              { value: 'id', label: '账户ID' },
              { value: 'name', label: '账户名称' },
              { value: 'remark_cy', label: '账户备注(智投)' },
              { value: 'remark_jl', label: '账户备注(巨量)' },
            ],
            placeholder: '搜索媒体账户',
            appendSearch: true,
            batchSearch: true,
          },
          { key: 'clear', type: 'clear', text: '清空' },
        ],
      ],
    },

    /* ---------- 提示 ---------- */
    { key: 'tips', type: 'tips', icon: 'warning', text: '仅支持同个主体账户', marginBottom: 8 },

    /* ---------- 账户表 ---------- */
    {
      key: 'table',
      type: 'table',
      height: 400,
      size: 'mini',
      rowHeight: 56,
      columns: [
        { key: 'selection', type: 'selection', width: 50, align: 'center' },
        { key: 'name', label: '账户名称', prop: 'name', width: 240, sortable: true, slot: 'name' },
        { key: 'subject', label: '账户主体', prop: 'subject', width: 140, sortable: true },
        { key: 'remark_cy', label: '账户备注(智投)', prop: 'remark_cy', width: 140 },
        { key: 'remark_jl', label: '账户备注(巨量)', prop: 'remark_jl', width: 140 },
        { key: 'project', label: '智投项目', prop: 'project', width: 140 },
        { key: 'balance', label: '账户余额', prop: 'balance', width: 100, sortable: true },
        { key: 'developer_name', label: '账户所属开发者', prop: 'developer_name', width: 120, slot: 'developer' },
      ],
    },

    /* ---------- 已选面板 ---------- */
    {
      key: 'picked',
      type: 'panel',
      width: 200,
      height: 402,
      title: '已选',
      limit: 50,
      clearText: '清空',
    },

    /* ---------- 分页 ---------- */
    {
      key: 'pager',
      type: 'pager',
      showSizes: true,
      pageSizes: [10, 20, 50, 100, 200],
      defaultSize: 20,
      jump: true,
    },
  ],
};
