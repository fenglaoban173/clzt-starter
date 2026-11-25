<template>
  <!-- 「自定义指标」弹窗 —— 1:1 复刻线上
   * 线上实测：弹窗 1096×734；body padding 24px 32px；footer padding 16px 32px
   * 左栏：搜索框(250×32) + 分类列表(160 宽，选中底色 #d6eaff / 字色 #197afb)
   * 中栏：指标分组(标题 + 3 列 × 215px 网格)，指标名 hover 出说明气泡
   * 右栏：已选指标(标题「已选指标」+ 提示「拖动可自定义指标顺序」+ 可删除的标签)
   * 底部：复选框「保存为常用自定义指标」+ 按钮「取 消」「应 用」
   -->
  <el-dialog
    v-model="visible"
    title="自定义指标"
    width="1096px"
    top="15vh"
    :close-on-click-modal="false"
    append-to-body
    class="custom-metric-dialog"
    @closed="onClosed"
  >
    <div class="cm-body">
      <!-- 左栏 -->
      <div class="cm-left">
        <el-input
          v-model="keyword"
          class="cm-search"
          size="small"
          placeholder="输入指标名称搜索"
          :suffix-icon="Search"
          clearable
        />
        <div class="cm-cats">
          <div
            v-for="c in categories"
            :key="c"
            class="cm-cat"
            :class="{ active: c === activeCategory }"
            @click="goCategory(c)"
          >{{ c }}</div>
        </div>
      </div>

      <!-- 中栏：线上是把全部分组都列出来（可滚动），左栏分类用于定位 -->
      <div ref="midRef" class="cm-mid">
        <div v-for="b in visibleBlocks" :key="b.title" :ref="setBlockRef" class="cm-block">
          <div class="cm-block-title">{{ b.title }}</div>
          <div class="cm-grid">
            <div v-for="m in b.metrics" :key="m.name" class="cm-cell">
              <el-checkbox v-model="checked" :label="m.name" class="cm-checkbox">
                <el-popover
                  placement="right"
                  trigger="hover"
                  :width="320"
                  popper-class="cm-tip"
                >
                  <template #reference>
                    <span class="cm-metric-name">{{ m.name }}</span>
                  </template>
                  <div class="cm-tip-text">{{ m.desc }}</div>
                </el-popover>
              </el-checkbox>
            </div>
          </div>
        </div>
        <el-empty v-if="!visibleBlocks.length" description="没有匹配的指标" :image-size="60" />
      </div>

      <!-- 右栏：已选指标 -->
      <div class="cm-right">
        <div class="cm-right-title">已选指标</div>
        <div class="cm-right-hint">拖动可自定义指标顺序</div>
        <div class="cm-drag">
          <div v-for="(s, i) in selected" :key="s" class="cm-chip">
            <el-icon class="cm-chip-icon"><Rank /></el-icon>
            <span class="cm-chip-text">{{ s }}</span>
            <el-icon class="cm-chip-close" @click="removeSelected(s)"><Close /></el-icon>
          </div>
          <div v-if="!selected.length" class="cm-empty">暂无已选指标</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="cm-footer">
        <el-checkbox v-model="saveAsCommon">保存为常用自定义指标</el-checkbox>
        <div class="cm-footer-btns">
          <el-button @click="visible = false">取 消</el-button>
          <el-button type="primary" @click="apply">应 用</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Search, Rank, Close } from '@element-plus/icons-vue';
import { REPORT_METRICS, REPORT_METRIC_DEFAULT_SELECTED } from '@/mock/reportMetrics';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 指标集 key：account / project / ad / component / material
  metricKey: { type: String, default: 'account' },
  // 打开时的默认已选（不传则用线上默认值）
  defaultSelected: { type: Array, default: null },
});
const emit = defineEmits(['update:modelValue', 'apply']);

const visible = ref(false);
const keyword = ref('');
const activeCategory = ref('');
const checked = ref([]);
const saveAsCommon = ref(false);

const source = computed(() => REPORT_METRICS[props.metricKey] || { categories: [], blocks: [] });
const categories = computed(() => source.value.categories || []);
const blocks = computed(() => source.value.blocks || []);

/** 分类 -> 对应的指标分组（线上：点左栏分类切换中栏内容） */
const visibleBlocks = computed(() => {
  const kw = keyword.value.trim();
  let list = blocks.value;
  if (kw) {
    list = list
      .map((b) => ({
        title: b.title,
        metrics: b.metrics.filter((m) => m.name.includes(kw) || (m.desc || '').includes(kw)),
      }))
      .filter((b) => b.metrics.length);
  }
  return list;
});

/** 已选指标 = 中栏勾选的（线上基础列如「消耗」在打开时就是勾选态） */
const selected = computed(() => [...checked.value]);

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v;
    if (v) {
      keyword.value = '';
      const base = props.defaultSelected || REPORT_METRIC_DEFAULT_SELECTED[props.metricKey] || [];
      checked.value = [...base];
      activeCategory.value = (source.value.categories || [])[0] || '';
      blockRefs.length = 0;
    }
  }
);

const midRef = ref(null);
const blockRefs = [];

function setBlockRef(el) {
  if (el) blockRefs.push(el);
}

/** 左栏分类点击 -> 中栏滚动到对应分组 */
function goCategory(c) {
  activeCategory.value = c;
  const i = visibleBlocks.value.findIndex((b) => b.title === c);
  const el = blockRefs[i];
  if (el && midRef.value) {
    midRef.value.scrollTop = el.offsetTop - midRef.value.offsetTop;
  }
}

function removeSelected(name) {
  checked.value = checked.value.filter((c) => c !== name);
}

function apply() {
  emit('apply', { selected: [...selected.value], saveAsCommon: saveAsCommon.value });
  visible.value = false;
}

function onClosed() {
  emit('update:modelValue', false);
}
</script>

<style>
/* 弹窗样式用非 scoped：el-dialog 会 teleport 到 body */
.custom-metric-dialog .el-dialog {
  width: 1096px;
  max-width: calc(100vw - 40px);
  border-radius: 4px;
  padding: 0;
}
.custom-metric-dialog .el-dialog__header {
  padding: 20px 32px 14px;
  margin-right: 0;
  border-bottom: none;
}
.custom-metric-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}
.custom-metric-dialog .el-dialog__body { padding: 0 32px; }
.custom-metric-dialog .el-dialog__footer { padding: 16px 32px; border-top: 1px solid #e8eaec; }
.custom-metric-dialog .el-dialog__close { top: 18px; right: 20px; }

.cm-body { display: flex; gap: 24px; height: 575px; padding: 0 0 4px; }
.cm-left { flex: 0 0 250px; min-width: 0; }
.cm-search { width: 250px; margin-bottom: 16px; }
.cm-search .el-input__inner { font-size: 14px; padding: 0 30px 0 8px; height: 32px; }
.cm-cats {
  width: 160px;
  height: 514px;
  overflow-y: auto;
  border-right: 1px solid #e8eaec;
  padding-right: 8px;
}
.cm-cat {
  height: 40px;
  line-height: 40px;
  padding-left: 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 2px;
}
.cm-cat:hover { color: #197afb; }
.cm-cat.active { color: #197afb; background: #d6eaff; }

.cm-mid { flex: 1 1 auto; min-width: 0; overflow-y: auto; padding-right: 4px; }
.cm-block { margin-bottom: 18px; }
.cm-block-title {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  padding: 6px 0 10px;
}
.cm-grid { display: flex; flex-wrap: wrap; }
.cm-cell { width: 215px; padding-right: 12px; }
.cm-checkbox { height: 35px; margin-right: 0; }
.cm-checkbox .el-checkbox__label { font-size: 14px; color: #606266; padding-left: 8px; }
.cm-metric-name { border-bottom: 1px dashed #c0c4cc; cursor: help; }
.cm-metric-name:hover { color: #197afb; border-bottom-color: #197afb; }
.cm-tip-text { font-size: 13px; line-height: 1.8; color: #606266; max-height: 320px; overflow-y: auto; }

.cm-right { flex: 0 0 175px; min-width: 0; }
.cm-right-title { font-size: 14px; font-weight: 500; color: #333333; }
.cm-right-hint { font-size: 12px; color: #909399; margin: 4px 0 10px; }
.cm-drag {
  border: 1px solid #e8eaec;
  border-radius: 3px;
  min-height: 120px;
  padding: 8px;
  background: #fafafa;
}
.cm-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 13px;
  color: #333333;
  margin-bottom: 6px;
  cursor: move;
}
.cm-chip-icon { color: #c0c4cc; }
.cm-chip-text { flex: 1 1 auto; }
.cm-chip-close { color: #c0c4cc; cursor: pointer; }
.cm-chip-close:hover { color: #197afb; }
.cm-empty { font-size: 13px; color: #c0c4cc; text-align: center; padding: 24px 0; }

.cm-footer { display: flex; align-items: center; justify-content: space-between; }
.cm-footer .el-checkbox__label { font-size: 13px; color: #606266; }
.cm-footer-btns { display: flex; gap: 12px; }
</style>
