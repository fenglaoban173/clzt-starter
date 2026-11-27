/**
 * 创意素材抽屉 —— 线上基准 spec
 *
 * 线上：https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *   → 预览表第 3 列「创意素材」→「编辑」（表格第 3 个「编辑」按钮）
 *
 * 线上实测（2026-11-26 实测，1920×1080 视口，证据见 C:/tmp/verify/diff/）：
 *   diff/media_probe_online.json   —— 几何 / 字段行 / 选项 / 按钮 / icon
 *   diff/state_probe_online.json   —— 逐选项切换后的状态快照
 *   diff/focus2_online.json         —— input.click() 精确切换后的行矩形与选中态
 *   diff/iconfont_glyphs.json       —— 线上 iconfont 字形（本地无字体，转内联 SVG）
 *
 *   外壳  .cl-drawer  x=904 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
 *   头部  .drawer-header  h=50  白底  padding 0 16px  下边框 1px #e8eaec
 *         头部里放的是「simple-tabs header-tabs」页签，**没有标题文字**
 *         页签：手动选取素材 / 动态选取素材   各 116×50，x=920 / x=1036
 *         文字 16px/700；激活 #197afb，未激活 #666；激活下划线 96×2 @ y=48
 *   内容  .drawer-content  x=920 y=66 w=984 h=932  白底 1px #e8eaec radius 3px padding 16px
 *   底部  .drawer-footer  x=904 y=1010 w=1016 h=70  白底 上边框 1px #e8eaec padding 12px 16px 24px
 *         按钮：取消 / 确 定   各 88×32  12px/500
 *   关闭键 .drawer-close  x=872 y=10 32×32（抽屉左侧外）
 *   表单   form.el-form.ml32-mr48.el-form--label-left
 *         label 宽 150px（14px #666 lh32，padding-right 12px），右侧内容 margin-left 150px
 *
 * 控件实测（线上 .el-radio-button__inner / .el-checkbox-button__inner 计算样式）：
 *   min-width 80px；height 32px；padding 9px 12px；font 12px；border-radius 3px
 *   radio  选中：bg #d6eaff / color #197afb / border #197afb
 *   check  选中：bg #197afb  / color #fff   / border #197afb   ← 与 radio 不同！
 *   禁用：color #c0c4cc / bg #fff / border #ebeef5
 *
 * 依赖关系（线上逐项点击实测，state_probe_online.json / focus2_online.json）：
 *   手动选取素材
 *     组织账户            —— 始终显示（视频上传至 = 广告主账户 时**不隐藏**）
 *     区分素材版式 = 视频 / 图片 → 素材卡上的「重新上传 / 智能封面」消失，「乱序」置灰
 *                           （视频与图片可同时勾选）
 *     多账户分配规则 = 分账户选择 → 同上（重新上传 / 智能封面消失、乱序置灰）
 *     引导视频 = 原链路 → 创意组区出现「添加引导视频」按钮
 *                      → 「批量添加素材」下拉末尾多出【添加引导视频 / 自动匹配引导视频】（均置灰）
 *     引导视频 = 新链路 → 同上，末尾多出【添加引导视频 / 按素材名称分配引导视频】（均置灰）
 *   动态选取素材
 *     每个广告素材数量 = 分规则设置 → 「区分素材版式」「每个创意组配置」整行消失，
 *                              「添加指定素材规则」由置灰变可用，
 *                              单选组多出第三个选项「单规则满足时搭建广告」
 *     选取素材不足时 = 循环使用素材 → 出现「素材循环使用上限」+ 两条说明
 *     选取素材不足时 = 余量广告按剩余素材搭建 → 出现一条说明
 *     引导视频 = 全部相同 → 出现「引导视频关键词」
 *     多账户分配规则 = 分账户选择 → 出现「复制到其他账户」（置灰）
 */

export default {
  id: 'material',
  /** 线上头部是页签不是标题文案；抽屉标题用页签名兜底 */
  title: '创意素材',
  width: 1016,
  shell: 'cl-drawer',
  /** 线上头部渲染成 simple-tabs（不是标题文字） */
  headerTabs: [
    { value: 'manual', label: '手动选取素材' },
    { value: 'dynamic', label: '动态选取素材' },
  ],
  /** 抽屉正文默认页签 */
  defaultTab: 'manual',

  /** 线上实测几何（1920×1080 视口，抽屉右侧 1016px） */
  geometry: {
    drawer: { width: 1016, headerHeight: 50, contentMargin: 16, contentPadding: 16, contentHeight: 932 },
    labelWidth: 150,
    labelFontSize: '14px',
    labelColor: '#666',
    labelLineHeight: '32px',
    footer: { height: 70, buttonWidth: 88, buttonHeight: 32, buttonFontSize: '12px', gap: 16 },
    tabs: { itemWidth: 116, itemHeight: 50, fontSize: '16px', fontWeight: 700, activeColor: '#197afb', inactiveColor: '#666', activeBar: { width: 96, height: 2 } },
    /** 线上 el-radio-button__inner 计算样式 */
    radio: {
      minWidth: 80, height: 32, padding: '9px 12px', fontSize: '12px', radius: 3,
      color: '#606266', bg: '#fff', border: '#dcdfe6',
      activeBg: '#d6eaff', activeColor: '#197afb', activeBorder: '#197afb',
      disabledColor: '#c0c4cc', disabledBg: '#fff', disabledBorder: '#ebeef5',
    },
    /** 线上 el-checkbox-button__inner 计算样式（选中为实心蓝 + 白字） */
    checkbox: {
      minWidth: 80, height: 32, padding: '9px 12px', fontSize: '12px', radius: 3,
      color: '#606266', bg: '#fff', border: '#dcdfe6',
      activeBg: '#197afb', activeColor: '#fff', activeBorder: '#197afb',
    },
    /** 线上 custom-radio-group 卡片（多账户分配规则） */
    card: {
      width: 200, height: 70, gap: 16, padding: 12, radius: 3, border: '#e5e6eb',
      titleFontSize: '14px', titleColor: '#333', descFontSize: '12px',
      activeColor: '#197afb', descColor: '#999',
    },
  },

  /**
   * 线上 iconfont 字形 → 内联 SVG path。
   * 本地无 iconfont 字体文件（线上 https://cl.mobgi.com/assets/iconfont-sRwj6nxH.ttf），
   * 故把字形轮廓抽成 path 复刻，viewBox 统一 0 0 1024 1024（线上 upm=1024）。
   */
  icons: {
    question2: {
      d: 'M512 896Q616 896 711 856Q803 817 874.0 746.0Q945 675 984 583Q1024 488 1024.0 384.0Q1024 280 984 185Q945 93 874.0 22.0Q803 -49 711 -88Q616 -128 512.0 -128.0Q408 -128 313 -88Q221 -49 150.0 22.0Q79 93 40 185Q0 280 0.0 384.0Q0 488 40 583Q79 675 150.0 746.0Q221 817 313 856Q408 896 512 896ZM512 832Q390 832 286 771Q185 711 125 610Q64 506 64.0 384.0Q64 262 125 158Q185 57 286 -3Q390 -64 512.0 -64.0Q634 -64 738 -3Q839 57 899 158Q960 262 960.0 384.0Q960 506 899 610Q839 711 738 771Q634 832 512 832ZM543 264V277Q543 306 556 329Q566 349 587 368Q641 414 652 428Q681 466 681 521Q681 591 635.5 631.5Q590 672 515 672Q430 672 381.5 623.5Q333 575 333 491H414Q414 542 435 570Q458 602 510 602Q552 602 574.5 579.0Q597 556 597 516Q597 487 576 460L563 445Q491 382 476 350Q461 321 461 277V264ZM502 113Q525 113 542.0 129.0Q559 145 559.0 168.0Q559 191 543.0 207.0Q527 223 502.0 223.0Q477 223 463 207Q445 192 445.0 168.5Q445 145 463 129Q478 113 502 113Z',
      size: 14, color: '#999', marginLeft: 8,
    },
    lock1: {
      d: 'M512 896Q580 896 637.5 861.5Q695 827 730.0 768.0Q765 709 768 638V448H834Q858 448 875.5 432.5Q893 417 896 393V386V-66Q896 -90 880.5 -107.5Q865 -125 841 -128H834H190Q167 -128 149.5 -112.5Q132 -97 129 -74L128 -66V386Q128 410 143.5 427.5Q159 445 183 448H190H256V625Q256 699 290.5 761.0Q325 823 383.5 859.5Q442 896 512 896ZM512 320Q477 320 450.0 297.5Q423 275 417.0 240.5Q411 206 429.0 175.5Q447 145 480 133V32Q480 19 489.5 9.5Q499 0 512.0 0.0Q525 0 534.5 9.5Q544 19 544 32V134Q577 145 595.0 175.5Q613 206 607.0 240.5Q601 275 574.0 297.5Q547 320 512 320ZM512 836Q460 836 415.5 809.5Q371 783 343.5 737.0Q316 691 313 636V448H711V625Q711 682 684.5 730.5Q658 779 612.0 807.5Q566 836 512 836Z',
      size: 14, color: '#197afb', marginLeft: 8,
    },
    lock2: {
      d: 'M768 896Q836 896 893.5 861.5Q951 827 986.0 768.0Q1021 709 1024 638V566H967V625Q967 682 940.5 730.5Q914 779 868.0 807.5Q822 836 769 836.0Q716 836 671.5 809.5Q627 783 599.5 737.0Q572 691 569 636V448H834Q858 448 875.5 432.5Q893 417 896 393V386V-66Q896 -90 880.5 -107.5Q865 -125 841 -128H834H190Q167 -128 149.5 -112.5Q132 -97 129 -74L128 -66V386Q128 410 143.5 427.5Q159 445 183 448H190H512V625Q512 699 546.5 761.0Q581 823 639.5 859.5Q698 896 768 896ZM512 320Q477 320 450.0 297.5Q423 275 417.0 240.5Q411 206 429.0 175.5Q447 145 480 133V32Q480 19 489.5 9.5Q499 0 512.0 0.0Q525 0 534.5 9.5Q544 19 544 32V134Q577 145 595.0 175.5Q613 206 607.0 240.5Q601 275 574.0 297.5Q547 320 512 320Z',
      size: 14, color: '#197afb', marginLeft: 8,
    },
    insert: {
      d: 'M832 864Q874 864 909.5 844.0Q945 824 967.0 790.0Q989 756 992 714V704V64Q992 22 972.0 -13.5Q952 -49 918.0 -71.0Q884 -93 842 -96H832H320Q278 -96 242.5 -76.0Q207 -56 185.0 -22.0Q163 12 160 54V64V444Q160 456 168.5 465.0Q177 474 189.0 475.5Q201 477 211.0 469.5Q221 462 223 449L224 444V64Q224 27 249.0 -0.5Q274 -28 311 -32H320H832Q869 -32 896.5 -7.0Q924 18 928 55V64V704Q928 741 903.0 768.5Q878 796 841 800H832H519Q507 800 497.5 808.5Q488 817 487.0 829.0Q486 841 493.5 851.0Q501 861 514 863L519 864ZM384 160ZM416 160H736Q768 160 768 128Q768 96 736 96H416Q384 96 384 128Q384 160 416 160ZM384 352ZM416 352H736Q768 352 768 320Q768 288 736 288H416Q384 288 384 320Q384 352 416 352ZM416 634Q428 635 437.5 626.5Q447 618 448.0 605.5Q449 593 441.5 583.0Q434 573 422 571L416 570H96Q84 570 74.5 578.5Q65 587 64.0 599.5Q63 612 70.5 622.0Q78 632 90 634H96ZM361 721Q370 729 381.5 730.0Q393 731 402 725L407 721L497 631Q505 622 506.0 610.5Q507 599 501 590L497 585L407 495Q398 486 385.5 485.5Q373 485 363.5 493.0Q354 501 352.5 513.0Q351 525 358 536L361 540L429 608L361 676Q353 684 352.0 695.5Q351 707 358 717Z',
      size: 12, color: '#2681fc', marginLeft: 4,
    },
    plus: {
      d: 'M0 441H1024V327H0ZM569 896V-128H455V896Z',
      size: 12, color: '#fff', marginLeft: 4,
    },
    warning: {
      d: 'M512 896Q616 896 711 856Q803 817 874.0 746.0Q945 675 984 583Q1024 488 1024.0 384.0Q1024 280 984 185Q945 93 874.0 22.0Q803 -49 711 -88Q616 -128 512.0 -128.0Q408 -128 313 -88Q221 -49 150.0 22.0Q79 93 40 185Q0 280 0.0 384.0Q0 488 40 583Q79 675 150.0 746.0Q221 817 313 856Q408 896 512 896ZM515 691Q480 691 456.5 668.0Q433 645 435 612L464 213H566L595 612Q597 645 573.5 668.0Q550 691 515 691ZM512 -9Q530 -9 546.0 0.5Q562 10 571.0 25.5Q580 41 580.0 59.5Q580 78 571.0 94.0Q562 110 546.0 119.0Q530 128 512 128Q484 128 464.0 108.0Q444 88 444.0 59.5Q444 31 464.0 11.0Q484 -9 512 -9Z',
      size: 12, color: '#ff7729', marginLeft: 0,
    },
    appUnchecked: {
      d: 'M797 628Q811 628 822.5 618.5Q834 609 837 595V587V-20Q837 -53 814.5 -76.5Q792 -100 759 -104H749H275Q241 -104 216.0 -82.5Q191 -61 187 -29V-20V587Q187 603 197.5 615.0Q208 627 223.5 628.0Q239 629 251.5 619.5Q264 610 267 595L268 587V-20Q268 -21 271 -22L275 -23H749Q753 -23 755 -21L756 -20V587Q756 604 768.0 616.0Q780 628 797 628ZM431 465Q447 465 459.0 453.5Q471 442 471 425V99Q471 82 459.0 70.5Q447 59 430.5 59.0Q414 59 402.0 70.5Q390 82 390 99V425Q390 442 402.0 453.5Q414 465 431 465ZM593 465Q610 465 622.0 453.5Q634 442 634 425V99Q634 82 622.0 70.5Q610 59 593.5 59.0Q577 59 565.0 70.5Q553 82 553 99V425Q553 442 565.0 453.5Q577 465 593 465ZM878 750Q895 750 907.0 738.0Q919 726 919.0 709.5Q919 693 907.0 681.0Q895 669 878 669H146Q129 669 117.0 681.0Q105 693 105.0 709.5Q105 726 117.0 738.0Q129 750 146 750ZM634 872Q651 872 663.0 860.0Q675 848 675.0 831.5Q675 815 663.0 803.0Q651 791 634 791H390Q373 791 361.0 803.0Q349 815 349.0 831.5Q349 848 361.0 860.0Q373 872 390 872Z',
      size: 14, color: '#197afb',
    },
  },

  /**
   * 抽屉内表单值（线上默认值）。
   * 组件用 reactive(spec.values) 初始化；所有依赖判定都读这个对象。
   * layout_video / layout_image 是「区分素材版式」两个勾选项的镜像标量，
   * 供 visibleWhenAll / disabledWhenAny 判定多选状态用。
   */
  values: {
    assign_rule: 'REUSE',
    upload_scope: 'EBP',
    org_account: '1873939327613259',
    home_visibility: 'HIDE_VIDEO_ON_HP',
    separate_layout: ['OFF'],
    layout_video: false,
    layout_image: false,
    per_account_config: false,
    group_counts: {
      VIDEO: '10', IMAGE: '0', TEXT_IMAGE: '0',
      /* 竖版视频默认上限 2，便于体验「素材卡删除」与 2/2 → 1/2 → 空态的变化 */
      VIDEO_VERTICAL: '2', VIDEO_HORIZONTAL: '1',
      IMAGE_VERTICAL: '1', IMAGE_HORIZONTAL: '1', IMAGE_SMALL: '1',
    },
    group_name_template: '',
    guide_video: 'OFF',
    ad_material_count_mode: 'SAME',
    single_rule_ad: true,
    insufficient_rule: 'TERMINATION',
    loop_limit: '2',
    guide_keyword: '',
  },

  tabs: [
    /* ============================================================
     * ① 手动选取素材
     * ========================================================== */
    {
      value: 'manual',
      label: '手动选取素材',
      sections: [
        {
          key: 'material_settings',
          title: '素材设置',
          fields: [
            {
              key: 'assign_rule',
              label: '多账户分配规则',
              type: 'cards',
              default: 'REUSE',
              rowHeight: 70,
              gapAfter: 20,
              options: [
                { value: 'REUSE', label: '全账户复用', desc: '所有账户都使用一样的素材' },
                { value: 'AVERAGE', label: '平均分配', desc: '素材平均分到每个账户中' },
                { value: 'PER_ACCOUNT', label: '分账户选择', desc: '每个账户单独选择素材' },
              ],
              note: '线上 custom-radio-group 卡片式三选一（200×70，卡间距 16px，内边距 12px）；'
                + '选中卡片的标题与说明都变蓝 #197afb，未选中说明 #999',
            },
            {
              key: 'upload_scope',
              label: '视频上传至',
              type: 'radio',
              default: 'EBP',
              rowHeight: 33,
              gapAfter: 20,
              options: [
                { value: 'ADVERTISER', label: '广告主账户' },
                { value: 'EBP', label: '升级版工作台组织' },
              ],
              note: '线上只有 2 个选项；el-radio-button__inner min-width 80px',
            },
            {
              key: 'org_account',
              label: '组织账户',
              type: 'select',
              required: true,
              default: '1873939327613259',
              rowHeight: 38,
              gapAfter: 20,
              width: 300,
              /** 只在「视频上传至 = 升级版工作台组织」时显示（上传到广告主账户时不需要组织） */
              visibleWhen: { field: 'upload_scope', eq: 'EBP' },
              options: [
                { value: '1873939327613259', label: '央广时代(1873939327613259)' },
                { value: '1875663344111624', label: '央广漫剧R3(1875663344111624)' },
                { value: '1873760026148729', label: '代理央广时代(1873760026148729)' },
              ],
              note: '只在「视频上传至 = 升级版工作台组织」时显示；必填；el-select 宽 300px',
            },
            {
              key: 'org_share_tip',
              label: '',
              type: 'alert',
              visibleWhen: { field: 'upload_scope', eq: 'EBP' },
              text: '请在升级版工作台-素材-视频管理处操作共享，避免组织下账户无法使用。',
              linkText: '如图所示',
              note: '线上 el-alert cl-simple-alert is-warning ebp-share-tip（x=1387，即组织账户下拉右侧），'
                + '文字 12px #ff9b48，底 #fdf6ec，前置 el-icon-warning is-big 16×16 #ff9b48',
            },
            {
              key: 'home_visibility',
              label: '主页可见',
              type: 'radio',
              default: 'HIDE_VIDEO_ON_HP',
              rowHeight: 69,
              gapAfter: 20,
              options: [
                { value: 'ALWAYS_VISIBLE', label: '主页始终可见' },
                { value: 'HIDE_VIDEO_ON_HP', label: '仅单次展示可见' },
              ],
              bubble: {
                when: { field: 'home_visibility', truthy: true },
                text: '主页始终可见：信息流与主页作品列表均展示该视频。\n仅单次展示可见：仅当用户在信息流中刷到该视频时，当次进入主页可看到该视频，其他情况主页不展示该视频。',
              },
              tip: '仅视频及图文素材、且来源不为抖音主页素材时生效',
              tipClass: 'warning',
              note: '线上默认「仅单次展示可见」；label 右侧 mg-icon-question2 14×14 #999（ml8）'
                + '弹出 el-popover（宽 296px，fs12）；说明行 class="fs12 text-warning mt4" 12px #ff7729',
            },
            {
              key: 'separate_layout',
              label: '区分素材版式',
              type: 'checkbox',
              default: ['OFF'],
              rowHeight: 33,
              gapAfter: 21,
              /** 勾选项与 values 里标量键的对应关系（视频 / 图片 可同时勾选） */
              valueKeys: { VIDEO: 'layout_video', IMAGE: 'layout_image' },
              options: [
                { value: 'OFF', label: '不启用', exclusive: true },
                { value: 'VIDEO', label: '视频', valueKey: 'layout_video' },
                { value: 'IMAGE', label: '图片', valueKey: 'layout_image' },
              ],
              optionBubble: [
                { value: 'VIDEO', text: '开启后视频素材与图片素材分开配置创意组' },
                { value: 'IMAGE', text: '开启后图片素材与视频素材分开配置创意组' },
              ],
              note: '线上 el-checkbox-group mc-check-group mc-check-group--button（按钮式），'
                + '「不启用」带 is-all-option 互斥类；选中为**实心蓝底 #197afb + 白字**；'
                + '每个选项都带 tiny-popover 气泡引用',
            },
            {
              key: 'per_account_config',
              label: '',
              type: 'checkbox',
              text: '分账户配置',
              visibleWhen: { field: 'assign_rule', eq: 'PER_ACCOUNT' },
              note: '线上：多账户分配规则 = 分账户选择 时，「区分素材版式」右侧多出 el-checkbox「分账户配置」',
            },
            {
              key: 'group_config',
              label: '每个创意组配置',
              type: 'groupCounts',
              default: { VIDEO: 10, IMAGE: 0, TEXT_IMAGE: 0 },
              rowHeight: 72,
              gapAfter: 20,
              itemWidth: 182,
              itemGap: 0,
              items: [
                { value: 'VIDEO', label: '视频', max: 10, lockIcon: 'lock2', lockTip: '未锁定，锁定后所有创意组都将使用相同的视频素材组合' },
                { value: 'IMAGE', label: '图片', max: 10, lockIcon: 'lock2', lockTip: '未锁定，锁定后所有创意组都将使用相同的图片素材组合' },
                { value: 'TEXT_IMAGE', label: '图文', max: 10, lockIcon: 'lock2', lockTip: '未锁定，锁定后所有创意组都将使用相同的图文素材组合' },
              ],
              /**
               * 线上「区分素材版式」联动：勾选视频 / 图片后，视频、图片被拆成版式细分项
               *   不启用        → 视频 / 图片 / 图文
               *   视频          → 竖版视频 / 横版视频 / 图片 / 图文
               *   图片          → 视频 / 竖版图片 / 横版图片 / 小图 / 图文
               *   视频 + 图片   → 竖版视频 / 横版视频 / 竖版图片 / 横版图片 / 小图 / 图文
               * 每列宽 182、列间无间距、行距 16（三列换行，图文落到第二行）
               */
              layoutItems: {
                NONE: [
                  { value: 'VIDEO', label: '视频', default: '10' },
                  { value: 'IMAGE', label: '图片', default: '0' },
                  { value: 'TEXT_IMAGE', label: '图文', default: '0' },
                ],
                VIDEO: [
                  { value: 'VIDEO_VERTICAL', label: '竖版视频', default: '1' },
                  { value: 'VIDEO_HORIZONTAL', label: '横版视频', default: '1' },
                  { value: 'IMAGE', label: '图片', default: '0' },
                  { value: 'TEXT_IMAGE', label: '图文', default: '0' },
                ],
                IMAGE: [
                  { value: 'VIDEO', label: '视频', default: '0' },
                  { value: 'IMAGE_VERTICAL', label: '竖版图片', default: '1' },
                  { value: 'IMAGE_HORIZONTAL', label: '横版图片', default: '1' },
                  { value: 'IMAGE_SMALL', label: '小图', default: '1' },
                  { value: 'TEXT_IMAGE', label: '图文', default: '0' },
                ],
                BOTH: [
                  { value: 'VIDEO_VERTICAL', label: '竖版视频', default: '1' },
                  { value: 'VIDEO_HORIZONTAL', label: '横版视频', default: '1' },
                  { value: 'IMAGE_VERTICAL', label: '竖版图片', default: '1' },
                  { value: 'IMAGE_HORIZONTAL', label: '横版图片', default: '1' },
                  { value: 'IMAGE_SMALL', label: '小图', default: '1' },
                  { value: 'TEXT_IMAGE', label: '图文', default: '0' },
                ],
              },
              bubble: {
                when: { field: 'group_config', truthy: true },
                text: '创意组的素材配置，即为广告内的创意形式；创意组数量，影响广告最终生成数量。',
              },
              tip: '即单个广告内的素材数量。注：因媒体限制，视频最多10个，图片最多10个，图文最多10个。',
              tipHeight: 32,
              note: '线上 el-input-group（prepend 版式名）+ 锁图标 group-config__lock mg-icon-lock2'
                + '（14×14 #197afb）；数值框 80×32；说明行 count-tips 12px #999，行高 32px（继承 form-item 的 line-height:32px）',
            },
            {
              key: 'group_name_template',
              label: '统一配置创意组名',
              type: 'input',
              default: '',
              placeholder: '',
              width: 360,
              rowHeight: 65,
              gapAfter: 20,
              bubble: {
                when: { field: 'group_name_template', truthy: true },
                text: '可在广告名称中增加<创意组名称>通配符使用；\n统一配置后将会替换当前所有创意组名称，请确保使用的通配符不会全部替换为空；',
              },
              wildcards: [
                { label: '素材名', text: '在广告名称中展示创意组的第一个素材名名称，没有选中内容时则替换为空。' },
                { label: '横版视频名', text: '在广告名称中展示创意组中的第一个横版视频名称，没有选中内容时则替换为空。' },
                { label: '竖版视频名', text: '在广告名称中展示创意组的第一个竖版视频名称，没有选中内容时则替换为空。' },
              ],
              moreText: '插入更多',
              moreIcon: 'insert',
              note: '线上：输入框 w360，「统一配置」按钮 80×32 主色（ml16，输入为空时置灰 #a0cfff）；'
                + '下方一行是「通配符:」(tag-desc 12px #999) + 三个 el-button--text el-button--mini（前置 el-icon-plus 12×12）'
                + ' +「插入更多」(mg-icon-insert 12×13 #2681fc)，**同一行**',
            },
            {
              key: 'guide_video',
              label: '引导视频',
              type: 'radio',
              default: 'OFF',
              rowHeight: 33,
              gapAfter: 22,
              options: [
                { value: 'OFF', label: '不启用' },
                { value: 'OLD', label: '原链路' },
                { value: 'NEW', label: '新链路' },
              ],
              bubble: {
                when: { field: 'guide_video', truthy: true },
                text: '媒体白名单功能，仅游戏行业广告主投放奖励关卡广告时必填',
              },
              note: '线上默认「不启用」；label 右侧 mg-icon-question2 14×14 #999',
            },
          ],
        },
        {
          key: 'creative',
          title: '创意制作',
          fields: [
            {
              key: 'creative_group',
              label: '',
              type: 'custom',
              note: '线上 creative-wrapper：标题「创意制作」（创意组数量：N）+ 右侧工具条',
            },
            {
              key: 'shuffle_btn',
              label: '',
              type: 'button',
              text: '乱序',
              disabledWhenAny: [
                { field: 'assign_rule', eq: 'PER_ACCOUNT' },
                { field: 'layout_video', truthy: true },
                { field: 'layout_image', truthy: true },
              ],
              note: '线上：多账户分配规则 = 分账户选择，或 区分素材版式 = 视频/图片 时，「乱序」置灰',
            },
            {
              key: 'material_ops',
              label: '',
              type: 'custom',
              visibleWhenAll: [
                { field: 'assign_rule', neq: 'PER_ACCOUNT' },
                { field: 'layout_video', truthy: false },
                { field: 'layout_image', truthy: false },
              ],
              note: '线上：多账户分配规则 = 分账户选择 或 区分素材版式 = 视频/图片 时，'
                + '素材卡上的「重新上传 / 智能封面」消失',
            },
            {
              key: 'guide_video_btn',
              label: '',
              type: 'button',
              text: '添加引导视频',
              visibleWhen: { field: 'guide_video', in: ['OLD', 'NEW'] },
              note: '线上：引导视频 = 原链路 / 新链路 时，创意组区出现「添加引导视频」按钮',
            },
          ],
        },
      ],
      /** 工具条按钮（线上顺序） */
      toolbar: ['乱序', '清空', '更多菜单', '随机选择', '智能优选', '一键测新', '批量添加素材'],
      toolbarMore: ['批量添加封面', '一键指定封面'],
      /** 「批量添加素材」下拉：基础 4 项 + 按引导视频追加的 2 项 */
      toolbarAddMaterial: ['添加本地素材', '添加已有图文'],
      toolbarAddMaterialGuide: {
        OLD: ['添加引导视频', '自动匹配引导视频'],
        NEW: ['添加引导视频', '按素材名称分配引导视频'],
      },
      /** 创意组卡片内的操作 */
      groupOps: ['添加素材', '重新上传', '智能封面'],
      /** 创意组页签（线上 el-tabs，不是按钮） */
      creativeTabs: ['视频', '图片', '图文'],
    },

    /* ============================================================
     * ② 动态选取素材
     * ========================================================== */
    {
      value: 'dynamic',
      label: '动态选取素材',
      sections: [
        {
          key: 'material_settings',
          title: '素材设置',
          fields: [
            {
              key: 'assign_rule',
              label: '多账户分配规则',
              type: 'cards',
              default: 'REUSE',
              rowHeight: 70,
              gapAfter: 21,
              options: [
                { value: 'REUSE', label: '全账户复用', desc: '所有账户都使用一样的规则' },
                { value: 'AVERAGE', label: '平均分配', desc: '素材平均分到每个账户中' },
                { value: 'PER_ACCOUNT', label: '分账户选择', desc: '每个账户单独选择规则' },
              ],
              note: '线上「动态选取素材」页签的第 1/3 张卡片说明文案与手动页签不同：复用→「所有账户都使用一样的规则」，分账户选择→「每个账户单独选择规则」',
            },
            {
              key: 'upload_scope',
              label: '视频上传至',
              type: 'radio',
              default: 'EBP',
              rowHeight: 33,
              gapAfter: 20,
              options: [
                { value: 'ADVERTISER', label: '广告主账户' },
                { value: 'EBP', label: '升级版工作台组织' },
              ],
            },
            {
              key: 'org_account',
              label: '组织账户',
              type: 'select',
              required: true,
              default: '1873939327613259',
              rowHeight: 38,
              gapAfter: 20,
              width: 300,
              visibleWhen: { field: 'upload_scope', eq: 'EBP' },
              options: [
                { value: '1873939327613259', label: '央广时代(1873939327613259)' },
                { value: '1875663344111624', label: '央广漫剧R3(1875663344111624)' },
                { value: '1873760026148729', label: '代理央广时代(1873760026148729)' },
              ],
              note: '只在「视频上传至 = 升级版工作台组织」时显示',
            },
            {
              key: 'org_share_tip',
              label: '',
              type: 'alert',
              visibleWhen: { field: 'upload_scope', eq: 'EBP' },
              text: '请在升级版工作台-素材-视频管理处操作共享，避免组织下账户无法使用。',
              linkText: '如图所示',
            },
            {
              key: 'home_visibility',
              label: '主页可见',
              type: 'radio',
              default: 'HIDE_VIDEO_ON_HP',
              rowHeight: 69,
              gapAfter: 20,
              options: [
                { value: 'ALWAYS_VISIBLE', label: '主页始终可见' },
                { value: 'HIDE_VIDEO_ON_HP', label: '仅单次展示可见' },
              ],
              bubble: {
                when: { field: 'home_visibility', truthy: true },
                text: '主页始终可见：信息流与主页作品列表均展示该视频。\n仅单次展示可见：仅当用户在信息流中刷到该视频时，当次进入主页可看到该视频，其他情况主页不展示该视频。',
              },
              tip: '仅视频及图文素材、且来源不为抖音主页素材时生效',
              tipClass: 'warning',
            },
            {
              key: 'ad_material_count_mode',
              label: '每个广告素材数量',
              type: 'radio',
              default: 'SAME',
              rowHeight: 33,
              gapAfter: 21,
              options: [
                { value: 'SAME', label: '统一设置' },
                { value: 'RULE', label: '分规则设置' },
              ],
              note: '线上为动态选取素材页签独有字段（手动页签没有）；'
                + '选「分规则设置」后，单选组右侧同行出现橙色提示，并在下一行出现勾选项「单规则满足时搭建广告」',
            },
            {
              key: 'single_rule_ad',
              label: '',
              type: 'checkbox',
              default: true,
              rowHeight: 30,
              gapAfter: 16,
              text: '单规则满足时搭建广告',
              bubble: {
                text: '开启后，任意规则满足所需素材数量便搭建广告',
              },
              visibleWhen: { field: 'ad_material_count_mode', eq: 'RULE' },
              note: '线上：勾选框（蓝色勾 + 蓝字），其后跟灰色 ? 图标；默认勾选',
            },
            {
              key: 'separate_layout',
              label: '区分素材版式',
              type: 'checkbox',
              default: ['OFF'],
              rowHeight: 33,
              gapAfter: 20,
              valueKeys: { VIDEO: 'layout_video', IMAGE: 'layout_image' },
              options: [
                { value: 'OFF', label: '不启用', exclusive: true },
                { value: 'VIDEO', label: '视频', valueKey: 'layout_video' },
                { value: 'IMAGE', label: '图片', valueKey: 'layout_image' },
              ],
              optionBubble: [
                { value: 'VIDEO', text: '开启后视频素材与图片素材分开配置创意组' },
                { value: 'IMAGE', text: '开启后图片素材与视频素材分开配置创意组' },
              ],
              visibleWhen: { field: 'ad_material_count_mode', neq: 'RULE' },
              note: '线上：每个广告素材数量 = 分规则设置 时「区分素材版式」整行消失',
            },
            {
              key: 'group_config',
              label: '每个创意组配置',
              type: 'groupCounts',
              default: { VIDEO: '', IMAGE: '' },
              rowHeight: 72,
              gapAfter: 20,
              itemWidth: 182,
              itemGap: 0,
              items: [
                { value: 'VIDEO', label: '视频', max: 10 },
                { value: 'IMAGE', label: '图片', max: 10 },
              ],
              /** 动态页签同样按「区分素材版式」拆分，但没有图文项 */
              layoutItems: {
                NONE: [
                  { value: 'VIDEO', label: '视频', default: '0' },
                  { value: 'IMAGE', label: '图片', default: '0' },
                ],
                VIDEO: [
                  { value: 'VIDEO_VERTICAL', label: '竖版视频', default: '0' },
                  { value: 'VIDEO_HORIZONTAL', label: '横版视频', default: '0' },
                  { value: 'IMAGE', label: '图片', default: '0' },
                ],
                IMAGE: [
                  { value: 'VIDEO', label: '视频', default: '0' },
                  { value: 'IMAGE_VERTICAL', label: '竖版图片', default: '0' },
                  { value: 'IMAGE_HORIZONTAL', label: '横版图片', default: '0' },
                  { value: 'IMAGE_SMALL', label: '小图', default: '0' },
                ],
                BOTH: [
                  { value: 'VIDEO_VERTICAL', label: '竖版视频', default: '0' },
                  { value: 'VIDEO_HORIZONTAL', label: '横版视频', default: '0' },
                  { value: 'IMAGE_VERTICAL', label: '竖版图片', default: '0' },
                  { value: 'IMAGE_HORIZONTAL', label: '横版图片', default: '0' },
                  { value: 'IMAGE_SMALL', label: '小图', default: '0' },
                ],
              },
              bubble: {
                when: { field: 'group_config', truthy: true },
                text: '创意组的素材配置，即为广告内的创意形式；创意组数量，影响广告最终生成数量。',
              },
              tip: '动态选取时为每个广告使用的素材数量，不需要的素材类型请设置为0。',
              tipHeight: 32,
              visibleWhen: { field: 'ad_material_count_mode', neq: 'RULE' },
              note: '线上：分规则设置 时「每个创意组配置」整行消失；动态页签只有视频/图片两类（无图文）',
            },
            {
              key: 'count_mode_tip',
              label: '',
              type: 'inlineTip',
              visibleWhen: { field: 'ad_material_count_mode', eq: 'RULE' },
              text: '多个规则需设置差异化，避免搭建报错重复素材',
              icon: 'warning',
              note: '线上：每个广告素材数量 = 分规则设置 时，单选组**右侧同行**出现提示'
                + '（div.ml16.fs12.text-warning.inline-block，前置 mg-icon-warning 图标）',
            },
            {
              key: 'insufficient_rule',
              label: '选取素材不足时',
              type: 'radio',
              default: 'TERMINATION',
              rowHeight: 33,
              gapAfter: 20,
              options: [
                { value: 'TERMINATION', label: '余量广告不搭建' },
                { value: 'LOOP', label: '循环使用素材' },
                { value: 'PARTIAL', label: '余量广告按剩余素材搭建' },
              ],
              note: '线上默认「余量广告不搭建」',
            },
            {
              key: 'loop_limit',
              label: '素材循环使用上限',
              type: 'number',
              default: 2,
              min: 2,
              max: 50,
              rowHeight: 33,
              visibleWhen: { field: 'insufficient_rule', eq: 'LOOP' },
              tips: [
                '可填 2 ~ 50，填写 2 表示素材池扩展为 2 倍（同一素材最多被复用 1 次）',
                '请勿将循环次数设置过高，以避免只选取1个素材应用到上千广告中，从而产生无效广告',
              ],
              note: '线上：选取素材不足时 = 循环使用素材 时新增此字段 + 两条说明',
            },
            {
              key: 'partial_tip',
              label: '',
              type: 'tip',
              visibleWhen: { field: 'insufficient_rule', eq: 'PARTIAL' },
              text: '素材不足以凑满一个创意组时，使用剩余素材搭建余量广告，该条广告的素材数量会少于配置数量，且不会复用已有素材',
            },
            {
              key: 'guide_video',
              label: '引导视频',
              type: 'radio',
              default: 'OFF',
              rowHeight: 33,
              gapAfter: 22,
              options: [
                { value: 'OFF', label: '不启用' },
                { value: 'SAME', label: '全部相同' },
              ],
              bubble: {
                when: { field: 'guide_video', truthy: true },
                text: '媒体白名单功能，仅游戏行业广告主投放奖励关卡广告时必填',
              },
              note: '线上动态页签引导视频只有「不启用 / 全部相同」两项',
            },
            {
              key: 'guide_keyword',
              label: '引导视频关键词',
              type: 'input',
              default: '',
              rowHeight: 33,
              visibleWhen: { field: 'guide_video', eq: 'SAME' },
              note: '线上：引导视频 = 全部相同 时新增此字段',
            },
            {
              key: 'dyn_note',
              label: '',
              type: 'alert',
              text: '使用动态选取时将视为1个创意组参与叉乘，若需生成更多项目广告，请修改规则配置为指定数量，',
              linkText: '如图所示',
            },
            {
              key: 'copy_to_other_account',
              label: '',
              type: 'button',
              text: '复制到其他账户',
              disabled: true,
              visibleWhen: { field: 'assign_rule', eq: 'PER_ACCOUNT' },
              note: '线上：多账户分配规则 = 分账户选择 时出现，初始置灰',
            },
          ],
        },
        {
          key: 'dynamic_rules',
          title: '动态选取规则',
          fields: [
            {
              key: 'dynamic_rules',
              label: '',
              type: 'dynamicRules',
              note: '线上：工具条「添加动态选取规则」（主色）+「添加指定素材规则」（白底），空态显示「点击添加」',
            },
            {
              key: 'add_fixed_rule_btn',
              label: '',
              type: 'button',
              text: '添加指定素材规则',
              disabledWhen: { field: 'ad_material_count_mode', neq: 'RULE' },
              note: '线上：默认置灰；每个广告素材数量 = 分规则设置 时变为可用',
            },
          ],
        },
      ],
      toolbar: ['添加动态选取规则'],
    },
  ],

  footer: { buttons: ['取消', '确定'], cancelText: '取 消', okText: '确 定' },
};
