<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="250"
    trigger="click"
    popper-class="ad-filter-picker"
  >
    <template #reference>
      <!-- 全部筛选：选择要展示的筛选项 -->
      <el-button v-if="mode === 'all'" class="fp-btn">
        <el-icon><Filter /></el-icon><span>全部筛选</span>
      </el-button>
      <!-- 添加筛选：追加要展示的筛选项 -->
      <el-button v-else class="fp-btn fp-add">
        <el-icon><Plus /></el-icon><span>添加筛选</span>
      </el-button>
    </template>

    <div class="fp-body">
      <div class="fp-title">{{ mode === 'all' ? '选择展示的筛选项' : '添加筛选条件' }}</div>
      <el-checkbox-group v-model="innerKeys" class="fp-list">
        <el-checkbox v-for="d in AD_FILTER_DEFS" :key="d.key" :value="d.key">{{ d.label }}</el-checkbox>
      </el-checkbox-group>
      <div class="fp-foot">
        <a class="fp-link" @click="innerKeys = AD_FILTER_DEFS.map((d) => d.key)">全选</a>
        <a class="fp-link" @click="innerKeys = []">清空</a>
        <span class="fp-count">已选 {{ innerKeys.length }} 项</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Filter, Plus } from '@element-plus/icons-vue';
import { AD_FILTER_DEFS } from '@/mock/adFilters';

const props = defineProps({
  // 已展示的筛选项 key 集合
  visibleKeys: { type: Array, default: () => [] },
  // all：全部筛选；add：添加筛选
  mode: { type: String, default: 'all' },
});
const emit = defineEmits(['update:visibleKeys', 'change']);

const visible = ref(false);

const innerKeys = computed({
  get: () => props.visibleKeys,
  set: (v) => emit('update:visibleKeys', v),
});

// 勾选变化（含全选 / 清空）时通知父级
watch(innerKeys, (v) => emit('change', v), { deep: true });
</script>

<style scoped>
.fp-btn { display: inline-flex; align-items: center; gap: 4px; }
.fp-add { color: #4e5969; }

.fp-body { font-size: 14px; color: #1d2129; }
.fp-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.fp-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
  gap: 4px;
}
.fp-list :deep(.el-checkbox) { margin-right: 0; height: 26px; }
.fp-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
}
.fp-link { color: #165dff; cursor: pointer; font-size: 13px; }
.fp-count { margin-left: auto; font-size: 12px; color: #86909c; }
</style>
