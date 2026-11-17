<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <el-select v-model="status" style="width: 160px" @change="reload" clearable placeholder="全部状态">
          <el-option value="QUEUED">排队中</el-option>
          <el-option value="RUNNING">执行中</el-option>
          <el-option value="COOLDOWN">冷却中</el-option>
          <el-option value="DONE">已完成</el-option>
          <el-option value="PARTIAL">部分成功</el-option>
          <el-option value="FAILED">失败</el-option>
          <el-option value="CANCELLED">已取消</el-option>
        </el-select>
        <el-button @click="reload">刷新</el-button>
      </div>

      <el-table :data="list" row-key="id" border stripe style="margin-top: 16px">
        <el-table-column label="任务号" prop="task_no" :width="170" />
        <el-table-column label="名称" prop="name" :min-width="180" />
        <el-table-column label="创建人" prop="creator" :width="120" />
        <el-table-column label="进度" :width="220">
          <template #default="{ row }">
            <el-progress :percentage="percent(row)" :show-text="false" />
            <span class="progress-text">{{ row.succeeded }}/{{ row.total }}（失败 {{ row.failed }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" :width="110">
          <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" :width="180" />
        <el-table-column label="操作" :width="140" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" @click="openDetail(row)">明细</el-button>
              <el-popconfirm v-if="['QUEUED','RUNNING','COOLDOWN','PAUSED'].includes(row.status)" content="确认取消该任务？" @confirm="onCancel(row)">
                <template #reference>
                  <el-button size="small" type="danger">取消</el-button>
                </template>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, prev, pager, next"
        :total="pagination.total"
        :current-page="pagination.current"
        :page-size="pagination.pageSize"
        @current-change="onPage"
      />
    </el-card>

    <el-drawer v-model="detailVisible" :size="640" title="任务明细">
      <el-table :data="items" size="small" row-key="id" border>
        <el-table-column label="计划名" :min-width="180">
          <template #default="{ row }"><code>{{ row.payload?.promotion?.name || '-' }}</code></template>
        </el-table-column>
        <el-table-column label="账户" prop="account_name" :width="160" />
        <el-table-column label="状态" :width="100">
          <template #default="{ row }"><el-tag :type="itemColor(row.status)">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="错误" prop="error" :min-width="160" />
        <el-table-column label="操作" :width="90">
          <template #default="{ row }">
            <el-button v-if="row.status === 'failed'" size="small" @click="onRetry(row)">重提</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { buildApi } from '@/api/media';

const loading = ref(false);
const list = ref([]);
const status = ref('');
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

const detailVisible = ref(false);
const items = ref([]);

function statusColor(s) {
  return { QUEUED: 'info', RUNNING: 'primary', COOLDOWN: 'warning', DONE: 'success', PARTIAL: 'warning', FAILED: 'danger', CANCELLED: 'info' }[s] || 'info';
}
function statusText(s) {
  return { QUEUED: '排队中', RUNNING: '执行中', COOLDOWN: '冷却中', PAUSED: '已暂停', DONE: '已完成', PARTIAL: '部分成功', FAILED: '失败', CANCELLED: '已取消', CANCELLING: '取消中' }[s] || s;
}
function itemColor(s) {
  return { success: 'success', failed: 'danger', pending: 'info', running: 'primary', skipped: 'info' }[s] || 'info';
}
function percent(r) {
  return r.total > 0 ? Math.round(((r.succeeded + r.failed) / r.total) * 100) : 0;
}

async function reload() {
  loading.value = true;
  try {
    const res = await buildApi.tasks({ status: status.value, page: page.value, page_size: pagination.pageSize });
    list.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function onPage(p) { page.value = p; reload(); }

async function openDetail(record) {
  const res = await buildApi.taskDetail(record.id);
  items.value = res.data?.items || [];
  detailVisible.value = true;
}

async function onCancel(record) {
  await buildApi.cancelTask(record.id);
  ElMessage.success('已提交取消');
  reload();
}

async function onRetry(record) {
  await buildApi.retryItem(record.id);
  ElMessage.success('已重新加入执行队列');
  openDetail({ id: record.task_id });
}

onMounted(reload);
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; }
.progress-text { margin-left: 8px; font-size: 12px; color: #86909c; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
