/**
 * 「广告基本信息」抽屉 spec
 *
 * 线上取证（只读，2026-11-26 实测）：
 *   https://cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch
 *   → 选择任务 → 单选第 4 条 → 确认 → 广告信息列（第 2 列）「编辑」
 *   ※ 只有第 4 条起的任务才会渲染全部 7 个分区（前 3 条没有「直达链接」「广告预算与出价」）
 *
 * 采集产物（本次同构对拍）：
 *   C:/tmp/verify/diff/adparity_online.json   —— 字段树 / 24 个选项切换后的快照 / hover 气泡
 *   C:/tmp/verify/diff/adstyle_online.json     —— 控件级 computed style + 几何
 *   C:/tmp/verify/diff/adsel_online.json       —— 按选择器取样式（alert / card / table / 预估卡 …）
 *   C:/tmp/verify/diff/adhover_online.json      —— popover 文案（懒渲染后回读）
 *   C:/tmp/verify/diff/adprobe4_online.json     —— 「选择抖音号」label 尾部 ⓘ 的气泡文案
 *
 * 依赖语义与求值器见 spec/resolve.js（isVisible / isDisabled / bubbleText / optionBubbleText）。
 * 本 spec 额外用到四个 resolve.js 未覆盖的声明式能力（同样在本文件内声明，勿散落到组件里）：
 *   optionDisabled : [{ value, when }]           选项级禁用
 *   optionsWhen    : { <依赖字段值>: [options] }  选项集合随依赖字段切换
 *   after          : [ subField ]                同一行控件列内的附加块（线上 tip / 说明图）
 *   labelWhen      : { <依赖字段值>: '文案' }      label 文案随依赖字段切换
 *   checkboxes     : [ { key, label, bubble } ]   字段内的复选项（广告名称）
 *   optionBubble 的 image 字段                   选项级气泡是一张图（推广身份）
 *   help           : { <依赖字段值>: {...} }      字段旁的说明块（推广身份：示意图 + tips）
 */

export default {
  id: 'ad',
  title: '广告基本信息',
  width: 1016,
  shell: 'cl-drawer',

  /**
   * 线上 iconfont 字形 → 内联 SVG path。
   * 本地无 iconfont 字体文件（线上 /assets/iconfont-sRwj6nxH.ttf 与 /assets/element-icons-*.ttf），
   * 故把字形轮廓抽成 path 复刻，viewBox 统一 0 -128 1024 1024（两套字体 upm 都是 1024，
   * ascent 896 / descent -128，与 em 盒一致）。
   */
  icons: {
    /* 线上 mg-icon-question2（U+E67D）→ 内联 SVG path */
    question2: { d: 'M512 896Q616 896 711 856Q803 817 874.0 746.0Q945 675 984 583Q1024 488 1024.0 384.0Q1024 280 984 185Q945 93 874.0 22.0Q803 -49 711 -88Q616 -128 512.0 -128.0Q408 -128 313 -88Q221 -49 150.0 22.0Q79 93 40 185Q0 280 0.0 384.0Q0 488 40 583Q79 675 150.0 746.0Q221 817 313 856Q408 896 512 896ZM512 832Q390 832 286 771Q185 711 125 610Q64 506 64.0 384.0Q64 262 125 158Q185 57 286 -3Q390 -64 512.0 -64.0Q634 -64 738 -3Q839 57 899 158Q960 262 960.0 384.0Q960 506 899 610Q839 711 738 771Q634 832 512 832ZM543 264V277Q543 306 556 329Q566 349 587 368Q641 414 652 428Q681 466 681 521Q681 591 635.5 631.5Q590 672 515 672Q430 672 381.5 623.5Q333 575 333 491H414Q414 542 435 570Q458 602 510 602Q552 602 574.5 579.0Q597 556 597 516Q597 487 576 460L563 445Q491 382 476 350Q461 321 461 277V264ZM502 113Q525 113 542.0 129.0Q559 145 559.0 168.0Q559 191 543.0 207.0Q527 223 502.0 223.0Q477 223 463 207Q445 192 445.0 168.5Q445 145 463 129Q478 113 502 113Z', size: 12, color: '#999' },
    /* 线上 mg-icon-close（U+E64D）→ 内联 SVG path */
    close: { d: 'M853 657 785 725 512 452 239 725 171 657 444 384 171 111 239 43 512 316 785 43 853 111 580 384Z', size: 16, color: '#999' },
    /* 线上 mg-icon-refresh-right（U+E64F）→ 内联 SVG path */
    refreshRight: { d: 'M721 453 671 483Q660 490 647.0 487.0Q634 484 627.5 472.5Q621 461 624.0 448.0Q627 435 638 428L776 345L859 484Q866 496 863.0 508.5Q860 521 848.5 528.0Q837 535 824.5 531.5Q812 528 805 517L780 475Q760 544 713.0 597.0Q666 650 601 678Q521 712 437 701Q354 691 288 640Q219 589 185.5 509.0Q152 429 163 343Q173 260 223 193Q274 123 353 89Q410 65 471.5 64.0Q533 63 590.5 85.0Q648 107 693 150Q703 159 703.0 172.5Q703 186 694.5 195.5Q686 205 672.5 205.5Q659 206 650 197Q595 145 521.0 132.0Q447 119 378 148Q314 175 274.0 230.0Q234 285 225.5 352.5Q217 420 243.5 484.0Q270 548 324.5 588.5Q379 629 445.5 638.0Q512 647 576 620Q629 597 667.0 553.0Q705 509 721 453Z', size: 12, color: '#2e71ea' },
    /* 线上 mg-icon-insert（U+E691）→ 内联 SVG path */
    insert: { d: 'M832 864Q874 864 909.5 844.0Q945 824 967.0 790.0Q989 756 992 714V704V64Q992 22 972.0 -13.5Q952 -49 918.0 -71.0Q884 -93 842 -96H832H320Q278 -96 242.5 -76.0Q207 -56 185.0 -22.0Q163 12 160 54V64V444Q160 456 168.5 465.0Q177 474 189.0 475.5Q201 477 211.0 469.5Q221 462 223 449L224 444V64Q224 27 249.0 -0.5Q274 -28 311 -32H320H832Q869 -32 896.5 -7.0Q924 18 928 55V64V704Q928 741 903.0 768.5Q878 796 841 800H832H519Q507 800 497.5 808.5Q488 817 487.0 829.0Q486 841 493.5 851.0Q501 861 514 863L519 864ZM384 160ZM416 160H736Q768 160 768 128Q768 96 736 96H416Q384 96 384 128Q384 160 416 160ZM384 352ZM416 352H736Q768 352 768 320Q768 288 736 288H416Q384 288 384 320Q384 352 416 352ZM416 634Q428 635 437.5 626.5Q447 618 448.0 605.5Q449 593 441.5 583.0Q434 573 422 571L416 570H96Q84 570 74.5 578.5Q65 587 64.0 599.5Q63 612 70.5 622.0Q78 632 90 634H96ZM361 721Q370 729 381.5 730.0Q393 731 402 725L407 721L497 631Q505 622 506.0 610.5Q507 599 501 590L497 585L407 495Q398 486 385.5 485.5Q373 485 363.5 493.0Q354 501 352.0 513.0Q351 525 358 536L361 540L429 608L361 676Q353 684 352.0 695.5Q351 707 358 717Z', size: 12, color: '#2681fc' },
    /* 线上 mg-icon-plus（U+E64E）→ 内联 SVG path */
    plus: { d: 'M0 441H1024V327H0ZM569 896V-128H455V896Z', size: 12, color: '#197afb' },
    /* 线上 el-icon-close（U+E6DB）→ 内联 SVG path */
    closeEl: { d: 'M764 681 512 429 260 681Q250 690 237.5 690.0Q225 690 215.5 680.5Q206 671 206.0 658.5Q206 646 215 636L467 384L215 132Q202 119 206.5 101.0Q211 83 228.5 78.5Q246 74 260 87L512 339L764 87Q774 78 786.5 78.0Q799 78 808.5 87.5Q818 97 818.0 109.5Q818 122 809 132L557 384L809 636Q822 649 817.5 667.0Q813 685 795.0 689.5Q777 694 764 681Z', size: 12, color: '#c0c4cc' },
    /* 线上 el-icon-plus（U+E6D9）→ 内联 SVG path */
    plusEl: { d: 'M480 416V768Q480 782 489.0 791.0Q498 800 512.0 800.0Q526 800 535.0 791.0Q544 782 544 768V416H896Q910 416 919.0 407.0Q928 398 928.0 384.0Q928 370 919.0 361.0Q910 352 896 352H544V0Q544 -14 535.0 -23.0Q526 -32 512.0 -32.0Q498 -32 489.0 -23.0Q480 -14 480 0V352H128Q114 352 105.0 361.0Q96 370 96.0 384.0Q96 398 105.0 407.0Q114 416 128 416Z', size: 14, color: '#666' },
    /* 线上 el-icon-warning（U+E7A3）→ 内联 SVG path */
    warning: { d: 'M512 832Q702 827 828.5 700.5Q955 574 960 384Q955 194 828.5 67.5Q702 -59 512 -64Q322 -59 195.5 67.5Q69 194 64 384Q69 574 195.5 700.5Q322 827 512 832ZM512 640Q486 640 469.0 621.0Q452 602 454 576L477 320Q479 306 488.5 297.5Q498 289 512.0 289.0Q526 289 535.5 297.5Q545 306 547 320L570 576Q572 602 555.0 621.0Q538 640 512 640ZM512 128Q534 129 548.5 143.0Q563 157 563.0 179.0Q563 201 548.5 215.5Q534 230 512.0 230.0Q490 230 475.5 215.5Q461 201 461.0 179.0Q461 157 475.5 143.0Q490 129 512 128Z', size: 14, color: '#ff9b48' },
    /* 线上 el-icon-info（U+E7A1）→ 内联 SVG path */
    info: { d: 'M512 832Q702 827 828.5 700.5Q955 574 960 384Q955 194 828.5 67.5Q702 -59 512 -64Q322 -59 195.5 67.5Q69 194 64 384Q69 574 195.5 700.5Q322 827 512 832ZM579 557Q605 557 622.0 572.5Q639 588 639.0 614.0Q639 640 622.0 655.5Q605 671 579.5 671.0Q554 671 537.0 655.5Q520 640 520.0 614.0Q520 588 537.0 572.5Q554 557 579 557ZM591 197Q591 203 592.0 213.0Q593 223 592 232L539 171Q531 162 522.5 157.0Q514 152 508 154Q499 158 500 168L588 445Q593 473 579.0 493.0Q565 513 534 517Q499 516 457.5 487.5Q416 459 385 415V400Q384 390 385 381L438 442Q446 451 454.5 456.0Q463 461 468 459Q478 454 475 443L388 167Q381 142 395.0 122.5Q409 103 444 96Q494 97 528.0 125.0Q562 153 591 197Z', size: 16, color: '#197afb' },
    /* 线上 el-icon-arrow-up（U+E6E1）→ 内联 SVG path */
    caretUp: { d: 'M489 552 149 195Q140 185 140.0 173.0Q140 161 149 151V150Q158 141 170.5 141.0Q183 141 192 150L512 486L832 150Q841 141 853.5 141.0Q866 141 875 150V151Q884 161 884.0 173.0Q884 185 875 195L535 552Q526 561 512.0 561.0Q498 561 489 552Z', size: 14, color: '#c0c4cc' },
    /* 线上 el-icon-s-unfold（U+E7BC）→ 内联 SVG path */
    unfold: { d: 'M128 704H896V576H128ZM128 448H640V320H128ZM128 192H896V64H128ZM704 544 896 384 704 256Z', size: 24, color: '#197afb' },
  },

  /**
   * 抽屉内所有字段的初值（组件 reactive(spec.values) 初始化）。
   * 依赖判定（visibleWhen / disabledWhen / optionDisabled / optionsWhen）全部读这张表。
   */
  values: {
    /* ① 推广身份 */
    promotion_identity: 'OFF',
    douyin_source: 'HAND',
    douyin_match_mode: 'SAME',
    native_anchor_type: 'OFF',
    native_anchor_match: 'PROJECT',
    native_anchor_alloc: 'OFF',
    /* ② 直达链接 */
    link_type: 'DEEP_LINK',
    link_source: 'MANUAL',
    link_match_mode: 'SAME',
    /* ③ 创意组件 */
    extra_component: 'OFF',
    component_match_mode: 'ACCOUNT',
    cta_smart: 'ON',
    /* ④ 产品信息 */
    product_info_mode: 'SAME',
    /* ⑤ 广告设置 */
    ad_setting_mode: 'SAME',
    ad_comment: 'ON',
    client_download: 'ON',
    brand_switch: 'OFF',
    /* ⑥ 广告预算与出价 */
    budget_mode: 'SAME',
    /* ⑦ 广告名称 */
    ad_operation: 'ENABLE',
    ad_name_mode: 'SAME',
    ad_auto_truncate: 'OFF',
    ad_random_suffix: 'OFF',
    ad_dynamic_index: '1',
  },

  /* 右上角悬浮卡：预估广告数（线上 .estimate-promotion-number-wrapper，fixed top:64 right:49 w:240） */
  estimate: {
    key: 'adEstimate',
    title: '预估广告数',
    rows: [
      { label: '账户数：', field: 'accounts' },
      { label: '项目数：', field: 'projects' },
      { label: '广告数：', field: 'ads' },
    ],
  },

  sections: [
    /* ─────────────────────────── ① 推广身份 ─────────────────────────── */
    {
      key: 'promotion_identity',
      title: '推广身份',
      fields: [
        {
          key: 'promotion_identity',
          label: '推广身份',
          type: 'radio',
          required: true,
          options: [
            { value: 'ON', label: '抖音号' },
            { value: 'OFF', label: '账户信息' },
          ],
          /* 线上：两个选项文字后面各跟一个 ⓘ，hover 弹的是一张说明图（不是文字） */
          optionBubble: [
            { value: 'ON', image: 'https://tos.mobgi.com/web/native-ad-guide/2023092202.png' },
            { value: 'OFF', image: 'https://tos.mobgi.com/web/native-ad-guide/2023092201.png' },
          ],
          /* 线上：示意图 + 2 条 tips 就在「推广身份」这一行的控件列里（随推广身份切换） */
          help: {
            ON: {
              img: 'https://tos.mobgi.com/web/native-ad-guide/2023092204.png',
              tips: [
                '选择抖音号作为推广身份，即进行原生广告投放',
                '计划将在广告审核通过后进行内容审核，内容审通过后，可获得更多流量',
              ],
              warning: '主页作品隐藏广告视频已下线，请在素材模块操作“主页可见性”',
            },
            OFF: {
              img: 'https://tos.mobgi.com/web/native-ad-guide/2023092203.png',
              tips: [
                '选择账户信息作为推广身份，无法获得更多流量',
                '推荐使用抖音号作为推广身份',
              ],
            },
          },
          /* 线上：示意图 + 2 条 tips 就在「推广身份」这一行的控件列里 */
          after: [
            { key: 'promotion_help', type: 'custom', kind: 'promotionHelp' },
          ],
        },
        {
          key: 'douyin_source',
          label: '抖音号来源',
          type: 'radio',
          required: true,
          visibleWhen: { field: 'promotion_identity', eq: 'ON' },
          options: [
            { value: 'HAND', label: '手动选择' },
            { value: 'MATERIAL_GROUP', label: '从创意组匹配' },
          ],
        },
        {
          key: 'douyin_match_mode',
          label: '匹配方式',
          type: 'radio',
          required: true,
          visibleWhen: { field: 'promotion_identity', eq: 'ON' },
          options: [
            { value: 'SAME', label: '所有广告选择同一个抖音号' },
            { value: 'ACCOUNT', label: '每个账户选择一个抖音号' },
            { value: 'PROJECT', label: '每个项目选择一个抖音号' },
            { value: 'PROMOTION', label: '每个广告选择一个抖音号' },
          ],
        },
        {
          key: 'douyin_pick',
          label: '选择抖音号',
          type: 'button',
          text: '选择抖音号',
          visibleWhen: { field: 'promotion_identity', eq: 'ON' },
          /* 线上：label 尾部跟一个 ⓘ（mg-icon-question2，14×14），hover 弹 mg-popover */
          labelBubble: {
            icon: 'question2',
            size: 14,
            width: 300,
            text: '如您使用其他抖音号或抖音号下视频进行推广，请您前往巨量广告抖音号授权管理页面完成相关抖音号的商业合作授权',
          },
        },
      ],
    },

    /* ─────────────────── ② 原生锚点（仅「抖音号」时出现） ─────────────────── */
    {
      key: 'native_anchor',
      title: '原生锚点',
      visibleWhen: { field: 'promotion_identity', eq: 'ON' },
      fields: [
        {
          key: 'native_anchor_type',
          label: '原生锚点类型',
          type: 'radio',
          required: true,
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'AUTO', label: '自动生成' },
            { value: 'EXIST', label: '选择已有' },
            { value: 'TEMPLATE_GENERATE', label: '模板生成' },
          ],
        },
        {
          /* 线上实测：选择已有 → 「每个账户/项目/广告 选择一个原生锚点」；
             模板生成 → 「每个账户/项目 生成一个原生锚点」 */
          key: 'native_anchor_match',
          label: '匹配方式',
          type: 'radio',
          required: true,
          visibleWhen: { field: 'native_anchor_type', in: ['EXIST', 'TEMPLATE_GENERATE'] },
          optionsWhenField: 'native_anchor_type',
          optionsWhen: {
            EXIST: [
              { value: 'ACCOUNT', label: '每个账户选择一个原生锚点' },
              { value: 'PROJECT', label: '每个项目选择一个原生锚点' },
              { value: 'PROMOTION', label: '每个广告选择一个原生锚点' },
            ],
            TEMPLATE_GENERATE: [
              { value: 'ACCOUNT', label: '每个账户生成一个原生锚点' },
              { value: 'PROJECT', label: '每个项目生成一个原生锚点' },
            ],
          },
          default: 'PROJECT',
        },
        {
          /* 模板生成时多一行「分账户设置模板」 */
          key: 'native_anchor_alloc',
          label: '分账户设置模板',
          type: 'radio',
          visibleWhen: { field: 'native_anchor_type', eq: 'TEMPLATE_GENERATE' },
          options: [
            { value: 'OFF', label: '不开启' },
            { value: 'ON', label: '开启' },
          ],
          default: 'OFF',
        },
        {
          /* 选择已有 / 模板生成 都会出现「选择原生锚点」（点开是「选择原生锚点模板」弹窗） */
          key: 'native_anchor_pick',
          label: '选择原生锚点',
          type: 'button',
          text: '选择原生锚点',
          visibleWhen: { field: 'native_anchor_type', in: ['EXIST', 'TEMPLATE_GENERATE'] },
        },
        {
          /* 选完后按「账户 / 锚点模板名称」列表回显（对齐线上直达链接表的样式） */
          key: 'native_anchor_table',
          label: '',
          type: 'custom',
          kind: 'anchorTable',
          visibleWhen: { field: 'native_anchor_type', in: ['EXIST', 'TEMPLATE_GENERATE'] },
        },
      ],
    },

    /* ─────────────────────────── ③ 直达链接 ─────────────────────────── */
    {
      key: 'open_url',
      title: '直达链接',
      fields: [
        {
          key: 'link_type',
          label: '直达链接类型',
          type: 'radio',
          required: true,
          options: [
            { value: 'DEEP_LINK', label: 'Deeplink直达链接' },
            { value: 'DEEP_LINK_AND_ULINK', label: 'Deeplink+Ulink直达链接' },
            { value: 'ULINK', label: 'Ulink直达链接' },
          ],
          /* 线上：Ulink 直达链接这个选项挂了 popover（内容为空，hover 出一个空框） */
          optionBubble: [{ value: 'ULINK', text: '' }],
          /* 线上：橙色提示就在「直达链接类型」这一行的控件列里 */
          after: [
            {
              key: 'link_type_tip',
              type: 'tip',
              text: '该直达链接类型仅Deeplink生效',
              visibleWhen: { field: 'link_type', eq: 'DEEP_LINK' },
            },
          ],
        },
        {
          key: 'link_source',
          label: '直达链接来源',
          type: 'radio',
          required: true,
          options: [
            { value: 'LOCATION', label: '导入直达链接' },
            { value: 'PAGE_GEN', label: '落地页自动关联' },
            { value: 'DYNAMIC', label: '动态链接生成' },
            { value: 'SPEC_PAGE', label: '落地页自动生成' },
            { value: 'MANUAL', label: '手动填写' },
          ],
          /* 线上：落地页两项各挂一个灰底（--plain）气泡 */
          optionBubble: [
            { value: 'PAGE_GEN', text: '当前分支不需要配置落地页', plain: true },
            { value: 'SPEC_PAGE', text: '当前分支不需要配置落地页自动生成', plain: true },
          ],
          /* Ulink 类型下「落地页自动生成」置灰（线上实测） */
          optionDisabled: [{ value: 'SPEC_PAGE', when: { field: 'link_type', eq: 'ULINK' } }],
        },
        {
          key: 'link_match_mode',
          label: '匹配方式',
          type: 'radio',
          required: true,
          /* 「落地页自动关联 / 落地页自动生成」下整块消失 */
          visibleWhenAny: [{ field: 'link_source', in: ['MANUAL', 'LOCATION', 'DYNAMIC'] }],
          options: [
            { value: 'SAME', label: '所有项目选择一个直达链接' },
            { value: 'ACCOUNT', label: '每个账户选择一个直达链接' },
          ],
          /* 「导入直达链接 / 动态链接生成」下多出「每个项目 / 每个广告」两档 */
          optionsWhenField: 'link_source',
          optionsWhen: {
            LOCATION: [
              { value: 'SAME', label: '所有项目选择一个直达链接' },
              { value: 'ACCOUNT', label: '每个账户选择一个直达链接' },
              { value: 'PROJECT', label: '每个项目选择一个直达链接' },
              { value: 'PROMOTION', label: '每个广告选择一个直达链接' },
            ],
            DYNAMIC: [
              { value: 'SAME', label: '所有项目选择一个直达链接' },
              { value: 'ACCOUNT', label: '每个账户选择一个直达链接' },
              { value: 'PROJECT', label: '每个项目选择一个直达链接' },
              { value: 'PROMOTION', label: '每个广告选择一个直达链接' },
            ],
          },
          /* 线上：匹配方式的每个选项都挂了 popover（内容为空） */
          optionBubble: [
            { value: 'SAME', text: '' },
            { value: 'ACCOUNT', text: '' },
            { value: 'PROJECT', text: '' },
            { value: 'PROMOTION', text: '' },
          ],
        },
        {
          key: 'link_pick',
          label: '选择直达链接',
          type: 'button',
          text: '选择直达链接',
          /* 「动态链接生成」下文案换成「选择动态链接」 */
          labelWhenField: 'link_source',
          labelWhen: { DYNAMIC: '选择动态链接' },
          visibleWhenAny: [{ field: 'link_source', in: ['MANUAL', 'LOCATION', 'DYNAMIC'] }],
          /* 线上：按钮上挂一个灰底（--plain）popover */
          bubble: {
            plain: true,
            text: '完善基本信息、素材和标题后，在外层配置区点击编辑按钮配置该资产。',
          },
        },
        {
          key: 'link_table',
          label: '',
          type: 'custom',
          kind: 'linkTable',
          /* 只有「Deeplink + 手动填写 + 所有项目选择一个直达链接」才出表 */
          visibleWhenAll: [
            { field: 'link_type', eq: 'DEEP_LINK' },
            { field: 'link_source', eq: 'MANUAL' },
            { field: 'link_match_mode', eq: 'SAME' },
          ],
        },
      ],
    },

    /* ─────────────────────────── ④ 创意组件 ─────────────────────────── */
    {
      key: 'creative_component',
      title: '创意组件',
      fields: [
        {
          key: 'extra_component',
          label: '附加创意组件',
          type: 'radio',
          required: true,
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'component_match_mode',
          label: '匹配方式',
          type: 'radio',
          required: true,
          visibleWhen: { field: 'extra_component', eq: 'ON' },
          options: [
            { value: 'ACCOUNT', label: '每个账户选择一个创意组件' },
            { value: 'PROJECT', label: '每个项目选择一个创意组件' },
            { value: 'PROMOTION', label: '每个广告选择一个创意组件' },
          ],
        },
        {
          key: 'component_pick',
          label: '选择创意组件',
          type: 'button',
          text: '选择创意组件',
          visibleWhen: { field: 'extra_component', eq: 'ON' },
          /* 线上：按钮上挂一个灰底（--plain）popover，文案与「选择直达链接」一致 */
          bubble: {
            plain: true,
            text: '完善基本信息、素材和标题后，在外层配置区点击编辑按钮配置该资产。',
          },
        },
        {
          /* 选完后按「账户 / 创意组件名称」列表回显 */
          key: 'component_table',
          label: '',
          type: 'custom',
          kind: 'componentTable',
          visibleWhen: { field: 'extra_component', eq: 'ON' },
        },
        {
          key: 'cta',
          label: '行动号召',
          type: 'tags',
          required: true,
          placeholder: '空格分隔，最多10个，每个标签不超过6个字',
          addText: '添加（回车键)',
          max: 10,
          /* 线上「开启智能生成」默认是勾选上的 */
          smart: true,
          smartKey: 'cta_smart',
        },
      ],
    },

    /* ─────────────────────────── ⑤ 产品信息 ─────────────────────────── */
    {
      key: 'product_info',
      title: '产品信息',
      /* 线上：产品名称 / 产品主图 / 产品卖点 包在一层嵌套 el-form 里，该 form 带 24px 下边距 */
      extraBottom: 24,
      fields: [
        {
          key: 'product_info_mode',
          label: '配置模式',
          type: 'radio',
          options: [
            { value: 'SAME', label: '统一配置' },
            { value: 'ACCOUNT', label: '分账户配置' },
            { value: 'COMPANY', label: '分主体配置' },
            { value: 'PROJECT', label: '分项目配置' },
          ],
        },
        {
          /* 分账户 / 分主体 / 分项目：左列表 + 右表单（分项目为规则卡片，可添加规则） */
          key: 'product_panel',
          label: '',
          type: 'custom',
          kind: 'productPanel',
          visibleWhenAny: [{ field: 'product_info_mode', in: ['ACCOUNT', 'COMPANY', 'PROJECT'] }],
        },
        {
          key: 'product_name',
          label: '产品名称',
          type: 'input',
          required: true,
          placeholder: '1-20个字符',
          width: 360,
          maxlength: 20,
          countSuffix: true,
          refText: '引用应用名称',
          visibleWhen: { field: 'product_info_mode', eq: 'SAME' },
        },
        {
          key: 'product_main_image',
          label: '产品主图',
          type: 'upload',
          required: true,
          visibleWhen: { field: 'product_info_mode', eq: 'SAME' },
        },
        {
          key: 'product_sell_points',
          label: '产品卖点',
          type: 'tags',
          required: true,
          placeholder: '空格分隔,最多10个,每个标签不超过9个字',
          addText: '添加（回车键)',
          max: 10,
          visibleWhen: { field: 'product_info_mode', eq: 'SAME' },
        },
      ],
    },

    /* ─────────────────────────── ⑥ 广告设置 ─────────────────────────── */
    {
      key: 'promotion_setting',
      title: '广告设置',
      fields: [
        {
          key: 'ad_setting_mode',
          label: '配置模式',
          type: 'radio',
          options: [
            { value: 'SAME', label: '统一配置' },
            { value: 'ACCOUNT', label: '分账户配置' },
            { value: 'COMPANY', label: '分主体配置' },
            { value: 'PROJECT', label: '分项目配置' },
          ],
        },
        {
          /* 分账户 / 分主体 / 分项目：左列表 + 右表单，分项目为规则卡片（可添加/删除规则） */
          key: 'ad_setting_panel',
          label: '',
          type: 'custom',
          kind: 'adSettingPanel',
          visibleWhenAny: [{ field: 'ad_setting_mode', in: ['ACCOUNT', 'COMPANY', 'PROJECT'] }],
        },
        {
          key: 'ad_comment',
          label: '广告评论',
          type: 'radio',
          required: true,
          visibleWhen: { field: 'ad_setting_mode', eq: 'SAME' },
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'client_download',
          label: '客户端下载',
          type: 'radio',
          required: true,
          /* 抖音号推广身份下没有「客户端下载」；分账户/主体/项目时由面板渲染 */
          visibleWhenAll: [
            { field: 'promotion_identity', eq: 'OFF' },
            { field: 'ad_setting_mode', eq: 'SAME' },
          ],
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'setting_optional_alert',
          label: '',
          type: 'alert',
          kind: 'optional',
          text: '以下内容非必填项，可根据实际投放要求设置。',
          visibleWhen: { field: 'ad_setting_mode', eq: 'SAME' },
        },
        {
          key: 'brand_switch',
          label: '类别/品牌名称',
          type: 'radio',
          visibleWhen: { field: 'ad_setting_mode', eq: 'SAME' },
          options: [
            { value: 'OFF', label: '不启用' },
            { value: 'ON', label: '启用' },
          ],
        },
        {
          key: 'brand_setting',
          label: '',
          type: 'custom',
          kind: 'brandSetting',
          visibleWhen: { field: 'ad_setting_mode', eq: 'SAME' },
        },
      ],
    },

    /* ─────────────────────── ⑦ 广告预算与出价 ─────────────────────── */
    {
      key: 'promotion_budget',
      title: '广告预算与出价',
      fields: [
        /* 线上：模式行 + 出价规则内容在同一个 el-form-item 里（label 为空，内容左对齐 0） */
        {
          key: 'budget_mode',
          label: '',
          type: 'custom',
          kind: 'budget',
          modeLabel: '预算出价配置模式',
          options: [
            { value: 'SAME', label: '统一配置' },
            { value: 'ACCOUNT', label: '分账户配置' },
            { value: 'COMPANY', label: '分主体配置' },
            { value: 'PROJECT', label: '分项目配置' },
          ],
          rule: {
            budgetPlaceholder: '请输入预算',
            bidPlaceholder: '请输入出价',
            bidModes: [
              { value: 'fixed', label: '固定出价' },
              { value: 'ladder', label: '阶梯出价' },
              { value: 'random', label: '随机出价' },
            ],
            /* 线上出价方式后面的 ⓘ 气泡（原文照抄） */
            bidModeBubble:
              '阶梯出价是指根据您的出价范围，在生成的广告中做等差分配出价 随机出价是指会在出价范围内随机分配出价',
            ladder: [
              { key: 'ladder', label: '跨账户递增', options: [
                { value: 'OFF', label: '不开启' },
                { value: 'ON', label: '开启' },
              ] },
              { key: 'bid_range', label: '出价范围' },
            ],
            random: [
              { key: 'bid_range', label: '范围' },
            ],
          },
        },
      ],
    },

    /* ─────────────────────────── ⑧ 广告名称 ─────────────────────────── */
    {
      key: 'promotion_name',
      title: '广告名称',
      fields: [
        {
          key: 'ad_operation',
          label: '广告默认状态',
          type: 'radio',
          required: true,
          options: [
            { value: 'DISABLE', label: '暂停' },
            { value: 'ENABLE', label: '开启' },
          ],
          /* 线上：两个选项都挂了空 popover */
          optionBubble: [
            { value: 'DISABLE', text: '' },
            { value: 'ENABLE', text: '' },
          ],
        },
        {
          key: 'ad_name_mode',
          label: '名称配置模式',
          type: 'radio',
          required: true,
          options: [
            { value: 'SAME', label: '统一配置' },
            { value: 'ACCOUNT', label: '分账户配置' },
          ],
          /* 线上：两个选项都挂了空 popover */
          optionBubble: [
            { value: 'SAME', text: '' },
            { value: 'ACCOUNT', text: '' },
          ],
        },
        {
          /* 分账户配置：左账户列表 + 右上「复制到其他账户」+ 右侧广告名称（每账户一份） */
          key: 'ad_name_panel',
          label: '',
          type: 'custom',
          kind: 'adNamePanel',
          visibleWhen: { field: 'ad_name_mode', eq: 'ACCOUNT' },
        },
        {
          key: 'ad_name',
          label: '广告名称',
          type: 'adName',
          required: true,
          visibleWhen: { field: 'ad_name_mode', eq: 'SAME' },
          /* 线上：两个复选框（默认都不勾），各自带一个 ⓘ 气泡 */
          checkboxes: [
            {
              key: 'ad_auto_truncate',
              label: '自动截断',
              bubble:
                '使用通配符后可能存在名称过长问题，勾选后系统将自动截断超出部分的内容。（注意：自动截断后可能存在同名风险）',
            },
            {
              key: 'ad_random_suffix',
              label: '随机数后缀',
              bubble: '为名称添加4位随机数的后缀,减少重名报错反复重提',
            },
          ],
          /* 通配符：线上每个 tag 是一个 el-popover 按钮（带 + 图标） */
          wildcards: [
            {
              value: '下载链接标识',
              tip: '取下载或预约下载链接最后一个 / 后的全部字符串，保留 query；例如 demo?a=1。',
            },
            {
              value: '渠道包名',
              tip: '在广告名称中展示广告匹配的渠道包名，没有选中渠道包时则替换为空。',
            },
            {
              value: '监测活动名',
              tip: '在广告名称中展示广告匹配的监测活动名称，没有选中监测活动时则替换为空。',
            },
          ],
        },
        { key: 'ad_dynamic_index', label: '广告动态标号', type: 'input', width: 160 },
      ],
    },
  ],

  /* 抽屉底部（线上：取消 / 确 定，均 88×32） */
  footer: { buttons: ['取消', '确定'], cancelText: '取消', okText: '确 定' },
};
