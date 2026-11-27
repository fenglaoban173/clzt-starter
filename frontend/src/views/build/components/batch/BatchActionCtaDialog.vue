<template>
  <!-- 行动号召「查看推荐」弹窗（对齐线上 cl.mobgi.com 广告信息 → 创意组件 → 行动号召）
       * 562×，标题「行动号召」
       * 三列复选，共 25 条（线上按行优先排：第 9 行只有左侧「订购热线」）
       * footer 左「已选: n/4」，右 取消 / 确定 -->
  <el-dialog
    :model-value="modelValue"
    title="行动号召"
    width="562px"
    class="ctar-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="ctar-body">
      <el-checkbox-group v-model="picked" class="ctar-grid">
        <el-checkbox v-for="c in OPTIONS" :key="c" :label="c" class="ctar-item" :disabled="isDisabled(c)">
          {{ c }}
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <template #footer>
      <div class="ctar-foot">
        <span class="ctar-count">已选: {{ picked.length }}/{{ MAX }}</span>
        <div class="ctar-foot__btns">
          <el-button class="ctar-btn" @click="emit('update:modelValue', false)">取 消</el-button>
          <el-button class="ctar-btn ctar-btn--primary" @click="onConfirm">确 定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* 已添加过的标签，弹窗内置灰 */
  existing: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const MAX = 4;

/* 线上顺序：按行优先（列1→列2→列3）逐行排列 */
const OPTIONS = [
  '立即下载', '极速下载', '官方下载',
  '查看详情', '了解更多', '更多精彩',
  '立即报名', '立即预约', '预约看房',
  '报名试驾', '领取优惠', '领取卡券',
  '马上领取', '一键领取', '联系客服',
  '在线咨询', '在线客服', '人工客服',
  '咨询热线', '电话咨询', '电话拨打',
  '立即拨打', '咨询电话', '加盟热线',
  '订购热线',
];

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
  if (picked.value.length > MAX) {
    ElMessage.warning(`最多选择 ${MAX} 条`);
    return;
  }
  emit('confirm', picked.value.slice());
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ctar-body {
  padding: 2px 0 4px;
}
.ctar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 40px;
  row-gap: 13px;
  width: 100%;
}
.ctar-item {
  margin-right: 0;
  height: 22px;
  font-size: 13px;
  color: #1d2129;
}
.ctar-item :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #1d2129;
  padding-left: 8px;
}
.ctar-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.ctar-count {
  font-size: 13px;
  color: #86909c;
}
.ctar-foot__btns {
  display: flex;
  gap: 10px;
}
.ctar-btn {
  width: 123px;
  height: 34px;
  font-size: 14px;
  border-color: #d9dbe1;
  color: #1d2129;
}
.ctar-btn--primary {
  background: #197afb;
  border-color: #197afb;
  color: #fff;
}
.ctar-btn--primary:hover {
  background: #4a95fc;
  border-color: #4a95fc;
  color: #fff;
}
</style>
