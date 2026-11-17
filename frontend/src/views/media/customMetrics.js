// 自定义指标：指标目录（左侧分类 / 中间可选指标）+ 默认指标 + 本地模板存储
// 目录对齐创量「自定义指标」弹窗（图3）：基础信息 / 财务流水 / 展现数据 / 转化数据 …

// 固定指标：始终选中、始终排在最前、不可移除（表格中横向固定）
export const FIXED_METRICS = [
  { key: 'name', label: '账户名称' },
  { key: 'advertiser_id', label: '账户ID' },
];

const t = (key, label, extra = {}) => ({ key, label, ...extra });

export const METRIC_GROUPS = [
  {
    key: 'base',
    title: '基础信息',
    items: [
      t('name', '账户名称', { fixed: true }),
      t('advertiser_id', '账户ID', { fixed: true }),
      t('email', '登录邮箱', { type: 'text', prop: 'email', width: 190 }),
      t('subject', '账户主体', { type: 'text', prop: 'subject', width: 200 }),
      t('remark_cy', '账户备注(创量)', { type: 'text', prop: 'remark_cy', width: 190 }),
      t('remark_jl', '账户备注(巨量)', { type: 'text', prop: 'remark_jl', width: 190 }),
      t('project', '项目', { type: 'text', prop: 'project', width: 140 }),
      t('product', '产品', { type: 'text', prop: 'product', width: 130 }),
      t('optimizer', '优化师', { type: 'text', prop: 'optimizer', width: 110 }),
      t('status', '账户状态', { type: 'status', width: 140 }),
      t('balance', '账户余额（元）', { type: 'number', prop: 'balance', width: 160, align: 'right', digits: 2, sortable: true }),
      t('daily_budget', '账户日预算（元）', { type: 'number', prop: 'daily_budget', width: 170, align: 'right', digits: 0, sortable: true }),
      t('uni_flag', '全域', { type: 'dash', width: 100, align: 'right', media: ['uni'] }),
    ],
  },
  {
    key: 'finance',
    title: '财务流水',
    items: [
      t('shared_spend', '共享飘款支出(N)', { type: 'dash', width: 160 }),
      t('account_total_cost', '账户总支出', { type: 'dash', width: 140 }),
      t('cash_cost', '现金消耗', { type: 'dash', width: 130 }),
      t('gift_cost', '赠款消耗', { type: 'dash', width: 130 }),
      t('account_total_in', '账户总存入', { type: 'dash', width: 140 }),
      t('account_total_in_all', '账户总转入', { type: 'dash', width: 140 }),
      t('account_total_out_all', '账户总转出', { type: 'dash', width: 140 }),
      t('non_gift_balance', '非赠款余额', { type: 'dash', width: 140 }),
      t('gift_balance', '赠款余额', { type: 'dash', width: 130 }),
      t('frozen', '冻结', { type: 'dash', width: 110 }),
      t('shared_wallet_cost', '共享钱包消耗', { type: 'dash', width: 150 }),
      t('shared_balance', '共享余额', { type: 'dash', width: 130 }),
    ],
  },
  {
    key: 'show',
    title: '展现数据',
    items: [
      t('stat_cost', '消耗', { type: 'number', prop: 'stat_cost', width: 110, align: 'right', digits: 2, sortable: true }),
      t('show_cnt', '展示数', { type: 'number', prop: 'show_cnt', width: 110, align: 'right', digits: 0, sortable: true }),
      t('avg_show_cost', '平均千次展现费用', { type: 'computed', width: 150, align: 'right', digits: 2, calc: (row) => (row.show_cnt ? (row.stat_cost / row.show_cnt) * 1000 : 0) }),
      t('click_cnt', '点击数', { type: 'number', prop: 'click_cnt', width: 110, align: 'right', digits: 0, sortable: true }),
      t('ctr', '点击率', { type: 'number', prop: 'ctr', width: 100, align: 'right', digits: 2, sortable: true, suffix: '%' }),
      t('avg_click_price', '平均点击单价', { type: 'computed', width: 130, align: 'right', digits: 2, calc: (row) => (row.click_cnt ? row.stat_cost / row.click_cnt : 0) }),
    ],
  },
  {
    key: 'convert',
    title: '转化数据',
    items: [
      t('active_cnt', '激活数', { type: 'number', prop: 'active_cnt', width: 100, align: 'right', digits: 0 }),
      t('active_cost', '激活成本', { type: 'number', prop: 'active_cost', width: 110, align: 'right', digits: 2 }),
      t('register_cnt', '注册数', { type: 'number', prop: 'register_cnt', width: 100, align: 'right', digits: 0 }),
      t('register_cost', '注册成本', { type: 'number', prop: 'register_cost', width: 110, align: 'right', digits: 2 }),
      t('pay_cnt', '付费数', { type: 'dash', width: 110, align: 'right' }),
      t('pay_cost', '付费成本', { type: 'dash', width: 110, align: 'right' }),
      t('pay_rate', '付费率', { type: 'dash', width: 100, align: 'right' }),
      t('active_rate', '激活率', { type: 'dash', width: 100, align: 'right' }),
      t('register_rate', '注册率', { type: 'dash', width: 100, align: 'right' }),
    ],
  },
  {
    key: 'convert_time',
    title: '转化数据（计费时间）',
    items: [
      t('stat_cost_bill', '消耗（计费时间）', { type: 'dash', width: 150, align: 'right' }),
      t('show_cnt_bill', '展示数（计费时间）', { type: 'dash', width: 150, align: 'right' }),
      t('click_cnt_bill', '点击数（计费时间）', { type: 'dash', width: 150, align: 'right' }),
      t('ctr_bill', '点击率（计费时间）', { type: 'dash', width: 140, align: 'right' }),
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
    key: 'interaction',
    title: '互动数据',
    items: [
      t('interact_cnt', '互动量', { type: 'dash', width: 110, align: 'right' }),
      t('interact_rate', '互动率', { type: 'dash', width: 110, align: 'right' }),
      t('comment_cnt', '评论数', { type: 'dash', width: 110, align: 'right' }),
      t('like_cnt', '点赞数', { type: 'dash', width: 110, align: 'right' }),
    ],
  },
];

// 扁平索引：key → 指标定义
export const METRIC_MAP = METRIC_GROUPS.reduce((acc, g) => {
  g.items.forEach((i) => { acc[i.key] = { ...i, group: g.key }; });
  return acc;
}, {});

// 各媒体默认展示的指标（对齐当前账户列表页列组）
export const DEFAULT_METRICS = {
  upgrade: ['project', 'optimizer', 'status', 'balance', 'daily_budget', 'stat_cost', 'show_cnt', 'click_cnt', 'ctr', 'active_cnt', 'active_cost', 'register_cnt', 'register_cost'],
  uni: ['optimizer', 'project', 'status', 'balance', 'daily_budget', 'uni_flag'],
  oc: ['project', 'product', 'optimizer', 'status', 'balance', 'daily_budget', 'stat_cost'],
};

// ---------- 本地模板存储 ----------
const TPL_KEY = 'clzt.custom-metric.templates';

export function loadTemplates() {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveTemplates(list) {
  try {
    localStorage.setItem(TPL_KEY, JSON.stringify(list));
  } catch (e) {
    /* 原型环境忽略存储失败 */
  }
}
