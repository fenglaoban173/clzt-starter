<template>
  <el-dialog
    :model-value="modelValue"
    title="修改应用商店下载"
    width="560px"
    class="pas-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="pas-body">
      <div class="pas-count">已选中{{ rows.length }}条可操作项目</div>

      <!-- 开启时的前置条件提示 -->
      <div class="pas-warn">
        <span class="pas-warn-icon">!</span>
        <div class="pas-warn-body">
          <div class="pas-warn-title">选择开启时请求必须确保:</div>
          <div class="pas-warn-item">1) 投放的应用在应用商店内已上架。</div>
          <div class="pas-warn-item">2) 归因方式使用点击归因，否则无法正确归因</div>
        </div>
      </div>

      <!-- 应用商店下载 -->
      <div class="pas-row">
        <span class="pas-label">应用商店下载</span>
        <div class="pas-switch">
          <button type="button" :class="{ active: mode === 'off' }" @click="mode = 'off'">不开启</button>
          <button type="button" :class="{ active: mode === 'on' }" @click="mode = 'on'">开启</button>
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

const OP = '修改应用商店下载';

// off 不开启 / on 开启（默认不开启，与线上一致）
const mode = ref('off');

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

function init() {
  mode.value = 'off';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = { download_mode: mode.value === 'on' ? 'APP_STORE_DELIVERY' : 'DEFAULT' };
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
    `原型：已提交批量修改应用商店下载任务（${rows.value.length} 个项目，${mode.value === 'on' ? '开启' : '不开启'}）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.pas-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.pas-count { font-size: 14px; color: #86909c; }

/* 前置条件提示 */
.pas-warn { display: flex; gap: 8px; margin-top: 18px; }
.pas-warn-icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  background: #ff7d00;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
.pas-warn-body { min-width: 0; }
.pas-warn-title { font-size: 14px; color: #1d2129; }
.pas-warn-item { margin-top: 10px; font-size: 14px; color: #1d2129; }

/* 应用商店下载 */
.pas-row { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
.pas-label { flex: none; width: 84px; font-size: 14px; color: #1d2129; }
.pas-switch {
  display: inline-flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.pas-switch button {
  min-width: 72px;
  padding: 7px 20px;
  border: none;
  border-right: 1px solid #e5e6eb;
  background: #fff;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
}
.pas-switch button:last-child { border-right: none; }
.pas-switch button.active {
  background: #e8f3ff;
  color: #165dff;
  font-weight: 600;
}
</style>

<style>
/* 弹窗外壳：与线上一致（标题加粗、无额外头部留白） */
.pas-dialog .el-dialog__header { margin-right: 0; padding: 18px 20px 14px; border-bottom: 1px solid #e5e6eb; }
.pas-dialog .el-dialog__title { font-size: 18px; font-weight: 600; color: #1d2129; }
.pas-dialog .el-dialog__body { padding: 0 40px 24px; }
.pas-dialog .el-dialog__footer { padding: 12px 20px 20px; }
</style>
