<template>
  <!-- 「详细数据」卡片：卡片头（标题 + 关联维度/自定义指标/导出数据/收起）+ 表格 -->
  <div class="report-card">
    <div class="report-card-head">
      <div class="report-card-title">
        {{ title }}
        <el-popover v-if="help" placement="right" :width="420" trigger="hover">
          <template #reference>
            <el-icon class="report-help-icon"><QuestionFilled /></el-icon>
          </template>
          <div style="font-size: 13px; line-height: 1.7; color: #666">{{ help }}</div>
        </el-popover>
      </div>
      <div class="report-card-actions">
        <slot name="actions" />
        <el-select
          v-if="relationOptions.length"
          v-model="relation"
          size="small"
          style="width: 130px"
        >
          <el-option v-for="o in relationOptions" :key="o" :label="o" :value="o" />
        </el-select>
        <el-button v-if="showCustomMetric" size="small" @click="$emit('custom-metric')">
          <el-icon><Operation /></el-icon>自定义指标
        </el-button>
        <el-button v-if="showExport" size="small" @click="$emit('export')">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
        <a class="report-collapse-link" @click="$emit('toggle')">
          {{ collapsed ? '展开' : '收起' }}
        </a>
      </div>
    </div>

    <div v-show="!collapsed" class="report-table-wrap">
      <el-table
        class="report-table"
        :data="rows"
        :row-key="rowKey"
        border
        show-summary
        :summary-method="summaryMethod"
        @selection-change="(v) => $emit('selection-change', v)"
      >
        <!-- 线上勾选列实测宽 60px -->
        <el-table-column v-if="selectable" type="selection" width="60" fixed="left" />

        <template v-for="col in columns" :key="col.prop">
          <el-table-column
            :prop="col.prop"
            :label="col.label"
            :min-width="col.width || col.minWidth"
            :align="col.align || 'left'"
            :fixed="col.fixed"
            :sortable="col.sortable"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <slot :name="`col-${col.prop}`" :row="row" :column="col">
                {{ row[col.prop] }}
              </slot>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div class="report-pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { QuestionFilled, Operation, Download } from '@element-plus/icons-vue';

const props = defineProps({
  title: { type: String, default: '详细数据' },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  selectable: { type: Boolean, default: true },
  rowKey: { type: String, default: 'id' },
  relationOptions: { type: Array, default: () => [] },
  showCustomMetric: { type: Boolean, default: true },
  showExport: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false },
  help: { type: String, default: '' },
  summaryMethod: { type: Function, default: null },
});
defineEmits(['custom-metric', 'export', 'toggle', 'selection-change']);

const relation = ref('');
const helpVisible = ref(false);
const page = ref(1);
const pageSize = ref(20);

watch(() => props.relationOptions, (v) => {
  if (v.length && !v.includes(relation.value)) relation.value = v[0];
}, { immediate: true });
</script>
