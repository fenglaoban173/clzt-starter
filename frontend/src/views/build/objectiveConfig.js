/* 「新建项目」抽屉：按推广目的切换的模块 / 字段矩阵
 * 线上依据：cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 * 逐个点击 7 个推广目的卡片（确认弹窗 → 确定）后抓取抽屉内各模块与字段。
 */

/* 每个推广目的的模块开关与差异项 */
export const OBJECTIVE_CONF = {
  /* 应用推广 */
  APP: {
    subTypes: true,
    subHint: '吸引用户下载并安装您的应用程序',
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'TOGGLE',       // 关联产品：不启用 / 启用
    aigc: true,              // AIGC动态创意
    content: 'APP',          // 投放内容与目标：应用专属
    thirdParty: false,       // 第三方监测链接
    searchFast: false,       // 搜索快投
    payMode: true,           // 付费方式
    budgetModes: ['DAY'],    // 项目预算
    nightFilter: false,      // 过滤夜间
    bidStrategies: ['STABLE_COST', 'MAX_CONVERT'],
    preferredMedia: false,   // 首选媒体
  },
  /* 小程序 */
  MICRO_GAME: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE', 'SMART_MANAGE'],
    related: 'TOGGLE',
    aigc: true,
    content: 'MINI',
    thirdParty: true,
    searchFast: false,
    payMode: true,
    budgetModes: ['DAY'],
    nightFilter: false,
    bidStrategies: ['STABLE_COST', 'MAX_CONVERT'],
    preferredMedia: false,
  },
  /* 电商 */
  SHOP: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'PRODUCT',      // 无产品 / 单产品投放 / 多产品投放
    aigc: true,
    content: 'SHOP',
    thirdParty: true,
    searchFast: false,
    payMode: false,
    budgetModes: ['OFF', 'DAY'],
    nightFilter: false,
    bidStrategies: ['STABLE_COST', 'MAX_CONVERT'],
    preferredMedia: false,
  },
  /* 销售线索 */
  LINK: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'TOGGLE',
    aigc: true,
    content: 'LEAD',
    thirdParty: true,
    searchFast: false,
    payMode: true,
    budgetModes: ['DAY'],
    nightFilter: true,
    bidStrategies: ['STABLE_COST', 'VOLUME', 'MAX_CONVERT'],
    preferredMedia: false,
  },
  /* 快应用 */
  QUICK_APP: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'TOGGLE',
    aigc: true,
    content: 'QUICK',
    thirdParty: true,
    searchFast: false,
    payMode: true,
    budgetModes: ['DAY'],
    nightFilter: false,
    bidStrategies: ['STABLE_COST', 'MAX_CONVERT'],
    preferredMedia: false,
  },
  /* 商品 */
  DPA: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'NONE',         // 无「关联产品投放」模块，改为商品目录 + 商品定向
    aigc: false,             // 线上「商品」目的无 AIGC 动态创意模块
    content: 'GOODS',
    thirdParty: true,
    searchFast: false,
    payMode: true,
    budgetModes: ['OFF', 'DAY'],
    nightFilter: false,
    bidStrategies: ['STABLE_COST', 'STABLE_UPGRADE', 'VOLUME', 'BEST_COST', 'MAX_CONVERT'],
    preferredMedia: true,
  },
  /* 内容营销 */
  NATIVE_ACTION: {
    subTypes: false,
    deliveryTypes: ['NORMAL', 'CYCLE_STABLE'],
    related: 'CONTENT',      // 推广产品：无产品 / 抖音号 / 商品
    aigc: false,
    content: 'CONTENT',
    thirdParty: true,
    searchFast: true,
    payMode: true,
    budgetModes: ['OFF', 'DAY'],
    nightFilter: false,
    bidStrategies: ['STABLE_COST', 'STABLE_UPGRADE', 'BEST_COST', 'MAX_CONVERT'],
    preferredMedia: true,
  },
};

/* 投放内容选项（按推广目的） */
export const OBJECTIVE_CONTENT_OPTIONS = {
  MINI: [
    { value: 'WECHAT_GAME', label: '微信小游戏' },
    { value: 'WECHAT_APPLET', label: '微信小程序' },
    { value: 'BYTE_GAME', label: '字节小游戏' },
    { value: 'BYTE_APPLET', label: '字节小程序' },
    { value: 'DOUYIN_ACCOUNT', label: '抖音号' },
  ],
  SHOP: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
    { value: 'WECHAT_APPLET', label: '微信小程序' },
    { value: 'BYTE_APPLET', label: '字节小程序' },
  ],
  LEAD: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
    { value: 'DOUYIN_HOME', label: '抖音主页' },
    { value: 'WECHAT_APPLET', label: '微信小程序' },
    { value: 'BYTE_APPLET', label: '字节小程序' },
  ],
  GOODS: [
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
  ],
  CONTENT: [
    { value: 'DOUYIN_HOME', label: '抖音主页' },
    { value: 'ORANGE', label: '橙子落地页' },
    { value: 'THIRDPARTY', label: '自研落地页' },
  ],
};

/* 关联产品 / 推广产品 开关 */
export const RELATED_PRODUCT_OPTIONS = {
  TOGGLE: [
    { value: 'OFF', label: '不启用' },
    { value: 'ON', label: '启用' },
  ],
  PRODUCT: [
    { value: 'OFF', label: '无产品' },
    { value: 'SINGLE', label: '单产品投放' },
    { value: 'MULTI', label: '多产品投放' },
  ],
  CONTENT: [
    { value: 'OFF', label: '无产品' },
    { value: 'DOUYIN', label: '抖音号' },
    { value: 'GOODS', label: '商品' },
  ],
};

/* 投放类型（线上按推广目的增减） */
export const DELIVERY_TYPE_OPTIONS = {
  NORMAL: { value: 'NORMAL', label: '常规投放' },
  CYCLE_STABLE: { value: 'CYCLE_STABLE', label: '周期稳投' },
  RAPID: { value: 'RAPID', label: '极速智投' },
  SMART_MANAGE: { value: 'SMART_MANAGE', label: '智能托管' },
};

/* 第三方监测链接来源 */
export const THIRD_PARTY_LINK_SOURCES = [
  { value: 'LOCAL', label: '智投本地导入' },
  { value: 'DYNAMIC', label: '动态选取监测链接' },
  { value: 'LANDING', label: '关联第三方落地页' },
  { value: 'MANUAL', label: '手动填写' },
];
