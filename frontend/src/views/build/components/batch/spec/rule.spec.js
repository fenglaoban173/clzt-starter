/**
 * 规则配置 —— 线上 cl.mobgi.com「批量新建（巨量）」→ 配置行「规则配置 / 更改」
 *
 * 线上基准（2026-11-26 实测，逐场景重开弹窗复测）：
 *   el-dialog.assign-rule-config--dialog.cl-modal  1140×653  垂直居中
 *   header 47px(14px 24px) / body 545px(20px 24px) / footer 61px(14px 24px)
 *   form min-height 380px，form-item 间距 24px，label 宽 160px（14px #666）
 *   创建方式 = el-radio-group.mc-check-group--button，两个按钮各 80×32
 *   卡片组 = flex + gap 16px，卡片 220×84（padding 8px 12px，标题 16px/500，说明 12px/18）
 *
 * 依赖矩阵（实测结论，X = 置灰）：
 *   创建方式 = 已有项目 → 「项目生成规则」「每个项目广告数上限」整体不出现
 *   创建方式 = 新建项目：
 *     项目生成规则            按创意组数  按创意组*标题包  按项目数*创意组  指定数量  资产组×2
 *       按总广告数/每项目广告数   ✓(选中)      ✓              X             X        X
 *       根据创意组生成           ✓(选中)      ✓              X             ✓        X
 *       根据标题包生成            X          ✓(选中)        X             X        X
 *       指定数量                ✓(选中)      ✓              ✓             ✓        X
 *       按资产组                 —— 卡片本身恒置灰 ——
 *   额外数字框：
 *     每个账户指定项目数   ← 项目生成规则 = 指定数量（默认 1）
 *     每个项目指定广告数   ← 广告生成规则   = 指定数量（默认 100）
 *     每个项目广告数上限   ← 项目生成规则 = 按总广告数/每项目广告数（默认 100，label 带 ⓘ 图标）
 */
export default {
  id: 'rule',
  title: '规则配置',
  width: 1140,
  height: 653,
  shell: 'cl-dialog',
  size: 'modal',

  header: { padding: '14px 24px' },
  body: { padding: '20px 24px' },
  footer: {
    padding: '14px 24px',
    buttons: [
      { key: 'cancel', text: '取消', width: 80, height: 32, fontSize: 12, radius: 3 },
      { key: 'ok', text: '确定', type: 'primary', width: 80, height: 32, fontSize: 12, radius: 3 },
    ],
  },

  sections: [
    {
      key: 'form',
      type: 'form',
      labelWidth: 160,
      itemMarginBottom: 24,
      minHeight: 380,
      fields: [
        /* ---------- 创建方式 ---------- */
        {
          key: 'create_mode',
          label: '创建方式',
          type: 'radio',
          button: true,
          default: 'NEW',
          options: [
            { value: 'NEW', label: '新建项目' },
            { value: 'EXIST', label: '已有项目' },
          ],
        },

        /* ---------- 项目生成规则 ---------- */
        {
          key: 'project_rule',
          label: '项目生成规则',
          type: 'cards',
          cardWidth: 220,
          cardHeight: 84,
          gap: 16,
          default: 'BY_TOTAL',
          // 仅「新建项目」时出现
          visibleWhen: { field: 'create_mode', eq: 'NEW' },
          options: [
            {
              value: 'BY_TOTAL',
              label: '按总广告数/每项目广告数',
              desc: '根据生成的广告总数与项目内广告数上限，自动生成项目',
            },
            {
              value: 'BY_CREATIVE',
              label: '根据创意组生成',
              desc: '项目数量与创意组数量相等，项目中的广告都使用相同的素材',
            },
            {
              value: 'BY_TITLE',
              label: '根据标题包生成',
              desc: '项目数量与标题包数量相等，项目中的广告都使用相同的标题包',
            },
            {
              value: 'BY_COUNT',
              label: '指定数量',
              desc: '手动指定每个账户的项目数量',
            },
            {
              value: 'BY_ASSET',
              label: '按资产组',
              desc: '项目数量与资产组数量相等，项目中的广告都使用相同的资产组',
              // 线上该卡片恒置灰（不可选）
              disabledWhen: { truthy: true },
            },
          ],
        },

        /* ---------- 每个账户指定项目数 ---------- */
        {
          key: 'projects_per_account',
          label: '每个账户指定项目数',
          type: 'input',
          width: 160,
          default: 1,
          // 仅「新建项目」且「项目生成规则 = 指定数量」时出现
          visibleWhenAll: [
            { field: 'create_mode', eq: 'NEW' },
            { field: 'project_rule', eq: 'BY_COUNT' },
          ],
        },

        /* ---------- 广告生成规则 ---------- */
        {
          key: 'ad_rule',
          label: '广告生成规则',
          type: 'cards',
          cardWidth: 220,
          cardHeight: 84,
          gap: 16,
          default: 'BY_CREATIVE',
          options: [
            {
              value: 'BY_CREATIVE',
              label: '按创意组数',
              desc: '基于创意组数生成广告，自动匹配标题包，标题包不足时循环使用',
              // 新建项目 + 「根据标题包生成」时不可用
              disabledWhenAll: [
                { field: 'create_mode', eq: 'NEW' },
                { field: 'project_rule', eq: 'BY_TITLE' },
              ],
            },
            {
              value: 'BY_CREATIVE_TITLE',
              label: '按创意组*标题包',
              desc: '基于创意组*标题包自动生成广告',
            },
            {
              value: 'BY_PROJECT_CREATIVE',
              label: '按项目数*创意组',
              desc: '基于项目数*创意组自动生成广告',
              // 新建项目时只有「指定数量」下可用
              disabledWhenAll: [
                { field: 'create_mode', eq: 'NEW' },
                { field: 'project_rule', neq: 'BY_COUNT' },
              ],
            },
            {
              value: 'BY_COUNT',
              label: '指定数量',
              desc: '先指定广告数量，自动循环使用素材和标题，多退少补',
              // 已有项目 或 新建项目且项目规则为「根据创意组生成 / 指定数量」时可用
              descWhenAny: [
                { field: 'create_mode', eq: 'EXIST' },
                { field: 'project_rule', eq: 'BY_COUNT' },
              ],
              descWhenAnyText: '先基于创意组数生成广告，未达到指定生成的广告数量时，循环使用创意组；超过，则舍弃多余广告',
              disabledWhenAll: [
                { field: 'create_mode', eq: 'NEW' },
                { field: 'project_rule', notIn: ['BY_CREATIVE', 'BY_COUNT'] },
              ],
            },
            {
              value: 'BY_CREATIVE_ASSET',
              label: '按创意组*资产组',
              desc: '基于创意组*资产组自动生成广告',
              disabledWhen: { truthy: true },
            },
            {
              value: 'BY_CREATIVE_TITLE_ASSET',
              label: '按创意组*标题包*资产组',
              desc: '基于创意组*标题包*资产组自动生成广告',
              disabledWhen: { truthy: true },
            },
          ],
        },

        /* ---------- 每个项目广告数上限 ---------- */
        {
          key: 'ads_limit_per_project',
          label: '每个项目广告数上限',
          type: 'input',
          width: 160,
          default: 100,
          // label 右侧的 ⓘ 提示图标（线上是图标，不是文字）
          tip: '已生成的广告数，超过项目内广告数上限时，自动填充到新的项目内；广告数未达上限时则不生成新项目',
          // 仅「新建项目」且「项目生成规则 = 按总广告数/每项目广告数」时出现
          visibleWhenAll: [
            { field: 'create_mode', eq: 'NEW' },
            { field: 'project_rule', eq: 'BY_TOTAL' },
          ],
        },

        /* ---------- 每个项目指定广告数 ---------- */
        {
          key: 'ads_per_project',
          label: '每个项目指定广告数',
          type: 'input',
          width: 160,
          default: 100,
          tip: '指定每个项目内包含的广告数量，广告数量不足时重复使用广告',
          visibleWhen: { field: 'ad_rule', eq: 'BY_COUNT' },
        },
      ],
    },
  ],
};
