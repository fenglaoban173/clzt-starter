<template>
  <el-dialog
    :model-value="modelValue"
    title="策略组"
    width="990px"
    class="sg-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="sg-body">
      <!-- 页签（线上：策略组 / 铺剧策略） -->
      <el-tabs v-model="tab" class="sg-tabs">
        <el-tab-pane label="策略组" name="group" />
        <el-tab-pane label="铺剧策略" name="drama" />
      </el-tabs>
      <!-- 查询条件（对齐线上：每行 3 列，第 2 行第 3 列放名称检索 + 清空 + 自定义列） -->
      <div class="sg-filter">
        <el-select v-model="filters.objective" class="sg-f" placeholder="全部">
          <template #prefix><span class="sg-label">推广目的：</span></template>
          <el-option v-for="o in OBJECTIVES" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="filters.delivery_mode" class="sg-f" placeholder="全部">
          <template #prefix><span class="sg-label">投放模式：</span></template>
          <el-option v-for="o in DELIVERY_MODES" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="filters.marketing_goal" class="sg-f" placeholder="全部">
          <template #prefix><span class="sg-label">营销场景：</span></template>
          <el-option v-for="o in MARKETING_GOALS" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="filters.ad_type" class="sg-f" placeholder="全部">
          <template #prefix><span class="sg-label">广告类型：</span></template>
          <el-option v-for="o in AD_TYPES" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="filters.delivery_type" class="sg-f" placeholder="全部">
          <template #prefix><span class="sg-label">投放类型：</span></template>
          <el-option v-for="o in DELIVERY_TYPES" :key="o" :label="o" :value="o" />
        </el-select>
        <div class="sg-search-group">
          <el-select v-model="filters.nameType" class="sg-name-type">
            <el-option label="名称" value="name" />
            <el-option label="ID" value="id" />
          </el-select>
          <el-input v-model="filters.name" class="sg-search" placeholder="请输入关键词" clearable @keyup.enter="onSearch">
            <template #suffix><el-icon class="sg-search-icon"><Search /></el-icon></template>
          </el-input>
          <el-button class="sg-search-btn" circle @click="onSearch"><el-icon><Search /></el-icon></el-button>
        </div>
        <el-button link type="primary" class="sg-clear" @click="resetFilters">清空</el-button>
        <el-button class="sg-col-btn" @click="colVisible = true"><el-icon><Operation /></el-icon>自定义列</el-button>
      </div>

      <!-- 策略组列表 -->
      <el-table
        :data="pageRows"
        border
        size="small"
        height="352"
        highlight-current-row
        @row-click="onRowClick"
      >
        <el-table-column width="44" align="center">
          <template #default="{ row }">
            <el-radio :model-value="selectedId" :value="row.id" @change="select(row)" @click.stop />
          </template>
        </el-table-column>
        <el-table-column label="策略组ID" prop="id" width="90" show-overflow-tooltip />
        <el-table-column label="策略组名称" prop="name" width="150" show-overflow-tooltip />
        <el-table-column
          v-if="tab === 'drama'"
          label="描述"
          prop="description"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          v-for="c in shownColumns"
          :key="c.key"
          :label="c.label"
          :prop="c.prop"
          :width="c.width"
          :fixed="c.fixed"
          show-overflow-tooltip
        />
        <el-table-column v-if="colVisibleKeys.includes('action')" label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="onCopy(row)">复制</el-button>
            <el-button link type="danger" @click.stop="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="sg-pager">
        <span class="sg-total">共 {{ filtered.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filtered.length"
          layout="prev, pager, next"
          small
        />
        <span class="sg-jump">前往</span>
        <el-input v-model="jumpPage" class="sg-jump-input" size="small" />
        <span class="sg-jump">页</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="!selected" @click="confirm">确定</el-button>
    </template>
  </el-dialog>

  <!-- 自定义指标（列表列显示设置） -->
  <CustomColumnDialog
    v-model="colVisible"
    :columns="COLUMNS"
    :selected="colVisibleKeys"
    @confirm="onColumnsConfirm"
  />
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Operation, Search } from '@element-plus/icons-vue';
import { strategyGroups } from '@/mock/strategyGroups';
import CustomColumnDialog from './CustomColumnDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

// 可自定义显示的列表列（策略组ID / 策略组名称固定展示）
const COLUMNS = [
  { key: 'build_mode', label: '搭建模式', prop: 'build_mode', width: 70 },
  { key: 'objective', label: '推广目的', prop: 'objective', width: 90 },
  { key: 'delivery_mode', label: '投放模式', prop: 'delivery_mode', width: 115 },
  { key: 'marketing_goal', label: '营销场景', prop: 'marketing_goal', width: 95 },
  { key: 'ad_type', label: '广告类型', prop: 'ad_type', width: 95 },
  { key: 'delivery_type', label: '投放类型', prop: 'delivery_type', width: 95 },
  { key: 'description', label: '描述', prop: 'description', width: 180 },
  { key: 'action', label: '操作', prop: '', width: 90 },
];

// 查询条件选项（对齐线上枚举，固定值）
const OBJECTIVES = ['应用推广', '销售线索', '小程序', '电商', '快应用', '商品', '内容营销'];
const DELIVERY_MODES = ['手动投放', '自动投放(UBMax)'];
const MARKETING_GOALS = ['短视频/图片', '直播'];
const AD_TYPES = ['通投广告', '搜索广告'];
const DELIVERY_TYPES = ['常规投放', '周期稳投', '智能托管'];

// 列表数据（原型本地模拟，复制 / 删除在本地生效）
const tab = ref('group');
const list = ref([...strategyGroups]);
const selectedId = ref('');
const page = ref(1);
const pageSize = 10;
const jumpPage = ref('1');
const filters = reactive({
  objective: '', delivery_mode: '', marketing_goal: '', ad_type: '', delivery_type: '', name: '', nameType: 'name',
});

// 自定义指标（列表列显示设置）
// 注：线上「描述」列属于铺剧策略表（该页签本轮不实现），故策略组表不渲染该列，
// 但仍保留在「自定义指标」的勾选清单里，与线上一致。
const colVisible = ref(false);
const colVisibleKeys = ref(COLUMNS.map((c) => c.key));
const shownColumns = computed(() => COLUMNS.filter((c) => (
  c.key !== 'action' && c.key !== 'description' && colVisibleKeys.value.includes(c.key)
)));

const filtered = computed(() => list.value.filter((s) => {
  if (filters.objective && s.objective !== filters.objective) return false;
  if (filters.delivery_mode && s.delivery_mode !== filters.delivery_mode) return false;
  if (filters.marketing_goal && s.marketing_goal !== filters.marketing_goal) return false;
  if (filters.ad_type && s.ad_type !== filters.ad_type) return false;
  if (filters.delivery_type && s.delivery_type !== filters.delivery_type) return false;
  const kw = String(filters.name || '').trim().toLowerCase();
  if (kw) {
    const hit = filters.nameType === 'id'
      ? String(s.id).toLowerCase().includes(kw)
      : s.name.toLowerCase().includes(kw);
    if (!hit) return false;
  }
  return true;
}));

const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const selected = computed(() => list.value.find((s) => String(s.id) === String(selectedId.value)) || null);

// 筛选条件变化后回到第一页
watch(() => ({ ...filters }), () => { page.value = 1; });

function init() {
  list.value = [...strategyGroups];
  selectedId.value = '';
  page.value = 1;
  jumpPage.value = '1';
  resetFilters();
}

function onSearch() { page.value = 1; }
function resetFilters() {
  Object.assign(filters, {
    objective: '', delivery_mode: '', marketing_goal: '', ad_type: '', delivery_type: '', name: '', nameType: 'name',
  });
  page.value = 1;
}

function select(row) { selectedId.value = row.id; }
function onRowClick(row) { selectedId.value = row.id; }

function onCopy(row) {
  const copy = {
    ...row,
    id: String(Date.now()),
    name: `${row.name}-副本`,
    updated_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  list.value = [copy, ...list.value];
  ElMessage.success(`已复制策略组「${row.name}」`);
}

function onDelete(row) {
  list.value = list.value.filter((s) => s.id !== row.id);
  if (selectedId.value === row.id) selectedId.value = '';
  ElMessage.success(`已删除策略组「${row.name}」`);
}

/** 自定义指标确认：按勾选结果显示列表列 */
function onColumnsConfirm(keys) {
  colVisibleKeys.value = keys;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (!selected.value) {
    ElMessage.warning('请选择一个策略组');
    return;
  }
  emit('confirm', selected.value);
  close();
}
</script>

<style scoped>
.sg-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #1d2129;
}
/* 查询条件：每行 3 列，宽度对齐线上（242px + 10px 间距） */
.sg-filter { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.sg-f { width: 242px !important; flex: 0 0 242px; }
.sg-label { font-size: 14px; color: #4e5969; white-space: nowrap; }
.sg-name-label { font-size: 14px; color: #4e5969; white-space: nowrap; }
/* 名称检索组：维度下拉 + 关键词输入 + 放大镜按钮 */
.sg-search-group { display: flex; align-items: center; flex: 0 0 288px; }
.sg-name-type { width: 84px !important; flex: 0 0 84px; }
.sg-search { width: 140px !important; flex: 1 1 auto; min-width: 0; }
.sg-search-icon { cursor: pointer; }
.sg-search-btn { width: 32px; height: 32px; margin-left: 6px; padding: 0; flex: 0 0 32px; }
.sg-clear { padding: 0 4px; }
.sg-col-btn { margin-left: auto; }
/* 分页 */
.sg-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.sg-total { font-size: 14px; color: #4e5969; }
.sg-jump { font-size: 14px; color: #4e5969; }
.sg-jump-input { width: 46px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式） */
.sg-dialog .el-dialog__title { color: #1d2129; font-size: 16px; font-weight: 600; }
.sg-dialog .el-dialog__body { padding-top: 12px; }
</style>
