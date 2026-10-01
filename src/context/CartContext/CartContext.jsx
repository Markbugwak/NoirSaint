import React,{createContext,useContext,useEffect,useState} from 'react';
import { getProducts } from '../../services/products/products.js';

const CartContext=createContext(null);const KEY='noirsaint_cart_v2';
export function CartProvider({children}){
 const[items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}});
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);
 const stockFor=item=>{
  const product=getProducts().find(p=>p.id===item.productId);
  return product?.variants.find(v=>v.id===item.variantId)?.stock ?? 0;
 };
 const add=(product,variant,quantity=1)=>setItems(old=>{
  const key=`${product.id}:${variant.id}`;
  const existing=old.find(i=>i.key===key);
  const current=existing?.quantity||0;
  const next=Math.min(Math.max(0,Number(quantity)||0)+current,Number(variant.stock)||0);
  if(next<1)return old;
  if(existing)return old.map(i=>i.key===key?{...i,quantity:next}:i);
  return [...old,{key,productId:product.id,variantId:variant.id,name:product.name,size:variant.size,color:variant.color,sku:variant.sku,price:variant.price,image:variant.image,quantity:next}];
 });
 const update=(key,quantity)=>setItems(old=>old.flatMap(i=>{
  if(i.key!==key)return [i];
  const next=Math.min(Math.max(1,Number(quantity)||1),stockFor(i));
  return next>0?[{...i,quantity:next}]:[];
 }));
 const remove=key=>setItems(old=>old.filter(i=>i.key!==key));
 const clear=()=>setItems([]);
 const count=items.reduce((n,i)=>n+i.quantity,0);
 const subtotal=items.reduce((n,i)=>n+i.price*i.quantity,0);
 return <CartContext.Provider value={{items,add,update,remove,clear,count,subtotal,stockFor}}>{children}</CartContext.Provider>
}
export const useCart=()=>useContext(CartContext);