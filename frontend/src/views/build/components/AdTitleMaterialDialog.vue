<template>
  <el-dialog
    :model-value="modelValue"
    title="修改广告标题和素材"
    width="1380px"
    top="6vh"
    class="atm-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="atm-body">
      <!-- 已选广告数 -->
      <div class="atm-desc">已选中{{ rows.length }}个广告</div>

      <!-- 修改创意标题 -->
      <div class="atm-row">
        <span class="atm-label">修改创意标题</span>
        <div class="atm-content">
          <el-radio-group v-model="titleMode" class="atm-radio">
            <el-radio-button value="off">不启用</el-radio-button>
            <el-radio-button value="on">启用</el-radio-button>
          </el-radio-group>
          <p class="atm-tip">启用修改后，会将所有广告的标题全部覆盖修改为选中文案,请你注意操作!</p>
        </div>
      </div>

      <!-- 创意标题 -->
      <div v-if="titleMode === 'on'" class="atm-row">
        <span class="atm-label">创意标题</span>
        <div class="atm-content">
          <div class="atm-title-box">
            <div class="atm-title-line">
              <el-button size="small" class="atm-btn" @click="libVisible = true">选择标题</el-button>
              <span class="atm-count">已选: {{ titles.length }}/10</span>
            </div>
            <div v-if="titles.length" class="atm-tags">
              <span v-for="(t, i) in titles" :key="t.id + i" class="atm-tag">
                <span class="atm-tag-text">{{ t.text }}</span>
                <span class="atm-tag-len">{{ titleLen(t.text) }}/55</span>
                <el-icon class="atm-tag-x" @click="removeTitle(i)"><Close /></el-icon>
              </span>
            </div>
            <div class="atm-link-row">
              <a class="atm-link atm-link-add" @click="wordpackVisible = true">+ 插入动态词包</a>
            </div>
            <el-button class="atm-add-text" @click="openAddText">+ 点击添加文案</el-button>
          </div>
        </div>
      </div>

      <!-- 修改创意素材 -->
      <div class="atm-row">
        <span class="atm-label">修改创意素材</span>
        <div class="atm-content">
          <el-radio-group v-model="materialMode" class="atm-radio">
            <el-radio-button value="off">不启用</el-radio-button>
            <el-radio-button value="on">启用</el-radio-button>
          </el-radio-group>
          <p class="atm-tip">1)启用修改后,会将所有广告的素材全部覆盖修改为选中素材内容,请您注意操作;</p>
          <p class="atm-tip">2)当你选择的广告包含手动投放时,则广告素材最多只能选择10个视频+10个图片,否则将会报错。</p>
        </div>
      </div>

      <!-- 选择素材 -->
      <div v-if="materialMode === 'on'" class="atm-row">
        <span class="atm-label">选择素材</span>
        <div class="atm-content">
          <div class="atm-line">
            <span class="atm-line-label">视频上传至</span>
            <el-radio-group v-model="uploadScope" class="atm-radio atm-radio-sm">
              <el-radio-button value="org">升级版工作台组织</el-radio-button>
              <el-radio-button value="adv">广告主账户</el-radio-button>
            </el-radio-group>
          </div>

          <div class="atm-line">
            <span class="atm-line-label atm-required">*组织账户</span>
            <el-select v-model="orgAccount" class="atm-select" placeholder="请选择组织账户">
              <el-option
                v-for="o in ORG_ACCOUNTS"
                :key="o.id"
                :label="o.name"
                :value="o.id"
                :disabled="o.disabled"
              />
            </el-select>
          </div>

          <div class="atm-alert">
            <el-icon class="atm-alert-icon"><WarningFilled /></el-icon>
            <span>请在升级版工作台 素材-视频管理处操作共享，避免组织下账户无法使用。</span>
            <a class="atm-link" @click="onDoc">如图所示</a>
          </div>

          <div class="atm-line atm-line-doc">
            <span>若企业内无组织账户，请</span>
            <a class="atm-link" @click="onDoc">阅读文档</a>
            <span>操作</span>
          </div>

          <!-- 视频 / 图片素材区 -->
          <div class="atm-mat">
            <div class="atm-mat-head">
              <div class="atm-tabs">
                <span
                  class="atm-tab"
                  :class="{ active: matTab === 'video' }"
                  @click="matTab = 'video'"
                >视频 ({{ videos.length }}/50)</span>
                <span
                  class="atm-tab"
                  :class="{ active: matTab === 'image' }"
                  @click="matTab = 'image'"
                >图片 ({{ images.length }}/50)</span>
              </div>
              <el-button class="atm-add-mat" @click="materialVisible = true">+ 添加素材</el-button>
            </div>
            <div class="atm-mat-body">
              <div class="atm-upload">
                <el-icon class="atm-upload-plus"><Plus /></el-icon>
              </div>
              <div class="atm-mat-list">
                <div v-for="(m, i) in currentMaterials" :key="m.id" class="atm-mat-item">
                  <span class="atm-mat-name">{{ m.name }}</span>
                  <el-icon class="atm-mat-x" @click="removeMaterial(i)"><Close /></el-icon>
                </div>
                <p v-if="!currentMaterials.length" class="atm-empty">暂无素材，点击右上角「+ 添加素材」选择</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>

    <!-- 标题库 -->
    <AdTitleLibraryDialog
      v-model="libVisible"
      :selected="titles"
      @confirm="onLibraryConfirm"
    />

    <!-- 添加文案 -->
    <AdTitleEditorDialog
      v-model="editorVisible"
      mode="plain"
      @confirm="onAddText"
      @wordpack="wordpackVisible = true"
    />

    <!-- 公共词包 -->
    <AdWordPackDialog v-model="wordpackVisible" @insert="onWordPackInsert" />

    <!-- 素材库选择 -->
    <MaterialPickerDialog
      v-model="materialVisible"
      :selected-ids="currentMaterials.map((m) => m.id)"
      @submit="onMaterialSubmit"
    />
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Plus, WarningFilled } from '@element-plus/icons-vue';
import { getBatchOpConfig } from '@/api/oceanengine';
import AdTitleLibraryDialog from './AdTitleLibraryDialog.vue';
import AdTitleEditorDialog from './AdTitleEditorDialog.vue';
import AdWordPackDialog from './AdWordPackDialog.vue';
import MaterialPickerDialog from './MaterialPickerDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改广告标题和素材';

/** 组织账户（线上「*组织账户」下拉，含一个未授权的禁用项） */
const ORG_ACCOUNTS = [
  { id: 'ORG1', name: '央广-红果-自负号视频测试(1875926220134858)' },
  { id: 'ORG2', name: '央广漫剧R3(1875663344111624)' },
  { id: 'ORG3', name: '央广时代(187399327613259)' },
  { id: 'ORG4', name: '代理央广时代(1873760026148729)' },
  { id: 'ORG5', name: 'AI漫剧创作神器(1873213540521355)', disabled: true },
  { id: 'ORG6', name: '代理liuruohan(1868766420037641)' },
  { id: 'ORG7', name: 'chenpeihua代理(1867598694132745)' },
  { id: 'ORG8', name: '代理liuziyuan01(1866418182194377)' },
];

const rows = computed(() => (props.rows || []).filter((r) => !r.__summary));

/** 修改创意标题：不启用 / 启用 */
const titleMode = ref('on');
/** 已选创意标题 */
const titles = ref([]);
/** 修改创意素材：不启用 / 启用 */
const materialMode = ref('on');
/** 视频上传至：org 升级版工作台组织 / adv 广告主账户 */
const uploadScope = ref('org');
/** 组织账户 */
const orgAccount = ref('ORG1');
/** 素材页签：video / image */
const matTab = ref('video');
/** 已选视频 / 图片素材 */
const videos = ref([]);
const images = ref([]);

const libVisible = ref(false);
const editorVisible = ref(false);
const wordpackVisible = ref(false);
const materialVisible = ref(false);

const currentMaterials = computed(() => (matTab.value === 'video' ? videos.value : images.value));

// 线上：切到「不启用」会清空已选项，再次「启用」时已选回到 0/10
watch(titleMode, () => { titles.value = []; });
watch(materialMode, () => { videos.value = []; images.value = []; });

function init() {
  titleMode.value = 'on';
  titles.value = [];
  materialMode.value = 'on';
  uploadScope.value = 'org';
  orgAccount.value = 'ORG1';
  matTab.value = 'video';
  videos.value = [];
  images.value = [];
}

/** 字数：两个英文字符占 1 字 */
function titleLen(s) {
  let n = 0;
  for (const ch of String(s || '')) n += /[\x00-\xff]/.test(ch) ? 0.5 : 1;
  return Math.floor(n);
}

function removeTitle(i) {
  titles.value = titles.value.filter((_, idx) => idx !== i);
}

function onLibraryConfirm(list) {
  const merged = [...titles.value];
  for (const t of list) {
    if (!merged.some((x) => x.text === t.text)) merged.push(t);
  }
  titles.value = merged.slice(0, 10);
}

function openAddText() {
  editorVisible.value = true;
}

function onAddText({ text }) {
  if (titles.value.length >= 10) {
    ElMessage.warning('标题素材上限 10 个');
    return;
  }
  if (titles.value.some((t) => t.text === text)) return;
  titles.value = [...titles.value, { id: `T${Date.now()}`, text }];
}

function onWordPackInsert(pack) {
  ElMessage.info(`原型：已插入动态词包「${pack.name}」`);
}

function onDoc() {
  ElMessage.info('原型：打开线上文档（升级版工作台 素材-视频管理）');
}

function onMaterialSubmit(picked) {
  const list = picked || [];
  if (matTab.value === 'video') {
    const merged = [...videos.value];
    for (const m of list) if (!merged.some((x) => x.id === m.id)) merged.push(m);
    videos.value = merged.slice(0, 50);
  } else {
    const merged = [...images.value];
    for (const m of list) if (!merged.some((x) => x.id === m.id)) merged.push(m);
    images.value = merged.slice(0, 50);
  }
}

function removeMaterial(i) {
  if (matTab.value === 'video') videos.value = videos.value.filter((_, idx) => idx !== i);
  else images.value = images.value.filter((_, idx) => idx !== i);
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (titleMode.value === 'on' && !titles.value.length) {
    ElMessage.warning('请选择创意标题');
    return;
  }
  if (materialMode.value === 'on' && !videos.value.length && !images.value.length) {
    ElMessage.warning('请选择创意素材');
    return;
  }
  const form = {
    titleMode: titleMode.value === 'on' ? '启用' : '不启用',
    titles: titles.value.map((t) => ({ id: t.id, text: t.text })),
    materialMode: materialMode.value === 'on' ? '启用' : '不启用',
    uploadScope: uploadScope.value === 'org' ? '升级版工作台组织' : '广告主账户',
    orgAccount: orgAccount.value,
    videos: videos.value,
    images: images.value,
  };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交修改广告标题和素材任务（${rows.value.length} 条广告）`);
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.atm-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #606266;
}
.atm-desc { margin-bottom: 18px; font-size: 14px; color: #606266; }

/* 表单行：标签 150px */
.atm-row { display: flex; align-items: flex-start; margin-bottom: 22px; }
.atm-label { flex: none; width: 150px; font-size: 14px; line-height: 32px; color: #666; }
.atm-content { flex: 1; min-width: 0; }

/* 提示文案（12px #999） */
.atm-tip { margin: 6px 0 0; font-size: 12px; line-height: 18px; color: #999; }
.atm-link { color: #197afb; cursor: pointer; font-size: 12px; }
.atm-link-row { margin: 10px 0 12px; }
.atm-link-add { display: inline-block; font-size: 13px; }

/* 创意标题框 */
.atm-title-box { border: 1px solid #e5e7ed; border-radius: 2px; padding: 18px 20px 20px; }
.atm-title-line { display: flex; align-items: center; gap: 24px; }
.atm-count { color: #606266; font-size: 13px; }
.atm-btn { width: 100px; height: 32px; padding: 0; font-size: 12px; }

.atm-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.atm-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 5px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  font-size: 13px;
  color: #333;
}
.atm-tag-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }
.atm-tag-len { color: #c0c4cc; font-size: 12px; }
.atm-tag-x { color: #c0c4cc; cursor: pointer; }
.atm-tag-x:hover { color: #909399; }

.atm-add-text {
  display: block;
  width: 420px;
  height: 34px;
  padding: 0;
  font-size: 13px;
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
}
.atm-add-text:hover { color: #197afb; border-color: #197afb; background: #fff; }

/* 选择素材 */
.atm-line { display: flex; align-items: center; margin-bottom: 14px; }
.atm-line-label { width: 72px; font-size: 14px; color: #666; }
.atm-required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.atm-select { width: 360px; }
.atm-line-doc { font-size: 13px; color: #999; gap: 4px; }

.atm-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 3px;
  background: #fdf6ec;
  color: #e6a23c;
  font-size: 12px;
}
.atm-alert-icon { color: #e6a23c; }
.atm-alert .atm-link { margin-left: 4px; }

/* 素材区 */
.atm-mat { margin-top: 16px; border: 1px solid #e5e7ed; border-radius: 2px; }
.atm-mat-head { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #e5e7ed; }
.atm-tabs { display: flex; gap: 28px; }
.atm-tab { padding: 12px 0; font-size: 14px; color: #606266; cursor: pointer; border-bottom: 2px solid transparent; }
.atm-tab.active { color: #197afb; border-bottom-color: #197afb; }
.atm-add-mat { height: 32px; padding: 0 14px; font-size: 12px; color: #197afb; background: #fff; border-color: #197afb; }
.atm-add-mat:hover { color: #fff; background: #197afb; border-color: #197afb; }

.atm-mat-body { display: flex; gap: 16px; padding: 16px; min-height: 150px; }
.atm-upload {
  flex: none;
  width: 260px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.atm-upload:hover { border-color: #197afb; }
.atm-upload-plus { font-size: 28px; color: #c0c4cc; }
.atm-mat-list { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 8px; }
.atm-mat-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  font-size: 12px;
  color: #333;
}
.atm-mat-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.atm-mat-x { color: #c0c4cc; cursor: pointer; }
.atm-empty { margin: 0; font-size: 13px; color: #c0c4cc; }
</style>

<style>
.atm-dialog { padding: 0; max-width: calc(100vw - 40px); }
.atm-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.atm-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.atm-dialog .el-dialog__body { padding: 20px 32px 8px; max-height: 74vh; overflow-y: auto; }
.atm-dialog .el-dialog__footer { padding: 12px 32px 20px; }
.atm-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.atm-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.atm-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.atm-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
.atm-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
.atm-dialog .el-button--small { height: 32px; }

/* 分段按钮（选中为蓝字 + 浅蓝底 + 蓝框，与线上一致） */
.atm-dialog .atm-radio .el-radio-button__inner {
  min-width: 78px;
  padding: 8px 14px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.atm-dialog .atm-radio .el-radio-button.is-active .el-radio-button__inner {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
.atm-dialog .atm-radio-sm .el-radio-button__inner { min-width: 110px; }
</style>
