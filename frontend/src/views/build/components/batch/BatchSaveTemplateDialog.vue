<template>
  <!-- 产品卖点 ·「保存为模板」弹窗（对齐线上截图）
       * 318×，标题「保存为模板」
       * 模板名称（必填 + 红星）+ 输入框 placeholder「产品卖点模板」 -->
  <el-dialog
    :model-value="modelValue"
    title="保存为模板"
    width="318px"
    class="svt-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="name = ''"
  >
    <div class="svt">
      <div class="svt__label">模板名称<i class="svt__req">*</i></div>
      <el-input v-model="name" size="small" class="svt__input" maxlength="20" placeholder="产品卖点模板" />
    </div>

    <template #footer>
      <el-button class="svt-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="svt-btn svt-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

const name = ref('');

function onConfirm() {
  if (!name.value.trim()) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  emit('confirm', name.value.trim());
  ElMessage.success(`已保存为模板「${name.value.trim()}」`);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.svt__label {
  margin-bottom: 8px;
  font-size: 13px;
  color: #1d2129;
}
.svt__req {
  margin-left: 2px;
  font-style: normal;
  color: #f53f3f;
}
.svt__input {
  width: 100%;
}
.svt-btn {
  width: 68px;
  height: 32px;
  font-size: 14px;
  border-color: #d9dbe1;
  color: #1d2129;
}
.svt-btn--primary {
  background: #197afb;
  border-color: #197afb;
  color: #fff;
}
.svt-btn--primary:hover {
  background: #4a95fc;
  border-color: #4a95fc;
  color: #fff;
}
</style>
