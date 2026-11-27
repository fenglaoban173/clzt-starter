/**
 * 批量新建（R110）：本地任务中心存储
 * 「保存策略组 / 全部提交审核」要真的落库（本仓库无后端，落 localStorage），
 * 刷新后仍在，并且能在「批量操作任务」列表里查到。
 */

const SG_KEY = 'clzt_batch_strategy_groups';
const TASK_KEY = 'clzt_batch_tasks';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function write(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    /* 隐私模式 / 配额满：忽略，不影响页面其它功能 */
  }
}

function pad(n, w = 2) {
  return String(n).padStart(w, '0');
}

function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ------------------------------ 策略组 ------------------------------ */

/** 保存策略组 → 返回保存后的记录 */
export function saveStrategyGroup(payload = {}) {
  const list = read(SG_KEY);
  const record = {
    id: `sg_${Date.now()}`,
    name: payload.name || '未命名策略组',
    creator: payload.creator || '杨浩蒙',
    createdAt: stamp(),
    project: payload.project || '',
    accounts: payload.accounts || [],
    rule: payload.rule || '',
    adRule: payload.adRule || '',
    total: Number(payload.total || 0),
    plan: payload.plan || null,
  };
  write(SG_KEY, [record, ...list]);
  return record;
}

export function listStrategyGroups() {
  return read(SG_KEY);
}

export function removeStrategyGroup(id) {
  write(SG_KEY, read(SG_KEY).filter((x) => x.id !== id));
  return listStrategyGroups();
}

/* ------------------------------ 批量任务 ------------------------------ */

/**
 * 提交批量任务（全部提交审核）
 * 返回落库的任务记录数组，供「批量操作任务」列表展示
 */
export function submitBatchTasks(payload = {}) {
  const list = read(TASK_KEY);
  const now = new Date();
  const total = Number(payload.total || 0);
  const rows = [];
  let id = 12081360000 + list.length * 7;
  /* 同一次「全部提交审核」产生的多条记录共用一个 batchId：
     「批量操作任务」按条展示，「巨量广告」按任务聚合（成功 N / 失败 0）。 */
  const batchId = `bt_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
  for (let i = 0; i < Math.max(total, 1); i += 1) {
    id += 3;
    rows.push({
      id: String(id),
      batchId,
      name: payload.name || `批量新建-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      account: (payload.accounts || [])[0] || '-',
      accounts: payload.accounts || [],
      submitCount: 1,
      media: '巨量广告2.0',
      opType: payload.opType || '同步巨量通用版商品(升级版工作台)',
      creator: payload.creator || '杨浩蒙',
      createdAt: stamp(now),
      status: '执行完成',
      success: 1,
      fail: 0,
      detail: payload.detail || '',
      local: true,
    });
  }
  write(TASK_KEY, [...rows, ...list]);
  return rows;
}

export function listBatchTasks() {
  return read(TASK_KEY);
}

export function clearBatchTasks() {
  write(TASK_KEY, []);
}
