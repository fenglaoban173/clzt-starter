<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改账户名称"
    width="920px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <div class="bd-tip">
        已选 <b class="tip-num">{{ tableRows.length }}</b> 个账户，账户名称不能少于 8 个字符且不能超过 60 字符（一个中文字符计为两个字符长度），
        任务执行成功后立即修改账户名称，但媒体存在几分钟的审核缓存，需等待审核通过后同步显示。
      </div>

      <!-- 修改方式 -->
      <div class="bd-row">
        <span class="bd-label">修改方式</span>
        <div class="bd-switch">
          <button type="button" :class="{ active: mode === 'batch' }" @click="mode = 'batch'">批量修改</button>
          <button type="button" :class="{ active: mode === 'import' }" @click="mode = 'import'">表格导入</button>
        </div>
      </div>

      <!-- 批量修改 -->
      <template v-if="mode === 'batch'">
        <div class="bd-row">
          <span class="bd-label">账户命名规则</span>
          <el-input v-model="rule" class="rule-input" :placeholder="DEFAULT_RULE" />
          <el-button type="primary" @click="applyRule">应用</el-button>
        </div>

        <div class="bd-tokens">
          <el-button
            v-for="p in PLACEHOLDERS"
            :key="p.key"
            link
            type="primary"
            class="token-btn"
            :class="{ 'token-used': hasToken(p) }"
            @click="addToken(p)"
          >+ {{ p.label }}</el-button>
          <span class="tokens-tip">占位符按规则自动替换，三个占位符均不可重复使用</span>
        </div>

        <div class="bd-row">
          <span class="bd-label">动态标号起始值</span>
          <el-input v-model="startNo" class="start-input" @change="applyRule" />
        </div>

        <el-table :data="tableRows" border size="small" class="bd-table" max-height="330">
          <el-table-column label="账户ID" prop="advertiser_id" width="180" />
          <el-table-column label="原账户名称" prop="name" min-width="220" show-overflow-tooltip />
          <el-table-column label="新账户名称" min-width="300">
            <template #default="{ row }">
              <el-input v-model="row.newName" class="newname-input" :class="{ 'is-error': !nameOk(row.newName) }">
                <template #suffix>
                  <span class="name-len" :class="lenCls(row.newName)">{{ nameLen(row.newName) }}/60</span>
                </template>
              </el-input>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="invalidCount" class="bd-warn">
          有 {{ invalidCount }} 个账户名称不符合规则（长度需在 8-60 字符之间，且一个中文字符计为两个字符长度）。
        </div>
      </template>

      <!-- 表格导入 -->
      <template v-else>
        <div class="bd-import">
          <el-upload
            drag
            action="#"
            accept=".xlsx"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onFileChange"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx 格式，单次最多上传 500 行；
                <el-button link type="primary" @click.stop="onTemplate">下载导入模板</el-button>
                <span v-if="importFile" class="upload-file">已选择：{{ importFile.name }}</span>
              </div>
            </template>
          </el-upload>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="confirmDisabled" @click="confirm">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { downloadWorkbook } from '@/utils/xlsx';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

// 命名规则占位符（三个占位符均不可重复使用）
const PLACEHOLDERS = [
  { key: 'name', label: '原账户名称', text: '<原账户名称>' },
  { key: 'no', label: '动态标号', text: '<动态标号>' },
  { key: 'owner', label: '所属人', text: '<所属人>' },
];
// 系统默认填入前两个占位符
const DEFAULT_RULE = '<原账户名称><动态标号>';

const mode = ref('batch');
const rule = ref(DEFAULT_RULE);
const startNo = ref(1);
const tableRows = ref([]);
const importFile = ref(null);

// 名称长度：一个中文字符计为两个字符长度
function nameLen(s) {
  let n = 0;
  for (const ch of String(s || '')) n += ch.charCodeAt(0) > 255 ? 2 : 1;
  return n;
}
function nameOk(s) {
  const n = nameLen(s);
  return n >= 8 && n <= 60;
}
function lenCls(s) {
  const n = nameLen(s);
  if (n < 8 || n > 60) return 'len-err';
  if (n > 56) return 'len-warn';
  return '';
}

const invalidCount = computed(() => tableRows.value.filter((r) => !nameOk(r.newName)).length);
const confirmDisabled = computed(() => (
  mode.value === 'batch' ? (!tableRows.value.length || invalidCount.value > 0) : !importFile.value
));

/* ---------- 占位符：不允许重复 ---------- */
function countOccur(str, sub) {
  let n = 0;
  let i = 0;
  while ((i = str.indexOf(sub, i)) !== -1) { n += 1; i += sub.length; }
  return n;
}
function hasToken(p) {
  return String(rule.value || '').includes(p.text);
}
function dupToken() {
  return PLACEHOLDERS.find((p) => countOccur(String(rule.value || ''), p.text) > 1) || null;
}

// 输入/粘贴时若出现重复占位符，自动还原为上一次合法值
let lastValidRule = DEFAULT_RULE;
watch(rule, (v) => {
  const dup = dupToken();
  if (dup) {
    rule.value = lastValidRule;
    ElMessage.warning(`命名规则中「${dup.label}」占位符不可重复使用`);
    return;
  }
  lastValidRule = v;
});

function buildName(acc, index) {
  const no = String((Number(startNo.value) || 0) + index).padStart(2, '0');
  return String(rule.value || '')
    .replace(/<原账户名称>/g, () => acc.name || '')
    .replace(/<动态标号>/g, () => no)
    .replace(/<所属人>/g, () => acc.optimizer || '');
}

function init() {
  mode.value = 'batch';
  rule.value = DEFAULT_RULE;
  lastValidRule = DEFAULT_RULE;
  startNo.value = 1;
  importFile.value = null;
  const list = (props.accounts || []).filter((a) => !a.__total);
  tableRows.value = list.map((a, i) => ({
    id: a.id,
    advertiser_id: a.advertiser_id,
    name: a.name,
    optimizer: a.optimizer,
    newName: buildName(a, i),
  }));
}

function applyRule() {
  tableRows.value.forEach((r, i) => {
    r.newName = buildName(r, i);
  });
}

function addToken(p) {
  if (hasToken(p)) {
    ElMessage.warning(`命名规则中已存在「${p.text}」占位符，不可重复添加`);
    return;
  }
  rule.value = `${rule.value || ''}${p.text}`;
}

function close() {
  emit('update:modelValue', false);
}

/** 下载《批量修改账户名称》导入模板（真实 xlsx 文件） */
function onTemplate() {
  downloadWorkbook(
    [
      {
        name: '批量修改账户名称',
        notes: [
          '修改规则：',
          '1、账户名称长度为30个字。',
          '2、最多同时修改1万个账户。',
          '3、导入时不支持使用通配符，请勿使用通配重复修改',
        ],
        columns: [
          { title: '账户ID', width: 24 },
          { title: '修改账户名称', width: 34 },
        ],
        emptyRows: 20,
      },
    ],
    '批量修改账户名称-导入模板.xlsx',
  );
  ElMessage.success('已下载《批量修改账户名称》导入模板');
}

function onFileChange(file) {
  importFile.value = file?.raw || null;
  if (importFile.value) {
    ElMessage.info(`原型：已选择文件「${importFile.value.name}」（暂未接入 Excel 解析）`);
  }
}

function confirm() {
  if (mode.value === 'import') {
    ElMessage.success(`原型：已提交表格导入任务（文件：${importFile.value?.name || ''}）`);
    emit('confirm', []);
  } else {
    ElMessage.success(`原型：已提交批量修改账户名称任务（${tableRows.value.length} 个账户）`);
    emit('confirm', tableRows.value);
  }
  close();
}
</script>

<style scoped>
.batch-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
}
.bd-tip {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.8;
}
.tip-num { color: #165dff; }
.bd-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.bd-label { flex: none; width: 116px; font-size: 15px; color: #1d2129; white-space: nowrap; }
.bd-switch {
  display: inline-flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.bd-switch button {
  padding: 7px 20px;
  border: none;
  border-right: 1px solid #e5e6eb;
  background: #fff;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
}
.bd-switch button:last-child { border-right: none; }
.bd-switch button.active { background: #e8f3ff; color: #165dff; font-weight: 600; }
.rule-input { width: 380px; }
.start-input { width: 160px; }
.bd-tokens { display: flex; align-items: center; gap: 4px; margin: 8px 0 0 128px; }
.token-btn { padding: 2px 6px; }
.token-btn.token-used { color: #c9cdd4 !important; }
.tokens-tip { margin-left: 12px; font-size: 13px; color: #86909c; }
.bd-table { margin-top: 16px; }
.newname-input :deep(.el-input__wrapper) { padding-right: 4px; }
.newname-input.is-error :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px #f53f3f inset; }
.name-len { font-size: 13px; color: #86909c; padding-right: 6px; white-space: nowrap; }
.name-len.len-warn { color: #ff7d00; }
.name-len.len-err { color: #f53f3f; }
.bd-warn { margin-top: 10px; font-size: 13px; color: #ff7d00; }
.bd-import { margin-top: 16px; }
.bd-import :deep(.el-upload-dragger) { padding: 26px 0; }
.bd-import :deep(.el-upload__tip) { font-size: 13px; color: #86909c; }
.upload-file { margin-left: 8px; color: #165dff; }
</style>
