<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改时段"
    width="984px"
    class="ps-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <el-form label-width="144px" label-position="left" class="ps-form">
      <!-- 修改规则 -->
      <el-form-item label="修改规则">
        <el-radio-group v-model="rule" size="small" class="ps-radio">
          <el-radio-button border value="now">立即生效</el-radio-button>
          <el-radio-button border value="next_day">次日0时生效</el-radio-button>
          <el-radio-button border value="scheduled">自定义时间</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 生效时间（仅「自定义时间」时出现） -->
      <el-form-item v-if="rule === 'scheduled'" label="生效时间">
        <el-date-picker
          v-model="effectiveTime"
          type="datetime"
          placeholder="请选择生效时间"
          class="ps-date"
        />
      </el-form-item>

      <!-- 投放时段 -->
      <el-form-item label="投放时段">
        <el-radio-group v-model="slotType" size="small" class="ps-radio">
          <el-radio-button border value="all">不限</el-radio-button>
          <el-radio-button border value="specified">指定时间段</el-radio-button>
        </el-radio-group>

        <!-- 星期 × 时段栅格 -->
        <div v-if="slotType === 'specified'" class="ps-week">
          <table class="ps-week-table">
            <colgroup>
              <col style="width: 72px" />
              <col v-for="i in 48" :key="i" style="width: 12px" />
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2" class="ps-week-td">星期/时间</th>
                <th colspan="24" class="ps-group">00:00 - 12:00</th>
                <th colspan="24" class="ps-group">12:00 - 24:00</th>
              </tr>
              <tr class="ps-hour">
                <td v-for="h in 24" :key="h" colspan="2">{{ h - 1 }}</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in weekdays" :key="d">
                <td class="ps-week-td">{{ d }}</td>
                <td
                  v-for="j in 48"
                  :key="j"
                  class="ps-cell"
                  :class="{ on: slots[i][j - 1] }"
                  @mousedown.prevent="onSlotDown(i, j - 1)"
                  @mouseenter="onSlotEnter(i, j - 1)"
                ></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="49" class="ps-list-td">
                  <!-- 已选择时段（文字版） -->
                  <div class="ps-list-head">
                    <span class="ps-list-title">已选择时段</span>
                    <a class="ps-clear" @click="clearSlots">清空选择</a>
                  </div>
                  <div class="ps-list-body">
                    <div v-for="d in selectedDays" :key="d.name" class="ps-list-row">
                      <span class="ps-list-day">{{ d.name }}：</span>
                      <span class="ps-list-range">{{ d.ranges }}</span>
                    </div>
                    <div v-if="!selectedDays.length" class="ps-list-empty">暂无已选择的时段</div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">关 闭</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="confirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改项目排期';
const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

const rule = ref('now'); // now 立即生效 / next_day 次日0时生效 / scheduled 自定义时间
const effectiveTime = ref('');
const slotType = ref('specified'); // all 不限 / specified 指定时间段
const slots = ref([]); // 7 天 × 48 个半小时

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

/** 已选时段数量 */
const slotCount = computed(() => slots.value.reduce((n, day) => n + day.filter(Boolean).length, 0));

/** 「自定义时间」必须选生效时间；「指定时间段」必须至少选一格 */
const canConfirm = computed(() => {
  if (rule.value === 'scheduled' && !effectiveTime.value) return false;
  if (slotType.value === 'specified' && slotCount.value === 0) return false;
  return rows.value.length > 0;
});

const ruleText = computed(() => ({ now: '立即生效', next_day: '次日0时生效', scheduled: '自定义时间' }[rule.value]));

/** 半小时区段 → HH:MM */
function slotText(slot) {
  const h = Math.floor(slot / 2);
  const m = slot % 2 ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${m}`;
}

/** 把某一天的勾选区段整理成连续区间列表 */
function dayRanges(day) {
  const out = [];
  let start = -1;
  for (let i = 0; i < 48; i += 1) {
    if (day[i]) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      out.push([start, i - 1]);
      start = -1;
    }
  }
  if (start !== -1) out.push([start, 47]);
  return out;
}

/** 已选择时段（文字版）：星期一： 01:30~02:00、09:30~21:00 */
const selectedDays = computed(() =>
  weekdays
    .map((name, i) => ({
      name,
      ranges: dayRanges(slots.value[i] || []).map(([s, e]) => `${slotText(s)}~${e + 1 === 48 ? '24:00' : slotText(e + 1)}`).join('、'),
    }))
    .filter((d) => d.ranges)
);

function init() {
  rule.value = 'now';
  effectiveTime.value = '';
  slotType.value = 'specified';
  // 默认不预勾选任何时段（由用户在栅格上选择）
  slots.value = weekdays.map(() => Array(48).fill(false));
}

// ---- 栅格交互：点击切换 / 按住拖动连片圈选 ----
const dragActive = ref(false);
const dragValue = ref(true);

function onSlotDown(day, slot) {
  dragActive.value = true;
  dragValue.value = !slots.value[day][slot];
  slots.value[day][slot] = dragValue.value;
}

function onSlotEnter(day, slot) {
  if (!dragActive.value) return;
  slots.value[day][slot] = dragValue.value;
}

function endDrag() {
  dragActive.value = false;
}

onMounted(() => document.addEventListener('mouseup', endDrag));
onBeforeUnmount(() => document.removeEventListener('mouseup', endDrag));

function clearSlots() {
  slots.value = weekdays.map(() => Array(48).fill(false));
}

/** 时段序列化为 48×7 位 0/1 字符串（每天 48 个半小时区段） */
function scheduleTimeString() {
  if (slotType.value === 'all') return weekdays.map(() => '1'.repeat(48)).join('');
  return slots.value.map((day) => day.map((b) => (b ? '1' : '0')).join('')).join('');
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = {
    schedule_scene: rule.value === 'now' ? 'REALTIME' : rule.value === 'next_day' ? 'NEXT_DAY' : 'CUSTOM_TIME',
    effective_time: rule.value === 'scheduled' ? effectiveTime.value : undefined,
    schedule_time: scheduleTimeString(),
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(
    `原型：已提交批量修改项目时段任务（${rows.value.length} 个项目，${ruleText.value}${
      slotType.value === 'specified' ? `，已选 ${slotCount.value} 个半小时时段` : ''
    }）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.ps-form { font-size: 14px; color: #1d2129; }

/* 按钮组（与线上一致：选中为蓝字 + 浅蓝底 + 蓝框） */
.ps-radio :deep(.el-radio-button__inner) {
  padding: 7px 20px;
  font-size: 13px;
  color: #4e5969;
  background: #fff;
  border-color: #e5e6eb;
  box-shadow: none;
}
.ps-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #2563eb;
  background: #e8f3ff;
  border-color: #2563eb;
  box-shadow: -1px 0 0 0 #2563eb;
}
.ps-radio :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 4px 0 0 4px;
}
.ps-radio :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 4px 4px 0;
}

.ps-date { width: 220px; }

/* 星期 × 时段栅格 */
.ps-week { margin-top: 16px; }
.ps-week-table { border-collapse: collapse; table-layout: fixed; width: 648px; }
.ps-week-table th,
.ps-week-table td {
  border: 1px solid #cccccc;
  text-align: center;
  font-weight: 400;
}
.ps-week-table thead tr:first-child th {
  padding: 8px 0;
  font-size: 13px;
  color: #1d2129;
  background: #fff;
}
.ps-week-table .ps-group { border-right: 1px solid #c9cdd4; }
.ps-week-table .ps-week-td {
  width: 72px;
  font-size: 13px;
  color: #1d2129;
  background: #f8f9fa;
}
.ps-week-table .ps-hour td {
  padding: 4px 0;
  font-size: 12px;
  color: #86909c;
  background: #f8f9fa;
}
.ps-week-table tbody tr { height: 28px; }
.ps-week-table tbody td.ps-week-td { padding: 0; line-height: 28px; }
.ps-week-table tbody td.ps-cell {
  height: 28px;
  padding: 0;
  cursor: pointer;
  background: #fff;
  transition: background 0.12s;
}
.ps-week-table tbody td.ps-cell:hover { background: #e8f3ff; }
.ps-week-table tbody td.ps-cell.on { background: #546ef7; }
.ps-week-table tbody td.ps-cell.on:hover { background: #2f5fe6; }

/* 已选择时段（文字版） */
.ps-list-td { padding: 0 !important; background: #fff; }
.ps-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
}
.ps-list-title { font-size: 14px; color: #1d2129; }
.ps-clear { font-size: 14px; color: #165dff; cursor: pointer; }
.ps-clear:hover { color: #0e42d2; }
.ps-list-body { padding: 0 12px 12px; }
.ps-list-row { display: flex; line-height: 24px; font-size: 14px; color: #1d2129; }
.ps-list-day { flex: none; color: #1d2129; }
.ps-list-range { min-width: 0; }
.ps-list-empty { font-size: 14px; color: #86909c; line-height: 24px; }
</style>

<style>
/* 弹窗外壳：与线上一致 */
.ps-dialog .el-dialog__header { margin-right: 0; padding: 18px 20px 14px; border-bottom: 1px solid #e5e6eb; }
.ps-dialog .el-dialog__title { font-size: 18px; font-weight: 600; color: #1d2129; }
.ps-dialog .el-dialog__body { padding: 18px 40px 8px; }
.ps-dialog .el-dialog__footer { padding: 12px 20px 20px; }
</style>
