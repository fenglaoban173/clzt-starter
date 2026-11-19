<template>
  <el-dialog
    :model-value="modelValue"
    title="修改定向"
    width="560px"
    class="ptg-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="ptg-body">
      <div class="ptg-count">已选中{{ rows.length }}条可操作项目</div>

      <!-- 覆盖式修改提示 -->
      <div class="ptg-warn">
        <span class="ptg-warn-icon">!</span>
        <div class="ptg-warn-body">
          <p>
            1) 项目定向修改为覆盖式修改，确认修改后将会把项目中的定向内容改为所选定向包内容，且定向与项目原有关联关系将解绑，请注意操作。
          </p>
          <p>
            2) 自动投放模式下，定向内容仅支持地域、性别、年龄、自定义人群、平台版本、已安装用户、过滤已转化用户、过滤时间，销售线索下额外支持：行为兴趣、过滤高活跃用户、过滤自己粉丝、过滤高关注用户、网络、手机价格，快应用下额外支持：手机品牌，其他内容设置不生效。
          </p>
        </div>
      </div>

      <el-form label-width="110px" label-position="left" class="ptg-form">
        <!-- 使用运营商定向 -->
        <el-form-item label="使用运营商定向">
          <el-radio-group v-model="carrier" size="small" class="ptg-radio">
            <el-radio-button border :value="0">不使用</el-radio-button>
            <el-radio-button border :value="1">使用</el-radio-button>
          </el-radio-group>
          <span class="ptg-tip"><span class="ptg-tip-icon">!</span>运营商定向仅对通信行业有效</span>
        </el-form-item>

        <!-- 修改后定向 -->
        <el-form-item label="修改后定向">
          <el-select v-model="packageId" placeholder="请输入定向包名称" class="ptg-select">
            <el-option v-for="o in packages" :key="o.id" :label="o.name" :value="o.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :disabled="!packageId" @click="confirm">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';
import { mockDb } from '@/mock/data';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改定向包';

// 定向包候选项（资产域「定向包」）
const packages = mockDb.orientationPackages || [];

// 0 不使用 / 1 使用（默认不使用，与线上一致）
const carrier = ref(0);
// 选中的定向包 ID
const packageId = ref('');

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

function init() {
  carrier.value = 0;
  packageId.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = { audience_package_id: packageId.value };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  if (payload && payload.audience) {
    payload.audience.is_use_carrier = carrier.value;
  }
  const name = (packages.find((p) => p.id === packageId.value) || {}).name || '';
  ElMessage.success(
    `原型：已提交批量修改定向任务（${rows.value.length} 个项目，定向包：${name}，运营商定向：${
      carrier.value ? '使用' : '不使用'
    }）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.ptg-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.ptg-count { font-size: 14px; color: #606266; }

/* 覆盖式修改提示 */
.ptg-warn { display: flex; align-items: flex-start; gap: 8px; margin: 16px 0; }
.ptg-warn-icon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 4px;
  border-radius: 50%;
  background: #ff9b48;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
}
.ptg-warn-body { min-width: 0; }
.ptg-warn-body p { margin: 0 0 12px; font-size: 14px; line-height: 22px; color: #666; }
.ptg-warn-body p:last-child { margin-bottom: 0; }

.ptg-form :deep(.el-form-item) { margin-bottom: 20px; }
.ptg-form :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.ptg-form :deep(.el-form-item__content) { display: flex; align-items: center; gap: 12px; }

/* 不使用 / 使用（选中为蓝字 + 浅蓝底 + 蓝框，80×32） */
.ptg-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #333;
  background: #fff;
  border-color: #dcdfe6;
  box-shadow: none;
}
.ptg-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
.ptg-radio :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.ptg-radio :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }

/* 橙色提示 */
.ptg-tip { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; color: #ff9b48; }
.ptg-tip-icon {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff9b48;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
}

.ptg-select { flex: none; width: 360px; }
.ptg-select :deep(.el-select__wrapper) { border-radius: 2px; }
.ptg-select :deep(.el-select__placeholder),
.ptg-select :deep(.el-select__input) { font-size: 13px; }
</style>

<style>
/* 弹窗外壳：与线上一致（560px 弹窗 / 标题 16px 700 #333 / body 24px 32px） */
.ptg-dialog { padding: 0; }
.ptg-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; border-bottom: 1px solid #e5e6eb; }
.ptg-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.ptg-dialog .el-dialog__body { padding: 24px 32px; }
.ptg-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e5e6eb; }
.ptg-dialog .el-dialog__footer .el-button { width: 120px; }
</style>
