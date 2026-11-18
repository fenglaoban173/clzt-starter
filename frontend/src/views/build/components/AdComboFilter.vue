<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="380"
    trigger="click"
    popper-class="ad-combo-popper"
  >
    <template #reference>
      <el-button class="light-btn">组合筛选</el-button>
    </template>

    <div class="cf-body">
      <!-- 已有筛选组合 -->
      <template v-if="!creating">
        <el-input v-model="search" placeholder="搜索" clearable class="cf-search">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="cf-list">
          <div v-for="c in filteredCombos" :key="c.id" class="cf-item" @click="applyCombo(c)">
            <span class="cf-item-name">{{ c.name }}</span>
            <span class="cf-item-desc">{{ descOf(c) }}</span>
          </div>
          <div v-if="!filteredCombos.length" class="cf-empty">暂无筛选组合</div>
        </div>
        <div class="cf-foot">
          <el-button type="primary" size="small" @click="creating = true">新建筛选组合</el-button>
          <a class="cf-link" @click="clearAll">清除筛选</a>
        </div>
      </template>

      <!-- 新建筛选组合 -->
      <template v-else>
        <div class="cf-title">新建筛选组合</div>
        <div class="cf-cond-head">
          <span>符合以下</span>
          <el-select v-model="logic" class="cf-logic">
            <el-option label="所有" value="all" />
            <el-option label="任一" value="any" />
          </el-select>
          <span>条件</span>
        </div>
        <div v-for="(c, i) in conditions" :key="i" class="cf-cond">
          <el-select v-model="c.metric" placeholder="请选择指标" class="cf-metric">
            <el-option v-for="m in METRICS" :key="m" :label="m" :value="m" />
          </el-select>
          <el-select v-model="c.op" class="cf-op">
            <el-option v-for="o in OPS" :key="o" :label="o" :value="o" />
          </el-select>
          <el-input v-model="c.value" placeholder="请输入值" class="cf-value" />
        </div>
        <el-button size="small" class="cf-add" @click="addCondition">添加条件</el-button>
        <el-input v-model="newName" placeholder="请输入组合名称" class="cf-name" />
        <div class="cf-foot">
          <el-button size="small" @click="creating = false">取消</el-button>
          <el-button type="primary" size="small" @click="saveCombo">确定</el-button>
        </div>
      </template>
    </div>
  </el-popover>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'apply', 'clear']);

const STORAGE_KEY = 'clzt.ad-filter.combos';

const METRICS = [
  '消耗', '展示数', '平均千次展现费用', '点击数', '点击率', '转化数', '转化成本', '转化率',
  '深度转化数', '深度转化成本', '深度转化率', '广告预算（元）', '广告出价（元）',
];
const OPS = ['大于', '小于', '等于'];

const visible = ref(props.modelValue);
const search = ref('');
const creating = ref(false);
const logic = ref('all');
const conditions = ref([{ metric: '', op: '大于', value: '' }]);
const newName = ref('');
const combos = ref([]);

watch(() => props.modelValue, (v) => { visible.value = v; });
watch(visible, (v) => emit('update:modelValue', v));

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    combos.value = Array.isArray(list) ? list : [];
  } catch (e) {
    combos.value = [];
  }
}
load();

const filteredCombos = computed(() => {
  const kw = search.value.trim().toLowerCase();
  if (!kw) return combos.value;
  return combos.value.filter((c) => c.name.toLowerCase().includes(kw));
});

function descOf(c) {
  return `${c.logic === 'all' ? '所有' : '任一'}条件：${c.conditions.length} 个`;
}

function addCondition() {
  conditions.value = [...conditions.value, { metric: '', op: '大于', value: '' }];
}

function saveCombo() {
  const name = (newName.value || '').trim();
  if (!name) {
    ElMessage.warning('请输入组合名称');
    return;
  }
  const valid = conditions.value.filter((c) => c.metric);
  if (!valid.length) {
    ElMessage.warning('请至少选择一个指标');
    return;
  }
  const combo = { id: `cf_${Date.now()}`, name, logic: logic.value, conditions: valid };
  combos.value = [combo, ...combos.value];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(combos.value)); } catch (e) { /* 忽略 */ }
  creating.value = false;
  newName.value = '';
  search.value = '';
  ElMessage.success(`原型：已保存筛选组合「${name}」`);
}

function applyCombo(c) {
  emit('apply', c);
  visible.value = false;
}

function clearAll() {
  emit('clear');
  visible.value = false;
}
</script>

<style scoped>
.cf-body { font-size: 14px; color: #1d2129; }
.cf-search { margin-bottom: 8px; }
.cf-list { max-height: 220px; overflow-y: auto; }
.cf-item { padding: 8px 4px; border-bottom: 1px solid #f2f3f5; cursor: pointer; }
.cf-item:hover { background: #f7f8fa; }
.cf-item-name { display: block; font-size: 14px; color: #1d2129; }
.cf-item-desc { display: block; font-size: 12px; color: #86909c; margin-top: 2px; }
.cf-empty { padding: 24px 0; text-align: center; color: #86909c; font-size: 13px; }
.cf-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.cf-link { color: #165dff; cursor: pointer; font-size: 13px; }

.cf-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.cf-cond-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cf-logic { width: 92px; }
.cf-cond { display: flex; gap: 6px; margin-bottom: 8px; }
.cf-metric { flex: 1; min-width: 0; }
.cf-op { width: 90px; flex: none; }
.cf-value { width: 120px; flex: none; }
.cf-add { margin-bottom: 8px; }
.cf-name { margin-top: 4px; }
</style>
