/**
 * 极简 XLSX 生成工具（无第三方依赖，纯前端生成 .xlsx 文件）
 *
 * 支持能力：
 *  - 多工作表
 *  - 表头上方的「说明行」（如修改规则）
 *  - 表头行（加粗 + 底纹 + 边框）
 *  - 数据行 / 空模板行
 *  - 列宽设置
 *
 * 实现思路：xlsx 本质是一个 zip 包，内含若干 xml 部件。
 * 这里手写 zip（存储方式，不压缩）+ 最小化的 OOXML 部件，Excel / WPS 均可正常打开。
 */

const encoder = new TextEncoder();

/* ---------------- CRC32 ---------------- */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---------------- ZIP（storage，不压缩） ---------------- */
function zip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const DOS_TIME = 0x0000; // 00:00:00
  const DOS_DATE = 0x5021; // 2020-01-01

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const data = f.data;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // flags: UTF-8 file name
    lv.setUint16(8, 0, true); // method: store
    lv.setUint16(10, DOS_TIME, true);
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // central directory header signature
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, DOS_TIME, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central dir signature
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const total = localParts.reduce((s, p) => s + p.length, 0) + centralSize + end.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of localParts) { out.set(part, p); p += part.length; }
  for (const part of centralParts) { out.set(part, p); p += part.length; }
  out.set(end, p);
  return out;
}

/* ---------------- OOXML ---------------- */
function xmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colLetter(n) {
  let s = '';
  let v = n;
  while (v > 0) {
    const m = (v - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    v = Math.floor((v - 1) / 26);
  }
  return s;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="宋体"/><charset val="134"/></font>
<font><b/><sz val="11"/><name val="宋体"/><charset val="134"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="常规" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/**
 * 工作表结构：
 * {
 *   name: '批量修改账户名称',
 *   notes: ['修改规则：', '1、xxx'],       // 表头上方的说明行（可省略）
 *   columns: [{ title: '账户ID', width: 24 }, { title: '修改账户名称', width: 34 }],
 *   rows: [['123', '新名称']],             // 数据行（可省略）
 *   emptyRows: 20,                        // 表头下方的空模板行
 * }
 */
function sheetXml(sheet) {
  const columns = sheet.columns || [];
  const notes = sheet.notes || [];
  const rows = [];
  let r = 1;

  for (const note of notes) {
    rows.push(`<row r="${r}"><c r="A${r}" s="4" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(note)}</t></is></c></row>`);
    r += 1;
  }

  const headerRow = r;
  const headerCells = columns
    .map((c, i) => `<c r="${colLetter(i + 1)}${r}" s="1" t="inlineStr"><is><t>${xmlEsc(c.title)}</t></is></c>`)
    .join('');
  rows.push(`<row r="${r}" ht="20" customHeight="1">${headerCells}</row>`);
  r += 1;

  const styleOf = (i) => (i === 0 ? 2 : 3);
  for (const row of sheet.rows || []) {
    const cells = row
      .map((v, i) => `<c r="${colLetter(i + 1)}${r}" s="${styleOf(i)}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`)
      .join('');
    rows.push(`<row r="${r}">${cells}</row>`);
    r += 1;
  }
  for (let i = 0; i < (sheet.emptyRows || 0); i++) {
    const cells = columns.map((_, ci) => `<c r="${colLetter(ci + 1)}${r}" s="${styleOf(ci)}"/>`).join('');
    rows.push(`<row r="${r}">${cells}</row>`);
    r += 1;
  }

  const lastRow = Math.max(r - 1, 1);
  const lastCol = colLetter(Math.max(columns.length, 1));
  const colsXml = columns
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 18}" customWidth="1"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${lastCol}${lastRow}"/>
<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${headerRow + 1}" sqref="A${headerRow + 1}"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="16"/>
<cols>${colsXml}</cols>
<sheetData>${rows.join('')}</sheetData>
</worksheet>`;
}

/** 生成 xlsx Blob */
export function buildWorkbookBlob(sheets = []) {
  const list = sheets.length ? sheets : [{ name: 'Sheet1', columns: [{ title: '' }] }];
  const files = [];

  files.push({
    name: '[Content_Types].xml',
    data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${list.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`),
  });

  files.push({
    name: '_rels/.rels',
    data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
  });

  files.push({
    name: 'xl/workbook.xml',
    data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${list.map((s, i) => `<sheet name="${xmlEsc(s.name || `Sheet${i + 1}`)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`),
  });

  files.push({
    name: 'xl/_rels/workbook.xml.rels',
    data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${list.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}
<Relationship Id="rId${list.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
  });

  files.push({ name: 'xl/styles.xml', data: encoder.encode(STYLES_XML) });

  list.forEach((s, i) => {
    files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: encoder.encode(sheetXml(s)) });
  });

  return new Blob([zip(files)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** 生成并触发浏览器下载 */
export function downloadWorkbook(sheets, filename) {
  const blob = buildWorkbookBlob(sheets);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}
