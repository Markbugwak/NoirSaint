import { supabase, isSupabaseConfigured } from '../supabase/client.js';

const KEY='noirsaint_orders_v2';
const fromRow=(order,items=[])=>({
  id:order.id,
  userId:order.user_id,
  customer:{name:order.customer_name,email:order.customer_email,phone:order.customer_phone,address:order.shipping_address,city:order.shipping_city,province:order.shipping_province,payment:order.payment_method},
  items:items.map(i=>({key:`${i.product_id||'product'}:${i.variant_id||i.id}`,productId:i.product_id,variantId:i.variant_id,name:i.product_name,sku:i.sku,size:i.size,color:i.color,price:Number(i.unit_price),quantity:i.quantity,image:''})),
  total:Number(order.total),createdAt:order.created_at,status:order.status
});

export async function getOrders({userId=null,admin=false}={}){
  if(!isSupabaseConfigured()){
    try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}
  }
  let q=supabase.from('orders').select('*, order_items(*)').order('created_at',{ascending:false});
  if(userId&&!admin) q=q.eq('user_id',userId);
  const {data,error}=await q;
  if(error){console.error('NOIRSAINT Supabase orders error:',error);return[]}
  return (data||[]).map(o=>fromRow(o,o.order_items||[]));
}

export async function createOrder(order){
  if(!isSupabaseConfigured()){
    const orders=await getOrders();
    const next={...order,id:`NS-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString(),status:'Processing'};
    localStorage.setItem(KEY,JSON.stringify([next,...orders])); return next;
  }
  const {data,error}=await supabase.rpc('create_noirsaint_order',{
    payload:{id:`NS-${Date.now().toString(36).toUpperCase()}`,customer:order.customer,items:order.items,total:order.total}
  });
  if(error) throw error;
  const next={id:data.id,status:data.status,createdAt:new Date().toISOString(),customer:order.customer,items:order.items,total:Number(data.total ?? order.total)};
  try { localStorage.setItem(`${KEY}_last`, JSON.stringify(next)); } catch {}
  return next;
}

export function getCachedOrder(id){
  try {
    const cached=JSON.parse(localStorage.getItem(`${KEY}_last`));
    return cached?.id===id ? cached : null;
  } catch { return null; }
}

export async function updateOrderStatus(id,status){
  if(!isSupabaseConfigured()){
    const orders=await getOrders(); const next=orders.map(o=>o.id===id?{...o,status}:o);
    localStorage.setItem(KEY,JSON.stringify(next)); return next.find(o=>o.id===id)||null;
  }
  const {data,error}=await supabase.from('orders').update({status}).eq('id',id).select('*').single();
  if(error) throw error;
  return fromRow(data,[]);
}
