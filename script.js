// =======================================================
// GLOBAL VARIABLE DEFINITIONS (MUST BE FIRST)
// =======================================================

// 1. Mobile Menu setup
var MenuItems = document.getElementById("MenuItems");
// Check if MenuItems exists (only on pages with the menu)
if (MenuItems) {
    MenuItems.style.maxHeight = "0px";
}

// 2. Cart Items state
// Load existing cart items from Local Storage, or start with an empty array
let cartItems = JSON.parse(sessionStorage.getItem('cart')) || [];


// =======================================================
// HELPER FUNCTIONS
// =======================================================

function menutoggle() {
    if (MenuItems.style.maxHeight == "0px") {
        MenuItems.style.maxHeight = "200px";
    } else {
        MenuItems.style.maxHeight = "0px";
    }
}

function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(cartItems));
}


// =======================================================
// PRODUCTS PAGE LOGIC (ADD TO CART)
// =======================================================

function addToCart(product) {
    const priceValue = parseFloat(product.price);
    if (isNaN(priceValue)) {
        alert('Invalid product price.');
        return;
    }

    const existingItem = cartItems.find(item => item.name === product.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartCount();

    alert(`Item ${product.name} Added to the Bag!`);
}


// =======================================================
// CART PAGE LOGIC (DISPLAY & UPDATE)
// =======================================================

function updateCheckoutButton() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;
    
    // Check if cartItems array has any items with quantity > 0
    const hasItems = cartItems.some(item => (parseInt(item.quantity) || 0) > 0);
    
    // Enable the button only if the cart has items
    checkoutBtn.disabled = !hasItems;

    // Optional: Add a class to style the button differently when disabled
    if (checkoutBtn.disabled) {
        checkoutBtn.classList.add('disabled');
    } else {
        checkoutBtn.classList.remove('disabled');
        // You might want to add a proper redirect for checkout here:
        checkoutBtn.addEventListener('click', () => { 
             window.location.href = 'checkout.html'; 
         }, { once: true }); // Use { once: true } or remove listener if re-added in displayCart
    }
}

function attachCartEventListeners() {
    // 1. Remove Item Listener
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const itemName = e.target.getAttribute('data-name');
            cartItems = cartItems.filter(item => item.name !== itemName);
            saveCart();
            displayCart(); 
        });
    });

    // 2. Quantity Change Listener
    document.querySelectorAll('.item-quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const itemName = e.target.getAttribute('data-name');
            const newQuantity = parseInt(e.target.value);
            
            const item = cartItems.find(i => i.name === itemName);
            if (item) {
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                } else {
                    cartItems = cartItems.filter(i => i.name !== itemName);
                }
                saveCart();
                displayCart(); 
            }
        });
    });
}

function displayCart() {
    const cartBody = document.getElementById('cart-body');
    if (!cartBody) return; 

    cartBody.innerHTML = ''; 
    let subtotal = 0;

    cartItems.forEach(item => {
        // Ensure price is a number, defaulting to 0 if invalid
        const itemPrice = parseFloat(item.price) || 0; 
        
        // Ensure quantity is an integer, defaulting to 0 if invalid
        const itemQuantity = parseInt(item.quantity) || 0; 

        if (itemPrice > 0 && itemQuantity > 0) {
            const itemTotal = itemPrice * itemQuantity;
            subtotal += itemTotal;

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>
                    <div class="cart-info">
                        <img src="${item.image || ''}" alt="${item.name}">
                        <div>
                            <p>${item.name || 'Unknown Product'}</p>
                            <small>Price: ₱${itemPrice.toFixed(2)}</small>
                            <br>
                            <small class="remove-item" data-name="${item.name}">Remove</small>
                        </div>
                    </div>
                </td>
                <td>
                    <input type="number" value="${itemQuantity}" min="1" 
                           data-name="${item.name}" class="item-quantity-input">
                </td>
                <td>₱${itemTotal.toFixed(2)}</td>
            `;
            cartBody.appendChild(newRow);
        }
    });
    
    // Update Subtotal display
    const subtotalElement = document.getElementById('cart-subtotal');
    if(subtotalElement) {
        subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
    }

    const totalElement = document.getElementById('cart-total');
    if(totalElement) {
        totalElement.textContent = `₱${subtotal.toFixed(2)}`;
    }
    
    attachCartEventListeners();
    updateCartCount();
    updateCheckoutButton();
}

// =======================================================
// CART COUNT
// ======================================================

function updateCartCount() {
    // Calculate the total number of items (total quantity)
    const totalItems = cartItems.reduce((total, item) => {
        // Ensure quantity is treated as a number
        return total + (parseInt(item.quantity) || 0); 
    }, 0);

    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        
        // Show or hide the badge based on the item count
        if (totalItems > 0) {
            cartCountElement.style.display = 'block';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}


// =======================================================
// INITIALIZATION
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // Logic for Add to Cart buttons (on products.html)
    const addButtons = document.querySelectorAll('.add-to-cart');
    if (addButtons.length > 0) {
        addButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productDiv = e.target.closest('.col-4');

                if (productDiv) {
                    const product = {
                        name: productDiv.getAttribute('data-name'),
                        price: productDiv.getAttribute('data-price'), // Keep as string for now
                        image: productDiv.getAttribute('data-image')
                    };
                    addToCart(product);
                }
            });
        });
    }
    updateCartCount();
    // Logic for displaying the cart (on cart.html)
    displayCart();
    updateCheckoutButton();

    const orderForm = document.getElementById('orderForm');
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');

    if (orderForm) {
        // Initial summary display
        updateOrderSummary(); 

        // Listener for payment method changes
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', updateOrderSummary);
        });

        // Listener for form submission
        orderForm.addEventListener('submit', handleOrderSubmission);
    }

});

// =======================================================
// CHECKOUT PAGE LOGIC
// ======================================================

// Define mock shipping costs
const SHIPPING_COST_COD = 50.00; // Example Philippine Pesos (₱)
const SHIPPING_COST_PICKUP = 0.00; // Pickup has no shipping cost

function toggleShippingDetails(paymentMethod) {
    // 1. Get references to the specific inputs and the container
    const shippingContainer = document.getElementById('shippingDetailsContainer');
    // Assuming you updated checkout.html with id="addressInput"
    const addressInput = document.getElementById('addressInput'); 
    
    // We assume fullName and phoneInput remain visible, so we don't grab them here.
    
    if (!shippingContainer || !addressInput) return;

    if (paymentMethod === 'pickup') {
        // HIDE ADDRESS INPUT
        addressInput.style.display = 'none';
        addressInput.removeAttribute('required');
        addressInput.value = ''; // Clear value just in case
        
        // Ensure NAME and PHONE are still required (They are, by default in HTML)
        
    } else { // 'cod' or delivery method
        // SHOW ALL FIELDS
        addressInput.style.display = 'block';
        addressInput.setAttribute('required', 'required');
    }
}

function calculateCartSubtotal() {
    let subtotal = 0;
    
    // Ensure cartItems is loaded from sessionStorage (as it is global)
     cartItems = JSON.parse(sessionStorage.getItem('cart')) || []; 
    
    cartItems.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0; 
        const itemQuantity = parseInt(item.quantity) || 0; 
        subtotal += itemPrice * itemQuantity;
    });
    
    return subtotal;
}

function updateOrderSummary() {
    // 1. Get the subtotal
    const subtotalValue = calculateCartSubtotal();
    
    // 2. Get the selected payment method
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

    toggleShippingDetails(paymentMethod);

    const qrRow = document.getElementById('gcash-qr-row');
    if (qrRow) {
        // Show QR code only if the payment method is 'pickup'
        if (paymentMethod === 'pickup') {
            qrRow.style.display = 'table-row';
        } else {
            qrRow.style.display = 'none';
        }
    
    // 3. Determine shipping cost and method name
    let shippingCost = 0;
    let shippingMethodName = 'Standard Shipping (COD)';
    let totalItems = cartItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);


    if (paymentMethod === 'cod') {
        shippingCost = SHIPPING_COST_COD;
        shippingMethodName = 'Shipping (COD)';
    } else if (paymentMethod === 'pickup') {
        shippingCost = SHIPPING_COST_PICKUP;
        shippingMethodName = 'Shipping (Pickup)';
    }

    // 4. Calculate final total
    const orderTotal = subtotalValue + shippingCost;

    // 5. Update HTML elements
    const summaryTable = document.querySelector('.order-summary table');
    if (summaryTable) {
      
        const subtotalRow = summaryTable.rows[0].cells;
        subtotalRow[0].textContent = `Subtotal (${totalItems} items)`;
        subtotalRow[1].textContent = `₱${subtotalValue.toFixed(2)}`;

        const shippingRow = summaryTable.rows[1].cells;
        shippingRow[0].textContent = shippingMethodName;
        shippingRow[1].textContent = `₱${shippingCost.toFixed(2)}`;

        const totalRow = summaryTable.rows[2].cells;
        const orderTotalSpan = document.getElementById('orderTotal');
    

        if (orderTotalSpan) {
            orderTotalSpan.textContent = `₱${orderTotal.toFixed(2)}`;
        }
    }
    }

    // Check if cart is empty and prevent checkout
    const orderForm = document.getElementById('orderForm');
    const checkoutBtn = orderForm ? orderForm.querySelector('.checkout-btn') : null;

    if (subtotalValue === 0) {
        if (checkoutBtn) checkoutBtn.disabled = true;
         alert('Your bag is empty! Redirecting to products.');
         window.location.href = 'products.html'; 
    } else {
        if (checkoutBtn) checkoutBtn.disabled = false;
    }
}

function handleOrderSubmission(e) {
    e.preventDefault();
    
    // Get form data (mock validation)
    const name = document.querySelector('input[placeholder="Full Name"]').value;
    const address = document.querySelector('input[placeholder="Address / Landmark"]').value;
    const phone = document.querySelector('input[placeholder="Phone Number"]').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    
    // Calculate final order total
    const subtotal = calculateCartSubtotal();
    const shippingCost = (paymentMethod === 'cod') ? SHIPPING_COST_COD : SHIPPING_COST_PICKUP;
    const finalTotal = subtotal + shippingCost;
    
    if (subtotal === 0) {
        alert("Cannot place an empty order!");
        window.location.href = 'products.html';
        return;
    }

    // 1. Simulate Order Placement
    console.log("Placing Order...");
    console.log("Details:", { name, address, phone, paymentMethod, finalTotal: finalTotal.toFixed(2) });
    
    // 2. Display Confirmation Message
    const confirmationDiv = document.getElementById('orderConfirmation');
    const orderForm = document.getElementById('orderForm');

    orderForm.style.display = 'none'; // Hide the form
    confirmationDiv.style.display = 'block'; // Show confirmation

    let deliveryMessage = '';
    if (paymentMethod === 'cod') {
        deliveryMessage = `<p>We will deliver to <strong>${address}</strong>.</p>`;
    } else {
        deliveryMessage = `<p>Your order will be available for pickup at our store.</p>`;
    }


    confirmationDiv.innerHTML = `
        <div class="confirmation-message" style="
            padding: 30px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            background: #f9f9f9; 
            margin-bottom: 20px;
            text-align: center;
        ">
            <h3>🎉 Order Placed Successfully!</h3>
            <p>Your order for a total of <strong>₱${finalTotal.toFixed(2)}</strong> has been confirmed.</p>
            ${deliveryMessage}
            <p style="margin-top: 15px;">Payment Method: <strong>${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Store Pickup'}</strong></p>
            <a href="index.html" class="btn" style="margin-top: 20px;">Return to Home</a>
        </div>
    `;

    // 3. Clear the Cart (Crucial step after successful order)
    cartItems = [];
    saveCart();
}



// =======================================================
// Filter logic for products.html
// =======================================================

function setupProductFilter() {
    // Note: The select menu is inside a div with class 'small-container' 
    // and is the only <select> element in that context.
    const filterSelect = document.querySelector('.small-container select'); 
    const allCategories = document.querySelectorAll('.product-category');

    if (!filterSelect || allCategories.length === 0) {
        return; // Exit if not on the products page
    }

    function filterProducts() {
        const selectedOption = filterSelect.value;
        let categoryClass;

        // Determine the class name based on the selected option text
        if (selectedOption === 'Personal Care') {
            categoryClass = 'personal-care';
        } else if (selectedOption === 'Pantry Supplies') {
            categoryClass = 'pantry-supplies';
        } else if (selectedOption === 'House-Cleaning Supplies') {
            categoryClass = 'house-cleaning-supplies';
        } else {
            // Default: 'Filter Products' option selected or any unmapped option
            categoryClass = 'all'; 
        }

        allCategories.forEach(category => {
            // Check if the current category should be shown
            const categoryName = category.classList.contains(categoryClass);
            const shouldShow = categoryClass === 'all' || categoryName;
            
            // Toggle the visibility class
            if (shouldShow) {
                category.classList.remove('hidden');
            } else {
                category.classList.add('hidden');
            }
        });
    }

    // Attach the filter function to the 'change' event
    filterSelect.addEventListener('change', filterProducts);
}

// --- Make sure to call this function inside your DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', () => {
    setupProductFilter(); 
    
    // ... rest of the listener
});


// =======================================================
// Account Logic
// ======================================================

// Get references to the form elements and indicator bar
const LoginForm = document.getElementById("LoginForm");
const RegForm = document.getElementById("RegForm");
const Indicator = document.getElementById("Indicator");

// Set initial indicator position if elements exist
if (LoginForm && RegForm && Indicator) {
    // Initial state: Login form visible
    LoginForm.style.transform = "translateX(0px)";
    RegForm.style.transform = "translateX(300px)";
    Indicator.style.transform = "translateX(0px)";

    // Function to show the Register form
    function register() {
        RegForm.style.transform = "translateX(0px)"; // Bring Register to center
        LoginForm.style.transform = "translateX(-300px)"; // Push Login off-screen left
        Indicator.style.transform = "translateX(100px)"; // Move indicator to the right
    }

    // Function to show the Login form
    function login() {
        RegForm.style.transform = "translateX(300px)"; // Push Register off-screen right
        LoginForm.style.transform = "translateX(0px)"; // Bring Login to center
        Indicator.style.transform = "translateX(0px)"; // Move indicator to the left
    }

    // Attach these functions globally so they can be called by the HTML 'onclick' attributes
    window.register = register;
    window.login = login;
}


// --- Global Navigation Toggle Logic (Needed for login.html and products.html) ---
var MenuItems = document.getElementById("MenuItems");

// Initialize menu state (closed)
if (MenuItems) {
    // Only set height if it hasn't been set by another script (like inline in products.html)
    if (!MenuItems.style.maxHeight || MenuItems.style.maxHeight === "0px") {
        MenuItems.style.maxHeight = "0px";
    }
}

// Function to toggle the menu on mobile
window.menutoggle = function() {
    if (MenuItems.style.maxHeight == "0px") {
        MenuItems.style.maxHeight = "200px";
    }
    else {
        MenuItems.style.maxHeight = "0px";
    }
}
