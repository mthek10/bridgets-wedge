import React, { useState } from 'react';

const NewTaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [scheduledDate, setScheduledDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTask = {
      title,
      description,
      priority,
      scheduledDate: scheduledDate || null
    };
    
    onAddTask(newTask);
    
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setScheduledDate('');
  };

  return (
    <form className="new-task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description (optional)"
          rows="4"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="task-date">Due Date</label>
          <input
            id="task-date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>
      
      <button type="submit">Add Task</button>
    </form>
  );
};

export default NewTaskForm; 