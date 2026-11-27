/* 资产模块「线上实测」候选集 —— 与智投标准版「巨量广告·标准 → 资产」各页下拉选项一致。
 * 来源：智投线上 DOM 采集（2026-11-23），选项文案与顺序照抄。
 */

/** 媒体账户（线上 20 个账户，格式「账户名(广告主ID)」） */
export const ASSET_ACCOUNT_OPTIONS = [
  '北京高途云集教育科技有限公司--1(1861811345880074)',
  '百度文库-央广时代-拉新-搜索-01(1866877399870663)',
  '百度文库-央广时代-拉新-搜索-02(1866877399203047)',
  '百度文库-央广时代-拉新-搜索-03(1866849651765706)',
  '任意门-央广-代运营-36-安卓-UBA(1866489873996443)',
  '任意门-央广-代运营-22-安卓-UBA(1866489858950211)',
  '任意门-央广-代运营-23-安卓-UBA(1866489859578696)',
  '任意门-央广-代运营-10-ios-UBA(1866489860302024)',
  '任意门-央广-代运营-25-ios-UBA(1866489860976135)',
  '任意门-央广-代运营-30-ios-UBA(1866489864776836)',
  '上海得物信息集团有限公司1-50(1834419631681163)',
  '任意门-央广-代运营-27-安卓-UBA(1866489862625304)',
  '任意门-央广-代运营-31-安卓-UBA(1866489865523527)',
  '任意门-央广-代运营-38-安卓-UBA(1866489874950667)',
  '任意门-央广-代运营-33-安卓-UBA(1866489872328266)',
  '任意门-央广-代运营-32-ios-UBA(1866489871677514)',
  '百度文库-央广时代-拉新-搜索-04(1866877401293188)',
  '任意门-央广-代运营-28-安卓-UBA(1866489863429463)',
  '任意门-央广-代运营-35-iOS-UBA(1866489873385099)',
  '央广-621059846-百度文库-1(1866877405575303)',
];

/** 媒体账户（带表头「不限」，线上落地页/应用/直达链接口径） */
export const ASSET_ACCOUNT_OPTIONS_ALL = ['不限', ...ASSET_ACCOUNT_OPTIONS];

/* 直达链接 / 落地页 / 定向包页的媒体账户：线上同为 20 项，且无「不限」 */
export const ASSET_ACCOUNT_OPTIONS_LINK = ASSET_ACCOUNT_OPTIONS;

/** 所属人员 / 创建人员（线上 15 人，格式「姓名 (邮箱)」） */
export const ASSET_OWNER_OPTIONS = [
  '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)',
  '张从浩 (zhangconghao@ygsdmedia.com)',
  '王春雷 (wangchunlei@ygsdmedia.com)',
  '郭峻宇 (guojunyu@ygsdmedia.com)',
  '孙诗源 (sunshiyuan@ygsdmedia.com)',
  'gongwenqing (gongwenqing@ygsdmedia.com)',
  'lixue (lixue@ygsdmedia.com)',
  'jiangxin (jiangxin@ygsdmedia.com)',
  'chenpeihua (chenpeihua@ygsdmedia.com)',
  '1304275504 (1304275504@qq.com)',
  '文清滨 (wenqingbin@ygsdmedia.com)',
  '李若涵 (liruohan@ygsdmedia.com)',
  '杨浩蒙 (yanghaomeng@ygsdmedia.com)',
  '刘松涵 (liusonghan01@ygsdmedia.com)',
  '申旭阳 (shenxuyang@ygsdmedia.com)',
];

/** 智投项目（线上 4 项） */
export const ASSET_PROJECT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

/** 商品库类型（线上 36 项） */
export const ASSET_LIB_TYPE_OPTIONS = [
  '通用', '游戏', '旅游-酒店', '旅游-路线', '旅游-门票', '交通票务', '汽车', '房产',
  '招聘', '电商', '其他', '直播社交', '教育', '引流电商', '新汽车库', '视频咨询',
  '新房', '药品', '保险', '通信', '医疗服务', '信贷', '财富', '家居服务',
  '家具建材', '大额贷款', '旅行婚拍', '本地婚拍', '亲子摄影', '综合写真',
  '岗位库', '招商加盟', '美容美发', '特妆', '保健品', 'IAP短剧库',
];

/** 搜索「字段类型」下拉（线上 名称 / ID） */
export const ASSET_SEARCH_FIELDS = ['名称', 'ID'];
