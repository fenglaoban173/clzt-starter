<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <el-radio-group v-model="filterType" @change="onKindChange">
          <el-radio-button value="video">视频</el-radio-button>
          <el-radio-button value="image">图片</el-radio-button>
          <el-radio-button value="title_pack">标题包</el-radio-button>
          <el-radio-button value="landing_page">落地页</el-radio-button>
          <el-radio-button value="copywrite">文案库</el-radio-button>
          <el-radio-button value="deep_link">动态链接/直达链接</el-radio-button>
          <el-radio-button value="component">创意组件</el-radio-button>
          <el-radio-button value="comment">评论管理</el-radio-button>
        </el-radio-group>
        <el-space>
          <el-button v-if="isMainKind" @click="showUpload = true">上传素材</el-button>
          <el-button v-if="isMainKind" @click="showLocal = true">登记标题包/落地页</el-button>
          <el-button @click="onSync">手动同步</el-button>
          <el-button @click="onExport">导出数据</el-button>
        </el-space>
      </div>

      <el-table :data="list" row-key="id" border stripe style="margin-top: 16px">
        <el-table-column v-if="isMainKind" label="类型" :width="110">
          <template #default="{ row }"><el-tag>{{ typeText(row.type) }}</el-tag></template>
        </el-table-column>
        <el-table-column v-if="isMainKind" label="名称 / 标题" :min-width="200">
          <template #default="{ row }">
            <span v-if="row.titles">{{ formatTitles(row.titles) }}</span>
            <span v-else>{{ row.title || row.video_title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="isMainKind" label="素材 ID" prop="material_id" :width="140" />
        <el-table-column v-if="!isMainKind" label="名称" :width="220">
          <template #default="{ row }">
            <span v-if="row.titles">{{ formatTitles(row.titles) }}</span>
            <span v-else>{{ row.title || row.video_title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="!isMainKind" label="内容 / 链接" :min-width="220">
          <template #default="{ row }">{{ row.content || row.url || row.rule || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" :width="110">
          <template #default="{ row }">
            <el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" :width="180" />
        <el-table-column label="操作" :width="130" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onDetail(row)">查看</el-button>
            <el-popconfirm v-if="isMainKind" content="删除后不可恢复，确认删除？" @confirm="onRemove(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

    <!-- 文件上传 -->
    <el-dialog v-model="showUpload" title="上传视频/图片" width="480px">
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="素材类型" required>
          <el-select v-model="uploadForm.type" @change="fileList = []" style="width: 100%">
            <el-option value="video">视频（≤500MB）</el-option>
            <el-option value="image">图片（≤5MB）</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="素材名称">
          <el-input v-model="uploadForm.title" placeholder="选填，默认取文件名" />
        </el-form-item>
        <el-form-item label="绑定账户（上传后同步到巨量，选填）">
          <el-select v-model="uploadForm.account_id" clearable placeholder="不选则仅本地登记" style="width: 100%">
            <el-option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}（{{ a.advertiser_id }}）</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文件" required>
          <el-upload :auto-upload="false" :limit="1" v-model:file-list="fileList" :accept="uploadForm.type === 'video' ? '.mp4,.mpeg,.3gp,.avi,.m4v' : '.jpg,.jpeg,.png,.bmp,.gif'">
            <el-button>选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="onUpload">确定</el-button>
      </template>
    </el-dialog>

    <!-- 本地资产登记 -->
    <el-dialog v-model="showLocal" title="登记标题包 / 落地页" width="480px">
      <el-form :model="localForm" label-position="top">
        <el-form-item label="类型" required>
          <el-select v-model="localForm.type" style="width: 100%">
            <el-option value="title_pack">标题包</el-option>
            <el-option value="landing_page">落地页</el-option>
          </el-select>
        </el-form-item>
        <template v-if="localForm.type === 'title_pack'">
          <el-form-item label="标题包名称" required>
            <el-input v-model="localForm.title" />
          </el-form-item>
          <el-form-item label="标题列表（每行一条，5-30 字）" required>
            <el-input v-model="localForm.titlesText" type="textarea" :rows="6" placeholder="每行一个标题" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="落地页名称">
            <el-input v-model="localForm.title" />
          </el-form-item>
          <el-form-item label="落地页 URL" required>
            <el-input v-model="localForm.url" placeholder="https://" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showLocal = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="onRegister">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { assetApi, mediaApi } from '@/api/media';

const loading = ref(false);
const list = ref([]);
const accounts = ref([]);
const filterType = ref('video');
const page = ref(1);
const pageSize = ref(20);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

const showUpload = ref(false);
const uploading = ref(false);
const fileList = ref([]);
const uploadForm = reactive({ type: 'video', title: '', account_id: null });

const showLocal = ref(false);
const registering = ref(false);
const localForm = reactive({ type: 'title_pack', title: '', url: '', titlesText: '' });

const mainKinds = ['video', 'image', 'title_pack', 'landing_page'];
const isMainKind = computed(() => mainKinds.includes(filterType.value));

function typeText(t) {
  return { video: '视频', image: '图片', title_pack: '标题包', landing_page: '落地页', copywrite: '文案', deep_link: '直达链接', component: '组件', comment: '评论' }[t] || t;
}
function formatTitles(titles) {
  if (Array.isArray(titles)) return titles.join('、');
  try {
    return JSON.parse(titles || '[]').join('、');
  } catch (e) {
    return titles;
  }
}
function statusColor(s) {
  return { available: 'success', pending: 'warning', reviewing: 'warning', failed: 'danger', rejected: 'danger', active: 'success', handled: 'success' }[s] || 'info';
}
function statusText(s) {
  return { available: '可用', pending: '待上传', reviewing: '审核中', failed: '失败', rejected: '已拒绝', active: '生效中', handled: '已处理', unknown: '未知' }[s] || s;
}

async function load() {
  loading.value = true;
  try {
    if (isMainKind.value) {
      const res = await assetApi.list({ type: filterType.value, page: page.value, page_size: pageSize.value });
      list.value = res.data?.list || [];
      pagination.total = res.data?.total || 0;
    } else {
      const res = await assetApi.byKind(filterType.value);
      list.value = res.data?.list || [];
      pagination.total = list.value.length;
    }
    pagination.current = page.value;
  } finally {
    loading.value = false;
  }
}

function onKindChange() { page.value = 1; load(); }

async function loadAccounts() {
  const res = await mediaApi.accounts();
  accounts.value = res.data?.list || [];
}

function onPage(p) { page.value = p; load(); }

async function onUpload() {
  const file = fileList.value[0]?.raw || fileList.value[0]?.file;
  if (!file) { ElMessage.warning('请先选择文件'); return; }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('type', uploadForm.type);
    fd.append('file', file);
    if (uploadForm.title) fd.append('title', uploadForm.title);
    if (uploadForm.account_id) fd.append('account_id', uploadForm.account_id);
    await assetApi.upload(fd);
    ElMessage.success('上传成功（原型模拟）');
    showUpload.value = false;
    fileList.value = [];
    load();
  } catch (e) {
  } finally {
    uploading.value = false;
  }
}

async function onRegister() {
  registering.value = true;
  try {
    const payload = { type: localForm.type };
    if (localForm.type === 'title_pack') {
      payload.title = localForm.title;
      payload.titles = localForm.titlesText.split('\n').map((s) => s.trim()).filter(Boolean);
    } else {
      payload.title = localForm.title;
      payload.url = localForm.url;
    }
    await assetApi.register(payload);
    ElMessage.success('登记成功（原型模拟）');
    showLocal.value = false;
    load();
  } catch (e) {
  } finally {
    registering.value = false;
  }
}

async function onRemove(record) {
  await assetApi.remove(record.id);
  ElMessage.success('已删除（原型模拟）');
  load();
}

function onSync() { ElMessage.info('原型：手动同步巨量素材'); }
function onExport() { ElMessage.info('原型：导出素材清单'); }
function onDetail(record) { ElMessage.info(`原型：查看 ${record.title || record.video_title}`); }

onMounted(() => { load(); loadAccounts(); });
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
