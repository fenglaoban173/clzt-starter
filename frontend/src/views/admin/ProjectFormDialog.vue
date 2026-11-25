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
      <!-- ① 基本信息（线上 label 宽 136px，控件 margin-left 136px） -->
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

      <!-- ② 项目成员：选「指定人员可见」展开成员选择区（线上 .depart-tree / .member-tree） -->
      <div v-show="form.visibility === 'visible'" class="pj-members">
        <div class="pj-members__search">
          <el-input
            v-model="memberKeyword"
            size="small"
            placeholder="请输入关键字"
            class="pj-members__input"
          >
            <template #suffix>
              <span class="pj-members__suffix"><el-icon><Search /></el-icon></span>
            </template>
          </el-input>
        </div>
        <div class="pj-members__panels">
          <div class="pj-members__left">
            <div class="pj-members__tabs">
              <span
                class="pj-members__tab"
                :class="{ active: memberTab === 'dept' }"
                @click="memberTab = 'dept'"
              >部门</span>
              <span
                class="pj-members__tab"
                :class="{ active: memberTab === 'person' }"
                @click="memberTab = 'person'"
              >人员</span>
            </div>
            <div class="pj-members__tree">
              <el-checkbox
                v-model="checkAll"
                :indeterminate="checkIndeterminate"
                class="pj-members__all"
                @change="toggleAllMembers"
              >全选</el-checkbox>
              <el-tree
                ref="memberTreeRef"
                :data="memberTreeData"
                node-key="id"
                show-checkbox
                :props="{ label: 'label', children: 'children' }"
                :filter-node-method="filterMember"
                class="pj-tree"
                @check="onMemberCheck"
              />
            </div>
          </div>
          <div class="pj-members__right">
            <div class="pj-members__right-head">
              <span>已选可见内容({{ checkedMembers.length }})</span>
              <span class="pj-members__clear" @click="clearMembers">清空</span>
            </div>
            <div class="pj-members__right-body">
              <div v-for="m in checkedMembers" :key="m.id" class="pj-members__item">{{ m.label }}</div>
              <div v-if="!checkedMembers.length" class="pj-members__empty">请选择可见人员</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ③ 防出错设置 -->
      <p class="pj-block-title">
        防出错设置
        <el-tooltip content="设置后，投放该项目对应转化目标的出价将受到限制" placement="top">
          <span class="pj-qmark">?</span>
        </el-tooltip>
      </p>

      <!-- 媒体页签（线上 el-tabs--border-card：8 个媒体 + 智擎版本） -->
      <div class="pj-tabs">
        <div class="pj-tabs__header">
          <button
            v-for="m in MEDIA_TABS"
            :key="m.key"
            type="button"
            class="pj-media-tab"
            :class="{ active: activeMedia === m.key, 'pj-media-tab--zq': m.zq }"
            @click="activeMedia = m.key"
          >{{ m.name }}</button>
        </div>

        <div class="pj-tabs__content">
          <div
            v-for="m in MEDIA_TABS"
            v-show="activeMedia === m.key"
            :key="m.key"
            class="pj-pane"
          >
            <!-- 告警条（线上仅「巨量广告」有；「智擎版本」是告警里的前缀标签，不是页签） -->
            <el-alert
              v-if="m.alert"
              class="pj-alert"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #title>
                <span class="pj-alert__tag">智擎版本</span><span class="pj-alert__desc">竞价策略仅支持稳定成本-常规版和最大转化</span>
              </template>
            </el-alert>

            <!-- 巨量本地推：顶部的「禁用规则外分支」开关组（线上 .mb16 + .rule-tip） -->
            <div v-if="m.extra === 'localads'" class="pj-localads">
              <span class="pj-localads__label">禁用规则外分支</span>
              <el-radio-group v-model="mediaState[m.key].localForbid" class="pj-radio pj-radio--sm">
                <el-radio-button value="false">不开启</el-radio-button>
                <el-radio-button value="true">开启</el-radio-button>
              </el-radio-group>
              <p class="pj-rule-tip">开启后仅允许搭建规则内的广告</p>
            </div>

            <!-- B站营销：深度优化方式 + 监测链接防出错（线上 .bl-prevent-error） -->
            <div v-if="m.extra === 'bilibili'" class="pj-bl">
              <div class="pj-bl__row">
                <span class="pj-bl__label">深度优化方式必填</span>
                <el-switch v-model="mediaState[m.key].blDeepRequired" class="pj-switch" />
                <span class="pj-bl__tip">{{ mediaState[m.key].blDeepRequired ? '已开启' : '未开启' }}</span>
                <el-tooltip content="开启后，B 站程序化创编必须选择深度优化方式" placement="top">
                  <span class="pj-qmark">?</span>
                </el-tooltip>
              </div>
              <div class="pj-bl__section">
                <span class="pj-bl__label">监测链接防出错</span>
                <div class="pj-bl__content">
                  <div v-if="!mediaState[m.key].blLinks.length" class="pj-bl__empty">暂无规则</div>
                  <div v-for="l in mediaState[m.key].blLinks" :key="l.id" class="pj-bl__link">
                    <el-input v-model="l.name" size="small" placeholder="请输入监测链接名称" class="pj-bl__input" />
                    <el-icon class="pj-bl__del" @click="removeBlLink(m.key, l.id)"><Delete /></el-icon>
                  </div>
                  <div class="pj-addnew pj-addnew--sm" @click="addBlLink(m.key)">
                    <el-icon><Plus /></el-icon> 新增规则
                  </div>
                  <p class="pj-bl__hint">
                    必填=必须填写；可叠加「必须包含」校验。必须为空=该链接必须留空。规则数上限 = 监测链接类型数（当前最多 2 条）。
                  </p>
                </div>
              </div>
            </div>

            <!-- 规则区：空态 / 已添加的可编辑规则行 -->
            <div v-if="!mediaState[m.key].rules.length" class="pj-hold">暂无数据</div>
            <div
              v-for="rule in mediaState[m.key].rules"
              :key="rule.id"
              class="pj-rule"
            >
              <el-select v-model="rule.type" size="small" class="pj-rule__type">
                <el-option v-for="t in ruleTypes()" :key="t" :label="t" :value="t" />
              </el-select>
              <span class="pj-rule__text">选择</span>
              <el-select v-model="rule.target" size="small" class="pj-rule__target" placeholder="请选择">
                <el-option v-for="t in targetOptions(m, rule.type)" :key="t" :label="t" :value="t" />
              </el-select>
              <span class="pj-rule__text">时，出价不得超过</span>
              <el-input v-model="rule.limit" size="small" placeholder="请输入" class="pj-rule__limit" />
              <el-icon class="pj-rule__del" @click="removeRule(m.key, rule.id)"><Delete /></el-icon>
            </div>

            <div class="pj-addnew" @click="addRule(m.key)">
              <el-icon><Plus /></el-icon> 新增规则
            </div>

            <div class="pj-check-row">
              <el-tooltip content="必须设置至少一个防出错规则，才能勾选此选项" placement="top">
                <el-checkbox
                  v-model="mediaState[m.key].forbidOutside"
                  class="pj-check"
                  @change="onForbidOutsideChange(m.key)"
                >禁用规则外分支</el-checkbox>
              </el-tooltip>
              <el-tooltip content="勾选后，该项目只能投放已设置的优化目标/深度优化目标/竞价策略" placement="top">
                <span class="pj-qmark">?</span>
              </el-tooltip>
            </div>

            <div class="pj-deep">
              <span class="pj-deep__label">深度优化方式必填</span>
              <el-switch v-model="mediaState[m.key].deepRequired" class="pj-switch" />
              <el-tooltip content="开启后，新建广告时必须选择深度优化目标" placement="top">
                <span class="pj-qmark">?</span>
              </el-tooltip>
            </div>
          </div>
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
 * 线上实测（1920×1080，read-only 采集）：
 *   弹窗 rect 992×725（x=464 y=178），标题「新增项目」
 *   header 51px / body 600px（可滚动）/ footer 74px
 *   表单 label 宽 136px（x=496），控件 margin-left 136px（x=632）
 *     项目名称  input  360×33  placeholder 请输入项目名称
 *     备注      textarea 360×64 placeholder 请输入项目备注
 *     项目负责人 select  173×33 placeholder 请选择项目负责人（可搜索）
 *     项目成员  radio   183×32 默认 all（所有人可见）
 *   「指定人员可见」→ 展开成员选择区：搜索框 + 部门/人员双树 + 已选可见内容(N) + 清空
 *   防出错设置：8 个媒体页签（el-tabs--border-card，高 40px）+ 告警条 + 暂无数据
 *              + 新增规则（虚线整行按钮）+ 禁用规则外分支 + 深度优化方式必填
 *   「新增规则」点击后 → 规则行：类型 select(120) + 选择 + 目标 select(160)
 *                       + 时，出价不得超过 + 上限 input(120) + 删除图标
 *   底部：取消（plain）/ 确 定（primary），均 120×32
 * ------------------------------------------------------------------ */
import { computed, reactive, ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, Delete } from '@element-plus/icons-vue';

/** 线上「项目负责人」下拉（38 项，实测自线上 DOM，顺序照抄） */
const OWNER_OPTIONS = [
  '李倩', '武文琦', '刘松涵', '吕瑶', '申旭阳', '裴心怡', '刘望', '李玉玲',
  '冯逸', '杜浩', '刘欢', '田博文', '汪玲丽', '邓艺爽', '张瑞凯', '王研',
  '张浩', '黄莹曦', '翟子涵', '倪秀云', '张从浩', '王春雷', '郭峻宇', '孙诗源',
  'gongwenqing', 'lixue', 'jiangxin', '1944364300', 'lk18067488517',
  '北京央广时代文化传播有限公司', '李坤洪 17790290399 likunhong', 'chenpeihua',
  '1304275504', '文清滨', '李若涵', '杨浩蒙', '李崇霄', '邹镇泽',
];

/** 防出错设置的媒体页签（线上 8 个媒体，顺序照抄；「智擎版本」是告警条里的标签，不是页签） */
const MEDIA_TABS = [
  { key: 'tt', name: '巨量广告', alert: '智擎版本竞价策略仅支持稳定成本-常规版和最大转化' },
  { key: 'gdt', name: '腾讯广告' },
  { key: 'ks', name: '磁力智投' },
  { key: 'bd', name: '百度信息流' },
  { key: 'jn_up', name: '磁力金牛(新版)' },
  { key: 'localads', name: '巨量本地推', extra: 'localads' },
  { key: 'bds', name: '百度电商' },
  { key: 'bilibili', name: 'B站营销', extra: 'bilibili' },
];
const MEDIA_MAP = MEDIA_TABS.reduce((m, x) => ((m[x.key] = x), m), {});

/** 规则类型（线上 .prevent-rule 第一个下拉：优化目标 / 深度优化目标 / 竞价策略） */
const RULE_TYPES = ['优化目标', '深度优化目标', '竞价策略'];

/** 各类型的目标选项（线上实测下拉文案，节选常用项） */
const TARGET_OPTIONS = {
  优化目标: [
    '点击量', '展示量', '表单提交', '电话拨打', '地图搜索', '下载完成', '按钮跳转',
    '关键页面浏览', '激活', 'qq咨询', '抽奖', '投票', '注册', '安装完成',
    '智能电话-确认拨打', '智能电话-有效接通', '有效咨询', 'app内下单', 'app内访问',
    '加购（电商）', 'app内付费', '销售线索', '关键行为', '有效获客', '卡券领取',
    '有效沟通', '预授信', '授信', '放款', '广告变现ROI', '店铺导流', '私信服务',
    '私信留资', '粉丝增长', '小程序互动', '付费ROI', '7日留存', '多转化', '留存天数',
    '添加企业微信', '内容种草', '商品购买', '页面跳转', '私信消息', '分享', '其他',
  ],
  深度优化目标: ['付费ROI', '首日ROI', '7日ROI', '深度转化目标', '激活', '付费', '表单', '电话', 'ROI'],
  竞价策略: ['稳定成本-常规版', '最大转化', '最大转化-常规版', '控成本投放', '放量投放'],
};

/** 巨量本地推单独一套目标（线上 .rule-tip 面板） */
const LOCALADS_TARGETS = {
  优化目标: ['激活', '注册', '付费', '下单', '线索', '留存', 'ROI', '唤起'],
  深度优化目标: ['付费ROI', 'ROI', '激活', '付费'],
  竞价策略: ['稳定成本-常规版', '最大转化', 'oCPM', '最大化投放'],
};

/** 成员选择区（线上「部门」树 + 「人员」树） */
const MEMBER_TREE_DEPT = [
  {
    id: 'role-director',
    label: '编导',
    children: [
      { id: 'u-1', label: '刘松涵' },
      { id: 'u-2', label: '杨浩蒙' },
      { id: 'u-3', label: '黄莹曦' },
    ],
  },
  {
    id: 'role-editor',
    label: '剪辑',
    children: [
      { id: 'u-4', label: '申旭阳' },
      { id: 'u-5', label: '王研' },
    ],
  },
  {
    id: 'dept-default',
    label: '默认部门',
    children: [
      { id: 'u-6', label: '张浩' },
      { id: 'u-7', label: '翟子涵' },
      { id: 'u-8', label: '倪秀云' },
      { id: 'u-9', label: '北京央广时代文化传播有限公司' },
    ],
  },
];
const MEMBER_TREE_PERSON = [
  { id: 'u-1', label: '刘松涵' },
  { id: 'u-2', label: '杨浩蒙' },
  { id: 'u-3', label: '黄莹曦' },
  { id: 'u-4', label: '申旭阳' },
  { id: 'u-5', label: '王研' },
  { id: 'u-6', label: '张浩' },
  { id: 'u-7', label: '翟子涵' },
  { id: 'u-8', label: '倪秀云' },
  { id: 'u-9', label: '北京央广时代文化传播有限公司' },
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
const activeMedia = ref('tt');

/** 每个媒体的防出错设置状态 */
const mediaState = reactive({});

/** 成员选择区状态 */
const memberTreeRef = ref(null);
const memberKeyword = ref('');
const memberTab = ref('dept');
const checkAll = ref(false);
const checkIndeterminate = ref(false);
const checkedMembers = ref([]);

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

/* ------------------------------ 初始化 ------------------------------ */

let uid = 1;
function nextId() {
  uid += 1;
  return `r${uid}`;
}

/** 新建一个媒体的防出错状态 */
function createMediaState() {
  return {
    rules: [],
    forbidOutside: false,
    deepRequired: false,
    localForbid: 'false',
    blDeepRequired: false,
    blLinks: [],
  };
}

/** 打开弹窗时重置 / 回填 */
watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    const src = (props.mode === 'edit' && props.row && props.row.prevent) || {};
    MEDIA_TABS.forEach((m) => {
      const base = createMediaState();
      const s = src[m.key];
      if (s) {
        base.rules = (s.rules || []).map((r) => ({ ...r }));
        base.forbidOutside = !!s.forbidOutside;
        base.deepRequired = !!s.deepRequired;
        base.localForbid = s.localForbid || 'false';
        base.blDeepRequired = !!s.blDeepRequired;
        base.blLinks = (s.blLinks || []).map((l) => ({ ...l }));
      }
      mediaState[m.key] = base;
    });

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
    activeMedia.value = 'tt';

    // 成员选择区
    memberKeyword.value = '';
    memberTab.value = 'dept';
    checkAll.value = false;
    checkIndeterminate.value = false;
    checkedMembers.value = [];
    nextTick(() => {
      if (memberTreeRef.value) memberTreeRef.value.setCheckedKeys([]);
    });
  }
);

/* ------------------------------ 成员选择区 ------------------------------ */

const memberTreeData = computed(() =>
  memberTab.value === 'dept' ? MEMBER_TREE_DEPT : MEMBER_TREE_PERSON
);

watch(memberKeyword, (v) => {
  if (memberTreeRef.value) memberTreeRef.value.filter(v);
});

/** 关键字过滤（el-tree filter-node-method） */
function filterMember(value, data) {
  if (!value) return true;
  return String(data.label || '').indexOf(value) !== -1;
}

/** 勾选变化 → 计算已选人员 + 全选状态 */
function onMemberCheck() {
  const tree = memberTreeRef.value;
  if (!tree) return;
  const leaves = tree.getCheckedNodes(true);
  checkedMembers.value = leaves.map((n) => ({ id: n.id, label: n.label }));
  const all = countLeaf(memberTreeData.value);
  checkAll.value = all > 0 && leaves.length === all;
  checkIndeterminate.value = leaves.length > 0 && leaves.length < all;
}

/** 统计叶子节点数 */
function countLeaf(nodes) {
  let n = 0;
  (nodes || []).forEach((x) => {
    if (x.children && x.children.length) n += countLeaf(x.children);
    else n += 1;
  });
  return n;
}

/** 全选 / 取消全选 */
function toggleAllMembers(val) {
  const tree = memberTreeRef.value;
  if (!tree) return;
  if (val) {
    const ids = [];
    const walk = (nodes) => {
      (nodes || []).forEach((x) => {
        if (x.children && x.children.length) walk(x.children);
        else ids.push(x.id);
      });
    };
    walk(memberTreeData.value);
    tree.setCheckedKeys(ids);
  } else {
    tree.setCheckedKeys([]);
  }
  onMemberCheck();
}

/** 清空已选 */
function clearMembers() {
  if (memberTreeRef.value) memberTreeRef.value.setCheckedKeys([]);
  onMemberCheck();
}

/* ------------------------------ 防出错设置 ------------------------------ */

/** 当前媒体可用的规则类型 */
function ruleTypes() {
  return RULE_TYPES;
}

/** 当前媒体 + 类型对应的目标选项 */
function targetOptions(media, type) {
  if (media.key === 'localads') return LOCALADS_TARGETS[type] || TARGET_OPTIONS[type] || [];
  return TARGET_OPTIONS[type] || [];
}

/** 新增一条规则 */
function addRule(key) {
  const s = mediaState[key];
  if (!s) return;
  s.rules.push({ id: nextId(), type: '优化目标', target: '', limit: '' });
}

/** 删除一条规则 */
function removeRule(key, id) {
  const s = mediaState[key];
  if (!s) return;
  s.rules = s.rules.filter((r) => r.id !== id);
}

/** 「禁用规则外分支」勾选变化（线上提示：必须设置至少一个防出错规则） */
function onForbidOutsideChange(key) {
  const s = mediaState[key];
  if (!s) return;
  if (s.forbidOutside && !s.rules.length) {
    ElMessage.info('必须设置至少一个防出错规则，「禁用规则外分支」才会生效');
  }
}

/** B站营销：新增监测链接规则 */
function addBlLink(key) {
  const s = mediaState[key];
  if (!s) return;
  if (s.blLinks.length >= 2) {
    ElMessage.warning('监测链接规则数已达上限（最多 2 条）');
    return;
  }
  s.blLinks.push({ id: nextId(), name: '' });
}

/** B站营销：删除监测链接规则 */
function removeBlLink(key, id) {
  const s = mediaState[key];
  if (!s) return;
  s.blLinks = s.blLinks.filter((l) => l.id !== id);
}

/* ------------------------------ 提交 ------------------------------ */

function onVisibleChange(v) {
  emit('update:modelValue', v);
}

function close() {
  emit('update:modelValue', false);
}

function submit() {
  const fr = formRef.value;
  if (!fr) return;
  fr.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请输入项目名称');
      return;
    }
    const active = mediaState[activeMedia.value] || createMediaState();
    const prevent = {};
    MEDIA_TABS.forEach((m) => {
      const s = mediaState[m.key];
      prevent[m.key] = {
        rules: s.rules.map((r) => ({ ...r })),
        forbidOutside: s.forbidOutside,
        deepRequired: s.deepRequired,
        localForbid: s.localForbid,
        blDeepRequired: s.blDeepRequired,
        blLinks: s.blLinks.map((l) => ({ ...l })),
      };
    });
    emit('submit', {
      name: form.name.trim(),
      remark: form.remark.trim(),
      owner: form.owner,
      visibility: form.visibility,
      members: checkedMembers.value.map((m) => m.label),
      deepRequired: active.deepRequired,
      forbidOutside: active.forbidOutside,
      prevent,
    });
  });
}
</script>

<style scoped>
/* ---------- 弹窗内部（随组件 teleport 走，父级样式不污染） ---------- */
.pj-form :deep(.el-form-item) { margin-bottom: 24px; }
/* 线上最后一个表单项与「防出错设置」标题间距 17px */
.pj-form :deep(.el-form-item:last-child) { margin-bottom: 17px; }
.pj-form :deep(.el-form-item__label) {
  justify-content: flex-start;
  height: 32px;
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
/* 小号单选（线上 .el-radio-button--small） */
.pj-radio--sm :deep(.el-radio-button__inner) { padding: 6px 10px; height: 28px; line-height: 14px; font-size: 13px; }

/* ---------- 成员选择区（线上：搜索框 + 部门/人员双树 + 已选可见内容） ---------- */
.pj-members { margin: -8px 0 16px 136px; width: 792px; }
.pj-members__search { margin-bottom: 12px; }
.pj-members__input { width: 100%; }
.pj-members__input :deep(.el-input__wrapper) { height: 32px; min-height: 32px; font-size: 13px; }
.pj-members__input :deep(.el-input__inner) { font-size: 13px; }
.pj-members__suffix {
  display: inline-flex;
  align-items: center;
  color: #606266;
  font-size: 16px;
  cursor: pointer;
}
.pj-members__suffix:hover { color: #197afb; }
.pj-members__panels { display: flex; gap: 24px; }
.pj-members__left { flex: 1; min-width: 0; border: 1px solid #e8eaec; border-radius: 3px; }
.pj-members__tabs { display: flex; gap: 20px; height: 36px; padding: 0 12px; border-bottom: 1px solid #e8eaec; }
.pj-members__tab {
  position: relative;
  font-size: 14px;
  color: #606266;
  line-height: 36px;
  cursor: pointer;
}
.pj-members__tab.active { color: #197afb; }
.pj-members__tab.active::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  background: #197afb;
}
.pj-members__tree { padding: 8px 12px 12px; }
.pj-members__all { margin-bottom: 4px; }
.pj-members__all :deep(.el-checkbox__label) { font-size: 14px; color: #333; }
.pj-tree { max-height: 168px; overflow-y: auto; }
.pj-tree :deep(.el-tree-node__content) { height: 32px; }
.pj-tree :deep(.el-tree-node__label) { font-size: 14px; color: #333; }
.pj-members__right {
  width: 260px;
  flex: none;
  border: 1px solid #e8eaec;
  border-radius: 3px;
}
.pj-members__right-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid #e8eaec;
  font-size: 14px;
  color: #333;
}
.pj-members__clear { color: #197afb; cursor: pointer; }
.pj-members__clear:hover { text-decoration: underline; }
.pj-members__right-body { max-height: 200px; overflow-y: auto; padding: 8px 12px; }
.pj-members__item { font-size: 13px; color: #333; line-height: 24px; }
.pj-members__empty { font-size: 13px; color: #909399; line-height: 24px; }

.pj-block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 18px;
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 18px;
  color: #333;
}

/* ---------- 媒体页签（线上 el-tabs--border-card） ---------- */
.pj-tabs { width: 100%; }
.pj-tabs__header {
  display: flex;
  align-items: flex-start;
  height: 40px;
  background: #f5f7fa;
}
.pj-media-tab {
  box-sizing: border-box;
  height: 40px;
  padding: 0 20px;
  border: 1px solid #e8eaec;
  border-radius: 4px 4px 0 0;
  background: transparent;
  font-size: 14px;
  line-height: 38px;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;
}
.pj-media-tab:hover { color: #197afb; }
.pj-media-tab.active { color: #197afb; background: #fff; }
.pj-tabs__content {
  padding: 15px;
  border: 1px solid #e8eaec;
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.pj-pane { min-height: 240px; }
/* 线上告警条实测 34px 高，下方与规则区留白 16px */
.pj-alert { padding: 8px 16px; margin-bottom: 16px; }
.pj-alert :deep(.el-alert__title) { font-size: 14px; line-height: 18px; }
/* 告警条：「智擎版本」标签 + 说明，渲染出的整条文字与线上逐字一致 */
.pj-alert__tag { color: #ff9b48; }
.pj-alert__desc { color: #ff9b48; }

/* ---------- 巨量本地推专属 ---------- */
.pj-localads { margin-bottom: 16px; }
.pj-localads__label { margin-right: 8px; font-size: 14px; color: #333; }
.pj-rule-tip { margin: 4px 0 0; font-size: 13px; color: #909399; }

/* ---------- B站营销专属 ---------- */
.pj-bl { margin-bottom: 16px; }
.pj-bl__row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.pj-bl__label { font-size: 14px; color: #333; }
.pj-bl__tip { font-size: 13px; color: #909399; }
.pj-bl__section { display: flex; align-items: flex-start; gap: 12px; }
.pj-bl__content { flex: 1; min-width: 0; }
.pj-bl__empty { padding: 8px 0; font-size: 13px; color: #909399; }
.pj-bl__link { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.pj-bl__input { width: 240px; }
.pj-bl__del { color: #909399; cursor: pointer; }
.pj-bl__del:hover { color: #f56c6c; }
.pj-bl__hint { margin: 8px 0 0; font-size: 12px; color: #909399; line-height: 18px; }

/* ---------- 规则区 ---------- */
.pj-hold {
  padding: 15px 0;
  text-align: center;
  font-size: 14px;
  line-height: 17px;
  color: #909399;
}
.pj-rule {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  /* 线上 .prevent-rule 表单实测 896×49，首个下拉左边距 16px */
  min-height: 49px;
  padding-left: 16px;
  margin-bottom: 14px;
}
.pj-rule__type { width: 120px; flex: none; }
.pj-rule__target { width: 160px; flex: none; }
.pj-rule__limit { width: 120px; flex: none; }
.pj-rule__text { font-size: 14px; color: #333; white-space: nowrap; }
.pj-rule__del { color: #909399; cursor: pointer; }
.pj-rule__del:hover { color: #f56c6c; }
.pj-rule :deep(.el-select__wrapper),
.pj-rule :deep(.el-input__wrapper) { height: 33px; min-height: 33px; font-size: 13px; }

.pj-addnew {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  height: 36px;
  /* 线上 .addnew 实测 864px（面板内容 896 - 右边距 32） */
  margin-top: 16px;
  margin-right: 32px;
  border: 1px dashed #dcdfe6;
  border-radius: 3px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}
.pj-addnew:hover { color: #197afb; border-color: #197afb; }
.pj-addnew--sm { height: 32px; font-size: 13px; }

.pj-check-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  margin-bottom: 32px;
}
.pj-check { height: 19px; }
.pj-check :deep(.el-checkbox__label) { font-size: 13px; line-height: 19px; padding-left: 3px; color: #606266; }

.pj-deep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0;
}
.pj-deep__label { font-size: 14px; color: #333; margin-right: 16px; }

/* 线上问号图标：圆形描边 + ?（实测 14×14） */
.pj-qmark {
  box-sizing: border-box;
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
  cursor: default;
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

/* 弹窗内开关：线上实测 32×16（EP 默认 40×20，缩到 32×16） */
.pj-switch.el-switch { height: 16px; }
.pj-switch .el-switch__core { min-width: 32px; width: 32px; height: 16px; border-radius: 8px; }
.pj-switch .el-switch__core .el-switch__inner { height: 12px; padding: 0 2px 0 14px; }
.pj-switch .el-switch__core .el-switch__action { width: 12px; height: 12px; }
.pj-switch.el-switch.is-checked .el-switch__core .el-switch__action { left: calc(100% - 13px); }
.pj-switch.el-switch.is-checked .el-switch__core .el-switch__inner { padding: 0 14px 0 2px; }
</style>
