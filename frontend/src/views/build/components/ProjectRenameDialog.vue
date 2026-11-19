<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改项目名称"
    width="900px"
    top="8vh"
    class="prn-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="prn-body">
      <!-- 说明（与线上一致） -->
      <div class="prn-tip">
        已选{{ rows.length }}个项目，项目名称不能超过100字符（一个中文字符计为两个字符长度），任务执行成功后立即修改创意侧名称，但媒体存在几分钟的审核缓存，需等待审核通过后同步显示。
      </div>

      <!-- 修改模式 -->
      <div class="prn-row">
        <span class="prn-label">修改模式</span>
        <div class="prn-content">
          <el-radio-group v-model="mode" size="small" class="prn-radio">
            <el-radio-button border value="batch">自定义</el-radio-button>
            <el-radio-button border value="keyword">关键词替换</el-radio-button>
            <el-radio-button border value="import">表格导入</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 自定义：命名规则 + 动态标号 -->
      <template v-if="mode === 'batch'">
        <div class="prn-row">
          <span class="prn-label">项目命名规则</span>
          <div class="prn-content">
            <div class="prn-flex">
              <el-input v-model="rule" class="prn-rule-input" placeholder="<原项目名称>-<日期>-<时分秒>" />
              <el-button type="primary" size="small" class="prn-apply" @click="applyRule">应用</el-button>
            </div>
            <div class="prn-tokens">
              <el-button
                v-for="p in PLACEHOLDERS"
                :key="p.key"
                link
                type="primary"
                size="small"
                class="prn-token"
                @click="addToken(p)"
              >
                <el-icon><Plus /></el-icon><span>{{ p.label }}</span>
              </el-button>
            </div>
          </div>
        </div>

        <div class="prn-row">
          <span class="prn-label">动态标号起始值</span>
          <div class="prn-content">
            <el-input v-model="startNo" class="prn-start-input" placeholder="1" />
          </div>
        </div>
      </template>

      <!-- 关键词替换 -->
      <div v-if="mode === 'keyword'" class="prn-row">
        <span class="prn-label">项目命名规则</span>
        <div class="prn-content">
          <div class="prn-flex">
            <el-input v-model="keyword" class="prn-kw-input" placeholder="请输入关键词" />
            <span class="prn-replace">替换为</span>
            <el-input v-model="replacement" class="prn-kw-input" placeholder="请输入关键词" />
            <el-button type="primary" size="small" class="prn-apply" @click="applyKeyword">应用</el-button>
          </div>
        </div>
      </div>

      <!-- 表格导入 -->
      <template v-if="mode === 'import'">
        <div class="prn-row">
          <span class="prn-label">下载模板</span>
          <div class="prn-content">
            <el-button type="primary" size="small" class="prn-w120" @click="downloadTemplate">下载模板</el-button>
          </div>
        </div>

        <div class="prn-row">
          <span class="prn-label">导入文件</span>
          <div class="prn-content">
            <el-button type="primary" size="small" class="prn-w120" @click="pickFile">导入文件</el-button>
            <span class="prn-file-tip">目前仅支持xlsx文件格式</span>
            <input ref="fileInput" type="file" accept=".xlsx" class="prn-file" @change="onFileChange" />
          </div>
        </div>
      </template>

      <!-- 新项目名称预览（自定义 / 关键词替换） -->
      <div v-if="mode !== 'import'" class="prn-table-wrap">
        <el-table :data="pageRows" border size="small" class="prn-table" max-height="330">
          <el-table-column label="账号" width="180">
            <template #default="{ row }">
              <div class="prn-cell">
                <p class="prn-ellipsis" :title="row.accountName">{{ row.accountName }}</p>
                <p class="prn-id">ID：{{ row.accountId }}</p>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="项目" width="180">
            <template #default="{ row }">
              <div class="prn-cell">
                <p class="prn-ellipsis" :title="row.name">{{ row.name }}</p>
                <p class="prn-id">ID：{{ row.projectId }}</p>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="新项目名称" min-width="280">
            <template #default="{ row }">
              <el-input v-model="row.newName" class="prn-new-input" maxlength="100">
                <template #suffix>
                  <span class="prn-count" :class="{ 'is-over': charLen(row.newName) > 100 }">{{ charLen(row.newName) }}/100</span>
                </template>
              </el-input>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="prn-pager"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableRows.length"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          @current-change="onPage"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getBatchOpConfig } from '@/api/oceanengine';
import { downloadWorkbook } from '@/utils/xlsx';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '批量修改项目名称';

/** 命名规则占位符（顺序与线上一致） */
const PLACEHOLDERS = [
  { key: 'name', label: '原项目名称', text: '<原项目名称>' },
  { key: 'date', label: '日期', text: '<日期>' },
  { key: 'time', label: '时分秒', text: '<时分秒>' },
  { key: 'no', label: '动态标号', text: '<动态标号>' },
];
/** 默认命名规则 */
const DEFAULT_RULE = '<原项目名称>-<日期>-<时分秒>';

const mode = ref('batch');
const rule = ref(DEFAULT_RULE);
const startNo = ref('1');
const keyword = ref('');
const replacement = ref('');
const tableRows = ref([]);
const page = ref(1);
const pageSize = ref(100);
const fileInput = ref(null);

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));
const pageRows = computed(() =>
  tableRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
);
const modeText = computed(() => ({ batch: '自定义', keyword: '关键词替换', import: '表格导入' }[mode.value]));

/** 名称长度：一个中文字符计为两个字符长度 */
function charLen(s) {
  let n = 0;
  for (const ch of String(s || '')) n += ch.charCodeAt(0) > 255 ? 2 : 1;
  return n;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function init() {
  mode.value = 'batch';
  rule.value = DEFAULT_RULE;
  startNo.value = '1';
  keyword.value = '';
  replacement.value = '';
  page.value = 1;
  tableRows.value = rows.value.map((p) => ({
    id: p.id,
    accountName: p.account_name || '',
    accountId: p.advertiser_id || '',
    name: p.name || '',
    projectId: p.campaign_id || '',
    newName: p.name || '',
  }));
}

/** 按命名规则生成新项目名称 */
function applyRule() {
  const now = new Date();
  const date = `${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  const start = Number(startNo.value) || 1;
  tableRows.value.forEach((r, i) => {
    r.newName = String(rule.value || '')
      .replace(/<原项目名称>/g, r.name)
      .replace(/<日期>/g, date)
      .replace(/<时分秒>/g, time)
      .replace(/<动态标号>/g, String(start + i));
  });
}

/** 追加占位符 */
function addToken(p) {
  if (String(rule.value || '').includes(p.text)) {
    ElMessage.warning(`命名规则中已存在「${p.text}」，不可重复添加`);
    return;
  }
  rule.value = `${rule.value || ''}${p.text}`;
}

/** 关键词替换 */
function applyKeyword() {
  const kw = keyword.value.trim();
  if (!kw) {
    ElMessage.warning('请先输入需要替换的关键词');
    return;
  }
  tableRows.value.forEach((r) => {
    r.newName = String(r.name || '').split(kw).join(replacement.value);
  });
}

/** 下载导入模板（真实 xlsx 文件，样式与线上一致） */
function downloadTemplate() {
  downloadWorkbook(
    [
      {
        name: '批量修改项目名称',
        notes: [
          '填写须知:',
          '1、广告ID和修改后的广告名称必填，因头条限制，修改后的计划名称不得超过100字符',
          '2、同一账户下的广告名称不得重复',
        ],
        columns: [
          { title: '项目ID', width: 24 },
          { title: '原项目名', width: 46 },
          { title: '修改后项目名称', width: 34 },
        ],
        rows: tableRows.value.map((r) => [r.projectId, r.name, '']),
      },
    ],
    '批量修改项目名称-导入模板.xlsx',
  );
  ElMessage.success('已下载《批量修改项目名称》导入模板');
}

/** 选择要导入的 xlsx 文件 */
function pickFile() {
  fileInput.value && fileInput.value.click();
}

function onFileChange(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  ElMessage.info(`原型：已选择文件「${f.name}」（暂未接入 Excel 解析）`);
  e.target.value = '';
}

function onPage(p) {
  page.value = p;
}

function onSizeChange(s) {
  pageSize.value = s;
  page.value = 1;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const list = tableRows.value.map((r) => ({ ...r, __newName: r.newName }));
  const form = {
    mode: mode.value,
    name: rule.value,
    rule: rule.value,
    keyword: keyword.value,
    replacement: replacement.value,
    start_no: startNo.value,
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(list, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(
    `原型：已提交批量修改项目名称任务（${list.length} 个项目，修改模式：${modeText.value}）`
  );
  emit('confirm', { op: OP, rows: list, form, payload });
  close();
}
</script>

<style scoped>
.prn-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}

/* 说明文案（与线上一致：14px #606266 / 行高 18px） */
.prn-tip { font-size: 14px; line-height: 18px; color: #606266; margin-bottom: 16px; }

/* 表单行：label 固定 120px，行间距 24px（与线上一致） */
.prn-row { display: flex; align-items: flex-start; }
.prn-row + .prn-row { margin-top: 24px; }
.prn-label { flex: none; width: 120px; font-size: 14px; line-height: 32px; color: #666; }
.prn-content { flex: 1; min-width: 0; }
.prn-flex { display: flex; align-items: center; gap: 16px; }

/* 修改模式（选中为蓝字 + 浅蓝底 + 蓝框，80×32，与线上一致） */
.prn-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.prn-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
.prn-radio :deep(.el-radio-button:not(:first-child) .el-radio-button__inner) { border-left-color: #606266; }
.prn-radio :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.prn-radio :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }

.prn-rule-input { width: 360px; }
.prn-kw-input { width: 240px; }
.prn-start-input { width: 80px; }
.prn-apply { width: 80px; }
.prn-w120 { width: 120px; }
.prn-replace { font-size: 14px; color: #333; }
.prn-file-tip { font-size: 12px; color: #909399; margin-left: 16px; }
.prn-file { display: none; }

/* 占位符按钮（+ 原项目名称 / + 日期 / + 时分秒 / + 动态标号） */
.prn-tokens { display: flex; align-items: center; gap: 12px; }
.prn-token { font-size: 12px; }
.prn-token :deep(.el-icon) { font-size: 12px; margin-right: 2px; vertical-align: -1px; }

/* 线上（Element UI 2.x）小号按钮高 32px，Element Plus 默认 24px，这里对齐线上 */
.prn-body :deep(.el-button--small) { height: 32px; }

/* 预览表格 */
.prn-table-wrap { margin-top: 16px; }
.prn-table :deep(.el-table__cell) { padding: 8px 0; }
.prn-cell { padding: 0 10px; }
.prn-ellipsis {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prn-id { margin: 0; font-size: 12px; line-height: 18px; color: #ccc; }
.prn-new-input :deep(.el-input__wrapper) { padding-right: 4px; }
.prn-count { font-size: 12px; color: #909399; padding-right: 4px; white-space: nowrap; }
.prn-count.is-over { color: #f53f3f; }
.prn-pager { margin-top: 16px; justify-content: flex-start; }
</style>

<style>
/* 弹窗外壳：与线上一致（900px 弹窗 / 标题 16px 700 #333 / body 24px 32px） */
.prn-dialog { padding: 0; }
.prn-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; border-bottom: 1px solid #e5e6eb; }
.prn-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.prn-dialog .el-dialog__body { padding: 24px 32px; }
.prn-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e5e6eb; }
.prn-dialog .el-dialog__footer .el-button { width: 120px; }
</style>
