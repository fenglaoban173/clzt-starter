/**
 * 巨量引擎商业开放平台 v3.0 —— 项目 / 广告（单元）批量操作接口 & 弹窗表单定义
 *
 * 依据官方文档逐条采集（2026-11-18）：
 *   巨量营销升级版 https://open.oceanengine.com/labels/7
 *   项目管理模块 / 单元管理模块 / 否定词管理 / 关键词管理 / 定向包管理 / 创意组件 / 一键起量
 *
 * 约定：
 *   field.apiField —— 该控件在接口请求体中对应的字段名（弹窗里直接展示，便于核对）
 *   build(rows, form) —— 构造提交给巨量接口的请求体（原型态，用于「请求体预览」）
 *   field.rule —— 官方文档中的取值限制说明
 */

export const OCEAN_API_BASE = 'https://api.oceanengine.com';

/** 权限点：单元层级 */
const AUTH_PROMOTION = '投放管理-单元列表-单元创编';
/** 权限点：项目层级 */
const AUTH_PROJECT = '投放管理-项目列表-项目创编';

/** 批量条数上限（各批量接口 list 长度限制 1～10） */
export const BATCH_LIMIT = 10;

/** 数值型入参：空值保持 undefined，其余转成数字（接口要求 number 类型） */
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

/**
 * 线上（创量）点击后仅提示、不弹窗的操作：所选广告类型不支持该操作。
 * 巨量接口本身是有对应字段的，本地原型仍给出完整表单，并保留该提示作为说明。
 */
export const ONLINE_ONLY_TOAST = {
  修改深度出价: '所选广告不支持修改深度转化出价！',
  修改ROI系数: '所选广告无ROI系数，操作取消！',
};

// ---------------------------------------------------------------- 公共枚举
export const ENUMS = {
  optStatus: [
    { label: '启用', value: 'ENABLE' },
    { label: '暂停', value: 'DISABLE' },
  ],
  promotionBudgetMode: [
    { label: '日预算', value: 'BUDGET_MODE_DAY' },
    { label: '总预算', value: 'BUDGET_MODE_TOTAL' },
  ],
  projectBudgetMode: [
    { label: '日预算', value: 'BUDGET_MODE_DAY' },
    { label: '不限', value: 'BUDGET_MODE_INFINITE' },
    { label: '总预算', value: 'BUDGET_MODE_TOTAL_PROJECT' },
  ],
  scheduleType: [
    { label: '从今天起长期投放', value: 'SCHEDULE_FROM_NOW' },
    { label: '设置开始和结束日期', value: 'SCHEDULE_START_END' },
  ],
  scheduleScene: [
    { label: '立即生效', value: 'REALTIME' },
    { label: '次日0点生效', value: 'NEXT_DAY' },
    { label: '自定义时间', value: 'CUSTOM_TIME' },
  ],
  downloadMode: [
    { label: '优先商店下载', value: 'APP_STORE_DELIVERY' },
    { label: '默认下载', value: 'DEFAULT' },
  ],
  openUrlType: [
    { label: '不启用', value: 'NONE' },
    { label: '商品库所含链接', value: 'DPA' },
    { label: '自定义链接', value: 'CUSTOM' },
  ],
  trackUrlType: [
    { label: '自定义链接', value: 'CUSTOM' },
    { label: '监测链接组', value: 'GROUP_ID' },
  ],
  sendType: [
    { label: '服务器端上传', value: 'SERVER_SEND' },
    { label: '客户端上传', value: 'CLIENT_SEND' },
  ],
  matchType: [
    { label: '广泛匹配', value: 'EXTENSIVE' },
    { label: '短语匹配', value: 'PHRASE' },
    { label: '精确匹配', value: 'PRECISION' },
  ],
  keywordBidType: [
    { label: '自定义出价', value: 'CUSTOM' },
    { label: '随营销出价', value: 'WITH_PROMOTION' },
  ],
  onOff: [
    { label: '开启', value: 'ON' },
    { label: '关闭', value: 'OFF' },
  ],
  raiseEffectiveType: [{ label: '立即起量', value: 'RAISE_NOW' }],
  repeatedDay: [
    { label: '不重复', value: '' },
    { label: '每天重复', value: 'EVERY_DAY' },
    { label: '每周一', value: 'PER_MONDAY' },
    { label: '每周二', value: 'PER_TUESDAY' },
    { label: '每周三', value: 'PER_WEDNESDAY' },
    { label: '每周四', value: 'PER_THURSDAY' },
    { label: '每周五', value: 'PER_FRIDAY' },
    { label: '每周六', value: 'PER_SATURDAY' },
    { label: '每周日', value: 'PER_SUNDAY' },
  ],
  hideIfConverted: [
    { label: '不限制', value: 'NO_EXCLUDE' },
    { label: '单元', value: 'PROMOTION' },
    { label: '项目', value: 'PROJECT' },
    { label: '投放账户', value: 'ADVERTISER' },
    { label: '应用', value: 'APP' },
    { label: '客户', value: 'CUSTOMER' },
    { label: '旧版巨量引擎工作台', value: 'ORGANIZATION' },
    { label: '全渠道应用', value: 'GLOBAL_APP' },
  ],
  filterEvent: [
    { label: '优化目标', value: 'AD_CONVERT_EXTERNAL_ACTION' },
    { label: '激活', value: 'AD_CONVERT_TYPE_ACTIVE' },
    { label: '注册', value: 'AD_CONVERT_TYPE_ACTIVE_REGISTER' },
    { label: '付费', value: 'AD_CONVERT_TYPE_PAY' },
  ],
  componentTypes: [
    { label: '选择磁贴', value: 'CHOICE_MAGNET' },
    { label: '投票磁贴', value: 'VOTE_MAGNET' },
    { label: '图片磁贴', value: 'IMAGE_MAGNET' },
    { label: '电商磁贴', value: 'COMMERCE_MAGNET' },
    { label: '优惠券磁贴', value: 'COUPON_MAGNET' },
    { label: '游戏礼包码', value: 'GAME_PACK' },
    { label: '投放卡片', value: 'PROMOTION_CARD' },
    { label: '轻互动组件', value: 'LIGHT_INTER_ACTIVE' },
    { label: '游戏预约按钮', value: 'RESERVATION_BUTTON' },
    { label: '穿山甲轻互动组件', value: 'UNION_LIGHT_INTERACTIVE' },
    { label: '卡片-展示价格力', value: 'ECOMMERCE_CARD' },
    { label: '半屏-点击互动类', value: 'HALF_INTERACTIVE' },
  ],
  componentStatus: [
    { label: '通过', value: 'PASS' },
    { label: '新建', value: 'UNDER' },
    { label: '未通过', value: 'REJECT' },
  ],
  gender: [
    { label: '不限', value: 'NONE' },
    { label: '男', value: 'GENDER_MALE' },
    { label: '女', value: 'GENDER_FEMALE' },
  ],
};

// --------------------------------------------------------- 广告（单元）批量操作
export const PROMOTION_BATCH_OPS = {
  启用: {
    title: '批量启用广告',
    desc: (n) => `已选中 ${n} 个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/status/update/', name: '批量更新营销启用状态', scope: AUTH_PROMOTION },
    fields: [
      { key: 'opt_status', label: '操作', type: 'radio', apiField: 'data[].opt_status', required: true, default: 'ENABLE', options: [{ label: '启用', value: 'ENABLE' }] },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', data: rows.map((r) => ({ promotion_id: r.id, opt_status: form.opt_status })) }),
  },
  暂停: {
    title: '批量暂停广告',
    desc: (n) => `已选中 ${n} 个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/status/update/', name: '批量更新营销启用状态', scope: AUTH_PROMOTION },
    fields: [
      { key: 'opt_status', label: '操作', type: 'radio', apiField: 'data[].opt_status', required: true, default: 'DISABLE', options: [{ label: '暂停', value: 'DISABLE' }] },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', data: rows.map((r) => ({ promotion_id: r.id, opt_status: form.opt_status })) }),
  },
  删除: {
    title: '批量删除广告',
    desc: (n) => `已选中 ${n} 个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/delete/', name: '批量删除营销', scope: AUTH_PROMOTION },
    fields: [
      { key: 'promotion_ids', label: '营销ID', type: 'readonly', apiField: 'promotion_ids', required: true, hint: '一次最多删除 10 个广告' },
    ],
    build: (rows) => ({ advertiser_id: '{advertiser_id}', promotion_ids: rows.map((r) => r.id) }),
  },
  修改预算: {
    title: '批量修改预算',
    desc: (n) => `已选${n}条可操作广告计划`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/budget/update/', name: '批量更新营销预算', scope: AUTH_PROMOTION },
    fields: [
      { key: 'budget_mode', label: '预算类型', type: 'radio', apiField: 'data[].budget_mode', required: true, default: 'BUDGET_MODE_DAY', options: ENUMS.promotionBudgetMode, rule: '预算类型不支持修改，仅可传 BUDGET_MODE_DAY（日预算，默认值）/ BUDGET_MODE_TOTAL（总预算）' },
      { key: 'budget', label: '预算', type: 'number', apiField: 'data[].budget', required: true, unit: '元', placeholder: '请输入预算', rule: '出价方式为 OCPM 时不少于 300 元；24 小时内修改预算不超过 20 次；单次修改幅度不低于 100 元；修改后预算不得低于当前已消费金额的 105%；取值范围 ≥ 0' },
      { key: 'scope', label: '修改方式', type: 'radio', apiField: 'data[]', required: true, default: 'all', options: [{ label: '统一修改', value: 'all' }, { label: '分别修改', value: 'each' }] },
      { key: 'each', label: '分别修改预算', type: 'table', apiField: 'data[].budget', columns: [{ key: 'budget', label: '分别修改预算', placeholder: '请输入预算' }], visibleWhen: { scope: 'each' } },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ promotion_id: r.id, budget_mode: form.budget_mode, budget: num(form.scope === 'each' ? r.__budget : form.budget) })),
    }),
  },
  修改出价: {
    title: '批量修改出价',
    desc: (n) => `已选${n}条可操作广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/bid/update/', name: '批量更新营销出价', scope: AUTH_PROMOTION },
    fields: [
      { key: 'bid', label: '出价', type: 'number', apiField: 'data[].bid', required: true, unit: '元', placeholder: '请输入出价', rule: '单位「元」，精度两位小数' },
      { key: 'scope', label: '修改方式', type: 'radio', apiField: 'data[]', required: true, default: 'all', options: [{ label: '统一修改', value: 'all' }, { label: '分别修改', value: 'each' }] },
      { key: 'each', label: '分别修改出价', type: 'table', apiField: 'data[].bid', columns: [{ key: 'bid', label: '分别修改出价', placeholder: '请输入出价' }], visibleWhen: { scope: 'each' } },
      { key: 'notify', label: '', type: 'checkbox', apiField: '-', text: '操作失败通知我' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({
        promotion_id: r.id,
        bid: num(r.__bid !== undefined && r.__bid !== '' ? r.__bid : form.bid),
      })),
    }),
  },
  修改深度出价: {
    title: '批量修改深度出价',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/deepbid/update/', name: '批量修改深度出价', scope: AUTH_PROMOTION },
    fields: [
      { key: 'deepbid', label: '深度出价', type: 'number', apiField: 'data[].deepbid', required: true, unit: '元', placeholder: '请输入深度出价', rule: '单位「元」，精度两位小数；取值范围 0.1～10000 元' },
      { key: 'scope', label: '修改方式', type: 'radio', apiField: 'data[]', required: true, default: 'all', options: [{ label: '统一修改', value: 'all' }, { label: '分别修改', value: 'each' }] },
      { key: 'each', label: '分别修改深度出价', type: 'table', apiField: 'data[].deepbid', columns: [{ key: 'deepbid', label: '分别修改深度出价', placeholder: '请输入出价' }], visibleWhen: { scope: 'each' } },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({
        promotion_id: r.id,
        deepbid: num(r.__deepbid !== undefined && r.__deepbid !== '' ? r.__deepbid : form.deepbid),
      })),
    }),
  },
  修改ROI系数: {
    title: '批量修改ROI系数',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元', scope: AUTH_PROMOTION },
    fields: [
      { key: 'roi_goal', label: 'ROI系数', type: 'number', apiField: 'roi_goal', required: true, placeholder: '请输入ROI系数', rule: '深度转化ROI系数，范围 (0,5]，保留小数点后四位；deep_bid_type = ROI_COEFFICIENT 时必填' },
      { key: 'first_roi_goal', label: '首日ROI系数', type: 'number', apiField: 'first_roi_goal', placeholder: '请输入首日ROI系数', rule: '范围 (0,5]，保留小数点后四位；手动链路下深度优化方式为首日ROI+7日ROI时必填' },
      { key: 'shop_multi_roi_goals', label: '电商平台多ROI系数', type: 'multiRoi', apiField: 'shop_multi_roi_goals[]', rule: '按电商平台分别设置 ROI 系数，list 长度最长 4；roi_goal 范围 [0.01,100]，最多 4 位小数' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      roi_goal: num(form.roi_goal),
      first_roi_goal: num(form.first_roi_goal),
    }),
  },
  修改创意: {
    title: '修改创意',
    desc: (n) => `已选中 ${n} 个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（promotion_materials）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', apiField: '-', required: true, default: '替换素材', options: ['删除素材', '暂停素材', '替换素材', '增加素材'] },
      { key: 'distribute', label: '素材分配方式', type: 'radio', apiField: '-', required: true, default: '全部相同', options: ['全部相同', '平均分配'] },
      { key: 'materials', label: '素材', type: 'material', apiField: 'promotion_materials', rule: '视频素材 video_material_list 与图片素材 image_material_list 最少传入一种，各上限 10 个；系统将根据广告投放模式调整上限，超出部分不生效' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      promotion_materials: { video_material_list: [], image_material_list: [] },
    }),
  },
  开启一键起量: {
    title: '设置一键起量',
    desc: (n) => `已选 ${n} 个可调整广告，将全量更新所有预约中的起量方案，已生效的不受影响。`,
    api: { method: 'POST', path: '/open_api/v3.0/tools/promotion_raise/set/', name: '开启/更新一键起量', scope: AUTH_PROMOTION },
    // 线上「开启一键起量」走独立弹窗 AdOneClickRaiseDialog：预算设置规则 / 起量预算批量 / 起量生效时间 / 起量方案
    fields: [
      { key: 'budgetRule', label: '预算设置规则', type: 'radio', apiField: 'raise_info[]', required: true, default: '统一设置', options: ['统一设置', '分别设置'] },
      { key: 'raise_budget_batch', label: '起量预算批量', type: 'number', apiField: 'raise_info[].raise_budget', unit: '元', placeholder: '请输入起量预算', rule: '起量预算需大于等于计划出价、小于等于计划预算，允许小数点后两位' },
      { key: 'is_effective_now', label: '起量生效时间', type: 'radio', apiField: 'raise_info[].is_effective_now', required: true, default: '指定时间', options: [{ label: '立即生效', value: '立即生效' }, { label: '指定时间', value: '指定时间' }], rule: '仅支持营销状态为「投放中」的营销立即生效；仅支持 1 个方案设置「立即生效」' },
      { key: 'raise_time', label: '起量时间', type: 'datetime', apiField: 'raise_info[].appointed_time.raise_time', placeholder: '请选择起量时间', rule: '方案之间起量时间最少间隔 6 小时' },
      { key: 'repeated_day', label: '重复周期', type: 'select', apiField: 'raise_info[].appointed_time.repeated_day', options: ENUMS.repeatedDay.filter((o) => o.value), rule: '仅生效一次；传重复周期时 raise_time 格式为 HH:MM；星期支持多选，EVERY_DAY（每天）与其它星期不可同时传入' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      // 每个起量方案一条：方案级起量预算 + 该方案自己的广告列表逐条预算
      raise_info: (form.plans && form.plans.length ? form.plans : [form]).map((p) => ({
        raise_budget: num(p.raise_budget),
        is_effective_now: p.is_effective_now === '立即生效',
        appointed_time:
          p.is_effective_now === '立即生效'
            ? undefined
            : {
                raise_time: p.raise_time,
                // 星期支持多选
                repeated_day:
                  p.repeated_day && p.repeated_day.length ? p.repeated_day : undefined,
              },
        // 「分别设置」时每条广告各自的起量预算（原型字段，线上按广告维度下发）
        raise_budgets: (p.rows || []).map((r) => ({
          ad_id: r.ad_id,
          raise_budget: num(r.raise_budget),
        })),
      })),
    }),
  },
  修改落地页: {
    title: '修改落地页',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（external_url_material_list）', scope: AUTH_PROMOTION },
    notes: [
      '1) 落地页修改为覆盖式修改，如您的广告中原有4个落地页，而在此处您只选择3个落地页，则广告中落地页数量将变为3个',
      '2) 请确保您所填写的落地页类型与原有广告内投放内容一致，否则可能引发报错。',
    ],
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', apiField: '-', required: true, default: '统一修改', options: ['统一修改', '分别修改'] },
      { key: 'urls', label: '落地页链接', type: 'links', apiField: 'external_url_material_list[]', required: true, placeholder: '请输入落地页链接', rule: '普通落地页链接素材，总共设置落地页素材 ≤ 30 个' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      external_url_material_list: (form.urls || []).map((u) => ({ landing_url: u, ad_id: '' })),
    }),
  },
  修改直达链接: {
    title: '修改直达链接',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（open_url）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'open_url', label: '直达链接', type: 'input', apiField: 'open_url', required: true, placeholder: '请输入直达链接', rule: '直达链接地址，landing_type = SHOP 电商投放时有效；应用调起场景需在单元层级设置' },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', promotion_id: '{promotion_id}', open_url: form.open_url }),
  },
  修改广告标题和素材: {
    title: '修改广告标题和素材',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（title_material_list / promotion_materials）', scope: AUTH_PROMOTION },
    // R77：线上「修改广告标题和素材」走独立弹窗 AdTitleMaterialDialog（修改创意标题 / 创意标题库 / 修改创意素材 / 选择素材）
    fields: [
      { key: 'titleMode', label: '修改创意标题', type: 'radio', apiField: 'title_material_list[].title', required: true, default: '启用', options: ['不启用', '启用'], rule: '不启用时不修改标题；启用后所有广告标题被覆盖为选中文案' },
      { key: 'titles', label: '创意标题', type: 'links', apiField: 'title_material_list[].title', required: true, placeholder: '已选：0/10，点击添加文案', visibleWhen: { titleMode: '启用' }, rule: '标题素材上限 10 个，非直播链路必填；创意标题长度 5～55 字（两个英文字符占 1 字）' },
      { key: 'materialMode', label: '修改创意素材', type: 'radio', apiField: 'promotion_materials', required: true, default: '启用', options: ['不启用', '启用'] },
      { key: 'uploadScope', label: '视频上传至', type: 'select', apiField: 'promotion_materials.video_material_list', default: '升级版工作台组织', options: ['升级版工作台组织', '广告主账户'], visibleWhen: { materialMode: '启用' }, rule: '组织上传需在升级版工作台「素材-视频管理」处操作共享' },
      { key: 'orgAccount', label: '组织账户', type: 'select', apiField: 'promotion_materials.video_material_list', required: true, visibleWhen: { materialMode: '启用' }, rule: '选择素材所属的组织账户' },
      { key: 'videos', label: '视频素材', type: 'material', apiField: 'promotion_materials.video_material_list', visibleWhen: { materialMode: '启用' }, rule: '视频素材最多 50 个；包含手动投放时最多 10 个视频' },
      { key: 'images', label: '图片素材', type: 'material', apiField: 'promotion_materials.image_material_list', visibleWhen: { materialMode: '启用' }, rule: '图片素材最多 50 个；包含手动投放时最多 10 张图片' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      title_material_list: form.titleMode === '启用'
        ? (form.titles || []).map((t) => ({ title: typeof t === 'string' ? t : t.text }))
        : undefined,
      promotion_materials: form.materialMode === '启用'
        ? {
          video_material_list: (form.videos || []).map((v) => ({ video_id: v.id, video_name: v.name })),
          image_material_list: (form.images || []).map((v) => ({ image_id: v.id, image_name: v.name })),
        }
        : undefined,
    }),
  },
  修改时段: {
    title: '批量修改时段',
    desc: (n) => `已选${n}条可操作广告计划`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/schedule_time/update/', name: '批量更新营销投放时段', scope: AUTH_PROMOTION },
    // 线上「修改时段」走独立弹窗 AdScheduleDialog（对齐项目列表「修改项目排期」布局）：修改规则 / 生效时间 / 投放时段栅格
    fields: [
      { key: 'schedule_scene', label: '修改规则', type: 'radio', apiField: 'data[].schedule_scene', required: true, default: 'REALTIME', options: ENUMS.scheduleScene, rule: 'REALTIME 立即生效 / NEXT_DAY 次日 0 点生效 / CUSTOM_TIME 自定义时间（需配合 effective_time）' },
      { key: 'effective_time', label: '生效时间', type: 'datetime', apiField: 'data[].effective_time', placeholder: '请选择生效时间', visibleWhen: { schedule_scene: 'CUSTOM_TIME' }, rule: 'schedule_scene = CUSTOM_TIME 时必填' },
      { key: 'schedule_time', label: '投放时段', type: 'schedule', apiField: 'data[].schedule_time', required: true, rule: '格式是 48×7 位字符串（周一至周日，每天 48 个半小时区段，0 不投放 / 1 投放）；不传、全 0、全 1 均代表全时段投放；仅支持 delivery_mode = MANUAL 时修改单元层级投放时段；所选时段必须在营销所属项目的投放时段范围内' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({
        promotion_id: r.id,
        schedule_scene: form.schedule_scene,
        effective_time: form.effective_time,
        schedule_time: form.schedule_time,
      })),
    }),
  },
  修改广告否定词: {
    title: '批量修改否定词',
    api: { method: 'POST', path: '/open_api/v3.0/tools/privative_word/promotion/update/', name: '批量更新营销否定词', scope: AUTH_PROMOTION },
    notes: ['当前未操作过添加/替换否定词，请手动输入否定词。'],
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', apiField: '-', required: true, default: '添加否定词', options: [{ label: '添加否定词', value: 'add' }, { label: '替换否定词', value: 'update' }], rule: '添加调用 /tools/privative_word/promotion/add/，替换调用 /tools/privative_word/promotion/update/' },
      { key: 'phrase_words', label: '短语否定词', type: 'tags', apiField: 'promotion_list[].phrase_words[]', placeholder: '请输入短语否定词，回车添加', rule: '搜索直投场景下否定词列表不超过 500 个；单个否定词不超过 30 个汉字（或 60 个英文字符）；不能包含 emoji，不能为空字符串' },
      { key: 'precise_words', label: '精确否定词', type: 'tags', apiField: 'promotion_list[].precise_words[]', placeholder: '请输入精确否定词，回车添加', rule: '同短语否定词限制' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_list: rows.map((r) => ({ promotion_id: r.id, phrase_words: form.phrase_words || [], precise_words: form.precise_words || [] })),
    }),
  },
  修改产品名称: {
    title: '修改产品名称',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（product_info.titles）', scope: AUTH_PROMOTION },
    // R78：线上「修改产品名称」为独立弹窗（仅一个产品名称输入框），见 AdProductNameDialog
    notes: ['修改对象为广告层级-产品信息模块-产品名称'],
    fields: [
      { key: 'titles', label: '产品名称', type: 'input', apiField: 'product_info.titles[]', required: true, placeholder: '1-20个字符', rule: '产品名称，字数限制 1～20，数组上限为 1' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      product_info: { product_name_type: 'CUSTOM', titles: form.titles ? [form.titles] : [] },
    }),
  },
  修改产品主图: {
    title: '修改产品主图',
    desc: (n) => `已选${n}个广告，请注意本次修改为全覆盖式更新`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（product_info.image_ids）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'image_ids', label: '产品主图', type: 'upload', apiField: 'product_info.image_ids[]', required: true, uploadCount: '图片(0/10)', rule: '自定义产品主图，尺寸要求 108×108，上限 10 个；可通过【获取图片素材】接口获得' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      product_info: { image_ids: form.image_ids || [] },
    }),
  },
  修改产品卖点: {
    title: '修改产品卖点',
    desc: (n) => `已选中${n}个广告，请注意本次修改为全覆盖式更新。`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（product_info.selling_points）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'selling_points', label: '产品卖点', type: 'tags', apiField: 'product_info.selling_points[]', required: true, placeholder: '空格分隔,最多10个，每个标签不超过9个字', rule: '自定义产品卖点，字数限制 6～9，数组上限 10' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      promotion_id: '{promotion_id}',
      product_info: { selling_points: form.selling_points || [] },
    }),
  },
  修改直达备用链接: {
    title: '修改广告直达备用链接',
    desc: (n) => `已选中${n}个广告`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（ulink）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'ulink', label: '直达备用链接', type: 'input', apiField: 'ulink', required: true, placeholder: '请输入直达备用链接', rule: '直达备用链接，支持穿山甲和站内投放版位；landing_type = LINK 销售线索投放时有效' },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', promotion_id: '{promotion_id}', ulink: form.ulink }),
  },
  批量修改广告名称: {
    title: '批量修改广告名称',
    desc: (n) => `已选${n}个广告，广告名称不能超过100字符（一个中文字符计为两个字符长度），任务执行成功后会立即修改创量侧名称，但媒体存在几分钟的审核缓存，需等待审核通过后同步显示。`,
    api: { method: 'POST', path: '/open_api/v3.0/promotion/update/', name: '修改单元（name）', scope: AUTH_PROMOTION },
    fields: [
      { key: 'mode', label: '修改模式', type: 'radio', apiField: 'name', required: true, default: '自定义', options: ['自定义', '关键词替换', '表格导入'] },
      { key: 'name', label: '广告名称', type: 'input', apiField: 'name', required: true, placeholder: '请输入广告名称', visibleWhen: { mode: '自定义' }, rule: '单元名称，长度 1～50 字（两个英文字符占 1 字），名称不可重复' },
      { key: 'rule', label: '广告命名规则', type: 'nameRule', apiField: 'name', rule: '命名规则 + 动态标号起始值，最终拼装后的单元名称仍需满足 1～50 字' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ promotion_id: r.id, name: r.__newName || form.name })),
    }),
  },
};

// ------------------------------------------------------------ 项目（campaign）批量操作
export const PROJECT_BATCH_OPS = {
  启用: {
    title: '批量启用项目',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/status/update/', name: '批量更新项目状态', scope: AUTH_PROJECT },
    fields: [
      { key: 'opt_status', label: '操作', type: 'radio', apiField: 'data[].opt_status', required: true, default: 'ENABLE', options: [{ label: '启用', value: 'ENABLE' }], rule: '对于删除的营销项目不可进行任何操作，否则会报错' },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', data: rows.map((r) => ({ project_id: r.id, opt_status: form.opt_status })) }),
  },
  暂停: {
    title: '批量暂停项目',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/status/update/', name: '批量更新项目状态', scope: AUTH_PROJECT },
    fields: [
      { key: 'opt_status', label: '操作', type: 'radio', apiField: 'data[].opt_status', required: true, default: 'DISABLE', options: [{ label: '暂停', value: 'DISABLE' }] },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', data: rows.map((r) => ({ project_id: r.id, opt_status: form.opt_status })) }),
  },
  删除: {
    title: '批量删除项目',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/delete/', name: '批量删除项目', scope: AUTH_PROJECT },
    fields: [
      { key: 'project_ids', label: '项目ID', type: 'readonly', apiField: 'project_ids', required: true, hint: '一次最多删除 10 个项目（list 长度限制 1～10）' },
    ],
    build: (rows) => ({ advertiser_id: '{advertiser_id}', project_ids: rows.map((r) => r.id) }),
  },
  修改出价: {
    title: '批量修改项目出价',
    desc: (n) => `已选 ${n} 条可操作项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/cpa_bid/update/', name: '批量更新项目出价', scope: AUTH_PROJECT },
    // 线上「修改出价」走独立弹窗 ProjectBidDialog：修改规则 / 出价批量 / 项目列表（分别修改出价）
    fields: [
      { key: 'bid_mode', label: '出价修改方式', type: 'radio', apiField: '-', required: true, default: 'set', options: [{ label: '修改为', value: 'set' }, { label: '提高', value: 'inc' }, { label: '降低', value: 'dec' }, { label: '按 % 提高', value: 'incPct' }, { label: '按 % 降低', value: 'decPct' }], rule: '弹窗内「出价」下拉，决定各项目「分别修改出价」的换算方式（提高 / 降低均基于当前出价）' },
      { key: 'cpa_bid', label: '出价', type: 'number', apiField: 'data[].cpa_bid', required: true, unit: '元', placeholder: '请输入出价', rule: '目标转化出价 / 预期成本，单位「元」，精度两位小数；取值范围 0.01～10000 元' },
      { key: 'each', label: '分别修改出价', type: 'table', apiField: 'data[].cpa_bid', columns: [{ key: 'cpa_bid', label: '分别修改出价', placeholder: '请输入出价' }], rule: '按「出价修改方式」换算后写入各项目的目标出价' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, cpa_bid: num(r.__cpa_bid) })),
    }),
  },
  修改深度出价: {
    title: '批量修改项目深度出价',
    desc: (n) => `已选 ${n} 条可操作项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/deep_cpa_bid/update/', name: '批量更新深层项目出价', scope: AUTH_PROJECT },
    // 线上「修改深度出价」走独立弹窗 ProjectDeepBidDialog：修改规则 / 深度出价批量 / 项目列表
    fields: [
      { key: 'bid_mode', label: '深度出价修改方式', type: 'radio', apiField: '-', required: true, default: 'set', options: [{ label: '修改为', value: 'set' }, { label: '提高', value: 'inc' }, { label: '降低', value: 'dec' }, { label: '按 % 提高', value: 'incPct' }, { label: '按 % 降低', value: 'decPct' }], rule: '弹窗内「深度出价」下拉，决定各项目「分别修改深度出价」的换算方式（提高 / 降低均基于当前深度出价）' },
      { key: 'deepbid', label: '深度出价', type: 'number', apiField: 'data[].deepbid', required: true, unit: '元', placeholder: '请输入深度出价', rule: '深度出价，单位「元」，精度两位小数' },
      { key: 'each', label: '分别修改深度出价', type: 'table', apiField: 'data[].deepbid', columns: [{ key: 'deepbid', label: '分别修改深度出价', placeholder: '请输入深度出价' }], rule: '按「深度出价修改方式」换算后写入各项目的目标深度出价' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, deepbid: num(r.__deepbid) })),
    }),
  },
  修改ROI系数: {
    title: '批量修改ROI系数',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/roigoal/update/', name: '批量修改项目ROI系数', scope: AUTH_PROJECT },
    // 线上「修改ROI系数」走独立弹窗 ProjectRoiCoefficientDialog：项目列表逐行填写，每个项目单独设置 ROI 系数
    fields: [
      { key: 'roi_goal', label: 'ROI系数', type: 'number', apiField: 'data[].roi_goal', required: true, placeholder: '请输入ROI系数', rule: '深度转化ROI系数：应用 / 自动投放项目范围 [0.01,5]，电商投放 / 自动投放项目范围 [0.01,100]，均仅支持最多 4 位小数；电商投放、自动投放、周期稳投项目只允许调小，新建 7 天内每自然日最多成功修改 1 次' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, roi_goal: num(r.roi_goal !== undefined && r.roi_goal !== '' ? r.roi_goal : form.roi_goal) })),
    }),
  },
  修改预算: {
    title: '批量修改预算',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/budget/update/', name: '批量更新项目预算', scope: AUTH_PROJECT },
    fields: [
      { key: 'budget_mode', label: '预算类型', type: 'radio', apiField: 'data[].budget_mode', required: true, default: 'BUDGET_MODE_DAY', options: ENUMS.projectBudgetMode, rule: 'BUDGET_MODE_DAY 日预算 / BUDGET_MODE_INFINITE 不限 / BUDGET_MODE_TOTAL_PROJECT 总预算' },
      { key: 'budget', label: '预算', type: 'number', apiField: 'data[].budget', required: true, unit: '元', placeholder: '请输入预算', visibleWhen: { budget_mode: 'BUDGET_MODE_DAY' }, rule: '点击量 / 展示量优化目标时 ≥ 100；delivery_type = DURATION 搜索周期投放时 [2000, 9999999.99]；bid_type = NO_BID 最大转化时 [100, 999999.99]；budget_optimize_switch = ON 时 [300, 999999.99]' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, budget_mode: form.budget_mode, budget: form.budget_mode === 'BUDGET_MODE_DAY' ? num(form.budget) : undefined })),
    }),
  },
  修改项目排期: {
    title: '批量修改时段',
    desc: (n) => `已选 ${n} 条可操作项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/week_schedule/update/', name: '批量更新项目投放时段', scope: AUTH_PROJECT },
    // 线上「修改项目排期」走独立弹窗 ProjectScheduleDialog：修改规则 / 生效时间 / 投放时段栅格
    fields: [
      { key: 'schedule_scene', label: '修改规则', type: 'radio', apiField: 'data[].schedule_scene', required: true, default: 'REALTIME', options: ENUMS.scheduleScene, rule: 'REALTIME 立即生效 / NEXT_DAY 次日 0 点生效 / CUSTOM_TIME 自定义时间（需配合 effective_time）' },
      { key: 'effective_time', label: '生效时间', type: 'datetime', apiField: 'data[].effective_time', placeholder: '请选择生效时间', visibleWhen: { schedule_scene: 'CUSTOM_TIME' }, rule: 'schedule_scene = CUSTOM_TIME 时必填' },
      { key: 'schedule_time', label: '投放时段', type: 'schedule', apiField: 'data[].schedule_time', required: true, rule: '格式是 48×7 位字符串（每天 48 个半小时区段）；修改项目投放时段后，新时段会覆盖项目下全部单元' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({
        project_id: r.id,
        schedule_scene: form.schedule_scene,
        effective_time: form.schedule_scene === 'CUSTOM_TIME' ? form.effective_time : undefined,
        schedule_time: form.schedule_time,
      })),
    }),
  },
  批量修改投放时间: {
    title: '批量修改投放时间',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/schedule_time/update/', name: '批量更新项目投放时间', scope: AUTH_PROJECT },
    fields: [
      { key: 'schedule_type', label: '投放时间类型', type: 'radio', apiField: 'data[].schedule_type', required: true, default: 'SCHEDULE_FROM_NOW', options: ENUMS.scheduleType },
      { key: 'end_time', label: '结束投放时间', type: 'datetime', apiField: 'data[].end_time', required: true, placeholder: '请选择结束日期', visibleWhen: { schedule_type: 'SCHEDULE_START_END' }, rule: '当 schedule_type = SCHEDULE_START_END 时必填，时间必须到秒级' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, schedule_type: form.schedule_type, end_time: form.schedule_type === 'SCHEDULE_START_END' ? form.end_time : undefined })),
    }),
  },
  修改应用商店下载: {
    title: '批量修改应用商店下载',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（download_mode）', scope: AUTH_PROJECT },
    notes: ['仅安卓应用下载支持（鸿蒙和 IOS 应用不支持设置）；搜索极速智投项目传入不生效。'],
    fields: [
      { key: 'download_mode', label: '下载模式', type: 'radio', apiField: 'download_mode', required: true, default: 'APP_STORE_DELIVERY', options: ENUMS.downloadMode, rule: 'APP_STORE_DELIVERY 优先商店下载 / DEFAULT 默认下载；需确保投放的应用已在应用商店上架，优先跳转系统商店安装详情页，失败则回退下载链接' },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', project_id: '{project_id}', download_mode: form.download_mode }),
  },
  修改直达链接: {
    title: '批量修改直达链接',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（open_url / open_url_type）', scope: AUTH_PROJECT },
    notes: ['2024-12-11 起，应用 - 应用调起场景下直达链接、备用直达链接必须在单元层级设置，项目层级传入会报错。'],
    fields: [
      { key: 'open_url_type', label: '直达链接类型', type: 'radio', apiField: 'open_url_type', required: true, default: 'CUSTOM', options: ENUMS.openUrlType },
      { key: 'open_url', label: 'Deeplink直达链接', type: 'input', apiField: 'open_url', required: true, placeholder: '请输入直达链接', visibleWhen: { open_url_type: 'CUSTOM' }, rule: 'landing_type = APP 且子目标为 LAUNCH 应用调起时必填；launch_type = DIRECT_OPEN 时 open_url 与 ulink_url 二选一' },
    ],
    build: (rows, form) => ({ advertiser_id: '{advertiser_id}', project_id: '{project_id}', open_url_type: form.open_url_type, open_url: form.open_url }),
  },
  修改监测活动: {
    title: '批量修改监测活动',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（track_url_setting）', scope: AUTH_PROJECT },
    fields: [
      { key: 'track_url_type', label: '监测链接类型', type: 'radio', apiField: 'track_url_setting.track_url_type', required: true, default: 'CUSTOM', options: ENUMS.trackUrlType, rule: 'CUSTOM 自定义链接（默认）/ GROUP_ID 监测链接组；landing_type 为 LINK、SHOP、MICRO_GAME、QUICK_APP 时不支持传入' },
      { key: 'track_url_group_id', label: '监测链接组ID', type: 'number', apiField: 'track_url_setting.track_url_group_id', placeholder: '请输入监测链接组ID', visibleWhen: { track_url_type: 'GROUP_ID' }, rule: '当 track_url_type = GROUP_ID 时必填，通过【事件资产下创建监测链接组】获得' },
      { key: 'track_url', label: '展示监测链接', type: 'links', apiField: 'track_url_setting.track_url[]', placeholder: '请输入展示监测链接', rule: '只允许传入 1 个（电商 UBP 多商品场景可传 1～10 个）' },
      { key: 'action_track_url', label: '点击监测链接', type: 'input', apiField: 'track_url_setting.action_track_url[]', placeholder: '请输入点击监测链接', rule: '只允许传入 1 个' },
      { key: 'active_track_url', label: '激活监测链接', type: 'input', apiField: 'track_url_setting.active_track_url[]', placeholder: '请输入激活监测链接' },
      { key: 'video_play_effective_track_url', label: '视频有效播放监测链接', type: 'input', apiField: 'track_url_setting.video_play_effective_track_url[]', placeholder: '请输入视频有效播放监测链接', rule: '只允许传入 1 个' },
      { key: 'video_play_done_track_url', label: '视频播完监测链接', type: 'input', apiField: 'track_url_setting.video_play_done_track_url[]', placeholder: '请输入视频播完监测链接', rule: '只允许传入 1 个' },
      { key: 'send_type', label: '数据发送方式', type: 'radio', apiField: 'track_url_setting.send_type', required: true, default: 'SERVER_SEND', options: ENUMS.sendType, rule: 'SERVER_SEND 服务器端上传（默认）/ CLIENT_SEND 客户端上传' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      project_id: '{project_id}',
      track_url_setting: {
        track_url_type: form.track_url_type,
        track_url_group_id: form.track_url_type === 'GROUP_ID' ? num(form.track_url_group_id) : undefined,
        track_url: form.track_url || [],
        action_track_url: form.action_track_url ? [form.action_track_url] : [],
        active_track_url: form.active_track_url ? [form.active_track_url] : [],
        video_play_effective_track_url: form.video_play_effective_track_url ? [form.video_play_effective_track_url] : [],
        video_play_done_track_url: form.video_play_done_track_url ? [form.video_play_done_track_url] : [],
        send_type: form.send_type,
      },
    }),
  },
  修改定向包: {
    title: '批量修改定向包',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（audience.audience_package_id）', scope: AUTH_PROJECT },
    notes: ['若需通过人群定向参数修改定向信息，需将原创建时传入的定向包 ID 清空。'],
    fields: [
      { key: 'audience_package_id', label: '定向包', type: 'select', apiField: 'audience.audience_package_id', required: true, placeholder: '请选择定向包', options: [], apiRef: '/open_api/v3.0/audience_package/get/', rule: '定向包 ID 由【工具-定向包管理-获取定向包】获取；ad_type = SEARCH 时仅支持搜索定向包；delivery_mode = PROCEDURAL 且 landing_type = APP/MICRO_GAME 时不支持定向包' },
      { key: 'gender', label: '受众性别', type: 'radio', apiField: 'audience.gender', required: false, default: 'NONE', options: ENUMS.gender },
      { key: 'age', label: '受众年龄区间', type: 'multiSelect', apiField: 'audience.age[]', placeholder: '请选择年龄区间', options: [], apiRef: '【附录-受众年龄区间】' },
      { key: 'retargeting_tags_include', label: '定向人群包', type: 'multiSelect', apiField: 'audience.retargeting_tags_include[]', placeholder: '请选择人群包', options: [], apiRef: '【工具-人群包管理】' },
      { key: 'retargeting_tags_exclude', label: '排除人群包', type: 'multiSelect', apiField: 'audience.retargeting_tags_exclude[]', placeholder: '请选择人群包', options: [], apiRef: '【工具-人群包管理】' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      project_id: '{project_id}',
      audience: {
        audience_package_id: num(form.audience_package_id),
        gender: form.gender,
        age: form.age || [],
        retargeting_tags_include: form.retargeting_tags_include || [],
        retargeting_tags_exclude: form.retargeting_tags_exclude || [],
      },
    }),
  },
  批量修改否定词: {
    title: '批量修改否定词',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/tools/privative_word/project/update/', name: '批量更新项目否定词', scope: AUTH_PROJECT },
    notes: ['当前未操作过添加/替换否定词，请手动输入否定词。'],
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', apiField: '-', required: true, default: '添加否定词', options: [{ label: '添加否定词', value: 'add' }, { label: '替换否定词', value: 'replace' }], rule: '添加调用 /tools/privative_word/project/add/，替换调用 /tools/privative_word/project/update/' },
      { key: 'smsOn', label: '短信否定词开关', type: 'radio', apiField: '-', default: '不启用', options: [{ label: '不启用', value: false }, { label: '启用', value: true }], rule: '不启用时保留原否定词（替换模式下清空）' },
      { key: 'sms_words', label: '短信否定词', type: 'textarea', apiField: 'sms_words[]', placeholder: '请粘贴或输入短信否定词，回车可换行', rule: '单行不超过 60 个字符（中文算 2 个）；一次不超过 500 行；不能包含 emoji' },
      { key: 'preciseOn', label: '精准否定词开关', type: 'radio', apiField: '-', default: '不启用', options: [{ label: '不启用', value: false }, { label: '启用', value: true }], rule: '同短信否定词开关' },
      { key: 'precise_words', label: '精准否定词', type: 'textarea', apiField: 'precise_words[]', placeholder: '请粘贴或输入精准否定词，回车可换行', rule: '同短信否定词限制' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      project_list: rows.map((r) => ({
        project_id: r.id,
        sms_words_enabled: !!form.smsOn,
        sms_words: form.smsOn ? form.sms_words || [] : [],
        precise_words_enabled: !!form.preciseOn,
        precise_words: form.preciseOn ? form.precise_words || [] : [],
      })),
    }),
  },
  修改搜索快投关键词: {
    title: '批量修改搜索快投关键词',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（keywords）', scope: AUTH_PROJECT },
    // 线上「修改搜索快投关键词」走独立弹窗 ProjectSearchKeywordDialog：关键词列表逐行增删
    // （按需求移除「出价系数 search_bid_ratio」与「智能拓流 auto_extend_traffic」两项）
    // 表格按「每个项目一行」展示（项目名称 / 原关键词 / 关键词 / 匹配类型 / 出价 / 操作），
    // 提交的每个关键词带上所属项目 ID
    fields: [
      { key: 'keywords', label: '关键词', type: 'keywords', apiField: 'keywords[]', required: true, rule: '关键词长度不超过 30（汉字计 1，英文字符计 0.5），不能包含 emoji；匹配类型 EXTENSIVE 广泛 / PHRASE 短语 / PRECISION 精确；bid 取值 0.2～999.0' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      keywords: (form.keywords || []).map((k) => ({
        project_id: k.project_id,
        word: k.word,
        match_type: k.match_type,
        bid: num(k.bid),
      })),
    }),
  },
  素材一键起量: {
    title: '素材一键起量',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/tools/material_raise/create/', name: '开启素材起量', scope: AUTH_PROJECT },
    fields: [
      { key: 'scope', label: '起量素材范围', type: 'radio', apiField: '-', required: true, default: '全部素材', options: [{ label: '全部素材', value: 'all' }, { label: '指定素材', value: 'appoint' }], rule: '「指定素材」需先在项目主面板基于「创意素材」筛选后再启用' },
      { key: 'budget', label: '起量预算', type: 'number', apiField: 'raise_info.raise_budget', required: true, unit: '元', placeholder: '请输入起量预算', rule: '起量预算上下限校验 [100, 9999999.99]' },
      { key: 'timeMode', label: '起量结束时间', type: 'radio', apiField: '-', required: true, default: '固定时间', options: [{ label: '固定时间', value: 'fixed' }, { label: '动态时间', value: 'dynamic' }], rule: '固定时间取具体结束时刻；动态时间取任务开始执行后的小时数' },
      { key: 'end_time', label: '起量结束时间', type: 'datetime', apiField: 'raise_info.appoint_time.end_time', required: true, placeholder: '请选择起量结束时间', rule: '格式：yyyy-mm-dd hh:mm' },
      { key: 'dynamic_hours', label: '动态时长', type: 'number', apiField: 'raise_info.appoint_time.duration', required: true, placeholder: '请输入时间', rule: '任务开始执行后 N 小时为起量结束时间，取值 1~336' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      project_list: rows.map((r) => ({
        project_id: r.id,
        raise_info: {
          raise_effective_type: 'RAISE_NOW',
          raise_budget: num(r.budget !== '' && r.budget != null ? r.budget : form.budget),
          appoint_time:
            form.timeMode === 'dynamic'
              ? { duration: num(form.dynamic_hours) }
              : { start_time: form.start_time, end_time: r.endTime || form.end_time },
        },
      })),
    }),
  },
  批量修改项目名称: {
    title: '批量修改项目名称',
    desc: (n) => `已选中 ${n} 个项目`,
    api: { method: 'POST', path: '/open_api/v3.0/project/update/', name: '更新项目（name）', scope: AUTH_PROJECT },
    fields: [
      { key: 'mode', label: '修改模式', type: 'radio', apiField: 'name', required: true, default: '自定义', options: ['自定义', '关键词替换', '表格导入'] },
      { key: 'name', label: '项目名称', type: 'input', apiField: 'name', required: true, placeholder: '请输入项目名称', visibleWhen: { mode: '自定义' }, rule: '项目名称，长度 1～50 字（两个英文字符占 1 字）' },
      { key: 'rule', label: '命名规则', type: 'nameRule', apiField: 'name' },
    ],
    build: (rows, form) => ({
      advertiser_id: '{advertiser_id}',
      data: rows.map((r) => ({ project_id: r.id, name: r.__newName || form.name })),
    }),
  },
};

/** 按 scope 取操作配置 */
export function getBatchOpConfig(scope, op) {
  const map = scope === 'project' ? PROJECT_BATCH_OPS : PROMOTION_BATCH_OPS;
  return map[op] || null;
}

/** 该 op 的完整接口地址 */
export function apiUrl(cfg) {
  if (!cfg || !cfg.api) return '';
  return OCEAN_API_BASE + cfg.api.path;
}
