<template>
  <el-dialog
    :model-value="modelValue"
    title="修改第三方监测链接"
    width="1000px"
    top="15vh"
    class="ptt-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="ptt-body">
      <div class="ptt-count">已选中{{ rows.length }}个广告计划</div>

      <!-- 开启提示 -->
      <div class="ptt-warn">
        <span class="ptt-warn-icon">!</span>
        <span class="ptt-warn-text">开启后才会修改该链接内容，不填则原链接将置为空，不开启时不会修改原链接内容</span>
      </div>

      <el-form label-width="160px" label-position="left" class="ptt-form">
        <template v-for="f in LINKS" :key="f.key">
          <!-- 修改开关 -->
          <el-form-item :label="f.toggle">
            <el-radio-group
              :model-value="on[f.key] ? 1 : 0"
              size="small"
              class="ptt-radio"
              @update:model-value="(v) => (on[f.key] = v === 1)"
            >
              <el-radio-button border :value="1">开启</el-radio-button>
              <el-radio-button border :value="0">不开启</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 链接地址（仅「开启」时出现） -->
          <el-form-item v-if="on[f.key]" :label="f.label" class="ptt-input-item">
            <el-input
              v-model="val[f.key]"
              :placeholder="f.ph"
              maxlength="2000"
              class="ptt-input"
            >
              <template #suffix>
                <span class="ptt-num">{{ (val[f.key] || '').length }}/2000</span>
              </template>
            </el-input>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" @click="confirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改监测活动';

/** 六类监测链接：开关行 + 地址行（顺序与线上一致） */
const LINKS = [
  { key: 'action', toggle: '修改有效触点链接', label: '有效触点链接', ph: '请输入有效触点链接地址', field: 'action_track_url' },
  { key: 'track', toggle: '修改展示链接', label: '展示监测链接', ph: '请输入展示监测链接地址', field: 'track_url' },
  { key: 'videoPlay', toggle: '修改视频播放链接', label: '视频播放监测链接', ph: '请输入视频播放监测链接地址', field: 'video_play_track_url' },
  { key: 'videoDone', toggle: '修改视频播放完毕链接', label: '视频播放完毕监测链接', ph: '请输入视频播放完毕监测链接地址', field: 'video_play_done_track_url' },
  { key: 'videoEffective', toggle: '修改视频有效播放链接', label: '视频有效播放监测链接', ph: '请输入视频有效播放监测链接地址', field: 'video_play_effective_track_url' },
  { key: 'active', toggle: '修改激活监测链接', label: '激活监测链接', ph: '请输入激活监测链接', field: 'active_track_url' },
];

// 各链接「开启 / 不开启」（默认全部开启，与线上一致）
const on = reactive({});
// 各链接地址
const val = reactive({});

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

function init() {
  LINKS.forEach((f) => {
    on[f.key] = true;
    val[f.key] = '';
  });
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = {
    track_url_type: 'CUSTOM',
    send_type: 'SERVER_SEND',
    track_url: [],
    action_track_url: '',
    active_track_url: '',
    video_play_effective_track_url: '',
    video_play_done_track_url: '',
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  // 只写入「开启」且填了值的链接
  const setting =
    payload && payload.track_url_setting
      ? payload.track_url_setting
      : { track_url_type: 'CUSTOM', send_type: 'SERVER_SEND' };
  LINKS.forEach((f) => {
    if (!on[f.key] || !val[f.key]) return;
    const v = val[f.key].trim();
    if (!v) return;
    if (f.field === 'track_url') setting.track_url = [v];
    else if (f.field === 'action_track_url') setting.action_track_url = [v];
    else if (f.field === 'active_track_url') setting.active_track_url = [v];
    else if (f.field === 'video_play_effective_track_url') setting.video_play_effective_track_url = [v];
    else if (f.field === 'video_play_done_track_url') setting.video_play_done_track_url = [v];
    else setting[f.field] = [v]; // video_play_track_url：开放平台 track_url_setting 未在注册表登记
  });
  if (!payload) payload = { track_url_setting: setting };
  const opened = LINKS.filter((f) => on[f.key]).length;
  ElMessage.success(
    `原型：已提交批量修改第三方监测链接任务（${rows.value.length} 个项目，开启 ${opened} 项）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.ptt-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.ptt-count { font-size: 14px; color: #666; }

/* 开启提示 */
.ptt-warn { display: flex; align-items: center; gap: 8px; margin: 16px 0; }
.ptt-warn-icon {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff9b48;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
}
.ptt-warn-text { font-size: 14px; color: #333; }

.ptt-form :deep(.el-form-item) { margin-bottom: 20px; }
.ptt-form :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.ptt-form :deep(.el-form-item__content) { line-height: 32px; }

/* 开启 / 不开启（选中为蓝字 + 浅蓝底 + 蓝框，80×32） */
.ptt-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #333;
  background: #fff;
  border-color: #dcdfe6;
  box-shadow: none;
}
.ptt-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
.ptt-radio :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.ptt-radio :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }

.ptt-input { width: 100%; }
.ptt-input :deep(.el-input__wrapper) { border-radius: 2px; }
.ptt-input :deep(.el-input__inner) { font-size: 13px; }
.ptt-num { font-size: 12px; color: #909399; }
</style>

<style>
/* 弹窗外壳：与线上一致（1000px 弹窗 / 标题 16px 700 #333 / body 24px 32px 32px） */
.ptt-dialog { padding: 0; }
.ptt-dialog .el-dialog__header { margin-right: 0; padding: 24px 32px 14px; border-bottom: 1px solid #e5e6eb; }
.ptt-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.ptt-dialog .el-dialog__body { padding: 24px 32px 32px; }
.ptt-dialog .el-dialog__footer { padding: 0 32px 32px; }
.ptt-dialog .el-dialog__footer .el-button { width: 120px; }
</style>
