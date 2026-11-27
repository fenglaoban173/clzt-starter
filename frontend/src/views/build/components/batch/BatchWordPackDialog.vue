<template>
  <!-- 公共词包弹窗（线上图1/图2：标题「公共词包」，表格 6 列 + 操作「插入」） -->
  <teleport to="body">
    <div v-if="visible" class="wpk-mask" @click="close"></div>
    <div v-if="visible" class="wpk-dialog" role="dialog" aria-modal="true" aria-label="公共词包">
      <div class="wpk-dialog__header">
        <span class="wpk-dialog__title">公共词包</span>
        <button class="wpk-dialog__close" type="button" aria-label="Close" @click="close">✕</button>
      </div>
      <div class="wpk-dialog__body">
        <div class="wpk-table">
          <div class="wpk-thead">
            <div class="wpk-th" style="width: 130px">词包名</div>
            <div class="wpk-th wpk-th--flex">替换词</div>
            <div class="wpk-th" style="width: 100px">用户覆盖率</div>
            <div class="wpk-th" style="width: 86px">状态</div>
            <div class="wpk-th" style="width: 86px">默认词</div>
            <div class="wpk-th" style="width: 62px">操作</div>
          </div>
          <div class="wpk-tbody">
            <div v-for="row in rows" :key="row.name" class="wpk-tr">
              <div class="wpk-td" style="width: 130px">{{ row.name }}</div>
              <div class="wpk-td wpk-td--flex">
                <span class="wpk-repl">{{ row.repl }}</span>
                <button v-if="row.viewable" class="wpk-link" type="button" @click="onView(row)">查看</button>
              </div>
              <div class="wpk-td" style="width: 100px">{{ row.rate }}</div>
              <div class="wpk-td" style="width: 86px">{{ row.status }}</div>
              <div class="wpk-td" style="width: 86px">{{ row.defaultWord }}</div>
              <div class="wpk-td" style="width: 62px">
                <button class="wpk-link" type="button" @click="onInsert(row)">插入</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'insert', 'close']);

const visible = computed(() => props.modelValue);

/** 线上公共词包 16 条（文案逐字取自图1/图2） */
const rows = [
  { name: '星期', repl: '星期一,星期二,星期三,星期四,星期五,星期六,...', viewable: true, rate: '100%', status: '审核通过', defaultWord: '周末' },
  { name: '年龄', repl: '90后,85后,80后,70后,60后', viewable: true, rate: '91.23%', status: '审核通过', defaultWord: '年轻人' },
  { name: '行业', repl: '计算机,司机,旅游,期货,电力,会计,纺织,房地产办...', viewable: true, rate: '44.92%', status: '审核通过', defaultWord: '互联网' },
  { name: '家用电器', repl: '吸尘器,电饭煲,热水器,彩电,饮水机,浴霸,咖啡机,空...', viewable: false, rate: '30.53%', status: '审核通过', defaultWord: '家电' },
  { name: '考试', repl: '留学,雅思,高考,小升初,GRE,EMBA,自考,托福,入职...', viewable: false, rate: '5.40%', status: '审核通过', defaultWord: '考试' },
  { name: '用餐类型', repl: '早餐,午餐,晚餐,夜宵', viewable: false, rate: '100%', status: '审核通过', defaultWord: '晚餐' },
  { name: '省份', repl: '安徽,北京,重庆,福建,广东,甘肃,广西,贵州,河...', viewable: true, rate: '100%', status: '审核通过', defaultWord: '本省' },
  { name: '网络环境', repl: '4G,3G,2G,WiFi', viewable: true, rate: '96.91%', status: '审核通过', defaultWord: '4G/3G' },
  { name: '帅哥美女', repl: '帅哥,美女', viewable: true, rate: '96.10%', status: '审核通过', defaultWord: '本地人' },
  { name: '他她', repl: '他,她', viewable: true, rate: '96.10%', status: '审核通过', defaultWord: 'TA' },
  { name: '反性别-夫妻', repl: '老公,老婆', viewable: true, rate: '96.10%', status: '审核通过', defaultWord: '爱人' },
  { name: '月份', repl: '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,1...', viewable: true, rate: '100%', status: '审核通过', defaultWord: '本月' },
  { name: '节日', repl: '元旦,腊八节,除夕,春节,元宵节,情人节,妇女节...', viewable: true, rate: '100%', status: '审核通过', defaultWord: '节日' },
  { name: '手机系统', repl: '苹果用户,安卓用户', viewable: true, rate: '74.24%', status: '审核通过', defaultWord: '手机用户' },
  { name: '区县', repl: '大观,怀宁,潜山,宿松,桐城,太湖,望江,迎江,宜...', viewable: true, rate: '65.37%', status: '审核通过', defaultWord: '本区' },
  { name: '关键词', repl: '需要您手动输入关键词内容(仅支持搜索广告)', viewable: false, rate: '无', status: '审核通过', defaultWord: '无' },
];

function close() {
  emit('close');
  emit('update:modelValue', false);
}
function onView(row) {
  ElMessage.info(`「${row.name}」替换词：${row.repl}`);
}
function onInsert(row) {
  emit('insert', { name: row.name, row });
  close();
}
</script>

<style>
.wpk-mask {
  position: fixed; inset: 0; z-index: 2300;
  background: rgba(0, 0, 0, .5);
}
.wpk-dialog {
  position: fixed; top: 50%; left: 50%; z-index: 2301;
  width: 733px;
  transform: translate(-50%, -50%);
  background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  overflow: hidden;
}
.wpk-dialog__header {
  position: relative; height: 48px; padding: 0 24px;
  display: flex; align-items: center;
  border-bottom: 1px solid #ebedf0;
}
.wpk-dialog__title { font-size: 16px; color: #197afb; }
.wpk-dialog__close {
  position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; padding: 0; font-size: 16px; line-height: 1;
  color: #909399; background: none; border: none; cursor: pointer;
}
.wpk-dialog__close:hover { color: #197afb; }
.wpk-dialog__body { padding: 0 0 0; }
.wpk-table { max-height: 470px; overflow: hidden; display: flex; flex-direction: column; }
.wpk-thead {
  display: flex; align-items: center; flex: none;
  height: 52px; background: #fafafa;
  border-bottom: 1px solid #ebedf0;
  font-size: 13px; font-weight: 500; color: #1d2129;
}
.wpk-th { padding: 0 16px; box-sizing: border-box; }
.wpk-th--flex { flex: 1; min-width: 0; }
.wpk-tbody { overflow-y: auto; }
.wpk-tr {
  display: flex; align-items: center;
  height: 50px; box-sizing: border-box;
  border-bottom: 1px solid #ebedf0;
  font-size: 13px; color: #1d2129;
}
.wpk-td { padding: 0 16px; box-sizing: border-box; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.wpk-td--flex { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.wpk-repl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #4e5969; }
.wpk-link {
  flex: none;
  padding: 0; font-size: 13px; color: #197afb;
  background: none; border: none; cursor: pointer;
}
.wpk-link:hover { text-decoration: underline; }
</style>
