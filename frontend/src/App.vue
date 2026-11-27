<template>
  <router-view />
</template>

<script setup>
</script>

<style>
:root {
  /* 贴近智投标准版主色（蓝） */
  --el-color-primary: #2563eb;
  --el-color-primary-light-3: #6b93f2;
  --el-color-primary-light-5: #9db8f7;
  --el-color-primary-light-7: #c4d6fb;
  --el-color-primary-light-8: #d8e3fc;
  --el-color-primary-light-9: #ecf1fe;
  --el-color-primary-dark-2: #1d4fbf;
  --el-border-radius-base: 6px;
  --el-border-radius-small: 4px;
}

html, body, #app {
  height: 100%;
  margin: 0;
}

body {
  background: #f5f6f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', Helvetica, Arial, sans-serif;
}

/* 卡片与表格在内容区通栏，避免空数据时按列宽收缩 */
.el-card {
  width: 100%;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}
.el-card + .el-card {
  margin-top: 16px;
}
.el-card__body {
  padding: 16px 20px;
}

/* 页面容器：统一左右/上下间距与纵向节奏 */
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px 20px;
}
/* 非 .page 根容器（报表/任务/素材/资产等）统一外边距，避免卡片贴边 */
.app-content > div:not(.sub-tabs):not(.batch-page) {
  padding: 16px 20px 20px;
}
.app-content > .el-card {
  margin: 16px 20px;
  width: auto;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.head-tip { font-size: 13px; color: #86909c; }
.tip-link { color: #2563eb; margin: 0 4px; cursor: pointer; }

/* 查询条件区：行内等宽排列，操作按钮靠右对齐 */
.filter-card { padding-bottom: 4px; }
.filter-row {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap;
  gap: 16px !important;
  margin-bottom: 16px !important;
}
.filter-row:last-child { margin-bottom: 0; }
.filter-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-card .el-select,
.filter-card .el-input { width: 220px !important; }
.filter-card .el-date-editor--daterange { width: 300px !important; }

/* 表格工具操作行 */
.op-row,
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar:only-child,
.op-row:only-child { margin-bottom: 0; }

/* 按钮层级：主按钮实心蓝 / 次按钮描边灰 / 危险红 */
.el-button { border-radius: 6px; }
.el-button--default {
  border-color: #e5e6eb;
  color: #4e5969;
  background: #fff;
}
.el-button--default:hover {
  color: #2563eb;
  border-color: #9db8f7;
  background: #ecf1fe;
}
.el-button--danger { background: #f53f3f; border-color: #f53f3f; }

/* 表格视觉统一 */
.el-table th.el-table__cell {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 500;
}
.el-table .el-table__cell { padding: 12px 0; }
.el-table .el-table__row:hover > td.el-table__cell { background: #f7f8fa; }

/* 分页统一右对齐、上边距 */
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}

</style>
