<template>
  <!-- 游戏福利（对齐线上 新建原生锚点模板 →「添加游戏礼包」打开的子弹窗，图5）
       * 578×，标题「游戏福利」
       * 礼包名称 0/14、Android礼包码 0/20、iOS礼包码 0/20
       * 礼包内的礼品配置（添加礼品 (n/8)）+ 礼品卡（图片/名称/数量）
       * 游戏礼包使用期限（有效期至 + 日期范围）
       * 游戏礼包使用规则（textarea 0/30） -->
  <el-dialog
    :model-value="modelValue"
    title="游戏福利"
    width="578px"
    class="anpg-dialog"
    align-center
    append-to-body
    :z-index="2800"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="anpg">
      <div class="anpg-row">
        <span class="anpg-label">礼包名称</span>
        <el-input
          v-model="form.name"
          size="small"
          class="anpg-input"
          maxlength="14"
          placeholder="请输入"
          show-word-limit
        />
      </div>

      <div class="anpg-row">
        <span class="anpg-label">Android礼包码</span>
        <el-input
          v-model="form.androidCode"
          size="small"
          class="anpg-input"
          maxlength="20"
          placeholder="请输入"
          show-word-limit
        />
      </div>

      <div class="anpg-row">
        <span class="anpg-label">iOS礼包码</span>
        <el-input
          v-model="form.iosCode"
          size="small"
          class="anpg-input"
          maxlength="20"
          placeholder="请输入"
          show-word-limit
        />
      </div>

      <div class="anpg-row">
        <span class="anpg-label">礼包内的礼品配置</span>
        <el-button size="small" type="primary" class="anpg-add-gift" @click="onAddGift">
          添加礼品 ({{ gifts.length }}/8)
        </el-button>
      </div>

      <div class="anpg-gifts">
        <div v-for="(g, i) in gifts" :key="g.key" class="anpg-gift">
          <div class="anpg-gift__img" @click="onUploadGiftImage(g)">
            <template v-if="g.image">
              <span class="anpg-gift__img-name">{{ g.image }}</span>
            </template>
            <template v-else>
              <i class="anpg-gift__plus"></i>
              <span class="anpg-gift__label">添加图片</span>
            </template>
          </div>
          <div class="anpg-gift__fields">
            <el-input
              v-model="g.name"
              size="small"
              maxlength="8"
              placeholder="请输入"
              show-word-limit
            />
            <div class="anpg-gift__qty">
              <el-input-number
                v-model="g.qty"
                size="small"
                :min="1"
                :max="999999"
                :controls="true"
                controls-position="right"
                class="anpg-qty-input"
                placeholder="请输入礼包数量"
              />
            </div>
          </div>
          <el-icon v-if="gifts.length > 1" class="anpg-gift__x" @click="removeGift(i)"><Close /></el-icon>
        </div>
      </div>

      <div class="anpg-row">
        <span class="anpg-label">游戏礼包使用期限</span>
        <div class="anpg-period">
          <el-date-picker
            v-model="form.expireRange"
            type="daterange"
            range-separator="至"
            size="small"
            class="anpg-date"
            start-placeholder="请选择礼包有效期"
            end-placeholder="请选择礼包有效期"
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>

      <div class="anpg-row anpg-row--top">
        <span class="anpg-label">游戏礼包使用规则</span>
        <el-input
          v-model="form.rule"
          type="textarea"
          :rows="2"
          maxlength="30"
          show-word-limit
          class="anpg-textarea"
          placeholder="请输入礼包码的具体兑换路径，如人物等级10级-左侧菜单-福利-输入礼包码兑换"
        />
      </div>
    </div>

    <template #footer>
      <el-button class="adpick-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="adpick-foot-btn adpick-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

let seq = 0;
const form = reactive({
  name: '',
  androidCode: '',
  iosCode: '',
  expireRange: [],
  rule: '',
});
/* 线上默认已有 1 个礼品（按钮显示 添加礼品 (1/8)） */
const gifts = ref([]);

function makeGift() {
  seq += 1;
  return { key: `g${seq}`, image: '', name: '', qty: null };
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.name = '';
      form.androidCode = '';
      form.iosCode = '';
      form.expireRange = [];
      form.rule = '';
      gifts.value = [makeGift()];
    }
  }
);

function onAddGift() {
  if (gifts.value.length >= 8) {
    ElMessage.warning('最多添加 8 个礼品');
    return;
  }
  gifts.value.push(makeGift());
}
function removeGift(i) {
  gifts.value.splice(i, 1);
}
function onUploadGiftImage(g) {
  g.image = `礼品图${(gifts.value.indexOf(g) || 0) + 1}`;
  ElMessage.info('礼品图片上传（本地原型为模拟）');
}
function onConfirm() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入礼包名称');
    return;
  }
  emit('confirm', {
    name: form.name.trim(),
    androidCode: form.androidCode,
    iosCode: form.iosCode,
    gifts: gifts.value.map((g) => ({ ...g })),
    expireRange: form.expireRange,
    rule: form.rule,
  });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.anpg {
  max-height: 62vh;
  overflow-y: auto;
  padding-right: 2px;
}
.anpg-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.anpg-row--top {
  align-items: flex-start;
}
.anpg-label {
  width: 118px;
  flex: none;
  font-size: 13px;
  color: #1d2129;
  line-height: 28px;
  margin-right: 12px;
  white-space: nowrap;
}
.anpg-input {
  width: 390px;
}
.anpg-input :deep(.el-input__inner) {
  font-size: 13px;
}
.anpg-input :deep(.el-input__inner),
.anpg-input :deep(.el-input__inner)::placeholder {
  font-size: 13px;
}
.anpg-add-gift {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
}
.anpg-gifts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 12px;
}
.anpg-gift {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 10px;
  background: #f7f8fa;
  border-radius: 4px;
}
.anpg-gift__img {
  width: 80px;
  height: 80px;
  flex: none;
  border: 1px dashed #d9dbe1;
  border-radius: 3px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #b1b7c3;
}
.anpg-gift__plus {
  width: 16px;
  height: 16px;
  position: relative;
}
.anpg-gift__plus::before,
.anpg-gift__plus::after {
  content: '';
  position: absolute;
  background: #c9cdd4;
}
.anpg-gift__plus::before {
  left: 0;
  top: 7px;
  width: 16px;
  height: 1px;
}
.anpg-gift__plus::after {
  top: 0;
  left: 7px;
  width: 1px;
  height: 16px;
}
.anpg-gift__label {
  font-size: 12px;
  color: #86909c;
}
.anpg-gift__img-name {
  font-size: 12px;
  color: #4e5969;
  text-align: center;
  padding: 0 4px;
}
.anpg-gift__fields {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.anpg-gift__fields :deep(.el-input__inner) {
  font-size: 13px;
}
.anpg-gift__qty {
  width: 320px;
}
.anpg-qty-input {
  width: 320px;
}
.anpg-qty-input :deep(.el-input__inner) {
  font-size: 13px;
  text-align: left;
}
.anpg-gift__x {
  position: absolute;
  right: 6px;
  top: 6px;
  color: #b1b7c3;
  cursor: pointer;
}
.anpg-period {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.anpg-date {
  width: 300px;
}
.anpg-textarea {
  width: 390px;
}
.anpg-textarea :deep(.el-textarea__inner) {
  font-size: 13px;
}
</style>




