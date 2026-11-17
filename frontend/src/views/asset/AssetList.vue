<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <div class="crumb">{{ kindText }}</div>
        <el-space>
          <el-button v-if="config.canCreate" type="primary" @click="onCreate">新建</el-button>
          <el-button @click="onSync">手动同步</el-button>
          <el-button @click="onExport">导出数据</el-button>
        </el-space>
      </div>

      <el-table :data="list" row-key="id" border stripe style="margin-top: 16px">
        <template v-if="kind === 'event'">
          <el-table-column label="事件名称" prop="name" :width="260" />
          <el-table-column label="事件标识" prop="key" :width="180" />
        </template>
        <template v-else-if="kind === 'orientation'">
          <el-table-column label="定向包名称" prop="name" :width="220" />
          <el-table-column label="地域" prop="regions" :width="120" />
          <el-table-column label="性别" prop="gender" :width="80" />
          <el-table-column label="年龄" prop="age" :width="90" />
          <el-table-column label="兴趣行为" prop="interests" :width="160" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'audience'">
          <el-table-column label="人群包名称" prop="name" :width="220" />
          <el-table-column label="包类型" prop="package_type" :width="120" />
          <el-table-column label="覆盖量" prop="size" :width="120" align="right" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'landing_page'">
          <el-table-column label="落地页名称" prop="title" :width="220" />
          <el-table-column label="URL" prop="url" :min-width="220" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'deep_link'">
          <el-table-column label="直达链接名称" prop="title" :width="220" />
          <el-table-column label="Scheme / URL" prop="url" :min-width="220" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'monitor'">
          <el-table-column label="监测活动名称" prop="name" :width="220" />
          <el-table-column label="监测链接" prop="monitor_url" :min-width="220" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.platform_status || row.status)">{{ statusText(row.platform_status || row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'copywrite'">
          <el-table-column label="文案标题" prop="title" :width="220" />
          <el-table-column label="文案内容" prop="content" :min-width="260" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'component'">
          <el-table-column label="组件标题" prop="title" :width="220" />
          <el-table-column label="组件类型" prop="comp_type" :width="120" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'comment'">
          <el-table-column label="视频标题" prop="video_title" :width="200" />
          <el-table-column label="评论内容" prop="comment" :min-width="220" />
          <el-table-column label="处理动作" prop="action" :width="120" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="row.status === 'handled' ? 'success' : row.status === 'hidden' ? 'info' : 'warning'">{{ row.status === 'handled' ? '已处理' : row.status === 'hidden' ? '已隐藏' : '待回复' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'asset_group'">
          <el-table-column label="资产组名称" prop="name" :width="220" />
          <el-table-column label="组类型" prop="group_type" :width="120" />
          <el-table-column label="素材数量" prop="count" :width="100" align="right" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'product'">
          <el-table-column label="商品名称" prop="name" :width="220" />
          <el-table-column label="商品ID" prop="product_id" :width="140" />
          <el-table-column label="商品类型" prop="product_type" :width="120" />
          <el-table-column label="价格（元）" prop="price" :width="100" align="right" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'app'">
          <el-table-column label="应用名称" prop="name" :width="200" />
          <el-table-column label="应用ID" prop="app_id" :width="140" />
          <el-table-column label="投放端" prop="platform" :width="100" />
          <el-table-column label="版本" prop="version" :width="100" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'mini_game'">
          <el-table-column label="名称" prop="title" :width="220" />
          <el-table-column label="AppID" prop="appid" :width="160" />
          <el-table-column label="类型" prop="mini_type" :width="120" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'drama_link'">
          <el-table-column label="短剧标题" prop="title" :width="220" />
          <el-table-column label="短剧ID" prop="drama_id" :width="120" />
          <el-table-column label="推广链接" prop="url" :min-width="220" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'csj_package'">
          <el-table-column label="媒体包名称" prop="name" :width="220" />
          <el-table-column label="媒体类型" prop="slot_type" :width="120" />
          <el-table-column label="覆盖量" prop="size" :width="120" align="right" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>
        <template v-else-if="kind === 'interactive'">
          <el-table-column label="素材标题" prop="title" :width="220" />
          <el-table-column label="素材类型" prop="material_type" :width="120" />
          <el-table-column label="大小" prop="size" :width="100" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'anchor'">
          <el-table-column label="锚点标题" prop="title" :width="220" />
          <el-table-column label="锚点类型" prop="anchor_type" :width="120" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" :width="180" />
        </template>
        <template v-else-if="kind === 'album'">
          <el-table-column label="专辑名称" prop="title" :width="220" />
          <el-table-column label="专辑ID" prop="album_id" :width="140" />
          <el-table-column label="作者" prop="author" :width="160" />
          <el-table-column label="状态" :width="100">
            <template #default="{ row }"><el-tag :type="statusColor(row.status)">{{ statusText(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updated_at" :width="180" />
        </template>

        <el-table-column label="操作" :width="actionWidth" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onDetail(row)">查看</el-button>
            <el-button v-if="config.canEdit" size="small" @click="onEdit(row)">编辑</el-button>
            <el-button v-if="config.canDelete" size="small" type="danger" plain @click="onRemove(row)">删除</el-button>
            <el-button v-if="kind === 'comment'" size="small" @click="onReply(row)">回复</el-button>
            <el-button v-if="kind === 'comment' && row.status !== 'hidden'" size="small" type="danger" plain @click="onHide(row)">隐藏</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建 / 编辑通用弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="110px" label-position="top">
        <el-form-item v-for="f in config.fields" :key="f.key" :label="f.label" :required="f.required">
          <el-select v-if="f.type === 'select'" v-model="form[f.key]" :placeholder="`请选择${f.label}`" style="width: 100%">
            <el-option v-for="opt in f.options" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-input v-else v-model="form[f.key]" :placeholder="`请输入${f.label}`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 评论回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复评论" width="480px" destroy-on-close>
      <el-alert :title="replyTarget ? `「${replyTarget.comment}」` : ''" type="info" :closable="false" style="margin-bottom: 12px" />
      <el-input v-model="replyText" type="textarea" :rows="3" placeholder="请输入回复内容" />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmitReply">回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { assetApi } from '@/api/media';
import {
  targetApi, siteApi, eventApi, productApi, toolApi, appApi,
  assetExtApi,
} from '@/api/openapi';

const route = useRoute();
const ASSET_KINDS = [
  'event', 'orientation', 'audience', 'landing_page', 'deep_link', 'monitor',
  'copywrite', 'component', 'comment', 'asset_group', 'product', 'app',
  'mini_game', 'drama_link', 'csj_package', 'interactive', 'anchor', 'album',
];
const KIND_TEXT = {
  event: '事件管理', orientation: '定向包', audience: '自定义人群包', landing_page: '落地页',
  deep_link: '直达链接', monitor: '监测活动', copywrite: '文案库', component: '创意组件',
  comment: '评论管理', asset_group: '资产组', product: '巨量商品库', app: '巨量应用',
  mini_game: '小程序/小游戏', drama_link: '短剧推广链接', csj_package: '穿山甲媒体包',
  interactive: '试玩/直玩素材', anchor: '原生锚点模板', album: '专辑链接',
};

// 各资产类能力与表单字段；未配置的类（直达/动态链接、文案库、资产组、事件、应用）只读
const KIND_CONFIG = {
  orientation: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => targetApi.audiencePackageList(),
    create: (p) => targetApi.audiencePackageCreate(p),
    update: (p) => targetApi.audiencePackageUpdate(p),
    remove: (id) => targetApi.audiencePackageRemove(id),
    fields: [
      { key: 'name', label: '定向包名称', type: 'text', required: true },
      { key: 'regions', label: '地域', type: 'text' },
      { key: 'gender', label: '性别', type: 'select', options: ['不限', '男', '女'] },
      { key: 'age', label: '年龄', type: 'text' },
      { key: 'interests', label: '兴趣行为', type: 'text' },
    ],
  },
  audience: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => targetApi.customAudienceList(),
    create: (p) => targetApi.customAudienceCreate(p),
    update: (p) => targetApi.customAudienceUpdate(p),
    remove: (id) => targetApi.customAudienceRemove(id),
    fields: [
      { key: 'name', label: '人群包名称', type: 'text', required: true },
      { key: 'package_type', label: '包类型', type: 'select', options: ['行为兴趣', '排除人群', '规则包'] },
      { key: 'size', label: '覆盖量', type: 'text' },
    ],
  },
  landing_page: {
    canCreate: true, canEdit: true, canDelete: false,
    list: () => siteApi.siteList(),
    create: (p) => siteApi.siteCreate(p),
    update: (p) => siteApi.siteUpdate(p),
    fields: [
      { key: 'title', label: '落地页名称', type: 'text', required: true },
      { key: 'url', label: '页面 URL', type: 'text', required: true },
      { key: 'page_type', label: '落地页类型', type: 'select', options: ['橙子建站', '第三方', '字节小程序', '微信小程序'] },
    ],
  },
  monitor: {
    canCreate: true, canEdit: true, canDelete: false,
    list: () => eventApi.trackUrlList(),
    create: (p) => eventApi.trackUrlCreate(p),
    update: (p) => eventApi.trackUrlUpdate(p),
    fields: [
      { key: 'name', label: '监测活动名称', type: 'text', required: true },
      { key: 'monitor_url', label: '监测链接', type: 'text', required: true },
    ],
  },
  product: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => productApi.dpaList(),
    create: (p) => productApi.dpaCreate(p),
    update: (p) => productApi.dpaUpdate(p),
    remove: (id) => productApi.dpaDelete([id]),
    fields: [
      { key: 'name', label: '商品名称', type: 'text', required: true },
      { key: 'product_id', label: '商品ID', type: 'text' },
      { key: 'product_type', label: '商品类型', type: 'select', options: ['商品', '虚拟商品'] },
      { key: 'price', label: '价格（元）', type: 'text' },
    ],
  },
  mini_game: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => assetApi.byKind('mini_game'),
    create: (p) => assetExtApi.miniCreate(p),
    fields: [
      { key: 'title', label: '名称', type: 'text', required: true },
      { key: 'appid', label: 'AppID', type: 'text' },
      { key: 'mini_type', label: '类型', type: 'select', options: ['字节小游戏', '微信小游戏', '微信小程序'] },
    ],
  },
  drama_link: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => productApi.dramaAuth(),
    create: (p) => assetExtApi.dramaLinkCreate(p),
    fields: [
      { key: 'title', label: '短剧标题', type: 'text', required: true },
      { key: 'drama_id', label: '短剧ID', type: 'text' },
      { key: 'url', label: '推广链接', type: 'text', required: true },
    ],
  },
  csj_package: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => toolApi.unionPackageList(),
    create: (p) => toolApi.unionPackageCreate(p),
    update: (p) => toolApi.unionPackageUpdate(p),
    remove: (id) => toolApi.unionPackageRemove(id),
    fields: [
      { key: 'name', label: '媒体包名称', type: 'text', required: true },
      { key: 'slot_type', label: '媒体类型', type: 'select', options: ['游戏类', '阅读类', '工具类'] },
      { key: 'size', label: '覆盖量', type: 'text' },
    ],
  },
  interactive: {
    canCreate: true, canEdit: false, canDelete: false,
    list: () => assetExtApi.playableList(),
    create: (p) => assetExtApi.playableUpload(p),
    fields: [
      { key: 'title', label: '素材标题', type: 'text', required: true },
      { key: 'material_type', label: '素材类型', type: 'select', options: ['试玩素材', '直玩素材'] },
      { key: 'size', label: '大小', type: 'text' },
    ],
  },
  component: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.componentList(),
    create: (p) => assetExtApi.componentCreate(p),
    update: (p) => assetExtApi.componentUpdate(p),
    remove: (id) => assetExtApi.componentRemove(id),
    fields: [
      { key: 'title', label: '组件标题', type: 'text', required: true },
      { key: 'comp_type', label: '组件类型', type: 'select', options: ['表单', '客服', '锚点', '卡券'] },
    ],
  },
  anchor: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.anchorList(),
    create: (p) => assetExtApi.anchorCreate(p),
    update: (p) => assetExtApi.anchorUpdate(p),
    remove: (id) => assetExtApi.anchorRemove(id),
    fields: [
      { key: 'title', label: '锚点标题', type: 'text', required: true },
      { key: 'anchor_type', label: '锚点类型', type: 'select', options: ['门店锚点', '商品锚点', '私信锚点'] },
    ],
  },
  album: {
    canCreate: true, canEdit: true, canDelete: true,
    list: () => assetExtApi.albumList(),
    create: (p) => assetExtApi.albumCreate(p),
    update: (p) => assetExtApi.albumUpdate(p),
    remove: (id) => assetExtApi.albumRemove(id),
    fields: [
      { key: 'title', label: '专辑名称', type: 'text', required: true },
      { key: 'album_id', label: '专辑ID', type: 'text' },
      { key: 'author', label: '作者', type: 'text' },
    ],
  },
  comment: {
    canCreate: false, canEdit: false, canDelete: false,
    list: () => assetExtApi.commentList(),
  },
  event: {
    canCreate: false, canEdit: false, canDelete: false,
    list: () => eventApi.assetList(),
  },
  app: {
    canCreate: false, canEdit: false, canDelete: false,
    list: () => appApi.androidList(),
  },
};

const loading = ref(false);
const list = ref([]);
const kind = ref(ASSET_KINDS.includes(route.query.kind) ? route.query.kind : 'event');
const kindText = computed(() => KIND_TEXT[kind.value] || '事件管理');
const config = computed(() => KIND_CONFIG[kind.value] || {});
const actionWidth = computed(() => {
  const extra = (config.value.canEdit ? 1 : 0) + (config.value.canDelete ? 1 : 0) + (kind.value === 'comment' ? 2 : 0);
  return 100 + extra * 70;
});

// 弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref('');
const editingId = ref(null);
const form = ref({});
const formRef = ref();
// 回复弹窗
const replyVisible = ref(false);
const replyTarget = ref(null);
const replyText = ref('');

watch(() => route.query.kind, (k) => {
  if (ASSET_KINDS.includes(k)) { kind.value = k; load(); }
});

function statusColor(s) {
  return { available: 'success', active: 'success', reviewing: 'warning', failed: 'danger', hidden: 'info' }[s] || 'info';
}
function statusText(s) {
  return { available: '可用', active: '生效中', reviewing: '审核中', failed: '失败', hidden: '已隐藏' }[s] || s || '-';
}
function now() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

// 官方口径集合 → 视图展示口径归一化（字段名 / 枚举 / 状态）
const AUDIENCE_PT = { BEHAVIOR_INTEREST: '行为兴趣', EXCLUDE: '排除人群', RULE: '规则包' };
const LANDING_PT = { ORANGE: '橙子建站', THIRD_PARTY: '第三方', MICRO_APP: '字节小程序', WECHAT_APPLET: '微信小程序' };
const NORMALIZE = {
  audience(row) {
    const size = typeof row.size === 'number' ? row.size.toLocaleString('en-US') : row.size;
    return { ...row, package_type: AUDIENCE_PT[row.package_type] || row.package_type, size, updated_at: row.update_time || row.updated_at, status: row.status === 'PUBLISHED' ? 'available' : row.status };
  },
  landing_page(row) {
    return { ...row, title: row.title || row.name, page_type: LANDING_PT[row.page_type] || row.page_type, status: row.status === 'ENABLED' ? 'available' : row.status };
  },
  monitor(row) {
    return { ...row, monitor_url: row.monitor_url || row.url, status: row.status === 'ACTIVE' ? 'active' : row.status };
  },
  product(row) {
    return { ...row, name: row.name || row.title, product_type: row.product_type || row.category_name, status: row.status === 'ON_SHELF' ? 'available' : row.status };
  },
};

async function load() {
  loading.value = true;
  try {
    const cfg = KIND_CONFIG[kind.value];
    const res = cfg?.list ? await cfg.list() : await assetApi.byKind(kind.value);
    const norm = NORMALIZE[kind.value] || ((x) => x);
    list.value = (res.data?.list || []).map(norm);
  } finally {
    loading.value = false;
  }
}

function blankForm() {
  const f = {};
  (config.value.fields || []).forEach((field) => { f[field.key] = field.type === 'select' ? '' : ''; });
  return f;
}

function onCreate() {
  editingId.value = null;
  form.value = blankForm();
  dialogTitle.value = `新建${kindText.value}`;
  dialogVisible.value = true;
}

function onEdit(row) {
  editingId.value = row.id;
  form.value = { ...row };
  dialogTitle.value = `编辑${kindText.value}`;
  dialogVisible.value = true;
}

async function onSubmit() {
  // 必填校验
  for (const field of config.value.fields || []) {
    if (field.required && !String(form.value[field.key] || '').trim()) {
      ElMessage.warning(`请填写${field.label}`);
      return;
    }
  }
  const cfg = config.value;
  const payload = { ...form.value };
  try {
    if (editingId.value == null) {
      await cfg.create?.(payload);
      list.value.unshift({ id: Date.now(), status: 'available', created_at: now(), ...payload });
      ElMessage.success('新建成功');
    } else {
      await cfg.update?.(payload);
      const idx = list.value.findIndex((x) => x.id === editingId.value);
      if (idx > -1) list.value[idx] = { ...list.value[idx], ...payload, updated_at: now() };
      ElMessage.success('保存成功');
    }
    dialogVisible.value = false;
  } catch (e) {
    ElMessage.error('操作失败');
  }
}

async function onRemove(row) {
  await ElMessageBox.confirm(`确认删除「${row.name || row.title}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
  await config.value.remove?.(row.id);
  list.value = list.value.filter((x) => x.id !== row.id);
  ElMessage.success('已删除');
}

function onDetail(row) {
  ElMessage.info(`原型：查看 ${row.name || row.title || row.video_title}`);
}

function onReply(row) {
  replyTarget.value = row;
  replyText.value = '';
  replyVisible.value = true;
}

async function onSubmitReply() {
  if (!replyText.value.trim()) { ElMessage.warning('请输入回复内容'); return; }
  await assetExtApi.commentReply({ comment_id: replyTarget.value.id, reply: replyText.value.trim() });
  const idx = list.value.findIndex((x) => x.id === replyTarget.value.id);
  if (idx > -1) { list.value[idx].action = '已回复'; list.value[idx].status = 'handled'; }
  replyVisible.value = false;
  ElMessage.success('回复成功');
}

async function onHide(row) {
  await ElMessageBox.confirm('确认隐藏该评论吗？', '隐藏确认', { type: 'warning' });
  await assetExtApi.commentHide(row.id);
  const idx = list.value.findIndex((x) => x.id === row.id);
  if (idx > -1) { list.value[idx].status = 'hidden'; list.value[idx].action = '已隐藏'; }
  ElMessage.success('已隐藏');
}

function onSync() { ElMessage.info('原型：手动同步巨量资产'); }
function onExport() { ElMessage.info('原型：导出资产清单'); }

onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.crumb { font-size: 15px; font-weight: 600; color: #1d2129; }
</style>
