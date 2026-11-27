<template>
  <!-- 线上「智投定向包」整页抽屉（1136px）：
   *   抽屉顶部：筛选行（智投项目 / 产品 / 定向包类型 → 定向包名称 + 关键词 + 查询 + 清空）+ 4 条橙色说明；
   *   白色卡片「选择智投定向包」+ 右上「新建智投定向包 / 获取头条定向 / 清空所有资产 / 多账户快速选择」；
   *   左栏账户列表（名称蓝字 + ID，已选账户绿 ✓，当前账户浅蓝高亮）；
   *   中栏：仅查看可用定向包(默认勾选) + 右侧 已选：N/1；表格 单选 | 定向包名称(ⓘ) | 主体 | 智投项目 | 操作「编辑」；
   *   底部分页：共 N 条 / 10条/页 / < 1 > / 前往 x 页；抽屉底部 取消 / 确定。每账户单选 1 条。 -->
  <BatchDrawer
    v-model="visible"
    title="智投定向包"
    :width="1136"
    cancel-text="取消"
    ok-text="确定"
    :close-on-mask="false"
    @ok="onConfirm"
  >
    <template #content>
      <!-- 顶部筛选（线上在卡片之外、抽屉灰底上） -->
      <div class="tp-filter">
        <div class="tp-filter__row">
          <label class="tp-filter__label">智投项目</label>
          <el-select v-model="filter.project" size="small" clearable placeholder="请选择智投项目" class="tp-filter__sel">
            <el-option v-for="p in PROJECTS" :key="p" :label="p" :value="p" />
          </el-select>
          <label class="tp-filter__label">产品</label>
          <el-select v-model="filter.product" size="small" clearable placeholder="所有产品" class="tp-filter__sel">
            <el-option v-for="p in PRODUCTS" :key="p" :label="p" :value="p" />
          </el-select>
          <label class="tp-filter__label">定向包类型</label>
          <el-select v-model="filter.type" size="small" clearable placeholder="应用推广-Android" class="tp-filter__sel">
            <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="tp-filter__row">
          <label class="tp-filter__label">定向包名称</label>
          <el-input v-model="filter.keyword" size="small" placeholder="请输入关键词" clearable class="tp-filter__kw" @keyup.enter="onSearch" />
          <el-button size="small" @click="onSearch">查询<i class="tp-filter__search"></i></el-button>
          <el-button link type="primary" @click="resetFilter">清空</el-button>
        </div>
        <div class="tp-tips">
          <div v-for="(t, i) in TIPS" :key="i" class="tp-tips__line">· {{ t }}</div>
        </div>
      </div>

      <div class="tp">
        <div class="tp__head">
          <span class="tp__title">选择智投定向包</span>
          <div class="tp__actions">
            <el-button type="primary" size="small" @click="onCreate">
              <el-icon class="tp__btn-ic"><Plus /></el-icon>新建智投定向包
            </el-button>
            <el-button size="small" @click="onFetchToutiao">获取头条定向</el-button>
            <el-button size="small" @click="clearAll">清空所有资产</el-button>
            <el-button size="small" @click="quickPickAll">多账户快速选择</el-button>
          </div>
        </div>

        <div class="tp__body">
          <!-- 左：账户列表 -->
          <div class="tp__accounts">
            <div
              v-for="a in accounts"
              :key="a.id"
              class="tp-acct"
              :class="{ 'is-active': a.id === currentAccountId }"
              @click="selectAccount(a.id)"
            >
              <div class="tp-acct__text">
                <div class="tp-acct__name">{{ a.name }}</div>
                <div class="tp-acct__id">{{ a.advertiser_id || a.id }}</div>
              </div>
              <i v-if="isPickedAccount(a.id)" class="tp-acct__check">✓</i>
            </div>
          </div>

          <!-- 中：仅看可用 + 已选计数 + 表格 + 分页 -->
          <div class="tp__main">
            <div class="tp__bar">
              <el-checkbox v-model="onlyAvailable" size="small" class="tp__only">仅查看可用定向包</el-checkbox>
              <span class="tp__count">已选：{{ currentPickedCount }}/1</span>
            </div>

            <el-table :data="pagedRows" size="small" class="tp__table" :row-key="(r) => r.key" @row-click="onRowClick">
              <el-table-column width="44" align="center">
                <template #default="{ row }">
                  <span class="tp-check" :class="{ 'is-on': isPicked(row) }"></span>
                </template>
              </el-table-column>
              <el-table-column label="定向包名称" min-width="180">
                <template #default="{ row }">
                  <div class="tp-name">
                    <span v-if="row.dot" class="tp-dot"></span>
                    <span class="tp-name__text">{{ row.name }}</span>
                    <el-tooltip :content="row.tip || '定向包详情'" placement="top">
                      <el-icon class="tp-name__info"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="subject" label="主体" min-width="200" show-overflow-tooltip />
              <el-table-column prop="project" label="智投项目" width="110" align="right" />
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click.stop="onEdit(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="tp__pager">
              <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="filteredRows.length"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                size="small"
                background
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, QuestionFilled } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';

const props = defineProps({
  modelValue: Boolean,
  initialAccountId: { type: [String, Number], default: '' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const batch = inject('batch');
const { selectedAccounts, targetPackageRows, targetPackagePicked } = batch;
const router = useRouter();

/* 跳转本地「资产 → 定向包」整页：新建 / 编辑（新标签，保留当前批量搭建页已填内容） */
function openOrientationEditor(query) {
  const href = router.resolve({ name: 'orientation-create', query }).href;
  window.open(href, '_blank');
}

const accounts = computed(() => selectedAccounts.value);
const currentAccountId = ref('');
const filter = reactive({ project: '', product: '', type: '', keyword: '' });
const onlyAvailable = ref(true);
const page = ref(1);
const pageSize = ref(10);
const picked = ref([]);

const PROJECTS = ['知乎小说', '漫剧端原生', '内购-ios'];
const PRODUCTS = ['所有产品', '红果免费短剧', '红果付费短剧'];
const TYPES = ['应用推广-Android', '应用推广-IOS', '应用推广-鸿蒙'];
const TIPS = [
  '智投定向包基于主体、投放范围、定向包类型进行筛选后展示。目前拉取模式下，定向内容仅 地域、性别、年龄、自定义人群、排除、平台、应用版本、已安装用户、过滤已转化用户、过滤时间、过滤事件（媒体开户）；其他内容设置不生效，请确认定向包设置无误。',
  '未筛选时系统将自动根据智投模式循环使用定向包，筛选后按每个项目分配的定向包。',
  '跨主体搭建且定向分包使用全部人群同时仅支持开启【跨主体使用】的定向包。',
];

/* 当前账户下的候选定向包 */
const rowsOfAccount = computed(() => {
  const accId = String(currentAccountId.value || '');
  return targetPackageRows.value.filter((r) => String(r.accountId) === accId);
});

const filteredRows = computed(() => {
  const kw = filter.keyword.trim();
  return rowsOfAccount.value.filter((r) => {
    if (onlyAvailable.value && !r.available) return false;
    if (filter.type && r.type !== filter.type) return false;
    if (!kw) return true;
    return r.name.includes(kw) || String(r.id).includes(kw);
  });
});

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

/* ===== 单选（每账户 1 条） ===== */
function pickedKeyOf(accountId) {
  return picked.value.find((k) => k.startsWith(`${accountId}_`)) || '';
}
function isPicked(row) {
  return pickedKeyOf(row.accountId) === row.key;
}
function onRowClick(row) {
  if (!row.available) return;
  picked.value = pickedKeyOf(row.accountId) === row.key
    ? picked.value.filter((k) => k !== row.key)
    : [...picked.value.filter((k) => !k.startsWith(`${row.accountId}_`)), row.key];
}
const currentPickedCount = computed(() => (pickedKeyOf(currentAccountId.value) ? 1 : 0));

const pickedAccountIds = computed(() => {
  const ids = new Set();
  picked.value.forEach((k) => {
    const accId = k.split('_')[0];
    if (accId) ids.add(accId);
  });
  return ids;
});
function isPickedAccount(id) {
  return pickedAccountIds.value.has(String(id));
}

function selectAccount(id) {
  currentAccountId.value = id;
  page.value = 1;
}
function onSearch() { page.value = 1; }
function resetFilter() {
  filter.project = '';
  filter.product = '';
  filter.type = '';
  filter.keyword = '';
  page.value = 1;
}
function clearAll() { picked.value = []; }
function quickPickAll() {
  const keys = [];
  targetPackageRows.value.forEach((r) => {
    if (r.available) keys.push(r.key);
  });
  /* 每账户只留第一条 */
  const seen = new Set();
  picked.value = keys.filter((k) => {
    const acc = k.split('_')[0];
    if (seen.has(acc)) return false;
    seen.add(acc);
    return true;
  });
  ElMessage.success(`已为 ${picked.value.length} 个账户各选择 1 个定向包`);
}
function onCreate() {
  /* 「新建智投定向包」→ 本地 资产 → 定向包 → 新增页面 */
  openOrientationEditor({ from: 'batch' });
}
function onFetchToutiao() { ElMessage.success('已获取头条定向（原型模拟）'); }
function onEdit(row) {
  /* 行内「编辑」→ 本地 资产 → 定向包 → 编辑页面（带该行字段回填） */
  openOrientationEditor({
    id: row.id,
    name: row.name,
    company: row.subject || '',
    platform: (String(row.type || '').split('-')[1] || ''),
    from: 'batch',
  });
}

watch(() => props.modelValue, (v) => {
  if (!v) return;
  resetFilter();
  onlyAvailable.value = true;
  const ids = accounts.value.map((a) => String(a.id));
  currentAccountId.value = props.initialAccountId && ids.includes(String(props.initialAccountId))
    ? props.initialAccountId
    : (accounts.value[0]?.id ?? '');
  picked.value = targetPackagePicked.value.map((p) => p.key);
});

function onConfirm() {
  const result = [];
  targetPackageRows.value.forEach((r) => {
    if (picked.value.includes(r.key)) {
      result.push({ key: r.key, accountId: r.accountId, accountName: r.accountName, id: r.id, name: r.name });
    }
  });
  emit('confirm', result);
  visible.value = false;
}
</script>

<style scoped>
/* 顶部筛选（灰底，卡片之外） */
.tp-filter { margin-bottom: 12px; }
.tp-filter__row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.tp-filter__label { font-size: 13px; color: #4e5969; flex: none; }
.tp-filter__sel { width: 200px; }
.tp-filter__kw { width: 260px; }
.tp-filter__search { display: inline-block; width: 13px; height: 13px; margin-left: 4px; vertical-align: -2px; border: 1.5px solid #4e5969; border-radius: 50%; position: relative; }
.tp-filter__search::after { content: ''; position: absolute; right: -4px; bottom: -3px; width: 6px; height: 1.5px; background: #4e5969; transform: rotate(45deg); }
.tp-tips { font-size: 12px; color: #ff7d00; line-height: 20px; padding: 4px 0 0; }
.tp-tips__line { display: block; }

/* 白色卡片 */
.tp { background: #fff; border: 1px solid #e8eaec; padding: 16px; }
.tp__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.tp__title { font-size: 14px; font-weight: 600; color: #1d2129; flex: none; }
.tp__actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.tp__actions :deep(.el-button) { margin-left: 0; min-height: 30px; padding: 6px 12px; font-size: 13px; }
.tp__btn-ic { width: 12px; height: 12px; margin-right: 3px; }
.tp__body { display: flex; gap: 16px; height: calc(100vh - 400px); min-height: 320px; }

/* 左：账户 */
.tp__accounts { width: 190px; flex: none; border: 1px solid #e5e6eb; border-radius: 4px; overflow: auto; }
.tp-acct { position: relative; padding: 10px 28px 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f1f2; }
.tp-acct:last-child { border-bottom: none; }
.tp-acct:hover { background: #f5f8ff; }
.tp-acct.is-active { background: #e8f1ff; }
.tp-acct__name { font-size: 13px; color: #197afb; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-acct__id { font-size: 12px; color: #86909c; line-height: 18px; margin-top: 2px; }
.tp-acct__check { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: #34c724; color: #fff; font-size: 11px; font-style: normal; line-height: 16px; text-align: center; }

/* 中：主区 */
.tp__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.tp__bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tp__only { font-size: 13px; }
.tp__count { font-size: 13px; color: #1d2129; }
.tp__table { flex: 1; min-height: 0; border: 1px solid #e5e6eb; border-radius: 4px; }
.tp__table :deep(.el-table__header th) { background: #f8f9fa; color: #1d2129; font-size: 13px; height: 42px; }
.tp__table :deep(.el-table__row td) { font-size: 13px; color: #1d2129; height: 40px; }
.tp__table :deep(.el-table__row) { cursor: pointer; }
.tp__pager { display: flex; justify-content: flex-end; margin-top: 10px; }

/* 勾选框（方形） */
.tp-check { display: inline-block; width: 14px; height: 14px; border-radius: 2px; border: 1px solid #dcdfe6; background: #fff; position: relative; vertical-align: middle; }
.tp-check.is-on { border-color: #197afb; background: #197afb; }
.tp-check.is-on::after { content: ''; position: absolute; left: 4px; top: 1px; width: 3px; height: 7px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

/* 名称 + 状态点 + ⓘ */
.tp-name { display: flex; align-items: center; gap: 6px; min-width: 0; }
.tp-name__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tp-name__info { color: #86909c; font-size: 13px; flex: none; cursor: help; }
.tp-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff7d00; flex: none; }
</style>
