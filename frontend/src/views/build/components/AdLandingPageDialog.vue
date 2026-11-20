<template>
  <el-dialog
    :model-value="modelValue"
    title="修改落地页"
    width="820px"
    align-center
    class="ald-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="ald-body">
      <!-- 已选广告数 -->
      <div class="ald-desc">已选中{{ rows.length }}个广告</div>

      <!-- 说明（与线上一致） -->
      <div class="ald-notes">
        <p v-for="(n, i) in notes" :key="i" class="ald-note">{{ i + 1 }}) {{ n }}</p>
      </div>

      <!-- 修改方式 -->
      <div class="ald-row">
        <span class="ald-label">修改方式</span>
        <div class="ald-content">
          <el-radio-group v-model="mode" size="small" class="ald-radio">
            <el-radio-button border value="all">统一修改</el-radio-button>
            <el-radio-button border value="each">分别修改</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 统一修改：落地页链接 + 添加 -->
      <template v-if="mode === 'all'">
        <div v-for="(u, i) in urls" :key="i" class="ald-row">
          <span class="ald-label">落地页链接</span>
          <div class="ald-content">
            <el-input
              v-model="u.url"
              placeholder="请输入落地页链接"
              class="ald-input"
              @blur="syncUrls"
            />
            <!-- R77：新增的落地页支持删除（至少保留一条） -->
            <el-button
              v-if="urls.length > 1"
              link
              type="danger"
              class="ald-del"
              @click="removeUrl(i)"
            >删除</el-button>
          </div>
        </div>
        <div class="ald-row">
          <span class="ald-label"></span>
          <div class="ald-content">
            <el-button size="small" class="ald-add" @click="addUrl">添加</el-button>
          </div>
        </div>
      </template>

      <!-- 分别修改：下载模板 + 上传文件 -->
      <template v-else>
        <div class="ald-row">
          <span class="ald-label">获取模板</span>
          <div class="ald-content">
            <el-button type="primary" size="small" class="ald-w120" @click="downloadTemplate">
              下载模板
            </el-button>
            <p class="ald-tip">点击导出当前选中广告数据，填写落地页链接后上传。</p>
          </div>
        </div>

        <div class="ald-row">
          <span class="ald-label">导入文件</span>
          <div class="ald-content">
            <el-button type="primary" size="small" class="ald-w120" @click="pickFile">
              上传文件
            </el-button>
            <span class="ald-file-tip">目前仅支持xlsx/xls文件格式</span>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="ald-file" @change="onFileChange" />
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';
import { downloadWorkbook } from '@/utils/xlsx';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改落地页';

/** 可操作广告（去掉合计行） */
const rows = computed(() => (props.rows || []).filter((r) => !r.__summary));

/** 修改方式：all 统一修改 / each 分别修改 */
const mode = ref('all');
/** 统一修改的落地页链接（可多条） */
const urls = ref([{ url: '' }]);
const fileInput = ref(null);

/** 说明文案（与线上一致，取自接口配置） */
const notes = computed(() => {
  const cfg = getBatchOpConfig('promotion', OP);
  return (cfg && cfg.notes) || [];
});

function init() {
  mode.value = 'all';
  urls.value = [{ url: '' }];
}

/** 新增一条落地页链接 */
function addUrl() {
  urls.value = [...urls.value, { url: '' }];
}

/** 删除一条落地页链接（至少保留一条） */
function removeUrl(i) {
  if (urls.value.length <= 1) {
    ElMessage.warning('至少保留一条落地页链接');
    return;
  }
  urls.value = urls.value.filter((_, idx) => idx !== i);
}

/** 把输入框里的链接同步到 form */
function syncUrls() {
  return urls.value.map((u) => String(u.url || '').trim()).filter(Boolean);
}

/** 下载导入模板（账户ID / 广告ID / 落地页 1~10） */
function downloadTemplate() {
  const columns = [
    { title: '账户ID（必填）', width: 22 },
    { title: '广告ID（必填）', width: 22 },
  ];
  for (let i = 1; i <= 10; i += 1) {
    columns.push({ title: `落地页 ${i}`, width: 30 });
  }
  downloadWorkbook(
    [
      {
        name: '修改落地页',
        notes: [
          '填写须知:',
          '1、账户ID与广告ID为必填项，请勿修改',
          '2、落地页链接最多填写10个，多余的列可留空',
          '3、请确保所填写的落地页类型与原有广告内投放内容一致，否则可能引发报错',
        ],
        columns,
        rows: rows.value.map((r) => [
          r.advertiser_id || '',
          r.ad_id || r.id || '',
          ...Array.from({ length: 10 }, () => ''),
        ]),
      },
    ],
    '修改落地页-导入模板.xlsx',
  );
  ElMessage.success('已下载《修改落地页》导入模板');
}

/** 选择要导入的文件 */
function pickFile() {
  fileInput.value && fileInput.value.click();
}

function onFileChange(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  ElMessage.info(`原型：已选择文件「${f.name}」（暂未接入 Excel 解析）`);
  e.target.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (mode.value === 'all') {
    const list = syncUrls();
    if (!list.length) {
      ElMessage.warning('请输入落地页链接');
      return;
    }
  }
  const form = { mode: mode.value === 'all' ? '统一修改' : '分别修改', urls: syncUrls() };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交修改落地页任务（${rows.value.length} 条广告）`);
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.ald-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 12px;
  font-size: 14px;
  color: #606266;
}

/* 已选中广告数 */
.ald-desc { margin-bottom: 12px; font-size: 14px; color: #606266; }

/* 说明（两行，12px #999） */
.ald-notes { margin-bottom: 20px; }
.ald-note { margin: 0 0 6px; font-size: 12px; line-height: 18px; color: #999; }

/* 表单行：标签 100px */
.ald-row { display: flex; align-items: flex-start; margin-bottom: 18px; }
.ald-label { flex: none; width: 100px; font-size: 14px; line-height: 32px; color: #666; }
.ald-content { flex: 1; min-width: 0; }

/* 落地页链接输入框（500px / 32px） */
.ald-input { width: 500px; --el-input-height: 32px; }

/* 「删除」按钮（红色文字链接，紧跟输入框） */
.ald-del { margin-left: 12px; font-size: 12px; }
.ald-del:hover { color: #ff4d4f; }

/* 「添加」按钮（160×32） */
.ald-add { width: 160px; height: 32px; padding: 0; font-size: 12px; }

/* 提示文案（12px #999） */
.ald-tip { margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #999; }

/* 文件格式提示（12px #999） */
.ald-file-tip { margin-left: 12px; font-size: 12px; line-height: 32px; color: #999; }
.ald-file { display: none; }

/* 分段按钮（选中为蓝字 + 浅蓝底 + 蓝框，与线上一致） */
.ald-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.ald-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
</style>

<style>
/* 弹窗外壳：与线上一致（标题 16px 700 #333 / body 20px 24px） */
.ald-dialog { padding: 0; }
.ald-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.ald-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.ald-dialog .el-dialog__body { padding: 20px 24px; }
.ald-dialog .el-dialog__footer { padding: 0 24px 20px; }
.ald-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.ald-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 小尺寸按钮统一 32px（EP 的 small 为 24px，线上为 32px） */
.ald-dialog .el-button--small { height: 32px; }

/* 「下载模板 / 上传文件」按钮（120×32，主色 #197afb） */
.ald-dialog .ald-w120 {
  width: 120px;
  padding: 0;
  font-size: 12px;
  background: #197afb;
  border-color: #197afb;
}
.ald-dialog .ald-w120:hover { background: #4a9bff; border-color: #4a9bff; }

/* 页脚主按钮配色与线上一致 */
.ald-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.ald-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 页脚次按钮（线上边框 #d0d0d0） */
.ald-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
</style>
