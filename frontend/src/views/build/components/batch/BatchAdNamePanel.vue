<template>
  <!-- 广告名称 · 分账户配置面板（对齐线上截图）
       * 左：账户列表（名称省略 + 13 位账号 + 绿勾）
       * 右上：复制到其他账户（弹窗覆盖「广告名称」）
       * 右：广告名称输入框 + 字符数 + 自动截断 / 随机数后缀 + 通配符 + 长度提示 -->
  <div class="an">
    <div class="an__top">
      <div class="an__top-left"></div>
      <div class="an__top-right">
        <a class="an__link" @click="copyVisible = true">复制到其他账户</a>
      </div>
    </div>

    <div class="an__main">
      <div class="an__side">
        <div
          v-for="a in ACCOUNTS"
          :key="a.id"
          class="an__row"
          :class="{ 'is-active': a.id === activeId }"
          @click="activeId = a.id"
        >
          <div class="an__row-txt">
            <p class="an__row-name ellipsis" :title="a.name">{{ a.name }}</p>
            <p class="an__row-sub">{{ a.no }}</p>
          </div>
          <span class="an__ok">✓</span>
        </div>
      </div>

      <div class="an__right">
        <div class="an__field">
          <span class="an__label">广告名称</span>
          <div class="an__ctl">
            <div class="an__row-input">
              <el-input
                v-model="cur.name"
                class="an__input"
                size="small"
                :maxlength="100"
              >
                <template #suffix><span class="an__count">{{ cur.name.length }}</span></template>
              </el-input>
              <el-checkbox v-model="cur.truncate" true-value="ON" false-value="OFF" class="an__ck">
                自动截断
                <el-tooltip
                  content="使用通配符后可能存在名称过长问题，勾选后系统将自动截断超出部分的内容。（注意：自动截断后可能存在同名风险）"
                  placement="top"
                  :show-after="200"
                >
                  <el-icon class="an__q"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-checkbox>
              <el-checkbox v-model="cur.suffix" true-value="ON" false-value="OFF" class="an__ck">
                随机数后缀
                <el-tooltip content="为名称添加4位随机数的后缀,减少重名报错反复重提" placement="top" :show-after="200">
                  <el-icon class="an__q"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-checkbox>
            </div>
            <div class="an__tags">
              <span class="an__tagtext">通配符:</span>
              <el-tooltip
                v-for="w in WILDCARDS"
                :key="w.value"
                :content="w.tip"
                placement="top"
                :show-after="200"
              >
                <a class="an__wild" @click="appendWild(w.value)">＋{{ w.value }}</a>
              </el-tooltip>
              <a class="an__more">
                <el-icon class="an__more-ico"><DocumentCopy /></el-icon>插入更多
              </a>
            </div>
            <div class="an__warn">
              <el-icon class="an__warn-ico"><WarningFilled /></el-icon>
              名称长度最多100字符（1汉字=2字符），使用通配符时，请注意控制自定义内容长度
            </div>
          </div>
        </div>
      </div>
    </div>

    <BatchCopyToDialog
      v-model="copyVisible"
      mode="ACCOUNT"
      :current="currentName"
      :width="400"
      object-name="广告名称"
      @confirm="copyVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { DocumentCopy, QuestionFilled, WarningFilled } from '@element-plus/icons-vue';
import BatchCopyToDialog from './BatchCopyToDialog.vue';

const ACCOUNTS = [
  { id: 'a1', no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-7923355' },
  { id: 'a2', no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-7923357' },
  { id: 'a3', no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-7923358' },
  { id: 'a4', no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-7923359' },
];

const WILDCARDS = [
  { value: '下载链接标识', tip: '取下载或预约下载链接最后一个 / 后的全部字符串，保留 query；例如 demo?a=1。' },
  { value: '渠道包名', tip: '在广告名称中展示广告匹配的渠道包名，没有选中渠道包时则替换为空。' },
  { value: '监测活动名', tip: '在广告名称中展示广告匹配的监测活动名称，没有选中监测活动时则替换为空。' },
];

const TPL = '困境相扶-央广-雷盟-APP内付费-安卓-撬走男同胞的老婆-知乎拉活-日期-单原生-男同同胞的老婆';
const activeId = ref('a1');
const bodies = reactive({});
ACCOUNTS.forEach((a) => {
  bodies[a.id] = { name: TPL, truncate: 'OFF', suffix: 'OFF' };
});

const cur = computed(() => bodies[activeId.value]);
const currentName = computed(() => {
  const a = ACCOUNTS.find((x) => x.id === activeId.value);
  return a ? a.name : '';
});

function appendWild(v) {
  cur.value.name = `${cur.value.name}{${v}}`.slice(0, 100);
}
const copyVisible = ref(false);
</script>

<style scoped>
.an {
  border: 1px solid #e5e6eb;
  background: #fff;
}
.an__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px 0 0;
  border-bottom: 1px solid #f2f3f5;
}
.an__top-left {
  width: 200px;
  padding-left: 16px;
}
.an__link {
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.an__main {
  display: flex;
  align-items: flex-start;
}
.an__side {
  flex: none;
  width: 200px;
  border-right: 1px solid #f2f3f5;
}
.an__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.an__row.is-active {
  background: #f2f7ff;
}
.an__row-txt {
  flex: 1;
  min-width: 0;
}
.an__row-name {
  margin: 0;
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.an__row-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #86909c;
}
.an__ok {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #fff;
  background: #00b42a;
  border-radius: 50%;
}
.an__right {
  flex: 1;
  min-width: 0;
  padding: 16px;
}
.an__field {
  display: flex;
  align-items: flex-start;
}
.an__label {
  flex: none;
  width: 104px;
  font-size: 13px;
  color: #4e5969;
  line-height: 32px;
}
.an__ctl {
  flex: 1;
  min-width: 0;
}
.an__row-input {
  display: flex;
  align-items: center;
  gap: 12px;
}
.an__input {
  flex: 1;
  min-width: 0;
  max-width: 630px;
}
.an__count {
  font-size: 12px;
  color: #c9cdd4;
}
.an__ck {
  flex: none;
  white-space: nowrap;
  font-size: 13px;
}
.an__ck :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #4e5969;
}
.an__q {
  font-size: 14px;
  color: #a9aeb8;
  vertical-align: -2px;
  margin-left: 2px;
}
.an__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
  gap: 12px;
}
.an__tagtext {
  font-size: 12px;
  color: #1d2129;
}
.an__wild {
  font-size: 12px;
  color: #197afb;
  cursor: pointer;
}
.an__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #2681fc;
  cursor: pointer;
}
.an__more-ico {
  font-size: 12px;
}
.an__warn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #ff9b48;
}
.an__warn-ico {
  font-size: 14px;
  color: #ff9b48;
}
</style>
