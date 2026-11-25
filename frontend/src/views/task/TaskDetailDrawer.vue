<template>
  <Teleport to="body">
    <div v-if="modelValue" class="td-mask" @click="close"></div>
    <div v-if="modelValue" class="td-drawer">
      <!-- 关闭按钮：蓝色实心方块，贴附在抽屉左边缘（与线上一致） -->
      <button class="td-close" title="关闭" @click="close">
        <el-icon><Close /></el-icon>
      </button>

      <!-- 抽屉头 -->
      <div class="td-header">
        <div class="td-title">详情</div>
      </div>

      <!-- 抽屉内容 -->
      <div class="td-body">
        <!-- 任务基本信息 -->
        <el-collapse v-model="infoExpanded" class="td-collapse">
          <el-collapse-item name="base">
            <template #title>
              <span class="td-collapse__title">任务基本信息</span>
            </template>
            <div class="td-base">
              <div class="td-base__col">
                <div class="td-base__label">
                  <p>任务名称：</p>
                  <p>媒体：</p>
                  <p>项目数量：</p>
                  <p>提交规则：</p>
                  <p>提交间隔：</p>
                </div>
                <div class="td-base__content">
                  <p :title="info.name">{{ info.name }}</p>
                  <p>巨量广告2.0</p>
                  <p>{{ info.projectCount }}</p>
                  <p>{{ info.submitRule }}</p>
                  <p>未设置</p>
                </div>
              </div>
              <div class="td-base__col">
                <div class="td-base__label">
                  <p>账户：</p>
                  <p>提交广告数：</p>
                  <p>开始执行时间：</p>
                  <p>执行状态：</p>
                </div>
                <div class="td-base__content">
                  <el-tooltip :content="info.accounts" placement="top" :show-after="200">
                    <p class="td-ellipsis">{{ info.accounts }}</p>
                  </el-tooltip>
                  <p>{{ info.adCount }}</p>
                  <p>{{ info.startTime }}</p>
                  <p>{{ info.status }}</p>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 页签 + 查看详情 -->
        <div class="td-tabs-bar">
          <el-tabs v-model="activeTab" class="td-tabs">
            <!-- 提交信息：树形嵌套表格 -->
            <el-tab-pane label="提交信息" name="submit">
              <div class="td-table-wrap">
                <el-table
                  :data="projects"
                  class="td-table"
                  row-key="key"
                  border
                  :default-expand-all="false"
                >
                  <el-table-column type="expand" width="48">
                    <template #default="{ row }">
                      <div class="td-child-wrap">
                        <el-table :data="row.ads" class="td-table td-table--child" border row-key="key">
                          <el-table-column label="广告名称" prop="adName" width="421" show-overflow-tooltip />
                          <el-table-column label="转化目标出价" prop="bid" width="100" />
                          <el-table-column label="深度转化目标出价" prop="deepBid" width="120" />
                          <el-table-column label="状态" width="421">
                            <template #default="{ row: child }">
                              <i class="td-row-status">
                                <el-icon><CircleCheckFilled /></el-icon>{{ child.status }}
                              </i>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="项目" prop="projectName" width="200" show-overflow-tooltip />
                  <el-table-column label="账户" prop="account" width="180" show-overflow-tooltip />
                  <el-table-column label="转化目标" prop="goal" width="90" />
                  <el-table-column label="深度转化目标" prop="deepGoal" width="96" />
                  <el-table-column label="转化目标出价" prop="bid" width="97" />
                  <el-table-column label="深度转化目标出价" prop="deepBid" width="120" />
                  <el-table-column label="新建广告数" prop="adCount" width="90" />
                  <el-table-column label="提交结果" width="190" fixed="right">
                    <template #default="{ row }">
                      <span class="td-task-status">
                        <i class="td-task-status__dot" :style="{ background: statusColor(row.status) }"></i>
                        <span class="td-task-status__text">{{ row.status }}</span>
                      </span>
                      <span class="td-ml8">成功: {{ row.success }} 失败: {{ row.fail }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- 执行记录 -->
            <el-tab-pane label="执行记录" name="records">
              <div class="td-table-wrap td-records-wrap">
                <el-table :data="records" class="td-table" border row-key="key">
                  <el-table-column label="创建时间" prop="time" />
                  <el-table-column label="提交广告数" prop="adCount" />
                  <el-table-column label="状态" prop="status" />
                </el-table>
                <el-pagination
                  class="td-pager"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="records.length"
                  :page-sizes="[10, 20, 50, 100]"
                  :page-size="recordPageSize"
                  @size-change="recordPageSize = $event"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
          <el-button link class="td-detail-btn" @click="onViewDetail">查看详情</el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheckFilled, Close } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: Boolean,
  row: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue']);

const activeTab = ref('submit');
const infoExpanded = ref(['base']);
const recordPageSize = ref(20);

/** 账户 ID（线上详情抽屉实测，按账户序号对应） */
const ACCOUNT_ID_BY_NO = {
  '124': '1873758649506203',
  '118': '1873758652234324',
  '116': '1873758652954056',
  '120': '1873758651659018',
  '148': '1873758649506203',
  '143': '1873758651659018',
  '149': '1873758652234324',
};
const ACCOUNT_ID_FALLBACK = '1873758649506203';

/** 把「名称、名称、名称」拆成带账户 ID 的账户数组 */
function buildAccounts(accountsText) {
  const list = String(accountsText || '')
    .split('、')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.map((name) => {
    const m = name.match(/-(\d+)-/);
    const id = m ? ACCOUNT_ID_BY_NO[m[1]] || ACCOUNT_ID_FALLBACK : ACCOUNT_ID_FALLBACK;
    return `${name}(${id})`;
  });
}

const info = computed(() => {
  const r = props.row || {};
  const accounts = buildAccounts(r.accounts);
  const count = Math.max(accounts.length, 1);
  // 线上「账户」字段按账户 ID 升序拼接
  const sorted = [...accounts].sort((a, b) => {
    const ia = Number(a.slice(a.lastIndexOf('(') + 1, -1));
    const ib = Number(b.slice(b.lastIndexOf('(') + 1, -1));
    return ia - ib;
  });
  return {
    name: r.name || '—',
    accounts: sorted.join('、'),
    projectCount: count,
    adCount: r.success != null ? r.success : count,
    startTime: r.createdAt || '—',
    submitRule: r.submitRule || '立即提交',
    status: r.status || '提交完成',
  };
});

/** 树形表格：父行 = 项目，展开后是广告子表 */
const projects = computed(() => {
  const r = props.row || {};
  const accounts = buildAccounts(r.accounts);
  const n = Math.max(accounts.length, 1);
  const list = [];
  for (let i = 0; i < n; i++) {
    const account = accounts[i] || accounts[0] || '—';
    const ok = r.status === '已终止' ? 0 : 1;
    list.push({
      key: `p-${r.id}-${i}`,
      projectName: r.name || '—',
      account,
      goal: 'app内付费',
      deepGoal: '无',
      bid: '无',
      deepBid: '无',
      adCount: 1,
      status: r.status === '已终止' ? '提交完成' : '提交完成',
      success: ok,
      fail: 0,
      ads: [
        {
          key: `a-${r.id}-${i}`,
          adName: r.name || '—',
          bid: r.bid && r.bid !== '--' ? r.bid : '52',
          deepBid: '无',
          status: r.status === '已终止' ? '失败' : '成功',
        },
      ],
    });
  }
  return list;
});

/** 执行记录（线上实测：3 列「创建时间 / 提交广告数 / 状态」，共 1 条） */
const records = computed(() => {
  const r = props.row || {};
  const count = Math.max(buildAccounts(r.accounts).length, 1);
  return [
    {
      key: `rec-${r.id}`,
      time: r.createdAt || '—',
      adCount: r.success != null ? r.success : count,
      status: r.status === '已终止' || r.status === '失败' ? '提交完成' : r.status || '提交完成',
    },
  ];
});

function statusColor(status) {
  return {
    提交完成: 'rgb(35,194,63)',
    提交中: 'rgb(64,158,255)',
    素材上传中: 'rgb(64,158,255)',
    等待提交: 'rgb(230,162,60)',
    已终止: 'rgb(245,108,108)',
  }[status] || 'rgb(153,153,153)';
}

function close() {
  emit('update:modelValue', false);
}

function onViewDetail() {
  ElMessage.info('原型：查看任务提交详情');
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) activeTab.value = 'submit';
  }
);
</script>

<style scoped>
.td-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1001;
}
.td-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1020px;
  max-width: 96vw;
  background: #f0f2f5;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}
/* 关闭按钮：蓝色方块 + 白色 ×，贴在抽屉左边缘外侧 */
.td-close {
  position: absolute;
  right: 100%;
  top: 10px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #2e71ea;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.td-close:hover {
  background: #197afb;
}
.td-header {
  flex: none;
  height: 49px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
  display: flex;
  align-items: center;
}
.td-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.td-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 8px;
  background: #fff;
}

/* ---------------- 任务基本信息 ---------------- */
.td-collapse {
  border: none;
  background: #fff;
  border-radius: 0;
}
.td-collapse :deep(.el-collapse-item__header),
.td-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: #fff;
}
.td-collapse :deep(.el-collapse-item__header) {
  height: 48px;
  line-height: 48px;
  padding: 0;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}
.td-collapse :deep(.el-collapse-item__content) {
  padding: 0;
}
.td-collapse__title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.td-base {
  display: flex;
  gap: 40px;
}
.td-base__col {
  width: 474px;
  flex: none;
  display: flex;
  align-items: flex-start;
}
.td-base__label {
  width: 100px;
  flex: none;
}
.td-base__label p,
.td-base__content p {
  margin: 0;
  font-size: 12px;
  line-height: 28px;
  color: #666;
}
.td-base__content {
  flex: 1;
  min-width: 0;
}
.td-base__content p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.td-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------------- 页签 ---------------- */
.td-tabs-bar {
  position: relative;
  margin-top: 7px;
  background: #fff;
  border-radius: 0;
  padding: 0;
}
.td-tabs {
  --el-tabs-active-bar-color: #197afb;
  --el-tabs-text-color: #333;
  --el-tabs-item-font-size: 14px;
}
.td-tabs :deep(.el-tabs__header) {
  margin-bottom: 15px;
}
.td-tabs :deep(.el-tabs__item) {
  color: #333;
  height: 40px;
  line-height: 40px;
  padding: 0 20px 0 0;
  font-weight: 700;
}
.td-tabs :deep(.el-tabs__item.is-active) {
  color: #197afb;
}
.td-detail-btn {
  position: absolute;
  right: 0;
  top: 4px;
  font-size: 12px;
  color: #197afb;
  padding: 9px 0;
  height: 32px;
  font-weight: 500;
}

/* ---------------- 嵌套表格 ---------------- */
.td-table-wrap {
  background: #fff;
  border-radius: 4px;
  padding: 12px 0 16px;
}
.td-table {
  --el-table-border-color: #ebeef5;
  width: 100%;
}
/* 线上表头：12px/18px、不换行、表头高 56px */
.td-table :deep(th.el-table__cell) {
  padding: 18.5px 0;
  font-size: 14px;
}
.td-table :deep(th.el-table__cell .cell) {
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  font-weight: 700;
  color: #333;
  /* 线上表头单行完整显示（不省略），这里放宽右侧内边距 */
  padding-right: 6px;
}
.td-table :deep(.el-table__cell) {
  font-size: 12px;
  color: #606266;
}
.td-child-wrap {
  padding: 8px 0 8px 24px;
  background: #fff;
}
.td-table--child {
  width: 1062px;
}
.td-task-status {
  display: inline-flex;
  align-items: center;
}
.td-pager {
  padding: 16px 0 0;
  font-size: 13px;
}
.td-pager :deep(.el-pagination) {
  font-size: 13px;
  justify-content: flex-start;
}
/* 执行记录：表格撑满，分页贴底（与线上一致） */
.td-records-wrap {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 340px);
}
.td-records-wrap .td-pager {
  margin-top: auto;
}
.td-task-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  flex: none;
}
.td-task-status__text {
  color: rgb(35, 194, 63);
}
.td-ml8 {
  margin-left: 8px;
}
.td-row-status {
  display: inline-flex;
  align-items: center;
  color: rgb(35, 194, 63);
  font-style: normal;
}
</style>
