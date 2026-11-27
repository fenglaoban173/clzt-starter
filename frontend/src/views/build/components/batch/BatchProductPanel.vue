<template>
  <!-- 产品信息 · 分账户 / 分主体 / 分项目 配置面板（对齐线上截图）
       * 左侧：账户（或主体）列表，选中行淡蓝底 + 绿色勾
       * 右上：复制到其他账户 / 复制到其他主体（主体模式置灰）/ 复制到其他账户 + 全部收起
       * 左侧顶部（仅分项目）：添加规则按钮
       * 右侧：产品名称 / 产品主图 / 产品卖点；分项目为「规则1 / 规则2…」卡片，可收起、可复制 -->
  <div class="pp">
    <div class="pp__top">
      <div class="pp__top-left">
        <el-button
          v-if="mode === 'PROJECT'"
          type="primary"
          size="small"
          class="pp__add-rule"
          @click="addRule"
        >添加规则</el-button>
      </div>
      <div class="pp__top-right">
        <a v-if="mode === 'ACCOUNT'" class="pp__link" @click="copyToAccounts">复制到其他账户</a>
        <a v-else-if="mode === 'COMPANY'" class="pp__link" @click="copyToAccounts">复制到其他主体</a>
        <span v-else class="pp__ops">
          <a class="pp__link" @click="copyToAccounts">复制到其他账户</a>
          <a class="pp__link" @click="toggleAll">{{ allFolded ? '全部展开' : '全部收起' }}</a>
        </span>
      </div>
    </div>

    <div class="pp__main">
      <!-- 左：账户 / 主体 -->
      <div class="pp__side">
        <div
          v-for="a in sideList"
          :key="a.id"
          class="pp__row"
          :class="{ 'is-active': a.id === activeId }"
          @click="activeId = a.id"
        >
          <div class="pp__row-txt">
            <p class="pp__row-name ellipsis" :title="a.name">{{ a.name }}</p>
            <p class="pp__row-sub">{{ a.sub }}</p>
          </div>
          <span class="pp__ok">✓</span>
        </div>
      </div>

      <!-- 右：表单 / 规则卡片 -->
      <div class="pp__right">
        <div
          v-for="item in forms"
          :key="item.key"
          class="pp__rule"
          :class="{ 'pp__rule--flat': !item.title }"
        >
          <div v-if="item.title" class="pp__rule-head">
            <span class="pp__rule-title">{{ item.title }}</span>
            <span class="pp__rule-ops">
              <a class="pp__link" @click="item.collapsed = !item.collapsed">{{ item.collapsed ? '展开' : '收起' }}</a>
              <el-icon class="pp__rule-copy" @click="copyRule(item)"><CopyDocument /></el-icon>
              <a v-if="rules.length > 1" class="pp__rule-del" @click="removeRule(item)">删除</a>
            </span>
          </div>

          <div v-show="!item.collapsed" class="pp__rule-body">
            <!-- 产品名称 -->
            <div class="pp__field">
              <span class="pp__label">产品名称</span>
              <div class="pp__ctl">
                <el-input
                  v-model="item.body.name"
                  size="small"
                  class="pp__input"
                  maxlength="20"
                  placeholder="1-20个字符"
                  show-word-limit
                />
                <a class="pp__ref" @click="refAppName">引用应用名称</a>
              </div>
            </div>

            <!-- 产品主图 -->
            <div class="pp__field pp__field--top">
              <span class="pp__label">产品主图</span>
              <div class="pp__ctl">
                <div class="pp__imgs">
                  <div v-for="(im, ii) in item.body.images" :key="ii" class="pp__img">
                    <div class="pp__img-cover" :style="{ background: im.bg }">
                      <span class="pp__img-word">{{ im.label }}</span>
                    </div>
                    <el-icon class="pp__img-del" @click="item.body.images.splice(ii, 1)"><Close /></el-icon>
                  </div>
                  <div class="pp__upload" @click="openPicker(item)">
                    <span class="pp__upload-plus">+</span>
                    <span class="pp__upload-txt">图片({{ item.body.images.length }}/10)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 产品卖点 -->
            <div class="pp__field pp__field--top">
              <span class="pp__label">产品卖点</span>
              <div class="pp__ctl">
                <div class="pp__sell-row">
                  <el-input
                    v-model="item.pointInput"
                    size="small"
                    class="pp__input pp__input--short"
                    placeholder="空格分隔,最多10个,每个标签不超过9个字"
                    @keyup.enter="addPoint(item)"
                  />
                  <el-button size="small" class="pp__btn-primary" @click="addPoint(item)">添加（回车键）</el-button>
                  <el-button size="small" class="pp__btn" @click="openSelling(item)">查看推荐</el-button>
                </div>
                <div class="pp__sell-row">
                  <el-select
                    v-model="item.pointTpl"
                    size="small"
                    class="pp__input pp__input--short"
                    placeholder="选择模板"
                    clearable
                  >
                    <el-option v-for="t in templates" :key="t" :label="t" :value="t" />
                  </el-select>
                  <el-button size="small" class="pp__btn" @click="openTpl(item)">保存为模板</el-button>
                </div>
                <div class="pp__tags">
                  <div class="pp__tags-head">
                    <span>已添加标签</span>
                    <a class="pp__link" @click="item.body.points = []">清空 ⟳</a>
                  </div>
                  <div class="pp__tags-body">
                    <span v-for="(p, pi) in item.body.points" :key="pi" class="pp__tag">
                      {{ p }}
                      <el-icon class="pp__tag-x" @click="item.body.points.splice(pi, 1)"><Close /></el-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <MaterialPickerDialog v-model="pickerVisible" @submit="onMaterialSubmit" />
    <!-- 产品信息：复用到其他账户 / 其他主体 -->
    <BatchCopyToDialog
      v-model="copyVisible"
      :mode="copyMode"
      :current="copyCurrent"
      @confirm="onCopyDone"
    />
    <!-- 产品卖点：查看推荐 -->
    <BatchSellingPointDialog
      v-model="sellingVisible"
      :existing="sellingItem ? sellingItem.body.points : []"
      @confirm="onSellingConfirm"
    />
    <!-- 产品卖点：保存为模板 -->
    <BatchSaveTemplateDialog v-model="tplVisible" @confirm="onTplConfirm" />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { Close, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MaterialPickerDialog from '../MaterialPickerDialog.vue';
import BatchCopyToDialog from './BatchCopyToDialog.vue';
import BatchSellingPointDialog from './BatchSellingPointDialog.vue';
import BatchSaveTemplateDialog from './BatchSaveTemplateDialog.vue';

const props = defineProps({
  mode: { type: String, default: 'ACCOUNT' },
  /* 统一配置里的已有主图（id 列表 + 素材字典），分账户模式沿用同一份初始数据 */
  seedImages: { type: Array, default: () => [] },
});

const BANK = [
  '全程高能反转不断',
  '女主逆袭手撕仇人',
  '爱恨拉扯越看越上头',
  '多重马甲惊艳全场',
  '开局虐渣爽感拉满',
];

const ACCOUNTS = [
  { id: 'a1', no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-7923355' },
  { id: 'a2', no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-7923357' },
  { id: 'a3', no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-7923358' },
  { id: 'a4', no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-7923359' },
];

const ZHIHU = { label: '知乎', bg: 'linear-gradient(135deg,#4b7bfd,#2f5cf0)' };

function filledBody() {
  return { name: '知乎', images: [{ ...ZHIHU }], points: [...BANK] };
}
function emptyBody() {
  return { name: '', images: [], points: [] };
}

const activeId = ref('a1');
/* 每个账户一份独立内容（切账户各自保留） */
const bodies = reactive({});
ACCOUNTS.forEach((a) => {
  bodies[a.id] = filledBody();
});
/* 分主体：一个主体下 4 个账户 */
const companyBody = reactive(filledBody());

const sideList = computed(() => {
  if (props.mode === 'COMPANY') {
    return [{ id: 'c1', name: '北京雷盟盛通文化发展有限公司', sub: '4 个账户' }];
  }
  return ACCOUNTS.map((a) => ({ id: a.id, name: a.name, sub: a.no }));
});

/* 分项目：规则卡片列表（默认只有规则1，内容同统一配置；新增规则为空表单） */
let seq = 1;
const rules = reactive([
  { key: 'r1', title: '规则1', collapsed: false, body: filledBody(), pointInput: '', pointTpl: '' },
]);

function newRule() {
  seq += 1;
  return { key: `r${seq}`, title: `规则${seq}`, collapsed: false, body: emptyBody(), pointInput: '', pointTpl: '' };
}

/* 非分项目模式 -> 单个表单；分项目 -> 规则卡片 */
const forms = computed(() => {
  if (props.mode === 'PROJECT') return rules;
  if (props.mode === 'COMPANY') {
    return [{ key: 'c1', title: '', collapsed: false, body: companyBody, pointInput: '', pointTpl: '' }];
  }
  return [
    {
      key: activeId.value,
      title: '',
      collapsed: false,
      body: bodies[activeId.value],
      pointInput: '',
      pointTpl: '',
    },
  ];
});

const allFolded = computed(() => rules.length > 0 && rules.every((r) => r.collapsed));

function addRule() {
  rules.push(newRule());
  ElMessage.success(`已添加规则${rules.length}`);
}
/* 需求：产品信息板块添加规则后，新规则也要支持删除（至少保留 1 条） */
function removeRule(item) {
  if (rules.length <= 1) return;
  const i = rules.findIndex((r) => r.key === item.key);
  if (i < 0) return;
  rules.splice(i, 1);
  ElMessage.success('已删除该规则');
}
function toggleAll() {
  const next = !allFolded.value;
  rules.forEach((r) => { r.collapsed = next; });
}
function copyRule(item) {
  const copy = {
    key: `r${++seq}`,
    title: `规则${seq}`,
    collapsed: false,
    body: {
      name: item.body.name,
      images: item.body.images.map((x) => ({ ...x })),
      points: [...item.body.points],
    },
    pointInput: '',
    pointTpl: '',
  };
  rules.push(copy);
  ElMessage.success(`已复制为${copy.title}`);
}
/* 复用到其他账户 / 主体：打开弹窗，确认后仅提示（本地原型不回写目标账户） */
const copyVisible = ref(false);
const copyMode = ref('ACCOUNT');
const copyCurrent = computed(() => {
  if (props.mode === 'COMPANY') return '北京雷盟盛通文化发展有限公司';
  const a = ACCOUNTS.find((x) => x.id === activeId.value);
  return a ? a.name : '';
});
function copyToAccounts() {
  copyMode.value = props.mode === 'COMPANY' ? 'COMPANY' : 'ACCOUNT';
  copyVisible.value = true;
}
function onCopyDone() {
  copyVisible.value = false;
}
function refAppName() {
  ElMessage.info('引用应用名称（本地原型）');
}
function addPoint(item) {
  const list = String(item.pointInput || '').split(/[\s,，]+/).map((t) => t.trim()).filter(Boolean);
  if (!list.length) {
    ElMessage.warning('请输入产品卖点');
    return;
  }
  item.body.points = [...new Set([...item.body.points, ...list])].slice(0, 10);
  item.pointInput = '';
}

/* 查看推荐：产品卖点弹窗 */
const sellingVisible = ref(false);
const sellingItem = ref(null);
function openSelling(item) {
  sellingItem.value = item;
  sellingVisible.value = true;
}
function onSellingConfirm(list) {
  if (!sellingItem.value || !list || !list.length) return;
  sellingItem.value.body.points = [
    ...new Set([...sellingItem.value.body.points, ...list]),
  ].slice(0, 10);
  ElMessage.success(`已添加 ${list.length} 条产品卖点`);
}

/* 保存为模板：模板名称弹窗，确认后写入模板下拉 */
const templates = ref([]);
const tplVisible = ref(false);
const tplItem = ref(null);
function openTpl(item) {
  tplItem.value = item;
  tplVisible.value = true;
}
function onTplConfirm(name) {
  templates.value = [...templates.value, name];
  if (tplItem.value) tplItem.value.pointTpl = name;
}

/* 产品主图：复用「素材库」选择弹窗 */
const pickerVisible = ref(false);
let pickingItem = null;
function openPicker(item) {
  pickingItem = item;
  pickerVisible.value = true;
}
function onMaterialSubmit(list) {
  if (!pickingItem || !list || !list.length) return;
  const picked = list.map((m, i) => ({
    label: (m.name || '图').slice(0, 2),
    bg: ['linear-gradient(135deg,#4b7bfd,#2f5cf0)', 'linear-gradient(135deg,#ff7a45,#ff4d4f)', 'linear-gradient(135deg,#36cfc9,#13c2c2)'][i % 3],
  }));
  pickingItem.body.images = [...pickingItem.body.images, ...picked].slice(0, 10);
  ElMessage.success(`已添加 ${picked.length} 张产品主图`);
}
</script>

<style scoped>
.pp {
  border: 1px solid #e5e6eb;
  background: #fff;
}
.pp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px 0 0;
  border-bottom: 1px solid #f2f3f5;
}
.pp__top-left {
  width: 200px;
  padding-left: 16px;
}
.pp__add-rule {
  width: 84px;
}
.pp__top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pp__ops {
  display: inline-flex;
  gap: 16px;
}
.pp__link {
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.pp__link--disabled {
  color: #c9cdd4;
  cursor: not-allowed;
}
.pp__main {
  display: flex;
  align-items: flex-start;
}
.pp__side {
  flex: none;
  width: 200px;
  border-right: 1px solid #f2f3f5;
}
.pp__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.pp__row.is-active {
  background: #f2f7ff;
}
.pp__row-txt {
  flex: 1;
  min-width: 0;
}
.pp__row-name {
  margin: 0;
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pp__row-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #86909c;
}
.pp__ok {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #fff;
  background: #00b42a;
  border-radius: 50%;
}
.pp__right {
  flex: 1;
  min-width: 0;
  padding: 16px;
}
.pp__rule {
  border: 1px solid #e5e6eb;
  border-radius: 3px;
  overflow: hidden;
}
.pp__rule--flat {
  border: 0;
}
.pp__rule + .pp__rule {
  margin-top: 12px;
}
.pp__rule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
}
.pp__rule-title {
  font-size: 13px;
  color: #1d2129;
}
.pp__rule-ops {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.pp__rule-copy {
  font-size: 15px;
  color: #197afb;
  cursor: pointer;
}
.pp__rule-del {
  font-size: 13px;
  color: #f53f3f;
  cursor: pointer;
}
.pp__rule-body {
  padding: 16px;
}
.pp__field {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}
.pp__field--top {
  align-items: flex-start;
}
.pp__label {
  flex: none;
  width: 88px;
  font-size: 13px;
  color: #1d2129;
  line-height: 28px;
}
.pp__ctl {
  flex: 1;
  min-width: 0;
}
.pp__input {
  width: 360px;
}
.pp__input--short {
  width: 300px;
}
.pp__ref {
  margin-left: 16px;
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.pp__imgs {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pp__img {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 4px;
  overflow: hidden;
}
.pp__img-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 14px;
}
.pp__img-word {
  font-size: 13px;
}
.pp__img-del {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
}
.pp__upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border: 1px dashed #d9dbe1;
  border-radius: 4px;
  cursor: pointer;
}
.pp__upload:hover {
  border-color: #197afb;
}
.pp__upload-plus {
  font-size: 18px;
  color: #86909c;
  line-height: 1;
}
.pp__upload-txt {
  margin-top: 4px;
  font-size: 12px;
  color: #4e5969;
}
.pp__sell-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.pp__btn {
  height: 28px;
  font-size: 13px;
}
.pp__btn-primary {
  height: 28px;
  font-size: 13px;
  color: #197afb;
  background: #fff;
  border-color: #197afb;
}
.pp__tags {
  width: 360px;
  border: 1px solid #e5e6eb;
  border-radius: 2px;
}
.pp__tags-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
  color: #4e5969;
  background: #f7f8fa;
  border-bottom: 1px solid #f2f3f5;
}
.pp__tags-body {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 108px;
  padding: 12px;
  align-content: flex-start;
}
.pp__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 158px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  color: #1d2129;
  background: #f2f3f5;
  border-radius: 2px;
}
.pp__tag-x {
  flex: none;
  font-size: 12px;
  color: #86909c;
  cursor: pointer;
}
</style>
