<template>
  <!-- 「数据筛选」弹层（线上 1:1）
   * 结构：头部行（设置筛选条件 / 符合以下 [所有|任一] 条件）
   *      → 条件行（指标 select + 运算符 select + 值 input + ×）
   *      → 底部行（+ 添加条件 / 确定）
   * 线上没有「重置 / 清空」按钮，故本组件也不提供。 -->
  <el-popover
    v-model:visible="visible"
    placement="bottom"
    :width="POPOVER_WIDTH"
    trigger="click"
    popper-class="data-filter-popper"
  >
    <template #reference>
      <button class="report-filter-btn" type="button">
        <el-icon><Filter /></el-icon>筛选
      </button>
    </template>

    <div class="df-pop">
      <!-- 头部行 -->
      <div class="df-head">
        <span class="df-title">设置筛选条件</span>
        <span class="df-logic">
          <span class="df-txt">符合以下</span>
          <el-select v-model="logic" class="df-logic-select" size="small" :teleported="false">
            <el-option label="所有" value="all" />
            <el-option label="任一" value="any" />
          </el-select>
          <span class="df-txt">条件</span>
        </span>
      </div>

      <!-- 条件行 -->
      <div v-for="(c, i) in conditions" :key="c.id" class="df-row">
        <el-select
          v-model="c.metric"
          class="df-select df-metric"
          size="small"
          placeholder="请选择"
          :teleported="false"
        >
          <el-option
            v-for="(m, mi) in metricOptions"
            :key="`${mi}-${m}`"
            :label="m"
            :value="m"
          />
        </el-select>

        <el-select v-model="c.operator" class="df-select df-op" size="small" :teleported="false">
          <el-option v-for="o in OPERATORS" :key="o" :label="o" :value="o" />
        </el-select>

        <el-input v-model="c.value" class="df-value" size="small" placeholder="请输入" />

        <button class="df-remove" type="button" title="删除条件" @click="removeCondition(i)">×</button>
      </div>

      <!-- 底部行 -->
      <div class="df-foot">
        <button class="df-add" type="button" @click="addCondition">+ 添加条件</button>
        <el-button
          type="primary"
          size="small"
          class="df-confirm"
          :class="{ 'is-disabled': !canConfirm }"
          @click="onConfirm"
        >
          确定
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<!--
  普通 <script>：模块级常量与工具函数，供 5 个报表页复用
  （<script setup> 不允许 export，故单独开一个 script 块）
-->
<script>
import { REPORT_METRICS } from '@/mock/reportMetrics';

/** 运算符选项（线上固定 5 项） */
export const DATA_FILTER_OPERATORS = ['大于等于', '小于等于', '大于', '小于', '等于'];

/** 弹层宽度（线上实测 372px） */
export const DATA_FILTER_POPOVER_WIDTH = 372;

/**
 * 取某个报表页的全部指标：把 blocks 里所有 metrics 的 name 按 blocks 顺序摊平
 * （线上「筛选」弹层里指标下拉的选项即为此顺序）
 */
export function reportMetricOptions(metricKey) {
  const blocks = (REPORT_METRICS[metricKey] || {}).blocks || [];
  const out = [];
  blocks.forEach((b) => {
    (b.metrics || []).forEach((m) => {
      if (m && m.name) out.push(m.name);
    });
  });
  return out;
}

/** 指标值 → 数字（去掉 ¥ % 千分位等修饰） */
export function toMetricNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v === null || v === undefined ? '' : v).replace(/[¥,%\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 单条条件的数值比较 */
export function compareMetricValue(actual, operator, expected) {
  switch (operator) {
    case '大于等于':
      return actual >= expected;
    case '小于等于':
      return actual <= expected;
    case '大于':
      return actual > expected;
    case '小于':
      return actual < expected;
    case '等于':
      return actual === expected;
    default:
      return true;
  }
}

/**
 * 判断一行数据是否满足「数据筛选」条件
 * 所有 = AND，任一 = OR；未填完整的条件不参与比较
 */
export function matchDataFilter(row, filter, resolve) {
  const conds = ((filter && filter.conditions) || []).filter(
    (c) =>
      c &&
      c.metric &&
      String(c.value === null || c.value === undefined ? '' : c.value).trim() !== ''
  );
  if (!conds.length) return true;
  const getter = typeof resolve === 'function' ? resolve : (r, m) => (r ? r[m] : undefined);
  const hits = conds.map((c) => {
    const actual = toMetricNumber(getter(row, c.metric));
    const expected = Number(String(c.value).trim());
    if (actual === null || !Number.isFinite(expected)) return false;
    return compareMetricValue(actual, c.operator || '大于等于', expected);
  });
  return filter.logic === 'any' ? hits.some(Boolean) : hits.every(Boolean);
}

/** FNV-1a + 雪崩混合：给没有绑定 mock 字段的指标生成稳定演示值 */
function hashLite(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** mock 数据没有绑定字段的指标：按指标名生成稳定的演示值（供各页兜底取数） */
export function demoMetricValue(row, name, cost = 0) {
  const base = Number(cost) || 0;
  const h = hashLite(`${name}|${(row && row.id) || ''}|${(row && row.date) || ''}`);
  if (/率$/.test(name)) return `${((h % 10000) / 100).toFixed(2)}%`;
  if (/(成本|费用|单价|花费|消耗|金额|均价|ROI)/.test(name)) {
    return (base * 0.1 + (h % 1000) / 100).toFixed(2);
  }
  return String(Math.round(base * 20 + (h % 5000)));
}
</script>

<script setup>
import { computed, ref, watch } from 'vue';
import { Filter } from '@element-plus/icons-vue';

const props = defineProps({
  /** 报表页标识：account / project / ad / component / material */
  metricKey: { type: String, required: true },
});
const emit = defineEmits(['apply']);

/** 弹层显隐（保留原有 v-model:visible 用法） */
const visible = defineModel('visible', { type: Boolean, default: false });
/** 已生效的筛选条件（{ logic, conditions }） */
const filter = defineModel('filter', {
  type: Object,
  default: () => ({ logic: 'all', conditions: [] }),
});

const OPERATORS = DATA_FILTER_OPERATORS;
const POPOVER_WIDTH = DATA_FILTER_POPOVER_WIDTH;

let uid = 0;
function newCondition() {
  uid += 1;
  return { id: uid, metric: '', operator: '大于等于', value: '' };
}

// ---------- 草稿状态（弹层内的编辑态） ----------
const logic = ref('all');
const conditions = ref([newCondition()]);

/** 指标下拉选项 = 该页全部指标（blocks 顺序摊平） */
const metricOptions = computed(() => reportMetricOptions(props.metricKey));

/**
 * 「确定」是否可用：
 * - 有填完整的条件 → 可用
 * - 已有生效条件 → 仍可用（允许把条件清空，从而撤销筛选；线上没有「重置」按钮）
 * - 什么都没有 → 置灰（与线上一致：条件未填完时「确定」是半透明态）
 */
const canConfirm = computed(() => {
  if (conditions.value.some((c) => c.metric && String(c.value || '').trim() !== '')) return true;
  return ((filter.value && filter.value.conditions) || []).length > 0;
});

// 每次打开：以「已生效的条件」为准；没有生效条件则给 1 条空条件行
watch(visible, (v) => {
  if (!v) return;
  const applied = filter.value || {};
  if (applied.conditions && applied.conditions.length) {
    logic.value = applied.logic || 'all';
    conditions.value = applied.conditions.map((c) => {
      uid += 1;
      return {
        id: uid,
        metric: c.metric || '',
        operator: c.operator || '大于等于',
        value: c.value === null || c.value === undefined ? '' : String(c.value),
      };
    });
  } else {
    logic.value = 'all';
    conditions.value = [newCondition()];
  }
});

/** 「+ 添加条件」：追加一条条件行 */
function addCondition() {
  conditions.value.push(newCondition());
}

/** 「×」：删除该条件行（至少保留一行） */
function removeCondition(index) {
  conditions.value.splice(index, 1);
  if (!conditions.value.length) conditions.value.push(newCondition());
}

/** 「确定」：把条件写回并关闭弹层 */
function onConfirm() {
  if (!canConfirm.value) return;
  const payload = {
    logic: logic.value,
    conditions: conditions.value
      .filter((c) => c.metric && String(c.value || '').trim() !== '')
      .map((c) => ({
        metric: c.metric,
        operator: c.operator || '大于等于',
        value: String(c.value).trim(),
      })),
  };
  filter.value = payload;
  // 先关弹层再抛事件，保证任何情况下弹层都会关闭
  visible.value = false;
  emit('apply', payload);
}
</script>

<style scoped>
.df-pop {
  width: 100%;
}

/* 头部行：左标题 + 右「符合以下 [所有|任一] 条件」 */
.df-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.df-title,
.df-txt {
  font-size: 12px;
  color: #333333;
  white-space: nowrap;
}
.df-logic {
  display: flex;
  align-items: center;
  gap: 6px;
}
.df-logic-select {
  width: 75px;
  flex: 0 0 75px;
}

/* 条件行：指标 select + 运算符 select + 值 input + × */
.df-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.df-select,
.df-value {
  width: 100px;
  flex: 0 0 100px;
}
.df-remove {
  width: 20px;
  flex: 0 0 20px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8b8b8b;
  font-family: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.df-remove:hover {
  color: #197afb;
}

/* 底部行：左「+ 添加条件」 + 右「确定」 */
.df-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.df-add {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  /* 线上「+ 添加条件」是 14px 的操作链接（比头部文案大一号） */
  font-size: 14px;
  color: #333333;
  cursor: pointer;
}
.df-add:hover {
  color: #197afb;
}
.df-confirm {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  border-radius: 4px;
}
/* 条件未填完整时，线上「确定」是半透明置灰态 */
.df-confirm.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 控件尺寸对齐线上实测（高 28px；字号沿用 EP small 的 12px） */
.df-pop :deep(.el-select__wrapper),
.df-pop :deep(.el-input__wrapper) {
  box-sizing: border-box;
  height: 28px;
  min-height: 28px;
  border-radius: 4px;
}
</style>

<style>
/* 弹层根节点（teleport 到 body，需用非 scoped 样式） */
.el-popover.data-filter-popper {
  box-sizing: border-box;
  padding: 12px;
}
/* 弹层内的下拉不 teleported，避免点击选项时弹层被「点击外部」关闭 */
.el-popover.data-filter-popper .el-select__popper {
  z-index: 3000;
}
</style>
