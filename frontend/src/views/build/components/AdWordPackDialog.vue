<template>
  <el-dialog
    :model-value="modelValue"
    title="公共词包"
    width="900px"
    align-center
    class="awp-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-table :data="packs" border size="small" max-height="420" class="awp-table">
      <el-table-column prop="name" label="词包名" width="110" />
      <el-table-column label="替换词" min-width="280">
        <template #default="{ row }">
          <span class="awp-words">{{ expanded[row.name] ? row.words : row.words.slice(0, 34) }}</span>
          <el-button link type="primary" class="awp-link" @click="toggle(row)">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="cover" label="用户覆盖率" width="110" align="right" />
      <el-table-column prop="status" label="状态" width="100" align="center" />
      <el-table-column prop="defaultWord" label="默认词" width="90" align="center" />
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ row }">
          <el-button link type="primary" class="awp-link" @click="insert(row)">插入</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="close">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'insert']);

/** 公共词包（线上「公共词包」弹窗数据，字段与线上一致） */
const packs = [
  { name: '地点', words: '安庆,蚌埠,亳州,滁州,阜阳,淮北,合肥,淮南,淮上,芜湖,铜陵,安庆,黄山,宿州,六安,亳州,池州,宣城', cover: '100%', status: '审核通过', defaultWord: '本地' },
  { name: '日期', words: '今天,明天,后天,昨天,今日,昨日', cover: '100%', status: '审核通过', defaultWord: '今日' },
  { name: '星期', words: '星期一,星期二,星期三,星期四,星期五,星期六,星期天,周末', cover: '100%', status: '审核通过', defaultWord: '周末' },
  { name: '年龄', words: '90后,85后,80后,70后,60后', cover: '91.23%', status: '审核通过', defaultWord: '年轻人' },
  { name: '行业', words: '房地产,金融,培训,人力资源,市场,保健,重工,机械,建材,汽车,教育,医疗', cover: '44.91%', status: '审核通过', defaultWord: '互联网' },
  { name: '家用电器', words: '家电,电脑,彩电,燃气灶,洗衣机,空调,冰箱,烤箱,电饭煲,电视', cover: '30.46%', status: '审核通过', defaultWord: '家电' },
  { name: '考试', words: '自考,留学,雅思,专升本,英语考试,司法考试,会计,托福,四六级,公务员', cover: '5.34%', status: '审核通过', defaultWord: '考试' },
  { name: '用餐类型', words: '早餐,午餐,晚餐,夜宵', cover: '100%', status: '审核通过', defaultWord: '晚餐' },
];

const expanded = reactive({});

function toggle(row) {
  expanded[row.name] = !expanded[row.name];
}

function insert(row) {
  emit('insert', row);
  emit('update:modelValue', false);
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.awp-words { color: #606266; font-size: 13px; }
.awp-link { font-size: 12px; margin-left: 8px; }
</style>

<style>
.awp-dialog { padding: 0; }
.awp-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.awp-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.awp-dialog .el-dialog__body { padding: 16px 24px 8px; }
.awp-dialog .el-dialog__footer { padding: 0 24px 20px; }
.awp-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.awp-dialog .el-table th { background: #f5f7fa; }
</style>
