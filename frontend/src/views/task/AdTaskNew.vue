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
          <el-popover content="立即提交：实时返回广告新建结果；定时提交：按设定时间提交；分批提交：分批返回结果；匀速提交：匀速返回结果" trigger="hover" placement="top">
            <template #reference>
              <i class="at-question" title="提交规则说明"><el-icon><QuestionFilled /></el-icon></i>
            </template>
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

      <div class="at-toolbar">
        <el-button type="primary" size="large" class="at-new-btn" @click="openCreate">
          <el-icon class="at-new-btn__icon"><Plus /></el-icon>
          <span>新建广告</span>
        </el-button>
      </div>

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
              <i class="at-edit-icon" title="编辑" @click="openEdit(row)">
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
            <!-- 已终止的任务可以删除（点击后二次确认） -->
            <el-button v-if="canDelete(row)" link class="at-op-btn" @click="deleteRow(row)">删除</el-button>
            <!-- 其余状态：执行中的任务不可删除（hover 提示） -->
            <el-popover v-else content="执行中的任务不可删除" placement="top" trigger="hover">
              <template #reference>
                <span class="at-op-wrap">
                  <el-button link class="at-op-btn at-op-btn--disabled">删除</el-button>
                </span>
              </template>
            </el-popover>
            <!-- 有失败广告的任务：可重提（线上失败行多出的第 4 个按钮） -->
            <el-button v-if="row.fail > 0" link class="at-op-btn at-op-btn--resubmit" @click="resubmitRow(row)">重提</el-button>
          </template>
        </el-table-column>

        <el-table-column label="推广目的" prop="purpose" width="100" show-overflow-tooltip />
        <el-table-column label="投放模式" prop="mode" width="100" show-overflow-tooltip />
        <el-table-column label="营销场景" prop="scene" width="100" show-overflow-tooltip />
        <el-table-column label="广告类型" prop="adType" width="100" show-overflow-tooltip />
        <el-table-column label="投放类型" prop="deliveryType" width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告出价(元)" prop="bid" width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告深度出价(元)" prop="deepBid" width="100" show-overflow-tooltip />
        <el-table-column label="项目/广告ROI" prop="roi" width="100" show-overflow-tooltip />

        <el-table-column label="媒体账户" prop="accounts" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="at-ellipsis"><span>{{ row.accounts }}</span></div>
          </template>
        </el-table-column>

        <el-table-column label="提交规则" prop="submitRule" width="100" show-overflow-tooltip />
        <el-table-column label="创建人" prop="creator" width="160" />
        <el-table-column label="创建时间" prop="createdAt" width="160" />

        <el-table-column label="执行状态" width="100">
          <template #header>
            <span>执行状态</span>
            <span class="at-header-tip">
              <el-popover placement="top" :width="370" trigger="hover">
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
              <span>{{ row.status }}</span>
              <i class="at-status__dot" :style="{ background: statusDotColor(row) }"></i>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="任务详情" width="150">
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

    <!-- ================= 新建 / 编辑广告 ================= -->
    <el-dialog
      v-model="formVisible"
      :title="formMode === 'create' ? '新建广告' : '编辑广告'"
      width="620px"
      :close-on-click-modal="false"
      append-to-body
      class="at-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" size="small">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="媒体账户" prop="account">
          <el-select v-model="form.account" class="at-dialog-select" placeholder="请选择媒体账户" filterable>
            <el-option v-for="o in accountOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="推广目的" prop="purpose">
          <el-select v-model="form.purpose" class="at-dialog-select" placeholder="请选择推广目的">
            <el-option v-for="o in PURPOSE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="投放模式" prop="mode">
          <el-select v-model="form.mode" class="at-dialog-select" placeholder="请选择投放模式">
            <el-option v-for="o in MODE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="营销场景" prop="scene">
          <el-select v-model="form.scene" class="at-dialog-select" placeholder="请选择营销场景">
            <el-option v-for="o in SCENE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告类型" prop="adType">
          <el-select v-model="form.adType" class="at-dialog-select" placeholder="请选择广告类型">
            <el-option v-for="o in AD_TYPE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="投放类型" prop="deliveryType">
          <el-select v-model="form.deliveryType" class="at-dialog-select" placeholder="请选择投放类型">
            <el-option v-for="o in DELIVERY_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交规则" prop="submitRule">
          <el-select v-model="form.submitRule" class="at-dialog-select" placeholder="请选择提交规则">
            <el-option v-for="o in SUBMIT_RULE_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交广告数" prop="adCount">
          <el-input-number v-model="form.adCount" :min="1" :max="100" controls-position="right" class="at-dialog-number" />
        </el-form-item>
        <el-form-item label="开始执行时间" prop="createdAt">
          <el-input v-model="form.createdAt" placeholder="2026-11-25 12:00:00" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="formVisible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, EditPen, Plus, QuestionFilled, Search, Warning } from '@element-plus/icons-vue';
import TaskDetailDrawer from './TaskDetailDrawer.vue';

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

/** 线上失败任务样例（操作列带「重提」，删除为不可用态） */
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
  status: '失败',
  success: 0,
  fail: 6,
};

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function buildRows() {
  const rows = SEED.map((s) => ({
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
  }));
  // 失败任务（线上真实样例），紧跟在前 8 条真实数据之后
  rows.splice(8, 0, { ...FAILED_ROW });

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

/* 媒体账户下拉：线上远程搜索返回 20 个账户；本地再补上表格数据里出现的账户，
   这样「媒体账户」筛选能真正过滤出行（线上选账户是换一批任务） */
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
accountOptions.value = ALL_ACCOUNT_OPTIONS;

function onRemoteSearch(q) {
  remoteLoading.value = true;
  setTimeout(() => {
    accountOptions.value = q ? ALL_ACCOUNT_OPTIONS.filter((o) => o.includes(q)) : ALL_ACCOUNT_OPTIONS;
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
    if (start && r.createdAt.slice(0, 10) < start) return false;
    if (end && r.createdAt.slice(0, 10) > end) return false;
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
 * ------------------------------------------------------------------ */
function statusColor(status) {
  return {
    提交完成: 'rgb(35,194,63)',
    提交中: 'rgb(64,158,255)',
    素材上传中: 'rgb(64,158,255)',
    等待提交: 'rgb(230,162,60)',
    已终止: 'rgb(245,108,108)',
    失败: 'rgb(245,108,108)',
  }[status] || 'rgb(153,153,153)';
}

/** 线上规则：状态文字为「提交完成」但含失败项时，圆点为红色 */
function statusDotColor(row) {
  if (row.fail > 0) return 'rgb(245,108,108)';
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

function canDelete(row) {
  return row.status === '已终止';
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

async function deleteRow(row) {
  try {
    await ElMessageBox.confirm('确认删除该任务？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  const idx = rows.value.findIndex((r) => r.id === row.id);
  if (idx > -1) rows.value.splice(idx, 1);
  ElMessage.success('已删除该任务');
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

/* ------------------------------------------------------------------ *
 * 新建 / 编辑弹窗
 * ------------------------------------------------------------------ */
const formVisible = ref(false);
const formMode = ref('create');
const formRef = ref(null);
const form = reactive({
  name: '',
  account: '',
  purpose: '应用推广',
  mode: '手动投放',
  scene: '短视频/图片',
  adType: '通投广告',
  deliveryType: '常规投放',
  submitRule: '立即提交',
  adCount: 1,
  createdAt: '',
});

const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  account: [{ required: true, message: '请选择媒体账户', trigger: 'change' }],
};

function openCreate() {
  formMode.value = 'create';
  Object.assign(form, {
    name: '',
    account: '',
    purpose: '应用推广',
    mode: '手动投放',
    scene: '短视频/图片',
    adType: '通投广告',
    deliveryType: '常规投放',
    submitRule: '立即提交',
    adCount: 1,
    createdAt: nowText(),
  });
  formVisible.value = true;
}

function openEdit(row) {
  formMode.value = 'edit';
  Object.assign(form, {
    name: row.name,
    account: row.accounts.split('、')[0],
    purpose: row.purpose,
    mode: row.mode,
    scene: row.scene,
    adType: row.adType,
    deliveryType: row.deliveryType,
    submitRule: row.submitRule,
    adCount: row.success || 1,
    createdAt: row.createdAt,
  });
  formVisible.value = true;
}

function submitForm() {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    if (formMode.value === 'create') {
      const maxId = rows.value.reduce((m, r) => Math.max(m, Number(r.id)), 2167900472);
      rows.value.unshift({
        id: String(maxId + 1),
        name: form.name,
        purpose: form.purpose,
        mode: form.mode,
        scene: form.scene,
        adType: form.adType,
        deliveryType: form.deliveryType,
        bid: '--',
        deepBid: '--',
        roi: '--',
        accounts: form.account,
        submitRule: form.submitRule,
        creator: '刘松涵',
        createdAt: form.createdAt || nowText(),
        status: '等待提交',
        success: 0,
        fail: 0,
      });
      page.value = 1;
      ElMessage.success('新建成功');
    } else {
      const target = rows.value.find((r) => r.name === form.name);
      if (target) {
        target.purpose = form.purpose;
        target.mode = form.mode;
        target.scene = form.scene;
        target.adType = form.adType;
        target.deliveryType = form.deliveryType;
        target.submitRule = form.submitRule;
        target.createdAt = form.createdAt || target.createdAt;
      }
      ElMessage.success('保存成功');
    }
    formVisible.value = false;
  });
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
  margin-left: 8px;
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
/* 告警条：线上字色实测 rgb(255,179,116) */
body.app-scope .app-page.at-page .at-alert {
  color: #ffb374;
}
.at-alert {
  margin-bottom: 0;
}
.at-alert__text {
  flex: 1;
}
.at-toolbar {
  padding: 18px 0 8px 17px;
}
/* 线上实测 120×32、圆角 4px（appPage.css 全局把按钮圆角压成 3px，这里改回线上值） */
body.app-scope .app-page.at-page .at-new-btn {
  width: 120px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  border-radius: 4px !important;
  line-height: 14px;
}
.at-new-btn__icon {
  margin-right: 4px;
  font-size: 12px;
}

/* ---------------- 表格 ---------------- */
.at-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-text-color: #333;
  width: 100%;
}
/* 线上表体文字色 #606266、表头单元格 #333 */
body.app-scope .app-page.at-page .at-table :deep(.el-table__cell) {
  color: #606266;
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
.at-name-cell {
  display: flex;
  align-items: center;
  overflow: hidden;
  height: 21px;
  line-height: 21px;
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
.at-table :deep(.at-op-btn--disabled) {
  color: #197afb;
  cursor: not-allowed;
}
.at-table :deep(.at-op-btn--disabled:hover) {
  color: #197afb;
}
.at-header-tip {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.at-header-tip__icon {
  font-size: 14px;
  color: #c0c4cc;
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
.at-status {
  position: relative;
  padding-left: 13px;
  white-space: nowrap;
  line-height: 23px;
}
.at-status__dot {
  position: absolute;
  right: 0;
  top: 50%;
  margin-top: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.at-detail__ok {
  margin-right: 16px;
}

/* ---------------- 分页（线上左对齐） ---------------- */
.at-pager {
  padding: 16px 0 0 24px;
  font-size: 13px;
}
.at-pager :deep(.el-pagination) {
  font-size: 13px;
  justify-content: flex-start;
}

/* ---------------- 弹窗 ---------------- */
.at-dialog-select {
  width: 100%;
}
.at-dialog-number {
  width: 160px;
}
</style>
