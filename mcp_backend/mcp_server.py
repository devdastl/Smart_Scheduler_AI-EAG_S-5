# basic import 
from mcp.server.fastmcp import FastMCP, Image
from mcp.server.fastmcp.prompts import base
from mcp.types import TextContent
from mcp import types
import sys
import time
import subprocess
import os
import requests
from datetime import datetime
from model import *

# instantiate an MCP server client
mcp = FastMCP("NoteTaker")

# DEFINE TOOLS

#get current time
@mcp.tool()
def get_current_time() -> GetCurrentTimeOutput:
    """Get the current time in HH:MM format """
    return GetCurrentTimeOutput(result=datetime.now().strftime("%H:%M"))

# get current date
@mcp.tool()
def get_current_date() -> GetCurrentDateOutput:
    """Get the current date in YYYY-MM-DD format"""
    return GetCurrentDateOutput(result=datetime.now().strftime("%Y-%m-%d"))

# get current day of the week
@mcp.tool()
def get_current_day() -> GetCurrentDayOutput:
    """Get the current day of the week"""
    return GetCurrentDayOutput(result=datetime.now().strftime("%A"))

# given a date, return the day of the week
@mcp.tool()
def get_day_of_week(date: str) -> GetDayOfWeekOutput:
    """Get the day of the week for a given date in YYYY-MM-DD format"""
    return GetDayOfWeekOutput(result=f'The day of the week for {date} is {datetime.strptime(date, "%Y-%m-%d").strftime("%A")}')

# Get all todos given a date
@mcp.tool()
def list_todos(input: ListTodosInput) -> ListTodosOutput:
    """List all todos for a given date in YYYY-MM-DD format"""
    print("CALLED: list_todos(date: str) -> list[dict]:")
    response = requests.get(f"http://localhost:3000/api/todos/date/{input.date}")
    return ListTodosOutput(result=response.json())

# Create a todo given a date and content
@mcp.tool()
def create_todo(input: CreateTodoInput) -> CreateTodoOutput:
    """Create a todo given a date and content"""
    print("CALLED: create_todo(date: str, content: str) -> dict:")
    response = requests.post(f"http://localhost:3000/api/todos/date/{input.date}", json={"content": input.content})
    return CreateTodoOutput(result=f"Todo created successfully with id: {response.json()['id']}")

# change todo status to completed given a unique id
@mcp.tool()
def complete_todo(input: CompleteTodoInput) -> CompleteTodoOutput:
    """Change todo status to completed given a unique id"""
    print("CALLED: complete_todo(id: str) -> dict:")
    response = requests.put(f"http://localhost:3000/api/todos/{input.id}/toggle")
    return CompleteTodoOutput(result="Todo status updated successfully to completed")

# change todo status to uncompleted given a unique id
@mcp.tool()
def uncomplete_todo(input: UncompleteTodoInput) -> UncompleteTodoOutput:
    """Change todo status to uncompleted given a unique id"""
    print("CALLED: uncomplete_todo(id: str) -> dict:")
    response = requests.put(f"http://localhost:3000/api/todos/{input.id}/toggle")
    return UncompleteTodoOutput(result="Todo status updated successfully to uncompleted")

# Delete a todo given a unique id
@mcp.tool()
def delete_todo(input: DeleteTodoInput) -> DeleteTodoOutput:
    """Delete a todo given a unique id"""
    print("CALLED: delete_todo(id: str) -> dict:")
    response = requests.delete(f"http://localhost:3000/api/todos/{input.id}")
    return DeleteTodoOutput(result="Todo deleted successfully")

# Delete all todos given a date (dummy tool)
#@mcp.tool()
def delete_todos(date: str) -> dict:
    """Delete all todos given a date"""
    print("CALLED: delete_todos(date: str) -> dict:")
    response = requests.delete(f"http://localhost:3000/api/todos/date/{date}")
    return f"All todos deleted successfully"

# List all events given a date
@mcp.tool()
def list_events(input: ListEventsInput) -> ListEventsOutput:
    """List all events given a date"""
    print("CALLED: list_events(date: str) -> list[dict]:")
    response = requests.get(f"http://localhost:3000/api/events/date/{input.date}")
    return ListEventsOutput(result=response.json())

# Create an event given a date and content
@mcp.tool()
def create_event(input: CreateEventInput) -> CreateEventOutput:
    """Create an event given a date and content"""
    print("CALLED: create_event(date: str, content: str) -> dict:")
    response = requests.post(f"http://localhost:3000/api/events/date/{input.date}", json={"content": input.content})
    return CreateEventOutput(result=f"Event created successfully with id: {response.json()['id']}")

# Delete an event given a unique id
@mcp.tool()
def delete_event(input: DeleteEventInput) -> DeleteEventOutput:
    """Delete an event given a unique id"""
    print("CALLED: delete_event(id: str) -> dict:")
    response = requests.delete(f"http://localhost:3000/api/events/{input.id}")
    return DeleteEventOutput(result="Event deleted successfully")

# List reminders given a date
@mcp.tool()
def list_reminders(input: ListRemindersInput) -> ListRemindersOutput:
    """List reminders given a date"""
    print("CALLED: list_reminders(date: str) -> list[dict]:")
    response = requests.get(f"http://localhost:3000/api/reminders/date/{input.date}")
    return ListRemindersOutput(result=response.json())

# Create a reminder given a date in YYYY-MM-DD format and time in HH:MM 24-hour format and content
@mcp.tool()
def create_reminder(input: CreateReminderInput) -> CreateReminderOutput:
    """Create a reminder for a given date in YYYY-MM-DD format and at a given time in HH:MM 24-hour format and content"""
    print("CALLED: create_reminder(date: str, time: str, content: str) -> dict:")
    response = requests.post(f"http://localhost:3000/api/reminders/date/{input.date}", 
                           json={"content": input.content, "time": input.time})
    return CreateReminderOutput(result=f"Reminder created successfully with id: {response.json()['id']}")

# Delete a reminder given a unique id
@mcp.tool()
def delete_reminder(input: DeleteReminderInput) -> DeleteReminderOutput:
    """Delete a reminder given a unique id"""
    print("CALLED: delete_reminder(id: str) -> dict:")
    response = requests.delete(f"http://localhost:3000/api/reminders/{input.id}")
    return DeleteReminderOutput(result="Reminder deleted successfully")

# DEFINE RESOURCES

# Add a dynamic greeting resource
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    print("CALLED: get_greeting(name: str) -> str:")
    return f"Hello, {name}!"


# DEFINE AVAILABLE PROMPTS
@mcp.prompt()
def review_code(code: str) -> str:
    return f"Please review this code:\n\n{code}"
    print("CALLED: review_code(code: str) -> str:")


@mcp.prompt()
def debug_error(error: str) -> list[base.Message]:
    return [
        base.UserMessage("I'm seeing this error:"),
        base.UserMessage(error),
        base.AssistantMessage("I'll help debug that. What have you tried so far?"),
    ]

if __name__ == "__main__":
    # Check if running with mcp dev command
    print("STARTING THE SERVER AT AMAZING LOCATION")
    if len(sys.argv) > 1 and sys.argv[1] == "dev":
        mcp.run()  # Run without transport for dev server
    else:
        mcp.run(transport="stdio")  # Run with stdio for direct execution
