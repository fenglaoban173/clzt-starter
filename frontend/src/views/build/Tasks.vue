<template>
  <div class="tasks-page">
    <!-- ① 标题（线上 .mg-title-header > h1：16px/700/#333，左边距 16px） -->
    <div class="ts-title">
      <h1>批量操作任务</h1>
    </div>

    <!-- ② 筛选行（线上 .mg-filter-wrapper.cl-filter：白底 padding 12px 16px） -->
    <div class="ts-filter">
      <div class="ts-filter-row">
        <div class="ts-field">
          <label class="ts-label">媒体：</label>
          <el-select
            v-model="query.media"
            size="small"
            class="ts-select"
            placeholder="请选择媒体"
            @change="onFilterChange"
          >
            <el-option v-for="m in MEDIA_OPTIONS" :key="m" :label="m" :value="m" />
          </el-select>
        </div>

        <div class="ts-field">
          <label class="ts-label">执行状态：</label>
          <el-select
            v-model="query.status"
            size="small"
            class="ts-select"
            placeholder="请选择执行状态"
            @change="onFilterChange"
          >
            <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
          </el-select>
        </div>

        <div class="ts-field">
          <label class="ts-label">操作类型：</label>
          <el-select
            v-model="query.opType"
            size="small"
            class="ts-select"
            placeholder="请选择操作类型"
            @change="onFilterChange"
          >
            <el-option v-for="o in OP_TYPE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 搜索组：80px 维度 select + 关键词输入 + 🔍 按钮（线上 cl-search-input 300×28） -->
        <div class="ts-search">
          <el-select v-model="query.field" size="small" class="ts-search__sel">
            <el-option label="任务名称" value="name" />
            <el-option label="ID" value="id" />
          </el-select>
          <el-input
            v-model="query.keyword"
            size="small"
            class="ts-search__input"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
          />
          <button type="button" class="ts-search__btn" title="搜索" @click="onSearch">
            <el-icon><Search /></el-icon>
          </button>
        </div>

        <a class="ts-clear" @click="clearAll">清空</a>
      </div>
    </div>

    <!-- ③ 表格（线上 el-table--fit el-table--border，9 列固定宽合计 1727） -->
    <div class="ts-table-wrap">
      <el-table :data="pagedRows" row-key="id" border class="ts-table">
        <el-table-column label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="ts-name ellipsis">{{ row.name }}</div>
            <div class="ts-cell-id">ID：{{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="媒体账户" min-width="120">
          <template #default="{ row }">{{ row.account }}</template>
        </el-table-column>
        <el-table-column label="提交数量" min-width="100">
          <template #default="{ row }">{{ row.submitCount }}</template>
        </el-table-column>
        <el-table-column label="媒体" width="160">
          <template #default="{ row }">{{ row.media }}</template>
        </el-table-column>
        <el-table-column label="操作类型" min-width="120">
          <template #default="{ row }">{{ row.opType }}</template>
        </el-table-column>
        <el-table-column label="创建人" width="160">
          <template #default="{ row }">{{ row.creator }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.createdAt }}</template>
        </el-table-column>
        <el-table-column label="执行状态" min-width="160">
          <template #header>
            <span>执行状态</span>
            <el-tooltip placement="top" :teleported="false" :content="STATUS_HELP">
              <i class="ts-help">?</i>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span class="ts-status"><i class="ts-status__dot" :style="{ background: statusColor(row.status) }"></i><span class="ts-status__text" :style="{ color: statusColor(row.status) }">{{ row.status }}</span></span><span class="ts-opt">成功：{{ row.success }} 失败：{{ row.fail }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120">
          <template #default="{ row }">
            <el-button link class="ts-op" @click="openDetail(row)">详情</el-button><el-button link class="ts-op" @click="onDelete(row)">删除</el-button><el-button link class="ts-op" :disabled="canTerminate(row)" @click="onTerminate(row)">终止</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- ④ 分页（线上：共 70 条 / 10条每页 / 1~7 / 前往 __ 页，整体靠左） -->
      <div class="ts-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <!-- ⑤ 详情面板 -->
    <el-drawer v-model="detailVisible" title="批量操作任务详情" size="560px" class="ts-drawer">
      <div v-if="detailRow" class="ts-detail">
        <div class="ts-detail__row"><span class="ts-detail__label">任务名称</span><span class="ts-detail__value">{{ detailRow.name }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">ID</span><span class="ts-detail__value">{{ detailRow.id }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">媒体</span><span class="ts-detail__value">{{ detailRow.media }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">媒体账户</span><span class="ts-detail__value">{{ detailRow.account }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">操作类型</span><span class="ts-detail__value">{{ detailRow.opType }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">提交数量</span><span class="ts-detail__value">{{ detailRow.submitCount }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">创建人</span><span class="ts-detail__value">{{ detailRow.creator }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">创建时间</span><span class="ts-detail__value">{{ detailRow.createdAt }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">执行状态</span><span class="ts-detail__value">{{ detailRow.status }}</span></div>
        <div class="ts-detail__row"><span class="ts-detail__label">执行结果</span><span class="ts-detail__value">成功：{{ detailRow.success }} 失败：{{ detailRow.fail }}</span></div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 任务 → 批量操作任务（线上 https://cl.mobgi.com/task/index）
 *
 * 采集自线上 DOM / computed style（C:/tmp/nw/B_批量操作任务.json、线上探针）：
 *   - 页面标题 h1：16px / 700 / #333，左边距 16px
 *   - 筛选行：白底 padding 12px 16px，控件高 28px
 *       媒体 169×28（x=221） 执行状态 169×28（x=473） 操作类型 169×28（x=725）
 *       搜索组 300×28（x=908）= 80px 维度 select + 178px 关键词输入 + 41px 🔍
 *       清空 12px #197afb（x=1220）
 *   - 表格：9 列 306/182/152/160/182/160/160/243/182（合计 1727），行高 56px
 *       表头 #ebedf4 / 12px / 700 / #333，单元格 12px #333，边框 #e8eaec
 *   - 分页：共 70 条 / 10条每页 / 1~7 页 / 前往 __ 页，整体靠左
 * ------------------------------------------------------------------ */
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

/** 线上「媒体」下拉（5 项，逐字照抄） */
const MEDIA_OPTIONS = ['巨量广告2.0', '腾讯广告3.0', '通用', '京东青云', '常读'];

/** 线上「执行状态」下拉（6 项，逐字照抄） */
const STATUS_OPTIONS = ['不限', '执行中', '执行完成', '已终止', '等待执行', '已超时'];

/** 线上「操作类型」下拉（136 项，逐字照抄线上 selectEnums） */
const OP_TYPE_OPTIONS = [
  "全部",
  "资产同步",
  "暂停",
  "删除",
  "启用",
  "启用",
  "暂停",
  "删除",
  "素材一键起量",
  "添加项目创意",
  "添加智擎项目创意",
  "删除全域项目下素材",
  "删除智擎项目下素材",
  "暂停全域项目下素材",
  "暂停智擎项目下素材",
  "修改项目预算",
  "修改项目出价",
  "修改项目名称",
  "同步广告评论",
  "隐藏广告评论",
  "同步鸿蒙应用",
  "修改项目否定词",
  "修改项目深度出价",
  "修改项目出价和深度出价",
  "修改项目ROI系数",
  "修改项目投放时段",
  "修改智擎项目出价和深度出价",
  "修改智擎项目ROI系数",
  "修改智擎项目预算",
  "修改智擎项目投放时段",
  "修改智擎项目落地页",
  "修改智擎项目直达链接",
  "修改智擎项目投放时间",
  "修改智擎项目名称",
  "修改全域项目ROI系数",
  "修改全域项目预算",
  "修改全域项目投放时段",
  "修改全域项目投放时间",
  "批量修改出海预算",
  "批量修改出海ROI系数",
  "修改全域项目名称",
  "修改投放时间",
  "修改项目直达链接",
  "修改项目应用商店下载",
  "修改广告预算",
  "修改广告出价",
  "修改广告深度出价",
  "修改广告直达备用链接",
  "修改产品卖点",
  "修改产品主图",
  "修改广告ROI系数",
  "修改出价及深度出价",
  "修改广告名称",
  "修改定向",
  "创意清理",
  "素材清理",
  "上传/更新账户头像",
  "修改广告来源",
  "修改落地页",
  "修改广告直达链接",
  "修改广告多直达链接",
  "修改广告产品名称",
  "修改广告短剧专辑链接",
  "修改广告字节小程序/小游戏链接",
  "修改监测活动",
  "修改搜索关键词",
  "修改项目定向",
  "修改广告标题和素材",
  "修改广告投放时段",
  "修改广告创意组件",
  "一键起量",
  "批量创建微信小程序组件",
  "添加屏蔽词",
  "修改账户名称",
  "修改广告创意",
  "修改广告否定词",
  "创建字节小游戏",
  "创建字节小程序",
  "字节小游戏批量导入链接",
  "字节小程序批量导入链接",
  "创建微信小程序(EBP)",
  "创建字节小程序(EBP)",
  "创建字节小游戏(EBP)",
  "字节小程序批量导入链接(EBP)",
  "字节小游戏批量导入链接(EBP)",
  "修改日预算",
  "落地页信息修改",
  "同步媒体素材命名",
  "批量创建小游戏组件",
  "批量创建落地页_小游戏",
  "批量创建落地页_店铺引流",
  "批量创建落地页_应用下载",
  "素材",
  "发布抖音主页视频",
  "修改监测链接",
  "推送素材",
  "修改预算",
  "创建橙子落地页模板",
  "获取账户素材",
  "头条广告快捷复制",
  "删除媒体素材",
  "停用本地素材",
  "删除广告素材",
  "暂停在投素材",
  "暂停广告",
  "发布视频到抖店",
  "创建推广链接",
  "推送推广链接",
  "爆款裂变",
  "批量清理媒体账户",
  "同步巨量试玩/直玩素材",
  "手动同步广告",
  "手动同步项目",
  "手动同步全域项目",
  "手动同步智擎项目",
  "上传巨量试玩/直玩素材",
  "同步小程序链接",
  "删除小程序链接",
  "同步小程序链接(升级版工作台)",
  "导入同步链接绑定账户",
  "导入同步链接绑定账户(升级版工作台)",
  "设置账户RTA",
  "同步账户备注(巨量)",
  "推送资产",
  "生成巨量产品",
  "同步巨量通用版商品",
  "同步巨量升级版商品",
  "同步巨量通用版商品(升级版工作台)",
  "同步巨量升级版商品(升级版工作台)",
  "共享巨量商品",
  "批量创建短剧推广链接",
  "修改托管方案项目出价",
  "修改托管方案广告出价",
  "修改托管方案执行时间",
  "创量落地页生成",
  "同步组织素材",
];

/** 线上「执行状态」表头的问号提示文案 */
const STATUS_HELP = '当状态为绿色提交完成时，则包含的所有提交均为成功；当状态为红色提交完成时，则包含的提交中有失败项';

/* ------------------------------------------------------------------
 * 行数据：前 10 行为线上实测数据（逐字照抄），其后补充本地演示数据，
 * 保证「媒体 = 巨量广告2.0」时共 70 条 / 7 页，与线上一致。
 * ------------------------------------------------------------------ */
const ONLINE_ROWS = [
  { id: '12081348131', name: '同步巨量通用版商品-11_25_15:38:36', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:38:36', status: '执行完成', success: 1, fail: 0 },
  { id: '12081348125', name: '同步巨量通用版商品-11_25_15:38:35', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:38:35', status: '执行完成', success: 1, fail: 0 },
  { id: '12081347912', name: '同步巨量通用版商品-11_25_15:38:13', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:38:13', status: '执行完成', success: 1, fail: 0 },
  { id: '12081347821', name: '同步巨量通用版商品-11_25_15:38:05', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:38:05', status: '执行完成', success: 1, fail: 0 },
  { id: '12081339339', name: '同步巨量通用版商品-11_25_15:25:48', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:25:48', status: '执行完成', success: 1, fail: 0 },
  { id: '12081339323', name: '同步巨量通用版商品-11_25_15:25:46', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:25:46', status: '执行完成', success: 1, fail: 0 },
  { id: '12081339305', name: '同步巨量通用版商品-11_25_15:25:45', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:25:45', status: '执行完成', success: 1, fail: 0 },
  { id: '12081339144', name: '同步巨量通用版商品-11_25_15:25:35', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-25 15:25:35', status: '执行完成', success: 1, fail: 0 },
  { id: '12081138345', name: '账户-上传/更新账户头像-_11-25_09:52:04', account: '-', submitCount: 10, media: '巨量广告2.0', opType: '上传/更新账户头像', creator: '杨浩蒙', createdAt: '2026-11-25 09:52:04', status: '执行完成', success: 10, fail: 0 },
  { id: '12080842612', name: '同步巨量通用版商品-11_24_17:31:24', account: '-', submitCount: 1, media: '巨量广告2.0', opType: '同步巨量通用版商品(升级版工作台)', creator: '杨浩蒙', createdAt: '2026-11-24 17:31:24', status: '执行完成', success: 1, fail: 0 },
];

/** 本地补充数据：让三个下拉 / 搜索真的能过滤出不同结果 */
function buildLocalRows() {
  const creators = ['杨浩蒙', '李思远', '王一鸣'];
  const statuses = ['执行完成', '执行中', '等待执行', '已终止', '已超时'];
  const extraOpTypes = [
    '同步巨量通用版商品(升级版工作台)', '上传/更新账户头像', '同步巨量升级版商品(升级版工作台)',
    '推送资产', '素材一键起量', '修改广告出价', '同步账户备注(巨量)', '创量落地页生成',
  ];
  const rows = [];
  let id = 12080842611;
  for (let i = 0; i < 60; i += 1) {
    id -= 37;
    const day = String(23 - Math.floor(i / 12)).padStart(2, '0');
    const hh = String(20 - Math.floor(i / 6)).padStart(2, '0');
    const mm = String(59 - (i % 6) * 9).padStart(2, '0');
    const ss = String(58 - (i % 4) * 11).padStart(2, '0');
    const opType = extraOpTypes[i % extraOpTypes.length];
    const status = statuses[i % statuses.length];
    const submitCount = (i % 5) + 1;
    const fail = status === '执行完成' ? (i % 7 === 0 ? 1 : 0) : 0;
    rows.push({
      id: String(id),
      name: `同步巨量通用版商品-11_${day}_${hh}:${mm}:${ss}`,
      account: '-',
      submitCount,
      media: '巨量广告2.0',
      opType,
      creator: creators[i % creators.length],
      createdAt: `2026-11-${day} ${hh}:${mm}:${ss}`,
      status,
      success: status === '执行完成' ? submitCount - fail : 0,
      fail,
    });
  }
  // 其它媒体的演示数据（默认媒体筛选为「巨量广告2.0」，这些行默认不显示）
  const otherMedia = [
    { media: '腾讯广告3.0', n: 12 },
    { media: '通用', n: 8 },
    { media: '京东青云', n: 4 },
    { media: '常读', n: 3 },
  ];
  let otherId = 12080842610;
  otherMedia.forEach((m, mi) => {
    for (let i = 0; i < m.n; i += 1) {
      otherId -= 53;
      const opType = extraOpTypes[(i + mi) % extraOpTypes.length];
      const status = statuses[(i + mi) % statuses.length];
      rows.push({
        id: String(otherId),
        name: `${opType}-11_${String(20 - mi).padStart(2, '0')}_${String(9 + i).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}:00`,
        account: '-',
        submitCount: (i % 4) + 1,
        media: m.media,
        opType,
        creator: creators[(i + mi) % creators.length],
        createdAt: `2026-11-${String(20 - mi).padStart(2, '0')} ${String(9 + i).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}:00`,
        status,
        success: status === '执行完成' ? (i % 4) + 1 : 0,
        fail: 0,
      });
    }
  });
  return rows;
}

const rows = ref([...ONLINE_ROWS, ...buildLocalRows()]);

/* ---------------- 筛选条件 ---------------- */
const query = ref({
  media: '巨量广告2.0',
  status: '不限',
  opType: '全部',
  field: 'name',
  keyword: '',
});

const pageNo = ref(1);
const pageSize = ref(10);

const filteredRows = computed(() => {
  const q = query.value;
  const kw = (q.keyword || '').trim();
  return rows.value.filter((r) => {
    if (q.media && r.media !== q.media) return false;
    if (q.status && q.status !== '不限' && r.status !== q.status) return false;
    if (q.opType && q.opType !== '全部' && r.opType !== q.opType) return false;
    if (kw) {
      if (q.field === 'id') {
        if (String(r.id).indexOf(kw) === -1) return false;
      } else if (r.name.indexOf(kw) === -1) {
        return false;
      }
    }
    return true;
  });
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => { pageNo.value = 1; });

/** 下拉改变 → 立即过滤并回到第 1 页 */
function onFilterChange() {
  pageNo.value = 1;
}

/** 点 🔍 / 回车 → 触发搜索（关键词已实时参与过滤，这里回到第 1 页） */
function onSearch() {
  pageNo.value = 1;
}

/** 清空 → 恢复全部筛选条件 */
function clearAll() {
  query.value = { media: '巨量广告2.0', status: '不限', opType: '全部', field: 'name', keyword: '' };
  pageNo.value = 1;
}

/* ---------------- 行内操作 ---------------- */
const STATUS_COLOR = {
  执行完成: '#28ba52',
  执行中: '#409eff',
  等待执行: '#ff9900',
  已终止: '#909399',
  已超时: '#f56c6c',
};
function statusColor(s) {
  return STATUS_COLOR[s] || '#909399';
}

/** 已结束的任务不允许再终止（线上「终止」为置灰） */
function canTerminate(row) {
  return ['执行完成', '已终止', '已超时'].includes(row.status);
}

const detailVisible = ref(false);
const detailRow = ref(null);

function openDetail(row) {
  detailRow.value = row;
  detailVisible.value = true;
}

/** 删除：二次确认 → 移除本地数据 */
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务「${row.name}」吗？删除后将无法恢复。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
      }
    );
  } catch (e) {
    return;
  }
  rows.value = rows.value.filter((r) => r.id !== row.id);
  const maxPage = Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value));
  if (pageNo.value > maxPage) pageNo.value = maxPage;
  ElMessage.success('删除成功');
}

/** 终止：二次确认 → 置为「已终止」 */
async function onTerminate(row) {
  try {
    await ElMessageBox.confirm(
      `确定要终止任务「${row.name}」吗？终止后该任务将不再执行。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
      }
    );
  } catch (e) {
    return;
  }
  row.status = '已终止';
  ElMessage.success('任务已终止');
}
</script>

<style scoped>
/* ==================================================================
 * 页面骨架（线上 .cl-container-main > .page-wrapper > .page-content）
 * 页面底色 #f5f6f7；标题 / 筛选行为白底，表格与分页各自独立白块
 * ================================================================== */
.tasks-page {
  /* App.vue 的全局规则 `.app-content > div:not(.sub-tabs):not(.batch-page)`
     会给所有页面根节点加 16px 20px 20px 内边距；线上本页是**顶格**布局
     （标题条紧贴顶栏、筛选条白底满宽），这里显式清零。 */
  padding: 0 !important;
  min-height: 100%;
  background: #f5f6f7;
  color: #333;
  font-size: 14px;

  /* 本地拿不到 body.app-scope 的令牌，这里显式写死线上用的创量配色 */
  --el-color-primary: #197afb;
  --el-color-primary-rgb: 25, 122, 251;
  --el-color-primary-light-3: #5ea2fc;
  --el-color-primary-light-5: #8cbdfd;
  --el-color-primary-light-7: #bad7fe;
  --el-color-primary-light-8: #d1e4fe;
  --el-color-primary-light-9: #e8f1ff;
  --el-color-primary-dark-2: #1462c9;
  --el-border-radius-base: 3px;
  --el-border-radius-small: 2px;
  --el-table-border-color: #e8eaec;
  --el-table-header-bg-color: #ebedf4;
  --el-table-header-text-color: #909399;
  --el-table-text-color: #333333;
  --el-text-color-regular: #333333;
  --el-text-color-secondary: #909399;
  --el-border-color: #dcdfe6;
  --el-border-color-light: #ebeef5;
}

/* ---------- 标题 ---------- */
.ts-title {
  height: 48px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 16px;
}
.ts-title h1 {
  margin: 0;
  height: 48px;
  line-height: 48px;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

/* ---------- 筛选行 ---------- */
.ts-filter {
  background: #fff;
  padding: 12px 16px;
}
.ts-filter-row {
  display: flex;
  align-items: center;
  height: 28px;
}
/* 线上：label 与 select 之间没有间隙，label 12px #666 */
.ts-field {
  display: flex;
  align-items: center;
  height: 28px;
  padding-left: 9px;
  margin-right: 14px;
}
.ts-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  line-height: 28px;
}
/* 线上实测 169×28 */
.ts-select {
  width: 169px;
  flex: none;
}
.ts-select :deep(.el-select__wrapper) {
  height: 28px;
  min-height: 28px;
  padding: 0 8px;
}
.ts-select :deep(.el-select__selected-item) {
  font-size: 12px;
  color: #333;
}
.ts-select :deep(.el-select__placeholder) {
  font-size: 12px;
}

/* ---------- 搜索组（线上 cl-search-input：300×28 = 80 + 178 + 41） ----------
   线上三个子控件的实测位置：select 909×80×28 / input 989×178×28 / 按钮 1167×40×26，
   这里用绝对定位 1:1 复现（比 el-input-group 更容易对齐到像素）。 */
.ts-search {
  position: relative;
  width: 300px;
  height: 28px;
  flex: none;
  margin-right: 12px;
  background: #fff;
}
.ts-search__sel {
  position: absolute;
  left: 1px;
  top: 1px;
  width: 80px;
  height: 28px;
}
.ts-search__sel :deep(.el-select__wrapper) {
  height: 28px;
  min-height: 28px;
  /* 右侧不留白，保证「任务名称」四个字完整显示（线上也是如此） */
  padding: 0 0 0 8px;
  border-radius: 0;
  box-shadow: none;
  border: 1px solid #dcdfe6;
  border-right: 0;
}
.ts-search__sel :deep(.el-select__selected-item) {
  font-size: 12px;
  color: #666;
}
.ts-search__input {
  position: absolute;
  left: 81px;
  top: 0;
  width: 178px;
  height: 28px;
}
.ts-search__input :deep(.el-input__wrapper) {
  height: 28px;
  min-height: 28px;
  padding: 0 8px;
  border-radius: 0;
  box-shadow: none;
  border: 1px solid #dcdfe6;
}
.ts-search__input :deep(.el-input__inner) {
  font-size: 12px;
  color: #606266;
}
.ts-search__btn {
  position: absolute;
  left: 259px;
  top: 1px;
  width: 40px;
  height: 26px;
  border: 1px solid #dcdfe6;
  border-left: 0;
  border-radius: 0 3px 3px 0;
  padding: 0;
  background: #fff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ts-search__btn:hover {
  color: #197afb;
}

/* ---------- 清空（线上 12px #197afb，margin-left 12px） ---------- */
.ts-clear {
  font-size: 12px;
  color: #197afb;
  cursor: pointer;
  white-space: nowrap;
  line-height: 28px;
}
.ts-clear:hover {
  text-decoration: underline;
}

/* ---------- 表格 ---------- */
.ts-table-wrap {
  margin: 16px;
}
.ts-table {
  width: 100%;
  /* 线上 el-table--border 顶部有 1px 横线、左侧有 1px 竖线，
     表头从 y+1 / x+1 开始（表格总高 617、首列起点 177） */
  border-top: 1px solid #e8eaec;
  padding-left: 1px;
}
.ts-table :deep(th.el-table__cell) {
  height: 56px;
  padding: 0;
  background: #ebedf4;
  color: #909399;
  font-size: 14px;
  font-weight: 700;
  border-bottom: 1px solid #e8eaec;
}
.ts-table :deep(td.el-table__cell) {
  height: 56px;
  padding: 0;
  font-size: 12px;
  color: #333;
  border-bottom: 1px solid #e8eaec;
  border-right: 1px solid #e8eaec;
}
.ts-table :deep(.el-table__cell .cell) {
  line-height: 18px;
  font-size: 12px;
  color: #333;
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 任务名 + ID 两行 */
.ts-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #333;
  line-height: 18px;
}
.ts-cell-id {
  font-size: 12px;
  color: #999;
  line-height: 18px;
}
/* 执行状态：7px 圆点 + 状态文字 + 成功/失败 */
.ts-status {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.ts-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
  flex: none;
}
.ts-status__text {
  font-size: 12px;
  line-height: 15px;
}
.ts-opt {
  margin-left: 22px;
  font-size: 12px;
  color: #333;
  line-height: 18px;
}
/* 操作列文字按钮（线上 .opt-link 12px #197afb，间距 8px） */
.ts-op.el-button {
  height: auto;
  padding: 0;
  margin-left: 8px;
  font-size: 12px;
  line-height: 18px;
  color: #197afb;
  border: 0;
}
.ts-op.el-button:hover {
  color: #1462c9;
}
.ts-op.el-button.is-disabled {
  color: #ccc;
}

/* 表头问号图标（线上「执行状态」列头右侧的小圆圈问号） */
.ts-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  margin-left: 4px;
  border: 1px solid #c0c4cc;
  border-radius: 50%;
  font-size: 9px;
  line-height: 1;
  font-style: normal;
  color: #c0c4cc;
  cursor: help;
  vertical-align: middle;
}

/* ---------- 分页（线上：白底 64px，内容靠左） ---------- */
.ts-pager {
  height: 64px;
  margin-top: 16px;
  background: #fff;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.ts-pager :deep(.el-pagination) {
  width: 100%;
  height: 100%;
  font-size: 13px;
  padding: 0 5px 0 24px;
  align-items: center;
}
.ts-pager :deep(.el-pagination__total) {
  margin: 0 10px 0 0;
  /* 线上「共 70 条」占位 49px，用来对齐后面的 sizes / 页码位置 */
  min-width: 49px;
  font-size: 13px;
  color: #606266;
  line-height: 32px;
}
.ts-pager :deep(.el-pagination__sizes) {
  margin: 0 10px 0 0;
}
.ts-pager :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}
.ts-pager :deep(.el-pagination__sizes .el-select__wrapper) {
  height: 33px;
  min-height: 33px;
  padding: 0 12px;
  font-size: 13px;
}
.ts-pager :deep(.el-pagination__sizes .el-select__selected-item) {
  font-size: 13px;
}
.ts-pager :deep(.btn-prev),
.ts-pager :deep(.btn-next) {
  margin: 0;
  /* 线上 Element UI 2 的按钮宽 35.5px，页码位置由此决定 */
  min-width: 35.5px;
  width: 35.5px;
  height: 32px;
  padding: 0 12px 0 6px;
  font-size: 13px;
  color: #606266;
  background: transparent;
}
.ts-pager :deep(.el-pager li) {
  margin: 0;
  min-width: 35.5px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  color: #606266;
  background: transparent;
}
.ts-pager :deep(.el-pager li.is-active) {
  color: #197afb;
  font-weight: 400;
}
.ts-pager :deep(.el-pagination__jump) {
  margin-left: 24px;
  font-size: 13px;
  color: #606266;
}
/* 线上「前往」与输入框之间只有 2px（EP 2.14 默认 8px） */
.ts-pager :deep(.el-pagination__goto) { margin-right: 2px; }
.ts-pager :deep(.el-pagination__jump .el-input) {
  width: 50px;
}
.ts-pager :deep(.el-pagination__jump .el-input__wrapper) {
  height: 28px;
  min-height: 28px;
  padding: 0 8px;
}
.ts-pager :deep(.el-pagination__jump .el-input__inner) {
  font-size: 14px;
  height: 26px;
  line-height: 26px;
}

/* ---------- 详情面板 ---------- */
.ts-detail__row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f1f3;
  font-size: 13px;
}
.ts-detail__label {
  width: 90px;
  flex: none;
  color: #909399;
}
.ts-detail__value {
  color: #333;
  word-break: break-all;
}
</style>
