<template>
  <div class="app-layout">
    <!-- Top Navigation Header -->
    <header class="navbar">
      <div class="nav-container">
        <div class="brand" @click="showCart = false" style="cursor: pointer;" title="Go to Lesson Catalog">
          <span class="brand-icon">🎓</span>
          <h1 class="brand-title">After-School Classes &amp; Activities</h1>
        </div>

        <div class="nav-actions">
          <!-- Toggleable Cart / Back Button -->
          <button 
            class="cart-btn" 
            :class="{ 'in-cart-view': showCart }"
            :disabled="cart.length === 0 && !showCart"
            @click="showCart = !showCart"
            :title="showCart ? 'Return to Lesson Catalog' : 'View Shopping Cart'"
          >
            <template v-if="showCart">
              <span class="cart-icon">←</span>
              <span class="cart-text">Back to Lessons</span>
            </template>
            <template v-else>
              <span class="cart-icon">🛒</span>
              <span class="cart-text">Cart</span>
              <span class="cart-badge">{{ totalCartCount }}</span>
            </template>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="main-content">
      <!-- Order Confirmation Banner (shown upon successful checkout) -->
      <section v-if="orderConfirmation" class="confirmation-banner" role="alert">
        <div class="confirmation-card">
          <div class="confirmation-icon">🎉</div>
          <div class="confirmation-content">
            <h2>Order Placed Successfully!</h2>
            <p class="confirmation-order-id">
              Order Reference: <strong>#{{ orderConfirmation.orderId }}</strong>
            </p>
            <p class="confirmation-thankyou">
              Thank you, <strong>{{ orderConfirmation.name }}</strong>! Your booking for 
              <strong>{{ orderConfirmation.totalItems }} space(s)</strong> totaling 
              <strong>£{{ orderConfirmation.totalPrice }}</strong> has been confirmed.
            </p>
            <p class="confirmation-contact">
              A booking confirmation has been logged for contact number <strong>{{ orderConfirmation.phone }}</strong>.
            </p>
            <div class="confirmation-items">
              <span v-for="item in orderConfirmation.items" :key="item._id" class="confirmation-chip">
                {{ item.topic }} (×{{ item.quantity }})
              </span>
            </div>
          </div>
          <button 
            class="btn-dismiss-confirmation" 
            @click="orderConfirmation = null"
            title="Dismiss confirmation"
          >
            ✕ Dismiss
          </button>
        </div>
      </section>

      <!-- Loading State (Initial Load) -->
      <section v-if="loading && lessons.length === 0" class="state-container">
        <div class="spinner"></div>
        <p>Loading available classes...</p>
      </section>

      <!-- Error State -->
      <section v-else-if="error && lessons.length === 0" class="state-container error-state">
        <div class="error-card">
          <span class="error-icon">⚠️</span>
          <h2>Unable to Load Classes</h2>
          <p>{{ error }}</p>
          <button class="btn-retry" @click="loadLessons">Try Again</button>
        </div>
      </section>

      <!-- VIEW 1: LESSON CATALOG VIEW (when showCart is false) -->
      <section v-else-if="!showCart" class="catalog-section">
        <!-- Live Search Bar -->
        <div class="search-box-wrap">
          <span class="search-icon">🔍</span>
          <input 
            type="text"
            v-model="searchQuery"
            class="search-input"
            placeholder="Search classes by subject, location, price, or spaces..."
            aria-label="Search classes"
          />
          <span v-if="isSearching" class="search-spinner" title="Searching..."></span>
          <button 
            v-if="searchQuery" 
            class="btn-clear" 
            @click="clearSearch"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        <!-- Sorting Controls Toolbar -->
        <div class="sort-toolbar">
          <div class="sort-group">
            <span class="sort-heading">Sort by:</span>
            <div class="sort-options">
              <label class="sort-radio-label">
                <input type="radio" value="topic" v-model="sortBy" />
                <span>Subject</span>
              </label>
              <label class="sort-radio-label">
                <input type="radio" value="location" v-model="sortBy" />
                <span>Location</span>
              </label>
              <label class="sort-radio-label">
                <input type="radio" value="price" v-model="sortBy" />
                <span>Price</span>
              </label>
              <label class="sort-radio-label">
                <input type="radio" value="space" v-model="sortBy" />
                <span>Spaces</span>
              </label>
            </div>
          </div>

          <div class="sort-group">
            <span class="sort-heading">Order:</span>
            <div class="sort-options">
              <label class="sort-radio-label">
                <input type="radio" value="asc" v-model="sortOrder" />
                <span>Ascending (A-Z / Low-High)</span>
              </label>
              <label class="sort-radio-label">
                <input type="radio" value="desc" v-model="sortOrder" />
                <span>Descending (Z-A / High-Low)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Catalog Header Info -->
        <div class="catalog-header">
          <h2>Available Lessons</h2>
          <span class="catalog-count">
            {{ sortedLessons.length }} {{ sortedLessons.length === 1 ? 'class' : 'classes' }} 
            {{ searchQuery.trim() ? `found for "${searchQuery.trim()}"` : 'listed' }}
          </span>
        </div>

        <!-- Empty Search Results State -->
        <div v-if="sortedLessons.length === 0" class="no-results-card">
          <span class="no-results-icon">🔎</span>
          <h3>No matching classes found</h3>
          <p v-if="searchQuery.trim()">
            We couldn't find any lessons matching "<strong>{{ searchQuery.trim() }}</strong>".
          </p>
          <p v-else>
            No classes are currently available in the database.
          </p>
          <button v-if="searchQuery.trim()" class="btn-clear-search" @click="clearSearch">
            Clear Search Filter
          </button>
        </div>

        <!-- Responsive Lesson Card Grid -->
        <div v-else class="lessons-grid">
          <article 
            v-for="lesson in sortedLessons" 
            :key="lesson._id" 
            class="lesson-card"
            :class="{ 'is-sold-out': lesson.space === 0 }"
          >
            <!-- Card Image with Object-Fit: Contain & Soft Background -->
            <div class="card-image-wrap">
              <img 
                :src="getImageUrl(lesson.image)" 
                :alt="lesson.topic" 
                class="lesson-image"
                @error="onImageError($event, lesson.topic)"
              />
              <span v-if="lesson.space === 0" class="sold-out-badge">Sold Out</span>
              <span v-else-if="lesson.space <= 2" class="low-stock-badge">Only {{ lesson.space }} left!</span>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <h3 class="lesson-topic">{{ lesson.topic }}</h3>
              
              <div class="lesson-details">
                <p class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span class="detail-value">{{ lesson.location }}</span>
                </p>

                <p class="detail-row">
                  <span class="detail-label">🏷️ Price:</span>
                  <span class="detail-value price-tag">£{{ lesson.price }}</span>
                </p>

                <p class="detail-row">
                  <span class="detail-label">🪑 Spaces:</span>
                  <span 
                    class="detail-value space-tag"
                    :class="{ 'no-space': lesson.space === 0, 'low-space': lesson.space > 0 && lesson.space <= 2 }"
                  >
                    {{ lesson.space > 0 ? `${lesson.space} available` : 'Sold Out' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <button 
                class="btn-add-cart"
                :disabled="lesson.space === 0"
                @click="addToCart(lesson)"
              >
                <span v-if="lesson.space > 0">Add to Cart</span>
                <span v-else>Sold Out</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- VIEW 2: SHOPPING CART & CHECKOUT VIEW (when showCart is true) -->
      <section v-else class="cart-section">
        <div class="cart-header">
          <div>
            <h2>Your Shopping Cart</h2>
            <p class="cart-subtitle">Review your selected classes and complete your reservation</p>
          </div>
          <button class="btn-continue-shopping" @click="showCart = false">
            ← Continue Shopping
          </button>
        </div>

        <!-- Empty Cart State -->
        <div v-if="cart.length === 0" class="empty-cart-card">
          <span class="empty-cart-icon">🛒</span>
          <h3>Your shopping cart is empty</h3>
          <p>You haven't reserved spaces in any classes yet.</p>
          <button class="btn-browse-classes" @click="showCart = false">
            Browse Lessons Catalog
          </button>
        </div>

        <!-- Populated Cart Items & Checkout Layout -->
        <div v-else class="cart-content-layout">
          <!-- Left Column: Cart Items List -->
          <div class="cart-items-list">
            <article 
              v-for="item in cart" 
              :key="item._id" 
              class="cart-item-card"
            >
              <div class="cart-item-image-wrap">
                <img 
                  :src="getImageUrl(item.image)" 
                  :alt="item.topic" 
                  class="cart-item-image"
                  @error="onImageError($event, item.topic)"
                />
              </div>

              <div class="cart-item-details">
                <h3 class="cart-item-topic">{{ item.topic }}</h3>
                <p class="cart-item-meta">
                  <span>📍 {{ item.location }}</span>
                  <span>&bull;</span>
                  <span>Unit Price: £{{ item.price }}</span>
                </p>
                <p class="cart-item-qty">
                  Reserved Spaces: <strong>{{ item.quantity }}</strong>
                </p>
              </div>

              <div class="cart-item-actions">
                <span class="cart-item-subtotal">£{{ item.price * item.quantity }}</span>
                <button 
                  class="btn-remove"
                  @click="removeFromCart(item)"
                  title="Remove 1 space from cart"
                >
                  Remove
                </button>
              </div>
            </article>
          </div>

          <!-- Right Column: Order Summary & Checkout Form -->
          <div class="cart-summary-col">
            <!-- Order Summary Card -->
            <div class="summary-card">
              <h3>Order Summary</h3>
              
              <div class="summary-row">
                <span>Total Spaces Booked:</span>
                <strong>{{ totalCartCount }}</strong>
              </div>

              <div class="summary-row">
                <span>Total Classes:</span>
                <strong>{{ cart.length }}</strong>
              </div>

              <hr class="summary-divider" />

              <div class="summary-row total-row">
                <span>Total Amount:</span>
                <strong class="total-amount">£{{ totalCartPrice }}</strong>
              </div>
            </div>

            <!-- Checkout Form Card -->
            <section class="checkout-card">
              <div class="checkout-header">
                <h3>Customer Checkout</h3>
                <span class="checkout-badge">Required</span>
              </div>

              <form @submit.prevent="handleCheckout" class="checkout-form" novalidate>
                <!-- Name Field -->
                <div class="form-group">
                  <label for="checkout-name" class="form-label">
                    Full Name <span class="required">*</span>
                  </label>
                  <div class="input-wrap">
                    <input 
                      id="checkout-name"
                      type="text" 
                      v-model="checkoutName" 
                      placeholder="e.g. John Smith" 
                      class="form-input"
                      :class="{ 
                        'is-valid': checkoutName && isNameValid, 
                        'is-invalid': checkoutName && !isNameValid 
                      }"
                      autocomplete="name"
                      :disabled="isSubmitting"
                    />
                    <span v-if="checkoutName && isNameValid" class="valid-icon">✓</span>
                  </div>
                  <p v-if="checkoutName && !isNameValid" class="field-error-msg">
                    Name must contain letters and spaces only.
                  </p>
                  <p v-else class="field-hint">
                    Letters and spaces only
                  </p>
                </div>

                <!-- Phone Field -->
                <div class="form-group">
                  <label for="checkout-phone" class="form-label">
                    Phone Number <span class="required">*</span>
                  </label>
                  <div class="input-wrap">
                    <input 
                      id="checkout-phone"
                      type="tel" 
                      v-model="checkoutPhone" 
                      placeholder="e.g. 07123456789" 
                      class="form-input"
                      :class="{ 
                        'is-valid': checkoutPhone && isPhoneValid, 
                        'is-invalid': checkoutPhone && !isPhoneValid 
                      }"
                      autocomplete="tel"
                      :disabled="isSubmitting"
                    />
                    <span v-if="checkoutPhone && isPhoneValid" class="valid-icon">✓</span>
                  </div>
                  <p v-if="checkoutPhone && !isPhoneValid" class="field-error-msg">
                    Phone must contain numbers only.
                  </p>
                  <p v-else class="field-hint">
                    Digits only (e.g. 07123456789)
                  </p>
                </div>

                <!-- Submission Error Message -->
                <div v-if="checkoutError" class="checkout-error-box">
                  <strong>Booking Failed:</strong> {{ checkoutError }}
                </div>

                <!-- Checkout Submit Button -->
                <button 
                  type="submit" 
                  class="btn-checkout"
                  :disabled="!isCheckoutValid"
                >
                  <span v-if="isSubmitting" class="checkout-spinner"></span>
                  <span>{{ isSubmitting ? 'Processing Booking...' : `Confirm & Book (£${totalCartPrice})` }}</span>
                </button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { 
  fetchLessons, 
  searchLessons, 
  createOrder, 
  updateLessonSpaces, 
  getLessonImageUrl 
} from './services/apiService';

// Reactive State
const lessons = ref([]);
const cart = ref([]);
const loading = ref(true);
const error = ref(null);
const showCart = ref(false); // Toggle between Lesson Catalog (false) and Cart View (true)

// Search State
const searchQuery = ref('');
const isSearching = ref(false);
let searchDebounceTimer = null;

// Sorting Controls State
const sortBy = ref('topic');       // 'topic' | 'location' | 'price' | 'space'
const sortOrder = ref('asc');      // 'asc' | 'desc'

// Checkout Form State
const checkoutName = ref('');
const checkoutPhone = ref('');
const isSubmitting = ref(false);
const checkoutError = ref(null);
const orderConfirmation = ref(null);

// Total items/spaces in cart
const totalCartCount = computed(() => {
  return cart.value.reduce((total, item) => total + item.quantity, 0);
});

// Total cart monetary price
const totalCartPrice = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Input Validation Computed Properties
// Name validation: Letters and spaces only, non-empty after trimming
const isNameValid = computed(() => {
  const trimmed = checkoutName.value.trim();
  return trimmed.length > 0 && /^[A-Za-z\s]+$/.test(trimmed);
});

// Phone validation: Numbers only, non-empty after trimming
const isPhoneValid = computed(() => {
  const trimmed = checkoutPhone.value.trim();
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
});

// Checkout button validity: both fields valid, cart has items, not submitting
const isCheckoutValid = computed(() => {
  return isNameValid.value && isPhoneValid.value && cart.value.length > 0 && !isSubmitting.value;
});

// Helper: Synchronize spaces on fetched lessons with local cart items
const syncLessonsWithCart = (fetchedList) => {
  return fetchedList.map(lesson => {
    const cartItem = cart.value.find(item => item._id === lesson._id);
    const reserved = cartItem ? cartItem.quantity : 0;
    return {
      ...lesson,
      // Ensure space never drops below zero and accurately reflects cart deductions
      space: Math.max(0, lesson.space - reserved)
    };
  });
};

// Computed Sorted Lessons: sorts string and numeric fields without mutating the original array
const sortedLessons = computed(() => {
  return [...lessons.value].sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'price' || sortBy.value === 'space') {
      // Numeric comparisons
      const valA = Number(a[sortBy.value]) || 0;
      const valB = Number(b[sortBy.value]) || 0;
      comparison = valA - valB;
    } else {
      // String comparisons with localeCompare
      const strA = String(a[sortBy.value] || '');
      const strB = String(b[sortBy.value] || '');
      comparison = strA.localeCompare(strB, undefined, { sensitivity: 'base' });
    }

    return sortOrder.value === 'desc' ? -comparison : comparison;
  });
});

// Fetch all lessons from backend API on mount
const loadLessons = async () => {
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchLessons();
    lessons.value = syncLessonsWithCart(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('[Frontend] Error loading lessons:', err);
    error.value = err.message || 'Failed to connect to backend server.';
  } finally {
    loading.value = false;
  }
};

// Perform live search query to backend GET /search?q=...
const performSearch = async (query) => {
  const trimmed = query.trim();
  isSearching.value = true;
  error.value = null;

  try {
    let data;
    if (!trimmed) {
      data = await fetchLessons();
    } else {
      data = await searchLessons(trimmed);
    }
    lessons.value = syncLessonsWithCart(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('[Frontend] Live search failed:', err);
    error.value = err.message || 'Search request failed.';
  } finally {
    isSearching.value = false;
  }
};

// Debounce search input (~250ms) to avoid flooding backend requests while typing
watch(searchQuery, (newQuery) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    performSearch(newQuery);
  }, 250);
});

// Clear search input and restore full catalog
const clearSearch = () => {
  searchQuery.value = '';
  clearTimeout(searchDebounceTimer);
  performSearch('');
};

// Add lesson to reactive cart and decrement space in local state
const addToCart = (lesson) => {
  if (lesson.space <= 0) return;

  // 1. Decrement displayed space locally
  lesson.space -= 1;

  // 2. Track quantity per lesson in reactive cart array
  const existingItem = cart.value.find(item => item._id === lesson._id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.value.push({
      _id: lesson._id,
      topic: lesson.topic,
      location: lesson.location,
      price: lesson.price,
      image: lesson.image,
      quantity: 1
    });
  }

  console.log(`[Cart] Added "${lesson.topic}". Total cart items: ${totalCartCount.value}`);
};

// Remove 1 space of a lesson from reactive cart and restore 1 space in lessons catalog
const removeFromCart = (cartItem) => {
  const itemIndex = cart.value.findIndex(item => item._id === cartItem._id);
  if (itemIndex === -1) return;

  // 1. Decrement cart quantity or remove item if quantity drops to zero
  if (cart.value[itemIndex].quantity > 1) {
    cart.value[itemIndex].quantity -= 1;
  } else {
    cart.value.splice(itemIndex, 1);
  }

  // 2. Restore 1 available space in the lessons catalog state
  const lesson = lessons.value.find(l => l._id === cartItem._id);
  if (lesson) {
    lesson.space += 1;
  }

  console.log(`[Cart] Removed 1 space of "${cartItem.topic}". Total cart items: ${totalCartCount.value}`);
};

// Handle Checkout Submission & Backend Persistence
const handleCheckout = async () => {
  if (!isCheckoutValid.value) return;

  isSubmitting.value = true;
  checkoutError.value = null;

  try {
    // 1. Build order payload conforming to backend POST /orders
    const orderPayload = {
      name: checkoutName.value.trim(),
      phone: checkoutPhone.value.trim(),
      lessonIds: cart.value.map(item => item._id),
      spaces: totalCartCount.value,
      lessons: cart.value.map(item => ({
        lessonId: item._id,
        topic: item.topic,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: totalCartPrice.value
    };

    console.log('[Checkout] Submitting order payload:', orderPayload);

    // 2. Submit order to backend POST /orders via native fetch
    const orderResult = await createOrder(orderPayload);
    console.log('[Checkout] Order created successfully:', orderResult);

    // 3. For each booked lesson, persist the new remaining space on the backend (PUT /lessons/:id)
    const updatePromises = cart.value.map(item => {
      const currentLesson = lessons.value.find(l => l._id === item._id);
      // The remaining space has already been decremented in local state
      const remainingSpace = currentLesson ? currentLesson.space : 0;
      console.log(`[Checkout] Updating lesson ${item._id} (${item.topic}) spaces to ${remainingSpace}`);
      return updateLessonSpaces(item._id, remainingSpace);
    });

    await Promise.all(updatePromises);
    console.log('[Checkout] All booked lesson spaces successfully updated in database.');

    // 4. Capture confirmation details for display
    orderConfirmation.value = {
      orderId: orderResult.orderId || orderResult.order?._id || 'CONF-' + Math.floor(100000 + Math.random() * 900000),
      name: checkoutName.value.trim(),
      phone: checkoutPhone.value.trim(),
      totalItems: totalCartCount.value,
      totalPrice: totalCartPrice.value,
      items: [...cart.value]
    };

    // 5. Reset cart and checkout input fields
    cart.value = [];
    checkoutName.value = '';
    checkoutPhone.value = '';

    // 6. Return smoothly to the Lesson Catalog view
    showCart.value = false;

    // Scroll to top to reveal confirmation banner
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('[Checkout] Error during order submission or space updates:', err);
    checkoutError.value = err.message || 'An error occurred while processing your booking. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

// Resolve image URL via API service
const getImageUrl = (imageFilename) => {
  return getLessonImageUrl(imageFilename);
};

// Fallback placeholder if image asset fails to load
const onImageError = (event, topic) => {
  const svgFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-weight="600" font-size="16">${encodeURIComponent(topic || 'Class Image')}</text></svg>`;
  event.target.src = svgFallback;
};

onMounted(() => {
  loadLessons();
});
</script>

<style scoped>
/* App Layout */
.app-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #1e293b;
}

/* Top Navbar */
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  user-select: none;
}

.brand-icon {
  font-size: 1.6rem;
}

.brand-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.15rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.2);
}

.cart-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.cart-btn.in-cart-view {
  background-color: #475569;
}

.cart-btn.in-cart-view:hover {
  background-color: #334155;
}

.cart-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.cart-icon {
  font-size: 1.1rem;
}

.cart-badge {
  background-color: #ffffff;
  color: #2563eb;
  border-radius: 9999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 1.25rem;
  text-align: center;
}

.cart-btn:disabled .cart-badge {
  color: #64748b;
  background-color: #f1f5f9;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Order Confirmation Banner */
.confirmation-banner {
  margin-bottom: 2rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.confirmation-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(22, 101, 52, 0.1);
  position: relative;
}

.confirmation-icon {
  font-size: 2.25rem;
  line-height: 1;
}

.confirmation-content {
  flex: 1;
}

.confirmation-content h2 {
  margin: 0 0 0.4rem;
  color: #166534;
  font-size: 1.4rem;
}

.confirmation-order-id {
  margin: 0 0 0.5rem;
  color: #15803d;
  font-size: 0.95rem;
}

.confirmation-thankyou {
  margin: 0 0 0.35rem;
  color: #14532d;
  font-size: 1rem;
  line-height: 1.5;
}

.confirmation-contact {
  margin: 0 0 0.85rem;
  color: #166534;
  font-size: 0.92rem;
}

.confirmation-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.confirmation-chip {
  background-color: #ffffff;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-dismiss-confirmation {
  background: none;
  border: 1px solid #86efac;
  background-color: #ffffff;
  color: #166534;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-dismiss-confirmation:hover {
  background-color: #f0fdf4;
  border-color: #4ade80;
}

/* Loading & Error States */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-card {
  background-color: #ffffff;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 2rem;
  max-width: 450px;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
}

.error-icon {
  font-size: 2.5rem;
}

.error-card h2 {
  margin: 0.5rem 0;
  color: #991b1b;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  background-color: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #b91c1c;
}

/* Live Search Box */
.search-box-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.search-icon {
  font-size: 1.2rem;
  color: #64748b;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #0f172a;
  margin-left: 0.75rem;
  background: transparent;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
}

.btn-clear {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  transition: color 0.15s, background-color 0.15s;
}

.btn-clear:hover {
  color: #0f172a;
  background-color: #f1f5f9;
}

/* Sorting Controls Toolbar */
.sort-toolbar {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}

.sort-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.sort-heading {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
}

.sort-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.sort-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #334155;
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.15s ease;
  user-select: none;
}

.sort-radio-label:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.sort-radio-label input[type="radio"] {
  accent-color: #2563eb;
  cursor: pointer;
}

/* Catalog Header */
.catalog-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.75rem;
}

.catalog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
}

.catalog-count {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
}

/* No Results State */
.no-results-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3.5rem 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.no-results-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.no-results-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
  color: #0f172a;
}

.no-results-card p {
  color: #64748b;
  margin: 0 0 1.5rem;
  font-size: 1rem;
}

.btn-clear-search {
  padding: 0.6rem 1.25rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-clear-search:hover {
  background-color: #1d4ed8;
}

/* Responsive Card Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.5rem;
}

/* Lesson Card */
.lesson-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.lesson-card:hover:not(.is-sold-out) {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.lesson-card.is-sold-out {
  opacity: 0.75;
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

/* Card Image Wrap with Object-Fit: Contain & Soft Background */
.card-image-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  box-sizing: border-box;
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
}

.lesson-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.lesson-card:hover:not(.is-sold-out) .lesson-image {
  transform: scale(1.06);
}

.sold-out-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.low-stock-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background-color: #f59e0b;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Card Body */
.card-body {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lesson-topic {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.lesson-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
}

.detail-row {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.92rem;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  font-weight: 600;
  color: #1e293b;
}

.price-tag {
  color: #059669;
  font-size: 1.1rem;
  font-weight: 700;
}

.space-tag {
  color: #0284c7;
}

.space-tag.low-space {
  color: #d97706;
}

.space-tag.no-space {
  color: #dc2626;
  font-weight: 700;
}

/* Card Footer */
.card-footer {
  padding: 0 1.25rem 1.25rem;
}

.btn-add-cart {
  width: 100%;
  padding: 0.7rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-add-cart:disabled {
  background-color: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

/* SHOPPING CART VIEW STYLES */
.cart-section {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.cart-header h2 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
  color: #0f172a;
}

.cart-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-continue-shopping {
  padding: 0.55rem 1.15rem;
  background-color: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-continue-shopping:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.empty-cart-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.empty-cart-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-cart-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  color: #0f172a;
}

.empty-cart-card p {
  color: #64748b;
  margin: 0 0 1.5rem;
}

.btn-browse-classes {
  padding: 0.7rem 1.5rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-browse-classes:hover {
  background-color: #1d4ed8;
}

/* Cart Layout: Two Columns on Desktop */
.cart-content-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: start;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.cart-item-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}

.cart-item-image-wrap {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  box-sizing: border-box;
}

.cart-item-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.cart-item-details {
  flex: 1;
}

.cart-item-topic {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.cart-item-meta {
  margin: 0 0 0.4rem;
  font-size: 0.88rem;
  color: #64748b;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cart-item-qty {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
}

.cart-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.cart-item-subtotal {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.btn-remove {
  padding: 0.4rem 0.85rem;
  background-color: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-remove:hover {
  background-color: #ffe4e6;
  border-color: #fda4af;
  color: #be123c;
}

/* Cart Summary Column */
.cart-summary-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.summary-card h3 {
  margin: 0 0 1.25rem;
  font-size: 1.25rem;
  color: #0f172a;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #475569;
}

.summary-row strong {
  color: #0f172a;
}

.summary-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1rem 0;
}

.total-row {
  font-size: 1.15rem;
  margin-bottom: 0;
}

.total-row span {
  font-weight: 700;
  color: #0f172a;
}

.total-amount {
  font-size: 1.5rem;
  color: #059669;
  font-weight: 800;
}

/* Checkout Form Card */
.checkout-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.checkout-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
}

.checkout-badge {
  background-color: #eff6ff;
  color: #2563eb;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
}

.required {
  color: #dc2626;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  background-color: #ffffff;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-input.is-valid {
  border-color: #10b981;
  padding-right: 2.2rem;
}

.form-input.is-valid:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.form-input.is-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-input.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.valid-icon {
  position: absolute;
  right: 0.75rem;
  color: #10b981;
  font-weight: 800;
  font-size: 1rem;
  pointer-events: none;
}

.field-error-msg {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 500;
}

.field-hint {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

.checkout-error-box {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #991b1b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.btn-checkout {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.8rem;
  background-color: #059669;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}

.btn-checkout:hover:not(:disabled) {
  background-color: #047857;
  transform: translateY(-1px);
}

.btn-checkout:disabled {
  background-color: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.checkout-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .cart-content-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sort-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .cart-item-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .cart-item-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 0.75rem;
  }

  .confirmation-card {
    flex-direction: column;
  }

  .btn-dismiss-confirmation {
    align-self: flex-end;
  }
}

@media (max-width: 640px) {
  .nav-container {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  
  .catalog-header {
    flex-direction: column;
    gap: 0.25rem;
  }

  .cart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
