// 项目详情抽屉（对齐创量线上「项目详情」抽屉的字段与取值口径）。
// 线上抽屉为左右两栏布局：
//   左栏：营销目标与场景 / 关联产品投放 / 投放内容与目标 / 受众倾向与过滤
//   右栏：排期与预算 / 投放版位 / 搜索快投 / 监测链接 / 直达链接
// 顶部另有「基础信息」通栏（仅提供「查看项目下广告」入口）与项目摘要行。
import dayjs from 'dayjs';

// 受众区域（线上为全国省级行政区）
export const DETAIL_REGIONS = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
];

// 年龄区间（线上口径）
export const DETAIL_AGES = ['18-19岁', '20-23岁', '24-30岁', '31-35岁', '36-40岁', '41-45岁'];

// 投放位置（线上口径）
export const DETAIL_INVENTORY = ['今日头条', '西瓜视频', '抖音', '番茄小说'];

// 竞价策略（线上口径）
export const DETAIL_BID_STRATEGY = '稳定成本（常规版）';

// 应用（投放内容与目标）
const APPS = [
  { name: '知乎', pkg: 'com.zhihu.android', url: 'https://apps.bytesfield.com/download/basic/curl/832e4c2b' },
  { name: '快手', pkg: 'com.smile.gifmaker', url: 'https://apps.bytesfield.com/download/basic/curl/8f31ab90' },
  { name: '番茄免费短剧', pkg: 'com.dragon.read', url: 'https://apps.bytesfield.com/download/basic/curl/5d20c7fe' },
];

// 优化目标：本地项目列表的「优化目标」枚举 → 线上详情口径
const OPT_GOAL_MAP = {
  点击量: '落地页点击',
  展示量: '首页浏览',
  电话拨打: '电话拨打',
  表单提交: '表单提交',
  地图搜索: '地图搜索',
  下载完成: '激活',
  按钮跳转: 'app内付费',
  无: 'app内付费',
};

// 广告类型：本地枚举 → 线上详情口径
const AD_TYPE_MAP = {
  通用广告: '通投广告',
  搜索广告: '搜索广告',
};

// 平台：本地枚举 → 线上详情口径（线上为全大写）
const PLATFORM_MAP = { Android: 'ANDROID', IOS: 'IOS', 鸿蒙: 'HARMONY' };

// 伪随机（固定公式，保证同一项目每次打开取值一致）
const pseudo = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const dash = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

/**
 * 根据项目列表行生成项目详情（抽屉）数据。
 * @param {object} row 项目列表行
 */
export function buildProjectDetail(row) {
  const r = row || {};
  const seed = Number(r.id) || 1;
  const rnd = (k) => pseudo(seed * 31 + k);
  const app = APPS[Math.floor(rnd(1) * APPS.length)];
  const enabled = r.status === 'enabled';

  // 投放时间：线上为「从今天起长期投放（开始 ~ 结束）」
  const start = r.created_at ? dayjs(r.created_at) : dayjs();
  const end = start.add(10, 'year');
  const schedule = `从今天起长期投放（${start.format('YYYY-MM-DD HH:mm:ss')}~${end.format('YYYY-MM-DD HH:mm:ss')}）`;

  const productId = `179144707${String(Math.floor(rnd(2) * 900000000) + 100000000)}`;
  const eventAssetId = `187893607${String(Math.floor(rnd(3) * 9000000) + 1000000)}`;
  const trackGroupId = `187893607${String(Math.floor(rnd(4) * 9000000) + 1000000)}`;
  const trackUrl = `https://open-zhihu.com/api/channel/unified_tracking?track=${trackGroupId}&url=${encodeURIComponent('https://www.zhihu.com/')}`;

  const deepGoal = r.deep_goal && r.deep_goal !== '无' ? r.deep_goal : '无';
  const deepMode = r.deep_mode && r.deep_mode !== '无' ? r.deep_mode : '无';

  return {
    name: r.name || '未命名项目',
    campaign_id: r.campaign_id || '-',
    enabled,
    stateText: enabled ? '启用中' : '已暂停',
    budget: dash(r.budget),
    bid: r.bid ? r.bid : '-',
    deepBid: r.deep_bid ? r.deep_bid : '-',
    roi: '-',
    accountName: r.account_name || '-',

    left: [
      {
        title: '营销目标与场景',
        rows: [
          { label: '推广目标', value: r.purpose === '应用推广' ? '应用推广/应用调起' : (r.purpose || '应用推广') },
          { label: '广告类型', value: AD_TYPE_MAP[r.ad_type] || '通投广告' },
          { label: '投放类型', value: '常智投放' },
          { label: '投放模式', value: r.delivery_mode || '手动投放' },
          { label: '营销场景', value: '短视频/图片' },
        ],
      },
      {
        title: '关联产品投放',
        rows: [
          { label: '关联产品ID', value: productId },
        ],
      },
      {
        title: '投放内容与目标',
        rows: [
          { label: '关联广告投放任务', value: '-' },
          { label: '应用名', value: app.name },
          { label: '应用包名', value: app.pkg },
          { label: '下载方式', value: '直接下载' },
          { label: '调起方式', value: '直接调起' },
          { label: '优先应用商店下载', value: '默认下载' },
          { label: '下载链接', value: app.url, link: true },
          { label: '优化目标', value: OPT_GOAL_MAP[r.opt_goal] || 'app内付费' },
          { label: '深度优化目标', value: deepGoal },
          { label: '深度优化方式', value: deepMode },
          { label: '投放内容', value: '-' },
          { label: '事件资产ID', value: eventAssetId },
          { label: '备用资产ID', value: '-' },
        ],
      },
      {
        title: '受众倾向与过滤',
        rows: [
          { label: '区域', value: DETAIL_REGIONS.join('、') },
          { label: '性别', value: '女' },
          { label: '年龄', value: DETAIL_AGES.join('、') },
          { label: '媒体定向', value: '不限' },
          { label: '平台', value: PLATFORM_MAP[r.platform] || 'ANDROID' },
          { label: '设备类型', value: '不限' },
          { label: '网络', value: '不限' },
          { label: '运营商', value: '不限' },
          { label: '手机品牌', value: '不限' },
          { label: '手机价格', value: '不限' },
          { label: '手机厂商', value: '不限' },
          { label: '手机型号', value: '不限' },
        ],
      },
    ],

    right: [
      {
        title: '排期与预算',
        rows: [
          { label: '竞价策略', value: DETAIL_BID_STRATEGY },
          { label: '投放时间', value: schedule },
          { label: '项目预算', value: `日预算（${dash(r.budget)}元）` },
          { label: '项目ROI', value: '-' },
          { label: '项目出价', value: r.bid ? r.bid : '-' },
          { label: '深度优化出价', value: r.deep_bid ? r.deep_bid : '-' },
        ],
      },
      {
        title: '投放版位',
        rows: [
          { label: '投放位置', value: DETAIL_INVENTORY.join('、') },
        ],
      },
      {
        title: '搜索快投',
        rows: [
          { label: '关键词', value: '-' },
          { label: '出价系数', value: '1' },
          { label: '定向拓展', value: '不启用' },
        ],
      },
      {
        title: '监测链接',
        rows: [
          { label: '监测链接组', value: trackGroupId },
          { label: '展示', value: '-' },
          { label: '有效触点', value: trackUrl, link: true },
          { label: '视频播放', value: '-' },
          { label: '视频播完', value: '-' },
          { label: '视频有效播放', value: '-' },
        ],
      },
      {
        title: '直达链接',
        rows: [
          { label: '直达链接', value: '-' },
          { label: '直达备用链接', value: '-' },
        ],
      },
    ],
  };
}
