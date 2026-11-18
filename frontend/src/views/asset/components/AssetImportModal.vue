<template>
  <el-dialog
    :model-value="modelValue"
    :title="`批量导入${title}`"
    width="440px"
    append-to-body
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form label-width="96px" label-position="right" size="small" class="ai-form">
      <el-form-item label="资产组类型">
        <el-radio-group v-model="groupType">
          <el-radio-button label="1">小程序/小游戏</el-radio-button>
          <el-radio-button label="2">电商</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="引用历史任务">
        <div class="ai-row">
          <el-radio-group v-model="taskSource">
            <el-radio-button label="HISTORY">常读推广链接</el-radio-button>
            <el-radio-button label="NEW">新建商品</el-radio-button>
          </el-radio-group>
        </div>
        <div class="ai-row ai-row--picker">
          <el-select v-model="historyTask" class="ai-select" size="small" placeholder="请输入任务名称搜索">
            <el-option v-for="t in taskOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-button class="ai-refresh" size="small" text :icon="Refresh" @click="onRefresh" />
        </div>
      </el-form-item>

      <el-form-item label="获取模板文件">
        <el-button size="small" type="primary" @click="onDownload">点击下载</el-button>
      </el-form-item>

      <el-form-item label="导入文件">
        <div class="ai-row">
          <el-button size="small" type="primary" @click="onUpload">上传文件</el-button>
          <span class="ai-tip">目前仅支持xlsx文件格式</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="small" plain @click="close">取 消</el-button>
      <el-button size="small" type="primary" @click="confirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '资产组' },
  taskOptions: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const groupType = ref('1');
const taskSource = ref('HISTORY');
const historyTask = ref('');

watch(() => props.modelValue, (v) => {
  if (v) { groupType.value = '1'; taskSource.value = 'HISTORY'; historyTask.value = ''; }
});

function onRefresh() { ElMessage.success('已刷新历史任务'); }
function onDownload() { ElMessage.success('模板文件下载中（原型）'); }
function onUpload() { ElMessage.info('请选择 xlsx 文件（原型）'); }
function close() { emit('update:modelValue', false); }
function confirm() {
  if (!historyTask.value) { ElMessage.warning('请选择引用历史任务'); return; }
  emit('confirm', { group_type: groupType.value, task_source: taskSource.value, task_id: historyTask.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ai-form :deep(.el-form-item) { margin-bottom: 22px; }
.ai-form :deep(.el-form-item__label) { font-size: 13px; color: #333; }
.ai-row { display: flex; align-items: center; }
.ai-row--picker { margin-top: 10px; }
.ai-select { width: 240px; }
.ai-refresh { margin-left: 8px; color: #197afb; }
.ai-tip { margin-left: 12px; font-size: 12px; color: #909399; }
</style>
