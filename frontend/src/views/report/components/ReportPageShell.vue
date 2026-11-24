<template>
  <!-- 报表页外壳：页头（标题 + 粒度/日期）+ 筛选区 + 内容区
   * 所有报表页共用，保证页头/筛选/表格的排版与创量线上一致 -->
  <div class="report-page">
    <div class="report-head">
      <div class="report-head-left">
        <span class="report-title">{{ title }}</span>
        <slot name="subtabs" />
      </div>
      <div class="report-head-right">
        <slot name="head-right" />
        <el-radio-group
          v-if="periods.length"
          v-model="period"
          class="report-period"
          size="small"
        >
          <el-radio-button v-for="p in periods" :key="p" :value="p">{{ p }}</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="showDate"
          v-model="dateRange"
          type="daterange"
          size="small"
          class="report-date"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
        />
      </div>
    </div>

    <slot name="before-filter" />

    <ReportFilterToolbar
      v-if="showFilter"
      v-model:media="media"
      v-model:dimension="dimension"
      v-model:keyword="keyword"
      :show-media="showMedia"
      :media-options="mediaOptions"
      :dimensions="dimensions"
      :selects="selects"
      :show-search="showSearch"
      :show-data-filter="showDataFilter"
      :collapsed="collapsed"
      @query="$emit('query')"
      @toggle-collapse="$emit('toggle-collapse')"
      @add-filter="$emit('add-filter')"
      @open-data-filter="$emit('open-data-filter')"
    />

    <div class="report-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import ReportFilterToolbar from './ReportFilterToolbar.vue';

defineProps({
  title: { type: String, default: '' },
  periods: { type: Array, default: () => ['分日', '分月', '汇总'] },
  showDate: { type: Boolean, default: true },
  showFilter: { type: Boolean, default: true },
  showMedia: { type: Boolean, default: true },
  mediaOptions: { type: Array, default: () => [] },
  dimensions: { type: Array, default: () => [] },
  selects: { type: Array, default: () => [] },
  showSearch: { type: Boolean, default: true },
  showDataFilter: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false },
});
defineEmits(['query', 'toggle-collapse', 'add-filter', 'open-data-filter']);

const period = defineModel('period', { default: '汇总' });
const dateRange = defineModel('dateRange', { default: () => [] });
const media = defineModel('media', { default: 'toutiao_upgrade' });
const dimension = defineModel('dimension', { default: '' });
const keyword = defineModel('keyword', { default: '' });
</script>
