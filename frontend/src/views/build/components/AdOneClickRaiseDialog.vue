<template>
  <el-dialog
    :model-value="modelValue"
    title="设置一键起量"
    width="980px"
    top="6vh"
    align-center
    class="mcr-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="mcr-body">
      <!-- 顶部说明 -->
      <div class="mcr-desc">
        已选 <b class="mcr-desc-num">{{ rows.length }}</b> 个可调整广告，<span
          class="mcr-desc-warn"
          >将全量更新所有预约中的起量方案，已生效的不受影响。</span
        >
      </div>

      <!-- 预算设置规则 -->
      <div class="mcr-item">
        <span class="mcr-label">预算设置规则</span>
        <div class="mcr-content">
          <el-radio-group v-model="budgetRule" size="small" class="mcr-radio mcr-radio-plain">
            <el-radio-button border value="all">统一设置</el-radio-button>
            <el-radio-button border value="each">分别设置</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 起量预算批量（分别设置时展示） -->
      <div v-if="budgetRule === 'each'" class="mcr-item">
        <span class="mcr-label">起量预算批量</span>
        <div class="mcr-content mcr-content-inline">
          <el-select v-model="budgetOp" class="mcr-op-select">
            <el-option v-for="o in BUDGET_OPS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-input v-model="budget" class="mcr-budget-input">
            <template #suffix>元</template>
          </el-input>
          <el-button type="primary" size="small" class="mcr-apply" @click="applyBudgetAll">应用</el-button>
        </div>
      </div>

      <!-- 起量生效时间 -->
      <div class="mcr-item">
        <span class="mcr-label">起量生效时间</span>
        <div class="mcr-content">
          <el-radio-group v-model="timeMode" size="small" class="mcr-radio">
            <el-radio-button border value="now" :disabled="!canImmediate">
              <el-tooltip :content="NOW_TIP" placement="top" :disabled="canImmediate">
                <span class="mcr-radio-text">立即生效</span>
              </el-tooltip>
            </el-radio-button>
            <el-radio-button border value="appoint">指定时间</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 起量方案：每个方案 = 一个矩形模块（重复周期 + 起量时间 + 该方案自己的广告列表） -->
      <div v-if="timeMode === 'appoint'" ref="plansBox" class="mcr-plans">
        <div v-for="(plan, pi) in plans" :key="plan.id" class="mcr-plan" :data-plan="plan.id">
          <div class="mcr-plan-head">起量方案 {{ pi + 1 }}</div>
          <div class="mcr-plan-body">
            <div class="mcr-item">
              <span class="mcr-label">重复周期</span>
              <div class="mcr-content">
                <el-radio-group v-model="plan.repeat" size="small" class="mcr-radio">
                  <el-radio-button border value="once">仅一次</el-radio-button>
                  <el-radio-button border value="weekly">每周重复</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <template v-if="plan.repeat === 'weekly'">
              <div class="mcr-item">
                <span class="mcr-label"></span>
                <div class="mcr-content">
                  <p class="mcr-tip">周期起量任务默认在{{ WEEKLY_DAYS }}天（{{ weeklyEndDate }}）后自行结束</p>
                  <div class="mcr-weekdays">
                    <button
                      v-for="w in WEEKDAYS"
                      :key="w.value"
                      type="button"
                      class="mcr-weekday"
                      :class="{ 'is-active': (plan.weekdays || []).includes(w.value) }"
                      @click="toggleWeekday(plan, w.value)"
                    >
                      {{ w.label }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <div class="mcr-item">
              <span class="mcr-label">起量时间</span>
              <div class="mcr-content mcr-content-inline">
                <el-date-picker
                  v-model="plan.time"
                  type="datetime"
                  placeholder="请选择起量时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  size="small"
                  class="mcr-time-picker"
                  :prefix-icon="Clock"
                />
                <span class="mcr-warn">
                  <i class="mcr-warn-icon">!</i>
                  方案之间起量时间最少间隔6小时
                </span>
              </div>
            </div>

            <!-- 本方案的广告列表（表格在方案矩形内部） -->
            <el-table
              :key="`${plan.id}-${budgetRule}`"
              :data="plan.rows"
              border
              size="small"
              class="mcr-table"
              max-height="300"
              :span-method="(o) => spanBudgetCell(o, plan)"
            >
              <el-table-column label="广告" min-width="240">
                <template #default="{ row }">
                  <div class="mcr-cell">
                    <div class="mcr-cell-title" :title="row.name">{{ row.name }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="当日消耗" width="100" align="right">
                <template #default="{ row }">{{ num(row.stat_cost) }}</template>
              </el-table-column>
              <el-table-column label="转化成本" width="100" align="right">
                <template #default="{ row }">{{ num(row.convert_cost) }}</template>
              </el-table-column>
              <el-table-column label="当前预算" width="120" align="right">
                <template #default="{ row }">{{ num(row.budget) }}</template>
              </el-table-column>
              <el-table-column label="出价" width="90" align="right">
                <template #default="{ row }">{{ num(row.bid) }}</template>
              </el-table-column>
              <el-table-column :label="budgetColLabel" min-width="180">
                <template #default="{ row }">
                  <el-input
                    v-if="budgetRule === 'each'"
                    v-model="row.raiseBudget"
                    placeholder="请输入起量预算"
                    size="small"
                    class="mcr-cell-input"
                  />
                  <div v-else class="mcr-uni-cell">
                    <el-input
                      v-model="plan.raiseBudget"
                      placeholder="请输入起量预算"
                      size="small"
                      class="mcr-uni-input"
                    />
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 添加起量方案：整体新增一个「方案块 + 该方案广告列表」模块 -->
        <button type="button" class="mcr-add-plan" @click="addPlan">
          <span class="mcr-add-plan-plus">＋</span> 添加起量方案
        </button>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" class="mcr-submit" @click="confirm">开启一键起量</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock } from '@element-plus/icons-vue';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '开启一键起量';

/** 起量预算批量调整方式（与线上一致：降低 / 按 % 降低 / 等于原预算） */
const BUDGET_OPS = [
  { label: '降低', value: 'lower' },
  { label: '按 % 降低', value: 'lowerPercent' },
  { label: '等于原预算', value: 'equals' },
];

/** 重复周几（每周重复时可选，可多选） */
const WEEKDAYS = [
  { label: '每天', value: 'EVERY_DAY' },
  { label: '每周一', value: 'PER_MONDAY' },
  { label: '每周二', value: 'PER_TUESDAY' },
  { label: '每周三', value: 'PER_WEDNESDAY' },
  { label: '每周四', value: 'PER_THURSDAY' },
  { label: '每周五', value: 'PER_FRIDAY' },
  { label: '每周六', value: 'PER_SATURDAY' },
  { label: '每周日', value: 'PER_SUNDAY' },
];

/** 周期起量任务默认结束天数（与线上一致） */
const WEEKLY_DAYS = 56;

/** 「立即生效」提示 */
const NOW_TIP = '仅所选广告均为"投放中"状态可设置立即生效。';

/** 可操作广告（去掉合计行） */
const rows = ref([]);

// 预算设置规则：all 统一设置 / each 分别设置
const budgetRule = ref('all');
// 起量预算批量：调整方式 + 金额
const budgetOp = ref('lower');
const budget = ref('');
// 起量生效时间：now 立即生效 / appoint 指定时间
const timeMode = ref('appoint');
// 起量方案列表（每个方案自带一份广告列表）
const plans = ref([]);
// 起量方案区域
const plansBox = ref(null);

/** 起量预算列标题：跟随「预算设置规则」切换 */
const budgetColLabel = computed(() =>
  budgetRule.value === 'all' ? '统一设置起量预算' : '分别设置起量预算'
);

/** 周期起量任务默认结束日期（今天 + 56 天） */
const weeklyEndDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + WEEKLY_DAYS);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${p(d.getMonth() + 1)}月${p(d.getDate())}日`;
});

/** 所选广告是否全部「投放中」（决定「立即生效」是否可用） */
const canImmediate = computed(
  () => rows.value.length > 0 && rows.value.every((r) => r.enabled === true || r.status === 'enabled')
);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function init() {
  budgetRule.value = 'all';
  budgetOp.value = 'lower';
  budget.value = '';
  timeMode.value = 'appoint';
  const list = (props.rows || []).filter((r) => !r.__summary);
  rows.value = list.map((r) => ({
    id: r.id,
    pid: r.ad_id || r.id,
    name: r.name,
    enabled: r.enabled,
    status: r.status,
    stat_cost: Number(r.stat_cost) || 0,
    convert_cost: Number(r.convert_cost) || 0,
    budget: Number(r.budget) || 0,
    bid: Number(r.bid) || 0,
    raiseBudget: '',
  }));
  plans.value = [newPlan()];
}

/** 新建一个起量方案（自带一份广告列表，预算互相独立） */
function newPlan() {
  return {
    id: Date.now() + Math.random(),
    repeat: 'once',
    weekdays: ['EVERY_DAY'],
    time: '',
    // 统一设置：整张表一个预算
    raiseBudget: '',
    // 分别设置：每条广告一个预算
    rows: rows.value.map((r) => ({ ...r, raiseBudget: '' })),
  };
}

/** 周几多选：选「每天」清空其它星期；选具体星期则取消「每天」 */
function toggleWeekday(plan, value) {
  const cur = plan.weekdays || [];
  if (value === 'EVERY_DAY') {
    // 「每天」与其它星期互斥：选中即清空已勾选的多个星期
    plan.weekdays = cur.length === 1 && cur[0] === 'EVERY_DAY' ? [] : ['EVERY_DAY'];
    return;
  }
  const next = cur.filter((v) => v !== 'EVERY_DAY');
  const i = next.indexOf(value);
  if (i >= 0) next.splice(i, 1);
  else next.push(value);
  plan.weekdays = next;
}

/** 统一设置时把最后一列合并成一格（整张表只填一个预算） */
function spanBudgetCell({ columnIndex, rowIndex }, plan) {
  if (budgetRule.value !== 'all') return undefined;
  if (columnIndex !== 5) return undefined;
  if (!plan.rows.length) return undefined;
  if (rowIndex === 0) return [plan.rows.length, 1];
  return [0, 0];
}

/** 添加起量方案：在最后一个方案下方整体新增一个「方案块 + 广告列表」模块 */
async function addPlan() {
  const plan = newPlan();
  plans.value = [...plans.value, plan];
  await nextTick();
  const box = plansBox.value;
  const el = box && box.querySelector(`[data-plan="${plan.id}"]`);
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
}

/** 起量预算批量应用到所有方案的广告 */
function applyBudgetAll() {
  const val = budget.value;
  if (val === '') {
    ElMessage.warning('请输入起量预算');
    return;
  }
  plans.value.forEach((p) => {
    p.raiseBudget = val;
    p.rows.forEach((r) => {
      r.raiseBudget = val;
    });
  });
}

/** 取某个方案的起量预算（统一设置取整表值，分别设置取首个已填值） */
function planBudget(plan) {
  if (budgetRule.value === 'all') return plan.raiseBudget || '';
  const hit = (plan.rows || []).find((r) => r.raiseBudget !== '');
  return hit ? hit.raiseBudget : '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const noBudget = plans.value.some((p) => !planBudget(p));
  if (noBudget) {
    ElMessage.warning('请输入起量预算');
    return;
  }
  if (timeMode.value === 'appoint') {
    const noTime = plans.value.some((p) => !p.time);
    if (noTime) {
      ElMessage.warning('请选择起量时间');
      return;
    }
  }
  const form = {
    budgetRule: budgetRule.value === 'all' ? '统一设置' : '分别设置',
    raise_budget: budget.value,
    budget_op: budgetOp.value,
    is_effective_now: timeMode.value === 'now' ? '立即生效' : '指定时间',
    plans: plans.value.map((p) => ({
      raise_budget: planBudget(p),
      is_effective_now: timeMode.value === 'now' ? '立即生效' : '指定时间',
      raise_time: p.time,
      repeated_day: p.repeat === 'weekly' ? (p.weekdays || []) : undefined,
      rows: (p.rows || []).map((r) => ({ ad_id: r.pid, raise_budget: r.raiseBudget })),
    })),
  };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(
    `原型：已提交设置一键起量任务（${rows.value.length} 条广告，起量方案 ${plans.value.length} 个）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.mcr-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 12px;
  font-size: 14px;
  color: #606266;
}

/* 顶部说明 */
.mcr-desc { margin-bottom: 18px; font-size: 14px; line-height: 20px; color: #606266; }
.mcr-desc-num { color: #197afb; font-weight: 400; }
.mcr-desc-warn { color: #f5a623; }

/* 表单行：标签 100px */
.mcr-item { display: flex; align-items: flex-start; margin-bottom: 18px; }
.mcr-label { flex: none; width: 100px; font-size: 14px; line-height: 32px; color: #666; }
.mcr-content { flex: 1; min-width: 0; }
.mcr-content-inline { display: flex; align-items: center; gap: 12px; }

/* 起量预算批量：下拉 120px / 金额 120px */
.mcr-op-select { width: 120px; }
.mcr-op-select :deep(.el-select__wrapper) { min-height: 32px; }
.mcr-budget-input { width: 120px; --el-input-height: 32px; }

/* 起量时间选择器（260px / 32px） */
.mcr-time-picker { width: 260px; }
.mcr-time-picker :deep(.el-date-editor) { width: 260px; --el-input-height: 32px; }

/* 橙色提示（方案间隔 6 小时） */
.mcr-warn { display: inline-flex; align-items: center; font-size: 14px; color: #f5a623; }
.mcr-warn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  border-radius: 50%;
  background: #f5a623;
  color: #fff;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 16px;
}

/* 起量方案矩形模块：重复周期 + 起量时间 + 该方案的广告列表 */
.mcr-plan { margin-bottom: 16px; border: 1px solid #e8eaec; }
.mcr-plan:last-child { margin-bottom: 16px; }
.mcr-plan-head {
  padding: 12px 16px;
  border-bottom: 1px solid #e8eaec;
  background: #fff;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.mcr-plan-body { padding: 18px 16px 16px; }
.mcr-plan-body .mcr-item:last-of-type { margin-bottom: 18px; }

/* 说明文案（12px #999） */
.mcr-tip { margin: 0 0 10px; font-size: 12px; line-height: 18px; color: #999; }

/* 周几按钮组（折角样式） */
.mcr-weekdays { display: flex; gap: 8px; }
.mcr-weekday {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.mcr-weekday::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0;
  height: 0;
  border-top: 8px solid #dcdfe6;
  border-left: 8px solid transparent;
}
.mcr-weekday.is-active {
  border-color: #197afb;
  background: #d6eaff;
  color: #197afb;
}
.mcr-weekday.is-active::after { border-top-color: #197afb; }

/* 「＋ 添加起量方案」虚线按钮 */
.mcr-add-plan {
  width: 100%;
  height: 40px;
  margin-top: 4px;
  border: 1px dashed #dcdfe6;
  border-radius: 2px;
  background: #fff;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
}
.mcr-add-plan:hover { border-color: #197afb; color: #197afb; }
.mcr-add-plan-plus { margin-right: 2px; }

/* 广告表格（与线上一致：表头 48px / 行高 48px / 边框 #ebeef5） */
.mcr-table { --el-table-border-color: #ebeef5; --el-table-header-text-color: #333; width: 100%; }
.mcr-table :deep(.el-table__header-wrapper th.el-table__cell) { height: 48px; padding: 0; background: #fff; }
.mcr-table :deep(.el-table__body-wrapper td.el-table__cell) { height: 48px; padding: 5.5px 0; }
.mcr-table :deep(th.el-table__cell .cell) { font-size: 12px; font-weight: 700; color: #333; }
.mcr-table :deep(td.el-table__cell .cell) { font-size: 12px; line-height: 18px; color: #333; }

/* 单元格内的广告名称 */
.mcr-cell-title { font-size: 12px; line-height: 18px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 单元格内的输入框（占满单元格，32px 高） */
.mcr-cell-input { width: 100%; --el-input-height: 32px; }

/* 统一设置：最后一列合并成一格，输入框吸顶可见 */
.mcr-uni-cell { position: sticky; top: 0; z-index: 1; background: #fff; padding: 2px 0; }
.mcr-uni-input { width: 100%; --el-input-height: 32px; }

/* 分段按钮（选中为蓝字 + 浅蓝底 + 蓝框，与线上一致） */
.mcr-radio :deep(.el-radio-button__inner) {
  min-width: 110px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.mcr-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
.mcr-radio :deep(.el-radio-button__original-radio:disabled + .el-radio-button__inner) {
  color: #c0c4cc;
  background: #fff;
  border-color: #ebeef5;
}
/* 气泡内文字 */
.mcr-radio-plain :deep(.el-radio-button:not(.is-active) .el-radio-button__inner) {
  border-color: transparent;
  background: transparent;
}

.mcr-radio-text { display: inline-block; }
</style>

<style>
/* 弹窗外壳：与线上一致（标题 16px 700 #333 / body 20px 24px）；高度固定，内容纵向滚动 */
.mcr-dialog {
  display: flex;
  flex-direction: column;
  height: min(800px, 95vh);
  max-height: 95vh;
  padding: 0;
}
.mcr-dialog .el-dialog__header { flex: none; margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.mcr-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.mcr-dialog .el-dialog__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px 24px; }
.mcr-dialog .el-dialog__footer { flex: none; padding: 0 24px 20px; }
.mcr-dialog .el-dialog__footer .el-button { height: 32px; }
.mcr-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 「应用」按钮（92×32，主色 #197afb） */
.mcr-dialog .mcr-apply {
  width: 92px;
  padding: 0;
  font-size: 12px;
  background: #197afb;
  border-color: #197afb;
}
.mcr-dialog .mcr-apply:hover { background: #4a9bff; border-color: #4a9bff; }

/* 页脚主按钮配色与线上一致 */
.mcr-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.mcr-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 页脚次按钮（线上边框 #d0d0d0） */
.mcr-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
</style>
