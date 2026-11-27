<template>
  <!--
    规则配置弹窗（1:1 复刻线上 cl.mobgi.com「批量新建（巨量）」→ 配置行「规则配置 / 更改」）
    结构/文案/依赖全部来自 spec/rule.spec.js；线上基准 1140×653 垂直居中。
  -->
  <el-dialog
    :model-value="modelValue"
    :title="spec.title"
    :width="spec.width + 'px'"
    class="rule-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="onOpen"
  >
    <el-form
      label-position="left"
      :label-width="formSpec.labelWidth + 'px'"
      class="rule-form"
      :style="{ minHeight: formSpec.minHeight + 'px' }"
    >
      <template v-for="field in formSpec.fields" :key="field.key">
        <!-- 依赖求值：不满足 visibleWhen 的字段整块不渲染 -->
        <el-form-item
          v-if="isVisible(field, values)"
          :label-width="formSpec.labelWidth + 'px'"
          class="rule-form__item"
        >
          <template #label>
            <span class="rule-label">{{ field.label }}</span>
            <!-- 线上 label 右侧是 ⓘ 图标（不是文字） -->
            <el-tooltip v-if="field.tip" :content="field.tip" placement="top">
              <el-icon class="label-tips"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>

          <!-- 创建方式：按钮型单选 -->
          <el-radio-group
            v-if="field.type === 'radio'"
            :model-value="form[field.key]"
            size="small"
            class="rule-mode"
            @update:model-value="(v) => pick(field, v)"
          >
            <el-radio-button
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>

          <!-- 卡片型规则：项目生成规则 / 广告生成规则 -->
          <div v-else-if="field.type === 'cards'" class="custom-radio-group">
            <div
              v-for="opt in field.options"
              :key="opt.value"
              class="custom-radio-button"
              :class="{
                'custom-radio-button--active': form[field.key] === opt.value,
                'custom-radio-button--disabled': isDisabled(opt, values),
              }"
              @click="pick(field, opt.value, opt)"
            >
              <p class="title"><span>{{ opt.label }}</span></p>
              <p class="desc">{{ descOf(opt) }}</p>
            </div>
          </div>

          <!-- 数字输入：线上是普通 el-input.w160（无步进器） -->
          <el-input
            v-else-if="field.type === 'input'"
            :model-value="form[field.key]"
            class="rule-num"
            size="small"
            @update:model-value="(v) => (form[field.key] = v === '' ? '' : Number(v))"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button
        v-for="btn in spec.footer.buttons"
        :key="btn.key"
        :type="btn.type"
        :plain="!!btn.plain"
        @click="btn.key === 'cancel' ? cancel() : ok()"
      >
        {{ btn.text }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import spec from './spec/rule.spec.js';
import { isVisible, isDisabled } from './spec/resolve.js';

const props = defineProps({
  /** v-model：弹窗显隐；不传时直接用 Create.vue provide 的 ruleVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const { form, ruleVisible, ensureAdRuleAvailable } = batch;

/** spec 的表单分区 */
const formSpec = spec.sections.find((s) => s.type === 'form');

/** 依赖求值用的当前值集合 */
const values = computed(() => ({
  create_mode: form.create_mode,
  project_rule: form.project_rule,
  ad_rule: form.ad_rule,
}));

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
 * 线上行为：规则配置弹窗每次打开都回显「已保存」的规则（配置行那行文字），
 * 点「取消」会丢弃本次改动，下次打开仍是上一次「确定」的值。
 * 本地表单是共享状态，故组件内保存一份「已确定」的配置，打开时回显、取消时还原。
 * 注意：创建方式（新建/已有项目）由页面上的「切换」控制，不纳入这份快照。
 */
const RULE_KEYS = ['project_rule', 'ad_rule', 'ads_limit_per_project', 'ads_per_project', 'projects_per_account'];
const saved = {};
RULE_KEYS.forEach((k) => { saved[k] = form[k]; });

function onOpen() {
  RULE_KEYS.forEach((k) => { form[k] = saved[k]; });
  if (ensureAdRuleAvailable) ensureAdRuleAvailable();
}

/** 取消：还原为上一次「确定」的配置 */
function cancel() {
  RULE_KEYS.forEach((k) => { form[k] = saved[k]; });
  close();
}

/** 确定：保存当前配置并关闭 */
function ok() {
  RULE_KEYS.forEach((k) => { saved[k] = form[k]; });
  close();
}

/**
 * 选项说明文案：线上「指定数量」随「创建方式 / 项目生成规则」切换两种表述。
 * spec 里用 descWhenAny + descWhenAnyText 表达。
 */
function descOf(opt) {
  if (opt.descWhenAny) {
    const hit = opt.descWhenAny.some((c) => {
      const v = values.value[c.field];
      if ('eq' in c) return v === c.eq;
      if ('neq' in c) return v !== c.neq;
      if ('in' in c) return Array.isArray(c.in) && c.in.indexOf(v) >= 0;
      if ('notIn' in c) return Array.isArray(c.notIn) && c.notIn.indexOf(v) < 0;
      return true;
    });
    if (hit) return opt.descWhenAnyText;
  }
  return opt.desc || '';
}

/**
 * 点击选项：置灰的忽略；其余直接写回表单。
 * 「项目生成规则」变化后若当前广告规则变为不可用，自动回退到第一个可用规则（线上同款联动）。
 */
function pick(field, value, opt) {
  if (opt && isDisabled(opt, values.value)) return;
  form[field.key] = value;
  if (ensureAdRuleAvailable) ensureAdRuleAvailable();
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
/* 线上是 mg-icon-question2 图标（14×14，#999），不是文字 */
.label-tips {
  flex: none;
  font-size: 14px;
  line-height: 1;
  color: #999;
  cursor: help;
}

/* 创建方式：线上 mc-check-group--button，选中态 #d6eaff 底 + #197afb 字 */
.rule-mode :deep(.el-radio-button__inner) {
  width: 80px;
  height: 32px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 12px;
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

/* 卡片组：线上 flex + gap 16px，卡片 220×84 */
.custom-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 932px;
}
.custom-radio-button {
  box-sizing: border-box;
  flex: 0 0 220px;
  width: 220px;
  height: 84px;
  padding: 8px 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
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
/* 置灰态：标题 #333、说明 #999（线上实测） */
.custom-radio-button--disabled .title { color: #333; }
.custom-radio-button--disabled .desc { color: #999; }

/* 数字输入：线上 w160（160×32）纯文本框 */
.rule-num { width: 160px; }
.rule-num :deep(.el-input__wrapper) { padding: 0 8px; }
.rule-num :deep(.el-input__inner) { text-align: left; font-size: 13px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：header padding 14px 24px + 下边线 #e8eaec；body padding 20px 24px；footer padding 14px 24px + 上边线 */
.el-dialog.rule-dialog { max-width: calc(100vw - 40px); padding: 0; height: 653px; display: flex; flex-direction: column; }
.el-dialog.rule-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.rule-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.rule-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: auto; padding: 20px 24px; color: #606266; }
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
.el-dialog.rule-dialog .el-input--small .el-input__inner { height: 32px; font-size: 13px; line-height: 32px; }
</style>
