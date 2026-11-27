<template>
  <!-- 添加标题弹窗（线上图3：标题库来源下「+ 新建标题」打开，含「插入动态词包」） -->
  <teleport to="body">
    <div v-if="visible" class="tadd-mask" @click="close"></div>
    <div v-if="visible" class="tadd-dialog" role="dialog" aria-modal="true" aria-label="添加标题">
      <div class="tadd-dialog__header">
        <span class="tadd-dialog__title">添加标题</span>
        <button class="tadd-dialog__close" type="button" aria-label="Close" @click="close">✕</button>
      </div>

      <div class="tadd-dialog__body">
        <!-- 分类 + 搜索 + AI 创作 -->
        <div class="tadd-row tadd-row--top">
          <select v-model="category" class="tadd-select">
            <option value="">分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
          <input v-model="categoryKeyword" class="tadd-input" type="text" placeholder="请输入分类名称" />
        </div>

        <!-- 标题 + 插入动态词包 -->
        <div class="tadd-title-row">
          <span class="tadd-title-label">标题</span>
          <button class="tadd-link" type="button" @click="openWordPack">
            <span class="tadd-link__ico">⌄</span>插入动态词包
          </button>
        </div>

        <div class="tadd-tips">标题长度范围为5-55个字，添加多个标题换行</div>

        <textarea
          ref="areaRef"
          v-model="text"
          class="tadd-textarea"
          :class="{ 'is-error': !!error }"
          placeholder="请输入标题，多个标题请换行"
        ></textarea>
        <div v-if="error" class="tadd-error">{{ error }}</div>
      </div>

      <div class="tadd-dialog__footer">
        <button class="tadd-btn" type="button" @click="close">取 消</button>
        <button class="tadd-btn tadd-btn--primary" type="button" @click="confirm">确 定</button>
      </div>
    </div>

    <BatchWordPackDialog v-model="wordPackVisible" @insert="onWordPackInsert" />
  </teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import BatchWordPackDialog from './BatchWordPackDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 标题分类下拉 */
  categories: { type: Array, default: () => [] },
  /** 回显：{ category, text } */
  init: { type: Object, default: () => ({}) },
  /** 每个标题最多几个动态词（线上 2） */
  maxTokensPerTitle: { type: Number, default: 2 },
  minLength: { type: Number, default: 5 },
  maxLength: { type: Number, default: 55 },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

const visible = computed(() => props.modelValue);

const category = ref('');
const categoryKeyword = ref('');
const text = ref('');
const areaRef = ref(null);
const wordPackVisible = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    category.value = (props.init && props.init.category) || '';
    text.value = (props.init && props.init.text) || '';
    categoryKeyword.value = '';
    wordPackVisible.value = false;
  },
  { immediate: true }
);

/** 每行标题里 `{词包}` 的数量 */
function tokenCount(line) {
  const m = String(line).match(/\{[\u4e00-\u9fa5A-Za-z0-9-]{1,12}\}/g);
  return m ? m.length : 0;
}

const error = computed(() => {
  const lines = text.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return '';
  const tooMany = lines.find((l) => tokenCount(l) > props.maxTokensPerTitle);
  if (tooMany) return `每个标题动态词数量为${props.maxTokensPerTitle}个`;
  /* 动态词按占位符计字符数（与线上一致，5~55 字） */
  const tooShort = lines.find((l) => l.length < props.minLength);
  if (tooShort) return `标题长度范围为${props.minLength}-${props.maxLength}个字`;
  const tooLong = lines.find((l) => l.length > props.maxLength);
  if (tooLong) return `标题长度范围为${props.minLength}-${props.maxLength}个字`;
  return '';
});

function close() {
  emit('close');
  emit('update:modelValue', false);
}

function openWordPack() {
  wordPackVisible.value = true;
}

/** 公共词包「插入」：在光标处插入 {词包名} */
function onWordPackInsert({ name }) {
  const el = areaRef.value;
  const token = `{${name}}`;
  if (!el) {
    text.value += token;
    return;
  }
  const start = el.selectionStart == null ? text.value.length : el.selectionStart;
  const end = el.selectionEnd == null ? text.value.length : el.selectionEnd;
  text.value = text.value.slice(0, start) + token + text.value.slice(end);
  nextTick(() => {
    el.focus();
    const pos = start + token.length;
    el.setSelectionRange(pos, pos);
  });
}

function confirm() {
  const lines = text.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) { ElMessage.warning('请输入标题'); return; }
  if (error.value) { ElMessage.warning(error.value); return; }
  emit('confirm', { category: category.value, titles: lines, text: lines.join('\n') });
  emit('update:modelValue', false);
}
</script>

<style>
.tadd-mask {
  position: fixed; inset: 0; z-index: 2200;
  background: rgba(0, 0, 0, .5);
}
.tadd-dialog {
  position: fixed; top: 50%; left: 50%; z-index: 2201;
  width: 730px;
  transform: translate(-50%, -50%);
  background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  font-size: 14px; color: #606266;
}
.tadd-dialog__header {
  position: relative; height: 44px; padding: 0 20px;
  display: flex; align-items: center;
  border-bottom: 1px solid #ebedf0;
}
.tadd-dialog__title { font-size: 15px; color: #303133; }
.tadd-dialog__close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; padding: 0; font-size: 16px; line-height: 1;
  color: #909399; background: none; border: none; cursor: pointer;
}
.tadd-dialog__close:hover { color: #197afb; }
.tadd-dialog__body { padding: 16px 20px 8px; }

.tadd-row { display: flex; align-items: center; gap: 8px; }
.tadd-select {
  width: 200px; height: 32px; padding: 0 8px;
  font-size: 13px; color: #606266;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 2px;
  outline: none;
}
.tadd-input {
  flex: 1; min-width: 0; height: 32px; padding: 0 10px;
  font-size: 13px; color: #606266;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 2px;
  outline: none; box-sizing: border-box;
}
.tadd-input::placeholder { color: #a8abb2; }

.tadd-title-row { display: flex; align-items: center; margin-top: 14px; }
.tadd-title-label { flex: none; font-size: 12px; color: #606266; }
.tadd-link {
  margin-left: auto;
  padding: 0; font-size: 12px; color: #197afb;
  background: none; border: none; cursor: pointer;
}
.tadd-link:hover { text-decoration: underline; }
.tadd-link__ico { margin-right: 2px; font-size: 11px; }

.tadd-tips {
  margin-top: 8px; padding: 4px 8px;
  font-size: 12px; line-height: 20px; color: #4e5969;
  background: #eef4ff; border-radius: 2px;
}
.tadd-textarea {
  display: block; width: 100%; height: 160px; margin-top: 8px;
  padding: 8px 10px; box-sizing: border-box;
  font-size: 13px; line-height: 22px; color: #1d2129;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 2px;
  outline: none; resize: vertical;
}
.tadd-textarea::placeholder { color: #a8abb2; }
.tadd-textarea.is-error { border-color: #f56c6c; }
.tadd-error { margin-top: 6px; font-size: 12px; color: #f56c6c; }

.tadd-dialog__footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #ebedf0;
}
.tadd-btn {
  min-width: 76px; height: 32px; padding: 0 16px;
  font-size: 13px; color: #606266;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 3px; cursor: pointer;
}
.tadd-btn:hover { color: #197afb; border-color: #a0cfff; }
.tadd-btn--primary {
  color: #fff; background: #197afb; border-color: #197afb;
}
.tadd-btn--primary:hover { color: #fff; background: #4a9bff; border-color: #4a9bff; }
</style>
