/** GitHub Pages演示应用。所有计算在浏览器内完成，没有账号、服务器或外部模型请求。 */
(() => {
  const D = window.DEMO_DATA, C = window.DEMO_CHARTS, $ = id => document.getElementById(id), esc = C.escape;
  const pages = {overview:['经营概览','经营全貌，从一组清晰的数字开始。','◫'], orders:['订单与履约','查看订单趋势、交付进展与每一条模拟订单。','▤'], shipments:['发货追踪','按实际发货月份查看模拟发货流水。','◇'], returns:['退货与索赔','区分退货和索赔，查看金额及数量分布。','↶'], collection:['收款追踪','开票、表内已收款与应收余额分别展示。','▣'], customers:['客户经营','比较虚构客户的订单贡献与回款表现。','♧'], assistant:['分析助手','围绕当前筛选范围，体验可核对的规则分析。','✧']};
  const state = {page:'overview', customer:'', from:D.months[0], to:D.months.at(-1), search:'', limit:20};
  const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const money = value => fmt(value / 10000), fmt = value => Number(value).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const scope_rows = rows => rows.filter(r => r.month >= state.from && r.month <= state.to && (!state.customer || r.customer === state.customer) && (!state.search || Object.values(r).some(v => String(v).toLowerCase().includes(state.search.toLowerCase()))));
  const months = () => D.months.filter(m => m >= state.from && m <= state.to);
  const grouped = (rows, key) => [...rows.reduce((groups,row)=>{const name=row[key];if(!groups.has(name))groups.set(name,[]);groups.get(name).push(row);return groups;},new Map())].map(([name, group]) => ({name, count:group.length, amount:sum(group,'amount'), qty:sum(group,'qty'), shipped:sum(group,'shipped'), invoice:sum(group,'invoice'), received:sum(group,'received'), balance:sum(group,'balance')})).sort((a,b) => b.amount - a.amount);
  const panel = (title, content, note='') => `<section class="panel"><div class="panel-heading"><h2>${title}</h2>${note ? `<span>${note}</span>` : ''}</div>${content}</section>`;
  const grid = (main, rail) => `<div class="content-grid">${main}<div class="rail-stack">${rail}</div></div>`;
  const trend = (rows, field, divisor=10000) => months().map(month => ({label:month, value:sum(rows.filter(r => r.month === month), field) / divisor}));
  function kpis(items) {
    return `<div class="kpi-grid">${items.map((s,i) => `<article class="kpi ${i%2?'teal':'blue'}"><div class="kpi-label">${s[0]}</div><div class="kpi-value">${s[1]}<small>${s[2]||''}</small></div><div class="kpi-bottom"><span>${s[3]}</span>${C.spark(s[4]||[1,2,2,3,2,4,3],i%2?'#299b8b':'#2864d6')}</div></article>`).join('')}</div>`;
  }
  function ranking(rows, key='amount', unit='万') {
    const max = Math.max(...rows.map(r=>r[key]),1);
    return `<div class="ranking">${rows.slice(0,5).map((r,i)=>`<div class="rank-item"><div><span class="rank-index">${String(i+1).padStart(2,'0')}</span><span>${esc(r.name)}</span><strong>${unit==='万'?money(r[key]):C.number(r[key])} ${unit}</strong></div><div class="rank-track"><i style="width:${r[key]/max*100}%"></i></div></div>`).join('')||'<div class="empty">当前范围没有记录</div>'}</div>`;
  }
  function funds(orders) {
    const invoice=sum(orders,'invoice'), paid=sum(orders,'received'), rate=invoice?paid/invoice*100:0;
    return panel('开票与回款', `<div class="rate">${rate.toFixed(1)}<small>%</small></div><p class="muted">表内收款率</p><div class="progress"><i style="width:${rate}%"></i></div><dl class="facts"><div><dt>含税开票</dt><dd>${money(invoice)} 万</dd></div><div><dt>表内已收款</dt><dd>${money(paid)} 万</dd></div><div><dt>应收余额</dt><dd>${money(sum(orders,'balance'))} 万</dd></div></dl><p class="footnote">按模拟开票记录汇总；已收款为表内累计值，不代表按到账日期统计的期间现金流。</p>`);
  }
  let table_rows=[], table_columns=[];
  const order_columns=[['订单号','id'],['客户','customer'],['产品','product'],['订单月份','month'],['订单数量 / 件','qty','number'],['已发货 / 件','shipped','number'],['含税金额 / 元','amount','money'],['状态','status','status']];
  const customer_columns=[['客户','name'],['订单行数','count','number'],['订单数量 / 件','qty','number'],['订单金额 / 元','amount','money'],['已发货 / 件','shipped','number'],['已收款 / 元','received','money'],['应收余额 / 元','balance','money']];
  function table(title, rows, columns) {
    table_rows=rows; table_columns=columns;
    return panel(title, `<div class="table-toolbar"><div class="table-settings">展示前 <select id="row-limit" aria-label="展示条数">${[10,20,50,99999].map(v=>`<option value="${v}" ${state.limit===v?'selected':''}>${v===99999?'全部':v}</option>`).join('')}</select> 条 <span class="muted">共 ${rows.length} 条模拟记录</span></div><button id="export" class="secondary">↓ 导出当前范围 CSV</button></div><div id="table-container"></div>`, '当前筛选范围');
  }
  function paint_table() {
    const shown=table_rows.slice(0,state.limit);
    $('table-container').innerHTML=`<div class="table-scroll"><table><thead><tr>${table_columns.map(c=>`<th class="${c[2]&&c[2]!=='status'?'numeric':''}">${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${shown.map(row=>`<tr>${table_columns.map(([label,key,type])=>`<td class="${type&&type!=='status'?'numeric':''}">${type==='status'?`<span class="status ${row[key]==='已完成'?'complete':row[key]==='部分发货'?'partial':'pending'}">${esc(row[key])}</span>`:key==='id'&&state.page==='orders'?`<button class="order-link" data-order="${esc(row.id)}">${esc(row.id)}</button>`:type==='money'?fmt(row[key]):type==='number'?C.number(row[key]):esc(row[key]??'—')}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${table_columns.length}" class="empty">没有符合条件的模拟记录，请调整筛选。</td></tr>`}</tbody></table></div><p class="footnote">展示 ${shown.length} / ${table_rows.length} 条；CSV 导出当前筛选范围的全部记录。</p>`;
  }
  function render() {
    const o=scope_rows(D.orders), s=scope_rows(D.shipments), r=scope_rows(D.returns), clients=grouped(o,'customer');
    const title=pages[state.page]; $('current-page').textContent=$('page-title').textContent=title[0]; $('page-description').textContent=title[1];
    document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===state.page));
    $('scope').textContent=`已应用：${state.from} — ${state.to} · ${state.customer||'全部虚构客户'}${state.search?' · 搜索：'+state.search:''} · 仅模拟数据`;
    const a=sum(o,'amount'), qty=sum(o,'qty'), shipped=sum(o,'shipped'), invoice=sum(o,'invoice'), balance=sum(o,'balance');
    let cards=[['订单金额 · 含税',money(a),'万',`${o.length} 行模拟订单`,trend(o,'amount').map(v=>v.value)],['订单产品数量',C.number(qty),'件','保留订单产品行'],['发货数量',C.number(shipped),'件',`订单数量比值 ${qty?(shipped/qty*100).toFixed(1):'0.0'}%`],['应收余额',money(balance),'万','由模拟开票记录汇总']];
    let content=''; table_rows=[];
    if(state.page==='overview') {
      content=grid(panel('月度订单金额（万元）',C.bars(trend(o,'amount')),'悬停查看具体金额'),funds(o));
      const sample=sum(o.filter(x=>x.type==='样件'),'amount'), share=a?sample/a*100:0;
      content+=grid(panel('客户贡献',ranking(clients),'按含税订单金额 · 前五名'),panel('订单类型',`<div class="type-amount">${share.toFixed(1)}<small>%</small></div><p class="muted">样件金额占比</p><div class="split-track"><i style="width:${share}%"></i></div><dl class="facts"><div><dt><b class="dot blue"></b> 样件</dt><dd>${money(sample)} 万</dd></div><div><dt><b class="dot teal"></b> 量产</dt><dd>${money(a-sample)} 万</dd></div></dl>`));
      content+=table('客户经营汇总',clients,customer_columns);
    } else if(state.page==='orders') {
      content=grid(panel('订单金额与明细行数',`<div class="legend"><span><i class="dot blue"></i>金额 / 万元</span><span><i class="dot teal"></i>行数 / 独立比例</span></div>${C.bars(trend(o,'amount'),'万元',months().map(m=>o.filter(x=>x.month===m).length))}`),panel('发货状态',o.length?['已完成','部分发货','待发货'].map(status=>{const count=o.filter(x=>x.status===status).length;return `<div class="state-row"><span class="status ${status==='已完成'?'complete':status==='部分发货'?'partial':'pending'}">${status}</span><strong>${count} 行</strong><div class="progress"><i style="width:${count/o.length*100}%"></i></div></div>`}).join(''):'<div class="empty">暂无订单</div>'));
      content+=table('订单明细 · 点击订单号查看详情',o,order_columns);
    } else if(state.page==='shipments') {
      cards=[['实际发货数量',C.number(sum(s,'qty')),'件','按发货月份统计'],['发货流水',C.number(s.length),'行','同一订单可分多批'],['覆盖客户',C.number(new Set(s.map(x=>x.customer)).size),'家','当前发货范围'],['未完结订单',C.number(o.filter(x=>x.status!=='已完成').length),'行','按当前订单范围统计']];
      content=grid(panel('月度发货数量（万件）',C.bars(trend(s,'qty'),'万件')),panel('客户发货贡献',ranking(grouped(s,'customer'),'qty','件')))+table('发货流水',s,[['流水号','id'],['关联订单','orderId'],['发货日期','date'],['客户','customer'],['产品','product'],['发货数量 / 件','qty','number']]);
    } else if(state.page==='returns') {
      const returned=r.filter(x=>x.type==='退货'), claims=r.filter(x=>x.type==='索赔');
      cards=[['退货与索赔合计',money(sum(r,'amount')),'万',`${r.length} 条模拟记录`],['退货金额',money(sum(returned,'amount')),'万',`${returned.length} 条退货`],['索赔金额',money(sum(claims,'amount')),'万',`${claims.length} 条索赔`],['退货数量',C.number(sum(returned,'qty')),'件','索赔不计入退货件数']];
      content=grid(panel('月度退货索赔金额（万元）',C.bars(trend(r,'amount'))),panel('客户金额分布',ranking(grouped(r,'customer'))))+table('退货索赔明细',r,[['记录号','id'],['关联订单','orderId'],['处理月份','month'],['客户','customer'],['产品','product'],['类型','type'],['退货数量 / 件','qty','number'],['含税金额 / 元','amount','money']]);
    } else if(state.page==='collection') {
      cards=[['含税开票',money(invoice),'万','模拟开票记录'],['表内已收款',money(sum(o,'received')),'万','记录累计收款'],['应收余额',money(balance),'万','开票减表内已收'],['表内收款率',invoice?(sum(o,'received')/invoice*100).toFixed(1):'0.0','%','已收款 / 开票']];
      content=grid(panel('月度开票金额（万元）',C.bars(trend(o,'invoice'))),funds(o))+table('客户回款汇总',clients,customer_columns);
    } else if(state.page==='customers') {
      cards=[['覆盖客户',C.number(clients.length),'家','均为虚构客户'],['订单总额',money(a),'万','当前范围'],['第一大客户占比',a?(clients[0]?.amount/a*100).toFixed(1):'0.0','%','按订单金额'],['平均客户订单金额',money(clients.length?a/clients.length:0),'万','订单金额 / 客户数']];
      content=grid(panel('客户订单贡献',ranking(clients),'当前范围 · 前五名'),panel('产品金额贡献',ranking(grouped(o,'product'))))+table('客户经营明细',clients,customer_columns);
    } else {
      content=panel('分析工作台',`<div class="assistant-notice">规则分析演示 · 不调用大模型，不发送数据</div><div class="quick-questions"><button data-question="经营概况">经营概况</button><button data-question="月度变化">月度变化</button><button data-question="客户贡献">客户贡献</button><button data-question="资金回款">资金回款</button></div><div id="answer" class="answer"><span class="eyebrow">START A CONVERSATION</span><h2>先看结论，再核对数据。</h2><p>点击一个主题，或输入“月度变化”“客户贡献”“资金回款”。回复由当前模拟明细按规则生成，并非真实大模型输出。</p></div><form id="chat-form" class="composer"><input id="question" placeholder="例如：当前范围的订单金额有什么变化？" aria-label="分析问题"><button class="primary">生成演示分析</button></form>`);
    }
    $('content').innerHTML=kpis(cards)+content;
    if($('table-container')) {paint_table(); $('row-limit').onchange=e=>{state.limit=Number(e.target.value);paint_table();}; $('export').onclick=export_csv;}
    if($('chat-form')) $('chat-form').onsubmit=e=>{e.preventDefault(); answer($('question').value,o,clients);};
  }
  /** 按当前范围计算演示答复；不伪装成实时模型调用。 */
  function answer(question,o,clients) {
    const monthly=trend(o,'amount'), last=monthly.at(-1), previous=monthly.at(-2); let conclusion='';
    if(/回款|收款|资金|应收/.test(question)) conclusion=`当前范围含税开票 ${money(sum(o,'invoice'))} 万元，表内已收款 ${money(sum(o,'received'))} 万元，应收余额 ${money(sum(o,'balance'))} 万元。已收款是开票记录的累计值，不能当作按到账日期统计的现金流。`;
    else if(/月|变化|下降|增长/.test(question)) conclusion=previous?`${last.label} 订单金额 ${fmt(last.value)} 万元；对比 ${previous.label} 的 ${fmt(previous.value)} 万元，变化 ${fmt(last.value-previous.value)} 万元${previous.value?`，变化率 ${((last.value/previous.value-1)*100).toFixed(1)}%`:'；对比月为0，不计算变化率'}。这能说明金额变化，不能证明变化的业务原因。`:'当前筛选范围不足两个月，请扩大月份范围后比较。';
    else if(/客户|贡献/.test(question)) conclusion=clients.length?`订单贡献第一的是 ${clients[0].name}，金额 ${money(clients[0].amount)} 万元，占当前范围 ${sum(o,'amount')?(clients[0].amount/sum(o,'amount')*100).toFixed(1):'0.0'}%。客户贡献排名可以回到客户经营明细核对。`:'当前范围没有客户订单。';
    else if(/经营|概况|订单|情况/.test(question)) conclusion=`当前范围共 ${o.length} 条模拟订单、${clients.length} 家虚构客户，含税订单金额 ${money(sum(o,'amount'))} 万元，订购 ${C.number(sum(o,'qty'))} 件，发货 ${C.number(sum(o,'shipped'))} 件。发货数量比值不代表按期履约率。`;
    else conclusion='演示版目前支持经营概况、月度变化、客户贡献和资金回款。此问题未接入真实模型，请选择这些主题体验；不会编造未实现的分析。';
    $('answer').innerHTML=`<span class="mini-label">规则生成 · 当前模拟数据</span><h2>${esc(question||'经营概况')}</h2><p class="answer-conclusion">${esc(conclusion)}</p><div class="answer-evidence"><strong>数据依据</strong><p>${state.from} — ${state.to} · ${esc(state.customer||'全部虚构客户')} · ${o.length} 条模拟订单</p><p>来源：浏览器内置模拟明细；金额单位按万元换算。数据与业务原因均不代表真实企业。</p></div>`;
  }
  function export_csv() {
    const cell=v=>`"${String(v??'').replace(/"/g,'""')}"`, text='\ufeff'+[table_columns.map(c=>c[0]),...table_rows.map(r=>table_columns.map(c=>r[c[1]]))].map(row=>row.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})), a=document.createElement('a'); a.href=url;a.download=`模拟数据_${pages[state.page][0]}_${state.from}_${state.to}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('navigation').innerHTML=Object.entries(pages).map(([key,[label,,icon]])=>`<a href="#${key}" data-page="${key}"><span class="nav-icon">${icon}</span>${label}</a>`).join('');
  $('customer').innerHTML='<option value="">全部虚构客户</option>'+D.customers.map(c=>`<option>${esc(c)}</option>`).join('');
  ['from-month','to-month'].forEach(id=>$(id).innerHTML=D.months.map(m=>`<option>${m}</option>`).join('')); $('from-month').value=state.from;$('to-month').value=state.to;
  $('filters').onsubmit=e=>{e.preventDefault();if($('from-month').value>$('to-month').value){$('scope').textContent='起始月份不能晚于结束月份。';return;}Object.assign(state,{customer:$('customer').value,from:$('from-month').value,to:$('to-month').value,search:$('search').value.trim()});render();};
  $('reset').onclick=()=>{state.customer=state.search='';state.from=D.months[0];state.to=D.months.at(-1);$('customer').value=$('search').value='';$('from-month').value=state.from;$('to-month').value=state.to;render();};
  $('menu').onclick=()=>document.body.classList.toggle('nav-collapsed'); $('close-detail').onclick=()=>$('detail').close();
  document.addEventListener('click',e=>{const quick=e.target.closest('[data-question]'), link=e.target.closest('[data-order]');if(quick)answer(quick.dataset.question,scope_rows(D.orders),grouped(scope_rows(D.orders),'customer'));if(link){const o=D.orders.find(x=>x.id===link.dataset.order);$('detail-body').innerHTML=`<p class="muted">${esc(o.id)} · 虚构业务记录</p><dl class="detail-grid">${[['客户',o.customer],['产品',o.product],['物料编号',o.material],['类型',o.type],['月份',o.month],['状态',o.status],['订单数量',C.number(o.qty)+' 件'],['发货数量',C.number(o.shipped)+' 件'],['订单含税金额',fmt(o.amount)+' 元'],['含税开票',fmt(o.invoice)+' 元'],['已收款',fmt(o.received)+' 元'],['应收余额',fmt(o.balance)+' 元']].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;$('detail').showModal();}});
  const navigate=()=>{state.page=Object.hasOwn(pages,location.hash.slice(1))?location.hash.slice(1):'overview';render();document.body.classList.remove('nav-collapsed');window.scrollTo(0,0);};
  window.addEventListener('hashchange',navigate);navigate();
})();
