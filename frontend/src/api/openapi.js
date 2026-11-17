// 全链路原型 mock：结构对齐巨量引擎开放平台真实返回，不发起真实后端请求。
// 统一返回 { code: 0, message: 'ok', data }；列表统一 { list, total, page, page_size }。
// 注释中路径为对应巨量官方接口，便于后续真实联调时一一替换。
import { mockOk, mockDb, openapiDb } from '../mock/data';

const clone = (v) => JSON.parse(JSON.stringify(v));
let seq = 900000;
const nextId = (prefix) => `${prefix}${++seq}`;

function paginate(list, params = {}) {
  const page = params.page || 1;
  const pageSize = params.page_size || 20;
  return {
    list: clone(list.slice((page - 1) * pageSize, page * pageSize)),
    total: list.length,
    page,
    page_size: pageSize,
  };
}

// 素材审核状态映射：本地 platform_status → 巨量 audit_status
const AUDIT_MAP = { available: 'AUDIT_PASS', reviewing: 'AUDITING', failed: 'AUDIT_REJECT' };
function shapeMaterial(m) {
  return {
    ...clone(m),
    audit_status: AUDIT_MAP[m.platform_status] || 'AUDIT_PASS',
    cover_url: '',
    material_tags: m.type === 'video' ? ['竖版素材', '首发'] : ['封面图'],
    source: 'UPLOAD',
    size: m.type === 'video' ? '2.4 MB' : '820 KB',
  };
}

// ============ 0. 账号授权（OAuth2.0） ============
export const authApi = {
  // 申请授权链接 /oauth/authorize
  async authUrl() {
    return mockOk({ auth_url: '#', state: 'mock-state-0001', scope: [] });
  },
  // code 换取 Access Token /oauth2/access_token/
  async accessToken(code) {
    return mockOk({
      access_token: 'mock-at-88210001',
      refresh_token: 'mock-rt-88210001',
      expires_in: 86400,
      advertiser_ids: mockDb.accounts.map((a) => a.advertiser_id),
      code: code || '',
    });
  },
  // 刷新 Token /oauth2/refresh_token/
  async refreshToken(refreshToken) {
    return mockOk({ access_token: 'mock-at-refreshed', expires_in: 86400, refresh_token: refreshToken || '' });
  },
  // 已授权账户 /advertiser/select/
  async authorizedAdverts() {
    return mockOk(paginate(mockDb.accounts));
  },
  // 授权 User 信息 /oauth2/user_info/
  async userInfo() {
    return mockOk({
      uid: 'mock-uid-0001', name: '系统管理员', avatar: '',
      scope: ['advertiser.read', 'project.write', 'promotion.write', 'material.read', 'report.read', 'clue.read'],
    });
  },
};

// ============ 1. 账户 / 资质 / 资金 ============
export const accountApi = {
  // /advertiser/info/
  async detail(advertiserId) {
    const a = mockDb.accounts.find((x) => x.advertiser_id === advertiserId) || mockDb.accounts[0];
    return mockOk({
      advertiser_id: a.advertiser_id,
      advertiser_name: a.name,
      company: a.project,
      status: a.status,
      balance: a.balance,
      balance_frozen: 0,
      valid_balance: a.balance,
      daily_budget: a.daily_budget,
      currency: 'CNY',
      industry: a.product,
      owner_real: a.owner_real,
      email: a.email,
      optimizer: a.optimizer,
      dept: a.dept,
      contact_name: a.owner_real,
      contact_phone: '',
      timezone: 'Asia/Shanghai',
      country: 'CN',
      created_at: a.created_at,
    });
  },
  // /advertiser/adv_info/list/
  async infoList(ids = []) {
    const list = mockDb.accounts.filter((a) => !ids.length || ids.includes(a.advertiser_id));
    return mockOk({ list: clone(list), total: list.length });
  },
  // /advertiser/fund/get/
  async fund() {
    const a = mockDb.accounts[0];
    return mockOk({ balance: a.balance, valid_balance: a.balance, balance_total: a.balance, currency: 'CNY' });
  },
  // /fund/daily_stat/
  async dailyStat(date) {
    return mockOk({ list: clone(openapiDb.fundDailyStats), date: date || '' });
  },
  // /fund/transaction/get/
  async transactions(params = {}) {
    return mockOk(paginate(openapiDb.fundTransactions, params));
  },
  // /advertiser/budget/get/
  async getBudget() {
    return mockOk({ daily_budget: mockDb.accounts[0].daily_budget, budget_mode: 'BUDGET_MODE_DAY' });
  },
  // /advertiser/update/budget/
  async updateBudget(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // /advertiser/qualification/select/ 主体资质
  async subjectQuals() {
    return mockOk({ list: clone(openapiDb.subjectQuals) });
  },
  // /delivery_qualification/submit/list/ 投放资质
  async deliveryQuals() {
    return mockOk({ list: clone(openapiDb.deliveryQuals) });
  },
  // 推广产品资质
  async productQuals() {
    return mockOk({ list: clone(openapiDb.productQuals) });
  },
  // /agent/advertiser/select/ 代理账户
  async agents() {
    return mockOk({ list: clone(openapiDb.agents) });
  },
  // /agent/child_agent/select/
  async childAgents() {
    return mockOk({ list: clone(openapiDb.agents) });
  },
  // /ebp/advertiser/list/ 工作台组织
  async orgList() {
    return mockOk({ list: clone(openapiDb.orgNodes) });
  },
  // 共享钱包 / 余额转账
  async wallets() {
    return mockOk({ list: clone(openapiDb.wallets) });
  },
  async transfer(payload) {
    return mockOk({ ok: true, transfer_id: nextId('TR'), ...payload });
  },
  // 充值汇款码
  async remittanceCodes() {
    return mockOk({ list: clone(openapiDb.remittanceCodes) });
  },
  async rechargeVerify(payload) {
    return mockOk({ ok: true, ...payload });
  },
};

// ============ 2. 项目（标准 / 升级版 / 全域 / 智擎） ============
export const projectApi = {
  // /project/list/get/ （标准）
  async list(params = {}) {
    let list = mockDb.projects;
    if (params.media) list = list.filter((p) => (p.media || 'upgrade') === params.media);
    if (params.keyword) list = list.filter((p) => p.name.includes(params.keyword));
    return mockOk(paginate(list, params));
  },
  // /project/detail/get/
  async detail(id) {
    const p = mockDb.projects.find((x) => x.id === Number(id)) || mockDb.projects[0];
    return mockOk({
      ...clone(p),
      config: {
        project_name: p.name,
        landing_type: 'LINK',
        marketing_goal: 'VIDEO_AND_IMAGE',
        ad_type: 'ALL',
        delivery_mode: p.delivery_mode || 'MANUAL',
        budget: p.budget,
        budget_mode: 'BUDGET_MODE_DAY',
        pricing: 'PRICING_OCPM',
        external_action: 'AD_CONVERT_TYPE_FORM',
        deep_external_action: p.deep_bid ? 'AD_CONVERT_TYPE_PAY' : '',
        deep_bid_type: p.deep_bid ? 'DEEP_BID' : 'NO_DEEP_BID',
        cpa_bid: p.bid,
        roi_goal: p.pay_roi || 0,
        schedule_type: 'SCHEDULE_FROM_NOW',
        schedule_time: '',
        week_schedule: [1, 1, 1, 1, 1, 1, 1],
        inventory_catalog: 'INVENTORY_AUTO',
        orientation_id: '',
        package_ids: [],
        optimize_goal: 'AD_CONVERT_TYPE_FORM',
      },
    });
  },
  // /project/create/
  async create(payload) {
    return mockOk({ project_id: nextId('PRJ'), status: 'SUCCESS', ...payload });
  },
  // /project/update/
  async update(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // /project/delete/
  async remove(id) {
    return mockOk({ ok: true, project_id: id });
  },
  // /project/status/update/
  async statusUpdate(ids, status) {
    return mockOk({ ok: true, project_ids: ids, status });
  },
  // /project/budget/update/
  async budgetUpdate(id, budget) {
    return mockOk({ ok: true, project_id: id, budget });
  },
  // /project/cpa_bid/update/
  async bidUpdate(id, bid) {
    return mockOk({ ok: true, project_id: id, bid });
  },
  // /project/schedule_time/update/
  async scheduleUpdate(id, schedule) {
    return mockOk({ ok: true, project_id: id, schedule });
  },
  // /project/roigoal/update/
  async roiGoalUpdate(id, roiGoal) {
    return mockOk({ ok: true, project_id: id, roi_goal: roiGoal });
  },
  // 审核建议 /project/reject_reason/get/
  async rejectReason(id) {
    const p = mockDb.projects.find((x) => x.id === Number(id));
    return mockOk({ project_id: id, reject_note: p?.reject_note || '', suggestions: [] });
  },
  // ---- 全域 /uni_project/* ----
  async uniCreate(payload) {
    return mockOk({ project_id: nextId('UNI'), status: 'SUCCESS', ...payload });
  },
  async uniUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async monetizationModeUpdate(id, mode) {
    return mockOk({ ok: true, project_id: id, monetization_mode: mode });
  },
  // ---- 智擎 /oc_project/* ----
  async ocMaterialCreate(payload) {
    return mockOk({ material_id: nextId('OCM'), status: 'SUCCESS', ...payload });
  },
  async ocMaterialDelete(id) {
    return mockOk({ ok: true, material_id: id });
  },
  async ocMaterialStatus(id, status) {
    return mockOk({ ok: true, material_id: id, status });
  },
  async ocRejectReason(id) {
    return mockOk({ project_id: id, reject_note: '', suggestions: [] });
  },
  // 成本保障历史
  async compensateHistory(id) {
    return mockOk({ list: clone(openapiDb.compensateHistory), project_id: id });
  },
};

// ============ 3. 单元（营销 / 广告） ============
export const promotionApi = {
  // /promotion/list/get/
  async list(params = {}) {
    let list = mockDb.ads;
    if (params.project_id) list = list.filter((a) => a.campaign_id === params.project_id);
    if (params.keyword) list = list.filter((a) => a.name.includes(params.keyword));
    return mockOk(paginate(list, params));
  },
  // /promotion/detail/get/
  async detail(id) {
    const a = mockDb.ads.find((x) => x.id === Number(id)) || mockDb.ads[0];
    return mockOk({
      ...clone(a),
      config: {
        promotion_name: a.name,
        project_id: a.campaign_id,
        budget: a.budget,
        budget_mode: 'BUDGET_MODE_DAY',
        bid: a.bid,
        pricing: 'PRICING_OCPM',
        deep_bid: a.deep_bid,
        deep_external_action: a.deep_bid ? 'AD_CONVERT_TYPE_PAY' : '',
        schedule_type: 'SCHEDULE_FROM_NOW',
        schedule_time: '',
        inventory: 'INVENTORY_AUTO',
        material_mode: 'VIDEO',
        aweme_setting: 'AUTO',
        cta_text: '立即体验',
        landing_page_url: '',
        title_pack_id: '',
        component_ids: [],
        anchor_id: '',
      },
    });
  },
  // /promotion/create/
  async create(payload) {
    return mockOk({ promotion_id: nextId('AD'), status: 'SUCCESS', ...payload });
  },
  // /promotion/update/
  async update(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // /promotion/delete/
  async remove(id) {
    return mockOk({ ok: true, promotion_id: id });
  },
  // /promotion/status/update/
  async statusUpdate(ids, status) {
    return mockOk({ ok: true, promotion_ids: ids, status });
  },
  // /promotion/budget/update/
  async budgetUpdate(id, budget) {
    return mockOk({ ok: true, promotion_id: id, budget });
  },
  // /promotion/bid/update/
  async bidUpdate(id, bid) {
    return mockOk({ ok: true, promotion_id: id, bid });
  },
  // /promotion/deepbid/update/
  async deepBidUpdate(id, deepBid) {
    return mockOk({ ok: true, promotion_id: id, deep_bid: deepBid });
  },
  // /promotion/material/delete/
  async materialDelete(id, materialId) {
    return mockOk({ ok: true, promotion_id: id, material_id: materialId });
  },
  // 单元审核建议
  async rejectReason(id) {
    const a = mockDb.ads.find((x) => x.id === Number(id));
    return mockOk({ promotion_id: id, reject_note: a?.reject_note || '', suggestions: [] });
  },
};

// ============ 4. 创意 ============
export const creativeApi = {
  // 创意列表（按单元 / 素材）
  async list(params = {}) {
    let list = openapiDb.creatives;
    if (params.promotion_id) list = list.filter((c) => c.promotion_id === params.promotion_id);
    if (params.status) list = list.filter((c) => c.status === params.status);
    return mockOk(paginate(list, params));
  },
  // 创意详情
  async detail(creativeId) {
    const c = openapiDb.creatives.find((x) => x.creative_id === creativeId) || openapiDb.creatives[0];
    return mockOk(clone(c));
  },
  // /file/material/bind/
  async bindMaterial(payload) {
    return mockOk({ ok: true, creative_id: nextId('CR'), ...payload });
  },
  // /material/status/update/
  async statusUpdate(ids, status) {
    return mockOk({ ok: true, creative_ids: ids, status });
  },
};

// ============ 5. 定向与人群 ============
export const targetApi = {
  // 定向包 /audience_package/*
  async audiencePackageList(params = {}) {
    return mockOk(paginate(mockDb.orientationPackages, params));
  },
  async audiencePackageCreate(payload) {
    return mockOk({ package_id: nextId('APK'), status: 'SUCCESS', ...payload });
  },
  async audiencePackageUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async audiencePackageRemove(id) {
    return mockOk({ ok: true, package_id: id });
  },
  async audiencePackageBind(packageId, adIds) {
    return mockOk({ ok: true, package_id: packageId, promotion_ids: adIds });
  },
  async audiencePackageUnbind(packageId, adIds) {
    return mockOk({ ok: true, package_id: packageId, promotion_ids: adIds });
  },
  // DMP 人群包 /dmp/custom_audience/*
  async customAudienceList(params = {}) {
    return mockOk(paginate(openapiDb.customAudiences, params));
  },
  async customAudienceDetail(id) {
    const a = openapiDb.customAudiences.find((x) => x.audience_id === id) || openapiDb.customAudiences[0];
    return mockOk(clone(a));
  },
  async customAudienceCreate(payload) {
    return mockOk({ audience_id: nextId('AUD'), status: 'SUCCESS', ...payload });
  },
  async customAudienceUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async customAudienceRemove(id) {
    return mockOk({ ok: true, audience_id: id });
  },
  async customAudienceCopy(id) {
    return mockOk({ audience_id: nextId('AUD'), source_id: id });
  },
  async customAudiencePublish(id) {
    return mockOk({ ok: true, audience_id: id, status: 'PUBLISHED' });
  },
  async customAudiencePush(id, platform) {
    return mockOk({ ok: true, audience_id: id, platform });
  },
  // 数据源 /dmp/data_source/*
  async dataSourceList(params = {}) {
    return mockOk(paginate(openapiDb.dataSources, params));
  },
  async dataSourceUpload(formData) {
    return mockOk({ source_id: nextId('DS'), rows: 0, status: 'READY', file_name: formData?.get?.('name') || 'upload.csv' });
  },
  // 行为兴趣类目 / 关键词 /tools/interest_action/*
  async interestActionDict(mode = 'INTEREST') {
    return mockOk({
      mode,
      list: [
        { value: 'short_drama', label: '短剧', children: [{ value: 'sweet_pet', label: '甜宠' }, { value: 'revenge', label: '逆袭爽文' }] },
        { value: 'novel', label: '小说', children: [{ value: 'urban', label: '都市' }] },
        { value: 'education', label: '教育', children: [{ value: 'skill', label: '职业技能' }] },
        { value: 'game', label: '游戏', children: [{ value: 'casual', label: '休闲小游戏' }] },
      ],
    });
  },
  // 受众预估
  async audienceEstimate(payload) {
    return mockOk({ estimate_size: 862130, reach: 712400, ...payload });
  },
  // 地域列表
  async regionList() {
    return mockOk({
      list: [
        { value: '110000', label: '北京', children: [{ value: '110100', label: '北京市' }] },
        { value: '310000', label: '上海', children: [{ value: '310100', label: '上海市' }] },
        { value: '440000', label: '广东', children: [{ value: '440100', label: '广州' }, { value: '440300', label: '深圳' }] },
        { value: '330000', label: '浙江', children: [{ value: '330100', label: '杭州' }, { value: '330200', label: '宁波' }] },
      ],
    });
  },
};

// ============ 6. 素材 / 商品 / 应用资产 ============
export const materialApi = {
  // /file/image/ad/
  async imageUpload(formData) {
    return mockOk({
      material_id: nextId('IMG'), status: 'SUCCESS', title: formData?.get?.('title') || '图片素材',
      width: 1080, height: 1920, size: '820 KB', audit_status: 'AUDITING', source: 'UPLOAD',
    });
  },
  // /file/video/ad/
  async videoUpload(formData) {
    return mockOk({
      material_id: nextId('VID'), status: 'SUCCESS', title: formData?.get?.('title') || '视频素材',
      duration: 30, width: 1080, height: 1920, size: '2.4 MB', audit_status: 'AUDITING', source: 'UPLOAD',
    });
  },
  // /file/audio/ad/
  async audioUpload(formData) {
    return mockOk({
      material_id: nextId('AUD'), status: 'SUCCESS', title: formData?.get?.('title') || '音频素材',
      duration: 12, size: '360 KB', audit_status: 'AUDITING', source: 'UPLOAD',
    });
  },
  // 异步上传 /file/upload_task/create/
  async asyncUploadCreate(type) {
    return mockOk({ task_id: nextId('UT'), task_status: 'CREATED', type });
  },
  // 上传任务结果轮询
  async asyncUploadPoll(taskId) {
    return mockOk({ task_id: taskId, task_status: 'SUCCESS', materials: clone(mockDb.videos.slice(0, 1)) });
  },
  // /file/material/list/detail/
  async list(params = {}) {
    let list = [...mockDb.videos, ...mockDb.images];
    if (params.material_type) list = list.filter((x) => x.type === params.material_type);
    return mockOk(paginate(list.map(shapeMaterial), params));
  },
  // /file/video/get | /file/image/get
  async detail(materialId) {
    const m = [...mockDb.videos, ...mockDb.images].find((x) => x.material_id === materialId) || mockDb.videos[0];
    return mockOk(shapeMaterial(m));
  },
  // /tools/video_cover/suggest/ 智能封面
  async coverSuggest(videoId) {
    return mockOk({ video_id: videoId, covers: clone(mockDb.images.slice(0, 2)) });
  },
  // /file/video/efficiency/get/ 低效素材
  async inefficient() {
    return mockOk({ list: clone(mockDb.videos.slice(0, 1)) });
  },
  // 素材清理任务 /file/video/material/clear_task/*
  async clearTaskCreate(payload) {
    return mockOk({ task_id: nextId('CLR'), status: 'CREATED', ...payload });
  },
  async clearTaskPoll(taskId) {
    return mockOk({ task_id: taskId, task_status: 'SUCCESS', cleared: 3 });
  },
  // EBP 素材共享范围
  async shareList() {
    return mockOk({ list: clone(openapiDb.wallets) });
  },
  // 试玩 / 直玩素材
  async playableList(params = {}) {
    return mockOk(paginate(mockDb.interactiveMaterials, params));
  },
};

export const productApi = {
  // DPA 商品 /dpa/detail/get/
  async dpaList(params = {}) {
    return mockOk(paginate(openapiDb.dpaProducts, params));
  },
  async dpaDetail(productId) {
    const p = openapiDb.dpaProducts.find((x) => x.product_id === productId) || openapiDb.dpaProducts[0];
    return mockOk(clone(p));
  },
  async dpaCreate(payload) {
    return mockOk({ product_id: nextId('P'), status: 'SUCCESS', ...payload });
  },
  async dpaUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async dpaDelete(ids) {
    return mockOk({ ok: true, product_ids: ids });
  },
  // 投放条件 / 分类 / 词包
  async conditionList() {
    return mockOk({ list: clone(openapiDb.dpaDictWords) });
  },
  async categoryList() {
    return mockOk({ list: clone(openapiDb.dpaCategories) });
  },
  async dictWordList() {
    return mockOk({ list: clone(openapiDb.dpaDictWords) });
  },
  // 品牌模糊查询
  async brandFuzzy(keyword) {
    return mockOk({ keyword, list: [{ value: 'BR8801', label: '示例品牌' }] });
  },
  // 短剧授权状态 /dpa/playlet/auth/
  async dramaAuth() {
    return mockOk({ list: clone(mockDb.dramaLinks) });
  },
  // 可投剧目状态 /dpa/album_status/get/
  async dramaStatus() {
    return mockOk({ list: clone(mockDb.albums) });
  },
  async dramaUpload(payload) {
    return mockOk({ album_id: nextId('ALB'), status: 'SUCCESS', ...payload });
  },
};

export const appApi = {
  // /tools/app_management/app/get/
  async appDetail(appId) {
    const a = mockDb.apps.find((x) => x.app_id === appId) || mockDb.apps[0];
    return mockOk(clone(a));
  },
  async androidList() {
    return mockOk({ list: clone(mockDb.apps) });
  },
  async iosList() {
    return mockOk({ list: clone(openapiDb.iosApps) });
  },
  // 分包 / 版本管理
  async extendPackage(appId) {
    return mockOk({ list: clone(openapiDb.appExtends.filter((x) => !appId || x.app_id === appId)) });
  },
  async shareList() {
    return mockOk({ list: clone(openapiDb.appExtends) });
  },
};

export const miniApi = {
  async wechatAppletList(params = {}) {
    return mockOk(paginate(openapiDb.wechatApplets, params));
  },
  async wechatGameList(params = {}) {
    return mockOk(paginate(mockDb.miniGames.filter((m) => m.mini_type === '微信小游戏'), params));
  },
  async microAppList(params = {}) {
    return mockOk(paginate(openapiDb.microApps, params));
  },
  async microGameList(params = {}) {
    return mockOk(paginate(mockDb.miniGames.filter((m) => m.mini_type === '字节小游戏'), params));
  },
  async shareList() {
    return mockOk({ list: clone(mockDb.miniGames) });
  },
  async convertWindow(payload) {
    return mockOk({ ok: true, ...payload });
  },
};

// ============ 7. 建站与线索 ============
export const siteApi = {
  // /tools/site/* 橙子建站
  async siteList(params = {}) {
    return mockOk(paginate(openapiDb.sites, params));
  },
  async siteDetail(siteId) {
    const s = openapiDb.sites.find((x) => x.site_id === siteId) || openapiDb.sites[0];
    return mockOk(clone(s));
  },
  async sitePreview(siteId) {
    return mockOk({ site_id: siteId, preview_url: 'https://orange.oceanengine.com/preview/88210001' });
  },
  async siteCreate(payload) {
    return mockOk({ site_id: nextId('SITE'), status: 'SUCCESS', ...payload });
  },
  async siteUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async siteCopy(siteId) {
    return mockOk({ site_id: nextId('SITE'), source_id: siteId });
  },
  // 第三方落地页 /tools/third_site/*
  async thirdSiteList(params = {}) {
    return mockOk(paginate(openapiDb.thirdSites, params));
  },
  // 程序化落地页组 /tools/landing_group/*
  async landingGroupList(params = {}) {
    return mockOk(paginate(openapiDb.landingGroups, params));
  },
  async landingGroupCreate(payload) {
    return mockOk({ group_id: nextId('LG'), status: 'SUCCESS', ...payload });
  },
  // 线索通组件
  async formList(params = {}) {
    return mockOk(paginate(openapiDb.clueForms, params));
  },
  async smartPhoneList(params = {}) {
    return mockOk(paginate(openapiDb.smartPhones, params));
  },
  async couponList(params = {}) {
    return mockOk(paginate(openapiDb.coupons, params));
  },
  async wechatPoolList(params = {}) {
    return mockOk(paginate(openapiDb.wechatPool, params));
  },
};

export const clueApi = {
  // /tools/clue/get/ 飞鱼线索
  async clueList(params = {}) {
    return mockOk(paginate(openapiDb.clues, params));
  },
  // /tools/clue/info/get/
  async clueDetail(clueId) {
    const c = openapiDb.clues.find((x) => x.clue_id === clueId) || openapiDb.clues[0];
    return mockOk(clone(c));
  },
  // 线索回传 callback
  async callback(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // 无效线索返款概览
  async refundOverview() {
    return mockOk({ valid_cnt: 128, invalid_cnt: 12, refund_amount: 86.0 });
  },
  // 呼叫话单
  async callLogs(params = {}) {
    return mockOk(paginate(openapiDb.callLogs, params));
  },
  // 私信线索回传
  async privateCallback(payload) {
    return mockOk({ ok: true, ...payload });
  },
};

// ============ 8. 事件管理 / 转化回传 ============
export const eventApi = {
  async assetList() {
    return mockOk({ list: clone(mockDb.eventAssets) });
  },
  async eventList(assetId) {
    return mockOk({ list: clone(openapiDb.convertGoals.filter((g) => !assetId || true)), asset_id: assetId });
  },
  async trackUrlList(params = {}) {
    return mockOk(paginate(openapiDb.trackUrls, params));
  },
  async trackUrlCreate(payload) {
    return mockOk({ track_url_id: nextId('TU'), status: 'SUCCESS', ...payload });
  },
  async trackUrlUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // /event_manager/optimized_goal/get(_v2)/ 优化目标
  async optimizedGoal() {
    return mockOk({ list: clone(openapiDb.convertGoals) });
  },
  // /event_manager/dbt/get/ 深度优化方式
  async deepBidType() {
    return mockOk({ list: [{ value: 'NO_DEEP_BID', label: '不设置深度转化' }, { value: 'DEEP_BID', label: '深度出价' }, { value: 'PAY_ROI', label: '付费 ROI' }] });
  },
  // 异常事件资产
  async abnormalAssets() {
    return mockOk({ list: clone(openapiDb.abnormalAssets) });
  },
  // 回传鉴权公钥 /event_manager/auth/*
  async publicKeyList() {
    return mockOk({ list: clone(openapiDb.publicKeys) });
  },
  async publicKeyCreate(payload) {
    return mockOk({ public_key_id: nextId('PK'), status: 'ENABLED', ...payload });
  },
  async publicKeyDelete(id) {
    return mockOk({ ok: true, public_key_id: id });
  },
  // 实时归因 / 回传状态
  async attributionStatus() {
    return mockOk({ real_time_attribution: 'ENABLED', callback_status: 'NORMAL' });
  },
};

// ============ 9. 报表（扩展，不替换现有 reportApi） ============
export const openReportApi = {
  // /report/advertiser/get/ 账户同步明细
  async advertiserReport(params = {}) {
    return mockOk(paginate(mockDb.reportRows, params));
  },
  // /report/custom/config/get/ 可用指标 / 维度
  async customConfig() {
    return mockOk({
      metrics: ['stat_cost', 'show_cnt', 'click_cnt', 'ctr', 'cpm', 'cpc', 'convert_cnt', 'convert_cost', 'convert_rate', 'deep_cnt', 'deep_cost', 'deep_rate', 'pay_roi', 'gmv'],
      dimensions: ['advertiser_id', 'project_id', 'promotion_id', 'creative_id', 'material_id', 'stat_time_day', 'age', 'gender', 'region', 'inventory_type'],
    });
  },
  // /report/custom/get/ 自定义报表
  async customReport(params = {}) {
    return mockOk(paginate(mockDb.projectReportRows, params));
  },
  // 异步报表 /report/custom/async_task/*
  async asyncTaskList(params = {}) {
    return mockOk(paginate(openapiDb.reportAsyncTasks, params));
  },
  async asyncTaskCreate(payload) {
    return mockOk({ task_id: nextId('RPT'), task_status: 'CREATED', ...payload });
  },
  async asyncTaskDownload(taskId) {
    return mockOk({ task_id: taskId, download_url: '#', status: 'SUCCESS' });
  },
  // 直播 /report/live_room/*
  async liveReport(type = 'analysis') {
    return mockOk({ type, list: clone(openapiDb.liveReports) });
  },
  // RTA 报表 /report/rta/get/
  async rtaReport() {
    return mockOk({ list: clone(openapiDb.rtaReportRows) });
  },
  // 星广联 /report/stardelivery/*
  async stardeliveryReport() {
    return mockOk({ list: clone(openapiDb.stardeliveryTasks) });
  },
};

// ============ 10. 运营调控工具 ============
export const toolApi = {
  // /tools/quota/get/ 在投配额
  async quota() {
    return mockOk({ total: 100, in_delivery: 24, learning: 6, remain: 70 });
  },
  // 一键起量 /tools/promotion_raise/*
  async promotionRaiseList(params = {}) {
    return mockOk(paginate(openapiDb.raiseTasks.filter((r) => r.type === 'PROMOTION_RAISE'), params));
  },
  async promotionRaiseCreate(payload) {
    return mockOk({ raise_id: nextId('RS'), status: 'RAISING', ...payload });
  },
  // 素材起量 /tools/material_raise/*
  async materialRaiseList(params = {}) {
    return mockOk(paginate(openapiDb.raiseTasks.filter((r) => r.type === 'MATERIAL_RAISE'), params));
  },
  // 优选起量 /tools/task_raise/*
  async taskRaiseList(params = {}) {
    return mockOk(paginate(openapiDb.controlTasks.filter((c) => c.task_type === 'MATERIAL_RAISE'), params));
  },
  // 智擎调控任务 /oc_project/tools_audience|keyword|material_raise/*
  async controlTaskList(type, params = {}) {
    const list = openapiDb.controlTasks.filter((c) => !type || c.task_type === type);
    return mockOk(paginate(list, params));
  },
  async controlTaskCreate(payload) {
    return mockOk({ task_id: nextId('CT'), status: 'ENABLED', ...payload });
  },
  async controlTaskUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async controlTaskRemove(id) {
    return mockOk({ ok: true, task_id: id });
  },
  // 诊断建议 /tools/diagnosis/*
  async diagnosis(objectType, objectId) {
    const d = openapiDb.diagnoses[0];
    return mockOk({ object_type: objectType, object_id: objectId, list: clone(openapiDb.diagnoses), top: clone(d) });
  },
  async diagnosisAccept(id) {
    return mockOk({ ok: true, diagnosis_id: id, accept_status: 'ACCEPTED' });
  },
  // 拒审素材 AI 修复 /reject_material/ai_repair/*
  async rejectRepair(materialId) {
    return mockOk({ task_id: nextId('REP'), material_id: materialId, status: 'CREATED' });
  },
  // 否定词 /tools/privative_word/*
  async privativeWordList(params = {}) {
    return mockOk(paginate(openapiDb.negWords, params));
  },
  async privativeWordCreate(payload) {
    return mockOk({ word_id: nextId('NW'), status: 'ENABLED', ...payload });
  },
  async privativeWordRemove(id) {
    return mockOk({ ok: true, word_id: id });
  },
  // RTA /tools/rta/*
  async rtaList(params = {}) {
    return mockOk(paginate(openapiDb.rtaStrategies, params));
  },
  async rtaBind(payload) {
    return mockOk({ ok: true, strategy_id: nextId('RTA'), ...payload });
  },
  async rtaUnbind(id) {
    return mockOk({ ok: true, strategy_id: id, status: 'UNBOUND' });
  },
  // 穿山甲流量包 /tools/union/flow_package/*
  async unionPackageList(params = {}) {
    return mockOk(paginate(mockDb.csjPackages, params));
  },
  async unionPackageCreate(payload) {
    return mockOk({ package_id: nextId('UPK'), status: 'ENABLED', ...payload });
  },
  async unionPackageUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  async unionPackageRemove(id) {
    return mockOk({ ok: true, package_id: id });
  },
  // 动态创意词包 /tools/creative_word/*
  async wordPackList(params = {}) {
    return mockOk(paginate(openapiDb.dpaDictWords, params));
  },
  async wordPackCreate(payload) {
    return mockOk({ word_pack_id: nextId('WP'), status: 'ENABLED', ...payload });
  },
  async wordPackUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // 抖音号 /tools/ies_account_search|aweme_auth/*
  async awemeSearch(keyword) {
    return mockOk({ keyword, list: clone(openapiDb.awemeAccounts) });
  },
  async awemeAuthList(params = {}) {
    return mockOk(paginate(openapiDb.awemeAccounts, params));
  },
  async awemeRenew(awemeId) {
    return mockOk({ ok: true, aweme_id: awemeId, auth_status: 'AUTHORIZED' });
  },
  async awemeUnbind(awemeId) {
    return mockOk({ ok: true, aweme_id: awemeId, auth_status: 'UNAUTHORIZED' });
  },
  async awemeShare(awemeId) {
    return mockOk({ ok: true, aweme_id: awemeId, share_status: 'SHARED' });
  },
  // 操作日志 /tools/log_search/*
  async logSearch(params = {}) {
    return mockOk(paginate(openapiDb.auditLogs, params));
  },
  // 合规积分 /security/score_*
  async scoreList(params = {}) {
    return mockOk(paginate(openapiDb.scoreViolations, params));
  },
  // 建议出价 /tools/bids/suggest/
  async bidSuggest(params) {
    return mockOk({ suggest_bid: 30.0, bid_range: [20.0, 45.0], ...params });
  },
  // 预览二维码 /tools/ad_preview/qrcode_get/
  async previewQrcode(id) {
    return mockOk({ object_id: id, qrcode_url: '#', expire_at: Date.now() + 3600000 });
  },
  // 消息配置 /tools/notification/*
  async notificationList() {
    return mockOk({ list: clone(openapiDb.notifications) });
  },
  // AB 实验 /tools/ab_test/*
  async abTestList() {
    return mockOk({ list: clone(openapiDb.abTests) });
  },
};

// ============ 11. 关键词 ============
export const keywordApi = {
  // /keyword/list/get/
  async list(params = {}) {
    return mockOk(paginate(openapiDb.keywords, params));
  },
  // /keyword/create/
  async create(payload) {
    return mockOk({ ok: true, words: Array.isArray(payload.words) ? payload.words : [payload.word] });
  },
  // /keyword/update/
  async update(payload) {
    return mockOk({ ok: true, ...payload });
  },
  // /keyword/delete/
  async remove(words) {
    return mockOk({ ok: true, words });
  },
  // /sugg_words/ 推荐词
  async suggest(keyword) {
    return mockOk({ keyword, list: [{ value: '免费短剧推荐', label: '免费短剧推荐' }, { value: '爽文逆袭全集', label: '爽文逆袭全集' }] });
  },
  // 蓝海词包
  async blueOcean() {
    return mockOk({ list: clone(openapiDb.dpaDictWords) });
  },
};

// ============ 12. 巨量资产扩展：组件 / 锚点 / 图集 / 评论 / 试玩 / 小程序 ============
export const assetExtApi = {
  // 创意组件 /assets/creative_component/get·create·update/
  componentList(params = {}) {
    return mockOk(paginate(mockDb.adComponents, params));
  },
  componentCreate(payload) {
    return mockOk({ component_id: nextId('CC'), status: 'SUCCESS', ...payload });
  },
  componentUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  componentRemove(id) {
    return mockOk({ ok: true, component_id: id });
  },

  // 原生锚点 /native_anchor/get·create·update·delete/
  anchorList(params = {}) {
    return mockOk(paginate(mockDb.anchors, params));
  },
  anchorCreate(payload) {
    return mockOk({ anchor_id: nextId('AN'), status: 'SUCCESS', ...payload });
  },
  anchorUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  anchorRemove(id) {
    return mockOk({ ok: true, anchor_id: id });
  },

  // 图集 /carousel/create·list·ad/get·delete·update/
  albumList(params = {}) {
    return mockOk(paginate(mockDb.albums, params));
  },
  albumCreate(payload) {
    return mockOk({ album_id: nextId('ALB'), status: 'SUCCESS', ...payload });
  },
  albumUpdate(payload) {
    return mockOk({ ok: true, ...payload });
  },
  albumRemove(id) {
    return mockOk({ ok: true, album_id: id });
  },

  // 评论管理 /tools/comment/get·reply·operate·hide/
  commentList(params = {}) {
    return mockOk(paginate(mockDb.commentMgmt, params));
  },
  commentReply(payload) {
    return mockOk({ ok: true, comment_id: nextId('CMT'), reply: payload.reply, ...payload });
  },
  commentHide(id) {
    return mockOk({ ok: true, comment_id: id, status: 'HIDDEN' });
  },

  // 试玩/直玩素材 /tools/playable_list/get·upload·grant/
  playableList(params = {}) {
    return mockOk(paginate(mockDb.interactiveMaterials, params));
  },
  playableUpload(payload) {
    return mockOk({ material_id: nextId('PLAY'), status: 'SUCCESS', ...payload });
  },
  playableGrant(id, accountIds) {
    return mockOk({ ok: true, material_id: id, advertiser_ids: accountIds });
  },

  // 小程序/小游戏 /tools/wechat_applet·wechat_game·micro_app/create·list/
  miniCreate(payload) {
    return mockOk({ appid: nextId('APP'), status: 'SUCCESS', ...payload });
  },

  // 短剧推广链接 /dpa/playlet/auth·album/create/
  dramaLinkCreate(payload) {
    return mockOk({ drama_id: nextId('D'), status: 'SUCCESS', ...payload });
  },
};

