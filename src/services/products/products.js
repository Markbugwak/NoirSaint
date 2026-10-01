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
  if (!isSupabaseConfigured) {
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

  if (!isSupabaseConfigured) {
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

  if (!isSupabaseConfigured) {
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
  console.warn(
    'saveProducts() is temporarily disabled during Supabase migration.'
  );

  productCache = Array.isArray(items)
    ? items
    : productCache;

  return productCache;
}

export async function resetProducts() {
  console.warn(
    'resetProducts() is temporarily disabled during Supabase migration.'
  );

  await loadProducts();

  return productCache;
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
