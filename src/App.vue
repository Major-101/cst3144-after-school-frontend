<template>
  <main class="connection-container">
    <header class="header">
      <h1>CST3144 After-School Classes</h1>
      <p class="subtitle">Vue 3 + Vite Frontend Integration Check</p>
    </header>

    <section class="card">
      <h2>Backend Connection Status</h2>
      <div class="status-row">
        <span class="label">Backend API URL:</span>
        <code class="url-badge">{{ apiUrl }}</code>
      </div>

      <div class="status-row">
        <span class="label">Status:</span>
        <span v-if="loading" class="badge loading">Checking Connection...</span>
        <span v-else-if="error" class="badge error">Connection Failed</span>
        <span v-else class="badge success">Connected Successfully</span>
      </div>

      <div class="status-row">
        <span class="label">Lessons Loaded:</span>
        <strong class="count">{{ lessons.length }}</strong>
      </div>

      <div v-if="error" class="error-box">
        <strong>Error:</strong> {{ error }}
        <p class="tip">Ensure your Express backend is running on <code>{{ apiUrl }}</code>.</p>
      </div>

      <div class="action-row">
        <button class="btn" :disabled="loading" @click="loadLessons">
          {{ loading ? 'Connecting...' : 'Refresh Connection' }}
        </button>
      </div>
    </section>

    <!-- Preview of loaded lessons -->
    <section v-if="lessons.length > 0" class="card lessons-preview">
      <h3>Loaded Lessons Preview ({{ lessons.length }})</h3>
      <div class="lessons-grid">
        <article v-for="lesson in lessons" :key="lesson._id" class="lesson-chip">
          <img 
            v-if="lesson.image" 
            :src="getImageUrl(lesson.image)" 
            :alt="lesson.topic" 
            class="lesson-thumb"
            @error="onImageError"
          />
          <div class="lesson-info">
            <strong>{{ lesson.topic }}</strong>
            <small>{{ lesson.location }} &bull; £{{ lesson.price }} &bull; Spaces: {{ lesson.space }}</small>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { API_BASE_URL } from './config/api';
import { fetchLessons, getLessonImageUrl } from './services/apiService';

const apiUrl = API_BASE_URL;
const lessons = ref([]);
const loading = ref(true);
const error = ref(null);

const loadLessons = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log(`[Frontend] Fetching lessons from ${API_BASE_URL}/lessons...`);
    const data = await fetchLessons();
    lessons.value = Array.isArray(data) ? data : [];
    console.log(`[Frontend] Successfully loaded ${lessons.value.length} lesson(s):`, lessons.value);
  } catch (err) {
    console.error('[Frontend] Failed to connect to backend:', err);
    error.value = err.message || 'Could not connect to backend server.';
  } finally {
    loading.value = false;
  }
};

const getImageUrl = (filename) => {
  return getLessonImageUrl(filename);
};

const onImageError = (event) => {
  // Graceful fallback if image is missing
  event.target.style.display = 'none';
};

onMounted(() => {
  loadLessons();
});
</script>

<style scoped>
.connection-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1a365d;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #718096;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.card h2, .card h3 {
  margin-top: 0;
  color: #2d3748;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #edf2f7;
}

.label {
  font-weight: 500;
  color: #4a5568;
}

.url-badge {
  background: #edf2f7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #2b6cb0;
}

.badge {
  padding: 0.3rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge.loading {
  background: #feebc8;
  color: #c05621;
}

.badge.success {
  background: #c6f6d5;
  color: #22543d;
}

.badge.error {
  background: #fed7d7;
  color: #9b2c2c;
}

.count {
  font-size: 1.25rem;
  color: #2b6cb0;
}

.error-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 6px;
  color: #9b2c2c;
  font-size: 0.9rem;
}

.tip {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #742a2a;
}

.action-row {
  margin-top: 1.25rem;
  text-align: right;
}

.btn {
  background: #3182ce;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: #2b6cb0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lessons-preview {
  margin-top: 1.5rem;
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.lesson-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f7fafc;
}

.lesson-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: #edf2f7;
  border-radius: 4px;
}

.lesson-info {
  display: flex;
  flex-direction: column;
}

.lesson-info small {
  color: #718096;
}
</style>
