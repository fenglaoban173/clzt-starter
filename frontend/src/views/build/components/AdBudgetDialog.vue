<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改预算"
    width="1000px"
    top="8vh"
    class="abd-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="abd-body">
      <!-- 接口条（广告层级：保留接口对齐信息） -->
      <div class="bo-api">
        <span class="bo-api-tag">接口</span>
        <span class="bo-api-method">{{ api.method }}</span>
        <a class="bo-api-path" :href="apiUrl" target="_blank" rel="noreferrer">{{ apiUrl }}</a>
        <span class="bo-api-name">{{ api.name }}</span>
        <span class="bo-api-meta">权限点：{{ api.scope }}</span>
        <span class="bo-api-meta">批量上限 {{ batchLimit }} 条</span>
      </div>

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

      <!-- 预算（操作方式 + 金额 + 应用） -->
      <div class="bd-row">
        <span class="bd-label">预算</span>
        <el-select v-model="budgetOp" class="op-select">
          <el-option label="修改为" value="set" />
          <el-option label="提高" value="inc" />
          <el-option label="降低" value="dec" />
          <el-option label="按 % 提高" value="incPct" />
          <el-option label="按 % 降低" value="decPct" />
        </el-select>
        <el-input v-model="amount" class="amount-input" placeholder="请输入预算">
          <template #suffix>元</template>
        </el-input>
        <el-button type="primary" @click="applyBudget">应用</el-button>
      </div>
      <div class="bd-meta">
        <span class="bo-api-field">{{ fBudget.apiField }}</span>
        <span class="bo-rule-text">{{ fBudget.rule }}</span>
      </div>

      <!-- 预算类型（原有字段） -->
      <div class="bd-row">
        <span class="bd-label">预算类型</span>
        <el-radio-group v-model="form.budget_mode">
          <el-radio v-for="o in budgetModeOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
      </div>
      <div class="bd-meta">
        <span class="bo-api-field">{{ fBudgetMode.apiField }}</span>
        <span class="bo-rule-text">{{ fBudgetMode.rule }}</span>
      </div>

      <!-- 修改方式（原有字段） -->
      <div class="bd-row">
        <span class="bd-label">修改方式</span>
        <el-radio-group v-model="form.scope">
          <el-radio value="all">统一修改</el-radio>
          <el-radio value="each">分别修改</el-radio>
        </el-radio-group>
      </div>
      <div class="bd-meta">
        <span class="bo-api-field">{{ fScope.apiField }}</span>
        <span class="bo-rule-text">统一修改：所有广告使用同一预算金额；分别修改：按下方「分别修改预算」逐条提交</span>
      </div>

      <!-- 广告列表 -->
      <el-table :data="rows" border size="small" class="bd-table" max-height="360">
        <el-table-column label="广告计划" prop="name" min-width="280" show-overflow-tooltip />
        <el-table-column label="当日消耗" width="120" align="right">
          <template #default="{ row }">{{ row.stat_cost.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="转化成本" width="120" align="right">
          <template #default="{ row }">{{ row.convert_cost.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="当前预算" width="130" align="right">
          <template #default="{ row }">{{ row.budget.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="分别修改预算" min-width="230">
          <template #default="{ row }">
            <el-input v-model="row.__budget" placeholder="请输入预算" />
          </template>
        </el-table-column>
      </el-table>
      <div class="bd-meta">
        <span class="bo-api-field">{{ fEach.apiField }}</span>
        <span class="bo-rule-text">「应用」按所选操作方式把金额写入「分别修改预算」列，也可逐条直接填写</span>
      </div>

      <!-- 请求体预览 -->
      <div class="bo-payload">
        <div class="bo-payload-head">
          <span>请求体预览</span>
          <a class="bo-link" @click="showPayload = !showPayload">{{ showPayload ? '收起' : '展开' }}</a>
        </div>
        <pre v-if="showPayload" class="bo-payload-body">{{ payloadText }}</pre>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="!rows.length" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig, apiUrl as buildApiUrl, BATCH_LIMIT } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const rule = ref('now');
const budgetOp = ref('set');
const amount = ref('');
const rows = ref([]);
const showPayload = ref(false);
const form = reactive({ budget_mode: 'BUDGET_MODE_DAY', scope: 'all', budget: '' });

const cfg = computed(() => getBatchOpConfig('promotion', '修改预算'));
const api = computed(() => (cfg.value && cfg.value.api) || {});
const apiUrl = computed(() => buildApiUrl(cfg.value));
const batchLimit = BATCH_LIMIT;

const fieldOf = (key) => ((cfg.value && cfg.value.fields) || []).find((f) => f.key === key) || {};
const fBudget = computed(() => fieldOf('budget'));
const fBudgetMode = computed(() => fieldOf('budget_mode'));
const fScope = computed(() => fieldOf('scope'));
const fEach = computed(() => fieldOf('each'));

const budgetModeOptions = computed(() => fBudgetMode.value.options || []);

const payload = computed(() => {
  if (!cfg.value || typeof cfg.value.build !== 'function') return {};
  try {
    return cfg.value.build(rows.value, form);
  } catch (e) {
    return { error: String(e) };
  }
});
const payloadText = computed(() => JSON.stringify(payload.value, null, 2));

function init() {
  rule.value = 'now';
  budgetOp.value = 'set';
  amount.value = '';
  form.budget_mode = 'BUDGET_MODE_DAY';
  form.scope = 'all';
  form.budget = '';
  rows.value = (props.rows || []).filter((r) => !r.__summary).map((r) => ({
    id: r.id,
    name: r.name,
    stat_cost: Number(r.stat_cost) || 0,
    convert_cost: Number(r.convert_cost) || 0,
    budget: Number(r.budget) || 0,
    __budget: '',
  }));
}

/** 按所选操作方式把金额写入「分别修改预算」列 */
function applyBudget() {
  const raw = String(amount.value).trim();
  const val = Number(raw);
  if (raw === '' || Number.isNaN(val)) {
    ElMessage.warning('请输入预算金额');
    return;
  }
  rows.value.forEach((r) => {
    switch (budgetOp.value) {
      case 'set':
        r.__budget = String(val);
        break;
      case 'inc':
        r.__budget = String(r.budget + val);
        break;
      case 'dec':
        r.__budget = String(Math.max(0, r.budget - val));
        break;
      case 'incPct':
        r.__budget = String(Math.round(r.budget * (1 + val / 100)));
        break;
      case 'decPct':
        r.__budget = String(Math.round(r.budget * (1 - val / 100)));
        break;
      default:
        break;
    }
  });
  // 相对调整（提高 / 降低 / 按 %）只能逐条下发，自动切到「分别修改」
  if (budgetOp.value !== 'set') form.scope = 'each';
  else form.budget = String(val);
}

// 切回「统一修改」时，取已填写的第一条预算作为统一金额
watch(
  () => form.scope,
  (v) => {
    if (v !== 'all' || form.budget) return;
    const first = rows.value.find((r) => r.__budget !== '' && r.__budget !== undefined);
    form.budget = first ? first.__budget : '';
  }
);

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  ElMessage.success(
    `原型：已提交批量修改预算任务（${rows.value.length} 条广告，${form.scope === 'each' ? '分别修改' : '统一修改'}，${rule.value === 'now' ? '立即生效' : '次日0时生效'}）`
  );
  emit('confirm', {
    op: '修改预算',
    rows: rows.value,
    form: { ...form },
    payload: payload.value,
  });
  close();
}
</script>

<style scoped>
.abd-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
  /* 保证页脚按钮始终可见 */
  max-height: calc(84vh - 130px);
  overflow-y: auto;
}

/* 接口条 */
.bo-api {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 14px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  font-size: 12px;
  color: #4e5969;
}
.bo-api-tag { padding: 1px 6px; border-radius: 2px; background: #165dff; color: #fff; }
.bo-api-method { font-weight: 600; color: #165dff; }
.bo-api-path { color: #165dff; text-decoration: none; word-break: break-all; }
.bo-api-name { color: #1d2129; }
.bo-api-meta { color: #86909c; }

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

/* 字段级接口说明 */
.bd-meta {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 0 88px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.6;
}
.bo-api-field {
  display: inline-block;
  padding: 0 6px;
  border-radius: 2px;
  background: #eef3ff;
  color: #165dff;
  font-family: Consolas, Monaco, monospace;
}
.bo-rule-text { word-break: break-word; }

.bd-table { margin-top: 16px; }

/* 请求体预览 */
.bo-payload { margin-top: 14px; border-top: 1px solid #e5e6eb; padding-top: 10px; }
.bo-payload-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #4e5969; }
.bo-link { color: #165dff; cursor: pointer; font-size: 13px; }
.bo-payload-body {
  margin: 8px 0 0;
  padding: 10px;
  max-height: 240px;
  overflow: auto;
  background: #1d2129;
  color: #c9f0d3;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  font-family: Consolas, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
