/**
 * 抽屉 spec 的「选项关联关系」统一求值器。
 *
 * spec 里每个字段可以声明：
 *   visibleWhen:      { field, eq|in|neq|truthy }            单条件
 *   visibleWhenAll:   [ {…}, {…} ]                          多条件（AND）
 *   visibleWhenAny:   [ {…}, {…} ]                          多条件（OR）
 *   disabledWhen / disabledWhenAll / disabledWhenAny         同上
 *   bubble:           { when: {…}, text }                    字段级提示气泡
 *   optionBubble:     [ { value, text } ]                    选项级提示气泡
 *
 * 求值语义：
 *   - eq 严格相等；in 属于数组；neq 不等；truthy 真值
 *   - 依赖字段的值为 undefined/'' 时视为「未设置」
 *   - 未声明依赖的字段恒可见 / 不禁用
 */

function valueOf(values, field) {
  if (!values || !field) return undefined;
  const v = values[field];
  return (v && typeof v === 'object' && 'value' in v) ? v.value : v;
}

function matchOne(values, cond) {
  if (!cond || !cond.field) return true;
  const actual = valueOf(values, cond.field);
  if ('eq' in cond) return actual === cond.eq;
  if ('neq' in cond) return actual !== cond.neq;
  if ('in' in cond) return Array.isArray(cond.in) && cond.in.indexOf(actual) >= 0;
  if ('notIn' in cond) return Array.isArray(cond.notIn) && cond.notIn.indexOf(actual) < 0;
  if ('truthy' in cond) return !!actual === !!cond.truthy;
  return true;
}

function matchAll(values, list) {
  return !list || !list.length || list.every((c) => matchOne(values, c));
}
function matchAny(values, list) {
  return !list || !list.length || list.some((c) => matchOne(values, c));
}

/** 字段是否可见 */
export function isVisible(field, values) {
  if (!field) return true;
  if (field.visibleWhen && !matchOne(values, field.visibleWhen)) return false;
  if (field.visibleWhenAll && !matchAll(values, field.visibleWhenAll)) return false;
  if (field.visibleWhenAny && !matchAny(values, field.visibleWhenAny)) return false;
  return true;
}

/** 字段是否禁用 */
export function isDisabled(field, values) {
  if (!field) return false;
  if (field.disabledWhen && matchOne(values, field.disabledWhen)) return true;
  if (field.disabledWhenAll && matchAll(values, field.disabledWhenAll)) return true;
  if (field.disabledWhenAny && matchAny(values, field.disabledWhenAny)) return true;
  return false;
}

/** 字段级提示气泡文案（没有则返回 ''） */
export function bubbleText(field, values) {
  if (!field || !field.bubble) return '';
  if (matchOne(values, field.bubble.when)) return field.bubble.text || '';
  return '';
}

/** 选项级提示气泡文案（没有则返回 ''） */
export function optionBubbleText(field, values, optionValue) {
  if (!field || !field.optionBubble) return '';
  const hit = field.optionBubble.find((b) => b.value === optionValue);
  if (!hit) return '';
  if (hit.when && !matchOne(values, hit.when)) return '';
  return hit.text || '';
}

/** 分区是否可见 */
export function isSectionVisible(section, values) {
  if (!section) return true;
  if (section.visibleWhen && !matchOne(values, section.visibleWhen)) return false;
  if (section.visibleWhenAll && !matchAll(values, section.visibleWhenAll)) return false;
  if (section.visibleWhenAny && !matchAny(values, section.visibleWhenAny)) return false;
  return true;
}

/** 按当前值把 spec 的字段筛成「可见集合」——对拍用 */
export function visibleFields(section, values) {
  return (section.fields || []).filter((f) => isVisible(f, values)).map((f) => f.label);
}
