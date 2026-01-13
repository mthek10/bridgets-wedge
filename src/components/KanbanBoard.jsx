import React, { useState, useEffect } from 'react';
import NewTaskForm from './NewTaskForm';
import Modal from './Modal';
import { motionApi } from '../services/motionApi';
import './KanbanBoard.css';

// Version from package.json - will be replaced during build
const APP_VERSION = process.env.REACT_APP_VERSION || '0.2.0';

const KanbanBoard = ({ onLogout }) => {
  const [tasks, setTasks] = useState({
    'Overdue': [],
    'On Track': [],
    'Completed': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [canRefresh, setCanRefresh] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const checkRefreshAvailability = () => {
      setCanRefresh(motionApi.isCacheStale());
    };

    checkRefreshAvailability();

    const interval = setInterval(checkRefreshAvailability, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTasks = await motionApi.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      setError('Failed to load tasks. Please try again later.');
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (newTask) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Format the task data for the Motion API
      const taskData = {
        name: newTask.title,
        description: newTask.description,
        priority: getPriorityValue(newTask.priority), // Convert to Motion's priority format
        dueDate: newTask.scheduledDate ? new Date(newTask.scheduledDate).toISOString() : null,
        status: "Todo"
      };
      
      // Call the API to create the task
      const createdTask = await motionApi.createTask(taskData);
      
      // Update the local state with the new task
      setTasks(prevTasks => ({
        ...prevTasks,
        'On Track': [...prevTasks['On Track'], {
          id: createdTask.id,
          title: createdTask.name,
          description: createdTask.description,
          priority: newTask.priority,
          scheduledDate: newTask.scheduledDate
        }]
      }));
      
      // Close the modal
      setIsModalOpen(false);
      
      // Show success message or notification (optional)
      console.log('Task created successfully:', createdTask);
      
    } catch (error) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert priority to Motion's format
  const getPriorityValue = (priority) => {
    switch (priority) {
      case 'High': return 1;
      case 'Medium': return 2;
      case 'Low': return 3;
      default: return 2; // Default to Medium
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      motionApi.clearCache(); // Force fresh data
      const fetchedTasks = await motionApi.getTasks();
      setTasks(fetchedTasks);
      setLastRefresh(new Date());
    } catch (error) {
      setError('Failed to refresh tasks. Please try again later.');
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRefreshTimeRemaining = () => {
    const now = new Date().getTime();
    const lastRefreshTime = new Date(lastRefresh).getTime();
    const secondsElapsed = (now - lastRefreshTime) / 1000;
    return Math.ceil(60 - secondsElapsed);
  };

  // Add this sorting function
  const sortTasksByDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.dueDate || 0);
      const dateB = new Date(b.scheduledDate || b.dueDate || 0);
      return dateB - dateA; // newest to oldest
    });
  };

  const handleDeleteTask = async (taskId, status) => {
    try {
      setError(null);
      console.log(`Deleting task with ID: ${taskId} from ${status}`);
      
      // Show loading state
      setIsLoading(true);
      
      // Call the API to delete the task
      await motionApi.deleteTask(taskId);
      
      // Update local state by removing the deleted task
      setTasks(prevTasks => ({
        ...prevTasks,
        [status]: prevTasks[status].filter(task => task.id !== taskId)
      }));
      
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(`Failed to delete task: ${error.message}`);
      
      // Optional: Show an alert for immediate feedback
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1>Bridget's Wedge <span className="app-version">v{APP_VERSION}</span></h1>
        <div className="header-actions">
          <span className="last-refresh">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
            {!canRefresh && (
              <span className="refresh-hint">
                {` (refresh available in ${getRefreshTimeRemaining()} seconds)`}
              </span>
            )}
          </span>
          <button 
            className="icon-button refresh-button" 
            onClick={handleRefresh}
            disabled={isLoading || !canRefresh}
            title="Refresh Tasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
          </button>
          <button 
            className="icon-button logout-button" 
            onClick={onLogout}
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
          </button>
          <button 
            className="add-task-button" 
            onClick={() => setIsModalOpen(true)}
          >
            + Add Task
          </button>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Add New Task</h2>
        <NewTaskForm onAddTask={handleAddTask} />
      </Modal>

      <div className="kanban-board">
        {Object.entries(tasks).map(([status, taskList]) => (
          <div key={status} className="kanban-column" data-status={status}>
            <h2>{status}</h2>
            <div className="task-list">
              {sortTasksByDate(taskList).map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.title}</h3>
                    <button 
                      className="delete-task-button" 
                      onClick={() => handleDeleteTask(task.id, status)}
                      title="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  {task.description && (
                    <div 
                      className="task-description"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  )}
                  <div className="task-details">
                    <span className={`priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <span className="scheduled-date">
                      {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard; 