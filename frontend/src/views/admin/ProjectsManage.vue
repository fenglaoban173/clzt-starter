<template>
  <div class="app-page">
    <!-- ① 二级页签（线上 .cl-minor-nav：48px 高、16px、选中 #197afb + 2px 下划线、间距 32px） -->
    <ul class="app-tabs proj-tabs">
      <li
        class="app-tab"
        :class="{ active: tab === 'manage' }"
        @click="tab = 'manage'"
      >项目管理</li>
      <li
        class="app-tab"
        :class="{ active: tab === 'settings' }"
        @click="tab = 'settings'"
      >项目设置</li>
    </ul>

    <!-- ② 项目管理 -->
    <template v-if="tab === 'manage'">
      <!-- 搜索（线上 .mg-filter-wrapper：240×32 el-input + 后缀放大镜） -->
      <div class="app-filter proj-filter">
        <div class="app-search proj-search">
          <el-input
            v-model="keyword"
            size="small"
            placeholder="请输入关键字"
            @keyup.enter="pageNo = 1"
          >
            <template #suffix>
              <span class="proj-search__suffix"><el-icon><Search /></el-icon></span>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 表格卡片（线上 .mg-table-wrapper：白底 + #e8eaec 边框） -->
      <div class="proj-body">
        <div class="app-card proj-card">
          <div class="app-card-toolbar proj-toolbar">
            <el-button type="primary" size="small" class="proj-add-btn" @click="openAdd">
              <el-icon class="proj-add-btn__icon"><Plus /></el-icon>
              <span>新增项目</span>
            </el-button>
          </div>

          <el-table
            :data="filteredRows"
            row-key="id"
            border
            class="app-table proj-table"
            @selection-change="onSelectionChange"
          >
            <!-- 选择列 / 创建时间 / 关联账户数 / 操作 固定 width；
                 项目名称 : 备注 : 项目负责人 : 创建人 = 2:1:1:1，用 min-width 让 EP fit 按比例伸缩 -->
            <el-table-column type="selection" width="60" />
            <el-table-column label="项目名称" min-width="220">
              <template #default="{ row }">
                <div class="proj-name">
                  <span class="proj-name__text">{{ row.name }}</span>
                  <el-tooltip
                    content="未设置防出错，存在跑飞风险。点击立即设置"
                    placement="top"
                    :show-after="200"
                  >
                    <span class="proj-badge">
                      <span class="proj-badge__icon" aria-hidden="true"></span>
                      <span class="proj-badge__text">防出错</span>
                    </span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="110" prop="remark" />
            <el-table-column label="项目负责人" min-width="110" prop="owner" />
            <el-table-column label="创建人" min-width="110" prop="creator" />
            <el-table-column label="创建时间" width="160" prop="createTime" />
            <el-table-column label="关联账户数" width="160" prop="accountCount" align="right" />
            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" class="proj-op-btn" @click="openEdit(row)">
                  <el-popover
                    content="企业管理员/管理员/创建人才有权限"
                    placement="top"
                    trigger="hover"
                    :width="200"
                  >
                    <template #reference><span>编辑</span></template>
                  </el-popover>
                </el-button>
                <el-button link type="primary" size="small" class="proj-op-btn" @click="removeRow(row)">
                  <el-popover
                    content="企业管理员/管理员/创建人才有权限"
                    placement="top"
                    trigger="hover"
                    :width="200"
                  >
                    <template #reference><span>删除</span></template>
                  </el-popover>
                </el-button>
              </template>
            </el-table-column>

            <template #empty>
              <div class="proj-empty">暂无数据</div>
            </template>
          </el-table>
        </div>
      </div>
    </template>

    <!-- ③ 项目设置（线上 .page-content：开关 + 灰底说明面板） -->
    <div v-else class="proj-settings">
      <div class="proj-settings__row">
        <span class="proj-settings__label">强制绑定智投项目</span>
        <el-tooltip content="强制绑定智投项目有什么好处？" placement="top">
          <span class="proj-qmark">?</span>
        </el-tooltip>
        <el-switch v-model="forceBind" class="pj-switch-sm" />
      </div>

      <div class="proj-settings__panel">
        <div class="proj-settings__block">
          <h3 class="proj-settings__title">强制绑定智投项目有什么好处？</h3>
          <p class="proj-settings__item">1. 账户授权、素材上传、资产新建等环节必须绑定智投项目，搭建广告时自动按智投项目进行资产过滤，可有效规避资产选错</p>
          <p class="proj-settings__item">2. 确保了账户-智投项目的关联完整性，也就保证了数据的完整性；通过按智投项目聚合数据，高效完成不同项目的投放分析</p>
        </div>
        <img
          class="proj-settings__img"
          src="https://cl.mobgi.com/assets/cl-media-project-setting-BVOyzzV4.jpg"
          alt="智投项目绑定示意图"
        />
      </div>
    </div>

    <!-- ④ 新增 / 编辑弹窗 -->
    <ProjectFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :row="editingRow"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 管理 · 智投项目（线上「创量项目管理」）
 * 线上：https://cl.mobgi.com/setting/cl-project/project-manage
 *
 * 采集自线上 DOM / computed style（1920×1080）：
 *   - 二级页签 .cl-minor-nav：项目管理 / 项目设置（48px 高、16px、间距 32px，
 *     选中 #197afb + 2px 下划线，未选中 #666）
 *   - 搜索框 .el-input--small：240×32、placeholder「请输入关键字」、后缀放大镜（x=176 y=128）
 *   - 「新增项目」按钮 el-button--primary--small：120×33、底色 #197afb、圆角 3px（x=193 y=201）
 *   - 表格 el-table--fit--border：8 列（选择 60 / 项目名称 / 备注 / 项目负责人 / 创建人 /
 *     创建时间 160 / 关联账户数 160 / 操作 160），后 4 列固定、后 4 列 min-width 按 2:1:1:1 伸缩，
 *     1920 下实测 60/476/237/237/237/160/160/160（合计 1727 = 表格 clientWidth），
 *     「关联账户数」右对齐、「操作」居中，表体 12px
 *   - 本页无分页
 *   - 「项目设置」：强制绑定创量项目 + ⓘ + 开关（32×16）+ 灰底面板（说明 + 示意图）
 * ------------------------------------------------------------------ */
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import ProjectFormDialog from './ProjectFormDialog.vue';

/** 页签 */
const tab = ref('manage');

/* ------------------------------ mock 数据 ------------------------------ */
/** 线上 4 条，逐字照抄（项目名称 + 「防出错」角标） */
const rows = ref([
  { id: 1, name: '知乎小说', remark: '知乎小说时报', owner: '刘松涵', creator: '杨浩蒙', createTime: '2026-09-15 11:27:27', accountCount: 71, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 2, name: '漫剧端原生', remark: '', owner: '申旭阳', creator: '北京央广时代文化传播有限公司', createTime: '2026-09-07 20:34:59', accountCount: 0, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 3, name: 'soul', remark: '', owner: '', creator: '北京央广时代文化传播有限公司', createTime: '2026-06-09 09:26:13', accountCount: 12, visibility: 'all', members: [], deepRequired: false, prevent: null },
  { id: 4, name: '百度文库', remark: '1', owner: '', creator: '北京央广时代文化传播有限公司', createTime: '2026-06-09 09:09:59', accountCount: 3, visibility: 'all', members: [], deepRequired: false, prevent: null },
]);

/* ------------------------------ 交互状态 ------------------------------ */
const keyword = ref('');
const pageNo = ref(1);
const selectedRows = ref([]);
const forceBind = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref('add');
const editingRow = ref(null);

let seed = 100;

/** 搜索：按项目名称过滤 */
const filteredRows = computed(() => {
  const kw = (keyword.value || '').trim();
  if (!kw) return rows.value;
  return rows.value.filter((r) => String(r.name || '').indexOf(kw) !== -1);
});

function onSelectionChange(list) {
  selectedRows.value = list;
}

/** 新增项目 */
function openAdd() {
  dialogMode.value = 'add';
  editingRow.value = null;
  dialogVisible.value = true;
}

/** 编辑项目（复用弹窗，回填当前行） */
function openEdit(row) {
  dialogMode.value = 'edit';
  editingRow.value = { ...row };
  dialogVisible.value = true;
}

/** 删除项目（二次确认） */
function removeRow(row) {
  ElMessageBox.confirm(`确定删除项目「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      rows.value = rows.value.filter((r) => r.id !== row.id);
      ElMessage.success('删除成功');
    })
    .catch(() => {
      /* 取消 */
    });
}

/** 弹窗提交：新增一行 / 更新当前行 */
function onSubmit(payload) {
  if (dialogMode.value === 'edit' && editingRow.value) {
    const target = rows.value.find((r) => r.id === editingRow.value.id);
    if (target) Object.assign(target, payload);
    dialogVisible.value = false;
    ElMessage.success('编辑项目成功');
    return;
  }
  seed += 1;
  rows.value.unshift({
    id: seed,
    name: payload.name,
    remark: payload.remark,
    owner: payload.owner,
    creator: '北京央广时代文化传播有限公司',
    createTime: formatNow(),
    accountCount: 0,
    visibility: payload.visibility,
    members: payload.members,
    deepRequired: payload.deepRequired,
    forbidOutside: payload.forbidOutside,
    prevent: payload.prevent,
  });
  dialogVisible.value = false;
  ElMessage.success('新增项目成功');
}

/** 新增时的创建时间 */
function formatNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
</script>

<style scoped>
/* 注：共享样式 appPage.css 里是 `body.app-scope .app-*`（特异性 0,2,1），
 * scoped 编译后只有 (0,2,0)，所以覆盖共享类时统一写成 `.app-page .app-*`（0,3,0）才能生效。 */

/* ---------- 页面骨架 ---------- */
body.app-scope .app-page { background: #f5f6f7; }

/* ---------- 二级页签（线上 .cl-minor-nav：48px / 间距 32px） ---------- */
.app-page .proj-tabs {
  list-style: none;
  margin: 0;
  height: 48px;
  gap: 32px;
  box-sizing: border-box;
}
.app-page .proj-tabs .app-tab {
  height: 48px;
  line-height: 48px;
  color: #666;
  font-weight: normal;
}
.app-page .proj-tabs .app-tab.active { color: #197afb; font-weight: normal; }

/* ---------- 搜索区（线上 x=176 y=128，240×32） ---------- */
.app-page .proj-filter {
  padding: 16px 16px 15px;
  border-bottom: 1px solid #e8eaec;
}
.app-page .proj-search { width: 240px; }
.app-page .proj-search :deep(.el-input__wrapper) {
  height: 32px;
  min-height: 32px;
  font-size: 13px;
  padding: 0 0 0 11px;
  border-radius: 3px;
}
.app-page .proj-search :deep(.el-input__inner) { font-size: 13px; color: #333; }
/* 后缀放大镜（线上：分隔线 + 18px 放大镜） */
.app-page .proj-search :deep(.el-input__suffix-inner) {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding-left: 5px;
  margin-right: 8px;
  border-left: 1px solid #e8eaec;
}
.proj-search__suffix { display: inline-flex; align-items: center; color: #606266; font-size: 18px; cursor: pointer; }
.proj-search__suffix:hover { color: #197afb; }

/* ---------- 表格卡片（线上 .mg-table-wrapper） ---------- */
.proj-body { flex: 1; min-height: 0; padding: 0 16px; }
.app-page .proj-card {
  margin-top: 16px;
  padding: 0;
  border: 1px solid #e8eaec;
  border-radius: 4px;
}
.app-page .proj-toolbar { padding: 8px 16px; margin-bottom: 0; }

/* 「新增项目」按钮（线上 120×33，padding 9px 15px，底色 #197afb） */
.proj-add-btn {
  width: 120px;
  height: 33px;
  padding: 9px 15px;
  font-size: 12px;
  border-radius: 3px;
}
.proj-add-btn__icon { margin-right: 4px; font-size: 14px; vertical-align: -1px; }

/* ---------- 表格（线上：4 列固定 + 4 列 min-width 按 2:1:1:1 伸缩） ---------- */
.proj-table {
  /* 表格整体 = 内容区宽（1728px@1920），左右各让出 1px 与卡片描边重合 */
  width: calc(100% + 2px);
  max-width: none;
  margin: 0 -1px;
  /* 线上 .el-table 根节点实测：border-top 1px / border-left 1px，
     使表体起点 x=177、可用宽 1727（EP fit 以 clientWidth 为基准分配） */
  border-top: 1px solid #e8eaec;
  border-left: 1px solid #e8eaec;
  font-size: 12px;
  --el-table-header-text-color: #333;
  --el-table-border-color: #e8eaec;
}
.proj-table :deep(.el-table__cell) {
  padding: 0;
  height: 56px;
  font-size: 12px;
  color: #333;
}
.proj-table :deep(.el-table__cell .cell) { padding: 0 12px; line-height: 18px; }
.proj-table :deep(th.el-table__cell) { background: #fafafa; font-weight: 700; font-size: 12px; color: #333; }
/* 行内「编辑 / 删除」（线上 el-button--text--small：26×32，字号 12px，字色 #197afb，间距 12px）
 * 注意：EP2 的 primary+link 会把字色设成白色，这里显式改回 #197afb */
.proj-table :deep(.el-button.is-link) {
  height: 32px;
  padding: 9px 0;
  font-size: 12px;
  margin-left: 0;
  --el-button-text-color: #197afb;
  --el-button-hover-text-color: #197afb;
  --el-button-hover-link-text-color: #197afb;
}
.proj-table :deep(.el-button.is-link + .el-button.is-link) { margin-left: 12px; }
.proj-empty { color: #909399; font-size: 12px; padding: 40px 0; }

/* 项目名称 + 「防出错」角标（线上 justify-content-between） */
.proj-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.proj-name__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 「防出错」只是标记，hover 弹说明（线上 .el-tooltip.error-prevent-error-info） */
.proj-badge {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  padding: 0 6px 0 0;
  border: 1px solid #dcdfe6;
  border-radius: 9px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  line-height: 1;
  cursor: default;
}
/* 线上是一个灰色实心圆 + 白色感叹号（图标字体，非文本），整体宽 70px */
.proj-badge__icon {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-left: -1px;
  margin-right: 6px;
  border-radius: 50%;
  background: #909399;
}
.proj-badge__icon::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 3px;
  width: 2px;
  height: 7px;
  border-radius: 1px;
  background: #fff;
}
.proj-badge__icon::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 12px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #fff;
}

/* ---------- 项目设置（线上实测：标签行 y=130，灰底面板 y=178 高 605） ---------- */
.proj-settings { flex: 1; min-height: 0; }
.proj-settings__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 18px 16px 0;
}
.proj-settings__label { font-size: 14px; color: #333; }
.proj-settings__row .proj-qmark { margin-right: 10px; }

.proj-settings__panel {
  margin: 29px 16px 0;
  padding: 32px 0;
  background: #f3f5f6;
  border-radius: 4px;
}
.proj-settings__block { width: 460px; max-width: calc(100% - 32px); margin: 0 auto; }
.proj-settings__title {
  margin: 0 0 24px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 700;
  color: #333;
  text-align: left;
}
.proj-settings__item {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 18px;
  color: #333;
}
.proj-settings__img {
  display: block;
  width: 521px;
  max-width: calc(100% - 32px);
  margin: 19px auto 0;
}

/* 线上问号图标：圆形描边 + ? */
.proj-qmark {
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

/* 「项目设置」开关：线上实测 32×16（EP 默认 40×20，缩到 32×16） */
.pj-switch-sm.el-switch { height: 16px; }
.pj-switch-sm .el-switch__core { min-width: 32px; width: 32px; height: 16px; border-radius: 8px; }
.pj-switch-sm .el-switch__core .el-switch__inner { height: 12px; padding: 0 2px 0 14px; }
.pj-switch-sm .el-switch__core .el-switch__action { width: 12px; height: 12px; }
.pj-switch-sm.el-switch.is-checked .el-switch__core .el-switch__action { left: calc(100% - 13px); }
.pj-switch-sm.el-switch.is-checked .el-switch__core .el-switch__inner { padding: 0 14px 0 2px; }
</style>
