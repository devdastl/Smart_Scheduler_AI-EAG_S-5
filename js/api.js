/**
 * API Service for NoteTaker Application
 * This module handles all API endpoints and data management
 */

class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.initializeRoutes();
    }

    /**
     * Initialize API routes
     */
    initializeRoutes() {
        // API endpoints documentation for reference
        this.routes = {
            getNotes: '/api/notes',
            getNoteById: '/api/notes/:id',
            createNote: '/api/notes',
            updateNote: '/api/notes/:id',
            deleteNote: '/api/notes/:id',
            getCalendarEvents: '/api/calendar',
            getOutputText: '/api/output',
            setOutputText: '/api/output'
        };
    }

    /**
     * Get all notes
     * @param {Object} filters - Filters for notes (type, date, etc)
     * @returns {Promise<Array>} - Array of notes
     */
    async getNotes(filters = {}) {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                let filteredNotes = [...this.notes];
                
                // Apply filters
                if (filters.type && filters.type !== 'all') {
                    filteredNotes = filteredNotes.filter(note => note.type === filters.type);
                }
                
                if (filters.date) {
                    const filterDate = new Date(filters.date).toDateString();
                    filteredNotes = filteredNotes.filter(note => {
                        return new Date(note.date).toDateString() === filterDate;
                    });
                }
                
                resolve(filteredNotes);
            }, 100);
        });
    }

    /**
     * Get note by ID
     * @param {String} id - Note ID
     * @returns {Promise<Object>} - Note object
     */
    async getNoteById(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const note = this.notes.find(note => note.id === id);
                if (note) {
                    resolve(note);
                } else {
                    reject(new Error('Note not found'));
                }
            }, 100);
        });
    }

    /**
     * Create a new note
     * @param {Object} noteData - Note data
     * @returns {Promise<Object>} - Created note
     */
    async createNote(noteData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const newNote = {
                    id: this._generateId(),
                    ...noteData,
                    createdAt: new Date().toISOString(),
                    completed: noteData.type === 'todo' ? false : undefined
                };
                
                this.notes.push(newNote);
                this._saveNotes();
                
                resolve(newNote);
            }, 100);
        });
    }

    /**
     * Update a note
     * @param {String} id - Note ID
     * @param {Object} noteData - Updated note data
     * @returns {Promise<Object>} - Updated note
     */
    async updateNote(id, noteData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = this.notes.findIndex(note => note.id === id);
                if (index !== -1) {
                    const updatedNote = {
                        ...this.notes[index],
                        ...noteData,
                        updatedAt: new Date().toISOString()
                    };
                    
                    this.notes[index] = updatedNote;
                    this._saveNotes();
                    
                    resolve(updatedNote);
                } else {
                    reject(new Error('Note not found'));
                }
            }, 100);
        });
    }

    /**
     * Delete a note
     * @param {String} id - Note ID
     * @returns {Promise<Boolean>} - Success status
     */
    async deleteNote(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = this.notes.findIndex(note => note.id === id);
                if (index !== -1) {
                    this.notes.splice(index, 1);
                    this._saveNotes();
                    resolve(true);
                } else {
                    reject(new Error('Note not found'));
                }
            }, 100);
        });
    }

    /**
     * Get calendar events
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {Promise<Array>} - Array of calendar events
     */
    async getCalendarEvents(start, end) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Convert notes to calendar events format
                const events = this.notes.map(note => {
                    const eventDate = new Date(note.date);
                    return {
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
                });
                
                resolve(events);
            }, 100);
        });
    }

    /**
     * Get output text
     * @returns {Promise<String>} - Output text
     */
    async getOutputText() {
        return new Promise(resolve => {
            setTimeout(() => {
                const outputText = localStorage.getItem('outputText') || '';
                resolve(outputText);
            }, 100);
        });
    }

    /**
     * Set output text
     * @param {String} text - Text to set as output
     * @returns {Promise<String>} - Set text
     */
    async setOutputText(text) {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem('outputText', text);
                resolve(text);
            }, 100);
        });
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