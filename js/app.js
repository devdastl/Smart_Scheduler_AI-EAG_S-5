/**
 * Main Application Logic for NoteTaker
 * Manages notes and UI interactions
 */

class NotesManager {
    constructor() {
        this.currentFilter = 'all';
        this.initElements();
        this.addEventListeners();
        this.loadOutput();
        this.refreshNotesList();
    }

    /**
     * Initialize UI elements
     */
    initElements() {
        // Form elements
        this.inputText = document.getElementById('input-text');
        this.noteType = document.getElementById('note-type');
        this.noteDate = document.getElementById('note-date');
        this.saveNoteBtn = document.getElementById('save-note');
        this.newNoteBtn = document.getElementById('new-note');
        
        // Output container
        this.outputContainer = document.getElementById('output-text');
        
        // Filter links
        this.filterLinks = document.querySelectorAll('.dropdown-menu a');
        
        // Theme toggle
        this.themeToggle = document.querySelector('.theme-toggle');

        // Set today's date as default
        if (this.noteDate) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            this.noteDate.value = formattedDate;
        }
    }

    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // Save note button
        if (this.saveNoteBtn) {
            this.saveNoteBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }

        // New note button
        if (this.newNoteBtn) {
            this.newNoteBtn.addEventListener('click', () => {
                this.resetForm();
            });
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

        // Input text change for output
        if (this.inputText) {
            this.inputText.addEventListener('input', () => {
                this.updateOutput();
            });
        }
    }

    /**
     * Save a note
     */
    saveNote() {
        if (!this.inputText || !this.noteType || !this.noteDate) return;
        
        const content = this.inputText.value.trim();
        if (!content) {
            alert('Please enter some content for your note');
            return;
        }

        const noteData = {
            content,
            type: this.noteType.value,
            date: this.noteDate.value
        };

        // Check if we're editing an existing note
        const editId = this.saveNoteBtn.getAttribute('data-edit-id');
        
        if (editId) {
            api.updateNote(editId, noteData)
                .then(() => {
                    this.resetForm();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error updating note:', error);
                });
        } else {
            api.createNote(noteData)
                .then(() => {
                    this.resetForm();
                    this.refreshNotesList();
                    if (calendarManager) {
                        calendarManager.refreshCalendar();
                    }
                })
                .catch(error => {
                    console.error('Error creating note:', error);
                });
        }
    }

    /**
     * Reset the form
     */
    resetForm() {
        if (this.inputText) this.inputText.value = '';
        if (this.noteType) this.noteType.value = 'todo';
        
        // Set today's date
        if (this.noteDate) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            this.noteDate.value = formattedDate;
        }

        // Remove edit ID if any
        if (this.saveNoteBtn) {
            this.saveNoteBtn.removeAttribute('data-edit-id');
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
        const outputSection = document.querySelector('.output-section');
        if (!outputSection) return;

        // Create a container for the notes list if it doesn't exist
        let notesListContainer = document.querySelector('.notes-list');
        if (!notesListContainer) {
            notesListContainer = document.createElement('div');
            notesListContainer.className = 'notes-list';
            outputSection.appendChild(notesListContainer);
        }

        // Clear existing notes
        notesListContainer.innerHTML = '';

        if (notes.length === 0) {
            notesListContainer.innerHTML = '<p class="no-notes">No notes found</p>';
            return;
        }

        // Sort notes by date (newest first)
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Create note items
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${note.type}`;
            noteElement.dataset.id = note.id;

            let noteContent = `
                <div class="note-date">${this.formatDate(note.date)}</div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                    <i class="fas fa-edit" data-action="edit"></i>
                    <i class="fas fa-trash" data-action="delete"></i>
                </div>
            `;

            // Add checkbox for todos
            if (note.type === 'todo') {
                const isChecked = note.completed ? 'checked' : '';
                const completedClass = note.completed ? 'completed' : '';
                
                noteContent = `
                    <div class="note-date">${this.formatDate(note.date)}</div>
                    <div class="todo-container">
                        <input type="checkbox" class="todo-checkbox" ${isChecked} data-action="toggle">
                        <div class="note-content ${completedClass}">${note.content}</div>
                    </div>
                    <div class="note-actions">
                        <i class="fas fa-edit" data-action="edit"></i>
                        <i class="fas fa-trash" data-action="delete"></i>
                    </div>
                `;
            }

            noteElement.innerHTML = noteContent;
            notesListContainer.appendChild(noteElement);

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
                if (calendarManager) {
                    calendarManager.editNote(note);
                } else {
                    this.editNote(note);
                }
            });
        }

        // Delete button
        const deleteBtn = noteElement.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this note?')) {
                    if (calendarManager) {
                        calendarManager.deleteNote(note.id);
                    } else {
                        this.deleteNote(note.id);
                    }
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
    }

    /**
     * Edit a note
     * @param {Object} note - Note to edit
     */
    editNote(note) {
        // Set form values
        if (this.inputText) this.inputText.value = note.content;
        if (this.noteType) this.noteType.value = note.type;
        if (this.noteDate) {
            // Convert date to YYYY-MM-DD format for the date input
            const date = new Date(note.date);
            const formattedDate = date.toISOString().split('T')[0];
            this.noteDate.value = formattedDate;
        }

        // Store the note ID for updating
        if (this.saveNoteBtn) {
            this.saveNoteBtn.setAttribute('data-edit-id', note.id);
        }

        // Scroll to form
        this.inputText.scrollIntoView({ behavior: 'smooth' });
        this.inputText.focus();
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

    /**
     * Update output based on input
     */
    updateOutput() {
        if (!this.inputText || !this.outputContainer) return;
        
        const inputValue = this.inputText.value;
        this.outputContainer.textContent = inputValue;
        
        // Save to storage for API access
        api.setOutputText(inputValue);
    }

    /**
     * Load output text from storage
     */
    async loadOutput() {
        if (!this.outputContainer) return;
        
        try {
            const outputText = await api.getOutputText();
            this.outputContainer.textContent = outputText;
        } catch (error) {
            console.error('Error loading output text:', error);
        }
    }
}

// Initialize notes manager when DOM is loaded
let notesManager;
document.addEventListener('DOMContentLoaded', () => {
    notesManager = new NotesManager();
}); 