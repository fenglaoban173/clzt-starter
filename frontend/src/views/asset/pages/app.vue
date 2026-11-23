<template>
  <div class="app-page">
    <!-- ① 二级页签（线上 .cl-minor-nav：48px 高、16px 粗体、选中 #197afb + 3px 下划线） -->
    <ul class="app-tabs">
      <li
        v-for="t in TABS"
        :key="t.key"
        class="app-tab"
        :class="{ 'is-active': t.key === activeTab }"
        @click="switchTab(t.key)"
      >{{ t.label }}</li>
    </ul>

    <!-- ② 查询条件（线上 form.el-form.cl-filter-area：白底、每项 32px 高的带边框小块） -->
    <div class="app-filter">
      <div
        v-for="f in activeConfig.filters"
        :key="f.key"
        class="filter-cell app-filter__item"
        :style="{ width: f.width + 'px' }"
      >
        <label class="filter-label app-filter__label">{{ f.label }}:</label>
        <el-select
          v-model="query[f.key]"
          class="filter-select app-filter__select"
          size="small"
          :style="{ width: f.selWidth + 'px' }"
          :placeholder="f.placeholder"
          :filterable="!!f.filterable"
          :remote="!!f.remote"
          :remote-show-suffix="!!f.remote"
          :remote-method="f.remote ? remoteSearch : undefined"
          clearable
          @change="onFilterChange"
        >
          <el-option v-for="o in optionsOf(f)" :key="o.value" :label="o.label" :value="o.value" />
          <template v-if="f.more" #footer>
            <li class="el-select-dropdown__item app-select-more" @click.stop="loadMoreAccounts(f)">{{ f.more }}</li>
          </template>
        </el-select>
      </div>

      <!-- 关键词搜索：字段类型下拉(80px) + 关键词输入 + 批量搜索气泡 + 🔍 -->
      <div class="app-search">
        <el-select v-model="searchField" class="app-search__field" size="small" placeholder="请选择">
          <el-option v-for="o in activeConfig.search.fields" :key="o" :label="o" :value="o" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          class="app-search__input"
          size="small"
          placeholder="请输入关键词"
          @keyup.enter="onSearch"
        >
          <template #suffix>
            <el-popover placement="bottom-end" :width="640" trigger="click" popper-class="app-batch-popper">
              <template #reference>
                <span class="app-search__batch" title="批量搜索">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7">
                    <path d="M3 5.5h8M3 9.5h5M3 13.5h6" stroke-linecap="round" />
                    <circle cx="16" cy="12" r="4.2" />
                    <path d="M19.2 15.3 22 18.1" stroke-linecap="round" />
                  </svg>
                </span>
              </template>
              <div class="app-batch">
                <div class="app-batch__hd">
                  <span class="app-batch__title">请输入{{ searchField }}（{{ batchText.length }}/1000）</span>
                  <el-link type="primary" underline="never" @click="clearBatch">清空</el-link>
                </div>
                <el-input
                  v-model="batchText"
                  type="textarea"
                  :rows="8"
                  resize="none"
                  placeholder="请粘贴或输入关键词，回车可换行"
                />
                <div class="batch-search-ops">
                  <el-button size="small" plain @click="clearBatch">清空</el-button>
                  <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                </div>
              </div>
            </el-popover>
          </template>
        </el-input>
        <el-button class="app-search__submit" title="搜索" @click="onSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </div>

      <!-- 清空（线上 a.el-link.el-link--primary） -->
      <a class="app-filter__clear" @click="clearFilters">清空</a>
    </div>

    <!-- ③ 功能按钮（线上 .table-toolbar） -->
    <div class="table-toolbar">
      <el-button
        v-for="b in activeConfig.buttons"
        :key="b.key"
        :type="b.type || 'primary'"
        :plain="b.plain"
        size="small"
        class="tool-btn app-tool-btn"
        :style="{ width: b.width + 'px' }"
        :loading="syncingKey === b.key"
        @click="onButton(b)"
      >{{ b.text }}</el-button>

      <!-- 批量操作（线上：应用分包为 删除 / 修改媒体账户） -->
      <el-select
        v-if="activeConfig.batch && activeConfig.batch.length"
        v-model="batchOp"
        class="batch-select"
        size="small"
        clearable
        placeholder="批量操作"
        :disabled="!selectedRows.length"
        @change="onBatchOp"
      >
        <el-option v-for="o in activeConfig.batch" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </div>

    <!-- ④ 列表（线上 el-table--border，表头/行高 56px） -->
    <el-table
      :data="pagedRows"
      row-key="id"
      border
      class="asset-table app-table"
      @selection-change="onSelectionChange"
    >
      <el-table-column
        v-if="activeConfig.selection"
        type="selection"
        :width="activeConfig.selectionWidth || 60"
        fixed="left"
        align="center"
      />
      <el-table-column
        v-for="c in activeConfig.columns"
        :key="c.label"
        :label="c.label"
        :prop="c.prop"
        :min-width="c.width"
        :align="c.align"
        :header-class-name="c.action ? 'operate-column' : undefined"
        :class-name="c.action ? 'operate-column' : undefined"
      >
        <template v-if="c.link" #default="{ row }">
          <div class="app-link">
            <span class="app-link__text" :title="row[c.prop]">{{ row[c.prop] }}</span>
            <el-icon class="app-link__copy" title="复制链接" @click="copyLink(row[c.prop])">
              <DocumentCopy />
            </el-icon>
          </div>
        </template>
        <template v-else-if="c.action" #default="{ row }">
          <el-button link type="primary" size="small" @click="onRowAction(c.action, row)">{{ c.action }}</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <div class="app-empty">暂无数据</div>
      </template>
    </el-table>

    <!-- ⑤ 分页（线上 .cl-table-pagination：共 26 条 / 10条每页 / 跳页） -->
    <div v-if="showPager" class="pager-card app-pager">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="filteredRows.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑥ 查看详情（行内「查看」） -->
    <el-dialog
      v-model="detailVisible"
      :title="detailTitle"
      width="720px"
      class="cl-modal"
      :close-on-click-modal="false"
    >
      <el-form label-width="120px" size="small" class="app-detail-form">
        <el-form-item v-for="f in activeConfig.detail" :key="f.key" :label="f.label">
          <span class="app-detail__value">{{ detailRow[f.key] || '—' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="detailVisible = false">取 消</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑦ 新建 / 批量导入弹窗（仅线上有该按钮的二级页签出现） -->
    <el-dialog
      v-model="formVisible"
      :title="formTitle"
      :width="formWidth"
      class="cl-modal"
      :close-on-click-modal="false"
    >
      <el-form v-if="formMode === 'form'" :model="form" label-width="120px" size="small" class="app-new-form">
        <el-form-item
          v-for="f in formFields"
          :key="f.key"
          :label="f.label"
          :required="!!f.required"
          :error="formErrors[f.key] || ''"
        >
          <el-select v-if="f.type === 'select'" v-model="form[f.key]" :placeholder="f.placeholder || `请选择${f.label}`" :disabled="isFieldLocked(f)" style="width: 100%">
            <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.key]">
            <el-radio-button v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
          <el-input
            v-else
            v-model="form[f.key]"
            :type="f.type === 'textarea' ? 'textarea' : 'text'"
            :rows="3"
            :placeholder="f.placeholder || `请输入${f.label}`"
          />
        </el-form-item>
      </el-form>

      <div v-else class="app-import">
        <el-alert title="请先下载导入模板，按模板格式填写后再上传（仅支持 .xlsx 文件）" type="info" :closable="false" />
        <div class="app-import__ops">
          <el-button size="small" type="primary" plain @click="ElMessage.info('原型：下载导入模板')">下载模板</el-button>
          <el-button size="small" type="primary" @click="ElMessage.info('原型：选择本地文件')">选择文件</el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="formVisible = false">取 消</el-button>
            <el-button size="small" type="primary" :loading="formSubmitting" @click="submitForm">
              {{ formSubmitting ? '提交中' : '确 定' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy, Search } from '@element-plus/icons-vue';

/* ------------------------------------------------------------------
 * 创量标准版「巨量广告·标准 → 资产 → 巨量应用」
 * 线上：https://cl.mobgi.com/property/toutiao/subcontractor/index
 *
 * 采集自线上 DOM / computed style：
 *   - 二级页签 .cl-minor-nav：巨量应用 / 应用分包 / 鸿蒙应用 / 监测活动管理
 *     （48px 高、16px 粗体、选中 #197afb + 3px 下划线、间距 32px）
 *   - 筛选区 .cl-filter-area：工作台(124px) / 媒体账户(192px) / 创量应用(192px)
 *     + 关键词搜索(字段类型 80px + 关键词 + 批量搜索 + 🔍) + 清空链接
 *   - 工具栏 .table-toolbar：同步巨量应用(120px) / 同步巨量游戏预约(128px)
 *   - 表格 10 列，最后一列表头为「共享账户」（线上 operate-column，内容是行内「查看」）
 *   - 分页：共 26 条 / 10条每页 / 123 页 / 前往页
 *   - 「工作台」默认选中「旧版」（spec: hasValue=true / selectedText=旧版）；
 *     切到「新版」后线上会换成「工作台 + 组织账户」两档筛选、8 列（去掉创量应用/共享账户），
 *     且该账号下暂无数据、不渲染分页
 *   - 本页无批量操作、无新建抽屉
 * ------------------------------------------------------------------ */

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------ 页签 ------------------------------ */

const TABS = [
  { key: 'app', label: '巨量应用' },
  { key: 'subpackage', label: '应用分包' },
  { key: 'harmony', label: '鸿蒙应用' },
  { key: 'monitor', label: '监测活动管理' },
];

/* ------------------------------ 公共选项 ------------------------------ */

/** 媒体账户（线上采集到的 20 条，末尾还有「搜索更多(292)…」） */
const ACCOUNT_OPTIONS = [
  { value: '不限', label: '不限' },
  { value: '1861811345880074', label: '北京高途云集教育科技有限公司--1 (1861811345880074)' },
  { value: '1866877399870663', label: '百度文库-央广时代-拉新-搜索-01 (1866877399870663)' },
  { value: '1866877399203047', label: '百度文库-央广时代-拉新-搜索-02 (1866877399203047)' },
  { value: '1866849651765706', label: '百度文库-央广时代-拉新-搜索-03 (1866849651765706)' },
  { value: '1866489873996443', label: '任意门-央广-代运营-36-安卓-UBA (1866489873996443)' },
  { value: '1866489858950211', label: '任意门-央广-代运营-22-安卓-UBA (1866489858950211)' },
  { value: '1866489859578696', label: '任意门-央广-代运营-23-安卓-UBA (1866489859578696)' },
  { value: '1866489860302024', label: '任意门-央广-代运营-10-ios-UBA (1866489860302024)' },
  { value: '1866489860976135', label: '任意门-央广-代运营-25-ios-UBA (1866489860976135)' },
  { value: '1866489864776836', label: '任意门-央广-代运营-30-ios-UBA (1866489864776836)' },
  { value: '1834419631681163', label: '上海得物信息集团有限公司1-50 (1834419631681163)' },
  { value: '1866489862625304', label: '任意门-央广-代运营-27-安卓-UBA (1866489862625304)' },
  { value: '1866489865523527', label: '任意门-央广-代运营-31-安卓-UBA (1866489865523527)' },
  { value: '1866489874950667', label: '任意门-央广-代运营-38-安卓-UBA (1866489874950667)' },
  { value: '1866489872328266', label: '任意门-央广-代运营-33-安卓-UBA (1866489872328266)' },
  { value: '1866489871677514', label: '任意门-央广-代运营-32-ios-UBA (1866489871677514)' },
  { value: '1866877401293188', label: '百度文库-央广时代-拉新-搜索-04 (1866877401293188)' },
  { value: '1866489863429463', label: '任意门-央广-代运营-28-安卓-UBA (1866489863429463)' },
  { value: '1866489873385099', label: '任意门-央广-代运营-35-iOS-UBA (1866489873385099)' },
  { value: '1866877405575303', label: '央广-621059846-百度文库-1 (1866877405575303)' },
];

/** 创量应用（线上仅 1 条） */
const CL_APP_OPTIONS = [{ value: '测试安卓应用(android)', label: '测试安卓应用(android)' }];

/** 组织账户（线上「新版」工作台下的筛选项，共 10 条） */
/** 创量项目（线上 4 项：知乎小说 / 漫剧端原生 / soul / 百度文库） */
const PROJECT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'].map((v) => ({ value: v, label: v }));

const ORG_ACCOUNT_OPTIONS = [
  '央广-红果-自负亏损测试',
  '央广漫剧R3',
  '央广时代',
  '代理央广时代',
  'AI漫剧创作神器',
  '代理liruohan',
  'chenpeihua代理',
  '代理liuziyuan01',
  '漫剧-央广时代-iap',
  '漫剧-央广时代',
].map((v) => ({ value: v, label: v }));

/** 工作台（线上：旧版 / 新版） */
const PLATFORM_OPTIONS = [
  { value: '旧版', label: '旧版' },
  { value: '新版', label: '新版' },
];

/** 创建人员（应用分包 / 监测活动管理页签）—— 线上 15 项，格式「姓名 (邮箱)」 */
const CREATOR_OPTIONS = [
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
].map((v) => ({ value: v, label: v }));

/* ------------------------------ mock 数据 ------------------------------ */

/** 巨量应用（线上首屏 10 行 + 补充行，共 26 条，与线上分页「共 26 条」一致） */
const APP_ROWS = [
  { name: '有驾', appId: '210483', clApp: '', packageName: 'com.baidu.autocar', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/0e61798db556cddc4e292cd0ba6c9a82dc63ca15', status: '已发布', version: '2.8.1', updateTime: '2026-11-18 10:50:57', publishTime: '2022-05-26 15:31:02', account: '北京高途云集教育科技有限公司--1', platform: '旧版' },
  { name: '百度', appId: '196201', clApp: '', packageName: 'com.baidu.searchbox', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/d98f870486aa9f82e7d7c09633cfd6c2ad13d833', status: '已发布', version: '13.72.0.10', updateTime: '2026-11-18 10:50:57', publishTime: '2024-11-06 13:16:48', account: '百度文库-央广时代-拉新-搜索-01', platform: '旧版' },
  { name: '百度畅听版', appId: '217271', clApp: '', packageName: 'com.baidu.searchbox.tomas', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/3105ad202ccaae38f7e4658c03ba9678b56a1d13', status: '已发布', version: '2.38.0.11', updateTime: '2026-11-18 10:50:57', publishTime: '2024-11-14 13:40:18', account: '百度文库-央广时代-拉新-搜索-02', platform: '旧版' },
  { name: '百度输入法', appId: '217718', clApp: '', packageName: 'com.baidu.input', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/aae29366d82f2b93a36d10f7780751d2089370dc', status: '已发布', version: '13.1.1.32', updateTime: '2026-11-18 10:50:57', publishTime: '2025-11-13 19:13:07', account: '百度文库-央广时代-拉新-搜索-03', platform: '旧版' },
  { name: '度豆', appId: '674580', clApp: '', packageName: 'com.wantalk.xiaoyan', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/d5b0045797c384e8a20833be7f6e04895c569929', status: '已发布', version: '1.12.0.10', updateTime: '2026-11-18 10:50:57', publishTime: '2024-12-11 21:07:17', account: '任意门-央广-代运营-36-安卓-UBA', platform: '旧版' },
  { name: '百度极速版', appId: '195429', clApp: '', packageName: 'com.baidu.searchbox.lite', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/415ca21ae06c68a2ef5c73a71a68612f715ff339', status: '已发布', version: '6.92.0.10', updateTime: '2026-11-18 10:50:57', publishTime: '2026-02-05 19:48:16', account: '任意门-央广-代运营-22-安卓-UBA', platform: '旧版' },
  { name: '百度搭子', appId: '1036735', clApp: '', packageName: 'com.baidu.dumate', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/663813401b604f7767afb39d7fa157af83be1a98', status: '已发布', version: '1.22.0.10', updateTime: '2026-11-18 10:50:57', publishTime: '2026-11-11 21:22:50', account: '任意门-央广-代运营-23-安卓-UBA', platform: '旧版' },
  { name: '知乎', appId: '193564', clApp: '', packageName: 'com.zhihu.android', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/832e6e4488582f35c59ff7c8bd52c853d92ca7f7', status: '已发布', version: '11.15.0', updateTime: '2026-11-14 10:54:27', publishTime: '2026-11-12 20:28:34', account: '任意门-央广-代运营-10-ios-UBA', platform: '旧版' },
  { name: '95分', appId: '188248', clApp: '', packageName: 'com.jiuwu', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/21078fa22caaf92b4dfe5adbbabaf586dadc8550', status: '已发布', version: '3.31.50', updateTime: '2026-10-16 12:19:28', publishTime: '2025-09-25 18:34:33', account: '任意门-央广-代运营-25-ios-UBA', platform: '旧版' },
  { name: '盐言故事', appId: '495578', clApp: '', packageName: 'com.zhihu.vip.android', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/50fb12d5e4e60bd778940ec3bffe2b0c35bcdc00', status: '已发布', version: '2.17.1', updateTime: '2026-10-16 12:19:28', publishTime: '2026-10-14 17:55:03', account: '任意门-央广-代运营-30-ios-UBA', platform: '旧版' },
  { name: '抖音极速版', appId: '736521', clApp: '', packageName: 'com.ss.android.ugc.aweme.lite', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/1c9d0f6b28d4a75e39b0c5f7a91d2e6483ab77c10', status: '已发布', version: '24.9.0', updateTime: '2026-11-17 09:12:41', publishTime: '2026-08-01 10:22:15', account: '上海得物信息集团有限公司1-50', platform: '新版' },
  { name: '剪映', appId: '622037', clApp: '测试安卓应用(android)', packageName: 'com.ss.android.ugc.aweme', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/77c1d2b8e64f0a92d5b83c1f70e246a9db53c8e21', status: '已发布', version: '8.6.0', updateTime: '2026-11-15 18:30:02', publishTime: '2025-12-11 09:41:37', account: '任意门-央广-代运营-27-安卓-UBA', platform: '新版' },
  { name: '番茄小说', appId: '552108', clApp: '', packageName: 'com.dragon.read', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/30b7d9f4c1a85e26b7d4093f8c152e6d09ab47f3', status: '已发布', version: '6.2.1', updateTime: '2026-11-16 21:05:44', publishTime: '2025-10-08 14:12:09', account: '任意门-央广-代运营-31-安卓-UBA', platform: '新版' },
  { name: '快手', appId: '431007', clApp: '', packageName: 'com.smile.gifmaker', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/6b41f9c2d80e37a5c1942f8db06e7c153a9f42d60', status: '已发布', version: '12.9.0', updateTime: '2026-11-12 11:47:26', publishTime: '2024-06-18 16:33:52', account: '任意门-央广-代运营-38-安卓-UBA', platform: '旧版' },
  { name: '微信读书', appId: '408552', clApp: '', packageName: 'com.tencent.weread', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/9e2c7a54d0b836f14c95e8a3d27b604f1ce85a932', status: '已发布', version: '3.2.0', updateTime: '2026-11-10 20:15:33', publishTime: '2023-04-22 08:51:16', account: '任意门-央广-代运营-33-安卓-UBA', platform: '旧版' },
  { name: '得物', appId: '719430', clApp: '', packageName: 'com.shizhuang.duapp', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/f4b8d10c9a72e3650bc1d84f7e2a9350d6c7b1e8', status: '已发布', version: '4.7.2', updateTime: '2026-11-09 15:26:48', publishTime: '2026-01-25 19:04:57', account: '任意门-央广-代运营-32-ios-UBA', platform: '旧版' },
  { name: '小红书', appId: '902166', clApp: '', packageName: 'com.xingin.xhs', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/2a6e93f50c8b1d74e6f3092a5c81b04d7e3f6a952', status: '已发布', version: '8.31.0', updateTime: '2026-11-14 13:08:29', publishTime: '2025-07-19 11:22:03', account: '百度文库-央广时代-拉新-搜索-04', platform: '旧版' },
  { name: '夸克', appId: '844017', clApp: '', packageName: 'com.quark.browser', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/8d3b57e1c904a2f6d1e7b05c9a34d78f2e61c05b3', status: '已发布', version: '6.8.5', updateTime: '2026-11-11 08:19:54', publishTime: '2026-03-02 21:17:40', account: '任意门-央广-代运营-28-安卓-UBA', platform: '新版' },
  { name: '哔哩哔哩', appId: '337815', clApp: '', packageName: 'tv.danmaku.bili', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/c05f27a8b6d391e4f2a8c07d5b94e16f3d80a2c74', status: '已发布', version: '7.45.0', updateTime: '2026-11-13 22:41:12', publishTime: '2024-12-05 13:35:28', account: '任意门-央广-代运营-35-iOS-UBA', platform: '旧版' },
  { name: '作业帮', appId: '506294', clApp: '测试安卓应用(android)', packageName: 'com.baidu.homework', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/3b7c1e95a2d840f6c9e35b207d16a84f0e93c5d27', status: '已发布', version: '14.2.1', updateTime: '2026-11-08 10:52:37', publishTime: '2026-05-16 09:44:19', account: '央广-621059846-百度文库-1', platform: '旧版' },
  { name: '猿辅导', appId: '268745', clApp: '', packageName: 'com.yuanfudao.leo', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/e4a06d3f819c572b04d7e9a31c6f8250db73e9a46', status: '已发布', version: '2.19.0', updateTime: '2026-11-07 17:33:21', publishTime: '2025-05-28 15:09:47', account: '任意门-央广-代运营-25-ios-UBA', platform: '旧版' },
  { name: '掌门教育', appId: '174963', clApp: '', packageName: 'com.zhangmen.education', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/62f81a0d5b39c74e6a02d7f1b8c459e30d7a6b2c8', status: '已发布', version: '1.8.6', updateTime: '2026-11-06 12:07:55', publishTime: '2026-02-11 18:50:32', account: '任意门-央广-代运营-30-ios-UBA', platform: '旧版' },
  { name: '中国移动', appId: '903517', clApp: '', packageName: 'com.greenpoint.android.mc10086', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/9d52e7b1c60f38a472d9051eb3c6d082fa47e5b1', status: '已发布', version: '9.3.1', updateTime: '2026-11-04 16:22:44', publishTime: '2025-09-14 20:31:08', account: '百度文库-央广时代-拉新-搜索-01', platform: '旧版' },
  { name: '有道词典', appId: '288164', clApp: '', packageName: 'com.netease.youdao', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/1e70a9c5b3d6482f0a75c1e93b8d26f04a7c5e93', status: '已发布', version: '5.6.2', updateTime: '2026-11-03 11:55:19', publishTime: '2026-04-08 07:26:41', account: '任意门-央广-代运营-27-安卓-UBA', platform: '旧版' },
  { name: '起点读书', appId: '315902', clApp: '', packageName: 'com.qidian.QDReader', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/b28f4d6a90e37c15f8b02d749a6c381e05f7a9d24', status: '已发布', version: '7.1.0', updateTime: '2026-11-01 19:28:03', publishTime: '2025-11-27 13:19:56', account: '任意门-央广-代运营-31-安卓-UBA', platform: '旧版' },
  { name: '学习强国', appId: '620487', clApp: '', packageName: 'com.smartstudy.strongcountry', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/4d8b1c27e0a593f6412b7d0c9a3e58f16b2d07c5', status: '已发布', version: '3.4.6', updateTime: '2026-10-30 14:11:35', publishTime: '2026-06-21 16:48:22', account: '上海得物信息集团有限公司1-50', platform: '旧版' },
];

/** 应用分包页签 */
const SUBPACKAGE_ROWS = [
  { id: 'sp_01', channelNo: 'CH20260912001', remark: '安卓-教育行业分包', appName: '有驾', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/0e61798db556cddc4e292cd0ba6c9a82dc63ca15', status: '已发布', account: '北京高途云集教育科技有限公司--1', version: '2.8.1', adCount: 128, creator: '张伟', updateTime: '2026-11-18 10:50:57', platform: '旧版' },
  { id: 'sp_02', channelNo: 'CH20260912002', remark: '安卓-搜索拉新', appName: '百度', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/d98f870486aa9f82e7d7c09633cfd6c2ad13d833', status: '已发布', account: '百度文库-央广时代-拉新-搜索-01', version: '13.72.0.10', adCount: 96, creator: '李娜', updateTime: '2026-11-18 10:50:57', platform: '旧版' },
  { id: 'sp_03', channelNo: 'CH20260912003', remark: '安卓-输入法分包', appName: '百度输入法', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/aae29366d82f2b93a36d10f7780751d2089370dc', status: '审核中', account: '百度文库-央广时代-拉新-搜索-03', version: '13.1.1.32', adCount: 54, creator: '王强', updateTime: '2026-11-17 16:22:41', platform: '旧版' },
  { id: 'sp_04', channelNo: 'CH20261008004', remark: 'ios-通用版', appName: '知乎', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/832e6e4488582f35c59ff7c8bd52c853d92ca7f7', status: '已发布', account: '任意门-央广-代运营-10-ios-UBA', version: '11.15.0', adCount: 41, creator: '刘洋', updateTime: '2026-11-16 09:41:12', platform: '新版' },
  { id: 'sp_05', channelNo: 'CH20261008005', remark: '安卓-电商分包', appName: '得物', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/f4b8d10c9a72e3650bc1d84f7e2a9350d6c7b1e8', status: '已发布', account: '上海得物信息集团有限公司1-50', version: '4.7.2', adCount: 73, creator: '陈静', updateTime: '2026-11-14 13:05:22', platform: '旧版' },
  { id: 'sp_06', channelNo: 'CH20261008006', remark: '安卓-小说分包', appName: '番茄小说', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/30b7d9f4c1a85e26b7d4093f8c152e6d09ab47f3', status: '未发布', account: '任意门-央广-代运营-31-安卓-UBA', version: '6.2.1', adCount: 0, creator: '张伟', updateTime: '2026-11-13 18:37:05', platform: '新版' },
  { id: 'sp_07', channelNo: 'CH20261111007', remark: 'ios-教育分包', appName: '作业帮', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/3b7c1e95a2d840f6c9e35b207d16a84f0e93c5d27', status: '已发布', account: '央广-621059846-百度文库-1', version: '14.2.1', adCount: 62, creator: '李娜', updateTime: '2026-11-12 11:52:33', platform: '旧版' },
  { id: 'sp_08', channelNo: 'CH20261111008', remark: '安卓-短视频分包', appName: '抖音极速版', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/1c9d0f6b28d4a75e39b0c5f7a91d2e6483ab77c10', status: '已发布', account: '百度文库-央广时代-拉新-搜索-02', version: '24.9.0', adCount: 210, creator: '王强', updateTime: '2026-11-11 20:14:56', platform: '新版' },
];

/** 鸿蒙应用页签 */
const HARMONY_ROWS = [
  { id: 'hm_01', name: '华为视频', appId: '720318', packageName: 'com.huawei.hwid.video', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/2f7c9d05a1b34e78c60f2d93a5e71b084c6d2f39', version: '12.0.2', platform: '新版' },
  { id: 'hm_02', name: '华为阅读', appId: '720419', packageName: 'com.huawei.hwid.reading', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/6b83e1a7c40f295d8e13a76b2c9d05f471a83e26', version: '7.3.0', platform: '新版' },
  { id: 'hm_03', name: '华为音乐', appId: '720520', packageName: 'com.huawei.hwid.music', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/90d7c4b2e85f316a7c02b94d6e31f8a50b7c29d64', version: '13.1.5', platform: '新版' },
];

/** 监测活动管理页签 */
const MONITOR_ROWS = [
  { id: 'mn_01', name: '有驾-激活监测', useStatus: '使用中', source: '手动创建', channelNo: 'CH20260912001', project: '有驾教育行业投放', remark: '教育行业拉新', appName: '有驾', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/0e61798db556cddc4e292cd0ba6c9a82dc63ca15', showLink: 'https://cl.mobgi.com/monitor/show/9f1c2a', validLink: 'https://cl.mobgi.com/monitor/valid/9f1c2a', activeLink: 'https://cl.mobgi.com/monitor/active/9f1c2a', account: '北京高途云集教育科技有限公司--1', creator: '张伟', createTime: '2026-09-12 10:22:31', appType: '应用分包', platform: '旧版' },
  { id: 'mn_02', name: '百度搜索-点击监测', useStatus: '使用中', source: 'API接入', channelNo: 'CH20260912002', project: '百度文库拉新', remark: '搜索渠道监测', appName: '百度', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/d98f870486aa9f82e7d7c09633cfd6c2ad13d833', showLink: 'https://cl.mobgi.com/monitor/show/3a8e57', validLink: 'https://cl.mobgi.com/monitor/valid/3a8e57', activeLink: 'https://cl.mobgi.com/monitor/active/3a8e57', account: '百度文库-央广时代-拉新-搜索-01', creator: '李娜', createTime: '2026-09-12 15:08:12', appType: '应用分包', platform: '旧版' },
  { id: 'mn_03', name: '作业帮-激活监测', useStatus: '使用中', source: '手动创建', channelNo: 'CH20261111007', project: '作业帮冬季招生', remark: '', appName: '作业帮', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/3b7c1e95a2d840f6c9e35b207d16a84f0e93c5d27', showLink: 'https://cl.mobgi.com/monitor/show/6c4b90', validLink: 'https://cl.mobgi.com/monitor/valid/6c4b90', activeLink: 'https://cl.mobgi.com/monitor/active/6c4b90', account: '央广-621059846-百度文库-1', creator: '王强', createTime: '2026-11-11 09:41:55', appType: '应用分包', platform: '旧版' },
  { id: 'mn_04', name: '抖音极速版-点击监测', useStatus: '已停用', source: '手动创建', channelNo: 'CH20261111008', project: '抖音极速版信息流', remark: '短视频分包', appName: '抖音极速版', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/1c9d0f6b28d4a75e39b0c5f7a91d2e6483ab77c10', showLink: 'https://cl.mobgi.com/monitor/show/7e2f13', validLink: 'https://cl.mobgi.com/monitor/valid/7e2f13', activeLink: 'https://cl.mobgi.com/monitor/active/7e2f13', account: '百度文库-央广时代-拉新-搜索-02', creator: '刘洋', createTime: '2026-11-11 14:26:03', appType: '应用分包', platform: '新版' },
  { id: 'mn_05', name: '知乎-落地页监测', useStatus: '使用中', source: 'API接入', channelNo: 'CH20261008004', project: '知乎问答投放', remark: '', appName: '知乎', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/832e6e4488582f35c59ff7c8bd52c853d92ca7f7', showLink: 'https://cl.mobgi.com/monitor/show/1b9d45', validLink: 'https://cl.mobgi.com/monitor/valid/1b9d45', activeLink: 'https://cl.mobgi.com/monitor/active/1b9d45', account: '任意门-央广-代运营-10-ios-UBA', creator: '陈静', createTime: '2026-10-08 11:53:47', appType: '落地页', platform: '新版' },
  { id: 'mn_06', name: '得物-电商监测', useStatus: '使用中', source: '手动创建', channelNo: 'CH20261008005', project: '得物双十一', remark: '大促监测', appName: '得物', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/f4b8d10c9a72e3650bc1d84f7e2a9350d6c7b1e8', showLink: 'https://cl.mobgi.com/monitor/show/5d7c02', validLink: 'https://cl.mobgi.com/monitor/valid/5d7c02', activeLink: 'https://cl.mobgi.com/monitor/active/5d7c02', account: '上海得物信息集团有限公司1-50', creator: '张伟', createTime: '2026-10-08 16:37:29', appType: '应用分包', platform: '旧版' },
  { id: 'mn_07', name: '番茄小说-阅读监测', useStatus: '已停用', source: '手动创建', channelNo: 'CH20261008006', project: '番茄小说免费阅读', remark: '', appName: '番茄小说', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/30b7d9f4c1a85e26b7d4093f8c152e6d09ab47f3', showLink: 'https://cl.mobgi.com/monitor/show/8a3f27', validLink: 'https://cl.mobgi.com/monitor/valid/8a3f27', activeLink: 'https://cl.mobgi.com/monitor/active/8a3f27', account: '任意门-央广-代运营-31-安卓-UBA', creator: '李娜', createTime: '2026-10-09 09:12:04', appType: '落地页', platform: '新版' },
  { id: 'mn_08', name: '快手-激活监测', useStatus: '使用中', source: 'API接入', channelNo: 'CH20261008007', project: '快手品牌种草', remark: '品牌合作', appName: '快手', downloadUrl: 'https://apps.bytesfield.com/download/basic/cur/6b41f9c2d80e37a5c1942f8db06e7c153a9f42d60', showLink: 'https://cl.mobgi.com/monitor/show/4c6b18', validLink: 'https://cl.mobgi.com/monitor/valid/4c6b18', activeLink: 'https://cl.mobgi.com/monitor/active/4c6b18', account: '任意门-央广-代运营-38-安卓-UBA', creator: '王强', createTime: '2026-10-09 17:45:36', appType: '应用分包', platform: '旧版' },
];

/* ------------------------------ 页签配置 ------------------------------ */

const TAB_CONFIG = {
  app: {
    filters: [
      { key: 'platform', prop: 'platform', label: '工作台', placeholder: '请选择工作台', width: 180, selWidth: 124, options: PLATFORM_OPTIONS },
      { key: 'account', prop: 'account', label: '媒体账户', placeholder: '不限', width: 260, selWidth: 192, options: ACCOUNT_OPTIONS, filterable: true, remote: true, more: '搜索更多(292)...' },
      { key: 'clApp', prop: 'clApp', label: '创量应用', placeholder: '所有应用', width: 260, selWidth: 192, options: CL_APP_OPTIONS },
    ],
    search: { fields: ['名称', 'ID'], props: { 名称: 'name', ID: 'appId' } },
    buttons: [
      { key: 'syncApp', text: '同步巨量应用', width: 120 },
      { key: 'syncGame', text: '同步巨量游戏预约', width: 128 },
    ],
    columns: [
      { label: '巨量应用名称', prop: 'name', width: 120 },
      { label: '应用ID', prop: 'appId', width: 120 },
      { label: '创量应用', prop: 'clApp', width: 120 },
      { label: '应用包名', prop: 'packageName', width: 120 },
      { label: '下载链接', prop: 'downloadUrl', width: 250, link: true },
      { label: '状态', prop: 'status', width: 80 },
      { label: '版本号', prop: 'version', width: 120 },
      { label: '更新时间', prop: 'updateTime', width: 160 },
      { label: '发布时间', prop: 'publishTime', width: 160 },
      { label: '共享账户', prop: 'account', width: 120, align: 'center', action: '查看' },
    ],
    detail: [
      { key: 'name', label: '巨量应用名称' },
      { key: 'appId', label: '应用ID' },
      { key: 'clApp', label: '创量应用' },
      { key: 'packageName', label: '应用包名' },
      { key: 'downloadUrl', label: '下载链接' },
      { key: 'status', label: '状态' },
      { key: 'version', label: '版本号' },
      { key: 'updateTime', label: '更新时间' },
      { key: 'publishTime', label: '发布时间' },
      { key: 'account', label: '共享账户' },
    ],
    /* 工作台切到「新版」时，线上会整体换成另一套筛选项与列：
     *   筛选：工作台 + 组织账户（280px，占位「请选择组织账户」）
     *   列  ：去掉「创量应用」与「共享账户」，共 8 列
     *   数据：线上该账号下为空（暂无数据）
     */
    newVersion: {
      filters: [
        { key: 'platform', prop: 'platform', label: '工作台', placeholder: '请选择工作台', width: 180, selWidth: 124, options: PLATFORM_OPTIONS },
        { key: 'orgAccount', prop: 'orgAccount', label: '组织账户', placeholder: '请选择组织账户', width: 280, selWidth: 212, options: ORG_ACCOUNT_OPTIONS },
      ],
      columns: [
        { label: '巨量应用名称', prop: 'name', width: 175 },
        { label: '应用ID', prop: 'appId', width: 170 },
        { label: '应用包名', prop: 'packageName', width: 170 },
        { label: '下载链接', prop: 'downloadUrl', width: 360, link: true },
        { label: '状态', prop: 'status', width: 115 },
        { label: '版本号', prop: 'version', width: 170 },
        { label: '更新时间', prop: 'updateTime', width: 160 },
        { label: '发布时间', prop: 'publishTime', width: 160 },
      ],
      detail: [
        { key: 'name', label: '巨量应用名称' },
        { key: 'appId', label: '应用ID' },
        { key: 'packageName', label: '应用包名' },
        { key: 'downloadUrl', label: '下载链接' },
        { key: 'status', label: '状态' },
        { key: 'version', label: '版本号' },
        { key: 'updateTime', label: '更新时间' },
        { key: 'publishTime', label: '发布时间' },
      ],
    },
  },

  subpackage: {
    filters: [
      { key: 'platform', prop: 'platform', label: '工作台', placeholder: '请选择工作台', width: 180, selWidth: 124, options: PLATFORM_OPTIONS },
      { key: 'appName', prop: 'appName', label: '巨量应用', placeholder: '所有应用', width: 260, selWidth: 192, options: APP_ROWS.map((a) => ({ value: a.name, label: a.name })) },
      { key: 'creator', prop: 'creator', label: '创建人员', placeholder: '全选', width: 260, selWidth: 192, options: CREATOR_OPTIONS },
      { key: 'account', prop: 'account', label: '媒体账户', placeholder: '所有账户', width: 260, selWidth: 192, options: ACCOUNT_OPTIONS },
    ],
    search: { fields: ['名称', 'ID'], props: { 名称: 'appName', ID: 'channelNo' } },
    buttons: [
      { key: 'fetchSp', text: '获取应用分包', width: 120 },
      { key: 'newSp', text: '新建应用分包', width: 120, type: 'default', plain: true },
    ],
    // 批量操作（线上实测选项）
    batch: [
      { label: '删除', value: 'delete' },
      { label: '修改媒体账户', value: 'editAccount' },
    ],
    selection: true,
    selectionWidth: 48,
    columns: [
      { label: '渠道号', prop: 'channelNo', width: 120 },
      { label: '备注', prop: 'remark', width: 120 },
      { label: '巨量应用名称', prop: 'appName', width: 160 },
      { label: '下载链接', prop: 'downloadUrl', width: 250, link: true },
      { label: '状态', prop: 'status', width: 80 },
      { label: '媒体账户', prop: 'account', width: 120 },
      { label: '版本信息', prop: 'version', width: 80 },
      { label: '关联广告数', prop: 'adCount', width: 100 },
      { label: '创建人员', prop: 'creator', width: 120 },
      { label: '更新时间', prop: 'updateTime', width: 160 },
      { label: '操作', prop: 'id', width: 120, align: 'center', action: '删除' },
    ],
    detail: [
      { key: 'channelNo', label: '渠道号' },
      { key: 'remark', label: '备注' },
      { key: 'appName', label: '巨量应用名称' },
      { key: 'downloadUrl', label: '下载链接' },
      { key: 'status', label: '状态' },
      { key: 'account', label: '媒体账户' },
      { key: 'version', label: '版本信息' },
      { key: 'adCount', label: '关联广告数' },
      { key: 'creator', label: '创建人员' },
      { key: 'updateTime', label: '更新时间' },
    ],
  },

  harmony: {
    filters: [],
    search: { fields: ['名称', 'ID'], props: { 名称: 'name', ID: 'appId' } },
    buttons: [
      { key: 'syncHarmony', text: '同步应用', width: 120 },
    ],
    selection: true,
    selectionWidth: 60,
    columns: [
      { label: '鸿蒙应用名称', prop: 'name', width: 240 },
      { label: '应用ID', prop: 'appId', width: 200 },
      { label: '应用包名', prop: 'packageName', width: 220 },
      { label: '下载链接', prop: 'downloadUrl', width: 200, link: true },
      { label: '版本号', prop: 'version', width: 150 },
    ],
    detail: [
      { key: 'name', label: '鸿蒙应用名称' },
      { key: 'appId', label: '应用ID' },
      { key: 'packageName', label: '应用包名' },
      { key: 'downloadUrl', label: '下载链接' },
      { key: 'version', label: '版本号' },
    ],
  },

  monitor: {
    filters: [
      { key: 'appType', prop: 'appType', label: '应用类型', placeholder: '请选择应用类型', width: 260, selWidth: 192, options: [{ value: '应用分包', label: '应用分包' }, { value: '落地页', label: '落地页' }, { value: '小程序', label: '小程序' }] },
      { key: 'source', prop: 'source', label: '应用来源', placeholder: '全选', width: 260, selWidth: 192, options: [{ value: '手动创建', label: '手动创建' }, { value: 'API接入', label: 'API接入' }, { value: '同步', label: '同步' }] },
      { key: 'platform', prop: 'platform', label: '工作台', placeholder: '全选', width: 260, selWidth: 204, options: PLATFORM_OPTIONS },
      { key: 'appName', prop: 'appName', label: '巨量应用', placeholder: '所有应用', width: 260, selWidth: 192, options: APP_ROWS.map((a) => ({ value: a.name, label: a.name })) },
      { key: 'creator', prop: 'creator', label: '创建人员', placeholder: '全选', width: 260, selWidth: 192, options: CREATOR_OPTIONS },
      { key: 'account', prop: 'account', label: '媒体账户', placeholder: '全选', width: 260, selWidth: 192, options: ACCOUNT_OPTIONS },
      { key: 'project', prop: 'project', label: '智投项目', placeholder: '全部', width: 260, selWidth: 192, options: [{ value: '有驾教育行业投放', label: '有驾教育行业投放' }, { value: '百度文库拉新', label: '百度文库拉新' }, { value: '知乎小说', label: '知乎小说' }, { value: '漫剧端原生', label: '漫剧端原生' }] },
    ],
    search: { fields: ['名称', 'ID'], props: { 名称: 'name', ID: 'channelNo' } },
    buttons: [
      { key: 'importMonitor', text: '批量导入', width: 120 },
      { key: 'newMonitor', text: '新建监测活动', width: 120, type: 'default', plain: true },
    ],
    columns: [
      { label: '当前页  前50页', prop: 'scope', width: 60 },
      { label: '监测活动名', prop: 'name', width: 240 },
      { label: '使用状态', prop: 'useStatus', width: 90 },
      { label: '应用来源', prop: 'source', width: 100 },
      { label: '渠道号', prop: 'channelNo', width: 120 },
      { label: '投放项目', prop: 'project', width: 120 },
      { label: '分包备注', prop: 'remark', width: 120 },
      { label: '巨量应用', prop: 'appName', width: 120 },
      { label: '下载链接', prop: 'downloadUrl', width: 250, link: true },
      { label: '展示监测链接', prop: 'showLink', width: 250 },
      { label: '有效触点链接', prop: 'validLink', width: 120 },
      { label: '激活监测链接', prop: 'activeLink', width: 120 },
      { label: '媒体账户', prop: 'account', width: 120 },
      { label: '创建人员', prop: 'creator', width: 120 },
      { label: '创建时间', prop: 'createTime', width: 180 },
      { label: '操作', prop: 'id', width: 180, align: 'center' },
    ],
    detail: [
      { key: 'name', label: '监测活动名' },
      { key: 'useStatus', label: '使用状态' },
      { key: 'source', label: '应用来源' },
      { key: 'channelNo', label: '渠道号' },
      { key: 'project', label: '投放项目' },
      { key: 'remark', label: '分包备注' },
      { key: 'appName', label: '巨量应用' },
      { key: 'downloadUrl', label: '下载链接' },
      { key: 'showLink', label: '展示监测链接' },
      { key: 'validLink', label: '有效触点链接' },
      { key: 'activeLink', label: '激活监测链接' },
      { key: 'account', label: '媒体账户' },
      { key: 'creator', label: '创建人员' },
      { key: 'createTime', label: '创建时间' },
    ],
  },
};

/* ------------------------------ 状态 ------------------------------ */

const activeTab = ref('app');
const query = reactive({});
const searchField = ref('名称');
const searchKeyword = ref('');
const batchText = ref('');
const pageNo = ref(1);
const pageSize = ref(10);
const syncingKey = ref('');
const remoteKeyword = reactive({});
const extraAccounts = ref([]);
const accountMoreText = ref('搜索更多(292)...');

const detailVisible = ref(false);
const detailRow = ref({});
const detailTitle = ref('巨量应用详情');

const formVisible = ref(false);
const formTitle = ref('');
const formMode = ref('form');
const formWidth = ref('640px');
const formFields = ref([]);
const form = reactive({});
const formErrors = reactive({});
const formSubmitting = ref(false);

const DATA = {
  app: APP_ROWS,
  subpackage: SUBPACKAGE_ROWS,
  harmony: HARMONY_ROWS,
  monitor: MONITOR_ROWS,
};

/* ------------------------------ 计算 ------------------------------ */

const activeConfig = computed(() => {
  const cfg = TAB_CONFIG[activeTab.value];
  /* 线上「工作台」= 新版时，巨量应用页整体换成另一套筛选项 + 列 */
  if (activeTab.value === 'app' && cfg.newVersion && query.platform === '新版') {
    return { ...cfg, filters: cfg.newVersion.filters, columns: cfg.newVersion.columns, detail: cfg.newVersion.detail };
  }
  return cfg;
});

const allRows = computed(() => {
  const rows = DATA[activeTab.value] || [];
  /* 线上「新版」工作台该账号下没有巨量应用数据（表格显示「暂无数据」，且不渲染分页） */
  if (activeTab.value === 'app' && query.platform === '新版') return [];
  return rows;
});

/** 下拉选项（媒体账户支持远程搜索 + 「搜索更多」） */
function optionsOf(f) {
  if (!f.remote) return f.options || [];
  const kw = (remoteKeyword[f.key] || '').trim();
  const list = f.key === 'account' ? ACCOUNT_OPTIONS.concat(extraAccounts.value) : f.options || [];
  return kw ? list.filter((o) => o.label.indexOf(kw) !== -1) : list;
}

/** 筛选 + 关键词过滤 */
const filteredRows = computed(() => {
  let rows = allRows.value;
  const cfg = activeConfig.value;
  cfg.filters.forEach((f) => {
    const v = query[f.key];
    if (v === '' || v === null || v === undefined) return;
    /* 巨量应用页的「工作台」是工作区切换（数据整体切换），不按行字段过滤 */
    if (activeTab.value === 'app' && f.key === 'platform') return;
    rows = rows.filter((r) => String(r[f.prop] ?? '') === String(v));
  });
  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    const prop = (cfg.search.props || {})[searchField.value] || 'name';
    rows = rows.filter((r) => keys.some((k) => String(r[prop] ?? '').indexOf(k) !== -1));
  }
  return rows;
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

/** 线上「新版」工作台不渲染分页（整页表格为空） */
const showPager = computed(() => !(activeTab.value === 'app' && query.platform === '新版'));

/* ------------------------------ 方法 ------------------------------ */

/** 切换二级页签：重置筛选 + 换列 + 换数据 */
function switchTab(key) {
  if (activeTab.value === key) return;
  activeTab.value = key;
  resetQuery();
}

function resetQuery() {
  Object.keys(query).forEach((k) => delete query[k]);
  Object.keys(remoteKeyword).forEach((k) => delete remoteKeyword[k]);
  const cfg = TAB_CONFIG[activeTab.value];
  /* 旧版 / 新版两套筛选项都初始化，避免切换工作台时残留 */
  (cfg.filters || []).forEach((f) => { query[f.key] = ''; });
  (cfg.newVersion ? cfg.newVersion.filters : []).forEach((f) => { query[f.key] = ''; });
  /* 线上默认落在「旧版」工作台（spec：工作台 hasValue=true / selectedText=旧版） */
  query.platform = '旧版';
  searchField.value = activeConfig.value.search.fields[0];
  searchKeyword.value = '';
  batchText.value = '';
  pageNo.value = 1;
}

function onFilterChange() {
  pageNo.value = 1;
}

function onSearch() {
  pageNo.value = 1;
}

/** 远程搜索（媒体账户） */
function remoteSearch(kw) {
  remoteKeyword.account = kw || '';
}

/** 下拉末尾「搜索更多(292)…」 */
function loadMoreAccounts(f) {
  if (f.key !== 'account' || extraAccounts.value.length) {
    ElMessage.info('已加载全部媒体账户');
    return;
  }
  const extra = [];
  for (let i = 0; i < 8; i += 1) {
    extra.push({
      value: `186${9000000000000 + i}`,
      label: `央广智投-教育行业-巨量广告-${String(i + 1).padStart(2, '0')} (186${9000000000000 + i})`,
    });
  }
  extraAccounts.value = extra;
  accountMoreText.value = '搜索更多(300)...';
  f.more = accountMoreText.value;
  ElMessage.success('已加载更多媒体账户');
}

function clearFilters() {
  resetQuery();
  ElMessage.info('已清空筛选条件');
}

/** 批量搜索气泡 */
function clearBatch() {
  batchText.value = '';
}

function applyBatchSearch() {
  searchKeyword.value = batchText.value;
  pageNo.value = 1;
}

/** 复制下载链接 */
async function copyLink(url) {
  if (!url) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    ElMessage.success('复制成功');
  } catch (e) {
    ElMessage.warning('复制失败，请手动复制');
  }
}

/* 批量操作与勾选状态（线上：应用分包为 删除 / 修改媒体账户） */
const selectedRows = ref([]);
const batchOp = ref('');
function onSelectionChange(rows) { selectedRows.value = rows; }
/** 字段条件启用态：enabledWhen = { field, value }，不满足时置灰（线上实测联动） */
function isFieldLocked(f) {
  if (!f.enabledWhen) return false;
  return form[f.enabledWhen.field] !== f.enabledWhen.value;
}
function onBatchOp(v) {
  if (!v) return;
  ElMessage.info(`原型：批量${v}`);
  batchOp.value = '';
}

/** 功能按钮 */
async function onButton(b) {
  if (b.key === 'syncApp' || b.key === 'syncGame' || b.key === 'fetchSp') {
    syncingKey.value = b.key;
    await new Promise((resolve) => setTimeout(resolve, 800));
    syncingKey.value = '';
    ElMessage.success('同步成功');
    return;
  }
  if (b.key === 'newSp') {
    // 线上「新建应用分包」弹窗：宽 992px，4 字段（工作台 / 巨量应用 / 创建应用的账户 / 导入渠道号）
    openForm('新建应用分包', '992px', [
      { key: 'workspace', label: '工作台', type: 'radio', default: '旧版', options: [{ value: '旧版', label: '旧版' }, { value: '新版', label: '新版' }] },
      { key: 'appName', label: '巨量应用', type: 'select', required: true, placeholder: '请选择巨量应用', options: APP_ROWS.map((a) => ({ value: a.name, label: a.name })) },
      // 联动：线上「创建应用的账户」默认置灰，选「工作台 = 新版」后才可用
      { key: 'account', label: '创建应用的账户', type: 'select', required: true, placeholder: '请选择媒体账户', options: ACCOUNT_OPTIONS, enabledWhen: { field: 'workspace', value: '新版' } },
      { key: 'channelNo', label: '导入渠道号', type: 'textarea', placeholder: '请输入渠道号' },
    ]);
    return;
  }
  if (b.key === 'newMonitor') {
    // 线上「新建监测活动」弹窗：宽 720px，10 字段
    openForm('新建监测活动', '720px', [
      { key: 'name', label: '活动名称', type: 'input', required: true, placeholder: '活动名称不超过50个字' },
      { key: 'account', label: '媒体账户', type: 'select', placeholder: '不限', options: ACCOUNT_OPTIONS },
      { key: 'project', label: '创量项目（选填）', type: 'select', placeholder: '不限', options: PROJECT_OPTIONS },
      { key: 'appType', label: '应用类型', type: 'radio', required: true, options: [{ value: '安卓', label: '安卓' }, { value: 'iOS', label: 'iOS' }, { value: '鸿蒙', label: '鸿蒙' }] },
      { key: 'showLink', label: '展示链接', type: 'input', placeholder: '请输入展示链接' },
      { key: 'validLink', label: '有效触点链接', type: 'input', placeholder: '请输入有效触点链接' },
      { key: 'playLink', label: '视频播放链接', type: 'input', placeholder: '请输入视频播放链接' },
      { key: 'playEndLink', label: '视频播完链接', type: 'input', placeholder: '请输入视频播完链接' },
      { key: 'validPlayLink', label: '视频有效播放链接', type: 'input', placeholder: '请输入视频有效播放链接' },
      { key: 'activeLink', label: '激活监测链接', type: 'input', placeholder: '请输入激活监测链接' },
    ]);
    return;
  }
  if (b.key === 'importMonitor') {
    // 线上「导入监测活动」弹窗：宽 800px，8 字段
    openForm('导入监测活动', '800px', [
      { key: 'appType', label: '应用类型', type: 'radio', options: [{ value: '安卓', label: '安卓' }, { value: 'iOS', label: 'iOS' }, { value: '鸿蒙', label: '鸿蒙' }] },
      { key: 'source', label: '应用来源', type: 'radio', options: [{ value: '已有应用', label: '已有应用' }, { value: '内广应用', label: '内广应用' }] },
      { key: 'workspace', label: '工作台', type: 'radio', options: [{ value: '旧版', label: '旧版' }, { value: '新版', label: '新版' }] },
      { key: 'baseAccount', label: '基于账户获取应用', type: 'select', placeholder: '全部', options: ACCOUNT_OPTIONS },
      { key: 'appName', label: '巨量应用', type: 'select', required: true, placeholder: '所有应用', options: APP_ROWS.map((a) => ({ value: a.name, label: a.name })) },
      { key: 'linkSource', label: '下载链接来源', type: 'radio', options: [{ value: '母包链接', label: '母包链接' }, { value: '分包', label: '分包' }, { value: '下载短链', label: '下载短链' }] },
      { key: 'template', label: '获取模板文件', type: 'input', placeholder: '请输入模板文件地址' },
      { key: 'file', label: '导入文件', type: 'input', required: true, placeholder: '请输入导入文件地址' },
    ]);
    return;
  }
  if (b.key === 'syncHarmony') {
    // 线上「同步鸿蒙应用」弹窗：宽 670px（文件导入式，无表单字段）
    formMode.value = 'import';
    formTitle.value = '同步鸿蒙应用';
    formWidth.value = '670px';
    formVisible.value = true;
  }
}

/** 行内操作：查看 */
function onRowAction(action, row) {
  if (action !== '查看') {
    ElMessage.info(`原型：${action}`);
    return;
  }
  detailRow.value = row;
  detailTitle.value = activeTab.value === 'app' ? '巨量应用详情' : '详情';
  detailVisible.value = true;
}

/** 新建弹窗 */
function openForm(title, width, fields) {
  formMode.value = 'form';
  formTitle.value = title;
  formWidth.value = width;
  formFields.value = fields;
  Object.keys(form).forEach((k) => delete form[k]);
  Object.keys(formErrors).forEach((k) => delete formErrors[k]);
  fields.forEach((f) => { form[f.key] = f.default !== undefined ? f.default : ''; });
  formVisible.value = true;
}

/** 提交新建 */
function submitForm() {
  if (formMode.value === 'import') {
    formVisible.value = false;
    ElMessage.success('导入任务已提交');
    return;
  }
  let ok = true;
  formFields.value.forEach((f) => {
    if (f.required && !String(form[f.key] || '').trim()) {
      formErrors[f.key] = `请填写${f.label}`;
      ok = false;
    } else {
      formErrors[f.key] = '';
    }
  });
  if (!ok) {
    ElMessage.warning('请完善必填项');
    return;
  }
  formSubmitting.value = true;
  setTimeout(() => {
    formSubmitting.value = false;
    formVisible.value = false;
    ElMessage.success('创建成功');
  }, 400);
}

watch(pageSize, () => { pageNo.value = 1; });

/* 初始化默认页签的筛选值 */
resetQuery();
</script>

<style scoped>
/* ---------- 页面骨架 ---------- */
.app-page { min-height: 100%; box-sizing: border-box; background: #fff; }

/* ---------- 二级页签（线上 .cl-minor-nav） ---------- */
.app-tabs {
  display: flex; align-items: stretch; gap: 32px; height: 48px; margin: 0 0 0 0;
  padding: 0; list-style: none; border-bottom: 1px solid #e8eaec; background: #fff;
}
.app-tab {
  position: relative; display: flex; align-items: center; height: 48px;
  font-size: 16px; font-weight: 700; color: #666; cursor: pointer; white-space: nowrap;
}
.app-tab.is-active { color: #197afb; }
.app-tab.is-active::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: #197afb;
}

/* ---------- 查询条件（线上 .cl-filter-area） ---------- */
.app-filter {
  display: flex; align-items: center; flex-wrap: wrap;
  padding: 12px 0; background: #fff;
}
.app-filter .filter-cell {
  display: flex; align-items: center; height: 32px; margin: 0 12px 12px 0;
  padding: 0 0 0 6px; background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
  box-sizing: border-box;
}
.app-filter__label { font-size: 12px; color: #666; margin-right: 6px; white-space: nowrap; }
.app-filter__select { flex: none; }
/* 线上：筛选框内的下拉无边框（外层 .filter-item 已有边框） */
.app-filter__select :deep(.el-select__wrapper) {
  height: 30px; padding: 0 6px 0 0; background: transparent; box-shadow: none !important;
}
.app-filter__select :deep(.el-input__inner),
.app-filter__select :deep(.el-select__placeholder span),
.app-filter__select :deep(.el-select__selected-item) { font-size: 13px; color: #606266; }
.app-filter__clear {
  font-size: 14px; color: #197afb; cursor: pointer; line-height: 32px; margin: 0 0 12px 4px;
}
.app-select-more { font-size: 12px; color: #606266; cursor: pointer; }
.app-select-more:hover { color: #197afb; }

/* ---------- 关键词搜索（线上 .cl-search-input） ---------- */
.app-search {
  display: flex; align-items: center; width: 360px; height: 32px; margin: 0 12px 12px 0;
  border: 1px solid #e8eaec; border-radius: 3px; overflow: hidden; background: #fff; box-sizing: border-box;
}
.app-search__field { width: 80px; flex: none; }
.app-search__field :deep(.el-select__wrapper) {
  height: 30px; padding: 0 6px 0 8px; background: transparent; box-shadow: none !important;
  border-right: 1px solid #e8eaec;
}
.app-search__field :deep(.el-input__inner),
.app-search__field :deep(.el-select__placeholder span),
.app-search__field :deep(.el-select__selected-item) { font-size: 13px; color: #333; }
.app-search__input { flex: 1; min-width: 0; }
.app-search__input :deep(.el-input__wrapper) { box-shadow: none !important; border-radius: 0; padding: 0 4px 0 8px; }
.app-search__input :deep(.el-input__inner) { height: 30px; font-size: 13px; color: #333; padding-right: 56px; }
.app-search__batch {
  display: inline-flex; align-items: center; color: #c0c4cc; cursor: pointer; padding: 0 8px;
}
.app-search__batch:hover { color: #909399; }
.app-search__submit {
  width: 40px; height: 30px; padding: 0; border: none; border-left: 1px solid #e8eaec;
  border-radius: 0; color: #606266; background: #fff;
}
.app-search__submit:hover { color: #197afb; background: #fff; }

/* 批量搜索气泡 */
.app-batch { padding: 4px 2px; }
.app-batch__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.app-batch__title { font-size: 13px; color: #333; }

/* ---------- 工具栏（线上 .table-toolbar） ---------- */
.app-tool-btn { flex: none; }

/* ---------- 列表（线上 el-table--border，表头/行高 56px） ---------- */
.app-table { font-size: 12px; width: 100%; }
.app-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.app-table :deep(.el-table__cell) { font-size: 12px; color: #333; padding: 0; height: 56px; }
.app-table :deep(.el-table__cell .cell) { padding: 0 12px; line-height: 18px; }
.app-table :deep(th.operate-column .cell) { text-align: center; color: #333; font-weight: 700; }
.app-table :deep(td.operate-column .cell) { text-align: center; }
.app-table :deep(.el-button.is-link) { margin-left: 0; padding: 0; font-size: 12px; }
.app-empty { color: #909399; font-size: 12px; padding: 60px 0; }

/* 下载链接（线上 .link-layout + .btn-copy） */
.app-link { display: flex; align-items: center; width: 100%; }
.app-link__text {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333;
}
.app-link__copy { flex: none; margin-left: 6px; font-size: 14px; color: #909399; cursor: pointer; }
.app-link__copy:hover { color: #197afb; }

/* ---------- 分页 ---------- */
.app-pager { margin-top: 16px; }

/* ---------- 弹窗 ---------- */
.app-detail__value { font-size: 13px; color: #333; word-break: break-all; }
.app-import__ops { margin-top: 16px; display: flex; gap: 8px; }
</style>
