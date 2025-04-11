/**
 * Calendar functionality for the NoteTaker app
 * Uses FullCalendar library for the calendar UI
 */

class CalendarManager {
    constructor() {
        this.calendarEl = document.getElementById('calendar');
        this.calendar = null;
        this.initCalendar();
    }

    /**
     * Initialize the FullCalendar
     */
    initCalendar() {
        if (!this.calendarEl) return;

        this.calendar = new FullCalendar.Calendar(this.calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: this.fetchEvents.bind(this),
            eventClick: this.handleEventClick.bind(this),
            dateClick: this.handleDateClick.bind(this),
            height: 'auto',
            themeSystem: 'standard',
            slotDuration: '01:00:00',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        });

        this.calendar.render();
    }

    /**
     * Fetch events from the API
     * @param {Object} info - Info object from FullCalendar
     * @param {Function} successCallback - Success callback function
     * @param {Function} failureCallback - Failure callback function
     */
    fetchEvents(info, successCallback, failureCallback) {
        const start = info.start;
        const end = info.end;

        api.getCalendarEvents(start, end)
            .then(events => {
                successCallback(events);
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                failureCallback(error);
            });
    }

    /**
     * Handle event click
     * @param {Object} info - Event info from FullCalendar
     */
    handleEventClick(info) {
        const eventId = info.event.id;
        
        api.getNoteById(eventId)
            .then(note => {
                this.showNoteDetail(note);
            })
            .catch(error => {
                console.error('Error fetching note:', error);
            });
    }

    /**
     * Show note detail in modal
     * @param {Object} note - Note object
     */
    showNoteDetail(note) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        // Set modal title
        modalTitle.textContent = this.getModalTitleByType(note.type);

        // Create modal content
        let content = `
            <div class="note-detail ${note.type}">
                <div class="note-date">${this.formatDate(note.date)}</div>
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
                    <div class="note-date">${this.formatDate(note.date)}</div>
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
                modal.style.display = 'none';
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteNote(note.id);
                modal.style.display = 'none';
            });
        }

        if (todoCheckbox) {
            todoCheckbox.addEventListener('change', (e) => {
                this.toggleTodoStatus(note.id, e.target.checked);
            });
        }

        // Show modal
        modal.style.display = 'block';

        // Add close button functionality
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };

        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    /**
     * Handle date click
     * @param {Object} info - Date info from FullCalendar
     */
    handleDateClick(info) {
        // Set the date in the note creation form
        const dateInput = document.getElementById('note-date');
        if (dateInput) {
            dateInput.value = info.dateStr;
        }

        // Focus on the input text area
        const inputText = document.getElementById('input-text');
        if (inputText) {
            inputText.focus();
        }
    }

    /**
     * Get modal title based on note type
     * @param {String} type - Note type
     * @returns {String} - Modal title
     */
    getModalTitleByType(type) {
        const titles = {
            todo: 'Todo Item',
            event: 'Event',
            blocker: 'Blocker',
            reminder: 'Reminder'
        };
        return titles[type] || 'Note Detail';
    }

    /**
     * Format date string
     * @param {String} dateString - Date string
     * @returns {String} - Formatted date
     */
    formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    /**
     * Edit note
     * @param {Object} note - Note to edit
     */
    editNote(note) {
        // Set form values
        const inputText = document.getElementById('input-text');
        const noteType = document.getElementById('note-type');
        const noteDate = document.getElementById('note-date');
        
        if (inputText) inputText.value = note.content;
        if (noteType) noteType.value = note.type;
        if (noteDate) {
            // Convert date to YYYY-MM-DD format for the date input
            const date = new Date(note.date);
            const formattedDate = date.toISOString().split('T')[0];
            noteDate.value = formattedDate;
        }

        // Store the note ID for updating
        document.getElementById('save-note').setAttribute('data-edit-id', note.id);
    }

    /**
     * Delete note
     * @param {String} id - Note ID
     */
    deleteNote(id) {
        api.deleteNote(id)
            .then(() => {
                this.refreshCalendar();
                notesManager.refreshNotesList();
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
                this.refreshCalendar();
            })
            .catch(error => {
                console.error('Error updating todo status:', error);
            });
    }

    /**
     * Refresh calendar
     */
    refreshCalendar() {
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }
}

// Initialize calendar when DOM is loaded
let calendarManager;
document.addEventListener('DOMContentLoaded', () => {
    calendarManager = new CalendarManager();
}); 