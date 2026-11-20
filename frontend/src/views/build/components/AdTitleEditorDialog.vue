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
        <!-- R79：线上分类为「可搜索 + 可新建」的下拉面板（初始无数据） -->
        <el-popover
          v-model:visible="catVisible"
          placement="bottom-start"
          :width="400"
          trigger="click"
          popper-class="ate-cat-pop"
        >
          <template #reference>
            <div class="ate-cat-trigger">
              <span class="ate-cat-prefix">分类</span>
              <span class="ate-cat-value" :class="{ 'is-ph': !category }">
                {{ category || '请输入分类名称' }}
              </span>
              <el-icon class="ate-cat-arrow"><ArrowDown /></el-icon>
            </div>
          </template>
          <div class="ate-cat-panel">
            <el-input
              v-model="catKeyword"
              class="ate-cat-search"
              placeholder="搜索"
              :suffix-icon="Search"
              clearable
            />
            <div class="ate-cat-list">
              <div v-if="!filteredCats.length" class="ate-cat-empty">暂无数据</div>
              <div
                v-for="c in filteredCats"
                :key="c"
                class="ate-cat-item"
                :class="{ active: c === category }"
                @click="pickCategory(c)"
              >
                {{ c }}
              </div>
            </div>
            <div class="ate-cat-foot">
              <a class="ate-cat-link" @click="openNewCategory">新建分类</a>
              <a class="ate-cat-link" @click="clearCategory">清除已选</a>
            </div>
          </div>
        </el-popover>
        <el-button class="ate-ai" @click="onAi">AI助手</el-button>
      </div>

      <!-- 标题输入（线上为一个带边框的整块：标题行 + 提示行 + 输入框 + 错误提示） -->
      <div class="ate-title-block">
        <div class="ate-label-row">
          <span class="ate-label">标题</span>
          <a class="ate-link" @click="onWordPack">+插入动态词包</a>
        </div>
        <div class="ate-hint">标题长度范围为5~55个字，添加多个标题请换行</div>
        <el-input
          ref="inputRef"
          v-model="text"
          type="textarea"
          :rows="10"
          class="ate-textarea"
        />
        <!-- R78：线上仅在长度不合法时给出红色提示（无字数计数） -->
        <p v-if="errorText" class="ate-error">{{ errorText }}</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>

  <!-- R79：新增分类（线上「分类」下拉底部「新建分类」唤起） -->
  <el-dialog
    :model-value="newCatVisible"
    title="新增分类"
    width="640px"
    align-center
    class="ate-nc-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => { if (!v) newCatVisible = false; }"
  >
    <el-input
      v-model="newCatName"
      class="ate-nc-input"
      placeholder="分类名称不超过50个字符"
      maxlength="50"
    >
      <template #prepend>分类</template>
    </el-input>
    <template #footer>
      <el-button @click="newCatVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!String(newCatName || '').trim()" @click="confirmNewCategory">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, Search, WarningFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 'create' 新建标题（带分类 + AI助手）/ 'edit' 编辑标题 / 'plain' 仅添加文案
  mode: { type: String, default: 'plain' },
  titleText: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'wordpack']);

/** R79：分类列表（线上初始为空，通过下拉底部「新建分类」新增） */
const categories = ref([]);
const category = ref('');
/** 分类下拉面板显隐 */
const catVisible = ref(false);
/** 分类面板搜索关键字 */
const catKeyword = ref('');
/** 「新增分类」弹窗 */
const newCatVisible = ref(false);
const newCatName = ref('');

const text = ref('');
/** 是否点过「确定」——空标题的错误提示在点击确定后才出现 */
const submitted = ref(false);
/** el-input 组件实例（取内部 textarea，做光标定位） */
const inputRef = ref(null);
/** 打开词包弹窗前记录的光标位置 */
const savedRange = ref(null);

const showCategory = computed(() => props.mode === 'create' || props.mode === 'edit');
const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑标题' : '添加标题'));

/** 分类面板按关键字过滤 */
const filteredCats = computed(() => {
  const kw = String(catKeyword.value || '').trim();
  if (!kw) return categories.value;
  return categories.value.filter((c) => String(c).includes(kw));
});

/** 选中分类 */
function pickCategory(c) {
  category.value = c;
  catKeyword.value = '';
  catVisible.value = false;
}

/** 清除已选 */
function clearCategory() {
  category.value = '';
  catKeyword.value = '';
  catVisible.value = false;
}

/** 新建分类：先收起分类面板，再弹出「新增分类」 */
function openNewCategory() {
  catVisible.value = false;
  newCatName.value = '';
  newCatVisible.value = true;
}

/** 确认新增分类：加入列表并选中 */
function confirmNewCategory() {
  const v = String(newCatName.value || '').trim();
  if (!v) return;
  if (!categories.value.includes(v)) categories.value = [...categories.value, v];
  category.value = v;
  newCatName.value = '';
  newCatVisible.value = false;
}

/** 动态词包占位符 {词包名}：不计入标题长度校验（线上口径） */
function stripPack(str) {
  return String(str || '').replace(/\{[^{}]*\}/g, '');
}

/** 字数：两个英文字符占 1 字 */
function charLen(str) {
  let n = 0;
  for (const ch of stripPack(str)) n += /[\x00-\xff]/.test(ch) ? 0.5 : 1;
  return Math.floor(n);
}

/** 逐行长度校验：第 N 行标题长度范围为 5-55个字 */
const badLine = computed(() => {
  const lines = String(text.value || '').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const n = charLen(lines[i]);
    if (n < 5 || n > 55) return { no: i + 1, len: n };
  }
  return null;
});

const errorText = computed(() => {
  if (submitted.value && !String(text.value || '').trim()) return '输入的标题不能为空';
  if (badLine.value) return `第${badLine.value.no}行标题长度范围为 5-55个字`;
  return '';
});

function init() {
  category.value = '';
  catKeyword.value = '';
  catVisible.value = false;
  newCatVisible.value = false;
  newCatName.value = '';
  text.value = props.titleText || '';
  submitted.value = false;
  savedRange.value = null;
}

function onAi() {
  ElMessage.info('原型：AI 助手生成文案（不接入真实模型）');
}

/** 点击「+ 插入动态词包」：先记住光标位置，再由父级打开词包弹窗 */
function onWordPack() {
  const ta = inputRef.value?.textarea;
  savedRange.value = ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null;
  emit('wordpack');
}

/**
 * 插入动态词包占位符 {词包名}（线上效果：占位符插入到光标处，行尾可继续输入）
 * 由父级在公共词包弹窗点击「插入」后调用
 */
function insertWordPack(pack) {
  const token = `{${pack && pack.name ? pack.name : '词包'}}`;
  const ta = inputRef.value?.textarea;
  let start = savedRange.value ? savedRange.value.start : ta ? ta.selectionStart : null;
  let end = savedRange.value ? savedRange.value.end : ta ? ta.selectionEnd : null;
  if (start === null || start === undefined) {
    start = String(text.value || '').length;
    end = start;
  }
  const next = `${String(text.value || '').slice(0, start)}${token}${String(text.value || '').slice(end)}`;
  text.value = next;
  savedRange.value = null;
  nextTick(() => {
    if (!ta) return;
    const pos = start + token.length;
    ta.focus();
    try {
      ta.setSelectionRange(pos, pos);
    } catch (e) {
      /* 部分浏览器不支持，忽略 */
    }
  });
}

defineExpose({ insertWordPack });

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const t = String(text.value || '').trim();
  submitted.value = true;
  if (!t) return;
  if (badLine.value) return;
  emit('confirm', { text: t, category: category.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ate-body { --el-font-size-base: 14px; font-size: 14px; color: #606266; }
.ate-row { display: flex; align-items: center; margin-bottom: 18px; }
/* 标题整块（线上：标题行 + 灰色提示行 + 输入框 + 红色错误提示，同在一个边框容器内） */
.ate-title-block { border: 1px solid #e5e6eb; }
.ate-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e6eb;
}
.ate-hint {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  background: #f4f6f9;
  border-bottom: 1px solid #e5e6eb;
}
.ate-label { font-size: 14px; color: #333; }
.ate-select { width: 240px; }

/* R79：分类下拉触发器（线上：左格「分类」+ 名称/占位 + 右侧箭头） */
.ate-cat-trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.ate-cat-trigger:hover { border-color: #c0c4cc; }
.ate-cat-prefix {
  flex: none;
  height: 30px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  border-right: 1px solid #dcdfe6;
  color: #606266;
  font-size: 14px;
}
.ate-cat-value {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ate-cat-value.is-ph { color: #c0c4cc; }
.ate-cat-arrow { flex: none; padding: 0 12px; color: #c0c4cc; }

/* R79：分类下拉面板 */
.ate-cat-panel { width: 100%; }
.ate-cat-search :deep(.el-input__wrapper) {
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid #e5e6eb;
}
.ate-cat-search :deep(.el-input__inner) { height: 34px; font-size: 13px; }
.ate-cat-list { min-height: 190px; padding-top: 10px; }
.ate-cat-empty { text-align: center; color: #197afb; font-size: 13px; }
.ate-cat-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.ate-cat-item:hover { background: #f5f7fa; }
.ate-cat-item.active { color: #197afb; }
.ate-cat-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}
.ate-cat-link { color: #197afb; cursor: pointer; font-size: 13px; }

/* R79：新增分类输入框左侧「分类」格 */
.ate-nc-input :deep(.el-input-group__prepend) {
  padding: 0 16px;
  color: #606266;
  background: #f5f7fa;
  border-color: #dcdfe6;
}
.ate-nc-input :deep(.el-input__inner) { font-size: 14px; }

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
.ate-textarea :deep(.el-textarea__inner) {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 22px;
  color: #333;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
.ate-error { margin: 0; padding: 6px 12px 12px; font-size: 12px; color: #f56c6c; }
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

/* R79：分类下拉气泡 */
.ate-cat-pop { padding: 12px; }

/* R79：新增分类弹窗（嵌套在「编辑标题」弹窗内，需覆盖父级样式） */
.ate-nc-dialog { padding: 0; }
.ate-nc-dialog .el-dialog__header { margin-right: 0; padding: 16px 20px; border-bottom: none; }
.ate-nc-dialog .el-dialog__title { font-size: 15px; font-weight: 700; line-height: 18px; color: #333; }
.ate-nc-dialog .el-dialog__body { padding: 10px 30px 30px; }
.ate-nc-dialog .el-dialog__footer { padding: 0 30px 24px; }
.ate-nc-dialog .el-dialog__footer .el-button { width: auto; min-width: 120px; height: 32px; padding: 0 20px; font-size: 13px; }
.ate-nc-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.ate-nc-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.ate-nc-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
.ate-nc-dialog .el-dialog__footer .el-button--primary.is-disabled,
.ate-nc-dialog .el-dialog__footer .el-button--primary.is-disabled:hover {
  color: #fff;
  background: #a9c3f0;
  border-color: #a9c3f0;
}
</style>
