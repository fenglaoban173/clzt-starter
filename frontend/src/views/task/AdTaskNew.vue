<template>
  <div class="app-page at-page">
    <!-- ================= 顶部页签 ================= -->
    <div class="app-tabs">
      <span class="app-tab active">巨量广告</span>
    </div>

    <!-- ================= 筛选区 ================= -->
    <div class="at-filter">
      <!-- 行 1 -->
      <div class="at-row">
        <el-input
          v-model="filters.keyword"
          class="at-search"
          placeholder="搜索任务"
          :suffix-icon="Search"
        />

        <div class="at-item">
          <span class="at-label">媒体账户：</span>
          <el-select
            v-model="filters.account"
            class="at-select"
            placeholder="全部"
            filterable
            remote
            :remote-method="onRemoteSearch"
            :loading="remoteLoading"
          >
            <el-option v-for="o in accountOptions" :key="o" :label="o" :value="o" />
          </el-select>
          <i class="at-clear" title="清空" @click="filters.account = ''">
            <el-icon><Close /></el-icon>
          </i>
        </div>

        <div class="at-item">
          <span class="at-label">创建人：</span>
          <el-select v-model="filters.creator" class="at-select" placeholder="全部" filterable>
            <el-option v-for="o in creatorOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">推广目的：</span>
          <el-select v-model="filters.purpose" class="at-select" placeholder="请选择推广目的">
            <el-option v-for="o in PURPOSE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">投放模式：</span>
          <el-select v-model="filters.mode" class="at-select" placeholder="请选择投放模式">
            <el-option v-for="o in MODE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">营销场景：</span>
          <el-select v-model="filters.scene" class="at-select" placeholder="请选择营销场景">
            <el-option v-for="o in SCENE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">广告类型：</span>
          <el-select v-model="filters.adType" class="at-select" placeholder="请选择广告类型">
            <el-option v-for="o in AD_TYPE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
      </div>

      <!-- 行 2 -->
      <div class="at-row">
        <div class="at-item">
          <span class="at-label">投放类型：</span>
          <el-select v-model="filters.deliveryType" class="at-select" placeholder="请选择投放类型">
            <el-option v-for="o in DELIVERY_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">提交状态：</span>
          <el-select v-model="filters.submitStatus" class="at-select" placeholder="请选择提交状态">
            <el-option v-for="o in SUBMIT_STATUS_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label">提交规则：</span>
          <!-- R109：提示文案逐字对齐线上（线上是 3 行独立 <p>，宽度自适应，实测 404px） -->
          <el-popover placement="top" trigger="hover" popper-class="at-submit-rule-tip">
            <template #reference>
              <i class="at-question" title="提交规则说明"><el-icon><QuestionFilled /></el-icon></i>
            </template>
            <div>
              <p>立即提交：实时返回广告新建结果</p>
              <p>定时提交：在您设置的时间点开始提交广告新建任务</p>
              <p>分批提交：根据您设置的时间段和广告数目分批次提交广告。</p>
            </div>
          </el-popover>
          <el-select v-model="filters.submitRule" class="at-select" placeholder="请选择提交规则">
            <el-option v-for="o in SUBMIT_RULE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <div class="at-item">
          <span class="at-label at-label--date">创建时间：</span>
          <div class="at-date">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :clearable="false"
            />
          </div>
        </div>

        <span class="at-link at-clearall" @click="clearAll">清空</span>
        <span class="at-link at-reset" @click="refreshList">刷新列表</span>
      </div>
    </div>

    <!-- ================= 告警条 + 操作区 + 表格 ================= -->
    <div class="at-content">
      <div v-if="alertVisible" class="app-alert at-alert">
        <el-icon><Warning /></el-icon>
        <span class="at-alert__text">仅支持近15天任务记录，通过账户筛选仅支持查询近7天任务；超过7天的任务执行状态可能存在异常</span>
        <i class="app-alert__close" title="关闭" @click="alertVisible = false">
          <el-icon><Close /></el-icon>
        </i>
      </div>

      <!-- R110：线上此处的「+ 新建广告」按钮已按用户要求整块移除。
           线上点击它走的是**外部建广告流程**（POST /Batch/Ad/getCreateAdsSmartAssistantTaskList
           + window.open 新标签页），离线复刻不了，所以按钮与其对应的虚构表单弹窗一并删除。
           这里保留一个等高（58px）的空白条，使表格起始 y 值仍与线上一致（线上表格 y=330）。 -->
      <div class="at-toolbar at-toolbar--empty" aria-hidden="true"></div>

      <el-table
        :key="tableKey"
        class="app-table at-table"
        :data="pageRows"
        row-key="id"
        border
      >
        <el-table-column label="任务名称" width="300" fixed="left">
          <template #default="{ row }">
            <div class="at-name-cell">
              <a class="at-task-name" @click="openDetail(row)">{{ row.name }}</a>
              <i class="at-edit-icon" title="编辑" @click="renameTask(row)">
                <el-icon><EditPen /></el-icon>
              </i>
            </div>
            <div class="at-task-id">ID：{{ row.id }}</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="152" fixed="left" class-name="at-ops-col">
          <template #default="{ row }">
            <el-button link class="at-op-btn" @click="openDetail(row)">详情</el-button>
            <el-button link class="at-op-btn" @click="copyRow(row)">复制</el-button>
            <!-- 删除：线上 task_status==='processing'（提交中）时按钮置灰，
                 并 hover 提示「执行中的任务不可删除」；其余状态可点 -->
            <el-button
              v-if="!isProcessing(row)"
              link
              class="at-op-btn"
              @click="deleteRow(row)"
            >删除</el-button>
            <el-popover v-else content="执行中的任务不可删除" placement="top" trigger="hover">
              <template #reference>
                <span class="at-op-wrap">
                  <el-button link class="at-op-btn" disabled>删除</el-button>
                </span>
              </template>
            </el-popover>
            <!-- 终止：线上仅在任务「未结束」（非 finish / 非 termination）时出现 -->
            <el-button v-if="canTerminate(row)" link class="at-op-btn" @click="terminateRow(row)">终止</el-button>
            <!-- 重提：线上 canReSubmit = task_status==='finish'（提交完成）且失败数 > 0 -->
            <el-button
              v-if="row.status === '提交完成' && row.fail > 0"
              link
              class="at-op-btn at-op-btn--resubmit"
              @click="resubmitRow(row)"
            >重提</el-button>
          </template>
        </el-table-column>

        <!-- 以下列用 min-width（而非固定 width）：
             线上表格是自适应铺满容器的，列宽随窗口拉伸而等比放大，
             固定 width 会导致右侧留出大片空白。所有列 min-width 之和 > 容器宽度时，
             Element Plus 会按比例分配剩余空间，表格始终铺满。 -->
        <el-table-column label="推广目的" prop="purpose" min-width="100" show-overflow-tooltip />
        <el-table-column label="投放模式" prop="mode" min-width="100" show-overflow-tooltip />
        <el-table-column label="营销场景" prop="scene" min-width="100" show-overflow-tooltip />
        <el-table-column label="广告类型" prop="adType" min-width="100" show-overflow-tooltip />
        <el-table-column label="投放类型" prop="deliveryType" min-width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告出价(元)" prop="bid" min-width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告深度出价(元)" prop="deepBid" min-width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告ROI" prop="roi" min-width="100" show-overflow-tooltip />

        <el-table-column label="媒体账户" prop="accounts" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="at-ellipsis"><span>{{ row.accounts }}</span></div>
          </template>
        </el-table-column>

        <el-table-column label="提交规则" prop="submitRule" min-width="100" show-overflow-tooltip />
        <el-table-column label="创建人" prop="creator" min-width="120" />
        <el-table-column label="创建时间" prop="createdAt" min-width="140" />

        <el-table-column label="执行状态" min-width="120">
          <template #header>
            <span>执行状态</span>
            <span class="at-header-tip">
              <el-popover placement="top-start" :width="370" trigger="hover" popper-class="at-status-tip">
                <template #reference>
                  <i class="at-header-tip__icon"><el-icon><QuestionFilled /></el-icon></i>
                </template>
                <p>当状态为绿色提交完成时，则包含的所有提交均为成功</p>
                <p>当状态为红色提交完成时，则包含的提交中有失败项</p>
              </el-popover>
            </span>
          </template>
          <template #default="{ row }">
            <div class="at-status">
              <i class="at-status__dot" :style="{ background: statusDotColor(row) }"></i>
              <span>{{ row.status }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="任务详情" min-width="130">
          <template #default="{ row }">
            <span class="at-detail__ok">成功：{{ row.success }}</span>
            <span>失败：{{ row.fail }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="at-pager"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :current-page="page"
        :total="filteredRows.length"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <!-- ================= 详情抽屉 ================= -->
    <TaskDetailDrawer v-model="detailVisible" :row="currentRow" />

  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, EditPen, QuestionFilled, Search, Warning } from '@element-plus/icons-vue';
import TaskDetailDrawer from './TaskDetailDrawer.vue';
import { listBatchTasks } from '@/mock/batchStore';

/* ------------------------------------------------------------------ *
 * 线上枚举（C:/tmp/nw/taskOptions.js 原样抄录）
 * ------------------------------------------------------------------ */
const ACCOUNT_OPTIONS = [
  '北京高途云集教育科技有限公司--1(1861811345880074)',
  '百度文库-央广时代-拉新-搜索-01(1866877399870663)',
  '百度文库-央广时代-拉新-搜索-02(1866877399203047)',
  '百度文库-央广时代-拉新-搜索-03(1866849651765706)',
  '任意门-央广-代运营-36-安卓-UBA(1866489873996443)',
  '任意门-央广-代运营-22-安卓-UBA(1866489858950211)',
  '任意门-央广-代运营-23-安卓-UBA(1866489859578696)',
  '任意门-央广-代运营-10-ios-UBA(1866489860302024)',
  '任意门-央广-代运营-25-ios-UBA(1866489860976135)',
  '任意门-央广-代运营-30-ios-UBA(1866489864776836)',
  '上海得物信息集团有限公司1-50(1834419631681163)',
  '任意门-央广-代运营-27-安卓-UBA(1866489862625304)',
  '任意门-央广-代运营-31-安卓-UBA(1866489865523527)',
  '任意门-央广-代运营-38-安卓-UBA(1866489874950667)',
  '任意门-央广-代运营-33-安卓-UBA(1866489872328266)',
  '任意门-央广-代运营-32-ios-UBA(1866489871677514)',
  '百度文库-央广时代-拉新-搜索-04(1866877401293188)',
  '任意门-央广-代运营-28-安卓-UBA(1866489863429463)',
  '任意门-央广-代运营-35-iOS-UBA(1866489873385099)',
  '央广-621059846-百度文库-1(1866877405575303)',
];
const CREATOR_OPTIONS = [
  '李倩 (liqian@ygsdmedia.com)',
  '武文琦 (2081751089@qq.com)',
  '刘松涵 (liusonghan01@ygsdmedia.com)',
  '吕瑶 (2640357848@qq.com)',
  '申旭阳 (shenxuyang@ygsdmedia.com)',
  '裴心怡 (1551783195@qq.com)',
  '刘望 (1617607170@qq.com)',
  '李玉玲 (2786729941@qq.com)',
  '冯逸 (2159614713@qq.com)',
  '杜浩 (485886196@qq.com)',
  '刘欢 (liuhuan@ygsdmedia.com)',
  '田博文 (3466970653@qq.com)',
  '汪玲丽 (1501487904@qq.com)',
  '邓艺爽 (956432559@qq.com)',
  '张瑞凯 (1015277743@qq.com)',
  '王研 (1870700043@qq.com)',
  '张浩 (1771257391@qq.com)',
  '黄莹曦 (2872682757@qq.com)',
  '翟子涵 (zhaizihan@ygsdmedia.com)',
  '倪秀云 (2827947255@qq.com)',
  '张从浩 (zhangconghao@ygsdmedia.com)',
  '王春雷 (wangchunlei@ygsdmedia.com)',
  '郭峻宇 (guojunyu@ygsdmedia.com)',
  '孙诗源 (sunshiyuan@ygsdmedia.com)',
  'gongwenqing (gongwenqing@ygsdmedia.com)',
  'lixue (lixue@ygsdmedia.com)',
  'jiangxin (jiangxin@ygsdmedia.com)',
  '1944364300 (1944364300@qq.com)',
  'lk18067488517 (lk18067488517@163.com)',
  '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)',
  '李坤洪 17790290399 likunhong (likunhong@ygsdmedia.com)',
  'chenpeihua (chenpeihua@ygsdmedia.com)',
  '1304275504 (1304275504@qq.com)',
  '文清滨 (wenqingbin@ygsdmedia.com)',
  '李若涵 (liruohan@ygsdmedia.com)',
  '杨浩蒙 (yanghaomeng@ygsdmedia.com)',
  '李崇霄 (lcx144831@163.com)',
  '邹镇泽 (1041603217@qq.com)',
];
const PURPOSE_OPTIONS = ['应用推广', '销售线索', '小程序', '电商', '快应用', '商品', '内容营销'];
const MODE_OPTIONS = ['手动投放', '自动投放(UBMax)'];
const SCENE_OPTIONS = ['短视频/图片', '直播'];
const AD_TYPE_OPTIONS = ['通投广告', '搜索广告'];
const DELIVERY_OPTIONS = ['常规投放', '周期稳投', '智能托管'];
const SUBMIT_STATUS_OPTIONS = ['不限', '等待提交', '等待提交', '提交中', '提交完成', '已终止', '素材上传中'];
const SUBMIT_RULE_OPTIONS = ['不限', '立即提交', '定时提交', '分批提交', '匀速提交'];

/* ------------------------------------------------------------------ *
 * 线上真实数据（前 20 行逐字抄自 C:/tmp/nw/T1_巨量新建任务新版.json）
 * ------------------------------------------------------------------ */
const ACCOUNTS_124 = '央广-雷盟-知乎-APP内付费-124-792335571-在投、央广-雷盟-知乎-APP内付费-118-792335571-在投、央广-雷盟-知乎-APP内付费-116-792335571-在投、央广-雷盟-知乎-APP内付费-120-792335571-在投';
const ACCOUNTS_148 = '央广-雷盟-知乎-APP内付费-148-792335571-在投、央广-雷盟-知乎-APP内付费-143-792335571-在投、央广-雷盟-知乎-APP内付费-149-792335571-在投';

const SEED = [
  ['困境相扶-央广-雷盟-APP内付费-安卓-撬走男同事的老婆后-知乎拉活-1124-非原生-X', '2167900472', ACCOUNTS_124, '刘松涵', '2026-11-24 17:36:41', 4],
  ['恩怨牵缠-央广-雷盟-APP内付费-安卓-菀菀类卿-知乎拉活-1124-非原生-X', '2167900035', ACCOUNTS_124, '刘松涵', '2026-11-24 17:34:37', 4],
  ['春寒藏绪-央广-雷盟-APP内付费-安卓-二月深深-知乎拉活-1124-非原生-X', '2167899716', ACCOUNTS_124, '刘松涵', '2026-11-24 17:33:04', 4],
  ['温婉灵秀-央广-雷盟-APP内付费-安卓-知颜如玉-知乎拉活-1124-非原生-X', '2167899095', ACCOUNTS_124, '刘松涵', '2026-11-24 17:30:20', 4],
  ['时差相思-央广-雷盟-APP内付费-安卓-他来自十年后-知乎拉活-1124-非原生-X', '2167897834', ACCOUNTS_124, '刘松涵', '2026-11-24 17:25:24', 4],
  ['权柄焚情-央广-雷盟-APP内付费-安卓-他是暴君-知乎拉活-1124-非原生-16', '2167897774', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:25:10', 3],
  ['首领情深-央广-雷盟-APP内付费-安卓-我渣了基地首领-知乎拉活-1124-非原生-X', '2167897117', ACCOUNTS_124, '刘松涵', '2026-11-24 17:22:41', 4],
  ['枕边异祟-央广-雷盟-APP内付费-安卓-枕边有鬼-知乎拉活-1124-非原生-16', '2167896912', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:22:06', 3],
  ['众缘环绕-央广-雷盟-APP内付费-安卓-穿越后我雨露均沾-知乎拉活-1124-非原生-16', '2167896567', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:20:56', 3],
  ['旧痕刺眼-央广-雷盟-APP内付费-安卓-我看见他的意难平-知乎拉活-1124-非原生-X', '2167896484', ACCOUNTS_124, '刘松涵', '2026-11-24 17:20:41', 4],
  ['克制别离-央广-雷盟-APP内付费-安卓-当我不再强制爱-知乎拉活-1124-非原生-16', '2167896237', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:19:46', 3],
  ['闺门恩怨-央广-雷盟-APP内付费-安卓-嫡姐替我求情那日-知乎拉活-1124-非原生-16', '2167895899', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:18:30', 3],
  ['争胜执念-央广-雷盟-APP内付费-安卓-不甘人后-知乎拉活-1124-非原生-16', '2167895543', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:16:55', 3],
  ['旧痕刺眼-央广-雷盟-APP内付费-安卓-领证前，我看见他的意难平-知乎拉活-1124-非原生-16', '2167895280', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:15:32', 3],
  ['首领情深-央广-雷盟-APP内付费-安卓-我渣了基地首领，生下丧尸宝宝-知乎拉活-1124-非原生-16', '2167893533', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:09:40', 3],
  ['时差相思-央广-雷盟-APP内付费-安卓-他来自十年后-知乎拉活-1124-非原生-16', '2167893221', ACCOUNTS_148, '杨浩蒙', '2026-11-24 17:08:12', 3],
  ['争胜执念-央广-雷盟-APP内付费-安卓-不甘人后-知乎拉活-1124-非原生-X', '2167889827', ACCOUNTS_124, '刘松涵', '2026-11-24 16:58:58', 4],
  ['闺门恩怨-央广-雷盟-APP内付费-安卓-嫡姐替我求情那日-知乎拉活-1124-非原生-X', '2167889596', ACCOUNTS_124, '刘松涵', '2026-11-24 16:57:52', 4],
  ['克制别离-央广-雷盟-APP内付费-安卓-当我不再强制爱-知乎拉活-1124-非原生-X', '2167888409', ACCOUNTS_124, '刘松涵', '2026-11-24 16:53:12', 4],
  ['众缘环绕-央广-雷盟-APP内付费-安卓-穿越后我雨露均沾-知乎拉活-1124-非原生-X', '2167886233', ACCOUNTS_124, '刘松涵', '2026-11-24 16:44:17', 4],
];

const TOTAL = 416; // 与线上一致：共 416 条

/** 线上失败任务样例（操作列带「重提」）
 *  线上执行状态列没有「失败」这一态：含失败项的任务仍显示「提交完成」，
 *  只是圆点与文字变成橙红（.task-status.hasfail #ec5f2e），
 *  且 canReSubmit 成立（task_status==='finish' && fail_promotion_count>0）。 */
const FAILED_ROW = {
  id: '2167888567',
  name: '失败重提_内部互推-and-短剧-纯内容-江先生，别太野-直下-启用-ubm-<项目创建日期>1',
  purpose: '应用推广',
  mode: '自动投放',
  scene: '短视频/图片',
  adType: '通投广告',
  deliveryType: '常规投放',
  bid: '39',
  deepBid: '--',
  roi: '--',
  accounts: '红果-央广-50、红果-央广-49',
  submitRule: '立即提交',
  creator: '杨浩蒙',
  createdAt: '2026-11-24 10:02:35',
  status: '提交完成',
  success: 0,
  fail: 6,
};

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * R111：本地「批量搭建」页点「全部提交审核」后提交的任务（落在 localStorage），
 * 要能在本页「巨量广告」任务列表里看到 —— 与线上语义一致
 * （提交审核 → 出现在巨量广告任务列表里看执行状态）。
 *
 * 一次批量提交 = 一个任务（含 N 条广告）→ 按 batchId 聚合成一行，
 * 任务详情显示「成功 N / 失败 0」，与线上样例行口径一致。
 * 记录结构见 mock/batchStore.js：status 用的是本页词汇之外的「执行完成」，这里映射成「提交完成」。
 */
function buildLocalRows() {
  const groups = new Map();
  listBatchTasks().forEach((r) => {
    const key = r.batchId || `${r.name}|${r.createdAt}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });
  return Array.from(groups.values()).map((rs) => {
    const r = rs[0];
    return {
      id: String(r.id),
      name: r.name,
      purpose: '应用推广',
      mode: '手动投放',
      scene: '短视频/图片',
      adType: '通投广告',
      deliveryType: '常规投放',
      bid: '--',
      deepBid: '--',
      roi: '--',
      accounts: (r.accounts && r.accounts.length) ? r.accounts.join('、') : (r.account || '-'),
      submitRule: '立即提交',
      creator: r.creator,
      createdAt: r.createdAt,
      status: '提交完成',
      success: rs.reduce((n, x) => n + (Number(x.success) || 0), 0),
      fail: rs.reduce((n, x) => n + (Number(x.fail) || 0), 0),
      local: true,
    };
  });
}

function buildRows() {
  /* 本地刚提交的任务置顶（最新在前），其余保持线上样例顺序 */
  const localRows = buildLocalRows();
  const rows = localRows.concat(SEED.map((s) => ({
    id: s[1],
    name: s[0],
    purpose: '应用推广',
    mode: '手动投放',
    scene: '短视频/图片',
    adType: '通投广告',
    deliveryType: '常规投放',
    bid: '52',
    deepBid: '--',
    roi: '--',
    accounts: s[2],
    submitRule: '立即提交',
    creator: s[3],
    createdAt: s[4],
    status: '提交完成',
    success: s[5],
    fail: 0,
  })));
  // 失败任务（线上真实样例），紧跟在前 8 条真实数据之后
  rows.splice(8 + localRows.length, 0, { ...FAILED_ROW });

  // 补齐到 416 条（保持线上首屏 20 行逐字一致）
  const creators = ['刘松涵', '杨浩蒙', '李倩', '王春雷', '汪玲丽', '张瑞凯', '孙诗源', '李玉玲'];
  const suffixes = ['非原生', '原生', '进阶', '矩阵', '智能', '全域', '优选', '引力'];
  let ts = new Date('2026-11-24T16:40:00');
  let id = 2167885000;
  for (let i = rows.length; i < TOTAL; i++) {
    const g = i - SEED.length;
    ts = new Date(ts.getTime() - 3 * 60 * 1000);
    const d = ts.getDate();
    let status = '提交完成';
    if (g % 9 === 1) status = '提交中';
    else if (g % 9 === 3) status = '已终止';
    else if (g % 9 === 5) status = '等待提交';
    else if (g % 9 === 7) status = '素材上传中';
    const use148 = g % 3 === 1;
    // 各维度做少量变化，便于筛选条件真正生效（线上首屏数据保持不变）
    const purpose = g % 10 >= 7 ? PURPOSE_OPTIONS[1 + (g % 6)] : '应用推广';
    const mode = g % 10 === 8 ? MODE_OPTIONS[1] : '手动投放';
    const scene = g % 10 === 9 ? SCENE_OPTIONS[1] : '短视频/图片';
    const adType = g % 12 === 5 ? AD_TYPE_OPTIONS[1] : '通投广告';
    const delivery = g % 12 === 7 ? DELIVERY_OPTIONS[1 + (g % 2)] : '常规投放';
    const base = SEED[g % SEED.length][0].replace(/-非原生(-[XY])?$/, '');
    rows.push({
      id: String(id - g * 7),
      name: `${base}-${suffixes[g % suffixes.length]}-${g + 1}`,
      purpose,
      mode,
      scene,
      adType,
      deliveryType: delivery,
      bid: '52',
      deepBid: '--',
      roi: '--',
      accounts: use148 ? ACCOUNTS_148 : ACCOUNTS_124,
      submitRule: '立即提交',
      creator: creators[g % creators.length],
      createdAt: `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(d)} ${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`,
      status,
      success: use148 ? 3 : 4,
      fail: 0,
    });
  }
  return rows;
}

const rows = ref(buildRows());

/* ------------------------------------------------------------------ *
 * 筛选
 * ------------------------------------------------------------------ */
const DEFAULT_RANGE = ['2026-11-18', '2026-11-25'];

const filters = reactive({
  keyword: '',
  account: '',
  creator: '',
  purpose: '',
  mode: '',
  scene: '',
  adType: '',
  deliveryType: '',
  submitStatus: '不限',
  submitRule: '',
  dateRange: [...DEFAULT_RANGE],
});

const accountOptions = ref([]);
const remoteLoading = ref(false);
const creatorOptions = CREATOR_OPTIONS;

/* 媒体账户下拉：线上是**远程搜索**（class filter-select-remote）——
   展开时接口默认返回 20 个账户；输入关键字后才返回匹配项。
   R109：默认列表严格用线上那 20 个（与线上一致），
   表格数据里出现的那些账户只在「输入关键字搜索」时才出现，这样筛选依然能生效。 */
const ROW_ACCOUNT_NAMES = (() => {
  const out = [];
  rows.value.forEach((r) => {
    String(r.accounts || '')
      .split('、')
      .forEach((a) => {
        const s = a.trim();
        if (s && !out.includes(s)) out.push(s);
      });
  });
  return out;
})();
const ALL_ACCOUNT_OPTIONS = [...ACCOUNT_OPTIONS, ...ROW_ACCOUNT_NAMES];
accountOptions.value = ACCOUNT_OPTIONS.slice();

function onRemoteSearch(q) {
  remoteLoading.value = true;
  setTimeout(() => {
    accountOptions.value = q
      ? ALL_ACCOUNT_OPTIONS.filter((o) => o.includes(q))
      : ACCOUNT_OPTIONS.slice();
    remoteLoading.value = false;
  }, 120);
}

const filteredRows = computed(() => {
  const kw = filters.keyword.trim();
  const [start, end] = filters.dateRange || [];
  return rows.value.filter((r) => {
    if (kw && !(r.name.includes(kw) || r.id.includes(kw))) return false;
    if (filters.account && !r.accounts.includes(filters.account)) return false;
    // 创建人下拉的选项带邮箱（"杨浩蒙 (yanghaomeng@ygsdmedia.com)"），按姓名部分匹配
    if (filters.creator && !r.creator.includes(filters.creator.split(' (')[0])) return false;
    if (filters.purpose && r.purpose !== filters.purpose) return false;
    if (filters.mode && r.mode !== filters.mode) return false;
    if (filters.scene && r.scene !== filters.scene) return false;
    if (filters.adType && r.adType !== filters.adType) return false;
    if (filters.deliveryType && r.deliveryType !== filters.deliveryType) return false;
    if (filters.submitStatus && filters.submitStatus !== '不限' && r.status !== filters.submitStatus) return false;
    if (filters.submitRule && filters.submitRule !== '不限' && r.submitRule !== filters.submitRule) return false;
    /* 本地刚提交的任务（local）不参与创建时间区间过滤：
       默认区间是线上样例的固定区间（2026-11-18 ~ 2026-11-25），
       今天提交的任务会被它挡掉，导致「提交后跳转过来却看不到自己刚提交的那条」。 */
    if (!r.local) {
      if (start && r.createdAt.slice(0, 10) < start) return false;
      if (end && r.createdAt.slice(0, 10) > end) return false;
    }
    return true;
  });
});

const page = ref(1);
const pageSize = ref(50);
const tableKey = ref(0);

const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

watch(filteredRows, () => {
  if (page.value > 1) page.value = 1;
});

function onPageChange(p) {
  page.value = p;
}
function onSizeChange(s) {
  pageSize.value = s;
  page.value = 1;
}

/* ------------------------------------------------------------------ *
 * 告警条 / 清空 / 刷新
 * ------------------------------------------------------------------ */
const alertVisible = ref(true);

function clearAll() {
  filters.keyword = '';
  filters.account = '';
  filters.creator = '';
  filters.purpose = '';
  filters.mode = '';
  filters.scene = '';
  filters.adType = '';
  filters.deliveryType = '';
  filters.submitStatus = '不限';
  filters.submitRule = '';
  filters.dateRange = [...DEFAULT_RANGE];
  page.value = 1;
  ElMessage.success('已清空筛选条件');
}

function refreshList() {
  tableKey.value += 1;
  page.value = 1;
  ElMessage.success('列表已刷新');
}

/* ------------------------------------------------------------------ *
 * 状态色
 *
 * 线上（cl.mobgi.com/task/adtask）用 ClStatus 组件渲染「文字 + 6px 圆点」，
 * 圆点颜色由组件按 type 决定（cl-status chunk）：
 *   init #9d9d9d / success #23c23f / warning #fb1919
 *   primary #197afb / danger #fbca19 / info #c6c6c6
 * 组件里的 task_status → type 映射（ad-task chunk getList）：
 *   init→init  queueing→(未定义→primary)  processing→danger
 *   finish→success  finish 且有失败项→warning  termination→info
 *   material_processing→(未定义→primary)
 * 文字颜色线上是继承的 #333，只有圆点带色。
 * ------------------------------------------------------------------ */
const STATUS_COLOR = {
  等待提交: '#9d9d9d',   // init
  提交中: '#fbca19',     // processing → danger
  提交完成: '#23c23f',   // finish → success
  已终止: '#c6c6c6',     // termination → info
  素材上传中: '#197afb', // material_processing → primary
};

function statusColor(status) {
  return STATUS_COLOR[status] || '#197afb';
}

/** 线上规则：提交完成但含失败项时圆点变红（warning #fb1919） */
function statusDotColor(row) {
  if (row.status === '提交完成' && row.fail > 0) return '#fb1919';
  return statusColor(row.status);
}

/* ------------------------------------------------------------------ *
 * 行操作：详情 / 复制 / 删除 / 编辑
 * ------------------------------------------------------------------ */
const detailVisible = ref(false);
const currentRow = ref({});

function openDetail(row) {
  currentRow.value = row;
  detailVisible.value = true;
}

/**
 * 线上（ad-task chunk）规则：
 *   删除按钮 disabled ⟺ task_status === 'processing'（提交中），此时 hover 提示
 *     「执行中的任务不可删除」
 *   终止按钮      ⟺ task_status ∉ ['finish','termination']（任务尚未结束）
 *   重提按钮      ⟺ task_status === 'finish' && fail_promotion_count > 0
 */
function isProcessing(row) {
  return row.status === '提交中';
}

function canTerminate(row) {
  return !['提交完成', '已终止'].includes(row.status);
}

/**
 * R110：任务名后的铅笔 → 线上 el-message-box「修改任务名称」
 * 线上原始实现（ad-task chunk modifyTaskName）：
 *   this.$prompt('任务名称', '修改任务名称', {
 *     closeOnClickModal: false, confirmButtonText: '确定', cancelButtonText: '取消',
 *     inputValidator: v => v ? true : '请输入任务名称',
 *   })
 * 这里按用户要求用 inputValue 预填该行原任务名称，确定后真实改写表格里的名称。
 */
async function renameTask(row) {
  try {
    const { value } = await ElMessageBox.prompt('任务名称', '修改任务名称', {
      inputValue: row.name,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      inputValidator: (v) => (v && v.trim() ? true : '请输入任务名称'),
    });
    row.name = value.trim();
    ElMessage.success('更新成功');
  } catch {
    /* 取消 */
  }
}

/** 重提：二次确认后把执行状态改为「提交中」 */
async function resubmitRow(row) {
  try {
    await ElMessageBox.confirm('确认重提该任务？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    return;
  }
  row.status = '提交中';
  row.fail = 0;
  ElMessage.success('重提成功');
}

/**
 * 删除：线上是一个自绘 el-dialog（标题「删除任务」/ 文案
 * 「删除任务将终止执行进程，您确定要继续吗？」），按用户要求改为
 * Element Plus **系统默认** ElMessageBox.confirm（warning 型）。
 */
async function deleteRow(row) {
  try {
    await ElMessageBox.confirm('删除任务将终止执行进程，您确定要继续吗？', '删除任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  const idx = rows.value.findIndex((r) => r.id === row.id);
  if (idx > -1) rows.value.splice(idx, 1);
  ElMessage.success('删除成功!');
}

/**
 * 终止：线上原文
 *   this.$confirm('任务已创建的项目和素材结果不可逆，且任务无法再次开启，是否继续？',
 *                 '终止任务', {type:'warning', ...})
 */
async function terminateRow(row) {
  try {
    await ElMessageBox.confirm(
      '任务已创建的项目和素材结果不可逆，且任务无法再次开启，是否继续？',
      '终止任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
  } catch {
    return;
  }
  row.status = '已终止';
  ElMessage.success('任务终止成功!');
}

async function copyRow(row) {
  try {
    await ElMessageBox.confirm('确认复制该任务？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    return;
  }
  const maxId = rows.value.reduce((m, r) => Math.max(m, Number(r.id)), 2167900472);
  const copy = {
    ...row,
    id: String(maxId + 1),
    createdAt: nowText(),
    status: '等待提交',
    success: 0,
    fail: 0,
  };
  rows.value.unshift(copy);
  page.value = 1;
  ElMessage.success('复制成功');
}

function nowText() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

</script>

<style scoped>
/* 页面底色：线上 cl.mobgi.com 该页整块为白色 */
body.app-scope .app-page.at-page {
  background: #fff;
}
/* 顶部页签：线上 el-menu--horizontal 高 60px（本地 AppLayout 顶栏多 1px 边框，故取 60 对齐） */
body.app-scope .app-page.at-page .app-tabs {
  height: 60px;
}
body.app-scope .app-page.at-page .app-tab {
  height: 60px;
  line-height: 60px;
}

/* ---------------- 筛选区（线上实测几何） ---------------- */
.at-filter {
  background: #fff;
  padding: 12px 16px;
  flex: none;
}
.at-row {
  display: flex;
  align-items: flex-start;
}
.at-row + .at-row {
  margin-top: 16px;
}
.at-item {
  display: flex;
  align-items: center;
  margin-right: 8px;
  padding-right: 6px;
  flex: none;
}
.at-label {
  font-size: 12px;
  color: #333;
  padding-left: 9px;
  white-space: nowrap;
}
.at-label--date {
  padding-right: 14px;
}
/* 媒体账户项：右侧多一个外置的清除 × （线上 .icon-close，宽 25px） */
.at-item:has(.at-clear) {
  padding-right: 0;
}
.at-clear {
  margin-left: 8px;
  margin-right: 5px;
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 12px;
  cursor: pointer;
}
.at-clear:hover {
  color: #909399;
}
.at-select {
  width: 169px;
  flex: none;
}
.at-select :deep(.el-select__wrapper) {
  min-height: 28px;
  height: 28px;
  font-size: 13px;
}
.at-select :deep(.el-select__placeholder),
.at-select :deep(.el-select__selected-item) {
  font-size: 13px;
}
/* 线上 placeholder 实测 #999 */
.at-select :deep(.el-select__placeholder) {
  color: #999;
}
.at-search {
  width: 188px;
  flex: none;
  margin-right: 8px;
}
/* 线上实测 188×29（EP 的 wrapper 为 content-box，padding 1px → 内容高 27） */
.at-search :deep(.el-input__wrapper) {
  min-height: 27px;
  height: 27px;
  font-size: 13px;
}
/* 线上放大镜图标：深色 + 左侧 1px 分隔线 */
.at-search :deep(.el-input__suffix-inner) {
  border-left: 1px solid #d0d0d0;
  padding-left: 6px;
  height: 16px;
  display: flex;
  align-items: center;
}
.at-search :deep(.el-input__icon) {
  color: #333;
  font-size: 14px;
}
.at-date {
  width: 345px;
  flex: 0 0 345px;
}
.at-date :deep(.el-date-editor) {
  width: 100% !important;
  height: 28px;
  min-height: 28px;
  box-sizing: border-box;
  font-size: 12px;
  padding: 0 8px;
}
.at-question {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #c0c4cc;
  margin: 0 8px 0 4px;
  cursor: pointer;
}
.at-question:hover {
  color: #909399;
}
.at-link {
  font-size: 12px;
  color: #197afb;
  cursor: pointer;
  white-space: nowrap;
  margin-top: 0;
  line-height: 28px;
  flex: none;
}
.at-link:hover {
  text-decoration: underline;
}
.at-clearall {
  margin-left: 12px;
}
.at-reset {
  margin-left: 12px;
}

/* ---------------- 内容区 ---------------- */
.at-content {
  padding: 16px;
  flex: 1;
  min-height: 0;
}
/* 告警条：线上（scope data-v-07fc4db6）实测
   padding 6px 16px / border 1px solid rgb(255,221,193) / bg #fff6ee /
   color #ffb374 / radius 2px / 文案 16px / 总高 34px */
body.app-scope .app-page.at-page .at-alert {
  color: #ffb374;
  font-size: 16px;
  height: 34px;
  box-sizing: border-box;
  padding: 0 16px;
  border: 1px solid #ffddc1;
  background: #fff6ee;
}
.at-alert {
  margin-bottom: 0;
}
.at-alert__text {
  flex: 1;
}
/* R110：「+ 新建广告」按钮已移除，仅保留等高空白条，使表格起始 y 与线上一致 */
.at-toolbar {
  padding: 18px 0 8px 17px;
}
.at-toolbar--empty {
  height: 58px;
  padding: 0;
}

/* ---------------- 表格 ---------------- */
.at-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-text-color: #909399;
  width: 100%;
}
/* 线上表头底色实测 #fafafa（Element UI 2 默认），th 字色 #909399，
   表头文字在 .cell 层是 #333 */
body.app-scope .app-page.at-page .at-table :deep(th.el-table__cell) {
  background: #fafafa;
  color: #909399;
}
/* 线上表体文字：12px / #333 / line-height 18px */
body.app-scope .app-page.at-page .at-table :deep(td.el-table__cell) {
  color: #333;
}
body.app-scope .app-page.at-page .at-table :deep(th.el-table__cell .cell) {
  color: #333;
}
/* 线上表头高 56px（12px/18px 的表头文字） */
body.app-scope .app-page.at-page .at-table :deep(th.el-table__cell) {
  padding: 18.5px 0;
  font-size: 14px;
}
.at-table :deep(th.el-table__cell .cell) {
  font-size: 12px;
  line-height: 18px;
  /* 线上表头单行显示、超出省略（如「项目/广告...」） */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.at-table :deep(.el-table__cell) {
  padding: 8px 0;
}
/* 线上表体单元格：12px / #333 / line-height 18px */
.at-table :deep(.el-table__cell .cell) {
  font-size: 12px;
  line-height: 18px;
  color: #333;
}
/* 线上 .task-name-cell 字号 14px（其余单元格 12px） */
.at-name-cell {
  display: flex;
  align-items: center;
  overflow: hidden;
  height: 21px;
  line-height: 21px;
  font-size: 14px;
}
.at-task-name {
  color: #197afb;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  flex: 1;
  min-width: 0;
  line-height: 21px;
}
.at-task-name:hover {
  text-decoration: underline;
}
.at-edit-icon {
  flex: none;
  margin-left: 8px;
  color: #197afb;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
}
.at-edit-icon:hover {
  color: #1462c9;
}
.at-task-id {
  color: #999;
  font-size: 12px;
  line-height: 18px;
}
.at-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.at-ellipsis span {
  display: inline;
}
/* 线上 el-button--text 实测：高 38px、padding 12px 0、字号 12px */
.at-table :deep(.at-op-btn) {
  padding: 12px 0;
  height: auto;
  font-size: 12px;
  color: #197afb;
}
.at-table :deep(.at-op-btn + .at-op-btn) {
  margin-left: 8px;
}
/* 线上操作列 4 个按钮（详情/复制/删除/重提）等距 8px 共 128px，
   EP 2.14 单元格左右 padding 各 12px 会正好把按钮挤到第二行，这里留出余量 */
.at-table :deep(.at-ops-col .cell) {
  padding-right: 4px;
}
.at-op-wrap {
  display: inline-block;
  margin-left: 8px;
}
.at-table :deep(.at-op-wrap .at-op-btn) {
  margin-left: 0 !important;
}
.at-header-tip {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
/* 线上 .mg-icon-question2 实测 12×13，字色继承表头 #333 */
.at-header-tip__icon {
  width: 12px;
  height: 13px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  display: inline-flex;
}
.at-header-tip__icon:hover {
  color: #909399;
}
/* 「重提」与「删除」之间同样留 8px（线上四个按钮等距） */
.at-table :deep(.at-op-btn--resubmit) {
  margin-left: 8px;
}
/* 线上执行状态（ClStatus）：.status-wrapper.pl13 → 文字左移 13px，
   6px 圆点绝对定位在 left:0（与线上一致） */
.at-status {
  position: relative;
  padding-left: 13px;
  white-space: nowrap;
  line-height: 18px;
}
.at-status__dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.at-detail__ok {
  margin-right: 16px;
}

/* ---------------- 分页（线上左对齐） ---------------- */
/* 线上（Element UI 2）实测：分页条 1728×64 / total@200 / sizes@267(110×33) /
   prev@387(36×32) / 页码 li 36×28 13px / jump@766 / 跳转输入框 50×28 */
.at-pager {
  height: 64px;
  margin-top: 16px;
  padding: 0 0 0 24px;
  font-size: 13px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}
.at-pager :deep(.el-pagination) {
  width: 100%;
  height: 100%;
  font-size: 13px;
  justify-content: flex-start;
  align-items: center;
}
.at-pager :deep(.el-pagination__total) {
  margin: 0 10px 0 0;
  /* 线上「共 419 条」占位 57px，用来对齐后面的 sizes / 页码位置 */
  min-width: 57px;
  font-size: 13px;
  color: #606266;
  line-height: 32px;
}
.at-pager :deep(.el-pagination__sizes) {
  margin: 0 10px 0 0;
}
.at-pager :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}
.at-pager :deep(.el-pagination__sizes .el-select__wrapper) {
  height: 33px;
  min-height: 33px;
  padding: 0 12px;
  font-size: 13px;
}
.at-pager :deep(.el-pagination__sizes .el-select__selected-item) {
  font-size: 13px;
}
.at-pager :deep(.btn-prev),
.at-pager :deep(.btn-next) {
  margin: 0;
  /* 线上 Element UI 2 的按钮宽 36px */
  min-width: 36px;
  width: 36px;
  height: 32px;
  padding: 0 12px 0 6px;
  font-size: 13px;
  color: #606266;
  background: transparent;
}
.at-pager :deep(.btn-next) {
  padding: 0 6px 0 12px;
}
.at-pager :deep(.el-pager li) {
  margin: 0;
  min-width: 36px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  color: #606266;
  background: transparent;
}
.at-pager :deep(.el-pager li.is-active) {
  color: #197afb;
  font-weight: 400;
}
.at-pager :deep(.el-pagination__jump) {
  margin-left: 24px;
  /* EP 2.14 模板在「前往」/「页」两侧带空格（font-size 0 去掉），
     线上 Element UI 2 没有这个空格 */
  font-size: 0;
  color: #606266;
}
.at-pager :deep(.el-pagination__goto),
.at-pager :deep(.el-pagination__jump > span:not(.el-pagination__goto)) {
  font-size: 13px;
}
/* 线上「前往」与输入框之间只有 2px（EP 2.14 默认 8px） */
.at-pager :deep(.el-pagination__goto) {
  margin-right: 2px;
}
.at-pager :deep(.el-pagination__jump .el-input) {
  width: 50px;
}
.at-pager :deep(.el-pagination__jump .el-input__wrapper) {
  height: 28px;
  min-height: 28px;
  padding: 0 8px;
}
.at-pager :deep(.el-pagination__jump .el-input__inner) {
  font-size: 14px;
  height: 26px;
  line-height: 26px;
}

</style>

<!-- R109：「提交规则」说明气泡（teleport 到 body，用非 scoped 样式块单独约束）
     线上实测：宽 404 / 高 85 / padding 12px / 14px / #606266 / 边框 1px #ebeef5 / 圆角 4px / 行高 1.4 -->
<style>
.at-submit-rule-tip {
  padding: 12px !important;
  font-size: 14px;
  line-height: 1.4;
  color: #606266;
  border-radius: 4px;
  /* 线上是无固定宽的自适应气泡（实测 404px，单行不折行） */
  width: fit-content !important;
  max-width: 404px !important;
}
.at-submit-rule-tip p {
  margin: 0 !important;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}
/* 「执行状态」表头说明气泡（teleport 到 body）：
   线上实测 370×65，<p> 外边距 0，14px / 1.4 行高 */
.at-status-tip p {
  margin: 0 !important;
  font-size: 14px;
  line-height: 1.4;
}
</style>
