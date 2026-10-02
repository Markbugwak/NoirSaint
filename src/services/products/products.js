import { supabase, isSupabaseConfigured } from '../supabase/client.js';

const LOCAL_KEY = 'noirsaint_products_v2';

let productCache = getLocalFallback();

function mapProduct(product, variants = [], images = []) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,

    category: product.categories?.name || '',
    collection: product.collections?.name || '',

    categoryId: product.category_id,
    collectionId: product.collection_id,

    brand: product.brand || 'NOIRSAINT',

    price: Number(product.base_price || 0),
    compareAtPrice:
      product.compare_at_price !== null
        ? Number(product.compare_at_price)
        : null,
    salePrice:
      product.sale_price !== null
        ? Number(product.sale_price)
        : null,

    status: product.status,

    featured: Boolean(product.featured),
    newArrival: Boolean(product.new_arrival),
    bestseller: Boolean(product.bestseller),

    material: product.material || '',
    color: product.color || '',
    gender: product.gender || '',
    style: product.style || '',
    fit: product.fit || '',
    care: product.care_instructions || '',
    origin: product.country_of_production || '',

    tags: Array.isArray(product.tags) ? product.tags : [],

    description: product.description || '',
    shortDescription:
      product.short_description || product.description || '',

    images: images
      .slice()
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      )
      .map(image => image.image_url),

    variants: variants.map(variant => ({
      id: variant.id,
      productId: variant.product_id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,

      price:
        variant.sale_price !== null
          ? Number(variant.sale_price)
          : Number(
              variant.price ||
              product.base_price ||
              0
            ),

      stock: Number(variant.stock || 0),
      image: variant.image_url || '',
      status: variant.status,
      sizeType: variant.size_type
    }))
  };
}

async function fetchProductsFromSupabase() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      ),
      collections (
        id,
        name
      ),
      product_variants (
        id,
        product_id,
        sku,
        size_type,
        size,
        color,
        price,
        sale_price,
        stock,
        image_url,
        status
      ),
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        alt_text
      )
    `)
    .eq('status', 'published')
    .order('created_at', {
      ascending: false
    });

  if (error) {
    console.error(
      'NOIRSAINT Supabase products error:',
      error
    );
    return [];
  }

  return (data || []).map(product =>
    mapProduct(
      product,
      product.product_variants || [],
      product.product_images || []
    )
  );
}

export function getProducts() {
  return productCache;
}

export async function loadProducts() {
  const products = await fetchProductsFromSupabase();

  if (products.length > 0) {
    productCache = products;
    return productCache;
  }

  console.warn(
    'NOIRSAINT: Supabase returned no products. Keeping current product cache.'
  );

  return productCache;
}

export async function getProduct(id) {
  const cached = productCache.find(
    product => product.id === id
  );

  if (cached) {
    return cached;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      ),
      collections (
        id,
        name
      ),
      product_variants (
        id,
        product_id,
        sku,
        size_type,
        size,
        color,
        price,
        sale_price,
        stock,
        image_url,
        status
      ),
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        alt_text
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProduct(
    data,
    data.product_variants || [],
    data.product_images || []
  );
}

export async function getProductBySlug(slug) {
  const cached = productCache.find(
    product => product.slug === slug
  );

  if (cached) {
    return cached;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      ),
      collections (
        id,
        name
      ),
      product_variants (
        id,
        product_id,
        sku,
        size_type,
        size,
        color,
        price,
        sale_price,
        stock,
        image_url,
        status
      ),
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        alt_text
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProduct(
    data,
    data.product_variants || [],
    data.product_images || []
  );
}

export async function saveProducts(items) {
  productCache = Array.isArray(items) ? items : productCache;
  if (!isSupabaseConfigured()) return productCache;

  const products = productCache;
  const productRows = products.map(p => ({
    id: p.id, name: p.name, slug: p.slug, sku: p.sku || null,
    category_id: p.categoryId || null, collection_id: p.collectionId || null,
    brand: p.brand || 'NOIRSAINT',
    base_price: Number(p.price || 0),
    compare_at_price: p.compareAtPrice ?? null,
    sale_price: p.salePrice ?? null,
    status: p.status || 'published',
    featured: Boolean(p.featured), new_arrival: Boolean(p.newArrival),
    bestseller: Boolean(p.bestseller), material: p.material || null,
    color: p.color || null, gender: p.gender || null, style: p.style || null,
    fit: p.fit || null, care_instructions: p.care || null,
    country_of_production: p.origin || null, tags: p.tags || [],
    description: p.description || null, short_description: p.shortDescription || null
  }));

  const { error: productError } = await supabase.from('products').upsert(productRows);
  if (productError) throw productError;

  const variants = products.flatMap(p => (p.variants || []).map(v => ({
    id: v.id, product_id: p.id, sku: v.sku, size_type: v.sizeType || null,
    size: v.size, color: v.color || p.color || null,
    price: v.price ?? null, sale_price: null, stock: Number(v.stock || 0),
    image_url: v.image || null, status: Number(v.stock || 0) > 0 ? 'active' : 'sold_out'
  })));
  if (variants.length) {
    const { error } = await supabase.from('product_variants').upsert(variants);
    if (error) throw error;
  }

  const images = products.flatMap(p => (p.images || []).map((url, index) => ({
    id: `${p.id}-image-${index + 1}`, product_id: p.id, image_url: url, sort_order: index
  })));
  if (images.length) {
    const { error } = await supabase.from('product_images').upsert(images);
    if (error) throw error;
  }

  return productCache;
}

export async function resetProducts() {
  return loadProducts();
}

function getLocalFallback() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(LOCAL_KEY)
    );

    if (Array.isArray(saved) && saved.length) {
      return saved;
    }
  } catch {
    // Ignore invalid localStorage data.
  }

  return [];
}
