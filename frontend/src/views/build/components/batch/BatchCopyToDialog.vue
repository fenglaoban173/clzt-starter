<template>
  <!-- 产品信息 ·「复用到其他账户 / 复制到其他主体」弹窗（对齐线上截图）
       * 560×，标题「复用到其他账户」
       * 说明文案：此操作将会把当前账户 xxx 的产品信息覆盖指定账户
       * 工具行：账户名称下拉 + 关键词 + 搜索
       * 表格：勾选 / 账户名称 / 账户 ID；已勾选后「确定」可用 -->
  <el-dialog
    :model-value="modelValue"
    :title="isCompany ? '复用到其他主体' : '复用到其他账户'"
    :width="width + 'px'"
    class="c2t-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="reset"
  >
    <div class="c2t">
      <p class="c2t__desc">
        此操作将会把当前{{ isCompany ? '主体' : '账户' }}
        <span class="c2t__cur">{{ current }}</span>
        的{{ objectName }}覆盖指定{{ isCompany ? '主体' : '账户' }}。
      </p>

      <div class="c2t__tool">
        <el-select v-model="field" size="small" class="c2t__field">
          <el-option :label="isCompany ? '主体名称' : '账户名称'" :value="isCompany ? '主体名称' : '账户名称'" />
        </el-select>
        <el-input v-model="keyword" size="small" class="c2t__kw" :placeholder="isCompany ? '请输入主体关键词' : '请输入关键词'" />
        <el-button size="small" class="c2t__search" @click="onSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </div>

      <el-table :data="filtered" size="small" class="c2t__table" height="220" @selection-change="onSel">
        <el-table-column type="selection" width="40" />
        <el-table-column :label="isCompany ? '主体名称' : '账户名称'" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column :label="isCompany ? '主体 ID' : '账户 ID'" min-width="170">
          <template #default="{ row }">{{ row.id }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button class="c2t-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="c2t-btn c2t-btn--primary" :disabled="!picked.length" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* ACCOUNT：复用到其他账户；COMPANY：复用到其他主体 */
  mode: { type: String, default: 'ACCOUNT' },
  current: { type: String, default: '' },
  /* 弹窗宽度：产品信息 560 / 广告设置 395 */
  width: { type: Number, default: 560 },
  /* 覆盖对象名称：产品信息 / 广告设置 */
  objectName: { type: String, default: '产品信息' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const isCompany = computed(() => props.mode === 'COMPANY');

const ACCOUNTS = [
  { id: '1873758652234324', name: '央广-雷盟-知乎-APP内付费-118-7923357' },
  { id: '1873758652954056', name: '央广-雷盟-知乎-APP内付费-116-7923358' },
  { id: '1873758651659018', name: '央广-雷盟-知乎-APP内付费-120-7923359' },
];
const COMPANIES = [
  { id: '1800000112233445', name: '北京雷盟盛通文化发展有限公司' },
  { id: '1800000223344556', name: '央广时代文化传播有限公司' },
];

const field = ref('账户名称');
const keyword = ref('');
const picked = ref([]);

const list = computed(() => (isCompany.value ? COMPANIES : ACCOUNTS));
const filtered = computed(() =>
  list.value.filter((r) => !keyword.value || r.name.includes(keyword.value) || r.id.includes(keyword.value))
);

function reset() {
  field.value = isCompany.value ? '主体名称' : '账户名称';
  keyword.value = '';
  picked.value = [];
}
function onSel(list) {
  picked.value = list || [];
}
function onSearch() {
  ElMessage.success(`已查询到 ${filtered.value.length} 个${isCompany.value ? '主体' : '账户'}`);
}
function onConfirm() {
  if (!picked.value.length) return;
  ElMessage.success(
    `已复制到 ${picked.value.length} 个${isCompany.value ? '主体' : '账户'}`
  );
  emit('confirm', picked.value.slice());
  emit('update:modelValue', false);
}
</script>

<style scoped>
.c2t__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 20px;
  color: #4e5969;
}
.c2t__cur {
  color: #1d2129;
  font-weight: 500;
}
.c2t__tool {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.c2t__field {
  width: 118px;
}
.c2t__kw {
  flex: 1;
  min-width: 0;
}
.c2t__search {
  width: 32px;
  height: 32px;
  padding: 0;
}
.c2t__table {
  width: 100%;
}
.c2t__table :deep(th.el-table__cell) {
  height: 40px;
  font-size: 13px;
  font-weight: 400;
  color: #1d2129;
  background: #fff;
}
.c2t__table :deep(td.el-table__cell) {
  height: 52px;
  font-size: 13px;
  color: #1d2129;
}
.c2t-btn {
  width: 76px;
  height: 32px;
  font-size: 14px;
  border-color: #d9dbe1;
  color: #1d2129;
}
.c2t-btn--primary {
  width: 88px;
  background: #197afb;
  border-color: #197afb;
  color: #fff;
}
.c2t-btn--primary:hover {
  background: #4a95fc;
  border-color: #4a95fc;
  color: #fff;
}
.c2t-btn--primary.is-disabled,
.c2t-btn--primary.is-disabled:hover {
  background: #a6c8ff;
  border-color: #a6c8ff;
  color: #fff;
}
</style>
