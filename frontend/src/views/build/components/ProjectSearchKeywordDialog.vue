<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改搜索快投关键词"
    width="1120px"
    align-center
    class="kw-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="kw-body">
      <div class="kw-desc">已选中 {{ projectCount }} 个项目</div>

      <!-- 关键词：左侧标签，右侧表格（每个项目一行，可增删关键词行） -->
      <div class="kw-item">
        <span class="kw-label">关键词</span>
        <div class="kw-content">
          <el-table :data="rows" border size="small" class="kw-table" max-height="400">
            <el-table-column label="项目名称" min-width="240">
              <template #default="{ row }">
                <div class="kw-cell">
                  <div class="kw-cell-title" :title="row.name">{{ row.name }}</div>
                  <div class="kw-cell-desc">项目ID：{{ row.pid }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="原关键词" width="130">
              <template #default="{ row }">
                <span class="kw-origin" :title="row.originWord">{{ row.originWord || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="关键词" min-width="200">
              <template #default="{ row }">
                <el-input
                  :model-value="row.word"
                  placeholder="请输入关键词"
                  size="small"
                  class="kw-cell-input"
                  @input="(v) => (row.word = v)"
                />
              </template>
            </el-table-column>
            <el-table-column label="匹配类型" width="120">
              <template #default="{ row }">
                <el-select v-model="row.match_type" class="kw-cell-select" size="small">
                  <el-option v-for="o in ENUMS.matchType" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="出价" width="120">
              <template #default="{ row }">
                <el-input
                  :model-value="row.bid"
                  placeholder="0.2~999.0"
                  size="small"
                  class="kw-cell-input"
                  @input="(v) => (row.bid = toBidStr(v))"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeRow($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-button size="small" class="kw-add" @click="addRow">添加关键词</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ENUMS, getBatchOpConfig } from '@/api/oceanengine';
import { openapiDb } from '@/mock/data';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改搜索快投关键词';

/** 关键词行（每个项目一行，可继续追加关键词行） */
const rows = ref([]);

/** 已选中的项目数 */
const projectCount = computed(() => (props.projects || []).filter((p) => !p.__total).length);

/** 匹配类型兜底：mock 数据里的 EXACT 对应精确匹配 */
function normMatchType(v) {
  if (v === 'EXACT') return 'PRECISION';
  return ENUMS.matchType.some((o) => o.value === v) ? v : 'EXTENSIVE';
}

/** 项目原关键词（mock：取关键词库，按项目顺序轮询） */
function originKeyword(i) {
  const lib = openapiDb.keywords || [];
  return lib.length ? lib[i % lib.length] : null;
}

function init() {
  const list = (props.projects || []).filter((p) => !p.__total);
  rows.value = list.map((p, i) => {
    const o = originKeyword(i);
    return {
      key: `kw-${p.id}`,
      pid: p.campaign_id || p.id,
      name: p.name,
      // 原关键词（只读展示）
      originWord: o ? o.word : '',
      // 新关键词（待填写）
      word: '',
      match_type: 'EXTENSIVE',
      bid: '',
    };
  });
}

/** 出价输入：只保留数字与小数点（最多 1 位小数） */
function toBidStr(v) {
  let s = String(v == null ? '' : v).replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    const int = s.slice(0, dot);
    const dec = s.slice(dot + 1).replace(/\./g, '').slice(0, 1);
    s = dec ? `${int}.${dec}` : `${int}.`;
  }
  if (s.startsWith('.')) s = `0${s}`;
  return s;
}

/** 添加一行关键词（归属与上一行相同的项目） */
function addRow() {
  const last = rows.value[rows.value.length - 1];
  rows.value.push({
    key: `kw-new-${Date.now()}-${rows.value.length}`,
    pid: last ? last.pid : '',
    name: last ? last.name : '',
    originWord: '',
    word: '',
    match_type: 'EXTENSIVE',
    bid: '',
  });
}

/** 删除一行关键词 */
function removeRow(i) {
  rows.value.splice(i, 1);
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  // 只提交填写了关键词的行
  const filled = rows.value.filter((r) => (r.word || '').trim() !== '');
  if (!filled.length) {
    ElMessage.warning('请输入关键词');
    return;
  }
  const bad = filled.find((r) => {
    const b = Number(r.bid);
    return r.bid === '' || !(b >= 0.2 && b <= 999);
  });
  if (bad) {
    ElMessage.warning('请输入正确的出价（取值范围 0.2~999.0）');
    return;
  }
  const form = {
    keywords: filled.map((r) => ({
      project_id: r.pid,
      word: r.word.trim(),
      match_type: r.match_type,
      bid: r.bid,
    })),
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(props.projects || [], form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  const projectNum = new Set(filled.map((r) => r.pid)).size;
  ElMessage.success(`原型：已提交批量修改搜索快投关键词任务（${projectNum} 个项目，${filled.length} 个关键词）`);
  emit('confirm', { op: OP, rows: filled, form, payload });
  close();
}
</script>

<style scoped>
.kw-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 12px;
  font-size: 14px;
  color: #606266;
}

/* 已选中项目数 */
.kw-desc { margin-bottom: 16px; font-size: 14px; color: #606266; }

/* 表单行：标签 150px（与其他批量弹窗一致） */
.kw-item { display: flex; align-items: flex-start; }
.kw-label { flex: none; width: 150px; font-size: 14px; line-height: 32px; color: #666; text-align: right; padding-right: 12px; }
.kw-content { flex: 1; min-width: 0; }

/* 关键词表格（与线上一致：表头 48px / 行高 48px / 边框 #ebeef5） */
.kw-table { --el-table-border-color: #ebeef5; --el-table-header-text-color: #333; width: 100%; }
.kw-table :deep(.el-table__header-wrapper th.el-table__cell) { height: 48px; padding: 0; background: #fff; }
.kw-table :deep(.el-table__body-wrapper td.el-table__cell) { height: 48px; padding: 5.5px 0; }
.kw-table :deep(th.el-table__cell .cell) { font-size: 12px; font-weight: 700; color: #333; }
.kw-table :deep(td.el-table__cell .cell) { font-size: 12px; line-height: 18px; color: #333; }

/* 项目名称单元格：名称 + 项目ID */
.kw-cell { min-width: 0; }
.kw-cell-title { font-size: 12px; line-height: 16px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kw-cell-desc { font-size: 11px; line-height: 14px; color: #86909c; }

/* 原关键词（只读） */
.kw-origin { font-size: 12px; color: #4e5969; word-break: break-all; }

/* 单元格内的输入框 / 下拉（占满单元格，32px 高） */
.kw-cell-input { width: 100%; --el-input-height: 32px; }
.kw-cell-select { width: 100%; --el-select-height: 32px; }

/* 「添加关键词」按钮 */
.kw-add { margin-top: 12px; }
</style>

<style>
/* 弹窗外壳：与线上一致（标题 16px 700 #333 / body 20px 24px） */
.kw-dialog { padding: 0; }
.kw-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.kw-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.kw-dialog .el-dialog__body { padding: 20px 24px; }
.kw-dialog .el-dialog__footer { padding: 0 24px 20px; }
.kw-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.kw-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 小尺寸按钮统一 32px（EP 的 small 为 24px，线上为 32px） */
.kw-dialog .el-button--small { height: 32px; }

/* 页脚主按钮配色与线上一致 */
.kw-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.kw-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 页脚次按钮（线上边框 #d0d0d0） */
.kw-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
</style>
