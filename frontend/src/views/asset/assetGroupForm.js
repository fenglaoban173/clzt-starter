// 资产组「新建 / 编辑」抽屉表单规格
// 来源：创量标准版 /property/toutiao/asset-group → 新建资产组 抽屉（线上 DOM 逐状态采集）
// 采集到的字段 API 名：name / alias / asset_group_type / advertiser_id /
//   micro_promotion_type / micro_app.micro_app_instance_id / micro_app_link /
//   delivery_content_type / product_lib_version / product_platform_id / product_id /
//   track_url / action_track_url / video_play_track_url / video_play_done_track_url /
//   video_play_effective_track_url / open_url_type / open_url / ulink /
//   landing_source / site_url / cl_site_template_id / playlet_series_url
//
// 关键联动（线上实测）：
//   ① 资产组类型 切换 → 「投放内容」整段的字段集在小程序/小游戏 与 电商 之间互换
//   ② 媒体账户 未选 → 「选择微信小游戏」「选择已有商品ID」按钮置灰（is-disabled）
//   ③ 小程序/小游戏 + 类型=字节小游戏/字节小程序 → 落地页段出现「落地页方式」单选
//   ④ 小程序/小游戏 + 类型=抖音号 → 落地页段只剩「端原生链接」
//   ⑤ 电商 → 巨量商品段多出「商品库版本」单选，且商品ID为必填
//   ⑥ 电商 → 多出「直达链接」段，直达链接类型决定 Deeplink / Ulink 输入组

export const MICRO_PROMOTION_TYPES = [
  { label: '微信小游戏', value: 'WECHAT_GAME' },
  { label: '微信小程序', value: 'WECHAT_APP' },
  { label: '字节小游戏', value: 'BYTE_GAME' },
  { label: '字节小程序', value: 'BYTE_APP' },
  { label: '抖音号', value: 'AWEME' },
];

export const ASSET_GROUP_TYPES = [
  { label: '小程序/小游戏', value: '1' },
  { label: '电商', value: '2' },
];

export const DELIVERY_CONTENT_TYPES = [
  { label: '自研落地页', value: 'THIRDPARTY' },
  { label: '橙子落地页', value: 'ORANGE' },
];

export const PRODUCT_LIB_VERSIONS = [
  { label: '新版商品库', value: 'NEW' },
  { label: '旧版商品库', value: 'OLD' },
];

export const OPEN_URL_TYPES = [
  { label: '不启用', value: 'OFF' },
  { label: 'Deeplink直达链接', value: 'DEEP_LINK' },
  { label: 'Deeplink+Ulink直达链接', value: 'DEEP_LINK_AND_ULINK' },
  { label: 'Ulink直达链接', value: 'ULINK' },
];

export const LANDING_SOURCES = [
  { label: '直填 URL', value: 'URL' },
  { label: '选择创量落地页模板', value: 'TEMPLATE' },
];

export const MICRO_LABEL = MICRO_PROMOTION_TYPES.reduce((m, o) => { m[o.value] = o.label; return m; }, {});
export const DELIVERY_LABEL = DELIVERY_CONTENT_TYPES.reduce((m, o) => { m[o.value] = o.label; return m; }, {});

/** 新建时的表单初值（与线上一致：小程序/小游戏 + 微信小游戏 + 不启用直达链接 + 直填 URL） */
export function emptyAssetGroupForm() {
  return {
    name: '',
    alias: '',
    asset_group_type: '1',
    advertiser_id: '',
    micro_promotion_type: 'WECHAT_GAME',
    micro_app_id: '',
    micro_app_name: '',
    micro_app_link: '',
    delivery_content_type: '',
    product_lib_version: 'NEW',
    product_platform_id: '',
    product_id: '',
    track_url: '',
    action_track_url: '',
    video_play_track_url: '',
    video_play_done_track_url: '',
    video_play_effective_track_url: '',
    open_url_type: 'OFF',
    open_url: [],
    ulink: [],
    landing_source: 'URL',
    site_url: '',
    cl_site_template_id: '',
    playlet_series_url: '',
  };
}

/**
 * 根据当前表单状态生成抽屉的分区与字段（表单联动都在这里定义）。
 * @param {object} form 当前表单值
 * @returns {{title:string, fields:object[]}[]}
 */
export function assetGroupSections(form) {
  const isEcom = form.asset_group_type === '2';
  const microType = form.micro_promotion_type;
  const microName = MICRO_LABEL[microType];
  const isByte = microType === 'BYTE_GAME' || microType === 'BYTE_APP';
  const sections = [];

  // —— 资产组基础设置 ——
  sections.push({
    title: '资产组基础设置',
    fields: [
      { key: 'name', label: '资产组名称', type: 'text', maxLength: 50, counter: true },
      { key: 'alias', label: '资产组别名', type: 'text', maxLength: 50, counter: true },
      { key: 'asset_group_type', label: '资产组类型', type: 'radio', required: true, options: ASSET_GROUP_TYPES },
      {
        key: 'advertiser_id', label: '媒体账户', type: 'select', source: 'accounts',
        placeholder: '请输入账户名称（不填则不限）',
      },
    ],
  });

  // —— 投放内容（资产组类型决定整段内容）——
  const delivery = [];
  if (!isEcom) {
    delivery.push({
      key: 'micro_promotion_type', label: '类型', type: 'radio', required: true,
      options: MICRO_PROMOTION_TYPES,
    });
    if (microName && microType !== 'AWEME') {
      delivery.push({
        key: 'micro_app_id', label: microName, type: 'picker',
        buttonText: `选择${microName}`, requiresAccount: true,
      });
      delivery.push({
        key: 'micro_app_link', label: `${microName}链接`, type: 'input-button',
        placeholder: '微信小程序、微信小游戏从组件中自动关联',
        buttonText: isByte ? '选择已有链接' : null,
        readonly: !isByte,
      });
    }
  } else {
    delivery.push({
      key: 'delivery_content_type', label: '投放内容', type: 'radio', required: true,
      options: DELIVERY_CONTENT_TYPES,
    });
  }
  sections.push({ title: '投放内容', fields: delivery });

  // —— 巨量商品 ——
  const goods = [];
  if (isEcom) {
    goods.push({
      key: 'product_lib_version', label: '商品库版本', type: 'radio',
      options: PRODUCT_LIB_VERSIONS,
    });
  }
  goods.push({
    key: 'product_platform_id', label: '巨量商品库ID', type: 'input-button',
    buttonText: '选择已有商品ID', requiresAccount: true,
    placeholder: isEcom ? '请填写巨量商品库ID' : '请填写巨量商品库ID（选填）',
    required: isEcom,
  });
  goods.push({
    key: 'product_id', label: '巨量商品ID', type: 'text',
    placeholder: isEcom ? '请填写巨量商品ID' : '请填写巨量商品ID（选填）',
    required: isEcom,
  });
  sections.push({ title: '巨量商品', fields: goods });

  // —— 监测链接 ——
  sections.push({
    title: '监测链接',
    fields: [
      { key: 'track_url', label: '展示监测链接', type: 'text', placeholder: '请填写展示监测链接（选填）' },
      { key: 'action_track_url', label: '有效触点链接', type: 'text', placeholder: '请填写有效触点链接（选填）' },
      { key: 'video_play_track_url', label: '视频播放链接', type: 'text', placeholder: '请填写视频播放链接（选填）' },
      { key: 'video_play_done_track_url', label: '视频播完链接', type: 'text', placeholder: '请填写视频播完链接（选填）' },
      { key: 'video_play_effective_track_url', label: '视频有效播放链接', type: 'text', placeholder: '请填写视频有效播放链接（选填）' },
    ],
  });

  // —— 直达链接（仅电商）——
  if (isEcom) {
    const links = [{
      key: 'open_url_type', label: '直达链接类型', type: 'radio', options: OPEN_URL_TYPES,
    }];
    if (form.open_url_type === 'DEEP_LINK' || form.open_url_type === 'DEEP_LINK_AND_ULINK') {
      links.push({
        key: 'open_url', label: 'Deeplink直达链接', type: 'link-list',
        placeholder: '请输入Deeplink直达链接', addText: '+ 添加直达链接',
      });
    }
    if (form.open_url_type === 'ULINK' || form.open_url_type === 'DEEP_LINK_AND_ULINK') {
      links.push({
        key: 'ulink', label: 'Ulink直达链接', type: 'link-list',
        placeholder: '请输入Ulink直达链接', addText: '+ 添加直达链接',
      });
    }
    sections.push({ title: '直达链接', fields: links });
  }

  // —— 落地页 ——
  const landing = [];
  if (!isEcom) {
    if (microType === 'AWEME') {
      landing.push({ key: 'playlet_series_url', label: '端原生链接', type: 'text', placeholder: '请填写端原生链接' });
    } else if (isByte) {
      landing.push({ key: 'landing_source', label: '落地页方式', type: 'radio', options: LANDING_SOURCES });
      if (form.landing_source === 'TEMPLATE') {
        landing.push({
          key: 'cl_site_template_id', label: '创量落地页模板', type: 'select-refresh',
          placeholder: '请输入模板名称', options: [],
        });
      } else {
        landing.push({ key: 'site_url', label: '橙子落地页链接', type: 'text', placeholder: '请填写橙子落地页链接' });
      }
    } else {
      landing.push({
        key: 'cl_site_template_id', label: '创量落地页模板', type: 'select-refresh',
        placeholder: '请输入模板名称', options: [],
      });
    }
  } else if (form.delivery_content_type === 'THIRDPARTY') {
    landing.push({ key: 'site_url', label: '第三方落地页URL', type: 'text', placeholder: '请填写第三方落地页URL', required: true });
  } else {
    landing.push({ key: 'site_url', label: '橙子落地页URL', type: 'text', placeholder: '请填写橙子落地页URL', required: true });
  }
  sections.push({ title: '落地页', fields: landing });

  return sections;
}

/** 表单校验（与线上一致：小程序/小游戏必填「类型」，电商必填「投放内容」及商品ID） */
export function validateAssetGroup(form, sections) {
  const isEcom = form.asset_group_type === '2';
  if (!String(form.name || '').trim()) return '请填写资产组名称';
  if (!isEcom && !form.micro_promotion_type) return '请选择类型';
  if (isEcom && !form.delivery_content_type) return '请选择投放内容类型';
  for (const sec of sections) {
    for (const f of sec.fields) {
      if (!f.required) continue;
      if (f.type === 'radio' || f.type === 'select') {
        if (!form[f.key]) return `请选择${f.label}`;
      } else if (f.type === 'link-list') {
        if (!(form[f.key] || []).length) return `请填写${f.label}`;
      } else if (!String(form[f.key] || '').trim()) {
        return `请填写${f.label}`;
      }
    }
  }
  return '';
}

/** 把抽屉表单转成列表行（用于本地 mock 列表回显） */
export function toAssetGroupRow(form, extra = {}) {
  const isEcom = form.asset_group_type === '2';
  const microName = MICRO_LABEL[form.micro_promotion_type];
  return {
    name: form.name,
    alias: form.alias,
    use_status: '未使用',
    account_name: extra.account_name || '',
    product_id: form.product_id || '',
    mini_type: isEcom ? DELIVERY_LABEL[form.delivery_content_type] || '' : (microName || ''),
    delivery_content: isEcom ? DELIVERY_LABEL[form.delivery_content_type] || '' : (microName || ''),
    link_type: OPEN_URL_TYPES.find((o) => o.value === form.open_url_type)?.label || '不启用',
    deeplink: (form.open_url || []).filter(Boolean).join(' , '),
    ulink: (form.ulink || []).filter(Boolean).join(' , '),
    mini_name: form.micro_app_name || '',
    mini_note: '',
    path_link: form.micro_app_link || '',
    valid_link: form.action_track_url || '',
    monitor_link: form.track_url || '',
    landing_link: form.site_url || '',
    native_link: form.playlet_series_url || '',
    cl_template: form.cl_site_template_id || '',
    creator: extra.creator || '当前用户',
    created_at: extra.created_at || '',
    updated_at: extra.updated_at || '',
  };
}
