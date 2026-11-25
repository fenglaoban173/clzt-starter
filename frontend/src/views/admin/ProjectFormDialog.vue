<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="992px"
    class="pj-dialog"
    append-to-body
    :close-on-click-modal="false"
    @update:model-value="onVisibleChange"
  >
    <div class="pj-body">
      <!-- ① 基本信息（线上 label 宽 136px，内容 margin-left 136px） -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="136px"
        size="small"
        class="pj-form"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" class="pj-input" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入项目备注"
            class="pj-textarea"
            :rows="3"
            resize="none"
          />
        </el-form-item>

        <el-form-item label="项目负责人" prop="owner">
          <el-select
            v-model="form.owner"
            placeholder="请选择项目负责人"
            class="pj-select"
            filterable
          >
            <el-option v-for="n in OWNER_OPTIONS" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目成员" prop="visibility">
          <el-radio-group v-model="form.visibility" class="pj-radio">
            <el-radio-button value="all">所有人可见</el-radio-button>
            <el-radio-button value="visible">指定人员可见</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- ② 防出错设置 -->
      <p class="pj-block-title">
        防出错设置
        <el-tooltip content="设置后，投放该项目对应转化目标的出价将受到限制" placement="top">
          <span class="pj-qmark">?</span>
        </el-tooltip>
      </p>

      <div class="pj-media-tabs">
        <button
          v-for="m in MEDIA_TABS"
          :key="m"
          type="button"
          class="pj-media-tab"
          :class="{ active: m === activeMedia }"
          @click="activeMedia = m"
        >{{ m }}</button>
      </div>

      <div class="pj-pane">
        <el-alert
          class="pj-alert"
          type="warning"
          :closable="false"
          show-icon
          title="智擎版本竞价策略仅支持稳定成本-常规版和最大转化"
        />

        <div class="pj-hold">暂无数据</div>

        <div class="pj-addnew"><el-icon><Plus /></el-icon> 新增规则</div>

        <div class="pj-check-row">
          <el-tooltip content="必须设置至少一个防出错规则，才能勾选此选项" placement="top">
            <el-checkbox disabled class="pj-check">禁用规则外分支</el-checkbox>
          </el-tooltip>
          <el-tooltip content="勾选后，该项目只能投放已设置的优化目标/深度优化目标/竞价策略" placement="top">
            <span class="pj-qmark">?</span>
          </el-tooltip>
        </div>

        <div class="pj-deep">
          <label class="pj-deep__label">深度优化方式必填</label>
          <el-switch v-model="form.deepRequired" class="pj-switch" />
          <el-tooltip content="开启后，新建广告时必须选择深度优化目标" placement="top">
            <span class="pj-qmark">?</span>
          </el-tooltip>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer pj-footer">
        <el-button size="small" plain @click="close">取消</el-button>
        <el-button size="small" type="primary" @click="submit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 智投项目 —— 新增 / 编辑项目弹窗（线上「创量项目管理 → 新增项目」）
 * 线上：https://cl.mobgi.com/setting/cl-project/project-manage
 *
 * 线上实测（1920×1080）：
 *   弹窗 rect 992×725（x=464 y=178），标题「新增项目」
 *   header 51px / body 600px（可滚动）/ footer 74px
 *   表单 label 宽 136px（x=496），控件 margin-left 136px（x=632）
 *     项目名称  input  360×33  placeholder 请输入项目名称
 *     备注      textarea 360×64 placeholder 请输入项目备注
 *     项目负责人 select  173×33 placeholder 请选择项目负责人（可搜索）
 *     项目成员  radio   183×32 默认 all（所有人可见）
 *   防出错设置：8 个媒体页签 + 告警条 + 暂无数据 + 新增规则 + 禁用规则外分支 + 深度优化方式必填
 *   底部：取消（plain）/ 确 定（primary），均 120×32
 * ------------------------------------------------------------------ */
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

/** 线上「项目负责人」下拉（38 项，实测自线上 DOM，顺序照抄） */
const OWNER_OPTIONS = [
  '李倩', '武文琦', '刘松涵', '吕瑶', '申旭阳', '裴心怡', '刘望', '李玉玲',
  '冯逸', '杜浩', '刘欢', '田博文', '汪玲丽', '邓艺爽', '张瑞凯', '王研',
  '张浩', '黄莹曦', '翟子涵', '倪秀云', '张从浩', '王春雷', '郭峻宇', '孙诗源',
  'gongwenqing', 'lixue', 'jiangxin', '1944364300', 'lk18067488517',
  '北京央广时代文化传播有限公司', '李坤洪 17790290399 likunhong', 'chenpeihua',
  '1304275504', '文清滨', '李若涵', '杨浩蒙', '李崇霄', '邹镇泽',
];

/** 防出错设置的媒体页签（线上原文，顺序照抄） */
const MEDIA_TABS = [
  '巨量广告', '腾讯广告', '磁力智投', '百度信息流',
  '磁力金牛(新版)', '巨量本地推', '百度电商', 'B站营销',
];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 新增 / 编辑 */
  mode: { type: String, default: 'add' },
  /** 编辑时回填的行 */
  row: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const title = computed(() => (props.mode === 'edit' ? '编辑项目' : '新增项目'));

const formRef = ref(null);
const activeMedia = ref('巨量广告');

const form = reactive({
  name: '',
  remark: '',
  owner: '',
  visibility: 'all',
  deepRequired: false,
});

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
};

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    if (props.mode === 'edit' && props.row) {
      form.name = props.row.name || '';
      form.remark = props.row.remark || '';
      form.owner = props.row.owner || '';
      form.visibility = props.row.visibility || 'all';
      form.deepRequired = !!props.row.deepRequired;
    } else {
      form.name = '';
      form.remark = '';
      form.owner = '';
      form.visibility = 'all';
      form.deepRequired = false;
    }
    activeMedia.value = '巨量广告';
  }
);

function onVisibleChange(v) {
  emit('update:modelValue', v);
}

function close() {
  emit('update:modelValue', false);
}

function submit() {
  formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请输入项目名称');
      return;
    }
    emit('submit', {
      name: form.name.trim(),
      remark: form.remark.trim(),
      owner: form.owner,
      visibility: form.visibility,
      deepRequired: form.deepRequired,
    });
  });
}
</script>

<style scoped>
/* ---------- 弹窗内部（随组件 teleport 走，父级样式不污染） ---------- */
.pj-form :deep(.el-form-item) { margin-bottom: 24px; }
.pj-form :deep(.el-form-item__label) {
  justify-content: flex-start;
  font-size: 14px;
  color: #333;
  line-height: 32px;
  padding-right: 0;
}
/* 线上必填项没有红色星号（label 文字直接贴左） */
.pj-form :deep(.el-form-item.is-required > .el-form-item__label::before) { display: none; }
/* 线上控件高度：input/select 33px、textarea 64px、radio 32px */
.pj-input { width: 360px; }
.pj-input :deep(.el-input__wrapper) { height: 31px; min-height: 31px; font-size: 13px; }
.pj-input :deep(.el-input__inner) { font-size: 13px; }
.pj-textarea { width: 360px; }
.pj-textarea :deep(.el-textarea__inner) { height: 64px; min-height: 64px; font-size: 13px; }
.pj-select { width: 173px; }
.pj-select :deep(.el-select__wrapper) { height: 33px; min-height: 33px; font-size: 13px; }
.pj-select :deep(.el-select__placeholder),
.pj-select :deep(.el-select__selected-item) { font-size: 13px; }
/* 线上单选按钮组：选中态浅蓝底 + 蓝框蓝字（EP2 默认是实心蓝底白字） */
.pj-radio :deep(.el-radio-button__inner) {
  padding: 8px 7px;
  font-size: 14px;
  line-height: 14px;
  height: 32px;
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
  box-shadow: none;
}
.pj-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #d6eaff;
  border-color: #197afb;
  color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}

.pj-block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0 20px;
  font-size: 14px;
  color: #333;
}

.pj-media-tabs {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #e8eaec;
  height: 40px;
}
.pj-media-tab {
  height: 40px;
  padding: 0 15px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}
.pj-media-tab:hover { color: #197afb; }
.pj-media-tab.active { color: #197afb; border-bottom-color: #197afb; }

.pj-pane { padding-top: 15px; }

.pj-alert :deep(.el-alert__title) { font-size: 14px; }

.pj-hold {
  padding: 38px 0;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

.pj-addnew {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  border: 1px dashed #dcdfe6;
  border-radius: 3px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}
.pj-addnew:hover { color: #197afb; border-color: #197afb; }

.pj-check-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
}
.pj-check :deep(.el-checkbox__label) { font-size: 14px; color: #c0c4cc; }

.pj-deep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.pj-deep__label { font-size: 14px; color: #333; margin-right: 16px; }

/* 线上问号图标：圆形描边 + ? */
.pj-qmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: 1px solid #c0c4cc;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  color: #909399;
  flex: none;
}
</style>

<style>
/* 弹窗外壳：el-dialog 会被 teleport 到 body，内部元素拿不到父组件的 scope id，
 * 故这里用非 scoped 样式（类名 pj-dialog / pj-switch 均为本页私有）。 */
.pj-dialog {
  width: 992px;
  height: 725px;
  /* 线上：margin-top 15vh，但弹窗在页面内整体下移 16px（实测 y=178） */
  margin-top: calc(15vh + 16px);
  padding: 0;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}
.pj-dialog .el-dialog__header {
  flex: none;
  padding: 16px 32px 12px;
  border-bottom: 1px solid #e8eaec;
}
.pj-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 22px; }
.pj-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px;
}
.pj-dialog .el-dialog__footer {
  flex: none;
  padding: 12px 32px 30px;
  border-top: 1px solid #e8eaec;
}
.pj-dialog .el-dialog__footer .el-button { width: 120px; height: 32px; }
.pj-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 线上开关实测 32×16（EP 默认 40×20） */
.pj-switch.el-switch { height: 16px; }
.pj-switch .el-switch__core { min-width: 32px; width: 32px; height: 16px; border-radius: 8px; }
.pj-switch .el-switch__core .el-switch__inner { height: 12px; padding: 0 2px 0 14px; }
.pj-switch .el-switch__core .el-switch__action { width: 12px; height: 12px; }
.pj-switch.el-switch.is-checked .el-switch__core .el-switch__action { left: calc(100% - 13px); }
.pj-switch.el-switch.is-checked .el-switch__core .el-switch__inner { padding: 0 14px 0 2px; }
</style>
