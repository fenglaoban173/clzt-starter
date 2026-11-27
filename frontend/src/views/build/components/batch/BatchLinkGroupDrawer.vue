<template>
  <!-- 线上「选择巨量后台监测链接组」抽屉（图1）：
   *   卡片标题「选择监测链接组」+ 右上三按钮：多账户新建(主) / 清空所有资产 / 多账户快速选择；
   *   三栏：左 账户列表(名称+ID，行尾刷新⊙，当前项浅蓝) | 中 搜索+查询 / 项目数+刷新+快速选择 / 仅看关联数为0 /
   *        树形表（监测链接组名称⇅ | 类型 | 关联项目数⇅，分组行加粗 url 可展开，子行带勾选）| 右 已选：N/1 + 清空◌；
   *   底部 取消 / 确定。每个账户单选 1 条。 -->
  <BatchDrawer
    v-model="visible"
    title="选择巨量后台监测链接组"
    :width="1136"
    cancel-text="取消"
    ok-text="确定"
    :close-on-mask="false"
    @ok="onConfirm"
  >
    <template #content>
      <div class="lg">
        <div class="lg__head">
          <span class="lg__title">选择监测链接组</span>
          <div class="lg__actions">
            <el-button type="primary" size="small" @click="onCreate">多账户新建</el-button>
            <el-button size="small" @click="clearAll">清空所有资产</el-button>
            <el-button size="small" @click="quickPickAll">多账户快速选择</el-button>
          </div>
        </div>

        <div class="lg__body">
          <!-- 左：账户列表 -->
          <div class="lg__accounts">
            <div
              v-for="a in accounts"
              :key="a.id"
              class="lg-acct"
              :class="{ 'is-active': a.id === currentAccountId }"
              @click="selectAccount(a.id)"
            >
              <div class="lg-acct__text">
                <div class="lg-acct__name">{{ a.name }}</div>
                <div class="lg-acct__id">{{ a.advertiser_id || a.id }}</div>
              </div>
              <i class="lg-acct__refresh" title="刷新该账户" @click.stop="refreshAccount(a.id)">⟳</i>
            </div>
          </div>

          <!-- 中：搜索 + 项目数 + 树形表 -->
          <div class="lg__main">
            <div class="lg__search">
              <el-input v-model="keyword" size="small" placeholder="请输入关键词" clearable @keyup.enter="onSearch" @clear="onSearch" />
              <el-button size="small" @click="onSearch">查询</el-button>
            </div>

            <div class="lg__count">
              <span>项目数：{{ projectCount }}</span>
              <div class="lg__count-ops">
                <el-button link type="primary" @click="refreshCurrent">刷新</el-button>
                <el-button size="small" class="lg__quick" @click="quickPickCurrent">
                  <el-icon class="lg__quick-ic"><Select /></el-icon>快速选择
                </el-button>
              </div>
            </div>

            <el-checkbox v-model="onlyEmpty" class="lg__only" @change="onSearch">仅看关联数为0</el-checkbox>

            <el-table
              :data="tableRows"
              size="small"
              row-key="key"
              default-expand-all
              :tree-props="{ children: 'children' }"
              class="lg__table"
              :indent="20"
            >
              <el-table-column label="监测链接组名称" min-width="280" sortable>
                <template #default="{ row }">
                  <div v-if="row.isGroup" class="lg-group">{{ row.url }}</div>
                  <label v-else class="lg-item" @click.prevent="toggle(row)">
                    <span class="lg-check" :class="{ 'is-on': isPicked(row) }"></span>
                    <span class="lg-item__name">{{ row.name }}</span>
                  </label>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="90" />
              <el-table-column prop="projects" label="关联项目数" width="110" sortable align="right" />
            </el-table>
          </div>

          <!-- 右：已选 -->
          <div class="lg__picked">
            <div class="lg__picked-head">
              <span>已选：{{ currentPickedCount }}/1</span>
              <el-button link type="primary" class="lg__picked-clear" @click="picked = []">清空<i class="lg__refresh"></i></el-button>
            </div>
            <div class="lg__picked-body">
              <div v-for="p in pickedItems" :key="p.key" class="lg__picked-item">
                <div class="lg__picked-text">
                  <div class="lg__picked-name">{{ p.name }}</div>
                  <div class="lg__picked-sub">{{ p.accountName }}</div>
                </div>
                <el-icon class="lg__picked-x" @click="removePicked(p.key)"><Close /></el-icon>
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
import { Select, Close } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';

const props = defineProps({
  modelValue: Boolean,
  /** 打开后默认定位的账户（内联表「添加」按行进入） */
  initialAccountId: { type: [String, Number], default: '' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const batch = inject('batch');
const { selectedAccounts, linkGroupRows, linkGroupPicked } = batch;

const accounts = computed(() => selectedAccounts.value);
const currentAccountId = ref('');
const keyword = ref('');
const onlyEmpty = ref(false);
const picked = ref([]);

/* 当前账户下的分组树：[{ key, isGroup, url, projects, children:[{ key, name, type, projects }] }] */
const groupsOfAccount = computed(() => {
  const accId = String(currentAccountId.value || '');
  return linkGroupRows.value.filter((r) => String(r.accountId) === accId);
});

const projectCount = computed(() => groupsOfAccount.value.reduce((n, g) => n + 1 + (g.children ? g.children.length : 0), 0));

const tableRows = computed(() => {
  const kw = keyword.value.trim();
  return groupsOfAccount.value
    .map((g) => {
      let children = g.children || [];
      if (onlyEmpty.value) children = children.filter((c) => !c.projects);
      if (kw) children = children.filter((c) => c.name.includes(kw) || g.url.includes(kw));
      return { ...g, children };
    })
    .filter((g) => !kw || g.children.length || g.url.includes(kw));
});

/* ===== 选择：每个账户最多 1 条 ===== */
function pickedKeyOf(accountId) {
  return picked.value.find((k) => k.startsWith(`${accountId}_`)) || '';
}
function isPicked(row) {
  return pickedKeyOf(row.accountId) === row.key;
}
function toggle(row) {
  picked.value = pickedKeyOf(row.accountId) === row.key
    ? picked.value.filter((k) => k !== row.key)
    : [...picked.value.filter((k) => !k.startsWith(`${row.accountId}_`)), row.key];
}
function removePicked(key) {
  picked.value = picked.value.filter((k) => k !== key);
}
function clearAll() {
  picked.value = [];
}
const currentPickedCount = computed(() => (pickedKeyOf(currentAccountId.value) ? 1 : 0));

const pickedItems = computed(() => picked.value.map((key) => {
  for (const g of linkGroupRows.value) {
    const c = (g.children || []).find((x) => x.key === key);
    if (c) return { key, name: c.name, accountName: g.accountName };
  }
  return { key, name: key, accountName: '' };
}));

function selectAccount(id) {
  currentAccountId.value = id;
}
function onSearch() { /* 列表为 computed 过滤，无需额外动作 */ }
function refreshAccount() { ElMessage.success('已刷新该账户的监测链接组'); }
function refreshCurrent() { ElMessage.success('已刷新当前账户的监测链接组'); }

/* 当前账户快速选择：选第一条 */
function quickPickCurrent() {
  const first = groupsOfAccount.value[0]?.children?.[0];
  if (!first) return;
  picked.value = [...picked.value.filter((k) => !k.startsWith(`${first.accountId}_`)), first.key];
}
/* 多账户快速选择：每个账户各选第一条 */
function quickPickAll() {
  const next = [];
  linkGroupRows.value.forEach((g) => {
    const first = (g.children || [])[0];
    if (first) next.push(first.key);
  });
  picked.value = next;
  ElMessage.success(`已为 ${next.length} 个账户各选择 1 个监测链接组`);
}
function onCreate() { ElMessage.success('已跳转至「新建监测链接组」（原型模拟）'); }

watch(() => props.modelValue, (v) => {
  if (!v) return;
  keyword.value = '';
  onlyEmpty.value = false;
  const ids = accounts.value.map((a) => String(a.id));
  currentAccountId.value = props.initialAccountId && ids.includes(String(props.initialAccountId))
    ? props.initialAccountId
    : (accounts.value[0]?.id ?? '');
  picked.value = linkGroupPicked.value.map((p) => p.key);
});

function onConfirm() {
  const result = [];
  linkGroupRows.value.forEach((g) => {
    (g.children || []).forEach((c) => {
      if (picked.value.includes(c.key)) {
        result.push({ key: c.key, accountId: g.accountId, accountName: g.accountName, url: g.url, name: c.name });
      }
    });
  });
  emit('confirm', result);
  visible.value = false;
}
</script>

<style scoped>
.lg { background: #fff; border: 1px solid #e8eaec; padding: 16px; }
.lg__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.lg__title { font-size: 14px; font-weight: 600; color: #1d2129; }
.lg__actions { display: flex; gap: 10px; }
.lg__actions :deep(.el-button) { margin-left: 0; min-height: 32px; padding: 7px 14px; font-size: 13px; }
.lg__body { display: flex; gap: 16px; height: calc(100vh - 290px); min-height: 420px; }

/* 左：账户列表 */
.lg__accounts { width: 200px; flex: none; border: 1px solid #e5e6eb; border-radius: 4px; overflow: auto; }
.lg-acct { position: relative; padding: 10px 30px 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f1f2; }
.lg-acct:last-child { border-bottom: none; }
.lg-acct:hover { background: #f5f8ff; }
.lg-acct.is-active { background: #e8f1ff; }
.lg-acct__name { font-size: 13px; color: #197afb; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lg-acct__id { font-size: 12px; color: #86909c; line-height: 18px; margin-top: 2px; }
.lg-acct__refresh { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border: 1.5px solid #197afb; border-radius: 50%; color: #197afb; font-size: 10px; font-style: normal; line-height: 13px; text-align: center; }

/* 中：主区 */
.lg__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.lg__search { display: flex; gap: 8px; margin-bottom: 10px; }
.lg__search :deep(.el-input) { flex: 1; }
.lg__count { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1d2129; margin-bottom: 8px; }
.lg__count-ops { display: flex; align-items: center; gap: 12px; }
.lg__quick { min-height: 30px; padding: 5px 12px; font-size: 13px; }
.lg__quick-ic { width: 12px; height: 12px; margin-right: 4px; color: #197afb; }
.lg__only { margin: 0 0 8px; font-size: 13px; }
.lg__table { flex: 1; min-height: 0; border: 1px solid #e5e6eb; border-radius: 4px; }
.lg__table :deep(.el-table__header th) { background: #f8f9fa; color: #1d2129; font-size: 13px; height: 44px; }
.lg__table :deep(.el-table__row td) { font-size: 13px; color: #1d2129; height: 40px; }
.lg-group { font-weight: 700; color: #1d2129; }
.lg-item { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.lg-item__name { color: #1d2129; }
/* 勾选框（方形，与线上一致；但每账户单选） */
.lg-check { display: inline-block; width: 14px; height: 14px; border-radius: 2px; border: 1px solid #dcdfe6; background: #fff; position: relative; flex: none; }
.lg-check.is-on { border-color: #197afb; background: #197afb; }
.lg-check.is-on::after { content: ''; position: absolute; left: 4px; top: 1px; width: 3px; height: 7px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

/* 右：已选 */
.lg__picked { width: 240px; flex: none; display: flex; flex-direction: column; border: 1px solid #e5e6eb; border-radius: 4px; background: #f7f8fa; padding: 12px; }
.lg__picked-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1d2129; margin-bottom: 8px; }
.lg__picked-clear { padding: 0; height: auto; font-size: 13px; }
.lg__refresh { display: inline-block; width: 12px; height: 12px; margin-left: 4px; vertical-align: -1px; border: 1.5px solid currentColor; border-radius: 50%; position: relative; }
.lg__refresh::after { content: ''; position: absolute; left: 3px; top: 1px; width: 3px; height: 3px; background: currentColor; border-radius: 50%; }
.lg__picked-body { flex: 1; overflow: auto; background: #fff; border: 1px solid #ebeef5; border-radius: 4px; padding: 6px 10px; }
.lg__picked-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f0f1f2; }
.lg__picked-item:last-child { border-bottom: none; }
.lg__picked-text { min-width: 0; }
.lg__picked-name { font-size: 13px; color: #1d2129; line-height: 18px; word-break: break-all; }
.lg__picked-sub { font-size: 12px; color: #86909c; line-height: 16px; margin-top: 2px; }
.lg__picked-x { cursor: pointer; color: #86909c; flex: none; margin-top: 2px; }
.lg__picked-x:hover { color: #197afb; }
</style>
