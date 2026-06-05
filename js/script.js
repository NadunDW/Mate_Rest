// --- SHOPPING CART STATE ENGINE ---

// Load cart items from local storage, or start fresh with an empty list
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

// Save current cart state to local storage
function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

// Function to handle color swatch selection styling
function selectSwatch(swatchElement) {
    const parentRow = swatchElement.closest('.color-swatches');
    if (parentRow) {
        parentRow.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('selected'));
    }
    swatchElement.classList.add('selected');
    
    // Clear error style if present
    const selectionContainer = swatchElement.closest('.color-selection-row');
    if (selectionContainer) {
        selectionContainer.classList.remove('error');
    }
}

// Add an item to the cart (enforcing color selection first)
function handleAddToCart(name, price, buttonElement) {
    const productCard = buttonElement.closest('.product-card');
    const selectedSwatch = productCard ? productCard.querySelector('.color-swatch.selected') : null;
    
    if (!selectedSwatch) {
        // Enforce color selection with error feedback
        const selectionRow = productCard ? productCard.querySelector('.color-selection-row') : null;
        if (selectionRow) {
            selectionRow.classList.add('error');
            const label = selectionRow.querySelector('.color-label');
            const originalText = label.textContent;
            
            label.textContent = "Please select a color first!";
            setTimeout(() => {
                selectionRow.classList.remove('error');
                label.textContent = originalText;
            }, 2000);
        }
        return;
    }

    const selectedColor = selectedSwatch.getAttribute('data-color');
    const itemKey = `${name} (${selectedColor})`;
    const existingItem = cartItems.find(item => item.itemKey === itemKey);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({ 
            itemKey: itemKey,
            name: name, 
            price: price, 
            color: selectedColor,
            quantity: 1,
            checked: false
        });
    }
    
    saveCart();
    updateCartInterface();

    // Button micro-interaction visual feedback
    if (buttonElement) {
        buttonElement.style.backgroundColor = '#0f766e';
        buttonElement.style.color = '#ffffff';
        buttonElement.textContent = 'Added! ✓';
        buttonElement.disabled = true;

        setTimeout(() => {
            buttonElement.style.backgroundColor = '';
            buttonElement.style.color = '';
            buttonElement.textContent = 'Add To Cart';
            buttonElement.disabled = false;
        }, 1200);
    }
}

// Change the quantity of an item (+1 or -1)
function changeQty(index, offset) {
    if (index >= 0 && index < cartItems.length) {
        cartItems[index].quantity += offset;
        
        // If quantity drops to 0 or below, remove the item completely
        if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
        }
        
        saveCart();
        updateCartInterface();
    }
}

// Remove an item entirely from the cart
function removeCartItem(index) {
    if (index >= 0 && index < cartItems.length) {
        cartItems.splice(index, 1);
        saveCart();
        updateCartInterface();
    }
}

// Toggle individual item check box selection state
function toggleItemSelection(index) {
    if (index >= 0 && index < cartItems.length) {
        cartItems[index].checked = !cartItems[index].checked;
        saveCart();
        updateCartInterface();
    }
}

// Toggle "Select All" checkbox state
function toggleSelectAll(selectAllCheckbox) {
    const isChecked = selectAllCheckbox.checked;
    cartItems.forEach(item => {
        item.checked = isChecked;
    });
    saveCart();
    updateCartInterface();
}

// Delete all selected checked items in one click
function deleteSelectedItems() {
    // Retain only unchecked items
    cartItems = cartItems.filter(item => !item.checked);
    saveCart();
    updateCartInterface();
}

// Update the UI: refresh the badge number, sidebar items, and total amount
function updateCartInterface() {
    const cartBadge = document.getElementById('cartBadge');
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');

    const aggregateCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Update navigation badge count
    if (cartBadge) {
        if (aggregateCount > 0) {
            cartBadge.textContent = aggregateCount;
            cartBadge.classList.add('visible');
        } else {
            cartBadge.classList.remove('visible');
        }
    }

    // Render cart items inside sidebar
    if (cartBody) {
        if (cartItems.length === 0) {
            cartBody.innerHTML = `
                <div class="cart-empty">
                    <span class="cart-empty-icon">🛒</span>
                    Your cart is completely empty. Start adding some comfort styles to your bed!
                </div>`;
        } else {
            // Check if all items are selected
            const allSelected = cartItems.every(item => item.checked);
            const anySelected = cartItems.some(item => item.checked);

            let headerHTML = `
                <div class="cart-selection-header">
                    <label class="select-all-label">
                        <input type="checkbox" id="selectAllCheckbox" class="cart-checkbox" onclick="toggleSelectAll(this)" ${allSelected ? 'checked' : ''}>
                        <span>Select All</span>
                    </label>
                    <button class="delete-selected-btn" id="deleteSelectedBtn" onclick="deleteSelectedItems()" ${anySelected ? '' : 'disabled'}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Delete Selected
                    </button>
                </div>
            `;

            let itemsHTML = '';
            cartItems.forEach((item, index) => {
                const combinedLineCost = item.price * item.quantity;
                itemsHTML += `
                    <div class="cart-item-row-wrapper">
                        <input type="checkbox" class="cart-checkbox" onclick="toggleItemSelection(${index})" ${item.checked ? 'checked' : ''}>
                        <div class="cart-item-card">
                            <div class="cart-item-top">
                                <span class="cart-item-name">${item.name} <span style="font-size:0.8rem; font-weight:500; color:#9ca3af;">(${item.color})</span></span>
                                <span class="cart-item-price">$${combinedLineCost.toFixed(2)}</span>
                            </div>
                            <div class="cart-item-bottom">
                                <div class="qty-controls">
                                    <button class="qty-btn" onclick="changeQty(${index}, -1)">&minus;</button>
                                    <span class="qty-number">${item.quantity}</span>
                                    <button class="qty-btn" onclick="changeQty(${index}, 1)">&plus;</button>
                                </div>
                                <button class="remove-item-btn" onclick="removeCartItem(${index})">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            cartBody.innerHTML = headerHTML + itemsHTML;
        }
    }

    // Update subtotal amount
    if (cartTotal) {
        const currentTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        cartTotal.textContent = `$${currentTotal.toFixed(2)}`;
    }
}

// Setup Event Listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // --- RESPONSIVE MOBILE NAVIGATION TOGGLE (HAMBURGER) ---
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    const cartWrapper = document.querySelector('.cart-wrapper');
    
    if (navbar && navLinks) {
        // Create controls wrapper
        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        
        // Create hamburger button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.setAttribute('aria-label', 'Toggle Navigation Menu');
        menuToggle.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        
        // Move cartWrapper inside headerControls
        if (cartWrapper) {
            headerControls.appendChild(cartWrapper);
        }
        
        // Append hamburger inside headerControls
        headerControls.appendChild(menuToggle);
        
        // Append headerControls directly inside navbar
        navbar.appendChild(headerControls);
        
        // Toggle menu action
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('mobile-open');
            menuToggle.classList.toggle('active');
        });
        
        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('mobile-open');
                menuToggle.classList.remove('active');
            }
        });
        
        // Close menu on link clicks
        navLinks.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                menuToggle.classList.remove('active');
            });
        });
    }

    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const cartBtn = document.getElementById('cartBtn');
    const cartClose = document.getElementById('cartClose');

    if (cartBtn && sidebar && overlay) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.add('open');
            overlay.classList.add('open');
        });
    }

    if (cartClose && sidebar && overlay) {
        cartClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Scroll to top button handling
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        // Show/hide button on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // Smooth scroll to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Initial load sync
    updateCartInterface();
});