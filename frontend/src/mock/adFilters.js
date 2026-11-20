// 广告列表「查询条件」的候选项：与创量广告·广告列表页（cl.mobgi.com/promotion/ad/toutiaoupgrade/ad）保持一致。
// 2026-11 线上逐个下拉抓取的结果；媒体账户 / 项目 为账号相关数据，本地取模拟数据。

// 智投项目（线上原为「创量项目」）
export const AD_CL_PROJECTS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];
// 创量产品（仅作模拟数据字段，筛选栏按 R35 要求不展示）
export const AD_CL_PRODUCTS = ['测试商品', '测试安卓应用(android)'];
// 优化师
export const AD_OPTIMIZERS = [
  '北京央广时代文化传播有限公司', '张从浩', '王春雷', '郭峻宇', '孙诗源', 'gongwenqing',
  'lixue', 'jiangxin', 'chenpeihua', '1304275504', '文清滨', '李若涵', '杨浩蒙', '刘松涵', '申旭阳',
];
// 账户主体
export const AD_SUBJECTS = [
  '百度在线网络技术（北京）有限公司',
  '北京高途云集教育科技有限公司',
  '北京雷盟盛通文化发展有限公司',
  '北京笔墨留香科技有限公司海淀第一分公司',
  '北京百度网讯科技有限公司',
  '北京智者天下科技有限公司北京第二分公司',
  '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司',
  '上海置潮信息科技有限公司',
  '上海得物信息集团有限公司',
  '上海任意门科技有限公司',
  'UG-端原生IAA-漫剧-免费roi-24020',
];
// 推广目的
export const AD_PURPOSES = ['应用推广', '销售线索收集', '电商', '直播间', '商品', '快应用', '内容营销', '小程序'];
// 投放模式
export const AD_DELIVERY_MODES = ['全部', '手动投放', '自动投放(UBMax)'];
// 状态
export const AD_STATUSES = ['不限', '投放中', '未投放', '已终止', '已完成', '已删除', '不限(包含已删除)'];
// 诊断建议
export const AD_DIAGNOSIS = [
  '低效素材无法跑量', '出价潜力', '活跃度低', '活跃度低广告', '相似广告挤压严重',
  '空耗', '素材重复无法跑量', '预估学习期失败率高', '预估活跃度低', '预估空耗',
];
// 策略组
export const AD_STRATEGY_GROUPS = ['无数据'];
// 广告类型
export const AD_AD_TYPES = ['不限', '通投广告', '搜索广告'];
// 学习期状态
export const AD_LEARN_STATUSES = ['不限', '学习期中', '学习期结束', '学习期失败'];
// 星广联投
export const AD_STAR_FLAGS = ['是', '否'];
// 平台
export const AD_PLATFORMS = ['不限', 'Android', 'IOS'];
// 优化目标 / 深度优化目标（线上为同一集合）
export const AD_OPT_GOALS = [
  '无', '点击量', '展示量', '电话拨打', '表单提交', '地图搜索', '下载完成',
  '按钮跳转', 'xpath类型转换', '关键页面浏览',
];
export const AD_DEEP_OPT_GOALS = [...AD_OPT_GOALS];
// 深度优化方式（线上第 3、5 项同名「自动优化」，原样保留）
export const AD_DEEP_OPT_MODES = [
  '无', '留存天数', '自动优化', '自定义双出价', '自动优化', 'ROI系数',
  '每次付费', 'ROI直投（ROI系数）', 'ROI三出价', '支付ROI',
];
// 创意素材（线上仅有「无数据」，本地补充模拟素材名）
export const AD_MATERIALS = ['无数据', '漫剧开场-竖版-01', '漫剧冲突点-竖版-02', '产品演示-横版-03', '口播引流-竖版-04'];

// 广告列表「批量操作」可选项（线上批量操作下拉，20 项：R77 移除「修改多直达链接」「修改来源」；R78 移除「修改字节小程序/小游戏链接」「修改短剧专辑链接」）
export const AD_BATCH_OPS = [
  '启用',
  '暂停',
  '删除',
  '修改预算',
  '修改出价',
  '修改深度出价',
  '修改ROI系数',
  '修改创意',
  '开启一键起量',
  '修改落地页',
  '修改直达链接',
  '修改广告标题和素材',
  '修改时段',
  '修改附加创意组件',
  '修改广告否定词',
  '修改产品名称',
  '修改产品主图',
  '修改直达备用链接',
  '修改产品卖点',
  '批量修改广告名称',
];

// 批量操作：线上点击后仅提示、不弹窗的项（所选广告类型不支持该操作）
export const AD_BATCH_OP_TOASTS = {
  修改深度出价: '所选广告不支持修改深度转化出价！',
  修改ROI系数: '所选广告无ROI系数，操作取消！',
};

// 广告列表「查询条件」筛选项定义（顺序与线上一致）
// kind: select 下拉 / multi 多选下拉 / account 媒体账户选择器 / material 素材选择器
//       / cascader 级联 / input 输入框 / daterange 日期区间
// def：未选择时的默认展示文案；options：候选项
export const AD_FILTER_DEFS = [
  { key: 'clProject', label: '智投项目', kind: 'multi', def: '全部', width: 200, source: 'project', options: AD_CL_PROJECTS },
  { key: 'optimizer', label: '优化师', kind: 'multi', def: '所有', width: 180, options: AD_OPTIMIZERS },
  { key: 'account', label: '媒体账户', kind: 'account', def: '所有账户', width: 240 },
  { key: 'subject', label: '账户主体', kind: 'multi', def: '所有主体', width: 240, options: AD_SUBJECTS },
  { key: 'purpose', label: '推广目的', kind: 'select', def: '所有推广目的', width: 230, options: AD_PURPOSES },
  { key: 'deliveryMode', label: '投放模式', kind: 'select', def: '全部', width: 200, options: AD_DELIVERY_MODES },
  {
    key: 'campaign', label: '项目', kind: 'multi', def: '请输入项目名称搜索', width: 240,
    source: 'campaign_name', filterable: true, searchIcon: true,
  },
  { key: 'status', label: '状态', kind: 'select', def: '不限', width: 180, options: AD_STATUSES },
  { key: 'diagnosis', label: '诊断建议', kind: 'multi', def: '不限', width: 220, options: AD_DIAGNOSIS },
  { key: 'strategy', label: '策略组', kind: 'multi', def: '不限', width: 180, options: AD_STRATEGY_GROUPS },
  { key: 'createTime', label: '创建日期', kind: 'daterange', width: 300 },
  { key: 'adType', label: '广告类型', kind: 'select', def: '不限', width: 200, source: 'ad_type', options: AD_AD_TYPES },
  { key: 'learn', label: '学习期状态', kind: 'select', def: '不限', width: 180, options: AD_LEARN_STATUSES },
  { key: 'star', label: '星广联投', kind: 'select', def: '全部', width: 180, options: AD_STAR_FLAGS },
  { key: 'starTaskId', label: '星广联任务ID', kind: 'input', placeholder: '请输入星广联任务ID', width: 230 },
  { key: 'platform', label: '平台', kind: 'select', def: '不限', width: 180, options: AD_PLATFORMS },
  { key: 'optGoal', label: '优化目标', kind: 'multi', def: '所有', width: 200, source: 'opt_goal', options: AD_OPT_GOALS },
  { key: 'deepGoal', label: '深度优化目标', kind: 'multi', def: '所有', width: 220, source: 'deep_goal', options: AD_DEEP_OPT_GOALS },
  { key: 'deepMode', label: '深度优化方式', kind: 'multi', def: '所有', width: 220, source: 'deep_mode', options: AD_DEEP_OPT_MODES },
  { key: 'material', label: '创意素材', kind: 'material', def: '请选择素材', width: 200, source: 'material' },
];
