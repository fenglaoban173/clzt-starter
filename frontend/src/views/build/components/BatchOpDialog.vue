<template>
  <el-dialog
    :model-value="modelValue"
    :title="cfg.title"
    :width="cfg.width || '880px'"
    top="8vh"
    class="bo-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div v-if="!cfg" class="bo-empty">未找到该批量操作的接口定义</div>
    <div v-else class="bo-body">
      <div v-if="cfg.desc" class="bo-desc">{{ descText }}</div>
      <div v-for="(n, i) in cfg.notes || []" :key="i" class="bo-note">{{ n }}</div>
      <div v-if="onlineToast" class="bo-note bo-note-toast">线上提示：{{ onlineToast }}</div>

      <!-- 接口信息 -->
      <div class="bo-api">
        <span class="bo-api-tag">接口</span>
        <span class="bo-api-method">{{ cfg.api.method }}</span>
        <a class="bo-api-path" :href="apiUrl" target="_blank" rel="noreferrer">{{ apiUrl }}</a>
        <span class="bo-api-name">{{ cfg.api.name }}</span>
        <span class="bo-api-meta">权限点：{{ cfg.api.scope }}</span>
        <span class="bo-api-meta">批量上限 {{ batchLimit }} 条</span>
      </div>

      <!-- 表单 -->
      <el-form label-width="150px" label-position="right" class="bo-form">
        <el-form-item v-for="f in formFields" :key="f.key" :label="f.label">
          <!-- 单选 -->
          <el-radio-group v-if="f.type === 'radio'" v-model="form[f.key]">
            <el-radio v-for="o in normOptions(f)" :key="optVal(o)" :value="optVal(o)">{{ optLabel(o) }}</el-radio>
          </el-radio-group>

          <!-- 多选（勾选组） -->
          <el-checkbox-group v-else-if="f.type === 'checkboxGroup'" v-model="form[f.key]">
            <el-checkbox v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</el-checkbox>
          </el-checkbox-group>

          <!-- 多选下拉 -->
          <el-select
            v-else-if="f.type === 'multiSelect'"
            v-model="form[f.key]"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="f.placeholder || '请选择'"
            class="bo-select"
          >
            <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>

          <!-- 下拉 -->
          <el-select
            v-else-if="f.type === 'select'"
            v-model="form[f.key]"
            :placeholder="f.placeholder || '请选择'"
            clearable
            class="bo-select"
          >
            <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>

          <!-- 数字 -->
          <el-input v-else-if="f.type === 'number'" v-model="form[f.key]" :placeholder="f.placeholder || '请输入'">
            <template v-if="f.unit" #append>{{ f.unit }}</template>
          </el-input>

          <!-- 文本 -->
          <el-input v-else-if="f.type === 'input'" v-model="form[f.key]" :placeholder="f.placeholder" clearable />

          <!-- 多行文本 -->
          <el-input v-else-if="f.type === 'textarea'" v-model="form[f.key]" type="textarea" :rows="4" :placeholder="f.placeholder" />

          <!-- 日期时间 -->
          <el-date-picker
            v-else-if="f.type === 'datetime'"
            v-model="form[f.key]"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="f.placeholder || '请选择'"
            class="bo-date"
          />

          <!-- 单个勾选 -->
          <el-checkbox v-else-if="f.type === 'checkbox'" v-model="form[f.key]">{{ f.text || '' }}</el-checkbox>

          <!-- 只读（ID 列表） -->
          <div v-else-if="f.type === 'readonly'" class="bo-readonly">
            {{ idsText }}
            <span class="bo-tip">{{ f.hint }}</span>
          </div>

          <!-- 上传 -->
          <div v-else-if="f.type === 'upload'" class="bo-upload">
            <el-button size="small" @click="onUpload">上传{{ f.label }}</el-button>
            <span class="bo-upload-tip">{{ f.uploadCount || '图片(0/10)' }}</span>
          </div>

          <!-- 标签（否定词 / 卖点） -->
          <div v-else-if="f.type === 'tags'" class="bo-tags-wrap">
            <el-input
              v-model="tagInput[f.key]"
              :placeholder="f.placeholder"
              @keyup.enter="addTag(f)"
            />
            <el-button size="small" @click="addTag(f)">添加</el-button>
            <div v-if="(form[f.key] || []).length" class="bo-tags">
              <span v-for="(tg, i) in form[f.key]" :key="i" class="bo-tag">
                {{ tg }}
                <el-icon class="bo-tag-x" @click="removeTag(f, i)"><Close /></el-icon>
              </span>
              <a class="bo-link" @click="form[f.key] = []">清空</a>
            </div>
          </div>

          <!-- 多条链接 -->
          <div v-else-if="f.type === 'links'" class="bo-links">
            <div v-for="(u, i) in form[f.key] || []" :key="i" class="bo-link-row">
              <el-input v-model="form[f.key][i]" :placeholder="f.placeholder" />
              <el-button link type="danger" @click="form[f.key].splice(i, 1)">删除</el-button>
            </div>
            <div class="bo-link-foot">
              <el-button size="small" @click="addLink(f)">添加</el-button>
              <span class="bo-tip">已填 {{ (form[f.key] || []).length }} 条</span>
            </div>
          </div>

          <!-- 素材（视频 / 图片） -->
          <div v-else-if="f.type === 'material'" class="bo-material">
            <el-tabs v-model="materialTab" class="bo-mat-tabs">
              <el-tab-pane label="视频(0/50)" name="video" />
              <el-tab-pane label="图片(0/50)" name="image" />
            </el-tabs>
            <div class="bo-upload-box" @click="onUpload">点击上传素材</div>
            <div class="bo-upload-tip">系统将根据广告投放模式调整上限，超出部分不生效。</div>
          </div>

          <!-- 创意组件 -->
          <div v-else-if="f.type === 'components'" class="bo-comp">
            <div class="bo-comp-head">
              <el-button size="small" @click="onSyncComp">同步创意组件</el-button>
              <span class="bo-tip">未展示的组件类型暂时不支持获取和使用，审核未通过的组件不支持使用</span>
            </div>
            <el-table :data="components" border size="small" max-height="240">
              <el-table-column label="组件名称" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">{{ row.component_name }}</template>
              </el-table-column>
              <el-table-column label="组件类型" width="140">
                <template #default="{ row }">{{ compTypeLabel(row.component_type) }}</template>
              </el-table-column>
              <el-table-column label="审核状态" width="110">
                <template #default="{ row }">{{ compStatusLabel(row.status) }}</template>
              </el-table-column>
              <el-table-column label="选择" width="70" align="center">
                <template #default="{ row }">
                  <el-checkbox :model-value="compSelected.includes(row.component_id)" @change="(v) => toggleComp(row, v)" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 关键词 -->
          <div v-else-if="f.type === 'keywords'" class="bo-kw">
            <el-table :data="form[f.key] || []" border size="small">
              <el-table-column label="关键词" min-width="220">
                <template #default="{ row }"><el-input v-model="row.word" placeholder="请输入关键词" /></template>
              </el-table-column>
              <el-table-column label="匹配类型" width="150">
                <template #default="{ row }">
                  <el-select v-model="row.match_type">
                    <el-option v-for="o in ENUMS.matchType" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="出价" width="140">
                <template #default="{ row }"><el-input v-model="row.bid" placeholder="0.2～999.0" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="form[f.key].splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button size="small" @click="addKeyword(f)">添加关键词</el-button>
          </div>

          <!-- 电商平台多 ROI 系数 -->
          <div v-else-if="f.type === 'multiRoi'" class="bo-kw">
            <el-table :data="form[f.key] || []" border size="small">
              <el-table-column label="电商平台" width="160">
                <template #default="{ row }">
                  <el-select v-model="row.shop_platform">
                    <el-option label="拼多多" value="PDD" />
                    <el-option label="淘宝" value="TB" />
                    <el-option label="京东" value="JD" />
                    <el-option label="其他" value="OTHER" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="ROI系数" min-width="160">
                <template #default="{ row }"><el-input v-model="row.roi_goal" placeholder="0.01～100" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="form[f.key].splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button size="small" @click="addRoi(f)">添加平台</el-button>
          </div>

          <!-- 逐条修改（分别修改） -->
          <div v-else-if="f.type === 'table'" class="bo-table-wrap">
            <el-table :data="rows" border size="small" max-height="320">
              <el-table-column prop="name" label="广告" min-width="220" show-overflow-tooltip />
              <el-table-column v-for="c in f.columns" :key="c.key" :label="c.label" width="180">
                <template #default="{ row }"><el-input v-model="row['__' + c.key]" :placeholder="c.placeholder" /></template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 命名规则 -->
          <div v-else-if="f.type === 'nameRule'" class="bo-rule">
            <span class="bo-rule-label">命名规则</span>
            <el-tag
              v-for="r in nameRules"
              :key="r"
              class="bo-rule-tag"
              :type="nameRules.includes(r) ? 'primary' : 'info'"
              closable
              @close="nameRules = nameRules.filter((x) => x !== r)"
            >{{ r }}</el-tag>
            <el-input v-model="startNo" class="bo-start-no" placeholder="动态标号起始值" />
            <el-button size="small" @click="applyRule">应用</el-button>
          </div>

          <!-- 兜底 -->
          <el-input v-else v-model="form[f.key]" :placeholder="f.placeholder" />

          <!-- 字段级说明：接口字段名 + 取值限制 -->
          <div v-if="f.apiField" class="bo-field-meta">
            <span class="bo-api-field">{{ f.apiField }}</span>
            <span v-if="f.rule" class="bo-rule-text">{{ f.rule }}</span>
            <span v-if="f.apiRef" class="bo-rule-text">取值来源：{{ f.apiRef }}</span>
          </div>
        </el-form-item>
      </el-form>

      <!-- 投放时段：48×7 半小时栅格 -->
      <div v-if="hasSchedule" class="bo-schedule">
        <div class="bo-schedule-title">
          <span class="bo-sched-label">{{ scheduleField ? scheduleField.label : '投放时段' }}</span>
          <span v-if="scheduleField && scheduleField.apiField" class="bo-api-field">{{ scheduleField.apiField }}</span>
          <span v-if="scheduleField && scheduleField.rule" class="bo-rule-text">{{ scheduleField.rule }}</span>
        </div>
        <div class="bo-schedule-head">
          <span class="bo-corner"></span>
          <span v-for="h in 24" :key="h" class="bo-hour">{{ h - 1 }}:00</span>
        </div>
        <div v-for="(d, i) in weekdays" :key="d" class="bo-grid-row">
          <span class="bo-day">{{ d }}</span>
          <el-checkbox
            v-for="j in 48"
            :key="j"
            :model-value="schedule[i][j - 1]"
            class="bo-cell"
            @change="(v) => (schedule[i][j - 1] = v)"
          />
        </div>
        <div class="bo-schedule-foot">
          <span class="bo-tip">半小时为最小粒度（每天 48 段），对应 schedule_time 的 48×7 位 0/1 字符串</span>
          <a class="bo-link" @click="clearSchedule">清空选择</a>
        </div>
      </div>

      <!-- 请求体预览 -->
      <div class="bo-payload">
        <div class="bo-payload-head">
          <span>请求体预览</span>
          <a class="bo-link" @click="showPayload = !showPayload">{{ showPayload ? '收起' : '展开' }}</a>
        </div>
        <pre v-if="showPayload" class="bo-payload-body">{{ payloadText }}</pre>
      </div>
    </div>

    <template #footer>
      <div class="bo-foot">
        <div class="bo-foot-left">
          <el-button size="small" @click="showPayload = !showPayload">{{ showPayload ? '收起请求体' : '查看请求体' }}</el-button>
        </div>
        <div class="bo-foot-btns">
          <el-button @click="close">{{ cfg && cfg.cancelText ? cfg.cancelText : '取 消' }}</el-button>
          <el-button type="primary" @click="confirm">{{ cfg && cfg.okText ? cfg.okText : '确 定' }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import { ENUMS, getBatchOpConfig, apiUrl as buildApiUrl, BATCH_LIMIT, ONLINE_ONLY_TOAST } from '@/api/oceanengine';

const props = defineProps({
  modelValue: Boolean,
  // 'promotion' 广告（单元）层级 / 'project' 项目层级
  scope: { type: String, default: 'promotion' },
  op: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const form = reactive({});
const tagInput = reactive({});
const materialTab = ref('video');
const compSelected = ref([]);
const components = ref([]);
const nameRules = ref(['原广告名称']);
const startNo = ref('1');
const schedule = ref([]);
const showPayload = ref(true);

const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

const cfg = computed(() => getBatchOpConfig(props.scope, props.op));
const apiUrl = computed(() => buildApiUrl(cfg.value));
const batchLimit = BATCH_LIMIT;
const onlineToast = computed(() => (props.scope === 'promotion' ? ONLINE_ONLY_TOAST[props.op] : ''));

const visibleFields = computed(() => {
  const list = (cfg.value && cfg.value.fields) || [];
  return list.filter((f) => {
    if (!f.visibleWhen) return true;
    return Object.entries(f.visibleWhen).every(([k, v]) => {
      const cur = form[k];
      const arr = Array.isArray(v) ? v : [v];
      return arr.includes(cur);
    });
  });
});

const hasSchedule = computed(() => visibleFields.value.some((f) => f.type === 'schedule'));
// 投放时段单独用 48×7 栅格渲染，不进通用表单
const formFields = computed(() => visibleFields.value.filter((f) => f.type !== 'schedule'));
const scheduleField = computed(() => visibleFields.value.find((f) => f.type === 'schedule') || null);

const idsText = computed(() => props.rows.map((r) => r.id).join(', '));

// 描述文案：注册表里写成 (n) => `…${n}…`，这里按选中条数求值
const descText = computed(() => {
  const d = cfg.value && cfg.value.desc;
  if (!d) return '';
  return typeof d === 'function' ? d(props.rows.length) : d;
});

const payload = computed(() => {
  if (!cfg.value || typeof cfg.value.build !== 'function') return {};
  try {
    return cfg.value.build(props.rows, form);
  } catch (e) {
    return { error: String(e) };
  }
});
const payloadText = computed(() => JSON.stringify(payload.value, null, 2));

function normOptions(f) {
  return (f.options || []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
}
function optVal(o) {
  return typeof o === 'string' ? o : o.value;
}
function optLabel(o) {
  return typeof o === 'string' ? o : o.label;
}

function init() {
  Object.keys(form).forEach((k) => delete form[k]);
  Object.keys(tagInput).forEach((k) => delete tagInput[k]);
  const list = (cfg.value && cfg.value.fields) || [];
  list.forEach((f) => {
    if (f.type === 'radio') form[f.key] = f.default ?? (f.options?.[0]?.value ?? f.options?.[0]);
    else if (f.type === 'checkbox') form[f.key] = false;
    else if (f.type === 'checkboxGroup') form[f.key] = [];
    else if (f.type === 'multiSelect') form[f.key] = [];
    else if (f.type === 'links') form[f.key] = [];
    else if (f.type === 'keywords') form[f.key] = [];
    else if (f.type === 'multiRoi') form[f.key] = [];
    else if (f.type === 'number') form[f.key] = '';
    else form[f.key] = '';
  });
  nameRules.value = ['原广告名称'];
  startNo.value = '1';
  compSelected.value = [];
  components.value = props.rows.slice(0, 4).map((r, i) => ({
    component_id: `CMP${1000 + i}`,
    component_name: `${r.name || '广告'} - 推广卡片${i + 1}`,
    component_type: ['PROMOTION_CARD', 'COMMERCE_MAGNET', 'COUPON_MAGNET', 'CHOICE_MAGNET'][i % 4],
    status: ['PASS', 'UNDER', 'PASS', 'REJECT'][i % 4],
  }));
  schedule.value = weekdays.map(() => Array(48).fill(false));
  props.rows.forEach((r) => {
    if (!('__budget' in r)) r.__budget = '';
    if (!('__bid' in r)) r.__bid = '';
    if (!('__deepbid' in r)) r.__deepbid = '';
    if (!('__newName' in r)) r.__newName = r.name;
  });
}

watch(
  () => props.op,
  () => {
    if (props.modelValue) init();
  }
);

function addTag(f) {
  const v = String(tagInput[f.key] || '').trim();
  if (!v) return;
  form[f.key] = [...(form[f.key] || []), v];
  tagInput[f.key] = '';
}
function removeTag(f, i) {
  form[f.key].splice(i, 1);
}
function addLink(f) {
  form[f.key] = [...(form[f.key] || []), ''];
}
function addKeyword(f) {
  form[f.key] = [...(form[f.key] || []), { word: '', match_type: 'EXTENSIVE', bid: '' }];
}
function addRoi(f) {
  form[f.key] = [...(form[f.key] || []), { shop_platform: 'TB', roi_goal: '' }];
}
function toggleComp(row, v) {
  if (v) compSelected.value = [...compSelected.value, row.component_id];
  else compSelected.value = compSelected.value.filter((id) => id !== row.component_id);
  if (cfg.value && cfg.value.fields) {
    const f = cfg.value.fields.find((x) => x.type === 'components');
    if (f) form[f.key] = components.value.filter((c) => compSelected.value.includes(c.component_id));
  }
}
function compTypeLabel(v) {
  return (ENUMS.componentTypes.find((o) => o.value === v) || { label: v }).label;
}
function compStatusLabel(v) {
  return (ENUMS.componentStatus.find((o) => o.value === v) || { label: v }).label;
}

function clearSchedule() {
  schedule.value = weekdays.map(() => Array(48).fill(false));
}
watch(
  schedule,
  (v) => {
    const f = (cfg.value && cfg.value.fields || []).find((x) => x.type === 'schedule');
    if (f) form[f.key] = v.map((day) => day.map((b) => (b ? '1' : '0')).join('')).join('');
  },
  { deep: true }
);

function onUpload() { ElMessage.info('原型：上传素材（不接入真实素材库）'); }
function onSyncComp() { ElMessage.info('原型：同步创意组件'); }
function applyRule() { ElMessage.info('原型：应用命名规则'); }

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  emit('confirm', { op: props.op, scope: props.scope, rows: props.rows, form: { ...form }, payload: payload.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.bo-body { --el-font-size-base: 14px; font-size: 14px; color: #1d2129; }
.bo-empty { padding: 40px 0; text-align: center; color: #86909c; }
.bo-desc { margin-bottom: 10px; }
.bo-note { margin-bottom: 6px; color: #86909c; font-size: 13px; }

/* 接口条 */
.bo-api {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 14px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  font-size: 12px;
  color: #4e5969;
}
.bo-api-tag { padding: 1px 6px; border-radius: 2px; background: #165dff; color: #fff; }
.bo-api-method { font-weight: 600; color: #165dff; }
.bo-api-path { color: #165dff; text-decoration: none; word-break: break-all; }
.bo-api-name { color: #1d2129; }
.bo-api-meta { color: #86909c; }

.bo-form { max-width: 900px; }
.bo-select { width: 260px; }
.bo-date { width: 260px; }
.bo-tip { color: #86909c; font-size: 12px; }
.bo-link { color: #165dff; cursor: pointer; font-size: 13px; margin-left: 8px; }

.bo-field-meta {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.6;
}
.bo-api-field {
  display: inline-block;
  margin-right: 8px;
  padding: 0 6px;
  border-radius: 2px;
  background: #eef3ff;
  color: #165dff;
  font-family: Consolas, Monaco, monospace;
}
.bo-rule-text { display: inline; word-break: break-word; }

.bo-readonly { font-size: 13px; color: #4e5969; word-break: break-all; }
.bo-upload { display: flex; align-items: center; gap: 10px; }
.bo-upload-tip { color: #86909c; font-size: 13px; }

.bo-tags-wrap { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.bo-tags-wrap > .el-input { width: 320px; }
.bo-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; width: 100%; }
.bo-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 2px;
  background: #f2f3f5;
  font-size: 13px;
}
.bo-tag-x { color: #86909c; cursor: pointer; }
.bo-tag-x:hover { color: #f53f3f; }

.bo-links { width: 100%; }
.bo-link-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.bo-link-foot { display: flex; align-items: center; }

/* 素材 */
.bo-material { width: 100%; }
.bo-mat-tabs { margin-bottom: 8px; }
.bo-upload-box {
  height: 110px;
  border: 1px dashed #c9cdd4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
  cursor: pointer;
  margin-bottom: 8px;
}

/* 组件 */
.bo-comp { width: 100%; }
.bo-comp-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

/* 关键词 / 多ROI */
.bo-kw { width: 100%; }
.bo-kw > .el-button { margin-top: 8px; }

/* 投放时段 */
.bo-schedule { margin-top: 6px; overflow-x: auto; }
.bo-schedule-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.bo-sched-label { font-size: 14px; font-weight: 600; color: #1d2129; }
.bo-schedule-head, .bo-grid-row { display: flex; align-items: center; }
.bo-schedule-head .bo-hour { width: 30px; flex: none; text-align: center; font-size: 11px; color: #86909c; }
.bo-corner { width: 70px; flex: none; }
.bo-day { width: 70px; flex: none; font-size: 13px; }
.bo-cell { width: 30px; flex: none; }
.bo-cell :deep(.el-checkbox__label) { display: none; }
.bo-schedule-foot { margin-top: 8px; display: flex; align-items: center; }

/* 命名规则 */
.bo-rule { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.bo-rule-label { font-size: 14px; }
.bo-rule-tag { cursor: pointer; }
.bo-start-no { width: 160px; }

/* 请求体预览 */
.bo-payload { margin-top: 14px; border-top: 1px solid #e5e6eb; padding-top: 10px; }
.bo-payload-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #4e5969; }
.bo-payload-body {
  margin: 8px 0 0;
  padding: 10px;
  max-height: 240px;
  overflow: auto;
  background: #1d2129;
  color: #c9f0d3;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  font-family: Consolas, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.bo-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.bo-foot-btns { display: flex; gap: 8px; }
</style>
