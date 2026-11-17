<template>
  <el-dialog
    :model-value="modelValue"
    title="自定义指标"
    width="1080px"
    class="custom-metric-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="cm-body">
      <!-- 左：分类 -->
      <div class="cm-left">
        <el-input v-model="search" placeholder="输入指标名称搜索" clearable class="cm-search">
          <template #suffix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="cm-cats">
          <div
            v-for="g in groups"
            :key="g.key"
            class="cm-cat"
            :class="{ active: activeCat === g.key }"
            @click="scrollToGroup(g.key)"
          >{{ g.title }}</div>
        </div>
      </div>

      <!-- 中：指标勾选 -->
      <div class="cm-middle" ref="middleRef">
        <div v-for="g in visibleGroups" :key="g.key" class="cm-group" :ref="(el) => setGroupRef(g.key, el)">
          <div class="cm-group-title">{{ g.title }}</div>
          <div class="cm-items">
            <el-checkbox
              v-for="m in g.items"
              :key="m.key"
              class="cm-item"
              :model-value="selectedKeys.includes(m.key)"
              :disabled="m.fixed"
              @change="(v) => toggleMetric(m, v)"
            >{{ m.label }}</el-checkbox>
          </div>
        </div>
        <div v-if="!visibleGroups.length" class="cm-empty">未找到匹配指标</div>
      </div>

      <!-- 右：已选指标 -->
      <div class="cm-right">
        <div class="cm-right-head">已选指标</div>
        <div class="cm-right-sub">拖动可自定义指标顺序</div>
        <div class="cm-sel-list">
          <template v-for="(m, i) in selectedList" :key="m.key">
            <div
              class="cm-sel-item"
              :class="{ fixed: m.fixed, dragging: dragIndex === i, over: overIndex === i }"
              :draggable="!m.fixed"
              @dragstart="onDragStart(i)"
              @dragend="onDragEnd"
              @dragover.prevent="onDragOver(i)"
              @drop.prevent="onDrop(i)"
            >
              <el-icon class="cm-handle"><Rank /></el-icon>
              <span class="cm-sel-label">{{ m.label }}</span>
              <el-icon v-if="!m.fixed" class="cm-remove" @click.stop="removeSel(i)"><Close /></el-icon>
            </div>
            <div v-if="m.fixed && isLastFixed(i)" class="cm-fixed-note">以上指标将横向固定</div>
          </template>
          <div v-if="!selectedList.length" class="cm-empty">请从中间区域勾选指标</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="cm-foot">
        <div class="cm-foot-left">
          <el-checkbox v-model="saveAs">保存为常用自定义指标</el-checkbox>
          <el-input v-model="tplName" placeholder="请输入自定义指标名" :disabled="!saveAs" class="cm-name-input" />
        </div>
        <div class="cm-foot-btns">
          <el-button @click="emit('update:modelValue', false)">取消</el-button>
          <el-button type="primary" @click="apply">应用</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Rank, Search } from '@element-plus/icons-vue';
import { FIXED_METRICS, METRIC_GROUPS, METRIC_MAP } from '../customMetrics';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  media: { type: String, default: 'upgrade' },
  modelKeys: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'apply', 'save-template']);

const search = ref('');
const activeCat = ref('base');
const selectedKeys = ref([]);
const saveAs = ref(false);
const tplName = ref('');
const dragIndex = ref(null);
const overIndex = ref(null);
const groupRefs = ref({});
const middleRef = ref(null);

// 指标目录：按当前媒体过滤（部分指标仅在特定媒体可用）
const groups = computed(() => METRIC_GROUPS
  .map((g) => ({ ...g, items: g.items.filter((i) => !i.media || i.media.includes(props.media)) }))
  .filter((g) => g.items.length));

// 搜索过滤
const visibleGroups = computed(() => {
  const kw = search.value.trim().toLowerCase();
  if (!kw) return groups.value;
  return groups.value
    .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(kw)) }))
    .filter((g) => g.items.length);
});

const selectedList = computed(() => selectedKeys.value.map((k) => METRIC_MAP[k]).filter(Boolean));

function isLastFixed(i) {
  const item = selectedList.value[i];
  const next = selectedList.value[i + 1];
  return item?.fixed && next && !next.fixed;
}

function init() {
  search.value = '';
  activeCat.value = 'base';
  saveAs.value = false;
  tplName.value = '';
  dragIndex.value = null;
  overIndex.value = null;
  const fixedKeys = FIXED_METRICS.map((f) => f.key);
  const rest = (props.modelKeys || []).filter((k) => !fixedKeys.includes(k) && METRIC_MAP[k]);
  selectedKeys.value = [...fixedKeys, ...rest];
}

function toggleMetric(item, checked) {
  if (item.fixed) return;
  if (checked) {
    if (!selectedKeys.value.includes(item.key)) selectedKeys.value = [...selectedKeys.value, item.key];
  } else {
    selectedKeys.value = selectedKeys.value.filter((k) => k !== item.key);
  }
}

function removeSel(i) {
  const list = [...selectedKeys.value];
  list.splice(i, 1);
  selectedKeys.value = list;
}

function setGroupRef(key, el) {
  if (el) groupRefs.value[key] = el;
}

function scrollToGroup(key) {
  activeCat.value = key;
  const el = groupRefs.value[key];
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// ---------- 已选指标拖拽排序 ----------
function onDragStart(i) {
  dragIndex.value = i;
}
function onDragOver(i) {
  overIndex.value = i;
}
function onDragEnd() {
  dragIndex.value = null;
  overIndex.value = null;
}
function onDrop(to) {
  const from = dragIndex.value;
  if (from === null || from === undefined || from === to) { onDragEnd(); return; }
  const list = [...selectedKeys.value];
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  selectedKeys.value = list;
  onDragEnd();
}

function apply() {
  if (saveAs.value) {
    const name = (tplName.value || '').trim();
    if (!name) {
      ElMessage.warning('请输入自定义指标名后再保存');
      return;
    }
    emit('save-template', { name, keys: [...selectedKeys.value] });
  }
  emit('apply', [...selectedKeys.value]);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.cm-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  display: flex;
  gap: 0;
  height: 520px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  font-size: 15px;
  color: #1d2129;
}

/* 左：分类 */
.cm-left { width: 200px; flex: none; border-right: 1px solid #e5e6eb; display: flex; flex-direction: column; }
.cm-search { padding: 12px 10px; border-bottom: 1px solid #e5e6eb; }
.cm-cats { flex: 1; overflow-y: auto; padding: 6px 0; }
.cm-cat { padding: 9px 16px; font-size: 14px; color: #4e5969; cursor: pointer; }
.cm-cat:hover { color: #165dff; }
.cm-cat.active { color: #165dff; background: #e8f3ff; font-weight: 600; }

/* 中：指标 */
.cm-middle { flex: 1; min-width: 0; overflow-y: auto; padding: 12px 16px; }
.cm-group { margin-bottom: 18px; scroll-margin-top: 0; }
.cm-group-title { font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 10px; }
.cm-items { display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 12px; row-gap: 6px; }
.cm-item { height: 28px; }
.cm-item :deep(.el-checkbox__label) { font-size: 14px; color: #1d2129; }

/* 右：已选 */
.cm-right { width: 250px; flex: none; border-left: 1px solid #e5e6eb; display: flex; flex-direction: column; }
.cm-right-head { padding: 12px 14px 0; font-size: 15px; color: #1d2129; }
.cm-right-sub { padding: 2px 14px 8px; font-size: 12px; color: #86909c; }
.cm-sel-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
.cm-sel-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 6px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
  color: #1d2129;
  background: #fff;
}
.cm-sel-item.fixed { background: #f7f8fa; }
.cm-sel-item.dragging { opacity: .5; }
.cm-sel-item.over { box-shadow: inset 0 2px 0 #165dff; }
.cm-handle { color: #c9cdd4; cursor: grab; }
.cm-sel-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cm-remove { color: #c9cdd4; cursor: pointer; }
.cm-remove:hover { color: #f53f3f; }
.cm-fixed-note { padding: 8px 6px; font-size: 12px; color: #86909c; background: #fff; }
.cm-empty { padding: 40px 0; text-align: center; color: #86909c; font-size: 14px; }

/* 底部：保存模板 */
.cm-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.cm-foot-left { display: flex; align-items: center; gap: 10px; }
.cm-name-input { width: 240px; }
.cm-foot-btns { display: flex; gap: 8px; }
</style>
