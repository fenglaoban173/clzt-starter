<template>
  <div class="lp-page">
    <!-- ① 二级页签（线上 cl-minor-nav：橙子落地页模板 / 创量落地页模板 / 橙子落地页 / 程序化落地页组 / 第三方落地页） -->
    <div class="asset-sub-tabs lp-tabs">
      <div
        v-for="t in TABS"
        :key="t"
        class="asset-sub-tab"
        :class="{ active: t === activeTab }"
        @click="switchTab(t)"
      >{{ t }}</div>
    </div>

    <!-- ② 查询条件（线上 form.filter-search-input） -->
    <div class="filter-row lp-filter-row">
      <div class="filter-left">
        <!-- 查询条件（按页签切换，线上实测标签/占位/宽度/选项） -->
        <div v-for="f in tabFilters" :key="f.key" class="filter-cell">
          <label class="filter-label">{{ f.label }}：</label>
          <el-select
            v-model="query[f.key]"
            class="filter-select"
            size="small"
            filterable
            :placeholder="f.placeholder"
            @change="onFilterChange"
          >
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
          <el-icon class="lp-icon-close" title="清空" @click="clearFilter(f.key)"><Close /></el-icon>
        </div>

        <!-- 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索气泡 + 🔍 -->
        <div class="lp-search">
          <el-select v-model="searchField" class="lp-search-field" size="small" placeholder="请选择">
            <el-option v-for="f in tabSearchFields" :key="f" :label="f" :value="f" />
          </el-select>
          <el-input
            v-model="keyword"
            class="lp-search-input"
            size="small"
            clearable
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix>
              <el-popover
                placement="bottom-end"
                :width="640"
                trigger="click"
                popper-class="lp-batch-popper"
              >
                <template #reference>
                  <span class="lp-batch-icon" title="批量搜索">
                    <svg
                      viewBox="0 0 1024 1024" version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      width="1em" height="1em"
                    >
                      <path
                        d="M881.4 250.9H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h739.9c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM272.1 454H141.5c-23.9 0-43.5-19.6-43.5-43.5S117.6 367 141.5 367h130.6c23.9 0 43.5 19.6 43.5 43.5S296 454 272.1 454zM272.1 657.1H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 657.1 272.1 657.1zM853.8 847.5L715.3 709c-16.9-16.9-16.9-44.6 0-61.5s44.6-16.9 61.5 0L915.3 786c16.9 16.9 16.9 44.6 0 61.5s-44.6 16.9-61.5 0zM467.9 860.2H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h326.4c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </template>
                <div class="lp-batch">
                  <div class="lp-batch__head">
                    <span class="lp-batch__title">请输入名称（{{ batchText.length }}/1000）</span>
                    <el-button link type="primary" size="small" @click="batchText = ''">清空</el-button>
                  </div>
                  <div class="lp-batch__tips">
                    每一行为一个关键词，批量搜索将执行
                    <el-popover placement="right" :width="400" trigger="hover">
                      <template #reference>
                        <a class="lp-batch__link">精确匹配</a>
                      </template>
                      <div class="lp-batch__pop-title">精准匹配</div>
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
                    <el-button size="small" plain @click="batchText = ''">清空</el-button>
                    <el-button size="small" type="primary" @click="onBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
          </el-input>
          <el-button class="lp-search-btn" title="搜索" @click="onSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </div>

        <a class="filter-clear" @click="onClearFilters">清空</a>
      </div>

      <!-- 线上筛选区右侧「设置」（列设置） -->
      <div class="filter-right">
        <el-popover
          placement="bottom-end"
          :width="220"
          trigger="click"
          popper-class="lp-setting-popper"
        >
          <template #reference>
            <el-button size="small" class="tool-btn lp-setting-btn">设置</el-button>
          </template>
          <div class="lp-setting__title">显示列</div>
          <el-checkbox-group v-model="visibleColProps" class="lp-setting__list">
            <el-checkbox
              v-for="c in currentColumns"
              :key="c.prop"
              :value="c.prop"
              :disabled="c.prop === 'action'"
            >{{ c.label }}</el-checkbox>
          </el-checkbox-group>
        </el-popover>
      </div>
    </div>

    <!-- ③ 功能按钮条（线上 .table-toolbar，按页签切换） -->
    <div class="table-toolbar">
      <el-button
        v-for="b in tabButtons"
        :key="b.key"
        :type="b.plain ? 'default' : 'primary'"
        :plain="!!b.plain"
        size="small"
        class="tool-btn lp-create-btn"
        :style="{ width: b.width + 'px' }"
        @click="onToolbarButton(b)"
      >
        <el-icon class="lp-create-btn__icon"><Plus /></el-icon>{{ b.text }}
      </el-button>
    </div>

    <!-- ④ 列表（线上 el-table--border，8 列、无分页） -->
    <el-table
      :data="displayRows"
      border
      class="asset-table"
      empty-text="暂无数据"
      :style="{ '--row-pad': activeTab === '橙子落地页' ? '30px' : '8px' }"
    >
      <el-table-column
        v-if="tabCfg.selection"
        type="selection"
        :width="tabCfg.selectionWidth || 60"
        fixed="left"
        align="center"
      />
      <el-table-column
        v-for="col in shownColumns"
        :key="col.prop"
        :label="col.label"
        :min-width="col.width"
        :fixed="col.fixed || false"
        :align="col.align || 'left'"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div v-if="col.desc" class="desc-cell">
            <div class="desc-cell__title">
              <a class="lp-link" @click="onOpenLanding(row)">{{ row[col.prop] }}</a>
            </div>
            <div class="desc-cell__desc">ID：{{ row.lpId }}</div>
          </div>

          <div v-else-if="col.prop === 'action'" class="lp-ops">
            <el-button
              v-for="op in tabCfg.rowActions || []"
              :key="op"
              link
              type="primary"
              size="small"
              @click="onRowAction(op, row)"
            >{{ op }}</el-button>
          </div>

          <span v-else-if="col.prop === 'account'">{{ nickOf(row.account) }}</span>
          <span v-else-if="col.prop === 'owner'">{{ nameOf(row.owner) }}</span>
          <span v-else-if="col.prop === 'creator'">{{ nameOf(row.creator) }}</span>

          <a
            v-else-if="col.link"
            class="lp-link"
            :href="row[col.prop]"
            target="_blank"
            rel="noopener"
          >{{ row[col.prop] }}</a>

          <a
            v-else-if="col.prop === 'url'"
            class="lp-link"
            :href="row.url"
            target="_blank"
            rel="noopener"
          >{{ row.url }}</a>

          <span v-else>{{ row[col.prop] }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- ⑤ 新建落地页模板 弹窗（线上 el-dialog，标题「新建落地页模板」、宽 526px） -->
    <el-dialog
      v-model="createVisible"
      title="新建落地页模板"
      width="526px"
      top="15vh"
      :close-on-click-modal="false"
      header-class="lp-dialog-header"
      body-class="lp-dialog-body"
      footer-class="lp-dialog-footer"
      append-to-body
    >
      <div class="lp-dialog-inner">
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-width="144px"
          label-position="left"
          class="lp-dialog-form"
        >
          <el-form-item label="模板类型" prop="templateType" required>
            <el-radio-group v-model="createForm.templateType" size="small">
              <el-radio-button v-for="t in TEMPLATE_TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="媒体账户" prop="account" required>
            <el-select
              v-model="createForm.account"
              class="lp-dialog-select"
              size="small"
              filterable
              placeholder="请选择媒体账户"
            >
              <el-option v-for="a in ACCOUNT_OPTIONS" :key="a" :label="a" :value="a" />
            </el-select>
          </el-form-item>

          <el-form-item label="选择落地页" prop="pages" required>
            <div class="lp-transfer">
              <div class="lp-transfer__left">
                <div class="lp-transfer__head">
                  <span class="lp-transfer__head-text">落地页名称</span>
                  <el-checkbox
                    v-model="allChecked"
                    :indeterminate="allIndeterminate"
                    :disabled="maxReached"
                    @change="toggleAll"
                  >全选</el-checkbox>
                </div>
                <div class="lp-transfer__search">
                  <el-input
                    v-model="lpKeyword"
                    size="small"
                    clearable
                    placeholder="请输入关键词"
                    :prefix-icon="Search"
                    @input="onLpSearch"
                  />
                </div>
                <div class="lp-transfer__list">
                  <el-checkbox-group v-model="createForm.pages">
                    <el-checkbox
                      v-for="p in pageItems"
                      :key="p"
                      :value="p"
                      :disabled="maxReached && !createForm.pages.includes(p)"
                      class="lp-transfer__item"
                    >{{ p }}</el-checkbox>
                  </el-checkbox-group>
                  <div v-if="!pageItems.length" class="lp-transfer__none">暂无数据</div>
                </div>
                <div class="lp-transfer__pager">
                  <el-pagination
                    v-model:current-page="lpPage"
                    :page-size="LP_PAGE_SIZE"
                    :total="filteredLandingPages.length"
                    layout="prev, pager, next"
                    size="small"
                  />
                </div>
              </div>

              <div class="lp-transfer__right">
                <div class="lp-transfer__head">
                  <span class="lp-transfer__head-text">已选：{{ createForm.pages.length }}/{{ MAX_PICK }}</span>
                  <a class="lp-transfer__clear" @click="clearPicked">清空</a>
                </div>
                <div class="lp-transfer__list">
                  <div v-for="p in createForm.pages" :key="p" class="lp-transfer__picked">
                    <span class="lp-transfer__label" :title="p">{{ p }}</span>
                    <el-icon class="lp-transfer__remove" @click="removePicked(p)"><Close /></el-icon>
                  </div>
                  <div v-if="!createForm.pages.length" class="lp-transfer__none">暂无数据</div>
                </div>
              </div>
            </div>
            <div class="lp-transfer__tip">仅支持审核中和已上线状态的落地页存为模板</div>
          </el-form-item>

          <el-form-item label="头条落地页模板名称" prop="name" required>
            <el-input
              v-model="createForm.name"
              class="lp-dialog-input"
              size="small"
              @input="onNameInput"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer lp-dialog-footer-ops">
          <el-button plain @click="createVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitCreate">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑥ 批量导入落地页 弹窗（线上 el-dialog「导入第三方落地页」，宽 800px，4 字段） -->
    <el-dialog
      v-model="importVisible"
      title="导入第三方落地页"
      width="800px"
      top="15vh"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="importForm" label-width="150px" label-position="right" class="lp-dialog-form">
        <el-form-item label="产品">
          <el-select
            v-model="importForm.product"
            class="lp-dialog-select"
            size="small"
            placeholder="请选择创量产品"
          >
            <el-option v-for="p in LP_PRODUCT_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>

        <el-form-item label="直达链接生成方式">
          <el-radio-group v-model="importForm.linkWay" size="small">
            <el-radio-button value="手动填写">手动填写</el-radio-button>
            <el-radio-button value="自动生成">自动生成</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="获取模板">
          <el-input v-model="importForm.template" size="small" placeholder="请输入模板地址" />
        </el-form-item>

        <el-form-item label="导入文件">
          <el-input v-model="importForm.file" size="small" placeholder="请粘贴或选择落地页文件地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" @click="importVisible = false">取消</el-button>
          <el-button size="small" type="primary" @click="onImportSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Plus, Search } from '@element-plus/icons-vue';
import './landing_page.css';

/* ------------------------------------------------------------------ *
 * 创量标准版「巨量广告·标准 → 资产 → 落地页」
 * 线上：https://cl.mobgi.com/property/toutiao/landingpage/toutiaoTemplate
 *   - 页面无标题条，直接是 5 个二级页签
 *   - 筛选：媒体账户（占位「所有账户」）、所属人员（占位「全部」），右侧「设置」
 *   - 搜索：字段类型下拉（占位「请选择」，选项 名称 / ID）+ 关键词输入（占位「请输入关键词」）
 *   - 工具栏只有「新建模板」（primary），无批量操作
 *   - 列表 8 列：落地页/模板名称/媒体账户/所属人员/创建时间/关联广告数/生成落地页数/操作
 *   - 线上无数据、无分页
 *   - 新建面板是 el-dialog（宽 800px，标题「新建模板」）：媒体账户(select 必填) /
 *     选择落地页(checkbox 必填，左列表 + 右已选，最多 1 个) / 头条落地页模板名称(text 必填)
 * ------------------------------------------------------------------ */

defineProps({ kind: { type: String, default: '' } });

/* ------------------------------ 线上常量 ------------------------------ */

/** 模板类型（线上「新建落地页模板」弹窗 4 项） */
const TEMPLATE_TYPES = ['应用下载', '微信小程序', '微信小游戏', '抖音小程序/小游戏'];
/** 橙子落地页「状态」（线上 5 项） */
const LP_STATUS_OPTIONS = ['全部状态', '已上线', '已下线', '审核不通过', '删除或者禁止'];
/** 橙子落地页「合法状态」（线上 3 项） */
const LP_LEGAL_OPTIONS = ['不限', '不合法', '合法'];
/** 程序化落地页组「状态」（线上 2 项） */
const GROUP_STATUS_OPTIONS = ['可用', '不可用'];
/** 第三方落地页「产品」（线上 2 项） */
const LP_PRODUCT_OPTIONS = ['测试商品', '测试安卓应用(android)'];
/** 第三方落地页「创量项目」（线上 4 项） */
const LP_PROJECT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

/** 媒体账户下拉（线上 20 个账户） */
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

/** 所属人员下拉（线上 15 个人员） */
const OWNER_OPTIONS = [
  '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)',
  '张从浩 (zhangconghao@ygsdmedia.com)',
  '王春雷 (wangchunlei@ygsdmedia.com)',
  '郭峻宇 (guojunyu@ygsdmedia.com)',
  '孙诗源 (sunshiyuan@ygsdmedia.com)',
  'gongwenqing (gongwenqing@ygsdmedia.com)',
  'lixue (lixue@ygsdmedia.com)',
  'jiangxin (jiangxin@ygsdmedia.com)',
  'chenpeihua (chenpeihua@ygsdmedia.com)',
  '1304275504 (1304275504@qq.com)',
  '文清滨 (wenqingbin@ygsdmedia.com)',
  '李若涵 (liruohan@ygsdmedia.com)',
  '杨浩蒙 (yanghaomeng@ygsdmedia.com)',
  '刘松涵 (liusonghan01@ygsdmedia.com)',
  '申旭阳 (shenxuyang@ygsdmedia.com)',
];

/** 新建模板弹窗左侧「落地页名称」可选项（线上采集到的落地页清单） */
const LANDING_PAGE_OPTIONS = [
  '夏晚情长', '执手同往', '柔情岁言', '非羽知意', '执手错付', '寒风雪孤', '余温重拾',
  '别时逢期', '飘散往烟', '阳落无声', '爱恨消长', '乌龙孕缘', '音信恶意', '清算前尘',
  '心满言语', '虚恋险境', '笔记周正', '青涩野心', '识微立我', '低调大神', '败局逆袭',
  '抱暖残心', '醋坛丈夫', '街采诛心-亿玛-安卓-她的五年回信', '沫染清澜', '心为情锁',
  '素影迎风', '棋落反杀', '爱拳崭现', '踏浪观峰', '京华粤韵',
  '寿诞逆愿-亿玛-安卓-白眼狼儿子被我重生打脸', '一语戳破-亿玛-安卓-五年回信',
  '怀安凉薄-亿玛-安卓-醒时又是今年春', '侯府欺弱-亿玛-安卓-菩萨蛮',
  '替死惊婚-亿玛-安卓-迟来深情', '香臭择偶-亿玛-安卓-室友非要靠体味筛选真爱',
  '发间惊魂-亿玛-安卓-我在离婚综艺换乘恋爱', '画像锁情-亿玛-安卓-戒断反应',
  '炮灰躺枪-亿玛-安卓-明月永不坠落', '魔佛相吸-亿玛-安卓-诱心',
  '旧账翻车-亿玛-安卓-魔童女儿在综艺上说我家庭霸凌', '哑骑疑云-亿玛-安卓-我靠弹幕在绝命倒计时中逃生',
  '撒娇反噬-亿玛-安卓-踮起脚尖靠近太阳', '嗤笑撞破-亿玛-安卓-断崖式分手',
  '牌桌炫富-亿玛-安卓-堂哥押宝马', '家门立威-亿玛-安卓-嫂子怀孕，全家后悔',
  '管钱之争-亿玛-安卓-年终没攒下钱，婆婆夺走工资卡',
  '嫡妻对峙-亿玛-安卓-我是宅斗文里落败的穿越女',
  '档案择选-亿玛-安卓-暧昧八年，我提离职老板又破防',
  '预算翻车-亿玛-安卓-实习生在坟地给公司办年会', '小姑之殇-亿玛-安卓-月华重生',
  '红妆尽索-亿玛-安卓-十里红妆一别梦', '短发封心-亿玛-安卓-同淋雪',
  '家宅恶斗-亿玛-安卓-爸妈离婚后', '饿晕重生-亿玛-安卓-爸妈AA制生活费',
  '酒局玩火-亿玛-安卓-她眼里的光消散', '车祸钱局-亿玛-安卓-和男友的攒钱小荷包',
  '外婆强势-亿玛-安卓-幸福迟到了五十年', '凤冠典当-亿玛-安卓-和离后，我亲手送渣夫流放',
  '清白反杀-亿玛-安卓-穿成恶毒女配，但更恶毒', '平妻之诏-亿玛-安卓-宛乐今衍',
  '偏航失约', '财路迷途', '慢煮朝夕', '柔肩扛义', '炽爱悲歌', '澳城奇遇', '少时偕行',
  '纸鸢系情', '冬日遇暖', '屿上守望', '物欲叩问', '物业困局', '食语藏情', '温软情潮',
  '湘水寄情', '隔腹相守', '陌生帅诈-亿玛-安卓-被系统绑架的我',
  '肤色暗涌-亿玛-安卓-恋爱游戏', '善举绑架-亿玛-安卓-名分之外',
  '生意捆绑-亿玛-安卓-好兄弟和他的自卑女友', '医妈歪理-亿玛-安卓-我妈挨打了',
  '心机抢嫁-亿玛-安卓-脱敏式分手', '顺手得子-亿玛-安卓-怀瑾',
  '稚子怼人-亿玛-安卓-我怀念的', '妆毁婚散-亿玛-安卓-想抢婚的化妆师',
  '血泊忏悔-亿玛-安卓-暴力式钟情', '嘉裴之辩-亿玛-安卓-脱敏性复合',
  '学姐点醒-亿玛-安卓-横扫恶意，找回自我',
  '暗示免疫-亿玛-安卓-保胎的我意外成了公司团宠', '死心之悟-亿玛-安卓-但问君心',
  '嫂代弟婚-亿玛-安卓-夫君，我是你嫂嫂啊',
  '家宴惊女-亿玛-安卓-谁才是我女儿的亲爸爸？',
  '捧花逼宫-亿玛-安卓-竹马婚礼上我被新娘指着骂汉子茶',
  '追妻恐慌-亿玛-安卓-嫁给一个傲娇', '养兄囚心-亿玛-安卓-周沫',
  '带球侯门-亿玛-安卓-我是宅斗文里落败的穿越女',
  '造梦撩拨-亿玛-安卓-男主怎么争做炮灰舔狗啊',
  '短信急报-亿玛-安卓-愚人节没了妈',
];

/* ------------------------------ 页签 / 列定义 ------------------------------ */

const TABS = [
  '橙子落地页模板',
  '创量落地页模板',
  '橙子落地页',
  '程序化落地页组',
  '第三方落地页',
];

/** 各页签的查询条件（线上实测：标签 / 占位 / 宽度 169px / 选项全文） */
const TAB_FILTERS = {
  橙子落地页模板: [
    { key: 'account', label: '媒体账户', placeholder: '所有账户', options: ACCOUNT_OPTIONS },
    { key: 'owner', label: '所属人员', placeholder: '全部', options: OWNER_OPTIONS },
  ],
  创量落地页模板: [
    { key: 'templateType', label: '模板类型', placeholder: '所有模板类型', options: TEMPLATE_TYPES },
    { key: 'owner', label: '所属人员', placeholder: '全部', options: OWNER_OPTIONS },
  ],
  橙子落地页: [
    { key: 'account', label: '媒体账户', placeholder: '所有账户', options: ACCOUNT_OPTIONS },
    { key: 'status', label: '状态', placeholder: '请选择状态', options: LP_STATUS_OPTIONS },
    { key: 'legalStatus', label: '合法状态', placeholder: '请选择合法状态', options: LP_LEGAL_OPTIONS },
  ],
  程序化落地页组: [
    { key: 'account', label: '媒体账户', placeholder: '所有账户', options: ACCOUNT_OPTIONS },
    { key: 'status', label: '状态', placeholder: '请选择状态', options: GROUP_STATUS_OPTIONS },
  ],
  第三方落地页: [
    { key: 'account', label: '媒体账户', placeholder: '所有账户', options: ACCOUNT_OPTIONS },
    { key: 'creator', label: '创建人员', placeholder: '全部', options: OWNER_OPTIONS },
    { key: 'product', label: '产品', placeholder: '不限', options: LP_PRODUCT_OPTIONS },
    { key: 'project', label: '智投项目', placeholder: '全部', options: LP_PROJECT_OPTIONS },
  ],
};

/** 各页签的搜索「字段类型」下拉（线上实测） */
const TAB_SEARCH_FIELDS = {
  橙子落地页模板: ['名称', 'ID'],
  创量落地页模板: ['名称', 'ID'],
  橙子落地页: ['名称', 'ID', '路径参数', '备注'],
  程序化落地页组: ['名称', '组ID'],
  第三方落地页: ['名称', 'ID'],
};

/** 各页签的工具栏按钮（线上实测）：随页签切换 */
const TAB_BUTTONS = {
  橙子落地页模板: [{ key: 'create', text: '新建模板', width: 120 }],
  创量落地页模板: [{ key: 'create', text: '新建模板', width: 120 }],
  橙子落地页: [
    { key: 'syncAsset', text: '同步落地页资产', plain: true, width: 116 },
    { key: 'create', text: '新建落地页', width: 120 },
    { key: 'useTemplate', text: '使用模板新建', width: 125 },
  ],
  程序化落地页组: [{ key: 'syncGroup', text: '同步落地页组', width: 104 }],
  第三方落地页: [
    { key: 'create', text: '新建落地页', width: 120 },
    { key: 'import', text: '批量导入落地页', width: 133 },
    { key: 'sync', text: '同步落地页', width: 120 },
  ],
};

/** 各页签的列定义与新建按钮文案（切页签后列/数据会变化） */
const TAB_CONFIG = {
  橙子落地页模板: {
    createText: '新建模板',
    columns: [
      { prop: 'landing', label: '落地页', width: 142, desc: true },
      { prop: 'template', label: '模板名称', width: 135 },
      { prop: 'account', label: '媒体账户', width: 135 },
      { prop: 'owner', label: '所属人员', width: 135 },
      { prop: 'createdAt', label: '创建时间', width: 135 },
      { prop: 'adCount', label: '关联广告数', width: 135 },
      { prop: 'lpCount', label: '生成落地页数', width: 135 },
      { prop: 'action', label: '操作', width: 135, align: 'center' },
    ],
  },
  创量落地页模板: {
    createText: '新建模板',
    selection: true,
    columns: [
      { prop: 'template', label: '模板名称', width: 194 },
      { prop: 'templateType', label: '模板类型', width: 191 },
      { prop: 'owner', label: '所属人员', width: 191 },
      { prop: 'createdAt', label: '创建时间', width: 191 },
      { prop: 'action', label: '操作', width: 260, align: 'center' },
    ],
  },
  橙子落地页: {
    createText: '新建落地页',
    selection: true,
    rowActions: ['预览', '转赠', '存为模板'],
    columns: [
      { prop: 'landing', label: '落地页', width: 900 },
      { prop: 'status', label: '状态', width: 100 },
      { prop: 'source', label: '来源', width: 100 },
      { prop: 'remark', label: '备注', width: 180 },
      { prop: 'pathParams', label: '路径参数', width: 280 },
      { prop: 'account', label: '媒体账户', width: 140 },
      { prop: 'action', label: '操作', width: 200, align: 'center' },
    ],
  },
  程序化落地页组: {
    createText: '新建落地页组',
    columns: [
      { prop: 'group', label: '落地页组名称', width: 300 },
      { prop: 'groupId', label: '组ID', width: 140 },
      { prop: 'assetId', label: '资产ID', width: 140 },
      { prop: 'deliveryLink', label: '投放链接', width: 300, link: true },
      { prop: 'assignType', label: '分配方式', width: 100 },
      { prop: 'status', label: '状态', width: 100 },
      { prop: 'lpCount', label: '落地页数', width: 100 },
      { prop: 'adCount', label: '关联广告数', width: 100 },
      { prop: 'action', label: '操作', width: 100, align: 'center' },
    ],
  },
  第三方落地页: {
    createText: '新建落地页',
    selection: true,
    selectionWidth: 56,
    rowActions: ['预览', '编辑', '复制', '删除'],
    columns: [
      { prop: 'landing', label: '落地页名称', width: 180, fixed: true },
      { prop: 'remark', label: '落地页备注', width: 120 },
      { prop: 'useStatus', label: '使用状态', width: 90, align: 'center' },
      { prop: 'action', label: '操作', width: 180, align: 'center' },
      { prop: 'id', label: 'ID', width: 120 },
      { prop: 'product', label: '产品', width: 120 },
      { prop: 'url', label: '落地页链接', width: 180, link: true },
      { prop: 'touchLink', label: '有效触点链接', width: 180, link: true },
      { prop: 'deeplink', label: 'Deeplink直达链接', width: 180 },
      { prop: 'ulink', label: 'Ulink直达链接', width: 180 },
      { prop: 'miniAppid', label: '字节小程序/小游戏APPID', width: 180 },
      { prop: 'miniLink', label: '字节小程序/小游戏链接', width: 180 },
      { prop: 'miniLaunchPage', label: '字节小程序/小游戏启动页面', width: 180 },
      { prop: 'miniLaunchParams', label: '字节小程序/小游戏启动参数', width: 180 },
      { prop: 'account', label: '媒体账户', width: 180 },
      { prop: 'creator', label: '创建人员', width: 120 },
      { prop: 'createdAt', label: '创建时间', width: 160 },
      { prop: 'adCount', label: '关联广告数', width: 100 },
    ],
  },
};

/* ------------------------------ mock 数据 ------------------------------ */

/** 各页签的 mock 列表（线上该页无数据，这里按业务补 mock 以便验证交互） */
function buildRows(tab) {
  const rows = [];
  for (let i = 0; i < 12; i += 1) {
    const landing = LANDING_PAGE_OPTIONS[(i * 7) % LANDING_PAGE_OPTIONS.length];
    const account = ACCOUNT_OPTIONS[(i * 3) % ACCOUNT_OPTIONS.length];
    const owner = OWNER_OPTIONS[(i * 5) % OWNER_OPTIONS.length];
    const lpId = 1869000000000000 + i * 137;
    rows.push({
      id: 1870000000000000 + i * 137,
      landing,
      lpId,
      template: `${landing}-模板${String(i + 1).padStart(2, '0')}`,
      group: `${landing}-落地页组${String(i + 1).padStart(2, '0')}`,
      groupId: 1869000000000000 + i * 137,
      assetId: 1868000000000000 + i * 211,
      account,
      owner,
      creator: owner,
      createdAt: `2024-0${(i % 9) + 1}-${String((i * 3) % 28 + 1).padStart(2, '0')} ${String((i * 7) % 24).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
      adCount: 12 + i * 7,
      lpCount: 3 + i * 2,
      status: i % 3 === 0 ? '已上线' : '审核中',
      useStatus: i % 2 === 0 ? '已使用' : '未使用',
      source: i % 2 === 0 ? '橙子建站' : '创量建站',
      remark: `落地页备注${String(i + 1).padStart(2, '0')}`,
      pathParams: `?id=${lpId}&from=clzt`,
      assignType: i % 2 === 0 ? '手动分配' : '自动分配',
      templateType: ['应用下载', '微信小程序', '微信小游戏', '抖音小程序/小游戏'][i % 4],
      product: ['测试商品', '测试安卓应用(android)'][i % 2],
      url: `https://lp.mobgi.com/${lpId}`,
      deliveryLink: `https://lp.mobgi.com/group/${1869000000000000 + i * 137}`,
      touchLink: `https://lp.mobgi.com/touch/${lpId}`,
      deeplink: `clzt://lp/${lpId}`,
      ulink: `https://u.mobgi.com/lp/${lpId}`,
      miniAppid: `wx${1867000000000000 + i * 137}`,
      miniLink: `https://mini.mobgi.com/app/${lpId}`,
      miniLaunchPage: 'pages/index/index',
      miniLaunchParams: `lpId=${lpId}`,
      tab,
    });
  }
  return rows;
}

const ROWS = {};
TABS.forEach((t) => { ROWS[t] = buildRows(t); });

/* ------------------------------ 状态 ------------------------------ */

const activeTab = ref(TABS[0]);
const query = ref({
  account: '', owner: '', templateType: '', status: '', legalStatus: '', creator: '', product: '', project: '',
});
/** 线上搜索框默认选中「名称」（占位文案「请选择」仅在未选中时显示）；
 *  下拉项与线上同为中文标签，这里映射到内部字段名 */
const SEARCH_FIELD_MAP = {
  名称: 'name', ID: 'id', 路径参数: 'pathParams', 备注: 'remark', 组ID: 'groupId',
};
const searchField = ref('名称');
const keyword = ref('');
const batchText = ref('');
/** 「设置」里勾选的列（默认全选） */
const visibleColProps = ref(TAB_CONFIG[TABS[0]].columns.map((c) => c.prop));

/** 媒体账户 nick（去掉括号里的 ID） */
function nickOf(full) {
  return String(full || '').split('(')[0];
}

/** 所属人员姓名（去掉邮箱） */
function nameOf(full) {
  return String(full || '').split('(')[0].trim();
}

/* ------------------------------ 计算 ------------------------------ */

const currentColumns = computed(() => TAB_CONFIG[activeTab.value].columns);
const createText = computed(() => TAB_CONFIG[activeTab.value].createText);
/** 当前页签配置（列设置 / 复选框列 / 行内操作都按页签走） */
const tabCfg = computed(() => TAB_CONFIG[activeTab.value]);
/** 当前页签的工具栏按钮 */
const tabButtons = computed(() => TAB_BUTTONS[activeTab.value] || []);
/** 当前页签的查询条件 / 搜索字段类型 */
const tabFilters = computed(() => TAB_FILTERS[activeTab.value] || []);
const tabSearchFields = computed(() => TAB_SEARCH_FIELDS[activeTab.value] || ['名称', 'ID']);
/** 清空单个筛选项 */
function clearFilter(key) {
  query.value[key] = '';
  onFilterChange();
}
/** 工具栏按钮点击（新建类打开弹窗，其余原型提示） */
function onToolbarButton(b) {
  if (b.key === 'create') { openCreate(); return; }
  if (b.key === 'import') { importVisible.value = true; return; }
  ElMessage.info(`原型：${b.text}`);
}

/* ---------- 批量导入落地页（线上 el-dialog「导入第三方落地页」，宽 800px，4 字段） ---------- */
const importVisible = ref(false);
const importForm = ref({ product: '', linkWay: '手动填写', template: '', file: '' });
function onImportSubmit() {
  importVisible.value = false;
  ElMessage.success('原型：已提交导入第三方落地页');
}

const shownColumns = computed(() => {
  const cols = currentColumns.value;
  if (!visibleColProps.value.length) return cols;
  return cols.filter((c) => visibleColProps.value.indexOf(c.prop) > -1 || c.prop === 'action');
});

/** 关键词过滤后的列表（先按筛选条件，再按关键词） */
const filteredRows = computed(() => {
  let rows = ROWS[activeTab.value] || [];
  const acc = query.value.account;
  if (acc) rows = rows.filter((r) => r.account === acc);
  const owner = query.value.owner;
  if (owner) rows = rows.filter((r) => r.owner === owner);
  const creator = query.value.creator;
  if (creator) rows = rows.filter((r) => r.creator === creator);
  const product = query.value.product;
  if (product) rows = rows.filter((r) => r.product === product);
  const project = query.value.project;
  if (project) rows = rows.filter((r) => r.project === project);
  const status = query.value.status;
  if (status) rows = rows.filter((r) => r.status === status);
  const kw = keyword.value.trim();
  if (kw) {
    const keys = kw.split(',').map((s) => s.trim()).filter(Boolean);
    const field = SEARCH_FIELD_MAP[searchField.value] || 'name';
    rows = rows.filter((r) => {
      if (field === 'id' || field === 'groupId') {
        return keys.some((k) => String(r.lpId).indexOf(k) > -1 || String(r.id).indexOf(k) > -1
          || String(r.groupId).indexOf(k) > -1);
      }
      if (field === 'pathParams') {
        return keys.some((k) => String(r.pathParams).indexOf(k) > -1);
      }
      if (field === 'remark') {
        return keys.some((k) => String(r.remark).indexOf(k) > -1);
      }
      return keys.some(
        (k) => String(r.landing).indexOf(k) > -1 || String(r.template).indexOf(k) > -1,
      );
    });
  }
  return rows;
});

const displayRows = computed(() => filteredRows.value);

/* ------------------------------ 方法 ------------------------------ */

/** 切换二级页签：列 / 数据 / 按钮文案随之变化 */
function switchTab(tab) {
  if (tab === activeTab.value) return;
  activeTab.value = tab;
  visibleColProps.value = TAB_CONFIG[tab].columns.map((c) => c.prop);
  keyword.value = '';
  searchField.value = '名称';
}

function onFilterChange() {
  /* 线上即时过滤，无分页 */
}

function clearAccount() {
  query.value.account = '';
  onFilterChange();
}

function clearOwner() {
  query.value.owner = '';
  onFilterChange();
}

function onSearch() {
  onFilterChange();
}

function onBatchSearch() {
  const keys = batchText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) { ElMessage.warning('请输入关键词'); return; }
  keyword.value = keys.join(',');
  searchField.value = '名称';
  onSearch();
  ElMessage.success(`已按 ${keys.length} 个关键词批量搜索`);
}

/** 「清空」：重置筛选 + 搜索 */
function onClearFilters() {
  query.value = {
    account: '', owner: '', templateType: '', status: '', legalStatus: '', creator: '', product: '', project: '',
  };
  searchField.value = '名称';
  keyword.value = '';
  batchText.value = '';
  onFilterChange();
}

function onOpenLanding(row) {
  ElMessage.info(`打开落地页：${row.landing}`);
}

function onView(row) {
  ElMessage.info(`查看模板：${row.template}`);
}

/** 行内操作（线上各页签不同：橙子落地页=预览/转赠/存为模板，第三方落地页=预览/编辑/复制/删除） */
function onRowAction(op, row) {
  const map = { 预览: onView, 编辑: onEdit, 删除: onDelete };
  if (map[op]) { map[op](row); return; }
  ElMessage.info(`${op}：${row.landing || row.group || row.template}`);
}

function onEdit(row) {
  ElMessage.info(`编辑模板：${row.template}`);
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cl-message-box--mini',
    });
  } catch (e) {
    return;
  }
  ElMessage.success('删除成功');
}

/* ------------------------------ 新建模板 弹窗 ------------------------------ */

/** 线上「已选：0/1」→ 最多只能选 1 个落地页 */
const MAX_PICK = 1;
/** 左侧列表每页 10 条 */
const LP_PAGE_SIZE = 10;

const createVisible = ref(false);
const createFormRef = ref();
const createForm = ref({ templateType: '应用下载', account: '', pages: [], name: '' });
const lpKeyword = ref('');
const lpPage = ref(1);
const allChecked = ref(false);

const createRules = {
  account: [{ required: true, message: '请选择媒体账户', trigger: 'change' }],
  pages: [{
    required: true,
    message: '请选择落地页',
    trigger: 'change',
    validator: (rule, value, callback) => {
      if (!value || !value.length) callback(new Error('请选择落地页'));
      else callback();
    },
  }],
  name: [{ required: true, message: '请输入头条落地页模板名称', trigger: 'blur' }],
};

/** 左侧「落地页名称」列表（按关键词过滤 + 分页） */
const filteredLandingPages = computed(() => {
  const k = lpKeyword.value.trim().toLowerCase();
  if (!k) return LANDING_PAGE_OPTIONS;
  return LANDING_PAGE_OPTIONS.filter((p) => p.toLowerCase().indexOf(k) > -1);
});

const pageItems = computed(() => {
  const start = (lpPage.value - 1) * LP_PAGE_SIZE;
  return filteredLandingPages.value.slice(start, start + LP_PAGE_SIZE);
});

const allIndeterminate = computed(
  () => !allChecked.value && createForm.value.pages.length > 0 && createForm.value.pages.length < pageItems.value.length,
);

/** 线上「已选：0/1」：最多选 1 个，选满后其余选项置灰 */
const maxReached = computed(() => createForm.value.pages.length >= MAX_PICK);

/** 打开弹窗 */
function openCreate() {
  createForm.value = { account: '', pages: [], name: '' };
  lpKeyword.value = '';
  lpPage.value = 1;
  allChecked.value = false;
  createVisible.value = true;
}

/** 左侧列表搜索 */
function onLpSearch() {
  lpPage.value = 1;
}

/** 全选（受最多 1 个限制） */
function toggleAll(val) {
  if (val) {
    createForm.value.pages = pageItems.value.slice(0, MAX_PICK);
  } else {
    createForm.value.pages = [];
  }
}

/** 移除已选 */
function removePicked(p) {
  createForm.value.pages = createForm.value.pages.filter((x) => x !== p);
}

/** 清空已选 */
function clearPicked() {
  createForm.value.pages = [];
}

/** 选中项变化：同步「全选」状态（线上最多 1 个，超出时截断） */
watch(
  () => createForm.value.pages,
  (val) => {
    if (val.length > MAX_PICK) {
      createForm.value.pages = val.slice(val.length - MAX_PICK);
    }
    allChecked.value = pageItems.value.length > 0 && val.length === pageItems.value.length;
  },
  { deep: true },
);

/** 确定：校验 + 反馈 */
function submitCreate() {
  createFormRef.value.validate((valid) => {
    if (!valid) return;
    ElMessage.success('新建模板成功');
    createVisible.value = false;
  });
}

/** 输入模板名时清掉旧的校验红字 */
function onNameInput() {
  if (createFormRef.value) createFormRef.value.clearValidate('name');
}
</script>

<style scoped>
.lp-page { width: 100%; }

/* ---------- 二级页签（线上白底 + 蓝字蓝下划线） ---------- */
.lp-tabs { gap: 32px; }
.lp-tabs :deep(.asset-sub-tab) { font-size: 14px; }

/* ---------- 查询条件 ---------- */
/* 线上 .filter-cell 内的 el-select 无独立边框（外层提供方框） */
.filter-cell :deep(.el-select .el-input__wrapper) { box-shadow: none !important; padding: 0; }
.filter-cell :deep(.el-select .el-input__inner) { border: none; }
.filter-cell :deep(.el-select .el-input__suffix) { color: #c0c4cc; }
.lp-icon-close {
  margin-left: 6px; padding-left: 6px; font-size: 14px; color: #999; cursor: pointer;
  border-left: 1px solid #e8eaec;
}
.lp-icon-close:hover { color: #197afb; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索气泡 + 🔍（线上共 280px） */
.lp-search { display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0; }
.lp-search-field { width: 80px; flex: none; margin-right: 4px; }
.lp-search-field :deep(.el-input__wrapper) { height: 28px; font-size: 12px; border-radius: 3px; }
.lp-search-input { width: 168px; flex: none; }
.lp-search-input :deep(.el-input__wrapper) { height: 28px; font-size: 12px; border-radius: 3px 0 0 3px; }
.lp-search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.lp-search-input :deep(.el-input__suffix) { padding: 0 4px; }
.lp-search-btn {
  width: 28px; height: 28px; padding: 0; margin-left: -1px; font-size: 14px;
  border-radius: 0 3px 3px 0; background: #fff;
}
.lp-batch-icon {
  display: inline-flex; align-items: center; font-size: 16px; color: #606266; cursor: pointer;
}
.lp-batch-icon:hover { color: #197afb; }

/* 批量搜索气泡 */
.lp-batch__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.lp-batch__title { font-size: 14px; color: #333; font-weight: 500; }
.lp-batch__tips { font-size: 12px; color: #909399; margin-bottom: 6px; }
.lp-batch__link { color: #197afb; cursor: pointer; }
.lp-batch__pop-title { font-size: 14px; color: #303133; margin-bottom: 6px; }

/* 右上角「设置」 */
.lp-setting-btn { height: 28px; padding: 0 14px; font-size: 12px; }
.lp-setting__title { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 8px; }
.lp-setting__list { display: flex; flex-direction: column; }
.lp-setting__list :deep(.el-checkbox) { height: 26px; margin-right: 0; }
.lp-setting__list :deep(.el-checkbox__label) { font-size: 12px; color: #606266; }

/* ---------- 工具栏 ---------- */
.lp-create-btn { display: inline-flex; align-items: center; }
.lp-create-btn__icon { margin-right: 4px; }

/* ---------- 列表 ---------- */
.lp-link { color: #197afb; cursor: pointer; text-decoration: none; }
.lp-link:hover { text-decoration: underline; }
.lp-ops { display: flex; align-items: center; }

/* ---------- 新建模板 弹窗 ---------- */
/* 注：el-dialog 内部（标题 / body / footer）由子组件渲染，scoped 选不到，
   故用 landing_page.css 里的全局类处理；此处只处理自己模板里的元素。 */
.lp-dialog-inner :deep(.el-form-item__label) {
  font-size: 14px; color: #666; padding-right: 4px; white-space: nowrap;
}
.lp-dialog-inner :deep(.el-form-item) { margin-bottom: 20px; }
.lp-dialog-inner :deep(.el-form-item__error) { font-size: 12px; }

.lp-dialog-select { width: 360px; }
.lp-dialog-select :deep(.el-input__inner) { height: 32px; font-size: 13px; }
.lp-dialog-input { width: 360px; }
.lp-dialog-input :deep(.el-input__inner) { height: 32px; font-size: 13px; }
.lp-dialog-footer-ops { gap: 16px; }
.lp-dialog-footer-ops :deep(.el-button) { font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px; }

/* 落地页穿梭框（线上：左列表 + 右已选） */
.lp-transfer { display: flex; width: 616px; }
.lp-transfer__left { width: 380px; flex: none; border: 1px solid #e8eaec; border-radius: 3px; }
.lp-transfer__right {
  width: 212px; flex: none; margin-left: 24px; border: 1px solid #e8eaec; border-radius: 3px;
}
.lp-transfer__head {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 15px; border-bottom: 1px solid #e8eaec; font-size: 13px; color: #333;
}
.lp-transfer__head-text { flex: 1; }
.lp-transfer__search { padding: 10px 15px 6px; }
.lp-transfer__list {
  height: 250px; overflow-y: auto; padding: 0 15px 10px; box-sizing: border-box;
}
.lp-transfer__item { display: flex; width: 100%; margin: 0; height: 28px; }
.lp-transfer__item :deep(.el-checkbox__label) {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #333;
}
.lp-transfer__none {
  height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #909399;
}
.lp-transfer__pager { padding: 8px 15px; border-top: 1px solid #e8eaec; }
.lp-transfer__picked {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; font-size: 12px; color: #333;
}
.lp-transfer__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-transfer__remove { color: #c0c4cc; cursor: pointer; margin-left: 8px; }
.lp-transfer__remove:hover { color: #197afb; }
.lp-transfer__clear { color: #197afb; cursor: pointer; font-size: 12px; }
.lp-transfer__tip { margin-top: 10px; font-size: 12px; color: #909399; }
</style>
