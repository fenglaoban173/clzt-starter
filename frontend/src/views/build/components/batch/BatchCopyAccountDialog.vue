<template>
  <!-- 复用到其他账户（线上图2：动态选取标题页「复制到其他账户」打开） -->
  <teleport to="body">
    <div v-if="visible" class="cap-mask" @click="close"></div>
    <div v-if="visible" class="cap-dialog" role="dialog" aria-modal="true" aria-label="复用到其他账户" :style="{ width: width + 'px' }">
      <div class="cap-dialog__header">
        <span class="cap-dialog__title">复用到其他账户</span>
        <button class="cap-dialog__close" type="button" aria-label="Close" @click="close">✕</button>
      </div>

      <div class="cap-dialog__body">
        <div class="cap-tips">
          {{ tip || ('此操作将会把当前账户「' + currentAccount + '」在投的动态选取规则覆盖至指定账户。') }}
        </div>

        <div class="cap-search">
          <select v-model="field" class="cap-select">
            <option value="account">账户名称</option>
            <option value="accountId">账户ID</option>
          </select>
          <div class="cap-searchwrap">
            <input v-model="keyword" class="cap-input" type="text" placeholder="请输入关键词" />
            <button class="cap-searchbtn" type="button" aria-label="查询">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3.5h8M2 7h5M2 10.5h4" stroke="#c9cdd4" stroke-width="1.2" stroke-linecap="round" />
                <circle cx="10.4" cy="9.2" r="3" stroke="#c9cdd4" stroke-width="1.2" />
                <path d="M12.6 11.4l2 2" stroke="#c9cdd4" stroke-width="1.2" />
              </svg>
            </button>
          </div>
        </div>

        <div class="cap-table">
          <div class="cap-thead">
            <span class="cap-td cap-td--check"></span>
            <span class="cap-td cap-td--name">账户名称</span>
            <span class="cap-td cap-td--id">账户ID</span>
          </div>
          <div
            v-for="r in filteredRows"
            :key="r.accountId"
            class="cap-tbody"
            :class="{ 'is-checked': picked.includes(r.accountId) }"
            @click="toggle(r.accountId)"
          >
            <span class="cap-td cap-td--check">
              <span class="cap-checkbox" :class="{ 'is-checked': picked.includes(r.accountId) }"></span>
            </span>
            <span class="cap-td cap-td--name" :title="r.account">{{ r.account }}</span>
            <span class="cap-td cap-td--id">{{ r.accountId }}</span>
          </div>
          <div v-if="!filteredRows.length" class="cap-empty">暂无符合条件的账户</div>
        </div>
      </div>

      <div class="cap-dialog__footer">
        <button class="cap-btn" type="button" @click="close">取 消</button>
        <button class="cap-btn cap-btn--primary" type="button" :disabled="!picked.length" @click="confirm">确 定</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 当前在投账户名（提示条里回显） */
  currentAccount: { type: String, default: '' },
  /** 可复用账户：[{ account, accountId }] */
  rows: { type: Array, default: () => [] },
  /** 提示条文案（不传则用动态选取规则默认文案） */
  tip: { type: String, default: '' },
  /** 弹窗宽度 */
  width: { type: Number, default: 400 },
  /** 成功后提示文案 */
  successText: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'close', 'confirm']);

const visible = computed(() => props.modelValue);
const field = ref('account');
const keyword = ref('');
const picked = ref([]);

watch(visible, (val) => {
  if (val) {
    field.value = 'account';
    keyword.value = '';
    picked.value = [];
  }
});

const filteredRows = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return props.rows;
  return props.rows.filter((r) => String(r[field.value] || '').includes(kw));
});

function toggle(id) {
  const i = picked.value.indexOf(id);
  if (i >= 0) picked.value.splice(i, 1);
  else picked.value.push(id);
}

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function confirm() {
  if (!picked.value.length) return;
  emit('confirm', picked.value.slice());
  emit('update:modelValue', false);
  ElMessage.success(`规则已复制到选中的${picked.value.length}个账户`);
}
</script>

<style>
.cap-mask {
  position: fixed; inset: 0; z-index: 2210;
  background: rgba(0, 0, 0, .5);
}
.cap-dialog {
  position: fixed; top: 50%; left: 50%; z-index: 2211;
  width: 400px; transform: translate(-50%, -50%);
  background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  font-size: 14px; color: #1d2129;
}
.cap-dialog__header {
  position: relative; height: 44px; padding: 0 20px;
  display: flex; align-items: center;
  border-bottom: 1px solid #ebedf0;
}
.cap-dialog__title { font-size: 15px; color: #1d2129; }
.cap-dialog__close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; padding: 0; font-size: 15px; line-height: 1;
  color: #86909c; background: none; border: none; cursor: pointer;
}
.cap-dialog__close:hover { color: #197afb; }

.cap-dialog__body { padding: 12px 16px 8px; }
.cap-tips {
  padding: 9px 12px; margin-bottom: 12px;
  background: #f2f3f5; border-radius: 2px;
  font-size: 12px; line-height: 19px; color: #4e5969;
}
.cap-search { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.cap-searchwrap { position: relative; flex: 1; min-width: 0; }
.cap-select {
  width: 108px; height: 32px; padding: 0 8px; flex: none;
  border: 1px solid #dcdfe6; border-radius: 2px;
  font-size: 13px; color: #1d2129; background: #fff; outline: none;
}
.cap-input {
  width: 100%; height: 32px; padding: 0 34px 0 10px; box-sizing: border-box;
  border: 1px solid #dcdfe6; border-radius: 2px;
  font-size: 13px; color: #1d2129; outline: none;
}
.cap-input::placeholder { color: #c9cdd4; }
.cap-searchbtn {
  position: absolute; right: 1px; top: 1px;
  width: 32px; height: 30px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
}
.cap-searchbtn:hover { border-color: #197afb; }

.cap-table { border: 1px solid #e5e6eb; border-radius: 2px; overflow: hidden; }
.cap-thead {
  display: flex; align-items: center; height: 40px;
  background: #fff; border-bottom: 1px solid #e5e6eb;
  font-size: 13px; color: #1d2129;
}
.cap-tbody {
  display: flex; align-items: center; height: 44px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 13px; color: #4e5969; cursor: pointer;
}
.cap-tbody:last-child { border-bottom: none; }
.cap-tbody.is-checked { background: #eef4ff; }
.cap-td { padding: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cap-td--check { width: 34px; flex: none; display: flex; align-items: center; }
.cap-td--name { flex: 1; min-width: 0; }
.cap-td--id { width: 132px; flex: none; color: #1d2129; }
.cap-checkbox {
  width: 14px; height: 14px; border: 1px solid #dcdfe6; border-radius: 2px;
  background: #fff; display: inline-block; position: relative;
}
.cap-checkbox.is-checked { background: #197afb; border-color: #197afb; }
.cap-checkbox.is-checked::after {
  content: ''; position: absolute; left: 4px; top: 1px;
  width: 4px; height: 8px; border: 1px solid #fff; border-left: 0; border-top: 0;
  transform: rotate(45deg);
}
.cap-empty { padding: 24px 0; text-align: center; font-size: 12px; color: #86909c; }

.cap-dialog__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 8px 16px 16px;
}
.cap-btn {
  height: 32px; padding: 0 16px;
  border: 1px solid #dcdfe6; border-radius: 2px;
  background: #fff; color: #4e5969; font-size: 13px; cursor: pointer;
}
.cap-btn:hover { border-color: #197afb; color: #197afb; }
.cap-btn--primary { background: #197afb; border-color: #197afb; color: #fff; }
.cap-btn--primary:hover { background: #3d8efc; border-color: #3d8efc; color: #fff; }
.cap-btn--primary:disabled {
  background: #a6c8ff; border-color: #a6c8ff; color: #fff; cursor: not-allowed;
}
</style>
