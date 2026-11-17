// 原型模式：所有接口在前端本地模拟，不发起真实后端请求。
// 返回结构与后端一致：{ code: 0, message, data }。
import dayjs from 'dayjs';
import { mockOk, mockDb } from '../mock/data';

const clone = (v) => JSON.parse(JSON.stringify(v));

// 巨量账户授权域（原型模拟）
export const mediaApi = {
  async startAuth() {
    // 原型：不跳转真实 OAuth，返回模拟授权链接占位
    return mockOk({ auth_url: '#', state: 'mock-state-0001' });
  },
  async accounts() {
    return mockOk({ list: clone(mockDb.accounts), total: mockDb.accounts.length });
  },
  async douyinAccounts() {
    return mockOk({ list: clone(mockDb.douyinAccounts), total: mockDb.douyinAccounts.length });
  },
  async bind(payload) {
    return mockOk({ ok: true, account: payload });
  },
  async unbind(id) {
    return mockOk({ ok: true, id });
  },
};

// 素材资产域
export const assetApi = {
  async list(params = {}) {
    let list = clone(mockDb.assets);
    if (params.type) list = list.filter((a) => a.type === params.type);
    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    return mockOk({ list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length });
  },
  async upload(formData) {
    return mockOk({ id: Date.now(), type: formData.get('type'), title: formData.get('title') || '未命名素材' });
  },
  async register(payload) {
    return mockOk({ id: Date.now(), ...payload });
  },
  async remove(id) {
    return mockOk({ ok: true, id });
  },
  // 素材/资产分类清单：kind 对应不同 mock 集合
  async byKind(kind) {
    const map = {
      copywrite: mockDb.copywrites,
      deep_link: mockDb.deepLinks,
      component: mockDb.adComponents,
      comment: mockDb.commentMgmt,
      audience: mockDb.audiencePackages,
      orientation: mockDb.orientationPackages,
      monitor: mockDb.monitorActivities,
      event: mockDb.eventAssets,
      landing_page: mockDb.landingPages,
      asset_group: mockDb.assetGroups,
      product: mockDb.products,
      app: mockDb.apps,
      mini_game: mockDb.miniGames,
      drama_link: mockDb.dramaLinks,
      csj_package: mockDb.csjPackages,
      interactive: mockDb.interactiveMaterials,
      anchor: mockDb.anchors,
      album: mockDb.albums,
    };
    return mockOk({ list: clone(map[kind] || []) });
  },
};

// 批量搭建域
export const buildApi = {
  async preview(plan) {
    // 本地模拟组合预览：按视频 × 图片 × 标题包笛卡尔估算条数
    const videos = plan.ad?.video_ids || [];
    const images = plan.ad?.image_ids || [];
    const titles = plan.ad?.title_packs || [];
    const accounts = plan.account_ids || [];
    const combos = Math.max(1, videos.length || 1) * Math.max(1, images.length || 1) * Math.max(1, titles.length || 1);
    const total = combos * Math.max(1, accounts.length);
    const precheck = [
      { level: 'ok', item: '授权', message: '所选账户在原型中均视为已授权' },
      { level: accounts.length ? 'ok' : 'error', item: '账户', message: accounts.length ? `已选 ${accounts.length} 个账户` : '未选择账户' },
      { level: videos.length || images.length ? 'ok' : 'error', item: '创意素材', message: (videos.length ? `视频 ${videos.length} 个` : '') + (images.length ? `图片 ${images.length} 个` : '') || '未选择素材' },
      { level: titles.length ? 'ok' : 'error', item: '标题包', message: titles.length ? `已选 ${titles.length} 个标题包` : '未选择标题包' },
      { level: 'ok', item: '预算出价', message: '原型预检通过，未连接真实账户校验' },
    ];
    const combinations = Array.from({ length: Math.min(total, 20) }, (_, i) => ({
      name: `${plan.ad?.name_template || '{date}_{title}'}`.replace('{date}', '1112').replace('{time}', '1200').replace('{index}', `${i + 1}`),
    }));
    return mockOk({ total, truncated: total > 5000, warnings: [], precheck, combinations });
  },
  async submit(payload) {
    const total = payload?.plan ? (payload.plan.account_ids?.length || 1) * 12 : 12;
    return mockOk({ task_id: Date.now(), task_no: `BT${Date.now()}`, total, succeeded: 0, failed: 0, status: 'QUEUED' });
  },
  async tasks(params = {}) {
    let list = clone(mockDb.tasks);
    if (params.status) list = list.filter((t) => t.status === params.status);
    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    return mockOk({ list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length });
  },
  async taskDetail(id) {
    return mockOk({ items: clone(mockDb.taskItems[id] || []) });
  },
  async cancelTask(id) {
    return mockOk({ ok: true, id });
  },
  async retryItem(id) {
    return mockOk({ ok: true, id });
  },
  async templates() {
    return mockOk({ list: [] });
  },
  async saveTemplate(payload) {
    return mockOk({ id: Date.now(), ...payload });
  },
  async templateDetail(id) {
    return mockOk({ id, content: {} });
  },
  async plans(params = {}) {
    let list = clone(mockDb.plans);
    if (params.status) list = list.filter((p) => p.status === params.status);
    return mockOk({ list, total: list.length });
  },
  async projects(params = {}) {
    let list = clone(mockDb.projects);
    if (params.status) list = list.filter((p) => p.status === params.status);
    if (params.media) list = list.filter((p) => (p.media || 'upgrade') === params.media);
    return mockOk({ list, total: list.length });
  },
  async ads(params = {}) {
    let list = clone(mockDb.ads);
    if (params.status) list = list.filter((a) => a.status === params.status);
    return mockOk({ list, total: list.length });
  },
};

// 托管方案域（原型模拟）
export const autoApi = {
  async list(params = {}) {
    let list = clone(mockDb.autoPlans);
    if (params.status) list = list.filter((a) => a.status === params.status);
    return mockOk({ list, total: list.length });
  },
  async save(payload) {
    return mockOk({ id: Date.now(), ...payload });
  },
};

// 铺剧助手域（原型模拟）
export const dramaApi = {
  async list(params = {}) {
    let list = clone(mockDb.dramaRules);
    if (params.status) list = list.filter((d) => d.status === params.status);
    return mockOk({ list, total: list.length });
  },
  async saveRule(payload) {
    return mockOk({ id: Date.now(), ...payload });
  },
};

// 运营域
export const operationApi = {
  async batchStatus(payload) {
    return mockOk({ succeeded: payload.plan_ids || [], failed: [] });
  },
  async quota(params = {}) {
    return mockOk({
      advertiser_id: params.account_id || mockDb.accounts[0].advertiser_id,
      used_quota: 128,
      sum_quota: 500,
      max_cost: 200000,
      in_learning: true,
    });
  },
};

// 用户域（原型模拟）
export const userApi = {
  async list(params = {}) {
    const page = params.page || 1;
    const pageSize = params.page_size || 10;
    const list = clone(mockDb.users);
    return mockOk({ list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length });
  },
  async create(payload) {
    return mockOk({ id: Date.now(), ...payload });
  },
};

// 报表域
export const reportApi = {  async accountSummary() {
    const rows = clone(mockDb.reportRows);
    const totals = rows.reduce(
      (acc, r) => ({
        stat_cost: +(acc.stat_cost + r.stat_cost).toFixed(2),
        show_cnt: acc.show_cnt + r.show_cnt,
        click_cnt: acc.click_cnt + r.click_cnt,
        convert_cnt: acc.convert_cnt + r.convert_cnt,
      }),
      { stat_cost: 0, show_cnt: 0, click_cnt: 0, convert_cnt: 0 }
    );
    return mockOk({ rows, totals });
  },
  async materialRanking() {
    return mockOk({ rows: clone(mockDb.ranking) });
  },
  async dimensionReport(dim) {
    const map = {
      project: mockDb.projectReportRows,
      ad: mockDb.adReportRows,
      material: mockDb.materialReportRows,
      component: mockDb.componentReportRows,
    };
    const rows = clone(map[dim] || mockDb.reportRows);
    const totals = rows.reduce(
      (acc, r) => ({
        stat_cost: +(acc.stat_cost + (r.stat_cost || 0)).toFixed(2),
        show_cnt: acc.show_cnt + (r.show_cnt || 0),
        click_cnt: acc.click_cnt + (r.click_cnt || 0),
        convert_cnt: acc.convert_cnt + (r.convert_cnt || 0),
      }),
      { stat_cost: 0, show_cnt: 0, click_cnt: 0, convert_cnt: 0 }
    );
    return mockOk({ rows, totals });
  },
  async createAsyncTask(payload) {
    return mockOk({ task_id: `RPT${Date.now()}`, task_status: 'CREATED', task_name: payload.task_name });
  },
  async pollAsyncTask() {
    return mockOk({ task_status: 'SUCCESS', rows: clone(mockDb.reportRows) });
  },
  async snapshots() {
    return mockOk({ list: [] });
  },
};

// ---------- 首页看板域（原型模拟） ----------
const { dashMediaList, dashMediaBase, dashCompare, dashHourly, dashDaily7, dashDaily7Prev, dashProjectList, dashOptimizerList, dashEditorList } = mockDb.dashboard;

// 看板指标定义：good 表示「上涨为正向」，用于环比箭头的着色
const DASH_METRICS = [
  { key: 'cost', label: '消耗(元)', short: '消耗', digits: 2, good: 'up', tone: 'green' },
  { key: 'show', label: '展示数', short: '展示数', digits: 0, good: 'up', tone: 'cream' },
  { key: 'cpm', label: '千次展示均价(CPM)(元)', short: 'CPM', digits: 2, good: 'down', tone: 'blue' },
  { key: 'convert', label: '转化数', short: '转化数', digits: 0, good: 'up', tone: 'blue' },
  { key: 'convertCost', label: '转化成本(元)', short: '转化成本', digits: 2, good: 'down', tone: 'blue' },
  { key: 'rate', label: '转化率', short: '转化率', digits: 2, good: 'up', tone: 'blue', suffix: '%' },
];

const DASH_ALL_COST = dashMediaList.reduce((s, m) => s + dashMediaBase[m.key].cost, 0);
// 配色与参考系统一致：蓝 / 绿 / 黄 / 红 / 紫 / 青
const DASH_COLORS = ['#6098FC', '#4BCB76', '#F2D84A', '#ED6D7D', '#A157E1', '#6DEFD8'];

function dashBaseOf(media) {
  if (!media || media === 'all') {
    return dashMediaList.reduce(
      (acc, m) => {
        const b = dashMediaBase[m.key];
        acc.cost += b.cost; acc.show += b.show; acc.click += b.click; acc.convert += b.convert;
        return acc;
      },
      { cost: 0, show: 0, click: 0, convert: 0 }
    );
  }
  return dashMediaBase[media] || { cost: 0, show: 0, click: 0, convert: 0 };
}

function dashMetricsOf(base) {
  const { cost, show, click, convert } = base;
  return {
    cost: +cost.toFixed(2),
    show,
    cpm: show ? +(cost / show * 1000).toFixed(2) : 0,
    convert,
    convertCost: convert ? +(cost / convert).toFixed(2) : 0,
    rate: click ? +(convert / click * 100).toFixed(2) : 0,
  };
}

// 等比缩放到目标合计（保证曲线合计与概览口径一致）
function dashScaleTo(values, total) {
  const sum = values.reduce((s, v) => s + v, 0);
  if (!sum) return values.map(() => 0);
  const k = total / sum;
  return values.map((v) => +(v * k).toFixed(2));
}

function dashHourLabels(dateStr) {
  return Array.from({ length: 24 }, (_, h) => `${dateStr} ${String(h).padStart(2, '0')}:00:00`);
}

function dashRangeLabel(dateStr) {
  return `${dateStr} 00:00:00 ~ 23:00:00`;
}

function dashPeriods(date) {
  if (date === 'yesterday') return { cur: 'yesterday', prev: 'dayBefore', hourly: true };
  if (date === 'last7') return { cur: 'last7', prev: 'last7prev', hourly: false };
  return { cur: 'today', prev: 'yesterday', hourly: true };
}

function dashSeriesValues(key, mediaFactor, metricFactor) {
  let raw = [];
  if (key === 'today') raw = dashScaleTo(dashHourly.today, DASH_ALL_COST);
  else if (key === 'yesterday') raw = dashHourly.yesterday;
  else if (key === 'dayBefore') raw = dashHourly.dayBefore;
  else if (key === 'last7') raw = dashDaily7;
  else if (key === 'last7prev') raw = dashDaily7Prev;
  return raw.map((v) => +(v * mediaFactor * metricFactor).toFixed(2));
}

function dashProjectFactor(projectId) {
  if (!projectId || projectId === 'all') return 1;
  const p = mockDb.projects.find((x) => String(x.id) === String(projectId));
  if (!p) return 1;
  const total = mockDb.projects
    .filter((x) => !x.media)
    .reduce((s, x) => s + (x.stat_cost || 0), 0);
  return total ? (p.stat_cost || 0) / total : 1;
}

// 指标换算系数：把消耗口径折算成展示数 / 转化数等
function dashMetricRatio(metric) {
  const m = dashMetricsOf(dashBaseOf('all'));
  if (!metric || metric === 'cost' || !m.cost) return 1;
  return m[metric] / m.cost;
}

// 项目分布周期系数：以「上周」（7 天）为基线，按各周期覆盖天数折算
function dashProjectPeriodFactor(date) {
  return dashPeriodDays(date) / 7;
}

// 各周期覆盖的天数（分布类卡片按周期折算用）
function dashPeriodDays(date) {
  const now = dayjs();
  if (date === 'past7') return 7;
  if (date === 'past30') return 30;
  if (date === 'thisWeek') return now.day() === 0 ? 7 : now.day();
  if (date === 'thisMonth') return now.date();
  if (date === 'lastMonth') return now.subtract(1, 'month').daysInMonth();
  if (date === 'lastWeek') return 7;
  return 1; // 今天 / 昨天
}

// 金额保留 2 位小数，计数类指标取整
function dashDigits(metric) {
  return metric === 'cost' ? 2 : 0;
}

function dashDist(items, metricKey) {
  const total = items.reduce((s, it) => s + it.value, 0);
  const digits = dashDigits(metricKey);
  return {
    total: +total.toFixed(digits),
    digits,
    items: items.map((it, i) => ({
      ...it,
      color: DASH_COLORS[i % DASH_COLORS.length],
      pct: total ? (it.value / total) * 100 : 0,
    })),
  };
}

export const dashboardApi = {
  // 看板整体数据（概览 + 趋势 + 项目分布 + 媒体分布）
  async load(params = {}) {
    const { media = 'all', date = 'today', metric = 'cost', project = 'all', projectDate = 'lastWeek', mediaDate = 'today' } = params;
    const base = dashBaseOf(media);
    const m = dashMetricsOf(base);
    const cmp = dashCompare[media] || dashCompare.all;

    // 概览指标（含环比 / 同时段环比，mock 固定值）
    const overview = DASH_METRICS.map((def) => ({
      ...def,
      value: m[def.key],
      mom: cmp[def.key].mom,
      same: cmp[def.key].same,
    }));

    // 趋势：本期 vs 上期
    const p = dashPeriods(date);
    const today = dayjs();
    const curDate = date === 'yesterday' ? today.subtract(1, 'day') : today;
    const prevDate = date === 'yesterday' ? today.subtract(2, 'day') : today.subtract(1, 'day');
    const mediaFactor = media === 'all' || !dashMediaBase[media] ? 1 : dashMediaBase[media].cost / DASH_ALL_COST;
    const metricFactor = metric === 'cost' || !m.cost ? 1 : m[metric] / m.cost;
    const projectFactor = dashProjectFactor(project);

    let curLabels = [];
    let prevLabels = [];
    let curName = '';
    let prevName = '';
    if (p.hourly) {
      curLabels = dashHourLabels(curDate.format('YYYY-MM-DD'));
      prevLabels = dashHourLabels(prevDate.format('YYYY-MM-DD'));
      curName = dashRangeLabel(curDate.format('YYYY-MM-DD'));
      prevName = dashRangeLabel(prevDate.format('YYYY-MM-DD'));
    } else {
      curLabels = Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, 'day').format('MM-DD'));
      prevLabels = Array.from({ length: 7 }, (_, i) => today.subtract(13 - i, 'day').format('MM-DD'));
      curName = `${today.subtract(6, 'day').format('YYYY-MM-DD')} ~ ${today.format('YYYY-MM-DD')}`;
      prevName = `${today.subtract(13, 'day').format('YYYY-MM-DD')} ~ ${today.subtract(7, 'day').format('YYYY-MM-DD')}`;
    }

    const curData = dashSeriesValues(p.cur, mediaFactor * projectFactor, metricFactor);
    const prevData = dashSeriesValues(p.prev, mediaFactor * projectFactor, metricFactor);
    const trendMax = Math.max(...curData, ...prevData, 0);

    // 项目分布（mock 项目口径：未知项目 / 知乎小说 / soul / 百度文库）
    const projectDistFactor = dashProjectPeriodFactor(projectDate) * dashMetricRatio(metric);
    const projectDist = dashDist(
      dashProjectList.map((p2) => ({
        name: p2.name,
        value: +(p2.cost * projectDistFactor).toFixed(2),
      })),
      metric
    );

    // 媒体分布（按媒体拆分该指标，基线为「今天」口径，按周期天数折算）
    const mediaPeriod = dashPeriodDays(mediaDate);
    const mediaDist = dashDist(
      dashMediaList.map((mm) => ({
        name: mm.label,
        value: +((dashMetricsOf(dashMediaBase[mm.key] || {})[metric] || 0) * mediaPeriod).toFixed(2),
      })),
      metric
    );

    return mockOk({
      overview,
      trend: {
        curLabels,
        prevLabels,
        curName,
        prevName,
        max: trendMax,
        metric,
        series: [
          { key: 'prev', name: prevName, data: prevData },
          { key: 'cur', name: curName, data: curData },
        ],
      },
      projectDist,
      mediaDist,
      mediaOptions: [{ key: 'all', label: '全部媒体' }, ...dashMediaList],
      projectOptions: [
        { key: 'all', label: '全部项目' },
        ...mockDb.projects.filter((p2) => !p2.media).map((p2) => ({ key: String(p2.id), label: p2.name })),
      ],
      metricOptions: DASH_METRICS.map((d) => ({ key: d.key, label: d.short || d.label })),
    });
  },

  // 分布类看板（优化师 / 剪辑）：type=optimizer|editor
  async distribution(params = {}) {
    const { type = 'optimizer', metric = 'cost', date = 'yesterday' } = params;
    // 基线均为「昨天」（1 天）口径，按所选周期覆盖天数折算
    const period = dashPeriodDays(date);
    if (type === 'editor') {
      const items = dashEditorList.map((it) => ({
        name: it.name,
        value: +(it[metric] * period).toFixed(2),
      }));
      return mockOk(dashDist(items, metric));
    }
    const ratio = dashMetricRatio(metric);
    const items = dashOptimizerList.map((o) => ({
      name: o.name,
      value: +(o.cost * period * ratio).toFixed(2),
    }));
    return mockOk(dashDist(items, metric));
  },
};

