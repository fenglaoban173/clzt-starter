<template>
  <!-- 广告设置 · 分账户 / 分主体 / 分项目 配置面板（对齐线上截图）
       * 左：账户（或主体）列表，选中行淡蓝底 + 绿色勾
       * 右上：复制到其他账户 / 复制到其他主体 / 复制到其他账户 + 全部收起
       * 分项目：左上「添加规则」+ 规则卡片（广告设置规则1 / 收起 / 复制 / 删除）
       * 右：广告评论 / 客户端下载 / 非必填提示 / 类别品牌名称 + 设置按钮 + 摘要行 -->
  <div class="ap">
    <div class="ap__top">
      <div class="ap__top-left">
        <el-button
          v-if="mode === 'PROJECT'"
          type="primary"
          size="small"
          class="ap__add-rule"
          @click="addRule"
        >添加规则</el-button>
      </div>
      <div class="ap__top-right">
        <a v-if="mode === 'PROJECT'" class="ap__link" @click="copyToAccounts">复制到其他账户</a>
        <a v-else-if="mode === 'ACCOUNT'" class="ap__link" @click="copyToAccounts">复制到其他账户</a>
        <a v-else class="ap__link" @click="copyToAccounts">复制到其他主体</a>
        <a v-if="mode === 'PROJECT'" class="ap__link" @click="toggleAll">{{ allFolded ? '全部展开' : '全部收起' }}</a>
      </div>
    </div>

    <div class="ap__main">
      <div class="ap__side">
        <div
          v-for="a in sideList"
          :key="a.id"
          class="ap__row"
          :class="{ 'is-active': a.id === activeId }"
          @click="activeId = a.id"
        >
          <div class="ap__row-txt">
            <p class="ap__row-name ellipsis" :title="a.name">{{ a.name }}</p>
            <p class="ap__row-sub">{{ a.sub }}</p>
          </div>
          <span class="ap__ok">✓</span>
        </div>
      </div>

      <div class="ap__right">
        <div
          v-for="item in forms"
          :key="item.key"
          class="ap__rule"
          :class="{ 'ap__rule--flat': !item.title }"
        >
          <div v-if="item.title" class="ap__rule-head">
            <span class="ap__rule-title">{{ item.title }}</span>
            <span class="ap__rule-ops">
              <a class="ap__link" @click="item.collapsed = !item.collapsed">{{ item.collapsed ? '展开' : '收起' }}</a>
              <el-icon class="ap__rule-copy" @click="copyRule(item)"><CopyDocument /></el-icon>
              <a
                v-if="rules.length > 1"
                class="ap__rule-del"
                @click="removeRule(item)"
              >删除</a>
            </span>
          </div>

          <div v-show="!item.collapsed" class="ap__rule-body">
            <!-- 广告评论 -->
            <div class="ap__field">
              <span class="ap__label">广告评论</span>
              <div class="ap__ctl">
                <el-radio-group v-model="item.body.comment" size="small" class="ap__radio">
                  <el-radio-button value="OFF">不启用</el-radio-button>
                  <el-radio-button value="ON">启用</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- 客户端下载 -->
            <div class="ap__field">
              <span class="ap__label">客户端下载</span>
              <div class="ap__ctl">
                <el-radio-group v-model="item.body.download" size="small" class="ap__radio">
                  <el-radio-button value="OFF">不启用</el-radio-button>
                  <el-radio-button value="ON">启用</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- 非必填提示 -->
            <div v-if="item.alertVisible" class="ap__alert">
              <el-icon class="ap__alert-ico"><WarningFilled /></el-icon>
              <span class="ap__alert-txt">以下内容非必填项，可根据实际投放要求设置。</span>
              <el-icon class="ap__alert-close" @click="item.alertVisible = false"><Close /></el-icon>
            </div>

            <!-- 类别/品牌名称 -->
            <div class="ap__field ap__field--brand">
              <span class="ap__label">类别/品牌名称</span>
              <div class="ap__ctl ap__ctl--col">
                <el-radio-group v-model="item.body.brandSwitch" size="small" class="ap__radio">
                  <el-radio-button value="OFF">不启用</el-radio-button>
                  <el-radio-button value="ON">启用</el-radio-button>
                </el-radio-group>
                <template v-if="item.body.brandSwitch === 'ON'">
                  <el-button type="primary" size="small" class="ap__set" @click="openBrand(item)">设置</el-button>
                  <div class="ap__summary">
                    <span class="ap__summary-item">所属类别： <em>{{ item.body.category || '-' }}</em></span>
                    <span class="ap__summary-item">品牌名称： <em>{{ item.body.brand || '-' }}</em></span>
                    <span class="ap__summary-item">二级品牌名称： <em>{{ item.body.secondBrand || '-' }}</em></span>
                  </div>
                  <p v-if="!item.body.category" class="ap__warn">请选择类别/品牌名称</p>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 复用到其他账户 / 其他主体（广告设置：395 宽） -->
    <BatchCopyToDialog
      v-model="copyVisible"
      :mode="copyMode"
      :current="copyCurrent"
      :width="395"
      object-name="广告设置"
      @confirm="copyVisible = false"
    />
    <!-- 设置类别/品牌名称 -->
    <BatchBrandSettingDialog
      v-model="brandVisible"
      :current="brandTarget ? brandTargetName : ''"
      :value="brandTarget ? { category: brandTarget.body.category, brand: brandTarget.body.brand, secondBrand: brandTarget.body.secondBrand } : {}"
      @confirm="onBrandConfirm"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { Close, CopyDocument, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BatchCopyToDialog from './BatchCopyToDialog.vue';
import BatchBrandSettingDialog from './BatchBrandSettingDialog.vue';

const props = defineProps({
  mode: { type: String, default: 'ACCOUNT' },
});

const ACCOUNTS = [
  { id: 'a1', no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-7923355' },
  { id: 'a2', no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-7923357' },
  { id: 'a3', no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-7923358' },
  { id: 'a4', no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-7923359' },
];

function filledBody() {
  return { comment: 'ON', download: 'ON', brandSwitch: 'ON', category: '', brand: '', secondBrand: '' };
}
function emptyBody() {
  return { comment: 'OFF', download: 'OFF', brandSwitch: 'OFF', category: '', brand: '', secondBrand: '' };
}
function makeRule(key, title, body) {
  return { key, title, collapsed: false, alertVisible: true, body };
}

const activeId = ref('a1');
const bodies = reactive({});
/* 每个账户一份稳定包装对象，避免切换时重建导致输入丢失 */
const wrappers = reactive({});
ACCOUNTS.forEach((a) => {
  bodies[a.id] = filledBody();
  wrappers[a.id] = { key: a.id, title: '', collapsed: false, alertVisible: true, body: bodies[a.id] };
});
const companyBody = reactive(filledBody());
const companyWrapper = reactive({ key: 'c1', title: '', collapsed: false, alertVisible: true, body: companyBody });

const sideList = computed(() => {
  if (props.mode === 'COMPANY') {
    return [{ id: 'c1', name: '北京雷盟盛通文化发展有限公司', sub: '4 个账户' }];
  }
  return ACCOUNTS.map((a) => ({ id: a.id, name: a.name, sub: a.no, label: a.name }));
});

let seq = 1;
const rules = reactive([makeRule('r1', '广告设置规则1', filledBody())]);

function addRule() {
  seq += 1;
  rules.push(makeRule(`r${seq}`, `广告设置规则${seq}`, emptyBody()));
  ElMessage.success(`已添加广告设置规则${seq}`);
}
function removeRule(item) {
  if (rules.length <= 1) return;
  const i = rules.findIndex((r) => r.key === item.key);
  if (i < 0) return;
  rules.splice(i, 1);
  ElMessage.success('已删除该规则');
}
const allFolded = computed(() => rules.length > 0 && rules.every((r) => r.collapsed));
function toggleAll() {
  const next = !allFolded.value;
  rules.forEach((r) => { r.collapsed = next; });
}
function copyRule(item) {
  seq += 1;
  rules.push(makeRule(`r${seq}`, `广告设置规则${seq}`, { ...item.body }));
  ElMessage.success(`已复制为广告设置规则${seq}`);
}

const forms = computed(() => {
  if (props.mode === 'PROJECT') return rules;
  if (props.mode === 'COMPANY') return [companyWrapper];
  return [wrappers[activeId.value]];
});

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

/* 设置类别/品牌名称 */
const brandVisible = ref(false);
const brandTarget = ref(null);
const brandTargetName = computed(() => copyCurrent.value);
function openBrand(item) {
  brandTarget.value = item;
  brandVisible.value = true;
}
function onBrandConfirm(payload) {
  if (!brandTarget.value) return;
  brandTarget.value.body.category = payload.category || '';
  brandTarget.value.body.brand = payload.brand || '';
  brandTarget.value.body.secondBrand = payload.secondBrand || '';
  ElMessage.success('已设置类别/品牌名称');
}
</script>

<style scoped>
.ap {
  border: 1px solid #e5e6eb;
  background: #fff;
}
.ap__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px 0 0;
  border-bottom: 1px solid #f2f3f5;
}
.ap__top-left {
  width: 200px;
  padding-left: 16px;
}
.ap__top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ap__link {
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.ap__add-rule {
  width: 84px;
}
.ap__main {
  display: flex;
  align-items: flex-start;
}
.ap__side {
  flex: none;
  width: 200px;
  border-right: 1px solid #f2f3f5;
}
.ap__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.ap__row.is-active {
  background: #f2f7ff;
}
.ap__row-txt {
  flex: 1;
  min-width: 0;
}
.ap__row-name {
  margin: 0;
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap__row-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #86909c;
}
.ap__ok {
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
.ap__right {
  flex: 1;
  min-width: 0;
  padding: 16px;
}
.ap__rule {
  border: 1px solid #e5e6eb;
  border-radius: 3px;
  overflow: hidden;
}
.ap__rule--flat {
  border: 0;
}
.ap__rule + .ap__rule {
  margin-top: 12px;
}
.ap__rule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
}
.ap__rule-title {
  font-size: 13px;
  color: #1d2129;
}
.ap__rule-ops {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.ap__rule-copy {
  font-size: 15px;
  color: #197afb;
  cursor: pointer;
}
.ap__rule-del {
  font-size: 13px;
  color: #f53f3f;
  cursor: pointer;
}
.ap__rule-body {
  padding: 16px;
}
.ap__field {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.ap__field--brand {
  align-items: flex-start;
  margin-bottom: 0;
}
.ap__label {
  flex: none;
  width: 104px;
  font-size: 13px;
  color: #4e5969;
  line-height: 32px;
}
.ap__ctl {
  flex: 1;
  min-width: 0;
}
.ap__ctl--col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.ap__radio :deep(.el-radio-button__inner) {
  padding: 0 18px;
  height: 32px;
  line-height: 30px;
  font-size: 13px;
}
.ap__alert {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  margin-bottom: 20px;
  padding: 0 12px;
  background: #eff4ff;
  border-radius: 3px;
  font-size: 13px;
  color: #1d2129;
}
.ap__alert-ico {
  color: #197afb;
  font-size: 14px;
}
.ap__alert-txt {
  flex: 1;
  min-width: 0;
}
.ap__alert-close {
  color: #a9aeb8;
  cursor: pointer;
  font-size: 12px;
}
.ap__set {
  width: 120px;
  height: 36px;
}
.ap__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 13px;
  color: #86909c;
}
.ap__summary-item em {
  font-style: normal;
  color: #4e5969;
}
.ap__warn {
  margin: 4px 0 0;
  font-size: 13px;
  color: #f53f3f;
}
</style>
