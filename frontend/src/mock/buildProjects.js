// 「选择已有项目」抽屉的数据源（原型本地模拟）。
//
// 字段口径对齐线上「选择已有项目」抽屉（2026-11-17 实测）：
//   查询条件：推广目的 / 子目标 / 投放模式 / 营销场景 / 广告类型 / 星广联投 / 状态 / 名称(名称·ID)
//   表格列：项目名称和ID（名称 + 项目 ID）/ 推广目的 / 子目标 / 投放模式 / 营销场景 /
//   投放形式 / 展位 / 蓝海流量 / 穿山甲投放形式 / 星广联投任务 / 自动优先素材
//   （勾选「查看消耗/关联广告数」后追加：消耗 / 关联广告数 / 择优分配 / 平台类型）
//   当前项目摘要：推广目的 / 子目标 / 投放模式 / 营销场景 / 广告类型 / 投放类型 /
//   优化目标 / 竞价策略 / 择优分配 / 平台类型 / 投放形式 / 展位 / 蓝海流量
// account_id 对应 mediaApi.accounts() 返回的账户 id（100 起）。
const OBJECTIVE_SETS = [
  {
    objective: '应用推广', sub_objective: '应用下载', delivery_mode: '自动投放(UBMax)',
    marketing_goal: '短视频/图片', ad_type: '通投广告', delivery_form: '直接下载',
    position: '通投智选', platform_type: 'iOS', priority_allocation: '关闭',
    delivery_type: '常规投放', optimization_goal: '激活/无', bid_strategy: '稳定成本（常规版）',
  },
  {
    objective: '销售线索', sub_objective: '线索收集', delivery_mode: '手动投放',
    marketing_goal: '短视频/图片', ad_type: '搜索广告', delivery_form: '落地页',
    position: '通投智选', platform_type: 'Android', priority_allocation: '关闭',
    delivery_type: '常规投放', optimization_goal: '线索/无', bid_strategy: '最大转化',
  },
  {
    objective: '小程序', sub_objective: '小程序拉新', delivery_mode: '自动投放(UBMax)',
    marketing_goal: '直播', ad_type: '通投广告', delivery_form: '直接下载',
    position: '自动版位', platform_type: 'iOS', priority_allocation: '关闭',
    delivery_type: '放量投放', optimization_goal: '付费/无', bid_strategy: '稳定成本（常规版）',
  },
  {
    objective: '电商', sub_objective: '商品购买', delivery_mode: '手动投放',
    marketing_goal: '短视频/图片', ad_type: '搜索广告', delivery_form: '直播间',
    position: '通投智选', platform_type: 'Android', priority_allocation: '关闭',
    delivery_type: '常规投放', optimization_goal: '成交/无', bid_strategy: '成本上限',
  },
  {
    objective: '快应用', sub_objective: '快应用拉新', delivery_mode: '手动投放',
    marketing_goal: '短视频/图片', ad_type: '通投广告', delivery_form: '直接下载',
    position: '自动版位', platform_type: 'web', priority_allocation: '关闭',
    delivery_type: '控量投放', optimization_goal: '激活/无', bid_strategy: '最大转化',
  },
  {
    objective: '商品', sub_objective: '商品推广', delivery_mode: '手动投放',
    marketing_goal: '短视频/图片', ad_type: '搜索广告', delivery_form: '落地页',
    position: '通投智选', platform_type: 'iOS', priority_allocation: '关闭',
    delivery_type: '常规投放', optimization_goal: '成交/无', bid_strategy: '稳定成本（常规版）',
  },
  {
    objective: '内容营销', sub_objective: '内容互动', delivery_mode: '手动投放',
    marketing_goal: '直播', ad_type: '通投广告', delivery_form: '直播间',
    position: '自动版位', platform_type: 'iOS', priority_allocation: '关闭',
    delivery_type: '放量投放', optimization_goal: '粉丝/无', bid_strategy: '最大转化',
  },
];
// 状态口径：与线上「状态」查询条件的叶子项一致（启用中 / 已完成 + 未投放的 5 个子状态）
const STATUS_SETS = ['启用中', '已暂停', '未达投放时间', '不在投放时段', '项目超出预算', '预算组超出预算', '已完成'];
const BLUE_OCEAN_SETS = ['不开启', '开启'];
const CSJ_FORM_SETS = ['--', '短视频', '直播'];
const XING_TASK_SETS = ['--', '星广建站推广', '星广原生推广'];
const AUTO_MATERIAL_SETS = ['--', '开启'];

// 每个账户 7 个项目：逐一覆盖 7 个推广目的与 7 个状态叶子项，
// 保证「推广目的」「状态」「投放模式」等任一查询条件筛选后都有可见数据
export const existingProjects = [];
for (let acc = 100; acc <= 116; acc += 1) {
  for (let k = 0; k < OBJECTIVE_SETS.length; k += 1) {
    const set = OBJECTIVE_SETS[k];
    const pid = `186648986262${String(acc).slice(-3)}${String(k).padStart(2, '0')}`;
    existingProjects.push({
      id: `${pid}-拉新-08${k}`,
      project_id: `7676028022350${String(acc).padStart(3, '0')}${String(k).padStart(2, '0')}`,
      account_id: acc,
      name: `${pid}-拉新-08${k}`,
      objective: set.objective,
      sub_objective: set.sub_objective,
      delivery_mode: set.delivery_mode,
      marketing_goal: set.marketing_goal,
      ad_type: set.ad_type,
      delivery_type: set.delivery_type,
      optimization_goal: set.optimization_goal,
      bid_strategy: set.bid_strategy,
      delivery_form: set.delivery_form,
      position: set.position,
      blue_ocean: BLUE_OCEAN_SETS[(acc + k) % BLUE_OCEAN_SETS.length],
      csj_form: CSJ_FORM_SETS[(acc + k) % CSJ_FORM_SETS.length],
      xing_task: XING_TASK_SETS[(acc + k) % XING_TASK_SETS.length],
      auto_material: AUTO_MATERIAL_SETS[(acc + k) % AUTO_MATERIAL_SETS.length],
      cost: Number((12.5 + ((acc * 7 + k * 13) % 380)).toFixed(2)),
      ad_count: 3 + ((acc + k * 5) % 46),
      priority_allocation: set.priority_allocation,
      platform_type: set.platform_type,
      status: STATUS_SETS[k],
    });
  }
}

export function findExistingProject(id) {
  return existingProjects.find((p) => String(p.id) === String(id)) || null;
}
