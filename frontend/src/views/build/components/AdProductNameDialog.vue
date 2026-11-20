<template>
  <el-dialog
    :model-value="modelValue"
    title="修改产品名称"
    width="620px"
    align-center
    class="apn-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="apn-body">
      <!-- 顶部蓝色提示条（线上同版式，可关闭） -->
      <div v-if="showTip" class="apn-tip">
        <el-icon class="apn-tip-icon"><InfoFilled /></el-icon>
        <span class="apn-tip-text">修改对象为广告层级-产品信息模块-产品名称，</span>
        <el-popover placement="bottom" :width="780" trigger="click" popper-class="apn-guide-pop">
          <template #reference>
            <a class="apn-tip-link">如图所示</a>
          </template>
          <img :src="guideImg" class="apn-guide-img" alt="产品信息模块-产品名称" />
        </el-popover>
        <el-icon class="apn-tip-close" @click="showTip = false"><Close /></el-icon>
      </div>

      <!-- 已选广告数 -->
      <div class="apn-desc">已选中<span class="apn-desc-num">{{ rows.length }}</span>个广告</div>

      <!-- 产品名称 -->
      <div class="apn-row">
        <span class="apn-label">产品名称</span>
        <div class="apn-content">
          <el-input
            v-model="name"
            class="apn-input"
            :class="{ 'is-error': !!error }"
            placeholder="1-20个字符"
            maxlength="20"
            @input="error = ''"
          >
            <template #suffix>
              <span class="apn-count">{{ name.length }}/20</span>
            </template>
          </el-input>
          <p v-if="error" class="apn-error">{{ error }}</p>
        </div>
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
import { Close, InfoFilled } from '@element-plus/icons-vue';
import { getBatchOpConfig } from '@/api/oceanengine';
import guideImg from '@/assets/guide-product-name.png';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改产品名称';

/** 可操作广告（去掉合计行） */
const rows = computed(() => (props.rows || []).filter((r) => !r.__summary));

/** 顶部提示条是否展示（可手动关闭） */
const showTip = ref(true);
/** 产品名称 */
const name = ref('');
/** 错误文案 */
const error = ref('');

function init() {
  showTip.value = true;
  name.value = '';
  error.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const v = String(name.value || '').trim();
  if (!v) {
    error.value = '请输入产品名称';
    return;
  }
  const form = { titles: v };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交修改产品名称任务（${rows.value.length} 条广告）`);
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.apn-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #606266;
}

/* 顶部蓝色提示条 */
.apn-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 3px;
  background: #ecf3ff;
  color: #546ef7;
  font-size: 13px;
}
.apn-tip-icon { color: #546ef7; font-size: 15px; }
.apn-tip-text { color: #333; }
.apn-tip-link { color: #197afb; cursor: pointer; }
.apn-tip-close { margin-left: auto; color: #c0c4cc; cursor: pointer; font-size: 13px; }
.apn-tip-close:hover { color: #909399; }
.apn-guide-img { display: block; width: 100%; border-radius: 4px; }

/* 已选中广告数 */
.apn-desc { margin: 18px 0 20px; font-size: 14px; color: #333; }
.apn-desc-num { color: #197afb; font-weight: 700; margin: 0 2px; }

/* 表单行 */
.apn-row { display: flex; align-items: flex-start; }
.apn-label { flex: none; width: 72px; font-size: 14px; line-height: 32px; color: #666; }
.apn-content { flex: 1; min-width: 0; }
.apn-input { width: 100%; }
.apn-input :deep(.el-input__inner) { height: 32px; font-size: 14px; }
.apn-count { color: #c0c4cc; font-size: 13px; }
.apn-error { margin: 4px 0 0; font-size: 12px; color: #f56c6c; }
</style>

<style>
.apn-dialog { padding: 0; }
.apn-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.apn-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.apn-dialog .el-dialog__body { padding: 16px 24px 24px; }
.apn-dialog .el-dialog__footer { padding: 0 24px 20px; }
.apn-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.apn-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.apn-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.apn-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
.apn-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
.apn-dialog .apn-input.is-error .el-input__wrapper { box-shadow: 0 0 0 1px #f56c6c inset; }
.apn-guide-pop { padding: 8px; }
</style>
