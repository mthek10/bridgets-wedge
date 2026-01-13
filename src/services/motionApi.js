// Configuration - TODO: Move these to environment variables
const API_BASE_URL = 'https://api.usemotion.com/v1';

console.log('All env variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_MOTION_API_KEY: process.env.REACT_APP_MOTION_API_KEY,
});

const API_KEY = process.env.REACT_APP_MOTION_API_KEY || 'GR9mLIIeUuat1dYoM7DMq3SHPtoss0+pgE9tBcCr8Y0=';

if (!process.env.REACT_APP_MOTION_API_KEY) {
  console.warn('Environment variable not found, using fallback API key');
}

// Add this near the top with other constants
const PROJECT_ID = '0S0vV5npeVa3F-7rGGP2H';

// Add these constants at the top
const CACHE_KEY = 'motion_tasks_cache';
const CACHE_TIMESTAMP_KEY = 'motion_tasks_cache_timestamp';
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

// API helper for common fetch options
const fetchWithAuth = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Accept': 'application/json',
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    { ...defaultOptions, ...options }
  );

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

// Map Motion priorities to our display priorities
const PRIORITY_MAPPING = {
  'ASAP': 'High',
  'HIGH': 'High',
  'MEDIUM': 'Medium',
  'LOW': 'Low',
};

export const motionApi = {
  // Add cache management methods
  getCache() {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
      
      if (!timestamp || !cache) return null;

      const now = new Date().getTime();
      if (now - parseInt(timestamp) > CACHE_DURATION) {
        // Cache is expired
        this.clearCache();
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  },

  setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
    } catch (error) {
      console.error('Cache setting error:', error);
    }
  },

  clearCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  },

  // Fetch tasks for a project
  async getTasks() {
    try {
      // Check cache first
      const cachedData = this.getCache();
      if (cachedData) {
        console.log('Using cached data');
        return cachedData;
      }

      console.log('Fetching fresh data');
      const endpoint = `/tasks?includeAllStatuses=true&projectId=${PROJECT_ID}`;
      const response = await fetchWithAuth(endpoint);
      const transformedData = this.transformTasksToKanbanFormat(response.tasks);
      
      // Save to cache
      this.setCache(transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  },

  // Create a new task
  async createTask(taskData) {
    try {
      // If no due date is provided, set it to tomorrow
      const dueDate = taskData.dueDate || this.getTomorrowDate();

      // Format the task data according to the Motion API requirements
      const formattedTaskData = {
        name: taskData.name,
        description: taskData.description || '',
        priority: this.getPriorityForAPI(taskData.priority),
        dueDate: dueDate,
        projectId: PROJECT_ID,
        workspaceId: "_5GGL-17lxyLULA_ECneb", // Personal Workspace ID
        status: taskData.status || undefined,
        duration: taskData.duration || 30, // Default to 30 minutes if not specified
        autoScheduled: {
          startDate: new Date().toISOString().split('T')[0], // Start today
          deadlineType: "HARD",
          schedule: "Work Hours"
        }
      };

      console.log('Sending task data to API:', formattedTaskData);
      
      // Send the request
      const response = await fetchWithAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify(formattedTaskData)
      });
      
      // Clear the cache so we get fresh data next time
      this.clearCache();
      
      return response;
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  },

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      return await fetchWithAuth(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  getPriorityForAPI(priority) {
    const priorityMap = {
      'High': 'HIGH',
      'Medium': 'MEDIUM',
      'Low': 'LOW'
    };
    return priorityMap[priority] || 'MEDIUM';
  },

  // Helper method to get tomorrow's date in YYYY-MM-DD format
  getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  },

  // Helper to transform API response to Kanban format
  transformTasksToKanbanFormat(tasks) {
    const kanbanTasks = {
      'Overdue': [],
      'On Track': [],
      'Completed': [],
    };

    const now = new Date();

    console.log('Raw tasks from API:', tasks); // Debug log

    tasks.forEach(task => {
      const taskData = {
        id: task.id,
        title: task.name,
        priority: PRIORITY_MAPPING[task.priority] || 'Medium',
        scheduledDate: task.scheduledStart || task.dueDate,
        description: task.description,
        assignees: task.assignees,
      };

      console.log('Processing task:', {
        name: task.name,
        completed: task.completed,
        status: task.status,
        dueDate: task.dueDate
      }); // Debug log

      // Check both task.completed and status.isResolvedStatus
      if (task.completed || (task.status && task.status.isResolvedStatus)) {
        kanbanTasks['Completed'].push(taskData);
      } else if (task.dueDate && new Date(task.dueDate) < now) {
        kanbanTasks['Overdue'].push(taskData);
      } else {
        kanbanTasks['On Track'].push(taskData);
      }
    });

    console.log('Transformed tasks:', kanbanTasks); // Debug log

    return kanbanTasks;
  },

  // Add this method to check if cache is stale
  isCacheStale() {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp) return true;

      const now = new Date().getTime();
      return now - parseInt(timestamp) > CACHE_DURATION;
    } catch (error) {
      return true;
    }
  },

  // Delete a task
  async deleteTask(taskId) {
    try {
      console.log(`Attempting to delete task with ID: ${taskId}`);
      
      // For DELETE requests, the response might be empty
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      console.log('Delete successful, status:', response.status);
      
      // Clear the cache so we get fresh data next time
      this.clearCache();
      
      // Return true to indicate success (since DELETE might not return JSON)
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  },
}; 