export const collections = [
  { slug:'mens', title:"MEN'S", description:'Structured layers, tailored utility and essential silhouettes built around a restrained dark palette.', image:'/images/collections/mens-collection.png', categories:['Outerwear','Tops','Hoodies','Bottoms','Knitwear','Leather'] },
  { slug:'womens', title:"WOMEN'S", description:'Fluid tailoring, sculpted dresses and precise proportions with a quiet gothic edge.', image:'/images/collections/womens-collection.png', categories:['Dresses','Tops','Outerwear','Knitwear','Leather'] },
  { slug:'unisex', title:'UNISEX', description:'The core NOIRSAINT wardrobe: shared silhouettes designed without prescribed boundaries.', image:'/images/collections/unisex-collection.png', categories:['Tops','Hoodies','Outerwear','Bottoms','Accessories'] },
  { slug:'outerwear', title:'OUTERWEAR', description:'Architectural coats, leather and technical layers made for the full silhouette.', image:'/images/banners/collection-banner.png', categories:['Outerwear','Leather'] },
  { slug:'essentials', title:'ESSENTIALS', description:'The everyday foundation of the house, reduced to shape, fabric and finish.', image:'/images/banners/hero-main.png', categories:['Tops','Hoodies','Bottoms','Knitwear'] },
  { slug:'accessories', title:'ACCESSORIES', description:'Metal, leather and utility details that finish the NOIRSAINT uniform.', image:'/images/products/silver-accessories.png', categories:['Accessories','Bags','Footwear'] },
  { slug:'new-arrivals', title:'NEW ARRIVALS', description:'The latest pieces entering the house — selected for the current season.', image:'/images/banners/home-campaign.png', categories:[] },
];
export const getCollectionBySlug = slug => collections.find(c => c.slug === slug);
