<template>
  <!--
    线上「随机选择 / 智能优选 / 一键测新」共用弹窗（1:1 复刻）
    线上来源：cl.mobgi.com 批量搭建 → 标题包抽屉 → 工具条三个副按钮
      随机选择 → screenType=random → /Media/Title/getRandomTitles
      智能优选 → screenType=smart  → /Media/Title/getSmartChoiceTitles（多一个「数据时间」）
      一键测新 → screenType=recent → /Media/Title/getRecentTitles
    实测：el-dialog 600px，margin-top 15vh，x=660 y=324
    结构：
      .el-dialog__header  span「随机选择」+ mg-icon-question2（popover 296px）
      .el-dialog__body  form（label 宽 150px）
        选择分类            el-select w260（占位「全部」）
        标题创建时间        el-range-editor w260（开始日期 至 结束日期）
        数据时间（仅智能优选）select 近30天/近15天/近7天/近3天
        选择标题数量        el-input w260
        计划内标题数上限    el-input w260 + mg-icon-question2（气泡「即每个广告搭配的文案数量」）
        排除今日已选中的标题 el-checkbox（true-label 1 / false-label 0）
      .el-dialog__footer  [取 消][确 定]（w120）
  -->
  <teleport to="body">
    <div v-if="visible" class="tsd-mask" @click="close"></div>
    <div v-if="visible" class="tsd-dialog" role="dialog" aria-modal="true" aria-label="dialog">
      <div class="tsd-dialog__header">
        <span class="tsd-dialog__title">
          {{ variantInfo.title }}
          <span class="tsd-qa" @mouseenter="tipVisible = true" @mouseleave="tipVisible = false">
            ?
            <span v-if="tipVisible" class="tsd-pop tsd-pop--tip">{{ variantInfo.tip }}</span>
          </span>
        </span>
      </div>

      <div class="tsd-dialog__body">
        <form class="tsd-form" @submit.prevent>
          <!-- 选择分类 -->
          <div class="tsd-row">
            <label class="tsd-row__label">选择分类</label>
            <div class="tsd-row__content">
              <select v-model="form.category" class="tsd-select tsd-select--w260">
                <option value="">全部</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <!-- 标题创建时间 -->
          <div class="tsd-row">
            <label class="tsd-row__label">标题创建时间</label>
            <div class="tsd-row__content">
              <div class="tsd-range">
                <span class="tsd-range__ico">📅</span>
                <input v-model="form.start_date" class="tsd-range__input" type="text" placeholder="开始日期" />
                <span class="tsd-range__sep">至</span>
                <input v-model="form.end_date" class="tsd-range__input" type="text" placeholder="结束日期" />
              </div>
            </div>
          </div>

          <!-- 数据时间（仅智能优选） -->
          <div v-if="variant === 'smart'" class="tsd-row">
            <label class="tsd-row__label">数据时间</label>
            <div class="tsd-row__content">
              <select v-model="form.data_time" class="tsd-select tsd-select--w260">
                <option v-for="o in DATA_TIME_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
          </div>

          <!-- 选择标题数量 -->
          <div class="tsd-row">
            <label class="tsd-row__label">选择标题数量</label>
            <div class="tsd-row__content">
              <input v-model="form.limit_num" class="tsd-input tsd-input--w260" type="text" autocomplete="off" />
              <div v-if="err.limit_num" class="tsd-err">{{ err.limit_num }}</div>
            </div>
          </div>

          <!-- 计划内标题数上限 -->
          <div class="tsd-row">
            <label class="tsd-row__label">{{ pkgLabel }}</label>
            <div class="tsd-row__content">
              <input v-model="form.pkgTitleNums" class="tsd-input tsd-input--w260" type="text" autocomplete="off" />
              <span class="tsd-qa tsd-qa--ml8" @mouseenter="pkgTipVisible = true" @mouseleave="pkgTipVisible = false">
                ?
                <span v-if="pkgTipVisible" class="tsd-pop">即每个广告搭配的文案数量</span>
              </span>
              <span v-if="fixedTitleLength" class="tsd-fixed-title">{{ fixedTitleLength }}个新标题+{{ fixedTitleCount }}个固定标题</span>
              <div v-if="err.pkgTitleNums" class="tsd-err">{{ err.pkgTitleNums }}</div>
            </div>
          </div>

          <!-- 排除今日已选中的标题 -->
          <div class="tsd-row">
            <label class="tsd-row__label"></label>
            <div class="tsd-row__content">
              <label class="tsd-check">
                <input v-model="form.exclude_today_is_used" class="tsd-check__input" type="checkbox" true-value="1" false-value="0" />
                <span class="tsd-check__box"></span>
                <span class="tsd-check__text">排除今日已选中的标题</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      <div class="tsd-dialog__footer">
        <button class="tsd-btn tsd-btn--plain tsd-btn--w120" type="button" @click="close">取 消</button>
        <button class="tsd-btn tsd-btn--primary tsd-btn--w120" type="button" @click="confirm">确 定</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** random 随机选择 / smart 智能优选 / recent 一键测新 */
  variant: { type: String, default: 'random' },
  /** 标题分类（线上来自 /Media/Title/listTitleCategory） */
  categories: { type: Array, default: () => [] },
  /** 每个标题包最多几个标题（线上 maxTitleCount 默认 10） */
  maxTitleCount: { type: Number, default: 10 },
  /** 固定标题数量（有固定标题时 label 变「每个标题包」） */
  fixedTitleCount: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

/** 线上 titleMap（源码 title-screen-dialog-ITBrOCXY.js） */
const VARIANTS = {
  random: {
    title: '随机选择',
    tip: '系统将在您设置的范围内随机选择对应数量的标题匹配广告',
    api: '/Media/Title/getRandomTitles',
  },
  smart: {
    title: '智能优选',
    tip: '智能优选会自动选择近期效果最好的标题，然后按照您设置的规则自动分组进行测试',
    api: '/Media/Title/getSmartChoiceTitles',
  },
  recent: {
    title: '一键测新',
    tip: '一键测新会自动选择近期文案库新创建的文案，然后按照您设置的规则自动分成标题包或直接匹配广告',
    api: '/Media/Title/getRecentTitles',
  },
};

/** 线上 dataTimeOptions（近30天/近15天/近7天/近3天） */
const DATA_TIME_OPTIONS = [
  { value: 30, label: '近30天' },
  { value: 15, label: '近15天' },
  { value: 7, label: '近7天' },
  { value: 3, label: '近3天' },
];

const visible = computed(() => props.modelValue);
const variantInfo = computed(() => VARIANTS[props.variant] || VARIANTS.random);
const fixedTitleLength = computed(() => props.fixedTitleCount);
const pkgLabel = computed(() => (fixedTitleLength.value ? '每个标题包' : '计划内标题数上限'));

const tipVisible = ref(false);
const pkgTipVisible = ref(false);

const form = reactive({
  category: '',
  start_date: '',
  end_date: '',
  data_time: 30,
  limit_num: '',
  pkgTitleNums: '',
  exclude_today_is_used: 0,
});
const err = reactive({ limit_num: '', pkgTitleNums: '' });

watch(() => props.modelValue, (v) => {
  if (!v) return;
  form.category = '';
  form.start_date = '';
  form.end_date = '';
  form.data_time = 30;
  form.limit_num = '';
  form.pkgTitleNums = '';
  form.exclude_today_is_used = 0;
  err.limit_num = '';
  err.pkgTitleNums = '';
  tipVisible.value = false;
  pkgTipVisible.value = false;
}, { immediate: true });

function close() {
  emit('close');
  emit('update:modelValue', false);
}

/** 线上校验：必填 >0 整数；标题包数量上限 1-(maxTitleCount - 固定标题数) */
function confirm() {
  err.limit_num = '';
  err.pkgTitleNums = '';
  if (!/^[1-9]\d*$/.test(String(form.limit_num))) {
    err.limit_num = form.limit_num ? '请输入大于0整数' : '输入不能为空';
    return;
  }
  const max = props.maxTitleCount - fixedTitleLength.value;
  if (!/^[1-9]\d*$/.test(String(form.pkgTitleNums))) {
    err.pkgTitleNums = form.pkgTitleNums ? '请输入大于0整数' : '输入不能为空';
    return;
  }
  if (Number(form.pkgTitleNums) > max || Number(form.pkgTitleNums) < 1) {
    err.pkgTitleNums = `计划内${fixedTitleLength.value ? '新标题数' : '标题数'}上限为1-${max}`;
    return;
  }
  emit('confirm', { ...form, variant: props.variant, api: variantInfo.value.api });
  emit('update:modelValue', false);
}
</script>

<style>
/* ===== 线上「随机选择 / 智能优选 / 一键测新」弹窗（el-dialog 600px，margin-top 15vh） ===== */
.tsd-mask { position: fixed; inset: 0; z-index: 2100; background: rgba(0, 0, 0, .5); }
.tsd-dialog {
  position: fixed; top: 15vh; left: 50%; z-index: 2101;
  width: 600px; margin-left: -300px;
  box-sizing: border-box; background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  font-size: 14px; color: #606266;
}
.tsd-dialog__header { position: relative; padding: 16px 20px 12px; }
.tsd-dialog__title { font-size: 16px; color: #303133; }
.tsd-dialog__body { padding: 4px 20px 12px; }
.tsd-dialog__footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 12px 20px; border-top: 1px solid #e8eaec;
}

/* 气泡（线上 mg-popover fs12，宽 296px） */
.tsd-qa {
  position: relative; display: inline-block; margin-left: 4px;
  width: 14px; height: 14px; line-height: 14px; text-align: center;
  font-size: 12px; color: #999; cursor: help; vertical-align: 1px;
}
.tsd-qa--ml8 { margin-left: 8px; }
.tsd-pop {
  position: absolute; top: 20px; left: 0; z-index: 10;
  width: 296px; padding: 10px 12px;
  font-size: 12px; line-height: 20px; color: #606266; text-align: left;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}
.tsd-pop--tip { width: 296px; }

/* 表单（label 150px） */
.tsd-row { display: flex; align-items: flex-start; margin-bottom: 18px; }
.tsd-row__label {
  flex: none; width: 150px; height: 32px; line-height: 32px;
  font-size: 14px; color: #606266; text-align: right; padding-right: 12px;
}
.tsd-row__content { flex: 1; min-width: 0; position: relative; }
.tsd-input, .tsd-select {
  box-sizing: border-box; height: 32px; padding: 0 10px;
  font-size: 13px; color: #606266; background: #fff;
  border: 1px solid #dcdee2; border-radius: 4px; outline: none;
}
.tsd-input:focus, .tsd-select:focus { border-color: #197afb; }
.tsd-input--w260, .tsd-select--w260 { width: 260px; }

/* 区间选择（线上 el-range-editor） */
.tsd-range {
  display: inline-flex; align-items: center; box-sizing: border-box;
  width: 260px; height: 32px; padding: 0 10px;
  border: 1px solid #dcdee2; border-radius: 4px; background: #fff;
}
.tsd-range__ico { font-size: 12px; color: #c0c4cc; margin-right: 4px; }
.tsd-range__input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-size: 13px; color: #606266;
}
.tsd-range__sep { margin: 0 8px; font-size: 13px; color: #606266; }

/* 复选框 */
.tsd-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.tsd-check__input { position: absolute; opacity: 0; width: 0; height: 0; }
.tsd-check__box {
  width: 14px; height: 14px; box-sizing: border-box;
  border: 1px solid #c0c4cc; border-radius: 2px; background: #fff;
}
.tsd-check__input:checked + .tsd-check__box {
  background: #197afb; border-color: #197afb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2' d='M3 7.5l3 3 5-6'/%3E%3C/svg%3E");
  background-size: 100% 100%;
}
.tsd-check__text { font-size: 14px; color: #606266; }
.tsd-fixed-title { margin-left: 8px; font-size: 13px; color: #606266; }

/* 校验提示 */
.tsd-err { margin-top: 2px; font-size: 12px; color: #f56c6c; }

/* 底部按钮 */
.tsd-btn {
  height: 32px; padding: 0 15px; font-size: 12px;
  border-radius: 3px; border: 1px solid #dcdfe6; cursor: pointer;
}
.tsd-btn--w120 { width: 120px; }
.tsd-btn--plain { color: #606266; background: #fff; border-color: #dcdfe6; }
.tsd-btn--plain:hover { color: #197afb; border-color: #197afb; }
.tsd-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.tsd-btn--primary:hover { background: #4a9bff; border-color: #4a9bff; }
</style>
