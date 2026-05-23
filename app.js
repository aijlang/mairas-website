/* 
 * KITTEN GEMS - Interactive E-Commerce Engine
 * Author: Antigravity IDE Pair Programmer
 * Built with: Vanilla JS for peak performance and modular layout states
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  let state = {
    cart: [],
    activeCategory: 'all',
    searchTerm: '',
    inStockOnly: false,
    selectedTags: [],
    currentSort: 'featured',
    couponCode: '',
    discountPercent: 0
  };

  // Load cart from LocalStorage on init
  const initCart = () => {
    try {
      const stored = localStorage.getItem('kittengems_cart');
      if (stored) {
        state.cart = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
      state.cart = [];
    }
    updateCartUI();
  };

  const saveCart = () => {
    try {
      localStorage.setItem('kittengems_cart', JSON.stringify(state.cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
    updateCartUI();
  };

  // ==========================================
  // 2. ELEMENT SELECTORS
  // ==========================================
  const headerCartBadge = document.getElementById('header-cart-badge-count');
  const productsGrid = document.getElementById('main-products-grid-container');
  const resultsCounter = document.getElementById('catalog-results-counter');
  const emptyPlaceholder = document.getElementById('catalog-empty-placeholder');
  
  // Filters & Sidebar Inputs
  const searchInput = document.getElementById('catalog-search-input');
  const instockToggle = document.getElementById('filter-instock-toggle');
  const sortSelect = document.getElementById('catalog-sort-select');
  const sidebarCategoryChips = document.querySelectorAll('#filter-category-chips .filter-chip');
  const tagCheckboxes = document.querySelectorAll('.tag-checkbox');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const emptyResetBtn = document.getElementById('empty-state-reset-btn');
  
  // Cart Drawer Elements
  const cartDrawerWrapper = document.getElementById('cart-drawer-wrapper');
  const cartDrawerToggle = document.getElementById('cart-drawer-toggle');
  const cartDrawerCloseBtn = document.getElementById('cart-drawer-close-btn');
  const cartItemsList = document.getElementById('cart-drawer-items-list-container');
  const cartTitleQty = document.getElementById('cart-count-title-qty');
  const shippingMessage = document.getElementById('shipping-progress-promo-message');
  const shippingProgressBar = document.getElementById('shipping-progress-bar-indicator');
  const cartSubtotalText = document.getElementById('cart-subtotal-price-text');
  const cartShippingText = document.getElementById('cart-shipping-price-text');
  const cartTotalText = document.getElementById('cart-estimated-total-price-text');
  const cartProceedBtn = document.getElementById('cart-checkout-proceed-btn');
  const cartFooterBlock = document.getElementById('cart-drawer-checkout-footer-block');

  // Quick View Modal Elements
  const quickViewModal = document.getElementById('quick-view-modal-backdrop');
  const quickViewClose = document.getElementById('quick-view-modal-close');
  const quickViewContent = document.getElementById('quick-view-product-details-content');

  // Checkout Elements
  const checkoutOverlay = document.getElementById('checkout-system-overlay-portal');
  const checkoutBackLink = document.getElementById('checkout-return-to-cart-action');
  const checkoutSummaryItemsList = document.getElementById('checkout-items-summary-list-container');
  const checkoutCouponInput = document.getElementById('checkout-coupon-code-input');
  const checkoutCouponApplyBtn = document.getElementById('checkout-coupon-apply-btn');
  const checkoutSubtotalText = document.getElementById('checkout-totals-subtotal-price');
  const checkoutDiscountText = document.getElementById('checkout-totals-discount-price');
  const checkoutShippingText = document.getElementById('checkout-totals-shipping-price');
  const checkoutTaxesText = document.getElementById('checkout-totals-taxes-price');
  const checkoutGrandtotalText = document.getElementById('checkout-totals-grandtotal-price');
  const checkoutSubmitBtn = document.getElementById('checkout-complete-order-submit-btn');

  // Success Screen Elements
  const successScreen = document.getElementById('checkout-order-success-screen-slide');
  const successConfettiBoard = document.getElementById('success-confetti-particle-board');
  const successReceiptNumber = document.getElementById('receipt-summary-number-text');
  const successShippingName = document.getElementById('receipt-summary-shipping-name');
  const successGrandtotalText = document.getElementById('receipt-summary-grandtotal-text');
  const successReturnHomeBtn = document.getElementById('success-screen-return-home-btn');

  // Sticky Header Effect
  window.addEventListener('scroll', () => {
    const header = document.getElementById('main-site-header');
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Navigation Drawer Toggle
  const burgerTrigger = document.getElementById('burger-menu-trigger');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  
  burgerTrigger.addEventListener('click', () => mobileNavDrawer.classList.add('open'));
  mobileNavClose.addEventListener('click', () => mobileNavDrawer.classList.remove('open'));

  // ==========================================
  // 3. CATALOG RENDERING & FILTER ENGINE
  // ==========================================

  // Perform Catalog Re-Filtering & Sorting
  const renderCatalog = () => {
    let filtered = [...PRODUCTS];

    // Filter 1: Categories
    if (state.activeCategory !== 'all') {
      if (state.activeCategory === 'accessories') {
        // Show anything that is NOT a necklace, earrings, or bracelet
        const coreCategories = ['Necklace', 'Earrings', 'Bracelet'];
        filtered = filtered.filter(p => !coreCategories.includes(p.type));
      } else {
        filtered = filtered.filter(p => p.type === state.activeCategory);
      }
    }

    // Filter 2: Search Query
    if (state.searchTerm) {
      const query = state.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const tagMatch = p.tags.some(tag => tag.toLowerCase().includes(query));
        return titleMatch || descMatch || tagMatch;
      });
    }

    // Filter 3: In-Stock Switch Toggle
    if (state.inStockOnly) {
      filtered = filtered.filter(p => p.available);
    }

    // Filter 4: Tag Box Options (OR filter between selected checkboxes)
    if (state.selectedTags.length > 0) {
      filtered = filtered.filter(p => {
        return p.tags.some(tag => state.selectedTags.includes(tag));
      });
    }

    // Sort operations
    if (state.currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (state.currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (state.currentSort === 'alpha-az') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: Featured drop order, keep available ones first
      filtered.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));
    }

    // Update Counter text
    resultsCounter.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${PRODUCTS.length}</strong> unique products`;

    // Render cards HTML
    productsGrid.innerHTML = '';
    
    if (filtered.length === 0) {
      productsGrid.style.display = 'none';
      emptyPlaceholder.style.display = 'block';
    } else {
      productsGrid.style.display = 'grid';
      emptyPlaceholder.style.display = 'none';

      filtered.forEach(p => {
        const card = document.createElement('article');
        card.className = `product-card ${!p.available ? 'sold-out' : ''}`;
        card.setAttribute('data-id', p.id);

        const imgUrl = p.images[0] || 'https://via.placeholder.com/400';
        
        card.innerHTML = `
          <div class="product-image-container">
            <img src="${imgUrl}" alt="${p.title}" loading="lazy">
            ${!p.available ? '<div class="sold-out-overlay"></div>' : ''}
            
            <div class="product-badge-overlay">
              ${p.available 
                ? '<span class="badge badge-in-stock"><span style="width:6px;height:6px;border-radius:50%;background:#2e7d32;display:inline-block;animation:pulse 2s infinite"></span>In Stock</span>' 
                : '<span class="badge badge-sold-out">Sold Out</span>'}
            </div>

            <div class="product-actions-overlay">
              <button class="icon-action-btn quick-view-trigger" title="Quick View">
                <span class="material-icons-outlined">visibility</span>
              </button>
              ${p.available ? `
                <button class="icon-action-btn quick-add-trigger" title="Add to Bag">
                  <span class="material-icons-outlined">add_shopping_cart</span>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="product-details-wrap">
            <span class="product-type">${p.type}</span>
            <h3 class="product-card-title">${p.title}</h3>
            <span class="product-card-price">$${p.price.toFixed(2)}</span>
          </div>
        `;

        // Card Click opens Quick View
        card.addEventListener('click', (e) => {
          // Prevent card open click if user clicks direct action buttons
          if (e.target.closest('.icon-action-btn')) return;
          openQuickView(p.id);
        });

        // Overlay Action clicks
        const qvBtn = card.querySelector('.quick-view-trigger');
        if (qvBtn) qvBtn.addEventListener('click', () => openQuickView(p.id));

        const addBtn = card.querySelector('.quick-add-trigger');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            addToCart(p.id, 1);
            showNotificationToast(p.title);
          });
        }

        productsGrid.appendChild(card);
      });
    }
  };

  // Toast Notification for quick add
  const showNotificationToast = (title) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: hsl(345, 25%, 15%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 3000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.4rem;
      font-weight: 600;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.innerHTML = `
      <span class="material-icons-outlined" style="color:var(--color-primary-light)">check_circle</span>
      Added "${title}" to your Shopping Bag!
    `;
    document.body.appendChild(toast);
    
    // Animate In
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 50);

    // Animate Out & Remove
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  // Handle Tag Filtering checkboxes
  tagCheckboxes.forEach(box => {
    box.addEventListener('change', () => {
      const activeTags = [];
      tagCheckboxes.forEach(cb => {
        if (cb.checked) activeTags.push(cb.value);
      });
      state.selectedTags = activeTags;
      renderCatalog();
    });
  });

  // Handle Search Input in real time
  searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderCatalog();
  });

  // Handle In-Stock Toggle switch click
  instockToggle.addEventListener('click', () => {
    state.inStockOnly = !state.inStockOnly;
    if (state.inStockOnly) {
      instockToggle.classList.add('active');
    } else {
      instockToggle.classList.remove('active');
    }
    renderCatalog();
  });

  // Handle Sort changes
  sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    renderCatalog();
  });

  // Category Filtering via desktop nav/sidebar chips
  const selectCategory = (category) => {
    state.activeCategory = category;
    
    // Update chip active classes
    sidebarCategoryChips.forEach(chip => {
      if (chip.getAttribute('data-type') === category) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Update main header links active classes
    document.querySelectorAll('.main-nav .nav-link, .mobile-nav-links .mobile-nav-link').forEach(link => {
      if (link.getAttribute('data-category') === category) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Auto close mobile menu if open
    mobileNavDrawer.classList.remove('open');

    renderCatalog();
  };

  // Click events on navigation items
  document.querySelectorAll('.nav-link, .mobile-nav-link, .footer-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const cat = link.getAttribute('data-category');
      if (cat) {
        e.preventDefault();
        selectCategory(cat);
        // Scroll to catalog section smoothly
        const catalogSec = document.getElementById('catalog');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Click on category chips in sidebar
  sidebarCategoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      selectCategory(chip.getAttribute('data-type'));
    });
  });

  // Reset/Clear all filters
  const resetFilters = () => {
    state.searchTerm = '';
    state.inStockOnly = false;
    state.selectedTags = [];
    state.currentSort = 'featured';
    state.activeCategory = 'all';

    searchInput.value = '';
    instockToggle.classList.remove('active');
    sortSelect.value = 'featured';
    tagCheckboxes.forEach(cb => cb.checked = false);
    
    selectCategory('all');
    renderCatalog();
  };

  clearFiltersBtn.addEventListener('click', resetFilters);
  emptyResetBtn.addEventListener('click', resetFilters);

  // Mobile Filters Modal trigger (toggles sidebar panel)
  const mobileFilterBtn = document.getElementById('mobile-filter-btn');
  mobileFilterBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('catalog-sidebar-filters');
    sidebar.classList.add('active-mobile');
    
    // Add close button if inside mobile view
    if (!document.getElementById('mobile-filter-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.id = 'mobile-filter-close';
      closeBtn.className = 'btn btn-primary';
      closeBtn.style.cssText = 'width:100%; margin-top:20px;';
      closeBtn.innerText = 'Apply Filters';
      closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active-mobile');
      });
      sidebar.appendChild(closeBtn);
    }
  });

  // ==========================================
  // 4. CART & DRAWER LOGIC
  // ==========================================

  const toggleCartDrawer = (open) => {
    if (open) {
      cartDrawerWrapper.classList.add('open');
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    } else {
      cartDrawerWrapper.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  cartDrawerToggle.addEventListener('click', () => toggleCartDrawer(true));
  cartDrawerCloseBtn.addEventListener('click', () => toggleCartDrawer(false));
  
  // Close drawer if clicking outside cart panel
  cartDrawerWrapper.addEventListener('click', (e) => {
    if (e.target === cartDrawerWrapper) toggleCartDrawer(false);
  });

  // Core add item method
  const addToCart = (productId, qty = 1) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !product.available) return;

    const existingIdx = state.cart.findIndex(item => item.product.id === productId);
    if (existingIdx !== -1) {
      state.cart[existingIdx].quantity += qty;
    } else {
      state.cart.push({ product, quantity: qty });
    }

    saveCart();
  };

  // Core update item count method
  const updateCartItemQty = (productId, change) => {
    const itemIdx = state.cart.findIndex(item => item.product.id === productId);
    if (itemIdx === -1) return;

    state.cart[itemIdx].quantity += change;

    // Remove item if quantity falls to 0
    if (state.cart[itemIdx].quantity <= 0) {
      state.cart.splice(itemIdx, 1);
    }

    saveCart();
  };

  // Remove item from cart
  const removeCartItem = (productId) => {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    saveCart();
  };

  // Re-calculate price details and draw Cart Items List
  const updateCartUI = () => {
    // Total count of units
    const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    headerCartBadge.innerText = totalQty;
    cartTitleQty.innerText = totalQty;
    
    // Toggle header badge visibility
    if (totalQty === 0) {
      headerCartBadge.style.display = 'none';
    } else {
      headerCartBadge.style.display = 'flex';
    }

    cartItemsList.innerHTML = '';

    if (state.cart.length === 0) {
      // Empty drawer state layout
      cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <span class="material-icons-outlined" style="font-size: 5rem; color: var(--color-primary-light); margin-bottom:16px;">local_mall</span>
          <p>Your shopping bag is currently empty.</p>
          <button class="btn btn-outline" style="margin-top:20px; font-size:1.2rem;" id="cart-drawer-continue-shop-btn">Continue Shopping</button>
        </div>
      `;
      
      const contBtn = document.getElementById('cart-drawer-continue-shop-btn');
      if (contBtn) {
        contBtn.addEventListener('click', () => toggleCartDrawer(false));
      }

      // Hide summary footer if empty
      cartFooterBlock.style.display = 'none';
      shippingMessage.style.display = 'none';
      shippingProgressBar.parentNode.style.display = 'none';
      return;
    }

    // Display summary footer
    cartFooterBlock.style.display = 'block';
    shippingMessage.style.display = 'block';
    shippingProgressBar.parentNode.style.display = 'block';

    let subtotal = 0;

    state.cart.forEach(item => {
      const itemSubtotal = item.product.price * item.quantity;
      subtotal += itemSubtotal;

      const itemCard = document.createElement('div');
      itemCard.className = 'cart-item-card';

      itemCard.innerHTML = `
        <div class="cart-item-thumb">
          <img src="${item.product.images[0]}" alt="${item.product.title}">
        </div>
        <div class="cart-item-details">
          <h4>${item.product.title}</h4>
          <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="cart-item-qty-btn val-minus" data-id="${item.product.id}">
              <span class="material-icons-outlined" style="font-size:1.2rem">remove</span>
            </button>
            <span class="cart-item-qty-val">${item.quantity}</span>
            <button class="cart-item-qty-btn val-plus" data-id="${item.product.id}">
              <span class="material-icons-outlined" style="font-size:1.2rem">add</span>
            </button>
          </div>
        </div>
        <button class="cart-item-remove-btn" data-id="${item.product.id}" aria-label="Remove item" style="color:var(--text-muted); cursor:pointer;">
          <span class="material-icons-outlined">delete_outline</span>
        </button>
      `;

      // Wire up clicks
      itemCard.querySelector('.val-minus').addEventListener('click', () => updateCartItemQty(item.product.id, -1));
      itemCard.querySelector('.val-plus').addEventListener('click', () => updateCartItemQty(item.product.id, 1));
      itemCard.querySelector('.cart-item-remove-btn').addEventListener('click', () => removeCartItem(item.product.id));

      cartItemsList.appendChild(itemCard);
    });

    // Update price fields
    cartSubtotalText.innerText = `$${subtotal.toFixed(2)}`;

    // Free Shipping Progress calculation ($50 limit threshold)
    const shippingLimit = 50.00;
    if (subtotal >= shippingLimit) {
      shippingMessage.innerHTML = '✨ Congrats! You have unlocked <strong>Free Shipping!</strong> ✨';
      shippingProgressBar.style.width = '100%';
      cartShippingText.innerHTML = '<span style="color:var(--color-in-stock)">FREE</span>';
      cartTotalText.innerText = `$${subtotal.toFixed(2)}`;
    } else {
      const remaining = shippingLimit - subtotal;
      shippingMessage.innerHTML = `You are only <strong>$${remaining.toFixed(2)}</strong> away from <strong>Free Shipping!</strong>`;
      const fillPercentage = (subtotal / shippingLimit) * 100;
      shippingProgressBar.style.width = `${fillPercentage}%`;
      
      const shippingCost = 4.99;
      cartShippingText.innerText = `$${shippingCost.toFixed(2)}`;
      cartTotalText.innerText = `$${(subtotal + shippingCost).toFixed(2)}`;
    }
  };

  // ==========================================
  // 5. QUICK-VIEW PRODUCT MODAL ENGINE
  // ==========================================

  const openQuickView = (productId) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Modal tabs click state tracking
    let activeTab = 'desc';
    let activeImgIdx = 0;
    let qtySelectorVal = 1;

    const renderQuickViewContent = () => {
      // Create materials list based on product tag keywords
      let materialsText = 'Fresh glass beads, secure wire pins';
      if (product.tags.includes('gold plated')) materialsText = '14K gold-plated findings, sturdy brass pin bases';
      if (product.tags.includes('mother of pearl')) materialsText = 'Natural premium mother-of-pearl nugget, gold plated hoops';
      if (product.tags.includes('glass beads')) materialsText = 'Czech glass beads, glass flower core fittings';

      // Load mock reviews matching product category
      let review1 = `"Gorgeous product! Fits like a glove." - Elena P.`;
      let review2 = `"Beautiful detailing on the wire. High quality!" - Mateo G.`;
      if (product.type === 'Necklace') {
        review1 = `"Absolutely stunning length! Matches my summer dresses perfectly." - Nicole T.`;
        review2 = `"The gold stays shiny and the beads look extremely elegant." - Isabella F.`;
      } else if (product.type === 'Earrings') {
        review1 = `"So light! Usually metal earrings hurt my lobes, but these hoops are a breeze." - Maria V.`;
        review2 = `"Adorable cherry blossom drops! Very modern and high-fashion." - Sarah L.`;
      }

      quickViewContent.innerHTML = `
        <!-- Left Media Gallery Column -->
        <div class="quickview-media">
          <div class="quickview-image-viewport">
            <img id="modal-active-viewport-image" src="${product.images[activeImgIdx]}" alt="${product.title}">
          </div>
          <div class="quickview-thumbs">
            ${product.images.map((img, idx) => `
              <div class="quickview-thumb ${idx === activeImgIdx ? 'active' : ''}" data-idx="${idx}">
                <img src="${img}" alt="${product.title}">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right Description & Checkout Details Column -->
        <div class="quickview-details">
          <div class="quickview-header">
            <span class="product-type" style="margin-bottom:8px; display:block;">${product.type}</span>
            <h2 class="quickview-title">${product.title}</h2>
            <div class="quickview-price-line">
              <span class="quickview-price">$${product.price.toFixed(2)}</span>
              ${product.available 
                ? '<span class="badge badge-in-stock"><span style="width:6px;height:6px;border-radius:50%;background:#2e7d32;display:inline-block;animation:pulse 2s infinite"></span>In Stock</span>' 
                : '<span class="badge badge-sold-out">Sold Out</span>'}
            </div>
          </div>

          <!-- Tabs Controls -->
          <div class="details-tabs">
            <button class="details-tab-btn ${activeTab === 'desc' ? 'active' : ''}" data-tab="desc">Description</button>
            <button class="details-tab-btn ${activeTab === 'material' ? 'active' : ''}" data-tab="material">Materials & Care</button>
            <button class="details-tab-btn ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">Reviews</button>
          </div>

          <!-- Tab Panels -->
          <div class="details-tab-panel ${activeTab === 'desc' ? 'active' : ''}">
            <p class="quickview-description">${product.description || 'Intricately handcrafted unique bead arrangements built personally by Latina artist Maira. Fully adjustable details.'}</p>
          </div>

          <div class="details-tab-panel ${activeTab === 'material' ? 'active' : ''}">
            <p style="margin-bottom: 12px; font-weight:600;">Handcrafted Sourcing:</p>
            <ul class="details-materials-list" style="margin-bottom:16px;">
              <li>Materials: ${materialsText}</li>
              <li>Hand-woven and hand-bent with care</li>
              <li>Nickel-free and hypoallergenic base metals</li>
            </ul>
            <p style="font-weight:600;">Jewelry Care:</p>
            <p>To preserve luster and shine, avoid submerged water (swimming/showering), limit contact with perfumes/creams, and clean using a soft jewelry cloth.</p>
          </div>

          <div class="details-tab-panel ${activeTab === 'reviews' ? 'active' : ''}">
            <div style="display:flex; color:var(--color-gold); margin-bottom:12px;">
              <span class="material-icons-outlined" style="font-size:1.6rem">star</span>
              <span class="material-icons-outlined" style="font-size:1.6rem">star</span>
              <span class="material-icons-outlined" style="font-size:1.6rem">star</span>
              <span class="material-icons-outlined" style="font-size:1.6rem">star</span>
              <span class="material-icons-outlined" style="font-size:1.6rem">star</span>
            </div>
            <p style="font-style:italic; margin-bottom:12px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:8px;">${review1}</p>
            <p style="font-style:italic;">${review2}</p>
          </div>

          <!-- Purchase buttons controls -->
          <div class="purchase-controls">
            ${product.available ? `
              <div style="display:flex; gap:16px; align-items:center;">
                <label style="font-size:1.2rem; font-weight:700; text-transform:uppercase; color:var(--text-muted)">QTY</label>
                <div class="qty-input-selector">
                  <button class="qty-btn qty-minus">
                    <span class="material-icons-outlined" style="font-size:1.4rem">remove</span>
                  </button>
                  <span class="qty-val">${qtySelectorVal}</span>
                  <button class="qty-btn qty-plus">
                    <span class="material-icons-outlined" style="font-size:1.4rem">add</span>
                  </button>
                </div>
              </div>
              
              <button class="btn btn-primary" style="width: 100%; font-size:1.4rem;" id="modal-add-to-cart-submit">
                Add to Shopping Bag
              </button>
            ` : `
              <button class="btn btn-primary" style="width: 100%; background:var(--color-sold-out); cursor:not-allowed;" disabled>
                Sold Out (Restocking Soon)
              </button>
            `}
          </div>
        </div>
      `;

      // Event: Image thumbnails click swap
      const thumbs = quickViewContent.querySelectorAll('.quickview-thumb');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          const idx = parseInt(thumb.getAttribute('data-idx'));
          activeImgIdx = idx;
          renderQuickViewContent();
        });
      });

      // Event: Tab switching clicks
      const tabBtns = quickViewContent.querySelectorAll('.details-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.getAttribute('data-tab');
          renderQuickViewContent();
        });
      });

      // Event: Qty selectors adjustment
      if (product.available) {
        quickViewContent.querySelector('.qty-minus').addEventListener('click', () => {
          if (qtySelectorVal > 1) {
            qtySelectorVal--;
            renderQuickViewContent();
          }
        });
        quickViewContent.querySelector('.qty-plus').addEventListener('click', () => {
          qtySelectorVal++;
          renderQuickViewContent();
        });

        // Add to Bag submit button click inside modal
        quickViewContent.querySelector('#modal-add-to-cart-submit').addEventListener('click', () => {
          addToCart(product.id, qtySelectorVal);
          
          // Close Modal & open cart drawer panel automatically
          closeQuickViewModal();
          setTimeout(() => {
            toggleCartDrawer(true);
          }, 300);
        });
      }
    };

    renderQuickViewContent();
    quickViewModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeQuickViewModal = () => {
    quickViewModal.classList.remove('open');
    // Restore scroll if cart drawer is not open
    if (!cartDrawerWrapper.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  quickViewClose.addEventListener('click', closeQuickViewModal);
  quickViewModal.addEventListener('click', (e) => {
    if (e.target === quickViewModal) closeQuickViewModal();
  });

  // ==========================================
  // 6. SIMULATED CHECKOUT PORTAL ENGINE
  // ==========================================

  const toggleCheckoutPortal = (open) => {
    if (open) {
      // Pre-requisite: cart must have items
      if (state.cart.length === 0) return;

      // Close cart drawer & open checkout portal overlay
      toggleCartDrawer(false);
      checkoutOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Load items lists summaries column on right
      renderCheckoutSummary();
    } else {
      checkoutOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  cartProceedBtn.addEventListener('click', () => toggleCheckoutPortal(true));
  checkoutBackLink.addEventListener('click', () => toggleCheckoutPortal(false));

  // Render items bought column in checkout
  const renderCheckoutSummary = () => {
    checkoutSummaryItemsList.innerHTML = '';
    
    let subtotal = 0;

    state.cart.forEach(item => {
      const itemSubtotal = item.product.price * item.quantity;
      subtotal += itemSubtotal;

      const card = document.createElement('div');
      card.className = 'checkout-summary-item-card';

      card.innerHTML = `
        <div class="checkout-summary-thumb">
          <img src="${item.product.images[0]}" alt="${item.product.title}">
        </div>
        <div class="checkout-summary-info">
          <h4>${item.product.title}</h4>
          <p>Qty: ${item.quantity}</p>
        </div>
        <div class="checkout-summary-price">$${itemSubtotal.toFixed(2)}</div>
      `;

      checkoutSummaryItemsList.appendChild(card);
    });

    calculateCheckoutPrices(subtotal);
  };

  // Dynamic calculations in checkout factoring coupons & taxes
  const calculateCheckoutPrices = (subtotal) => {
    // Discount coupon deduction calculations
    const discount = subtotal * state.discountPercent;
    
    // Shipping: Free if post-discount >= 50
    const finalSub = subtotal - discount;
    const shipping = finalSub >= 50.00 ? 0.00 : 4.99;
    
    // Simulated Taxes (8% state base rate)
    const taxes = finalSub * 0.08;
    
    const grandTotal = finalSub + shipping + taxes;

    // Write text values
    checkoutSubtotalText.innerText = `$${subtotal.toFixed(2)}`;
    checkoutDiscountText.innerText = `-$${discount.toFixed(2)}`;
    checkoutShippingText.innerText = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    checkoutTaxesText.innerText = `$${taxes.toFixed(2)}`;
    checkoutGrandtotalText.innerText = `$${grandTotal.toFixed(2)}`;

    // If discount is 0, hide discount summary line to look cleaner
    const discountRow = checkoutDiscountText.parentNode;
    if (discount === 0) {
      discountRow.style.display = 'none';
    } else {
      discountRow.style.display = 'flex';
    }
  };

  // Promo Coupon apply logic
  checkoutCouponApplyBtn.addEventListener('click', () => {
    const rawVal = checkoutCouponInput.value.toUpperCase().trim();
    if (rawVal === 'GEM10') {
      state.couponCode = 'GEM10';
      state.discountPercent = 0.10; // 10% coupon deduction
      alert('🎟️ Coupon "GEM10" successfully applied! You saved 10% off your purchase.');
    } else if (rawVal === 'WELCOME15') {
      state.couponCode = 'WELCOME15';
      state.discountPercent = 0.15; // 15% welcome deduction
      alert('🎟️ Coupon "WELCOME15" successfully applied! You saved 15% off your purchase.');
    } else {
      alert('❌ Invalid Coupon code. Try entering "GEM10" for 10% off!');
      state.couponCode = '';
      state.discountPercent = 0;
    }
    
    // Refresh calculations
    renderCheckoutSummary();
  });

  // Validations & Completing checkout simulation
  checkoutSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Fetch fields values
    const email = document.getElementById('checkout-input-email').value.trim();
    const phone = document.getElementById('checkout-input-phone').value.trim();
    const firstname = document.getElementById('checkout-input-firstname').value.trim();
    const lastname = document.getElementById('checkout-input-lastname').value.trim();
    const address = document.getElementById('checkout-input-address').value.trim();
    const city = document.getElementById('checkout-input-city').value.trim();
    const stateVal = document.getElementById('checkout-input-state').value;
    const zip = document.getElementById('checkout-input-zip').value.trim();
    const cardnum = document.getElementById('checkout-input-cardnum').value.trim();
    const cardexpiry = document.getElementById('checkout-input-cardexpiry').value.trim();
    const cardcvv = document.getElementById('checkout-input-cardcvv').value.trim();

    // Custom validations checks
    if (!email || !phone || !firstname || !lastname || !address || !city || !stateVal || !zip || !cardnum || !cardexpiry || !cardcvv) {
      alert('⚠️ Shipping Information & Card numbers are required. Please fill in all fields.');
      return;
    }

    // Email matching
    if (!email.includes('@') || email.length < 5) {
      alert('⚠️ Please enter a valid email address.');
      return;
    }

    // Card number length checks
    const cleanedCard = cardnum.replace(/\s+/g, '');
    if (cleanedCard.length < 13 || isNaN(cleanedCard)) {
      alert('⚠️ Please enter a valid card number.');
      return;
    }

    // Visual payment pending loading delay (simulates authentic bank authorization)
    checkoutSubmitBtn.disabled = true;
    checkoutSubmitBtn.innerText = 'Authorizing Safe Checkout... 🔒';

    setTimeout(() => {
      // Payment accepted! Prepare Success confirmation screen
      checkoutOverlay.classList.remove('open');
      
      // Calculate final paid price
      const totalPaid = checkoutGrandtotalText.innerText;
      
      // Set Receipt values
      successReceiptNumber.innerText = `#KG-${Math.floor(10000 + Math.random() * 90000)}`;
      successShippingName.innerText = `${firstname} ${lastname}`;
      successGrandtotalText.innerText = totalPaid;

      // Reveal slide success
      successScreen.classList.add('open');
      
      // Release Confetti particles!
      fireSimulatedConfetti();

      // Clear Shopping Cart completely (order placed)
      state.cart = [];
      saveCart();
      
      // Restore submit button label
      checkoutSubmitBtn.disabled = false;
      checkoutSubmitBtn.innerText = 'Complete Safe Order';
    }, 1500);
  });

  // Confetti Particle Launcher animation
  const fireSimulatedConfetti = () => {
    successConfettiBoard.innerHTML = '';
    const particleCount = 80;
    const colors = ['#dc506e', '#ffb6b6', '#e5a93b', '#2e7d32', '#9c27b0', '#00bcd4'];

    for (let i = 0; i < particleCount; i++) {
      const part = document.createElement('div');
      part.className = 'confetti-particle';
      
      // Random coordinates layout
      const left = Math.random() * 100;
      const sizeWidth = 6 + Math.random() * 8;
      const sizeHeight = 6 + Math.random() * 8;
      const delay = Math.random() * 3;
      const duration = 2.5 + Math.random() * 2.5;
      const color = colors[Math.floor(Math.random() * colors.length)];

      part.style.cssText = `
        left: ${left}%;
        width: ${sizeWidth}px;
        height: ${sizeHeight}px;
        background: ${color};
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;

      successConfettiBoard.appendChild(part);
    }
  };

  // Complete return loops from success screen
  const finalizeShoppingAndReturn = () => {
    successScreen.classList.remove('open');
    toggleCheckoutPortal(false);
    
    // Clear coupon codes state
    state.couponCode = '';
    state.discountPercent = 0;
    checkoutCouponInput.value = '';
    
    // Reset page layout and go to top
    selectCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  successReturnHomeBtn.addEventListener('click', finalizeShoppingAndReturn);


  // ==========================================
  // 7b. INTERACTIVE GEMSTONE STYLE MATCHMAKER ENGINE
  // ==========================================
  let matchmakerSelections = {
    energy: null,
    style: null,
    type: null
  };
  let matchmakerCurrentStep = 1;

  const matchmakerStepElements = document.querySelectorAll('.matchmaker-step');
  const matchmakerOptionButtons = document.querySelectorAll('.matchmaker-option-btn');
  const matchmakerPrevBtn = document.getElementById('matchmaker-prev-btn');
  const matchmakerNextBtn = document.getElementById('matchmaker-next-btn');
  const matchmakerDots = document.querySelectorAll('.matchmaker-progress-dots .dot');
  const matchmakerResultDisplay = document.getElementById('matchmaker-result-display');
  const matchmakerControls = document.getElementById('matchmaker-nav-controls');

  // Handle Option Clicks
  matchmakerOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-field');
      const value = btn.getAttribute('data-value');
      
      // Remove selected from siblings in the same step
      const stepEl = btn.closest('.matchmaker-step');
      stepEl.querySelectorAll('.matchmaker-option-btn').forEach(sibling => {
        sibling.classList.remove('selected');
      });
      
      // Select clicked
      btn.classList.add('selected');
      matchmakerSelections[field] = value;

      // Enable next button
      matchmakerNextBtn.disabled = false;

      // Premium UX: Auto-advance after 350ms for steps 1 and 2
      if (matchmakerCurrentStep < 3) {
        setTimeout(() => {
          advanceMatchmakerStep(1);
        }, 350);
      }
    });
  });

  const advanceMatchmakerStep = (direction) => {
    if (direction === 1) {
      if (matchmakerCurrentStep === 3) {
        // Trigger Loading / Match Calculation
        matchmakerCurrentStep = 'loading';
        updateMatchmakerUI();
        
        setTimeout(() => {
          calculateAndRenderMatch();
        }, 2000); // 2 second luxurious loading animation
      } else {
        matchmakerCurrentStep++;
        updateMatchmakerUI();
      }
    } else if (direction === -1) {
      if (typeof matchmakerCurrentStep === 'number' && matchmakerCurrentStep > 1) {
        matchmakerCurrentStep--;
        updateMatchmakerUI();
      }
    }
  };

  if (matchmakerNextBtn && matchmakerPrevBtn) {
    matchmakerNextBtn.addEventListener('click', () => advanceMatchmakerStep(1));
    matchmakerPrevBtn.addEventListener('click', () => advanceMatchmakerStep(-1));
  }

  const updateMatchmakerUI = () => {
    // Toggle active classes on steps
    matchmakerStepElements.forEach(step => {
      const stepNum = step.getAttribute('data-step');
      if (stepNum === String(matchmakerCurrentStep)) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    // Update dots & footer controls
    if (typeof matchmakerCurrentStep === 'number') {
      if (matchmakerControls) matchmakerControls.style.display = 'flex';
      
      // Manage dot classes
      matchmakerDots.forEach(dot => {
        const dotStep = parseInt(dot.getAttribute('data-step'));
        if (dotStep === matchmakerCurrentStep) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Enable back button if > 1
      if (matchmakerPrevBtn) matchmakerPrevBtn.disabled = matchmakerCurrentStep === 1;

      // Next button is disabled until a choice is selected for the current step
      let currentField = '';
      if (matchmakerCurrentStep === 1) currentField = 'energy';
      else if (matchmakerCurrentStep === 2) currentField = 'style';
      else if (matchmakerCurrentStep === 3) currentField = 'type';

      const hasSelection = matchmakerSelections[currentField] !== null;
      if (matchmakerNextBtn) {
        matchmakerNextBtn.disabled = !hasSelection;
        if (matchmakerCurrentStep === 3) {
          matchmakerNextBtn.innerText = 'Find My Match';
        } else {
          matchmakerNextBtn.innerText = 'Next';
        }
      }
    } else {
      // It's 'loading' or 'result', hide default wizard navigation controls
      if (matchmakerControls) matchmakerControls.style.display = 'none';
    }
  };

  const calculateAndRenderMatch = () => {
    const energy = matchmakerSelections.energy;
    const style = matchmakerSelections.style;
    const type = matchmakerSelections.type;

    // Filter down to available (in stock) products, fallback to all if empty
    let candidatePool = PRODUCTS.filter(p => p.available);
    if (candidatePool.length === 0) {
      candidatePool = PRODUCTS;
    }

    let scoredPool = candidatePool.map(product => {
      let score = 0;
      const tags = (product.tags || []).map(t => t.toLowerCase());
      const pTitle = product.title.toLowerCase();
      const pDesc = product.description.toLowerCase();
      const pType = product.type.toLowerCase();

      // 1. Accessory Type Matching
      if (type !== 'any') {
        if (pType.includes(type.toLowerCase()) || type.toLowerCase().includes(pType)) {
          score += 5;
        }
      }

      // 2. Energy Intention Matching
      if (energy === 'love') {
        // Pink, heart, pearl
        if (tags.includes('pink') || pTitle.includes('pink') || pDesc.includes('pink')) score += 3;
        if (tags.includes('heart') || pTitle.includes('heart') || pDesc.includes('heart')) score += 3;
        if (tags.includes('pearl') || pDesc.includes('pearl')) score += 2;
      } else if (energy === 'peace') {
        // Pearl, white, calm
        if (tags.includes('pearl') || tags.includes('faux pearl') || tags.includes('mother of pearl') || pDesc.includes('pearl')) score += 3;
        if (pDesc.includes('white') || pDesc.includes('clear') || pTitle.includes('white')) score += 2;
        if (tags.includes('gold plated') || pDesc.includes('gold plated')) score += 1;
      } else if (energy === 'vibrant') {
        // glass beads, florals, color, whimsy
        if (tags.includes('glass beads') || tags.includes('glass jewelry') || pDesc.includes('glass')) score += 3;
        if (tags.includes('florals') || pTitle.includes('cherry') || pDesc.includes('cherry')) score += 2;
        if (pDesc.includes('green') || pDesc.includes('blue') || pDesc.includes('red') || pDesc.includes('yellow')) score += 2;
      } else if (energy === 'abundance') {
        // Gold plated, copper, crystals
        if (tags.includes('gold plated') || pDesc.includes('gold plated') || pTitle.includes('gold')) score += 3;
        if (tags.includes('copper') || pDesc.includes('copper')) score += 3;
        if (pDesc.includes('crystals') || pDesc.includes('minerals')) score += 2;
      }

      // 3. Style Preference Matching
      if (style === 'dainty') {
        if (pDesc.includes('small') || pDesc.includes('dainty') || pDesc.includes('delicate') || pDesc.includes('seed')) score += 3;
        if (pType.includes('necklace') && !pDesc.includes('chunky')) score += 1;
      } else if (style === 'bold') {
        if (tags.includes('florals') || pTitle.includes('set') || pTitle.includes('hoops') || pDesc.includes('statement')) score += 3;
        if (pDesc.includes('bold') || pDesc.includes('bright') || pDesc.includes('color')) score += 2;
      } else if (style === 'classic') {
        if (tags.includes('faux pearl') || tags.includes('mother of pearl') || tags.includes('hoops') || pDesc.includes('classic')) score += 3;
        if (pDesc.includes('gold plated') && pDesc.includes('round')) score += 2;
      } else if (style === 'boho') {
        if (tags.includes('wired jewelry') || pDesc.includes('wired') || pDesc.includes('natural') || pDesc.includes('raw')) score += 3;
        if (tags.includes('copper') || pDesc.includes('irregular') || pDesc.includes('nugget')) score += 2;
      }

      return { product, score };
    });

    // Sort by score descending
    scoredPool.sort((a, b) => b.score - a.score);

    // Pick top scorer
    const matchedItem = scoredPool[0].product;

    // Generate Gemstone Lore based on items
    let gemstoneTitle = "Handcrafted Energy Signature";
    let gemstoneLore = "This piece is intricately woven by Maira with hand-selected beads designed to harmonize with your styling vibrations. The alignment of shape, shine, and texture channels pure creative passion.";

    const matchedTitleLower = matchedItem.title.toLowerCase();
    const matchedDescLower = matchedItem.description.toLowerCase();

    if (matchedTitleLower.includes('cherry') || matchedDescLower.includes('cherry')) {
      gemstoneTitle = "The Vitality of Cherry Blossom Glass";
      gemstoneLore = "Cherry blossoms capture the transient beauty of nature. The red and white Czech glass beads channel playful vitality and romantic expression, inviting self-confidence and radiant joy into your aura.";
    } else if (matchedDescLower.includes('pearl') || matchedTitleLower.includes('hoop')) {
      gemstoneTitle = "Mother of Pearl Clarity";
      gemstoneLore = "Freshwater and faux pearls carry the serene vibration of the ocean. Known for bringing mental clarity, emotional healing, and a peaceful shield, this hand-wired piece grounds you in tranquil confidence.";
    } else if (matchedDescLower.includes('gold') || matchedDescLower.includes('copper')) {
      gemstoneTitle = "Golden Radiance & Abundance";
      gemstoneLore = "Gold-plated elements and warm copper tones act as energetic conductors. They amplify luck, invite physical abundance, and align with solar-plexus grounding to stimulate creative confidence.";
    } else if (matchedDescLower.includes('glass') || matchedDescLower.includes('iridescent')) {
      gemstoneTitle = "Refractive Iridescent Crystal Glass";
      gemstoneLore = "Refractive glass beads bend natural light. They symbolize adaptability, creative spark, and the joy of perspective, helping clear away stagnant energy and magnifying your natural aura.";
    }

    // Render result markup
    if (matchmakerResultDisplay) {
      matchmakerResultDisplay.innerHTML = `
        <div class="matchmaker-result-visual">
          <img src="${matchedItem.images[0]}" class="matchmaker-result-img" alt="${matchedItem.title} recommended by Matchmaker">
          <h4 class="matchmaker-result-title">${matchedItem.title}</h4>
          <div class="matchmaker-result-price">$${matchedItem.price.toFixed(2)}</div>
        </div>
        <div class="matchmaker-result-info">
          <div class="matchmaker-result-badge">
            <span class="material-icons-outlined" style="font-size: 1.6rem;">auto_awesome</span> Aura Matched
          </div>
          <h3>Your Jewelry Match: <span>${matchedItem.title}</span></h3>
          <p class="matchmaker-result-description">${matchedItem.description}</p>
          
          <div class="matchmaker-gem-lore-box">
            <h4>
              <span class="material-icons-outlined" style="font-size: 1.8rem; color: var(--color-gold);">star</span>
              ${gemstoneTitle}
            </h4>
            <p>"${gemstoneLore}"</p>
          </div>

          <div class="matchmaker-result-actions">
            <button class="btn btn-primary" id="matchmaker-buy-now-btn" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span class="material-icons-outlined">shopping_bag</span> Add to Shopping Bag
            </button>
            <button class="btn btn-outline" id="matchmaker-reset-wizard-btn">
              Try Matchmaker Again
            </button>
          </div>
        </div>
      `;

      // Add Events to Result Page Buttons
      document.getElementById('matchmaker-buy-now-btn').addEventListener('click', () => {
        // Dynamic cart injection
        addToCartById(matchedItem.id);
      });

      document.getElementById('matchmaker-reset-wizard-btn').addEventListener('click', resetMatchmaker);
    }

    // Swap to result screen
    matchmakerCurrentStep = 'result';
    updateMatchmakerUI();
  };

  // Helper function to inject match item into main e-commerce engine
  const addToCartById = (productId) => {
    // Find the product in PRODUCTS
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Check if already in cart
    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        variantTitle: 'Handcrafted Standard'
      });
    }

    // Save & open drawer
    saveCart();
    
    // Smooth transition: Slide out cart drawer
    if (cartDrawerWrapper) cartDrawerWrapper.classList.add('open');
  };

  const resetMatchmaker = () => {
    matchmakerSelections = {
      energy: null,
      style: null,
      type: null
    };
    matchmakerCurrentStep = 1;
    
    // Clear option buttons visual selected state
    matchmakerOptionButtons.forEach(btn => btn.classList.remove('selected'));
    
    updateMatchmakerUI();
  };

  // ==========================================
  // 7c. NEWSLETTER SUBSCRIPTION BOX HANDLER
  // ==========================================
  const getInStockHeroImages = () => {
    // Filter products that are in-stock and have at least one photo
    const inStockProducts = PRODUCTS.filter(p => p.available && p.images && p.images.length > 0);
    
    if (inStockProducts.length === 0) {
      // Safe fallback in case all items are sold out so the hero visual is never empty
      return [
        { src: 'https://cdn.shopify.com/s/files/1/0689/1536/4016/files/IMG_3627.jpg?v=1779075549', alt: 'Cherry Blossom Collection Necklace by Kitten Gems' }
      ];
    }
    
    return inStockProducts.map(p => ({
      src: p.images[0],
      alt: `${p.title} by Kitten Gems`
    }));
  };

  const HERO_IMAGES = getInStockHeroImages();
  let currentHeroIndex = Math.floor(Math.random() * HERO_IMAGES.length);

  const initHeroImageRotator = () => {
    const heroImg = document.querySelector('.hero-image-wrap img');
    if (!heroImg) return;

    // Set initial random image
    const initialSlide = HERO_IMAGES[currentHeroIndex];
    heroImg.src = initialSlide.src;
    heroImg.alt = initialSlide.alt;

    // Start rotation interval every 12 seconds for a calmer, premium browsing experience
    setInterval(() => {
      // Fade out
      heroImg.style.opacity = 0;

      setTimeout(() => {
        // Increment and set new image
        currentHeroIndex = (currentHeroIndex + 1) % HERO_IMAGES.length;
        const nextSlide = HERO_IMAGES[currentHeroIndex];
        
        // Define onload BEFORE setting src to ensure robust cross-browser execution
        heroImg.onload = () => {
          heroImg.style.opacity = 1;
        };
        heroImg.src = nextSlide.src;
        heroImg.alt = nextSlide.alt;
      }, 500); // 500ms matches the 0.5s fade out animation
    }, 12000);
  };

  // ==========================================
  // 9. LUXURY MICRO-INTERACTIONS
  // ==========================================
  const initParallax = () => {
    const heroImageWrap = document.querySelector('.hero-image-wrap');
    if (!heroImageWrap) return;
    
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < window.innerHeight) {
            heroImageWrap.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  };

  // ==========================================
  // 11. SCROLL-REVEAL SYSTEM
  // ==========================================
  const initScrollReveal = () => {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  };

  // ==========================================
  // 11. INITIALIZE STORE
  // ==========================================
  initCart();
  renderCatalog();
  initHeroImageRotator();
  initParallax();
  initScrollReveal();

});
