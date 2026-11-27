<template>
  <!-- 线上「选择事件资产」抽屉（1136px，cl-drawer 外壳）：
   *   内部一个白色 module-container，标题「选择事件资产」；
   *   右上三个按钮：多账户新建(主) / 清空所有资产 / 多账户快速选择；
   *   三栏：左 账户列表(200) | 中 搜索 + 项目数 + 事件资产表 | 右 已选面板(240)；
   *   左栏账户行：名称 + ID，已选账户右侧绿 ✓，当前账户浅蓝高亮；
   *   中栏表头：事件资产名称(可排序) | 关联项目数(可排序)，行首复选；
   *   右栏：已选/N + 清空◌，条目 文字 + ×；
   *   底部分页（左右箭头 + 页码）；抽屉底部 取消 / 确定。 -->
  <BatchDrawer
    v-model="visible"
    title="选择事件资产"
    :width="1136"
    cancel-text="取消"
    ok-text="确定"
    :close-on-mask="false"
    @ok="onConfirm"
  >
    <template #content>
      <div class="ev-asset">
        <div class="ev-asset__head">
          <span class="ev-asset__title">选择事件资产</span>
          <div class="ev-asset__actions">
            <el-button type="primary" size="small" @click="onRefreshAll">多账户刷新</el-button>
            <el-button size="small" @click="clearAll">清空所有资产</el-button>
            <el-button size="small" @click="quickPick">多账户快速选择</el-button>
          </div>
        </div>

        <div class="ev-asset__body">
          <!-- 左：账户列表 -->
          <div class="ev-asset__accounts">
            <div
              v-for="a in accounts"
              :key="a.id"
              class="ev-acct"
              :class="{ 'is-active': a.id === currentAccountId, 'is-picked': isPickedAccount(a.id) }"
              @click="selectAccount(a.id)"
            >
              <div class="ev-acct__text">
                <div class="ev-acct__name">{{ a.name }}</div>
                <div class="ev-acct__id">{{ a.advertiser_id || a.id }}</div>
              </div>
              <i v-if="isPickedAccount(a.id)" class="ev-acct__check">✓</i>
            </div>
          </div>

          <!-- 中：搜索 + 项目数 + 事件资产表 -->
          <div class="ev-asset__main">
            <div class="ev-asset__search">
              <el-select v-model="searchType" class="ev-asset__search-type" size="small">
                <el-option label="名称" value="name" />
                <el-option label="ID" value="id" />
              </el-select>
              <el-input v-model="keyword" size="small" class="ev-asset__search-input" placeholder="请输入内容" clearable @keyup.enter="onSearch" @clear="onSearch">
                <template #append>
                  <el-button @click="onSearch">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>

            <div class="ev-asset__count">
              <span>项目数：{{ rowCount }}</span>
              <el-button size="small" class="ev-asset__quick" @click="quickPickCurrent">⟳ 快速选择</el-button>
            </div>

            <!-- 每个账户下的资产列表为单选（线上口径） -->
            <el-table :data="pagedRows" size="small" class="ev-asset__table" ref="tableRef" @row-click="onRowClick">
              <el-table-column width="48" align="center">
                <template #default="{ row }">
                  <span class="ev-radio" :class="{ 'is-on': pickedKeyOf(row.accountId) === row.key }"></span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="事件资产名称" min-width="320" sortable />
              <el-table-column prop="projectCount" label="关联项目数" width="140" sortable align="right" />
            </el-table>

            <div class="ev-asset__pager">
              <el-pagination
                v-model:current-page="page"
                :page-size="PAGE_SIZE"
                :total="filteredRows.length"
                layout="prev, pager, next"
                size="small"
              />
            </div>
          </div>

          <!-- 右：已选 -->
          <div class="ev-asset__picked">
            <div class="ev-asset__picked-head">
              <span>已选/{{ picked.length }}</span>
              <el-button link type="primary" class="ev-asset__picked-clear" @click="picked = []">清空<i class="ev-asset__refresh"></i></el-button>
            </div>
            <div class="ev-asset__picked-body">
              <div v-for="p in pickedItems" :key="p.key" class="ev-asset__picked-item">
                <span class="ev-asset__picked-name">{{ p.name }}</span>
                <el-icon class="ev-asset__picked-x" @click="removePicked(p.key)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Close } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const PAGE_SIZE = 20;

/* 全部业务状态来自 Create.vue 通过 provide('batch') 暴露的 setup 作用域 */
const batch = inject('batch');
const { selectedAccounts, eventAssetRows, eventAssetPicked, eventAssetDraft } = batch;

const accounts = computed(() => selectedAccounts.value);

const currentAccountId = ref('');
const searchType = ref('name');
const keyword = ref('');
const page = ref(1);
const picked = ref([]);

const tableRef = ref(null);
void tableRef;

/* 当前账户下的候选事件资产（mock：每个账户一套，按账户 id 区分） */
const rowsOfAccount = computed(() => {
  const accId = String(currentAccountId.value || '');
  return eventAssetRows.value.filter((r) => !r.accountId || String(r.accountId) === accId);
});

const filteredRows = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return rowsOfAccount.value;
  return rowsOfAccount.value.filter((r) => {
    if (searchType.value === 'id') return String(r.id).includes(kw);
    return (r.name || '').includes(kw);
  });
});

const rowCount = computed(() => filteredRows.value.length);

const pagedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});

const pickedItems = computed(() => picked.value.map((key) => {
  const r = eventAssetRows.value.find((x) => x.key === key);
  return r ? { key: r.key, name: r.name } : { key, name: key };
}));

/* 哪些账户已经有已选资产（用于左侧绿 ✓，抽屉内勾选即亮） */
const pickedAccountIds = computed(() => new Set(
  eventAssetRows.value
    .filter((r) => picked.value.includes(r.key))
    .map((r) => String(r.accountId)),
));

function isPickedAccount(id) {
  return pickedAccountIds.value.has(String(id));
}

/* ===== 选择逻辑：每个账户最多 1 条（picked 为各账户已选 key 的列表） ===== */
function pickedKeyOf(accountId) {
  return picked.value.find((k) => k.startsWith(`${accountId}_`)) || '';
}

function setPick(accountId, key) {
  const others = picked.value.filter((k) => !k.startsWith(`${accountId}_`));
  picked.value = key ? [...others, key] : others;
}

function selectAccount(id) {
  currentAccountId.value = id;
  page.value = 1;
}

function onSearch() {
  page.value = 1;
}

/* 单选：点击行即选中该行（再次点击同一行不取消，与线上 radio 行为一致） */
function onRowClick(row) {
  setPick(row.accountId, row.key);
}

function removePicked(key) {
  picked.value = picked.value.filter((k) => k !== key);
}

function clearAll() {
  picked.value = [];
}

/* 多账户快速选择：每个账户各选第一条可用资产 */
function quickPick() {
  const next = [];
  accounts.value.forEach((a) => {
    const first = eventAssetRows.value.find((r) => String(r.accountId) === String(a.id));
    if (first) next.push(first.key);
  });
  picked.value = next;
  ElMessage.success(`已为 ${next.length} 个账户各选择 1 个事件资产`);
}

/* 当前账户快速选择：选第一条 */
function quickPickCurrent() {
  const first = rowsOfAccount.value[0];
  if (!first) return;
  setPick(first.accountId, first.key);
}

function onRefreshAll() {
  ElMessage.success('已刷新全部账户的事件资产');
}

/* 打开：默认选中第一个账户；带入已选 */
watch(() => props.modelValue, (v) => {
  if (!v) return;
  keyword.value = '';
  page.value = 1;
  currentAccountId.value = accounts.value.length ? accounts.value[0].id : '';
  picked.value = eventAssetPicked.value.map((p) => p.key).filter(Boolean);
});

function onConfirm() {
  /* 按账户归档：每个账户最多 1 条 */
  const result = eventAssetRows.value
    .filter((r) => picked.value.includes(r.key))
    .map((r) => ({ key: r.key, accountId: r.accountId, accountName: r.accountName, assetId: r.id, assetName: r.name, pkgLine: r.pkgLine }));
  emit('confirm', result);
  visible.value = false;
}
</script>

<style scoped>
.ev-asset { background: #fff; border: 1px solid #e8eaec; padding: 16px; }
.ev-asset__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ev-asset__title { font-size: 14px; font-weight: 600; color: #1d2129; }
.ev-asset__actions { display: flex; gap: 10px; }
.ev-asset__actions :deep(.el-button) { margin-left: 0; min-height: 32px; padding: 7px 14px; font-size: 13px; }
.ev-asset__body { display: flex; gap: 16px; height: calc(100vh - 290px); min-height: 420px; }

/* 左：账户列表 */
.ev-asset__accounts { width: 200px; flex: none; border: 1px solid #e5e6eb; border-radius: 4px; overflow: auto; }
.ev-acct { position: relative; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f1f2; }
.ev-acct:last-child { border-bottom: none; }
.ev-acct:hover { background: #f5f8ff; }
.ev-acct.is-active { background: #e8f1ff; }
.ev-acct__name { font-size: 13px; color: #197afb; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 16px; }
.ev-acct__id { font-size: 12px; color: #86909c; line-height: 18px; margin-top: 2px; }
.ev-acct__check { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: #34c724; color: #fff; font-size: 11px; font-style: normal; line-height: 16px; text-align: center; }

/* 中：主区 */
.ev-asset__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ev-asset__search { display: flex; gap: 8px; margin-bottom: 10px; }
.ev-asset__search-type { width: 120px; flex: none; }
.ev-asset__search-input { flex: 1; }
.ev-asset__search-input :deep(.el-input-group__append) { padding: 0 10px; }
.ev-asset__count { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1d2129; margin-bottom: 8px; }
.ev-asset__quick { min-height: 30px; padding: 5px 12px; font-size: 13px; }
.ev-asset__table { flex: 1; min-height: 0; border: 1px solid #e5e6eb; border-radius: 4px; }
.ev-asset__table :deep(.el-table__header th) { background: #f8f9fa; color: #1d2129; font-size: 13px; height: 44px; }
.ev-asset__table :deep(.el-table__row td) { font-size: 13px; color: #1d2129; height: 40px; }
.ev-asset__table :deep(.el-table__row) { cursor: pointer; }
/* 自绘单选圆点（与 el-radio 视觉一致：14px 边框圆 + 选中蓝底白心） */
.ev-radio { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #dcdfe6; background: #fff; vertical-align: middle; position: relative; }
.ev-radio.is-on { border-color: #197afb; background: #197afb; }
.ev-radio.is-on::after { content: ''; position: absolute; left: 4px; top: 4px; width: 4px; height: 4px; border-radius: 50%; background: #fff; }
.ev-asset__pager { display: flex; justify-content: flex-start; margin-top: 10px; }

/* 右：已选 */
.ev-asset__picked { width: 240px; flex: none; display: flex; flex-direction: column; border: 1px solid #e5e6eb; border-radius: 4px; background: #f7f8fa; padding: 12px; }
.ev-asset__picked-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1d2129; margin-bottom: 8px; }
.ev-asset__picked-clear { padding: 0; height: auto; font-size: 13px; }
.ev-asset__refresh { display: inline-block; width: 12px; height: 12px; margin-left: 4px; vertical-align: -1px; border: 1.5px solid currentColor; border-radius: 50%; position: relative; }
.ev-asset__refresh::after { content: ''; position: absolute; left: 3px; top: 1px; width: 3px; height: 3px; background: currentColor; border-radius: 50%; }
.ev-asset__picked-body { flex: 1; overflow: auto; background: #fff; border: 1px solid #ebeef5; border-radius: 4px; padding: 6px 10px; }
.ev-asset__picked-item { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1d2129; padding: 8px 0; gap: 8px; }
.ev-asset__picked-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-asset__picked-x { cursor: pointer; color: #86909c; flex: none; }
.ev-asset__picked-x:hover { color: #197afb; }
</style>
