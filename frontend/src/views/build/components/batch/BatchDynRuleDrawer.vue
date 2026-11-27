<template>
  <BatchDrawer
    v-model="visible"
    title="动态选取规则"
    :width="660"
    :z-index="2201"
    @ok="onOk"
    @close="visible = false"
  >
    <template #content>
      <div class="dr-root">
        <!-- 素材文件属性 -->
        <section class="dr-card">
          <h4 class="dr-card__title">素材文件属性</h4>
          <div class="dr-card__body">
            <div class="dr-row">
              <label class="dr-label">智投项目</label>
              <el-select v-model="f.project" placeholder="不限" class="dr-ctl">
                <el-option value="ALL" label="不限" />
                <el-option value="ZHIHU" label="知乎小说" />
                <el-option value="MANJU" label="短剧-漫剧" />
                <el-option value="FORM" label="表单留资" />
              </el-select>
            </div>

            <div class="dr-row">
              <label class="dr-label">素材目录</label>
              <div class="dr-dir">
                <el-select v-model="f.catalog" placeholder="请选择素材目录" class="dr-ctl">
                  <el-option value="ALL" label="全部" />
                  <el-option value="D1" label="素材目录1" />
                  <el-option value="D2" label="素材目录2" />
                </el-select>
                <button class="dr-addbtn" type="button" @click="addCatalog">+</button>
              </div>
            </div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">素材上传时间</label>
              <div class="dr-stack">
                <div class="dr-group">
                  <button
                    class="dr-btn"
                    :class="{ 'is-light': f.timeMode === 'FIXED' }"
                    type="button"
                    @click="f.timeMode = 'FIXED'"
                  >指定时间</button>
                  <button
                    class="dr-btn"
                    :class="{ 'is-light': f.timeMode === 'RELATIVE' }"
                    type="button"
                    @click="f.timeMode = 'RELATIVE'"
                  >相对时间</button>
                </div>
                <el-date-picker
                  v-if="f.timeMode === 'FIXED'"
                  v-model="f.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  class="dr-ctl dr-ctl--wide"
                />
                <el-select v-else v-model="f.relativeDay" class="dr-ctl">
                  <el-option value="7" label="近 7 天" />
                  <el-option value="15" label="近 15 天" />
                  <el-option value="30" label="近 30 天" />
                </el-select>
              </div>
            </div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">创意人员</label>
              <div class="dr-pair">
                <div class="dr-field">
                  <span class="dr-field__tag">编导</span>
                  <el-select v-model="f.director" placeholder="不限" class="dr-field__select">
                    <el-option value="ALL" label="不限" />
                    <el-option value="U1" label="张三" />
                    <el-option value="U2" label="李四" />
                  </el-select>
                </div>
                <div class="dr-field">
                  <span class="dr-field__tag">剪拍</span>
                  <el-select v-model="f.editor" placeholder="不限" class="dr-field__select">
                    <el-option value="ALL" label="不限" />
                    <el-option value="U3" label="王五" />
                    <el-option value="U4" label="赵六" />
                  </el-select>
                </div>
              </div>
            </div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">素材名称关键词-定向</label>
              <div class="dr-stack">
                <el-input v-model="f.kwInclude" placeholder="请输入关键词模糊匹配" class="dr-ctl dr-ctl--wide" />
                <button class="dr-link" type="button" @click="f.kwInclude += '{巨量商品名称}'">+巨量商品名称</button>
              </div>
            </div>

            <div class="dr-row">
              <label class="dr-label">素材名称关键词-排除</label>
              <el-input v-model="f.kwExclude" placeholder="请输入关键词排除" class="dr-ctl dr-ctl--wide" />
            </div>
          </div>
        </section>

        <!-- 素材标签 / 属性 / 使用情况 / 过滤条件 -->
        <section class="dr-card">
          <h4 class="dr-card__title">素材标签</h4>
          <div class="dr-card__body">
            <div class="dr-row dr-row--top">
              <label class="dr-label">素材标签-定向</label>
              <div class="dr-stack">
                <div class="dr-group">
                  <button class="dr-btn" :class="{ 'is-light': f.tagInclude }" type="button" @click="f.tagInclude = !f.tagInclude">包含</button>
                </div>
                <el-select v-model="f.tagIncludeValue" placeholder="不限" class="dr-ctl dr-ctl--wide">
                  <el-option value="ALL" label="不限" />
                  <el-option value="T1" label="爆量素材" />
                  <el-option value="T2" label="优质素材" />
                </el-select>
              </div>
            </div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">素材标签-排除</label>
              <div class="dr-stack">
                <div class="dr-group">
                  <button class="dr-btn" :class="{ 'is-light': f.tagExclude }" type="button" @click="f.tagExclude = !f.tagExclude">包含</button>
                </div>
                <el-select v-model="f.tagExcludeValue" placeholder="不限" class="dr-ctl dr-ctl--wide">
                  <el-option value="ALL" label="不限" />
                  <el-option value="T1" label="爆量素材" />
                  <el-option value="T2" label="优质素材" />
                </el-select>
              </div>
            </div>

            <div class="dr-row">
              <label class="dr-label">素材属性</label>
              <div class="dr-group">
                <button
                  v-for="o in ATTR_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="{ 'is-active': f.attr === o.value }"
                  type="button"
                  @click="f.attr = o.value"
                >{{ o.label }}</button>
              </div>
            </div>

            <div class="dr-row">
              <label class="dr-label">素材使用情况</label>
              <div class="dr-group">
                <button
                  v-for="o in USE_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="f.useStatus === o.value ? (o.value === 'ALL' ? 'is-light' : 'is-active') : ''"
                  type="button"
                  @click="f.useStatus = o.value"
                >{{ o.label }}</button>
              </div>
            </div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">素材过滤条件</label>
              <div class="dr-filters">
                <label v-for="o in FILTER_OPTIONS" :key="o.value" class="dr-check" :class="{ 'is-on': f.filters.includes(o.value) }">
                  <input type="checkbox" :checked="f.filters.includes(o.value)" @change="toggleFilter(o.value)" />
                  <span>{{ o.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- 素材数据 -->
        <section class="dr-card">
          <h4 class="dr-card__title">素材数据</h4>
          <div class="dr-card__body">
            <div class="dr-row">
              <label class="dr-label">数据指标</label>
              <div class="dr-metric">
                <el-select v-model="f.metric" placeholder="不限" class="dr-metric__sel">
                  <el-option value="ALL" label="不限" />
                  <el-option value="CTR" label="点击率" />
                  <el-option value="CVR" label="转化率" />
                  <el-option value="COST" label="消耗" />
                </el-select>
                <el-select v-model="f.compare" class="dr-metric__cmp">
                  <el-option value="GTE" label="大于等于" />
                  <el-option value="LTE" label="小于等于" />
                  <el-option value="EQ" label="等于" />
                </el-select>
                <el-input v-model="f.value" placeholder="数值" class="dr-metric__num" />
                <button class="dr-addbtn" type="button" @click="addMetric">+</button>
              </div>
            </div>
            <div class="dr-row dr-row--top">
              <label class="dr-label">数据时间</label>
              <div class="dr-stack">
                <el-select v-model="f.dataTime" placeholder="不限" class="dr-ctl">
                  <el-option value="ALL" label="不限" />
                  <el-option value="TODAY" label="当日" />
                  <el-option value="3D" label="近 3 日" />
                  <el-option value="7D" label="近 7 日" />
                </el-select>
                <div class="dr-warn">数据时间未选择时，默认为当日数据。</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 素材类型 -->
        <section class="dr-card">
          <h4 class="dr-card__title">素材类型</h4>
          <div class="dr-card__body">
            <div class="dr-row">
              <label class="dr-label">选取模式</label>
              <div class="dr-group">
                <button
                  v-for="o in PICK_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="{ 'is-light': f.pickMode === o.value }"
                  type="button"
                  @click="f.pickMode = o.value"
                >{{ o.label }}</button>
              </div>
              <el-tooltip content="随机选择：每次搭建随机从素材池中取；最新素材：优先使用最新上传的素材；优先老素材：优先使用较早上传的素材" placement="top" :show-after="200">
                <span class="dr-q">?</span>
              </el-tooltip>
            </div>

            <div class="dr-row">
              <label class="dr-label">素材类型</label>
              <div class="dr-group">
                <button
                  v-for="o in TYPE_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="{ 'is-light': f.materialType === o.value }"
                  type="button"
                  @click="f.materialType = o.value"
                >{{ o.label }}</button>
              </div>
              <el-tooltip content="按素材类型筛选规则可用的素材" placement="top" :show-after="200">
                <span class="dr-q">?</span>
              </el-tooltip>
            </div>

            <div class="dr-row">
              <label class="dr-label">视频版式</label>
              <div class="dr-group">
                <button
                  v-for="o in VIDEO_LAYOUT_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="{ 'is-active': f.videoLayout === o.value }"
                  type="button"
                  @click="f.videoLayout = o.value"
                >{{ o.label }}</button>
              </div>
            </div>

            <div class="dr-row">
              <label class="dr-label">图片版式</label>
              <div class="dr-group">
                <button
                  v-for="o in IMAGE_LAYOUT_OPTIONS"
                  :key="o.value"
                  class="dr-btn"
                  :class="{ 'is-active': f.imageLayout === o.value }"
                  type="button"
                  @click="f.imageLayout = o.value"
                >{{ o.label }}</button>
              </div>
            </div>

            <div class="dr-info">当前视频总上限为10、图片总上限为10，请注意多个规则素材分配。</div>

            <div class="dr-row dr-row--top">
              <label class="dr-label">指定规则数量</label>
              <div class="dr-nums">
                <div class="dr-numfield">
                  <span class="dr-numfield__tag">视频</span>
                  <input v-model="f.videoCount" class="dr-numfield__input" type="text" />
                </div>
                <div class="dr-numfield">
                  <span class="dr-numfield__tag">图片</span>
                  <input v-model="f.imageCount" class="dr-numfield__input" type="text" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import BatchDrawer from './BatchDrawer.vue';

const emit = defineEmits(['submit']);

const visible = ref(false);

const ATTR_OPTIONS = [
  { value: 'ALL', label: '不限' },
  { value: 'QUALITY', label: '优质' },
  { value: 'FIRST', label: '首发' },
];
const USE_OPTIONS = [
  { value: 'ALL', label: '不限' },
  { value: 'UNUSED', label: '未使用' },
  { value: 'NO_COST', label: '无消耗' },
  { value: 'HAS_COST', label: '有消耗' },
  { value: 'BOOM', label: '爆量' },
];
const FILTER_OPTIONS = [
  { value: 'USED_TODAY', label: '今日已使用素材' },
  { value: 'LOW_EFFECT', label: '低效素材' },
  { value: 'LOW_QUALITY', label: '低质素材' },
  { value: 'SQUEEZE', label: '同质化挤压严重' },
  { value: 'QUEUE', label: '同质化排队' },
  { value: 'MOVE_DOWN', label: '搬运打压' },
  { value: 'PRE_AUDIT_REJECT', label: '预审拒绝素材' },
  { value: 'SIMILAR', label: '极端相似素材' },
  { value: 'WATERMARK', label: '暗水印素材' },
  { value: 'SUGGEST_COUNT', label: '建议次数' },
  { value: 'REJECT_COUNT', label: '拒审次数' },
];
const PICK_OPTIONS = [
  { value: 'RANDOM', label: '随机选择' },
  { value: 'LATEST', label: '最新素材' },
  { value: 'OLDEST', label: '优先老素材' },
];
const TYPE_OPTIONS = [
  { value: 'ALL', label: '不限' },
  { value: 'VIDEO', label: '视频' },
  { value: 'IMAGE', label: '图片' },
];
const VIDEO_LAYOUT_OPTIONS = [
  { value: 'ALL', label: '不限' },
  { value: 'HORIZONTAL', label: '横版视频' },
  { value: 'VERTICAL', label: '竖版视频' },
];
const IMAGE_LAYOUT_OPTIONS = [
  { value: 'ALL', label: '不限' },
  { value: 'HORIZONTAL', label: '横版图片' },
  { value: 'VERTICAL', label: '竖版图片' },
  { value: 'SMALL', label: '小图' },
];

function blank() {
  return {
    project: 'ALL',
    catalog: '',
    timeMode: 'FIXED',
    dateRange: ['2026-10-28', '2026-11-27'],
    relativeDay: '7',
    director: 'ALL',
    editor: 'ALL',
    kwInclude: '',
    kwExclude: '',
    tagInclude: true,
    tagIncludeValue: 'ALL',
    tagExclude: true,
    tagExcludeValue: 'ALL',
    attr: 'ALL',
    useStatus: 'ALL',
    filters: ['LOW_EFFECT'],
    metric: 'ALL',
    compare: 'GTE',
    value: '',
    dataTime: 'ALL',
    pickMode: 'RANDOM',
    materialType: 'ALL',
    videoLayout: 'ALL',
    imageLayout: 'ALL',
    videoCount: '1',
    imageCount: '1',
  };
}
const f = reactive(blank());

/** 打开抽屉：编辑时用已有规则回填，新增用默认值 */
function open(rule) {
  Object.assign(f, blank());
  if (rule) {
    Object.keys(f).forEach((k) => {
      if (rule[k] !== undefined) f[k] = Array.isArray(rule[k]) ? JSON.parse(JSON.stringify(rule[k])) : rule[k];
    });
  }
  visible.value = true;
}

function toggleFilter(val) {
  const i = f.filters.indexOf(val);
  if (i >= 0) f.filters.splice(i, 1);
  else f.filters.push(val);
}
function addCatalog() {
  ElMessage.info('素材目录请在「素材 → 素材目录」中新建');
}
function addMetric() {
  ElMessage.success('已添加 1 条数据指标');
}

function onOk() {
  const data = {
    project: f.project,
    catalog: f.catalog,
    timeMode: f.timeMode,
    dateRange: f.dateRange,
    relativeDay: f.relativeDay,
    director: f.director,
    editor: f.editor,
    kwInclude: f.kwInclude,
    kwExclude: f.kwExclude,
    tagInclude: f.tagInclude,
    tagIncludeValue: f.tagIncludeValue,
    tagExclude: f.tagExclude,
    tagExcludeValue: f.tagExcludeValue,
    attr: f.attr,
    useStatus: f.useStatus,
    filters: f.filters.slice(),
    metric: f.metric,
    compare: f.compare,
    value: f.value,
    dataTime: f.dataTime,
    pickMode: f.pickMode,
    materialType: f.materialType,
    videoLayout: f.videoLayout,
    imageLayout: f.imageLayout,
    videoCount: Number(f.videoCount) || 0,
    imageCount: Number(f.imageCount) || 0,
  };
  emit('submit', data);
  visible.value = false;
}

defineExpose({ open });
</script>

<style scoped>
.dr-root { padding: 0; }

.dr-card {
  background: #fff;
  border: 1px solid #e8eaec;
  margin-bottom: 12px;
}
.dr-card__title {
  box-sizing: border-box;
  height: 38px;
  margin: 0;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
  color: #1d2129;
  line-height: 38px;
  background: #f7f8fa;
  border-bottom: 1px solid #e8eaec;
}
.dr-card__body { padding: 16px; }

.dr-row { display: flex; align-items: center; margin-bottom: 14px; flex-wrap: nowrap; min-width: 0; }
.dr-row--top { align-items: flex-start; }
.dr-row:last-child { margin-bottom: 0; }
.dr-label {
  flex: none;
  width: 112px;
  font-size: 12px;
  line-height: 28px;
  color: #4e5969;
  text-align: left;
  white-space: nowrap;
}
.dr-ctl { width: 260px; flex: none; }
.dr-ctl--wide { width: 300px; flex: none; }
.dr-stack { display: flex; flex-direction: column; gap: 8px; }

.dr-dir { display: flex; align-items: center; gap: 8px; }
.dr-addbtn {
  width: 22px; height: 22px; padding: 0;
  font-size: 14px; line-height: 20px;
  color: #197afb; background: #fff;
  border: 1px dashed #a0cfff; border-radius: 3px;
  cursor: pointer;
}
.dr-addbtn:hover { border-color: #197afb; }

.dr-group { display: inline-flex; }
.dr-btn {
  height: 28px; padding: 0 14px;
  font-size: 12px; color: #4e5969;
  background: #fff;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  margin-right: -1px;
}
.dr-btn:first-child { border-radius: 3px 0 0 3px; }
.dr-btn:last-child { border-radius: 0 3px 3px 0; margin-right: 0; }
.dr-btn.is-active {
  background: #197afb;
  border-color: #197afb;
  color: #fff;
  position: relative; z-index: 1;
}
.dr-btn.is-light {
  background: #e8f0ff;
  border-color: #197afb;
  color: #197afb;
  position: relative; z-index: 1;
}

.dr-pair { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }
.dr-field { display: flex; align-items: center; }
.dr-field__tag {
  flex: none; white-space: nowrap;
  padding: 0 8px; height: 26px; line-height: 26px;
  font-size: 12px; color: #4e5969;
  background: #f2f3f5; border: 1px solid #dcdfe6; border-right: 0;
  border-radius: 3px 0 0 3px;
}
.dr-field__select { width: 190px; flex: none; }
.dr-field__select :deep(.el-select__wrapper) { border-radius: 0 3px 3px 0; }

.dr-link {
  padding: 0; font-size: 12px; color: #197afb;
  background: none; border: none; cursor: pointer; text-align: left;
}
.dr-link:hover { color: #4080ff; text-decoration: underline; }

.dr-filters { display: flex; flex-wrap: wrap; gap: 6px; }
.dr-check {
  display: inline-flex; align-items: center; gap: 4px;
  height: 26px; padding: 0 7px;
  font-size: 12px; color: #4e5969;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 3px;
  cursor: pointer;
}
.dr-check.is-on { border-color: #197afb; background: #e8f0ff; color: #197afb; }
.dr-check input { width: 12px; height: 12px; margin: 0; accent-color: #197afb; }

.dr-metric { display: flex; align-items: center; gap: 8px; }
.dr-metric__sel { width: 150px; flex: none; }
.dr-metric__cmp { width: 130px; flex: none; }
.dr-metric__num { width: 120px; flex: none; }

.dr-warn { font-size: 12px; color: #ff7729; line-height: 20px; }

.dr-q {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; margin-left: 8px;
  font-size: 11px; color: #aaa;
  border: 1px solid #c9cdd4; border-radius: 50%;
  cursor: help;
}

.dr-info {
  margin: 6px 0 14px;
  padding: 8px 12px;
  font-size: 12px; line-height: 18px; color: #197afb;
  background: #e8f0ff;
  border-radius: 3px;
}

.dr-nums { display: flex; gap: 16px; }
.dr-numfield { display: flex; align-items: center; }
.dr-numfield__tag {
  padding: 0 22px; height: 28px; line-height: 28px;
  font-size: 12px; color: #86909c;
  background: #f2f3f5; border: 1px solid #dcdfe6; border-right: 0;
  border-radius: 3px 0 0 3px;
}
.dr-numfield__input {
  width: 82px; height: 28px; box-sizing: border-box;
  padding: 0 8px; font-size: 12px; color: #1d2129;
  border: 1px solid #dcdfe6; border-radius: 0 3px 3px 0;
  outline: none;
}
.dr-numfield__input:focus { border-color: #197afb; }
</style>
