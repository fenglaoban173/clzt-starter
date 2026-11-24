<template>
  <!-- 报表页顶部筛选区（.report-filter）
   * 结构与创量线上一致：媒体 / 数据维度 / 筛选维度 / 数据筛选 若干行 -->
  <div class="report-filter">
    <!-- 媒体 -->
    <ReportFilterRow
      v-if="showMedia"
      label="媒体："
      :collapse-text="collapsed ? '展开筛选配置' : '收起筛选配置'"
      @toggle-collapse="$emit('toggle-collapse')"
    >
      <el-radio-group v-model="media" class="report-radio-group" size="small">
        <el-radio-button v-for="m in mediaOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </el-radio-button>
      </el-radio-group>
    </ReportFilterRow>

    <!-- 数据维度 -->
    <ReportFilterRow v-if="dimensions.length" label="数据维度：">
      <el-radio-group v-model="dimension" class="report-radio-group" size="small">
        <el-radio-button v-for="d in dimensions" :key="d" :value="d">{{ d }}</el-radio-button>
      </el-radio-group>
    </ReportFilterRow>

    <!-- 筛选维度 -->
    <ReportFilterRow v-if="selects.length || showSearch" label="筛选维度：">
      <div v-if="showSearch" class="report-search-box">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="请输入关键词"
          :suffix-icon="Search"
        />
      </div>

      <ReportFilterSelect
        v-for="s in visibleSelects"
        :key="s.key"
        v-model="s.model"
        :label="s.label"
        :placeholder="s.placeholder"
        :options="s.options"
      />

      <button class="report-add-filter" type="button" @click="$emit('add-filter')">
        + 添加筛选
      </button>

      <el-button
        type="primary"
        class="report-query-btn"
        size="small"
        @click="$emit('query')"
      >
        查询
      </el-button>
    </ReportFilterRow>

    <!-- 数据筛选 -->
    <ReportFilterRow v-if="showDataFilter" label="数据筛选：">
      <button class="report-filter-btn" type="button" @click="$emit('open-data-filter')">
        <el-icon><Filter /></el-icon>筛选
      </button>
    </ReportFilterRow>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Search, Filter } from '@element-plus/icons-vue';
import ReportFilterRow from './ReportFilterRow.vue';
import ReportFilterSelect from './ReportFilterSelect.vue';
import { MEDIA_OPTIONS } from '@/mock/reportData';

const props = defineProps({
  showMedia: { type: Boolean, default: true },
  mediaOptions: { type: Array, default: () => MEDIA_OPTIONS },
  dimensions: { type: Array, default: () => [] },
  selects: { type: Array, default: () => [] },   // [{key,label,placeholder,options,model}]
  showSearch: { type: Boolean, default: true },
  showDataFilter: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false },
});
defineEmits(['query', 'toggle-collapse', 'add-filter', 'open-data-filter']);

const media = defineModel('media', { default: 'toutiao_upgrade' });
const dimension = defineModel('dimension', { default: '' });
const keyword = defineModel('keyword', { default: '' });

// 收起时只保留前 3 个筛选条件（与线上「收起筛选配置」一致）
const visibleSelects = computed(() =>
  props.collapsed ? props.selects.slice(0, 3) : props.selects
);
</script>
