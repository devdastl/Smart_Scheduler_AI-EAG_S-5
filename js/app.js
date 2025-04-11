/**
 * Main Application Logic for NoteTaker
 * Manages notes and UI interactions
 */

class NotesManager {
    constructor() {
        this.currentFilter = 'all';
        this.initElements();
        this.addEventListeners();
        this.refreshNotesList();
    }

    /**
     * Initialize UI elements
     */
    initElements() {
        // Feature buttons
        this.addTodoBtn = document.getElementById('add-todo');
        this.addEventBtn = document.getElementById('add-event');
        this.addBlockerBtn = document.getElementById('add-blocker');
        this.addReminderBtn = document.getElementById('add-reminder');
        
        // Modals
        this.todoModal = document.getElementById('todo-modal');
        this.eventModal = document.getElementById('event-modal');
        this.blockerModal = document.getElementById('blocker-modal');
        this.reminderModal = document.getElementById('reminder-modal');
        this.noteDetailModal = document.getElementById('note-detail-modal');
        
        // Modal close buttons
        this.closeButtons = document.querySelectorAll('.modal .close');
        
        // Save buttons
        this.saveTodoBtn = document.getElementById('save-todo');
        this.saveEventBtn = document.getElementById('save-event');
        this.saveBlockerBtn = document.getElementById('save-blocker');
        this.saveReminderBtn = document.getElementById('save-reminder');
        
        // Filter links
        this.filterLinks = document.querySelectorAll('.dropdown-menu a');
        
        // Theme toggle
        this.themeToggle = document.querySelector('.theme-toggle');

        // Set today's date as default in all date inputs
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        document.getElementById('todo-date').value = formattedDate;
        document.getElementById('event-date').value = formattedDate;
        document.getElementById('blocker-date').value = formattedDate;
        document.getElementById('reminder-date').value = formattedDate;
        
        // Set default times for blocker and reminder
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        // Add one hour for end time
        const endHours = (now.getHours() + 1) % 24;
        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;
        
        document.getElementById('blocker-start-time').value = currentTime;
        document.getElementById('blocker-end-time').value = endTime;
        document.getElementById('reminder-time').value = currentTime;
    }

    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // Feature buttons
        if (this.addTodoBtn) {
            this.addTodoBtn.addEventListener('click', () => this.openModal(this.todoModal));
        }
        
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', () => this.openModal(this.eventModal));
        }
        
        if (this.addBlockerBtn) {
            this.addBlockerBtn.addEventListener('click', () => this.openModal(this.blockerModal));
        }
        
        if (this.addReminderBtn) {
            this.addReminderBtn.addEventListener('click', () => this.openModal(this.reminderModal));
        }
        
        // Close buttons
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Save buttons
        if (this.saveTodoBtn) {
            this.saveTodoBtn.addEventListener('click', () => this.saveTodo());
        }
        
        if (this.saveEventBtn) {
            this.saveEventBtn.addEventListener('click', () => this.saveEvent());
        }
        
        if (this.saveBlockerBtn) {
            this.saveBlockerBtn.addEventListener('click', () => this.saveBlocker());
        }
        
        if (this.saveReminderBtn) {
            this.saveReminderBtn.addEventListener('click', () => this.saveReminder());
        }

        // Filter links
        if (this.filterLinks) {
            this.filterLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.currentFilter = e.target.getAttribute('data-filter');
                    this.refreshNotesList();
                    
                    // Update UI to show active filter
                    this.filterLinks.forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                localStorage.setItem('dark-theme', isDark ? 'true' : 'false');
                
                // Update icon
                const icon = this.themeToggle.querySelector('i');
                if (isDark) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            });
        }

        // Load theme preference
        this.loadThemePreference();
    }

    /**
     * Open a modal
     * @param {HTMLElement} modal - Modal to open
     */
    openModal(modal) {
        if (!modal) return;
        
        // Close all modals first
        this.closeAllModals();
        
        // Reset form state
        const editId = modal.querySelector('[data-edit-id]');
        if (editId) {
            editId.removeAttribute('data-edit-id');
        }
        
        // Clear form fields
        const textareas = modal.querySelectorAll('textarea');
        textareas.forEach(textarea => textarea.value = '');
        
        // Set current date
        const dateInputs = modal.querySelectorAll('input[type="date"]');
        const today = new Date().toISOString().split('T')[0];
        dateInputs.forEach(input => input.value = today);
        
        // Set current time for time inputs
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        const startTimeInput = modal.querySelector('#blocker-start-time');
        if (startTimeInput) {
            startTimeInput.value = currentTime;
        }
        
        const endTimeInput = modal.querySelector('#blocker-end-time');
        if (endTimeInput) {
            // Add one hour for end time
            const endHours = (now.getHours() + 1) % 24;
            const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;
            endTimeInput.value = endTime;
        }
        
        const reminderTimeInput = modal.querySelector('#reminder-time');
        if (reminderTimeInput) {
            reminderTimeInput.value = currentTime;
        }
        
        // Show the modal
        modal.style.display = 'block';
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.id !== 'reminder-alert') {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Save a todo
     */
    saveTodo() {
        const content = document.getElementById('todo-content').value.trim();
        const date = document.getElementById('todo-date').value;
        
        if (!content) {
            alert('Please enter some content for your todo');
            return;
        }
        
        const todoData = {
            content,
            date
        };
        
        const editId = this.saveTodoBtn.getAttribute('data-edit-id');
        
        if (editId) {
            api.updateNote(editId, todoData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error updating todo:', error);
                });
        } else {
            api.createTodo(todoData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error creating todo:', error);
                });
        }
    }
    
    /**
     * Save an event
     */
    saveEvent() {
        const content = document.getElementById('event-content').value.trim();
        const date = document.getElementById('event-date').value;
        
        if (!content) {
            alert('Please enter some content for your event');
            return;
        }
        
        const eventData = {
            content,
            date
        };
        
        const editId = this.saveEventBtn.getAttribute('data-edit-id');
        
        if (editId) {
            api.updateNote(editId, eventData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error updating event:', error);
                });
        } else {
            api.createEvent(eventData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error creating event:', error);
                });
        }
    }
    
    /**
     * Save a blocker
     */
    saveBlocker() {
        const content = document.getElementById('blocker-content').value.trim();
        const date = document.getElementById('blocker-date').value;
        const startTime = document.getElementById('blocker-start-time').value;
        const endTime = document.getElementById('blocker-end-time').value;
        
        if (!content) {
            alert('Please enter some content for your blocker');
            return;
        }
        
        if (!startTime || !endTime) {
            alert('Please specify both start and end times');
            return;
        }
        
        if (startTime >= endTime) {
            alert('End time must be after start time');
            return;
        }
        
        const blockerData = {
            content,
            date,
            startTime,
            endTime
        };
        
        const editId = this.saveBlockerBtn.getAttribute('data-edit-id');
        
        if (editId) {
            api.updateNote(editId, blockerData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error updating blocker:', error);
                });
        } else {
            api.createBlocker(blockerData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error creating blocker:', error);
                });
        }
    }
    
    /**
     * Save a reminder
     */
    saveReminder() {
        const content = document.getElementById('reminder-content').value.trim();
        const date = document.getElementById('reminder-date').value;
        const time = document.getElementById('reminder-time').value;
        
        if (!content) {
            alert('Please enter some content for your reminder');
            return;
        }
        
        if (!time) {
            alert('Please specify a time for the reminder');
            return;
        }
        
        const reminderData = {
            content,
            date,
            time
        };
        
        const editId = this.saveReminderBtn.getAttribute('data-edit-id');
        
        if (editId) {
            api.updateNote(editId, reminderData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error updating reminder:', error);
                });
        } else {
            api.createReminder(reminderData)
                .then(() => {
                    this.closeAllModals();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error creating reminder:', error);
                });
        }
    }

    /**
     * Refresh the notes list based on current filter
     */
    async refreshNotesList() {
        try {
            const filters = {};
            if (this.currentFilter !== 'all') {
                filters.type = this.currentFilter;
            }

            const notes = await api.getNotes(filters);
            this.renderNotes(notes);
        } catch (error) {
            console.error('Error refreshing notes:', error);
        }
    }

    /**
     * Render notes in the UI
     * @param {Array} notes - Array of notes
     */
    renderNotes(notes) {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) return;

        // Clear existing notes
        notesList.innerHTML = '';

        if (notes.length === 0) {
            notesList.innerHTML = '<p class="no-notes">No notes found</p>';
            return;
        }

        // Sort notes by date (newest first)
        notes.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || a.startTime || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || b.startTime || '00:00'}`);
            return dateB - dateA;
        });

        // Create note items
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${note.type}`;
            noteElement.dataset.id = note.id;

            let noteContent = '';
            let dateTimeDisplay = this.formatDate(note.date);
            
            // Add time display for blockers and reminders
            if (note.type === 'blocker' && note.startTime && note.endTime) {
                dateTimeDisplay += `<span class="note-time">${note.startTime} - ${note.endTime}</span>`;
            } else if (note.type === 'reminder' && note.time) {
                dateTimeDisplay += `<span class="note-time">${note.time}</span>`;
            }

            if (note.type === 'todo') {
                const isChecked = note.completed ? 'checked' : '';
                const completedClass = note.completed ? 'completed' : '';
                
                noteContent = `
                    <div class="note-date">${dateTimeDisplay}</div>
                    <div class="todo-container">
                        <input type="checkbox" class="todo-checkbox" ${isChecked} data-action="toggle">
                        <div class="note-content ${completedClass}">${note.content}</div>
                    </div>
                    <div class="note-actions">
                        <i class="fas fa-edit" data-action="edit"></i>
                        <i class="fas fa-trash" data-action="delete"></i>
                    </div>
                `;
            } else {
                noteContent = `
                    <div class="note-date">${dateTimeDisplay}</div>
                    <div class="note-content">${note.content}</div>
                    <div class="note-actions">
                        <i class="fas fa-edit" data-action="edit"></i>
                        <i class="fas fa-trash" data-action="delete"></i>
                    </div>
                `;
            }

            noteElement.innerHTML = noteContent;
            notesList.appendChild(noteElement);

            // Add event listeners for note actions
            this.addNoteItemListeners(noteElement, note);
        });
    }

    /**
     * Add event listeners to note item
     * @param {Element} noteElement - Note element
     * @param {Object} note - Note data
     */
    addNoteItemListeners(noteElement, note) {
        // Edit button
        const editBtn = noteElement.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editNote(note);
            });
        }

        // Delete button
        const deleteBtn = noteElement.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this note?')) {
                    this.deleteNote(note.id);
                }
            });
        }

        // Todo checkbox
        const todoCheckbox = noteElement.querySelector('[data-action="toggle"]');
        if (todoCheckbox) {
            todoCheckbox.addEventListener('change', (e) => {
                this.toggleTodoStatus(note.id, e.target.checked);
            });
        }

        // Make the whole note clickable to view details
        noteElement.addEventListener('click', (e) => {
            // Don't trigger if clicking on a control
            if (e.target.hasAttribute('data-action') || 
                e.target.classList.contains('todo-checkbox') ||
                e.target.closest('[data-action]')) {
                return;
            }
            
            this.showNoteDetail(note);
        });
    }

    /**
     * Edit a note
     * @param {Object} note - Note to edit
     */
    editNote(note) {
        let modal;
        let contentField;
        let dateField;
        let saveButton;
        
        // Determine which modal to use based on note type
        switch (note.type) {
            case 'todo':
                modal = this.todoModal;
                contentField = document.getElementById('todo-content');
                dateField = document.getElementById('todo-date');
                saveButton = this.saveTodoBtn;
                break;
            case 'event':
                modal = this.eventModal;
                contentField = document.getElementById('event-content');
                dateField = document.getElementById('event-date');
                saveButton = this.saveEventBtn;
                break;
            case 'blocker':
                modal = this.blockerModal;
                contentField = document.getElementById('blocker-content');
                dateField = document.getElementById('blocker-date');
                
                // Set time fields
                const startTimeField = document.getElementById('blocker-start-time');
                const endTimeField = document.getElementById('blocker-end-time');
                
                if (startTimeField && note.startTime) {
                    startTimeField.value = note.startTime;
                }
                
                if (endTimeField && note.endTime) {
                    endTimeField.value = note.endTime;
                }
                
                saveButton = this.saveBlockerBtn;
                break;
            case 'reminder':
                modal = this.reminderModal;
                contentField = document.getElementById('reminder-content');
                dateField = document.getElementById('reminder-date');
                
                // Set time field
                const timeField = document.getElementById('reminder-time');
                if (timeField && note.time) {
                    timeField.value = note.time;
                }
                
                saveButton = this.saveReminderBtn;
                break;
            default:
                return;
        }
        
        // Set values
        if (contentField) contentField.value = note.content;
        if (dateField) dateField.value = note.date;
        
        // Store the note ID for updating
        if (saveButton) {
            saveButton.setAttribute('data-edit-id', note.id);
        }
        
        // Open the modal
        this.openModal(modal);
    }
    
    /**
     * Show note details in a modal
     * @param {Object} note - Note to display
     */
    showNoteDetail(note) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (!modalTitle || !modalBody) return;
        
        // Set modal title
        modalTitle.textContent = this.getTypeTitle(note.type);
        
        // Format date and time display
        let dateTimeDisplay = this.formatDate(note.date);
        if (note.type === 'blocker' && note.startTime && note.endTime) {
            dateTimeDisplay = `${dateTimeDisplay}, ${note.startTime} - ${note.endTime}`;
        } else if (note.type === 'reminder' && note.time) {
            dateTimeDisplay = `${dateTimeDisplay}, ${note.time}`;
        }
        
        // Create modal content
        let content = `
            <div class="note-detail ${note.type}">
                <div class="note-date">${dateTimeDisplay}</div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions-container">
                    <button class="btn primary edit-note" data-id="${note.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn secondary delete-note" data-id="${note.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;

        // If it's a todo, add a checkbox
        if (note.type === 'todo') {
            const isChecked = note.completed ? 'checked' : '';
            content = `
                <div class="note-detail ${note.type}">
                    <div class="note-date">${dateTimeDisplay}</div>
                    <div class="todo-container">
                        <input type="checkbox" class="todo-checkbox" ${isChecked} data-id="${note.id}">
                        <div class="note-content ${note.completed ? 'completed' : ''}">${note.content}</div>
                    </div>
                    <div class="note-actions-container">
                        <button class="btn primary edit-note" data-id="${note.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn secondary delete-note" data-id="${note.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }

        modalBody.innerHTML = content;

        // Add event listeners for edit and delete buttons
        const editBtn = modalBody.querySelector('.edit-note');
        const deleteBtn = modalBody.querySelector('.delete-note');
        const todoCheckbox = modalBody.querySelector('.todo-checkbox');

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editNote(note);
                this.closeAllModals();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this note?')) {
                    this.deleteNote(note.id);
                    this.closeAllModals();
                }
            });
        }

        if (todoCheckbox) {
            todoCheckbox.addEventListener('change', (e) => {
                this.toggleTodoStatus(note.id, e.target.checked);
            });
        }

        // Show the modal
        this.noteDetailModal.style.display = 'block';
    }

    /**
     * Delete a note
     * @param {String} id - Note ID
     */
    deleteNote(id) {
        api.deleteNote(id)
            .then(() => {
                this.refreshNotesList();
                if (calendarManager) {
                    calendarManager.refreshCalendar();
                }
            })
            .catch(error => {
                console.error('Error deleting note:', error);
            });
    }

    /**
     * Toggle todo status
     * @param {String} id - Note ID
     * @param {Boolean} completed - Completed status
     */
    toggleTodoStatus(id, completed) {
        api.updateNote(id, { completed })
            .then(() => {
                this.refreshNotesList();
                if (calendarManager) {
                    calendarManager.refreshCalendar();
                }
            })
            .catch(error => {
                console.error('Error updating todo status:', error);
            });
    }

    /**
     * Format date for display
     * @param {String} dateString - Date string
     * @returns {String} - Formatted date
     */
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    /**
     * Get title for note type
     * @param {String} type - Note type
     * @returns {String} - Type title
     */
    getTypeTitle(type) {
        const titles = {
            todo: 'Todo Item',
            event: 'Event',
            blocker: 'Blocker',
            reminder: 'Reminder'
        };
        return titles[type] || 'Note';
    }

    /**
     * Load theme preference
     */
    loadThemePreference() {
        const isDark = localStorage.getItem('dark-theme') === 'true';
        if (isDark) {
            document.body.classList.add('dark-theme');
            
            // Update icon
            const icon = this.themeToggle.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Initialize notes manager when DOM is loaded
let notesManager;
document.addEventListener('DOMContentLoaded', () => {
    notesManager = new NotesManager();
}); 