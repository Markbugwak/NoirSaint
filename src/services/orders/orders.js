const KEY='noirsaint_orders_v2';
export function getOrders(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}}
export function createOrder(order){const orders=getOrders();const next={...order,id:`NS-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),status:'Processing'};localStorage.setItem(KEY,JSON.stringify([next,...orders]));return next}
export function updateOrderStatus(id,status){const orders=getOrders();const next=orders.map(order=>order.id===id?{...order,status}:order);localStorage.setItem(KEY,JSON.stringify(next));return next.find(order=>order.id===id)||null}
