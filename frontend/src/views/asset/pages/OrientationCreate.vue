<template>
  <div class="oc-page">
    <!-- 顶部：标题 + 返回 -->
    <div class="oc-head">
      <span class="oc-title">{{ pageTitle }}</span>
      <a class="oc-back" @click="goBack">返回定向包列表</a>
    </div>

    <div class="oc-body">
      <!-- 左侧：表单（线上 28 个字段，顺序照抄） -->
      <div class="oc-form">
        <el-form :model="form" label-width="150px" label-position="right" size="small">
          <el-form-item
            v-for="f in fields"
            :key="f.key"
            :label="f.label"
            :required="!!f.required"
            :class="{ 'oc-item--disabled': isLocked(f) }"
          >
            <!-- 单选 -->
            <el-radio-group v-if="f.type === 'radio'" v-model="form[f.key]" :disabled="isLocked(f)">
              <el-radio-button v-for="o in f.options" :key="o" :value="o">{{ o }}</el-radio-button>
            </el-radio-group>

            <!-- 下拉 -->
            <el-select
              v-else-if="f.type === 'select'"
              v-model="form[f.key]"
              class="oc-select"
              filterable
              :placeholder="`请选择${f.label.replace(/（.*?）/, '')}`"
              :disabled="isLocked(f)"
            >
              <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
            </el-select>

            <!-- 多行文本 -->
            <el-input
              v-else-if="f.type === 'textarea'"
              v-model="form[f.key]"
              type="textarea"
              :rows="3"
              :maxlength="f.max"
              show-word-limit
              :placeholder="`请输入${f.label}`"
            />

            <!-- 单行文本 -->
            <el-input
              v-else
              v-model="form[f.key]"
              :maxlength="f.max"
              :placeholder="`请输入${f.label}`"
            />

            <!-- 二级选择器展开态（原型占位） -->
            <div v-if="subVisible(f)" class="oc-sub">
              <div class="oc-sub__title">{{ subTitle(f) }}</div>
              <div v-if="subOptions(f).length" class="oc-sub__chips">
                <span
                  v-for="o in subOptions(f)"
                  :key="o"
                  class="oc-chip"
                  :class="{ 'oc-chip--on': subSel[f.key].includes(o) }"
                  @click="toggleSub(f.key, o)"
                >{{ o }}</span>
              </div>
              <div class="oc-sub__placeholder">{{ subPlaceholder(f) }}</div>
            </div>

            <!-- 联动提示（线上原文） -->
            <div v-if="hintOf(f)" class="oc-hint">{{ hintOf(f) }}</div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：预估可覆盖 + 受众信息 -->
      <aside class="oc-side">
        <div class="oc-side__block">
          <div class="oc-side__title">预估可覆盖</div>
          <div class="oc-side__row">巨量广告：<b>0</b> 日活用户</div>
          <div class="oc-side__row">抖音短视频：<b>0</b> 日活用户</div>
          <div class="oc-side__row">西瓜视频：<b>0</b> 日活用户</div>
        </div>
        <div class="oc-side__block">
          <div class="oc-side__title">受众信息</div>
          <div class="oc-side__row">性别: {{ form.gender }}</div>
          <div class="oc-side__row">年龄: {{ form.age }}</div>
          <div class="oc-side__row">平台: {{ form.platform }}</div>
          <div class="oc-side__row">网络: {{ form.network }}</div>
          <div class="oc-side__row">运营商: {{ form.carrier }}</div>
          <div class="oc-side__row">新用户: {{ form.newUser }}</div>
          <div class="oc-side__row">手机品牌: {{ form.brand }}</div>
          <div class="oc-side__row">手机价格: {{ form.price }}</div>
        </div>
      </aside>
    </div>

    <!-- 底部：取消 / 保存 -->
    <div class="oc-foot">
      <div class="oc-foot__btns">
        <el-button size="small" plain @click="goBack">取 消</el-button>
        <el-button size="small" type="primary" @click="onSave">保 存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ASSET_ACCOUNT_OPTIONS as ACCOUNT_OPTIONS } from './assetOptions';

/* ------------------------------------------------------------------ *
 * 创量标准版「巨量广告·标准 → 资产 → 定向包 → 新建创量定向包」
 * 线上是**整页表单**（非弹窗）：
 *   https://cl.mobgi.com/property/toutiao/audience/editor?tabType=creative
 *   左侧 28 个字段 + 右侧「预估可覆盖 / 受众信息」两块，底部「取消 / 保存」。
 *   字段顺序、标签、控件类型、可选项、联动提示均按线上 DOM 采集结果还原。
 * ------------------------------------------------------------------ */

const router = useRouter();
const route = useRoute();

/** 模式：jy = 巨量定向包（线上「新增媒体定向包」整页，23 字段）；默认 = 创量定向包（28 字段） */
const isJy = computed(() => route.query.mode === 'jy');
const pageTitle = computed(() => (isJy.value ? '新增媒体定向包' : '新增智投定向包'));

/** 企业名称（线上 12 项） */
const COMPANY_OPTIONS = [
  '北京百度网讯科技有限公司', '北京智者天下科技有限公司', '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司北京第二分公司', '北京笔墨留香科技有限公司海淀第一分公司',
  '北京高途云集教育科技有限公司', '北京雷盟盛通文化发展有限公司', '上海置潮信息科技有限公司',
  '上海得物信息集团有限公司', '上海任意门科技有限公司', 'UG-端原生IAA-漫剧-免费roi-24020',
  '百度在线网络技术（北京）有限公司',
];

/** 定向包类型（线上枚举） */
const PACKAGE_TYPES = ['常规定向包', '智能定向包', 'DMP人群包'];

/** 二级选择器 mock 选项（原型占位：线上为省市级联 / 年龄段多选 / 兴趣树 / 达人搜索） */
const PROVINCE_OPTIONS = ['北京', '上海', '广东', '浙江', '江苏', '四川', '山东', '河南', '湖北', '福建'];
const AGE_SEGMENT_OPTIONS = ['18-23岁', '24-30岁', '31-40岁', '41-50岁', '51岁以上'];
const INTEREST_TAG_OPTIONS = ['资讯', '游戏', '短视频', '美妆', '美食', '旅游', '母婴', '财经', '体育', '汽车'];

/** 28 个字段（顺序 / 标签 / 类型 / 可选项 与线上一致） */
const FIELDS = [
  { key: 'name', label: '定向包名称', type: 'text', required: true, max: 40 },
  { key: 'desc', label: '定向包描述', type: 'textarea', required: true, max: 200 },
  { key: 'crossSubject', label: '跨主体使用', type: 'radio', options: ['不启用', '启用'] },
  { key: 'project', label: '智投项目（选填）', type: 'select', options: ['测试商品', '测试安卓应用(android)'] },
  { key: 'company', label: '企业名称', type: 'select', required: true, options: COMPANY_OPTIONS },
  { key: 'adType', label: '广告类型', type: 'radio', options: ['所有广告', '搜索广告'] },
  { key: 'pkgType', label: '定向包类型', type: 'select', required: true, options: PACKAGE_TYPES },
  { key: 'product', label: '产品（选填）', type: 'select', options: ['测试商品', '测试安卓应用(android)'] },
  { key: 'range', label: '投放范围', type: 'radio', required: true, options: ['默认', '穿山甲'] },
  { key: 'region', label: '地域', type: 'radio', options: ['不限', '按行政区划', '按商圈'],
    sub: { show: (v) => v === '按行政区划', title: '选择省份（可多选，市级联后续选择）', options: PROVINCE_OPTIONS, placeholder: '原型占位：线上为省 → 市两级级联多选；按商圈为商圈名称搜索' } },
  { key: 'gender', label: '性别', type: 'radio', options: ['不限', '男', '女'] },
  { key: 'age', label: '年龄', type: 'radio', options: ['不限', '原有分段', '更多分段'],
    sub: { show: (v) => v === '更多分段', title: '选择年龄段（可多选）', options: AGE_SEGMENT_OPTIONS, placeholder: '原型占位：线上为更细龄分段多选' } },
  { key: 'customAudience', label: '自定义人群', type: 'radio', options: ['不限', '同时定向排除'] },
  { key: 'interest', label: '行为兴趣', type: 'radio', options: ['不限', '系统推荐', '自定义'],
    sub: { show: (v) => v === '自定义', title: '选择兴趣分类（可多选）', options: INTEREST_TAG_OPTIONS, placeholder: '原型占位：线上为兴趣分类树多选' } },
  { key: 'talent', label: '抖音达人', type: 'radio', options: ['不限', '自定义'],
    sub: { show: (v) => v === '自定义', title: '选择抖音达人', options: [], placeholder: '原型占位：线上按达人昵称 / 类目搜索后添加达人' } },
  { key: 'mediaOrient', label: '媒体定向', type: 'radio', options: ['不限', '游戏优质媒体', '自定义'] },
  { key: 'orientLogic', label: '定向逻辑', type: 'radio', options: ['定向', '排除'] },
  { key: 'platform', label: '平台', type: 'radio', options: ['不限', 'Android', 'iOS', 'PC'] },
  { key: 'brand', label: '手机品牌', type: 'radio', options: ['不限', '按品牌'] },
  { key: 'device', label: '设备类型', type: 'radio', options: ['不限', '智能手机', '平板'] },
  { key: 'network', label: '网络', type: 'radio', options: ['不限', 'wifi', '2G', '3G', '4G', '5G'] },
  { key: 'article', label: '文章分类', type: 'radio', options: ['不限', '文章分类'] },
  { key: 'carrier', label: '运营商', type: 'radio', options: ['不限', '移动', '联通', '电信'] },
  { key: 'newUser', label: '新用户', type: 'radio', options: ['不限', '一个月以内', '一个月到三个月', '三个月或更早'] },
  { key: 'price', label: '手机价格', type: 'radio', options: ['不限', '自定义'] },
  { key: 'smartBid', label: '智能放量', type: 'radio', options: ['不启用', '启用'] },
  { key: 'installed', label: '已安装用户', type: 'radio', options: ['不限', '过滤', '定向'] },
  { key: 'converted', label: '过滤已转化用户', type: 'radio', options: ['不过滤', '广告', '项目', '广告账户', '公司账户', '组织账户'] },
];

/** 巨量定向包整页表单（线上「新增媒体定向包」，23 字段，顺序/标签/类型/选项与线上一致） */
const JY_FIELDS = [
  { key: 'account', label: '媒体账户', type: 'select', required: true, options: ACCOUNT_OPTIONS },
  { key: 'name', label: '定向包名称', type: 'text', required: true, max: 40 },
  { key: 'desc', label: '定向包描述', type: 'textarea', required: true, max: 200 },
  { key: 'pkgType', label: '定向包类型', type: 'select', required: true, options: PACKAGE_TYPES },
  { key: 'adType', label: '广告类型', type: 'radio', required: true, options: ['通投广告'] },
  { key: 'scene', label: '营销场景', type: 'radio', required: true, options: ['短视频', '图片'] },
  { key: 'range', label: '投放范围', type: 'radio', required: true, options: ['默认', '穿山甲'] },
  { key: 'region', label: '地域', type: 'radio', options: ['不限', '按行政区域', '按商圈', '正在该地区的用户', '居住在该地区的用户', '到该地区旅行的用户', '该地区内的所有用户'] },
  { key: 'gender', label: '性别', type: 'radio', options: ['不限', '男', '女'] },
  { key: 'age', label: '年龄', type: 'radio', options: ['不限', '原有分段', '更多分段'] },
  { key: 'customAudience', label: '自定义人群', type: 'radio', options: ['不限', '同时定向排除'] },
  { key: 'interest', label: '行为兴趣', type: 'radio', options: ['不限', '系统推荐', '自定义'] },
  { key: 'mediaOrient', label: '媒体定向', type: 'radio', options: ['不限', '游戏优质媒体', '自定义'] },
  { key: 'orientLogic', label: '定向逻辑', type: 'radio', options: ['定向', '排除'] },
  { key: 'platform', label: '平台', type: 'radio', options: ['不限'] },
  { key: 'device', label: '设备类型', type: 'radio', options: ['不限'] },
  { key: 'network', label: '网络', type: 'radio', options: ['不限'] },
  { key: 'carrier', label: '运营商', type: 'radio', options: ['不限'] },
  { key: 'installed', label: '已安装用户', type: 'radio', options: ['不限', '过滤', '定向'] },
  { key: 'converted', label: '过滤已转化用户', type: 'radio', options: ['不过滤', '广告', '项目', '广告账户', 'APP', '公司账户', '组织账户'] },
  { key: 'brand', label: '手机品牌', type: 'radio', options: ['不限', '按品牌'] },
  { key: 'price', label: '手机价格', type: 'radio', options: ['不限', '自定义'] },
  { key: 'smartBid', label: '智能放量', type: 'radio', options: ['不启用', '启用'] },
];

/** 表单初值 */
const form = reactive({
  name: '', desc: '', crossSubject: '不启用', project: '', company: '', adType: '所有广告',
  pkgType: '', product: '', range: '默认', region: '不限', gender: '不限', age: '不限',
  customAudience: '不限', interest: '不限', talent: '不限', mediaOrient: '不限', orientLogic: '定向',
  platform: '不限', brand: '不限', device: '不限', network: '不限', article: '不限',
  carrier: '不限', newUser: '不限', price: '不限', smartBid: '不启用', installed: '不限',
  converted: '不过滤', account: '', scene: '短视频',
});

/** 当前模式的字段清单 */
const fields = computed(() => (isJy.value ? JY_FIELDS : FIELDS));

/** 联动规则（线上提示原文）：
 *  ① 「同时定向排除」需先选企业名称 → 未选企业时该项置灰并提示
 *  ② 「媒体定向 → 自定义」不支持 ohayoo 精品游戏
 *  ③ 「运营商」定向仅对通信行业有效
 *  ④ 「设备类型 → 平板」需要申请白名单 */
function isLocked(f) {
  if (f.key === 'customAudience' && form.customAudience === '同时定向排除') return !form.company;
  if (f.key === 'mediaOrient' && form.mediaOrient === '自定义') return !form.company;
  return false;
}

function hintOf(f) {
  if (f.key === 'customAudience' && form.customAudience === '同时定向排除') {
    return form.company ? '' : '同时定向排除请先选择企业名称';
  }
  if (f.key === 'mediaOrient' && form.mediaOrient === '自定义') {
    return form.company ? '' : '请先选择企业名称';
  }
  if (f.key === 'brand' && form.brand === '按品牌') return '不支持ohayoo精品游戏';
  if (f.key === 'article' && form.article === '文章分类') return '不支持ohayoo精品游戏';
  if (f.key === 'carrier' && form.carrier !== '不限') return '运营商定向仅对通信行业有效。';
  if (f.key === 'device' && form.device === '平板') return '使用该功能需要申请白名单';
  return '';
}

/* ---------- 二级选择器展开态（原型占位：省市级联 / 年龄段 / 兴趣树 / 达人搜索） ---------- */
const subSel = reactive({ region: [], age: [], interest: [], talent: [] });

function subVisible(f) {
  return !!f.sub && f.sub.show(form[f.key]);
}
function subTitle(f) { return f.sub.title; }
function subOptions(f) { return f.sub.options || []; }
function subPlaceholder(f) { return f.sub.placeholder; }
function toggleSub(key, o) {
  const arr = subSel[key];
  const i = arr.indexOf(o);
  if (i > -1) arr.splice(i, 1); else arr.push(o);
}

function goBack() {
  // 返回定向包列表（asset-list 按 query.kind 切换，定向包 = orientation）
  router.push({ name: 'asset-list', query: { kind: 'orientation' } });
}

function onSave() {
  if (!form.name) { ElMessage.warning('请输入定向包名称'); return; }
  if (!form.desc) { ElMessage.warning('请输入定向包描述'); return; }
  if (!form.company) { ElMessage.warning('请选择企业名称'); return; }
  if (!form.pkgType) { ElMessage.warning('请选择定向包类型'); return; }
  ElMessage.success('原型：已保存定向包');
  goBack();
}

const sideInfo = computed(() => form);
</script>

<style scoped>
.oc-page { min-height: 100%; box-sizing: border-box; background: #f0f2f5; padding-bottom: 72px; }
.oc-head {
  height: 49px; padding: 0 16px; display: flex; align-items: center; gap: 16px;
  background: #fff; border-bottom: 1px solid #e8eaec;
}
.oc-title { font-size: 16px; font-weight: 500; color: #333; }
.oc-back { font-size: 13px; color: #197afb; cursor: pointer; }
.oc-body { display: flex; gap: 16px; padding: 16px; align-items: flex-start; }
.oc-form {
  flex: 1; min-width: 0; background: #fff; padding: 16px 16px 0;
}
.oc-select { width: 360px; }
.oc-item--disabled :deep(.el-form-item__content) { opacity: 0.6; }
.oc-hint { font-size: 12px; color: #ff9900; line-height: 18px; margin-top: 2px; }

/* 二级选择器展开态 */
.oc-sub {
  margin: 6px 0 2px; padding: 10px 12px; background: #f7f8fa; border-radius: 4px; width: 560px;
}
.oc-sub__title { font-size: 12px; color: #606266; margin-bottom: 8px; }
.oc-sub__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.oc-chip {
  padding: 3px 10px; font-size: 12px; color: #606266; background: #fff;
  border: 1px solid #dcdfe6; border-radius: 3px; cursor: pointer; user-select: none;
}
.oc-chip:hover { color: #197afb; border-color: #197afb; }
.oc-chip--on { color: #fff; background: #197afb; border-color: #197afb; }
.oc-sub__placeholder { font-size: 12px; color: #909399; margin-top: 8px; }
.oc-side { width: 260px; flex: none; }
.oc-side__block { background: #fff; padding: 12px 16px; margin-bottom: 16px; }
.oc-side__title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
.oc-side__row { font-size: 12px; color: #666; line-height: 22px; }
.oc-foot {
  position: fixed; left: 0; right: 0; bottom: 0; height: 56px; background: #fff;
  border-top: 1px solid #e8eaec; display: flex; align-items: center; justify-content: center;
}
.oc-foot__btns { display: flex; gap: 16px; }
</style>
