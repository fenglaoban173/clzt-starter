<template>
  <!-- 新建原生锚点模板（对齐线上 选择原生锚点模板 →「去新建」，图2）
       * 578×，标题「新建原生锚点模板」
       * 基础信息：锚点模板名称 / 锚点模板类型 / 工具名称（+通配符 chips）/ iOS锚点标题 /
         安卓锚点标题 / 顶部头图（虚线 98×98 上传位）/ 游戏标签（+添加）
       * footer：取消 / 确定 -->
  <el-dialog
    :model-value="modelValue"
    title="新建原生锚点模板"
    width="578px"
    class="anpc-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="anpc">
      <div class="anpc-row">
        <span class="anpc-label">锚点模板名称</span>
        <el-input
          v-model="form.name"
          size="small"
          class="anpc-input"
          maxlength="100"
          placeholder="请输入"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">锚点模板类型</span>
        <el-select v-model="form.type" size="small" class="anpc-input" placeholder="请选择">
          <el-option label="游戏-常规下载" value="GAME_NORMAL" />
          <el-option label="游戏-预约下载" value="GAME_BOOK" />
          <el-option label="应用-常规下载" value="APP_NORMAL" />
        </el-select>
      </div>

      <div class="anpc-row anpc-row--top">
        <span class="anpc-label">工具名称</span>
        <div class="anpc-field">
          <el-input
            v-model="form.tool"
            size="small"
            class="anpc-input"
            maxlength="15"
            placeholder="名称用于您自己管理组件，不会对外显示"
            show-word-limit
          />
          <div class="anpc-chips">
            <span class="anpc-chips__label">通配符：</span>
            <a v-for="c in CHIPS" :key="c" class="anpc-chip" @click="insertToken(c)">
              +{{ c }}
            </a>
          </div>
        </div>
      </div>

      <div class="anpc-row">
        <span class="anpc-label">iOS锚点标题</span>
        <el-input
          v-model="form.iosTitle"
          size="small"
          class="anpc-input"
          maxlength="12"
          placeholder="请输入与iOS端应用名称相关的引导文案"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">安卓锚点标题</span>
        <el-input
          v-model="form.androidTitle"
          size="small"
          class="anpc-input"
          maxlength="12"
          placeholder="请输入与安卓端应用名称相关的引导文案"
          show-word-limit
        />
      </div>

      <div class="anpc-row anpc-row--top">
        <span class="anpc-label">顶部头图</span>
        <div class="anpc-field">
          <div class="anpc-upload" @click="onUpload">
            <span class="anpc-upload__plus">+</span>
            <span class="anpc-upload__text">图片({{ headerImages.length }}/5)</span>
          </div>
          <p class="anpc-upload__tip">请上传大小不超过1.5M的图片，推荐尺寸2:1</p>
        </div>
      </div>

      <div class="anpc-row anpc-row--top">
        <span class="anpc-label">游戏标签</span>
        <div class="anpc-field">
          <div class="anpc-tagline">
            <el-input
              v-model="tagInput"
              size="small"
              class="anpc-input"
              maxlength="6"
              placeholder="请输入游戏标签"
              show-word-limit
              @keyup.enter="onAddTag"
            />
            <el-popover placement="top" trigger="hover" :width="270" popper-class="dlx-pop">
              <template #reference>
                <el-icon class="anpc-q"><QuestionFilled /></el-icon>
              </template>
              <span class="dlx-pop__text">
                游戏标签用于标记该模板归属的游戏，每个标签最多6个字；添加后可在新建原生锚点时按标签筛选。
              </span>
            </el-popover>
          </div>
          <div v-if="form.tags.length" class="anpc-tagrows">
            <div v-for="(t, i) in form.tags" :key="i" class="anpc-tagrow">
              <el-input
                v-model="form.tags[i]"
                size="small"
                class="anpc-input"
                maxlength="6"
                placeholder="请输入游戏标签"
                show-word-limit
              />
              <el-icon class="anpc-tagrow__x" @click="form.tags.splice(i, 1)"><Close /></el-icon>
            </div>
          </div>
          <a class="anpc-add" @click="onAddTag">+ 添加</a>
        </div>
      </div>

      <div class="anpc-row">
        <span class="anpc-label">引导文案</span>
        <el-input
          v-model="form.guideText"
          size="small"
          class="anpc-input"
          maxlength="15"
          placeholder="请输入引导文案"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">图片展示比例</span>
        <div class="anpc-seg">
          <button
            v-for="r in RATIOS"
            :key="r.value"
            type="button"
            class="anpc-seg__btn"
            :class="{ 'is-active': form.ratio === r.value }"
            @click="form.ratio = r.value"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <div class="anpc-row anpc-row--top">
        <span class="anpc-label">游戏图片</span>
        <div class="anpc-field">
          <div class="anpc-upload" @click="onUploadGameImg">
            <span class="anpc-upload__plus">+</span>
            <span class="anpc-upload__text">图片({{ gameImages.length }}/8)</span>
          </div>
          <p class="anpc-upload__tip">请上传横版图，最多8张大小不超过1.5M的图片</p>
        </div>
      </div>

      <div class="anpc-row">
        <span class="anpc-label">游戏简介</span>
        <el-input
          v-model="form.intro"
          size="small"
          class="anpc-input"
          maxlength="45"
          placeholder="请简要的介绍游戏，让用户快速了解游戏"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">游戏特色</span>
        <el-input
          v-model="form.feature"
          size="small"
          class="anpc-input"
          maxlength="45"
          placeholder="请简要介绍游戏特色或亮点"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">其他说明（选填）</span>
        <el-input
          v-model="form.otherText"
          size="small"
          class="anpc-input"
          maxlength="200"
          placeholder="请输入对游戏的其他介绍"
          show-word-limit
        />
      </div>

      <div class="anpc-row">
        <span class="anpc-label">游戏福利</span>
        <div class="anpc-seg">
          <button
            v-for="w in WELFARE"
            :key="w.value"
            type="button"
            class="anpc-seg__btn"
            :class="{ 'is-active': form.welfare === w.value }"
            @click="form.welfare = w.value"
          >
            {{ w.label }}
          </button>
        </div>
      </div>

      <div v-if="form.welfare === 'ON'" class="anpc-row">
        <span class="anpc-label">礼包来源</span>
        <el-button size="small" class="anpc-outline" @click="onGiftSource">手动创建</el-button>
      </div>

      <div v-if="form.welfare === 'ON'" class="anpc-row">
        <span class="anpc-label">添加游戏礼包</span>
        <el-button size="small" type="primary" class="anpc-add-gift" @click="giftVisible = true">
          添加游戏礼包 ({{ gifts.length }}/3)
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button class="adpick-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="adpick-foot-btn adpick-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>

  <!-- 图5：游戏福利（添加游戏礼包） -->
  <BatchGameGiftDialog v-model="giftVisible" @confirm="onGiftSubmit" />
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { Close, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BatchGameGiftDialog from './BatchGameGiftDialog.vue';

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

const CHIPS = ['直达链接名', '应用名称', '监测活动名', '落地页名', '日期'];
/* 图片展示比例 / 游戏福利 分段选项（线上文案） */
const RATIOS = [
  { value: 'BANNER', label: '横幅 (2:1)' },
  { value: 'VERTICAL', label: '竖图 (3:5)' },
];
const WELFARE = [
  { value: 'ON', label: '启用' },
  { value: 'OFF', label: '不启用' },
];

const form = reactive({
  name: '',
  type: 'GAME_NORMAL',
  tool: '',
  iosTitle: '',
  androidTitle: '',
  tags: [],
  guideText: '',
  ratio: 'BANNER',
  intro: '',
  feature: '',
  otherText: '',
  welfare: 'ON',
});
const tagInput = ref('');
const headerImages = ref([]);
const gameImages = ref([]);
/* 已添加的游戏礼包（图5 弹窗回传） */
const gifts = ref([]);
const giftVisible = ref(false);

/* 每次打开重置（线上是新建表单） */
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.name = '';
      form.type = 'GAME_NORMAL';
      form.tool = '';
      form.iosTitle = '';
      form.androidTitle = '';
      form.tags = [];
      form.guideText = '';
      form.ratio = 'BANNER';
      form.intro = '';
      form.feature = '';
      form.otherText = '';
      form.welfare = 'ON';
      tagInput.value = '';
      headerImages.value = [];
      gameImages.value = [];
      gifts.value = [];
    }
  }
);

function insertToken(c) {
  form.name += `<${c}>`;
}
function onUpload() {
  ElMessage.info('顶部头图上传（本地原型未接入真实上传）');
}
function onUploadGameImg() {
  if (gameImages.value.length >= 8) {
    ElMessage.warning('最多上传 8 张图片');
    return;
  }
  gameImages.value = [...gameImages.value, `img-${gameImages.value.length + 1}`];
}
function onGiftSource() {
  ElMessage.info('礼包来源：手动创建');
}
function onGiftSubmit(gift) {
  if (!gift) return;
  gifts.value = [...gifts.value, gift];
  ElMessage.success(`已添加游戏礼包「${gift.name}」`);
}
function onAddTag() {
  /* 线上交互：点「+ 添加」直接在下方新增一行可删除的输入框，不校验第一行是否已填 */
  if (form.tags.length >= 6) {
    ElMessage.warning('游戏标签最多添加 6 个');
    return;
  }
  const t = (tagInput.value || '').trim();
  if (t.length > 6) {
    ElMessage.warning('每个标签不超过6个字');
    return;
  }
  form.tags.push(t);
  tagInput.value = '';
}
function onConfirm() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入锚点模板名称');
    return;
  }
  emit('confirm', { name: form.name.trim(), type: form.type });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.anpc {
  max-height: 55vh;
  overflow-y: auto;
  padding-right: 2px;
}
.anpc-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.anpc-row--top {
  align-items: flex-start;
}
.anpc-label {
  width: 112px;
  flex: none;
  font-size: 12px;
  color: #1d2129;
  line-height: 28px;
  margin-right: 12px;
  white-space: nowrap;
}
.anpc-field {
  flex: 1;
  min-width: 0;
}
.anpc-input {
  width: 390px;
  max-width: 100%;
}
.anpc-input :deep(.el-input__inner) {
  font-size: 13px;
}
.anpc-input :deep(.el-input__inner)::placeholder {
  font-size: 13px;
}
.anpc-chips {
  margin-top: 6px;
  font-size: 13px;
  line-height: 20px;
}
.anpc-chips__label {
  color: #86909c;
}
.anpc-chip {
  color: #197afb;
  margin-left: 8px;
  cursor: pointer;
}
.anpc-chip:hover {
  text-decoration: underline;
}
.anpc-upload {
  width: 98px;
  height: 98px;
  border: 1px dashed #d9dbe1;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #86909c;
  cursor: pointer;
  background: #fff;
}
.anpc-upload:hover {
  border-color: #197afb;
  color: #197afb;
}
.anpc-upload__plus {
  font-size: 22px;
  line-height: 1;
  color: #4e5969;
}
.anpc-upload__text {
  font-size: 13px;
  color: #86909c;
}
.anpc-upload__tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #b1b7c3;
}
.anpc-tagline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.anpc-q {
  font-size: 13px;
  color: #b1b7c3;
  cursor: pointer;
}
.anpc-add {
  display: inline-block;
  margin-top: 6px;
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.anpc-tagrows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.anpc-tagrow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.anpc-tagrow__x {
  flex: none;
  font-size: 13px;
  color: #8a8f99;
  cursor: pointer;
}
.anpc-tagrow__x:hover {
  color: #197afb;
}
.anpc-taglist {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.anpc-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 160px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 3px;
}
.anpc-tag__x {
  flex: none;
  color: #b1b7c3;
  cursor: pointer;
}
.anpc-seg {
  display: flex;
}
.anpc-seg__btn {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  color: #1d2129;
  background: #fff;
  border: 1px solid #d9dbe1;
  border-right: none;
  cursor: pointer;
}
.anpc-seg__btn:last-child {
  border-right: 1px solid #d9dbe1;
}
.anpc-seg__btn.is-active {
  color: #197afb;
  background: #e8f1ff;
  border-color: #197afb;
  position: relative;
  z-index: 1;
}
.anpc-outline {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  color: #1d2129;
  border-color: #d9dbe1;
}
.anpc-add-gift {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
}
</style>



