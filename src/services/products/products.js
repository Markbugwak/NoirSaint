import { supabase, isSupabaseConfigured } from '../supabase/client.js';

const LOCAL_KEY = 'noirsaint_products_v2';
let productCache = getLocalFallback();

function mapProduct(product, variants = [], images = []) {
  return {
    id: product.id, name: product.name, slug: product.slug, sku: product.sku,
    category: product.categories?.name || '', collection: product.collections?.name || '',
    categoryId: product.category_id, collectionId: product.collection_id,
    brand: product.brand || 'NOIRSAINT',
    price: Number(product.base_price || 0),
    compareAtPrice: product.compare_at_price != null ? Number(product.compare_at_price) : null,
    salePrice: product.sale_price != null ? Number(product.sale_price) : null,
    status: product.status, featured: Boolean(product.featured), newArrival: Boolean(product.new_arrival),
    bestseller: Boolean(product.bestseller), material: product.material || '', color: product.color || '',
    gender: product.gender || '', style: product.style || '', fit: product.fit || '',
    care: product.care_instructions || '', origin: product.country_of_production || '',
    tags: Array.isArray(product.tags) ? product.tags : [],
    description: product.description || '', shortDescription: product.short_description || product.description || '',
    images: images.slice().sort((a,b) => Number(a.sort_order||0)-Number(b.sort_order||0)).map(x => x.image_url),
    variants: variants.map(v => ({
      id:v.id, productId:v.product_id, sku:v.sku, size:v.size, color:v.color,
      price:v.sale_price != null ? Number(v.sale_price) : Number(v.price || product.base_price || 0),
      stock:Number(v.stock||0), image:v.image_url||'', status:v.status, sizeType:v.size_type
    }))
  };
}

const relationSelect = `
  *,
  categories ( id, name ),
  collections ( id, name ),
  product_variants ( id, product_id, sku, size_type, size, color, price, sale_price, stock, image_url, status ),
  product_images ( id, product_id, image_url, sort_order, alt_text )
`;

async function fetchProductsFromSupabase(includeDrafts = false) {
  if (!isSupabaseConfigured()) return [];
  let query = supabase.from('products').select(relationSelect).order('created_at', {ascending:false});
  if (!includeDrafts) query = query.eq('status','published');
  const {data,error}=await query;
  if(error){ console.error('NOIRSAINT Supabase products error:', error); return []; }
  return (data||[]).map(p=>mapProduct(p,p.product_variants||[],p.product_images||[]));
}

export function getProducts(){ return productCache; }

export async function loadProducts({admin=false}={}) {
  const products = await fetchProductsFromSupabase(admin);
  if(products.length){ productCache=products; return productCache; }
  return productCache;
}

export async function getProduct(id){
  const cached=productCache.find(p=>p.id===id);
  if(cached) return cached;
  if(!isSupabaseConfigured()) return null;
  const {data,error}=await supabase.from('products').select(relationSelect).eq('id',id).maybeSingle();
  return error||!data ? null : mapProduct(data,data.product_variants||[],data.product_images||[]);
}

export async function getProductBySlug(slug){
  const cached=productCache.find(p=>p.slug===slug);
  if(cached) return cached;
  if(!isSupabaseConfigured()) return null;
  const {data,error}=await supabase.from('products').select(relationSelect).eq('slug',slug).eq('status','published').maybeSingle();
  return error||!data ? null : mapProduct(data,data.product_variants||[],data.product_images||[]);
}

function slugify(value){ return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

async function ensureLookup(table, name){
  const slug=slugify(name);
  const id=slug;
  const {data,error}=await supabase.from(table).upsert({id,name,slug},{onConflict:'id'}).select('id').single();
  if(error) throw error;
  return data.id;
}

export async function saveProducts(items){
  if(!isSupabaseConfigured()){ productCache=Array.isArray(items)?items:productCache; localStorage.setItem(LOCAL_KEY,JSON.stringify(productCache)); return productCache; }
  const next=Array.isArray(items)?items:[];
  for(const product of next){
    const categoryId=product.categoryId || await ensureLookup('categories',product.category||'Uncategorized');
    const collectionId=product.collectionId || await ensureLookup('collections',product.collection||'Essentials');
    const row={
      id:product.id,name:product.name,slug:product.slug||slugify(product.name),sku:product.sku||null,
      category_id:categoryId,collection_id:collectionId,brand:product.brand||'NOIRSAINT',
      base_price:Number(product.price||0),compare_at_price:product.compareAtPrice==null?null:Number(product.compareAtPrice),
      sale_price:product.salePrice==null?null:Number(product.salePrice),status:product.status||'published',
      featured:Boolean(product.featured),new_arrival:Boolean(product.newArrival),bestseller:Boolean(product.bestseller),
      material:product.material||null,color:product.color||null,gender:product.gender||null,style:product.style||null,fit:product.fit||null,
      care_instructions:product.care||null,country_of_production:product.origin||null,tags:product.tags||[],
      description:product.description||null,short_description:product.shortDescription||null,updated_at:new Date().toISOString()
    };
    const {error}=await supabase.from('products').upsert(row,{onConflict:'id'});
    if(error) throw error;
    await supabase.from('product_variants').delete().eq('product_id',product.id);
    const variants=(product.variants||[]).map(v=>({
      id:v.id,product_id:product.id,sku:v.sku,size_type:v.sizeType||null,size:v.size,color:v.color||null,
      price:Number(v.price||product.price||0),sale_price:v.salePrice==null?null:Number(v.salePrice),
      stock:Math.max(0,Number(v.stock)||0),image_url:v.image||null,status:Number(v.stock)>0?'active':'sold_out'
    }));
    if(variants.length){ const {error}=await supabase.from('product_variants').insert(variants); if(error) throw error; }
    await supabase.from('product_images').delete().eq('product_id',product.id);
    const images=(product.images||[]).map((url,i)=>({id:`${product.id}-image-${i+1}`,product_id:product.id,image_url:url,sort_order:i,alt_text:product.name}));
    if(images.length){ const {error}=await supabase.from('product_images').insert(images); if(error) throw error; }
  }
  const ids=next.map(p=>p.id);
  if(ids.length) await supabase.from('products').delete().not('id','in',`(${ids.join(',')})`);
  productCache=next;
  return productCache;
}

export async function resetProducts(){ await loadProducts({admin:true}); return productCache; }

function getLocalFallback(){
  try{ const saved=JSON.parse(localStorage.getItem(LOCAL_KEY)); if(Array.isArray(saved)&&saved.length) return saved; }catch{}
  return [];
}
