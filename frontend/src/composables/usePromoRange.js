import { ref } from 'vue';
import dayjs from 'dayjs';

// 推广模块（账户 / 项目 / 广告）共用的「数据日期区间」。
// 组件（推广三级页签右侧的日期选择器）负责交互，页面通过本组合式函数读取同一份状态。
const today = dayjs().format('YYYY-MM-DD');
const dateRange = ref([today, today]);

export function usePromoRange() {
  return { dateRange };
}
