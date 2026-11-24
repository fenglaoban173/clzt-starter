/* 报表模块 mock 数据 —— 选项与字段严格对齐创量线上采集结果
 * 来源：cl.mobgi.com/report/* 逐页 DOM 采集（C:/tmp/rpt/*_detail.json）
 */

// ---------- 通用选项（线上实测） ----------
export const MEDIA_OPTIONS = [
  { value: 'aggregate', label: '不限' },
  { value: 'toutiao_upgrade', label: '巨量广告' },
  { value: 'toutiao_uni', label: '巨量广告·全域' },
  { value: 'toutiao_oc', label: '巨量广告·智擎' },
  { value: 'gdt_upgrade', label: '腾讯广告3.0' },
];

export const OPTIMIZER_OPTIONS = [
  '北京央广时代文化传播有限公司', '张从浩', '王春雷', '郭峻宇', '孙诗源',
  'gongwenqing', 'lixue', 'jiangxin', '申旭阳', '杨宿豫', '文道亲', '黄莹曦',
  '马学泰', '张浩', '王研', '张瑞凯', '裴心怡', '李玉玲', '冯逸',
];

export const PARTNER_OPTIONS = [
  '头条默认合作商', '广点通默认合作商', '快手默认合作商', '百度默认合作商',
  '金牛默认合作商', '百度电商默认合作商', '本地推默认合作商', '媒介头条默认合作商',
];

export const DEPT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

export const PROJECT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

export const PRODUCT_OPTIONS = ['未知产品', '测试商品', '测试安卓应用(android)'];

export const ADVERTISER_OPTIONS = [
  '百度极速版调起-央广-4', '百度极速版调起-央广-6', '百度极速版调起-央广-5',
  '百度极速版调起-央广-7', '百度极速版调起-央广-1', '百度极速版调起-央广-8',
  '百度极速版调起-央广-11', '好看视频-短剧主推开户-4', '好看视频-短剧主推开户-1',
  '央广-营销-知于-APP内', '央广-智看-知于-APP内',
];

export const SUBJECT_OPTIONS = [
  '百度在线网络技术（北京）有限公司', '北京高途云集教育科技有限公司',
  '北京雷盟盛通文化发展有限公司', '北京笔墨留香科技有限公司海淀第一分公司',
  '北京百度网讯科技有限公司', '北京智者天下科技有限公司北京第二分公司',
  '北京智者天下科技有限公司北京第一分公司', '北京智者天下科技有限公司',
];

export const MATERIAL_TYPE_OPTIONS = [
  '图片', '视频', '图文', '游戏横屏试玩素材', '游戏竖屏试玩素材', '游戏直玩素材',
];

export const MATERIAL_TAG_OPTIONS = ['全部', '漫剧', '短剧', '图文', '商品', '测试'];

export const CONVERT_GOAL_OPTIONS = [
  '电话拨打', '表单提交', '地图搜索', '下载完成', '按钮跳转',
  'xpath类型转换', '关键页面浏览', '激活',
];

export const DEEP_CONVERT_OPTIONS = ['激活', '注册', '付费', '次留', 'ROI'];

export const OUYAN_PRODUCT_OPTIONS = ['巨量商品-通用版', '巨量商品-升级版'];

export const ANDROID_APP_OPTIONS = ['安卓应用', '鸿蒙应用', 'iTunesID'];

export const MINI_APP_OPTIONS = ['微信小程序', '微信小游戏', '字节小程序', '字节小游戏'];

export const DOUYIN_NO_OPTIONS = ['抖音号'];

export const DRAMA_ALBUM_OPTIONS = ['剧目/专辑ID'];

export const COMPONENT_TYPE_OPTIONS = ['图片', '视频', '落地页', '表单', '小程序', '私信'];

export const STAFF_OPTIONS = ['黄莹曦', '马学泰', '张浩', '王研', '张瑞凯', '裴心怡', '李玉玲', '冯逸'];

// 账户报表「关联维度」下拉
export const RELATION_DIM_ACCOUNT = ['媒体', '优化师', '合作商', '部门', '创量项目', '商品', '账户主体', '账户备注'];
// 项目报表「关联维度」下拉
export const RELATION_DIM_PROJECT = ['部门', '媒体', '人员', '账户', '合作商', '账户备注'];
// 广告报表「关联维度」下拉
export const RELATION_DIM_AD = ['媒体', '优化师', '合作商', '部门', '产品', '创量项目', '账户主体', '账户备注'];
// 组件报表「关联维度」下拉
export const RELATION_DIM_COMPONENT = ['账户', '广告ID', '创意ID', '组件类型', '账户主体', '账户备注', '编导', '剪辑'];
// 素材报表「关联维度」下拉
export const RELATION_DIM_MATERIAL = ['广告ID', '项目ID', '账户', '账户主体', '账户备注', '商品', '创量项目', '专辑'];
// 人效管理「关联维度」下拉
export const RELATION_DIM_PEOPLE = ['部门', '项目', '产品'];

export const PAGE_SIZE_OPTIONS = ['10条/页', '20条/页', '50条/页', '100条/页'];

// 指标口径 / 归因时间类型（线上是「若需切换…请联系运营」的说明型下拉）
export const METRIC_CALIBER_OPTIONS = [
  '若需切换口径，请联系创量运营开通相关能力广告播放口径',
  '若需切换口径，请联系创量运营开通相关能力转化回传口径（上报时间）',
  '若需切换口径，请联系创量运营开通相关能力转化回传口径（激活时间）',
];

export const ATTRIBUTION_TIME_OPTIONS = [
  '若需切换归因时间类型，请联系运营小红书-计费时间',
  '若需切换归因时间类型，请联系运营小红书-转化时间',
];

// ---------- 数据维度（各页线上实测） ----------
export const DIM_ACCOUNT = ['账户', '优化师', '媒体', '创量项目', '合作商', '部门'];
export const DIM_AD = ['账户', '广告', '优化师', '产品', '创量项目', '媒体', '合作商', '部门', '投放载体'];
export const DIM_MATERIAL = ['素材', '媒体素材', '专辑', '剪辑', '编导', '创量项目', '素材标签', '商品', '投放载体'];
export const DIM_PEOPLE = ['人员', '部门', '账户主体'];
export const DIM_FUNDS = ['账户', '合作商', '项目'];

// ---------- 人效管理「趋势分析」指标下拉 ----------
export const PEOPLE_TREND_METRICS = ['新建广告（创意）数', '总消耗', '展示数', '点击数', '转化数'];

// ---------- 明细表列定义 ----------
// 账户报表：时间 / 账户ID / 账户名称 / 消耗
export const ACCOUNT_COLUMNS = [
  { prop: 'date', label: '时间', width: 150, sortable: true },
  { prop: 'advertiser_id', label: '账户ID', width: 200 },
  { prop: 'advertiser_name', label: '账户名称', minWidth: 220 },
  { prop: 'stat_cost', label: '消耗', width: 140, align: 'right', sortable: true },
];

// 项目报表：时间 / 创量项目 / 消耗
export const PROJECT_COLUMNS = [
  { prop: 'date', label: '时间', width: 150, sortable: true },
  { prop: 'project_name', label: '创量项目', minWidth: 260 },
  { prop: 'stat_cost', label: '消耗', width: 140, align: 'right', sortable: true },
];

// 广告报表：时间 / 账户ID / 账户名称 / 抖音号 / 抖音昵称 / 是否原生广告 / 消耗
export const AD_COLUMNS = [
  { prop: 'date', label: '时间', width: 150, sortable: true },
  { prop: 'advertiser_id', label: '账户ID', width: 200 },
  { prop: 'advertiser_name', label: '账户名称', minWidth: 220 },
  { prop: 'douyin_id', label: '抖音号', width: 160 },
  { prop: 'douyin_nick', label: '抖音昵称', minWidth: 200 },
  { prop: 'is_native', label: '是否原生广告', width: 130, align: 'center' },
  { prop: 'stat_cost', label: '消耗', width: 140, align: 'right', sortable: true },
];

// 组件报表：时间 / 组件ID / 组件预览 / 花费
export const COMPONENT_COLUMNS = [
  { prop: 'date', label: '时间', width: 170, sortable: true },
  { prop: 'component_id', label: '组件ID', width: 200 },
  { prop: 'preview', label: '组件预览', width: 120, align: 'center' },
  { prop: 'stat_cost', label: '花费', width: 140, align: 'right', sortable: true },
];

// 素材报表：时间 / 素材预览 / 素材 / 近7日趋势 / 消耗
export const MATERIAL_COLUMNS = [
  { prop: 'date', label: '时间', width: 120, sortable: true },
  { prop: 'preview', label: '素材预览', width: 120, align: 'center' },
  { prop: 'title', label: '素材', minWidth: 300 },
  { prop: 'trend', label: '近7日趋势', width: 120, align: 'center' },
  { prop: 'stat_cost', label: '消耗', width: 140, align: 'right', sortable: true },
];

// 报表订阅
export const SUBSCRIBE_MEDIA_OPTIONS = [
  '不限', '巨量广告(新)', '巨量广告·智擎', '巨量广告·全域',
  '巨量广告(标准+智擎)', '腾讯广告3.0', '腾讯广告3.0(多口径)', '腾讯广告2.0',
];

export const SUBSCRIBE_COLUMNS = [
  { prop: 'enabled', label: '订阅', width: 80, align: 'left' },
  { prop: 'report_id', label: '报表ID', width: 130 },
  { prop: 'report_name', label: '报表名称', minWidth: 180 },
  { prop: 'media', label: '媒体', width: 130 },
  { prop: 'dimension', label: '数据维度', width: 120 },
  { prop: 'report_type', label: '报表类型', width: 110 },
  { prop: 'report_style', label: '报表样式', width: 110 },
  { prop: 'send_time', label: '发送时间', width: 130 },
  { prop: 'valid_range', label: '订阅有效期', width: 200 },
  { prop: 'content_type', label: '内容形式', width: 130 },
  { prop: 'push_type', label: '推送形式', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 120 },
  { prop: 'creator', label: '创建人', width: 130 },
  // 线上「操作」列不固定；注意 fixed 不能传 ''（Vue 会当成 true）
  { prop: 'ops', label: '操作', width: 260, align: 'center', fixed: false },
];

// 人效管理
export const PEOPLE_COLUMNS = [
  { prop: 'date', label: '时间', width: 120, sortable: true },
  { prop: 'optimizer', label: '优化师', width: 130 },
  { prop: 'new_ad_cnt', label: '新建广告（创意）数', width: 150, align: 'right', sortable: true },
  { prop: 'cost_ad_cnt', label: '有消耗广告（创意）数', width: 165, align: 'right', sortable: true },
  { prop: 'learned_ad_cnt', label: '过学习期广告数', width: 140, align: 'right', sortable: true },
  { prop: 'stat_cost', label: '总消耗', width: 120, align: 'right', sortable: true },
  { prop: 'show_cnt', label: '展示数', width: 120, align: 'right', sortable: true },
  { prop: 'click_cnt', label: '点击数', width: 110, align: 'right', sortable: true },
  { prop: 'convert_cnt', label: '转化数', width: 110, align: 'right', sortable: true },
  { prop: 'cpm', label: '平均千次展现费用', width: 140, align: 'right', sortable: true },
  { prop: 'cpc', label: '平均点击单价', width: 130, align: 'right', sortable: true },
  { prop: 'convert_cost', label: '转化成本', width: 120, align: 'right', sortable: true },
];

// 财务管理
export const FINANCE_COLUMNS = [
  { prop: 'date', label: '时间', width: 110, sortable: true },
  { prop: 'advertiser_name', label: '广告主账号', width: 190 },
  { prop: 'advertiser_id', label: '广告主ID', width: 170 },
  { prop: 'partner', label: '所属合作商', width: 140 },
  { prop: 'optimizer', label: '优化师', width: 110 },
  { prop: 'shared_wallet_cost', label: '共享钱包消耗', width: 130, align: 'right', sortable: true },
  { prop: 'shared_gift_cost', label: '共享赠款支出', width: 130, align: 'right', sortable: true },
  { prop: 'total_cost', label: '账户总支出', width: 125, align: 'right', sortable: true },
  { prop: 'cash_cost', label: '账户现金支出', width: 130, align: 'right', sortable: true },
  { prop: 'gift_cost', label: '账户赠款支出', width: 130, align: 'right', sortable: true },
  { prop: 'total_income', label: '账户总存入', width: 125, align: 'right', sortable: true },
  { prop: 'total_transfer_in', label: '账户总转入', width: 125, align: 'right', sortable: true },
  { prop: 'total_transfer_out', label: '账户总转出', width: 125, align: 'right', sortable: true },
  { prop: 'frozen', label: '冻结', width: 110, align: 'right', sortable: true },
];

// 资金使用率
export const FUNDS_COLUMNS = [
  { prop: 'date', label: '时间', width: 110, sortable: true },
  { prop: 'advertiser_name', label: '广告主账号', width: 190 },
  { prop: 'advertiser_id', label: '广告主ID', width: 170 },
  { prop: 'optimizer', label: '优化师', width: 110 },
  { prop: 'partner', label: '合作商', width: 130 },
  { prop: 'dept', label: '部门', width: 120 },
  { prop: 'project', label: '项目', width: 130 },
  { prop: 'day_balance', label: '日终结余', width: 120, align: 'right', sortable: true },
  { prop: 'stat_cost', label: '消耗', width: 110, align: 'right', sortable: true },
  { prop: 'shared_wallet_cost', label: '共享钱包消耗', width: 130, align: 'right', sortable: true },
  { prop: 'shared_gift_cost', label: '共享赠款支出', width: 130, align: 'right', sortable: true },
  { prop: 'total_cost', label: '账户总支出', width: 125, align: 'right', sortable: true },
  { prop: 'cash_cost', label: '账户现金支出', width: 130, align: 'right', sortable: true },
  { prop: 'gift_cost', label: '账户赠款支出', width: 130, align: 'right', sortable: true },
  { prop: 'total_income', label: '账户总存入', width: 125, align: 'right', sortable: true },
  { prop: 'total_transfer_in', label: '账户总转入', width: 125, align: 'right', sortable: true },
  { prop: 'total_transfer_out', label: '账户总转出', width: 125, align: 'right', sortable: true },
  { prop: 'frozen', label: '冻结', width: 110, align: 'right', sortable: true },
];

// ---------- 表格行数据生成 ----------
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildRows(opts) {
  const { count = 15, seed = 7, dateRange, fields } = opts || {};
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const row = { id: i + 1 };
    (fields || []).forEach((f, k) => {
      row[f.key] = f.build(r, i, k);
    });
    out.push(row);
  }
  return out;
}

/** 生成「20261118-20261124」这种线上时间列格式 */
export function dateRangeLabel(start, end) {
  const a = String(start).replace(/-/g, '');
  const b = String(end).replace(/-/g, '');
  return `${a}-${b}`;
}

export function todayRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 6 * 86400000);
  return [fmtDate(start), fmtDate(end)];
}

export function singleDay() {
  return [fmtDate(new Date()), fmtDate(new Date())];
}

/** 账户报表行 */
export function accountRows() {
  const [s, e] = todayRange();
  const label = dateRangeLabel(s, e);
  return buildRows({
    count: 15, seed: 11, fields: [
      { key: 'date', build: () => label },
      { key: 'advertiser_id', build: (r, i) => `18695841${5280026 + i * 137}` },
      { key: 'advertiser_name', build: (r, i) => ADVERTISER_OPTIONS[i % ADVERTISER_OPTIONS.length] },
      { key: 'stat_cost', build: (r) => +(r() * 30000 + 400).toFixed(2) },
    ],
  });
}

/** 项目报表行 */
export function projectRows() {
  const [s, e] = todayRange();
  const label = dateRangeLabel(s, e);
  return buildRows({
    count: 12, seed: 23, fields: [
      { key: 'date', build: () => label },
      { key: 'project_name', build: (r, i) => PROJECT_OPTIONS[i % PROJECT_OPTIONS.length] },
      { key: 'stat_cost', build: (r) => +(r() * 400000 + 2000).toFixed(2) },
    ],
  });
}

/** 广告报表行 */
export function adRows() {
  const [s, e] = todayRange();
  const label = dateRangeLabel(s, e);
  return buildRows({
    count: 15, seed: 31, fields: [
      { key: 'date', build: () => label },
      { key: 'advertiser_id', build: (r, i) => `18695841${5280026 + i * 137}` },
      { key: 'advertiser_name', build: (r, i) => ADVERTISER_OPTIONS[i % ADVERTISER_OPTIONS.length] },
      { key: 'douyin_id', build: (r, i) => (i % 3 === 0 ? '--' : `8765432${100 + i}`) },
      { key: 'douyin_nick', build: (r, i) => (i % 3 === 0 ? '--' : `央广-智看-知于-APP内-${i}`) },
      { key: 'is_native', build: (r, i) => (i % 4 === 0 ? '是' : '否') },
      { key: 'stat_cost', build: (r) => +(r() * 20000 + 300).toFixed(2) },
    ],
  });
}

/** 组件报表行 */
export function componentRows() {
  const [s, e] = todayRange();
  const label = dateRangeLabel(s, e);
  return buildRows({
    count: 12, seed: 41, fields: [
      { key: 'date', build: () => label },
      { key: 'component_id', build: (r, i) => `${19404523 + i * 171289}` },
      { key: 'preview', build: (r, i) => `component-${i % 6}` },
      { key: 'stat_cost', build: (r) => +(r() * 8000 + 200).toFixed(2) },
    ],
  });
}

/** 素材报表行 */
export function materialRows() {
  const day = fmtDate(new Date());
  const titles = [
    'edkzjj_apple中国-常规调起-图片-图片-自定义-立即查看新品-261116',
    'xerhV_西门子洗衣机-常规调起-图片-图片-自定义-查看家电-1102',
    'drRjsT_德国威能-常规调起-图片-图片-自定义-查看家电-1027',
    '央广-软广告-外观-0827-jww (1)',
    'uxfLn_xrf-常规调起-图片-图片-自定义-查看产品-1110',
    'eVjRt_apple-常规调起-图片-图片-自定义-查看日常体验-261116',
    'pzgsK_保鲜喷雾-常规调起-图片-图片-自定义-保鲜喷雾-14',
    'vfAx_找拼多多借钱-常规调起-图片-图片-自定义-查看网站-1110',
  ];
  return buildRows({
    count: 14, seed: 53, fields: [
      { key: 'date', build: () => day },
      { key: 'preview', build: (r, i) => `material-${i % 6}` },
      { key: 'title', build: (r, i) => titles[i % titles.length] },
      { key: 'material_id', build: (r, i) => String(i % 2 === 0 ? 0 : 14413702309 + i) },
      { key: 'trend', build: (r, i) => Array.from({ length: 7 }, () => Math.round(r() * 100)) },
      { key: 'stat_cost', build: (r) => +(r() * 900 + 120).toFixed(2) },
    ],
  });
}

/** 报表订阅行 */
export function subscribeRows() {
  return [
    { id: 1, enabled: true, report_id: '12400186797', report_name: '百度文库-时报-副本', media: '巨量广告(新)', dimension: '媒体账户', report_type: '时报', report_style: '自定义', send_time: '10:00、14:00', valid_range: '2026-10-10 ~ 2026-11-30', content_type: '报表截图、...', push_type: '飞书', created_at: '2026-10-13', creator: '北京央广时代...', ops: '' },
    { id: 2, enabled: true, report_id: '12400177566', report_name: '好看视频-时报', media: '巨量广告(新)', dimension: '媒体账户', report_type: '时报', report_style: '自定义', send_time: '10:00、14:00', valid_range: '2026-09-20 ~ 2026-12-19', content_type: '报表截图、...', push_type: '飞书', created_at: '2026-06-05', creator: '北京央广时代...', ops: '' },
    { id: 3, enabled: true, report_id: '12400177568', report_name: 'soul时报', media: '巨量广告(新)', dimension: '媒体账户', report_type: '时报', report_style: '自定义', send_time: '10:00、14:00', valid_range: '2026-09-10 ~ 2026-12-09', content_type: '报表截图、...', push_type: '飞书', created_at: '2026-06-05', creator: '北京央广时代...', ops: '' },
  ];
}

/** 人效管理行 */
export function peopleRows() {
  const day = fmtDate(new Date());
  const names = ['申旭阳', '孙诗源', '杨宿豫', '文道亲', '张从浩', '王春雷', '郭峻宇'];
  return buildRows({
    count: 15, seed: 67, fields: [
      { key: 'date', build: () => day },
      { key: 'optimizer', build: (r, i) => names[i % names.length] },
      { key: 'new_ad_cnt', build: (r) => Math.round(r() * 20) },
      { key: 'cost_ad_cnt', build: (r) => Math.round(r() * 30) },
      { key: 'learned_ad_cnt', build: (r) => Math.round(r() * 12) },
      { key: 'stat_cost', build: (r) => +(r() * 400).toFixed(2) },
      { key: 'show_cnt', build: (r) => Math.round(r() * 21000) },
      { key: 'click_cnt', build: (r) => Math.round(r() * 600) },
      { key: 'convert_cnt', build: (r) => Math.round(r() * 8) },
      { key: 'cpm', build: (r) => +(r() * 20).toFixed(2) },
      { key: 'cpc', build: (r) => +(r() * 2).toFixed(2) },
      { key: 'convert_cost', build: (r) => +(r() * 90).toFixed(2) },
    ],
  });
}

/** 财务管理行 */
export function financeRows() {
  const day = fmtDate(new Date());
  const names = ['央广-智看天下-分-知于-...', '央广-雷盟-知于-APP内...', '百度极速版调起-央广-16', '百度极速版调起-央广-4', '百度极速版调起-央广-5'];
  return buildRows({
    count: 15, seed: 79, fields: [
      { key: 'date', build: () => day },
      { key: 'advertiser_name', build: (r, i) => names[i % names.length] },
      { key: 'advertiser_id', build: (r, i) => `1879831${235959175 - i * 100}` },
      { key: 'partner', build: (r, i) => (i % 3 === 0 ? '头条默认合作商' : '--') },
      { key: 'optimizer', build: (r, i) => ['申旭阳', '杨宿豫', '文道亲'][i % 3] },
      { key: 'shared_wallet_cost', build: (r) => +(r() * 300).toFixed(2) },
      { key: 'shared_gift_cost', build: () => 0 },
      { key: 'total_cost', build: (r) => +(r() * 800).toFixed(2) },
      { key: 'cash_cost', build: (r) => +(r() * 500).toFixed(2) },
      { key: 'gift_cost', build: (r) => +(r() * 300).toFixed(2) },
      { key: 'total_income', build: (r) => +(r() * 2000).toFixed(2) },
      { key: 'total_transfer_in', build: (r) => +(r() * 1500).toFixed(2) },
      { key: 'total_transfer_out', build: (r) => +(r() * 1200).toFixed(2) },
      { key: 'frozen', build: () => 0 },
    ],
  });
}

/** 资金使用率行 */
export function fundsRows() {
  const day = fmtDate(new Date());
  const names = ['央广-雷盟-知于-APP...', '央广-雷盟-知于-APP...', '央广-上海潮信信息科技...', '央广-亦芯-95分-投...', '上海潮信信息科技...', '上海博物知库集团有限公...', '央广-智看-下二分-刘...'];
  return buildRows({
    count: 15, seed: 89, fields: [
      { key: 'date', build: () => day },
      { key: 'advertiser_name', build: (r, i) => names[i % names.length] },
      { key: 'advertiser_id', build: (r, i) => `1879830${569464202 - i * 100}` },
      { key: 'optimizer', build: (r, i) => ['申旭阳', '杨宿豫', '文道亲'][i % 3] },
      { key: 'partner', build: (r, i) => (i % 3 === 0 ? '头条默认合作商' : '--') },
      { key: 'dept', build: (r, i) => DEPT_OPTIONS[i % DEPT_OPTIONS.length] },
      { key: 'project', build: (r, i) => PROJECT_OPTIONS[i % PROJECT_OPTIONS.length] },
      { key: 'day_balance', build: (r) => +(r() * 27000 + 1500).toFixed(2) },
      { key: 'stat_cost', build: (r) => +(r() * 900 + 100).toFixed(2) },
      { key: 'shared_wallet_cost', build: (r) => +(r() * 120).toFixed(2) },
      { key: 'shared_gift_cost', build: () => 0 },
      { key: 'total_cost', build: (r) => +(r() * 1100).toFixed(2) },
      { key: 'cash_cost', build: (r) => +(r() * 700).toFixed(2) },
      { key: 'gift_cost', build: (r) => +(r() * 400).toFixed(2) },
      { key: 'total_income', build: (r) => +(r() * 2500).toFixed(2) },
      { key: 'total_transfer_in', build: (r) => +(r() * 1800).toFixed(2) },
      { key: 'total_transfer_out', build: (r) => +(r() * 1400).toFixed(2) },
      { key: 'frozen', build: () => 0 },
    ],
  });
}
