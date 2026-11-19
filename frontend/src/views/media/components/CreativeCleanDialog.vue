<template>
  <el-dialog
    :model-value="modelValue"
    title="创意清理"
    width="1080px"
    class="clean-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="cc-body">
      <!-- 操作类型 -->
      <div class="cc-row">
        <span class="cc-label">操作类型</span>
        <div class="cc-content">
          <div class="cc-seg">
            <button
              v-for="t in OP_TYPES"
              :key="t.key"
              type="button"
              :class="{ active: opType === t.key }"
              @click="opType = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>

      <!-- 清理账户 -->
      <div class="cc-row">
        <span class="cc-label">清理账户</span>
        <div class="cc-content">
          <div class="cc-seg">
            <button
              v-for="s in SCOPES"
              :key="s.key"
              type="button"
              :class="{ active: scope === s.key }"
              @click="scope = s.key"
            >{{ s.label }}</button>
          </div>
        </div>
      </div>

      <!-- 账户范围：全部账户 / 指定项目 / 指定主体 -->
      <div class="cc-row">
        <span class="cc-label"></span>
        <div class="cc-content">
          <template v-if="scope === 'all'">
            <div class="cc-count">已筛选出{{ filteredCount }}个账户</div>
          </template>

          <template v-else>
            <el-input v-model="scopeSearch" class="cc-search" clearable :placeholder="scope === 'project' ? '请输入项目名称' : '请输入主体名称'">
              <template #suffix><el-icon><Search /></el-icon></template>
            </el-input>

            <div class="cc-picker">
              <div class="cc-pane">
                <div class="cc-pane-head">{{ scope === 'project' ? '项目' : '主体' }}</div>
                <div class="cc-pane-body">
                  <el-checkbox
                    v-for="o in scopeOptions"
                    :key="o.name"
                    class="cc-check"
                    :model-value="scopeSelected.includes(o.name)"
                    @change="(v) => toggleScope(o.name, v)"
                  >{{ o.name }}</el-checkbox>
                  <div v-if="!scopeOptions.length" class="cc-empty">暂无数据</div>
                </div>
              </div>

              <div class="cc-pane cc-pane-sel">
                <div class="cc-pane-head">
                  <span>已选</span>
                  <el-button link type="primary" size="small" @click="scopeSelected = []">清空</el-button>
                </div>
                <div class="cc-pane-body">
                  <div v-for="n in scopeSelected" :key="n" class="cc-sel-item">
                    <span class="cc-sel-item__name" :title="n">{{ n }}</span>
                    <el-icon class="cc-sel-item__del" title="移除" @click="removeScope(n)"><Close /></el-icon>
                  </div>
                  <div v-if="!scopeSelected.length" class="cc-empty">请选择</div>
                </div>
              </div>
            </div>

            <div class="cc-count">已筛选出{{ filteredCount }}个账户</div>
            <div v-if="!scopeSelected.length" class="cc-warn">请选择</div>
          </template>
        </div>
      </div>

      <!-- 素材创建日期 -->
      <div class="cc-row">
        <span class="cc-label">素材创建日期</span>
        <div class="cc-content cc-field">
          <span class="cc-txt">在媒体平台</span>
          <el-date-picker v-model="createDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" class="cc-date" />
          <span class="cc-txt">前创建的素材(不含当日)</span>
        </div>
      </div>

      <!-- 素材数据 -->
      <div class="cc-row">
        <span class="cc-label">素材数据</span>
        <div class="cc-content cc-field">
          <span class="cc-txt">在</span>
          <el-date-picker
            v-model="dataRange"
            type="daterange"
            unlink-panels
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="cc-range"
          />
          <span class="cc-txt">期间(含包含当日)</span>
        </div>
      </div>

      <!-- 筛选条件：同质化类多一条「累积转化数」 -->
      <div v-if="showConvert" class="cc-row">
        <span class="cc-label"></span>
        <div class="cc-content cc-field">
          <el-checkbox v-model="condConvert.on">账户内累积转化数小于</el-checkbox>
          <el-input v-model="condConvert.value" class="cc-num" placeholder="请输入" :disabled="!condConvert.on" />
          <span class="cc-txt">的素材</span>
        </div>
      </div>

      <div class="cc-row">
        <span class="cc-label"></span>
        <div class="cc-content cc-field">
          <!-- 与线上一致：该条件为必选项，勾选后不允许取消（阻止原生勾选行为） -->
          <el-checkbox :model-value="true" class="cc-locked" title="该条件必选，不允许取消勾选" @click.prevent @change="onCostChange">账户内累积消耗小于</el-checkbox>
          <el-input v-model="condCost.value" class="cc-num" placeholder="请输入" />
          <span class="cc-txt">元的素材</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="start">开始清理</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'start']);

// 操作类型：低效创意 / 同质化挤压严重创意 / 同质化拟人创意
const OP_TYPES = [
  { key: 'low', label: '低效创意' },
  { key: 'homogPress', label: '同质化挤压严重创意' },
  { key: 'homogPerson', label: '同质化拟人创意' },
];
// 清理账户范围：全部账户 / 指定项目的账户 / 指定主体的账户
const SCOPES = [
  { key: 'all', label: '全部账户' },
  { key: 'project', label: '指定项目的账户' },
  { key: 'subject', label: '指定主体的账户' },
];

const opType = ref('low');
const scope = ref('all');
const scopeSearch = ref('');
const scopeSelected = ref([]);
const createDate = ref(dayjs().format('YYYY-MM-DD'));
const dataRange = ref([
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
]);
const condConvert = reactive({ on: false, value: '' });
const condCost = reactive({ on: true, value: '200' });

// 「账户内累积消耗」为必选条件：线上为禁用态（灰底勾选且不可取消），本地保持可读、不可取消
function onCostChange() {
  condCost.on = true;
}

// 同质化两类需要额外的「累积转化数」条件
const showConvert = computed(() => opType.value !== 'low');

// 项目 / 主体是两个维度，切换范围时清空已选，避免串数据
watch(scope, () => {
  scopeSelected.value = [];
  scopeSearch.value = '';
});

function groupBy(list, pick) {
  const map = new Map();
  (list || []).forEach((a) => {
    const key = pick(a);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}

const projectList = computed(() => groupBy(props.accounts, (a) => a.project));
const subjectList = computed(() => groupBy(props.accounts, (a) => a.subject));

const scopeOptions = computed(() => {
  const list = scope.value === 'project' ? projectList.value : subjectList.value;
  const q = String(scopeSearch.value || '').trim().toLowerCase();
  return q ? list.filter((o) => o.name.toLowerCase().includes(q)) : list;
});

const filteredCount = computed(() => {
  const list = props.accounts || [];
  if (scope.value === 'all') return list.length;
  if (!scopeSelected.value.length) return 0;
  const key = scope.value === 'project' ? 'project' : 'subject';
  return list.filter((a) => scopeSelected.value.includes(a[key])).length;
});

function toggleScope(name, checked) {
  if (checked) {
    if (!scopeSelected.value.includes(name)) scopeSelected.value = [...scopeSelected.value, name];
  } else {
    scopeSelected.value = scopeSelected.value.filter((n) => n !== name);
  }
}

// 已选面板中移除单行（左侧列表勾选态同步取消）
function removeScope(name) {
  scopeSelected.value = scopeSelected.value.filter((n) => n !== name);
}

function init() {
  opType.value = 'low';
  scope.value = 'all';
  scopeSearch.value = '';
  scopeSelected.value = [];
  createDate.value = dayjs().format('YYYY-MM-DD');
  dataRange.value = [
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ];
  condConvert.on = false;
  condConvert.value = '';
  condCost.on = true;
  condCost.value = '200';
}

function close() {
  emit('update:modelValue', false);
}

function start() {
  if (scope.value !== 'all' && !scopeSelected.value.length) {
    ElMessage.warning(scope.value === 'project' ? '请选择项目' : '请选择主体');
    return;
  }
  if (!filteredCount.value) {
    ElMessage.warning('当前筛选条件下没有可清理的账户');
    return;
  }
  const typeLabel = OP_TYPES.find((t) => t.key === opType.value)?.label || '';
  ElMessage.success(`原型：已提交创意清理任务（${typeLabel}，账户 ${filteredCount.value} 个）`);
  emit('start', { opType: opType.value, scope: scope.value, selected: [...scopeSelected.value] });
  close();
}
</script>

<style scoped>
.cc-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
}
.cc-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
.cc-label { flex: none; width: 116px; padding-top: 5px; font-size: 15px; color: #1d2129; }
.cc-content { flex: 1; min-width: 0; }
.cc-field { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cc-txt { font-size: 15px; color: #1d2129; white-space: nowrap; }

/* 分段按钮 */
.cc-seg { display: flex; gap: 8px; flex-wrap: wrap; }
.cc-seg button {
  padding: 6px 16px;
  border: 1px solid #f2f3f5;
  border-radius: 4px;
  background: #f7f8fa;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
}
.cc-seg button:hover { color: #165dff; }
.cc-seg button.active {
  background: #e8f3ff;
  border-color: #165dff;
  color: #165dff;
  font-weight: 600;
}

/* 项目 / 主体选择 */
.cc-search { width: 100%; }
.cc-picker { display: flex; gap: 16px; margin-top: 12px; }
.cc-pane { flex: 1; min-width: 0; border: 1px solid #e5e6eb; border-radius: 4px; overflow: hidden; }
.cc-pane-sel { flex: none; width: 260px; }
.cc-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid #e5e6eb;
  background: #f7f8fa;
  font-size: 14px;
  color: #1d2129;
}
.cc-pane-body { height: 300px; overflow-y: auto; padding: 6px 12px; }
.cc-check { display: flex; width: 100%; height: 32px; }
.cc-check :deep(.el-checkbox__label) {
  font-size: 14px;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cc-sel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  font-size: 14px;
  color: #1d2129;
}
.cc-sel-item__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-sel-item__del { flex: none; cursor: pointer; font-size: 13px; color: #86909c; transition: color .15s; }
.cc-sel-item__del:hover { color: #165dff; }
.cc-empty { padding: 40px 0; text-align: center; font-size: 14px; color: #86909c; }

/* 统计与提示 */
.cc-count { margin-top: 10px; font-size: 14px; color: #86909c; }
.cc-warn { margin-top: 4px; font-size: 14px; color: #f53f3f; }

/* 日期 / 数值 */
.cc-date { width: 170px; }
.cc-range { width: 320px; }
.cc-num { width: 92px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式） */
.clean-dialog .el-dialog__title { color: #165dff; font-size: 16px; }
</style>
