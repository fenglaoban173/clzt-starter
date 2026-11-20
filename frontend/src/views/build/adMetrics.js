// 广告列表「自定义指标」指标目录
// 对齐创量广告页「自定义指标」弹窗：左侧 16 个分类、中间全部可选指标（2026-11 线上抓取）。
// 基本信息 / 展现数据 / 转化数据 / 转化数据（计费时间）/ 应用推广 / 电商行业 / 游戏行业 /
// 小程序/小游戏 / APP下载数据 / 视频数据 / 落地页及门店 / 互动数据 / 直播间数据 / 线索收集 / 金融行业 / 种草效果

const t = (key, label, extra = {}) => ({ key, label, ...extra });

// 未采集到本地数据的指标统一按「--」展示
const dash = (label) => [label, { type: 'dash', align: 'right' }];

// 表头列宽：保证「字段名 + 排序组件」在同一行完整展示（不换行、不被省略号截断）
// 表头字号 15px（中文 15px/字，西文 8px/字）；排序组件 24px；单元格左右内边距 12px × 2；列边框 1px
const HEAD_FONT = 15;
const HEAD_SORT_W = 24;
const HEAD_PAD = 24;

function headWidth(label, sortable) {
  const textW = [...String(label || '')].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? HEAD_FONT : 8), 0);
  return Math.ceil(textW + (sortable ? HEAD_SORT_W : 0) + HEAD_PAD) + 1;
}

// 基本信息
const BASE = [
  t('subject', '账户主体', { type: 'text', prop: 'subject', width: 200 }),
  t('account', '账户', { type: 'text', prop: 'account_name', width: 200 }),
  t('campaign', '项目', { type: 'text', prop: 'campaign_name', width: 220 }),
  t('ad_status', '广告状态', { type: 'status', prop: 'status', width: 120 }),
  t('product', '创量产品', { type: 'text', prop: 'product', width: 140 }),
  t('optimizer', '优化师', { type: 'text', prop: 'optimizer', width: 120 }),
  t('reject_note', '拒绝建议', { type: 'text', prop: 'reject_note', width: 150 }),
  t('audit_note', '审核建议', { type: 'text', prop: 'audit_note', width: 150 }),
  t('delivery_mode', '托管状态', { type: 'text', prop: 'delivery_mode', width: 140 }),
  t('budget', '广告预算（元）', { type: 'number', prop: 'budget', width: 150, align: 'right', digits: 2, sortable: true }),
  t('bid', '广告出价（元）', { type: 'number', prop: 'bid', width: 150, align: 'right', digits: 2, sortable: true }),
  t('deep_bid', '深度转化出价（元）', { type: 'number', prop: 'deep_bid', width: 150, align: 'right', digits: 2, sortable: true }),
  t('roi_coefficient', 'ROI系数', { type: 'number', prop: 'roi_coefficient', width: 120, align: 'right', digits: 2 }),
  t('diagnosis', '诊断建议', { type: 'text', prop: 'diagnosis', width: 180 }),
  t('created_at', '创建时间', { type: 'text', prop: 'created_at', width: 170 }),
  t('one_click', '一键起量', { type: 'text', prop: 'one_click', width: 110 }),
  t('star_task_id', '星广联任务ID', { type: 'text', prop: 'star_task_id', width: 160 }),
  t('platform', '平台', { type: 'text', prop: 'platform', width: 110 }),
  t('opt_goal', '优化目标', { type: 'text', prop: 'opt_goal', width: 120 }),
  t('deep_goal', '深度优化目标', { type: 'text', prop: 'deep_goal', width: 140 }),
  t('deep_mode', '深度优化方式', { type: 'text', prop: 'deep_mode', width: 140 }),
  t('douyin_id', '抖音号', { type: 'text', prop: 'douyin_id', width: 150 }),
];

const SHOW = [
  t('stat_cost', '消耗', { type: 'number', prop: 'stat_cost', width: 150, align: 'right', digits: 2, sortable: true }),
  t('show_cnt', '展示数', { type: 'number', prop: 'show_cnt', width: 150, align: 'right', digits: 0, sortable: true }),
  t('cpm', '平均千次展现费用', { type: 'number', prop: 'cpm', width: 150, align: 'right', digits: 2, sortable: true }),
  t('click_cnt', '点击数', { type: 'number', prop: 'click_cnt', width: 150, align: 'right', digits: 0, sortable: true }),
  t('ctr', '点击率', { type: 'number', prop: 'ctr', width: 150, align: 'right', digits: 2, suffix: '%', sortable: true }),
  t('cpc', '平均点击单价', { type: 'number', prop: 'cpc', width: 150, align: 'right', digits: 2, sortable: true }),
];

const CONVERT = [
  t('convert_cnt', '转化数', { type: 'number', prop: 'convert_cnt', width: 150, align: 'right', digits: 0, sortable: true }),
  t('convert_cost', '转化成本', { type: 'number', prop: 'convert_cost', width: 150, align: 'right', digits: 2, sortable: true }),
  t('convert_rate', '转化率', { type: 'number', prop: 'convert_rate', width: 150, align: 'right', digits: 2, suffix: '%', sortable: true }),
  t('deep_cnt', '深度转化数', { type: 'number', prop: 'deep_cnt', width: 150, align: 'right', digits: 0, sortable: true }),
  t('deep_cost', '深度转化成本', { type: 'number', prop: 'deep_cost', width: 150, align: 'right', digits: 2, sortable: true }),
  t('deep_rate', '深度转化率', { type: 'number', prop: 'deep_rate', width: 150, align: 'right', digits: 2, suffix: '%', sortable: true }),
];

export const AD_METRIC_GROUPS = [
  { key: 'base', title: '基本信息', items: BASE },
  { key: 'show', title: '展现数据', items: SHOW },
  { key: 'convert', title: '转化数据', items: CONVERT },
  {
    key: 'convert_time',
    title: '转化数据（计费时间）',
    items: [
      dash('转化数（计费时间）'),
      dash('转化成本（计费时间）'),
      dash('深度转化次数（计费时间）'),
      dash('深度转化成本（计费时间）'),
      dash('深度转化率（计费时间）'),
    ],
  },
  {
    key: 'app',
    title: '应用推广',
    items: [
      dash('安卓下载开始数'), dash('安卓下载开始成本'), dash('安卓下载开始率'),
      dash('安卓下载完成数'), dash('安卓下载完成成本'), dash('安卓下载完成率'),
      dash('安卓安装完成数'), dash('安卓安装完成成本'), dash('安卓安装完成率'),
      dash('激活数'), dash('激活成本'), dash('激活率'),
      dash('注册数'), dash('注册成本'), dash('注册率'),
      dash('关键行为数'), dash('关键行为成本'), dash('关键行为率'),
      dash('次留数'), dash('次留成本'), dash('次留率'),
      dash('次留回传数'), dash('次留回传率'), dash('次留回传成本'),
      dash('首次付费数'), dash('首次付费成本'), dash('首次付费率'),
      dash('付费次数'), dash('付费成本'), dash('付费率'),
      dash('7日付费次数（激活时间）'), dash('7日付费成本（激活时间）'), dash('7日人均付费次数（激活时间）'),
      dash('APP内访问'), dash('APP内访问详情页'), dash('APP内加入购物车'), dash('APP内付费'), dash('APP内下单'),
      dash('付费金额（回传时间）'), dash('付费ROI（回传时间）'),
      dash('计费当日付费金额'), dash('计费当日付费ROI'),
      dash('7日付费次数(计费时间)'), dash('7日付费成本(计费时间)'),
      dash('计费二日内付费金额'), dash('计费三日内付费金额'), dash('计费四日内付费金额'),
      dash('计费五日内付费金额'), dash('计费六日内付费金额'), dash('计费七日内付费金额'),
      dash('计费二日内付费ROI'), dash('计费三日内付费ROI'), dash('计费四日内付费ROI'),
      dash('计费五日内付费ROI'), dash('计费六日内付费ROI'), dash('计费七日内付费ROI'),
      dash('计费后24小时变现金额'), dash('计费后24小时变现ROI'),
      dash('计费后7日内变现金额'), dash('计费七日内变现ROI'),
    ],
  },
  {
    key: 'ecom',
    title: '电商行业',
    items: [dash('引流电商订单ROI'), dash('引流电商订单GMV')],
  },
  {
    key: 'game',
    title: '游戏行业',
    items: [
      dash('当日付费金额'),
      dash('激活后24h付费金额'), dash('激活后一日付费金额'), dash('激活后二日付费金额'),
      dash('激活后三日付费金额'), dash('激活后四日付费金额'), dash('激活后五日付费金额'),
      dash('激活后六日付费金额'), dash('激活后七日付费金额'),
      dash('当日付费ROI'),
      dash('激活后24h付费ROI'), dash('激活后一日付费ROI'), dash('激活后二日付费ROI'),
      dash('激活后三日付费ROI'), dash('激活后四日付费ROI'), dash('激活后五日付费ROI'),
      dash('激活后六日付费ROI'), dash('激活后七日付费ROI'),
      dash('激活后七日首次付费数'), dash('激活后七日首次付费成本'), dash('激活七日首次付费率'),
      dash('计费当日激活且首次付费数'), dash('计费当日激活且首次付费成本'), dash('计费当日激活且首次付费率'),
      dash('激活当日首次付费数'), dash('激活当日首次付费成本'), dash('激活当日首次付费率'),
      dash('首次付费后24h内付费金额'), dash('首次付费后24h付费ROI'),
      dash('激活后24h首次付费数'), dash('激活后24h首次付费成本'), dash('激活后24h首次付费率'),
      dash('激活后24小时变现ROI'), dash('24小时变现金额（激活时间）'),
    ],
  },
  {
    key: 'mini',
    title: '小程序/小游戏',
    items: [
      dash('小程序/小游戏当日LTV'), dash('小程序/小游戏当日变现ROI'),
      dash('小程序/小游戏三日LTV'), dash('小程序/小游戏激活后三日变现ROI'),
      dash('小程序/小游戏七日LTV'), dash('小程序/小游戏激活后七日变现ROI'),
      dash('当日混合ROI'), dash('24小时综合流水（激活时间）'), dash('7日综合流水（激活时间）'),
      dash('7日综合ROI（激活时间）'), dash('小程序/小游戏当日内购&变现ROI（激活时间）'),
      dash('原生短剧当日变现（结算）'),
    ],
  },
  {
    key: 'app_data',
    title: 'APP下载数据',
    items: [
      dash('2日留存数'), dash('2日留存率'), dash('2日留存成本'),
      dash('3日留存数'), dash('3日留存率'), dash('3日留存成本'),
      dash('4日留存数'), dash('4日留存率'), dash('4日留存成本'),
      dash('5日留存成本'), dash('5日留存数'), dash('5日留存率'),
      dash('6日留存数'), dash('6日留存率'), dash('6日留存成本'),
      dash('7日留存成本'), dash('7日留存总数'), dash('7日留存数'), dash('7日留存率'), dash('7日留存总成本'),
    ],
  },
  {
    key: 'video',
    title: '视频数据',
    items: [
      dash('播放量'), dash('有效播放数'), dash('有效播放率'), dash('有效播放成本'),
      dash('千次有效播放数'), dash('千次有效播放成本'),
      dash('25%进度播放数'), dash('25%进度播放率'), dash('50%进度播放数'), dash('50%进度播放率'),
      dash('75%进度播放数'), dash('75%进度播放率'), dash('99%进度播放数'),
      dash('3s播放数'), dash('3s播放率'), dash('完播率'), dash('播放完成数'),
    ],
  },
  {
    key: 'landing',
    title: '落地页及门店',
    items: [dash('组件点击数'), dash('组件点击成本'), dash('表单提交')],
  },
  {
    key: 'interaction',
    title: '互动数据',
    items: [dash('点赞数'), dash('评论量'), dash('分享量'), dash('不感兴趣数'), dash('举报数'), dash('评论区入口点击数')],
  },
  {
    key: 'live',
    title: '直播间数据',
    items: [
      dash('直播间观看数'), dash('直播间超过1分钟观看数'), dash('直播间关注数'),
      dash('直播间评论数'), dash('直播间分享数'), dash('组件点击率'), dash('组件曝光数'),
    ],
  },
  {
    key: 'lead',
    title: '线索收集',
    items: [
      dash('有效获客'), dash('有效获客（计费时间）'), dash('有效获客成本（计费时间）'),
      dash('有效咨询'), dash('留咨咨询'),
      dash('回访-加为好友(计费时间)'), dash('加为好友成本(计费时间)'),
      dash('回访-信息确认(计费时间)'), dash('信息确认成本（计费时间）'),
      dash('支付-存在意向(计费时间)'), dash('回访-高潜成交(计费时间)'),
      dash('企业微信添加好友数(计费时间)'), dash('乘客首次下单数'),
      dash('表单提交数（包含附加创意表单数）'), dash('表单提交成本（包含附加创意表单）'),
    ],
  },
  {
    key: 'finance',
    title: '金融行业',
    items: [
      dash('放款数'), dash('放款成本'), dash('放款率'), dash('保险支付数'),
      dash('完件数'), dash('完件成本'), dash('完件率'),
      dash('预授信数'), dash('预授信成本'), dash('授信数'), dash('授信成本'), dash('授信率'),
      dash('七日支用个数（计费时间）'), dash('七日支用金额 （计费时间）'), dash('七日支用ROI （计费时间）'),
      dash('三日授信个数（计费时间）'), dash('三日授信ROI （计费时间）'),
      dash('三日授信金额（计费时间）'), dash('三日授信件均金额（计费时间）'),
      dash('正价课购买数（计费时间）'), dash('存在意向成本'),
    ],
  },
  {
    key: 'seed',
    title: '种草效果',
    items: [dash('新增A3（问询）数'), dash('新增A3（问询）成本'), dash('看后搜次数'), dash('看后搜率')],
  },
];

// 统一指标结构并补 key（组名 + 序号，保证稳定）
AD_METRIC_GROUPS.forEach((g) => {
  g.items = g.items.map((it, i) => {
    // 已是对象（t() 构造）
    if (it && !Array.isArray(it) && typeof it === 'object') {
      const label = it.label;
      return {
        key: it.key || `${g.key}_${i}`,
        label,
        ...it,
        // 列宽取「原宽度」与「表头完整展示所需宽度」的较大值
        width: Math.max(it.width || 0, headWidth(label, it.sortable)),
      };
    }
    // [label, extra] 形式
    const [label, extra = {}] = Array.isArray(it) ? it : [it, {}];
    return {
      key: extra.key || `${g.key}_${i}`,
      label,
      ...extra,
      width: Math.max(extra.width || 0, headWidth(label, extra.sortable)),
    };
  });
});

// 扁平索引：key → 指标定义
export const AD_METRIC_MAP = AD_METRIC_GROUPS.reduce((acc, g) => {
  g.items.forEach((i) => { acc[i.key] = { ...i, group: g.key }; });
  return acc;
}, {});

// 广告页默认展示的指标（对齐线上广告列表默认列顺序）
export const AD_DEFAULT_METRICS = [
  'budget', 'reject_note', 'bid', 'deep_bid', 'stat_cost', 'show_cnt', 'cpm',
  'click_cnt', 'ctr', 'convert_cnt', 'convert_cost', 'convert_rate',
  'deep_cnt', 'deep_cost', 'deep_rate',
];

// 指标目录对象（供 CustomMetricDialog 复用）
export const AD_METRIC_CATALOG = {
  fixed: [],
  groups: AD_METRIC_GROUPS,
  map: AD_METRIC_MAP,
  defaultKeys: AD_DEFAULT_METRICS,
};

// ---------- 本地模板存储（与项目页分开） ----------
const TPL_KEY = 'clzt.ad-metric.templates';

export function loadAdTemplates() {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveAdTemplates(list) {
  try {
    localStorage.setItem(TPL_KEY, JSON.stringify(list));
  } catch (e) {
    /* 原型环境忽略存储失败 */
  }
}
