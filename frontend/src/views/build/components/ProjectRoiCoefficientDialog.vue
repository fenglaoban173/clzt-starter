<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改ROI系数"
    width="820px"
    align-center
    class="roi-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="roi-body">
      <div class="roi-desc">已选中 {{ rows.length }} 个项目</div>

      <!-- 项目列表：左侧项目名称，右侧 ROI 系数输入框（每个项目单独设置） -->
      <el-table :data="rows" border size="small" class="roi-table" max-height="400">
        <el-table-column label="项目名称" min-width="400">
          <template #default="{ row }">
            <div class="roi-cell">
              <div class="roi-cell-title" :title="row.name">{{ row.name }}</div>
              <div class="roi-cell-desc">项目ID：{{ row.pid }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="ROI系数" width="260">
          <template #default="{ row }">
            <el-input
              :model-value="row.roi_goal"
              placeholder="请输入ROI系数"
              size="small"
              class="roi-cell-input"
              @input="(v) => (row.roi_goal = toRoiStr(v))"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改ROI系数';

/** 已勾选项目（每个项目一行，行内单独填写 ROI 系数） */
const rows = ref([]);

function init() {
  const list = (props.projects || []).filter((p) => !p.__total);
  rows.value = list.map((p) => ({
    id: p.id,
    pid: p.campaign_id || p.id,
    name: p.name,
    roi_goal: '',
  }));
}

/** ROI 系数输入：仅保留数字与小数点，最多 4 位小数 */
function toRoiStr(v) {
  let s = String(v == null ? '' : v).replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    const int = s.slice(0, dot);
    const dec = s.slice(dot + 1).replace(/\./g, '').slice(0, 4);
    s = dec ? `${int}.${dec}` : `${int}.`;
  }
  if (s.startsWith('.')) s = `0${s}`;
  return s;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  // 仅提交填写了 ROI 系数的项目
  const filled = rows.value.filter((r) => r.roi_goal !== '' && r.roi_goal != null);
  if (!filled.length) {
    ElMessage.warning('请输入ROI系数');
    return;
  }
  const bad = filled.find((r) => {
    const v = Number(r.roi_goal);
    return !(v > 0) || v > 100;
  });
  if (bad) {
    ElMessage.warning('请输入正确的ROI系数（取值范围 0.01~100）');
    return;
  }
  const form = { roi_goal: filled[0].roi_goal };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(filled.map((r) => ({ ...r })), form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交批量修改ROI系数任务（${filled.length} 个项目）`);
  emit('confirm', { op: OP, rows: filled, form, payload });
  close();
}
</script>

<style scoped>
.roi-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 12px;
  font-size: 14px;
  color: #606266;
}

/* 已选中项目数 */
.roi-desc { margin-bottom: 16px; font-size: 14px; color: #606266; }

/* 项目列表（与「素材一键起量」一致：表头 48px / 行高 48px / 边框 #ebeef5） */
.roi-table { --el-table-border-color: #ebeef5; --el-table-header-text-color: #333; width: 100%; }
.roi-table :deep(.el-table__header-wrapper th.el-table__cell) { height: 48px; padding: 0; background: #fff; }
.roi-table :deep(.el-table__body-wrapper td.el-table__cell) { height: 48px; padding: 5.5px 0; }
.roi-table :deep(th.el-table__cell .cell) { font-size: 12px; font-weight: 700; color: #333; }
.roi-table :deep(td.el-table__cell .cell) { font-size: 12px; line-height: 18px; color: #333; }

/* 单元格内的项目名称 / 项目ID */
.roi-cell-title { font-size: 12px; line-height: 18px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roi-cell-desc { font-size: 12px; line-height: 18px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 单元格内的 ROI 系数输入框（占满单元格，32px 高） */
.roi-cell-input { width: 100%; --el-input-height: 32px; }
</style>

<style>
/* 弹窗外壳：与线上一致（820px 弹窗 / 标题 16px 700 #333 / body 20px 24px） */
.roi-dialog { padding: 0; }
.roi-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.roi-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.roi-dialog .el-dialog__body { padding: 20px 24px; }
.roi-dialog .el-dialog__footer { padding: 0 24px 20px; }
.roi-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.roi-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 小尺寸按钮统一 32px（EP 的 small 为 24px，线上为 32px） */
.roi-dialog .el-button--small { height: 32px; }

/* 页脚主按钮配色与线上一致 */
.roi-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.roi-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 页脚次按钮（线上边框 #d0d0d0） */
.roi-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
</style>
