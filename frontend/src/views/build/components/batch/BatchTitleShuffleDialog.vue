<template>
  <!--
    标题乱序弹窗（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 标题包列头「乱序」）
    线上基准：el-dialog.cl-dialog--small 560×333（正文表单高 160px）
    线上结构：表单项「乱序对象」= 单选组【标题包 / 标题】+ 下方灰色说明文案
              分账户选择时追加复选框「跨账户乱序」
              选「标题」时追加「每个标题包内标题数」输入框（正整数，≤10）
    线上底部：仅「确 定」（primary，右对齐）
  -->
  <el-dialog
    :model-value="visible"
    title="标题乱序"
    width="560px"
    append-to-body
    class="shuffle-dialog"
    align-center
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form label-position="left" label-width="160px" size="small" class="shuffle-form">
      <el-form-item label="乱序对象">
        <el-radio-group v-model="shuffleTarget" size="small">
          <el-radio-button value="PACK">标题包</el-radio-button>
          <el-radio-button value="TITLE">标题</el-radio-button>
        </el-radio-group>
        <div class="shuffle-tips">{{ tips }}</div>
      </el-form-item>

      <!-- 线上：标题分配方式 = 分账户选择时才出现「跨账户乱序」 -->
      <el-form-item v-if="showCrossAccount" label="">
        <el-checkbox v-model="crossAccount">跨账户乱序</el-checkbox>
      </el-form-item>

      <!-- 线上：乱序对象 = 标题 时追加「每个标题包内标题数」 -->
      <el-form-item v-if="shuffleTarget === 'TITLE'" label="每个标题包内标题数" required>
        <el-input v-model="amount" class="shuffle-amount" placeholder="请输入标题包内标题数量" />
        <div v-if="amountError" class="shuffle-error">{{ amountError }}</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  form,
  shuffleVisible,
  shuffleTarget,
  shuffleHint,
  confirmShuffle,
} = batch;

const props = defineProps({
  /** v-model：弹窗显隐；不传时直接用 Create.vue provide 的 shuffleVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!shuffleVisible.value : props.modelValue),
  set: (v) => {
    if (shuffleVisible) shuffleVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 线上：说明文案（标题包分支沿用 Create.vue 的 shuffleHint，标题分支按线上原文） */
const tips = computed(() => (
  shuffleTarget.value === 'PACK'
    ? (shuffleHint?.value || '将已选标题包随机排序,不打乱其内部标题')
    : '将所有标题进行随机排序并生成新的临时标题包'
));

/** 线上：标题分配方式 = 分账户选择（本地 PER_ACCOUNT）时才展示「跨账户乱序」 */
const showCrossAccount = computed(() => form?.titles?.assign_rule === 'PER_ACCOUNT');

/** 跨账户乱序勾选（本地标题包未按账户拆分，仅保留线上入口） */
const crossAccount = ref(true);

/** 每个标题包内标题数（线上：正整数，且不能大于 10） */
const TITLE_LIMIT = 10;
const amount = ref('');
const amountError = ref('');

watch(visible, (v) => {
  if (!v) {
    amountError.value = '';
    amount.value = '';
  }
});

function validateAmount() {
  const v = String(amount.value === undefined || amount.value === null ? '' : amount.value).trim();
  if (!v) {
    amountError.value = '请输入标题包内标题数量';
    return false;
  }
  if (!/^[1-9]\d*$/.test(v)) {
    amountError.value = '请输入标题包内标题数量';
    return false;
  }
  if (Number(v) > TITLE_LIMIT) {
    amountError.value = `不能大于${TITLE_LIMIT}`;
    return false;
  }
  amountError.value = '';
  return true;
}

function onConfirm() {
  if (shuffleTarget.value === 'TITLE' && !validateAmount()) return;
  /* Create.vue 的 confirmShuffle 内部已完成乱序 + 提示 + 关闭 */
  confirmShuffle();
  visible.value = false;
}
</script>

<style scoped>
.shuffle-form { min-height: 160px; }
/* 线上：说明文案 12px #999 */
.shuffle-tips {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #999;
}
/* 线上：输入框 w160 */
.shuffle-amount { width: 160px; }
.shuffle-error {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #f56c6c;
}
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：cl-dialog--small 560px；header padding 14px 24px + 下边线 #e8eaec；footer 仅右对齐一个 primary 按钮 */
.shuffle-dialog { max-width: calc(100vw - 40px); }
.shuffle-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.shuffle-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.shuffle-dialog .el-dialog__body { padding: 20px 24px; color: #606266; }
.shuffle-dialog .el-dialog__footer { padding: 14px 24px; border-top: 1px solid #e8eaec; }
/* 线上页脚按钮 80×32（12px/500，圆角 3px） */
.shuffle-dialog .el-dialog__footer .el-button {
  width: 80px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
.shuffle-dialog .el-button--primary:not(.is-link) { background: #197afb; border-color: #197afb; }
.shuffle-dialog .el-button--primary:not(.is-link):hover { background: #4a9bff; border-color: #4a9bff; }
/* 小尺寸控件统一 32px（EP 的 small 为 24px，线上为 32px） */
.shuffle-dialog .el-button--small { height: 32px; }
.shuffle-dialog .el-radio-button--small .el-radio-button__inner { height: 32px; }
.shuffle-dialog .el-input--small .el-input__wrapper { min-height: 32px; }
/* 线上单选组：选中态 #d6eaff 底 + #197afb 字 */
.shuffle-dialog .el-radio-button__inner {
  padding: 9px 12px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
  border-radius: 0;
  box-shadow: none;
}
.shuffle-dialog .el-radio-button:first-child .el-radio-button__inner { border-radius: 3px 0 0 3px; }
.shuffle-dialog .el-radio-button:last-child .el-radio-button__inner { border-radius: 0 3px 3px 0; }
.shuffle-dialog .el-radio-button__original-radio:checked + .el-radio-button__inner {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
/* 线上 label 宽 160、左对齐、14px #666 */
.shuffle-dialog .el-form-item__label {
  width: 160px;
  padding-bottom: 0;
  font-size: 14px;
  line-height: 32px;
  color: #666;
  text-align: left;
}
</style>
