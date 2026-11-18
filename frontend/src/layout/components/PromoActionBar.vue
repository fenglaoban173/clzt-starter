<template>
  <div class="promo-actions">
    <!-- 巨量广告·标准：批量新建 + 使用已有策略新建 + 数据日期区间 -->
    <template v-if="isUpgrade">
      <el-button type="primary" class="teal-btn" @click="onNewBuild">批量新建</el-button>
      <el-button type="primary" class="teal-btn" @click="onUseStrategy">使用已有策略新建</el-button>
    </template>
    <el-button v-else type="primary" class="teal-btn" @click="onNewBuild">
      {{ isUni ? '新建全域项目' : '新建智擎项目' }}
    </el-button>

    <el-date-picker
      v-model="dateRange"
      type="daterange"
      unlink-panels
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      class="date-range"
    />

    <!-- 使用已有策略新建：策略组选择 -->
    <StrategyGroupDialog v-model="strategyVisible" @confirm="onStrategyConfirm" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import StrategyGroupDialog from '@/views/media/components/StrategyGroupDialog.vue';
import { usePromoRange } from '@/composables/usePromoRange';

const props = defineProps({
  media: { type: String, default: 'upgrade' },
});

const router = useRouter();
const { dateRange } = usePromoRange();

const isUpgrade = computed(() => props.media === 'upgrade');
const isUni = computed(() => props.media === 'uni');

const strategyVisible = ref(false);

function onNewBuild() {
  router.push({ name: 'build-create', query: { media: props.media } });
}

/** 打开策略组弹窗 */
function onUseStrategy() {
  strategyVisible.value = true;
}

/** 选定策略组后跳转批量搭建页，并把策略组带入自动回填各板块 */
function onStrategyConfirm(group) {
  router.push({ name: 'build-create', query: { media: props.media, strategy: group.id } });
}
</script>

<style scoped>
.promo-actions { display: flex; align-items: center; gap: 12px; }
/* 绿色按钮统一为 #00a272（hover / active 为同色系加深） */
.teal-btn {
  --el-button-bg-color: #00a272;
  --el-button-border-color: #00a272;
  --el-button-hover-bg-color: #009267;
  --el-button-hover-border-color: #009267;
  --el-button-active-bg-color: #00825b;
  --el-button-active-border-color: #00825b;
  --el-button-hover-text-color: #fff;
  --el-button-active-text-color: #fff;
}
.date-range { width: 280px !important; }
</style>
