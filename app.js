/* ====================
   1. STATE MANAGEMENT (Fixed for Persistence)
   ==================== */
// Initialize from LocalStorage or default to 'student'
// localStorage.removeItem('iemCart'); // Uncomment once to fix NaN errors, then comment out again.
import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
let currentMarket = localStorage.getItem('activeMarket') || 'student'; 
let flowAnimationId; // Global to prevent animation stacking

window.switchMarket = (type) => {
    currentMarket = type;
    localStorage.setItem('activeMarket', type); // Save selection
    
    updateMarketUI(); // Helper function to update visuals
    
    // Re-render Shop
    const grid = document.getElementById('shopGrid');
    if(grid) renderShop(products); 
};

// Helper to update Button Visuals (Called on switch AND load)
function updateMarketUI() {
    const btnStudent = document.getElementById('btn-student');
    const btnB2B = document.getElementById('btn-b2b'); 
    const searchInput = document.getElementById('searchInput');
    
    if(btnStudent && btnB2B) {
        if(currentMarket === 'student') {
            btnStudent.classList.add('active');
            btnB2B.classList.remove('active');
            if(searchInput) searchInput.placeholder = "Search for drafting tools, lab coats, books...";
        } else {
            btnB2B.classList.add('active');
            btnStudent.classList.remove('active');
            if(searchInput) searchInput.placeholder = "Search for bulk stationery, furniture, lab equipment...";
        }
    }
}

/* ====================
   2. APP LOGIC
   ==================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore correct tab UI on load
    updateMarketUI();

    // 2. Initialize Shop Grid with correct market
    const grid = document.getElementById('shopGrid');
    if(grid) {
        renderShop(products);
        initFilters();
    }

    // 3. Initialize Live Deals
    const dealsTrack = document.getElementById('liveDealsTrack');
    if(dealsTrack) {
        initLiveDeals();
    }
});

// 1. RENDER FUNCTION (Updated to Open Modal)
// 1. RENDER FUNCTION (Updated with Quantity & Direct Button)
/* ====================
   RENDER FUNCTION (Updated for Routing & Cart)
   ==================== */
/* ====================
   RENDER FUNCTION (With Quantity)
   ==================== */
function renderShop(items) {
    const grid = document.getElementById('shopGrid');
    if(!grid) return;
    
    grid.innerHTML = ""; 

    let filteredItems = items.filter(p => p.type === currentMarket);

    // Check Category
    const activeChip = document.querySelector('.chip.active');
    if(activeChip && activeChip.dataset.cat !== 'all') {
        filteredItems = filteredItems.filter(p => p.category === activeChip.dataset.cat);
    }

   if(filteredItems.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; animation: fadeIn 0.5s;">
                <div style="font-size:3rem; margin-bottom:15px; opacity:0.8;">🔍</div>
                <h3 style="color:var(--primary); margin-bottom:10px; font-weight:800;">We couldn't find that item.</h3>
                <p style="color:var(--text-muted); margin-bottom:25px;">But don't worry! You can request it specifically.</p>
                <button onclick="document.getElementById('request-section').scrollIntoView({behavior: 'smooth', block: 'center'})" 
                    style="background:var(--brand); color:white; border:none; padding:12px 30px; border-radius:50px; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(16, 185, 129, 0.2); transition: transform 0.2s;">
                    Request This Item <i class="fas fa-arrow-down" style="margin-left:8px;"></i>
                </button>
            </div>`;
        return;
    }

    filteredItems.forEach(p => {
        // Build the Standard Card Component First
        const isB2B = p.type === 'b2b';
        const sellerLabel = isB2B ? `🏭 ${p.seller}` : `👤 ${p.seller}`;
        
        // Badges Logic
        let badgesHtml = '';
        if(isB2B) {
            badgesHtml = `<span class="badge-b2b">MOQ: ${p.moq}</span><span class="badge-b2b">GST Invoice</span>`;
        } else if (p.condition !== 'New') {
            badgesHtml = `<span style="background:#ecfdf5; color:#059669; font-size:0.7rem; padding:4px 8px; border-radius:4px; font-weight:700;">Pre-owned</span>`;
        }
        if (p.originalPrice) {
            const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badgesHtml += `<span style="background: #ef4444; color: white; font-size: 0.75rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; margin-right: 5px; margin-left: 5px;">${discount}% OFF</span>`;
        }

        // Action Buttons Logic
        let actionButtonsHtml = '';
        if (p.isCustomizable) {
            actionButtonsHtml = `
                <div class="card-action-row">
                    <button class="btn-add-cart compact" onclick="window.location.href='product.html?id=${p.id}'" style="background: var(--brand-b2b); width: 100%;">
                        Customize <i class="fas fa-edit" style="margin-left:5px;"></i>
                    </button>
                </div>`;
        } else {
            actionButtonsHtml = `
                <div class="card-action-row" onclick="event.stopPropagation()">
                    <div class="qty-selector-sm">
                        <button class="q-btn" onclick="updateCardQty(${p.id}, -1)">-</button>
                        <span id="qty-${p.id}" class="q-val">1</span>
                        <button class="q-btn" onclick="updateCardQty(${p.id}, 1)">+</button>
                    </div>
                    <button class="btn-add-cart compact" onclick="addToCart(${p.id}, getQty(${p.id}))" style="background: ${isB2B ? 'var(--brand-b2b)' : 'var(--brand)'};">
                        Add
                    </button>
                </div>`;
        }

        const cardHtml = `
       <div class="product-card" id="product-card-${p.id}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
            <div class="card-img-box">
              <img src="${p.image}" alt="${p.title}" loading="lazy" width="300" height="300">
            </div>
            <div class="card-details">
                <div class="card-header-row">
                    <span class="card-cat">${p.category}</span>
                    <span class="card-seller">${sellerLabel}</span>
                </div>
                <h3 class="card-title">${p.title}</h3>
                <div style="margin-bottom:10px;">${badgesHtml}</div>
                <div class="price-row" style="justify-content: flex-start; gap: 10px;">
                    <span class="price">₹${p.price}</span>
                    ${p.originalPrice ? `<span style="text-decoration:line-through; color:#94a3b8; font-size:0.9rem;">₹${p.originalPrice}</span>` : ''}
                </div>
                ${actionButtonsHtml}
            </div>
        </div>
        `;

        // --- STEP 1: Append standard card normally ---
        grid.innerHTML += cardHtml;

        // --- STEP 2: Safe Carousel Injection ---
        if (p.id === 99 && p.includedBooks) {
            const doubleBooks = [...p.includedBooks, ...p.includedBooks];
            let flowItemsHtml = doubleBooks.map(book => `
                <div class="flow-card" style="flex: 0 0 260px; height: 420px; margin: 15px 10px;" onclick="this.classList.toggle('flipped')">
                    <div class="flow-card-inner">
                        <div class="flow-front" style="border-radius: 16px; border: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                            <div style="height: 55%; width: 100%; background: #f8fafc; padding: 15px; display: flex; justify-content: center; align-items: center;">
                                <img src="${book.frontImage}" alt="${book.title}" style="max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">
                            </div>
                            <div style="height: 45%; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; background: white;">
                                <div>
                                    <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${book.title}</h3>
                                    <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 8px;">
                                        <span style="font-size: 1.2rem; font-weight: 800; color: #10b981;">₹${book.sp}</span>
                                        <span style="font-size: 0.85rem; color: #94a3b8; text-decoration: line-through;">₹${book.mrp}</span>
                                    </div>
                                </div>
                                <button style="width: 100%; background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 8px;" 
                                        onclick="event.stopPropagation(); window.addSingleBook('${book.title.replace(/'/g, "\\'")}', ${book.sp}, '${book.frontImage}')">
                                    <i class="fas fa-cart-plus"></i> Add Book
                                </button>
                            </div>
                        </div>
                        <div class="flow-back" style="border-radius: 16px; border: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transform: rotateY(180deg);">
                            <div style="height: 80%; width: 100%; background: #fdfdfd; display: flex; justify-content: center; align-items: center; padding: 15px;">
                                <img src="${book.backImage}" onerror="this.src='${book.frontImage}'" alt="Back Cover" 
                                     style="width: 90%; height: 90%; object-fit: contain; transform: scale(1.1); filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15));">
                            </div>
                            <div style="height: 20%; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-top: 1px solid #f1f5f9;">
                                <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Tap to flip back</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            const carouselHtml = `
            <div style="grid-column: 1 / -1; transform: translateY(-25px); position: relative; z-index: 10; width: 100%;">
                <div style="background: #ffffff; padding: 15px; border-top: 1px solid #e2e8f0; border-left: 5px solid #10b981; box-shadow: 0 -4px 10px rgba(0,0,0,0.03);">
                    <h3 style="margin: 0; font-size: 1.1rem; color: #1e293b;">Individual Books from this Set</h3>
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Click <strong>"Add Book"</strong> to buy separately.</p>
                </div>
                
                <div id="flowing-scroll-container" style="width: 100%; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;">
                    <style>#flowing-scroll-container::-webkit-scrollbar { display: none; }</style>
                    <div id="main-feed-flowing-track" style="display: flex; width: max-content; gap: 15px; padding: 10px 0 20px 0;">
                        ${flowItemsHtml}
                    </div>
                </div>
            </div>
            `;
            grid.innerHTML += carouselHtml;
        }
    });

    // --- STEP 3: Reboot the Animation Engine ---
    setTimeout(() => {
        if (typeof window.initInlineFlow === 'function') {
            window.initInlineFlow();
        }
    }, 100);
}

// --- NEW: INLINE FLOW ENGINE (Relocated from product.html) ---
window.initInlineFlow = function() {
    const container = document.getElementById('flowing-scroll-container');
    if (!container) return;

    let isFeedFlowing = true;

    // Pause logic for manual interaction
    container.addEventListener('mouseenter', () => isFeedFlowing = false);
    container.addEventListener('mouseleave', () => isFeedFlowing = true);
    container.addEventListener('touchstart', () => isFeedFlowing = false);
    container.addEventListener('touchend', () => {
        setTimeout(() => isFeedFlowing = true, 800); // Wait a moment after swipe before resuming
    });

    // Cancel any old animations to prevent speed-up bugs
    if (window.flowAnimationId) cancelAnimationFrame(window.flowAnimationId);

    function playFlow() {
        if (isFeedFlowing) {
            container.scrollLeft += 1; // Adjust speed here (1 is smooth)
            
            // Infinite Loop Reset: If we scroll past halfway, jump seamlessly back to start
            if (container.scrollLeft >= container.scrollWidth / 2) {
                container.scrollLeft = 0;
            }
        }
        window.flowAnimationId = requestAnimationFrame(playFlow);
    }
    playFlow();
};


// 4. FILTERS (Keep existing)
function initFilters() {
    const chips = document.querySelectorAll('.chip');
    const search = document.getElementById('searchInput');

    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            chips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            const cat = e.target.dataset.cat.toLowerCase();
            const filtered = cat === 'all' ? products : products.filter(p => p.category.toLowerCase() === cat);
            renderShop(filtered);
        });
    });

    if(search) {
        search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = products.filter(p => 
                p.title.toLowerCase().includes(term) || 
                p.category.toLowerCase().includes(term)
            );
            renderShop(filtered);
        });
    }
}


//
// NEW: Update Quantity on Card
window.updateCardQty = (id, change) => {
    const qtyEl = document.getElementById(`card-qty-${id}`);
    if(!qtyEl) return;
    
    let currentQty = parseInt(qtyEl.innerText);
    let newQty = currentQty + change;
    
    // Limits: Min 1, Max 10
    if (newQty < 1) newQty = 1;
    if (newQty > 10) newQty = 10;
    
    qtyEl.innerText = newQty;
};

// NEW: WhatsApp Logic for Card Button (Reads Card Quantity)
window.openCardWhatsApp = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    // Get the quantity specifically from the card's input
    const qty = document.getElementById(`card-qty-${id}`).innerText;
    
    // Calculate total price
    const total = p.price * parseInt(qty);

    const adminNumber = "919874796057"; // Your Admin Number
    const campusName = "IEM Salt Lake"; 

    const message = `Hi Campus Team, I’m interested in the following product:

Product Name: ${p.title}
Price: ₹${p.price}
Product ID: ${p.id}
Quantity: ${qty}
Total Value: ₹${total}
Campus: ${campusName}
Source: Campus Marketplace App

Please help me connect and proceed further.`;

    const url = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
// ====================
// 5. LIVE DEALS LOGIC
// ====================
// ====================
// 5. LIVE DEALS LOGIC (Hybrid: Auto-Scroll + Swipe)
// ====================
function initLiveDeals() {
    const track = document.getElementById('liveDealsTrack');
    if(!track) return;
    
    const container = track.parentElement; // The scrollable wrapper
    
    // 1. Data Setup (Use window.products to ensure data access)
    const allProducts = window.products || [];
    const dealItems = allProducts.slice(0, 6); // Top 6 Items

    // 2. Card HTML Generator
    const generateCards = (items) => {
        return items.map(p => {
            const original = p.originalPrice || Math.floor(p.price * 1.3);
            const discount = Math.round(((original - p.price) / original) * 100);
            return `
            <div class="deal-card">
                <div class="deal-badge">-${discount}% OFF</div>
                <img src="${p.image}" class="deal-img" alt="${p.title}">
                <h4 class="deal-title">${p.title}</h4>
                <div class="deal-price-box">
                    <span class="deal-price">₹${p.price}</span>
                    <span class="deal-original">₹${original}</span>
                </div>
                <div class="btn-grab-deal" onclick="goToProduct(${p.id})">
                    <i class="fas fa-bolt"></i> GRAB DEAL
                </div>
            </div>`;
        }).join('');
    };

    // 3. Render 3 Sets (Buffer | Viewable | Buffer) for seamless infinite loop
    track.innerHTML = generateCards(dealItems) + generateCards(dealItems) + generateCards(dealItems);

    // 4. Animation Engine
    let isPaused = false;
    const speed = 0.8; // Pixels per frame (Adjust for speed)

    const animate = () => {
        if (!isPaused) {
            // Auto-increment scroll position
            container.scrollLeft += speed;
        }

        // INFINITE LOOP LOGIC:
        // We have 3 sets of data. When we scroll past the first set (1/3 of total width),
        // we instantly jump back to 0 (start). Since Set 1 and Set 2 are identical, this is invisible.
        const oneSetWidth = track.scrollWidth / 3;
        
        if (container.scrollLeft >= oneSetWidth) {
            container.scrollLeft -= oneSetWidth; // Jump back
        } else if (container.scrollLeft <= 0) {
            // Optional: Handle reverse scroll if needed (scrolling left past 0)
        }

        requestAnimationFrame(animate);
    };

    // Start the loop
    requestAnimationFrame(animate);

    // 5. User Interaction (Pause & Resume)
    const pause = () => isPaused = true;
    const resume = () => isPaused = false;

    // Desktop Mouse
    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);

    // Mobile Touch (Better UX: Pause on touch, Resume after delay)
    container.addEventListener('touchstart', () => {
        isPaused = true;
    }, { passive: true });

    container.addEventListener('touchend', () => {
        // Wait 2 seconds after user lets go before auto-scrolling again
        setTimeout(() => {
            isPaused = false;
        }, 2000);
    });
}
/* =========================================
   APPEND TO BOTTOM: HERO SEARCH LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const heroInput = document.getElementById('heroSearchInput');
    const heroResults = document.getElementById('heroSearchResults');

    if (heroInput && heroResults) {
        
        // 1. Listen for typing
        heroInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            
            // Hide if empty
            if (val.length === 0) {
                heroResults.classList.remove('active');
                return;
            }

            // Filter Products
            const matches = products.filter(p => 
                p.title.toLowerCase().includes(val) || 
                p.category.toLowerCase().includes(val)
            ).slice(0, 5); // Limit to top 5 results

            renderHeroResults(matches);
        });

        // 2. Render Dropdown
        function renderHeroResults(items) {
            heroResults.innerHTML = '';
            
           if (items.length === 0) {
                // UPDATED: Redirects to Request Section if item is not found
                heroResults.innerHTML = `
                    <div onclick="document.getElementById('request-section').scrollIntoView({behavior: 'smooth', block: 'center'}); document.getElementById('heroSearchResults').classList.remove('active');" 
                         style="padding:20px; text-align:center; cursor:pointer; color:var(--brand); transition:0.2s; background:#f0fdf4;">
                         <i class="fas fa-search-plus" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                         <span style="font-weight:700; color:var(--primary);">Item not found?</span><br>
                         <span style="font-size:0.85rem; text-decoration:underline;">Click here to Request it</span>
                    </div>`;
            } else {
                items.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'h-result-item';
                    div.innerHTML = `
                        <img src="${p.image}" class="h-res-img" alt="${p.title}">
                        <div class="h-res-info">
                            <span class="h-res-title">${p.title}</span>
                            <span class="h-res-price">₹${p.price}</span>
                        </div>
                    `;
                    // Click sets up redirect/scroll
                    div.onclick = () => {
                        goToProduct(p.id);
                    };
                    heroResults.appendChild(div);
                });
            }
            heroResults.classList.add('active');
        }

        // 3. Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!heroInput.contains(e.target) && !heroResults.contains(e.target)) {
                heroResults.classList.remove('active');
            }
        });
    }
});

// Helper: Smart Redirect to Product
function goToProduct(id) {
    // 1. Find the product in the global data
    // We check window.products to ensure we see the data loaded from data.js
    const p = (window.products || products).find(x => x.id === id);
    if (!p) return;

    // 2. Close the Search Dropdown (if open)
    const results = document.getElementById('heroSearchResults');
    if(results) results.classList.remove('active');
    
    // 3. Scroll to the Shop Section first
    const shopSection = document.getElementById('shop-section');
    if(shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });

    // 4. CHECK & SWITCH MARKET if needed
    // We check localStorage to see what mode is currently active
    const activeMarket = localStorage.getItem('activeMarket') || 'student';
    
    if (activeMarket !== p.type) {
        // If the item is B2B but we are in Student mode (or vice versa), switch it.
        switchMarket(p.type); 
    }

    // 5. WAIT for the Grid to Render, then Scroll & Highlight the Card
    setTimeout(() => {
        const card = document.getElementById(`product-card-${id}`);
        if(card) {
            // Scroll the card exactly into the middle of the screen
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Apply Visual Highlight (Green Pulse)
            card.style.transition = "0.3s";
            card.style.transform = "scale(1.05)";
            card.style.boxShadow = "0 0 0 4px #10b981"; // Green ring
            card.style.zIndex = "10"; // Bring to front
            
            // Remove Highlight after 1.5 seconds
            setTimeout(() => {
                card.style.transform = "none";
                card.style.boxShadow = "none";
                card.style.zIndex = "1";
            }, 1500);
        }
    }, 400); // 400ms delay gives the browser time to render the new market grid
}
/* ====================
   CART LOGIC (Slide-Out & WhatsApp)
   ==================== */

// Open/Close Cart Drawer
window.toggleCart = () => {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
        overlay.classList.toggle('open');
        if(overlay.classList.contains('open')) renderCartItems();
    }
};

// NEW: Add Individual Book from Bundle
window.addSingleBook = function(title, price, image) {
    const customId = 'book_' + Date.now(); // Generate unique ID
    const customProduct = {
        id: customId,
        title: title,
        price: price,
        image: image,
        type: 'student',
        seller: 'Campus Comrade Verified'
    };
    
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    cart.push({ ...customProduct, quantity: 1 });
    
    localStorage.setItem('iemCart', JSON.stringify(cart));
    
    // Sync UI Instantly with Safety Checks
    if (typeof updateCartCount === 'function') updateCartCount();
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof toggleCart === 'function') toggleCart(); 
};

// Add Item with specific quantity AND customization
window.addToCart = (id, quantity = 1, customData = null) => {
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    const product = products.find(p => p.id === id);
    if (!product) return;

    // Check if item exists with EXACT SAME customization (names)
    const existingIndex = cart.findIndex(item => 
        item.id === id && 
        JSON.stringify(item.customData) === JSON.stringify(customData)
    );
    
    if (existingIndex > -1) {
        // If same product AND same names, just increase quantity
        cart[existingIndex].quantity += quantity;
    } else {
        // Otherwise add as new item WITH the customData
        cart.push({ ...product, quantity: quantity, customData: customData });
    }

    localStorage.setItem('iemCart', JSON.stringify(cart));
    updateCartCount();
    toggleCart(); // Open cart to show success
};
// Helper: Update the number shown on the card
window.updateCardQty = (id, change) => {
    const el = document.getElementById(`qty-${id}`);
    if(el) {
        let val = parseInt(el.innerText) + change;
        if(val < 1) val = 1;
        if(val > 10) val = 10; // Max limit
        el.innerText = val;
    }
};

// Helper: Get the current number from the card
window.getQty = (id) => {
    const el = document.getElementById(`qty-${id}`);
    return el ? parseInt(el.innerText) : 1;
};

window.updateQuantity = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    // Strict comparison but ensuring ID is cast to the data type
    const index = cart.findIndex(item => item.id == id);
    if (index !== -1) {
        cart[index].quantity = Math.max(1, (parseInt(cart[index].quantity) || parseInt(cart[index].qty) || 1) + change);
        localStorage.setItem('iemCart', JSON.stringify(cart));
        if (typeof renderCartItems === 'function') renderCartItems();
        if (typeof updateCartCount === 'function') updateCartCount();
    }
};
window.removeFromCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    cart = cart.filter(item => item.id != id);
    localStorage.setItem('iemCart', JSON.stringify(cart));
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof updateCartCount === 'function') updateCartCount();
};
window.updateCartItem = window.updateQuantity;

/* ====================
   3. ORDERS RENDERING (Refactored from orders.html)
   ==================== */
window.renderOrders = async function() {
    const userEmail = localStorage.getItem('currentUserEmail');
    const container = document.getElementById('orders-container');
    const emailDisplay = document.getElementById('user-email-display');

    if (!container) return; // Not on orders page

    if (!userEmail) {
        if (emailDisplay) emailDisplay.style.display = 'none';
        container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-user-lock" style="font-size: 3rem; margin-bottom: 15px; color: #cbd5e1;"></i>
            <h3>No Account Found</h3>
            <p>Place an order first to see history here.</p>
            <a href="index.html" style="display:inline-block; margin-top:15px; color:#2563eb; font-weight:600; text-decoration:none;">Go to Marketplace</a>
        </div>`;
        return;
    }

    if (emailDisplay) {
        emailDisplay.innerHTML = `<i class="fas fa-user-circle" style="color:#2563eb;"></i> Account: ${userEmail}`;
    }

    try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("user_email", "==", userEmail), orderBy("order_date", "desc"));
        const querySnapshot = await getDocs(q);

        container.innerHTML = ""; 

        if (querySnapshot.empty) {
            container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 15px; color: #cbd5e1;"></i>
                <h3>No Orders Yet</h3>
                <p>Your purchase history will appear here.</p>
                <a href="index.html" style="display:inline-block; margin-top:15px; background:#0f172a; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">Start Shopping</a>
            </div>`;
            return;
        }

        // --- NEW: DELIVERY TRANSPARENCY NOTICE ---
        const noticeHtml = `
        <div class="delivery-notice" style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin-bottom: 25px; display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div style="color: #3b82f6; font-size: 1.2rem;">
                    <i class="fas fa-truck-loading"></i>
                </div>
                <div style="font-size: 0.9rem; color: #1e40af; line-height: 1.5;">
                    <strong>Delivery Transparency Notice:</strong><br>
                    Currently all of our deliveries are occurring through Porter or parcel services to ensure transparency. Customers can book the Porter themselves or we can arrange it for them and send the Porter invoice to maintain transparency.
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <a href="https://wa.me/919874796057" target="_blank" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: transform 0.2s;">
                    <i class="fab fa-whatsapp"></i> Help with Delivery
                </a>
            </div>
        </div>`;
        container.innerHTML = noticeHtml;

        // Render List
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.order_date ? data.order_date.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processing...';
            
            // Stepper Logic
            const steps = ['Pending', 'Verified', 'Shipped', 'Delivered'];
            const currentStatus = data.status || 'Pending';
            const currentIndex = steps.indexOf(currentStatus);
            
            let stepperHtml = '';
            if(currentStatus === 'Cancelled') {
                stepperHtml = `<div style="background:#fef2f2; color:#b91c1c; padding:10px; border-radius:8px; text-align:center; margin-top:15px; font-weight:600;"><i class="fas fa-times-circle"></i> This order was cancelled.</div>`;
            } else {
                stepperHtml = `<div class="stepper-wrapper">`;
                steps.forEach((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const icon = isCompleted ? '<i class="fas fa-check"></i>' : (index + 1);
                    stepperHtml += `
                        <div class="stepper-item ${isCompleted ? 'completed' : ''}">
                            <div class="step-circle">${icon}</div>
                            <div class="step-text">${step}</div>
                        </div>`;
                });
                stepperHtml += `</div>`;
            }

            let itemsHtml = data.cart_items.map(i => 
                `<li><i class="fas fa-caret-right"></i> <span>${i.title}</span> <span style="color:#94a3b8; font-size:0.8rem; margin-left:6px;">(x${i.quantity || i.qty || 1})</span></li>`
            ).join('');

            const orderHtml = `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div style="font-weight:700; color:#0f172a; font-size:1rem;">Order #${doc.id.slice(0,6).toUpperCase()}</div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">${date}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800; margin-top:6px; color:#0f172a;">₹${data.total_amount}</div>
                    </div>
                </div>
                <ul class="item-list">
                    ${itemsHtml}
                </ul>
                ${stepperHtml}
                
                <div style="margin-top:15px; padding-top:15px; border-top:1px dashed #e2e8f0; text-align:center;">
                    <a href="contact.html" style="font-size:0.8rem; color:#64748b; text-decoration:none;"><i class="far fa-envelope"></i> Need help with this order?</a>
                </div>
            </div>`;
            
            container.innerHTML += orderHtml;
        });

    } catch (error) {
        console.error(error);
        if (container) container.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444;"><i class="fas fa-exclamation-triangle"></i> Unable to load orders.</div>`;
    }
};

// Render Items inside Drawer
function renderCartItems() {
    const container = document.getElementById('cartBody');
    const priceEl = document.getElementById('cart-final-price');
    const countEl = document.getElementById('cart-total-count');
    
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    
    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; margin-top:40px; color:#64748b;">
            <div style="font-size:3rem; margin-bottom:10px;">🛒</div>
            <p>Your cart is empty</p>
            <button onclick="toggleCart(); document.getElementById('shop-section').scrollIntoView({behavior: 'smooth'});" style="margin-top:15px; background:none; border:1px solid #cbd5e1; padding:8px 16px; border-radius:20px; cursor:pointer;">Start Shopping</button>
        </div>`;
        priceEl.innerText = "₹0";
        countEl.innerText = "0";
        return;
    }

    // Safety Data Sanitization: Kill NaN bugs permanently
    cart.forEach(item => { 
        item.quantity = parseInt(item.quantity) || parseInt(item.qty) || 1; 
        item.price = parseFloat(item.price) || 0; 
    });
    localStorage.setItem('iemCart', JSON.stringify(cart));

    let total = 0;
    let totalQty = 0;
    
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        totalQty += item.quantity;
        
        return `
        <div class="cart-item" style="position: relative; padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; gap: 15px;">
            <button onclick="removeFromCart('${item.id}')" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; padding: 5px;">
                <i class="fas fa-trash-alt"></i>
            </button>
            <div style="width: 60px; height: 80px; flex-shrink: 0;">
                <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div style="flex-grow: 1; padding-right: 20px;">
                <h4 style="margin: 0 0 5px 0; font-size: 0.95rem; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.title}</h4>
                <div style="font-weight: 700; color: #10b981; margin-bottom: 10px;">₹${item.price.toLocaleString()}</div>
                <div style="display: flex; align-items: center; gap: 10px; background: #f1f5f9; width: fit-content; padding: 4px; border-radius: 6px;">
                    <button onclick="updateQuantity('${item.id}', -1)" style="width: 25px; height: 25px; border: none; background: white; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="min-width: 20px; text-align: center; font-size: 0.9rem; font-weight: 600;">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)" style="width: 25px; height: 25px; border: none; background: white; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    localStorage.setItem('cartTotal', total);
    priceEl.innerText = `₹${total.toFixed(0)}`;
    countEl.innerText = totalQty;
}

// Global Cart Badge Updater
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    const totalQty = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const badges = document.querySelectorAll('.cart-badge'); // Select all badges (desktop/mobile)
    badges.forEach(b => b.innerText = totalQty);
}

// Checkout via WhatsApp
window.checkoutWhatsApp = () => {
    let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
    if(cart.length === 0) return;

    let message = "👋 Hi Campus Team, I want to buy these items:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const qty = item.quantity || item.qty || 1;
        message += `${index + 1}. ${item.title} (x${qty}) - ₹${item.price * qty}\n`;
        if(item.customData && item.customData.names) {
            message += `   📝 Custom: ${item.customData.names.join(', ')}\n`;
        }
        total += item.price * qty;
    });

    message += `\n💰 *Total Value: ₹${total}*`;
    message += `\n📍 Pickup: IEM Campus`;

    const adminNumber = "919874796057"; 
    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

// Init on Load
document.addEventListener('DOMContentLoaded', updateCartCount);
/* =========================================
   CHECKOUT MANAGER (Fixed & Upgraded)
   ========================================= */
const CheckoutManager = {
    selectedAddressIndex: null,
    editingIndex: null,
    cartTotal: 0,
    finalAmount: 0,
    currentMode: 'cod',
    merchantVPA: "6290259296@superyes",
    timerInterval: null, 

    // ... (Keep init(), getAddresses(), saveAddresses(), showForm(), showList(), renderList() EXACTLY as before) ...
    // Re-paste them if you are replacing the whole object, or just update the functions below:

    // 1. Init & Address Functions (Standard)
    init() {
        let cart = JSON.parse(localStorage.getItem('iemCart')) || [];
        if(cart.length === 0) { alert("Cart Empty"); window.location.href='index.html'; return; }
        
        // --- NaN Protection Master Logic ---
        this.cartTotal = cart.reduce((acc, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || parseInt(item.qty) || 1;
            return acc + (price * qty);
        }, 0);
        
        localStorage.setItem('cartTotal', this.cartTotal);
        const totalDisplay = document.getElementById('cart-total-display');
        if(totalDisplay) totalDisplay.innerText = `₹${this.cartTotal}`;
        
        // Sync UI to Step 1 Initial State
        const mainHeading = document.getElementById('checkout-main-heading');
        if(mainHeading) mainHeading.innerText = '1. Select Delivery Address';
        const step1 = document.getElementById('step-1-indicator');
        const step2 = document.getElementById('step-2-indicator');
        if(step1) step1.className = 'step-active';
        if(step2) step2.className = 'step-inactive';

        const addresses = this.getAddresses();
        addresses.length === 0 ? this.showForm() : (this.renderList(), this.showList());
    },
    getAddresses() { return JSON.parse(localStorage.getItem('userAddresses')) || []; },
    saveAddresses(arr) { localStorage.setItem('userAddresses', JSON.stringify(arr)); },
    
    // View Switchers
    showForm() {
        document.getElementById('addressListView').style.display = 'none';
        document.getElementById('addressFormView').style.display = 'block';
        document.getElementById('paymentView').style.display = 'none';
        document.getElementById('checkoutFooter').style.display = 'none';
        if (this.editingIndex === null) document.getElementById('checkoutForm').reset();
    },
    showList() {
        document.getElementById('addressListView').style.display = 'block';
        document.getElementById('addressFormView').style.display = 'none';
        document.getElementById('paymentView').style.display = 'none';
        document.getElementById('checkoutFooter').style.display = 'block';

        // Update Stepper UI (Step 1)
        const mainHeading = document.getElementById('checkout-main-heading');
        if(mainHeading) mainHeading.innerText = '1. Select Delivery Address';
        const step1 = document.getElementById('step-1-indicator');
        const step2 = document.getElementById('step-2-indicator');
        if(step1) step1.className = 'step-active';
        if(step2) step2.className = 'step-inactive';

        this.renderList();
        this.updateStickyFooter(); 
    },
    
    // FIX: Restored handleSave function to process the form
    handleSave(e) {
        e.preventDefault();
        
        // 1. Gather Data
        const newAddr = {
            name: document.getElementById('addr-name').value,
            phone: document.getElementById('addr-phone').value,
            college: document.getElementById('addr-college').value,
            email: document.getElementById('addr-email').value,
            street: document.getElementById('addr-street').value,
            landmark: document.getElementById('addr-landmark').value,
            zip: document.getElementById('addr-zip').value
        };

        // 2. Logic to Add or Edit
        const addresses = this.getAddresses();
        if (this.editingIndex !== null) {
            addresses[this.editingIndex] = newAddr;
            this.selectedAddressIndex = this.editingIndex;
            this.editingIndex = null;
        } else {
            addresses.push(newAddr);
            this.selectedAddressIndex = addresses.length - 1; // Auto-select new
        }

        // 3. Save & Update UI
        this.saveAddresses(addresses);
        this.showList();
        this.updateStickyFooter();
    },

    showPayment() {
        if(this.selectedAddressIndex === null) { alert("Select Address"); return; }
        document.getElementById('addressListView').style.display = 'none';
        document.getElementById('checkoutFooter').style.display = 'none';
        document.getElementById('paymentView').style.display = 'block';

        // Update Stepper UI (Step 2)
        const mainHeading = document.getElementById('checkout-main-heading');
        if(mainHeading) mainHeading.innerText = '2. Payment Details';
        const step1 = document.getElementById('step-1-indicator');
        const step2 = document.getElementById('step-2-indicator');
        if(step1) step1.className = 'step-inactive';
        if(step2) step2.className = 'step-active';

        this.handlePaymentChange(); // Init UI
    },

    // --- NEW: HANDLE PAYMENT CHANGE (UI RESET LOGIC) ---
    handlePaymentChange() {
        // 1. Get Selected Mode
        const radios = document.getElementsByName('paymentMode');
        for(const r of radios) { if(r.checked) this.currentMode = r.value; }

        // 2. DOM Elements
        const digitalSection = document.getElementById('digitalPaymentSection');
        const btnMain = document.getElementById('btn-main-action');
        const totalEl = document.getElementById('pay-cart-total');
        const discountRow = document.getElementById('pay-discount-row');
        const finalEl = document.getElementById('pay-final-amount');
        const noteEl = document.getElementById('pay-note');
        
        // 3. Reset UI State (Fix for Bug #1)
        btnMain.innerHTML = `Place Order <i class="fas fa-arrow-right"></i>`;
        btnMain.disabled = false;
        document.getElementById('pay-screenshot').value = ""; // Clear file
        document.getElementById('pay-utr').value = "";
        document.getElementById('user-vpa').value = "";
        document.getElementById('vpa-pay-action').style.display = 'none';

        // 4. Calculate Amounts
        totalEl.innerText = `₹${this.cartTotal}`;
        
        if (this.currentMode === 'cod') {
            // COD STATE
            this.finalAmount = this.cartTotal;
            digitalSection.style.display = 'none'; // Hide all UPI stuff
            if (discountRow) discountRow.style.display = 'none';
            noteEl.innerText = "Cash on Delivery selected. Pay the full amount at your doorstep.";
            noteEl.style.color = "#64748b";
            
        } else {
            // UPI / PARTIAL STATE
            digitalSection.style.display = 'block'; // Show UPI stuff
            
            if (this.currentMode === 'upi') {
                this.finalAmount = this.cartTotal;
                if (discountRow) discountRow.style.display = 'none';
                noteEl.innerText = "Full Payment via UPI. Instant & Secure.";
                noteEl.style.color = "#64748b";
            } else if (this.currentMode === 'partial-cod') {
                // Partial
                this.finalAmount = Math.round(this.cartTotal / 2);
                if (discountRow) discountRow.style.display = 'none';
                noteEl.innerText = `Partial COD: Pay 50% (₹${this.finalAmount}) now, balance (₹${this.cartTotal - this.finalAmount}) on delivery.`;
                noteEl.style.color = "#2563eb";
            }

            // Init QR by default
            this.generateQR();
            this.switchUpiTab('qr');
            btnMain.innerHTML = `Confirm Payment & Place Order <i class="fas fa-check-circle"></i>`;
        }
        
        finalEl.innerText = `₹${this.finalAmount}`;
    },

    // --- UPI TAB LOGIC ---
    switchUpiTab(tab) {
        document.querySelectorAll('.upi-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.upi-content').forEach(c => c.style.display = 'none');
        
        if (tab === 'qr') {
            document.querySelector('.upi-tab:nth-child(1)').classList.add('active');
            document.getElementById('tab-qr').style.display = 'block';
        } else {
            document.querySelector('.upi-tab:nth-child(2)').classList.add('active');
            document.getElementById('tab-vpa').style.display = 'block';
        }
    },

    generateQR() {
        const amount = this.finalAmount.toFixed(2);
        const upiString = `upi://pay?pa=${this.merchantVPA}&pn=CampusComrade&am=${amount}&tn=OrderPayment&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
        
        const qrImg = document.getElementById('upi-qr-image');
        if (qrImg) qrImg.src = qrUrl;
        
        const amtDisplay = document.getElementById('qr-amount-display');
        if (amtDisplay) amtDisplay.innerText = `₹${amount}`;
        
        // --- NEW: MOBILE DEEP LINK ---
        const deepLinkBtn = document.getElementById('mobile-upi-link');
        if (deepLinkBtn) {
            deepLinkBtn.href = upiString;
            deepLinkBtn.style.display = 'inline-flex';
        }

        this.startTimer(); // Start the 10-minute timer
    },

    generateLinkFromVpa() {
        const userVpa = document.getElementById('user-vpa').value;
        if(userVpa.length < 5) { alert("Enter valid UPI ID"); return; }
        
        // We generate the link for THEM to pay US
        const amount = this.finalAmount.toFixed(2);
       const link = `upi://pay?pa=${this.merchantVPA}&pn=CampusComrade&am=${amount}&tn=From_${userVpa}&cu=INR`;
        
        const btn = document.getElementById('vpa-pay-link');
        btn.href = link;
        document.getElementById('vpa-pay-action').style.display = 'block';
    },
// --- NEW: TIMER LOGIC ---
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timerDisplay = document.getElementById('qr-timer-val');
        if (!timerDisplay) return;

        // Set 10 Minutes (600 seconds)
        let timeLeft = 600; 
        
        // Helper to format time as MM:SS
        const updateDisplay = () => {
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        updateDisplay(); // Run once immediately

        this.timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                timerDisplay.innerText = "EXPIRED";
                document.querySelector('.payment-timer').style.background = "#fee2e2";
                alert("⚠️ Payment Session Expired. Please refresh page.");
            }
        }, 1000);
    },
    // --- NEW: EMAIL FORMATTER ---
    formatOrderEmail(addr, cart, totals, mode, utr) {
        let itemsList = cart.map((item, i) => 
            `${i+1}. ${item.title} | Qty: ${item.qty} | ₹${item.price * item.qty}`
        ).join('\n');

        return `
📦 NEW ORDER RECEIVED
--------------------------------
👤 CUSTOMER DETAILS
Name: ${addr.name}
Phone: ${addr.phone}
College: ${addr.college}
Address: ${addr.street}, ${addr.zip}

🛒 ORDER ITEMS
${itemsList}

💰 PAYMENT SUMMARY
Mode: ${mode.toUpperCase()}
Total Cart Value: ₹${totals.cartTotal}
Amount Paid Now: ₹${totals.finalAmount}
Amount Due on Delivery: ₹${totals.cartTotal - totals.finalAmount}
--------------------------------
Transaction ID/UTR: ${utr || 'N/A'}
        `.trim();
    },

async processCheckout() {
        const btn = document.getElementById('btn-main-action');
        
        // Safety Checks
        if (this.selectedAddressIndex === null || !this.getAddresses()[this.selectedAddressIndex]) {
            alert("⚠️ Please select a delivery address.");
            return;
        }
        const fileInput = document.getElementById('pay-screenshot');
        if (this.currentMode !== 'cod' && (!fileInput.files || fileInput.files.length === 0)) {
            alert("⚠️ Please upload the payment screenshot.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

        try {
            const addr = this.getAddresses()[this.selectedAddressIndex];
            const cart = JSON.parse(localStorage.getItem('iemCart')) || [];
            localStorage.setItem('currentUserEmail', addr.email); 

            let imageBase64 = "N/A"; 

            if (this.currentMode !== 'cod' && fileInput.files.length > 0) {
                imageBase64 = await compressImage(fileInput.files[0]);
            }

            // Save to Firestore
            const orderData = {
                customer_details: addr,
                cart_items: cart,
                payment_mode: this.currentMode,
                total_amount: this.finalAmount,
                payment_proof: imageBase64,
                status: "Pending",
                user_email: addr.email,
                order_date: serverTimestamp()
            };

            // --- NEW: BALANCE DUE LOGIC ---
            if (this.currentMode === 'partial-cod') {
                const totalValue = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                orderData.total_cart_value = totalValue;
                orderData.balance_due = totalValue - this.finalAmount;
            }

            await addDoc(collection(db, "orders"), orderData);

            // --- SUCCESS FLOW START ---
            localStorage.removeItem('iemCart');
            
            // Show Success Modal
            const successModal = document.getElementById('paymentSuccessModal');
            if(successModal) {
                successModal.style.display = 'flex';
                // Delay redirect so user sees the confirmation
                setTimeout(() => {
                    window.location.href = "orders.html?success=true";
                }, 3000);
            } else {
                window.location.href = "orders.html?success=true";
            }
            // --- SUCCESS FLOW END ---

        } catch (error) {
            console.error("Error:", error);
            alert("❌ Order Failed: " + error.message);
            btn.disabled = false;
            btn.innerHTML = "Retry";
        }
    },
    
    // --- (Paste previous helper functions like handleEdit, handleDelete, updateStickyFooter here) ---
    // Minimal re-implementation for context:
    handleEdit(index) {
        this.editingIndex = index;
        const addr = this.getAddresses()[index];
        document.getElementById('addr-name').value = addr.name;
        document.getElementById('addr-phone').value = addr.phone;
        document.getElementById('addr-college').value = addr.college;
        document.getElementById('addr-email').value = addr.email;
        document.getElementById('addr-street').value = addr.street;
        document.getElementById('addr-landmark').value = addr.landmark;
        document.getElementById('addr-zip').value = addr.zip;
        this.showForm();
    },
    handleDelete(index) {
        if(confirm("Delete?")) {
            const arr = this.getAddresses();
            arr.splice(index, 1);
            this.saveAddresses(arr);
            this.selectedAddressIndex = null;
            this.renderList();
        }
    },
    renderList() {
        const container = document.getElementById('savedAddressGrid');
        const addresses = this.getAddresses();
        container.innerHTML = '';
        if (addresses.length === 0) { this.showForm(); return; }
        addresses.forEach((addr, index) => {
            const isSelected = this.selectedAddressIndex === index;
            const card = document.createElement('div');
            card.className = `address-card ${isSelected ? 'selected' : ''}`;
            card.onclick = () => { this.selectedAddressIndex = index; this.renderList(); this.updateStickyFooter(); };
            card.innerHTML = `
                <div><div class="addr-header"><span class="addr-name">${addr.name}</span></div><div class="addr-text">${addr.street}</div></div>
                <div class="addr-actions"><button class="btn-addr-action" onclick="event.stopPropagation(); CheckoutManager.handleEdit(${index})">Edit</button><button class="btn-addr-action delete" onclick="event.stopPropagation(); CheckoutManager.handleDelete(${index})">Delete</button></div>`;
            container.appendChild(card);
        });
    },
    updateStickyFooter() {
        const btn = document.getElementById('btnFinalPay');
        const summary = document.getElementById('summaryName');
        const addresses = this.getAddresses();
        if (this.selectedAddressIndex !== null && addresses[this.selectedAddressIndex]) {
            btn.classList.remove('disabled');
            btn.onclick = () => this.showPayment();
            summary.innerText = addresses[this.selectedAddressIndex].name;
        } else {
            btn.classList.add('disabled');
            summary.innerText = "Select an address...";
        }
    }
    
};
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 800; // Resize to 800px width
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress quality to 60%
            };
        };
        reader.onerror = (error) => reject(error);
    });
}
window.goToProduct = goToProduct;
window.CheckoutManager = CheckoutManager;
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.updateCardQty = updateCardQty;
window.getQty = getQty;
window.updateCartItem = updateCartItem;
window.switchMarket = switchMarket;
window.checkoutWhatsApp = checkoutWhatsApp;
window.openCardWhatsApp = openCardWhatsApp;