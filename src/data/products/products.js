export const SIZE_PRESETS={clothing:['XS','S','M','L','XL','XXL'],shoes:['38','39','40','41','42','43','44','45'],rings:['7','8','9','10','11','12'],one:['ONE SIZE']};
const raw=[
['Obsidian Coat','Outerwear',285,'obsidian-coat-front.png','XS,S,M,L,XL','Outerwear','Heavy wool-blend coat with a structured NOIRSAINT silhouette.'],
['Eclipse Leather Jacket','Leather',420,'leather-jacket-front.png','S,M,L,XL','Outerwear','Full-grain leather jacket with a clean architectural cut.'],
['Cathedral Trench','Outerwear',360,'cathedral-trench-front.png','S,M,L,XL','Outerwear','Long technical trench with a dramatic, minimal profile.'],
['Void Bomber','Outerwear',275,'void-bomber-front.png','S,M,L,XL,XXL','Outerwear','Oversized bomber finished in matte black technical fabric.'],
['Signature Tee','Tops',85,'signature-tee-front.png','XS,S,M,L,XL,XXL','Essentials','The essential NOIRSAINT signature tee.'],
['Saint Long Sleeve','Tops',105,'saint-long-sleeve-front.png','XS,S,M,L,XL,XXL','Essentials','Heavyweight long sleeve with understated branding.'],
['Frame Shirt','Tops',125,'frame-shirt-front.png','S,M,L,XL','Essentials','Sharp framed shirt designed for layered styling.'],
['Veil Shirt','Tops',135,'veil-shirt-front.png','S,M,L,XL','Essentials','Fluid shirt with a soft drape and dark tonal finish.'],
['Monolith Hoodie','Hoodies',165,'monolith-hoodie-front.png','XS,S,M,L,XL,XXL','Essentials','Dense cotton hoodie with an oversized fit.'],
['Chapel Hoodie','Hoodies',175,'chapel-hoodie-front.png','S,M,L,XL,XXL','Essentials','Premium brushed hoodie with a restrained gothic character.'],
['Ash Sweatshirt','Tops',145,'ash-sweatshirt-front.png','XS,S,M,L,XL,XXL','Essentials','Relaxed heavyweight sweatshirt in charcoal black.'],
['Obsidian Trousers','Bottoms',190,'obsidian-trousers-front.png','S,M,L,XL','Essentials','Tailored trousers with a straight architectural line.'],
['Shadow Cargo','Bottoms',205,'shadow-cargo-pants-front.png','S,M,L,XL,XXL','Essentials','Utility cargo trousers with a modern wide fit.'],
['Ruin Denim','Bottoms',180,'ruin-denim-front.png','28,30,32,34,36','Archive','Washed black denim with a relaxed silhouette.'],
['Axis Trousers','Bottoms',195,'axis-trousers-front.png','S,M,L,XL','Archive','Minimal trousers with precise panel construction.'],
['Eclipse Dress','Dresses',235,'eclipse-dress-front.png','XS,S,M,L,XL','Women','A fluid dark dress balancing softness and structure.'],
['Veil Dress','Dresses',225,'veil-dress-front.png','XS,S,M,L,XL','Women','Editorial drape dress with a clean neckline.'],
['Obsidian Mini Dress','Dresses',195,'obsidian-mini-dress-front.png','XS,S,M,L','Women','Compact silhouette with a sharp, minimal finish.'],
['Cathedral Knit','Knitwear',180,'cathedral-knit-sweater.png','XS,S,M,L,XL','Essentials','Textured knit with a sculpted neckline.'],
['Halo Cardigan','Knitwear',165,'halo-cardigan.png','XS,S,M,L,XL','Essentials','Soft knit cardigan with elongated proportions.'],
['Relic Leather Vest','Leather',310,'relic-leather-vest.png','S,M,L,XL','Archive','Leather vest with precise utilitarian detailing.'],
['Testament Leather Pants','Leather',350,'testament-leather-pants.png','S,M,L,XL','Archive','Tailored leather trousers with a straight leg.'],
['Chrome Chain','Accessories',120,'chrome-chain.png','ONE SIZE','Accessories','Polished metal chain designed for everyday layering.'],
['Signet Ring','Accessories',95,'signet-ring.png','7,8,9,10,11,12','Accessories','Minimal signet ring with a solid sculptural face.'],
['Relic Pendant','Accessories',110,'relic-pendant.png','ONE SIZE','Accessories','Sculptural pendant on a fine metal chain.'],
['Obsidian Belt','Accessories',105,'obsidian-belt.png','S,M,L,XL','Accessories','Full-grain leather belt with tonal hardware.'],
['Void Tote','Bags',155,'void-tote.png','ONE SIZE','Accessories','Structured everyday tote in matte black.'],
['Eclipse Crossbody','Bags',175,'eclipse-crossbody.png','ONE SIZE','Accessories','Compact crossbody with architectural hardware.'],
['Monolith Boots','Footwear',285,'monolith-boots.png','38,39,40,41,42,43,44,45','Footwear','Elevated leather boots with a clean monolith sole.'],
['Axis Loafers','Footwear',250,'axis-loafers.png','38,39,40,41,42,43,44,45','Footwear','Polished leather loafers with a squared profile.']
];
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export const products=raw.map(([name,category,price,image,sizes,collection,description],i)=>{const id=`p${String(i+1).padStart(3,'0')}`;const sizesArr=sizes.split(',');const color=['Chrome Chain','Signet Ring','Relic Pendant'].includes(name)?'Silver':'Black';return {id,name,slug:slugify(name),sku:`NS-${String(i+1).padStart(3,'0')}`,category,collection,brand:'NOIRSAINT',price,compareAtPrice:i%5===0?price+30:null,salePrice:null,status:'published',featured:i<8,newArrival:i>=8&&i<16,bestseller:i%6===0,material:category==='Leather'?'Full-grain leather':category==='Knitwear'?'Wool blend':'Premium cotton blend',color,gender:category==='Dresses'?'Women':'Unisex',style:'Contemporary gothic',fit:category==='Hoodies'||category==='Tops'?'Relaxed':'Regular',care:'Follow garment label; dry clean leather and structured outerwear.',origin:'Designed by NOIRSAINT',tags:[category.toLowerCase(),'noirsaint','2026'],images:[`/images/products/${image}`],description,shortDescription:description,variantType:category==='Footwear'?'shoes':category==='Accessories'&&name==='Signet Ring'?'rings':sizesArr.length===1?'one':'clothing',variants:sizesArr.map((size,j)=>({id:`${id}-${slugify(color)}-${size.toLowerCase().replace(/\s/g,'-')}`,productId:id,sku:`NS-${String(i+1).padStart(3,'0')}-${color.slice(0,3).toUpperCase()}-${size.replace(' ','-')}`,size,color,price,stock:[5,10,15,12,7,3][j%6],image:`/images/products/${image}`,status:'active'}))}});
export function getProductBySlug(slug){return products.find(p=>p.slug===slug)}
export function getProductById(id){return products.find(p=>p.id===id)}
export const categories=['Outerwear','Tops','Hoodies','Bottoms','Dresses','Knitwear','Leather','Accessories','Bags','Footwear'];
