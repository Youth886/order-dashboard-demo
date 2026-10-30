/** 轻量SVG图表：金额计算来自模拟明细，悬停提示给出具体值。 */
window.DEMO_CHARTS = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value).toLocaleString('zh-CN', {maximumFractionDigits: 2});
  function bars(values, unit = '万元', lineValues = null) {
    if (!values.length) return '<div class="empty">当前范围没有可展示数据</div>';
    const width = 760, height = 260, left = 56, top = 24, bottom = 42, plot = height - top - bottom;
    const raw = Math.max(...values.map(v => v.value), 1) * 1.18 / 4, magnitude = 10 ** Math.floor(Math.log10(raw));
    const max = Math.ceil(raw / magnitude) * magnitude * 4, step = (width - left - 20) / values.length;
    const peak = Math.max(...values.map(v => v.value));
    let html = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="月度趋势图，单位${escape(unit)}"><title>月度趋势：${values.map(v => `${escape(v.label)} ${number(v.value)}${escape(unit)}`).join('；')}</title>`;
    for (let i = 0; i <= 4; i++) {
      const y = top + plot * i / 4;
      html += `<line x1="${left}" y1="${y}" x2="740" y2="${y}" stroke="#eaf0f6"/><text x="44" y="${y + 4}" text-anchor="end">${number(max * (1 - i / 4))}</text>`;
    }
    values.forEach((value, i) => {
      const barHeight = value.value / max * plot, barWidth = Math.min(30, step * .42), x = left + step * (i + .5) - barWidth / 2;
      html += `<rect x="${x}" y="${top + plot - barHeight}" width="${barWidth}" height="${Math.max(0, barHeight)}" rx="5" fill="${value.value === peak ? '#2864d6' : '#7399dc'}"><title>${escape(value.label)}：${number(value.value)} ${escape(unit)}</title></rect><text x="${x + barWidth / 2}" y="242" text-anchor="middle">${escape(value.label.slice(5))}月</text>`;
    });
    if (lineValues) {
      const ceiling = Math.max(...lineValues, 1) * 1.15, points = lineValues.map((v, i) => [left + step * (i + .5), top + plot - v / ceiling * plot]);
      html += `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#299b8b" stroke-width="2.4"/>`;
      points.forEach((p, i) => html += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="white" stroke="#299b8b" stroke-width="2"><title>${escape(values[i].label)}：${lineValues[i]} 行订单（独立比例）</title></circle>`);
    }
    return html + '</svg>';
  }
  function spark(values, color) {
    const max = Math.max(...values, 1), min = Math.min(...values, 0), range = max - min || 1;
    const points = values.map((v, i) => `${5 + i * 95 / Math.max(1, values.length - 1)},${34 - (v - min) / range * 28}`).join(' ');
    return `<svg viewBox="0 0 105 40" class="spark" aria-hidden="true"><polyline points="${points}" stroke="${color}" fill="none" stroke-width="1.8"/></svg>`;
  }
  return {escape, number, bars, spark};
})();
