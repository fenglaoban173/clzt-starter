// 资产页注册表 —— 逐页对齐「创量标准版 → 资产」菜单下各页的：
//   ① 查询条件（线上 form.filter-search-input）
//   ② 功能按钮（线上 .table-toolbar）
//   ③ 列表布局（线上 table.el-table__header 的列序 / 固定列 / 列宽 / 分页）
// 采集方式：创量标准版线上页 DOM 快照逐页登记，本地按登记结果渲染。
// 字段说明：
//   filters[]  { type:'select'|'search', key, label, placeholder, multiple, options[] }
//   buttons[]  { text, type, action }            —— 工具栏主按钮
//   batch      { label, options[] }              —— 工具栏右侧「批量操作」下拉
//   columns[]  { label, prop, width, fixed, type, action } —— 列表列（fixed 为固定左列）
//   rowActions[]{ text, action }                 —— 行内「操作」列的按钮
import { assetApi, mediaApi } from '@/api/media';
import {
  targetApi, siteApi, eventApi, productApi, toolApi, appApi, assetExtApi,
} from '@/api/openapi';

/** 媒体账户下拉：线上格式「账户名称  (广告主ID)」，下拉末尾带「搜索更多(N)…」 */
export async function loadAccountOptions() {
  const res = await mediaApi.accounts();
  return (res.data?.list || []).map((a) => `${a.name}  (${a.advertiser_id})`);
}

/** 媒体账户原始对象列表（抽屉「媒体账户」下拉需要 value=advertiser_id） */
export async function loadAccounts() {
  const res = await mediaApi.accounts();
  return res.data?.list || [];
}

/** 所有资产页共享的「媒体账户」查询条件（线上首个筛选项，多选 + 清空图标） */
export const ACCOUNT_FILTER = {
  key: 'advertiser_ids', type: 'select', label: '媒体账户：', multiple: true,
  placeholder: '所有账户', source: 'accounts',
};

// =========================================================================
// 一、已按线上采集登记的资产页
// =========================================================================
export const ASSET_PAGES = {
  // ---------------------------------------------------------------- 资产组
  asset_group: {
    title: '资产组',
    filters: [
      ACCOUNT_FILTER,
      { key: 'group_type', type: 'select', label: '资产组类型：', placeholder: '全部', options: ['小程序/小游戏', '电商'] },
      { key: 'delivery_content', type: 'select', label: '投放内容：', placeholder: '全部', options: ['微信小游戏', '微信小程序', '字节小游戏', '字节小程序', '抖音号', '自研落地页', '橙子落地页'] },
      { key: 'use_status', type: 'select', label: '使用状态：', placeholder: '全部', options: ['未使用', '已使用'] },
      {
        type: 'search', label: '', width: 280, placeholder: '请输入关键词',
        fields: ['资产组名称', '资产组别名', '组件名称', '组件资产ID'],
      },
    ],
    buttons: [
      { text: '新建资产组', type: 'primary', action: 'create' },
      { text: '批量导入资产组', type: 'primary', action: 'import' },
    ],
    batch: { label: '批量操作', options: ['删除'] },
    columns: [
      { label: '资产组名称', prop: 'name', width: 180, fixed: true },
      { label: '资产组别名', prop: 'alias', width: 180, fixed: true },
      { label: '操作', width: 120, fixed: true, action: true },
      { label: '使用状态', prop: 'use_status', width: 80, type: 'status' },
      { label: '媒体账户', prop: 'account_name', width: 180 },
      { label: '巨量商品ID', prop: 'product_id', width: 120 },
      { label: '小程序/小游戏类型', prop: 'mini_type', width: 180 },
      { label: '投放内容', prop: 'delivery_content', width: 120 },
      { label: '直达链接类型', prop: 'link_type', width: 160 },
      { label: 'Deeplink直达链接', prop: 'deeplink', width: 180 },
      { label: 'Ulink直达链接', prop: 'ulink', width: 180 },
      { label: '小程序/小游戏名称', prop: 'mini_name', width: 180 },
      { label: '小程序/小游戏备注', prop: 'mini_note', width: 180 },
      { label: '路径参数/链接', prop: 'path_link', width: 180 },
      { label: '有效触点链接', prop: 'valid_link', width: 180 },
      { label: '展示监测链接', prop: 'monitor_link', width: 180 },
      { label: '落地页链接', prop: 'landing_link', width: 180 },
      { label: '端原生链接', prop: 'native_link', width: 180 },
      { label: '创量落地页落地页模板', prop: 'cl_template', width: 180 },
      { label: '创建人', prop: 'creator', width: 120 },
      { label: '创建时间', prop: 'created_at', width: 180 },
      { label: '更新时间', prop: 'updated_at', width: 180 },
    ],
    rowActions: [
      { text: '查看', action: 'view' },
      { text: '编辑', action: 'edit' },
      { text: '删除', action: 'remove' },
    ],
    list: () => assetApi.byKind('asset_group'),
    // 新建/编辑走线上同款抽屉（assetGroupForm.js 定义分区与字段联动）
    drawer: 'assetGroup',
    importModal: { title: '资产组', groupTypes: ['小程序/小游戏', '电商'] },
  },
};

// =========================================================================
// 二、待采集页面的兜底配置（沿用改造前的通用列，逐页采集后即被线上配置取代）
// =========================================================================
export const LEGACY_COLUMNS = {
  event: [['事件名称', 'name', 260], ['事件标识', 'key', 180]],
  orientation: [['定向包名称', 'name', 220], ['地域', 'regions', 120], ['性别', 'gender', 80], ['年龄', 'age', 90], ['兴趣行为', 'interests', 160], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
  audience: [['人群包名称', 'name', 220], ['包类型', 'package_type', 120], ['覆盖量', 'size', 120], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
  landing_page: [['落地页名称', 'title', 220], ['URL', 'url', 220], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  deep_link: [['直达链接名称', 'title', 220], ['Scheme / URL', 'url', 220], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  monitor: [['监测活动名称', 'name', 220], ['监测链接', 'monitor_url', 220], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  copywrite: [['文案标题', 'title', 220], ['文案内容', 'content', 260], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  component: [['组件标题', 'title', 220], ['组件类型', 'comp_type', 120], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  comment: [['视频标题', 'video_title', 200], ['评论内容', 'comment', 220], ['处理动作', 'action', 120], ['状态', 'status', 100], ['时间', 'created_at', 180]],
  product: [['商品名称', 'name', 220], ['商品ID', 'product_id', 140], ['商品类型', 'product_type', 120], ['价格（元）', 'price', 100], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
  app: [['应用名称', 'name', 200], ['应用ID', 'app_id', 140], ['投放端', 'platform', 100], ['版本', 'version', 100], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
  mini_game: [['名称', 'title', 220], ['AppID', 'appid', 160], ['类型', 'mini_type', 120], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  drama_link: [['短剧标题', 'title', 220], ['短剧ID', 'drama_id', 120], ['推广链接', 'url', 220], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  csj_package: [['媒体包名称', 'name', 220], ['媒体类型', 'slot_type', 120], ['覆盖量', 'size', 120], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
  interactive: [['素材标题', 'title', 220], ['素材类型', 'material_type', 120], ['大小', 'size', 100], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  anchor: [['锚点标题', 'title', 220], ['锚点类型', 'anchor_type', 120], ['状态', 'status', 100], ['创建时间', 'created_at', 180]],
  album: [['专辑名称', 'title', 220], ['专辑ID', 'album_id', 140], ['作者', 'author', 160], ['状态', 'status', 100], ['更新时间', 'updated_at', 180]],
};

export const KIND_TEXT = {
  event: '事件管理', orientation: '定向包', audience: '自定义人群包', landing_page: '落地页',
  deep_link: '直达链接', monitor: '监测活动', copywrite: '文案库', component: '创意组件',
  comment: '评论管理', asset_group: '资产组', product: '巨量商品库', app: '巨量应用',
  mini_game: '小程序/小游戏', drama_link: '短剧推广链接', csj_package: '穿山甲媒体包',
  interactive: '试玩/直玩素材', anchor: '原生锚点模板', album: '专辑链接',
};

/** 资产类能力与表单字段（线上采集完成后按页面补齐） */
export const KIND_CONFIG = {
  orientation: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => targetApi.audiencePackageList(),
    create: (p) => targetApi.audiencePackageCreate(p),
    update: (p) => targetApi.audiencePackageUpdate(p),
    remove: (id) => targetApi.audiencePackageRemove(id),
    fields: [
      { key: 'name', label: '定向包名称', type: 'text', required: true },
      { key: 'regions', label: '地域', type: 'text' },
      { key: 'gender', label: '性别', type: 'select', options: ['不限', '男', '女'] },
      { key: 'age', label: '年龄', type: 'text' },
      { key: 'interests', label: '兴趣行为', type: 'text' },
    ],
  },
  audience: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => targetApi.customAudienceList(),
    create: (p) => targetApi.customAudienceCreate(p),
    update: (p) => targetApi.customAudienceUpdate(p),
    remove: (id) => targetApi.customAudienceRemove(id),
    fields: [
      { key: 'name', label: '人群包名称', type: 'text', required: true },
      { key: 'package_type', label: '包类型', type: 'select', options: ['行为兴趣', '排除人群', '规则包'] },
      { key: 'size', label: '覆盖量', type: 'text' },
    ],
  },
  landing_page: {
    canCreate: true, canEdit: true, canDelete: false,
    list: () => siteApi.siteList(),
    create: (p) => siteApi.siteCreate(p),
    update: (p) => siteApi.siteUpdate(p),
    fields: [
      { key: 'title', label: '落地页名称', type: 'text', required: true },
      { key: 'url', label: '页面 URL', type: 'text', required: true },
      { key: 'page_type', label: '落地页类型', type: 'select', options: ['橙子建站', '第三方', '字节小程序', '微信小程序'] },
    ],
  },
  monitor: {
    canCreate: true, canEdit: true, canDelete: false,
    list: () => eventApi.trackUrlList(),
    create: (p) => eventApi.trackUrlCreate(p),
    update: (p) => eventApi.trackUrlUpdate(p),
    fields: [
      { key: 'name', label: '监测活动名称', type: 'text', required: true },
      { key: 'monitor_url', label: '监测链接', type: 'text', required: true },
    ],
  },
  product: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => productApi.dpaList(),
    create: (p) => productApi.dpaCreate(p),
    update: (p) => productApi.dpaUpdate(p),
    remove: (id) => productApi.dpaDelete([id]),
    fields: [
      { key: 'name', label: '商品名称', type: 'text', required: true },
      { key: 'product_id', label: '商品ID', type: 'text' },
      { key: 'product_type', label: '商品类型', type: 'select', options: ['商品', '虚拟商品'] },
      { key: 'price', label: '价格（元）', type: 'text' },
    ],
  },
  mini_game: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => assetApi.byKind('mini_game'),
    create: (p) => assetExtApi.miniCreate(p),
    fields: [
      { key: 'title', label: '名称', type: 'text', required: true },
      { key: 'appid', label: 'AppID', type: 'text' },
      { key: 'mini_type', label: '类型', type: 'select', options: ['字节小游戏', '微信小游戏', '微信小程序'] },
    ],
  },
  drama_link: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => productApi.dramaAuth(),
    create: (p) => assetExtApi.dramaLinkCreate(p),
    fields: [
      { key: 'title', label: '短剧标题', type: 'text', required: true },
      { key: 'drama_id', label: '短剧ID', type: 'text' },
      { key: 'url', label: '推广链接', type: 'text' },
    ],
  },
  csj_package: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => toolApi.unionPackageList(),
    create: (p) => toolApi.unionPackageCreate(p),
    update: (p) => toolApi.unionPackageUpdate(p),
    remove: (id) => toolApi.unionPackageRemove(id),
    fields: [
      { key: 'name', label: '媒体包名称', type: 'text', required: true },
      { key: 'slot_type', label: '媒体类型', type: 'select', options: ['游戏类', '阅读类', '工具类'] },
      { key: 'size', label: '覆盖量', type: 'text' },
    ],
  },
  interactive: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => assetExtApi.playableList(),
    create: (p) => assetExtApi.playableUpload(p),
    fields: [
      { key: 'title', label: '素材标题', type: 'text', required: true },
      { key: 'material_type', label: '素材类型', type: 'select', options: ['试玩素材', '直玩素材'] },
      { key: 'size', label: '大小', type: 'text' },
    ],
  },
  component: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.componentList(),
    create: (p) => assetExtApi.componentCreate(p),
    update: (p) => assetExtApi.componentUpdate(p),
    remove: (id) => assetExtApi.componentRemove(id),
    fields: [
      { key: 'title', label: '组件标题', type: 'text', required: true },
      { key: 'comp_type', label: '组件类型', type: 'select', options: ['表单', '客服', '锚点', '卡券'] },
    ],
  },
  anchor: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.anchorList(),
    create: (p) => assetExtApi.anchorCreate(p),
    update: (p) => assetExtApi.anchorUpdate(p),
    remove: (id) => assetExtApi.anchorRemove(id),
    fields: [
      { key: 'title', label: '锚点标题', type: 'text', required: true },
      { key: 'anchor_type', label: '锚点类型', type: 'select', options: ['门店锚点', '商品锚点', '私信锚点'] },
    ],
  },
  album: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.albumList(),
    create: (p) => assetExtApi.albumCreate(p),
    update: (p) => assetExtApi.albumUpdate(p),
    remove: (id) => assetExtApi.albumRemove(id),
    fields: [
      { key: 'title', label: '专辑名称', type: 'text', required: true },
      { key: 'album_id', label: '专辑ID', type: 'text' },
      { key: 'author', label: '作者', type: 'text' },
    ],
  },
  comment: { canCreate: false, canEdit: false, canDelete: false, list: () => assetExtApi.commentList() },
  event: { canCreate: false, canEdit: false, canDelete: false, list: () => eventApi.assetList() },
  app: { canCreate: false, canEdit: false, canDelete: false, list: () => appApi.androidList() },
  asset_group: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetApi.byKind('asset_group'),
    fields: [
      { key: 'name', label: '资产组名称', type: 'text', required: true },
      { key: 'alias', label: '资产组别名', type: 'text' },
      { key: 'group_type', label: '资产组类型', type: 'select', options: ['小程序/小游戏', '电商'] },
      { key: 'delivery_content', label: '投放内容', type: 'select', options: ['微信小游戏', '微信小程序', '字节小游戏', '字节小程序', '抖音号', '自研落地页', '橙子落地页'] },
    ],
  },
};

/** 取某个 kind 的页面配置：优先线上采集结果，否则用兜底配置 */
export function getAssetPage(kind) {
  const online = ASSET_PAGES[kind];
  if (online) return online;
  const legacyCols = LEGACY_COLUMNS[kind] || [];
  const cfg = KIND_CONFIG[kind] || {};
  return {
    title: KIND_TEXT[kind] || '资产',
    legacy: true,
    filters: [],
    buttons: [
      { text: '新建', type: 'primary', action: 'create' },
      { text: '手动同步', action: 'sync' },
      { text: '导出数据', action: 'export' },
    ],
    columns: [
      ...legacyCols.map(([label, prop, width]) => (
        prop === 'status' ? { label, prop, width, type: 'status' } : { label, prop, width }
      )),
      { label: '操作', width: 200, fixed: true, action: true },
    ],
    rowActions: [
      { text: '查看', action: 'view' },
      ...(cfg.canEdit ? [{ text: '编辑', action: 'edit' }] : []),
      ...(cfg.canDelete ? [{ text: '删除', action: 'remove' }] : []),
      ...(kind === 'comment' ? [{ text: '回复', action: 'reply' }, { text: '隐藏', action: 'hide' }] : []),
    ],
    fields: cfg.fields || [],
    api: cfg,
  };
}

export const ASSET_KINDS = [
  'event', 'orientation', 'audience', 'landing_page', 'deep_link', 'monitor',
  'copywrite', 'component', 'comment', 'asset_group', 'product', 'app',
  'mini_game', 'drama_link', 'csj_package', 'interactive', 'anchor', 'album',
];
