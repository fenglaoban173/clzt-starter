<template>
  <el-dialog
    :model-value="modelValue"
    title="关联账户"
    width="1100px"
    top="6vh"
    class="pla-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="pla-body">
      <!-- 查询条件：广告主名称 / 广告主id（可展开多行）/ 账户主体名称 -->
      <div class="pla-frow">
        <div class="pla-field">
          <label class="pla-label">广告主名称：</label>
          <el-input
            v-model="f.name"
            class="pla-input pla-input--name"
            size="small"
            placeholder="请输入广告主名称"
            clearable
            @keyup.enter="onSearch"
          />
        </div>

        <div class="pla-field pla-field--id">
          <label class="pla-label">广告主id：</label>
          <el-input
            v-model="f.ids"
            class="pla-input pla-input--id"
            size="small"
            placeholder="请输入广告主id，支持多行批量查询"
            :type="idExpanded ? 'textarea' : 'text'"
            :rows="idExpanded ? 4 : 1"
            :autosize="idExpanded ? { minRows: 4, maxRows: 8 } : false"
            @keyup.enter="onSearch"
          >
            <template #suffix>
              <!-- 展开 / 收起：右侧箭头 -->
              <el-icon class="pla-expand" :class="{ 'is-expanded': idExpanded }" @click="toggleIdExpand">
                <ArrowDown />
              </el-icon>
            </template>
          </el-input>
        </div>

        <div class="pla-field">
          <label class="pla-label">账户主体名称：</label>
          <el-select
            v-model="f.subject"
            class="pla-select"
            size="small"
            placeholder="请选择账户主体名称"
            filterable
            clearable
          >
            <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>

        <!-- 已关联账户：勾选=只看已关联的；不勾选（默认）=只看未关联的 -->
        <el-checkbox v-model="f.onlyLinked" class="pla-only-linked">已关联账户</el-checkbox>

        <el-button class="pla-search-btn" size="small" @click="onSearch">
          <el-icon><Search /></el-icon>
        </el-button>
        <a class="pla-link" @click="resetFilters">清空</a>
      </div>

      <!-- 广告主列表 -->
      <el-table
        :data="pageRows"
        row-key="advertiser_id"
        size="small"
        border
        class="pla-table"
        max-height="420"
      >
        <el-table-column width="46" align="center">
          <!-- 自定义表头勾选框：默认不勾选；
               当前页全部勾选时是勾选态，部分勾选显示半选（横杠） -->
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
        <el-table-column label="广告主id" prop="advertiser_id" min-width="170" show-overflow-tooltip />
        <el-table-column label="广告主名称" prop="name" min-width="220" show-overflow-tooltip />
        <el-table-column label="账户主体名称" prop="subject" min-width="220" show-overflow-tooltip />
        <template #empty>
          <div class="pla-empty">暂无数据</div>
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pla-pager">
        <span class="pla-total">共 {{ total }} 条</span>
        <el-select v-model="pageSize" size="small" class="pla-size-select">
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
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 管理 · 智投项目 —— 「关联账户」弹窗
 *
 * 线上口径：项目管理的操作列点「关联账户」打开，弹窗宽 1100px，
 *   顶部查询条件：广告主名称 / 广告主id（支持批量多行输入）/ 账户主体名称；
 *   下方广告主列表：批量勾选，列为 广告主id / 广告主名称 / 账户主体名称；
 *   底部 取消 / 提交。
 *
 * 交互要点：
 *   - 打开时回填该项目「已关联」的广告主，表格对应行自动打勾（再次打开不会丢）
 *   - 取消不写回；提交才写入 mock 数据层
 * ------------------------------------------------------------------ */
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, Search } from '@element-plus/icons-vue';
import {
  fetchAdvertisers,
  fetchAccountSubjects,
  fetchLinkedAccounts,
  saveLinkedAccounts,
} from '@/mock/projectAccounts';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 当前智投项目行 */
  row: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const f = reactive({
  name: '',
  ids: '',
  subject: '',
  /** 「已关联账户」：勾选=只看已关联的，不勾选=全部账户（默认不勾选） */
  onlyLinked: false,
});
const idExpanded = ref(false);
const page = ref(1);
const pageSize = ref(20);
const advertisers = ref([]);
const subjectOptions = ref([]);
/** 已勾选的广告主 id 数组 */
const picked = ref([]);
/** 该项目「已关联」的广告主 id 数组（打开时的初始关联关系，用于回显） */
const linkedIds = ref([]);

/** 解析「广告主id」输入：支持换行 / 逗号 / 空格 / 分号分隔 */
function parseIds(text) {
  return String(text || '')
    .split(/[\n,;，；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 校验：广告主id 只能是数字 */
function invalidIds(ids) {
  return ids.filter((id) => !/^\d+$/.test(id));
}

const filtered = computed(() => {
  const kw = (f.name || '').trim().toLowerCase();
  const ids = parseIds(f.ids);
  // 「已关联」判定用已保存的关联关系（linkedIds）：
  //   这样用户在「未关联」视图勾选一行后，该行仍留在列表里（可见操作结果），
  //   不会因为 picked 变化而立刻从列表消失。
  const linked = linkedIds.value || [];
  return advertisers.value.filter((a) => {
    const isLinked = linked.includes(String(a.advertiser_id));
    // 勾选「已关联账户」→ 只看已关联的；不勾选（默认）→ 只看未关联的
    if (f.onlyLinked !== isLinked) return false;
    if (f.subject && a.subject !== f.subject) return false;
    if (kw && String(a.name || '').toLowerCase().indexOf(kw) === -1) return false;
    if (ids.length && !ids.includes(String(a.advertiser_id))) return false;
    return true;
  });
});

const total = computed(() => filtered.value.length);
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

/** 展开 / 收起多行输入 */
function toggleIdExpand() {
  idExpanded.value = !idExpanded.value;
}

/** 打开弹窗：加载候选数据 + 回填已关联（保持勾选） */
async function init() {
  f.name = '';
  f.ids = '';
  f.subject = '';
  f.onlyLinked = false;
  idExpanded.value = false;
  page.value = 1;
  pageSize.value = 20;

  const [advRes, subRes, linkRes] = await Promise.all([
    fetchAdvertisers(),
    fetchAccountSubjects(),
    fetchLinkedAccounts(props.row ? props.row.id : null),
  ]);
  advertisers.value = advRes.data.list || [];
  subjectOptions.value = subRes.data.list || [];
  linkedIds.value = linkRes.data.list || [];
  // 回显已关联：勾选状态直接由 picked 驱动（行内 checkbox 用 isSel 计算）
  picked.value = [...linkedIds.value];
}

/** 某行是否已勾选 */
function isSel(row) {
  return picked.value.includes(String(row.advertiser_id));
}

/** 当前页全选 / 半选（表头勾选框状态） */
const pageAllChecked = computed(() => pageRows.value.length > 0 && pageRows.value.every((r) => isSel(r)));
const pageHalfChecked = computed(() => !pageAllChecked.value && pageRows.value.some((r) => isSel(r)));

/** 勾选 / 取消单行 */
function toggleRow(row, v) {
  const id = String(row.advertiser_id);
  if (v) {
    if (!picked.value.includes(id)) picked.value = [...picked.value, id];
  } else {
    picked.value = picked.value.filter((x) => x !== id);
  }
}

/** 表头全选 / 取消当前页 */
function togglePage(v) {
  const ids = pageRows.value.map((r) => String(r.advertiser_id));
  if (v) {
    picked.value = Array.from(new Set([...picked.value, ...ids]));
  } else {
    picked.value = picked.value.filter((x) => !ids.includes(x));
  }
}

/** 勾选「已关联账户」→ 回到第 1 页（勾选状态由 picked 驱动，无需手动回显） */
watch(() => f.onlyLinked, () => {
  page.value = 1;
});

function onSearch() {
  const ids = parseIds(f.ids);
  const bad = invalidIds(ids);
  if (bad.length) {
    ElMessage.warning(`广告主id「${bad[0]}」格式不正确，请输入纯数字`);
    return;
  }
  page.value = 1;
}

function resetFilters() {
  f.name = '';
  f.ids = '';
  f.subject = '';
  f.onlyLinked = false;
  page.value = 1;
}

function close() {
  emit('update:modelValue', false);
}

/** 提交：写入 mock 数据层 */
async function confirm() {
  if (!props.row) return;
  await saveLinkedAccounts(props.row.id, picked.value);
  emit('submit', { projectId: props.row.id, advertiserIds: picked.value, count: picked.value.length });
  close();
}
</script>

<style scoped>
.pla-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}

/* ---------- 查询条件 ---------- */
.pla-frow { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.pla-field { display: flex; align-items: center; gap: 6px; }
.pla-field--id { align-items: flex-start; }
.pla-label { font-size: 13px; color: #1d2129; white-space: nowrap; line-height: 32px; }
.pla-input--name { width: 160px; }
.pla-input--id { width: 230px; }
.pla-select { width: 190px; }

/* 「已关联账户」复选框 */
.pla-only-linked {
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  line-height: 32px;
  margin-right: 0;
}
.pla-only-linked :deep(.el-checkbox__label) { font-size: 13px; color: #1d2129; }
.pla-input :deep(.el-input__wrapper),
.pla-select :deep(.el-select__wrapper) { border-radius: 4px; }
.pla-input :deep(.el-textarea__inner) { border-radius: 4px; font-family: inherit; }

.pla-expand {
  color: #86909c;
  cursor: pointer;
  transition: transform 0.2s;
}
.pla-expand:hover { color: #165dff; }
.pla-expand.is-expanded { transform: rotate(180deg); }

.pla-search-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  margin-left: auto;
  color: #4e5969;
}
.pla-link { color: #165dff; cursor: pointer; font-size: 14px; line-height: 32px; }

/* ---------- 列表 ---------- */
.pla-table { width: 100%; }
.pla-empty { color: #909399; font-size: 12px; padding: 40px 0; }

/* ---------- 分页 ---------- */
.pla-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.pla-total { color: #86909c; font-size: 13px; }
.pla-size-select { width: 108px; }
</style>

<style>
/* 弹窗外壳：与线上一致（头部无内边距、body 自行排版） */
.pla-dialog { padding: 0; }
.pla-dialog .el-dialog__header { margin-right: 0; padding: 14px 20px 0; }
.pla-dialog .el-dialog__body { padding: 12px 20px 0; }
.pla-dialog .el-dialog__footer { padding: 12px 20px 16px; }
.pla-dialog .el-input__wrapper { box-shadow: 0 0 0 1px #c9cdd4 inset; }
</style>
