/**
 * 「新建项目」抽屉 spec —— 对齐线上 cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *
 * 线上取证（只读，未点任何「提交 / 删除 / 保存策略组 / 全部提交审核」）：
 *   https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *   → 选择任务 → 单选 → 确认 → 页面回显 → 首列（第 1 列）「编辑」→ .cl-drawer
 * 采集脚本：C:/tmp/verify/spec/px_dep2.py（结构 + 依赖实测）、px_extra.py（补采 3 个状态）
 * 采集产物：C:/tmp/verify/spec/online/
 *   project_drawer.html    抽屉完整 outerHTML
 *   project_tree.json      分区 / 字段 / 选项 / 几何
 *   project_meta.json      computed style（外壳 / 标题条 / 卡片 / 浮层）
 *   project_snap_base.json 默认态字段快照
 *   project_deps.json      25 个选项逐个切换 → 出现 / 消失 / 置灰
 *   state_search_ad.json   广告类型=搜索广告 态
 *   state_asset_on.json    资产组=启用 态
 *   state_max_convert.json 竞价策略=最大转化 态
 *
 * 依赖语义与求值器见 spec/resolve.js（isVisible / isDisabled / bubbleText / optionBubbleText）。
 * 本 spec 额外用到的声明式能力（同样声明在本文件内，不散落到组件里）：
 *   model          : 该字段写入本地表单的路径（缺省 = key；支持 searchForm.xxx）
 *   optionDisabled : [{ value, when }]                          选项级禁用
 *   optionsWhen    : { <依赖字段值>: [options] } + optionsWhenField
 *                    或 [{ when, options }]（多依赖时用数组形态，命中第一条即用）
 *   labelWhen      : { <依赖字段值>: 'label' } + labelWhenField
 *   tipsByOption   : { <选项值>: '提示文案' }
 *   extras / wildcards : 同一行内的附加控件（项目名称行的两个勾选 + 通配符）
 *   inRule         : true → 属于「预算出价规则1」内部，由 custom kind=budgetRule 渲染
 *   kind           : custom 字段的渲染器名
 */

export default {
  id: 'project',
  title: '新建项目',
  width: 1016,
  shell: 'cl-drawer',

  /* 右上角悬浮卡：预估广告数（线上 .estimate-promotion-number-wrapper，fixed top:64 right:49 w:240） */
  estimate: {
    key: 'adEstimate',
    title: '预估广告数',
    rows: [
      { label: '账户数：', field: 'accounts' },
      { label: '项目数：', field: 'projects' },
    ],
  },

  sections: [
    /* ─────────────────────────── ① 资产组 ─────────────────────────── */
    {
      key: 'asset_group',
      title: '资产组',
      labelWidth: 120,
      fields: [
        {
          key: 'asset_group',
          label: '资产组',
          type: 'radio',
          labelWidth: 120,
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        /* 实测（state_asset_on）：资产组=启用 时出现「分配方式 / 选择资产组」，
           同时整个「关联产品投放」分区消失 */
        {
          key: 'asset_group_assign',
          label: '分配方式',
          type: 'radio',
          visibleWhen: { field: 'asset_group', eq: 'ON' },
          default: 'PER_ACCOUNT',
          options: [
            { value: 'ALL', label: '所有账户相同' },
            { value: 'PER_ACCOUNT', label: '分账户选择' },
          ],
        },
        {
          key: 'asset_group_pick',
          label: '选择资产组',
          type: 'custom',
          kind: 'assetGroupPick',
          visibleWhen: { field: 'asset_group', eq: 'ON' },
        },
      ],
    },

    /* ─────────────────────────── ② 推广目的 ─────────────────────────── */
    {
      key: 'promotion',
      title: '推广目的',
      fields: [
        {
          key: 'objective',
          type: 'cards',
          cardStyle: 'objective',
          default: 'APP',
          options: [
            { value: 'APP', label: '应用推广', desc: '推广您的线上APP', img: '/assets/obj_1..png' },
            { value: 'MICRO_GAME', label: '小程序', desc: '吸引更多用户进入小程序', img: '/assets/obj_2..png' },
            { value: 'SHOP', label: '电商', desc: '提升线上商品或店铺的推广效果', img: '/assets/obj_3..png' },
            { value: 'LINK', label: '销售线索', desc: '为您的生意销售收集用户线索', img: '/assets/obj_4..png' },
            { value: 'QUICK_APP', label: '快应用', desc: '吸引更多用户进入快应用', img: '/assets/obj_5.png' },
            { value: 'DPA', label: '商品', desc: '基于用户偏好给用户动态展示商品', img: '/assets/obj_6.png' },
            { value: 'NATIVE_ACTION', label: '内容营销', desc: '提升投放视频或直播的互动、涨粉、种草效果', img: '/assets/obj_7.svg' },
          ],
        },
        {
          key: 'app_promotion_type',
          label: '',
          type: 'radio',
          tabStyle: true,
          visibleWhen: { field: 'objective', eq: 'APP' },
          default: 'LAUNCH',
          options: [
            { value: 'DOWNLOAD', label: '应用下载' },
            { value: 'LAUNCH', label: '应用调起' },
            { value: 'RESERVE', label: '预约下载' },
          ],
          tip: '吸引用户在应用程序内采取行动',
        },
        {
          key: 'ad_type',
          label: '广告类型',
          type: 'radio',
          default: 'ALL',
          options: [
            { value: 'ALL', label: '通投广告' },
            { value: 'SEARCH', label: '搜索广告' },
          ],
          /* 线上：气泡挂在 **选项「搜索广告」的文字上**（el-popover__reference 包文字），
             label 上没有 ⓘ 图标 */
          optionBubble: [{ value: 'SEARCH', text: '头条接口正在逐步开放中' }],
        },
        {
          key: 'delivery_type',
          label: '投放类型',
          type: 'radio',
          default: 'NORMAL',
          optionsWhenField: 'ad_type',
          optionsWhen: {
            SEARCH: [
              { value: 'NORMAL', label: '常规投放' },
              { value: 'RAPID', label: '极速智投' },
            ],
            ALL: [
              { value: 'NORMAL', label: '常规投放' },
              { value: 'CYCLE_STABLE', label: '周期稳投' },
            ],
          },
          /* 通投广告下「周期稳投」置灰（搜索广告时该项替换为「极速智投」） */
          optionDisabled: [{ value: 'CYCLE_STABLE', when: { field: 'ad_type', eq: 'ALL' } }],
          /* 线上：气泡挂在 **选项「周期稳投」的文字上**（label 上没有 ⓘ） */
          optionBubble: [{ value: 'CYCLE_STABLE', text: '媒体API暂不支持通投广告搭建周期稳投' }],
        },
        /* 实测：广告类型=搜索广告 时「投放模式」消失 */
        {
          key: 'delivery_mode',
          label: '投放模式',
          type: 'radio',
          default: 'UBMAX',
          visibleWhen: { field: 'ad_type', neq: 'SEARCH' },
          options: [
            { value: 'MANUAL', label: '手动投放' },
            { value: 'UBMAX', label: '自动投放(UBMax)' },
          ],
        },
        {
          key: 'marketing_goal',
          label: '营销场景',
          type: 'radio',
          default: 'VIDEO_AND_IMAGE',
          options: [
            { value: 'VIDEO_AND_IMAGE', label: '短视频+图文' },
            { value: 'LIVE', label: '直播' },
          ],
        },
        {
          key: 'inner_promotion',
          label: '内广项目',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不开启' },
            { value: 'ON', label: '开启' },
          ],
          link: {
            key: 'innerGuide',
            text: '加白指引',
            href: 'https://chuangliang.feishu.cn/wiki/EbPIwMdVhimCZnk16B9cOUmjn4c',
          },
        },
      ],
    },

    /* ─────────────────────────── ③ 关联产品投放 ─────────────────────────── */
    {
      key: 'related_product',
      title: '关联产品投放',
      /* 实测（state_asset_on）：资产组=启用 时整个「关联产品投放」分区消失 */
      visibleWhen: { field: 'asset_group', eq: 'OFF' },
      fields: [
        {
          key: 'related_product',
          label: '关联产品',
          labelWhenField: 'objective',
          labelWhen: { NATIVE_ACTION: '推广产品' },
          type: 'radio',
          default: 'ON',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        /* 实测：关联产品=不启用 时以下 6 个字段全部消失 */
        {
          key: 'product_count',
          label: '每个项目配置产品数',
          /* 线上 .w160.mr8 el-input（普通文本框 160px，无步进按钮） */
          type: 'input',
          width: 160,
          placeholder: '',
          visibleWhen: { field: 'related_product', eq: 'ON' },
        },
        {
          key: 'product_version',
          label: '产品版本',
          type: 'radio',
          visibleWhen: { field: 'related_product', eq: 'ON' },
          options: [
            { value: 'UPGRADE', label: '升级版' },
            { value: 'GENERAL', label: '通用版' },
          ],
        },
        {
          key: 'product_source',
          label: '产品来源',
          type: 'radio',
          visibleWhen: { field: 'related_product', eq: 'ON' },
          options: [
            { value: 'EXISTING', label: '选择已有' },
            { value: 'MANUAL', label: '手动填写' },
          ],
        },
        {
          key: 'product_workbench_version',
          model: 'workbench_version',
          label: '工作台版本',
          type: 'radio',
          visibleWhen: { field: 'related_product', eq: 'ON' },
          options: [
            { value: 'OLD', label: '旧版工作台' },
            { value: 'NEW', label: '新版工作台' },
          ],
        },
        {
          key: 'product_match_mode',
          label: '匹配方式',
          type: 'radio',
          visibleWhen: { field: 'related_product', eq: 'ON' },
          options: [
            { value: 'ALL_SAME', label: '所有项目选择同一组产品' },
            { value: 'PER_ACCOUNT', label: '每个账户选择一组产品' },
            { value: 'PER_SUBJECT', label: '每个主体选择一组产品' },
            { value: 'PER_PROJECT', label: '每个项目选择一组产品' },
          ],
        },
        {
          key: 'product_pick',
          label: '选择产品',
          type: 'custom',
          kind: 'productPick',
          /* 线上：字段行只有「选择产品」按钮（气泡挂在按钮文字上），
             下面的资产表格是**独立的一行**（el-form-item__content margin-left:0），
             不在字段行内。hideTable=true → 表格由后面的 assetTable 字段渲染。 */
          hideTable: true,
          visibleWhen: { field: 'related_product', eq: 'ON' },
          /* 线上 label 右侧 ⓘ 气泡原文 */
          bubble: {
            when: { field: 'related_product', eq: 'ON' },
            text: '完善基本信息、素材和标题后，在外层配置区点击编辑按钮配置该资产。',
          },
        },
        { key: 'product_table', label: '', type: 'custom', kind: 'assetTable', table: 'product',
          visibleWhen: { field: 'related_product', eq: 'ON' } },
      ],
    },

    /* ─────────────────────────── ④ AIGC 动态创意 ─────────────────────────── */
    {
      key: 'aigc',
      title: 'AIGC动态创意',
      fields: [
        {
          key: 'aigc_creative',
          label: 'AIGC动态创意',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
          /* 线上文案逐字对齐（无空格、半角逗号）
             线上是 .interest-action-info block 变体：12px #999 / line-height 32px / 高 32px + ⚠ 12×12 */
          tip: '白名单功能。开启AIGC动态创意,请确保产品所有者在行业产品中心已申请获取短副原片的使用授权,如未完成,可能影响素材生成效果。',
          tipStyle: 'block',
        },
      ],
    },

    /* ─────────────────────────── ⑤ 投放内容与目标 ─────────────────────────── */
    {
      key: 'content',
      title: '投放内容与目标',
      labelWidth: 150,
      fields: [
        /* 实测：营销场景=直播 或 广告类型=搜索广告 时「关联星广联投任务」消失 */
        {
          key: 'star_task',
          label: '关联星广联投任务',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'marketing_goal', neq: 'LIVE' },
            { field: 'ad_type', neq: 'SEARCH' },
          ],
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
          /* 线上：radio 后面跟一个 inline 提示（.interest-action-info inline 变体）
             ⚠ 14×14 图标 + margin-left 16px + 12px #999 */
          tip: '账户需开通星广联投白名单，否则新建会报错',
          tipStyle: 'inline',
        },
        {
          key: 'platform_type',
          label: '平台类型',
          type: 'radio',
          visibleWhen: { field: 'objective', eq: 'APP' },
          default: 'APP_ANDROID',
          optionsWhenField: 'marketing_goal',
          optionsWhen: {
            /* 实测：营销场景=直播 时平台类型只剩 Android / IOS */
            LIVE: [
              { value: 'APP_ANDROID', label: 'Android' },
              { value: 'APP_IOS', label: 'IOS' },
            ],
            VIDEO_AND_IMAGE: [
              { value: 'APP_ANDROID', label: 'Android' },
              { value: 'APP_IOS', label: 'IOS' },
              { value: 'APP_HARMONY', label: '鸿蒙' },
            ],
          },
        },
        /* 实测：平台类型=IOS/鸿蒙 时「应用来源」消失 */
        {
          key: 'app_source',
          label: '应用来源',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
          ],
          default: 'SINGLE',
          options: [
            { value: 'SINGLE', label: '已有应用' },
            { value: 'INTERNAL', label: '内广应用' },
          ],
          link: { key: 'innerAppGuide', text: '内广应用搭建指引' },
        },
        /* 线上实测（默认态 应用来源=内广应用）：
           匹配方式(资产) = 所有账户选择一个资产 / 每个账户选择一个资产，默认选中「每个账户选择一个资产」
           → 下面跟着「选择事件资产」按钮行 + 独立的资产表格行 */
        {
          key: 'event_asset_match_mode',
          label: '匹配方式',
          type: 'radio',
          default: 'PER_ACCOUNT',
          visibleWhen: { field: 'app_source', eq: 'INTERNAL' },
          options: [
            { value: 'ALL_SAME', label: '所有账户选择一个资产' },
            { value: 'PER_ACCOUNT', label: '每个账户选择一个资产' },
          ],
        },
        {
          key: 'event_asset_pick',
          label: '选择事件资产',
          type: 'custom',
          kind: 'eventAssetPick',
          /* 线上：字段行只有按钮，资产表格是独立的一行 */
          hideTable: true,
          visibleWhen: { field: 'app_source', eq: 'INTERNAL' },
        },
        { key: 'event_asset_table', label: '', type: 'custom', kind: 'eventAssetTable',
          visibleWhen: { field: 'app_source', eq: 'INTERNAL' } },
        /* 实测：应用来源=内广应用 时「工作台版本 / 头条应用 / 应用名称」消失 */
        {
          key: 'app_workbench_version',
          model: 'workbench_version',
          label: '工作台版本',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
            { field: 'app_source', neq: 'INTERNAL' },
          ],
          options: [
            { value: 'OLD', label: '旧版工作台' },
            { value: 'NEW', label: '新版工作台' },
          ],
        },
        {
          key: 'head_app',
          label: '头条应用',
          type: 'select',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
            { field: 'app_source', neq: 'INTERNAL' },
          ],
          options: [],
          kind: 'selectWithRefresh',
        },
        {
          key: 'app_name',
          label: '应用名称',
          type: 'input',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
            { field: 'app_source', neq: 'INTERNAL' },
          ],
        },
        {
          key: 'itunes_id',
          label: 'iTunes ID',
          type: 'input',
          visibleWhen: { field: 'platform_type', eq: 'APP_IOS' },
        },
        {
          key: 'harmony_app',
          label: '鸿蒙应用',
          type: 'select',
          visibleWhen: { field: 'platform_type', eq: 'APP_HARMONY' },
          options: [],
          kind: 'selectWithRefresh',
        },
        {
          key: 'track_way',
          label: '数据跟踪方式',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
          ],
          default: 'SUB_AND_MONITOR',
          options: [
            { value: 'SUB_AND_MONITOR', label: '应用分包+监测活动' },
            { value: 'SUB_ONLY', label: '仅应用分包' },
          ],
          /* 实测：应用来源=内广应用 时「仅应用分包」置灰 */
          optionDisabled: [{ value: 'SUB_ONLY', when: { field: 'app_source', eq: 'INTERNAL' } }],
        },
        /* 实测：数据跟踪方式=仅应用分包 时「监测链接来源」消失 */
        {
          key: 'track_link_source',
          label: '监测链接来源',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'track_way', neq: 'SUB_ONLY' },
          ],
          /* 线上默认态实测：只有 2 项（巨量后台监测链接组 / 智投导入监测活动），
             默认选中「巨量后台监测链接组」。动态选取监测活动 / 手动输入 是
             平台类型=鸿蒙 时的额外选项。 */
          default: 'EXIST',
          optionsWhen: [
            {
              when: { field: 'platform_type', eq: 'APP_HARMONY' },
              options: [
                { value: 'EXIST', label: '巨量后台监测链接组' },
                { value: 'LOCATION', label: '智投导入监测活动' },
                { value: 'DYNAMIC', label: '动态选取监测活动' },
                { value: 'MANUAL', label: '手动输入' },
              ],
            },
            {
              options: [
                { value: 'EXIST', label: '巨量后台监测链接组' },
                { value: 'LOCATION', label: '智投导入监测活动' },
              ],
            },
          ],
        },
        /* 实测：数据跟踪方式=仅应用分包 时出现「选择应用分包」 */
        {
          key: 'app_pkg_pick',
          label: '选择应用分包',
          type: 'custom',
          kind: 'appPkgPick',
          visibleWhen: { field: 'track_way', eq: 'SUB_ONLY' },
        },
        {
          key: 'link_match_mode',
          model: 'link_group_match',
          label: '匹配方式',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', in: ['APP_ANDROID', 'APP_IOS', 'APP_HARMONY'] },
          ],
          optionsWhen: [
            {
              when: { field: 'track_way', eq: 'SUB_ONLY' },
              options: [
                { value: 'ALL', label: '所有项目选择同一个应用分包' },
                { value: 'PER_ACCOUNT', label: '每个账户选择一个应用分包' },
                { value: 'PER_PROJECT', label: '每个项目选择一个应用分包' },
              ],
            },
            {
              when: { field: 'app_source', eq: 'INTERNAL' },
              options: [
                { value: 'PER_ACCOUNT', label: '每个账户选择一个分包和链接组' },
                { value: 'PER_PROJECT', label: '每个项目选择一个分包和链接组' },
              ],
            },
            {
              when: { field: 'platform_type', eq: 'APP_ANDROID' },
              options: [
                { value: 'ALL', label: '所有项目选择同一个分包和链接组' },
                { value: 'PER_ACCOUNT', label: '每个账户选择一个分包和链接组' },
              ],
            },
            {
              options: [
                { value: 'ALL', label: '所有项目选择同一个链接组' },
                { value: 'PER_ACCOUNT', label: '每个账户选择一个链接组' },
              ],
            },
          ],
        },
        {
          key: 'link_group_pick',
          label: '选择分包和链接组',
          type: 'custom',
          kind: 'linkGroupPick',
          /* 线上：字段行只有按钮，分包和链接组表格是独立的一行 */
          hideTable: true,
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
            { field: 'track_link_source', neq: 'DYNAMIC' },
          ],
        },
        { key: 'link_group_table', label: '', type: 'custom', kind: 'linkGroupTable',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
            { field: 'track_link_source', neq: 'DYNAMIC' },
          ] },
        {
          key: 'link_group_pick_mobile',
          label: '选择链接组',
          type: 'custom',
          kind: 'linkGroupPick',
          visibleWhen: { field: 'platform_type', in: ['APP_IOS', 'APP_HARMONY'] },
        },
        /* 「调起方式」线上默认态（平台类型=Android）**不显示**，
           只在 iOS 平台出现。线上原 value：DIRECT_OPEN=直接调起 */
        {
          key: 'launch_type',
          label: '调起方式',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_IOS' },
          ],
          default: 'DIRECT',
          options: [
            { value: 'DIRECT', label: '直接调起' },
            { value: 'LANDING', label: '落地页调起' },
          ],
        },
        /* 线上实测：「下载方式」在「选择分包和链接组」表之后、「优先应用商店下载」之前
           默认选中「直接下载」；选项 = 直接下载 / 落地页下载 */
        {
          key: 'download_type',
          label: '下载方式',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
          ],
          default: 'DOWNLOAD_URL',
          options: [
            { value: 'DOWNLOAD_URL', label: '直接下载' },
            { value: 'LANDING', label: '落地页下载' },
          ],
        },
        {
          key: 'app_store_first',
          label: '优先应用商店下载',
          type: 'radio',
          visibleWhenAll: [
            { field: 'objective', eq: 'APP' },
            { field: 'platform_type', eq: 'APP_ANDROID' },
          ],
          default: 'ON',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
          /* 线上：radio 后面跟 inline 提示（橙色 #f7aa47）
             「巨量广告媒体加白功能，确认账户拥有权限再启用」
             同时 label 右侧还有 ⓘ 气泡（应用商店直投…） */
          tip: '巨量广告媒体加白功能，确认账户拥有权限再启用',
          tipStyle: 'inline',
          tipType: 'warn',
          /* 线上气泡是结构化内容：.intro > .intro-title「应用商店直投」 +
             .intro-content（正文 + <br> + 请确保…），不是纯文本 */
          bubble: {
            when: { field: 'objective', eq: 'APP' },
            title: '应用商店直投',
            text: '应用商店直投勾选后，将优先跳转目标应用对应手机系统应用商店安装详情页，跳转失败则使用下载链接下载。\n请确保投放的应用在应用商店内已上架。',
          },
        },
        {
          key: 'data_dock_type',
          label: '数据对接方式',
          type: 'radio',
          visibleWhen: { field: 'objective', eq: 'APP' },
          options: [{ value: 'EVENT', label: '事件管理' }],
        },
        /* 线上：外层 el-form-item(label=优化目标) → content → .convert-content（1px 边框 + 16px padding）
         * .convert-content 内嵌 4 个子 el-form-item：事件回传方式 / 优化目标 / 深度优化目标 / 深度优化方式
         * 子项 label 宽 150px，整体比外层右移 17px（1px 边框 + 16px padding）。 */
        {
          key: 'convert_group',
          label: '优化目标',
          type: 'group',
          kind: 'convertGroup',
          visibleWhen: { field: 'objective', eq: 'APP' },
          fields: [
            {
              key: 'event_callback_type',
              label: '事件回传方式',
              type: 'radio',
              required: true,
              default: 'API',
              options: [
                { value: 'SDK', label: '应用SDK回传（巨量归因）' },
                { value: 'API', label: '应用API回传（融合归因）' },
              ],
              tip: '系统根据您所选回传方式新建事件；若事件已存在，事件的回传方式需与搭建时所选保持一致',
              tipType: 'warn',
            },
            {
              key: 'external_action',
              label: '优化目标',
              type: 'select',
              required: true,
              width: 360,
              placeholder: '请选择优化目标',
              options: [
                { value: 'AD_CONVERT_TYPE_CLICK', label: '点击量' },
                { value: 'AD_CONVERT_TYPE_SHOW', label: '展示量' },
                { value: 'AD_CONVERT_TYPE_ACTIVE', label: '激活' },
                { value: 'AD_CONVERT_TYPE_REGISTER', label: '注册' },
                { value: 'AD_CONVERT_TYPE_PAY', label: '付费' },
                { value: 'AD_CONVERT_TYPE_GAME_ADDICTION', label: '关键行为' },
                { value: 'AD_CONVERT_TYPE_APP_ORDER', label: 'app内下单' },
                { value: 'AD_CONVERT_TYPE_APP_VISIT', label: 'app内访问' },
                { value: 'AD_CONVERT_TYPE_APP_PAY', label: 'app内付费' },
              ],
            },
            {
              key: 'deep_external_action',
              label: '深度优化目标',
              type: 'select',
              width: 360,
              options: [{ value: 'NONE', label: '无' }],
            },
            /* 实测：投放模式=自动投放(UBMax) 或 竞价策略=最大转化 时「深度优化方式」消失 */
            {
              key: 'deep_bid_type',
              label: '深度优化方式',
              type: 'radio',
              required: true,
              visibleWhenAll: [
                { field: 'delivery_mode', neq: 'UBMAX' },
                { field: 'bid_strategy', neq: 'MAX_CONVERT' },
              ],
              default: 'DEEP_BID_DEFAULT',
              options: [
                { value: 'DEEP_BID_DEFAULT', label: '无' },
                { value: 'ROI_DIRECT_MAIL', label: 'ROI直投（ROI系数）' },
              ],
            },
          ],
        },
      ],
    },

    /* ─────────────────────────── ⑥ 投放版位 ─────────────────────────── */
    {
      key: 'inventory',
      title: '投放版位',
      fields: [
        {
          key: 'inventory_catalog',
          label: '广告位置',
          type: 'radio',
          default: 'UNIVERSAL_SMART',
          /* 截图款：两个分段按钮（白底 / 蓝边蓝字选中），与其它单选组的浅蓝底不同 */
          seg: true,
          /* 线上默认态实测：只有「通投智选」1 项、默认选中「通投智选」。
             「首选媒体」在搜索广告 / 自动投放(UBMax) / 营销场景=直播 等条件下才出现。 */
          optionsWhen: [
            {
              when: { field: 'ad_type', eq: 'SEARCH' },
              options: [{ value: 'MANUAL', label: '首选媒体' }],
            },
            {
              when: { field: 'delivery_mode', eq: 'UBMAX' },
              options: [{ value: 'UNIVERSAL_SMART', label: '通投智选' }],
            },
            {
              when: { field: 'marketing_goal', eq: 'LIVE' },
              options: [{ value: 'MANUAL', label: '首选媒体' }],
            },
            {
              /* 线上默认（手动投放 + 通投广告 + 短视频/图片）：两个分段按钮「通投智选 / 首选媒体」并排，
                 选「首选媒体」时下方出现带表头的媒体勾选盒 */
              options: [
                { value: 'UNIVERSAL_SMART', label: '通投智选' },
                { value: 'MANUAL', label: '首选媒体' },
              ],
            },
          ],
          tipsByOption: {
            UNIVERSAL_SMART: '通投智选下，广告会投到信息流和搜索场景，提升单计划跑量与效果稳定性',
            MANUAL: '广告将主要投放在首选媒体上，同时为了帮助广告计划更好的跑量和优化成本，系统有可能将广告智能拓展投放到其他流量场景。',
          },
        },
        /* 实测：投放模式=自动投放(UBMax) 时「首选媒体」勾选组消失 */
        /* 线上这块不是普通 el-checkbox-group，而是一个带边框的盒子：
         *   .dv2   w400 / border 1px #dee4f5 / inline-block
         *   .dv3   标题条「首选媒体」h40 / bg #fafbfe / fs14 #333
         *   .dv5   每行一个 checkbox（h32），「全选」是 indeterminate 半选态
         * 选中态 .select-item-selected；文字 14px #666 */
        {
          key: 'preferred_media',
          label: '',
          type: 'custom',
          kind: 'preferredMedia',
          visibleWhenAll: [
            { field: 'inventory_catalog', eq: 'MANUAL' },
            { field: 'delivery_mode', neq: 'UBMAX' },
          ],
        },
      ],
    },

    /* ─────────────────────────── ⑦ 用户定向 ─────────────────────────── */
    {
      key: 'audience',
      title: '用户定向',
      fields: [
        {
          key: 'target_package_source',
          label: '定向包来源',
          type: 'radio',
          default: 'CL',
          options: [
            { value: 'ACCOUNT', label: '账户已有定向包' },
            { value: 'CL', label: '智投定向包' },
          ],
          /* 线上实测：「账户已有定向包」恒置灰（aria-disabled=true + disabled），
             默认选中「智投定向包」。无 when = 恒置灰 */
          optionDisabled: [{ value: 'ACCOUNT' }],
        },
        {
          key: 'target_match_mode',
          label: '匹配方式',
          type: 'radio',
          optionsWhenField: 'target_package_source',
          optionsWhen: {
            ACCOUNT: [
              { value: 'PER_ACCOUNT', label: '每个账户选择一个定向包' },
              { value: 'PER_PROJECT', label: '每个项目选择一个定向包' },
            ],
            CL: [
              { value: 'ALL_SAME', label: '所有账户选择一个定向包' },
              { value: 'PER_ACCOUNT', label: '每个账户选择一个定向包' },
              { value: 'PER_PROJECT', label: '每个项目选择一个定向包' },
            ],
          },
        },
        /* 线上依赖实测：「使用运营商定向」在 **投放模式=自动投放(UBMax)** 时出现，
           默认选中「不使用」；投放模式=手动投放 时消失 */
        {
          key: 'carrier_targeting',
          label: '使用运营商定向',
          type: 'radio',
          default: 'OFF',
          /* 线上依赖实测：投放模式=自动投放(UBMax) 时出现；
             广告类型=搜索广告 时消失（此时「投放模式」字段本身也不显示） */
          visibleWhenAll: [
            { field: 'delivery_mode', eq: 'UBMAX' },
            { field: 'ad_type', neq: 'SEARCH' },
          ],
          options: [
            { value: 'OFF', label: '不使用' },
            { value: 'ON', label: '使用' },
          ],
        },
        {
          key: 'target_pick',
          label: '选择定向包',
          type: 'custom',
          kind: 'targetPick',
          /* 线上：字段行只有「选择定向包」按钮，资产表格是独立的一行 */
          hideTable: true,
          /* 线上 label 右侧 ⓘ 气泡原文 */
          bubble: {
            when: { field: 'target_package_source', eq: 'CL' },
            text: '完善基本信息、素材和标题后，在外层配置区点击编辑按钮配置该资产。',
          },
        },
        { key: 'target_table', label: '', type: 'custom', kind: 'assetTable', table: 'target',
          visibleWhen: { field: 'target_package_source', eq: 'CL' } },
      ],
    },

    /* ─────────────────────────── ⑧ 项目排期与预算 ─────────────────────────── */
    {
      key: 'schedule',
      title: '项目排期与预算',
      fields: [
        {
          key: 'schedule_config_mode',
          label: '配置模式',
          type: 'radio',
          default: 'UNIFIED',
          options: [
            { value: 'UNIFIED', label: '统一配置' },
            { value: 'PER_ACCOUNT', label: '分账户配置' },
          ],
          /* 实测：广告类型=搜索广告 时「分账户配置」置灰 */
          optionDisabled: [{ value: 'PER_ACCOUNT', when: { field: 'ad_type', eq: 'SEARCH' } }],
        },
        {
          key: 'schedule_time',
          label: '投放时间',
          type: 'radio',
          default: 'LONG_TERM',
          optionsWhenField: 'ad_type',
          optionsWhen: {
            SEARCH: [
              { value: 'SEVEN_DAY', label: '7日稳投' },
              { value: 'LONG_TERM', label: '从今天到长期投放' },
              { value: 'CUSTOM', label: '设置开始和结束日期' },
            ],
            ALL: [
              { value: 'LONG_TERM', label: '从今天到长期投放' },
              { value: 'CUSTOM', label: '设置开始和结束日期' },
            ],
          },
        },
        {
          key: 'schedule_period',
          label: '投放时段',
          type: 'radio',
          default: 'ALL',
          options: [
            { value: 'ALL', label: '不限' },
            { value: 'CUSTOM', label: '指定时间段' },
          ],
        },
        /* 线上：投放时段 = 指定时间段 时，下方展开周时段网格
           （表头 星期/时间 | 00:00-12:00 | 12:00-24:00，每列 24px 一小时，
             7 行周一~周日，行标签列 70px，格 24×24，边框 #ccc，表头底 #f8f9fa） */
        {
          key: 'week_time_grid',
          label: '',
          type: 'custom',
          kind: 'weekTimeGrid',
          visibleWhen: { field: 'schedule_period', eq: 'CUSTOM' },
        },
        {
          key: 'start_date',
          label: '开始日期',
          type: 'date',
          visibleWhen: { field: 'schedule_time', eq: 'CUSTOM' },
        },
        {
          key: 'end_date',
          label: '结束日期',
          type: 'date',
          visibleWhen: { field: 'schedule_time', eq: 'CUSTOM' },
        },
        {
          key: 'bid_strategy',
          label: '竞价策略',
          type: 'cards',
          cardStyle: 'bid',
          default: 'STABLE_COST',
          /* 线上 label 右侧 ⓘ 气泡原文 */
          bubble: {
            when: { field: 'schedule_config_mode', eq: 'UNIFIED' },
            text: '代表当前项目内全部广告的成本考量及出价方式',
          },
          optionsWhen: [
            {
              when: { field: 'delivery_mode', eq: 'UBMAX' },
              options: [
                { value: 'STABLE_COST', label: '稳定成本-常规版', desc: '成本稳定在出价附近' },
                { value: 'MAX_CONVERT', label: '最大转化', desc: '花完预算，拿到最大转化（价值）' },
              ],
            },
            {
              when: { field: 'ad_type', eq: 'SEARCH' },
              options: [
                { value: 'STABLE_COST', label: '稳定成本-常规版', desc: '成本稳定在出价附近' },
                { value: 'MAX_CONVERT', label: '最大转化', desc: '花完预算，拿到最大转化（价值）' },
              ],
            },
            {
              when: { field: 'deep_bid_type', eq: 'ROI_DIRECT_MAIL' },
              options: [
                { value: 'STABLE_COST', label: '稳定成本-常规版', desc: '成本稳定在出价附近' },
                { value: 'VOLUME', label: '放量投放', desc: '成本上浮，获取更多跑量' },
                { value: 'BEST_COST', label: '最优成本', desc: '均匀消耗预算，成本不超过出价' },
                { value: 'MAX_CONVERT', label: '最大转化', desc: '花完预算，拿到最大转化（价值）' },
              ],
            },
            {
              options: [
                { value: 'STABLE_COST', label: '稳定成本-常规版', desc: '成本稳定在出价附近' },
                { value: 'STABLE_UPGRADE', label: '稳定成本-升级版', desc: '广告潜力探索' },
                { value: 'VOLUME', label: '放量投放', desc: '成本上浮，获取更多跑量' },
                { value: 'BEST_COST', label: '最优成本', desc: '均匀消耗预算，成本不超过出价' },
                { value: 'MAX_CONVERT', label: '最大转化', desc: '花完预算，拿到最大转化（价值）' },
              ],
            },
          ],
        },
        /* 实测：竞价策略=最大转化 时出现「预算择优分配」 */
        {
          key: 'budget_alloc',
          label: '预算择优分配',
          type: 'radio',
          visibleWhen: { field: 'bid_strategy', eq: 'MAX_CONVERT' },
          options: [
            { value: 'OFF', label: '不开启' },
            { value: 'ON', label: '开启' },
          ],
        },
        {
          key: 'budget_mode',
          label: '项目预算',
          type: 'radio',
          default: 'DAY',
          /* 线上 label 右侧 ⓘ 气泡原文 */
          bubble: {
            when: { field: 'schedule_config_mode', eq: 'UNIFIED' },
            text: '当前项目内全部广告可消耗的最大预算，项目预算撞线后广告即使预算未消耗完成也会停投',
          },
          /* 线上默认态实测：只有「日预算」1 项。
             「不限」是搜索广告（广告类型=搜索广告）时的额外选项。 */
          optionsWhen: [
            {
              when: { field: 'ad_type', eq: 'SEARCH' },
              options: [
                { value: 'OFF', label: '不限' },
                { value: 'DAY', label: '日预算' },
              ],
            },
            {
              options: [{ value: 'DAY', label: '日预算' }],
            },
          ],
        },
        {
          key: 'pay_method',
          label: '付费方式',
          type: 'radio',
          default: 'PRICING_OCPM',
          optionsWhenField: 'ad_type',
          optionsWhen: {
            SEARCH: [
              { value: 'PRICING_OCPM', label: '目标转化出价-按展示付费(OCPM)' },
              { value: 'PRICING_OCPC', label: '目标转化出价-按点击付费(OCPC)' },
            ],
            ALL: [{ value: 'PRICING_OCPM', label: '目标转化出价-按展示付费(OCPM)' }],
          },
        },
        /* 线上「预算出价配置模式」实测：它**不是标准 el-form-item**，
           而是 .budget-and-bid-wrapper 里的第一行：
             .mb16 > .mode-label「预算出价配置模式」(112×18 / 14px #666)
                     + .ml32 单选组（margin-left 32px）
           单选组三项：统一配置(默认选中) / 分账户配置 / 分主体配置
           它在「付费方式」之后、「日预算」之前。 */
        {
          key: 'budget_config_mode',
          label: '预算出价配置模式',
          type: 'custom',
          kind: 'budgetConfigMode',
          default: 'UNIFIED',
          options: [
            { value: 'UNIFIED', label: '统一配置' },
            { value: 'PER_ACCOUNT', label: '分账户配置' },
            { value: 'PER_SUBJECT', label: '分主体配置' },
          ],
        },
        /* 线上「日预算」是独立平铺字段（label 宽 180px / margin-left:180px），
           内容 = 输入框 + 「元」+ 快捷值 300|500|1000|2000。
           线上「项目排期与预算」分区顺序：配置模式 / 投放时间 / 投放时段 / 竞价策略 /
           项目预算 / 付费方式 / 预算出价配置模式 / 日预算 / 出价方式 / 出价 */
        {
          key: 'budget',
          model: 'budget',
          label: '日预算',
          type: 'number',
          labelWidth: 180,
          quick: [300, 500, 1000, 2000],
          /* 由 budget_panel 在「预算出价规则1」卡内渲染，不再平铺 */
          inRule: true,
          /* 线上依赖实测：广告类型=搜索广告 时「日预算」消失 */
          visibleWhenAll: [
            { field: 'budget_mode', eq: 'DAY' },
            { field: 'ad_type', neq: 'SEARCH' },
          ],
        },
        /* 线上「预算出价区」：统一配置=只有右侧内容；分账户/分主体=左侧列表 + 右侧内容，
           右上角分别是「复制到其他账户 / 复制到其他主体」+「全部收起」，
           下方为竞价策略汇总条 + 「预算出价规则1」卡（卡内含日预算） */
        { key: 'budget_panel', label: '', type: 'custom', kind: 'budgetPanel' },
        /* 线上实测：「出价方式」与「出价」在**默认态就显示**（label 宽 180px），
           位于「预算出价规则1」之后。「出价方式」默认选中「固定出价」，
           带气泡：阶梯出价是指根据您的出价范围，在生成的项目中做等差分配出价 随机出价是指会在出价范围内随机分配出价 */
        {
          key: 'bid_method',
          model: 'bid_method',
          label: '出价方式',
          type: 'radio',
          labelWidth: 180,
          default: 'FIXED',
          /* 归入「预算出价规则1」卡片内部渲染（inRule），不再作为独立字段行 */
          inRule: true,
          /* 线上依赖实测：投放模式=手动投放 时「出价方式」「出价」消失 */
          visibleWhen: { field: 'delivery_mode', eq: 'UBMAX' },
          bubble: {
            when: { field: 'schedule_config_mode', eq: 'UNIFIED' },
            text: '阶梯出价是指根据您的出价范围，在生成的项目中做等差分配出价 随机出价是指会在出价范围内随机分配出价',
          },
          options: [
            { value: 'FIXED', label: '固定出价' },
            { value: 'LADDER', label: '阶梯出价' },
            { value: 'RANDOM', label: '随机出价' },
          ],
        },
        {
          key: 'bid',
          model: 'bid',
          label: '出价',
          type: 'custom',
          kind: 'bidAmount',
          labelWidth: 180,
          /* 归入「预算出价规则1」卡片内部渲染（inRule） */
          inRule: true,
          visibleWhen: { field: 'delivery_mode', eq: 'UBMAX' },
        },
      ],
    },

    /* ─────────────────────────── ⑨ 搜索快投 ─────────────────────────── */
    {
      key: 'search_fast',
      title: '搜索快投',
      /* 实测：广告类型=搜索广告 或 投放模式=自动投放(UBMax) 时该分区消失 */
      visibleWhen: { field: 'searchFast', truthy: true },
      fields: [
        {
          key: 'keyword',
          model: 'searchForm.keyword',
          label: '关键词',
          type: 'custom',
          kind: 'keywordOps',
        },
        {
          key: 'bid_coef',
          model: 'searchForm.bid_coef',
          label: '出价系数',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
          tip: '不启用出价系数时默认出价系数为1（仅针对可设置出价系数的账户生效）',
        },
        {
          key: 'extend',
          model: 'searchForm.extend',
          label: '定向拓展',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'service',
          model: 'searchForm.service',
          label: '',
          type: 'custom',
          kind: 'searchExempt',
        },
      ],
    },

    /* ─────────────────────────── ⑩ 搜索流量（仅搜索广告） ─────────────────────────── */
    {
      key: 'search_traffic',
      title: '搜索流量',
      /* 实测（state_search_ad）：广告类型=搜索广告 时该分区出现，位置在「项目排期与预算」之后 */
      visibleWhen: { field: 'ad_type', eq: 'SEARCH' },
      fields: [
        {
          key: 'blue_ocean',
          model: 'search_blue_ocean',
          label: '蓝海关键词',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'keyword_switch',
          model: 'search_keyword_switch',
          label: '关键词',
          type: 'radio',
          default: 'ON',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'keyword_match_mode',
          model: 'search_keyword_match_mode',
          label: '匹配方式',
          type: 'radio',
          default: 'ALL_SAME',
          options: [
            { value: 'ALL_SAME', label: '所有账户选择一个关键词包' },
            { value: 'PER_ACCOUNT', label: '每个账户选择一个关键词包' },
            { value: 'PER_PROJECT', label: '每个项目选择一个关键词包' },
          ],
        },
        {
          key: 'keyword_pack_pick',
          label: '选择关键词包',
          type: 'custom',
          kind: 'keywordPackPick',
        },
        {
          key: 'smart_expand',
          model: 'search_smart_expand',
          label: '智能拓流',
          type: 'radio',
          default: 'OFF',
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
      ],
    },

    /* ─────────────────────────── ⑪ 项目名称 ─────────────────────────── */
    {
      key: 'project_name',
      title: '项目名称',
      fields: [
        {
          key: 'operation',
          label: '项目默认状态',
          type: 'radio',
          default: 'ENABLE',
          options: [
            { value: 'DISABLE', label: '暂停' },
            { value: 'ENABLE', label: '开启' },
          ],
        },
        {
          key: 'project_name_mode',
          label: '名称配置模式',
          type: 'radio',
          default: 'UNIFIED',
          options: [
            { value: 'UNIFIED', label: '统一配置' },
            { value: 'PER_ACCOUNT', label: '分账户配置' },
          ],
        },
        {
          key: 'name',
          label: '项目名称',
          type: 'input',
          required: true,
          width: 360,
          counter: true,
          /* 线上 label 右侧 ⓘ 气泡原文 */
          bubble: {
            when: { field: 'project_name_mode', eq: 'UNIFIED' },
            text: '使用通配符后可能存在名称过长问题，勾选后系统将自动截断超出部分的内容。（注意：自动截断后可能存在同名风险）',
          },
          /* 线上：每个 checkbox 后面跟一个 ⓘ（mg-icon-question2 / popover width 350） */
          extras: [
            {
              key: 'auto_truncate', model: 'auto_truncate', type: 'checkbox', label: '自动截断',
              bubble: '使用通配符后可能存在名称过长问题，勾选后系统将自动截断超出部分的内容。（注意：自动截断后可能存在同名风险）',
            },
            {
              key: 'random_suffix', model: 'random_suffix', type: 'checkbox', label: '随机数后缀',
              bubble: '为名称添加4位随机数的后缀,减少重名报错反复重提',
            },
          ],
          /* 线上：通配符区每个 tag 自带 tooltip（width 350px / show-after 2000） */
          wildcards: [
            { label: '下载链接标识', tip: '取下载或预约下载链接最后一个 / 后的全部字符串，保留 query；例如 demo?a=1。' },
            { label: '渠道包名', tip: '在项目名称中展示项目匹配的渠道包名，没有选中渠道包时则替换为空。' },
            { label: '监测活动名', tip: '在项目名称中展示项目匹配的监测活动名称，没有选中监测活动时则替换为空。' },
          ],
        },
        {
          key: 'dynamic_index',
          model: 'dynamic_index',
          label: '项目动态标号',
          type: 'input',
        },
      ],
    },
  ],

  /* 抽屉内会打开二级弹窗的按钮 */
  subDialogs: [
    { key: 'asset_group_pick', label: '选择资产组', dialog: 'assetGroup', size: [1136, 725] },
    { key: 'product_pick', label: '选择产品', dialog: 'selectProduct', size: [1136, 725] },
    { key: 'event_asset_pick', label: '选择事件资产', dialog: 'eventAsset', size: [1136, 725] },
    { key: 'link_group_pick', label: '选择分包和链接组', dialog: 'monitorGroup', size: [1136, 725] },
    { key: 'target_pick', label: '选择定向包', dialog: 'targetPackage', size: [1136, 725] },
    { key: 'keyword_pack_pick', label: '选择关键词包', dialog: 'keywordPack', size: [1136, 725] },
    { key: 'keyword', label: '编辑', dialog: 'searchKeyword', size: [800, 600] },
    { key: 'name', label: '插入更多', dialog: 'wildcard', size: [1016, 600] },
  ],

  /* 抽屉底部 */
  footer: { buttons: ['取消', '确定'], cancelText: '取 消', okText: '确 定' },
};
