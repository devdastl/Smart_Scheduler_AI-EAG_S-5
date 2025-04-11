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
                if (notesManager) {
                    notesManager.showNoteDetail(note);
                }
            })
            .catch(error => {
                console.error('Error fetching note:', error);
            });
    }

    /**
     * Handle date click
     * @param {Object} info - Date info from FullCalendar
     */
    handleDateClick(info) {
        // Determine if we should ask which type of item to create
        const modal = document.getElementById('todo-modal');
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'date-selection-buttons';
        buttonContainer.innerHTML = `
            <p>What would you like to create?</p>
            <div class="buttons">
                <button class="btn feature-btn todo" data-type="todo">Todo</button>
                <button class="btn feature-btn event" data-type="event">Event</button>
                <button class="btn feature-btn blocker" data-type="blocker">Blocker</button>
                <button class="btn feature-btn reminder" data-type="reminder">Reminder</button>
            </div>
        `;
        
        // Create and show a modal for selecting item type
        const dateSelectionModal = document.getElementById('note-detail-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (dateSelectionModal && modalTitle && modalBody) {
            modalTitle.textContent = `Add Item on ${this.formatDate(info.dateStr)}`;
            modalBody.innerHTML = '';
            modalBody.appendChild(buttonContainer);
            
            // Add click event listeners to buttons
            const buttons = buttonContainer.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    dateSelectionModal.style.display = 'none';
                    
                    const type = button.getAttribute('data-type');
                    let typeModal;
                    
                    // Set the date in the appropriate modal
                    switch (type) {
                        case 'todo':
                            typeModal = document.getElementById('todo-modal');
                            document.getElementById('todo-date').value = info.dateStr;
                            break;
                        case 'event':
                            typeModal = document.getElementById('event-modal');
                            document.getElementById('event-date').value = info.dateStr;
                            break;
                        case 'blocker':
                            typeModal = document.getElementById('blocker-modal');
                            document.getElementById('blocker-date').value = info.dateStr;
                            break;
                        case 'reminder':
                            typeModal = document.getElementById('reminder-modal');
                            document.getElementById('reminder-date').value = info.dateStr;
                            break;
                    }
                    
                    if (typeModal && notesManager) {
                        notesManager.openModal(typeModal);
                    }
                });
            });
            
            dateSelectionModal.style.display = 'block';
            
            // Add close button functionality
            const closeBtn = dateSelectionModal.querySelector('.close');
            closeBtn.onclick = function() {
                dateSelectionModal.style.display = 'none';
            };
            
            // Close when clicking outside
            window.onclick = function(event) {
                if (event.target === dateSelectionModal) {
                    dateSelectionModal.style.display = 'none';
                }
            };
        }
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