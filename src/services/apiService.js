import { API_BASE_URL } from '../config/api';

/**
 * Fetch all lessons from the backend database.
 * GET ${API_BASE_URL}/lessons
 * 
 * @returns {Promise<Array>} Array of lesson objects
 */
export async function fetchLessons() {
  const response = await fetch(`${API_BASE_URL}/lessons`);
  if (!response.ok) {
    throw new Error(`Failed to fetch lessons: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Search lessons by topic, location, price, or space.
 * GET ${API_BASE_URL}/search?q=${encodeURIComponent(query)}
 * 
 * @param {string} query - The search query term
 * @returns {Promise<Array>} Array of matched lesson objects
 */
export async function searchLessons(query = '') {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(`${API_BASE_URL}/search?q=${encodedQuery}`);
  if (!response.ok) {
    throw new Error(`Search failed: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Submit a new customer order.
 * POST ${API_BASE_URL}/orders
 * 
 * @param {Object} orderData - Object containing name, phone, lessonIds, and spaces
 * @returns {Promise<Object>} The created order response
 */
export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to create order: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Update the remaining spaces of a lesson.
 * PUT ${API_BASE_URL}/lessons/${lessonId}
 * 
 * @param {string} lessonId - 24-character hexadecimal ObjectId of the lesson
 * @param {number} space - The updated space count
 * @returns {Promise<Object>} Update confirmation response
 */
export async function updateLessonSpaces(lessonId, space) {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ space })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to update lesson spaces: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Helper to construct the absolute image URL for lesson assets.
 * ${API_BASE_URL}/images/${imageFilename}
 * 
 * @param {string} imageFilename - e.g. "math.png", "art.png"
 * @returns {string} Full image asset URL
 */
export function getLessonImageUrl(imageFilename) {
  if (!imageFilename) return '';
  const sanitized = String(imageFilename).replace(/^\/+/, '');
  return `${API_BASE_URL}/images/${sanitized}`;
}
