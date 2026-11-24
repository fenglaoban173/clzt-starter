<template>
  <el-drawer v-model="visible" :title="title" size="1016px" direction="rtl" class="picker-drawer" @closed="reset">
    <!-- 筛选区（线上：若干必填下拉 + 关键词 + 清空） -->
    <div class="pk-filter">
      <el-select v-if="filters.length" v-model="filterValues" multiple class="pk-f" placeholder="全部">
        <el-option v-for="f in filters" :key="f.label" :label="f.label" :value="f.label" />
      </el-select>
      <el-input v-model="keyword" class="pk-search" placeholder="请输入关键词" clearable @keyup.enter="onSearch" />
      <el-button @click="onSearch">查询</el-button>
      <el-button link type="primary" @click="clearFilter">清空</el-button>
    </div>
    <!-- 账户列表（线上部分选择器带账户切换） -->
    <div v-if="accounts.length" class="pk-accounts">
      <div
        v-for="a in accounts" :key="a.id"
        class="pk-account" :class="{ on: currentAccount === a.id }"
        @click="currentAccount = a.id"
      >
        <span>{{ a.name }}</span><span class="pk-account__id">ID：{{ a.id }}</span>
      </div>
      <el-checkbox v-if="onlyLinked" v-model="onlyLinkedAccount" class="pk-only">仅看关联账户</el-checkbox>
    </div>
    <el-table
      ref="tableRef"
      :data="pageRows"
      border
      size="small"
      height="360"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="44" />
      <el-table-column v-for="c in columns" :key="c.prop" :label="c.label" :prop="c.prop" min-width="150" show-overflow-tooltip />
      <el-table-column v-if="actionLabel" :label="actionLabel" width="90" align="center">
        <template #default="{ row }"><el-button link type="primary" @click="onAction(row)">{{ actionLabel }}</el-button></template>
      </el-table-column>
    </el-table>
    <div class="pk-foot">
      <span>已选：{{ selected.length }}/{{ limit }}</span>
      <el-button link type="primary" @click="clearSelected">清空</el-button>
    </div>
    <div class="pk-pager">
      <span>共 {{ filtered.length }} 条</span>
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="filtered.length" layout="prev, pager, next" small />
      <span class="pk-jump">前往</span>
      <el-input v-model="jumpPage" class="pk-jump__input" size="small" />
      <span class="pk-jump">页</span>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确 定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '选择' },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  filters: { type: Array, default: () => [] },
  accounts: { type: Array, default: () => [] },
  onlyLinked: { type: Boolean, default: false },
  actionLabel: { type: String, default: '' },
  limit: { type: Number, default: 1000 },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'action']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const keyword = ref('');
const filterValues = ref([]);
const currentAccount = ref('');
const onlyLinkedAccount = ref(false);
const selected = ref([]);
const page = ref(1);
const pageSize = 10;
const jumpPage = ref('1');
const tableRef = ref(null);

watch(() => props.modelValue, (v) => {
  if (v) {
    keyword.value = '';
    filterValues.value = [];
    onlyLinkedAccount.value = false;
    selected.value = [];
    page.value = 1;
    currentAccount.value = props.accounts.length ? props.accounts[0].id : '';
  }
});

const filtered = computed(() => {
  const kw = String(keyword.value || '').trim().toLowerCase();
  return props.rows.filter((r) => {
    if (kw && !Object.values(r).some((v) => String(v).toLowerCase().includes(kw))) return false;
    if (filterValues.value.length) {
      const hit = filterValues.value.some((f) => Object.values(r).some((v) => String(v).includes(f)));
      if (!hit) return false;
    }
    return true;
  });
});
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));

function onSelectionChange(rows) { selected.value = rows; }
function clearSelected() {
  selected.value = [];
  if (tableRef.value) tableRef.value.clearSelection();
}
function onSearch() { page.value = 1; }
function clearFilter() {
  keyword.value = '';
  filterValues.value = [];
  page.value = 1;
}
function onAction(row) { emit('action', row); }
function confirm() { emit('confirm', selected.value); }
function reset() {
  selected.value = [];
  keyword.value = '';
  filterValues.value = [];
  page.value = 1;
}
</script>

<style scoped>
.pk-filter { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.pk-f { width: 200px; }
.pk-search { width: 240px; }
.pk-accounts { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin-bottom: 10px; }
.pk-account { font-size: 12px; color: #4e5969; cursor: pointer; display: flex; gap: 6px; align-items: center; }
.pk-account.on { color: #197afb; }
.pk-account__id { color: #86909c; }
.pk-only { font-size: 12px; }
.pk-foot { display: flex; align-items: center; gap: 12px; margin-top: 10px; font-size: 13px; color: #4e5969; }
.pk-pager { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; color: #86909c; }
.pk-jump__input { width: 48px; }
</style>
