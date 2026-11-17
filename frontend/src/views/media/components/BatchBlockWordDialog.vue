<template>
  <el-dialog
    :model-value="modelValue"
    title="添加屏蔽词"
    width="920px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <!-- 生效范围 -->
      <div class="bd-row">
        <span class="bd-label">生效范围</span>
        <div class="bd-switch">
          <button type="button" :class="{ active: scope === 'account' }" @click="scope = 'account'">账户</button>
          <button type="button" :class="{ active: scope === 'douyin' }" @click="scope = 'douyin'">抖音号</button>
        </div>
        <span class="scope-tip">
          {{ scope === 'account' ? `屏蔽词将应用于已选的 ${accounts.length} 个账户` : '屏蔽词将应用于所选账户下指定的抖音号' }}
        </span>
      </div>

      <!-- 抖音号范围：账户选择 + 抖音号列表 -->
      <template v-if="scope === 'douyin'">
        <div class="bd-row">
          <span class="bd-label">媒体账户</span>
          <el-select v-model="accId" filterable placeholder="请选择媒体账户" class="acc-select" @change="onAccountChange">
            <el-option v-for="a in accounts" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </div>

        <div class="dw-panel">
          <div class="dw-left">
            <div class="dw-search">
              <el-input v-model="dwKeyword" placeholder="请输入抖音号或ID" clearable @keyup.enter="searchDouyin" />
              <el-button type="primary" @click="searchDouyin">查询</el-button>
            </div>
            <div class="dw-head">抖音号</div>
            <div class="dw-list">
              <el-empty v-if="!douyinPageRows.length" description="暂无数据" :image-size="80" />
              <el-checkbox
                v-for="d in douyinPageRows"
                :key="d.id"
                class="dw-item"
                :model-value="dwChecked.includes(d.id)"
                @change="(v) => toggleDouyin(d, v)"
              >
                {{ d.name }}({{ d.douyin_id }})
              </el-checkbox>
            </div>
            <el-pagination
              class="dw-pager"
              layout="prev, pager, next"
              :total="douyinList.length"
              :page-size="dwPageSize"
              :current-page="dwPage"
              @current-change="onDwPage"
            />
          </div>

          <div class="dw-right">
            <div class="dw-head sel-head">
              <span>已选({{ dwChecked.length }})</span>
              <el-button link type="primary" @click="dwChecked = []">清空</el-button>
            </div>
            <div class="dw-sel-body">
              <el-empty v-if="!douyinChecked.length" description="暂无数据" :image-size="70" />
              <div v-else class="dw-sel-scroll">
                <div v-for="d in douyinChecked" :key="d.id" class="dw-sel-item">
                  {{ d.name }}<span class="dw-sel-id">{{ d.douyin_id }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 屏蔽词输入 -->
      <div class="bw-box">
        <div class="bw-head">
          <span class="bw-title">请输入屏蔽词（{{ wordCount }}/100）</span>
          <el-button link type="primary" @click="clearWords">清空</el-button>
        </div>
        <div class="bw-hint">长度范围为 1-20 个字，添加多个请换行</div>
        <div class="bw-row">
          <span class="bw-idx">1</span>
          <el-input
            v-model="wordText"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="请粘贴或输入屏蔽词，回车可换行"
          />
        </div>
        <div v-if="words.length" class="bw-chips">
          <span v-for="(w, i) in words" :key="`${w}-${i}`" class="bw-chip" :class="{ 'chip-err': w.length > 20 }">
            {{ w }}
            <el-icon class="chip-close" @click="removeWord(i)"><Close /></el-icon>
          </span>
        </div>
        <div v-if="tooLongCount" class="bw-warn">有 {{ tooLongCount }} 个屏蔽词超过 20 个字，请修改后再提交。</div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import { mediaApi } from '@/api/media';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const scope = ref('account');
const accId = ref(null);
const dwKeyword = ref('');
const dwChecked = ref([]);
const dwPage = ref(1);
const dwPageSize = 5;
const allDouyin = ref([]);
const wordText = ref('');

const accounts = computed(() => (props.accounts || []).filter((a) => !a.__total));

const douyinList = computed(() => {
  const kw = dwKeyword.value.trim().toLowerCase();
  let list = allDouyin.value.filter((d) => !accId.value || d.account_id === accId.value);
  if (!kw) return list;
  return list.filter((d) => String(d.name).toLowerCase().includes(kw) || String(d.douyin_id).toLowerCase().includes(kw));
});
const douyinPageRows = computed(() => douyinList.value.slice((dwPage.value - 1) * dwPageSize, dwPage.value * dwPageSize));
const douyinChecked = computed(() => allDouyin.value.filter((d) => dwChecked.value.includes(d.id)));

const words = computed(() => wordText.value.split('\n').map((w) => w.trim()).filter(Boolean));
const wordCount = computed(() => words.value.length);
const tooLongCount = computed(() => words.value.filter((w) => w.length > 20).length);

const canSubmit = computed(() => {
  if (!words.value.length) return false;
  if (tooLongCount.value) return false;
  if (scope.value === 'douyin' && !dwChecked.value.length) return false;
  return true;
});

async function init() {
  scope.value = 'account';
  accId.value = accounts.value.length ? accounts.value[0].id : null;
  dwKeyword.value = '';
  dwChecked.value = [];
  dwPage.value = 1;
  wordText.value = '';
  try {
    const res = await mediaApi.douyinAccounts();
    allDouyin.value = res.data?.list || [];
  } catch (e) {
    allDouyin.value = [];
  }
}

function onAccountChange() {
  dwChecked.value = [];
  dwPage.value = 1;
}
function searchDouyin() { dwPage.value = 1; }
function onDwPage(p) { dwPage.value = p; }
function toggleDouyin(d, val) {
  dwChecked.value = val
    ? [...new Set([...dwChecked.value, d.id])]
    : dwChecked.value.filter((id) => id !== d.id);
}

function clearWords() { wordText.value = ''; }
function removeWord(i) {
  const list = [...words.value];
  list.splice(i, 1);
  wordText.value = list.join('\n');
}

function confirm() {
  const target = scope.value === 'account'
    ? `账户 ${accounts.value.length} 个`
    : `抖音号 ${dwChecked.value.length} 个`;
  ElMessage.success(`原型：已提交添加屏蔽词任务（${target}，屏蔽词 ${wordCount.value} 个）`);
  emit('confirm', { scope: scope.value, words: words.value, accounts: accounts.value, douyins: douyinChecked.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.batch-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
}
.bd-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.bd-label { flex: none; width: 76px; font-size: 15px; color: #1d2129; }
.bd-switch {
  display: inline-flex;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.bd-switch button {
  padding: 7px 20px;
  border: none;
  border-right: 1px solid #e5e6eb;
  background: #fff;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
}
.bd-switch button:last-child { border-right: none; }
.bd-switch button.active { background: #e8f3ff; color: #165dff; font-weight: 600; }
.scope-tip { font-size: 13px; color: #86909c; }
.acc-select { width: 420px; }

/* 抖音号选择面板 */
.dw-panel { display: flex; gap: 16px; align-items: flex-start; margin-top: 14px; }
.dw-left { flex: 1; min-width: 0; border: 1px solid #e5e6eb; border-radius: 4px; overflow: hidden; }
.dw-right { width: 250px; border: 1px solid #e5e6eb; border-radius: 4px; overflow: hidden; }
.dw-search { display: flex; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #e5e6eb; }
.dw-search :deep(.el-input) { flex: 1; min-width: 0; }
.dw-head {
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #e5e6eb;
  font-size: 14px;
  color: #1d2129;
}
.sel-head { justify-content: space-between; border-bottom: none; }
.dw-list { min-height: 180px; max-height: 240px; overflow-y: auto; padding: 6px 12px; }
.dw-item { display: flex; height: 32px; align-items: center; }
.dw-item :deep(.el-checkbox__label) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #1d2129;
}
.dw-pager { padding: 8px 12px 10px; justify-content: flex-start; }
.dw-sel-body { min-height: 180px; max-height: 240px; overflow-y: auto; padding: 4px 12px; }
.dw-sel-item {
  padding: 8px 0;
  font-size: 14px;
  color: #1d2129;
  border-bottom: 1px dashed #f2f3f5;
}
.dw-sel-id { display: block; font-size: 12px; color: #86909c; }

/* 屏蔽词输入框 */
.bw-box { margin-top: 16px; border: 1px solid #e5e6eb; border-radius: 4px; padding: 12px; }
.bw-head { display: flex; align-items: center; justify-content: space-between; }
.bw-title { font-size: 15px; color: #1d2129; }
.bw-hint {
  margin: 10px 0;
  padding: 8px 12px;
  background: #e8f3ff;
  border-radius: 4px;
  font-size: 13px;
  color: #165dff;
}
.bw-row { display: flex; gap: 10px; align-items: flex-start; }
.bw-idx {
  flex: none;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 4px;
  background: #f2f3f5;
  color: #86909c;
  font-size: 13px;
  margin-top: 4px;
}
.bw-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; padding-left: 34px; }
.bw-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: #f2f3f5;
  font-size: 13px;
  color: #1d2129;
}
.bw-chip.chip-err { background: #ffece8; color: #f53f3f; }
.chip-close { cursor: pointer; font-size: 12px; }
.bw-warn { margin-top: 10px; font-size: 13px; color: #ff7d00; }
</style>
