<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="730px"
    top="20vh"
    class="rnd-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <!-- 已选数量（线上：左上角一行，右侧原有两个按钮已按要求移除） -->
    <div class="rnd-bar">已选 {{ list.length }} 个{{ unit }}</div>

    <!-- 两列表格：原名 / 修改后名称 -->
    <div class="rnd-table">
      <div class="rnd-tr rnd-th">
        <div class="rnd-td">{{ colOld }}</div>
        <div class="rnd-td">{{ colNew }}</div>
      </div>
      <div class="rnd-scroll">
        <div v-for="r in list" :key="r.key" class="rnd-tr">
          <div class="rnd-td rnd-old" :title="r.oldName">{{ r.oldName }}</div>
          <div class="rnd-td rnd-td--input">
            <el-input v-model="r.newName" size="small" :placeholder="placeholder" class="rnd-input" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button class="rnd-btn" @click="close">取消</el-button>
      <el-button class="rnd-btn" type="primary" :disabled="!ready" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 待修改行：[{ key, oldName }] */
  rows: { type: Array, default: () => [] },
  /** ad = 广告名称 / project = 项目名称 */
  type: { type: String, default: 'ad' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const isProject = computed(() => props.type === 'project');
const unit = computed(() => (isProject.value ? '项目' : '广告'));
const dialogTitle = computed(() => (isProject.value ? '批量修改项目名称' : '批量修改广告名称'));
const colOld = computed(() => (isProject.value ? '项目名称' : '广告名称'));
const colNew = computed(() => (isProject.value ? '修改项目名称' : '修改广告名称'));
const placeholder = computed(() => (isProject.value ? '请输入项目名称' : '请输入广告名称'));

const list = ref([]);

/** 所有行都填了新名称才允许确定（与线上一致：未填时确定置灰） */
const ready = computed(() => list.value.length > 0 && list.value.every((r) => String(r.newName || '').trim()));

function init() {
  list.value = (props.rows || []).map((r, i) => ({
    key: r.key != null ? r.key : (r.id != null ? r.id : i),
    oldName: r.oldName != null ? r.oldName : (r.name || ''),
    newName: '',
  }));
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (!ready.value) return;
  emit(
    'confirm',
    {
      type: props.type,
      rows: list.value.map((r) => ({ key: r.key, oldName: r.oldName, newName: r.newName.trim() })),
    },
  );
  close();
}
</script>

<style scoped>
.rnd-bar {
  height: 20px;
  font-size: 12px;
  line-height: 20px;
  color: #1d2129;
  margin-bottom: 14px;
}

/* 两列表格：外框 + 表头浅灰底 + 44px 行高 */
.rnd-table {
  border: 1px solid #e5e6eb;
  border-radius: 2px;
  overflow: hidden;
}
.rnd-scroll {
  max-height: 300px;
  overflow-y: auto;
}
.rnd-tr {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.rnd-th {
  height: 26px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
}
.rnd-th .rnd-td {
  font-size: 12px;
  line-height: 26px;
  color: #4e5969;
  font-weight: 400;
}
.rnd-td {
  padding: 0 12px;
  font-size: 12px;
  color: #1d2129;
  border-right: 1px solid #e5e6eb;
  min-width: 0;
}
.rnd-tr > .rnd-td:last-child {
  border-right: none;
}
.rnd-tr:not(.rnd-th) {
  border-bottom: 1px solid #e5e6eb;
}
.rnd-table .rnd-scroll > .rnd-tr:last-child {
  border-bottom: none;
}
.rnd-tr:not(.rnd-th) {
  height: 44px;
  align-items: center;
}
.rnd-old {
  font-size: 12px;
  line-height: 18px;
  color: #8a8f99;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rnd-td--input {
  display: flex;
  align-items: center;
}
.rnd-input :deep(.el-input__wrapper) {
  height: 26px;
  padding: 1px 8px;
}
.rnd-input :deep(.el-input__inner) {
  font-size: 12px;
  height: 24px;
  line-height: 24px;
}
.rnd-btn {
  width: 66px;
  height: 28px;
}
</style>

<style>
.rnd-dialog {
  padding: 0;
}
.rnd-dialog .el-dialog__header {
  margin-right: 0;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e6eb;
}
.rnd-dialog .el-dialog__title {
  font-size: 14px;
  font-weight: 400;
  color: #1d2129;
  line-height: 20px;
}
.rnd-dialog .el-dialog__headerbtn {
  top: 8px;
  right: 8px;
}
.rnd-dialog .el-dialog__body {
  padding: 16px 20px 12px;
}
.rnd-dialog .el-dialog__footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e6eb;
}
</style>
