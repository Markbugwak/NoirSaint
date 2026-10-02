import { getProducts } from '../products/products.js';
import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export const LOW_STOCK_THRESHOLD = 5;

export function inventoryRows() {
  return getProducts().flatMap(p => p.variants.map(v => ({
    ...v, productId: p.id, productName: p.name, category: p.category, collection: p.collection
  })));
}

export function totalUnits() {
  return inventoryRows().reduce((n, v) => n + Number(v.stock || 0), 0);
}

export function setVariantStock(productId, variantId, stock) {
  const nextStock = Math.max(0, Number(stock) || 0);
  const products = getProducts().map(p => p.id === productId
    ? { ...p, variants: p.variants.map(v => v.id === variantId
      ? { ...v, stock: nextStock, status: nextStock > 0 ? 'active' : 'sold_out' } : v) }
    : p);
  try {
    localStorage.setItem('noirsaint_products_v2', JSON.stringify(products));
  } catch {}
  if (isSupabaseConfigured()) {
    supabase.rpc('set_noirsaint_variant_stock', {
      p_variant_id: variantId,
      p_stock: nextStock
    }).then(({ error }) => {
      if (error) console.error('NOIRSAINT inventory error:', error);
    });
  }
  return products;
}

export function decrementVariant(variantId, qty) {
  const products = getProducts();
  const next = products.map(p => ({
    ...p,
    variants: p.variants.map(v => {
      if (v.id !== variantId) return v;
      if (v.stock < qty) throw new Error(`Insufficient stock for ${p.name} / ${v.size}`);
      const stock = v.stock - qty;
      return { ...v, stock, status: stock > 0 ? 'active' : 'sold_out' };
    })
  }));
  try { localStorage.setItem('noirsaint_products_v2', JSON.stringify(next)); } catch {}
  return next;
}
