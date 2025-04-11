# Modern NoteTaker Application

A comprehensive note-taking web application with calendar integration, voice input, and API endpoints.

## Features

- **Modern UI Design**: Clean and responsive interface with light/dark theme support
- **Calendar Integration**: FullCalendar integration for visualization of notes, events, and todos
- **Multiple Note Types with Dedicated Interfaces**: 
  - Todo items with checkboxes
  - Events
  - Blockers with start & end time
  - Reminders with notification support
- **Time Management Features**:
  - Set time-bound blockers with start and end times
  - Create reminders with popup notifications
- **Filter System**: Filter notes by type
- **API Endpoints**: Structured endpoints for integration with other applications

## API Endpoints

The application provides the following API endpoints:

### Note Management
- `GET /api/notes` - Get all notes (with optional filtering)
- `GET /api/notes/:id` - Get a specific note by ID
- `POST /api/todos` - Create a new todo item
- `POST /api/events` - Create a new event
- `POST /api/blockers` - Create a new blocker with start/end times
- `POST /api/reminders` - Create a new reminder with notification
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note

### Calendar
- `GET /api/calendar` - Get calendar events

### External API Interface
- `GET /api/input` - Get the current input text
- `POST /api/input` - Set the input text
- `GET /api/output` - Get the current output text
- `POST /api/output` - Set the output text

## Getting Started

### Prerequisites

- A modern web browser that supports the Web Speech API (Chrome, Edge, or Firefox)
- A web server for hosting the application (optional for local development)

### Installation

1. Clone or download this repository
2. No build steps are required - this is a pure HTML, CSS, and JavaScript application

### Running the Application

#### Option 1: Using a Local Server

1. If you have Python installed:
   ```
   # For Python 3
   python -m http.server 8000
   
   # For Python 2
   python -m SimpleHTTPServer 8000
   ```

2. If you have Node.js installed:
   ```
   # Install a simple HTTP server globally
   npm install -g http-server
   
   # Run the server
   http-server
   ```

3. Visit `http://localhost:8000` or the appropriate port in your browser

#### Option 2: Using Live Server in VS Code

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

#### Option 3: Simply Open the HTML File

1. Double-click the `index.html` file to open it directly in your browser
   - Note: Some features like voice recognition may require a secure context (HTTPS or localhost)

### Running with API Support

To run the application with API support (required for LLM integration):

1. Make sure you have Node.js installed
2. Install the dependencies:
   ```
   cd NoteTaker
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Visit `http://localhost:3000` in your browser

The API server will be available at `http://localhost:3000/api/*` and can be used with tools like Thunder Client or for LLM integration.

API documentation is available at `http://localhost:3000/api-docs`.

## Usage Instructions

1. **Adding Items**:
   - Click on the corresponding button (Todo, Event, Blocker, or Reminder)
   - Fill out the form in the modal and click Save
   - You can also click on a date in the calendar to choose what type of item to create

2. **Managing Todos**:
   - Check/uncheck the checkbox to mark todos as complete/incomplete

3. **Setting Blockers**:
   - When creating a blocker, specify both start and end times
   - These will appear as time-bound events in the calendar

4. **Creating Reminders**:
   - Set a time for the reminder
   - When the time arrives, a notification will appear

5. **Viewing Items**:
   - Click on any item in the list or calendar to view its details
   - From the details view, you can edit or delete the item

6. **Filtering Items**:
   - Use the "Filter" dropdown to show only specific types of items

7. **Switching Themes**:
   - Click the moon/sun icon in the header to toggle between light and dark themes

## API Usage

The API endpoints can be used to integrate with other applications:

```javascript
// Example: Creating a todo via API
fetch('/api/todos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Complete project',
    date: '2023-06-15'
  })
})
.then(response => response.json())
.then(data => console.log('Todo created:', data));

// Example: Using the input/output interface
fetch('/api/output', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'This text will appear in the output section'
  })
})
.then(response => response.json())
.then(data => console.log('Output set:', data));
```

## Technical Details

- The application uses **LocalStorage** to persist data between sessions
- Reminders use browser notifications and are checked every minute
- FullCalendar is used for calendar functionality
- Font Awesome provides the icons

## Browser Compatibility

- Chrome: Full support
- Edge: Full support
- Firefox: Full support except for some voice recognition features
- Safari: Most features supported, but voice recognition may be limited

## License

This project is licensed under the MIT License - see the LICENSE file for details. 