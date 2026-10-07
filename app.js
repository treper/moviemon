const badge = {
  RELEASED: '<span class="b b-g">上映中</span>',
  WATCHING: '<span class="b b-b">监控池</span>',
  UPCOMING: '<span class="b">待映</span>',
  SETTLED: '<span class="b b-gray">已归档</span>',
};
const etag = {
  E1: ['入池', 'b-b'], E2: ['预售开启', 'b-b'], E3: ['想看爆发', 'b-y'],
  E4: ['首日战报', 'b'], E5: ['超预期', 'b-g'], E6: ['不及预期', 'b-r'],
  E7: ['可埋伏', 'b-y'], E8: ['落袋为安', 'b-g'], E9: ['回撤保护', 'b-r'], E0: ['数据源异常', 'b-r'],
};

function fmt(n, d = 0) { return n == null ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: d }); }

async function load() {
  const data = await (await fetch('./data.json')).json();
  document.getElementById('updated').textContent = `数据更新:${data.generated_at}`;

  // 实时票房
  const bt = document.querySelector('#boTable tbody');
  bt.innerHTML = (data.realtime || []).map(r =>
    `<tr><td>${r.nm}</td><td>${fmt(r.realtime_wan, 1)}</td><td>${fmt(r.ratio, 1)}%</td><td>${r.days}</td><td>${fmt(r.cum_wan, 0)}</td></tr>`).join('');
  const ctx = document.getElementById('boChart');
  if (ctx && data.realtime?.length) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.realtime.map(r => r.nm.slice(0, 8)),
        datasets: [{ label: '实时票房(万)', data: data.realtime.map(r => r.realtime_wan), backgroundColor: '#4f7cff' }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  // 想看榜
  const pt = document.querySelector('#presaleTable tbody');
  pt.innerHTML = (data.presale || []).map(p =>
    `<tr><td>${p.pooled ? '<span class="b b-b">池内</span> ' : ''}${p.nm}</td><td>${p.rt || '待定'}</td><td>${fmt(p.wish)}</td><td class="${(p.wish_delta_1d || 0) >= 5000 ? 'hot' : ''}">${p.wish_delta_1d == null ? '-' : fmt(p.wish_delta_1d)}</td><td>${p.on_sale ? '预售中' : '-'}</td></tr>`).join('') || '<tr><td colspan="5" class="dim">暂无待映数据</td></tr>';

  // 监控池
  document.getElementById('watching').innerHTML = (data.watching || []).map(m => {
    const links = (m.links || []).map(l =>
      `<span class="stock">${l.symbol} ${l.name}<i>${l.role}</i></span>`).join('') || '<span class="dim">无映射</span>';
    return `<div class="card">
      <div class="card-h"><b>${m.nm}</b> ${badge[m.status] || ''} <span class="dim">${m.rt || ''} · 想看 ${fmt(m.wish)}</span></div>
      <div class="card-b">${links}</div>
      <div class="card-f dim">猫眼评分:${m.maoyan_score ?? '-'} · 目标首日 ${m.target_yi} 亿</div>
    </div>`;
  }).join('') || '<p class="dim">暂无影片,等待黑马扫描…</p>';

  // 信号流
  document.getElementById('events').innerHTML = (data.events || []).map(e => {
    const [t, cls] = etag[e.etype] || [e.etype, 'b'];
    return `<div class="ev"><span class="b ${cls}">${t}</span> <b>${e.title.replace(/^\S+\s/, '')}</b>
      <span class="dim">${e.ts}</span><p>${e.body}</p></div>`;
  }).join('') || '<p class="dim">暂无信号</p>';
}

load().catch(e => { document.getElementById('updated').textContent = '数据加载失败:' + e; });
