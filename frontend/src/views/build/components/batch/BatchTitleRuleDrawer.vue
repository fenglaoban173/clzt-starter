<template>
  <!--
    线上「动态选取规则」编辑抽屉（1:1 复刻）
    线上来源：cl.mobgi.com 批量搭建 → 标题包抽屉 → 动态选取标题页签 → 「添加动态选取规则」
    实测（2026-11-27）：
      外层 .el-drawer__wrapper.dynamic-rule-config  占满 1920×1080，z-index 2006
      内层 .el-drawer.rtl.custom-drawer             width 1020px，右对齐
      header.el-drawer__header  「动态选取规则」+ 右上关闭
      body.custom-drawer__body  3 个 .form-panel：
        ① 标题信息   label 120px
             标题分类-定向 [包含] + 多选「请选择定向标题分类」(w360)
             标题分类-排除 [包含] + 多选「请选择排除标题分类」(w360)
             标题过滤条件 [不限][当日已使用][建议次数][拒审次数] (w700)
               ↳ 过滤建议次数大于 [input w80] 次的素材
               ↳ 过滤拒审次数大于 [input w80] 次的素材
             标题创建时间 [指定时间][相对时间] + daterange(w360) / 相对时间下拉
        ② 标题数据   label 120px：数据指标(不限/消耗/点击量/点击率 + 比较符 + 数值) + 数据时间
        ③ 标题选取方式 label 140px：[随机选择][最新标题] + 气泡 + el-alert + 每个广告标题数量
      footer.custom-drawer__footer  [取消][确定]
  -->
  <teleport to="body">
    <div v-if="visible" class="trd-mask" @click="close"></div>
    <div v-if="visible" class="trd-drawer" role="dialog" aria-modal="true" aria-label="动态选取规则">
      <header class="trd-header">
        <span class="trd-header__title">动态选取规则</span>
        <button class="trd-header__close" type="button" aria-label="close 动态选取规则" @click="close">✕</button>
      </header>

      <section class="trd-body">
        <!-- ① 标题信息 -->
        <div class="trd-panel">
          <header class="trd-panel__header"><div class="trd-panel__title">标题信息</div></header>
          <form class="trd-panel__body" @submit.prevent>
            <!-- 标题分类-定向 -->
            <div class="trd-row">
              <label class="trd-row__label">标题分类-定向</label>
              <div class="trd-row__content">
                <div class="trd-rgroup">
                  <button
                    v-for="o in CATEGORY_MATCH_TYPES"
                    :key="o.value"
                    type="button"
                    class="trd-rbtn"
                    :class="{ 'is-active': rule.category_include.type === o.value }"
                    @click="rule.category_include.type = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>
            <div class="trd-row">
              <label class="trd-row__label"></label>
              <div class="trd-row__content">
                <select v-model="rule.category_include.category_ids" class="trd-select trd-select--w360" multiple size="1">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span class="trd-hint">请选择定向标题分类</span>
              </div>
            </div>

            <!-- 标题分类-排除 -->
            <div class="trd-row">
              <label class="trd-row__label">标题分类-排除</label>
              <div class="trd-row__content">
                <div class="trd-rgroup">
                  <button
                    v-for="o in CATEGORY_MATCH_TYPES"
                    :key="o.value"
                    type="button"
                    class="trd-rbtn"
                    :class="{ 'is-active': rule.category_exclude.type === o.value }"
                    @click="rule.category_exclude.type = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>
            <div class="trd-row">
              <label class="trd-row__label"></label>
              <div class="trd-row__content">
                <select v-model="rule.category_exclude.category_ids" class="trd-select trd-select--w360" multiple size="1">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span class="trd-hint">请选择排除标题分类</span>
              </div>
            </div>

            <!-- 标题过滤条件 -->
            <div class="trd-row">
              <label class="trd-row__label">标题过滤条件</label>
              <div class="trd-row__content">
                <div class="trd-cgroup">
                  <label
                    v-for="o in FILTER_CONDITION_OPTIONS"
                    :key="o.value"
                    class="trd-cbtn"
                    :class="{ 'is-checked': rule.filter_conditions.includes(o.value) }"
                  >
                    <input
                      type="checkbox"
                      :value="o.value"
                      :checked="rule.filter_conditions.includes(o.value)"
                      @change="toggleFilter(o)"
                    />
                    {{ o.label }}
                  </label>
                </div>
                <!-- ↳ 建议次数 / 拒审次数 子项 -->
                <div v-if="rule.filter_conditions.includes('suggestion_num')" class="trd-row trd-row--sub trd-row--sub-first">
                  <label class="trd-row__label"></label>
                  <div class="trd-row__content">
                    <span class="trd-inline">过滤建议次数大于</span>
                    <input v-model="rule.suggestion_num" class="trd-input trd-input--w80" type="number" placeholder="请输入" />
                    <span class="trd-inline">次的素材</span>
                  </div>
                </div>
                <div v-if="rule.filter_conditions.includes('reject_num')" class="trd-row trd-row--sub">
                  <label class="trd-row__label"></label>
                  <div class="trd-row__content">
                    <span class="trd-inline">过滤拒审次数大于</span>
                    <input v-model="rule.reject_num" class="trd-input trd-input--w80" type="number" placeholder="请输入" />
                    <span class="trd-inline">次的素材</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 标题创建时间 -->
            <div class="trd-row">
              <label class="trd-row__label">标题创建时间</label>
              <div class="trd-row__content">
                <div class="trd-rgroup">
                  <button
                    v-for="o in TIME_TYPE_OPTIONS"
                    :key="o.value"
                    type="button"
                    class="trd-rbtn"
                    :class="{ 'is-active': rule.time_type === o.value }"
                    @click="rule.time_type = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>
            <div v-if="rule.time_type === 0" class="trd-row">
              <label class="trd-row__label"></label>
              <div class="trd-row__content">
                <div class="trd-range trd-range--w360">
                  <input v-model="rule.start_time" class="trd-range__input" type="text" placeholder="开始日期" />
                  <span class="trd-range__sep">至</span>
                  <input v-model="rule.end_time" class="trd-range__input" type="text" placeholder="结束日期" />
                </div>
              </div>
            </div>
            <div v-else class="trd-row">
              <label class="trd-row__label"></label>
              <div class="trd-row__content">
                <select v-model="rule.time_days" class="trd-select trd-select--w120">
                  <option v-for="o in TITLE_RELATE_DATES" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <!-- ② 标题数据 -->
        <div class="trd-panel">
          <header class="trd-panel__header"><div class="trd-panel__title">标题数据</div></header>
          <form class="trd-panel__body" @submit.prevent>
            <div class="trd-row">
              <label class="trd-row__label">数据指标</label>
              <div class="trd-row__content">
                <select v-model="kpi" class="trd-select trd-select--w140">
                  <option value="">不限</option>
                  <option v-for="o in KPI_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <select v-model="kpiOp" class="trd-select trd-select--w100">
                  <option v-for="o in KPI_COMPARE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <input v-model="kpiValue" class="trd-input trd-input--w100" type="number" placeholder="数值" />
              </div>
            </div>
            <div class="trd-row">
              <label class="trd-row__label">数据时间</label>
              <div class="trd-row__content">
                <select v-model="rule.title_data.data_last_day" class="trd-select trd-select--w140">
                  <option value="">不限</option>
                  <option v-for="o in DATA_TIME_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <!-- ③ 标题选取方式 -->
        <div class="trd-panel">
          <header class="trd-panel__header"><div class="trd-panel__title">标题选取方式</div></header>
          <form class="trd-panel__body" @submit.prevent>
            <div class="trd-row">
              <label class="trd-row__label">选取模式</label>
              <div class="trd-row__content">
                <div class="trd-rgroup">
                  <button
                    v-for="o in FETCH_METHOD_OPTIONS"
                    :key="o.value"
                    type="button"
                    class="trd-rbtn"
                    :class="{ 'is-active': rule.fetch_method === o.value }"
                    @click="rule.fetch_method = o.value"
                  >{{ o.label }}</button>
                  <span class="trd-qa" @mouseenter="modeTip = true" @mouseleave="modeTip = false">
                    ?
                    <span v-if="modeTip" class="trd-pop">
                      <p>随机选择：所设条件下随机选取标题</p>
                      <p>最新标题：所设条件下优先选择最新创建的标题</p>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 分规则设置时才有的提示条 + 每广告标题数量 -->
            <template v-if="isDynamicRuleCount">
              <div class="trd-alert">
                <span class="trd-alert__ico">ⓘ</span>
                <span class="trd-alert__text">当前每个广告标题总上限为{{ maxTitleCount }}个，请注意多个规则标题分配。</span>
              </div>
              <div class="trd-row">
                <label class="trd-row__label trd-row__label--w140 trd-row__label--req">每个广告标题数量</label>
                <div class="trd-row__content">
                  <input v-model="rule.count" class="trd-input trd-input--w120" type="number" min="1" :max="maxTitleCount" />
                  <div v-if="err.count" class="trd-err">{{ err.count }}</div>
                </div>
              </div>
            </template>
          </form>
        </div>
      </section>

      <footer class="trd-footer">
        <button class="trd-btn trd-btn--plain" type="button" @click="close">取消</button>
        <button class="trd-btn trd-btn--primary" type="button" @click="confirm">确定</button>
      </footer>
    </div>
  </teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 规则初值（新增/编辑回显） */
  init: { type: Object, default: () => null },
  /** 标题分类（线上来自 /Media/Title/listTitleCategory） */
  categories: { type: Array, default: () => [] },
  /** 「分规则设置」时为 true → 显示提示条与「每个广告标题数量」 */
  isDynamicRuleCount: { type: Boolean, default: false },
  maxTitleCount: { type: Number, default: 10 },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

/** 线上选项常量（源码 dynamic-title-DGnKLaF3.js） */
const CATEGORY_MATCH_TYPES = [{ label: '包含', value: 1 }];
const FILTER_CONDITION_OPTIONS = [
  { label: '不限', value: '' },
  { label: '当日已使用', value: 'exclude_today_is_used' },
  { label: '建议次数', value: 'suggestion_num' },
  { label: '拒审次数', value: 'reject_num' },
];
const TITLE_RELATE_DATES = [
  { label: '当日', value: 1 },
  { label: '仅昨日', value: -1 },
  { label: '2天内', value: 2 },
  { label: '3天内', value: 3 },
  { label: '7天内', value: 7 },
  { label: '14天内', value: 14 },
  { label: '30天内', value: 30 },
  { label: '60天内', value: 60 },
  { label: '90天内', value: 90 },
];
const KPI_OPTIONS = [
  { label: '消耗', value: 'stat_cost' },
  { label: '点击量', value: 'click_cnt' },
  { label: '点击率', value: 'click_rate' },
];
const KPI_COMPARE_OPTIONS = [
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
];
const DATA_TIME_OPTIONS = [
  { label: '3天内', value: 3 },
  { label: '90天内', value: 90 },
];
const FETCH_METHOD_OPTIONS = [
  { label: '随机选择', value: 'random' },
  { label: '最新标题', value: 'new' },
];
const TIME_TYPE_OPTIONS = [
  { label: '指定时间', value: 0 },
  { label: '相对时间', value: 1 },
];

const visible = computed(() => props.modelValue);

/** 线上规则默认值（源码 dynamic-title-DGnKLaF3.js 的 e()） */
function defaultRule() {
  return {
    category_include: { type: 1, category_ids: [] },
    category_exclude: { type: 1, category_ids: [] },
    filter_conditions: [''],
    reject_num: '',
    suggestion_num: '',
    time_type: 0,
    time_days: 7,
    start_time: '',
    end_time: '',
    title_data: {
      select_kpis: [''],
      quota_filter: { filter_type: 'and', wheres: [['', '>=', '']] },
      data_last_day: '',
    },
    fetch_method: 'random',
    count: undefined,
  };
}

const rule = reactive(defaultRule());
const kpi = ref('');
const kpiOp = ref('>=');
const kpiValue = ref('');
const modeTip = ref(false);
const err = reactive({ count: '' });

watch(() => props.modelValue, (v) => {
  if (!v) return;
  Object.assign(rule, defaultRule(), props.init || {});
  rule.category_include = { type: 1, category_ids: [], ...(props.init && props.init.category_include) };
  rule.category_exclude = { type: 1, category_ids: [], ...(props.init && props.init.category_exclude) };
  rule.title_data = { ...defaultRule().title_data, ...((props.init && props.init.title_data) || {}) };
  const where = (rule.title_data.quota_filter && rule.title_data.quota_filter.wheres || [])[0] || [];
  kpi.value = where[0] || '';
  kpiOp.value = where[1] || '>=';
  kpiValue.value = where[2] || '';
  err.count = '';
  modeTip.value = false;
}, { immediate: true, deep: true });

function close() {
  emit('close');
  emit('update:modelValue', false);
}

function toggleFilter(o) {
  const list = rule.filter_conditions;
  const i = list.indexOf(o.value);
  if (i >= 0) list.splice(i, 1);
  else list.push(o.value);
  if (!list.length) list.push('');
}

/** 提交前回写「数据指标」的 where 条件 */
function syncKpi() {
  rule.title_data.quota_filter.wheres = [[kpi.value, kpiOp.value, kpiValue.value]];
}

function confirm() {
  err.count = '';
  syncKpi();
  if (props.isDynamicRuleCount && !rule.count) {
    err.count = '请填写每个广告标题数量';
    return;
  }
  emit('confirm', JSON.parse(JSON.stringify(rule)));
  emit('update:modelValue', false);
}
</script>

<style>
/* ===== 线上「动态选取规则」右抽屉（.el-drawer.rtl.custom-drawer 1020px） ===== */
.trd-mask { position: fixed; inset: 0; z-index: 2100; background: rgba(0, 0, 0, .5); }
.trd-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 2101;
  width: 1020px; display: flex; flex-direction: column;
  background: #fff; box-shadow: -8px 0 8px #0003;
  font-size: 14px; color: #606266;
}
.trd-header {
  position: relative; flex: none; height: 54px; padding: 0 20px;
  display: flex; align-items: center; border-bottom: 1px solid #e8eaec;
}
.trd-header__title { font-size: 16px; color: #303133; }
.trd-header__close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; padding: 0; line-height: 1; font-size: 16px;
  color: #909399; background: none; border: none; cursor: pointer;
}
.trd-header__close:hover { color: #197afb; }
.trd-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; background: #f5f7fa; }
.trd-footer {
  flex: none; display: flex; justify-content: flex-end; gap: 12px;
  padding: 12px 20px; background: #fff; border-top: 1px solid #e8eaec;
}

/* 面板（线上 .form-panel） */
.trd-panel { background: #fff; border: 1px solid #e8eaec; border-radius: 3px; margin-bottom: 16px; }
.trd-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 16px; background: #fafafa; border-bottom: 1px solid #e8eaec;
}
.trd-panel__title { font-size: 14px; font-weight: 700; color: #333; }
.trd-panel__body { padding: 16px 16px 4px; }

/* 表单行（label 120px；标题选取方式面板 140px） */
.trd-row { display: flex; align-items: flex-start; margin-bottom: 16px; }
.trd-row__label {
  flex: none; width: 120px; min-height: 32px; line-height: 32px; padding-right: 12px;
  font-size: 14px; color: #606266; text-align: right;
}
.trd-row__label--w140 { width: 140px; }
.trd-row__label--req::before { content: '*'; margin-right: 4px; color: #f53f3f; }
.trd-row__content { flex: 1; min-width: 0; }
.trd-row--sub .trd-row__content { display: flex; align-items: center; gap: 8px; }
.trd-inline { font-size: 14px; color: #606266; }
.trd-hint { margin-left: 8px; font-size: 12px; color: #c0c4cc; }

/* 单选组（线上 mc-check-group--button，radio-button 样式） */
.trd-rgroup { display: flex; align-items: center; }
.trd-rbtn {
  min-width: 80px; height: 32px; padding: 9px 12px;
  font-size: 12px; line-height: 12px; color: #606266;
  background: #fff; border: 1px solid #dcdfe6; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.trd-rbtn:first-child { border-radius: 3px 0 0 3px; }
.trd-rbtn + .trd-rbtn { border-left-width: 0; }
.trd-rbtn:last-child { border-radius: 0 3px 3px 0; }
.trd-rbtn.is-active { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }

/* 多选组（线上 mc-check-group checkbox-button） */
.trd-cgroup { display: flex; flex-wrap: wrap; width: 700px; max-width: 100%; }
.trd-cbtn {
  min-width: 80px; height: 32px; padding: 9px 12px;
  font-size: 12px; line-height: 12px; color: #606266; text-align: center;
  background: #fff; border: 1px solid #dcdfe6; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.trd-cbtn + .trd-cbtn { border-left-width: 0; }
.trd-cbtn.is-checked { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }
.trd-cbtn input { position: absolute; opacity: 0; width: 0; height: 0; }

/* 控件 */
.trd-input, .trd-select {
  box-sizing: border-box; height: 32px; padding: 0 10px;
  font-size: 13px; color: #606266; background: #fff;
  border: 1px solid #dcdee2; border-radius: 4px; outline: none;
}
.trd-input:focus, .trd-select:focus { border-color: #197afb; }
.trd-input--w80 { width: 80px; }
.trd-input--w100 { width: 100px; }
.trd-input--w120 { width: 120px; }
.trd-select--w100 { width: 100px; }
.trd-select--w120 { width: 120px; }
.trd-select--w140 { width: 140px; }
.trd-select--w360 { width: 360px; }
.trd-select[multiple] { height: 32px; }

/* 区间（线上 el-range-editor w360） */
.trd-range {
  display: inline-flex; align-items: center; box-sizing: border-box;
  height: 32px; padding: 0 10px; background: #fff;
  border: 1px solid #dcdee2; border-radius: 4px;
}
.trd-range--w360 { width: 360px; }
.trd-range__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 13px; color: #606266; }
.trd-range__sep { margin: 0 10px; font-size: 13px; color: #606266; }

/* 气泡 */
.trd-qa {
  position: relative; display: inline-block; margin-left: 12px;
  width: 14px; height: 14px; line-height: 14px; text-align: center;
  font-size: 12px; color: #999; cursor: help;
}
.trd-pop {
  position: absolute; top: 20px; left: 0; z-index: 10; width: 296px; padding: 10px 12px;
  font-size: 12px; line-height: 20px; color: #606266; text-align: left;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}
.trd-pop p { margin: 0; }

/* 提示条（线上 el-alert.cl-simple-alert.is-primary） */
.trd-alert {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; padding: 8px 12px;
  font-size: 12px; color: #409eff; background: #ecf5ff; border: 1px solid #d9ecff; border-radius: 4px;
}
.trd-alert__ico { font-style: normal; }

/* 校验 */
.trd-err { margin-top: 2px; font-size: 12px; color: #f56c6c; }

/* 底部按钮 */
.trd-btn {
  height: 32px; padding: 0 15px; font-size: 12px;
  border-radius: 3px; border: 1px solid #dcdfe6; cursor: pointer;
}
.trd-btn--plain { color: #606266; background: #fff; border-color: #dcdfe6; }
.trd-btn--plain:hover { color: #197afb; border-color: #197afb; }
.trd-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.trd-btn--primary:hover { background: #4a9bff; border-color: #4a9bff; }
</style>
