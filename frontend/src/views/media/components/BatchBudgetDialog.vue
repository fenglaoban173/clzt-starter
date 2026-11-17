<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改日预算"
    width="920px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <div class="bd-count">
        已选 <b>{{ rows.length }}</b> 个可操作媒体账户
      </div>

      <!-- 修改规则 -->
      <div class="bd-row">
        <span class="bd-label">修改规则</span>
        <div class="bd-switch">
          <button type="button" :class="{ active: rule === 'now' }" @click="rule = 'now'">立即生效</button>
          <button type="button" :class="{ active: rule === 'next' }" @click="rule = 'next'">次日0时生效</button>
          <button type="button" :class="{ active: rule === 'custom' }" @click="rule = 'custom'">自定义时间</button>
        </div>
        <el-date-picker
          v-if="rule === 'custom'"
          v-model="customTime"
          type="datetime"
          placeholder="选择生效时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="custom-time"
        />
      </div>

      <!-- 预算规则 -->
      <div class="bd-row">
        <span class="bd-label">预算</span>
        <el-select v-model="budgetOp" class="op-select">
          <el-option label="修改为" value="set" />
          <el-option label="提高" value="inc" />
          <el-option label="降低" value="dec" />
          <el-option label="按 % 提高" value="incPct" />
          <el-option label="按 % 降低" value="decPct" />
          <el-option label="不限" value="none" />
        </el-select>
        <el-input v-if="budgetOp !== 'none'" v-model="amount" class="amount-input" placeholder="请输入金额">
          <template #suffix>元</template>
        </el-input>
        <el-button type="primary" @click="applyBudget">应用</el-button>
        <span class="op-tip">{{ opTip }}</span>
      </div>

      <el-table :data="rows" border size="small" class="bd-table" max-height="360">
        <el-table-column label="广告主账户" prop="name" min-width="230" show-overflow-tooltip />
        <el-table-column label="优化师" prop="optimizer" width="120" />
        <el-table-column label="日预算" width="130" align="right">
          <template #default="{ row }">{{ row.daily_budget }}</template>
        </el-table-column>
        <el-table-column label="分别修改日预算" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.target" placeholder="请输入日预算" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="close">关闭窗口</el-button>
      <el-button type="primary" :disabled="!rows.length" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const rule = ref('now');
const customTime = ref('');
const budgetOp = ref('set');
const amount = ref('');
const rows = ref([]);

const opTip = computed(() => ({
  set: '将日预算统一修改为指定金额',
  inc: '在当前日预算基础上增加指定金额',
  dec: '在当前日预算基础上减少指定金额',
  incPct: '在当前日预算基础上按百分比提高',
  decPct: '在当前日预算基础上按百分比降低',
  none: '不限制日预算上下限',
}[budgetOp.value] || ''));

function init() {
  rule.value = 'now';
  customTime.value = '';
  budgetOp.value = 'set';
  amount.value = '';
  const list = (props.accounts || []).filter((a) => !a.__total);
  rows.value = list.map((a) => ({
    id: a.id,
    name: a.name,
    optimizer: a.optimizer,
    daily_budget: Number(a.daily_budget) || 0,
    target: '',
  }));
}

// 切换到「不限」时清空金额输入（输入框已隐藏）
watch(budgetOp, (v) => {
  if (v === 'none') amount.value = '';
});

function applyBudget() {
  const val = Number(amount.value);
  rows.value.forEach((r) => {
    switch (budgetOp.value) {
      case 'set':
        r.target = amount.value === '' ? '' : String(val);
        break;
      case 'inc':
        r.target = amount.value === '' ? '' : String(r.daily_budget + val);
        break;
      case 'dec':
        r.target = amount.value === '' ? '' : String(Math.max(0, r.daily_budget - val));
        break;
      case 'incPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.daily_budget * (1 + val / 100)));
        break;
      case 'decPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.daily_budget * (1 - val / 100)));
        break;
      case 'none':
      default:
        // 「不限」直接写入输入框，用户可清空后改填具体金额
        r.target = '不限';
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
  ElMessage.success(`原型：已提交批量修改日预算任务（${changed} 个账户，${ruleText.value}）`);
  emit('confirm', rows.value);
  close();
}

const ruleText = computed(() => ({
  now: '立即生效',
  next: '次日0时生效',
  custom: customTime.value ? `${customTime.value} 生效` : '自定义时间',
}[rule.value]));
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
.custom-time { width: 220px; }
.op-select { width: 150px; }
.amount-input { width: 170px; }
.op-tip { font-size: 13px; color: #86909c; }
.bd-table { margin-top: 16px; }
</style>
