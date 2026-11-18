<template>
  <el-dialog
    :model-value="modelValue"
    :title="cfg.title"
    :width="cfg.width || '880px'"
    top="8vh"
    class="ab-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="ab-body">
      <div v-if="cfg.desc" class="ab-desc">{{ cfg.desc }}</div>
      <div v-for="n in cfg.notes || []" :key="n" class="ab-note">{{ n }}</div>

      <!-- 通用表单字段 -->
      <el-form label-width="120px" label-position="right" class="ab-form">
        <el-form-item v-for="f in cfg.fields || []" :key="f.key" :label="f.label">
          <el-radio-group v-if="f.type === 'radio'" v-model="form[f.key]">
            <el-radio v-for="o in f.options" :key="o" :value="o">{{ o }}</el-radio>
          </el-radio-group>
          <el-checkbox v-else-if="f.type === 'checkbox'" v-model="form[f.key]">{{ f.text || '' }}</el-checkbox>
          <el-input
            v-else-if="f.type === 'textarea'"
            v-model="form[f.key]"
            type="textarea"
            :rows="4"
            :placeholder="f.placeholder"
          />
          <el-input
            v-else-if="f.type === 'number'"
            v-model="form[f.key]"
            :placeholder="f.placeholder || '请输入'"
          >
            <template v-if="f.unit" #append>{{ f.unit }}</template>
          </el-input>
          <el-input v-else-if="f.type === 'tags'" v-model="form[f.key]" :placeholder="f.placeholder" @keyup.enter="addTag(f)" />
          <el-select v-else-if="f.type === 'select'" v-model="form[f.key]" :placeholder="f.placeholder || '请选择'" clearable>
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
          <div v-else-if="f.type === 'upload'" class="ab-upload">
            <el-button size="small" @click="onUpload">上传{{ f.label }}</el-button>
            <span class="ab-upload-tip">{{ f.uploadCount || '图片(0/10)' }}</span>
          </div>
          <el-input v-else v-model="form[f.key]" :placeholder="f.placeholder" />
        </el-form-item>
      </el-form>

      <!-- 已添加标签（产品卖点 / 否定词） -->
      <div v-if="tags.length" class="ab-tags">
        <span v-for="(tg, i) in tags" :key="i" class="ab-tag">
          {{ tg }}
          <el-icon class="ab-tag-x" @click="tags.splice(i, 1)"><Close /></el-icon>
        </span>
        <a class="ab-link" @click="tags = []">清空</a>
      </div>

      <!-- 修改预算 -->
      <div v-if="op === '修改预算'" class="ab-table-wrap">
        <el-table :data="rows" border size="small" max-height="320">
          <el-table-column prop="name" label="广告计划" min-width="240" show-overflow-tooltip />
          <el-table-column label="当日消耗" width="110" align="right">
            <template #default="{ row }">{{ row.stat_cost }}</template>
          </el-table-column>
          <el-table-column label="转化成本" width="110" align="right">
            <template #default="{ row }">{{ row.convert_cost }}</template>
          </el-table-column>
          <el-table-column label="当前预算" width="120" align="right">
            <template #default="{ row }">{{ row.budget }}</template>
          </el-table-column>
          <el-table-column label="分别修改预算" width="180">
            <template #default="{ row }"><el-input v-model="row.__budget" placeholder="请输入预算" /></template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 修改出价 -->
      <div v-if="op === '修改出价'" class="ab-table-wrap">
        <el-table :data="rows" border size="small" max-height="320">
          <el-table-column prop="name" label="广告" min-width="220" show-overflow-tooltip />
          <el-table-column label="深度优化目标" width="130">
            <template #default="{ row }">{{ row.deep_goal || '无' }}</template>
          </el-table-column>
          <el-table-column label="当前出价" width="110" align="right">
            <template #default="{ row }">{{ row.bid }}</template>
          </el-table-column>
          <el-table-column label="当前深度转化出价" width="140" align="right">
            <template #default="{ row }">{{ row.deep_bid || '--' }}</template>
          </el-table-column>
          <el-table-column label="分别修改出价" width="160">
            <template #default="{ row }"><el-input v-model="row.__bid" placeholder="请输入出价" /></template>
          </el-table-column>
          <el-table-column label="分别修改深度转化出价" width="180">
            <template #default="{ row }"><el-input v-model="row.__deep_bid" placeholder="请输入出价" /></template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 修改创意 -->
      <div v-if="op === '修改创意'" class="ab-material">
        <el-tabs v-model="materialTab" class="ab-mat-tabs">
          <el-tab-pane label="视频(0/50)" name="video" />
          <el-tab-pane label="图片(0/50)" name="image" />
        </el-tabs>
        <div class="ab-upload-box" @click="onUpload">点击上传素材</div>
        <div class="ab-upload-tip">系统将根据广告投放模式调整上限，超出部分不生效。</div>
      </div>

      <!-- 开启一键起量 -->
      <div v-if="op === '开启一键起量'" class="ab-plans">
        <div class="ab-empty">暂无起量方案，请点击下面的按钮添加。</div>
        <el-button size="small" @click="onAddPlan">添加起量方案</el-button>
      </div>

      <!-- 修改时段 -->
      <div v-if="op === '修改时段'" class="ab-schedule">
        <div class="ab-grid-head">
          <span class="ab-corner"></span>
          <span v-for="h in hours" :key="h" class="ab-hour">{{ h }}</span>
        </div>
        <div v-for="(d, i) in weekdays" :key="d" class="ab-grid-row">
          <span class="ab-day">{{ d }}</span>
          <el-checkbox
            v-for="(h, j) in hours"
            :key="j"
            :model-value="schedule[i][j]"
            class="ab-cell"
            @change="(v) => (schedule[i][j] = v)"
          />
        </div>
        <div class="ab-schedule-tip">可拖动鼠标选择时间段</div>
        <a class="ab-link" @click="clearSchedule">清空选择</a>
      </div>

      <!-- 修改附加创意组件 -->
      <div v-if="op === '修改附加创意组件'" class="ab-component">
        <div class="ab-comp-head">
          <el-tabs v-model="compTab" class="ab-mat-tabs">
            <el-tab-pane label="推广卡片" name="card" />
          </el-tabs>
          <el-button size="small" @click="onSyncComp">同步创意组件</el-button>
        </div>
        <div class="ab-comp-tip">未展示的组件类型暂时不支持获取和使用，审核未通过的组件不支持使用</div>
        <el-table :data="components" border size="small" max-height="260">
          <el-table-column prop="name" label="组件名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="组件类型" width="120" />
          <el-table-column prop="status" label="组件状态" width="120" />
        </el-table>
        <div class="ab-comp-foot">已选({{ compSelected.length }}) <a class="ab-link" @click="compSelected = []">清空</a></div>
      </div>

      <!-- 批量修改广告名称 -->
      <div v-if="op === '批量修改广告名称'" class="ab-name">
        <div class="ab-rule">
          <span class="ab-rule-label">广告命名规则</span>
          <el-tag
            v-for="r in nameRules"
            :key="r"
            class="ab-rule-tag"
            :type="nameRules.includes(r) ? 'primary' : 'info'"
            closable
            @close="nameRules = nameRules.filter((x) => x !== r)"
          >{{ r }}</el-tag>
          <el-input v-model="startNo" class="ab-start-no" placeholder="动态标号起始值" />
          <el-button size="small" @click="applyRule">应用</el-button>
        </div>
        <el-table :data="rows" border size="small" max-height="300">
          <el-table-column prop="account_name" label="账号" min-width="200" show-overflow-tooltip />
          <el-table-column prop="name" label="广告" min-width="240" show-overflow-tooltip />
          <el-table-column label="新广告名称" min-width="240">
            <template #default="{ row }"><el-input v-model="row.__newName" /></template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="ab-foot">
        <div class="ab-foot-left">
          <el-button v-if="op === '修改创意'" size="small" @click="onAddMaterial">添加素材</el-button>
          <el-button v-if="op === '修改广告标题和素材'" size="small" @click="onPickTitle">选择标题</el-button>
          <el-button v-if="op === '修改落地页'" size="small" @click="onAddLink">添加</el-button>
        </div>
        <div class="ab-foot-btns">
          <el-button @click="close">{{ cfg.cancelText || '取 消' }}</el-button>
          <el-button type="primary" @click="confirm">{{ cfg.okText || '确 定' }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: Boolean,
  // 批量操作项
  op: { type: String, default: '' },
  // 已选广告
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const form = reactive({});
const tags = ref([]);
const materialTab = ref('video');
const compTab = ref('card');
const compSelected = ref([]);
const nameRules = ref(['原广告名称']);
const startNo = ref('1');
const schedule = ref([]);
const components = ref([]);

const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const hours = Array.from({ length: 24 }, (_, i) => i);

// 各批量操作的弹窗配置（对齐线上的标题、字段与按钮）
const OP_CONFIG = {
  修改预算: {
    title: '批量修改预算',
    desc: (n) => `已选${n}条可操作广告计划`,
    fields: [
      { key: 'rule', label: '修改规则', type: 'radio', options: ['立即生效', '次日0时生效'] },
      { key: 'budget', label: '预算', type: 'number', unit: '元', placeholder: '请输入预算' },
    ],
  },
  修改出价: {
    title: '批量修改出价',
    desc: (n) => `已选${n}条可操作广告`,
    fields: [
      { key: 'bidMode', label: '出价批量', type: 'select', placeholder: '请选择' },
      { key: 'bid', label: '出价', type: 'number', unit: '元', placeholder: '请输入出价' },
      { key: 'deepMode', label: '深度出价批量', type: 'select', placeholder: '请选择' },
      { key: 'deepBid', label: '深度出价', type: 'number', unit: '%', placeholder: '请输入深度出价' },
      { key: 'notify', label: '', type: 'checkbox', text: '操作失败通知我' },
    ],
  },
  修改创意: {
    title: '修改创意',
    desc: (n) => `已选中 ${n} 个广告`,
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', options: ['删除素材', '暂停素材', '替换素材', '增加素材'] },
      { key: 'distribute', label: '素材分配方式', type: 'radio', options: ['全部相同', '平均分配'] },
      { key: 'org', label: '广告主账户', type: 'select', placeholder: '请选择组织账户' },
    ],
  },
  开启一键起量: {
    title: '设置一键起量',
    desc: (n) => `已选 ${n} 个可调整广告，将全量更新所有预约中的起量方案，已生效的不受影响。`,
    fields: [
      { key: 'budgetRule', label: '预算设置规则', type: 'radio', options: ['统一设置', '分别设置'] },
      { key: 'effectTime', label: '起量生效时间', type: 'radio', options: ['立即生效', '指定时间'] },
    ],
    okText: '开启一键起量',
  },
  修改落地页: {
    title: '修改落地页',
    desc: (n) => `已选中${n}个广告`,
    notes: [
      '1) 落地页修改为覆盖式修改，如您的广告中原有4个落地页，而在此处您只选择3个落地页，则广告中落地页数量将变为3个',
      '2) 请确保您所填写的落地页类型与原有广告内投放内容一致，否则可能引发报错。',
    ],
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', options: ['统一修改', '分别修改'] },
      { key: 'url', label: '落地页链接', type: 'input', placeholder: '请输入落地页链接' },
    ],
    okText: '保 存',
  },
  修改直达链接: {
    title: '修改直达链接',
    desc: (n) => `已选中${n}个广告`,
    fields: [{ key: 'url', label: '直达链接', type: 'input', placeholder: '请输入直达链接' }],
    okText: '保 存',
  },
  修改广告标题和素材: {
    title: '修改广告标题和素材',
    desc: (n) => `已选${n}个广告`,
    fields: [
      { key: 'titleMode', label: '修改创意标题', type: 'radio', options: ['不启用', '启用'] },
      { key: 'title', label: '创意标题', type: 'input', placeholder: '已选：0/10，点击添加文案' },
      { key: 'materialMode', label: '修改创意素材', type: 'radio', options: ['不启用', '启用'] },
    ],
    cancelText: '取 消',
  },
  修改时段: {
    title: '批量修改时段',
    desc: (n) => `已选${n}条可操作广告计划`,
    okText: '确 定',
  },
  修改附加创意组件: {
    title: '修改附加创意组件',
    desc: (n) => `已选择${n}广告`,
    okText: '确 定',
  },
  修改广告否定词: {
    title: '批量修改否定词',
    notes: ['当前未操作过添加/替换否定词，请手动输入否定词。'],
    fields: [
      { key: 'mode', label: '修改方式', type: 'radio', options: ['添加否定词', '替换否定词'] },
      { key: 'phrase', label: '短语否定词', type: 'radio', options: ['不启用', '启用'] },
      { key: 'phraseText', label: '', type: 'textarea', placeholder: '请粘贴或输入短语否定词，回车可换行' },
      { key: 'exact', label: '精准否定词', type: 'radio', options: ['不启用', '启用'] },
      { key: 'exactText', label: '', type: 'textarea', placeholder: '请粘贴或输入精准否定词，回车可换行' },
    ],
    okText: '保 存',
  },
  修改产品名称: {
    title: '修改产品名称',
    desc: (n) => `已选中${n}个广告`,
    notes: ['修改对象为 广告层级-产品信息模块-产品名称'],
    fields: [{ key: 'name', label: '产品名称', type: 'input', placeholder: '1-20个字符' }],
  },
  修改产品主图: {
    title: '修改产品主图',
    desc: (n) => `已选${n}个广告，请注意本次修改为全覆盖式更新`,
    fields: [{ key: 'image', label: '产品主图', type: 'upload', uploadCount: '图片(0/10)' }],
  },
  修改直达备用链接: {
    title: '修改广告直达备用链接',
    desc: (n) => `已选中${n}个广告`,
    fields: [{ key: 'url', label: '直达备用链接', type: 'input', placeholder: '请输入直达备用链接' }],
    okText: '保 存',
  },
  修改产品卖点: {
    title: '修改产品卖点',
    desc: (n) => `已选中${n}个广告，请注意本次修改为全覆盖式更新。`,
    fields: [{ key: 'tag', label: '卖点信息', type: 'tags', placeholder: '空格分隔,最多10个，每个标签不超过9个字' }],
    okText: '保 存',
  },
  批量修改广告名称: {
    title: '批量修改广告名称',
    desc: (n) => `已选${n}个广告，广告名称不能超过100字符（一个中文字符计为两个字符长度），任务执行成功后会立即修改创量侧名称，但媒体存在几分钟的审核缓存，需等待审核通过后同步显示。`,
    fields: [
      { key: 'mode', label: '修改模式', type: 'radio', options: ['自定义', '关键词替换', '表格导入'] },
    ],
    okText: '确认修改',
  },
};

const cfg = computed(() => {
  const c = OP_CONFIG[props.op] || { title: '批量操作' };
  const count = props.rows.length;
  return {
    ...c,
    desc: typeof c.desc === 'function' ? c.desc(count) : c.desc,
  };
});

function init() {
  Object.keys(form).forEach((k) => delete form[k]);
  (cfg.value.fields || []).forEach((f) => {
    if (f.type === 'radio') form[f.key] = f.options[0];
    else if (f.type === 'checkbox') form[f.key] = false;
    else if (f.type === 'select') form[f.key] = '';
    else form[f.key] = '';
  });
  tags.value = [];
  nameRules.value = ['原广告名称'];
  startNo.value = '1';
  compSelected.value = [];
  components.value = props.rows.slice(0, 3).map((r, i) => ({
    name: r.name,
    type: ['推广卡片', '营销组件', '行动按钮'][i % 3],
    status: ['审核通过', '审核中', '未通过'][i % 3],
  }));
  schedule.value = weekdays.map(() => hours.map(() => false));
  props.rows.forEach((r) => {
    if (!('__budget' in r)) r.__budget = '';
    if (!('__bid' in r)) r.__bid = '';
    if (!('__deep_bid' in r)) r.__deep_bid = '';
    if (!('__newName' in r)) r.__newName = r.name;
  });
}

function addTag(f) {
  const v = String(form[f.key] || '').trim();
  if (!v) return;
  tags.value = [...tags.value, v];
  form[f.key] = '';
}

function clearSchedule() {
  schedule.value = weekdays.map(() => hours.map(() => false));
}

function onUpload() { ElMessage.info('原型：上传素材（不接入真实素材库）'); }
function onAddMaterial() { ElMessage.info('原型：添加素材'); }
function onPickTitle() { ElMessage.info('原型：选择创意标题文案'); }
function onAddLink() { ElMessage.info('原型：添加落地页链接'); }
function onSyncComp() { ElMessage.info('原型：同步创意组件'); }
function onAddPlan() { ElMessage.info('原型：添加起量方案'); }
function applyRule() { ElMessage.info('原型：应用广告命名规则'); }

function close() { emit('update:modelValue', false); }

function confirm() {
  emit('confirm', { op: props.op, rows: props.rows, form: { ...form }, tags: [...tags.value] });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ab-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #1d2129;
}
.ab-desc { margin-bottom: 12px; color: #1d2129; }
.ab-note { margin-bottom: 6px; color: #86909c; font-size: 13px; }
.ab-form { max-width: 860px; }
.ab-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: -6px 0 12px 120px; }
.ab-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 2px;
  background: #f2f3f5;
  font-size: 13px;
}
.ab-tag-x { color: #86909c; cursor: pointer; }
.ab-tag-x:hover { color: #f53f3f; }
.ab-link { color: #165dff; cursor: pointer; font-size: 13px; }

.ab-table-wrap { margin-top: 8px; }
.ab-upload { display: flex; align-items: center; gap: 10px; }
.ab-upload-tip { color: #86909c; font-size: 13px; }

.ab-material { margin-top: 8px; }
.ab-mat-tabs { margin-bottom: 8px; }
.ab-upload-box {
  height: 120px;
  border: 1px dashed #c9cdd4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
  cursor: pointer;
  margin-bottom: 8px;
}
.ab-plans { padding: 10px 0; }
.ab-empty { color: #86909c; font-size: 13px; margin-bottom: 10px; }

/* 时段网格 */
.ab-schedule { margin-top: 6px; overflow-x: auto; }
.ab-grid-head, .ab-grid-row { display: flex; align-items: center; }
.ab-grid-head .ab-hour { width: 30px; flex: none; text-align: center; font-size: 12px; color: #86909c; }
.ab-corner { width: 70px; flex: none; }
.ab-day { width: 70px; flex: none; font-size: 13px; color: #1d2129; }
.ab-cell { width: 30px; flex: none; }
.ab-cell :deep(.el-checkbox__label) { display: none; }
.ab-schedule-tip { margin-top: 8px; color: #86909c; font-size: 12px; display: inline-block; margin-right: 16px; }

/* 附加创意组件 */
.ab-comp-head { display: flex; align-items: center; justify-content: space-between; }
.ab-comp-tip { color: #86909c; font-size: 13px; margin: 6px 0 8px; }
.ab-comp-foot { margin-top: 8px; font-size: 13px; color: #1d2129; }

/* 批量修改广告名称 */
.ab-rule { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.ab-rule-label { font-size: 14px; color: #1d2129; }
.ab-rule-tag { cursor: pointer; }
.ab-start-no { width: 160px; }

.ab-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ab-foot-left { display: flex; gap: 8px; }
.ab-foot-btns { display: flex; gap: 8px; }
</style>
