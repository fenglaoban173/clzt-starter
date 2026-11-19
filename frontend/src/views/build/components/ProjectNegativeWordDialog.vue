<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改否定词"
    width="992px"
    top="15vh"
    class="pnw-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="pnw-body">
      <!-- 顶部提示（与线上一致） -->
      <div class="pnw-tips">当前未操作过添加/替换否定词，请手动输入否定词。</div>

      <!-- 修改方式 -->
      <div class="pnw-item">
        <span class="pnw-label">修改方式</span>
        <div class="pnw-content">
          <el-radio-group v-model="mode" size="small" class="pnw-radio">
            <el-radio-button border value="add">添加否定词</el-radio-button>
            <el-radio-button border value="replace">替换否定词</el-radio-button>
          </el-radio-group>
          <p class="pnw-hint" :class="{ 'is-replace': mode === 'replace' }">{{ modeHint }}</p>
        </div>
      </div>

      <!-- 短信否定词 -->
      <div class="pnw-item">
        <span class="pnw-label">短信否定词</span>
        <div class="pnw-content pnw-content-inline">
          <el-radio-group v-model="smsOn" size="small" class="pnw-radio pnw-radio-80">
            <el-radio-button border :value="false">不启用</el-radio-button>
            <el-radio-button border :value="true">启用</el-radio-button>
          </el-radio-group>
          <el-popover placement="top" trigger="hover" popper-class="pnw-pop">
            <template #reference>
              <span class="pnw-help">?</span>
            </template>
            当且仅当网民的搜索词中完全包含短信否定词时，广告不予展现。
          </el-popover>
        </div>
      </div>

      <!-- 短信否定词输入区 -->
      <div v-if="smsOn" class="pnw-item">
        <span class="pnw-label"></span>
        <div class="pnw-content">
          <div class="pnw-area">
            <div class="pnw-area-header">
              <span class="pnw-area-title">请输入短信否定词（{{ smsCount }}/500）</span>
              <el-button link type="primary" size="small" class="pnw-clear" @click="smsText = ''">清空</el-button>
            </div>
            <div class="pnw-area-tips">单行输入长度限制为60个字符，中文算2个。添加多个请换行</div>
            <div class="pnw-area-editor">
              <div class="pnw-gutter">
                <span v-for="n in smsNo" :key="n">{{ n }}</span>
              </div>
              <div class="pnw-area-input">
                <el-input
                  v-model="smsText"
                  type="textarea"
                  class="pnw-textarea"
                  resize="none"
                  placeholder="请粘贴或输入短信否定词，回车可换行"
                />
              </div>
            </div>
            <div v-if="smsError" class="pnw-error">{{ smsError }}</div>
          </div>
        </div>
      </div>

      <!-- 精准否定词 -->
      <div class="pnw-item">
        <span class="pnw-label">精准否定词</span>
        <div class="pnw-content pnw-content-inline">
          <el-radio-group v-model="preciseOn" size="small" class="pnw-radio pnw-radio-80">
            <el-radio-button border :value="false">不启用</el-radio-button>
            <el-radio-button border :value="true">启用</el-radio-button>
          </el-radio-group>
          <el-popover placement="top" trigger="hover" popper-class="pnw-pop">
            <template #reference>
              <span class="pnw-help">?</span>
            </template>
            当且仅当网民的搜索词中完全包含精准否定词时，广告不予展现。
          </el-popover>
        </div>
      </div>

      <!-- 精准否定词输入区 -->
      <div v-if="preciseOn" class="pnw-item">
        <span class="pnw-label"></span>
        <div class="pnw-content">
          <div class="pnw-area">
            <div class="pnw-area-header">
              <span class="pnw-area-title">请输入精准否定词（{{ preciseCount }}/500）</span>
              <el-button link type="primary" size="small" class="pnw-clear" @click="preciseText = ''">清空</el-button>
            </div>
            <div class="pnw-area-tips">单行输入长度限制为60个字符，中文算2个。添加多个请换行</div>
            <div class="pnw-area-editor">
              <div class="pnw-gutter">
                <span v-for="n in preciseNo" :key="n">{{ n }}</span>
              </div>
              <div class="pnw-area-input">
                <el-input
                  v-model="preciseText"
                  type="textarea"
                  class="pnw-textarea"
                  resize="none"
                  placeholder="请粘贴或输入精准否定词，回车可换行"
                />
              </div>
            </div>
            <div v-if="preciseError" class="pnw-error">{{ preciseError }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" @click="confirm">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '批量修改否定词';

/** 单行长度上限（中文算 2 个字符） */
const LINE_LIMIT = 60;
/** 一次最多 500 行 */
const LINE_MAX = 500;

// 修改方式：add 添加否定词 / replace 替换否定词（默认添加）
const mode = ref('add');
// 短信否定词 / 精准否定词 是否启用（默认不启用，与线上一致）
const smsOn = ref(false);
const preciseOn = ref(false);
const smsText = ref('');
const preciseText = ref('');

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

const modeHint = computed(() =>
  mode.value === 'replace'
    ? '将会把所选项目批量替换以下设置的否定词,不开启时将会清空否定词。'
    : '将会把所选项目批量添加以下设置的否定词'
);

/** 行数（空值按 1 行计） */
function splitLines(v) {
  return String(v || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}
const smsLines = computed(() => splitLines(smsText.value));
const preciseLines = computed(() => splitLines(preciseText.value));
const smsCount = computed(() => Math.max(1, Math.min(LINE_MAX, smsLines.value.length)));
const preciseCount = computed(() => Math.max(1, Math.min(LINE_MAX, preciseLines.value.length)));
/** 左侧行号（至少 1 行，与线上一致） */
const smsNo = computed(() => Array.from({ length: smsCount.value }, (_, i) => i + 1));
const preciseNo = computed(() => Array.from({ length: preciseCount.value }, (_, i) => i + 1));

/** 字符长度：一个中文字符计为两个字符长度 */
function charLen(s) {
  let n = 0;
  for (const ch of String(s || '')) n += ch.charCodeAt(0) > 255 ? 2 : 1;
  return n;
}

/** 单行超长校验 */
function checkLines(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (charLen(lines[i]) > LINE_LIMIT) {
      return `第${i + 1}行长度超过${LINE_LIMIT}个字符（中文算2个）`;
    }
  }
  if (lines.length > LINE_MAX) {
    return `一次最多输入${LINE_MAX}行否定词`;
  }
  return '';
}
const smsError = computed(() => checkLines(smsLines.value));
const preciseError = computed(() => checkLines(preciseLines.value));

function init() {
  mode.value = 'add';
  smsOn.value = false;
  preciseOn.value = false;
  smsText.value = '';
  preciseText.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (smsError.value || preciseError.value) {
    ElMessage.warning(smsError.value || preciseError.value);
    return;
  }
  const form = {
    mode: mode.value,
    smsOn: smsOn.value,
    sms_words: smsLines.value,
    preciseOn: preciseOn.value,
    precise_words: preciseLines.value,
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(
    `原型：已提交批量修改否定词任务（${rows.value.length} 个项目，修改方式：${
      mode.value === 'replace' ? '替换否定词' : '添加否定词'
    }，短信否定词：${smsOn.value ? '启用' : '不启用'}，精准否定词：${
      preciseOn.value ? '启用' : '不启用'
    }）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.pnw-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}

/* 顶部提示（与线上一致：14px #666，行距 18px） */
.pnw-tips { font-size: 14px; line-height: 18px; color: #666; margin-bottom: 16px; }

/* 表单行：label 110px，行间距 24px（与线上一致） */
.pnw-item { display: flex; align-items: flex-start; margin-bottom: 24px; }
.pnw-item:last-child { margin-bottom: 0; }
.pnw-label { flex: none; width: 110px; font-size: 14px; line-height: 32px; color: #666; }
.pnw-content { flex: 1; min-width: 0; }
.pnw-content-inline { display: flex; align-items: center; }

/* 修改方式提示（12px；替换模式为橙色，与线上一致） */
.pnw-hint { margin: 0; font-size: 12px; line-height: 32px; color: #999; }
.pnw-hint.is-replace { color: #f8a352; }

/* 分段按钮（选中为蓝字 + 浅蓝底 + 蓝框，32px 高，与线上一致） */
.pnw-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.pnw-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
.pnw-radio :deep(.el-radio-button:not(:first-child) .el-radio-button__inner) { border-left-color: #606266; }
.pnw-radio :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.pnw-radio :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }

/* 问号图标（线上为自定义 icon 字体，此处用 14px 描边圆环还原观感） */
.pnw-help {
  flex: none;
  margin-left: 8px;
  width: 14px;
  height: 14px;
  border: 1px solid #ccc;
  border-radius: 50%;
  font-size: 10px;
  line-height: 12px;
  text-align: center;
  color: #ccc;
  cursor: pointer;
}

/* 否定词输入区（与线上一致：1px #dadfe3 边框 / 5px 圆角） */
.pnw-area { border: 1px solid #dadfe3; border-radius: 5px; overflow: hidden; }
.pnw-area-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #dadfe3;
}
.pnw-area-title { font-size: 14px; font-weight: 600; line-height: 22px; color: #333; }
.pnw-clear { font-size: 12px; padding: 0; }
.pnw-area-tips {
  padding-left: 16px;
  font-size: 12px;
  line-height: 32px;
  color: #999;
  background: #d8e8ff;
  border-bottom: 1px solid #e8eaec;
}
.pnw-area-editor { display: flex; height: 400px; }
.pnw-gutter {
  flex: none;
  width: 36px;
  padding: 6px 0;
  border-right: 1px solid #dadfe3;
  overflow: hidden;
}
.pnw-gutter span { display: block; font-size: 14px; line-height: 22px; color: #999; text-align: center; }
.pnw-area-input { flex: 1; min-width: 0; padding: 6px 12px; }
.pnw-textarea { height: 100%; }
.pnw-textarea :deep(.el-textarea__inner) {
  height: 100%;
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
  font-size: 14px;
  line-height: 22px;
  color: #333;
}
.pnw-textarea :deep(.el-textarea__inner::placeholder) { color: #c0c4cc; }
.pnw-error { padding: 6px 12px; font-size: 12px; line-height: 18px; color: #f53f3f; }
</style>

<style>
/* 弹窗外壳：与线上一致（992px 弹窗 / 标题 16px 700 #333 / body 24px 32px） */
.pnw-dialog { padding: 0; }
.pnw-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; border-bottom: 1px solid #e5e6eb; }
.pnw-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.pnw-dialog .el-dialog__body { padding: 24px 32px; }
.pnw-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e5e6eb; }
.pnw-dialog .el-dialog__footer .el-button { width: 120px; }

/* 问号气泡（白底 + 1px #ebeef5 边框 + 12px 内边距，与线上一致） */
.pnw-pop { padding: 12px !important; font-size: 14px !important; line-height: 20px !important; color: #606266 !important; }
</style>
