<template>
  <div class="cm-page">
    <!-- 页面标题 -->
    <div class="asset-title-bar">
      <span class="asset-title">评论管理</span>
    </div>

    <!-- ① 查询条件（线上 .cl-filter-area / .filter-list / .filter-item） -->
    <div class="cm-filter-area">
      <div class="filter-list">
        <!-- 媒体账户（远程多选） -->
        <div class="filter-cell cm-cell" style="width: 260px">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="query.accountIds"
            class="filter-select cm-select"
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
            remote
            clearable
            :remote-method="searchAccount"
            :loading="accountLoading"
            :placeholder="'不限'"
            popper-class="cm-acct-popper"
          >
            <el-option v-for="a in accountOptions" :key="a.value" :label="a.label" :value="a.value" />
            <template #footer>
              <div class="cm-select-footer">共 {{ accountTotal }} 条记录，输入关键词查看更多</div>
            </template>
          </el-select>
        </div>

        <!-- 评论创建时间 -->
        <div class="filter-cell cm-cell" style="width: 294px">
          <label class="filter-label">评论创建时间：</label>
          <el-date-picker
            v-model="query.date"
            class="cm-date"
            type="daterange"
            size="small"
            unlink-panels
            value-format="YYYY-MM-DD"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </div>

        <!-- 隐藏状态 -->
        <div class="filter-cell cm-cell" style="width: 260px">
          <label class="filter-label">隐藏状态：</label>
          <el-select v-model="query.hideStatus" class="filter-select cm-select" size="small" placeholder="不限" clearable @change="onFilterChange">
            <el-option v-for="o in HIDE_STATUS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>

        <!-- 评论舆情类型 -->
        <div class="filter-cell cm-cell" style="width: 260px">
          <label class="filter-label">评论舆情类型：</label>
          <el-select v-model="query.emotionType" class="filter-select cm-select" size="small" placeholder="不限" clearable @change="onFilterChange">
            <el-option v-for="o in EMOTION_TYPE" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>

        <!-- 评论层级 -->
        <div class="filter-cell cm-cell" style="width: 260px">
          <label class="filter-label">评论层级：</label>
          <el-select v-model="query.levelType" class="filter-select cm-select" size="small" placeholder="不限" clearable @change="onFilterChange">
            <el-option v-for="o in LEVEL_TYPE" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>

        <!-- 处理状态 -->
        <div class="filter-cell cm-cell" style="width: 260px">
          <label class="filter-label">处理状态：</label>
          <el-select v-model="query.replyStatus" class="filter-select cm-select" size="small" placeholder="不限" clearable @change="onFilterChange">
            <el-option v-for="o in REPLY_STATUS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>

        <!-- 关键词搜索（字段类型下拉 + 关键词输入 + 批量搜索气泡 + 🔍） -->
        <div class="filter-cell cm-cell cm-search-cell" style="width: 360px">
          <div class="cl-search" style="width: 360px">
            <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择" style="width: 120px">
              <el-option v-for="o in SEARCH_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              class="search-input cm-search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onSearch"
            >
              <template #suffix>
                <el-popover placement="bottom-end" :width="640" trigger="click" popper-class="cm-batch-popper">
                  <template #reference>
                    <el-icon class="cm-batch-icon" title="批量搜索"><MoreFilled /></el-icon>
                  </template>
                  <div class="cm-batch">
                    <div class="cm-batch__hd">
                      <span class="cm-batch__title">请输入{{ currentSearchLabel }}（{{ batchText.length }}/1000）</span>
                      <el-link type="primary" :underline="false" @click="clearBatch">清空</el-link>
                    </div>
                    <div class="cm-batch__tip">
                      每一行为一个关键词，批量搜索将执行<el-link type="primary" :underline="false">精确匹配</el-link>。
                    </div>
                    <el-input
                      v-model="batchText"
                      type="textarea"
                      :rows="10"
                      resize="none"
                      placeholder="请粘贴或输入评论内容，回车可换行"
                    />
                    <div class="batch-search-ops">
                      <el-button size="small" @click="clearBatch">清空</el-button>
                      <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                    </div>
                  </div>
                </el-popover>
              </template>
              <template #append>
                <el-button class="cm-search-btn" :icon="Search" title="搜索" @click="onSearch" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- 清空 -->
        <a class="filter-clear cm-clear" @click="clearFilters">清空</a>
      </div>
    </div>

    <!-- ② 工具栏 + 列表 + 分页（线上 .cl-table） -->
    <div class="cm-table-card">
      <div class="cm-toolbar">
        <div class="selection">已选 <span class="text-primary">{{ selected.length }}</span> 条</div>
        <el-button type="primary" size="small" class="tool-btn" @click="syncVisible = true">同步数据</el-button>
        <el-dropdown @command="onBatchCommand">
          <el-button type="primary" plain size="small" class="tool-btn" :disabled="!selected.length">
            批量操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="hide">隐藏</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-table
        :data="pagedList"
        row-key="id"
        border
        class="asset-table cm-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="60" fixed="left" />

        <el-table-column prop="text" label="评论内容" width="240" fixed="left" show-overflow-tooltip />

        <el-table-column label="媒体账户" prop="advertiser_nick" min-width="200">
          <template #default="{ row }">
            <div class="desc-cell">
              <div class="desc-cell__title" :title="row.advertiser_nick">{{ row.advertiser_nick || '—' }}</div>
              <div class="desc-cell__desc" :title="row.advertiser_id"> {{ row.advertiser_id || '—' }} </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评论层级" prop="level_type" min-width="100">
          <template #default="{ row }">{{ labelOf(LEVEL_TYPE, row.level_type) }}</template>
        </el-table-column>

        <el-table-column label="隐藏状态" prop="hide_status" min-width="100">
          <template #default="{ row }">{{ labelOf(HIDE_STATUS, row.hide_status) }}</template>
        </el-table-column>

        <el-table-column label="评论用户" prop="aweme_name" min-width="200">
          <template #default="{ row }">
            <div class="desc-cell">
              <div class="desc-cell__title" :title="row.aweme_name">{{ row.aweme_name || '—' }}</div>
              <div class="desc-cell__desc" :title="row.aweme_id"> {{ row.aweme_id || '—' }} </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评论时间" prop="create_time" width="150" show-overflow-tooltip />

        <el-table-column label="评论舆情状态" prop="emotion_type" min-width="110">
          <template #default="{ row }">
            <div :class="emotionClass(row.emotion_type)">{{ labelOf(EMOTION_TYPE, row.emotion_type) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="相关回复数" prop="reply_count" min-width="100" show-overflow-tooltip />
        <el-table-column label="点赞数" prop="like_count" min-width="100" />
        <el-table-column label="视频标题" prop="item_title" min-width="200">
          <template #default="{ row }">
            <div class="desc-cell">
              <div class="desc-cell__title" :title="row.item_title">{{ row.item_title || '—' }}</div>
              <div class="desc-cell__desc" :title="row.item_id"> {{ row.item_id || '—' }} </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评论类型" prop="comment_type" width="120">
          <template #default="{ row }">{{ labelOf(COMMENT_TYPE, row.comment_type) }}</template>
        </el-table-column>

        <el-table-column label="评论来源广告" prop="promotion_id" width="120" show-overflow-tooltip />

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.hide_status === 'NOT_HIDE'" link type="primary" size="small" @click="openHide([row])">隐藏</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="cm-empty">暂无数据</div>
        </template>
      </el-table>

      <div class="pager-card cm-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filteredList.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- ③ 同步数据弹窗（线上「同步广告评论」，760px） -->
    <el-dialog v-model="syncVisible" title="同步广告评论" width="760px" class="cl-modal" :close-on-click-modal="false">
      <div class="cm-sync-tip">请选择需要同步广告评论的媒体账户：</div>
      <el-form :model="syncForm" label-width="110px" size="small" class="cm-sync-form">
        <el-form-item label="评论创建时间">
          <el-date-picker
            v-model="syncForm.date"
            type="daterange"
            unlink-panels
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :disabled-date="disabledSyncDate"
          />
        </el-form-item>
      </el-form>
      <div class="cm-transfer">
        <div class="cm-transfer__panel">
          <div class="cm-transfer__hd">
            <span>媒体账户</span>
          </div>
          <div class="cm-transfer__search">
            <el-select v-model="syncAccountField" class="cm-transfer__field" size="small" placeholder="请选择">
              <el-option label="ID" value="id" />
              <el-option label="名称" value="name" />
            </el-select>
            <el-input v-model="syncAccountKeyword" size="small" placeholder="请输入关键词">
              <template #suffix><el-icon><Search /></el-icon></template>
              <template #append>
                <el-button class="cm-search-btn" :icon="Search" @click="syncAccountKeyword = syncAccountKeyword" />
              </template>
            </el-input>
          </div>
          <el-checkbox v-model="syncAllChecked" class="cm-transfer__all" @change="toggleSyncAll">全选</el-checkbox>
          <div class="cm-transfer__list">
            <el-checkbox
              v-for="a in syncAccountList"
              :key="a.value"
              :label="a.value"
              class="cm-transfer__item"
            >{{ a.label }}</el-checkbox>
          </div>
        </div>
        <div class="cm-transfer__panel">
          <div class="cm-transfer__hd">
            <span>已选：{{ syncSelected.length }}/200</span>
            <el-link type="primary" :underline="false" @click="syncSelected = []">清空</el-link>
          </div>
          <div class="cm-transfer__empty">
            <template v-if="!syncSelected.length">暂无数据</template>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="syncVisible = false">取 消</el-button>
            <el-button size="small" type="primary" :loading="syncing" @click="submitSync">
              {{ syncing ? '同步中' : '确 定' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ④ 隐藏确认弹窗（线上 ElMessageBox「隐藏广告评论」） -->
    <el-dialog v-model="hideVisible" title="隐藏广告评论" width="640px" class="cl-modal" :close-on-click-modal="false">
      <div class="cm-hide-msg">隐藏操作不可逆，请确认评论内容无误后继续</div>
      <el-table :data="hideTargets" border size="small" class="cm-hide-table" max-height="440">
        <el-table-column label="媒体账户" prop="advertiser_nick" width="280">
          <template #default="{ row }">
            <div class="desc-cell">
              <div class="desc-cell__title" :title="row.advertiser_nick">{{ row.advertiser_nick || '—' }}</div>
              <div class="desc-cell__desc" :title="row.advertiser_id"> {{ row.advertiser_id || '—' }} </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评论内容" prop="text" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="hideVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitHide">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑤ 后台任务提示弹窗（线上 RedirectTaskDialog） -->
    <el-dialog v-model="taskVisible" width="420px" class="cl-modal cm-task-dialog" :close-on-click-modal="false">
      <h3 class="cm-task__title"><el-icon class="cm-task__icon"><InfoFilled /></el-icon>{{ taskTitle }}</h3>
      <div class="cm-task__body">
        当前操作——<el-link type="primary" :underline="false" @click="taskVisible = false">后台同步任务</el-link>查看{{ taskSubType }}详情，点击
        <el-link type="primary" :underline="false" @click="taskVisible = false">隐藏</el-link>关闭提示
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="taskVisible = false">关闭提示（{{ taskCountdown }}s）</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, MoreFilled, ArrowDown, InfoFilled } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ---------------- 线上枚举（取自智投 /property/toutiao/comments 前端产物） ---------------- */
const HIDE_STATUS = [
  { label: '不限', value: 'ALL' },
  { label: '已隐藏', value: 'HIDE' },
  { label: '未隐藏', value: 'NOT_HIDE' },
];
const EMOTION_TYPE = [
  { label: '不限', value: '' },
  { label: '负面评论', value: 'NEGATIVE' },
  { label: '正面评论', value: 'POSITIVE' },
  { label: '中立评论', value: 'NEUTRAL' },
];
const LEVEL_TYPE = [
  { label: '不限', value: 'LEVEL_ALL' },
  { label: '一级评论', value: 'LEVEL_ONE' },
  { label: '二级评论', value: 'LEVEL_TWO' },
];
const REPLY_STATUS = [
  { label: '不限', value: '' },
  { label: '未回复', value: 0 },
  { label: '已回复', value: 1 },
];
const COMMENT_TYPE = [
  { label: '图片评论', value: 'IMAGE_COMMENT' },
  { label: '图文评论', value: 'IMAGE_TEXT_COMMENT' },
  { label: '文字评论', value: 'TEXT_COMMENT' },
];
const SEARCH_FIELDS = [
  { label: '评论内容', value: 'text' },
  { label: '广告ID', value: 'promotion_id' },
  { label: '广告视频ID', value: 'item_id' },
  { label: '评论用户抖音号', value: 'aweme_id' },
];

function labelOf(list, value) {
  const hit = list.find((x) => x.value === value);
  return hit ? hit.label : '—';
}
function emotionClass(v) {
  if (v === 'POSITIVE') return 'cm-emotion cm-emotion--success';
  if (v === 'NEGATIVE') return 'cm-emotion cm-emotion--danger';
  return 'cm-emotion';
}

/* ---------------- 日期工具 ---------------- */
function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return [fmt(start), fmt(end)];
}

/* ---------------- 查询条件 ---------------- */
/* 线上「隐藏状态 / 评论舆情类型 / 评论层级 / 处理状态」默认不选中，
   显示的是占位文案「不限」；本地同样保持空值，靠占位符呈现「不限」。 */
const query = ref({
  accountIds: [],
  date: defaultDateRange(),
  hideStatus: '',
  emotionType: '',
  levelType: '',
  replyStatus: '',
});
const searchField = ref('text');
const searchKeyword = ref('');
const batchText = ref('');

const currentSearchLabel = computed(
  () => (SEARCH_FIELDS.find((f) => f.value === searchField.value) || SEARCH_FIELDS[0]).label,
);

/* ---------------- 媒体账户（远程搜索 mock） ---------------- */
const ACCOUNTS = [
  { value: '1861811345880074', label: '北京高途云集教育科技有限公司--(1861811345880074)' },
  { value: '1866877399870663', label: '百度文库-央广时代-拉新-搜索-01(1866877399870663)' },
  { value: '1866877399203047', label: '百度文库-央广时代-拉新-搜索-02(1866877399203047)' },
  { value: '1866849651765706', label: '百度文库-央广时代-拉新-搜索-03(1866849651765706)' },
  { value: '1866489873996443', label: '任意门-央广-代运营-36-安卓-UBA(1866489873996443)' },
  { value: '1866489858950211', label: '任意门-央广-代运营-22-安卓-UBA(1866489858950211)' },
  { value: '1866489859578696', label: '任意门-央广-代运营-23-安卓-UBA(1866489859578696)' },
  { value: '1866489860302024', label: '任意门-央广-代运营-10-ios-UBA(1866489860302024)' },
  { value: '1866489860976135', label: '任意门-央广-代运营-25-ios-UBA(1866489860976135)' },
  { value: '1866489864776836', label: '任意门-央广-代运营-30-ios-UBA(1866489864776836)' },
];
const accountKeyword = ref('');
const accountLoading = ref(false);
const accountTotal = computed(
  () => ACCOUNTS.filter((a) => !accountKeyword.value || a.label.includes(accountKeyword.value)).length,
);
const accountOptions = computed(() =>
  ACCOUNTS.filter((a) => !accountKeyword.value || a.label.includes(accountKeyword.value)),
);
function searchAccount(kw) {
  accountLoading.value = true;
  accountKeyword.value = kw || '';
  setTimeout(() => { accountLoading.value = false; }, 120);
}

/* ---------------- 列表 mock（字段口径与线上 /Toutiao/Comment/list 一致） ---------------- */
const COMMENTS = [
  { text: '这个课程有优惠券吗？想了解一下价格', aweme_name: '小仙女本仙', aweme_id: 'douyin_8827361', item_title: '高途考研英语全程班 试听课', item_id: '7301122334455667788', emotion_type: 'POSITIVE', reply_count: 2, like_count: 12, comment_type: 'TEXT_COMMENT' },
  { text: '客服态度太差了，退款申请三天没人处理', aweme_name: '维权小张', aweme_id: 'douyin_9910245', item_title: '高途考研数学冲刺班 报名专场', item_id: '7301122334455667799', emotion_type: 'NEGATIVE', reply_count: 5, like_count: 88, comment_type: 'IMAGE_TEXT_COMMENT' },
  { text: '学车报名链接打不开，有人遇到过吗', aweme_name: '老司机', aweme_id: 'douyin_5532100', item_title: '百度文库 会员月卡 限时特惠', item_id: '7301122334455667801', emotion_type: 'NEUTRAL', reply_count: 0, like_count: 3, comment_type: 'TEXT_COMMENT' },
  { text: '资料很全，已经打印出来了，赞一个', aweme_name: '考研人', aweme_id: 'douyin_6678123', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'POSITIVE', reply_count: 1, like_count: 45, comment_type: 'IMAGE_COMMENT' },
  { text: '买了会员找不到开通入口，垃圾产品', aweme_name: '吐槽君', aweme_id: 'douyin_7781290', item_title: '百度文库 课程资料合集', item_id: '7301122334455667823', emotion_type: 'NEGATIVE', reply_count: 3, like_count: 27, comment_type: 'TEXT_COMMENT' },
  { text: '什么时候开课呀，等不及了', aweme_name: '追课少年', aweme_id: 'douyin_1120398', item_title: '高途考研英语全程班 试听课', item_id: '7301122334455667788', emotion_type: 'NEUTRAL', reply_count: 0, like_count: 6, comment_type: 'TEXT_COMMENT' },
  { text: '老师讲得真好，收藏了', aweme_name: '爱学习的小美', aweme_id: 'douyin_4432098', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'POSITIVE', reply_count: 0, like_count: 31, comment_type: 'TEXT_COMMENT' },
  { text: '下载不了，一直转圈圈', aweme_name: '技术宅小明', aweme_id: 'douyin_5566778', item_title: '百度文库 会员月卡 限时特惠', item_id: '7301122334455667801', emotion_type: 'NEGATIVE', reply_count: 2, like_count: 15, comment_type: 'TEXT_COMMENT' },
  { text: '有没有优惠券可以领', aweme_name: '省钱小能手', aweme_id: 'douyin_2233445', item_title: '高途考研数学冲刺班 报名专场', item_id: '7301122334455667799', emotion_type: 'NEUTRAL', reply_count: 0, like_count: 8, comment_type: 'IMAGE_COMMENT' },
  { text: '资料准确率很高，答案是真的', aweme_name: '上岸的学长', aweme_id: 'douyin_3344556', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'POSITIVE', reply_count: 4, like_count: 120, comment_type: 'TEXT_COMMENT' },
  { text: '广告说得那么好，买了完全不是那么回事', aweme_name: '理性消费者', aweme_id: 'douyin_4455667', item_title: '高途考研英语全程班 试听课', item_id: '7301122334455667788', emotion_type: 'NEGATIVE', reply_count: 6, like_count: 210, comment_type: 'IMAGE_TEXT_COMMENT' },
  { text: '请问有电子版吗？需要打印', aweme_name: '办公达人', aweme_id: 'douyin_5566771', item_title: '百度文库 课程资料合集', item_id: '7301122334455667823', emotion_type: 'NEUTRAL', reply_count: 1, like_count: 9, comment_type: 'TEXT_COMMENT' },
  { text: '客服回复很快，点赞', aweme_name: '好评如潮', aweme_id: 'douyin_6677882', item_title: '高途考研数学冲刺班 报名专场', item_id: '7301122334455667799', emotion_type: 'POSITIVE', reply_count: 0, like_count: 22, comment_type: 'TEXT_COMMENT' },
  { text: '退款流程太复杂了，跑了三趟', aweme_name: '跑腿小王', aweme_id: 'douyin_7788993', item_title: '百度文库 会员月卡 限时特惠', item_id: '7301122334455667801', emotion_type: 'NEGATIVE', reply_count: 2, like_count: 34, comment_type: 'TEXT_COMMENT' },
  { text: '老师讲课幽默风趣，喜欢', aweme_name: '课堂Fans', aweme_id: 'douyin_8899001', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'POSITIVE', reply_count: 0, like_count: 54, comment_type: 'IMAGE_COMMENT' },
  { text: '价格比官网贵一点点，能优化吗', aweme_name: '比价党', aweme_id: 'douyin_9900112', item_title: '高途考研英语全程班 试听课', item_id: '7301122334455667788', emotion_type: 'NEUTRAL', reply_count: 1, like_count: 17, comment_type: 'TEXT_COMMENT' },
  { text: '子评论：确实是垃圾', aweme_name: '路人甲', aweme_id: 'douyin_1011223', item_title: '百度文库 课程资料合集', item_id: '7301122334455667823', emotion_type: 'NEGATIVE', reply_count: 0, like_count: 7, comment_type: 'TEXT_COMMENT' },
  { text: '已经报名，等开课', aweme_name: '准学员', aweme_id: 'douyin_1122334', item_title: '高途考研数学冲刺班 报名专场', item_id: '7301122334455667799', emotion_type: 'POSITIVE', reply_count: 0, like_count: 11, comment_type: 'IMAGE_COMMENT' },
  { text: '有没有优惠活动', aweme_name: '等等党', aweme_id: 'douyin_1233445', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'NEUTRAL', reply_count: 0, like_count: 5, comment_type: 'TEXT_COMMENT' },
  { text: '图片里的资料很清晰，扫描质量高', aweme_name: '扫描爱好者', aweme_id: 'douyin_2344556', item_title: '百度文库 会员月卡 限时特惠', item_id: '7301122334455667801', emotion_type: 'POSITIVE', reply_count: 0, like_count: 19, comment_type: 'IMAGE_COMMENT' },
  { text: '假的，全是骗人的', aweme_name: '愤怒青年', aweme_id: 'douyin_3455667', item_title: '高途考研英语全程班 试听课', item_id: '7301122334455667788', emotion_type: 'NEGATIVE', reply_count: 3, like_count: 66, comment_type: 'TEXT_COMMENT' },
  { text: '资料持续更新，良心商家', aweme_name: '长期用户', aweme_id: 'douyin_4566778', item_title: '百度文库 课程资料合集', item_id: '7301122334455667823', emotion_type: 'POSITIVE', reply_count: 0, like_count: 38, comment_type: 'TEXT_COMMENT' },
  { text: '晚上上课可以吗', aweme_name: '夜猫子', aweme_id: 'douyin_5677889', item_title: '高途考研数学冲刺班 报名专场', item_id: '7301122334455667799', emotion_type: 'NEUTRAL', reply_count: 0, like_count: 4, comment_type: 'TEXT_COMMENT' },
  { text: '真题年份很全，感谢', aweme_name: '上岸预定', aweme_id: 'douyin_6788990', item_title: '高途考研政治押题班', item_id: '7301122334455667812', emotion_type: 'POSITIVE', reply_count: 1, like_count: 73, comment_type: 'IMAGE_TEXT_COMMENT' },
  { text: '下单后没发货，客服也不理', aweme_name: '催单狂魔', aweme_id: 'douyin_7899001', item_title: '百度文库 会员月卡 限时特惠', item_id: '7301122334455667801', emotion_type: 'NEGATIVE', reply_count: 0, like_count: 13, comment_type: 'TEXT_COMMENT' },
  { text: '排版清晰，打印出来效果很好', aweme_name: '强迫症', aweme_id: 'douyin_8900112', item_title: '百度文库 课程资料合集', item_id: '7301122334455667823', emotion_type: 'POSITIVE', reply_count: 0, like_count: 26, comment_type: 'IMAGE_COMMENT' },
];

const list = ref(
  COMMENTS.map((c, i) => {
    const acct = ACCOUNTS[i % ACCOUNTS.length];
    const d = new Date();
    d.setDate(d.getDate() - (i % 6));
    d.setHours(8 + (i % 12), (i * 7) % 60, 0, 0);
    return {
      id: i + 1,
      comment_id: '7309988776655443' + (100 + i),
      text: c.text,
      advertiser_id: acct.value,
      advertiser_nick: acct.label,
      level_type: i % 4 === 0 ? 'LEVEL_TWO' : 'LEVEL_ONE',
      hide_status: i % 5 === 0 ? 'HIDE' : 'NOT_HIDE',
      aweme_name: c.aweme_name,
      aweme_id: c.aweme_id,
      create_time: `${fmt(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
      emotion_type: c.emotion_type,
      reply_count: c.reply_count,
      like_count: c.like_count,
      item_title: c.item_title,
      item_id: c.item_id,
      comment_type: c.comment_type,
      promotion_id: '7001234567890' + (200 + i),
      reply_status: i % 3 === 0 ? 1 : 0,
    };
  }),
);

/* ---------------- 筛选 / 搜索联动 ---------------- */
const filteredList = computed(() => {
  const q = query.value;
  let rows = list.value;

  if (q.accountIds && q.accountIds.length) {
    rows = rows.filter((r) => q.accountIds.indexOf(r.advertiser_id) > -1);
  }
  const [start, end] = q.date || [];
  if (start) rows = rows.filter((r) => r.create_time.slice(0, 10) >= start);
  if (end) rows = rows.filter((r) => r.create_time.slice(0, 10) <= end);
  if (q.hideStatus && q.hideStatus !== 'ALL') rows = rows.filter((r) => r.hide_status === q.hideStatus);
  if (q.emotionType !== '') rows = rows.filter((r) => r.emotion_type === q.emotionType);
  if (q.levelType && q.levelType !== 'LEVEL_ALL') rows = rows.filter((r) => r.level_type === q.levelType);
  if (q.replyStatus !== '') rows = rows.filter((r) => String(r.reply_status) === String(q.replyStatus));

  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => keys.some((k) => String(r[searchField.value] || '').indexOf(k) > -1));
  }
  return rows;
});

const selected = ref([]);
const pageNo = ref(1);
const pageSize = ref(20);

const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => { pageNo.value = 1; });
watch(() => query.value.date, () => { pageNo.value = 1; });

function onFilterChange() { pageNo.value = 1; }
function onSearch() { pageNo.value = 1; }
function onSelectionChange(rows) { selected.value = rows; }
function clearFilters() {
  query.value = {
    accountIds: [],
    date: defaultDateRange(),
    hideStatus: '',
    emotionType: '',
    levelType: '',
    replyStatus: '',
  };
  searchKeyword.value = '';
  batchText.value = '';
  pageNo.value = 1;
  ElMessage.info('已清空筛选条件');
}
function clearBatch() {
  batchText.value = '';
}
function applyBatchSearch() {
  searchKeyword.value = batchText.value;
  pageNo.value = 1;
}

/* ---------------- 批量操作 / 行内操作：隐藏 ---------------- */
const hideVisible = ref(false);
const hideTargets = ref([]);

function openHide(rows) {
  const targets = (rows || []).filter((r) => r.hide_status === 'NOT_HIDE');
  if (!targets.length) {
    ElMessage.warning('请选择未隐藏的评论');
    return;
  }
  hideTargets.value = targets;
  hideVisible.value = true;
}
function onBatchCommand(command) {
  if (command === 'hide') openHide(selected.value);
}
function submitHide() {
  const ids = hideTargets.value.map((r) => r.id);
  list.value = list.value.map((r) => (ids.indexOf(r.id) > -1 ? { ...r, hide_status: 'HIDE' } : r));
  const n = ids.length;
  hideVisible.value = false;
  hideTargets.value = [];
  selected.value = [];
  pageNo.value = 1;
  openTaskDialog(`${n}条广告评论隐藏中`, '隐藏');
}

/* ---------------- 同步数据弹窗 ---------------- */
const syncVisible = ref(false);
const syncing = ref(false);
const syncForm = ref({ date: [] });
const syncAccountField = ref('id');
const syncAccountKeyword = ref('');
const syncSelected = ref([]);
const syncAllChecked = ref(false);

const syncAccountList = computed(() =>
  ACCOUNTS.filter((a) => !syncAccountKeyword.value || a.label.includes(syncAccountKeyword.value)),
);
function disabledSyncDate(d) {
  const t = new Date();
  const end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59).getTime();
  const min = new Date('2021-01-01').getTime();
  const time = d.getTime();
  return time > end || time < min;
}
function toggleSyncAll(v) {
  syncSelected.value = v ? syncAccountList.value.map((a) => a.value) : [];
}
function submitSync() {
  if (!syncSelected.value.length) {
    ElMessage.error('请选择媒体账户');
    return;
  }
  if (!syncForm.value.date || !syncForm.value.date.length) {
    ElMessage.warning('请选择评论创建时间');
    return;
  }
  const [s, e] = syncForm.value.date;
  if (new Date(e) - new Date(s) > 2160 * 60 * 60 * 1000) {
    ElMessage.warning('时间跨度最大三个月，仅支持获取2021-01-01之后的评论');
    return;
  }
  syncing.value = true;
  setTimeout(() => {
    syncing.value = false;
    syncVisible.value = false;
    const n = syncSelected.value.length;
    syncSelected.value = [];
    openTaskDialog(`${n ? `${n}个账户` : '广告评论'}后台同步中`, '同步');
  }, 600);
}

/* ---------------- 后台任务提示弹窗 ---------------- */
const taskVisible = ref(false);
const taskTitle = ref('');
const taskSubType = ref('同步');
const taskCountdown = ref(5);
let taskTimer = null;

function openTaskDialog(title, subType) {
  taskTitle.value = title;
  taskSubType.value = subType;
  taskCountdown.value = 5;
  taskVisible.value = true;
  if (taskTimer) clearInterval(taskTimer);
  taskTimer = setInterval(() => {
    taskCountdown.value -= 1;
    if (taskCountdown.value <= 0) {
      clearInterval(taskTimer);
      taskTimer = null;
      taskVisible.value = false;
    }
  }, 1000);
}
onBeforeUnmount(() => { if (taskTimer) clearInterval(taskTimer); });

onMounted(() => {
  pageNo.value = 1;
});
</script>

<style scoped>
.cm-page { padding: 16px; min-height: 100%; box-sizing: border-box; background: #fff; }

/* ---------- 查询条件（线上 .cl-filter-area，32px 高） ---------- */
.cm-filter-area { padding: 12px 16px 0; background: #fff; }
.cm-filter-area .filter-list { display: flex; flex-wrap: wrap; align-items: center; }
.cm-filter-area .filter-cell {
  display: flex; align-items: center; height: 32px; margin: 0 12px 12px 0; padding: 0 0 0 6px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px; box-sizing: border-box;
}
.cm-filter-area .filter-label { font-size: 12px; color: #666; margin-right: 4px; white-space: nowrap; }
.cm-filter-area .filter-select { flex: 1; min-width: 168px; width: auto; }
.cm-filter-area .filter-select :deep(.el-input__inner) { height: 32px; font-size: 12px; color: #606266; padding-left: 4px; }
.cm-filter-area .filter-select :deep(.el-input__wrapper) { padding-left: 4px; }
.cm-filter-area .cm-date { flex: 1; min-width: 200px; }
.cm-filter-area .cm-date :deep(.el-input__inner) { height: 32px; font-size: 12px; }
.cm-filter-area .cm-date :deep(.el-range-input) { font-size: 12px; color: #606266; }
.cm-filter-area .cm-search-cell { padding: 0; border: 0; }
.cm-filter-area .cm-clear { font-size: 12px; color: #197afb; cursor: pointer; margin: 0 0 12px 4px; line-height: 32px; }

/* 关键词搜索 */
.cm-search { display: flex; align-items: center; height: 32px; }
.cm-search .search-field { width: 120px; flex: none; }
.cm-search .search-field :deep(.el-input__inner) { height: 32px; font-size: 12px; padding-left: 4px; color: #666; }
.cm-search .search-input { flex: 1; min-width: 0; }
.cm-search .search-input :deep(.el-input__inner) { height: 32px; font-size: 12px; padding-right: 34px; }
.cm-search .search-input :deep(.el-input-group__append) { padding: 0; background: #fff; }
.cm-search-btn { width: 40px; height: 32px; border-radius: 0 3px 3px 0; border-left: 0; }
.cm-batch-icon { cursor: pointer; color: #c0c4cc; font-size: 18px; }
.cm-batch-icon:hover { color: #333; }

/* ---------- 表格卡片（线上 .cl-table） ---------- */
.cm-table-card {
  margin: 16px 0; padding: 12px 16px; background: #fff; border-radius: 4px;
}
.cm-toolbar { display: flex; align-items: center; gap: 12px; height: 32px; margin-bottom: 12px; color: #666; font-size: 12px; }
.cm-toolbar .selection { margin-right: 4px; }
.cm-toolbar .text-primary { color: #197afb; }
.cm-table { font-size: 12px; width: 100%; }
.cm-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 48px; padding: 0; }
.cm-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.cm-table :deep(.el-button) { font-size: 12px; }
.cm-table :deep(.el-button.is-link) { margin-left: 0; padding: 0; }
.cm-empty { color: #909399; font-size: 12px; padding: 60px 0; }

.cm-emotion--success { color: #23c23f; }
.cm-emotion--danger { color: #fb1919; }

/* ---------- 分页 ---------- */
.cm-pager { height: 48px; margin-top: 12px; padding: 2px 5px 2px 24px; }
.cm-pager :deep(.el-pagination) { font-size: 12px; }

/* ---------- 同步数据弹窗 ---------- */
.cm-sync-tip { font-size: 14px; color: #333; margin-bottom: 4px; }
.cm-sync-form :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.cm-transfer { display: flex; gap: 16px; margin-top: 4px; }
.cm-transfer__panel {
  flex: 1; height: 360px; border: 1px solid #e8eaec; border-radius: 3px; display: flex; flex-direction: column;
  overflow: hidden; background: #fff;
}
.cm-transfer__hd {
  height: 40px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; background: #fafafa; border-bottom: 1px solid #e8eaec; font-size: 13px; color: #333;
}
.cm-transfer__search { display: flex; gap: 8px; padding: 8px 12px; }
.cm-transfer__field { width: 90px; flex: none; }
.cm-transfer__field :deep(.el-input__inner) { height: 32px; font-size: 12px; }
.cm-transfer__all { padding: 0 12px 6px; font-size: 12px; }
.cm-transfer__list { flex: 1; overflow-y: auto; padding: 0 12px 8px; }
.cm-transfer__item { display: flex; font-size: 12px; color: #606266; height: 30px; }
.cm-transfer__empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 12px; }

/* ---------- 隐藏确认弹窗 ---------- */
.cm-hide-msg { font-size: 13px; color: #606266; margin-bottom: 12px; }
.cm-hide-table { font-size: 12px; width: 100%; }
.cm-hide-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; }
.cm-hide-table :deep(.el-table__cell) { font-size: 12px; color: #606266; }

/* ---------- 后台任务提示 ---------- */
.cm-task__title { font-size: 16px; font-weight: 500; color: #333; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.cm-task__icon { color: #197afb; font-size: 16px; }
.cm-task__body { font-size: 13px; color: #606266; }
</style>
