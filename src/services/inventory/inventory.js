import {supabase,isSupabaseConfigured} from '../supabase/client.js';
import {getProducts,loadProducts} from '../products/products.js';
export const LOW_STOCK_THRESHOLD=5;
export function inventoryRows(){return getProducts().flatMap(p=>p.variants.map(v=>({...v,productId:p.id,productName:p.name,category:p.category,collection:p.collection})))}
export function totalUnits(){return inventoryRows().reduce((n,v)=>n+Number(v.stock||0),0)}
export async function setVariantStock(productId,variantId,stock){
  const value=Math.max(0,Number(stock)||0);
  if(isSupabaseConfigured()){
    const {error}=await supabase.rpc('set_noirsaint_variant_stock',{p_variant_id:variantId,p_stock:value});
    if(error) throw error;
    await loadProducts({admin:true});
    return getProducts();
  }
  return getProducts();
}
export async function decrementVariant(variantId,qty){ return true; }
