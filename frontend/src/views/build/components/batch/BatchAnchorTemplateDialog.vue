<template>
  <!-- 选择原生锚点模板（对齐线上 原生锚点类型 = 模板生成 →「选择原生锚点」按钮，图3）
       * 740×，标题「选择原生锚点模板」
       * 三行：选择模板 下拉 + 刷新 + 找不到资产？去新建
       *        APP唤起链接方式（不启用 / 关联Deeplink链接 / 直接输入）
       *        APP唤起链接 输入框
       * 下方空白内容区；「去新建」打开「新建原生锚点模板」弹窗（图2） -->
  <el-dialog
    :model-value="modelValue"
    title="选择原生锚点模板"
    width="740px"
    class="adpick-dialog"
    align-center
    append-to-body
    :z-index="2600"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="anpt">
      <div class="anpt-row">
        <span class="anpt-label">选择模板：</span>
        <el-select v-model="template" size="small" class="anpt-select" placeholder="请选择">
          <el-option v-for="t in templates" :key="t" :label="t" :value="t" />
        </el-select>
        <a class="anpt-link anpt-refresh" @click="onRefresh">刷新</a>
        <span class="anpt-hint">
          找不到资产？
          <a class="anpt-link" @click="createVisible = true">去新建</a>
        </span>
      </div>

      <div class="anpt-row anpt-row--mode">
        <span class="anpt-label">APP唤起链接<br />方式</span>
        <div class="anpt-seg">
          <button
            v-for="m in MODES"
            :key="m.value"
            type="button"
            class="anpt-seg__btn"
            :class="{ 'is-active': mode === m.value }"
            @click="mode = m.value"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div v-if="mode === 'INPUT'" class="anpt-row">
        <span class="anpt-label">APP唤起链接</span>
        <el-input
          v-model="appLink"
          size="small"
          class="anpt-input"
          placeholder="请输入APP唤起链接"
        />
      </div>

      <div class="anpt-blank"></div>
    </div>

    <template #footer>
      <el-button class="adpick-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="adpick-foot-btn adpick-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>

  <!-- 图2：新建原生锚点模板（放在 el-dialog 之外避免层级互相覆盖） -->
  <BatchAnchorCreateDialog v-model="createVisible" @confirm="onCreated" />
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import BatchAnchorCreateDialog from './BatchAnchorCreateDialog.vue';

defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

const MODES = [
  { value: 'OFF', label: '不启用' },
  { value: 'DEEPLINK', label: '关联Deeplink链接' },
  { value: 'INPUT', label: '直接输入' },
];

const templates = ref([]);
const template = ref('');
const mode = ref('INPUT');
const appLink = ref('');
const createVisible = ref(false);

function onRefresh() {
  ElMessage.success('已刷新原生锚点模板');
}
function onCreated(tpl) {
  if (!tpl || !tpl.name) return;
  templates.value = [...templates.value, tpl.name];
  template.value = tpl.name;
  ElMessage.success(`已新建锚点模板「${tpl.name}」`);
}
function onConfirm() {
  if (!template.value) {
    ElMessage.warning('请选择模板');
    return;
  }
  emit('confirm', { template: template.value, mode: mode.value, appLink: appLink.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.anpt {
  border: 1px solid #e8eaec;
  background: #fff;
  padding: 18px 16px 16px;
  height: 384px;
  box-sizing: border-box;
}
.anpt-row {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}
.anpt-row--mode {
  align-items: flex-start;
}
.anpt-label {
  width: 90px;
  flex: none;
  font-size: 13px;
  color: #4e5969;
  line-height: 28px;
  text-align: right;
  margin-right: 12px;
}
.anpt-select {
  width: 292px;
}
.anpt-refresh {
  margin-left: 18px;
}
.anpt-hint {
  margin-left: 26px;
  font-size: 13px;
  color: #4e5969;
}
.anpt-link {
  color: #197afb;
  cursor: pointer;
  font-size: 13px;
}
.anpt-seg {
  display: flex;
  margin-top: 0;
}
.anpt-seg__btn {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  color: #1d2129;
  background: #fff;
  border: 1px solid #d9dbe1;
  border-right: none;
  cursor: pointer;
}
.anpt-seg__btn:last-child {
  border-right: 1px solid #d9dbe1;
}
.anpt-seg__btn.is-active {
  color: #197afb;
  background: #e8f1ff;
  border-color: #197afb;
  position: relative;
  z-index: 1;
}
.anpt-input {
  width: 292px;
}
.anpt-blank {
  flex: 1;
}
</style>

