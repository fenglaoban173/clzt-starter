<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="760px"
    align-center
    class="ate-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <template v-if="mode === 'edit'" #header="{ close }">
      <div class="ate-head">
        <span class="ate-title">编辑标题</span>
        <span class="ate-warn">
          <el-icon class="ate-warn-icon"><WarningFilled /></el-icon>
          编辑后标题数据将清零，按照新标题重新统计
        </span>
      </div>
    </template>

    <div class="ate-body">
      <!-- 分类 + AI助手（仅「新建标题 / 编辑标题」有） -->
      <div v-if="showCategory" class="ate-row">
        <span class="ate-label">分类</span>
        <el-select v-model="category" class="ate-select" placeholder="请输入分类名称" clearable>
          <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button class="ate-ai" @click="onAi">AI助手</el-button>
      </div>

      <!-- 标题输入 -->
      <div class="ate-row ate-row-block">
        <div class="ate-label-row">
          <span class="ate-label">标题</span>
          <a class="ate-link" @click="emit('wordpack')">+ 插入动态词包</a>
        </div>
        <el-input
          v-model="text"
          type="textarea"
          :rows="8"
          class="ate-textarea"
          placeholder="标题长度范围为5~55个字，添加多个标题请换行"
        />
        <p v-if="error" class="ate-error">{{ error }}</p>
        <p class="ate-count">{{ lenText }}</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 'create' 新建标题（带分类 + AI助手）/ 'edit' 编辑标题 / 'plain' 仅添加文案
  mode: { type: String, default: 'plain' },
  titleText: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'wordpack']);

const CATEGORIES = ['通用', '短剧', '小说', '游戏', '电商', '教育', '本地生活'];

const category = ref('');
const text = ref('');
const error = ref('');

const showCategory = computed(() => props.mode === 'create' || props.mode === 'edit');
const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑标题' : '添加标题'));

/** 字数：两个英文字符占 1 字 */
const len = computed(() => {
  const s = String(text.value || '');
  let n = 0;
  for (const ch of s) n += /[\x00-\xff]/.test(ch) ? 0.5 : 1;
  return Math.floor(n);
});
const lenText = computed(() => `${len.value}/55`);

function init() {
  category.value = '';
  text.value = props.titleText || '';
  error.value = '';
}

function onAi() {
  ElMessage.info('原型：AI 助手生成文案（不接入真实模型）');
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const t = String(text.value || '').trim();
  if (!t) {
    error.value = '输入的标题不能为空';
    return;
  }
  error.value = '';
  emit('confirm', { text: t, category: category.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ate-body { --el-font-size-base: 14px; font-size: 14px; color: #606266; }
.ate-row { display: flex; align-items: center; margin-bottom: 18px; }
.ate-row-block { display: block; margin-bottom: 0; }
.ate-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ate-label { width: 60px; font-size: 14px; color: #666; }
.ate-select { width: 240px; }
.ate-ai {
  margin-left: 12px;
  height: 32px;
  padding: 0 16px;
  color: #fff;
  font-size: 12px;
  border: none;
  background: linear-gradient(90deg, #7b5cff 0%, #2f8bff 100%);
}
.ate-ai:hover { opacity: 0.88; color: #fff; }
.ate-textarea { width: 100%; }
.ate-textarea :deep(.el-textarea__inner) { font-size: 14px; line-height: 22px; color: #333; }
.ate-error { margin: 6px 0 0; font-size: 12px; color: #f56c6c; }
.ate-count { margin: 6px 0 0; font-size: 12px; color: #999; text-align: right; }
.ate-link { color: #197afb; cursor: pointer; font-size: 13px; }
.ate-head { display: flex; align-items: center; gap: 12px; }
.ate-title { font-size: 16px; font-weight: 700; color: #333; }
.ate-warn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #909399; }
.ate-warn-icon { color: #e6a23c; }
</style>

<style>
.ate-dialog { padding: 0; }
.ate-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.ate-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.ate-dialog .el-dialog__body { padding: 20px 24px; }
.ate-dialog .el-dialog__footer { padding: 0 24px 20px; }
.ate-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.ate-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.ate-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.ate-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
.ate-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
</style>
