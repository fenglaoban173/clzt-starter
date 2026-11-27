// 项目列表「自定义指标」指标目录
// 对齐智投项目页「自定义指标」弹窗的左侧分类与中间可选指标：
// 基本信息 / 展现数据 / 转化数据 / 转化数据（计费时间）/ 应用推广 / 电商行业 /
// 游戏行业 / 小程序/小游戏 / APP下载数据 / 视频数据 / 落地页及门店 / 附加创意

// 固定指标：始终选中、排在最前、不可移除（表格左侧固定列承载）
export const PROJECT_FIXED_METRICS = [
  { key: 'name', label: '项目名称' },
  { key: 'campaign_id', label: '项目ID' },
];

const t = (key, label, extra = {}) => ({ key, label, ...extra });

export const PROJECT_METRIC_GROUPS = [
  {
    key: 'base',
    title: '基本信息',
    items: [
      t('subject', '账户主体', { type: 'text', prop: 'subject', width: 200 }),
      t('account', '账户', { type: 'text', prop: 'account_name', width: 190 }),
      t('status', '项目状态', { type: 'status', width: 110 }),
      t('product', '智投产品', { type: 'text', prop: 'product', width: 130 }),
      t('optimizer', '优化师', { type: 'text', prop: 'optimizer', width: 110 }),
      t('purpose', '推广目的', { type: 'text', prop: 'purpose', width: 130 }),
      t('project_type', '项目类型', { type: 'text', prop: 'delivery_mode', width: 130 }),
      t('sub_goal', '子目标', { type: 'dash', width: 120 }),
      t('budget', '项目预算（元）', { type: 'number', prop: 'budget', width: 155, align: 'right', digits: 0, sortable: true }),
      t('bid', '项目出价（元）', { type: 'number', prop: 'bid', width: 155, align: 'right', digits: 2, sortable: true }),
      t('roi_coefficient', 'ROI系数', { type: 'dash', width: 110, align: 'right' }),
      t('deep_bid', '深度转化出价（元）', { type: 'number', prop: 'deep_bid', width: 185, align: 'right', digits: 2, sortable: true }),
      t('opt_goal', '优化目标', { type: 'text', prop: 'opt_goal', width: 120 }),
      t('delivery_time', '投放时间', { type: 'text', prop: 'delivery_time', width: 160 }),
      t('download_type', '下载方式', { type: 'dash', width: 120 }),
      t('deep_goal', '深度优化目标', { type: 'text', prop: 'deep_goal', width: 130 }),
      t('deep_mode', '深度优化方式', { type: 'text', prop: 'deep_mode', width: 130 }),
      t('first_place', '首选项置', { type: 'dash', width: 110 }),
      t('created_at', '创建时间', { type: 'text', prop: 'created_at', width: 170 }),
      t('platform', '平台', { type: 'text', prop: 'platform', width: 110 }),
      t('star_task_id', '星广联任务ID', { type: 'text', prop: 'star_task_id', width: 150 }),
    ],
  },
  {
    key: 'show',
    title: '展现数据',
    items: [
      t('stat_cost', '消耗', { type: 'number', prop: 'stat_cost', width: 110, align: 'right', digits: 2, sortable: true }),
      t('show_cnt', '展示数', { type: 'number', prop: 'show_cnt', width: 110, align: 'right', digits: 0, sortable: true }),
      t('avg_show_cost', '平均千次展现费用', { type: 'computed', prop: 'cpm', width: 170, align: 'right', digits: 2, sortable: true }),
      t('click_cnt', '点击数', { type: 'number', prop: 'click_cnt', width: 110, align: 'right', digits: 0, sortable: true }),
      t('ctr', '点击率', { type: 'number', prop: 'ctr', width: 100, align: 'right', digits: 2, sortable: true, suffix: '%' }),
      t('avg_click_price', '平均点击单价', { type: 'computed', prop: 'cpc', width: 140, align: 'right', digits: 2, sortable: true }),
    ],
  },
  {
    key: 'convert',
    title: '转化数据',
    items: [
      t('pay_roi', '计费当日付费ROI', { type: 'number', prop: 'pay_roi', width: 165, align: 'right', digits: 2, sortable: true }),
      t('game_roi', '小程序/小游戏当日变现ROI', { type: 'number', prop: 'game_roi', width: 235, align: 'right', digits: 2, sortable: true }),
      t('convert_cnt', '转化数', { type: 'number', prop: 'convert_cnt', width: 100, align: 'right', digits: 0, sortable: true }),
      t('convert_cost', '转化成本', { type: 'number', prop: 'convert_cost', width: 110, align: 'right', digits: 2, sortable: true }),
      t('convert_rate', '转化率', { type: 'number', prop: 'convert_rate', width: 100, align: 'right', digits: 2, sortable: true, suffix: '%' }),
      t('deep_cnt', '深度转化数', { type: 'number', prop: 'deep_cnt', width: 125, align: 'right', digits: 0, sortable: true }),
      t('deep_cost', '深度转化成本', { type: 'number', prop: 'deep_cost', width: 140, align: 'right', digits: 2, sortable: true }),
      t('deep_rate', '深度转化率', { type: 'number', prop: 'deep_rate', width: 125, align: 'right', digits: 2, sortable: true, suffix: '%' }),
    ],
  },
  {
    key: 'convert_time',
    title: '转化数据（计费时间）',
    items: [
      t('stat_cost_bill', '消耗（计费时间）', { type: 'dash', width: 150, align: 'right' }),
      t('show_cnt_bill', '展示数（计费时间）', { type: 'dash', width: 165, align: 'right' }),
      t('click_cnt_bill', '点击数（计费时间）', { type: 'dash', width: 165, align: 'right' }),
      t('ctr_bill', '点击率（计费时间）', { type: 'dash', width: 165, align: 'right' }),
    ],
  },
  {
    key: 'app',
    title: '应用推广',
    items: [
      t('app_download', '应用下载量', { type: 'dash', width: 130, align: 'right' }),
      t('app_download_rate', '应用下载率', { type: 'dash', width: 130, align: 'right' }),
      t('app_first_open', '首次打开数', { type: 'dash', width: 130, align: 'right' }),
      t('app_pay_amount', '付费金额', { type: 'dash', width: 130, align: 'right' }),
    ],
  },
  {
    key: 'ecom',
    title: '电商行业',
    items: [
      t('order_cnt', '成交订单数', { type: 'dash', width: 130, align: 'right' }),
      t('order_amount', '成交金额', { type: 'dash', width: 130, align: 'right' }),
      t('order_rate', '成交率', { type: 'dash', width: 110, align: 'right' }),
    ],
  },
  {
    key: 'game',
    title: '游戏行业',
    items: [
      t('game_pay_user', '付费用户数', { type: 'dash', width: 130, align: 'right' }),
      t('game_pay_amount', '付费金额', { type: 'dash', width: 130, align: 'right' }),
      t('game_arpu', 'ARPU', { type: 'dash', width: 110, align: 'right' }),
    ],
  },
  {
    key: 'mini',
    title: '小程序/小游戏',
    items: [
      t('mini_cost', '小程序/小游戏消耗', { type: 'dash', width: 160, align: 'right' }),
      t('mini_pay_roi', '小程序付费ROI', { type: 'dash', width: 140, align: 'right' }),
      t('mini_game_roi', '小游戏变现ROI', { type: 'dash', width: 140, align: 'right' }),
      t('mini_first_open', '首次打开数', { type: 'dash', width: 130, align: 'right' }),
    ],
  },
  {
    key: 'app_data',
    title: 'APP下载数据',
    items: [
      t('app_dl_cnt', 'APP下载量', { type: 'dash', width: 130, align: 'right' }),
      t('app_dl_rate', 'APP下载率', { type: 'dash', width: 130, align: 'right' }),
      t('app_dl_cost', 'APP下载成本', { type: 'dash', width: 140, align: 'right' }),
    ],
  },
  {
    key: 'video',
    title: '视频数据',
    items: [
      t('video_play', '播放量', { type: 'dash', width: 120, align: 'right' }),
      t('video_play_duration', '播放时长', { type: 'dash', width: 120, align: 'right' }),
      t('video_finish_rate', '完播率', { type: 'dash', width: 110, align: 'right' }),
      t('video_click_rate', '点击率', { type: 'dash', width: 110, align: 'right' }),
    ],
  },
  {
    key: 'landing',
    title: '落地页及门店',
    items: [
      t('landing_pv', '落地页浏览量', { type: 'dash', width: 140, align: 'right' }),
      t('landing_submit', '表单提交量', { type: 'dash', width: 130, align: 'right' }),
      t('store_visit', '门店访问量', { type: 'dash', width: 130, align: 'right' }),
    ],
  },
  {
    key: 'creative',
    title: '附加创意',
    items: [
      t('creative_cnt', '创意素材数', { type: 'dash', width: 120, align: 'right' }),
      t('video_material_cnt', '视频素材数', { type: 'dash', width: 120, align: 'right' }),
      t('image_material_cnt', '图片素材数', { type: 'dash', width: 120, align: 'right' }),
      t('title_material_cnt', '标题素材数', { type: 'dash', width: 120, align: 'right' }),
    ],
  },
];

// 扁平索引：key → 指标定义
export const PROJECT_METRIC_MAP = PROJECT_METRIC_GROUPS.reduce((acc, g) => {
  g.items.forEach((i) => { acc[i.key] = { ...i, group: g.key }; });
  return acc;
}, {});

// 项目页默认展示的指标（对齐线上项目列表的默认列）
export const PROJECT_DEFAULT_METRICS = [
  'stat_cost', 'pay_roi', 'game_roi', 'avg_show_cost', 'avg_click_price', 'deep_bid',
  'budget', 'created_at', 'bid', 'show_cnt', 'click_cnt', 'ctr',
  'convert_cnt', 'convert_cost', 'convert_rate', 'deep_cnt', 'deep_cost', 'deep_rate',
];

// 指标目录对象（供 CustomMetricDialog 复用）
export const PROJECT_METRIC_CATALOG = {
  fixed: PROJECT_FIXED_METRICS,
  groups: PROJECT_METRIC_GROUPS,
  map: PROJECT_METRIC_MAP,
  defaultKeys: PROJECT_DEFAULT_METRICS,
};

// ---------- 本地模板存储（与账户页分开） ----------
const TPL_KEY = 'clzt.project-metric.templates';

export function loadProjectTemplates() {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveProjectTemplates(list) {
  try {
    localStorage.setItem(TPL_KEY, JSON.stringify(list));
  } catch (e) {
    /* 原型环境忽略存储失败 */
  }
}
