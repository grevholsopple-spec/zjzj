/* 智建筑境 构件信息 — 公共函数（所有页面共用） */
var ZJ = (function () {
  function loadData() {
    // 加时间戳，避免微信缓存旧数据：改完 data.json 重新上传，扫码立刻看到新内容
    return fetch('data.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('data.json 读取失败：' + r.status);
      return r.json();
    });
  }

  // "箱500*500*20*20" -> {H:500,B:500,tw:20,tf:20}
  function parseSpec(spec) {
    var n = String(spec || '').match(/[\d.]+/g) || [];
    var H = +n[0] || 500, B = +n[1] || H, tw = +n[2] || 20, tf = +n[3] || tw;
    return { H: H, B: B, tw: tw, tf: tf };
  }

  // 柱身理论重量（kg），钢材密度 7850 kg/m³
  function bodyWeight(d) {
    var s = parseSpec(d['构件规格']), L = +d['构件长度'] || 0;
    var area = s.H * s.B - (s.H - 2 * s.tf) * (s.B - 2 * s.tw); // mm²
    return area * L * 7.85e-6; // mm³ * 7.85e-6 kg/mm³
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showError(e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="padding:16px;margin:16px;border-radius:8px;background:#fdecec;color:#a12;font-size:14px">' +
      '加载失败：' + esc(e && e.message || e) + '</div>');
  }

  return { loadData: loadData, parseSpec: parseSpec, bodyWeight: bodyWeight, esc: esc, showError: showError };
})();
