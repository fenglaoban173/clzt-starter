<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改项目日预算"
    width="920px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <div class="bd-count">
        已选 <b>{{ rows.length }}</b> 条可操作项目
      </div>

      <!-- 修改规则 -->
      <div class="bd-row">
        <span class="bd-label">修改规则</span>
        <div class="bd-switch">
          <button type="button" :class="{ active: rule === 'now' }" @click="rule = 'now'">立即生效</button>
          <button type="button" :class="{ active: rule === 'next' }" @click="rule = 'next'">次日0时生效</button>
        </div>
      </div>

      <!-- 预算 -->
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
        <el-input v-if="budgetOp !== 'none'" v-model="amount" class="amount-input">
          <template #suffix>元</template>
        </el-input>
        <el-button type="primary" @click="applyBudget">应用</el-button>
      </div>

      <el-table :data="rows" border size="small" class="bd-table" max-height="360">
        <el-table-column label="项目" prop="name" min-width="300" show-overflow-tooltip />
        <el-table-column label="转化成本" width="140" align="right">
          <template #default="{ row }">{{ row.convert_cost.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="当前预算" width="140" align="right">
          <template #default="{ row }">{{ row.budget }}</template>
        </el-table-column>
        <el-table-column label="分别修改预算" min-width="260">
          <template #default="{ row }">
            <el-input v-model="row.target" placeholder="请输入预算" />
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
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const rule = ref('now');
const budgetOp = ref('set');
const amount = ref('');
const rows = ref([]);

function init() {
  rule.value = 'now';
  budgetOp.value = 'set';
  amount.value = '';
  const list = (props.projects || []).filter((p) => !p.__total);
  rows.value = list.map((p) => ({
    id: p.id,
    name: p.name,
    convert_cost: Number(p.convert_cost) || 0,
    budget: Number(p.budget) || 0,
    target: '',
  }));
}

// 切换到「不限」时清空金额输入（输入框已隐藏）
watch(budgetOp, (v) => {
  if (v === 'none') amount.value = '';
});

/** 按所选规则把金额应用到所有项目（写入「分别修改预算」列） */
function applyBudget() {
  const val = Number(amount.value);
  rows.value.forEach((r) => {
    switch (budgetOp.value) {
      case 'set':
        r.target = amount.value === '' ? '' : String(val);
        break;
      case 'inc':
        r.target = amount.value === '' ? '' : String(r.budget + val);
        break;
      case 'dec':
        r.target = amount.value === '' ? '' : String(Math.max(0, r.budget - val));
        break;
      case 'incPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.budget * (1 + val / 100)));
        break;
      case 'decPct':
        r.target = amount.value === '' ? '' : String(Math.round(r.budget * (1 - val / 100)));
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
  ElMessage.success(`原型：已提交批量修改项目日预算任务（${changed} 个项目，${ruleText.value}）`);
  emit('confirm', rows.value);
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
