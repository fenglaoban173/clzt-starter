<template>
  <el-drawer
    v-model="visible"
    title="添加关键词"
    direction="rtl"
    size="676px"
    class="kw-drawer"
    @closed="onClosed"
  >
    <!-- 顶部提示条 -->
    <div class="kw-note">
      <el-icon class="kw-note__icon"><InfoFilled /></el-icon>
      <span>AD后台会自动过滤计划审核不通过的关键词或低质关键词，如果计划出现关键词规模的情况，请确认这些关键词在AD后台是否可以正常添加。</span>
    </div>

    <!-- 两个页签 -->
    <div class="kw-tabs">
      <span class="kw-tab" :class="{ 'is-on': tab === 'add' }" @click="tab = 'add'">添加关键词</span>
      <span class="kw-tab" :class="{ 'is-on': tab === 'pack' }" @click="tab = 'pack'">选择已有词包</span>
    </div>

    <!-- ── 添加关键词 ── -->
    <div v-if="tab === 'add'" class="kw-pane">
      <div class="kw-top">
        <el-input v-model="keyword" class="kw-top__input" placeholder="请输入关键词" clearable />
        <el-button type="primary" class="kw-top__upload" @click="uploadVisible = true">上传关键词</el-button>
        <span class="kw-sync" @click="onSync"><el-icon><RefreshRight /></el-icon>同步关键词</span>
      </div>

      <div class="kw-cols">
        <div class="kw-list">
          <div class="kw-list__head">
            <span>关键词</span>
            <span class="kw-link" @click="addAll">全部添加</span>
          </div>
          <div class="kw-list__body">
            <div v-for="k in filtered" :key="k" class="kw-row">
              <span class="kw-row__name" :title="k">{{ k }}</span>
              <span v-if="!isPicked(k)" class="kw-link" @click="addOne(k)">添加</span>
            </div>
            <div v-if="!filtered.length" class="kw-empty">
              <div class="kw-empty__img">
                <el-icon><Document /></el-icon>
              </div>
              <span>暂无数据</span>
            </div>
          </div>
        </div>

        <div class="kw-sel">
          <div class="kw-sel__head">
            <span>已选（{{ picked.length }}/{{ limit }}）</span>
          </div>
          <div class="kw-sel__acts">
            <span class="kw-link" @click="matchVisible = true">修改匹配方式</span>
            <span class="kw-link" @click="picked = []">清空</span>
          </div>
          <div class="kw-sel__thead">
            <span class="kw-sel__c1">关键词</span>
            <span class="kw-sel__c2">匹配方式 <el-icon class="kw-info"><QuestionFilled /></el-icon></span>
          </div>
          <div class="kw-sel__body">
            <div v-for="(p, i) in picked" :key="'p' + p" class="kw-sel__row">
              <span class="kw-sel__c1" :title="p">{{ p }}</span>
              <el-select
                :model-value="modeOf(p)"
                size="small"
                class="kw-sel__match"
                popper-class="kw-match-popper"
                @update:model-value="(v) => setMode(p, v)"
              >
                <el-option label="广泛匹配" value="BROAD" />
                <el-option label="短语匹配" value="PHRASE" />
                <el-option label="精确匹配" value="EXACT" />
              </el-select>
              <el-icon class="kw-sel__del" @click="picked.splice(i, 1)"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 选择已有词包 ── -->
    <div v-else class="kw-pane">
      <div class="kw-packdesc">选择该账户已经保存过的关键词包</div>
      <div class="kw-top">
        <el-input v-model="packKeyword" class="kw-top__input" placeholder="请输入关键词">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <span class="kw-sync kw-sync--pack" @click="onSync"><el-icon><RefreshRight /></el-icon>刷新</span>
      </div>
      <div class="kw-cols">
        <div class="kw-list">
          <div class="kw-list__head">
            <span>关键字</span>
          </div>
          <div class="kw-list__body">
            <div class="kw-empty">
              <div class="kw-empty__img">
                <el-icon><Document /></el-icon>
              </div>
              <span>暂无数据</span>
            </div>
          </div>
        </div>
        <div class="kw-sel">
          <div class="kw-sel__head">
            <span>关键词内容（{{ picked.length }}/{{ limit }}）</span>
          </div>
          <div class="kw-sel__acts">
            <span class="kw-link" @click="matchVisible = true">修改匹配方式</span>
            <span class="kw-link" @click="picked = []">清空</span>
          </div>
          <div class="kw-sel__thead">
            <span class="kw-sel__c1">关键词</span>
            <span class="kw-sel__c2">匹配方式 <el-icon class="kw-info"><QuestionFilled /></el-icon></span>
          </div>
          <div class="kw-sel__body">
            <div v-for="(p, i) in picked" :key="'pp' + p" class="kw-sel__row">
              <span class="kw-sel__c1" :title="p">{{ p }}</span>
              <el-select
                :model-value="modeOf(p)"
                size="small"
                class="kw-sel__match"
                popper-class="kw-match-popper"
                @update:model-value="(v) => setMode(p, v)"
              >
                <el-option label="广泛匹配" value="BROAD" />
                <el-option label="短语匹配" value="PHRASE" />
                <el-option label="精确匹配" value="EXACT" />
              </el-select>
              <el-icon class="kw-sel__del" @click="picked.splice(i, 1)"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="kw-foot">
        <label class="kw-save">
          <el-checkbox v-model="saveAsPack" />
          <span>保存为关键词包</span>
        </label>
        <el-input v-model="packName" class="kw-packname" placeholder="输入词包名称" :disabled="!saveAsPack" />
        <el-button class="kw-cancel" @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </div>
    </template>

    <!-- 批量上传关键词 -->
    <el-dialog v-model="uploadVisible" title="批量上传关键词" width="420px" :append-to-body="true" class="kw-upload">
      <div class="up-row">
        <span class="up-label">获取模板文件</span>
        <el-button class="up-btn" @click="downloadTemplate">
          <el-icon><Download /></el-icon>点击下载
        </el-button>
      </div>
      <div class="up-hint">下载关键词模板，批量填写关键词信息</div>
      <div class="up-row up-row--upload">
        <span class="up-label">上传模板文件</span>
        <el-button class="up-btn" @click="pickFile">
          <el-icon><Upload /></el-icon>点击上传
        </el-button>
        <input ref="fileRef" type="file" accept=".xlsx,.xls,.csv" class="up-file" @change="onFile" />
      </div>
      <div class="up-hint">格式为Excel或CSV，还可添加1000个关键词</div>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUpload">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改匹配方式 -->
    <el-dialog v-model="matchVisible" title="修改匹配方式" width="420px" :append-to-body="true">
      <div class="kw-match">
        <el-radio-group v-model="matchMode">
          <el-radio value="BROAD">广泛匹配</el-radio>
          <el-radio value="PHRASE">短语匹配</el-radio>
          <el-radio value="EXACT">精确匹配</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="matchVisible = false">取消</el-button>
        <el-button type="primary" @click="applyAllMode">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled, RefreshRight, Document, QuestionFilled, Close, Search, Download, Upload } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initial: { type: Array, default: () => [] },
  limit: { type: Number, default: 1000 },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const ALL = [
  '刘良新短剧推荐', '我的16岁女孩爷爷', '常洪全明', '弟弟为什么这样害我哭体书',
  '小说完结书单', 'cc小说网', '书旗文学小说', '莱读密体书', '蜂鸟小说', '半夏文学网',
];

const tab = ref('add');
const keyword = ref('');
const packKeyword = ref('');
const picked = ref([]);
const saveAsPack = ref(false);
const packName = ref('');
const matchMode = ref('BROAD');
/* 每个关键词各自的匹配方式：{ 关键词: BROAD|PHRASE|EXACT } */
const matchMap = ref({});
const matchVisible = ref(false);
const uploadVisible = ref(false);
const fileRef = ref(null);
const uploadedFile = ref('');

watch(() => props.modelValue, (v) => {
  if (v) {
    tab.value = 'add';
    keyword.value = '';
    packKeyword.value = '';
    picked.value = [...props.initial];
    saveAsPack.value = false;
    packName.value = '';
    matchMode.value = 'BROAD';
    const m = {};
    props.initial.forEach((k) => { m[k] = 'BROAD'; });
    matchMap.value = m;
    uploadedFile.value = '';
  }
});

const matchLabel = computed(() => ({ BROAD: '广泛匹配', PHRASE: '短语匹配', EXACT: '精确匹配' }[matchMode.value]));
function modeOf(k) { return matchMap.value[k] || matchMode.value; }
function setMode(k, v) { matchMap.value = { ...matchMap.value, [k]: v }; }
function applyAllMode() {
  const m = { ...matchMap.value };
  picked.value.forEach((k) => { m[k] = matchMode.value; });
  matchMap.value = m;
  matchVisible.value = false;
}
const filtered = computed(() => ALL.filter((k) => !keyword.value.trim() || k.includes(keyword.value.trim())));
function isPicked(k) { return picked.value.includes(k); }
function addOne(k) {
  if (picked.value.length >= props.limit) return;
  if (!isPicked(k)) {
    picked.value = [...picked.value, k];
    setMode(k, matchMode.value);
  }
}
function addAll() {
  const room = Math.max(0, props.limit - picked.value.length);
  const add = filtered.value.filter((k) => !isPicked(k)).slice(0, room);
  picked.value = [...picked.value, ...add];
  add.forEach((k) => setMode(k, matchMode.value));
}
function onSync() { ElMessage.success('已同步关键词'); }
function downloadTemplate() {
  const a = document.createElement('a');
  a.href = '/templates/keyword-template.xlsx';
  a.download = '关键词导入模板（头条）.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function pickFile() { fileRef.value && fileRef.value.click(); }
function onFile(e) {
  const f = e.target.files && e.target.files[0];
  uploadedFile.value = f ? f.name : '';
}
function saveUpload() {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传模板文件');
    return;
  }
  const add = ALL.filter((k) => !isPicked(k)).slice(0, 5);
  picked.value = [...picked.value, ...add];
  add.forEach((k) => setMode(k, matchMode.value));
  ElMessage.success(`已解析 ${add.length} 个关键词（原型模拟）`);
  uploadVisible.value = false;
}
function confirm() {
  emit('confirm', { keywords: [...picked.value], matchMode: matchMode.value, modes: { ...matchMap.value } });
  visible.value = false;
}
function onClosed() { picked.value = []; }
</script>

<style scoped>
.kw-note {
  display: flex; gap: 6px; align-items: flex-start;
  font-size: 12px; line-height: 18px; color: #86909c;
  padding: 8px 12px; background: #fff;
}
.kw-note__icon { color: #86909c; font-size: 13px; margin-top: 2px; flex: none; }
.kw-tabs { display: flex; gap: 24px; padding: 0 12px; border-bottom: 1px solid #e5e6eb; background: #fff; }
.kw-tab { font-size: 13px; color: #1d2129; padding: 8px 0; cursor: pointer; border-bottom: 2px solid transparent; }
.kw-tab.is-on { color: #197afb; border-bottom-color: #197afb; font-weight: 500; }
.kw-pane { padding: 12px; display: flex; flex-direction: column; min-height: 0; height: calc(100% - 78px); box-sizing: border-box; }
.kw-packdesc { font-size: 12px; color: #4e5969; margin-bottom: 8px; }
.kw-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.kw-top__input { flex: 1; }
.kw-sync { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: #197afb; cursor: pointer; white-space: nowrap; }
.kw-sync--pack { margin-left: auto; }
.kw-cols { flex: 1; min-height: 0; display: flex; gap: 12px; }
.kw-list { flex: 1; min-width: 0; border: 1px solid #e5e6eb; display: flex; flex-direction: column; }
.kw-list__head {
  height: 34px; padding: 0 10px; flex: none;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: #4e5969; border-bottom: 1px solid #e5e6eb; background: #fff;
}
.kw-list__body { flex: 1; min-height: 0; overflow-y: auto; }
.kw-row { height: 34px; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #1d2129; }
.kw-row:hover { background: #f7f8fa; }
.kw-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kw-link { color: #197afb; cursor: pointer; font-size: 12px; }
.kw-sel { width: 246px; flex: none; border: 1px solid #e5e6eb; display: flex; flex-direction: column; }
.kw-sel__head { height: 32px; padding: 0 10px; display: flex; align-items: center; font-size: 12px; color: #4e5969; }
.kw-sel__acts { padding: 0 10px 6px; display: flex; gap: 12px; }
.kw-sel__thead {
  height: 32px; padding: 0 10px; display: flex; align-items: center;
  font-size: 12px; color: #4e5969; background: #f7f8fa; border-bottom: 1px solid #e5e6eb;
}
.kw-sel__c1 { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kw-sel__c2 { width: 88px; flex: none; display: inline-flex; align-items: center; gap: 2px; }
/* 每行可单独切换匹配方式（无边框，与纯文本一致） */
.kw-sel__match { width: 86px; flex: none; }
.kw-sel__match :deep(.el-select__wrapper) {
  box-shadow: none !important; background: transparent; padding: 0;
  min-height: 26px; font-size: 12px;
}
.kw-sel__match :deep(.el-select__selected-item) { font-size: 12px; color: #1d2129; }
.kw-sel__match :deep(.el-select__caret) { color: #c9cdd4; }
.kw-info { color: #c9cdd4; font-size: 12px; }
.kw-sel__body { flex: 1; min-height: 0; overflow-y: auto; }
.kw-sel__row { height: 32px; padding: 0 10px; display: flex; align-items: center; font-size: 12px; color: #1d2129; border-bottom: 1px solid #f7f8fa; }
.kw-sel__del { color: #86909c; cursor: pointer; margin-left: 6px; }
.kw-empty { height: 100%; min-height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #86909c; font-size: 12px; }
.kw-empty__img {
  width: 44px; height: 44px; border-radius: 6px; background: #f2f3f5;
  display: flex; align-items: center; justify-content: center; color: #c9cdd4; font-size: 24px;
}
.kw-foot { display: flex; align-items: center; gap: 8px; width: 100%; }
.kw-save { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #1d2129; cursor: pointer; }
.kw-save :deep(.el-checkbox) { height: 20px; }
.kw-packname { width: 200px; }
.kw-cancel { margin-left: auto; }
.up-row { display: flex; align-items: center; gap: 12px; }
.up-row--upload { margin-top: 18px; }
.up-label { width: 84px; flex: none; font-size: 12px; color: #4e5969; }
.up-btn { height: 28px; padding: 0 12px; font-size: 12px; }
.up-hint { margin: 4px 0 0 96px; font-size: 12px; color: #86909c; }
.up-file { display: none; }
.kw-match { padding: 8px 0; }
.kw-match :deep(.el-radio) { margin-right: 18px; }
</style>
