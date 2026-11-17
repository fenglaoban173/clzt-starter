<template>
  <el-dialog
    :model-value="modelValue"
    title="自定义指标"
    width="560px"
    class="cd-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="cd-grid">
      <el-checkbox
        class="cd-item cd-all"
        :model-value="allChecked"
        :indeterminate="someChecked"
        @change="onToggleAll"
      >全选</el-checkbox>
      <el-checkbox
        v-for="c in columns"
        :key="c.key"
        class="cd-item"
        :model-value="checked[c.key]"
        @change="(v) => onToggle(c.key, v)"
      >{{ c.label }}</el-checkbox>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ key, label }] 可选列
  columns: { type: Array, default: () => [] },
  // 默认选中的列 key
  selected: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const checked = reactive({});

// 全选：所有项都勾上才为选中；部分勾上为半选
const allChecked = computed(() => (
  props.columns.length > 0 && props.columns.every((c) => checked[c.key])
));

const someChecked = computed(() => {
  const n = props.columns.filter((c) => checked[c.key]).length;
  return n > 0 && n < props.columns.length;
});

function init() {
  props.columns.forEach((c) => { checked[c.key] = props.selected.includes(c.key); });
}

/** 点击「全选」：未全选时全选，已全选时全部取消 */
function onToggleAll() {
  const next = !allChecked.value;
  props.columns.forEach((c) => { checked[c.key] = next; });
}

function onToggle(key, v) {
  checked[key] = v;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const keys = props.columns.filter((c) => checked[c.key]).map((c) => c.key);
  emit('confirm', keys);
  close();
}
</script>

<style scoped>
.cd-grid {
  display: grid;
  grid-template-columns: repeat(3, 145px);
  gap: 14px 12px;
  padding: 6px 4px 2px 20px;
}
.cd-item { margin-right: 0; }
.cd-all { grid-column: 1 / -1; }
.cd-item :deep(.el-checkbox__label) { font-size: 14px; color: #1d2129; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式） */
.cd-dialog .el-dialog__title { color: #1d2129; font-size: 16px; font-weight: 600; }
.cd-dialog .el-dialog__body { padding-top: 16px; padding-bottom: 12px; }
</style>
