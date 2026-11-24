<template>
  <!-- 一行筛选条件：左侧固定 label + 右侧控件区 -->
  <div class="report-filter-row">
    <span class="report-dim-label">{{ label }}</span>
    <div class="report-dim-body">
      <slot />
      <span v-if="collapseText" class="report-collapse-link" @click="$emit('toggle-collapse')">
        {{ collapseText }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  collapseText: { type: String, default: '' },
});
defineEmits(['toggle-collapse']);
</script>
