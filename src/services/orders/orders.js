import { supabase, isSupabaseConfigured } from '../supabase/client.js';

const KEY = 'noirsaint_orders_v3';

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function writeLocal(orders) {
  localStorage.setItem(KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event('noirsaint-orders-change'));
}
function mapOrder(row) {
  return {
    id: row.id,
    userId: row.user_id,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.shipping_address,
      city: row.shipping_city,
      province: row.shipping_province,
      payment: row.payment_method
    },
    items: (row.order_items || []).map(item => ({
      key: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      sku: item.sku,
      size: item.size,
      color: item.color,
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      lineTotal: Number(item.line_total || 0),
      image: ''
    })),
    total: Number(row.total || 0),
    status: row.status,
    createdAt: row.created_at
  };
}

export function getOrders() { return readLocal(); }

export async function refreshOrders(userId = null) {
  if (!isSupabaseConfigured()) return readLocal();
  let query = supabase.from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    console.error('NOIRSAINT orders error:', error);
    return readLocal();
  }
  const mapped = (data || []).map(mapOrder);
  writeLocal(mapped);
  return mapped;
}

export async function createOrder(order) {
  const local = {
    ...order,
    id: order.id || `NS-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'Processing'
  };
  writeLocal([local, ...readLocal()]);

  if (isSupabaseConfigured()) {
    const payload = { id: local.id, customer: local.customer, items: local.items, total: local.total };
    const { data, error } = await supabase.rpc('create_noirsaint_order', { payload });
    if (error) {
      writeLocal(readLocal().filter(x => x.id !== local.id));
      throw error;
    }
    if (data?.id && data.id !== local.id) {
      const previousId = local.id;
      local.id = data.id;
      writeLocal([local, ...readLocal().filter(x => x.id !== previousId)]);
    }
  }
  return local;
}

export async function updateOrderStatus(id, status) {
  const next = readLocal().map(order => order.id === id ? { ...order, status } : order);
  writeLocal(next);
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      console.error('NOIRSAINT order status error:', error);
      return null;
    }
  }
  return next.find(order => order.id === id) || null;
}
