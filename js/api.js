/**
 * API Service for NoteTaker Application
 * This module handles all API endpoints and data management
 */

class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.notes = [];
        this.reminders = [];
        this.initializeRoutes();
        this.loadNotes();
        this.initializeReminders();
        this.startReminderChecker();
    }

    /**
     * Initialize API routes
     */
    initializeRoutes() {
        // API endpoints documentation for reference
        this.routes = {
            // Notes endpoints
            getNotes: '/api/notes',
            getNoteById: '/api/notes/:id',
            createTodo: '/api/todos',
            createEvent: '/api/events',
            createBlocker: '/api/blockers',
            createReminder: '/api/reminders',
            updateNote: '/api/notes/:id',
            deleteNote: '/api/notes/:id',
            
            // Calendar endpoints
            getCalendarEvents: '/api/calendar',
            
            // Input/Output endpoints
            getInputText: '/api/input',
            setInputText: '/api/input',
            getOutputText: '/api/output',
            setOutputText: '/api/output'
        };
    }

    /**
     * Load notes from the API
     */
    async loadNotes() {
        try {
            const response = await fetch(this.routes.getNotes);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.notes = await response.json();
        } catch (error) {
            console.error('Error loading notes:', error);
            // Fallback to localStorage if API is not available
            this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        }
    }

    /**
     * Initialize reminders from stored notes
     */
    initializeReminders() {
        // Filter out reminder notes and set up active reminders
        this.reminders = this.notes.filter(note => note.type === 'reminder' && !note.triggered);
        
        // Sort reminders by time, earliest first
        this.reminders.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dateA - dateB;
        });
    }

    /**
     * Start checking for due reminders
     */
    startReminderChecker() {
        // Check for reminders every minute
        setInterval(() => {
            this.checkReminders();
        }, 60000); // 60000ms = 1 minute
        
        // Also check immediately
        this.checkReminders();
    }

    /**
     * Check if any reminders are due
     */
    checkReminders() {
        const now = new Date();
        
        this.reminders.forEach(reminder => {
            const reminderTime = new Date(`${reminder.date}T${reminder.time || '00:00'}`);
            
            // If the reminder time has passed and it hasn't been triggered
            if (reminderTime <= now && !reminder.triggered) {
                // Trigger reminder notification
                this.triggerReminder(reminder);
                
                // Mark reminder as triggered
                const index = this.notes.findIndex(note => note.id === reminder.id);
                if (index !== -1) {
                    this.notes[index].triggered = true;
                    this._saveNotes();
                }
            }
        });
        
        // Update reminders list (remove triggered ones)
        this.reminders = this.reminders.filter(reminder => !reminder.triggered);
    }

    /**
     * Trigger a reminder notification
     * @param {Object} reminder - Reminder to trigger
     */
    triggerReminder(reminder) {
        const reminderAlert = document.getElementById('reminder-alert');
        const reminderContent = document.getElementById('reminder-alert-content');
        
        if (reminderAlert && reminderContent) {
            // Set reminder content
            reminderContent.innerHTML = `
                <div class="reminder-alert-detail">
                    <p><strong>${reminder.content}</strong></p>
                    <p class="reminder-time">
                        <i class="fas fa-clock"></i> 
                        ${this._formatDateTime(reminder.date, reminder.time)}
                    </p>
                </div>
            `;
            
            // Show the alert
            reminderAlert.style.display = 'block';
            
            // Add event listener to close button
            const closeBtn = reminderAlert.querySelector('.close');
            const dismissBtn = reminderAlert.querySelector('.dismiss-alert');
            
            if (closeBtn) {
                closeBtn.onclick = function() {
                    reminderAlert.style.display = 'none';
                };
            }
            
            if (dismissBtn) {
                dismissBtn.onclick = function() {
                    reminderAlert.style.display = 'none';
                };
            }
            
            // Also close when clicking outside
            window.onclick = function(event) {
                if (event.target === reminderAlert) {
                    reminderAlert.style.display = 'none';
                }
            };
        }
    }

    /**
     * Get all notes
     * @param {Object} filters - Filters for notes (type, date, etc)
     * @returns {Promise<Array>} - Array of notes
     */
    async getNotes(filters = {}) {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.type && filters.type !== 'all') {
                queryParams.append('type', filters.type);
            }
            if (filters.date) {
                queryParams.append('date', filters.date);
            }
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const response = await fetch(`${this.routes.getNotes}${queryString}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const notes = await response.json();
            this.notes = notes; // Update local notes
            return notes;
        } catch (error) {
            console.error('Error fetching notes:', error);
            // Fallback to local filtering if API fails
            let filteredNotes = [...this.notes];
            
            if (filters.type && filters.type !== 'all') {
                filteredNotes = filteredNotes.filter(note => note.type === filters.type);
            }
            
            if (filters.date) {
                const filterDate = new Date(filters.date).toDateString();
                filteredNotes = filteredNotes.filter(note => {
                    return new Date(note.date).toDateString() === filterDate;
                });
            }
            
            return filteredNotes;
        }
    }

    /**
     * Get note by ID
     * @param {String} id - Note ID
     * @returns {Promise<Object>} - Note object
     */
    async getNoteById(id) {
        try {
            const response = await fetch(`${this.routes.getNoteById.replace(':id', id)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching note:', error);
            // Fallback to local lookup if API fails
            const note = this.notes.find(note => note.id === id);
            if (note) {
                return note;
            } else {
                throw new Error('Note not found');
            }
        }
    }

    /**
     * Create a new todo
     * @param {Object} todoData - Todo data
     * @returns {Promise<Object>} - Created todo
     */
    async createTodo(todoData) {
        try {
            const response = await fetch(this.routes.createTodo, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const newTodo = await response.json();
            this.notes.push(newTodo);
            return newTodo;
        } catch (error) {
            console.error('Error creating todo:', error);
            // Fallback to local creation if API fails
            const newTodo = {
                id: this._generateId(),
                type: 'todo',
                ...todoData,
                createdAt: new Date().toISOString(),
                completed: false
            };
            
            this.notes.push(newTodo);
            this._saveNotes();
            
            return newTodo;
        }
    }

    /**
     * Create a new event
     * @param {Object} eventData - Event data
     * @returns {Promise<Object>} - Created event
     */
    async createEvent(eventData) {
        try {
            const response = await fetch(this.routes.createEvent, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const newEvent = await response.json();
            this.notes.push(newEvent);
            return newEvent;
        } catch (error) {
            console.error('Error creating event:', error);
            // Fallback to local creation if API fails
            const newEvent = {
                id: this._generateId(),
                type: 'event',
                ...eventData,
                createdAt: new Date().toISOString()
            };
            
            this.notes.push(newEvent);
            this._saveNotes();
            
            return newEvent;
        }
    }

    /**
     * Create a new blocker
     * @param {Object} blockerData - Blocker data
     * @returns {Promise<Object>} - Created blocker
     */
    async createBlocker(blockerData) {
        try {
            const response = await fetch(this.routes.createBlocker, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(blockerData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const newBlocker = await response.json();
            this.notes.push(newBlocker);
            return newBlocker;
        } catch (error) {
            console.error('Error creating blocker:', error);
            // Fallback to local creation if API fails
            const newBlocker = {
                id: this._generateId(),
                type: 'blocker',
                ...blockerData,
                createdAt: new Date().toISOString()
            };
            
            this.notes.push(newBlocker);
            this._saveNotes();
            
            return newBlocker;
        }
    }

    /**
     * Create a new reminder
     * @param {Object} reminderData - Reminder data
     * @returns {Promise<Object>} - Created reminder
     */
    async createReminder(reminderData) {
        try {
            const response = await fetch(this.routes.createReminder, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reminderData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const newReminder = await response.json();
            this.notes.push(newReminder);
            this.reminders.push(newReminder);
            
            // Re-sort reminders by time
            this.reminders.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dateA - dateB;
            });
            
            return newReminder;
        } catch (error) {
            console.error('Error creating reminder:', error);
            // Fallback to local creation if API fails
            const newReminder = {
                id: this._generateId(),
                type: 'reminder',
                ...reminderData,
                triggered: false,
                createdAt: new Date().toISOString()
            };
            
            this.notes.push(newReminder);
            this.reminders.push(newReminder);
            this._saveNotes();
            
            // Re-sort reminders by time
            this.reminders.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dateA - dateB;
            });
            
            return newReminder;
        }
    }

    /**
     * Update a note
     * @param {String} id - Note ID
     * @param {Object} noteData - Updated note data
     * @returns {Promise<Object>} - Updated note
     */
    async updateNote(id, noteData) {
        try {
            const response = await fetch(`${this.routes.updateNote.replace(':id', id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noteData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const updatedNote = await response.json();
            
            // Update local notes
            const index = this.notes.findIndex(note => note.id === id);
            if (index !== -1) {
                this.notes[index] = updatedNote;
            }
            
            // If it's a reminder that's been updated, we need to update the reminders list
            if (updatedNote.type === 'reminder') {
                this.initializeReminders();
            }
            
            return updatedNote;
        } catch (error) {
            console.error('Error updating note:', error);
            // Fallback to local update if API fails
            const index = this.notes.findIndex(note => note.id === id);
            if (index !== -1) {
                const oldNote = this.notes[index];
                const updatedNote = {
                    ...oldNote,
                    ...noteData,
                    updatedAt: new Date().toISOString()
                };
                
                this.notes[index] = updatedNote;
                this._saveNotes();
                
                // If it's a reminder that's been updated, we need to update the reminders list
                if (oldNote.type === 'reminder') {
                    this.initializeReminders();
                }
                
                return updatedNote;
            } else {
                throw new Error('Note not found');
            }
        }
    }

    /**
     * Delete a note
     * @param {String} id - Note ID
     * @returns {Promise<Boolean>} - Success status
     */
    async deleteNote(id) {
        try {
            const response = await fetch(`${this.routes.deleteNote.replace(':id', id)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Remove from local notes
            const index = this.notes.findIndex(note => note.id === id);
            if (index !== -1) {
                const deletedNote = this.notes[index];
                this.notes.splice(index, 1);
                
                // If it's a reminder, remove from reminders list
                if (deletedNote.type === 'reminder') {
                    const reminderIndex = this.reminders.findIndex(r => r.id === id);
                    if (reminderIndex !== -1) {
                        this.reminders.splice(reminderIndex, 1);
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            // Fallback to local deletion if API fails
            const index = this.notes.findIndex(note => note.id === id);
            if (index !== -1) {
                const deletedNote = this.notes[index];
                this.notes.splice(index, 1);
                this._saveNotes();
                
                // If it's a reminder, remove from reminders list
                if (deletedNote.type === 'reminder') {
                    const reminderIndex = this.reminders.findIndex(r => r.id === id);
                    if (reminderIndex !== -1) {
                        this.reminders.splice(reminderIndex, 1);
                    }
                }
                
                return true;
            } else {
                throw new Error('Note not found');
            }
        }
    }

    /**
     * Get calendar events
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {Promise<Array>} - Array of calendar events
     */
    async getCalendarEvents(start, end) {
        try {
            // Build query string from dates
            const queryParams = new URLSearchParams();
            if (start) {
                queryParams.append('start', start.toISOString());
            }
            if (end) {
                queryParams.append('end', end.toISOString());
            }
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const response = await fetch(`${this.routes.getCalendarEvents}${queryString}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            // Fallback to local conversion if API fails
            return this.notes.map(note => {
                const eventDate = new Date(note.date);
                let event = {
                    id: note.id,
                    title: note.content.substring(0, 30) + (note.content.length > 30 ? '...' : ''),
                    start: eventDate,
                    classNames: [note.type],
                    extendedProps: {
                        type: note.type,
                        content: note.content,
                        completed: note.completed
                    }
                };
                
                // Add time-specific properties for blockers and reminders
                if (note.type === 'blocker' && note.startTime && note.endTime) {
                    event.start = new Date(`${note.date}T${note.startTime}`);
                    event.end = new Date(`${note.date}T${note.endTime}`);
                    event.allDay = false;
                } else if (note.type === 'reminder' && note.time) {
                    event.start = new Date(`${note.date}T${note.time}`);
                    event.allDay = false;
                }
                
                return event;
            });
        }
    }

    /**
     * Get input text
     * @returns {Promise<String>} - Input text
     */
    async getInputText() {
        try {
            const response = await fetch(this.routes.getInputText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('Error getting input text:', error);
            // Fallback to localStorage if API fails
            return localStorage.getItem('inputText') || '';
        }
    }

    /**
     * Set input text
     * @param {String} text - Text to set as input
     * @returns {Promise<String>} - Set text
     */
    async setInputText(text) {
        try {
            const response = await fetch(this.routes.setInputText, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('Error setting input text:', error);
            // Fallback to localStorage if API fails
            localStorage.setItem('inputText', text);
            return text;
        }
    }

    /**
     * Get output text
     * @returns {Promise<String>} - Output text
     */
    async getOutputText() {
        try {
            const response = await fetch(this.routes.getOutputText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('Error getting output text:', error);
            // Fallback to localStorage if API fails
            return localStorage.getItem('outputText') || '';
        }
    }

    /**
     * Set output text
     * @param {String} text - Text to set as output
     * @returns {Promise<String>} - Set text
     */
    async setOutputText(text) {
        try {
            const response = await fetch(this.routes.setOutputText, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('Error setting output text:', error);
            // Fallback to localStorage if API fails
            localStorage.setItem('outputText', text);
            return text;
        }
    }

    /**
     * Format date and time for display
     * @param {String} date - Date string (YYYY-MM-DD)
     * @param {String} time - Time string (HH:MM)
     * @returns {String} - Formatted date and time
     * @private
     */
    _formatDateTime(date, time) {
        const dateObj = new Date(`${date}T${time || '00:00'}`);
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return dateObj.toLocaleString(undefined, options);
    }

    /**
     * Generate a unique ID
     * @returns {String} - Unique ID
     * @private
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Save notes to localStorage
     * @private
     */
    _saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
}

// Create and export API instance
const api = new ApiService(); 