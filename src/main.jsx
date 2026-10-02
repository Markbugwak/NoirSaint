import React, {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight,
  Heart, Menu, Minus, Plus, Search, ShoppingBag, X, Eye, EyeOff,
  Package, Box, AlertTriangle, TrendingUp, Users,
  Trash2, Edit3, Download, ShieldCheck, LockKeyhole, Monitor, LogOut, CheckCircle2
} from 'lucide-react';

import './styles/globals.css';
import './styles/variables.css';
import './styles/animations.css';

import { CartProvider, useCart } from './context/CartContext/CartContext.jsx';
import {
  getProducts,
  saveProducts,
  resetProducts,
  loadProducts
} from './services/products/products.js';
import { getOrders, getCachedOrder, createOrder, updateOrderStatus } from './services/orders/orders.js';
import { LOW_STOCK_THRESHOLD, inventoryRows, setVariantStock } from './services/inventory/inventory.js';
import { categories, getProductBySlug } from './data/products/products.js';
import { collections, getCollectionBySlug } from './data/collections/collections.js';
import { formatCurrency } from './utils/formatCurrency/formatCurrency.js';
import PageTransition from './components/PageTransition/PageTransition.jsx';
import useReveal from './hooks/useReveal.js';
import { supabase } from './services/supabase/client.js';
import { isCurrentUserAdmin } from './services/auth/auth.js';

const money = formatCurrency;
const go = p => { window.location.hash = p; };

/* ── Wishlist ──────────────────────────────────────────────────── */
const WISHLIST_KEY = 'noirsaint_wishlist_v1';
function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch { return []; }
}
function toggleWishlist(id) {
  const next = getWishlist();
  const i = next.indexOf(id);
  if (i >= 0) next.splice(i, 1); else next.push(id);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('wishlistchange'));
  return next;
}

/* ── Routing ───────────────────────────────────────────────────── */
function useRoute() {
  const [hash, setHash] = useState(location.hash || '#home');
  useEffect(() => {
    const f = () => setHash(location.hash || '#home');
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return hash;
}

/* ── Navbar scroll detection ───────────────────────────────────── */
function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > threshold);
    addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, [threshold]);
  return scrolled;
}

/* ── 3-D Parallax Logo ──────────────────────────────────────────
   Smooth lerp-based pointer tracking with RAF loop.
   --mx / --my drive rotateX / rotateY in CSS.
──────────────────────────────────────────────────────────────── */
function ParallaxLogo() {
  const ref = useRef(null);
  const depthRef = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const depth = depthRef.current;
    if (!el || !depth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let raf = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let active = false;

    const onMove = e => {
      active = true;
      const r = el.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width  - 0.5) * 8;
      targetY = ((e.clientY - r.top)  / r.height - 0.5) * -8;
    };
    const onLeave = () => { active = false; targetX = 0; targetY = 0; };

    const tick = () => {
      const factor = active ? 0.09 : 0.06;
      currentX += (targetX - currentX) * factor;
      currentY += (targetY - currentY) * factor;
      depth.style.setProperty('--mx', `${currentX.toFixed(2)}deg`);
      depth.style.setProperty('--my', `${currentY.toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="hero-logo-stage" aria-hidden="true">
      <div ref={depthRef} className="hero-logo-depth">
        <span className="hero-logo-plate hero-logo-plate-back">
          <img src="/images/logo/noirsaint-monogram.svg" alt="" />
        </span>
        <span className="hero-logo-plate hero-logo-plate-front">
          <img src="/images/logo/noirsaint-monogram.svg" alt="" />
        </span>
        <span className="hero-logo-ring" />
      </div>
    </div>
  );
}

/* ── Loading Screen ────────────────────────────────────────────── */
function Loader({ catalogReady = true }) {
  const [windowLoaded, setWindowLoaded] = useState(false);

  useEffect(() => {
    const finish = () => requestAnimationFrame(() => setWindowLoaded(true));
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    return () => window.removeEventListener('load', finish);
  }, []);

  // Only hide once BOTH the page assets have loaded AND the product
  // catalog has finished fetching — otherwise the loader can fade out
  // while the app underneath still has nothing to show.
  const done = windowLoaded && catalogReady;

  return (
    <div className={`loader${done ? ' hide' : ''}`} aria-hidden={done}>
      <div className="loader-mark">
        <div className="loader-mark-inner">
          <img src="/images/logo/noirsaint-monogram.svg" alt="" />
          <i />
        </div>
      </div>
      <div className="loader-wordmark">NOIRSAINT</div>
      <small>CRAFTED WITHOUT LIMITS.</small>
      <div className="loader-bar">
        <div className="loader-bar-fill" />
      </div>
    </div>
  );
}

/* ── Logo ──────────────────────────────────────────────────────── */
function Logo() {
  const [rotating, setRotating] = useState(false);
  const handleClick = () => {
    setRotating(false);
    requestAnimationFrame(() => setRotating(true));
  };

  return (
    <a className={`logo${rotating ? ' logo-rotating' : ''}`} href="#home" onClick={handleClick}>
      <span className="logo-mark">
        <img src="/images/logo/noirsaint-monogram.svg" alt="NOIRSAINT monogram" />
      </span>
      <span>NOIRSAINT</span>
    </a>
  );
}

/* ── Navbar ────────────────────────────────────────────────────── */
const NAV_LINKS = [
  ['NEW ARRIVALS', '#shop?new=1'],
  ['SHOP',         '#shop'],
  ['COLLECTIONS',  '#collections'],
  ['LOOKBOOK',     '#lookbook'],
  ['ABOUT',        '#about'],
  ['ACCOUNT',      '#account'],
];

function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();

  return (
    <header className={`nav${scrolled ? ' nav-scrolled' : ''}`}>
      <Logo />
      <nav className={open ? 'mobile-open' : ''} role="navigation" aria-label="Main">
        {NAV_LINKS.map(([label, href]) => (
          <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
      </nav>
      <div className="nav-actions">
        <button onClick={() => go('#search')} aria-label="Search">
          <Search size={18} />
        </button>
        <button onClick={() => go('#cart')} aria-label={`Cart, ${count} item${count !== 1 ? 's' : ''}`}>
          <ShoppingBag size={18} />
          <i aria-hidden="true">{count}</i>
        </button>
        <button
          className="menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

/* ── Footer ────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Logo />
        <p>CRAFTED WITHOUT LIMITS.</p>
      </div>
      <div className="footer-links">
        <div>
          <b>SHOP</b>
          <a href="#shop">New Arrivals</a>
          <a href="#shop">Clothing</a>
          <a href="#shop">Accessories</a>
          <a href="#collections">Collections</a>
        </div>
        <div>
          <b>WORLD</b>
          <a href="#about">About</a>
          <a href="#lookbook">Lookbook</a>
          <a href="#contact">Contact</a>
          <a href="#faq">FAQ</a>
        </div>
        <div>
          <b>CARE</b>
          <a href="#shipping">Shipping</a>
          <a href="#returns">Returns</a>
          <a href="#size-guide">Size Guide</a>
          <a href="#privacy">Privacy</a>
        </div>
      </div>
      <div className="copyright">© 2026 NOIRSAINT. ALL RIGHTS RESERVED.</div>
    </footer>
  );
}

/* ── Product Card ──────────────────────────────────────────────── */
function ProductCard({ p }) {
  const [liked, setLiked] = useState(() => getWishlist().includes(p.id));
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const f = () => setLiked(getWishlist().includes(p.id));
    addEventListener('wishlistchange', f);
    return () => removeEventListener('wishlistchange', f);
  }, [p.id]);

  const handleWishlist = () => {
    toggleWishlist(p.id);
    if (!liked) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 560);
    }
  };

  const availableSizes = p.variants
    .filter(v => v.stock > 0)
    .map(v => v.size)
    .filter((s, i, a) => a.indexOf(s) === i);

  return (
    <article className="product">
      <button className="product-img" onClick={() => go(`#product/${p.slug}`)}>
        <img src={p.images[0]} alt={p.name} loading="lazy" />
        {p.newArrival  && <span className="badge">NEW</span>}
        {p.bestseller  && <span className="badge right">BESTSELLER</span>}
        <span className="quick">QUICK VIEW</span>
      </button>
      <div className="product-meta">
        <div>
          <small>{p.category}</small>
          <h3>{p.name}</h3>
          <span className="sizes">
            {availableSizes.length ? availableSizes.join(' · ') : 'SOLD OUT'}
          </span>
        </div>
        <strong>{money(p.salePrice || p.price)}</strong>
      </div>
      <button
        className={`card-wish${liked ? ' active' : ''}${justAdded ? ' just-added' : ''}`}
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={liked}
        onClick={handleWishlist}
      >
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

/* ── Home ──────────────────────────────────────────────────────── */
function Home() {
  const ps = getProducts();
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">NOIRSAINT / 2026</p>
            <h1>CRAFTED<br /><em>WITHOUT</em><br />LIMITS.</h1>
            <p className="lead">
              Dark luxury. Contemporary form.<br />
              Crafted for those who refuse limits.
            </p>
            <div className="actions">
              <a className="btn primary" href="#shop">
                SHOP NOW <ArrowRight size={16} />
              </a>
              <a className="btn" href="#collections">
                EXPLORE COLLECTION
              </a>
            </div>
          </div>
          <ParallaxLogo />
        </section>

        <section className="manifesto" data-reveal>
          <p className="eyebrow">THE NOIRSAINT WORLD</p>
          <h2>A PRIVATE FASHION HOUSE<br />FOR <em>INDIVIDUALITY.</em></h2>
          <p>
            Gothic craftsmanship meets contemporary streetwear,
            metalwork and high-end editorial fashion.
          </p>
        </section>

        <section id="shop" className="section" data-reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">01 / FEATURED</p>
              <h2>THE COLLECTION</h2>
            </div>
            <a href="#shop">VIEW ALL <ArrowRight size={15} /></a>
          </div>
          <div className="grid">
            {ps.filter(p => p.featured).slice(0, 4).map(p => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        </section>

        <section id="collections" className="editorial">
          <div className="editorial-image">
            <img src="/images/collections/unisex-collection.png" alt="NOIRSAINT collection" />
          </div>
          <div className="editorial-copy">
            <p className="eyebrow">02 / FORGED</p>
            <h2>CRAFTED FOR THOSE WHO <em>REFUSE LIMITS.</em></h2>
            <p>
              Every piece is a statement of self-expression,
              precision and timeless design.
            </p>
            <a className="btn" href="#shop">
              DISCOVER THE COLLECTION <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <section className="section" data-reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">03 / NEW ARRIVALS</p>
              <h2>RECENTLY FORGED</h2>
            </div>
          </div>
          <div className="grid">
            {ps.filter(p => p.newArrival).slice(0, 4).map(p => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        </section>

        <section id="lookbook" className="lookbook" data-reveal>
          <div>
            <p className="eyebrow">04 / LOOKBOOK</p>
            <h2>NOIR /<br /><em>ARCHIVE.</em></h2>
            <a className="btn primary" href="#about">
              ENTER THE WORLD <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <section className="newsletter" data-reveal>
          <p className="eyebrow">JOIN THE WORLD</p>
          <h2>ENTER THE NOIRSAINT WORLD.</h2>
          <div>
            <input placeholder="YOUR EMAIL ADDRESS" type="email" aria-label="Email address" />
            <button>SUBSCRIBE <ArrowRight size={15} /></button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ── Shop ──────────────────────────────────────────────────────── */
function Shop() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const [filter, setFilter] = useState(params.get('new') ? 'New Arrivals' : 'All');
  const [sort, setSort]     = useState('Featured');
  const [search, setSearch] = useState('');
  const [size, setSize]     = useState('All');
  const [price, setPrice]   = useState(500);
  const [mobile, setMobile] = useState(false);
  const ps = getProducts();

  let list = ps
    .filter(p => p.status === 'published')
    .filter(p =>
      filter === 'All' ? true :
      filter === 'New Arrivals' ? p.newArrival :
      p.category === filter
    )
    .filter(p => !size || size === 'All' || p.variants.some(v => v.size === size && v.stock > 0))
    .filter(p => !search || `${p.name} ${p.sku} ${p.category} ${p.collection} ${(p.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .filter(p => (p.salePrice || p.price) <= price);

  if (sort === 'Price: Low to High') list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  if (sort === 'Price: High to Low') list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  if (sort === 'Name: A to Z') list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'Newest') list = [...list].reverse();

  return (
    <main className="shop-page">
      <div className="shop-head">
        <div>
          <p className="eyebrow">NOIRSAINT / SHOP</p>
          <h1>THE CATALOG.</h1>
          <p>{list.length} pieces</p>
        </div>
        <button className="filter-toggle" onClick={() => setMobile(v => !v)}>
          FILTERS <ChevronDown size={15} />
        </button>
      </div>
      <div className={`shop-layout${mobile ? ' filters-open' : ''}`}>
        <aside className="filters">
          <div className="filter-block">
            <b>CATEGORY</b>
            {['All', 'New Arrivals', ...categories].map(c => (
              <button
                key={c}
                className={filter === c ? 'active' : ''}
                onClick={() => setFilter(c)}
              >{c}</button>
            ))}
          </div>
          <div className="filter-block">
            <b>SIZE</b>
            <div className="chips">
              {['All','XS','S','M','L','XL','XXL','38','39','40','41','42'].map(s => (
                <button key={s} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <b>PRICE</b>
            <input
              type="range" min="50" max="500"
              value={price} onChange={e => setPrice(e.target.value)}
              aria-label="Maximum price"
            />
            <small>Up to {money(price)}</small>
          </div>
        </aside>
        <section className="shop-results" aria-label="Products">
          <div className="toolbar">
            <div className="search-box">
              <Search size={15} aria-hidden="true" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH PRODUCTS"
                aria-label="Search products"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort products"
            >
              {['Featured','Newest','Name: A to Z','Price: Low to High','Price: High to Low'].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="grid">
            {list.map(p => <ProductCard p={p} key={p.id} />)}
          </div>
          {!list.length && (
            <div className="empty">
              <h3>NO PIECES FOUND.</h3>
              <p>Try another category, search term, or price range.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ── Size Guide Modal ──────────────────────────────────────────── */
function sizeChartForProduct(product) {
  const c = (product?.category || '').toLowerCase();
  const t = (product?.variantType || '').toLowerCase();
  if (t === 'shoes' || c === 'footwear' || c === 'shoes') return '/images/size-chart/shoe-size-chart.svg';
  if (t === 'rings') return '/images/size-chart/ring-size-chart.svg';
  if (c === 'tops')      return '/images/size-chart/tops-size-chart.svg';
  if (c === 'outerwear') return '/images/size-chart/outerwear-size-chart.svg';
  if (c === 'bottoms')   return '/images/size-chart/bottoms-size-chart.svg';
  if (c === 'dresses')   return '/images/size-chart/dress-size-chart.svg';
  return '/images/size-chart/clothing-size-chart.svg';
}

function SizeGuide({ close, product }) {
  const src = sizeChartForProduct(product);
  // Close on Escape
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [close]);

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true" aria-label="Size guide">
      <div className="modal size-guide-modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={close} aria-label="Close size guide"><X /></button>
        <p className="eyebrow">NOIRSAINT / GUIDE</p>
        <h2>SIZE GUIDE</h2>
        <p>Measurements are a guide only. Compare against a garment you already own for the closest fit.</p>
        <img className="size-chart-image" src={src} alt={`${product?.category || 'Clothing'} size chart`} />
        <div className="measure-notes">
          <b>HOW TO MEASURE</b>
          <p>Measure the body or a comparable garment flat, without pulling the fabric. Keep the tape level and relaxed.</p>
          <b>FIT</b>
          <p>Silhouettes vary by product. Refer to the product description for fit notes where provided.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Product Page ──────────────────────────────────────────────── */
function ProductPage({ slug }) {
  const p = getProducts().find(x => x.slug === slug) || getProductBySlug(slug);
  const [selectedImg, setSelectedImg] = useState(0);
  const [variant, setVariant] = useState(() => p?.variants.find(v => v.stock > 0));
  const [qty, setQty]         = useState(1);
  const [guide, setGuide]     = useState(false);
  const [notice, setNotice]   = useState('');
  const { add, items } = useCart();
  const closeGuide = useCallback(() => setGuide(false), []);

  if (!p) return <NotFound />;

  const addCart = () => {
    if (!variant) return;
    const inBag = items.find(i => i.variantId === variant.id)?.quantity || 0;
    if (inBag + qty > variant.stock) {
      setNotice(`ONLY ${variant.stock - inBag} AVAILABLE IN THIS SIZE`);
      return;
    }
    add(p, variant, qty);
    setNotice('ADDED TO BAG');
    setTimeout(() => setNotice(''), 2000);
  };

  return (
    <main className="product-page">
      <div className="breadcrumbs">
        <a href="#shop">SHOP</a>
        <span>/</span>
        {p.category}
        <span>/</span>
        {p.name}
      </div>
      <div className="product-detail">
        {/* Gallery */}
        <div className="gallery">
          <div className="gallery-main">
            <img src={p.images[selectedImg] || p.images[0]} alt={p.name} />
            {p.newArrival && <span className="badge">NEW ARRIVAL</span>}
          </div>
          {p.images.length > 1 && (
            <div className="gallery-thumbs">
              {p.images.map((img, i) => (
                <button
                  key={i}
                  className={selectedImg === i ? 'selected' : ''}
                  onClick={() => setSelectedImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {p.images.length === 1 && (
            <div className="gallery-thumbs">
              <button className="selected"><img src={p.images[0]} alt="" /></button>
            </div>
          )}
        </div>

        {/* Detail copy */}
        <div className="detail-copy">
          <p className="eyebrow">{p.collection} / {p.category}</p>
          <h1>{p.name}</h1>
          <div className="price">
            {money(p.salePrice || p.price)}
            {p.salePrice && <del>{money(p.price)}</del>}
          </div>
          <p className="description">{p.description}</p>
          <div className="detail-line">
            <span>COLOR</span>
            <b>{variant?.color || p.color}</b>
          </div>
          <div className="size-row">
            <div>
              <span>SELECT SIZE</span>
              <button onClick={() => setGuide(true)}>SIZE GUIDE</button>
            </div>
            <div className="size-options">
              {p.variants.map(v => (
                <button
                  key={v.id}
                  disabled={!v.stock}
                  className={variant?.id === v.id ? 'selected' : ''}
                  onClick={() => { setVariant(v); setQty(1); }}
                  aria-pressed={variant?.id === v.id}
                >
                  {v.size}
                  {!v.stock && <small>SOLD OUT</small>}
                </button>
              ))}
            </div>
          </div>
          <div className="qty">
            <span>QUANTITY</span>
            <div>
              <button disabled={qty <= 1} onClick={() => setQty(qty - 1)} aria-label="Decrease quantity">
                <Minus size={14} />
              </button>
              <b>{qty}</b>
              <button
                disabled={!variant || qty >= variant.stock}
                onClick={() => setQty(qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="product-actions">
            <button className="add-btn" disabled={!variant} onClick={addCart}>
              {variant
                ? `ADD TO BAG — ${money((variant.price || p.price) * qty)}`
                : 'SOLD OUT'
              }
              <ShoppingBag size={17} />
            </button>
            <button
              className={`wishlist-btn${getWishlist().includes(p.id) ? ' active' : ''}`}
              onClick={() => toggleWishlist(p.id)}
              aria-label="Toggle wishlist"
            >
              <Heart size={17} />
            </button>
          </div>
          {notice && <div className="notice">{notice}</div>}

          <div className="accordions">
            <details open>
              <summary>PRODUCT DETAILS <ChevronDown size={15} /></summary>
              <p>
                Material: {p.material}<br />
                Fit: {p.fit}<br />
                Style: {p.style}<br />
                Origin: {p.origin}<br />
                Care: {p.care}
              </p>
            </details>
            <details>
              <summary>SHIPPING & RETURNS <ChevronDown size={15} /></summary>
              <p>Orders are prepared with care. Returns are accepted on eligible unworn pieces according to the store policy.</p>
            </details>
            <details>
              <summary>SKU <ChevronDown size={15} /></summary>
              <p>{variant?.sku || p.sku}</p>
            </details>
          </div>
        </div>
      </div>
      {guide && <SizeGuide close={closeGuide} product={p} />}
    </main>
  );
}

/* ── Cart ──────────────────────────────────────────────────────── */
function Cart() {
  const { items, update, remove, subtotal, stockFor } = useCart();
  return (
    <main className="cart-page">
      <p className="eyebrow">NOIRSAINT / BAG</p>
      <h1>YOUR BAG.</h1>
      {!items.length
        ? (
          <div className="empty">
            <ShoppingBag size={28} />
            <h3>YOUR BAG IS EMPTY.</h3>
            <a className="btn primary" href="#shop">CONTINUE SHOPPING</a>
          </div>
        )
        : (
          <>
            <div className="cart-list">
              {items.map(i => (
                <div className="cart-item" key={i.key}>
                  <img src={i.image || '/images/products/signature-tee-front.png'} alt={i.name} />
                  <div className="cart-info">
                    <p className="eyebrow">{i.color}</p>
                    <h3>{i.name}</h3>
                    <p>Size {i.size} · {i.sku}</p>
                    <div className="cart-qty">
                      <button onClick={() => update(i.key, i.quantity - 1)} aria-label="Decrease">−</button>
                      <b>{i.quantity}</b>
                      <button disabled={i.quantity >= stockFor(i)} onClick={() => update(i.key, i.quantity + 1)} aria-label="Increase">+</button>
                    </div>
                  </div>
                  <strong>{money(i.price * i.quantity)}</strong>
                  <button onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <span>SUBTOTAL</span>
              <strong>{money(subtotal)}</strong>
              <a className="btn primary" href="#checkout">CHECKOUT <ArrowRight size={15} /></a>
              <p>Taxes and shipping are calculated at checkout.</p>
            </div>
          </>
        )
      }
    </main>
  );
}

/* ── Checkout ──────────────────────────────────────────────────── */
function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    city: 'Cebu City', province: 'Cebu', payment: 'Cash on Delivery',
  });
  const [error, setError] = useState('');

  if (!items.length) return (
    <main className="checkout">
      <div className="empty">
        <h2>YOUR BAG IS EMPTY.</h2>
        <a className="btn" href="#shop">SHOP</a>
      </div>
    </main>
  );

  const [submitting, setSubmitting] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await createOrder({ customer: form, items, total: subtotal });
      clear();
      go(`#order/${order.id}`);
    } catch (err) {
      setError(err.message || 'ORDER COULD NOT BE COMPLETED.');
    } finally { setSubmitting(false); }
  };

  return (
    <main className="checkout">
      <div className="checkout-head">
        <p className="eyebrow">NOIRSAINT / CHECKOUT</p>
        <h1>COMPLETE YOUR ORDER.</h1>
      </div>
      <div className="checkout-grid">
        <form onSubmit={submit}>
          <label>FULL NAME<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>EMAIL<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>PHONE<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>ADDRESS<input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <div className="two">
            <label>CITY<input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
            <label>PROVINCE<input required value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></label>
          </div>
          <label>PAYMENT
            <select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })}>
              <option>Cash on Delivery</option>
              <option>GCash</option>
              <option>Bank Transfer</option>
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <button className="add-btn" type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'PROCESSING...' : <>PLACE ORDER <ArrowRight size={16} /></>}
          </button>
        </form>
        <aside className="order-summary">
          <p className="eyebrow">ORDER SUMMARY</p>
          {items.map(i => (
            <div className="summary-item" key={i.key}>
              <img src={i.image || '/images/products/signature-tee-front.png'} alt={i.name} />
              <div>
                <b>{i.name}</b>
                <span>{i.size} · Qty {i.quantity}</span>
              </div>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>TOTAL</span>
            <strong>{money(subtotal)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ── Order Confirmation ────────────────────────────────────────── */
function OrderConfirmation({ id }) {
  const [o, setOrder] = useState(null);
  useEffect(() => {
    let active = true;
    getOrders().then(orders => { if (active) setOrder(orders.find(x => x.id === id) || getCachedOrder(id)); });
    return () => { active = false; };
  }, [id]);
  return (
    <main className="confirmation">
      <Package size={35} />
      <p className="eyebrow">ORDER CONFIRMED</p>
      <h1>THANK YOU.</h1>
      {o
        ? (
          <>
            <p>Your order <strong>{o.id}</strong> has been received and is currently <strong>{o.status}</strong>.</p>
            <div className="confirmation-card">
              {o.items.map(i => (
                <div key={i.key}>
                  <span>{i.name} · {i.size} × {i.quantity}</span>
                  <strong>{money(i.price * i.quantity)}</strong>
                </div>
              ))}
              <hr />
              <div><span>TOTAL</span><strong>{money(o.total)}</strong></div>
            </div>
          </>
        )
        : <p>Order details are no longer available in this browser.</p>
      }
      <a className="btn primary" href="#shop">CONTINUE SHOPPING</a>
    </main>
  );
}

/* ── Admin ─────────────────────────────────────────────────────── */
function AdminNav({ collapsed, onToggle }) {
  const currentRoute = useRoute();
  const isActive = route => currentRoute === route;
  return (
    <aside className="admin-nav">
      <div className="admin-brand"><Logo /><span>ADMIN PANEL</span></div>
      <div className="admin-control-row"><button className="admin-nav-toggle" type="button" onClick={onToggle} aria-label={collapsed ? 'Open admin sidebar' : 'Collapse admin sidebar'}>{collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}</button><p className="eyebrow">CONTROL / 2026</p></div>
      <nav aria-label="Admin navigation">
        <a className={isActive('#admin') ? 'active' : ''} href="#admin"><Box size={15} /><span>Overview</span></a>
        <a className={isActive('#admin/orders') ? 'active' : ''} href="#admin/orders"><ShoppingBag size={15} /><span>Orders</span></a>
        <a className={isActive('#admin/products') ? 'active' : ''} href="#admin/products"><Package size={15} /><span>Products</span></a>
        <a className={isActive('#admin/inventory') ? 'active' : ''} href="#admin/inventory"><AlertTriangle size={15} /><span>Inventory</span></a>
        <a className={isActive('#admin/customers') ? 'active' : ''} href="#admin/customers"><Users size={15} /><span>Customers</span></a>
        <a className={isActive('#admin/analytics') ? 'active' : ''} href="#admin/analytics"><TrendingUp size={15} /><span>Analytics</span></a>
        <a className={isActive('#admin/settings') ? 'active' : ''} href="#admin/settings"><Edit3 size={15} /><span>Settings</span></a>
        <a className={isActive('#admin/profile') ? 'active' : ''} href="#admin/profile"><Eye size={15} /><span>Profile</span></a>
      </nav>
      <a className="admin-store-link" href="#shop">View Live Store <Eye size={14} /></a>
    </aside>
  );
}
function AdminLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <main className={`admin${collapsed ? ' admin-collapsed' : ''}`}>
      <AdminNav collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
      {collapsed && <button className="admin-reopen" type="button" onClick={() => setCollapsed(false)} aria-label="Open admin sidebar"><Menu size={18} /></button>}
      <section className="admin-main">
        <header className="admin-header">
          <div className="admin-header-brand"><strong>NOIRSAINT</strong><span>ADMIN PANEL</span></div>
          <div className="admin-header-actions">
            <div className="admin-global-search"><Search size={15} /><input aria-label="Global admin search" placeholder="SEARCH PRODUCTS / ORDERS" /></div>
            <a href="#shop">LIVE STOREFRONT <Eye size={14} /></a>
            <a href="#admin/profile">ADMIN PROFILE</a>
          </div>
        </header>
        <div className="admin-top">
          <div>
            <p className="eyebrow">NOIRSAINT / ADMIN</p>
            <h1>{title}</h1>
            {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}
function AdminOverview() {
  const [ps, setPs] = useState(getProducts());
  const [orders, setOrders] = useState([]);
  const [rows, setRows] = useState(inventoryRows());
  useEffect(() => {
    let active = true;
    Promise.all([loadProducts({admin:true}), getOrders({admin:true})]).then(([products, loadedOrders]) => {
      if (!active) return;
      setPs(products); setRows(inventoryRows()); setOrders(loadedOrders);
    });
    return () => { active = false; };
  }, []);
  const low  = rows.filter(v => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD).length;
  const revenue = orders.reduce((n, order) => n + Number(order.total || 0), 0);
  const pending = orders.filter(order => ['Pending', 'Processing'].includes(order.status)).length;
  const customers = new Set([
    ...orders.map(order => order.customer?.email).filter(Boolean),
    ...getUsers().map(user => user.email).filter(Boolean),
  ]).size;
  return (
    <AdminLayout title="OVERVIEW">
      <section className="admin-welcome">
        <div><p className="eyebrow">STORE STATUS / LIVE</p><p>Operations summary for NOIRSAINT.</p></div>
        <time>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
      </section>
      <div className="admin-kpis">
        <Stat icon={TrendingUp} label="TOTAL REVENUE" value={money(revenue)} sub={`${orders.length} completed order${orders.length === 1 ? '' : 's'}`} />
        <Stat icon={ShoppingBag} label="TOTAL ORDERS" value={orders.length} sub={`${pending} pending processing`} />
        <Stat icon={Box} label="ACTIVE PRODUCTS" value={ps.filter(p => p.status === 'published').length} sub={<span className="stat-alert">{low} low stock alert{low === 1 ? '' : 's'}</span>} />
        <Stat icon={Users} label="CUSTOMERS" value={customers} sub="Registered shoppers" />
      </div>
      <div className="admin-overview-grid">
        <section className="panel admin-recent-orders">
          <div className="panel-head"><h3>RECENT ORDERS</h3><a href="#admin/orders">VIEW ALL</a></div>
          <div className="admin-order-table">
            <div className="admin-order-row admin-order-heading"><span>ORDER</span><span>CUSTOMER</span><span>ITEMS</span><span>TOTAL</span><span>STATUS</span></div>
            {orders.slice(0, 6).map(order => <div className="admin-order-row" key={order.id}><b>{order.id}</b><span>{order.customer?.name || 'Guest'}</span><span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span><strong>{money(order.total)}</strong><span className="status">{order.status}</span></div>)}
            {!orders.length && <div className="admin-empty"><Package size={20} /><p>No orders yet.</p><a href="#admin/orders">VIEW ALL ORDERS <ArrowRight size={13} /></a></div>}
          </div>
        </section>
        <section className="panel admin-activity">
          <div className="panel-head"><h3>INVENTORY STATUS</h3><a href="#admin/inventory">MANAGE</a></div>
          {rows.filter(v => v.stock <= LOW_STOCK_THRESHOLD).slice(0, 6).map(v => <div className="stock-line admin-stock-line" key={v.id}><div><b>{v.productName}</b><span>{v.size} · {v.sku}</span></div><strong className={`stock-pill ${v.stock === 0 ? 'danger' : 'warning'}`}>{v.stock === 0 ? 'SOLD OUT' : `${v.stock} LEFT`}</strong><a href="#admin/inventory">MANAGE</a></div>)}
          {!rows.some(v => v.stock <= LOW_STOCK_THRESHOLD) && <p className="muted">Inventory is healthy.</p>}
        </section>
      </div>
    </AdminLayout>
  );
}
function AdminProducts() {
  const [ps, setPs] = useState(getProducts());
  const [query, setQuery] = useState('');
  const list = ps.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const del = async id => {
    if (!confirm('Delete this product?')) return;
    try { const n = ps.filter(p => p.id !== id); await saveProducts(n); setPs(n); }
    catch (error) { alert(error.message || 'PRODUCT COULD NOT BE DELETED.'); }
  };
  return (
    <AdminLayout title="PRODUCTS">
      <div className="admin-actions">
        <div className="search-box">
          <Search size={15} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="SEARCH PRODUCTS" />
        </div>
        <a className="btn primary" href="#admin/products/new">ADD PRODUCT <Plus size={15} /></a>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th>
              <th>VARIANTS</th><th>STOCK</th><th>STATUS</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="table-product">
                    <img src={p.images[0]} alt="" />
                    <b>{p.name}</b>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>{money(p.salePrice || p.price)}</td>
                <td>{p.variants.length}</td>
                <td>{p.variants.reduce((n, v) => n + v.stock, 0)}</td>
                <td><span className="status">{p.status}</span></td>
                <td className="row-actions">
                  <a href={`#admin/products/edit/${p.id}`}><Edit3 size={15} /></a>
                  <button onClick={() => del(p.id)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
function ProductForm({ id }) {
  const existing = id ? getProducts().find(p => p.id === id) : null;
  const [form, setForm] = useState(() => existing || {
    id: `p${Date.now()}`, name: '', category: 'Tops', collection: 'Essentials',
    price: 0, salePrice: '', description: '', color: 'Black',
    images: ['/images/products/signature-tee-front.png'],
    status: 'published', featured: false, newArrival: false, bestseller: false,
    material: 'Premium cotton blend', fit: 'Regular',
    variants: [{ id: `v${Date.now()}`, sku: '', size: 'S', color: 'Black', price: 0, stock: 0, status: 'active' }],
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const save = async () => {
    const ps = getProducts();
    const skuList = form.variants.map(v => String(v.sku || '').trim().toUpperCase());
    const duplicateSku = skuList.some((sku, index) => sku && skuList.indexOf(sku) !== index);
    const existingSku = ps.some(p => p.id !== form.id && p.variants.some(v => skuList.includes(String(v.sku || '').trim().toUpperCase())));
    const invalidVariant = form.variants.some(v => !String(v.size || '').trim() || !String(v.sku || '').trim() || Number(v.price) <= 0 || Number(v.stock) < 0);
    if (!form.name.trim() || Number(form.price) <= 0 || !form.variants.length)
      return alert('Product name, a positive price, and at least one variant are required.');
    if (duplicateSku || existingSku) return alert('Every variant must have a unique SKU.');
    if (invalidVariant) return alert('Each variant needs a size, SKU, positive price, and non-negative stock.');
    const next = existing ? ps.map(p => p.id === id ? form : p) : [form, ...ps];
    try { await saveProducts(next); go('#admin/products'); }
    catch (error) { alert(error.message || 'PRODUCT COULD NOT BE SAVED.'); }
  };
  const addVariant = () => set('variants', [
    ...form.variants,
    { id: `v${Date.now()}`, sku: `${form.sku || 'NS'}-${form.variants.length + 1}`, size: 'M', color: form.color || 'Black', price: Number(form.price) || 0, stock: 0, status: 'active' },
  ]);
  const updateV = (vid, k, v) => set('variants', form.variants.map(x =>
    x.id === vid ? { ...x, [k]: (k === 'stock' || k === 'price') ? Number(v) : v } : x
  ));
  return (
    <AdminLayout title={existing ? 'EDIT PRODUCT' : 'ADD PRODUCT'}>
      <div className="form-panel">
        <div className="form-section">
          <p className="eyebrow">PRODUCT INFORMATION</p>
          <div className="form-grid">
            <label>PRODUCT NAME<input value={form.name} onChange={e => set('name', e.target.value)} /></label>
            <label>CATEGORY
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>COLLECTION<input value={form.collection} onChange={e => set('collection', e.target.value)} /></label>
            <label>BASE PRICE<input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} /></label>
            <label>SALE PRICE<input type="number" value={form.salePrice || ''} onChange={e => set('salePrice', e.target.value ? Number(e.target.value) : null)} /></label>
            <label>COLOR<input value={form.color} onChange={e => set('color', e.target.value)} /></label>
            <label className="wide">DESCRIPTION<textarea value={form.description} onChange={e => set('description', e.target.value)} /></label>
          </div>
        </div>
        <div className="form-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">PRODUCT OPTIONS</p>
              <h3>VARIANTS & INVENTORY</h3>
            </div>
            <button className="btn" onClick={addVariant}>ADD VARIANT <Plus size={14} /></button>
          </div>
          <div className="variant-editor">
            {form.variants.map(v => (
              <div className="variant-row" key={v.id}>
                <input placeholder="SIZE"  value={v.size}  onChange={e => updateV(v.id, 'size',  e.target.value)} />
                <input placeholder="SKU"   value={v.sku}   onChange={e => updateV(v.id, 'sku',   e.target.value)} />
                <input placeholder="COLOR" value={v.color} onChange={e => updateV(v.id, 'color', e.target.value)} />
                <input type="number" placeholder="PRICE" value={v.price} onChange={e => updateV(v.id, 'price', e.target.value)} />
                <input type="number" placeholder="STOCK" value={v.stock} onChange={e => updateV(v.id, 'stock', e.target.value)} />
                <button onClick={() => set('variants', form.variants.filter(x => x.id !== v.id))}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="muted">
            Total stock: <b>{form.variants.reduce((n, v) => n + Number(v.stock || 0), 0)}</b>.
          </p>
        </div>
        <div className="form-section flags">
          <label><input type="checkbox" checked={form.featured}   onChange={e => set('featured',   e.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={form.newArrival} onChange={e => set('newArrival', e.target.checked)} /> New arrival</label>
          <label><input type="checkbox" checked={form.bestseller} onChange={e => set('bestseller', e.target.checked)} /> Bestseller</label>
        </div>
        <div className="form-footer">
          <a className="btn" href="#admin/products">CANCEL</a>
          <button className="btn primary" onClick={save}>SAVE PRODUCT <ArrowRight size={15} /></button>
        </div>
      </div>
    </AdminLayout>
  );
}
function AdminInventory() {
  const [rows, setRows] = useState(inventoryRows());
  const [query, setQuery] = useState('');
  const refresh = () => setRows(inventoryRows());
  const filtered = rows.filter(v =>
    `${v.productName} ${v.sku} ${v.size}`.toLowerCase().includes(query.toLowerCase())
  );
  const exportCsv = () => {
    const csv = ['Product,Size,SKU,Stock,Status', ...rows.map(v =>
      `"${v.productName}","${v.size}","${v.sku}",${v.stock},${v.stock ? 'Available' : 'Out of stock'}`
    )].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'noirsaint-inventory.csv';
    a.click();
  };
  return (
    <AdminLayout title="INVENTORY">
      <div className="stats">
        <Stat icon={Box}           label="TOTAL PRODUCTS" value={new Set(rows.map(r => r.productId)).size} />
        <Stat icon={Package}       label="TOTAL UNITS"    value={rows.reduce((n, v) => n + v.stock, 0)} />
        <Stat icon={AlertTriangle} label="LOW STOCK"      value={rows.filter(v => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD).length} />
        <Stat icon={X}             label="OUT OF STOCK"   value={rows.filter(v => v.stock === 0).length} />
      </div>
      <div className="admin-actions">
        <div className="search-box">
          <Search size={15} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="SEARCH PRODUCT / SKU / SIZE" />
        </div>
        <button className="btn" onClick={exportCsv}><Download size={14} /> EXPORT CSV</button>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr><th>PRODUCT</th><th>SIZE</th><th>SKU</th><th>STOCK</th><th>STATUS</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td>{v.productName}</td>
                <td>{v.size}</td>
                <td>{v.sku}</td>
                <td>
                  <input
                    className="stock-input" type="number" min="0" value={v.stock}
                    onChange={async e => {
                      try { await setVariantStock(v.productId, v.id, e.target.value); refresh(); }
                      catch (error) { alert(error.message || 'STOCK COULD NOT BE UPDATED.'); }
                    }}
                  />
                </td>
                <td>
                  {v.stock === 0
                    ? <span className="status danger">OUT OF STOCK</span>
                    : v.stock <= LOW_STOCK_THRESHOLD
                      ? <span className="status warning">LOW STOCK</span>
                      : <span className="status">IN STOCK</span>
                  }
                </td>
                <td>
                  <a href={`#product/${getProducts().find(p => p.id === v.productId)?.slug}`}>
                    <Eye size={15} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { getOrders({admin:true}).then(setOrders); }, []);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState([]);
  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const filtered = orders.filter(order => {
    const haystack = `${order.id} ${order.customer?.name || ''} ${order.customer?.email || ''}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (status === 'ALL' || order.status === status);
  });
  const changeStatus = async (id, nextStatus) => {
    try { const updated = await updateOrderStatus(id, nextStatus); if (updated) setOrders(await getOrders({admin:true})); }
    catch (error) { alert(error.message || 'ORDER STATUS COULD NOT BE UPDATED.'); }
  };
  const toggleOrder = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const markSelected = async nextStatus => {
    try { await Promise.all(selected.map(id => updateOrderStatus(id, nextStatus))); setOrders(await getOrders({admin:true})); setSelected([]); }
    catch (error) { alert(error.message || 'ORDERS COULD NOT BE UPDATED.'); }
  };
  return (
    <AdminLayout title="ORDERS">
      <div className="admin-actions">
        <div className="search-box"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="SEARCH ORDERS / CUSTOMERS" /></div>
        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter orders by status">
          <option value="ALL">ALL STATUSES</option>
          {statuses.map(value => <option key={value}>{value}</option>)}
        </select>
        {selected.length > 0 && <button className="btn" type="button" onClick={() => markSelected('Shipped')}>MARK SHIPPED ({selected.length})</button>}
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr><th></th><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th>DATE</th></tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOrder(o.id)} aria-label={`Select ${o.id}`} /></td><td><b>{o.id}</b></td>
                <td>{o.customer.name}<br /><small>{o.customer.email}</small></td>
                <td>{o.items.map(i => <div key={i.key}>{i.name} / {i.size} × {i.quantity}</div>)}</td>
                <td>{money(o.total)}</td>
                <td><select className="status-select" value={o.status} onChange={e => changeStatus(o.id, e.target.value)} aria-label={`Update status for ${o.id}`}>
                  {statuses.map(value => <option key={value}>{value}</option>)}
                </select></td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="empty">{orders.length ? 'No matching orders.' : 'No orders yet.'}</p>}
      </div>
    </AdminLayout>
  );
}
function AdminCustomers() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { getOrders({admin:true}).then(setOrders); }, []);
  const customers = [...new Map(orders.map(order => [order.customer?.email, order.customer])).values()].filter(Boolean);
  const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return (
    <AdminLayout title="CUSTOMERS">
      <div className="admin-kpis admin-customer-kpis"><Stat icon={Users} label="TOTAL CUSTOMERS" value={customers.length} /><Stat icon={ShoppingBag} label="AVERAGE ORDER" value={orders.length ? money(totalSpend / orders.length) : money(0)} /><Stat icon={TrendingUp} label="CUSTOMER LTV" value={customers.length ? money(totalSpend / customers.length) : money(0)} /></div>
      <div className="panel table-wrap">
        <table><thead><tr><th>CUSTOMER</th><th>EMAIL</th><th>ORDERS</th><th>SPEND</th><th>LAST ACTIVE</th></tr></thead><tbody>
          {customers.map(customer => { const customerOrders = orders.filter(order => order.customer?.email === customer.email); const last = customerOrders[0]; return <tr key={customer.email}><td><b>{customer.name}</b></td><td>{customer.email}</td><td>{customerOrders.length}</td><td>{money(customerOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))}</td><td>{last ? new Date(last.createdAt).toLocaleDateString() : '—'}</td></tr>; })}
        </tbody></table>
        {!customers.length && <p className="empty">No customers yet.</p>}
      </div>
    </AdminLayout>
  );
}
function AdminSettings() {
  return (
    <AdminLayout title="SETTINGS">
      <div className="admin-settings-grid">
        <section className="panel admin-settings-panel"><p className="eyebrow">PAYMENTS</p><h2>PAYMENT GATEWAYS</h2><p className="muted">Payment providers are ready for production credentials.</p><span className="status warning">NOT CONNECTED</span></section>
        <section className="panel admin-settings-panel"><p className="eyebrow">FULFILLMENT</p><h2>SHIPPING ZONES</h2><p className="muted">Configure delivery rates and service areas before launch.</p><button className="btn" type="button" onClick={() => alert('Shipping zone configuration will be connected to the store settings table.')}>MANAGE ZONES</button></section>
        <section className="panel admin-settings-panel"><p className="eyebrow">TAX</p><h2>TAX CALCULATIONS</h2><p className="muted">Taxes are currently calculated at checkout using the configured storefront rules.</p><span className="status">LOCAL RULES</span></section>
        <section className="panel admin-settings-panel"><p className="eyebrow">INTEGRATIONS</p><h2>API / WEBHOOKS</h2><p className="muted">Supabase authentication is configured through environment variables. Keep secret keys server-side.</p><a className="btn" href="#shop">RETURN TO STORE <Eye size={14} /></a></section>
      </div>
    </AdminLayout>
  );
}
function AdminProfile() {
  const session = getSession();
  const email = session?.email || 'admin@noirsaint.com';
  const signOut = () => supabase?.auth.signOut().then(() => { clearSession(); go('#login'); });
  return (
    <AdminLayout title="ADMIN PROFILE" subtitle="Manage administrator credentials, security preferences, and active sessions.">
      <div className="admin-profile-grid">
        <section className="panel admin-profile-card">
          <div className="admin-card-heading"><div><p className="eyebrow">IDENTITY / ACCESS</p><h2>ADMIN IDENTITY</h2></div><div className="admin-avatar">A</div></div>
          <div className="admin-profile-email"><span className="status-dot" /> <strong>{email}</strong><span className="status active-status">ACTIVE</span></div>
          <span className="status profile-role">SUPER ADMIN</span>
          <p className="profile-label">ACCESS SCOPE</p>
          <div className="permission-list"><span>FULL ACCESS</span><span>ORDER MANAGEMENT</span><span>INVENTORY CONTROL</span><span>SYSTEM CONFIG</span></div>
        </section>
        <section className="panel admin-profile-card">
          <div className="admin-card-heading"><div><p className="eyebrow">SECURITY / AUTH</p><h2>SECURITY</h2></div><ShieldCheck size={22} /></div>
          <div className="security-row"><LockKeyhole size={16} /><div><b>PASSWORD</b><span>Last updated 30 days ago</span></div><a href="#forgot-password">UPDATE</a></div>
          <div className="security-row"><CheckCircle2 size={16} /><div><b>TWO-FACTOR AUTHENTICATION</b><span>Enabled via Authenticator App</span></div><button type="button" onClick={() => alert('Two-factor settings will be connected to Supabase MFA.')}>CONFIGURE</button></div>
          <div className="security-row"><Monitor size={16} /><div><b>CURRENT SESSION</b><span>Supabase Auth · 192.168.x.x</span></div></div>
        </section>
        <section className="panel admin-profile-card admin-audit-card">
          <div className="admin-card-heading"><div><p className="eyebrow">SECURITY / AUDIT</p><h2>RECENT ADMIN ACTIVITY</h2></div></div>
          <div className="audit-row"><Monitor size={16} /><div><b>Logged in from Chrome on macOS</b><span>Current session · Oct 1, 2026</span></div><span className="status">CURRENT</span></div>
          <div className="audit-row"><Package size={16} /><div><b>Updated product SKU NS-001-BLA-XS</b><span>2 hours ago</span></div></div>
          <div className="admin-profile-actions"><button className="btn" type="button" onClick={() => alert('All other sessions will be revoked through Supabase Auth.')}>SIGN OUT OF ALL DEVICES</button><button className="btn danger-action" type="button" onClick={signOut}><LogOut size={14} /> SIGN OUT</button></div>
        </section>
      </div>
    </AdminLayout>
  );
}
function AdminAnalytics() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { getOrders({admin:true}).then(setOrders); }, []);
  const rows = orders.flatMap(o => o.items);
  const revenue = orders.reduce((n, o) => n + o.total, 0);
  const bySize = Object.entries(
    rows.reduce((a, i) => (a[i.size] = (a[i.size] || 0) + i.quantity, a), {})
  ).sort((a, b) => b[1] - a[1]);
  const byProduct = Object.entries(
    rows.reduce((a, i) => (a[i.name] = (a[i.name] || 0) + i.quantity, a), {})
  ).sort((a, b) => b[1] - a[1]);
  return (
    <AdminLayout title="ANALYTICS">
      <div className="stats">
        <Stat icon={TrendingUp}  label="REVENUE"   value={money(revenue)} />
        <Stat icon={ShoppingBag} label="ORDERS"    value={orders.length} />
        <Stat icon={Box}         label="UNITS SOLD" value={rows.reduce((n, i) => n + i.quantity, 0)} />
        <Stat icon={Users}       label="AVG ORDER"  value={orders.length ? money(revenue / orders.length) : money(0)} />
      </div>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-head"><h3>BEST-SELLING SIZES</h3></div>
          {bySize.map(([s, n]) => (
            <div className="bar-line" key={s}>
              <span>{s}</span>
              <div><i style={{ width: `${Math.max(8, n / (bySize[0]?.[1] || 1) * 100)}%` }} /></div>
              <b>{n}</b>
            </div>
          ))}
          {!bySize.length && <p className="muted">Sales data will appear after orders are placed.</p>}
        </section>
        <section className="panel">
          <div className="panel-head"><h3>BEST-SELLING PRODUCTS</h3></div>
          {byProduct.slice(0, 8).map(([s, n]) => (
            <div className="stock-line" key={s}>
              <b>{s}</b>
              <strong>{n} units</strong>
            </div>
          ))}
          {!byProduct.length && <p className="muted">No sales yet.</p>}
        </section>
      </div>
    </AdminLayout>
  );
}

/* ── Lookbook ──────────────────────────────────────────────────── */
function Lookbook() {
  return (
    <main className="lookbook-page">
      <section className="lookbook-hero" data-reveal>
        <div>
          <p className="eyebrow">NOIRSAINT / EDITORIAL 01</p>
          <h1>THE<br /><em>NOIR</em><br />ARCHIVE.</h1>
          <p>Campaign studies in silhouette, material and atmosphere.</p>
        </div>
      </section>
      <section className="lookbook-grid" data-reveal>
        <figure className="wide">
          <img loading="lazy" src="/images/lookbook/lookbook-city-night.png" alt="NOIRSAINT campaign in the city at night" />
          <figcaption>01 — AFTER DARK / CITY STUDY</figcaption>
        </figure>
        <figure>
          <img loading="lazy" src="/images/lookbook/atelier-craftsmanship.png" alt="NOIRSAINT atelier craftsmanship" />
          <figcaption>02 — MADE BY HAND</figcaption>
        </figure>
        <figure>
          <img loading="lazy" src="/images/lookbook/noirsaint-atelier.png" alt="NOIRSAINT atelier interior" />
          <figcaption>03 — THE ATELIER</figcaption>
        </figure>
        <figure className="wide">
          <img loading="lazy" src="/images/lookbook/campaign-group.png" alt="NOIRSAINT campaign group portrait" />
          <figcaption>04 — FORM / INDIVIDUALITY</figcaption>
        </figure>
      </section>
      <section className="lookbook-note" data-reveal>
        <p className="eyebrow">THE HOUSE</p>
        <h2>Darkness, <em>reduced to form.</em></h2>
        <a className="btn primary" href="#shop">SHOP THE EDIT <ArrowRight size={15} /></a>
      </section>
    </main>
  );
}

/* ── Collections ───────────────────────────────────────────────── */
function CollectionCard({ c }) {
  return (
    <a className="collection-card" href={`#collections/${c.slug}`}>
      <img loading="lazy" src={c.image} alt={c.title} />
      <div>
        <p className="eyebrow">COLLECTION</p>
        <h2>{c.title}</h2>
        <span>EXPLORE <ArrowRight size={14} /></span>
      </div>
    </a>
  );
}
function Collections() {
  return (
    <main className="collections-page">
      <header className="collections-intro">
        <p className="eyebrow">NOIRSAINT / COLLECTIONS</p>
        <h1>THE HOUSE<br /><em>IN CHAPTERS.</em></h1>
        <p>Distinct expressions of the NOIRSAINT wardrobe, united by proportion, material and restraint.</p>
      </header>
      <section className="collection-grid">
        {collections.map(c => <CollectionCard c={c} key={c.slug} />)}
      </section>
    </main>
  );
}
function CollectionPage({ slug }) {
  const c = getCollectionBySlug(slug);
  if (!c) return <NotFound />;
  const ps = getProducts().filter(p =>
    p.status === 'published' &&
    (slug === 'new-arrivals'
      ? p.newArrival
      : c.categories.includes(p.category) ||
        String(p.collection || '').toLowerCase() === slug.replace(/-/g, ' '))
  );
  return (
    <main className="collection-page">
      <section className="collection-banner">
        <img src={c.image} alt="" />
        <div>
          <p className="eyebrow">NOIRSAINT / COLLECTION</p>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">EDIT / {String(ps.length).padStart(2, '0')} PIECES</p>
            <h2>THE SELECTION</h2>
          </div>
          <a href="#collections">ALL COLLECTIONS <ArrowRight size={15} /></a>
        </div>
        {ps.length
          ? <div className="grid">{ps.map(p => <ProductCard p={p} key={p.id} />)}</div>
          : (
            <div className="empty">
              <h3>THE EDIT IS QUIET.</h3>
              <p>New pieces will appear here as the collection develops.</p>
            </div>
          )
        }
      </section>
    </main>
  );
}

/* ── Auth ──────────────────────────────────────────────────────── */
const AUTH_KEY  = 'noirsaint_session_v1';
const USERS_KEY = 'noirsaint_users_v1';
function getSession()            { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }  catch { return null; } }
function setSession(user)        { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
function clearSession()          { localStorage.removeItem(AUTH_KEY); }
function getUsers()              { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } }
function saveUsers(users)        { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function AccountNav({ active = 'overview' }) {
  const tabs = [['overview', 'OVERVIEW', '#account'], ['orders', 'ORDERS', '#account/orders'], ['wishlist', 'WISHLIST', '#account/wishlist'], ['addresses', 'ADDRESSES', '#account/addresses'], ['profile', 'PROFILE', '#account/profile'], ['settings', 'SETTINGS', '#account/settings']];
  return (
    <nav className="account-nav" aria-label="Account navigation">
      {tabs.map(([key, label, href]) => <a className={active === key ? 'active' : ''} href={href} key={key}>{label}</a>)}
    </nav>
  );
}

function AccountPage({ section = 'overview' }) {
  const [session, setCurrentSession] = useState(getSession());
  const [gateRotating, setGateRotating] = useState(false);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const applySession = user => {
      if (!active) return;
      if (!user) { clearSession(); setCurrentSession(null); return; }
      const next = { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email };
      setSession(next); setCurrentSession(next);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => applySession(authSession?.user || null));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  if (!session) return (
    <main className="account-gate">
      <div className="account-gate-copy">
        <p className="eyebrow">NOIRSAINT / WORLD</p>
        <h1>SIGN IN<br /><em>REQUIRED.</em></h1>
        <p className="account-gate-lead">
          Sign in to access your saved pieces, order history and private account space.
        </p>
        <div className="account-gate-actions">
          <a className="btn primary" href="#login">SIGN IN <ArrowRight size={15} /></a>
          <a className="text-link" href="#register">CREATE AN ACCOUNT <ArrowRight size={14} /></a>
        </div>
      </div>
      <button
        className={`account-gate-mark${gateRotating ? ' is-rotating' : ''}`}
        type="button"
        aria-label="Rotate NOIRSAINT mark"
        onClick={() => {
          setGateRotating(false);
          requestAnimationFrame(() => setGateRotating(true));
        }}
      >
        <span className="account-gate-orbit account-gate-orbit-one" />
        <span className="account-gate-orbit account-gate-orbit-two" />
        <img src="/images/logo/noirsaint-monogram.svg" alt="" />
        <span className="account-gate-index">NS / 01</span>
      </button>
    </main>
  );

  const [orders, setOrders] = useState([]);
  useEffect(() => {
    let active = true;
    getOrders({userId: session.id}).then(value => { if (active) setOrders(value); });
    return () => { active = false; };
  }, [session.id]);
  const { items } = useCart();

  if (section === 'orders') return (
    <main className="simple account-page">
      <AccountNav active="orders" />
      <p className="eyebrow">NOIRSAINT / ACCOUNT</p>
      <h1>YOUR ORDERS.</h1>
      {orders.length
        ? <div className="panel">{orders.map(o => (
          <div className="stock-line" key={o.id}>
            <div><b>{o.id}</b><span>{new Date(o.createdAt).toLocaleDateString()} · {o.status}</span></div>
            <strong>{money(o.total)}</strong>
          </div>
        ))}</div>
        : <div className="empty"><h3>NO ORDERS YET.</h3><a className="btn primary" href="#shop">SHOP THE COLLECTION</a></div>
      }
    </main>
  );

  if (section === 'wishlist') {
    const ids   = getWishlist();
    const saved = getProducts().filter(p => ids.includes(p.id));
    return (
      <main className="simple account-page">
        <AccountNav active="wishlist" />
        <p className="eyebrow">NOIRSAINT / ACCOUNT</p>
        <h1>WISHLIST.</h1>
        {saved.length
          ? <div className="grid">{saved.map(p => <ProductCard p={p} key={p.id} />)}</div>
          : <div className="empty"><h3>YOUR WISHLIST IS EMPTY.</h3><a className="btn primary" href="#shop">EXPLORE SHOP</a></div>
        }
      </main>
    );
  }

  if (section === 'addresses') return (
    <main className="simple account-page">
      <AccountNav active="addresses" />
      <p className="eyebrow">NOIRSAINT / ACCOUNT</p>
      <h1>ADDRESSES.</h1>
      <div className="panel">
        <p><b>DEFAULT SHIPPING ADDRESS</b></p>
        <p className="muted">{session.address || 'No saved address yet.'}</p>
        <p className="muted">Checkout currently accepts a fresh shipping address for each order.</p>
      </div>
    </main>
  );

  if (section === 'profile') return (
    <main className="simple account-page">
      <AccountNav active="profile" />
      <p className="eyebrow">NOIRSAINT / ACCOUNT</p>
      <h1>PROFILE.</h1>
      <div className="panel">
        <p><b>{session.name}</b></p>
        <p className="muted">{session.email}</p>
        <button className="btn" onClick={() => { clearSession(); go('#home'); }}>SIGN OUT</button>
      </div>
    </main>
  );

  if (section === 'settings') return (
    <main className="simple account-page">
      <AccountNav active="settings" />
      <p className="eyebrow">NOIRSAINT / ACCOUNT</p>
      <h1>SETTINGS.</h1>
      <div className="panel">
        <p>Account preferences are stored locally in this prototype. Production authentication and customer data should be connected to the backend before launch.</p>
        <button className="btn" onClick={() => { clearSession(); go('#home'); }}>SIGN OUT</button>
      </div>
    </main>
  );

  const welcomeName = session.name && !session.name.includes('@')
    ? session.name.split(' ')[0].toUpperCase()
    : 'CLIENT';
  const savedCount = getWishlist().length;
  const address = session.address || 'No default address saved';
  return (
    <main className="account-overview account-page">
      <header className="account-overview-head"><div><p className="eyebrow">NOIRSAINT / ACCOUNT</p><span className="member-badge">NOIRSAINT VIP / MEMBER</span><h1>WELCOME, {welcomeName}.</h1><p>Private access to your orders, saved pieces and account details.</p></div></header>
      <div className="account-metrics">
        <section className="account-metric"><ShoppingBag size={18} /><span>TOTAL ORDERS</span><strong>{orders.length}</strong><a href="#account/orders">VIEW HISTORY <ArrowRight size={13} /></a></section>
        <section className="account-metric"><Heart size={18} /><span>WISHLIST SAVED</span><strong>{savedCount}</strong><a href="#account/wishlist">EXPLORE WISHLIST <ArrowRight size={13} /></a></section>
        <section className="account-metric"><Package size={18} /><span>DEFAULT SHIPPING</span><strong>{address}</strong><a href="#account/addresses">MANAGE ADDRESS <ArrowRight size={13} /></a></section>
      </div>
      <div className="account-overview-grid">
        <section className="panel account-orders-panel">
          <div className="account-section-heading"><div><p className="eyebrow">PURCHASE HISTORY</p><h2>RECENT ORDERS</h2></div><a href="#account/orders">VIEW ALL <ArrowRight size={13} /></a></div>
          {orders.slice(0, 5).map(o => (
          <div className="account-order-row" key={o.id}>
            <div><b>{o.id}</b><span>{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)</span></div><strong>{money(o.total)}</strong><span className="status">{o.status}</span><a href={`#order/${o.id}`}>TRACK ORDER</a>
          </div>
        ))}
          {!orders.length && <div className="account-empty"><Package size={25} /><h3>NO RECENT PURCHASES FOUND.</h3><p>Your next NOIRSAINT piece is waiting.</p><a className="btn primary" href="#shop?new=1">EXPLORE NEW ARRIVALS <ArrowRight size={14} /></a></div>}
        </section>
        <aside className="panel account-details-panel"><div className="account-section-heading"><div><p className="eyebrow">YOUR DETAILS</p><h2>ACCOUNT DETAILS</h2></div></div><p className="profile-label">EMAIL</p><p className="account-detail-value">{session.email}</p><p className="profile-label">BILLING / SHIPPING</p><p className="account-detail-value">{address}</p><p className="profile-label">COMMUNICATIONS</p><p className="account-detail-value">NOIRSAINT EDITS · ENABLED</p><a className="btn" href="#account/profile">EDIT PROFILE</a></aside>
      </div>
    </main>
  );
}

function AuthLayout({ eyebrow = 'NOIRSAINT / ACCOUNT', title, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <main className="auth-page">
      <div className="auth-editorial">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-editorial-line">A PRIVATE WORLD.<br /><em>ACCESS YOURS.</em></p>
        <p className="auth-editorial-copy">Gothic craftsmanship, contemporary form and a place for the pieces that become yours.</p>
        <div className="auth-editorial-mark" aria-hidden="true">
          <span />
          <img src="/images/logo/noirsaint-monogram.svg" alt="" />
        </div>
      </div>
      <div className={`auth-form-wrap${mounted ? ' is-mounted' : ''}`}>
        {children}
      </div>
    </main>
  );
}

function PasswordField({ id, value, onChange, label = 'PASSWORD', error, minLength }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="auth-field-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input id={id} type={showPw ? 'text' : 'password'} value={value} minLength={minLength} onChange={onChange} />
        <button className="password-toggle" type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const submit = e => {
    e.preventDefault();
    const next = {};
    if (!emailPattern.test(email)) next.email = 'ENTER A VALID EMAIL ADDRESS.';
    if (!password) next.password = 'ENTER YOUR PASSWORD.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setLoading(true);
    window.setTimeout(() => {
      if (supabase) {
        supabase.auth.signInWithPassword({ email, password }).then(({ data, error: authError }) => {
          if (authError) { setErrors({ form: authError.message.toUpperCase() }); setLoading(false); return; }
          const user = data.user;
          setSession({ id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email });
          go('#account');
        });
        return;
      }
      const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) { setErrors({ form: 'EMAIL OR PASSWORD IS INCORRECT.' }); setLoading(false); return; }
      setSession(user); go('#account');
    }, 450);
  };
  return (
    <AuthLayout title="SIGN IN.">
      <form className="form-panel" onSubmit={submit} noValidate>
        <div className="auth-field-group"><label htmlFor="login-email">EMAIL</label><input id="login-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '' })); }} />{errors.email && <div className="field-error" role="alert">{errors.email}</div>}</div>
        <PasswordField id="login-password" value={password} onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })); }} error={errors.password} />
        {errors.form && <div className="error" role="alert">{errors.form}</div>}
        <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>{loading ? 'SIGNING IN...' : <>SIGN IN <ArrowRight size={15} /></>}</button>
        <a href="#forgot-password">FORGOT PASSWORD?</a>
        <a href="#register">CREATE ACCOUNT</a>
      </form>
    </AuthLayout>
  );
}

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = password.length >= 10 ? 'strong' : password.length >= 6 ? 'medium' : password ? 'weak' : '';
  const submit = e => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = 'ENTER YOUR FULL NAME.';
    if (!emailPattern.test(email)) next.email = 'ENTER A VALID EMAIL ADDRESS.';
    if (password.length < 8) next.password = 'PASSWORD MUST BE AT LEAST 8 CHARACTERS.';
    if (password !== confirmPassword) next.confirmPassword = 'PASSWORDS DO NOT MATCH.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setLoading(true);
    window.setTimeout(() => {
      if (supabase) {
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/#account`,
          },
        }).then(({ data, error: authError }) => {
          if (authError) { setErrors({ form: authError.message.toUpperCase() }); setLoading(false); return; }
          const user = data.user;
          if (!user || !data.session) {
            setSuccess('CHECK YOUR EMAIL TO VERIFY YOUR NOIRSAINT ACCOUNT BEFORE SIGNING IN.');
            setLoading(false);
            return;
          }
          setSession({ id: user.id, email: user.email, name });
          go('#account');
        });
        return;
      }
      const users = getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setErrors({ form: 'AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS.' }); setLoading(false); return;
      }
      const user = { id: `u${Date.now()}`, name, email, password };
      saveUsers([user, ...users]); setSession(user); go('#account');
    }, 450);
  };
  return (
    <AuthLayout title="CREATE ACCOUNT.">
      <form className="form-panel" onSubmit={submit} noValidate>
        <div className="auth-field-group"><label htmlFor="register-name">FULL NAME</label><input id="register-name" value={name} onChange={e => setName(e.target.value)} />{errors.name && <div className="field-error" role="alert">{errors.name}</div>}</div>
        <div className="auth-field-group"><label htmlFor="register-email">EMAIL</label><input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />{errors.email && <div className="field-error" role="alert">{errors.email}</div>}</div>
        <PasswordField id="register-password" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} minLength={8} />
        <div className="strength-meter" aria-label={`Password strength: ${strength || 'empty'}`}><span className={strength} /></div>
        <PasswordField id="register-confirm-password" label="CONFIRM PASSWORD" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />
        {errors.form && <div className="error" role="alert">{errors.form}</div>}
        {success && <div className="auth-success" role="status"><span>{success}</span><button className="auth-resend" type="button" disabled={resending} onClick={async () => {
          setResending(true);
          const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/#account` } });
          setSuccess(error ? error.message.toUpperCase() : 'A NEW VERIFICATION EMAIL HAS BEEN SENT. CHECK SPAM OR PROMOTIONS.');
          setResending(false);
        }}>{resending ? 'SENDING...' : 'RESEND VERIFICATION EMAIL'}</button></div>}
        <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>{loading ? 'CREATING ACCOUNT...' : <>CREATE ACCOUNT <ArrowRight size={15} /></>}</button>
        <a href="#login">ALREADY HAVE AN ACCOUNT?</a>
      </form>
    </AuthLayout>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e.preventDefault();
    if (!emailPattern.test(email)) { setMessage('ENTER A VALID EMAIL ADDRESS.'); return; }
    if (!supabase) { setMessage('PASSWORD RECOVERY REQUIRES SUPABASE CONFIGURATION.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#reset-password` });
    setMessage(error ? error.message.toUpperCase() : 'CHECK YOUR EMAIL FOR A PASSWORD RESET LINK.');
    setLoading(false);
  };
  return (
    <AuthLayout title="RESET PASSWORD.">
      <form className="form-panel" onSubmit={submit} noValidate>
        <p>For this local storefront build, password recovery requires connecting a production authentication provider.</p>
        <div className="auth-field-group"><label htmlFor="reset-email">EMAIL</label><input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        {message && <div className="error" role="alert">{message}</div>}
        <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>{loading ? 'SENDING...' : 'SEND RESET LINK'}</button>
        <a href="#login">RETURN TO SIGN IN</a>
      </form>
    </AuthLayout>
  );
}

/* ── Misc pages ────────────────────────────────────────────────── */
function Simple({ title, children }) {
  return (
    <main className="simple">
      <p className="eyebrow">NOIRSAINT / WORLD</p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
function NotFound() {
  return (
    <Simple title="PAGE NOT FOUND.">
      <a className="btn" href="#home">RETURN HOME</a>
    </Simple>
  );
}
function Contact() {
  return (
    <Simple title="CONTACT NOIRSAINT.">
      <p>For customer care, order support, wholesale and collaborations, use the contact channel configured for your production deployment.</p>
      <a className="btn" href="mailto:studio@noirsaint.com">EMAIL THE STUDIO</a>
    </Simple>
  );
}
function FAQ() {
  return (
    <Simple title="FREQUENTLY ASKED.">
      <div className="accordions">
        <details open>
          <summary>SHIPPING <ChevronDown size={15} /></summary>
          <p>Orders are prepared after checkout. Delivery timing and rates depend on the destination configured for the store.</p>
        </details>
        <details>
          <summary>RETURNS <ChevronDown size={15} /></summary>
          <p>Eligible unworn pieces may be returned according to the store's published return policy.</p>
        </details>
        <details>
          <summary>SIZE <ChevronDown size={15} /></summary>
          <p>Use the category-specific size guide on each product page before ordering.</p>
        </details>
      </div>
    </Simple>
  );
}
function SearchPage() {
  const [term, setTerm] = useState('');
  const ps = getProducts().filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
  return (
    <main className="search-page">
      <p className="eyebrow">NOIRSAINT / SEARCH</p>
      <h1>FIND YOUR PIECE.</h1>
      <div className="big-search">
        <Search />
        <input
          autoFocus
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="SEARCH NOIRSAINT"
          aria-label="Search NOIRSAINT"
        />
      </div>
      <div className="grid">
        {term && ps.map(p => <ProductCard p={p} key={p.id} />)}
      </div>
    </main>
  );
}

/* ── Router ────────────────────────────────────────────────────── */
function resolveRoute(route, path) {
  const normalized = path.replace(/^\//, '');
  // Path-based routes (when served from sub-paths)
  if (normalized && normalized !== '') {
    if (normalized === 'shop' || normalized === 'products') return <Shop />;
    if (normalized === 'lookbook')   return <Lookbook />;
    if (normalized === 'collections') return <Collections />;
    if (normalized.startsWith('collections/')) return <CollectionPage slug={normalized.split('/')[1]} />;
    if (normalized === 'cart')       return <Cart />;
    if (normalized === 'checkout')   return <Checkout />;
    if (normalized === 'search')     return <SearchPage />;
    if (normalized === 'login')      return <Login />;
    if (normalized === 'register')   return <Register />;
    if (normalized === 'forgot-password') return <ForgotPassword />;
    if (normalized === 'account')    return <AccountPage />;
    if (normalized.startsWith('account/')) return <AccountPage section={normalized.split('/')[1]} />;
    if (normalized === 'contact')    return <Contact />;
    if (normalized === 'faq')        return <FAQ />;
    if (normalized === 'admin')      return <AdminOverview />;
    if (normalized === 'admin/products') return <AdminProducts />;
    if (normalized === 'admin/products/new') return <ProductForm />;
    if (normalized.startsWith('admin/products/edit/')) return <ProductForm id={normalized.split('/')[3]} />;
    if (normalized === 'admin/inventory') return <AdminInventory />;
    if (normalized === 'admin/orders')    return <AdminOrders />;
    if (normalized === 'admin/customers') return <AdminCustomers />;
    if (normalized === 'admin/analytics') return <AdminAnalytics />;
    if (normalized === 'admin/settings')  return <AdminSettings />;
    if (normalized === 'admin/profile')   return <AdminProfile />;
    if (normalized === 'about') return <Simple title="THE NOIRSAINT WORLD."><p>NOIRSAINT is a modern international fashion house with a gothic soul — built around contemporary form, dark luxury, and individual expression.</p></Simple>;
    if (normalized.startsWith('product/')) return <ProductPage slug={normalized.split('/')[1]} />;
    if (normalized.startsWith('order/'))   return <OrderConfirmation id={normalized.split('/')[1]} />;
  }
  // Hash-based routes
  if (route === '#home' || route === '#') return <Home />;
  if (route === '#shop' || route.startsWith('#shop?')) return <Shop />;
  if (route === '#cart')       return <Cart />;
  if (route === '#checkout')   return <Checkout />;
  if (route === '#search')     return <SearchPage />;
  if (route === '#lookbook')   return <Lookbook />;
  if (route === '#collections') return <Collections />;
  if (route.startsWith('#collections/')) return <CollectionPage slug={route.split('/')[1]} />;
  if (route.startsWith('#product/')) return <ProductPage slug={route.split('/')[1]} />;
  if (route.startsWith('#order/'))   return <OrderConfirmation id={route.split('/')[1]} />;
  if (route === '#login')      return <Login />;
  if (route === '#register')   return <Register />;
  if (route === '#forgot-password') return <ForgotPassword />;
  if (route === '#account')    return <AccountPage />;
  if (route.startsWith('#account/')) return <AccountPage section={route.split('/')[1]} />;
  if (route === '#contact')    return <Contact />;
  if (route === '#faq')        return <FAQ />;
  if (route === '#shipping')   return <Simple title="SHIPPING."><p>Orders are prepared after checkout. Delivery timing and rates depend on the destination configured for the store.</p></Simple>;
  if (route === '#returns')    return <Simple title="RETURNS."><p>Eligible unworn pieces may be returned according to the store's published return policy.</p></Simple>;
  if (route === '#size-guide') return <Simple title="SIZE GUIDE."><p>Open the size guide on any product page for category-specific measurements and fit guidance.</p><a className="btn" href="#shop">SHOP THE COLLECTION</a></Simple>;
  if (route === '#privacy')    return <Simple title="PRIVACY."><p>Your local storefront data is stored in this browser during the prototype phase. Production privacy controls should be connected before launch.</p></Simple>;
  if (route === '#admin')      return <AdminOverview />;
  if (route === '#admin/products') return <AdminProducts />;
  if (route === '#admin/products/new') return <ProductForm />;
  if (route.startsWith('#admin/products/edit/')) return <ProductForm id={route.split('/')[3]} />;
  if (route === '#admin/inventory')  return <AdminInventory />;
  if (route === '#admin/orders')     return <AdminOrders />;
  if (route === '#admin/customers')  return <AdminCustomers />;
  if (route === '#admin/analytics')  return <AdminAnalytics />;
  if (route === '#admin/settings')   return <AdminSettings />;
  if (route === '#admin/profile')    return <AdminProfile />;
  if (route === '#about') return <Simple title="THE NOIRSAINT WORLD."><p>NOIRSAINT is a modern international fashion house with a gothic soul — built around contemporary form, dark luxury, and individual expression.</p></Simple>;
  return <NotFound />;
}

/* ── App ───────────────────────────────────────────────────────── */
function AdminGate({ children }) {
  const [state, setState] = useState('checking');
  useEffect(() => {
    let active = true;
    isCurrentUserAdmin().then(ok => { if (active) setState(ok ? 'allowed' : 'denied'); });
    return () => { active = false; };
  }, []);
  if (state === 'checking') return <main className="account-gate"><div className="account-gate-copy"><p className="eyebrow">NOIRSAINT / ADMIN</p><h1>VERIFYING<br /><em>ACCESS.</em></h1></div></main>;
  if (state === 'denied') return <main className="account-gate"><div className="account-gate-copy"><p className="eyebrow">NOIRSAINT / ADMIN</p><h1>ACCESS<br /><em>RESTRICTED.</em></h1><p className="account-gate-lead">Administrator access is required for this area.</p><a className="btn primary" href="#login">SIGN IN</a></div></main>;
  return children;
}

function App() {
  const route = useRoute();
  useReveal(`${location.pathname}${route}`);

  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    let active = true;

    loadProducts()
      .catch(error => {
        console.error('NOIRSAINT catalog loading error:', error);
      })
      .finally(() => {
        if (active) {
          setCatalogReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const path =
    location.pathname.replace(/\/$/, '') || '/';

  const isAdminRoute =
    route.startsWith('#admin') ||
    path === '/admin' ||
    path.startsWith('/admin/');

  const page = resolveRoute(route, path);

  return (
    <>
      <Loader catalogReady={catalogReady} />

      {!isAdminRoute && <Navbar />}

      <PageTransition routeKey={`${path}${route}`}>
        {isAdminRoute ? <AdminGate>{page}</AdminGate> : page}
      </PageTransition>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <CartProvider><App /></CartProvider>
);