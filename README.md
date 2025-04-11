# Modern NoteTaker Application

A comprehensive note-taking web application with calendar integration, voice input, and API endpoints.

## Features

- **Modern UI Design**: Clean and responsive interface with light/dark theme support
- **Calendar Integration**: FullCalendar integration for visualization of notes, events, and todos
- **Multiple Note Types**: 
  - Todo items with checkboxes
  - Events
  - Blockers
  - Reminders
- **Voice Input**: Speech-to-text functionality for easy note creation
- **Filter System**: Filter notes by type
- **API Endpoints**: Structured endpoints for integration with other applications

## API Endpoints

The application provides the following API endpoints:

- `GET /api/notes` - Get all notes (with optional filtering)
- `GET /api/notes/:id` - Get a specific note by ID
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/calendar` - Get calendar events
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

## Usage Instructions

1. **Adding a Note**:
   - Type your note in the input box or use the microphone button for voice input
   - Select the note type (Todo, Event, Blocker, or Reminder)
   - Choose a date from the date picker
   - Click "Save Note"

2. **Using the Calendar**:
   - Navigate through months using the arrow buttons
   - Click a date to automatically set it in the note creation form
   - Click on events in the calendar to view details

3. **Filtering Notes**:
   - Use the "Filter" dropdown to show only specific types of notes

4. **Managing Todos**:
   - Check/uncheck the checkbox to mark todos as complete/incomplete

5. **Switching Themes**:
   - Click the moon/sun icon in the header to toggle between light and dark themes

6. **Voice Input**:
   - Click the microphone icon
   - Speak clearly into your microphone
   - The transcribed text will appear in the input box
   - You can edit the transcribed text if needed

## Technical Details

- The application uses **LocalStorage** to persist data between sessions
- The Web Speech API is used for voice recognition
- FullCalendar is used for calendar functionality
- Font Awesome provides the icons

## Browser Compatibility

- Chrome: Full support
- Edge: Full support
- Firefox: Full support except for some voice recognition features
- Safari: Most features supported, but voice recognition may be limited

## License

This project is licensed under the MIT License - see the LICENSE file for details. 