// 原型模式本地模拟数据：不连接后端，所有列表 / 提交 / 详情均在前端内存中生成。
// 字段口径对齐巨量广告升级版创建项目 / 创建营销（单元）官方文档。
import {
  CL_PROJECTS, CL_PRODUCTS, OPTIMIZERS, OPT_GOALS, DEEP_OPT_GOALS, DEEP_OPT_MODES,
  ACCOUNT_SUBJECTS, PURPOSES, PROJECT_DELIVERY_MODES, PROJECT_AD_TYPES, PLATFORMS,
} from './projectFilters';
import {
  AD_SUBJECTS, AD_CL_PROJECTS, AD_CL_PRODUCTS, AD_OPTIMIZERS, AD_PURPOSES,
  AD_DELIVERY_MODES, AD_AD_TYPES, AD_PLATFORMS, AD_OPT_GOALS,
  AD_DEEP_OPT_GOALS, AD_DEEP_OPT_MODES, AD_DIAGNOSIS, AD_MATERIALS,
  AD_STRATEGY_GROUPS,
} from './adFilters';

const now = Date.now();
const pad = (n) => String(n).padStart(2, '0');
const fmt = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// ---------- 账户 ----------
const DEFAULT_SUBJECT = '北京央广时代文化传播有限公司';
// 账户主体清单（创意清理「指定主体的账户」可选）
const SUBJECTS = [
  DEFAULT_SUBJECT,
  '百度在线网络技术（北京）有限公司',
  '北京途途云集智科技有限公司',
  '北京雷霆盛通文化发展有限公司',
  '北京雷霆雷睿科技有限公司海淀第一分公司',
  '北京百度网讯科技有限公司',
  '北京智者天下科技有限公司北京第二分公司',
  '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司',
  '上海蜜湖信息科技有限公司',
];

const accountBase = [
  { id: 1, advertiser_id: '1879831220974955', name: '央广-智者天下二分-知乎-APP内付费', owner_real: '杨浩蒙', email: 'yanghm@ygsdmedia.com', project: '智者天下二分', product: 'APP内付费', optimizer: '杨浩蒙', dept: '网服一部', status: 'normal', balance: 12860.5, daily_budget: 2000, stat_cost: 4286.5, show_cnt: 230400, click_cnt: 18580, ctr: 8.06, active_cnt: 318, active_cost: 13.48, register_cnt: 204, register_cost: 21.01, auto_fix: 3, created_at: fmt(now - 86400000 * 22) },
  { id: 2, advertiser_id: '1878623959614544', name: 'UG-端原生IAA-漫剧-免费roi-24020', owner_real: '申旭阳', email: 'shenxy@ygsdmedia.com', project: 'IAA漫剧', product: '小游戏变现', optimizer: '申旭阳', dept: '短剧一部', status: 'normal', balance: 10000.0, daily_budget: 3000, stat_cost: 5120.8, show_cnt: 239300, click_cnt: 16970, ctr: 7.09, active_cnt: 402, active_cost: 12.74, register_cnt: 268, register_cost: 19.11, auto_fix: 1, created_at: fmt(now - 86400000 * 18) },
  { id: 3, advertiser_id: '1877112033882112', name: '央广-智者天下-小说-表单留资-80288', owner_real: '刘松涵', email: 'liusonghan@ygsdmedia.com', project: '智者天下', product: '表单留资', optimizer: '刘松涵', dept: '网服一部', status: 'auth_expired', balance: 0.0, daily_budget: 1000, stat_cost: 1320.4, show_cnt: 49270, click_cnt: 7100, ctr: 14.41, active_cnt: 0, active_cost: 0, register_cnt: 188, register_cost: 7.02, auto_fix: 0, created_at: fmt(now - 86400000 * 12) },
  { id: 4, advertiser_id: '1876554901234876', name: '百度在线-网服-线索-自研落地页', owner_real: '文清滨', email: 'wenqb@ygsdmedia.com', project: '在线线索', product: '自研落地页', optimizer: '文清滨', dept: '网服二部', status: 'normal', balance: 5320.8, daily_budget: 1500, stat_cost: 986.2, show_cnt: 37600, click_cnt: 5320, ctr: 14.15, active_cnt: 0, active_cost: 0, register_cnt: 132, register_cost: 7.47, auto_fix: 2, created_at: fmt(now - 86400000 * 6) },
  { id: 5, advertiser_id: '1875990211774320', name: '央广-短剧-小程序-付费-1107', owner_real: '杨浩蒙', email: 'yanghm@ygsdmedia.com', project: '短剧小程序', product: '小程序付费', optimizer: '杨浩蒙', dept: '短剧一部', status: 'normal', balance: 26800.0, daily_budget: 1500, stat_cost: 2418.0, show_cnt: 121500, click_cnt: 7990, ctr: 6.58, active_cnt: 186, active_cost: 13.0, register_cnt: 121, register_cost: 19.98, auto_fix: 0, created_at: fmt(now - 86400000 * 3) },
];

// 标准账户列表补充数据（对齐账户列表页表头口径）
// [账户名称, 账户ID, 登录邮箱, 账户主体, 项目, 产品, 优化师, 部门, 余额, 日预算, 消耗, 展示数, 点击数, 激活数, 注册数]
const accountSeed = [
  ['百度极速版词-央广-1', '1869584151302635', 'wenqb@creative.com', SUBJECTS[0], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 7000, 2354.44, 154501, 31883, 0, 0],
  ['百度极速版词-央广-3', '18695841552348634', 'wenqb@creative.com', SUBJECTS[1], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 90.41, 5000, 1183.27, 90216, 12074, 0, 0],
  ['百度极速版词-央广-5', '18695841512314635', 'wenqb@creative.com', SUBJECTS[2], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 5000, 606.85, 34821, 5917, 0, 0],
  ['百度极速版词-央广-7', '18695841545393786', 'wenqb@creative.com', SUBJECTS[3], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 5000, 421.60, 22574, 4803, 0, 0],
  ['百度极速版词-央广-11', '1869584157446151', 'wenqb@creative.com', SUBJECTS[4], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 3000, 238.96, 11260, 2374, 0, 0],
  ['百度极速版词-央广-12', '1869584158206068', 'wenqb@creative.com', SUBJECTS[5], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 2000, 36.42, 2418, 305, 0, 0],
  ['百度极速版词-央广-13', '18695841523141635', 'wenqb@creative.com', SUBJECTS[6], '智者天下二分', 'APP内付费', '文清滨', '网服一部', 0, 2000, 15.59, 804, 175, 0, 0],
  ['好看视频-短剧主体开户-4', '187656790472426', 'yangguang@creative.com', SUBJECTS[7], '短剧小程序', '小程序付费', '杨浩蒙', '短剧一部', 0, 1000, 613.25, 42984, 3354, 150, 1],
  ['好看视频-短剧主体开户-2', '1876567903469770', 'yangguang@creative.com', SUBJECTS[8], '短剧小程序', '小程序付费', '杨浩蒙', '短剧一部', 0, 1000, 581.04, 37854, 3025, 120, 1],
  ['央广-看客天下二分-知乎-APP内引导-0112', '1879831230099464', 'baiyuwei@creative.com', SUBJECTS[9], '智者天下二分', 'APP内付费', '栢语薇', '短剧一部', 0, 1000, 506.47, 24613, 1267, 0, 1],
  ['央广-看客天下二分-知乎-APP内引导-0113', '1879826363282746', 'baiyuwei@creative.com', SUBJECTS[0], '智者天下二分', 'APP内付费', '栢语薇', '短剧一部', 0, 1000, 197.41, 9257, 491, 0, 1],
  ['央广-看客天下二分-知乎-APP内引导-0114', '1879831252773001', 'baiyuwei@creative.com', SUBJECTS[1], '智者天下二分', 'APP内付费', '栢语薇', '短剧一部', 0, 1000, 67.69, 4787, 316, 0, 1],
  ['央广-看客天下二分-知乎-APP内引导-0115', '1879831220974955', 'baiyuwei@creative.com', SUBJECTS[2], '智者天下二分', 'APP内付费', '栢语薇', '短剧一部', 492.76, 1000, 52.17, 2413, 108, 0, 2],
  ['央广-看客天下二分-知乎-APP内引导-0116', '1879831225169696', 'shenxy@creative.com', SUBJECTS[3], '智者天下二分', 'APP内付费', '申旭阳', '短剧一部', 1275.96, 1000, 38.20, 3495, 184, 0, 0],
  ['央广-看客天下二分-知乎-APP内引导-0117', '1879831215855140', 'liusonghan@creative.com', SUBJECTS[4], '智者天下二分', 'APP内付费', '刘松涵', '短剧一部', 50.25, 1000, 19.65, 1022, 65, 0, 0],
];

const extraAccounts = accountSeed.map((s, i) => {
  const [name, advertiser_id, email, subject, project, product, optimizer, dept, balance, daily_budget, stat_cost, show_cnt, click_cnt, active_cnt, register_cnt] = s;
  return {
    id: 100 + i,
    advertiser_id,
    name,
    owner_real: optimizer,
    email,
    subject,
    project,
    product,
    optimizer,
    dept,
    // 第 3 条保留「授权失效」状态，用于任务中心 / 项目列表的失败文案
    status: i === 2 ? 'auth_expired' : 'normal',
    balance,
    daily_budget,
    stat_cost,
    show_cnt,
    click_cnt,
    ctr: show_cnt ? +((click_cnt / show_cnt) * 100).toFixed(2) : 0,
    active_cnt,
    active_cost: active_cnt ? +(stat_cost / active_cnt).toFixed(2) : 0,
    register_cnt,
    register_cost: register_cnt ? +(stat_cost / register_cnt).toFixed(2) : 0,
    auto_fix: i % 4,
    auto_fix_on: false,
    remark_cy: `${project}-${name}-创量`,
    remark_jl: `${name}-巨量`,
    media: 'upgrade',
    created_at: fmt(now - 86400000 * (i + 1)),
  };
});

// 全域 / 智擎账户（对应被隐藏的两个媒体入口，保留少量数据）
const otherMediaAccounts = [
  { id: 201, advertiser_id: '187920000101', name: '全域-漫剧商城带货-央广-01', owner_real: '申旭阳', email: 'shenxy@creative.com', subject: DEFAULT_SUBJECT, project: '全域漫剧带货', product: '全域商城', optimizer: '申旭阳', dept: '全域运营部', status: 'normal', balance: 3200.5, daily_budget: 2000, stat_cost: 1240.66, show_cnt: 58210, click_cnt: 5233, ctr: 8.99, active_cnt: 86, active_cost: 14.43, register_cnt: 31, register_cost: 40.02, auto_fix: 1, auto_fix_on: false, media: 'uni', created_at: fmt(now - 86400000 * 9) },
  { id: 202, advertiser_id: '187920000102', name: '全域-线索留资-表单落地页-央广-02', owner_real: '文清滨', email: 'wenqb@creative.com', subject: DEFAULT_SUBJECT, project: '全域线索', product: '表单留资', optimizer: '文清滨', dept: '全域运营部', status: 'normal', balance: 880.2, daily_budget: 1500, stat_cost: 532.14, show_cnt: 24130, click_cnt: 3160, ctr: 13.1, active_cnt: 0, active_cost: 0, register_cnt: 74, register_cost: 7.19, auto_fix: 0, auto_fix_on: false, media: 'uni', created_at: fmt(now - 86400000 * 7) },
  { id: 211, advertiser_id: '187930000201', name: '智擎-漫剧竖版自动起量-央广-01', owner_real: '杨浩蒙', email: 'yanghm@creative.com', subject: DEFAULT_SUBJECT, project: '智擎漫剧', product: '智擎竖版', optimizer: '杨浩蒙', dept: '智擎运营部', status: 'normal', balance: 1560.0, daily_budget: 1000, stat_cost: 386.42, show_cnt: 31520, click_cnt: 3894, ctr: 12.36, active_cnt: 45, active_cost: 8.59, register_cost: 0, register_cnt: 0, auto_fix: 0, auto_fix_on: false, media: 'oc', created_at: fmt(now - 86400000 * 5) },
  { id: 212, advertiser_id: '187930000202', name: '智擎-小游戏IAA变现测试-央广-02', owner_real: '刘松涵', email: 'liusonghan@creative.com', subject: DEFAULT_SUBJECT, project: '智擎小游戏', product: '智擎IAA', optimizer: '刘松涵', dept: '智擎运营部', status: 'normal', balance: 240.0, daily_budget: 800, stat_cost: 168.90, show_cnt: 12760, click_cnt: 1042, ctr: 8.17, active_cnt: 12, active_cost: 14.08, register_cnt: 0, register_cost: 0, auto_fix: 2, auto_fix_on: false, media: 'oc', created_at: fmt(now - 86400000 * 2) },
];

// 账户所属开发者：按部门归属（原型口径，名称沿用线上「XX专用」风格）
const DEVELOPER_BY_DEPT = {
  '网服一部': { id: 3026, name: '内广专用' },
  '网服二部': { id: 3027, name: '外广专用' },
  '短剧一部': { id: 3028, name: '短剧专用' },
  '全域运营部': { id: 3029, name: '全域专用' },
  '智擎运营部': { id: 3030, name: '智擎专用' },
};
const DEFAULT_DEVELOPER = { id: 3026, name: '内广专用' };
const withDeveloper = (a) => {
  const d = DEVELOPER_BY_DEPT[a.dept] || DEFAULT_DEVELOPER;
  return { ...a, developer_id: d.id, developer_name: d.name };
};

const accounts = [
  ...extraAccounts.map(withDeveloper),
  ...otherMediaAccounts.map(withDeveloper),
  ...accountBase.map((a, i) => withDeveloper({
    subject: SUBJECTS[i % SUBJECTS.length],
    auto_fix_on: false,
    media: 'upgrade',
    remark_cy: `${a.project}-${a.name}-创量`,
    remark_jl: `${a.name}-巨量`,
    ...a,
  })),
];

// ---------- 抖音号（添加屏蔽词：按抖音号生效范围） ----------
// 抖音号挂在媒体账户下，字段口径：抖音号名称 / 抖音号ID / 所属账户ID
const douyinAccounts = accounts.flatMap((a, i) => {
  const name = `${a.dept || '网服一部'}-${a.project || '智者天下二分'}-${a.product || 'APP内付费'}-${a.advertiser_id}-在投-${(i % 20) + 1}`;
  const list = [{
    id: 9001 + i,
    account_id: a.id,
    advertiser_id: a.advertiser_id,
    name,
    douyin_id: String(880000000000 + i * 137),
    status: '在投',
    fans: 12000 + i * 3571,
  }];
  // 部分账户带一个副号
  if (i % 3 === 0) {
    list.push({
      id: 9501 + i,
      account_id: a.id,
      advertiser_id: a.advertiser_id,
      name: `${name}-副号`,
      douyin_id: String(990000000000 + i * 137),
      status: '在投',
      fans: Math.floor((12000 + i * 3571) / 3),
    });
  }
  return list;
});

// ---------- 素材 ----------
const videos = [
  { id: 101, type: 'video', title: '漫剧开场-竖版-01', material_id: 'v_8821001234', platform_status: 'available', duration: 32, width: 1080, height: 1920, created_at: fmt(now - 86400000 * 5) },
  { id: 102, type: 'video', title: '漫剧冲突点-竖版-02', material_id: 'v_8821001235', platform_status: 'available', duration: 28, width: 1080, height: 1920, created_at: fmt(now - 86400000 * 5) },
  { id: 103, type: 'video', title: '产品演示-横版-03', material_id: 'v_8821001236', platform_status: 'reviewing', duration: 45, width: 1920, height: 1080, created_at: fmt(now - 86400000 * 2) },
  { id: 104, type: 'video', title: '口播引流-竖版-04', material_id: 'v_8821001237', platform_status: 'available', duration: 24, width: 1080, height: 1920, created_at: fmt(now - 86400000 * 1) },
];

const images = [
  { id: 201, type: 'image', title: '封面图-主图-A', material_id: 'i_8822001011', platform_status: 'available', width: 1080, height: 1920, created_at: fmt(now - 86400000 * 4) },
  { id: 202, type: 'image', title: '封面图-主图-B', material_id: 'i_8822001012', platform_status: 'available', width: 1080, height: 1920, created_at: fmt(now - 86400000 * 4) },
  { id: 203, type: 'image', title: '穿山甲大图-C', material_id: 'i_8822001013', platform_status: 'failed', width: 1280, height: 720, created_at: fmt(now - 86400000 * 2) },
];

const titlePacks = [
  { id: 301, type: 'title_pack', title: '标题包-漫剧爽点', material_id: 'tp_301', platform_status: 'available', titles: ['免费看全集，爽到停不下来', '开局被退婚，反手逆袭成大佬', '三分钟上头，后续更精彩', '不用下载，点开即看'], created_at: fmt(now - 86400000 * 7) },
  { id: 302, type: 'title_pack', title: '标题包-线索留资', material_id: 'tp_302', platform_status: 'available', titles: ['免费领取行业方案', '在线咨询，专人对接', '测一测你的适配度'], created_at: fmt(now - 86400000 * 3) },
];

const landingPages = [
  { id: 401, type: 'landing_page', title: '橙子落地页-漫剧详情页', material_id: 'lp_401', platform_status: 'available', url: 'https://orange.oceanengine.com/site/88210001', created_at: fmt(now - 86400000 * 6) },
  { id: 402, type: 'landing_page', title: '自研落地页-表单收集', material_id: 'lp_402', platform_status: 'available', url: 'https://www.example.com/form/lead', created_at: fmt(now - 86400000 * 2) },
];

// 事件管理资产（optimize_goal.asset_ids）
const eventAssets = [
  { id: 501, name: '线索-表单提交事件（主）', key: 'AD_CONVERT_TYPE_FORM' },
  { id: 502, name: '线索-电话接通事件（备用兜底）', key: 'AD_CONVERT_TYPE_PHONE_CONNECT' },
  { id: 503, name: '应用-激活付费事件', key: 'AD_CONVERT_TYPE_PAY' },
];


const assets = [...videos, ...images, ...titlePacks, ...landingPages];

// ---------- 任务 ----------
const tasks = [
  { id: 1, task_no: 'BT20261112001', name: '漫剧竖版批量搭建-1112', creator: '杨浩蒙', total: 120, succeeded: 118, failed: 2, status: 'PARTIAL', created_at: fmt(now - 86400000 * 1.2) },
  { id: 2, task_no: 'BT20261112002', name: '线索留资-表单落地页', creator: '申旭阳', total: 48, succeeded: 48, failed: 0, status: 'DONE', created_at: fmt(now - 86400000 * 0.8) },
  { id: 3, task_no: 'BT20261111018', name: '小程序付费-ROI 测试', creator: '刘松涵', total: 60, succeeded: 21, failed: 0, status: 'RUNNING', created_at: fmt(now - 86400000 * 0.3) },
  { id: 4, task_no: 'BT20261111015', name: '口播素材批量起量', creator: '文清滨', total: 30, succeeded: 0, failed: 0, status: 'QUEUED', created_at: fmt(now - 86400000 * 0.1) },
  { id: 5, task_no: 'BT20261110009', name: '历史-拒审回炉', creator: '杨浩蒙', total: 24, succeeded: 10, failed: 14, status: 'FAILED', created_at: fmt(now - 86400000 * 2) },
];

const taskItems = {
  1: [
    { id: 1001, task_id: 1, account_name: accounts[0].name, status: 'success', error: '', payload: { promotion: { name: '1112_153012_01_漫剧开场-竖版-01' } } },
    { id: 1002, task_id: 1, account_name: accounts[0].name, status: 'success', error: '', payload: { promotion: { name: '1112_153012_02_漫剧冲突点-竖版-02' } } },
    { id: 1003, task_id: 1, account_name: accounts[1].name, status: 'failed', error: '40000 素材图片信息有误：image_id 不存在', payload: { promotion: { name: '1112_153012_03_产品演示-横版-03' } } },
    { id: 1004, task_id: 1, account_name: accounts[1].name, status: 'failed', error: '40000 优化目标与落地页载体不匹配', payload: { promotion: { name: '1112_153012_04_口播引流-竖版-04' } } },
  ],
  2: [
    { id: 2001, task_id: 2, account_name: accounts[3].name, status: 'success', error: '', payload: { promotion: { name: '1112_102201_01_免费领取行业方案' } } },
  ],
  3: [
    { id: 3001, task_id: 3, account_name: accounts[4].name, status: 'running', error: '', payload: { promotion: { name: '1112_091005_01_小程序付费测试' } } },
  ],
  4: [],
  5: [
    { id: 5001, task_id: 5, account_name: accounts[2].name, status: 'failed', error: '40000 账户授权已失效', payload: { promotion: { name: '1110_180001_01_历史回炉' } } },
  ],
};

// ---------- 计划（广告/营销） ----------
const plans = [
  { id: 901, name: '1112_153012_01_漫剧开场-竖版-01', account_name: accounts[0].name, campaign_id: '187900000111', ad_id: '187910002221', status: 'enabled', pricing: 'PRICING_OCPM', budget: 500, bid: 32.5, created_at: fmt(now - 86400000 * 1.1) },
  { id: 902, name: '1112_153012_02_漫剧冲突点-竖版-02', account_name: accounts[0].name, campaign_id: '187900000111', ad_id: '187910002222', status: 'enabled', pricing: 'PRICING_OCPM', budget: 500, bid: 30.0, created_at: fmt(now - 86400000 * 1.1) },
  { id: 903, name: '1112_102201_01_免费领取行业方案', account_name: accounts[3].name, campaign_id: '187900000207', ad_id: '187910003310', status: 'disabled', pricing: 'PRICING_CPC', budget: 300, bid: 1.2, created_at: fmt(now - 86400000 * 0.8) },
  { id: 904, name: '1112_091005_01_小程序付费测试', account_name: accounts[4].name, campaign_id: '187900000315', ad_id: '187910004408', status: 'enabled', pricing: 'PRICING_OCPM', budget: 800, bid: 45.0, created_at: fmt(now - 86400000 * 0.3) },
];

// ---------- 报表 ----------
const reportRows = accounts.slice(0, 4).map((a, i) => {
  const show = 12000 + i * 3400;
  const click = Math.round(show * (0.03 + i * 0.004));
  const convert = Math.round(click * (0.08 + i * 0.01));
  const cost = +(click * (0.8 + i * 0.15)).toFixed(2);
  return {
    account_name: a.name,
    stat_cost: cost,
    show_cnt: show,
    click_cnt: click,
    ctr: +((click / show) * 100).toFixed(2),
    convert_cnt: convert,
    convert_cost: convert ? +(cost / convert).toFixed(2) : 0,
  };
});

const ranking = videos.slice(0, 3).map((v, i) => ({
  material_id: v.material_id,
  title: v.title,
  stat_cost: +(800 - i * 160).toFixed(2),
  show_cnt: 9000 - i * 2200,
  click_cnt: 420 - i * 110,
  convert_cnt: 38 - i * 9,
}));

// ---------- 用户 ----------
const users = [
  { id: 1, username: 'admin', real_name: '系统管理员', role: 'admin', status: 'active', last_login_at: fmt(now - 3600000 * 2) },
  { id: 2, username: 'op_test', real_name: '优化师-测试', role: 'operator', status: 'active', last_login_at: fmt(now - 3600000 * 26) },
  { id: 3, username: 'viewer', real_name: '只读账号', role: 'viewer', status: 'active', last_login_at: fmt(now - 86400000 * 4) },
];

// ---------- 项目（项目层级，对齐创量项目报表列头） ----------
const projects = [
  {
    id: 701, name: '漫剧竖版起量-0112', account_name: accounts[0].name, campaign_id: '187900000111',
    status: 'enabled', stat_cost: 4286.5, pay_roi: 2.36, game_roi: 0, cpm: 18.6, cpc: 1.24,
    deep_bid: 42.0, budget: 2000, bid: 30.5, show_cnt: 230400, click_cnt: 18580, ctr: 8.06,
    convert_cnt: 612, convert_cost: 7.0, convert_rate: 3.29, deep_cnt: 218, deep_cost: 19.66, deep_rate: 1.18,
    created_at: fmt(now - 86400000 * 1.1),
  },
  {
    id: 702, name: 'IAA漫剧免费变现-24020', account_name: accounts[1].name, campaign_id: '187900000112',
    status: 'enabled', stat_cost: 5120.8, pay_roi: 0, game_roi: 1.82, cpm: 21.4, cpc: 1.41,
    deep_bid: 38.0, budget: 3000, bid: 28.0, show_cnt: 239300, click_cnt: 16970, ctr: 7.09,
    convert_cnt: 704, convert_cost: 7.27, convert_rate: 4.15, deep_cnt: 156, deep_cost: 32.83, deep_rate: 0.92,
    created_at: fmt(now - 86400000 * 1.0),
  },
  {
    id: 703, name: '小说表单留资-80288', account_name: accounts[2].name, campaign_id: '187900000207',
    status: 'disabled', stat_cost: 1320.4, pay_roi: 0, game_roi: 0, cpm: 26.8, cpc: 1.86,
    deep_bid: 0, budget: 1000, bid: 35.0, show_cnt: 49270, click_cnt: 7100, ctr: 14.41,
    convert_cnt: 188, convert_cost: 7.02, convert_rate: 2.65, deep_cnt: 0, deep_cost: 0, deep_rate: 0,
    created_at: fmt(now - 86400000 * 0.8),
  },
  {
    id: 704, name: '小程序付费ROI测试-1107', account_name: accounts[4].name, campaign_id: '187900000315',
    status: 'enabled', stat_cost: 2418.0, pay_roi: 3.12, game_roi: 0, cpm: 19.9, cpc: 1.52,
    deep_bid: 55.0, budget: 1500, bid: 45.0, show_cnt: 121500, click_cnt: 7990, ctr: 6.58,
    convert_cnt: 263, convert_cost: 9.19, convert_rate: 3.29, deep_cnt: 96, deep_cost: 25.19, deep_rate: 1.2,
    created_at: fmt(now - 86400000 * 0.3),
  },
  // 巨量全域项目
  {
    id: 801, media: 'uni', name: '全域-漫剧商城带货-0112', account_name: accounts[1].name, campaign_id: '187920000101',
    status: 'enabled', budget: 5000, uni_cost: 3260.4, gmv: 12860.0, uni_roi: 3.94, monetize_amount: 12860.0,
    pay_amount: 9620.0, uni_income: 4210.0, pay_income: 3180.0, monetize_income: 1030.0,
    created_at: fmt(now - 86400000 * 1.4),
  },
  {
    id: 802, media: 'uni', name: '全域-线索留资-表单落地页', account_name: accounts[3].name, campaign_id: '187920000102',
    status: 'disabled', budget: 2000, uni_cost: 986.2, gmv: 0, uni_roi: 0, monetize_amount: 0,
    pay_amount: 0, uni_income: 0, pay_income: 0, monetize_income: 0,
    created_at: fmt(now - 86400000 * 0.9),
  },
  // 巨量智擎项目
  {
    id: 811, media: 'oc', name: '智擎-漫剧竖版自动起量', account_name: accounts[0].name, campaign_id: '187930000201',
    status: 'enabled', purpose: 'APP推广', type: '程序化投放', scene: '短视频带货', goal: '付费',
    budget: 3000, stat_cost: 1860.5, show_cnt: 96400,
    created_at: fmt(now - 86400000 * 1.2),
  },
  {
    id: 812, media: 'oc', name: '智擎-小游戏IAA变现测试', account_name: accounts[4].name, campaign_id: '187930000202',
    status: 'disabled', purpose: '小游戏推广', type: '手动投放', scene: '应用推广', goal: '激活',
    budget: 1500, stat_cost: 640.0, show_cnt: 41200,
    created_at: fmt(now - 86400000 * 0.5),
  },
];

// ---------- 项目：补充模拟行 ----------
// 线上项目列表为千级数据，本地按账户批量铺开模拟行，便于演示分页、排序与合计行。
const PROJECT_SUFFIX_POOL = ['-APP内付费-01', '-小程序付费-01', '-小游戏变现-01', '-表单留资-01'];
// 创意素材 / 关联商品：线上为弹窗选择器，本地以列表项模拟
const PROJECT_MATERIALS = ['漫剧开场-竖版-01', '漫剧冲突点-竖版-02', '产品演示-横版-03', '口播引流-竖版-04'];
const PROJECT_GOODS = ['爆款短剧周边礼盒', '会员月卡'];

// 伪随机（固定公式，保证每次刷新数据一致）
const pseudo = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const upgradeAccounts = accounts.filter((a) => (a.media || 'upgrade') === 'upgrade');
const generatedProjects = [];
upgradeAccounts.forEach((acc, ai) => {
  PROJECT_SUFFIX_POOL.forEach((sfx, si) => {
    const seed = ai * 97 + si * 13 + 7;
    const n = generatedProjects.length;
    const stat_cost = +(pseudo(seed) * 5200 + 120).toFixed(2);
    const show_cnt = Math.round(pseudo(seed + 1) * 230000 + 8000);
    const click_cnt = Math.round(show_cnt * (pseudo(seed + 2) * 0.09 + 0.008));
    const ctr = show_cnt ? +((click_cnt / show_cnt) * 100).toFixed(2) : 0;
    const cpm = show_cnt ? +((stat_cost / show_cnt) * 1000).toFixed(2) : 0;
    const cpc = click_cnt ? +(stat_cost / click_cnt).toFixed(2) : 0;
    const convert_cnt = Math.round(click_cnt * (pseudo(seed + 3) * 0.06 + 0.004));
    const convert_cost = convert_cnt ? +(stat_cost / convert_cnt).toFixed(2) : 0;
    const convert_rate = click_cnt ? +((convert_cnt / click_cnt) * 100).toFixed(2) : 0;
    const deep_cnt = Math.round(convert_cnt * (pseudo(seed + 4) * 0.6 + 0.05));
    const deep_cost = deep_cnt ? +(stat_cost / deep_cnt).toFixed(2) : 0;
    const deep_rate = click_cnt ? +((deep_cnt / click_cnt) * 100).toFixed(2) : 0;
    generatedProjects.push({
      id: 750 + n,
      name: `${acc.name}${sfx}`,
      account_name: acc.name,
      advertiser_id: acc.advertiser_id,
      campaign_id: `1879000${String(200 + n)}`,
      status: pseudo(seed + 5) > 0.72 ? 'disabled' : 'enabled',
      stat_cost, pay_roi: +(pseudo(seed + 6) * 3).toFixed(2), game_roi: +(pseudo(seed + 7) * 2).toFixed(2),
      cpm, cpc, deep_bid: +(pseudo(seed + 8) * 60).toFixed(1), budget: Math.round(pseudo(seed + 9) * 4000 + 500),
      bid: +(pseudo(seed + 10) * 50 + 5).toFixed(1),
      show_cnt, click_cnt, ctr, convert_cnt, convert_cost, convert_rate, deep_cnt, deep_cost, deep_rate,
      created_at: fmt(now - 86400000 * (0.2 + n * 0.06)),
    });
  });
});
projects.push(...generatedProjects);

// 项目行补齐账户维度字段（创量项目 / 创量产品 / 优化师 / 账户主体 / 推广目的 …）
const accByName = {};
accounts.forEach((a) => { accByName[a.name] = a; });
projects.forEach((p) => {
  if (p.media) return;
  const acc = accByName[p.account_name] || {};
  const seed = p.id * 31;
  p.advertiser_id = acc.advertiser_id || p.advertiser_id || '';
  // 维度取值对齐线上项目列表「查询条件」候选项（见 mock/projectFilters.js）
  p.project = CL_PROJECTS[Math.floor(pseudo(seed + 10) * CL_PROJECTS.length)];
  p.product = CL_PRODUCTS[Math.floor(pseudo(seed + 11) * CL_PRODUCTS.length)];
  p.optimizer = OPTIMIZERS[Math.floor(pseudo(seed + 12) * OPTIMIZERS.length)];
  p.subject = ACCOUNT_SUBJECTS[Math.floor(pseudo(seed + 13) * ACCOUNT_SUBJECTS.length)];
  p.purpose = PURPOSES[Math.floor(pseudo(seed) * PURPOSES.length)];
  p.opt_goal = OPT_GOALS[Math.floor(pseudo(seed + 1) * OPT_GOALS.length)];
  p.deep_goal = DEEP_OPT_GOALS[Math.floor(pseudo(seed + 2) * DEEP_OPT_GOALS.length)];
  p.deep_mode = DEEP_OPT_MODES[Math.floor(pseudo(seed + 3) * DEEP_OPT_MODES.length)];
  p.platform = PLATFORMS[Math.floor(pseudo(seed + 4) * PLATFORMS.length)];
  p.ad_type = PROJECT_AD_TYPES[Math.floor(pseudo(seed + 5) * PROJECT_AD_TYPES.length)];
  p.material = PROJECT_MATERIALS[Math.floor(pseudo(seed + 6) * PROJECT_MATERIALS.length)];
  p.goods = PROJECT_GOODS[Math.floor(pseudo(seed + 7) * PROJECT_GOODS.length)];
  p.delivery_mode = PROJECT_DELIVERY_MODES[Math.floor(pseudo(seed + 8) * PROJECT_DELIVERY_MODES.length)];
  p.star = pseudo(seed + 14) > 0.5 ? 'yes' : 'no';
});

// ---------- 广告（营销/计划层级，对齐创量广告报表列头） ----------
const ads = [
  {
    id: 901, name: '1112_153012_01_漫剧开场-竖版-01', account_name: accounts[0].name, campaign_id: '187900000111', ad_id: '187910002221',
    status: 'enabled', budget: 500, reject_note: '', bid: 32.5, deep_bid: 42.0, stat_cost: 1180.2,
    show_cnt: 63400, cpm: 18.6, click_cnt: 5280, ctr: 8.33, convert_cnt: 176, convert_cost: 6.71, convert_rate: 3.33,
    deep_cnt: 62, deep_cost: 19.04, deep_rate: 1.17, created_at: fmt(now - 86400000 * 1.1),
  },
  {
    id: 902, name: '1112_153012_02_漫剧冲突点-竖版-02', account_name: accounts[0].name, campaign_id: '187900000111', ad_id: '187910002222',
    status: 'enabled', budget: 500, reject_note: '', bid: 30.0, deep_bid: 38.0, stat_cost: 966.3,
    show_cnt: 51800, cpm: 18.7, click_cnt: 4120, ctr: 7.95, convert_cnt: 142, convert_cost: 6.8, convert_rate: 3.45,
    deep_cnt: 48, deep_cost: 20.13, deep_rate: 1.17, created_at: fmt(now - 86400000 * 1.1),
  },
  {
    id: 903, name: '1112_102201_01_免费领取行业方案', account_name: accounts[3].name, campaign_id: '187900000207', ad_id: '187910003310',
    status: 'disabled', budget: 300, reject_note: '素材文案含极限词，建议修改后重新提交', bid: 1.2, deep_bid: 0, stat_cost: 320.8,
    show_cnt: 12100, cpm: 26.5, click_cnt: 1710, ctr: 14.13, convert_cnt: 46, convert_cost: 6.97, convert_rate: 2.69,
    deep_cnt: 0, deep_cost: 0, deep_rate: 0, created_at: fmt(now - 86400000 * 0.8),
  },
  {
    id: 904, name: '1112_091005_01_小程序付费测试', account_name: accounts[4].name, campaign_id: '187900000315', ad_id: '187910004408',
    status: 'enabled', budget: 800, reject_note: '', bid: 45.0, deep_bid: 55.0, stat_cost: 1208.5,
    show_cnt: 60800, cpm: 19.9, click_cnt: 3990, ctr: 6.56, convert_cnt: 131, convert_cost: 9.23, convert_rate: 3.28,
    deep_cnt: 48, deep_cost: 25.18, deep_rate: 1.2, created_at: fmt(now - 86400000 * 0.3),
  },
];

// ---------- 广告：模拟行扩充 + 维度字段补齐 ----------
// 线上广告列表为百级数据，本地按账户批量铺开模拟行，便于演示筛选、分页、批量操作与详情。
const AD_CAMPAIGN_POOL = [
  '惯宠经年-央广-智者-APP内付费-安卓-爱到此处停止-知乎拉活-1118-非原生-16',
  '玫瑰予爱-央广-智者-APP内付费-安卓-予我玫瑰-知乎拉活-1118-非原生-16',
  '央广-智者天下二分-知乎-APP内付费-802889244-在投',
  '央广-短剧-小程序-付费-1107',
  'UG-端原生IAA-漫剧-免费roi-24020',
];
const AD_TITLE_POOL = [
  '很久没有一本书让我看完想给作者磕个头了，这本算一个',
  '评论区最高赞：“看完这本我把其他小说都删了”，我本来觉得夸张，现在懂了',
  '开局虐渣爽感拉满，多重马甲惊艳全场，女主逆袭手撕仇人，全程高能反转不断',
];
const AD_SELLING_POINTS = '开局虐渣爽感拉满，多重马甲惊艳全场，爱恨拉扯越看越上头，女主逆袭手撕仇人，全程高能反转不断';
const AD_ACTION_CALL = '抢先解锁，点开结局，即刻追读，速阅全文，畅读全本';

const upgradeAccs = accounts.filter((a) => (a.media || 'upgrade') === 'upgrade');
const generatedAds = [];
upgradeAccs.forEach((acc, ai) => {
  const n = generatedAds.length;
  const seed = ai * 71 + 17;
  const stat_cost = +(pseudo(seed) * 2600 + 60).toFixed(2);
  const show_cnt = Math.round(pseudo(seed + 1) * 160000 + 4000);
  const click_cnt = Math.round(show_cnt * (pseudo(seed + 2) * 0.08 + 0.006));
  const ctr = show_cnt ? +((click_cnt / show_cnt) * 100).toFixed(2) : 0;
  const cpm = show_cnt ? +((stat_cost / show_cnt) * 1000).toFixed(2) : 0;
  const cpc = click_cnt ? +(stat_cost / click_cnt).toFixed(2) : 0;
  const convert_cnt = Math.round(click_cnt * (pseudo(seed + 3) * 0.05 + 0.003));
  const convert_cost = convert_cnt ? +(stat_cost / convert_cnt).toFixed(2) : 0;
  const convert_rate = click_cnt ? +((convert_cnt / click_cnt) * 100).toFixed(2) : 0;
  const deep_cnt = Math.round(convert_cnt * (pseudo(seed + 4) * 0.6 + 0.05));
  const deep_cost = deep_cnt ? +(stat_cost / deep_cnt).toFixed(2) : 0;
  const deep_rate = click_cnt ? +((deep_cnt / click_cnt) * 100).toFixed(2) : 0;
  const campaign_name = AD_CAMPAIGN_POOL[n % AD_CAMPAIGN_POOL.length];
  generatedAds.push({
    id: 950 + n,
    name: `${campaign_name}-${ai + 1}`,
    account_name: acc.name,
    advertiser_id: acc.advertiser_id,
    campaign_id: `1879000${String(300 + n)}`,
    campaign_name,
    ad_id: `7709392${String(1000000 + n * 137)}`,
    status: pseudo(seed + 5) > 0.75 ? 'disabled' : 'enabled',
    budget: Math.round(pseudo(seed + 6) * 5000 + 500),
    reject_note: pseudo(seed + 7) > 0.86 ? '素材文案含极限词，建议修改后重新提交' : '',
    audit_note: pseudo(seed + 8) > 0.9 ? '落地页资质待补充' : '',
    bid: +(pseudo(seed + 9) * 60 + 8).toFixed(1),
    deep_bid: +(pseudo(seed + 10) * 80 + 10).toFixed(1),
    roi_coefficient: pseudo(seed + 11) > 0.7 ? +(pseudo(seed + 12) * 3).toFixed(2) : 0,
    stat_cost, show_cnt, cpm, click_cnt, ctr, cpc, convert_cnt, convert_cost, convert_rate,
    deep_cnt, deep_cost, deep_rate,
    created_at: fmt(now - 86400000 * (0.2 + n * 0.05)),
  });
});
ads.push(...generatedAds);

// 广告行补齐账户维度字段（对齐线上广告列表「查询条件」候选项，见 mock/adFilters.js）
ads.forEach((a) => {
  const acc = accounts.find((x) => x.name === a.account_name) || {};
  const seed = a.id * 37;
  a.advertiser_id = a.advertiser_id || acc.advertiser_id || '';
  a.campaign_name = a.campaign_name || AD_CAMPAIGN_POOL[a.id % AD_CAMPAIGN_POOL.length];
  a.cpc = a.cpc != null ? a.cpc : (a.click_cnt ? +(a.stat_cost / a.click_cnt).toFixed(2) : 0);
  a.subject = AD_SUBJECTS[Math.floor(pseudo(seed + 1) * AD_SUBJECTS.length)];
  a.project = AD_CL_PROJECTS[Math.floor(pseudo(seed + 2) * AD_CL_PROJECTS.length)];
  a.product = AD_CL_PRODUCTS[Math.floor(pseudo(seed + 3) * AD_CL_PRODUCTS.length)];
  a.optimizer = acc.optimizer || AD_OPTIMIZERS[Math.floor(pseudo(seed + 4) * AD_OPTIMIZERS.length)];
  a.purpose = AD_PURPOSES[Math.floor(pseudo(seed + 5) * AD_PURPOSES.length)];
  a.delivery_mode = AD_DELIVERY_MODES[1 + Math.floor(pseudo(seed + 6) * 2)];
  a.ad_type = AD_AD_TYPES[1 + Math.floor(pseudo(seed + 7) * 2)];
  a.star = pseudo(seed + 8) > 0.5 ? 'yes' : 'no';
  a.star_task_id = a.star === 'yes' ? `XG${700000 + a.id}` : '';
  a.platform = AD_PLATFORMS[1 + Math.floor(pseudo(seed + 9) * 2)];
  a.opt_goal = AD_OPT_GOALS[Math.floor(pseudo(seed + 10) * AD_OPT_GOALS.length)];
  a.deep_goal = AD_DEEP_OPT_GOALS[Math.floor(pseudo(seed + 11) * AD_DEEP_OPT_GOALS.length)];
  a.deep_mode = AD_DEEP_OPT_MODES[Math.floor(pseudo(seed + 12) * AD_DEEP_OPT_MODES.length)];
  a.material = AD_MATERIALS[1 + Math.floor(pseudo(seed + 13) * (AD_MATERIALS.length - 1))];
  a.diagnosis = AD_DIAGNOSIS[Math.floor(pseudo(seed + 14) * AD_DIAGNOSIS.length)];
  a.strategy = AD_STRATEGY_GROUPS[0];
  a.learn = pseudo(seed + 15) > 0.66 ? '学习期中' : (pseudo(seed + 18) > 0.5 ? '学习期结束' : '学习期失败');
  a.one_click = pseudo(seed + 16) > 0.6 ? '已开启' : '未开启';
  a.douyin_id = `dy${8000000 + a.id}`;
  // 详情抽屉（广告 tab）字段
  a.identity = '推广身份';
  a.anchor_id = pseudo(seed + 17) > 0.5 ? `anchor_${700000 + a.id}` : '';
  a.landing_type = '小程序链接';
  a.landing_url = `https://www.chengzijianzhan.com/tetris/page/${7676317811270926362 + a.id}/`;
  a.direct_url = 'zhihu://market/paid_column/2103155961171014405/section/2101781169624834199?utm_id=119910215108381&ad_delivery_source=svip&utm_medium=svipgrowth&utm_source=1948ae58ec3f09902a7085e8e124626a';
  a.backup_url = '';
  a.titles = AD_TITLE_POOL;
  a.product_name = '知乎';
  a.selling_points = AD_SELLING_POINTS;
  a.action_call = AD_ACTION_CALL;
  a.source = '-';
  a.comment_enabled = '启用';
  // 详情抽屉（项目 tab）字段：与线上「广告项目 - 基础信息」结构一致
  a.promo_target = `${a.purpose}/应用调起`;
  a.delivery_type = '常规投放';
  a.marketing_scene = '短视频/图片';
  a.related_product_id = `17943648498${57348188 + (a.id % 90)}`;
  a.app_name = a.product_name;
  a.app_package = 'com.zhihu.android';
  a.download_type = '直接下载';
  a.launch_type = '直接调起';
  a.store_first = '默认下载';
  a.download_link = 'https://apps.bytesfield.com/download/basic/cur/832e6e4488582f35c59ff7c8bd52c853d92ca7f7';
  a.ad_content = '-';
  a.event_asset_id = `188171855${8657561 + (a.id % 90)}`;
  a.backup_asset_id = '-';
  a.region = '不限';
  a.gender = pseudo(seed + 19) > 0.5 ? '女' : '男';
  a.age = '18-19岁、20-23岁、24-30岁、31-35岁、36-40岁、41-45岁';
  a.media_target = '不限';
  a.device_type = '不限';
  a.network = '不限';
  a.carrier = '不限';
  a.phone_brand = '不限';
  a.phone_price = '不限';
  a.bid_strategy = '稳定成本（常规版）';
  a.delivery_time = `从今天起长期投放（${fmt(now)} ~ 2036-11-18 14:15:26）`;
  a.project_budget = `日预算（${(a.budget || 0) * 1000}元）`;
  a.project_roi = '-';
  a.project_bid = '-';
  a.project_deep_bid = '-';
  a.placements = '今日头条、西瓜视频、抖音、番茄小说';
  a.keyword = '-';
  a.bid_factor = '1';
  a.target_expand = '不启用';
  a.monitor_group = `1881718559${616219 + (a.id % 90)}`;
  a.monitor_show = '-';
  a.monitor_valid_point = 'https://open.zhihu.com/api/channel/unified_tracking?source=1948ae58ec3f09902a7085e8e124626a&callback=__CALLBACK_PARAM__&ts=__TS__&os=__OS__&idfa=__IDFA__&imei_md5=__IMEI__&oaid=__OAID__&caid=__CAID__&ip=__IP__&ua=__UA__&mac_md5=__MAC1__&ad_campaign=__PROJECT_ID__&ad_adgroup=__PROMOTION_ID__&ad_creative=__CID__&appkey=1355&ad_delivery_model=feed_wake_up&ad_delivery_content=short_story&ad_delivery_source=svip&package=zh_ygsdlhff';
  a.monitor_video_play = '-';
  a.monitor_video_finish = '-';
  a.monitor_video_valid = '-';
});

// ---------- 托管方案 ----------
const autoPlans = [
  {
    id: 601, name: '漫剧竖版自动托管-线索目标', status: 'enabled', external_action: '表单提交', deep_action: '电话接通',
    deep_mode: '付费ROI', account_name: accounts[0].name, goal: '销售线索投放', delivery_mode: 'MANUAL', created_at: fmt(now - 86400000 * 4),
  },
  {
    id: 602, name: 'IAA小程序变现托管方案', status: 'enabled', external_action: '付费', deep_action: '变现 ROI',
    deep_mode: '深度出价', account_name: accounts[1].name, goal: '小程序/小游戏', delivery_mode: 'PROCEDURAL', created_at: fmt(now - 86400000 * 2),
  },
  {
    id: 603, name: '线索留资-暂停中方案', status: 'disabled', external_action: '表单提交', deep_action: '不设置深度转化',
    deep_mode: '-', account_name: accounts[3].name, goal: '销售线索投放', delivery_mode: 'MANUAL', created_at: fmt(now - 86400000 * 1),
  },
];

// ---------- 铺剧助手规则 ----------
const dramaRules = [
  {
    id: 801, name: '漫剧新剧上线-每日自动铺剧', rule: '新素材入库后，按账户×视频×标题包组合自动生成广告', last_result: '成功生成 24 条',
    desc: '新剧首发当日自动起量，单账户上限 20 条', expire: '长期有效', account_name: accounts[0].name, creator: '杨浩蒙',
    updater: '杨浩蒙', updated_at: fmt(now - 86400000 * 0.5), status: 'enabled',
  },
  {
    id: 802, name: '高消耗素材追投规则', rule: '消耗达阈值且转化成本达标时，自动复制到新计划', last_result: '成功生成 8 条',
    desc: '转化成本 ≤ 7 元、日消耗 ≥ 500 元触发追投', expire: '2026-12-31', account_name: accounts[1].name, creator: '申旭阳',
    updater: '刘松涵', updated_at: fmt(now - 86400000 * 1.2), status: 'enabled',
  },
  {
    id: 803, name: '低质素材自动清理规则', rule: '连续 3 天 CTR < 1% 自动暂停对应广告', last_result: '暂停 3 条',
    desc: '仅监控不删除，失败项进入任务中心复核', expire: '长期有效', account_name: accounts[4].name, creator: '刘松涵',
    updater: '申旭阳', updated_at: fmt(now - 86400000 * 2), status: 'disabled',
  },
];

// ---------- 素材库扩展：文案库 / 动态链接 / 创意组件 / 评论管理 ----------
const copywrites = [
  { id: 1, title: '漫剧爽点文案-A', content: '开局被退婚，反手逆袭成大佬，免费看全集！', status: 'available', created_at: fmt(now - 86400000 * 6) },
  { id: 2, title: '线索留资文案-B', content: '免费领取行业方案，在线咨询专人对接', status: 'available', created_at: fmt(now - 86400000 * 3) },
  { id: 3, title: '口播引流文案-C', content: '三分钟上头，后续更精彩，不用下载点开即看', status: 'reviewing', created_at: fmt(now - 86400000 * 1) },
];

const deepLinks = [
  { id: 1, title: '小程序直达-付费页', url: 'snssdk1128://microapp/tt?appid=tt88210001', status: 'available', created_at: fmt(now - 86400000 * 5) },
  { id: 2, title: '自研H5-表单页', url: 'https://www.example.com/h5/form', status: 'available', created_at: fmt(now - 86400000 * 2) },
];

const adComponents = [
  { id: 1, title: '表单组件-预约留资', comp_type: '表单', status: 'available', created_at: fmt(now - 86400000 * 4) },
  { id: 2, title: '微信客服组件', comp_type: '客服', status: 'available', created_at: fmt(now - 86400000 * 2) },
  { id: 3, title: '原生锚点-门店地址', comp_type: '锚点', status: 'reviewing', created_at: fmt(now - 86400000 * 1) },
];

const commentMgmt = [
  { id: 1, video_title: '漫剧开场-竖版-01', comment: '这剧叫什么名字？在哪看？', action: '待回复', status: 'pending', created_at: fmt(now - 3600000 * 5) },
  { id: 2, video_title: '口播引流-竖版-04', comment: '已私信，求链接', action: '已私信', status: 'handled', created_at: fmt(now - 3600000 * 20) },
];

// ---------- 资产域：事件管理 / 定向包 / 人群包 / 监测活动 / 定向模板 ----------
const audiencePackages = [
  { id: 1, name: '漫剧兴趣人群-高活跃', package_type: '行为兴趣', size: '1,204,330', status: 'available', updated_at: fmt(now - 86400000 * 3) },
  { id: 2, name: '线索留资-已转化排除包', package_type: '排除人群', size: '86,210', status: 'available', updated_at: fmt(now - 86400000 * 1) },
];

const orientationPackages = [
  { id: 1, name: '漫剧-25-40女性定向包', regions: '全国', gender: '女', age: '25-40', interests: '短剧/小说', status: 'available', updated_at: fmt(now - 86400000 * 4) },
  { id: 2, name: '线索-高意向人群定向', regions: '一二线城市', gender: '不限', age: '30-50', interests: '理财/教育', status: 'available', updated_at: fmt(now - 86400000 * 2) },
];

const monitorActivities = [
  { id: 1, name: '漫剧详情页-监测链接', monitor_url: 'https://monitor.example.com/act/88210001', status: 'active', created_at: fmt(now - 86400000 * 5) },
  { id: 2, name: '表单提交-转化监测', monitor_url: 'https://monitor.example.com/act/88210002', status: 'active', created_at: fmt(now - 86400000 * 2) },
];

// ---------- 巨量资产补充类型（对照资产菜单清单） ----------
// 资产组：列口径对齐创量标准版「资产组」页（固定列：资产组名称/资产组别名/操作）
const assetGroups = [
  {
    id: 1, name: '漫剧小游戏资产组-01', alias: '漫剧01组', use_status: '已使用',
    account_name: '央广-智者天下二分-知乎-APP内付费  (1879831220974955)',
    product_id: '8801001', mini_type: '微信小游戏', delivery_content: '微信小游戏',
    link_type: 'Deeplink直达链接', deeplink: 'weixin://dl/business/?t=aBcDeF01', ulink: '',
    mini_name: '漫剧大作战小游戏', mini_note: '短剧小游戏-主推',
    path_link: 'pages/index/index?scene=1007',
    valid_link: 'https://valid.example.com/touch/8821001',
    monitor_link: 'https://monitor.example.com/act/8821001',
    landing_link: 'https://lp.example.com/8821001',
    native_link: 'snssdk1128://aweme/miniapp?appid=tt8821001',
    cl_template: '橙子模板-短剧落地页-01',
    creator: '杨浩蒙', created_at: fmt(now - 86400000 * 12), updated_at: fmt(now - 86400000 * 2),
  },
  {
    id: 2, name: '线索留资电商资产组-02', alias: '线索02组', use_status: '未使用',
    account_name: 'UG-端原生IAA-漫剧-免费roi-24020  (1878623959614544)',
    product_id: '8801002', mini_type: '自研落地页', delivery_content: '自研落地页',
    link_type: 'Ulink直达链接', deeplink: '', ulink: 'https://ulink.example.com/g/8821002',
    mini_name: '线索表单页', mini_note: '表单留资-测试',
    path_link: 'https://lp.example.com/form/8821002?cid=88',
    valid_link: 'https://valid.example.com/touch/8821002',
    monitor_link: 'https://monitor.example.com/act/8821002',
    landing_link: 'https://lp.example.com/8821002',
    native_link: 'snssdk1128://aweme/miniapp?appid=tt8821002',
    cl_template: '橙子模板-线索表单-02',
    creator: '申旭阳', created_at: fmt(now - 86400000 * 6), updated_at: fmt(now - 86400000 * 1),
  },
];

const products = [
  { id: 1, name: '爆款短剧周边礼盒', product_id: 'P8801001', product_type: '商品', price: '59.00', status: 'available', updated_at: fmt(now - 86400000 * 4) },
  { id: 2, name: '会员月卡', product_id: 'P8801002', product_type: '虚拟商品', price: '25.00', status: 'reviewing', updated_at: fmt(now - 86400000 * 2) },
];

// 小程序/小游戏组件（新建资产组抽屉「选择XX小游戏」弹窗的数据源）
const miniComponents = [
  { id: 'wx_g_8821001', name: '漫剧大作战小游戏', type: '微信小游戏', project_count: 12, used: false, upgrade: true, url: 'weixin://dl/business/?t=aBcDeF01', note: '短剧小游戏-主推' },
  { id: 'wx_g_8821002', name: '甜宠短剧小游戏', type: '微信小游戏', project_count: 5, used: true, upgrade: false, url: 'weixin://dl/business/?t=aBcDeF02', note: '甜宠剧-副推' },
  { id: 'wx_a_8821003', name: '预约领券小程序', type: '微信小程序', project_count: 3, used: false, upgrade: false, url: 'weixin://dl/business/?t=aBcDeF03', note: '私域承接' },
  { id: 'by_g_8821004', name: '答题闯关小游戏', type: '字节小游戏', project_count: 8, used: false, upgrade: true, url: 'snssdk1128://dl/business/?t=tt8821004', note: 'IAA-小游戏' },
  { id: 'by_a_8821005', name: '线索留资小程序', type: '字节小程序', project_count: 6, used: true, upgrade: false, url: 'snssdk1128://dl/business/?t=tt8821005', note: '表单-主推' },
];

// 巨量商品库（新建资产组抽屉「选择已有商品ID」弹窗的数据源）
const productLibraries = [
  { platform_id: '8801001', name: '爆款短剧周边礼盒', type: '新版商品库' },
  { platform_id: '8801002', name: '会员月卡', type: '新版商品库' },
  { platform_id: '8801003', name: '线索留资-家居清洁套装', type: '旧版商品库' },
];

// 已有落地链接（新建资产组抽屉「选择已有链接」弹窗的数据源）
const miniLinks = [
  { url: 'weixin://dl/business/?t=aBcDeF01', name: '漫剧大作战-主链' },
  { url: 'weixin://dl/business/?t=aBcDeF02', name: '甜宠短剧-副链' },
  { url: 'snssdk1128://dl/business/?t=tt8821004', name: '答题闯关-字节' },
];

// 创量落地页模板（抽屉「创量落地页模板」下拉）
const siteTemplates = [
  { id: 'TPL001', name: '橙子模板-短剧落地页-01' },
  { id: 'TPL002', name: '橙子模板-线索表单-02' },
  { id: 'TPL003', name: '橙子模板-品牌官网-03' },
];

// 批量导入可引用的历史任务
const importTasks = [
  { id: 1, name: '2024-09-短剧推广链接-常读' },
  { id: 2, name: '2024-09-线索留资-常读' },
  { id: 3, name: '2024-08-电商商品-常读' },
];

const apps = [
  { id: 1, name: '番茄免费短剧', app_id: 'tt8821001', platform: '双端', version: '3.2.1', status: 'available', updated_at: fmt(now - 86400000 * 5) },
  { id: 2, name: '线索留资 APP', app_id: 'tt8821002', platform: 'Android', version: '1.8.0', status: 'available', updated_at: fmt(now - 86400000 * 2) },
];

const miniGames = [
  { id: 1, title: '字节小游戏-答题闯关', appid: 'tt8821001', mini_type: '字节小游戏', status: 'available', created_at: fmt(now - 86400000 * 4) },
  { id: 2, title: '微信小程序-预约领券', appid: 'wx8821002', mini_type: '微信小程序', status: 'reviewing', created_at: fmt(now - 86400000 * 1) },
];

const dramaLinks = [
  { id: 1, title: '《逆袭千金》推广链接', drama_id: 'D882101', url: 'https://drama.example.com/p/882101', status: 'available', created_at: fmt(now - 86400000 * 6) },
  { id: 2, title: '《豪门婚约》推广链接', drama_id: 'D882102', url: 'https://drama.example.com/p/882102', status: 'available', created_at: fmt(now - 86400000 * 2) },
];

const csjPackages = [
  { id: 1, name: '穿山甲-游戏媒体包', slot_type: '游戏类', size: '320,418', status: 'available', updated_at: fmt(now - 86400000 * 3) },
  { id: 2, name: '穿山甲-阅读媒体包', slot_type: '阅读类', size: '156,730', status: 'available', updated_at: fmt(now - 86400000 * 1) },
];

const interactiveMaterials = [
  { id: 1, title: '试玩互动-答题抽奖', material_type: '试玩素材', size: '2.4 MB', status: 'available', created_at: fmt(now - 86400000 * 5) },
  { id: 2, title: '直玩互动-捏脸换装', material_type: '直玩素材', size: '3.1 MB', status: 'reviewing', created_at: fmt(now - 86400000 * 2) },
];

const anchors = [
  { id: 1, title: '门店地址锚点-旗舰店', anchor_type: '门店锚点', status: 'available', created_at: fmt(now - 86400000 * 4) },
  { id: 2, title: '商品卡片锚点-礼盒', anchor_type: '商品锚点', status: 'available', created_at: fmt(now - 86400000 * 2) },
];

const albums = [
  { id: 1, title: '爆款短剧专辑-周一更新', album_id: 'A882101', author: '央广时代', status: 'available', updated_at: fmt(now - 86400000 * 3) },
  { id: 2, title: '甜宠合集专辑', album_id: 'A882102', author: '央广时代', status: 'available', updated_at: fmt(now - 86400000 * 1) },
];

// ---------- 多维报表 mock ----------
const projectReportRows = projects.map((p) => ({
  name: p.name, account_name: p.account_name, campaign_id: p.campaign_id, stat_cost: p.stat_cost,
  show_cnt: p.show_cnt, click_cnt: p.click_cnt, ctr: p.ctr, convert_cnt: p.convert_cnt, convert_cost: p.convert_cost,
}));

const adReportRows = ads.map((a) => ({
  name: a.name, account_name: a.account_name, ad_id: a.ad_id, stat_cost: a.stat_cost,
  show_cnt: a.show_cnt, click_cnt: a.click_cnt, ctr: a.ctr, convert_cnt: a.convert_cnt, convert_cost: a.convert_cost,
}));

const materialReportRows = ranking;

const componentReportRows = adComponents.map((c, i) => ({
  title: c.title, comp_type: c.comp_type, stat_cost: 620 - i * 180, show_cnt: 18000 - i * 5000,
  click_cnt: 920 - i * 260, convert_cnt: 64 - i * 18,
}));

// ---------- 首页看板（广告数据概览 / 项目分析 / 项目·媒体分布） ----------
// 口径：消耗=stat_cost，展示=show_cnt，点击=click_cnt，转化=convert_cnt；
// 千次展示均价(CPM)=消耗/展示*1000，转化成本=消耗/转化数，转化率=转化数/点击数。
const dashMediaList = [
  { key: 'gdt_upgrade', label: '腾讯广告3.0' },
  { key: 'toutiao_upgrade', label: '巨量广告' },
  { key: 'toutiao_oc', label: '巨量广告·智擎' },
];

// 各媒体当日基础量（三家合计 = 全部媒体口径）
const dashMediaBase = {
  gdt_upgrade: { cost: 23348.57, show: 3020412, click: 102163, convert: 51650 },
  toutiao_upgrade: { cost: 19807.92, show: 2571581, click: 86919, convert: 43931 },
  toutiao_oc: { cost: 0, show: 0, click: 0, convert: 0 },
};

// 环比 / 同时段环比（mock 固定值，正负号与箭头方向一致）
const dashCompare = {
  all: {
    cost: { mom: 31.96, same: 0.73 },
    show: { mom: 21.17, same: 29.5 },
    cpm: { mom: -13.65, same: -22.23 },
    convert: { mom: 30.0, same: 1.59 },
    convertCost: { mom: 2.17, same: 0.0 },
    rate: { mom: 1.52, same: 3.6 },
  },
  gdt_upgrade: {
    cost: { mom: 28.42, same: 1.16 },
    show: { mom: 18.63, same: 24.87 },
    cpm: { mom: -8.24, same: -15.32 },
    convert: { mom: 26.71, same: 0.88 },
    convertCost: { mom: 1.36, same: 0.28 },
    rate: { mom: 6.81, same: 2.35 },
  },
  toutiao_upgrade: {
    cost: { mom: 36.47, same: 0.21 },
    show: { mom: 24.35, same: 35.42 },
    cpm: { mom: -18.86, same: -28.74 },
    convert: { mom: 34.28, same: 2.41 },
    convertCost: { mom: 3.12, same: -0.44 },
    rate: { mom: -3.05, same: 5.12 },
  },
  toutiao_oc: {
    cost: { mom: 0, same: 0 },
    show: { mom: 0, same: 0 },
    cpm: { mom: 0, same: 0 },
    convert: { mom: 0, same: 0 },
    convertCost: { mom: 0, same: 0 },
    rate: { mom: 0, same: 0 },
  },
};

// 24 小时消耗曲线（对齐参考截图形态：夜间低谷、白天爬升、晚间高峰）
const dashHourly = {
  today: [800, 600, 550, 550, 650, 750, 1200, 1600, 2200, 4300, 4150, 3900, 3200, 2200, 2900, 4800, 4400, 900, 0, 0, 0, 0, 0, 0],
  yesterday: [450, 400, 350, 350, 450, 600, 850, 1200, 2000, 4400, 4100, 3900, 3300, 2950, 3700, 4000, 2600, 3700, 6600, 3300, 2500, 2500, 1900, 1400],
  dayBefore: [400, 380, 340, 330, 420, 560, 780, 1100, 1800, 3300, 3100, 2900, 2500, 2200, 2800, 3000, 2100, 2800, 5000, 2500, 1900, 1900, 1500, 1100],
};

// 近 7 天日粒度（确定性固定值，用于「近 7 天」周期）
const dashDaily7 = [61200, 38900, 52400, 47650, 43368, 57250, 43156.49];
const dashDaily7Prev = [54800, 46300, 39800, 52100, 58700, 44100, 50200];

// 项目分布（基线为「上周」口径，合计 466,864.82）
const dashProjectList = [
  { name: '未知项目', cost: 465140.44 },
  { name: '知乎小说', cost: 1723.40 },
  { name: 'soul', cost: 0.98 },
  { name: '百度文库', cost: 0 },
];

// 优化师分布（基线为「昨天」口径，合计 63,430.63）
const dashOptimizerList = [
  { key: 'wenhaotao', name: '文浩涛', cost: 48197.86 },
  { key: 'org', name: '北京央广时代文化传播有限公司', cost: 5090.55 },
  { key: 'jiangxin', name: 'jiangxin', cost: 3995.95 },
  { key: 'shenxuyang', name: '申旭阳', cost: 2644.04 },
  { key: 'liusonghan', name: '刘松涵', cost: 2577.22 },
  { key: 'yanghaomeng', name: '杨浩蒙', cost: 925.01 },
];

// 剪辑分布（基线为「昨天」口径，上新素材数量合计 144）
const dashEditorList = [
  { name: '吕瑶', new_material: 80, edit_material: 214, cost: 5320.15 },
  { name: '文清滨', new_material: 22, edit_material: 61, cost: 1487.20 },
  { name: '张浩', new_material: 17, edit_material: 48, cost: 1102.60 },
  { name: '王妍', new_material: 15, edit_material: 39, cost: 968.42 },
  { name: '倪芳云', new_material: 6, edit_material: 16, cost: 402.88 },
  { name: '其它', new_material: 4, edit_material: 11, cost: 258.30 },
];

const dashboard = {
  dashMediaList, dashMediaBase, dashCompare, dashHourly, dashDaily7, dashDaily7Prev,
  dashProjectList, dashOptimizerList, dashEditorList,
};

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const mockDb = {
  accounts, douyinAccounts, videos, images, titlePacks, landingPages, eventAssets, assets,
  tasks, taskItems, plans, reportRows, ranking, users,
  projects, ads, autoPlans, dramaRules,
  copywrites, deepLinks, adComponents, commentMgmt,
  audiencePackages, orientationPackages, monitorActivities,
  assetGroups, products, apps, miniGames, dramaLinks, csjPackages,
  interactiveMaterials, anchors, albums,
  miniComponents, productLibraries, miniLinks, siteTemplates, importTasks,
  projectReportRows, adReportRows, materialReportRows, componentReportRows,
  dashboard,
};

// 模拟接口：统一返回 { code: 0, message: 'ok', data }
export async function mockOk(data, ms = 120) {
  await delay(ms);
  return { code: 0, message: 'ok', data };
}

// ---------- 巨量官方枚举字典（对齐创建项目 / 创建营销文档） ----------
// 营销目的 landing_type
export const LANDING_TYPES = [
  { value: 'LINK', label: '销售线索投放' },
  { value: 'APP', label: '应用推广' },
  { value: 'SHOP', label: '电商（商品）' },
  { value: 'MICRO_GAME', label: '小程序/小游戏' },
  { value: 'NATIVE_ACTION', label: '内容营销' },
  { value: 'QUICK_APP', label: '快应用' },
  { value: 'DPA', label: '商品目录（DPA）' },
];

// 应用子目标 app_promotion_type（landing_type=APP）
export const APP_PROMOTION_TYPES = [
  { value: 'DOWNLOAD', label: '应用下载' },
  { value: 'LAUNCH', label: '应用调起' },
  { value: 'RESERVE', label: '预约下载' },
];

// 营销场景 marketing_goal
export const MARKETING_GOALS = [
  { value: 'VIDEO_AND_IMAGE', label: '短视频/图文' },
  { value: 'LIVE', label: '直播' },
];

// 营销类型 ad_type
export const AD_TYPES = [
  { value: 'ALL', label: '通投' },
  { value: 'SEARCH', label: '搜索' },
];

// 投放模式 delivery_mode
export const DELIVERY_MODES = [
  { value: 'MANUAL', label: '手动投放' },
  { value: 'PROCEDURAL', label: '自动投放（程序化）' },
];

// 落地页/载体资产类型 asset_type（LINK / SHOP / NATIVE_ACTION）
export const ASSET_TYPES = {
  LINK: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
    { value: 'ENTERPRISE', label: '企业号落地页' },
    { value: 'AWEME', label: '抖音主页' },
    { value: 'MICRO_APP', label: '字节小程序' },
    { value: 'WECHAT_APPLET', label: '微信小程序' },
  ],
  SHOP: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
    { value: 'MICRO_APP', label: '字节小程序' },
    { value: 'WECHAT_APPLET', label: '微信小程序' },
  ],
  NATIVE_ACTION: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
  ],
};

// 优化目标 external_action（按营销目的分组，实际应通过“获取可用优化目标”接口拉取，原型给常见项）
export const EXTERNAL_ACTIONS = {
  LINK: [
    { value: 'AD_CONVERT_TYPE_FORM', label: '表单提交' },
    { value: 'AD_CONVERT_TYPE_PHONE', label: '电话咨询' },
    { value: 'AD_CONVERT_TYPE_PHONE_CONNECT', label: '电话接通' },
    { value: 'AD_CONVERT_TYPE_MESSAGE_ACTION', label: '私信消息' },
    { value: 'AD_CONVERT_TYPE_MESSAGE_CLUE', label: '私信留资' },
  ],
  APP: [
    { value: 'AD_CONVERT_TYPE_ACTIVE', label: '激活' },
    { value: 'AD_CONVERT_TYPE_PAY', label: '付费' },
    { value: 'AD_CONVERT_TYPE_REGISTER', label: '注册' },
    { value: 'AD_CONVERT_TYPE_GAME_ADDICTION', label: '关键行为' },
  ],
  SHOP: [
    { value: 'AD_CONVERT_TYPE_APP_ORDER', label: 'APP 内下单' },
    { value: 'AD_CONVERT_TYPE_STAY_TIME', label: '店铺停留时长' },
  ],
  MICRO_GAME: [
    { value: 'AD_CONVERT_TYPE_ACTIVE', label: '激活' },
    { value: 'AD_CONVERT_TYPE_PAY', label: '付费' },
  ],
};

// 深度转化目标 deep_external_action
export const DEEP_ACTIONS = [
  { value: '', label: '不设置深度转化' },
  { value: 'AD_CONVERT_TYPE_PAY', label: '付费' },
  { value: 'AD_CONVERT_TYPE_LT_ROI', label: '变现 ROI' },
  { value: 'AD_CONVERT_TYPE_PHONE_CONNECT', label: '电话接通' },
  { value: 'AD_CONVERT_TYPE_RETENTION_DAYS', label: '留存天数' },
];

// 投放版位大类 inventory_catalog
export const INVENTORY_CATALOGS = [
  { value: 'MANUAL', label: '首选媒体' },
  { value: 'UNIVERSAL_SMART', label: '通投智选' },
];

// 投放位置 inventory_type
export const INVENTORY_TYPES = [
  { value: 'INVENTORY_FEED', label: '今日头条' },
  { value: 'INVENTORY_VIDEO_FEED', label: '西瓜视频' },
  { value: 'INVENTORY_AWEME_FEED', label: '抖音短视频' },
  { value: 'INVENTORY_TOMATO_NOVEL', label: '番茄小说' },
  { value: 'INVENTORY_UNION_SLOT', label: '穿山甲' },
  { value: 'UNION_BOUTIQUE_GAME', label: 'ohayoo 精品游戏' },
  { value: 'INVENTORY_SEARCH', label: '搜索' },
];

// 计费方式 pricing
export const PRICINGS = [
  { value: 'PRICING_OCPM', label: 'oCPM' },
  { value: 'PRICING_OCPC', label: 'oCPC' },
  { value: 'PRICING_CPM', label: 'CPM' },
  { value: 'PRICING_CPC', label: 'CPC' },
];

// 行动号召文案 call_to_action_buttons（2-6 字）
export const CTA_PRESETS = ['立即咨询', '立即领取', '免费试听', '立即下载', '查看详情', '马上体验', '立即报名', '领取方案'];

// 投放类型 delivery_type（搜索/托管场景）
export const DELIVERY_TYPES = [
  { value: 'NORMAL', label: '常规投放' },
  { value: 'DURATION', label: '极速智投（仅搜索）' },
  { value: 'UBX_INTELLIGENT', label: '智能托管（UBA）' },
];

// 小程序类型 micro_promotion_type（landing_type=MICRO_GAME）
export const MICRO_PROMOTION_TYPES = [
  { value: 'BYTE_GAME', label: '字节小游戏' },
  { value: 'BYTE_APP', label: '字节小程序' },
  { value: 'WECHAT_GAME', label: '微信小游戏' },
  { value: 'WECHAT_APP', label: '微信小程序' },
  { value: 'AWEME', label: '抖音号' },
];

// 应用下载方式 download_type（APP / DOWNLOAD）
export const DOWNLOAD_TYPES = [
  { value: 'DOWNLOAD_URL', label: '直接下载' },
  { value: 'EXTERNAL_URL', label: '落地页下载' },
];

// 应用调起方式 launch_type（APP / LAUNCH）
export const LAUNCH_TYPES = [
  { value: 'DIRECT_OPEN', label: '直接调起' },
  { value: 'EXTERNAL_OPEN', label: '落地页调起' },
];

// 深度优化方式 deep_bid_type
export const DEEP_BID_TYPES = [
  { value: 'NONE', label: '不设置深度优化' },
  { value: 'DEEP_BID_MIN', label: '最低成本（深度出价）' },
  { value: 'BID_PER_ACTION', label: '每次付费' },
  { value: 'ROI_COEFFICIENT', label: 'ROI 系数' },
  { value: 'DEEP_BID_TYPE_RETENTION_DAYS', label: '留存天数' },
];

// 视频素材 image_mode
export const VIDEO_MODES = [
  { value: 'CREATIVE_IMAGE_MODE_VIDEO', label: '横版视频' },
  { value: 'CREATIVE_IMAGE_MODE_VIDEO_VERTICAL', label: '竖版视频' },
];

// 图片素材 image_mode
export const IMAGE_MODES = [
  { value: 'CREATIVE_IMAGE_MODE_SMALL', label: '小图' },
  { value: 'CREATIVE_IMAGE_MODE_LARGE', label: '横版大图（穿山甲）' },
  { value: 'CREATIVE_IMAGE_MODE_LARGE_VERTICAL', label: '大图竖图' },
  { value: 'CREATIVE_IMAGE_MODE_UNION_SPLASH', label: '穿山甲开屏图片' },
];

// 性别
export const GENDERS = [
  { value: 'NONE', label: '不限' },
  { value: 'GENDER_FEMALE', label: '女' },
  { value: 'GENDER_MALE', label: '男' },
];

// 年龄区间
export const AGES = [
  { value: 'AGE_BETWEEN_18_23', label: '18-23 岁' },
  { value: 'AGE_BETWEEN_24_30', label: '24-30 岁' },
  { value: 'AGE_BETWEEN_31_40', label: '31-40 岁' },
  { value: 'AGE_BETWEEN_41_49', label: '41-49 岁' },
  { value: 'AGE_ABOVE_50', label: '50 岁以上' },
];

// 关键词匹配类型 match_type
export const MATCH_TYPES = [
  { value: 'PHRASE', label: '短语匹配' },
  { value: 'EXTENSIVE', label: '广泛匹配' },
  { value: 'PRECISION', label: '精准匹配' },
];

// 位置类型 location_type
export const LOCATION_TYPES = [
  { value: 'CURRENT', label: '正在该地区的用户' },
  { value: 'HOME', label: '居住在该地区的用户' },
  { value: 'TRAVEL', label: '到该地区旅行的用户' },
  { value: 'ALL', label: '该地区内的所有用户' },
];

// 过滤已转化用户 hide_if_converted
export const HIDE_CONVERTED = [
  { value: 'NO_EXCLUDE', label: '不限制' },
  { value: 'PROJECT', label: '过滤本项目已转化' },
  { value: 'ADVERTISER', label: '过滤本账户已转化' },
  { value: 'CUSTOMER', label: '过滤客户已转化' },
];

// 优选/穿山甲视频类型 union_video_type
export const UNION_VIDEO_TYPES = [
  { value: 'NONE', label: '不限' },
  { value: 'UNION_VIDEO_VERTICAL', label: '竖版视频' },
  { value: 'UNION_VIDEO_HORIZONTAL', label: '横版视频' },
];

// 行为兴趣定向模式 interest_action_mode
export const INTEREST_ACTION_MODES = [
  { value: 'NONE', label: '不限' },
  { value: 'INTEREST', label: '兴趣定向' },
  { value: 'ACTION', label: '行为定向' },
  { value: 'INTEREST_ACTION', label: '行为兴趣定向' },
];

// 行为天数 action_days
export const ACTION_DAYS = [
  { value: 'DAYS_7', label: '近 7 天' },
  { value: 'DAYS_15', label: '近 15 天' },
  { value: 'DAYS_30', label: '近 30 天' },
  { value: 'DAYS_60', label: '近 60 天' },
];

// 广告来源 source（单元层级）
export const AD_SOURCES = [
  { value: 'SOURCES_SELF', label: '本账户自有' },
  { value: 'SOURCES_PROMOTION', label: '合作推广' },
];

// 广告下载状态 ad_download_status
export const AD_DOWNLOAD_STATUS = [
  { value: 'DOWNLOAD_STATUS_ALLOW', label: '允许下载' },
  { value: 'DOWNLOAD_STATUS_FORBID', label: '禁止下载' },
];

// 原生互动授权抖音号类型 aweme_setting_type
export const AWEME_SETTING_TYPES = [
  { value: 'MANUAL', label: '手动选择授权号' },
  { value: 'AUTO', label: '自动绑定' },
];

// ===== 创量批量搭建 · 补充枚举（对齐创量搭建页表单） =====

// 推广目的 objective（value 对齐官方 landing_type 枚举）
export const OBJECTIVES = [
  { value: 'APP', label: '应用推广', img: '/assets/obj_1..png', desc: '推广您的线上APP' },
  { value: 'MICRO_GAME', label: '小程序', img: '/assets/obj_2..png', desc: '吸引更多用户进入小程序' },
  { value: 'SHOP', label: '电商', img: '/assets/obj_3..png', desc: '提升线上商品或店铺的推广效果' },
  { value: 'LINK', label: '销售线索', img: '/assets/obj_4..png', desc: '为您的生意销售收集用户线索' },
  { value: 'QUICK_APP', label: '快应用', img: '/assets/obj_5.png', desc: '吸引更多用户进入快应用' },
  { value: 'DPA', label: '商品', img: '/assets/obj_6.png', desc: '基于用户偏好给用户动态展示商品' },
  { value: 'NATIVE_ACTION', label: '内容营销', img: '/assets/obj_7.svg', desc: '提升投放视频或直播的互动、涨粉、种草效果' },
];

// 投放类型 delivery_type（创量口径）
export const AD_DELIVERY_TYPES = [
  { value: 'NORMAL', label: '常规投放' },
  { value: 'CYCLE_STABLE', label: '周期稳投' },
];

// 投放模式（补 UBMax）
export const DELIVERY_MODE_EXTRA = [
  { value: 'MANUAL', label: '手动投放' },
  { value: 'UBMAX', label: '自动投放(UBMax)' },
];

// 产品版本
export const PRODUCT_VERSIONS = [
  { value: 'UPGRADE', label: '升级版' },
  { value: 'GENERAL', label: '通用版' },
];

// 产品来源
export const PRODUCT_SOURCES = [
  { value: 'EXISTING', label: '选择已有' },
  { value: 'MANUAL', label: '手动填写' },
];

// 工作台版本
export const WORKBENCH_VERSIONS = [
  { value: 'OLD', label: '旧版工作台' },
  { value: 'NEW', label: '新版工作台' },
];

// 平台类型
export const PLATFORM_TYPES = [
  { value: 'APP_ANDROID', label: 'Android' },
  { value: 'APP_IOS', label: 'IOS' },
  { value: 'APP_HARMONY', label: '鸿蒙' },
];

// 监测链接来源
export const TRACK_LINK_SOURCES = [
  { value: 'EXIST', label: '巨量后台监测链接组' },
  { value: 'LOCATION', label: '创量导入监测活动' },
  { value: 'DYNAMIC', label: '动态选取监测活动' },
  { value: 'MANUAL', label: '手动输入' },
];

// 事件回传方式
export const EVENT_CALLBACK_TYPES = [
  { value: 'SDK', label: '应用SDK回传（巨量归因）' },
  { value: 'API', label: '应用API回传（融合归因）' },
];

// 定向包来源
export const TARGET_PACKAGE_SOURCES = [
  { value: 'ACCOUNT', label: '账户已有定向包' },
  { value: 'CL', label: '智投定向包' },
];

// 竞价策略
export const BID_STRATEGIES = [
  { value: 'STABLE_COST', label: '稳定成本-常规版', desc: '成本稳定在出价附近' },
  { value: 'MAX_CONVERT', label: '最大转化', desc: '花完预算，拿到最大转化（价值）' },
];

// 出价方式
export const BID_METHODS = [
  { value: 'FIXED', label: '固定出价' },
  { value: 'LADDER', label: '阶梯出价' },
  { value: 'RANDOM', label: '随机出价' },
];

// 配置模式（统一/分账户/分主体/分项目）
export const CONFIG_MODES = [
  { value: 'UNIFIED', label: '统一配置' },
  { value: 'PER_ACCOUNT', label: '分账户配置' },
  { value: 'PER_SUBJECT', label: '分主体配置' },
  { value: 'PER_PROJECT', label: '分项目配置' },
];

// 投放时间
export const SCHEDULE_TIMES = [
  { value: 'LONG_TERM', label: '从今天到长期投放' },
  { value: 'CUSTOM', label: '设置开始和结束日期' },
];

// 投放时段
export const SCHEDULE_PERIODS = [
  { value: 'ALL', label: '不限' },
  { value: 'CUSTOM', label: '指定时间段' },
];

// 分时投放：星期（列）
export const WEEK_DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

// 分时投放：小时（行），0-23
export const SCHEDULE_HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

// 多账户分配规则（素材/标题/抖音号通用）
export const ASSIGN_RULES = [
  { value: 'REUSE', label: '全账户复用', desc: '所有账户都使用一样的素材' },
  { value: 'AVERAGE', label: '平均分配', desc: '素材平均分到每个账户中' },
  { value: 'PER_ACCOUNT', label: '分账户选择', desc: '每个账户单独选择素材' },
];

// 抖音号来源
export const AWEME_SOURCES = [
  { value: 'MANUAL', label: '手动选择' },
  { value: 'FROM_CREATIVE', label: '从创意组匹配' },
];

// 原生锚点类型
export const ANCHOR_TYPES = [
  { value: 'OFF', label: '不启用' },
  { value: 'AUTO', label: '自动生成' },
  { value: 'EXISTING', label: '选择已有' },
  { value: 'TEMPLATE', label: '模板生成' },
];

// 素材类型
export const MATERIAL_TYPES = [
  { value: 'VIDEO', label: '视频' },
  { value: 'IMAGE', label: '图片' },
  { value: 'TEXT_IMAGE', label: '图文' },
];

// 视频上传至
export const UPLOAD_SCOPES = [
  { value: 'ADVERTISER', label: '广告主账户' },
  { value: 'ORG', label: '升级版工作台组织' },
];

// 主页可见
export const HOME_VISIBILITIES = [
  { value: 'ALWAYS', label: '主页始终可见' },
  { value: 'SINGLE', label: '仅单次展示可见' },
];

// 标题来源
export const TITLE_SOURCES = [
  { value: 'TITLE_PACK', label: '标题包' },
  { value: 'TITLE_LIB', label: '标题库' },
  { value: 'MATERIAL_NAME', label: '使用素材名称作为标题' },
];

// 落地页类型（落地页抽屉）
export const LANDING_PAGE_TYPES = [
  { value: 'ORANGE', label: '橙子建站' },
  { value: 'THIRDPARTY', label: '第三方链接' },
  { value: 'MICRO_APP', label: '小程序' },
  { value: 'DEEPLINK', label: '直达链接' },
];

// ================= 全链路对齐占位集合（结构对齐巨量开放平台返回，数据为本地 mock） =================

// 资质：主体资质 / 投放资质 / 推广产品资质
const subjectQuals = [
  { qualification_id: 'Q8801001', type: 'BUSINESS_LICENSE', status: 'CONFIRM', submit_time: fmt(now - 86400000 * 30), expire_time: '2027-11-13 00:00:00' },
];
const deliveryQuals = [
  { qualification_id: 'Q8802001', product_name: '小说阅读推广', status: 'CONFIRM', submit_time: fmt(now - 86400000 * 20) },
];
const productQuals = [
  { delivery_pkg_id: 'PKG8801', product_type: 'LINK', status: 'CONFIRM', industry: '网服-教育' },
];

// 资金流水 / 日流水 / 钱包 / 转账 / 汇款码
const fundTransactions = [
  { transaction_id: 'FT8801001', time: fmt(now - 3600000 * 5), amount: 5000.0, balance_after: 12860.5, type: 'RECHARGE', related_no: 'RM8801001' },
  { transaction_id: 'FT8801002', time: fmt(now - 3600000 * 20), amount: -1180.2, balance_after: 7860.5, type: 'CONSUME', related_no: '' },
];
const fundDailyStats = [
  { date: '2026-11-12', cost: 1180.2, balance: 12860.5 },
  { date: '2026-11-11', cost: 966.3, balance: 14040.7 },
];
const wallets = [
  { wallet_id: 'W8801', main_wallet: '央广时代主钱包', balance: 26800.0, adv_count: 5, relation: 'MAIN' },
];
const remittanceCodes = [
  { remittance_code: 'RC8801001', amount: 10000.0, status: 'PENDING', create_time: fmt(now - 3600000 * 3) },
];

// 代理商 / 工作台组织
const agents = [
  { agent_id: 'AG8801', name: '央广时代代理账户', level: 'DIRECT', adv_count: 5, sale: '渠道-王' },
];
const orgNodes = [
  { cc_account_id: 'ORG8801', name: '央广时代总部', level: 1, adv_count: 5, parent_id: '' },
];

// 建站：橙子站点 / 第三方落地页 / 程序化落地页组
const sites = [
  { site_id: 'SITE8801', name: '漫剧详情落地页', url: 'https://orange.oceanengine.com/site/88210001', status: 'ENABLED', page_type: 'ORANGE', created_at: fmt(now - 86400000 * 6) },
  { site_id: 'SITE8802', name: '表单收集页', url: 'https://orange.oceanengine.com/site/88210002', status: 'ENABLED', page_type: 'ORANGE', created_at: fmt(now - 86400000 * 2) },
];
const thirdSites = [
  { site_id: 'TS8801', name: '自研 H5 表单页', url: 'https://www.example.com/form/lead', status: 'ENABLED' },
];
const landingGroups = [
  { group_id: 'LG8801', name: '漫剧落地页组 A', site_count: 3, status: 'ENABLED' },
];

// 线索通组件：表单 / 智能电话 / 卡券 / 微信加粉
const clueForms = [
  { form_id: 'FM8801', name: '预约留资表单', submit_count: 1286, updated_at: fmt(now - 86400000 * 1) },
];
const smartPhones = [
  { phone_id: 'PH8801', name: '客服专线-网服一部', phone_number: '400-000-8801', call_count: 342 },
];
const coupons = [
  { coupon_id: 'CP8801', name: '新客领 10 元券', coupon_type: 'DIRECT_REDUCE', stock: 500, status: 'ENABLED' },
];
const wechatPool = [
  { instance_id: 'WX8801', nickname: '央广客服-01', qr_code: 'https://wechat.example.com/qr/8801', status: 'ENABLED' },
];

// 飞鱼线索
const clues = [
  {
    clue_id: 'CL8801001', avatar: '', nickname: '张先生', phone: '138****6621', gender: 'MALE', age: '30-34', city: '北京',
    convert_status: 'VALID', follow_status: 'FOLLOWING', owner: '刘松涵', source: 'FORM', clue_type: 'FORM',
    create_time: fmt(now - 3600000 * 4), ad_name: '1112_102201_01_免费领取行业方案', form_name: '预约留资表单',
    fields: [
      { field: 'name', label: '姓名', value: '张先生' },
      { field: 'phone', label: '手机号', value: '138****6621' },
      { field: 'demand', label: '需求', value: '企业官网搭建方案' },
    ],
  },
  {
    clue_id: 'CL8801002', avatar: '', nickname: '李女士', phone: '139****2207', gender: 'FEMALE', age: '25-29', city: '上海',
    convert_status: 'FOLLOWING', follow_status: 'PENDING', owner: '刘松涵', source: 'FORM', clue_type: 'FORM',
    create_time: fmt(now - 3600000 * 9), ad_name: '1112_102201_01_免费领取行业方案', form_name: '预约留资表单',
    fields: [
      { field: 'name', label: '姓名', value: '李女士' },
      { field: 'phone', label: '手机号', value: '139****2207' },
      { field: 'company', label: '公司', value: '示例科技' },
    ],
  },
];

// 事件管理：转化目标 / 监测链接 / 公钥
const convertGoals = [
  { convert_id: 'CV8801', name: '表单提交', external_action: 'AD_CONVERT_TYPE_FORM', deep_external_action: '', status: 'ENABLED' },
  { convert_id: 'CV8802', name: '付费', external_action: 'AD_CONVERT_TYPE_PAY', deep_external_action: 'AD_CONVERT_TYPE_PAY_ROI', status: 'ENABLED' },
];
const trackUrls = [
  { track_url_id: 'TU8801', name: '详情页监测链接', url: 'https://monitor.example.com/act/88210001', status: 'ACTIVE' },
];
const publicKeys = [
  { public_key_id: 'PK8801', public_key: '-----BEGIN PUBLIC KEY----- (mock)', status: 'ENABLED', create_time: fmt(now - 86400000 * 10) },
];

// 关键词 / 否定词
const keywords = [
  { word: '免费短剧', match_type: 'PHRASE', bid: 0.8, status: 'ENABLED' },
  { word: '爽文逆袭', match_type: 'EXACT', bid: 1.2, status: 'ENABLED' },
];
const negWords = [
  { word: '破解版', scope: 'PROMOTION', status: 'ENABLED' },
];

// DMP 人群包 / 数据源
const customAudiences = [
  { audience_id: 'AUD8801', name: '漫剧兴趣高活跃包', package_type: 'BEHAVIOR_INTEREST', size: 1204330, status: 'PUBLISHED', update_time: fmt(now - 86400000 * 3) },
  { audience_id: 'AUD8802', name: '已转化排除包', package_type: 'EXCLUDE', size: 86210, status: 'PUBLISHED', update_time: fmt(now - 86400000 * 1) },
];
const dataSources = [
  { source_id: 'DS8801', name: '历史成交客户回传', file_name: 'customers_202611.csv', rows: 5213, status: 'READY' },
];

// DPA 商品 / 分类 / 词包
const dpaProducts = [
  { product_id: 'P8801001', title: '爆款短剧周边礼盒', image_url: '', detail_url: 'https://shop.example.com/p/8801001', price: '59.00', stock: 320, sales_count: 1260, status: 'ON_SHELF', category_id: 'CAT8801', category_name: '礼品文创' },
  { product_id: 'P8801002', title: '会员月卡', image_url: '', detail_url: 'https://shop.example.com/p/8801002', price: '25.00', stock: 9999, sales_count: 3820, status: 'ON_SHELF', category_id: 'CAT8802', category_name: '虚拟商品' },
];
const dpaCategories = [
  { category_id: 'CAT8801', name: '礼品文创', level: 1 },
  { category_id: 'CAT8802', name: '虚拟商品', level: 1 },
];
const dpaDictWords = [
  { word_id: 'DW8801', word: '短剧周边' },
];

// 应用分包 / iOS 应用 / 小程序小游戏
const appExtends = [
  { package_id: 'EP8801', app_id: 'tt8821001', version: '3.2.1', status: 'RELEASED', update_time: fmt(now - 86400000 * 5) },
];
const iosApps = [
  { app_id: 'ios8821001', name: '番茄免费短剧', version: '3.2.0', status: 'RELEASED' },
];
const wechatApplets = [
  { applet_id: 'wx8821002', name: '预约领券小程序', status: 'ENABLED' },
];
const microApps = [
  { micro_app_id: 'tt8821002', name: '线索留资小程序', status: 'ENABLED' },
];

// 评论 / 屏蔽词 / 屏蔽抖音号
const commentDetail = [
  { comment_id: 'CM8801', item_id: 'v_8821001234', nickname: '追剧小能手', content: '这剧叫什么？在哪看？', like_count: 12, reply_count: 1, status: 'VISIBLE', create_time: fmt(now - 3600000 * 5) },
];
const bannedTerms = [
  { term_id: 'BT8801', word: '最', scope: 'PROMOTION', status: 'ENABLED' },
];
const bannedAwemes = [
  { aweme_id: 'dy8801', nickname: '竞品引流号', status: 'BANNED' },
];

// 调控任务 / 起量任务 / 诊断建议 / RTA 策略
const controlTasks = [
  { task_id: 'CT8801', task_type: 'MATERIAL_RAISE', name: '素材起量调控-01', status: 'RUNNING', remain_count: 12, cost_protect: 'ENABLED' },
  { task_id: 'CT8802', task_type: 'KEYWORD', name: '关键词调控-01', status: 'ENABLED', remain_count: 30, cost_protect: 'DISABLED' },
];
const raiseTasks = [
  { raise_id: 'RS8801', type: 'PROMOTION_RAISE', budget: 500.0, status: 'RAISING', start_time: fmt(now - 3600000 * 6) },
];
const diagnoses = [
  { object_id: '187910002221', object_name: '漫剧开场-竖版-01', level: 'WARN', suggestion: '素材点击率偏低，建议更换前 3 秒钩子', accept_status: 'PENDING' },
];
const rtaStrategies = [
  { strategy_id: 'RTA8801', name: '自建 RTA-成交回传', bind_scope: 'ACCOUNT', status: 'BOUND' },
];

// 异步报表任务 / 直播报表 / RTA 报表 / 星广联任务
const reportAsyncTasks = [
  { task_id: 'RPT8801', task_name: '11月账户明细导出', task_status: 'SUCCESS', create_time: fmt(now - 3600000 * 8), finish_time: fmt(now - 3600000 * 7) },
];
const liveReports = [
  { room_id: 'LR8801', room_name: '漫剧直播间-01', gmv: 12860.0, cost: 3260.4, roi: 3.94, online_cnt: 1204 },
];
const stardeliveryTasks = [
  { task_id: 'SD8801', task_name: '星广联投-漫剧达人合作', author_count: 6, status: 'DELIVERING' },
];

// 抖音号授权 / 操作日志 / 违规积分
const awemeAccounts = [
  { aweme_id: 'dy8821001', nickname: '央广官方号', avatar_url: '', auth_status: 'AUTHORIZED', share_status: 'SHARED' },
];
const auditLogs = [
  { log_id: 'LOG8801', operator: '杨浩蒙', action: 'UPDATE_BID', object: '187910002221', time: fmt(now - 3600000 * 2), ip: '10.8.0.12' },
];
const scoreViolations = [
  { event_id: 'SV8801', type: 'MATERIAL', score: 2, status: 'PENDING', occur_time: fmt(now - 86400000 * 2) },
];

// 创意（对齐 /creative/list/get/）：素材 / 标题 / 组件 / 锚点 / 行动号召 / 落地页 / 授权号
const creatives = [
  {
    creative_id: 'CR8801001', advertiser_id: accounts[0].advertiser_id, project_id: '187900000111', promotion_id: '187910002221',
    title: '1112_153012_01_漫剧开场-竖版-01', video_id: 'v_8821001234', video_cover_url: '', image_ids: [], title_pack_id: 'tp_301',
    component_ids: ['adComponents-1'], anchor_id: '', cta_text: '立即观看', landing_type: 'LINK', landing_page_url: 'https://orange.oceanengine.com/site/88210001',
    aweme_id: 'dy8821001', aweme_setting: 'MANUAL', material_mode: 'VIDEO', status: 'ENABLED', audit_status: 'AUDIT_PASS', reject_reason: '',
    show_cnt: 63400, click_cnt: 5280, stat_cost: 1180.2, convert_cnt: 176, created_at: fmt(now - 86400000 * 1.1),
  },
  {
    creative_id: 'CR8801002', advertiser_id: accounts[0].advertiser_id, project_id: '187900000111', promotion_id: '187910002222',
    title: '1112_153012_02_漫剧冲突点-竖版-02', video_id: 'v_8821001235', video_cover_url: '', image_ids: [], title_pack_id: 'tp_301',
    component_ids: [], anchor_id: 'anchors-2', cta_text: '了解详情', landing_type: 'LINK', landing_page_url: 'https://orange.oceanengine.com/site/88210001',
    aweme_id: 'dy8821001', aweme_setting: 'MANUAL', material_mode: 'VIDEO', status: 'ENABLED', audit_status: 'AUDIT_PASS', reject_reason: '',
    show_cnt: 51800, click_cnt: 4120, stat_cost: 966.3, convert_cnt: 142, created_at: fmt(now - 86400000 * 1.1),
  },
  {
    creative_id: 'CR8801003', advertiser_id: accounts[3].advertiser_id, project_id: '187900000207', promotion_id: '187910003310',
    title: '1112_102201_01_免费领取行业方案', video_id: '', video_cover_url: '', image_ids: ['i_8822001011'], title_pack_id: 'tp_302',
    component_ids: ['adComponents-1'], anchor_id: '', cta_text: '免费领取', landing_type: 'LINK', landing_page_url: 'https://www.example.com/form/lead',
    aweme_id: '', aweme_setting: 'AUTO', material_mode: 'IMAGE', status: 'DISABLED', audit_status: 'AUDIT_REJECT', reject_reason: '素材文案含极限词，建议修改后重新提交',
    show_cnt: 12100, click_cnt: 1710, stat_cost: 320.8, convert_cnt: 46, created_at: fmt(now - 86400000 * 0.8),
  },
  {
    creative_id: 'CR8801004', advertiser_id: accounts[4].advertiser_id, project_id: '187900000315', promotion_id: '187910004408',
    title: '1112_091005_01_小程序付费测试', video_id: 'v_8821001237', video_cover_url: '', image_ids: [], title_pack_id: 'tp_301',
    component_ids: [], anchor_id: '', cta_text: '立即体验', landing_type: 'MICRO_GAME', landing_page_url: 'snssdk1128://microapp/tt?appid=tt8821001',
    aweme_id: '', aweme_setting: 'AUTO', material_mode: 'VIDEO', status: 'ENABLED', audit_status: 'AUDIT_PASS', reject_reason: '',
    show_cnt: 60800, click_cnt: 3990, stat_cost: 1208.5, convert_cnt: 131, created_at: fmt(now - 86400000 * 0.3),
  },
];

// 呼叫话单（飞鱼呼叫中心）
const callLogs = [
  { call_id: 'CL8801001-C', clue_id: 'CL8801001', phone: '138****6621', call_time: fmt(now - 3600000 * 3), duration_sec: 86, call_status: 'CONNECTED', agent: '刘松涵', record_url: '' },
  { call_id: 'CL8801002-C', clue_id: 'CL8801002', phone: '139****2207', call_time: fmt(now - 3600000 * 8), duration_sec: 0, call_status: 'NO_ANSWER', agent: '刘松涵', record_url: '' },
];

// 智擎成本保障历史
const compensateHistory = [
  { record_id: 'CP8801', project_id: '187930000201', date: '2026-11-12', promised_cost: 35.0, actual_cost: 41.2, compensate_amount: 6.2, status: 'COMPENSATED' },
  { record_id: 'CP8802', project_id: '187930000201', date: '2026-11-11', promised_cost: 35.0, actual_cost: 33.8, compensate_amount: 0, status: 'NO_COMPENSATE' },
];

// RTA 报表
const rtaReportRows = [
  { strategy_id: 'RTA8801', strategy_name: '自建 RTA-成交回传', stat_cost: 2180.4, convert_cnt: 196, convert_cost: 11.12, rta_rate: 0.82, roi: 2.64 },
];

// 消息通知配置
const notifications = [
  { notify_id: 'NT8801', type: 'REJECT', title: '素材审核驳回提醒', content: '创意 CR8801003 审核未通过，请查看原因并修改', level: 'WARNING', status: 'UNREAD', create_time: fmt(now - 3600000 * 5) },
  { notify_id: 'NT8802', type: 'BUDGET', title: '预算不足提醒', content: '账户 1877112033882112 余额不足，建议及时充值', level: 'URGENT', status: 'READ', create_time: fmt(now - 3600000 * 20) },
];

// AB 实验
const abTests = [
  { test_id: 'AB8801', name: '漫剧前 3 秒钩子 AB 测试', control_ids: ['187910002221'], variant_ids: ['187910002222'], status: 'RUNNING', start_time: fmt(now - 86400000 * 2), end_time: '', sample_size: 120000 },
];

// 异常事件资产（回传中断 / 无数据）
const abnormalAssets = [
  { asset_id: 'EV8801', name: '线索-表单提交事件（备用）', issue_type: 'NO_CALLBACK', last_callback_time: fmt(now - 86400000 * 6), status: 'ABNORMAL' },
];

export const openapiDb = {
  subjectQuals, deliveryQuals, productQuals,
  fundTransactions, fundDailyStats, wallets, remittanceCodes,
  agents, orgNodes,
  sites, thirdSites, landingGroups,
  clueForms, smartPhones, coupons, wechatPool, clues,
  convertGoals, trackUrls, publicKeys,
  keywords, negWords, customAudiences, dataSources,
  dpaProducts, dpaCategories, dpaDictWords,
  appExtends, iosApps, wechatApplets, microApps,
  commentDetail, bannedTerms, bannedAwemes,
  controlTasks, raiseTasks, diagnoses, rtaStrategies,
  reportAsyncTasks, liveReports, stardeliveryTasks,
  awemeAccounts, auditLogs, scoreViolations,
  creatives, callLogs, compensateHistory, rtaReportRows, notifications, abTests, abnormalAssets,
};


