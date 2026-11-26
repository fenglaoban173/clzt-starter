<template>
  <!--
    规则配置弹窗（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 配置行「规则配置 / 更改」）
    线上基准：el-dialog.assign-rule-config--dialog.cl-modal 1140×653，垂直居中（align-center）
    线上分区：创建方式 / 项目生成规则(仅新建项目) / 广告生成规则 / 每个项目广告数上限
    线上卡片三态：选中=蓝框(#197afb)+蓝字 / 常规=白底+#333 标题+#999 说明 / 置灰=浅灰底(#eee)
  -->
  <el-dialog
    :model-value="modelValue"
    title="规则配置"
    width="1140px"
    class="rule-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form label-position="left" label-width="160px" class="rule-form">
      <!-- 创建方式 -->
      <el-form-item label="创建方式">
        <el-radio-group v-model="form.create_mode" size="small" class="rule-mode">
          <el-radio-button value="NEW">新建项目</el-radio-button>
          <el-radio-button value="EXIST">已有项目</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 项目生成规则（仅「新建项目」时线上才露出） -->
      <template v-if="form.create_mode === 'NEW'">
        <el-form-item label="项目生成规则">
          <div class="custom-radio-group">
            <div
              v-for="r in PROJECT_RULES"
              :key="r.value"
              class="custom-radio-button"
              :class="{
                'custom-radio-button--active': form.project_rule === r.value,
                'custom-radio-button--disabled': r.disabled,
              }"
              @click="pickRule('project_rule', r)"
            >
              <p class="title"><span>{{ r.label }}</span></p>
              <p class="desc">{{ r.desc }}</p>
            </div>
          </div>
        </el-form-item>

        <!-- 项目生成规则 = 指定数量 → 每个账户指定项目数 -->
        <el-form-item v-if="form.project_rule === 'BY_COUNT'" label="每个账户指定项目数">
          <el-input-number
            v-model="form.projects_per_account"
            class="rule-num"
            :controls="false"
            :min="1"
            :max="500"
          />
        </el-form-item>
      </template>

      <!-- 广告生成规则 -->
      <el-form-item label="广告生成规则">
        <div class="custom-radio-group">
          <div
            v-for="r in AD_RULES"
            :key="r.value"
            class="custom-radio-button"
            :class="{
              'custom-radio-button--active': form.ad_rule === r.value,
              'custom-radio-button--disabled': isAdRuleDisabled(r),
            }"
            @click="pickRule('ad_rule', r)"
          >
            <p class="title"><span>{{ r.label }}</span></p>
            <p class="desc">{{ adRuleText(r) }}</p>
          </div>
        </div>
      </el-form-item>

      <!-- 项目生成规则 = 按总广告数/每项目广告数 → 每个项目广告数上限（线上 label 内带 ⓘ tooltip） -->
      <el-form-item
        v-if="form.create_mode === 'NEW' && form.project_rule === 'BY_TOTAL'"
        label="每个项目广告数上限"
      >
        <template #label>
          <span class="rule-label">每个项目广告数上限</span>
          <el-tooltip
            content="已生成的广告数，超过项目内广告数上限时，自动填充到新的项目内；广告数未达上限时则不生成新项目"
            placement="top"
          >
            <span class="label-tips">ⓘ</span>
          </el-tooltip>
        </template>
        <el-input-number
          v-model="form.ads_limit_per_project"
          class="rule-num"
          :controls="false"
          :min="1"
          :max="500"
        />
      </el-form-item>

      <!-- 广告生成规则 = 指定数量 → 每个项目指定广告数 -->
      <el-form-item v-if="form.ad_rule === 'BY_COUNT'" label="每个项目指定广告数">
        <template #label>
          <span class="rule-label">每个项目指定广告数</span>
          <el-tooltip
            content="指定每个项目内包含的广告数量，广告数量不足时重复使用广告"
            placement="top"
          >
            <span class="label-tips">ⓘ</span>
          </el-tooltip>
        </template>
        <el-input-number
          v-model="form.ads_per_project"
          class="rule-num"
          :controls="false"
          :min="1"
          :max="500"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="close">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';

const props = defineProps({
  /** v-model：弹窗显隐；不传时直接用 Create.vue provide 的 ruleVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  form,
  ruleVisible,
  PROJECT_RULES,
  AD_RULES,
  isAdRuleDisabled,
  adRuleDesc,
  pickRule,
} = batch;

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!ruleVisible.value : props.modelValue),
  set: (v) => {
    if (ruleVisible) ruleVisible.value = v;
    emit('update:modelValue', v);
  },
});

function close() {
  visible.value = false;
}

/**
 * 广告规则说明文案。
 * 线上原文为「先指定广告数量，自动循环使用素材和标题，多退少补」，
 * Create.vue 里的 adRuleDesc 写成了「多选少补」，此处按线上原文纠正。
 */
function adRuleText(rule) {
  return String(adRuleDesc(rule) || rule.desc || '').replace('多选少补', '多退少补');
}
</script>

<style scoped>
/* 线上：label 宽 160 顶对齐、表单项间距 24px、label 文案 14px #666 */
.rule-form :deep(.el-form-item) { margin-bottom: 24px; }
.rule-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.rule-form :deep(.el-form-item__label) {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  font-size: 14px;
  font-weight: 400;
  line-height: 32px;
  color: #666;
  text-align: left;
}
.rule-label { flex: none; }
.label-tips {
  flex: none;
  font-size: 14px;
  font-style: normal;
  line-height: 1;
  color: #86909c;
  cursor: help;
}

/* 创建方式：线上 mc-check-group--button，选中态 #d6eaff 底 + #197afb 字 */
.rule-mode :deep(.el-radio-button__inner) {
  width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
  border-radius: 0;
  box-shadow: none;
}
.rule-mode :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.rule-mode :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }
.rule-mode :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}

/* 卡片组：线上 4 列 × 220px，间距 16px，卡片高 84px */
.custom-radio-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}
.custom-radio-button {
  box-sizing: border-box;
  min-height: 84px;
  padding: 8px 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color .15s, background .15s;
}
.custom-radio-button:hover { border-color: #94bfff; }
.custom-radio-button--active { border-color: #197afb; }
.custom-radio-button--disabled { background: #eee; cursor: not-allowed; }
.custom-radio-button--disabled:hover { border-color: #ddd; }
/* 选中态：标题 + 说明同时变蓝（线上 .custom-radio-button--active .title/.desc） */
.custom-radio-button.custom-radio-button--active .title,
.custom-radio-button.custom-radio-button--active .desc { color: #197afb; }
.custom-radio-button .title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: #333;
}
.custom-radio-button .desc {
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #999;
}

/* 数字输入：线上 w160（160×32）纯文本框 */
.rule-num { width: 160px; }
.rule-num :deep(.el-input__wrapper) { padding: 0 12px; }
.rule-num :deep(.el-input__inner) { text-align: left; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：header padding 14px 24px + 下边线 #e8eaec；body padding 20px 24px；footer padding 14px 24px + 上边线 */
.el-dialog.rule-dialog { max-width: calc(100vw - 40px); padding: 0; }
.el-dialog.rule-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.rule-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.rule-dialog .el-dialog__body { padding: 20px 24px; color: #606266; }
.el-dialog.rule-dialog .el-dialog__footer { padding: 14px 24px; border-top: 1px solid #e8eaec; }
/* 线上页脚按钮 80×32（12px/500，圆角 3px） */
.el-dialog.rule-dialog .el-dialog__footer .el-button {
  width: 80px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
.el-dialog.rule-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.el-dialog.rule-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.el-dialog.rule-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 小尺寸控件统一 32px（EP 的 small 为 24px，线上为 32px） */
.el-dialog.rule-dialog .el-button--small { height: 32px; }
.el-dialog.rule-dialog .el-radio-button--small .el-radio-button__inner { height: 32px; }
.el-dialog.rule-dialog .el-input--small .el-input__wrapper { min-height: 32px; }
.el-dialog.rule-dialog .el-input-number--small { width: 160px; }
.el-dialog.rule-dialog .el-input-number--small .el-input__inner { height: 30px; font-size: 12px; text-align: left; }
.el-dialog.rule-dialog .el-input-number--small .el-input__wrapper { min-height: 32px; }
</style>
