/* ------------------------------------------------------------------
 * 管理 · 智投项目 —— 项目与「关联账户」的 mock 数据层
 *
 * 线上对应：https://cl.mobgi.com/setting/cl-project/project-manage
 *   - 项目列表（项目管理页签）：项目名称 / 备注 / 项目负责人 / 创建人 /
 *     创建时间 / 关联账户数 / 操作
 *   - 「关联账户」弹窗：查询条件（广告主名称 / 广告主id 批量 / 账户主体名称）
 *     + 广告主列表（广告主id / 广告主名称 / 账户主体名称）
 *
 * 数据写在本模块（而非组件内），保证「关联账户」提交后刷新页面仍然保留。
 * ------------------------------------------------------------------ */

/** 智投项目（线上 4 条，文案逐字照抄） */
const projectRows = [
  { id: 1, name: '知乎小说', remark: '知乎小说时报', owner: '刘松涵', creator: '杨浩蒙', createTime: '2026-09-15 11:27:27', accountCount: 71, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 2, name: '漫剧端原生', remark: '', owner: '申旭阳', creator: '北京央广时代文化传播有限公司', createTime: '2026-09-07 20:34:59', accountCount: 0, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 3, name: 'soul', remark: '', owner: '', creator: '北京央广时代文化传播有限公司', createTime: '2026-06-09 09:26:13', accountCount: 12, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 4, name: '百度文库', remark: '1', owner: '', creator: '北京央广时代文化传播有限公司', createTime: '2026-06-09 09:09:59', accountCount: 3, visibility: 'all', members: [], deepRequired: false, prevent: null },
];

/* ---------- 账户主体（账户主体名称下拉候选） ---------- */
const subjects = [
  '百度在线网络技术（北京）有限公司',
  '北京简途云集教育科技有限公司',
  '北京蕾盟盛通文化发展有限公司',
  '北京笔墨留存科技有限公司海淀第一分公司',
  '北京百度网讯科技有限公司',
  '北京智者天下科技有限公司北京第二分公司',
  '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司',
  '北京高途云集教育科技有限公司',
  '上海得物信息集团有限公司',
];

/* ---------- 广告主（弹窗列表数据源） ----------
 * advertiser_id = 广告主id / name = 广告主名称 / subject = 账户主体名称
 */
const advertiserSeed = [
  ['北京高途云集教育科技有限公司--1', '1861811345880074', '北京高途云集教育科技有限公司'],
  ['百度文库-央广时代-拉新-搜索-01', '1866877399870663', '北京百度网讯科技有限公司'],
  ['百度文库-央广时代-拉新-搜索-02', '1866877399203047', '百度在线网络技术（北京）有限公司'],
  ['百度文库-央广时代-拉新-搜索-03', '1866849651765706', '北京百度网讯科技有限公司'],
  ['任意门-央广-代运营-36-安卓-UBA', '1866489873996443', '北京智者天下科技有限公司'],
  ['任意门-央广-代运营-22-安卓-UBA', '1866489858950211', '北京智者天下科技有限公司北京第一分公司'],
  ['任意门-央广-代运营-23-安卓-UBA', '1866489859578696', '北京智者天下科技有限公司北京第二分公司'],
  ['任意门-央广-代运营-10-ios-UBA', '1866489860302024', '北京蕾盟盛通文化发展有限公司'],
  ['任意门-央广-代运营-25-ios-UBA', '1866489860976135', '北京笔墨留存科技有限公司海淀第一分公司'],
  ['任意门-央广-代运营-30-ios-UBA', '1866489864776836', '北京简途云集教育科技有限公司'],
  ['上海得物信息集团有限公司1-50', '1834419631681163', '上海得物信息集团有限公司'],
  ['任意门-央广-代运营-27-安卓-UBA', '1866489862625304', '北京智者天下科技有限公司'],
  ['任意门-央广-代运营-31-安卓-UBA', '1866489865523527', '北京高途云集教育科技有限公司'],
  ['任意门-央广-代运营-38-安卓-UBA', '1866489874950667', '百度在线网络技术（北京）有限公司'],
  ['任意门-央广-代运营-33-安卓-UBA', '1866489872328266', '北京百度网讯科技有限公司'],
  ['任意门-央广-代运营-32-ios-UBA', '1866489871677514', '北京智者天下科技有限公司北京第一分公司'],
  ['百度文库-央广时代-拉新-搜索-04', '1866877401293188', '北京蕾盟盛通文化发展有限公司'],
  ['任意门-央广-代运营-28-安卓-UBA', '1866489863429463', '北京简途云集教育科技有限公司'],
  ['任意门-央广-代运营-35-iOS-UBA', '1866877399923047', '北京高途云集教育科技有限公司'],
  ['央广-621059846-百度文库-1', '1866877405575303', '北京笔墨留存科技有限公司海淀第一分公司'],
  ['央广-智者天下-知乎-APP内付费-03', '1868960752026635', '北京智者天下科技有限公司'],
  ['央广-智者天下-知乎-APP内付费-08', '1868960753322139', '北京智者天下科技有限公司北京第一分公司'],
  ['央广-智者天下-知乎-APP内付费-16', '1868960753916265', '北京智者天下科技有限公司北京第二分公司'],
  ['央广-智者天下-知乎-APP内付费-06', '1868960756064715', '北京百度网讯科技有限公司'],
  ['央广-智者天下-知乎-APP内付费-05', '1868960757562376', '百度在线网络技术（北京）有限公司'],
  ['央广-智者天下-知乎-APP内付费-07', '1868960761547972', '北京高途云集教育科技有限公司'],
  ['央广-智者天下-知乎-APP内付费-02', '1868960762380359', '上海得物信息集团有限公司'],
  ['央广-智者天下-知乎-APP内付费-01', '1868960763913927', '北京蕾盟盛通文化发展有限公司'],
  ['央广-智者天下-知乎-APP内付费-15', '1868960765999176', '北京简途云集教育科技有限公司'],
  ['央广-智者天下-知乎-APP内付费-14', '1868960766734343', '北京笔墨留存科技有限公司海淀第一分公司'],
];

const advertisers = advertiserSeed.map(([name, advertiser_id, subject], i) => ({
  id: `adv_${i + 1}`,
  advertiser_id,
  name,
  subject,
}));

/* ---------- 项目 ↔ 关联账户的映射 ----------
 * key = 项目 id，value = 已关联的广告主 id 数组。
 * 初始值与线上「关联账户数」列一致（知乎小说 12、soul 6、百度文库 3、漫剧端原生 0）。
 * 每个项目的已关联账户取连续一段，方便在弹窗里区分「已关联 / 未关联」两组数据。
 */
const linkedAccounts = {
  1: advertisers.slice(0, 12).map((a) => a.advertiser_id),
  2: [],
  3: advertisers.slice(12, 18).map((a) => a.advertiser_id),
  4: advertisers.slice(18, 21).map((a) => a.advertiser_id),
};

const clone = (v) => JSON.parse(JSON.stringify(v));

/* ------------------------------ API ------------------------------ */

/** 智投项目列表 */
export async function fetchProjects() {
  await delay(120);
  const list = clone(projectRows).map((p) => ({
    ...p,
    accountCount: (linkedAccounts[p.id] || []).length,
  }));
  return { code: 0, message: 'ok', data: { list, total: list.length } };
}

/** 广告主候选列表（弹窗表格数据源） */
export async function fetchAdvertisers() {
  await delay(120);
  const list = clone(advertisers);
  return { code: 0, message: 'ok', data: { list, total: list.length } };
}

/** 账户主体候选（弹窗「账户主体名称」下拉） */
export async function fetchAccountSubjects() {
  await delay(80);
  return { code: 0, message: 'ok', data: { list: clone(subjects) } };
}

/** 某项目已关联的广告主 id 列表（弹窗打开时回显用） */
export async function fetchLinkedAccounts(projectId) {
  await delay(60);
  return { code: 0, message: 'ok', data: { list: clone(linkedAccounts[projectId] || []) } };
}

/**
 * 保存某项目的关联账户
 * @param {number|string} projectId
 * @param {string[]} advertiserIds 已勾选的广告主 id
 */
export async function saveLinkedAccounts(projectId, advertiserIds) {
  await delay(150);
  linkedAccounts[projectId] = clone(advertiserIds);
  return { code: 0, message: 'ok', data: { project_id: projectId, count: advertiserIds.length } };
}

/** 新增项目（写回 mock 层） */
export async function createProject(payload) {
  await delay(120);
  const id = Math.max(...projectRows.map((p) => p.id)) + 1;
  projectRows.unshift({
    id,
    name: payload.name,
    remark: payload.remark,
    owner: payload.owner,
    creator: '北京央广时代文化传播有限公司',
    createTime: formatNow(),
    accountCount: 0,
    visibility: payload.visibility,
    members: payload.members,
    deepRequired: payload.deepRequired,
    forbidOutside: payload.forbidOutside,
    prevent: payload.prevent,
  });
  linkedAccounts[id] = [];
  return { code: 0, message: 'ok', data: { id } };
}

/** 编辑项目（写回 mock 层） */
export async function updateProject(payload) {
  await delay(120);
  const target = projectRows.find((p) => p.id === payload.id);
  if (target) Object.assign(target, payload);
  return { code: 0, message: 'ok', data: { id: payload.id } };
}

/** 删除项目（写回 mock 层） */
export async function deleteProject(id) {
  await delay(100);
  const i = projectRows.findIndex((p) => p.id === id);
  if (i > -1) projectRows.splice(i, 1);
  delete linkedAccounts[id];
  return { code: 0, message: 'ok', data: { id } };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
