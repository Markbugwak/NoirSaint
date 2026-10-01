import {getProducts,saveProducts} from '../products/products.js';
export const LOW_STOCK_THRESHOLD=5;
export function inventoryRows(){return getProducts().flatMap(p=>p.variants.map(v=>({...v,productId:p.id,productName:p.name,category:p.category,collection:p.collection})))}
export function totalUnits(){return inventoryRows().reduce((n,v)=>n+Number(v.stock||0),0)}
export function setVariantStock(productId,variantId,stock){const products=getProducts().map(p=>p.id===productId?{...p,variants:p.variants.map(v=>v.id===variantId?{...v,stock:Math.max(0,Number(stock)||0),status:Number(stock)>0?'active':'sold_out'}:v)}:p);saveProducts(products);return products}
export function decrementVariant(variantId,qty){const products=getProducts();let found=false;const next=products.map(p=>({...p,variants:p.variants.map(v=>{if(v.id!==variantId)return v;found=true;if(v.stock<qty)throw new Error(`Insufficient stock for ${p.name} / ${v.size}`);const stock=v.stock-qty;return {...v,stock,status:stock>0?'active':'sold_out'}})}));if(found)saveProducts(next);return next}
