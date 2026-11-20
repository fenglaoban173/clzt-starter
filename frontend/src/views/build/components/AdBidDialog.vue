<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改广告出价"
    width="920px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <div class="bd-count">
        已选 <b>{{ rows.length }}</b> 条可操作广告计划
      </div>

      <!-- 修改规则 -->
      <div class="bd-row">
        <span class="bd-label">修改规则</span>
        <div class="bd-switch">
          <button type="button" :class="{ active: rule === 'now' }" @click="rule = 'now'">立即生效</button>
          <button type="button" :class="{ active: rule === 'next' }" @click="rule = 'next'">次日0时生效</button>
        </div>
      </div>

      <!-- 出价 -->
      <div class="bd-row">
        <span class="bd-label">出价</span>
        <el-select v-model="bidOp" class="op-select">
          <el-option label="修改为" value="set" />
          <el-option label="提高" value="inc" />
          <el-option label="降低" value="dec" />
          <el-option label="按 % 提高" value="incPct" />
          <el-option label="按 % 降低" value="decPct" />
        </el-select>
        <el-input v-model="amount" class="amount-input" @input="onAmountInput">
          <template #suffix>元</template>
        </el-input>
        <el-button type="primary" @click="applyBid">应用</el-button>
      </div>

      <!-- 操作失败通知我（广告独有字段） -->
      <div class="bd-row">
        <span class="bd-label"></span>
        <el-checkbox v-model="notify">操作失败通知我</el-checkbox>
      </div>

      <el-table :data="rows" border size="small" class="bd-table" max-height="360">
        <el-table-column label="广告计划" prop="name" min-width="240" show-overflow-tooltip />
        <el-table-column label="当日消耗" width="120" align="right">
          <template #default="{ row }">{{ row.stat_cost.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="转化成本" width="120" align="right">
          <template #default="{ row }">{{ row.convert_cost.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="当前出价" width="120" align="right">
          <template #default="{ row }">{{ row.bid.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="分别修改出价" min-width="230">
          <template #default="{ row }">
            <el-input
              :model-value="row.target"
              placeholder="请输入出价"
              @input="(v) => (row.target = toNumStr(v))"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="!rows.length" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改出价';

const rule = ref('now');
const bidOp = ref('set');
const amount = ref('');
/** 操作失败通知我（广告独有字段） */
const notify = ref(false);
const rows = ref([]);

function init() {
  rule.value = 'now';
  bidOp.value = 'set';
  amount.value = '';
  notify.value = false;
  const list = (props.rows || []).filter((r) => !r.__summary);
  rows.value = list.map((r) => ({
    id: r.id,
    name: r.name,
    stat_cost: Number(r.stat_cost) || 0,
    convert_cost: Number(r.convert_cost) || 0,
    bid: Number(r.bid) || 0,
    target: '',
  }));
}

/** 仅允许数字（最多两位小数），过滤掉字母 / 符号等非法字符 */
function toNumStr(v) {
  let s = String(v == null ? '' : v).replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    const int = s.slice(0, dot);
    const dec = s.slice(dot + 1).replace(/\./g, '').slice(0, 2);
    // 保留末尾小数点，便于继续输入小数位
    s = dec ? `${int}.${dec}` : `${int}.`;
  }
  if (s.startsWith('.')) s = `0${s}`;
  return s;
}

/** 金额输入框：只留数字 */
function onAmountInput(v) {
  amount.value = toNumStr(v);
}

/** 按所选规则把出价应用到所有广告（写入「分别修改出价」列） */
function applyBid() {
  const val = Number(amount.value);
  rows.value.forEach((r) => {
    switch (bidOp.value) {
      case 'set':
        r.target = amount.value === '' ? '' : String(val);
        break;
      case 'inc':
        r.target = amount.value === '' ? '' : String(r.bid + val);
        break;
      case 'dec':
        r.target = amount.value === '' ? '' : String(Math.max(0, r.bid - val));
        break;
      case 'incPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.bid * (1 + val / 100)));
        break;
      case 'decPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.bid * (1 - val / 100)));
        break;
      default:
        break;
    }
  });
}

/** 关闭窗口 */
function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const changed = rows.value.filter((r) => r.target !== '').length;
  const form = { rule: rule.value, bid_mode: bidOp.value, amount: amount.value, notify: notify.value };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    const buildRows = rows.value.map((r) => ({ ...r, __bid: r.target }));
    try {
      payload = cfg.build(buildRows, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交批量修改广告出价任务（${changed} 条广告，${ruleText.value}）`);
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}

const ruleText = computed(() => ({ now: '立即生效', next: '次日0时生效' }[rule.value]));
</script>

<style scoped>
.batch-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
}
.bd-count { font-size: 15px; color: #1d2129; }
.bd-count b { color: #165dff; }
.bd-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.bd-label { flex: none; width: 76px; font-size: 15px; color: #1d2129; }
.bd-switch {
  display: inline-flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.bd-switch button {
  padding: 7px 20px;
  border: none;
  border-right: 1px solid #e5e6eb;
  background: #fff;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
}
.bd-switch button:last-child { border-right: none; }
.bd-switch button.active { background: #e8f3ff; color: #165dff; font-weight: 600; }
.op-select { width: 150px; }
.amount-input { width: 170px; }
.bd-table { margin-top: 16px; }
</style>
