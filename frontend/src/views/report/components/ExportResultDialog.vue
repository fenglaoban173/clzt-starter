<template>
  <!-- 「导出数据」结果提示 —— 1:1 复刻创量线上
   *   1) 通用：MessageBox「任务创建成功，请前往工具—下载中心查看详情」+ 确定
   *   2) 素材报表：Dialog「提示」——「请选择素材预览地址的来源：」+ 单选 本地缓存/实时获取
   *      + 说明「读取本地已缓存的预览地址进行导出,效率高推荐使用;但可能存在预览地址失效或缺失的情况」
   *      + 「注意:图文素材的预览地址仅支持通过实时获取导出」+ 按钮 取 消 / 确 定
   -->
  <el-dialog
    v-if="mode === 'material'"
    v-model="inner"
    title="提示"
    width="520px"
    append-to-body
    class="export-material-dialog"
    @closed="closeAll"
  >
    <div class="em-body">
      <div class="em-label">请选择素材预览地址的来源：</div>
      <el-radio-group v-model="source" class="em-radios">
        <el-radio value="cache">本地缓存</el-radio>
        <el-radio value="live">实时获取</el-radio>
      </el-radio-group>
      <div class="em-tip">
        读取本地已缓存的预览地址进行导出,效率高推荐使用;但可能存在预览地址失效或缺失的情况
      </div>
      <div class="em-tip">注意:图文素材的预览地址仅支持通过实时获取导出</div>
    </div>
    <template #footer>
      <el-button @click="inner = false">取 消</el-button>
      <el-button type="primary" @click="confirmMaterial">确 定</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-else
    v-model="inner"
    title="提示"
    width="420px"
    append-to-body
    class="export-task-dialog"
    @closed="closeAll"
  >
    <div class="et-body">任务创建成功，请前往工具—下载中心查看详情</div>
    <template #footer>
      <el-button type="primary" @click="inner = false">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 'default' = 任务创建成功提示框；'material' = 素材预览地址来源弹窗
  mode: { type: String, default: 'default' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const inner = ref(false);
const source = ref('cache');

watch(
  () => props.modelValue,
  (v) => {
    inner.value = v;
    if (v) source.value = 'cache';
  }
);

function confirmMaterial() {
  emit('confirm', { source: source.value });
  inner.value = false;
}

function closeAll() {
  emit('update:modelValue', false);
}
</script>

<style>
.export-material-dialog .el-dialog { border-radius: 4px; }
.export-material-dialog .el-dialog__title { font-size: 16px; font-weight: 500; color: #333333; }
.export-material-dialog .el-dialog__body { padding: 20px 24px; }
.export-material-dialog .el-dialog__footer { padding: 12px 24px 20px; }
.em-body { font-size: 14px; color: #333333; line-height: 1.8; }
.em-label { margin-bottom: 8px; }
.em-radios { display: flex; gap: 24px; margin-bottom: 10px; }
.em-radios .el-radio__label { font-size: 14px; color: #333333; }
.em-tip { font-size: 13px; color: #909399; line-height: 1.8; }

.export-task-dialog .el-dialog { border-radius: 4px; }
.export-task-dialog .el-dialog__title { font-size: 16px; font-weight: 500; color: #333333; }
.export-task-dialog .el-dialog__body { padding: 20px 24px; }
.et-body { font-size: 14px; color: #333333; }
</style>
