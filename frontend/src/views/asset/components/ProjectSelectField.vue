<template>
  <div class="psf" ref="rootRef">
    <!-- 触发框：只读显示当前已选 -->
    <div class="psf__trigger" :class="{ 'is-open': open }" @click="toggle">
      <span class="psf__value" :class="{ 'is-placeholder': !display }">{{ display || placeholder }}</span>
      <el-icon class="psf__arrow" :class="{ 'is-up': open }"><ArrowDown /></el-icon>
    </div>

    <!-- 下拉面板：搜索框 + 候选列表 + 取消/确认 -->
    <transition name="psf-fade">
      <div v-show="open" class="psf__panel">
        <div class="psf__search">
          <el-input
            v-model="kw"
            size="small"
            placeholder="请输入关键词搜索"
            :prefix-icon="Search"
            clearable
          />
        </div>

        <div class="psf__list">
          <div v-if="!filtered.length" class="psf__empty">暂无数据</div>
          <div
            v-for="o in filtered"
            :key="rawKey(o)"
            class="psf__item"
            :class="{ active: temp === rawValue(o) }"
            @click="pick(o)"
          >
            <el-radio :model-value="temp" :value="rawValue(o)" @click.stop="pick(o)" />
            <span class="psf__item-label">{{ rawLabel(o) }}</span>
          </div>
        </div>

        <div class="psf__foot">
          <el-button size="small" plain @click="onCancel">取 消</el-button>
          <el-button size="small" type="primary" @click="onConfirm">确 认</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { ArrowDown, Search } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  // 可传字符串数组，或 { label, value } 对象数组
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
});
const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const open = ref(false);
const kw = ref('');
const temp = ref(props.modelValue);

function rawLabel(o) {
  return typeof o === 'object' && o !== null ? o.label : o;
}
function rawValue(o) {
  return typeof o === 'object' && o !== null ? o.value : o;
}
function rawKey(o) {
  return rawValue(o) ?? rawLabel(o);
}

const display = computed(() => {
  const hit = props.options.find((o) => rawValue(o) === props.modelValue);
  return hit ? rawLabel(hit) : props.modelValue;
});

const filtered = computed(() => {
  const k = kw.value.trim();
  if (!k) return props.options;
  return props.options.filter((o) => String(rawLabel(o)).includes(k));
});

function toggle() {
  open.value = !open.value;
  if (open.value) {
    temp.value = props.modelValue;
    kw.value = '';
  }
}

function pick(o) {
  temp.value = rawValue(o);
}

function onCancel() {
  // 放弃面板内临时选择，不写回
  open.value = false;
}

function onConfirm() {
  emit('update:modelValue', temp.value);
  open.value = false;
}

function onDocDown(e) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', onDocDown));
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown));
</script>

<style scoped>
.psf { position: relative; display: inline-block; width: 100%; }
.psf__trigger {
  display: flex; align-items: center; justify-content: space-between;
  height: 28px; padding: 0 10px; font-size: 13px; color: #606266;
  border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; cursor: pointer;
  transition: border-color .2s;
}
.psf__trigger:hover, .psf__trigger.is-open { border-color: #197afb; }
.psf__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.psf__value.is-placeholder { color: #c0c4cc; }
.psf__arrow { color: #c0c4cc; transition: transform .2s; }
.psf__arrow.is-up { transform: rotate(180deg); }

.psf__panel {
  position: absolute; top: calc(100% + 4px); left: 0; width: 100%; min-width: 240px; z-index: 30;
  background: #fff; border: 1px solid #e4e7ed; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
  overflow: hidden;
}
.psf__search { padding: 8px 10px 0; }
.psf__list { max-height: 220px; overflow-y: auto; padding: 6px 0; }
.psf__item {
  display: flex; align-items: center; gap: 8px; padding: 7px 12px; cursor: pointer; font-size: 13px;
}
.psf__item:hover { background: #f5f7fa; }
.psf__item.active { color: #197afb; background: #ecf3ff; }
.psf__item-label { color: inherit; }
.psf__empty { padding: 24px 0; text-align: center; color: #c0c4cc; font-size: 12px; }
.psf__foot { display: flex; justify-content: flex-end; gap: 8px; padding: 8px 10px; border-top: 1px solid #ebeef5; }

.psf-fade-enter-active, .psf-fade-leave-active { transition: opacity .15s; }
.psf-fade-enter-from, .psf-fade-leave-to { opacity: 0; }
</style>
