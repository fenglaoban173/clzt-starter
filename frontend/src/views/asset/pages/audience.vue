<template>
  <div class="aud-page">
    <!-- 页面标题（线上 .mg-title-header > h1） -->
    <div class="asset-title-bar">
      <span class="asset-title">自定义人群包</span>
    </div>

    <!-- ① 查询条件（线上 form.filter-search-input） -->
    <div class="filter-row">
      <div class="filter-left">
        <!-- 媒体账户（多选远程下拉 + 右侧 ✕ 清空） -->
        <div class="filter-cell">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="query.advertiser_id"
            class="filter-select aud-account-select"
            size="small"
            filterable
            remote
            :remote-method="searchAccount"
            :loading="accountLoading"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option label="全部账户" value="all" />
            <el-option
              v-for="a in accountOptions"
              :key="a.value"
              :label="a.label"
              :value="a.value"
            />
          </el-select>
          <i class="aud-icon-close el-icon-close" title="清空" @click="clearAccount" />
        </div>

        <!-- 人群类型（不可清空） -->
        <div class="filter-cell">
          <label class="filter-label">人群类型：</label>
          <el-select
            v-model="query.select_type"
            class="filter-select"
            size="small"
            placeholder="请选择人群类型"
            @change="onFilterChange"
          >
            <el-option label="全部" value="0" />
            <el-option label="可用的人群包" value="1" />
          </el-select>
        </div>

        <!-- 关键词搜索（字段类型下拉 + 关键词输入 + 批量搜索气泡 + 🔍） -->
        <div class="aud-search-wrap">
          <el-input
            v-model="searchKeyword"
            class="cl-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
          >
            <template #prepend>
              <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
                <el-option label="名称" value="name" />
                <el-option label="ID" value="custom_audience_id" />
              </el-select>
            </template>
            <template #suffix>
              <el-popover
                placement="bottom-end"
                :width="640"
                trigger="click"
                popper-class="aud-batch-popper"
              >
                <template #reference>
                  <span class="aud-batch-icon" title="批量搜索">
                    <svg
                      viewBox="0 0 1024 1024" version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      width="1em" height="1em"
                    >
                      <path
                        d="M881.4 250.9H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h739.9c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM272.1 454H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 454 272.1 454zM272.1 657.1H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM853.8 847.5L715.3 709c-16.9-16.9-16.9-44.6 0-61.5s44.6-16.9 61.5 0L915.3 786c16.9 16.9 16.9 44.6 0 61.5s-44.6 16.9-61.5 0zM467.9 860.2H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h326.4c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </template>
                <div class="aud-batch">
                  <div class="aud-batch__head">
                    <span class="aud-batch__title">请输入名称（{{ batchText.length }}/1000）</span>
                    <el-button link type="primary" size="mini" @click="batchText = ''">清空</el-button>
                  </div>
                  <div class="aud-batch__tips">
                    每一行为一个关键词，批量搜索将执行
                    <el-popover placement="right" :width="400" trigger="hover">
                      <template #reference>
                        <a class="aud-batch__link">精确匹配</a>
                      </template>
                      <div class="aud-batch__pop-title">精准匹配</div>
                      指被搜索的内容需要与搜索关键词完全一致。如：输入关键字为“爆款素材”时，精准匹配只能搜索到名称为“爆款素材”的内容
                    </el-popover>
                    。
                  </div>
                  <el-input
                    v-model="batchText"
                    type="textarea"
                    :rows="12"
                    resize="none"
                    placeholder="请粘贴或输入名称，回车可换行"
                  />
                  <div class="batch-search-ops">
                    <el-button size="mini" plain @click="batchText = ''">清空</el-button>
                    <el-button size="mini" type="primary" @click="onBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
            <template #append>
              <el-button class="search-more-btn" title="搜索" @click="onSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <a class="filter-clear" @click="onClearFilters">清空</a>
      </div>
    </div>

    <!-- ② 功能按钮条（线上 .table-toolbar） -->
    <div class="table-toolbar">
      <el-button
        type="primary"
        size="small"
        class="tool-btn"
        @click="syncVisible = true"
      >同步巨量广告人群包</el-button>

      <!-- 批量操作：下拉选择式，未选中行时置灰 -->
      <el-select
        v-model="batchOp"
        class="batch-select"
        size="small"
        clearable
        placeholder="批量操作"
        :disabled="!selectedRows.length"
        @change="onBatchOp"
      >
        <el-option label="推送" value="push" />
        <el-option label="删除" value="delete" />
      </el-select>

      <span v-if="selectedRows.length" class="ml8">
        <span class="count-text">已选<span class="select-count">{{ selectedRows.length }}</span>条</span>
      </span>
    </div>

    <!-- ③ 列表（线上 el-table--border） -->
    <el-table
      ref="tableRef"
      :data="pagedList"
      row-key="id"
      border
      class="asset-table"
      show-overflow-tooltip
      @selection-change="onSelectionChange"
      @select-all="onSelectAll"
    >
      <el-table-column
        type="selection"
        width="48"
        fixed="left"
        align="center"
        :selectable="isSelectable"
      />
      <el-table-column prop="name" label="名称" min-width="406" show-overflow-tooltip />
      <el-table-column prop="custom_audience_id" label="ID" width="159" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openPush(row)">推送</el-button>
          <el-button link type="primary" size="small" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="tag" label="人群分组" width="159" show-overflow-tooltip />
      <el-table-column prop="upload_num" label="上传人数" width="159" align="right" />
      <el-table-column prop="cover_num" label="覆盖人群" width="159" align="right" />
      <el-table-column label="投放状态" width="159">
        <template #default="{ row }">
          <span>{{ deliveryStatus(row).text }}</span>
          <el-popover placement="right" trigger="hover" :content="deliveryStatus(row).tip">
            <template #reference>
              <span class="aud-question">?</span>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="人群包状态" width="159">
        <template #default="{ row }">
          <span> {{ AUDIENCE_STATUS[row.status] || '未知' }} </span>
        </template>
      </el-table-column>
      <el-table-column label="推送状态" width="159">
        <template #default="{ row }">
          <span> {{ PUSH_STATUS[row.push_status] || '未知' }} </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- ④ 分页（线上 .cl-table-pagination-layout，total > 10 时才渲染） -->
    <div v-if="total > 10" class="pager-card">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑤ 推送人群包 弹窗（线上 el-dialog「推送人群包」） -->
    <el-dialog
      v-model="pushVisible"
      title="推送人群包"
      width="800px"
      top="0"
      :close-on-click-modal="false"
      class="aud-dialog aud-dialog--push"
      append-to-body
    >
      <el-form :model="pushForm" label-position="left" label-width="124px">
        <el-form-item label="选择媒体账户">
          <div class="aud-transfer">
            <div class="aud-transfer__left">
              <div class="aud-transfer__head">媒体账户</div>
              <div class="aud-transfer__search">
                <el-input
                  v-model="pushAccountKeyword"
                  size="small"
                  clearable
                  placeholder="请输入关键词"
                  :prefix-icon="Search"
                />
              </div>
              <div class="aud-transfer__all" @click="togglePushAll">
                <el-checkbox v-model="pushAllChecked">全选</el-checkbox>
              </div>
              <div class="aud-transfer__list">
                <el-checkbox-group v-model="pushForm.target_advertiser_ids">
                  <el-checkbox
                    v-for="a in pushAccountOptions"
                    :key="a.value"
                    :label="a.value"
                    class="aud-transfer__item"
                  >{{ a.label }}</el-checkbox>
                </el-checkbox-group>
                <div v-if="!pushAccountOptions.length" class="aud-transfer__none">暂无数据</div>
              </div>
            </div>
            <div class="aud-transfer__right">
              <div class="aud-transfer__head">
                <span>已选：{{ pushForm.target_advertiser_ids.length }}/{{ PUSH_LIMIT }}</span>
                <a class="aud-transfer__clear" @click="pushForm.target_advertiser_ids = []">清空全部</a>
              </div>
              <div class="aud-transfer__list">
                <div
                  v-for="id in pushForm.target_advertiser_ids"
                  :key="id"
                  class="aud-transfer__picked"
                >
                  <span class="aud-transfer__label" :title="labelOfAccount(id)">{{ labelOfAccount(id) }}</span>
                  <i class="el-icon-close" @click="removePushAccount(id)" />
                </div>
                <div v-if="!pushForm.target_advertiser_ids.length" class="aud-transfer__none">暂无数据</div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button plain @click="pushVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitPush">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑥ 同步人群包 弹窗（线上 el-dialog.cl-modal「同步人群包」） -->
    <el-dialog
      v-model="syncVisible"
      title="同步人群包"
      width="760px"
      top="15vh"
      :close-on-click-modal="false"
      class="aud-dialog aud-dialog--sync"
      append-to-body
    >
      <div class="aud-crowd-guide">
        注意：受媒体API能力限制，无法同步巨量引擎工作台新建/推送（共享）的人群包；若找不到人群包，建议您前往巨量广告平台新建/推送人群包后同步获取。
        <el-popover placement="right" :width="800" trigger="hover">
          <template #reference><a class="aud-crowd-guide__link">查看指引</a></template>
          <img class="aud-crowd-guide__img" :src="CROWD_GUIDE_IMG" alt="人群包同步指引" />
        </el-popover>
      </div>
      <div class="aud-sync__label">请选择需要同步人群包的媒体账户：</div>
      <div class="aud-transfer aud-transfer--sync">
        <div class="aud-transfer__left">
          <div class="aud-transfer__head">媒体账户</div>
          <div class="aud-transfer__search">
            <el-input v-model="syncAccountKeyword" size="small" placeholder="请输入关键词" :prefix-icon="Search" />
          </div>
          <div class="aud-transfer__all" @click="toggleSyncAll">
            <el-checkbox v-model="syncAllChecked">全选</el-checkbox>
          </div>
          <div class="aud-transfer__list">
            <el-checkbox-group v-model="syncForm.advertiser_ids">
              <el-checkbox
                v-for="a in syncAccountOptions"
                :key="a.value"
                :label="a.value"
                class="aud-transfer__item"
              >{{ a.label }}</el-checkbox>
            </el-checkbox-group>
            <div v-if="!syncAccountOptions.length" class="aud-transfer__none">暂无数据</div>
          </div>
          <div class="aud-transfer__pager">
            <el-pagination
              v-model:current-page="syncPage"
              :page-size="syncPageSize"
              :total="syncTotal"
              layout="prev, pager, next"
              small
            />
          </div>
        </div>
        <div class="aud-transfer__right">
          <div class="aud-transfer__head">
            <span>已选：{{ syncForm.advertiser_ids.length }}/{{ SYNC_LIMIT }}</span>
            <a class="aud-transfer__clear" @click="syncForm.advertiser_ids = []">清空</a>
          </div>
          <div class="aud-transfer__list">
            <div
              v-for="id in syncForm.advertiser_ids"
              :key="id"
              class="aud-transfer__picked"
            >
              <span class="aud-transfer__label" :title="labelOfAccount(id)">{{ labelOfAccount(id) }}</span>
              <i class="el-icon-close" @click="removeSyncAccount(id)" />
            </div>
            <div v-if="!syncForm.advertiser_ids.length" class="aud-transfer__none">暂无数据</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" plain @click="syncVisible = false">取 消</el-button>
          <el-button size="small" type="primary" :loading="syncLoading" @click="submitSync">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------ *
 * 线上状态字典（来源：创量 dmp-list chunk）
 * ------------------------------------------------------------------ */
const DELIVERY_STATUS = {
  CUSTOM_AUDIENCE_DELIVERY_STATUS_AVAILABLE: {
    text: '可投放',
    tip: '人群包发布完成且推送完成',
  },
  CUSTOM_AUDIENCE_DELIVERY_STATUS_NEED_PUSH: {
    text: '不可投放',
    tip: '人群包发布完成，但未推送，需要进行推送后再使用',
  },
  CUSTOM_AUDIENCE_DELIVERY_STATUS_NEED_PUBLISH: {
    text: '不可投放',
    tip: '人群包未发布但已推送,需要进行发布后再使用',
  },
  CUSTOM_AUDIENCE_DELIVERY_STATUS_UNAVAILABLE: {
    text: '不可投放',
    tip: '未发布完成且未推送',
  },
};

const AUDIENCE_STATUS = {
  0: '校验中', 1: '覆盖校验中', 2: '已生效', 3: '校验失败', 4: '覆盖人数过少',
  5: '待预估', 6: '扩展中', 7: '扩展失败', 8: '运算中', 9: '运算失败',
  10: '已推送', 11: '已过期', 12: '等待拓展', 13: '等待运算', 14: '推送中',
  15: '推送失败', 16: '等待二次检查', 17: '等待重新刷新', 18: '历史包looklike拓展',
  19: '历史包BI覆盖校验', 20: '任务处理中', 21: '等待外部系统处理', 22: '被用户删除',
  23: '已从abase删除', 24: '人群包依赖的标签下线，等待标签上线',
  25: '过期处理中 (解绑定向包、解绑绑定的历史计划的操作)', 26: '已过期且各解绑操作完成',
};

const PUSH_STATUS = { 0: '未推送', 1: '推送中', 2: '已推送', 3: '推送失败' };

const CROWD_GUIDE_IMG = 'https://tos.mobgi.com/web/native-ad-guide/audience-crowd-guide.png?t=1';
const PUSH_LIMIT = 100;
const SYNC_LIMIT = 200;

/* ------------------------------------------------------------------ *
 * 组件内 mock 数据
 * ------------------------------------------------------------------ */
const MOCK_ACCOUNTS = [
  // 线上「媒体账户」下拉的真实账户（按线上顺序，前 20 个为线上实测抓取）
  { value: '1861811345880074', label: '北京高途云集教育科技有限公司--1(1861811345880074)', company: '北京高途云集教育科技有限公司' },
  { value: '1866877399870663', label: '百度文库-央广时代-拉新-搜索-01(1866877399870663)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1866877399203047', label: '百度文库-央广时代-拉新-搜索-02(1866877399203047)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1866849651765706', label: '百度文库-央广时代-拉新-搜索-03(1866849651765706)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1866489873996443', label: '任意门-央广-代运营-36-安卓-UBA(1866489873996443)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489858950211', label: '任意门-央广-代运营-22-安卓-UBA(1866489858950211)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489859578696', label: '任意门-央广-代运营-23-安卓-UBA(1866489859578696)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489860302024', label: '任意门-央广-代运营-10-ios-UBA(1866489860302024)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489860976135', label: '任意门-央广-代运营-25-ios-UBA(1866489860976135)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489864776836', label: '任意门-央广-代运营-30-ios-UBA(1866489864776836)', company: '北京高途云集教育科技有限公司' },
  { value: '1834419631681163', label: '上海得物信息集团有限公司1-50(1834419631681163)', company: '上海得物信息集团有限公司' },
  { value: '1866489862625304', label: '任意门-央广-代运营-27-安卓-UBA(1866489862625304)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489865523527', label: '任意门-央广-代运营-31-安卓-UBA(1866489865523527)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489874950667', label: '任意门-央广-代运营-38-安卓-UBA(1866489874950667)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489872328266', label: '任意门-央广-代运营-33-安卓-UBA(1866489872328266)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489871677514', label: '任意门-央广-代运营-32-ios-UBA(1866489871677514)', company: '北京高途云集教育科技有限公司' },
  { value: '1866877401293188', label: '百度文库-央广时代-拉新-搜索-04(1866877401293188)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1866489863429463', label: '任意门-央广-代运营-28-安卓-UBA(1866489863429463)', company: '北京高途云集教育科技有限公司' },
  { value: '1866489873385099', label: '任意门-央广-代运营-35-iOS-UBA(1866489873385099)', company: '北京高途云集教育科技有限公司' },
  { value: '1866877405575303', label: '央广-621059846-百度文库-1(1866877405575303)', company: '百度在线网络技术（北京）有限公司' },
  // 其余本地补充账户（线上为远程分页加载，展开「搜索更多」后可见）
  { value: '1846116421525516', label: '央广-亦芯-95分-拉新-通投-安卓-17(1846116421525516)', company: '上海置潮信息科技有限公司' },
  { value: '1869584158208068', label: '百度极速版调起-央广-12(1869584158208068)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584152800267', label: '百度极速版调起-央广-4(1869584152800267)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584153842699', label: '百度极速版调起-央广-6(1869584153842699)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584164579543', label: '百度极速版调起-央广-20(1869584164579543)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584157446151', label: '百度极速版调起-央广-11(1869584157446151)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584151302635', label: '百度极速版调起-央广-1(1869584151302635)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584152314635', label: '百度极速版调起-央广-3(1869584152314635)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584153348634', label: '百度极速版调起-央广-5(1869584153348634)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1869584154393786', label: '百度极速版调起-央广-7(1869584154393786)', company: '百度在线网络技术（北京）有限公司' },
  { value: '1872677289688', label: '上海置潮信息科技有限公司-23(1872677289688)', company: '上海置潮信息科技有限公司' },
  { value: '1872677284008', label: '上海置潮信息科技有限公司-16(1872677284008)', company: '上海置潮信息科技有限公司' },
];

const NAME_TPL = [
  '无效线索-升级版（自动更新）', '行业通用人群包', '行业潜力人群包', '高价值用户包',
  '流失召回人群包', '沉睡用户包', '付费用户包', '新客人群包', '竞品人群包',
  '高活跃用户包', '门店到店人群包', '私域访客人群包',
];
const TAG_TPL = ['api文件数据源', '系统推荐', '规则人群包', '手动上传', '达芬奇人群包'];
const DELIVERY_KEYS = Object.keys(DELIVERY_STATUS);

/** 构造 663 条 mock 人群包（与线上 total_count=663 / 67 页一致） */
function buildMockList() {
  const rows = [];
  for (let i = 0; i < 663; i += 1) {
    const acc = MOCK_ACCOUNTS[i % MOCK_ACCOUNTS.length];
    let delivery = DELIVERY_KEYS[0];
    if (i % 23 === 0) delivery = DELIVERY_KEYS[1];
    else if (i % 47 === 0) delivery = DELIVERY_KEYS[2];
    else if (i % 71 === 0) delivery = DELIVERY_KEYS[3];
    let status = 2;
    if (i % 29 === 0) status = 0;
    else if (i % 37 === 0) status = 5;
    else if (i % 53 === 0) status = 14;
    else if (i % 61 === 0) status = 3;
    let pushStatus = 2;
    if (i % 19 === 0) pushStatus = 0;
    else if (i % 31 === 0) pushStatus = 1;
    else if (i % 43 === 0) pushStatus = 3;
    rows.push({
      id: 17300000000 + i * 137,
      name: NAME_TPL[i % NAME_TPL.length],
      custom_audience_id: 300000000 + i * 7,
      advertiser_id: acc.value,
      advertiser_nick: acc.label.split('(')[0],
      company: acc.company,
      tag: TAG_TPL[i % TAG_TPL.length],
      upload_num: 24697179 - i * 137,
      cover_num: 24918519 - i * 137,
      delivery_status: delivery,
      status,
      push_status: pushStatus,
    });
  }
  // 前 10 行与线上首屏完全一致
  const first = [
    ['无效线索-升级版（自动更新）', 447970787, 0, 'api文件数据源', 24697179, 24918519],
    ['行业通用人群包', 301306055, 1, '系统推荐', 59837693, 59837693],
    ['行业潜力人群包', 301306004, 2, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 3, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 4, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 5, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 6, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 7, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 8, '系统推荐', 88292274, 88292274],
    ['行业潜力人群包', 301306004, 9, '系统推荐', 88292274, 88292274],
  ];
  first.forEach((f, i) => {
    const acc = MOCK_ACCOUNTS[i];
    rows[i] = {
      id: 17300000000 + i * 137,
      name: f[0],
      custom_audience_id: f[1],
      advertiser_id: acc.value,
      advertiser_nick: acc.label.split('(')[0],
      company: acc.company,
      tag: f[3],
      upload_num: f[4],
      cover_num: f[5],
      delivery_status: DELIVERY_KEYS[0],
      status: 2,
      push_status: 2,
    };
  });
  return rows;
}

const list = ref(buildMockList());

/* ------------------------------------------------------------------ *
 * 查询条件
 * ------------------------------------------------------------------ */
const query = ref({ advertiser_id: 'all', select_type: '1' });
const searchField = ref('name');
const searchKeyword = ref('');
const batchText = ref('');
const accountOptions = ref(MOCK_ACCOUNTS);
const accountLoading = ref(false);
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRows = ref([]);
const batchOp = ref('');

/** 账户下拉远程搜索（线上 filter-select-remote） */
function searchAccount(kw) {
  accountLoading.value = true;
  setTimeout(() => {
    const k = String(kw || '').trim().toLowerCase();
    accountOptions.value = !k
      ? MOCK_ACCOUNTS
      : MOCK_ACCOUNTS.filter((a) => a.label.toLowerCase().indexOf(k) > -1);
    accountLoading.value = false;
  }, 120);
}

function clearAccount() {
  query.value.advertiser_id = 'all';
  onFilterChange();
}

function onFilterChange() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onSearch() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onBatchSearch() {
  const keys = batchText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) { ElMessage.warning('请输入关键词'); return; }
  searchKeyword.value = keys.join(',');
  searchField.value = 'name';
  onSearch();
  ElMessage.success(`已按 ${keys.length} 个关键词批量搜索`);
}

function onClearFilters() {
  query.value = { advertiser_id: 'all', select_type: '1' };
  searchField.value = 'name';
  searchKeyword.value = '';
  batchText.value = '';
  onFilterChange();
}

/* ------------------------------------------------------------------ *
 * 列表数据
 * ------------------------------------------------------------------ */
const filteredList = computed(() => {
  let rows = list.value;
  const aid = query.value.advertiser_id;
  if (aid && aid !== 'all') rows = rows.filter((r) => r.advertiser_id === aid);
  const kw = searchKeyword.value.trim();
  if (kw) {
    const keys = kw.split(',').map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      if (searchField.value === 'custom_audience_id') {
        return keys.some((k) => String(r.custom_audience_id) === k);
      }
      return keys.some((k) => String(r.name).indexOf(k) > -1);
    });
  }
  return rows;
});

const total = computed(() => filteredList.value.length);
const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

function deliveryStatus(row) {
  return DELIVERY_STATUS[row.delivery_status] || { text: '未知', tip: '' };
}

/* ------------------------------------------------------------------ *
 * 选择（线上：只允许同一主体下的行同时选中）
 * ------------------------------------------------------------------ */
const tableRef = ref();

function isSelectable(row) {
  if (!selectedRows.value.length) return true;
  return selectedRows.value[0].company === row.company;
}

function onSelectionChange(rows) {
  selectedRows.value = rows;
}

function onSelectAll(rows) {
  if (!rows.length) return;
  const first = rows[0].company;
  const crossed = rows.filter((r) => r.company !== first);
  if (!crossed.length) return;
  ElMessage.warning('非同一主体下的人群包无法同时操作，已过滤');
  crossed.forEach((r) => {
    tableRef.value && tableRef.value.toggleRowSelection(r, false);
  });
}

/* ------------------------------------------------------------------ *
 * 推送人群包弹窗
 * ------------------------------------------------------------------ */
const pushVisible = ref(false);
const pushForm = ref({ advertiser_id: '', custom_audience_id: '', target_advertiser_ids: [] });
const pushAccountKeyword = ref('');
const pushAllChecked = ref(false);

const pushAccountOptions = computed(() => {
  const k = pushAccountKeyword.value.trim().toLowerCase();
  const same = MOCK_ACCOUNTS.filter((a) => a.company === pushForm.value.company);
  return k ? same.filter((a) => a.label.toLowerCase().indexOf(k) > -1) : same;
});

function openPush(row) {
  pushForm.value = {
    advertiser_id: row.advertiser_id,
    custom_audience_id: row.custom_audience_id,
    target_advertiser_ids: [],
  };
  pushAccountKeyword.value = '';
  pushAllChecked.value = false;
  pushVisible.value = true;
}

function labelOfAccount(id) {
  const a = MOCK_ACCOUNTS.find((x) => x.value === id);
  return a ? a.label : id;
}

function togglePushAll() {
  const all = pushAccountOptions.value.map((a) => a.value);
  const checked = pushForm.value.target_advertiser_ids.length === all.length;
  pushForm.value.target_advertiser_ids = checked ? [] : all.slice(0, PUSH_LIMIT);
  pushAllChecked.value = !checked;
}

function removePushAccount(id) {
  pushForm.value.target_advertiser_ids = pushForm.value.target_advertiser_ids.filter((x) => x !== id);
}

function submitPush() {
  if (!pushForm.value.target_advertiser_ids.length) {
    ElMessage.warning('请选择媒体账户！');
    return;
  }
  const n = pushForm.value.target_advertiser_ids.length;
  ElMessage.success(`推送成功!（已推送至 ${n} 个媒体账户）`);
  pushVisible.value = false;
  pushForm.value.target_advertiser_ids = [];
}

/* ------------------------------------------------------------------ *
 * 同步人群包弹窗
 * ------------------------------------------------------------------ */
const syncVisible = ref(false);
const syncLoading = ref(false);
const syncForm = ref({ advertiser_ids: [] });
const syncAccountKeyword = ref('');
const syncAllChecked = ref(false);
const syncPage = ref(1);
const syncPageSize = ref(10);

const syncAccountOptions = computed(() => {
  const k = syncAccountKeyword.value.trim().toLowerCase();
  return k ? MOCK_ACCOUNTS.filter((a) => a.label.toLowerCase().indexOf(k) > -1) : MOCK_ACCOUNTS;
});
const syncTotal = computed(() => syncAccountOptions.value.length);

function toggleSyncAll() {
  const all = syncAccountOptions.value.map((a) => a.value);
  const checked = syncForm.value.advertiser_ids.length === all.length;
  syncForm.value.advertiser_ids = checked ? [] : all.slice(0, SYNC_LIMIT);
  syncAllChecked.value = !checked;
}

function removeSyncAccount(id) {
  syncForm.value.advertiser_ids = syncForm.value.advertiser_ids.filter((x) => x !== id);
}

function submitSync() {
  if (!syncForm.value.advertiser_ids.length) {
    ElMessage.error('请选择媒体账户');
    return;
  }
  syncLoading.value = true;
  setTimeout(() => {
    syncLoading.value = false;
    syncVisible.value = false;
    ElMessage.success('同步成功');
    onSearch();
  }, 600);
}

/* ------------------------------------------------------------------ *
 * 批量操作 / 行内删除
 * ------------------------------------------------------------------ */
async function onBatchOp(op) {
  const rows = selectedRows.value;
  batchOp.value = '';
  if (!op) return;
  if (!rows.length) { ElMessage.warning('请至少选择1行'); return; }
  if (op === 'push') {
    pushForm.value = {
      advertiser_id: rows[0].advertiser_id,
      custom_audience_id: rows[0].custom_audience_id,
      target_advertiser_ids: [],
    };
    pushAccountKeyword.value = '';
    pushAllChecked.value = false;
    pushVisible.value = true;
    return;
  }
  if (op === 'delete') {
    try {
      await ElMessageBox.confirm('此操作将删除选中人群包, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'cl-message-box--mini',
      });
    } catch (e) {
      return;
    }
    const ids = rows.map((r) => r.id);
    list.value = list.value.filter((x) => !ids.includes(x.id));
    selectedRows.value = [];
    ElMessage.success('全部删除成功');
  }
}

async function removeRow(row) {
  try {
    await ElMessageBox.confirm('确定要删除此人群包吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cl-message-box--mini',
    });
  } catch (e) {
    return;
  }
  list.value = list.value.filter((x) => x.id !== row.id);
  selectedRows.value = [];
  ElMessage.success('删除成功!');
}

watch(pageSize, () => { pageNo.value = 1; });
</script>

<style scoped>
.aud-page { width: 100%; }

/* ---------- 查询条件（对齐线上 .select-area / .icon-close） ---------- */
/* 线上 .select-area 内层 el-select 无边框（外层 .filter-cell 提供方框） */
.filter-cell :deep(.el-select .el-input__wrapper) { box-shadow: none !important; padding: 0; }
.filter-cell :deep(.el-select .el-input__inner) { border: none; }
.filter-cell :deep(.el-select .el-input__suffix) { color: #c0c4cc; }
.aud-account-select { width: 169px; }
.aud-icon-close {
  font-size: 14px; color: #999; cursor: pointer; margin-left: 6px;
  padding-left: 6px; border-left: 1px solid #e8eaec;
  font-family: element-icons;
}
.aud-icon-close:hover { color: #197afb; }
.aud-search-wrap { margin: 0 8px 8px 0; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索 + 🔍 */
.aud-search-wrap :deep(.cl-search-input) { width: 280px; }
.aud-search-wrap :deep(.cl-search-input .el-input__inner) { height: 28px; font-size: 12px; }
.aud-search-wrap :deep(.cl-search-input .el-input-group__prepend) { padding: 0; background: #fff; }
.aud-search-wrap :deep(.cl-search-input .el-input-group__append) { padding: 0; background: #fff; }
.aud-search-wrap :deep(.search-field) { width: 80px; }
.aud-search-wrap :deep(.search-field .el-input__inner) { height: 28px; font-size: 12px; }
.aud-search-wrap :deep(.search-more-btn) { height: 28px; padding: 0 6px; border-radius: 0 3px 3px 0; }
.aud-batch-icon {
  display: inline-flex; align-items: center; font-size: 16px; color: #606266; cursor: pointer;
}
.aud-batch-icon:hover { color: #197afb; }

/* 批量搜索气泡 */
.aud-batch__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.aud-batch__title { font-size: 14px; color: #333; font-weight: 500; }
.aud-batch__tips { font-size: 12px; color: #909399; margin-bottom: 6px; }
.aud-batch__link { color: #197afb; cursor: pointer; }
.aud-batch__pop-title { font-size: 14px; color: #303133; margin-bottom: 6px; }

/* ---------- 工具栏 ---------- */
.count-text { font-size: 12px; color: #666; }
.select-count { color: #197afb; }

/* ---------- 列表 ---------- */
.aud-question {
  display: inline-block; width: 14px; height: 14px; line-height: 14px; margin-left: 4px;
  text-align: center; font-size: 12px; color: #333; cursor: help;
  border: 1px solid #c0c4cc; border-radius: 50%;
}
.asset-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.asset-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* ---------- 推送 / 同步 弹窗 ---------- */
.aud-dialog :deep(.el-dialog__body) { padding-top: 12px; }
.aud-dialog :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.aud-dialog :deep(.dialog-footer) { display: flex; justify-content: flex-end; gap: 12px; }

.aud-transfer { display: flex; width: 616px; }
.aud-transfer__left { width: 380px; border: 1px solid #e8eaec; border-radius: 3px; }
.aud-transfer__right {
  width: 212px; margin-left: 24px; border: 1px solid #e8eaec; border-radius: 3px;
}
.aud-transfer__head {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 15px; border-bottom: 1px solid #e8eaec; font-size: 13px; color: #333;
}
.aud-transfer__search { padding: 10px 15px 6px; }
.aud-transfer__all { padding: 0 15px 8px; }
.aud-transfer__list {
  height: 250px; overflow-y: auto; padding: 0 15px 10px; box-sizing: border-box;
}
.aud-transfer__item { display: flex; width: 100%; margin: 0; }
.aud-transfer__item :deep(.el-checkbox__label) {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #333;
}
.aud-transfer__none {
  height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #909399;
}
.aud-transfer__picked {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; font-size: 12px; color: #333;
}
.aud-transfer__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aud-transfer__picked i { color: #c0c4cc; cursor: pointer; margin-left: 8px; }
.aud-transfer__picked i:hover { color: #197afb; }
.aud-transfer__clear { color: #197afb; cursor: pointer; font-size: 12px; }
.aud-transfer--sync { margin-top: 16px; }
.aud-transfer__pager { padding: 8px 15px; border-top: 1px solid #e8eaec; }

.aud-crowd-guide { font-size: 13px; color: #f56c6c; line-height: 20px; }
.aud-crowd-guide__link { color: #197afb; cursor: pointer; margin-left: 4px; }
.aud-crowd-guide__img { max-width: 800px; }
.aud-sync__label { margin-top: 14px; font-size: 13px; color: #333; }
</style>
