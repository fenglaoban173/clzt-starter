<template>
  <el-dialog
    :model-value="modelValue"
    title="选择媒体账户"
    width="1140px"
    top="6vh"
    class="map-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="mp-body">
      <!-- 第一行：创量项目 / 账户主体 / 开发者 -->
      <div class="mp-frow">
        <el-select v-model="f.clProject" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
          <template #prefix><span class="mp-pre">创量项目：</span></template>
          <el-option v-for="o in clProjects" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="f.subject" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
          <template #prefix><span class="mp-pre">账户主体：</span></template>
          <el-option v-for="o in subjects" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="f.developer" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
          <template #prefix><span class="mp-pre">开发者：</span></template>
          <el-option v-for="o in developers" :key="o" :label="o" :value="o" />
        </el-select>
      </div>

      <!-- 第二行：搜索字段 + 关键词 + 清空 -->
      <div class="mp-frow">
        <div class="mp-search-group">
          <el-select v-model="f.searchField" class="mp-f-select mp-f-short">
            <el-option label="账户ID" value="账户ID" />
            <el-option label="账户名称" value="账户名称" />
          </el-select>
          <el-input v-model="f.keyword" class="mp-f-input" placeholder="搜索媒体账户" @keyup.enter="onSearch">
            <template #suffix><el-icon class="mp-suffix-icon"><Search /></el-icon></template>
          </el-input>
          <el-button class="mp-f-btn" @click="onSearch"><el-icon><Search /></el-icon></el-button>
        </div>
        <a class="mp-link" @click="resetFilters">清空</a>
      </div>

      <!-- 账户列表 + 已选 -->
      <div class="mp-content">
        <el-table :data="pageRows" size="small" border class="mp-table" max-height="360">
          <el-table-column width="46" align="center">
            <template #header>
              <el-checkbox
                :model-value="pageAllChecked"
                :indeterminate="pageHalfChecked"
                @change="togglePage"
              />
            </template>
            <template #default="{ row }">
              <el-checkbox :model-value="isSel(row)" @change="(v) => toggleRow(row, v)" />
            </template>
          </el-table-column>

          <el-table-column min-width="240">
            <template #header>
              <span class="mp-th-sort" :class="{ active: sortKey === 'name' }" @click="toggleSort('name')">
                账户名称
                <el-icon v-if="sortKey === 'name'"><CaretTop v-if="sortAsc" /><CaretBottom v-else /></el-icon>
              </span>
            </template>
            <template #default="{ row }">
              <div class="mp-acc-line">
                <span class="mp-acc-name" :title="row.name">{{ row.name }}</span>
                <span v-if="hasFixTag(row)" class="mp-acc-tag">
                  <el-icon><InfoFilled /></el-icon>防出错
                </span>
              </div>
              <div class="mp-acc-id">ID: {{ row.advertiser_id }}</div>
            </template>
          </el-table-column>

          <el-table-column width="170">
            <template #header>
              <span class="mp-th-sort" :class="{ active: sortKey === 'subject' }" @click="toggleSort('subject')">
                账户主体
                <el-icon v-if="sortKey === 'subject'"><CaretTop v-if="sortAsc" /><CaretBottom v-else /></el-icon>
              </span>
            </template>
            <template #default="{ row }">
              <span class="mp-ellipsis" :title="row.subject">{{ row.subject || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="账户备注(创建)" width="150">
            <template #default="{ row }">
              <span class="mp-ellipsis" :title="row.remark_cy">{{ row.remark_cy || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="账户备注(巨量)" width="150">
            <template #default="{ row }">
              <span class="mp-ellipsis" :title="row.remark_jl">{{ row.remark_jl || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="创建项目" width="90" align="right">
            <template #default="{ row }">
              {{ projectCounts[row.name] || '--' }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 已选账户 -->
        <div class="mp-selected">
          <div class="mp-selected-head">
            <span>已选({{ picked.length }}/{{ MAX }})</span>
            <a class="mp-link" @click="clearSelection">清空</a>
          </div>
          <div class="mp-selected-body">
            <div v-for="a in picked" :key="a.advertiser_id" class="mp-selected-item">
              <span class="mp-selected-name" :title="a.name">{{ a.name }}</span>
              <el-icon class="mp-selected-del" title="移除" @click="toggleRow(a, false)"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="mp-pager">
        <span class="mp-total">共 {{ total }} 条</span>
        <el-select v-model="pageSize" class="mp-size-select" size="small">
          <el-option v-for="s in [20, 50, 100]" :key="s" :label="`${s}条/页`" :value="s" />
        </el-select>
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          :pager-count="5"
          background
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { CaretBottom, CaretTop, Close, InfoFilled, Search } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 媒体账户列表（来自 mediaApi.accounts()）
  accounts: { type: Array, default: () => [] },
  // 已选账户（advertiser_id）
  selectedIds: { type: Array, default: () => [] },
  // 账户名 → 项目数（创建项目列）
  projectCounts: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const MAX = 500;

const f = reactive({
  clProject: '',
  subject: '',
  developer: '',
  searchField: '账户ID',
  keyword: '',
});
const page = ref(1);
const pageSize = ref(20);
const sortKey = ref('');
const sortAsc = ref(true);
const picked = ref([]);

// 候选项（取自本地模拟账户数据）
const clProjects = computed(() => [...new Set(props.accounts.map((a) => a.project).filter(Boolean))]);
const subjects = computed(() => [...new Set(props.accounts.map((a) => a.subject).filter(Boolean))]);
const developers = computed(() => [...new Set(props.accounts.map((a) => a.developer_name).filter(Boolean))]);

const filtered = computed(() => {
  const kw = f.keyword.trim().toLowerCase();
  let list = props.accounts.filter((a) => {
    if (f.clProject && a.project !== f.clProject) return false;
    if (f.subject && a.subject !== f.subject) return false;
    if (f.developer && a.developer_name !== f.developer) return false;
    if (kw) {
      const target = f.searchField === '账户名称' ? a.name : a.advertiser_id;
      if (!String(target || '').toLowerCase().includes(kw)) return false;
    }
    return true;
  });
  if (sortKey.value) {
    const dir = sortAsc.value ? 1 : -1;
    list = [...list].sort((x, y) => String(x[sortKey.value] || '').localeCompare(String(y[sortKey.value] || ''), 'zh-CN') * dir);
  }
  return list;
});

const total = computed(() => filtered.value.length);
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

const isSel = (row) => picked.value.some((a) => a.advertiser_id === row.advertiser_id);
const pageAllChecked = computed(() => pageRows.value.length > 0 && pageRows.value.every((r) => isSel(r)));
const pageHalfChecked = computed(() => !pageAllChecked.value && pageRows.value.some((r) => isSel(r)));

/** 初始化：回填已选账户 */
function init() {
  f.clProject = '';
  f.subject = '';
  f.developer = '';
  f.searchField = '账户ID';
  f.keyword = '';
  page.value = 1;
  pageSize.value = 20;
  sortKey.value = '';
  sortAsc.value = true;
  picked.value = props.accounts.filter((a) => (props.selectedIds || []).includes(a.advertiser_id));
}

function toggleSort(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

function toggleRow(row, v) {
  if (v) {
    if (picked.value.length >= MAX) {
      ElMessage.warning(`最多只能选择 ${MAX} 个媒体账户`);
      return;
    }
    picked.value = [...picked.value, row];
  } else {
    picked.value = picked.value.filter((a) => a.advertiser_id !== row.advertiser_id);
  }
}

function togglePage(v) {
  if (v) {
    const merged = [...picked.value];
    pageRows.value.forEach((r) => {
      if (!merged.some((a) => a.advertiser_id === r.advertiser_id) && merged.length < MAX) merged.push(r);
    });
    picked.value = merged;
  } else {
    const ids = pageRows.value.map((r) => r.advertiser_id);
    picked.value = picked.value.filter((a) => !ids.includes(a.advertiser_id));
  }
}

function clearSelection() {
  picked.value = [];
}

function resetFilters() {
  f.clProject = '';
  f.subject = '';
  f.developer = '';
  f.keyword = '';
  page.value = 1;
}

function onSearch() {
  page.value = 1;
}

/** 防出错标签：账户开启了自动纠错 */
function hasFixTag(row) {
  return !!(row.auto_fix_on || row.auto_fix);
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  emit('submit', picked.value);
  close();
}
</script>

<style scoped>
.mp-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.mp-frow { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.mp-f-select { flex: none; }
.mp-f-short { width: 160px; }
.mp-f-mid { width: 200px; }
.mp-pre { color: #4e5969; font-size: 13px; }
.mp-search-group { display: flex; align-items: center; }
.mp-f-input { width: 220px; }
.mp-f-input :deep(.el-input__wrapper) { border-radius: 4px 0 0 4px; }
.mp-f-btn {
  width: 40px;
  margin-left: -1px;
  padding: 0;
  border-radius: 0 4px 4px 0;
  border-left: none;
  color: #4e5969;
}
.mp-suffix-icon { color: #86909c; cursor: pointer; }
.mp-link { color: #165dff; cursor: pointer; font-size: 14px; }

/* 账户列表 + 已选 */
.mp-content { display: flex; gap: 12px; align-items: flex-start; }
.mp-table { flex: 1; min-width: 0; }
.mp-th-sort { display: inline-flex; align-items: center; gap: 2px; cursor: pointer; }
.mp-th-sort.active { color: #165dff; }
.mp-acc-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
.mp-acc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-acc-tag {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  border: 1px solid #c9cdd4;
  border-radius: 2px;
  color: #86909c;
  font-size: 12px;
  line-height: 16px;
}
.mp-acc-id { font-size: 13px; color: #86909c; margin-top: 2px; }
.mp-ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 已选 */
.mp-selected {
  flex: none;
  width: 200px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  background: #fff;
}
.mp-selected-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid #e5e6eb;
  color: #1d2129;
}
.mp-selected-body { max-height: 300px; overflow-y: auto; padding: 4px 0; }
.mp-selected-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
}
.mp-selected-item:hover { background: #f7f8fa; }
.mp-selected-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.mp-selected-del { color: #c9cdd4; cursor: pointer; }
.mp-selected-del:hover { color: #f53f3f; }

/* 分页 */
.mp-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.mp-total { color: #86909c; font-size: 13px; }
.mp-size-select { width: 108px; }
</style>

<style>
/* 弹窗外壳：与线上一致（无内边距头部、body 自行排版） */
.map-dialog .el-dialog__header { margin-right: 0; padding: 14px 20px 0; }
.map-dialog .el-dialog__body { padding: 12px 20px 0; }
.map-dialog .el-dialog__footer { padding: 12px 20px 16px; }
.map-dialog .el-input__wrapper { box-shadow: 0 0 0 1px #c9cdd4 inset; }
</style>
