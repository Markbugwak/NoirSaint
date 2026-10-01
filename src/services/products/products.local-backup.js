import {products as seedProducts} from '../../data/products/products.js';
const KEY='noirsaint_products_v2';
export function getProducts(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.length)return saved}catch{};localStorage.setItem(KEY,JSON.stringify(seedProducts));return seedProducts}
export function saveProducts(items){localStorage.setItem(KEY,JSON.stringify(items));return items}
export function resetProducts(){localStorage.setItem(KEY,JSON.stringify(seedProducts));return seedProducts}
export function getProduct(id){return getProducts().find(p=>p.id===id)}
