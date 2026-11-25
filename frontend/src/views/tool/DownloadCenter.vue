<template>
  <div class="app-page dl-page">
    <!-- ① 工具条：线上 .mg-filter-wrapper > form.el-form.filter-search-input
         只有「关键词输入(188×29, 后缀放大镜)」+「清空(12px 文字链接)」，没有查询按钮 -->
    <div class="dl-filter">
      <el-input
        v-model="keyword"
        class="app-search dl-search"
        size="small"
        placeholder="请输入关键词"
        @keyup.enter="onSearch"
      >
        <template #suffix>
          <span class="dl-search__icon" title="搜索" @click="onSearch">
            <el-icon><Search /></el-icon>
          </span>
        </template>
      </el-input>
      <a class="app-link dl-clear" @click="clearAll">清空</a>
    </div>

    <!-- ② 表格：线上 el-table--fit el-table--border
         列宽复现（EP fit：固定列不参与分配，其余按 min-width 比例分配）：
         160 + 1567×(300/500)=940.2 → 941 / 100/500→313 / 100/500→313 -->
    <div class="dl-table-wrap">
      <el-table :data="pagedRows" row-key="id" border class="app-table dl-table">
        <el-table-column prop="name" label="任务名称" min-width="300" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" min-width="100">
          <template #default="{ row }">
            <el-button link size="small" class="dl-op" @click="onDownload(row)">下载</el-button>
            <el-button link size="small" class="dl-op" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- ③ 分页：线上 共 2 条 / 10条每页 / ‹ 1 › / 前往 __ 页（整体靠左） -->
      <div class="app-pager dl-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 工具 · 系统工具 · 下载中心
 * 线上：https://cl.mobgi.com/assist/systemtools/download
 *
 * 采集自线上 DOM / computed style（C:/tmp/nw/T2_下载中心.json、线上探针）：
 *   - 工具条：关键词输入 188×29（13px，后缀放大镜 32px）+ 清空（12px #197afb，间隔 12px）
 *   - 表格：4 列 941 / 313 / 160 / 313，表头 #fafafa #909399 700 14px，行高 56px，单元格 12px #333
 *   - 操作列：el-button--text 12px #197afb，padding 9px 0（26×32），两按钮间隔 8px
 *   - 分页：total+sizes+prev+pager+next+jumper，整体靠左，「共 2 条」「10条/页」
 * ------------------------------------------------------------------ */
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

/** 线上「全部消息」共 2 条，逐字照抄 */
const ALL_ROWS = [
  {
    id: 'dl_01',
    name: '组件报表_2026-11-17-2026-11-23_2026-11-24 16:36:14',
    status: '处理完成',
    createdAt: '2026-11-24 16:36:14',
  },
  {
    id: 'dl_02',
    name: '组件报表_2026-11-17-2026-11-23_2026-11-24 16:34:25',
    status: '处理完成',
    createdAt: '2026-11-24 16:34:25',
  },
];

const rows = ref(ALL_ROWS.map((r) => ({ ...r })));
const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(10);

/** 关键词过滤（任务名包含关键词） */
const filteredRows = computed(() => {
  const kw = (keyword.value || '').trim();
  if (!kw) return rows.value;
  return rows.value.filter((r) => r.name.indexOf(kw) !== -1);
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => { pageNo.value = 1; });

/** 回车 / 点放大镜 → 过滤 */
function onSearch() {
  pageNo.value = 1;
}

/** 清空 → 恢复全部 */
function clearAll() {
  keyword.value = '';
  pageNo.value = 1;
}

/** 下载：真的落一个文件（Blob + a[download]），并给出明确反馈 */
function onDownload(row) {
  const csv =
    '﻿任务名称,状态,创建时间\n' + [row.name, row.status, row.createdAt].join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = row.name.replace(/[\\/:*?"<>|]/g, '-') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  ElMessage.success('下载任务已提交，文件开始下载');
}

/** 删除：二次确认 → 从表格移除 → 「共 N 条」同步减少 */
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      '确定要删除该下载任务吗？删除后将无法恢复。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
      }
    );
  } catch (e) {
    return; // 用户取消
  }
  rows.value = rows.value.filter((r) => r.id !== row.id);
  if (pageNo.value > 1 && (pageNo.value - 1) * pageSize.value >= rows.value.length) {
    pageNo.value = Math.max(1, Math.ceil(rows.value.length / pageSize.value));
  }
  ElMessage.success('删除成功');
}
</script>

<style scoped>
/* ---------- 页面骨架（线上整页白底，无卡片外壳） ---------- */
.app-page.dl-page { background: #fff; }

/* ---------- 工具条 ---------- */
.dl-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 0;
}
.dl-search { width: 188px; flex: none; }
/* 线上 el-input--small 高 29px、圆角 3px（EP 2.14 的 wrapper 默认 content-box 会多出 2px 边框） */
.dl-page .dl-search :deep(.el-input__wrapper) {
  height: 29px;
  min-height: 29px;
  box-sizing: border-box;
  border-radius: 3px;
}
.dl-search :deep(.el-input__inner) { font-size: 12px; }
.dl-search :deep(.el-input__suffix) { padding: 0 9px; }
.dl-search__icon {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
}
.dl-search__icon:hover { color: #197afb; }
.dl-clear { line-height: 29px; }

/* ---------- 表格 ---------- */
.dl-table-wrap { padding: 0 16px; }
/* 线上 el-table 根节点 clientWidth=1727（表头 colgroup 合计 941+313+160+313=1727） */
.dl-page .dl-table { width: calc(100% - 1px); margin-top: 28px; }
.dl-page .dl-table :deep(th.el-table__cell) {
  height: 56px;
  background: #fafafa;
  color: #909399;
  font-size: 14px;
  font-weight: 700;
  padding: 0;
}
.dl-page .dl-table :deep(td.el-table__cell) {
  height: 56px;
  padding: 0;
  font-size: 12px;
  color: #333;
}
.dl-page .dl-table :deep(.el-table__cell .cell) { line-height: 18px; }
/* 行内文字按钮：线上 el-button--text el-button--small（26×32，padding 9px 0，间隔 8px） */
.dl-page .dl-table :deep(.el-button.is-link) {
  height: auto;
  padding: 9px 0;
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 1;
  color: #197afb;
}
.dl-page .dl-table :deep(.el-button.is-link + .el-button.is-link) { margin-left: 8px; }
.dl-page .dl-table :deep(.el-button.is-link:hover) { color: #1462c9; }

/* ---------- 分页（线上整体靠左：共 2 条 → x=200） ---------- */
.dl-page .dl-pager { justify-content: flex-start; padding: 16px 0; }
.dl-page .dl-pager :deep(.el-pagination) { padding: 2px 5px 2px 24px; }
/* 线上 Element UI 2 的间距：total→sizes 10px、sizes→prev 10px、next→jump 24px；EP 2.14 默认 16px */
.dl-page .dl-pager :deep(.el-pagination__sizes) { margin: 0 10px; width: 110px; }
.dl-page .dl-pager :deep(.el-pagination__sizes .el-select) { width: 110px; }
.dl-page .dl-pager :deep(.el-pagination button) { margin-left: 0; min-width: 35.5px; }
.dl-page .dl-pager :deep(.el-pager li) { margin: 0; min-width: 35.5px; height: 28px; line-height: 28px; }
.dl-page .dl-pager :deep(.el-pagination__jump) { margin-left: 24px; }
.dl-page .dl-pager :deep(.el-pagination__jump .el-input) { width: 32px; }
</style>
