<template>
  <!-- 产品卖点「查看推荐」弹窗（对齐线上 创意组件/产品信息 → 产品卖点）
       * 370×，标题「产品卖点」
       * 单个复选「近期热卖商品」
       * footer 左「已选: n/5」，右 取消 / 确定 -->
  <el-dialog
    :model-value="modelValue"
    title="产品卖点"
    width="564px"
    class="spt-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="spt-body">
      <el-checkbox-group v-model="picked" class="spt-list">
        <el-checkbox v-for="c in OPTIONS" :key="c" :label="c" class="spt-item" :disabled="isDisabled(c)">
          {{ c }}
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <template #footer>
      <div class="spt-foot">
        <span class="spt-count">已选: {{ picked.length }}/{{ MAX }}</span>
        <div class="spt-foot__btns">
          <el-button class="spt-btn" @click="emit('update:modelValue', false)">取 消</el-button>
          <el-button class="spt-btn spt-btn--primary" @click="onConfirm">确 定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  existing: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const MAX = 5;
const OPTIONS = ['近期热卖商品'];
const picked = ref([]);

watch(
  () => props.modelValue,
  (v) => {
    if (v) picked.value = [];
  }
);

function isDisabled(c) {
  return (props.existing || []).includes(c);
}
function onConfirm() {
  emit('confirm', picked.value.slice());
  emit('update:modelValue', false);
}
</script>

<style scoped>
.spt-body {
  padding: 6px 0 10px;
}
.spt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.spt-item {
  margin-right: 0;
  height: 22px;
}
.spt-item :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #1d2129;
  padding-left: 8px;
}
.spt-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}
.spt-count {
  font-size: 13px;
  color: #86909c;
}
.spt-foot__btns {
  display: flex;
  gap: 10px;
}
.spt-btn {
  width: 120px;
  height: 36px;
  font-size: 14px;
  border-color: #d9dbe1;
  color: #1d2129;
}
.spt-btn--primary {
  width: 120px;
  background: #197afb;
  border-color: #197afb;
  color: #fff;
}
.spt-btn--primary:hover {
  background: #4a95fc;
  border-color: #4a95fc;
  color: #fff;
}
</style>
