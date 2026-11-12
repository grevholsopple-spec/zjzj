/* 根据 data.json 自动生成构件详图（SVG）。纸张：A3 竖版 297×420，单位为图纸毫米。 */
function buildDrawingSVG(d) {
  var esc = ZJ.esc;
  var s = ZJ.parseSpec(d['构件规格']);
  var L = +d['构件长度'] || 11819;
  var m = d['模型参数'] || {};
  var levels = (m['连接板标高'] || []).map(Number).filter(function (v) { return v > 0 && v < L; });
  var pl = m['连接板'] || {}; var plOut = +pl['伸出长度'] || 300, plH = +pl['高度'] || 400, plT = +pl['厚度'] || 20;
  var bp = m['柱脚底板'] || {}; var bpA = +bp['边长'] || 700, bpT = +bp['厚度'] || 30, bpD = +bp['锚栓孔径'] || 36;
  var capT = +m['柱顶盖板厚度'] || 20;
  var NICE = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200];
  function niceScale(real, room) { for (var i = 0; i < NICE.length; i++) if (real / NICE[i] <= room) return NICE[i]; return 200; }

  var C = { geo: '#111', dim: '#1f4fa3', cl: '#c0392b', fill: '#cfd6de', thin: '#555' };
  var out = [];
  function P(x) { return Math.round(x * 100) / 100; }
  function line(x1, y1, x2, y2, st, w, dash) {
    out.push('<line x1="' + P(x1) + '" y1="' + P(y1) + '" x2="' + P(x2) + '" y2="' + P(y2) + '" stroke="' + (st || C.geo) +
      '" stroke-width="' + (w || 0.35) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>');
  }
  function rect(x, y, w, h, fill, st, sw, dash) {
    out.push('<rect x="' + P(x) + '" y="' + P(y) + '" width="' + P(w) + '" height="' + P(h) + '" fill="' + (fill || 'none') +
      '" stroke="' + (st || C.geo) + '" stroke-width="' + (sw || 0.35) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>');
  }
  function text(x, y, t, size, anchor, color, rot, weight) {
    out.push('<text x="' + P(x) + '" y="' + P(y) + '" font-size="' + (size || 3) + '" text-anchor="' + (anchor || 'start') +
      '" fill="' + (color || C.geo) + '"' + (weight ? ' font-weight="' + weight + '"' : '') +
      (rot ? ' transform="rotate(' + rot + ' ' + P(x) + ' ' + P(y) + ')"' : '') + '>' + esc(t) + '</text>');
  }
  function tick(x, y) { line(x - 1, y + 1, x + 1, y - 1, C.dim, 0.4); }
  function dimH(x1, x2, y, label) {
    line(x1, y, x2, y, C.dim, 0.25); tick(x1, y); tick(x2, y);
    text((x1 + x2) / 2, y - 1, label, 2.6, 'middle', C.dim);
  }
  function dimV(y1, y2, x, label) {
    line(x, y1, x, y2, C.dim, 0.25); tick(x, y1); tick(x, y2);
    text(x - 1, (y1 + y2) / 2, label, 2.6, 'middle', C.dim, -90);
  }
  function title(x, y, t, sc) {
    text(x, y, t, 4.2, 'middle', C.geo, 0, 600);
    line(x - 18, y + 1.5, x + 18, y + 1.5, C.geo, 0.5);
    if (sc) text(x, y + 5, sc, 2.6, 'middle', C.thin);
  }

  // ---------- 图框 ----------
  rect(0, 0, 297, 420, '#fff', '#fff');
  rect(8, 8, 281, 404, 'none', C.geo, 0.7);

  // ---------- 立面图 ----------
  var totalH = L + bpT;
  var rE = niceScale(totalH, 300), kE = 1 / rE;
  var cx = 78, yBot = 340, yTop = yBot - totalH * kE;
  var wB = s.B * kE;
  title(cx, 20, '构件立面图', '1:' + rE);
  // 柱脚底板
  rect(cx - bpA * kE / 2, yBot - bpT * kE, bpA * kE, bpT * kE, C.fill);
  // 柱身
  var yColBot = yBot - bpT * kE;
  rect(cx - wB / 2, yTop, wB, yColBot - yTop, '#eef1f4');
  line(cx - wB / 2 + s.tw * kE, yTop, cx - wB / 2 + s.tw * kE, yColBot, C.thin, 0.2, '1 0.8');
  line(cx + wB / 2 - s.tw * kE, yTop, cx + wB / 2 - s.tw * kE, yColBot, C.thin, 0.2, '1 0.8');
  // 柱顶盖板
  line(cx - wB / 2, yTop + capT * kE, cx + wB / 2, yTop + capT * kE, C.geo, 0.3);
  // 吊耳
  if (m['吊耳'] !== false) {
    [-1, 1].forEach(function (sg) {
      var lx = cx + sg * wB * 0.25;
      out.push('<path d="M' + P(lx - 1.6) + ' ' + P(yTop) + ' L' + P(lx - 1) + ' ' + P(yTop - 3.2) + ' A1 1 0 0 1 ' + P(lx + 1) + ' ' + P(yTop - 3.2) +
        ' L' + P(lx + 1.6) + ' ' + P(yTop) + ' Z" fill="' + C.fill + '" stroke="' + C.geo + '" stroke-width="0.3"/>');
    });
  }
  // 中心线
  line(cx, yTop - 8, cx, yBot + 6, C.cl, 0.2, '6 1.2 1 1.2');
  // 连接板
  levels.forEach(function (lv, i) {
    var yc = yColBot - lv * kE, h = plH * kE, o = plOut * kE;
    rect(cx - wB / 2 - o, yc - h / 2, o, h, C.fill);
    rect(cx + wB / 2, yc - h / 2, o, h, C.fill);
    rect(cx - plT * kE / 2, yc - h / 2, plT * kE, h, C.fill, C.geo, 0.2);
    text(cx + wB / 2 + o + 2, yc + 1, '连接板 PL' + plT + '×' + plH, 2.6, 'start', C.geo);
    text(cx + wB / 2 + o + 2, yc + 4.5, '▽ ' + (lv / 1000).toFixed(3), 2.6, 'start', C.dim);
  });
  // 剖切符号 1-1
  var ySec = levels.length ? yColBot - levels[0] * kE / 2 : (yTop + yColBot) / 2;
  [-1, 1].forEach(function (sg) {
    var x0 = cx + sg * (wB / 2 + 4);
    line(x0, ySec, x0 + sg * 4, ySec, C.geo, 0.7);
    line(x0 + sg * 4, ySec, x0 + sg * 4, ySec + 3, C.geo, 0.7);
    text(x0 + sg * 4, ySec + 6.5, '1', 3, 'middle', C.geo);
  });
  // 尺寸链（左侧）
  var xd1 = cx - bpA * kE / 2 - 8, xd2 = xd1 - 8;
  var chain = [0].concat(levels).concat([L]);
  for (var i = 0; i < chain.length - 1; i++) {
    dimV(yColBot - chain[i] * kE, yColBot - chain[i + 1] * kE, xd1, String(chain[i + 1] - chain[i]));
  }
  dimV(yBot, yTop, xd2, '总长 ' + (L + bpT));
  dimV(yBot, yColBot, xd1 + 4, '');
  text(xd1 + 5.5, yBot + 4, String(bpT), 2.4, 'middle', C.dim);
  line(cx - 20, yBot + 0.01, cx + 20, yBot + 0.01, C.geo, 0.2);
  text(cx, yBot + 8, '柱底 ±0.000（相对）', 2.6, 'middle', C.thin);
  dimH(cx - wB / 2, cx + wB / 2, yTop - 10, String(s.B));

  // ---------- 1-1 剖面 ----------
  var rS = niceScale(Math.max(s.B, s.H), 80), kS = 1 / rS;
  var sx = 215, sy = 75, w = s.B * kS, h = s.H * kS;
  title(sx, 22, '1-1 剖面', '1:' + rS);
  rect(sx - w / 2, sy - h / 2, w, h, C.fill, C.geo, 0.5);
  rect(sx - w / 2 + s.tw * kS, sy - h / 2 + s.tf * kS, w - 2 * s.tw * kS, h - 2 * s.tf * kS, '#fff', C.geo, 0.4);
  // 给 CAD 导出用的剖面填充标记（网页里不显示）
  out.push('<g data-hatch="' + [sx - w / 2, sy - h / 2, w, h, sx - w / 2 + s.tw * kS, sy - h / 2 + s.tf * kS,
    w - 2 * s.tw * kS, h - 2 * s.tf * kS].map(P).join(',') + '"/>');
  line(sx - w / 2 - 6, sy, sx + w / 2 + 6, sy, C.cl, 0.2, '6 1.2 1 1.2');
  line(sx, sy - h / 2 - 6, sx, sy + h / 2 + 6, C.cl, 0.2, '6 1.2 1 1.2');
  dimH(sx - w / 2, sx + w / 2, sy - h / 2 - 8, String(s.B));
  dimV(sy + h / 2, sy - h / 2, sx + w / 2 + 10, String(s.H));
  dimH(sx - w / 2, sx - w / 2 + s.tw * kS, sy + h / 2 + 7, '');
  text(sx - w / 2 + s.tw * kS / 2, sy + h / 2 + 12, 't=' + s.tw, 2.6, 'middle', C.dim);
  text(sx + w / 2 - 2, sy + h / 2 + 12, 't=' + s.tf, 2.6, 'end', C.dim);
  // 四角焊缝标记
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    out.push('<path d="M' + P(sx + c[0] * w / 2) + ' ' + P(sy + c[1] * h / 2) + ' l' + P(-c[0] * 3) + ' 0 l' + P(c[0] * 3) + ' ' + P(-c[1] * 3) +
      ' z" fill="#333"/>');
  });
  text(sx, sy + h / 2 + 18, '四角全熔透焊缝，质量等级一级', 2.6, 'middle', C.geo);

  // ---------- 柱脚底板平面 ----------
  var rB = niceScale(bpA, 75), kB = 1 / rB;
  var bx = 215, by = 190, a = bpA * kB;
  title(bx, 132, '柱脚底板', '1:' + rB);
  rect(bx - a / 2, by - a / 2, a, a, C.fill, C.geo, 0.5);
  rect(bx - w * rS / rB / 2, by - h * rS / rB / 2, s.B * kB, s.H * kB, 'none', C.geo, 0.3, '1.2 0.8');
  var off = bpA / 2 - Math.max(80, bpD * 2.2);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    out.push('<circle cx="' + P(bx + c[0] * off * kB) + '" cy="' + P(by + c[1] * off * kB) + '" r="' + P(bpD * kB / 2) +
      '" fill="#fff" stroke="' + C.geo + '" stroke-width="0.35"/>');
  });
  line(bx - a / 2 - 5, by, bx + a / 2 + 5, by, C.cl, 0.2, '6 1.2 1 1.2');
  line(bx, by - a / 2 - 5, bx, by + a / 2 + 5, C.cl, 0.2, '6 1.2 1 1.2');
  dimH(bx - a / 2, bx + a / 2, by - a / 2 - 6, String(bpA));
  dimV(by + a / 2, by - a / 2, bx + a / 2 + 8, String(bpA));
  dimH(bx - off * kB, bx + off * kB, by + a / 2 + 7, String(Math.round(off * 2)));
  text(bx, by + a / 2 + 14, 'PL' + bpT + '，4-Φ' + bpD + ' 锚栓孔', 2.8, 'middle', C.geo);

  // ---------- 技术说明 ----------
  var notes = [
    '技术说明：',
    '1. 材质：' + (d['材质'] || 'Q355B') + '，钢材性能符合 GB/T 1591。',
    '2. 箱型柱四角及连接板与柱身焊缝为全熔透焊缝，',
    '   质量等级一级，100% 超声波探伤。',
    '3. 未注明角焊缝焊脚尺寸 hf=8mm。',
    '4. 构件表面喷砂除锈 Sa2.5 级。',
    '5. 图中尺寸以 mm 计，标高以 m 计。'
  ];
  notes.forEach(function (t, i) { text(160, 262 + i * 5.2, t, i ? 2.8 : 3.2, 'start', C.geo, 0, i ? null : 600); });

  // ---------- 材料表 ----------
  var wt = ZJ.bodyWeight(d);
  var tbl = [['名称', '规格', '数量', '重量(kg)'],
    ['柱身', s.H + '×' + s.B + '×' + s.tw + '×' + s.tf, '1', Math.round(wt)],
    ['底板', 'PL' + bpT + '×' + bpA + '×' + bpA, '1', Math.round(bpA * bpA * bpT * 7.85e-6)],
    ['连接板', 'PL' + plT + '×' + plOut + '×' + plH, String(levels.length * 4), Math.round(levels.length * 4 * plOut * plH * plT * 7.85e-6)]];
  var tx = 160, ty = 302, cw = [18, 42, 14, 20];
  tbl.forEach(function (row, r) {
    var x = tx;
    row.forEach(function (c, j) {
      rect(x, ty + r * 6, cw[j], 6, r ? 'none' : '#eef1f4', C.geo, 0.25);
      text(x + cw[j] / 2, ty + r * 6 + 4.2, c, 2.6, 'middle', C.geo);
      x += cw[j];
    });
  });

  // ---------- 标题栏 ----------
  var Y = 360, rowH = 8.5;
  rect(8, Y, 281, 52, 'none', C.geo, 0.7);
  var cells = [
    [['工程名称', d['工程名称']], ['构件编号', d['构件编号']], ['图号', 'GJ-' + (d['构件编号'] || '01')]],
    [['工程子项', d['工程子项']], ['构件规格', d['构件规格']], ['比例', '见图']],
    [['构件位置', d['构件位置']], ['材质 / 数量', (d['材质'] || '') + ' / ' + (d['数量'] || '')], ['日期', (d['质检记录'] && d['质检记录'][0] ? String(d['质检记录'][0]['检测时间']).slice(0, 10) : '')]],
    [['设计', d['生产线负责人']], ['制图', d['生产线负责人']], ['审核', d['生产线负责人']]]
  ];
  var colX = [8, 112, 220, 289];
  cells.forEach(function (row, r) {
    row.forEach(function (c, j) {
      var x0 = colX[j], x1 = colX[j + 1], yy = Y + 4 + r * rowH;
      rect(x0, yy - 4, x1 - x0, rowH, 'none', C.geo, 0.25);
      line(x0 + 22, yy - 4, x0 + 22, yy - 4 + rowH, C.geo, 0.25);
      text(x0 + 11, yy + 1.6, c[0], 2.6, 'middle', C.thin);
      var v = String(c[1] == null ? '' : c[1]);
      var maxCh = Math.floor((x1 - x0 - 26) / 2.9);
      text(x0 + 24, yy + 1.6, v.length > maxCh ? v.slice(0, maxCh - 1) + '…' : v, 2.9, 'start', C.geo);
    });
  });
  text(148.5, Y + 4 + 4 * rowH + 6, '智建筑境 · 构件详图', 4.5, 'middle', C.geo, 0, 600);

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 420" width="1188" height="1680" ' +
    'font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif">' + out.join('') + '</svg>';
}
