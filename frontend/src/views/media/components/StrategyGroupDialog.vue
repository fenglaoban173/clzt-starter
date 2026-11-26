<template>
  <el-dialog
    :model-value="modelValue"
    width="990px"
    class="sg-dialog"
    align-center
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <!-- R110：线上无标题栏，页签直接置于弹窗顶部；R111：按用户要求先移除「铺剧策略」页签 -->
    <template #header>
      <el-tabs v-model="tab" class="sg-tabs">
        <el-tab-pane label="策略组" name="group" />
      </el-tabs>
    </template>
    <div class="sg-body">
      <!-- 查询条件（R110 对齐线上：标签在外、下拉 169px，每组 252px，一行 3 组；
           第 2 行第 3 组放「名称/ID + 关键词 + 放大镜」，右侧「清空 / 自定义列」） -->
      <div class="sg-filter">
        <div class="sg-field">
          <span class="sg-label">推广目的：</span>
          <el-select v-model="filters.objective" class="sg-f" size="small" placeholder="全部">
            <el-option v-for="o in OBJECTIVES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="sg-field">
          <span class="sg-label">投放模式：</span>
          <el-select v-model="filters.delivery_mode" class="sg-f" size="small" placeholder="全部">
            <el-option v-for="o in DELIVERY_MODES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="sg-field">
          <span class="sg-label">营销场景：</span>
          <el-select v-model="filters.marketing_goal" class="sg-f" size="small" placeholder="全部">
            <el-option v-for="o in MARKETING_GOALS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="sg-field">
          <span class="sg-label">广告类型：</span>
          <el-select v-model="filters.ad_type" class="sg-f" size="small" placeholder="全部">
            <el-option v-for="o in AD_TYPES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="sg-field">
          <span class="sg-label">投放类型：</span>
          <el-select v-model="filters.delivery_type" class="sg-f" size="small" placeholder="全部">
            <el-option v-for="o in DELIVERY_TYPES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="sg-search-group">
          <el-select v-model="filters.nameType" class="sg-name-type" size="small">
            <el-option label="名称" value="name" />
            <el-option label="ID" value="id" />
          </el-select>
          <el-input v-model="filters.name" class="sg-search" size="small" placeholder="请输入关键词" clearable @keyup.enter="onSearch">
            <template #suffix><el-icon class="sg-search-icon"><Search /></el-icon></template>
          </el-input>
          <el-button class="sg-search-btn" @click="onSearch"><el-icon><Search /></el-icon></el-button>
        </div>
        <el-button link type="primary" class="sg-clear" @click="resetFilters">清空</el-button>
        <el-button class="sg-col-btn" @click="colVisible = true"><el-icon><Operation /></el-icon>自定义列</el-button>
      </div>

      <!-- 策略组列表（R110：线上表格总高 452px；列 = 策略组ID/策略组名称/搭建模式/推广目的/投放模式/
           营销场景/广告类型/投放类型/描述/操作） -->
      <el-table
        :data="pageRows"
        border
        size="small"
        height="452"
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
// R110：线上「策略组」表含「描述」列（列序：搭建模式/推广目的/投放模式/营销场景/广告类型/投放类型/描述），
// 「操作」列固定在最右并可单独勾选。
const colVisible = ref(false);
const colVisibleKeys = ref(COLUMNS.map((c) => c.key));
const shownColumns = computed(() => COLUMNS.filter((c) => (
  c.key !== 'action' && colVisibleKeys.value.includes(c.key)
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
/* R110：线上页签贴在弹窗顶部（距顶 ~7px，页签高 40px） */
.sg-tabs :deep(.el-tabs__header) { margin: 0; }
.sg-tabs :deep(.el-tabs__nav-wrap) { height: 40px; }
.sg-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.sg-tabs :deep(.el-tabs__item) { height: 40px; line-height: 40px; padding: 0 14px; font-size: 14px; }
/* 查询条件（R110 对齐线上：标签 70px 在外 + 下拉 169px，每组 252px，行距 8px，下边距 28px） */
.sg-filter { display: flex; align-items: center; gap: 8px 0; flex-wrap: wrap; margin-bottom: 28px; }
.sg-field { display: flex; align-items: center; flex: 0 0 252px; width: 252px; }
.sg-f { width: 169px !important; flex: 0 0 169px; }
.sg-label { width: 70px; flex: 0 0 70px; font-size: 14px; color: #4e5969; white-space: nowrap; }
.sg-name-label { font-size: 14px; color: #4e5969; white-space: nowrap; }
/* 名称检索组：维度下拉(60) + 关键词输入 + 放大镜按钮(40) —— 线上整组 244px */
.sg-search-group { display: flex; align-items: center; flex: 0 0 244px; }
.sg-name-type { width: 60px !important; flex: 0 0 60px; }
.sg-search { flex: 1 1 auto; min-width: 0; }
.sg-search-icon { cursor: pointer; }
.sg-search-btn { width: 40px; height: 26px; margin-left: 6px; padding: 0; flex: 0 0 40px; border-radius: 4px; }
.sg-clear { padding: 0 4px; margin-left: 10px; }
.sg-col-btn { margin-left: auto; margin-right: 16px; width: 98px; height: 34px; }
/* 分页 */
.sg-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.sg-total { font-size: 14px; color: #4e5969; }
.sg-jump { font-size: 14px; color: #4e5969; }
.sg-jump-input { width: 46px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式） */
/* R110：线上选择策略弹窗实测 990×728 垂直居中；无标题栏，页签即顶部；
 * 弹窗自身 padding=0，表格左沿 481（=弹窗左沿+16），页签左沿 489（=+24）。 */
/* 注意：不要覆写 margin —— Element Plus 的 align-center 依赖 `.el-overlay-dialog.is-align-center
 * .el-dialog { margin: auto }` 做垂直居中；一旦把 margin-bottom 改成 0，margin-top:auto 会
 * 吃掉全部剩余空间，弹窗反而贴到视口底部。 */
.sg-dialog.el-dialog { height: 728px; padding: 0; display: flex; flex-direction: column; }
.sg-dialog .el-dialog__header { padding: 7px 24px 0; margin-right: 0; border-bottom: none; }
.sg-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: hidden; padding: 12px 16px 0; }
.sg-dialog .el-dialog__footer { padding: 12px 24px 16px; }
.sg-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.sg-dialog .el-dialog__headerbtn { top: 8px; right: 8px; }
</style>
