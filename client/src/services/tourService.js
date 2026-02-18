// Tour API Service - Handles all backend communications for tour tracking

const API_BASE_URL = '/api';

/**
 * Fetch tour status for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Tour status data
 */
export const fetchTourStatus = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tour-status/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch tour status');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching tour status:', error);
    throw error;
  }
};

/**
 * Update a single tour status
 * @param {string} userId - User ID
 * @param {string} tourName - Name of the tour (e.g., 'dashboardTourDone')
 * @param {boolean} completed - Whether tour is completed
 * @returns {Promise<Object>} Updated tour status
 */
export const updateTourStatus = async (userId, tourName, completed) => {
  if (!userId || !tourName) {
    throw new Error('User ID and tour name are required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tour-status/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        tourName,
        completed: Boolean(completed),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update tour status');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error updating tour status for ${tourName}:`, error);
    throw error;
  }
};

/**
 * Bulk update multiple tour statuses at once
 * @param {string} userId - User ID
 * @param {Object} tours - Object containing tour names and their completion status
 * @returns {Promise<Object>} Updated tour statuses
 */
export const bulkUpdateTourStatus = async (userId, tours) => {
  if (!userId || !tours) {
    throw new Error('User ID and tours object are required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tour-status/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        tours,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update tour status');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error bulk updating tour status:', error);
    throw error;
  }
};

/**
 * Get tour completion statistics (admin only)
 * @returns {Promise<Object>} Tour statistics
 */
export const getTourStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tour-stats`);

    if (!response.ok) {
      throw new Error('Failed to fetch tour stats');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching tour stats:', error);
    throw error;
  }
};

/**
 * Initialize tour tracking for a new user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Initial tour status
 */
export const initializeTourTracking = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // This will be automatically created on first fetch, but we can explicitly call it
    return await fetchTourStatus(userId);
  } catch (error) {
    console.error('Error initializing tour tracking:', error);
    throw error;
  }
};

/**
 * Check if all tours have been completed by a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if all tours are completed
 */
export const areAllToursCompleted = async (userId) => {
  try {
    const status = await fetchTourStatus(userId);
    return (
      status.dashboardTourDone &&
      status.notesTourDone &&
      status.eventsTourDone &&
      status.studentmartTourDone &&
      status.chatroomTourDone
    );
  } catch (error) {
    console.error('Error checking if all tours are completed:', error);
    return false;
  }
};

/**
 * Get completion percentage for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Percentage of tours completed (0-100)
 */
export const getTourCompletionPercentage = async (userId) => {
  try {
    const status = await fetchTourStatus(userId);
    const completedCount = Object.values(status).filter(Boolean).length;
    const totalTours = Object.keys(status).length;
    return Math.round((completedCount / totalTours) * 100);
  } catch (error) {
    console.error('Error calculating tour completion percentage:', error);
    return 0;
  }
};
