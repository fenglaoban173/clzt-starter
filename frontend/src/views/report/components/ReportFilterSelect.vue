<template>
  <!-- 组合式下拉：左侧固定 label（如「优化师」）+ 右侧多选下拉
   * 与创量线上 .select-area > .el-form-item(label + el-select) 结构 1:1 -->
  <div class="report-select-box" :class="{ 'report-select-box--wide': wide }">
    <label :title="label">{{ label }}</label>
    <el-select
      v-model="inner"
      class="cl-filter-select"
      multiple
      collapse-tags
      collapse-tags-tooltip
      :placeholder="placeholder"
      :max-collapse-tags="2"
      filterable
      @visible-change="onVisible"
    >
      <el-option
        v-for="opt in options"
        :key="typeof opt === 'string' ? opt : opt.value"
        :label="typeof opt === 'string' ? opt : opt.label"
        :value="typeof opt === 'string' ? opt : opt.value"
      />
    </el-select>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  // 线上「账户」是远程搜索下拉，实测宽 320px（其余为 168px）
  wide: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const inner = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v || []),
});

function onVisible(v) {
  // 保持与线上一致：下拉展开时多选框宽度自适应
}
</script>
