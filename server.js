const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Data storage (in a real app, you'd use a database)
let notes = [];
const DATA_FILE = path.join(__dirname, 'data', 'notes.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Load data from file if it exists
if (fs.existsSync(DATA_FILE)) {
  try {
    notes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

// Save data to file
function saveNotes() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// API Routes

// GET /api/notes
app.get('/api/notes', (req, res) => {
  let filteredNotes = [...notes];
  
  // Apply filters if provided
  if (req.query.type && req.query.type !== 'all') {
    filteredNotes = filteredNotes.filter(note => note.type === req.query.type);
  }
  
  if (req.query.date) {
    const filterDate = new Date(req.query.date).toDateString();
    filteredNotes = filteredNotes.filter(note => {
      return new Date(note.date).toDateString() === filterDate;
    });
  }
  
  res.json(filteredNotes);
});

// GET /api/notes/:id
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(note => note.id === req.params.id);
  if (note) {
    res.json(note);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// POST /api/todos
app.post('/api/todos', (req, res) => {
  const newTodo = {
    id: generateId(),
    type: 'todo',
    ...req.body,
    createdAt: new Date().toISOString(),
    completed: false
  };
  
  notes.push(newTodo);
  saveNotes();
  
  res.json(newTodo);
});

// POST /api/events
app.post('/api/events', (req, res) => {
  const newEvent = {
    id: generateId(),
    type: 'event',
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newEvent);
  saveNotes();
  
  res.json(newEvent);
});

// POST /api/blockers
app.post('/api/blockers', (req, res) => {
  const newBlocker = {
    id: generateId(),
    type: 'blocker',
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newBlocker);
  saveNotes();
  
  res.json(newBlocker);
});

// POST /api/reminders
app.post('/api/reminders', (req, res) => {
  const newReminder = {
    id: generateId(),
    type: 'reminder',
    ...req.body,
    triggered: false,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newReminder);
  saveNotes();
  
  res.json(newReminder);
});

// PUT /api/notes/:id
app.put('/api/notes/:id', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id);
  if (index !== -1) {
    const oldNote = notes[index];
    const updatedNote = {
      ...oldNote,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    notes[index] = updatedNote;
    saveNotes();
    
    res.json(updatedNote);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id);
  if (index !== -1) {
    notes.splice(index, 1);
    saveNotes();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// GET /api/calendar
app.get('/api/calendar', (req, res) => {
  const start = req.query.start ? new Date(req.query.start) : new Date();
  const end = req.query.end ? new Date(req.query.end) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Convert notes to calendar events format
  const events = notes.map(note => {
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
  
  res.json(events);
});

// Input/Output endpoints
let inputText = '';
let outputText = '';

// GET /api/input
app.get('/api/input', (req, res) => {
  res.json({ text: inputText });
});

// POST /api/input
app.post('/api/input', (req, res) => {
  inputText = req.body.text || '';
  res.json({ text: inputText });
});

// GET /api/output
app.get('/api/output', (req, res) => {
  res.json({ text: outputText });
});

// POST /api/output
app.post('/api/output', (req, res) => {
  outputText = req.body.text || '';
  res.json({ text: outputText });
});

// POST /api/execute-python
app.post('/api/execute-python', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  
  // Execute the Python script with the input text
  const { exec } = require('child_process');
  const command = `python sample_script.py "${text}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error}`);
      return res.status(500).json({ error: 'Error executing Python script' });
    }
    
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    
    // Update the output text with the result
    outputText = stdout || 'No output from Python script';
    
    res.json({ text: outputText });
  });
});

// Todo specific endpoints
app.get('/api/todos/date/:date', (req, res) => {
  const filterDate = new Date(req.params.date).toDateString();
  const todos = notes.filter(note => {
    return note.type === 'todo' && new Date(note.date).toDateString() === filterDate;
  });
  res.json(todos);
});

app.post('/api/todos/date/:date', (req, res) => {
  const newTodo = {
    id: generateId(),
    type: 'todo',
    date: req.params.date,
    ...req.body,
    createdAt: new Date().toISOString(),
    completed: false
  };
  
  notes.push(newTodo);
  saveNotes();
  
  res.json(newTodo);
});

app.put('/api/todos/:id/toggle', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id && note.type === 'todo');
  if (index !== -1) {
    notes[index].completed = !notes[index].completed;
    notes[index].updatedAt = new Date().toISOString();
    saveNotes();
    res.json(notes[index]);
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id && note.type === 'todo');
  if (index !== -1) {
    notes.splice(index, 1);
    saveNotes();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// Event specific endpoints
app.get('/api/events/date/:date', (req, res) => {
  const filterDate = new Date(req.params.date).toDateString();
  const events = notes.filter(note => {
    return note.type === 'event' && new Date(note.date).toDateString() === filterDate;
  });
  res.json(events);
});

app.post('/api/events/date/:date', (req, res) => {
  const newEvent = {
    id: generateId(),
    type: 'event',
    date: req.params.date,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newEvent);
  saveNotes();
  
  res.json(newEvent);
});

app.delete('/api/events/:id', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id && note.type === 'event');
  if (index !== -1) {
    notes.splice(index, 1);
    saveNotes();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// Reminder specific endpoints
app.get('/api/reminders/date/:date', (req, res) => {
  const filterDate = new Date(req.params.date).toDateString();
  const reminders = notes.filter(note => {
    return note.type === 'reminder' && new Date(note.date).toDateString() === filterDate;
  });
  res.json(reminders);
});

app.post('/api/reminders/date/:date', (req, res) => {
  const newReminder = {
    id: generateId(),
    type: 'reminder',
    date: req.params.date,
    ...req.body,
    triggered: false,
    createdAt: new Date().toISOString()
  };
  
  notes.push(newReminder);
  saveNotes();
  
  res.json(newReminder);
});

app.delete('/api/reminders/:id', (req, res) => {
  const index = notes.findIndex(note => note.id === req.params.id && note.type === 'reminder');
  if (index !== -1) {
    notes.splice(index, 1);
    saveNotes();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
}); 