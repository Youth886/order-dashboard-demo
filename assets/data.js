/** 独立生成虚构数据；固定种子保证每次打开可重复核对，不读取任何Excel。 */
window.DEMO_DATA = (() => {
  let seed = 20261030;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const round = value => Math.round(value * 100) / 100;
  const customers = ['客户A · 星澜制造', '客户B · 远川科技', '客户C · 沐光工业', '客户D · 云岑设备', '客户E · 森屿电子', '客户F · 北辰动力', '客户G · 清禾精工', '客户H · 岚谷系统'];
  const products = ['绝缘支架', '连接器外壳', '铜排组件', '密封盖板', '固定底座', '防护卡扣', '线束护套', '散热支撑件'];
  const prices = [12.8, 24.6, 42.3, 8.5, 18.2, 3.6, 6.9, 31.4];
  const months = Array.from({length: 12}, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`);
  const orders = [], shipments = [], returns = [];
  months.forEach((month, mi) => customers.forEach((customer, ci) => {
    const count = 2 + Math.floor(random() * 4);
    for (let index = 0; index < count; index++) {
      const pi = Math.floor(random() * products.length), id = `DEMO-${month.replace('-', '')}-${String(orders.length + 1).padStart(4, '0')}`;
      const qty = Math.round((120 + random() * 2800) * (1 + .2 * Math.sin(mi / 2)) * (ci < 2 ? 1.5 : 1));
      const amount = round(qty * prices[pi]), progress = random(), shipped = progress < .12 ? 0 : progress < .35 ? Math.round(qty * .45) : progress < .55 ? Math.round(qty * .8) : qty;
      const invoice = random() > .17 ? amount : 0, received = round(invoice * [0, .35, .65, 1][Math.floor(random() * 4)]);
      const order = {id, month, customer, product: products[pi], material: `MOCK-${String(pi + 1).padStart(3, '0')}`, type: random() < .23 ? '样件' : '量产', qty, amount, shipped, invoice, received, balance: round(invoice - received), returned: 0};
      order.status = shipped === 0 ? '待发货' : shipped < qty ? '部分发货' : '已完成';
      if (shipped) {
        const parts = Math.ceil(random() * 3), base = Math.floor(shipped / parts);
        for (let part = 0; part < parts; part++) shipments.push({id: `S-${shipments.length + 1}`, orderId: id, month, date: `${month}-${String(8 + part * 4).padStart(2, '0')}`, customer, product: order.product, qty: part === parts - 1 ? shipped - base * (parts - 1) : base});
        if (random() < .14) {
          const claim = random() < .3, quantity = claim ? 0 : Math.max(1, Math.round(shipped * .015));
          order.returned = quantity;
          returns.push({id: `R-${returns.length + 1}`, orderId: id, month, customer, product: order.product, type: claim ? '索赔' : '退货', qty: quantity, amount: round(claim ? amount * .008 : quantity * prices[pi])});
        }
      }
      orders.push(order);
    }
  }));
  return {customers, products, months, orders, shipments, returns, version: 'synthetic-20261030', seed: 20261030};
})();
