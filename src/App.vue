<template>
  <div class="app-layout">
    <!-- Top Navigation Header -->
    <header class="navbar">
      <div class="nav-container">
        <div class="brand">
          <span class="brand-icon">🎓</span>
          <h1 class="brand-title">After-School Classes &amp; Activities</h1>
        </div>

        <div class="nav-actions">
          <button 
            class="cart-btn" 
            :disabled="totalCartCount === 0"
            title="Shopping Cart"
          >
            <span class="cart-icon">🛒</span>
            <span class="cart-text">Cart</span>
            <span class="cart-badge">{{ totalCartCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="main-content">
      <!-- Loading State -->
      <section v-if="loading" class="state-container">
        <div class="spinner"></div>
        <p>Loading available classes...</p>
      </section>

      <!-- Error State -->
      <section v-else-if="error" class="state-container error-state">
        <div class="error-card">
          <span class="error-icon">⚠️</span>
          <h2>Unable to Load Classes</h2>
          <p>{{ error }}</p>
          <button class="btn-retry" @click="loadLessons">Try Again</button>
        </div>
      </section>

      <!-- Empty State -->
      <section v-else-if="lessons.length === 0" class="state-container">
        <p>No classes are currently available.</p>
      </section>

      <!-- Lesson Catalog Grid -->
      <section v-else class="catalog-section">
        <div class="catalog-header">
          <h2>Available Lessons</h2>
          <span class="catalog-count">{{ lessons.length }} classes listed</span>
        </div>

        <div class="lessons-grid">
          <article 
            v-for="lesson in lessons" 
            :key="lesson._id" 
            class="lesson-card"
            :class="{ 'is-sold-out': lesson.space === 0 }"
          >
            <!-- Card Image -->
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
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchLessons, getLessonImageUrl } from './services/apiService';

// Reactive State
const lessons = ref([]);
const cart = ref([]);
const loading = ref(true);
const error = ref(null);

// Total items in cart (sum of quantities across all items)
const totalCartCount = computed(() => {
  return cart.value.reduce((total, item) => total + item.quantity, 0);
});

// Fetch lessons from backend API on mount
const loadLessons = async () => {
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchLessons();
    lessons.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[Frontend] Error loading lessons:', err);
    error.value = err.message || 'Failed to connect to backend server.';
  } finally {
    loading.value = false;
  }
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

// Resolve image URL via API service
const getImageUrl = (imageFilename) => {
  return getLessonImageUrl(imageFilename);
};

// Fallback placeholder if image asset fails to load
const onImageError = (event, topic) => {
  // Replace with an inline SVG placeholder indicating the lesson topic
  const svgFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23718096" font-family="sans-serif" font-size="16">${encodeURIComponent(topic || 'Class Image')}</text></svg>`;
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

/* Catalog Section */
.catalog-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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

/* Card Image Wrap */
.card-image-wrap {
  position: relative;
  width: 100%;
  height: 170px;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;
}

.lesson-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.lesson-card:hover:not(.is-sold-out) .lesson-image {
  transform: scale(1.03);
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

/* Responsive adjustments */
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
}
</style>
