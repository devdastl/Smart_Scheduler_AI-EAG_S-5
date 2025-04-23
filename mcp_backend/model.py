from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Time and Date Models
class GetCurrentTimeOutput(BaseModel):
    result: str

class GetCurrentDateOutput(BaseModel):
    result: str

class GetCurrentDayOutput(BaseModel):
    result: str

class GetDayOfWeekInput(BaseModel):
    date: str

class GetDayOfWeekOutput(BaseModel):
    result: str

# Todo Models
class ListTodosInput(BaseModel):
    date: str

class ListTodosOutput(BaseModel):
    result: List[Dict]

class CreateTodoInput(BaseModel):
    date: str
    content: str

class CreateTodoOutput(BaseModel):
    result: str

class CompleteTodoInput(BaseModel):
    id: str

class CompleteTodoOutput(BaseModel):
    result: str

class UncompleteTodoInput(BaseModel):
    id: str

class UncompleteTodoOutput(BaseModel):
    result: str

class DeleteTodoInput(BaseModel):
    id: str

class DeleteTodoOutput(BaseModel):
    result: str

# Event Models
class ListEventsInput(BaseModel):
    date: str

class ListEventsOutput(BaseModel):
    result: List[Dict]

class CreateEventInput(BaseModel):
    date: str
    content: str

class CreateEventOutput(BaseModel):
    result: str

class DeleteEventInput(BaseModel):
    id: str

class DeleteEventOutput(BaseModel):
    result: str

# Reminder Models
class ListRemindersInput(BaseModel):
    date: str

class ListRemindersOutput(BaseModel):
    result: List[Dict]

class CreateReminderInput(BaseModel):
    date: str
    time: str
    content: str

class CreateReminderOutput(BaseModel):
    result: str

class DeleteReminderInput(BaseModel):
    id: str

class DeleteReminderOutput(BaseModel):
    result: str

# Greeting Model
class GetGreetingInput(BaseModel):
    name: str

class GetGreetingOutput(BaseModel):
    result: str

# Code Review Models
class ReviewCodeInput(BaseModel):
    code: str

class ReviewCodeOutput(BaseModel):
    result: str

# Debug Models
class DebugErrorInput(BaseModel):
    error: str

class DebugErrorOutput(BaseModel):
    result: List[Dict] 

# Helper function to get the field types of a Pydantic model
def get_pydantic_field_types(class_name: str) -> Dict[str, str]:
    """
    Given the class name of a Pydantic model as a string,
    return a dictionary of its field names and their type annotations as strings.
    """
    cls = globals().get(class_name)
    
    if cls is None:
        raise ValueError(f"Class '{class_name}' not found.")
    
    if not issubclass(cls, BaseModel):
        raise TypeError(f"Class '{class_name}' is not a subclass of BaseModel.")
    
    return {field: str(annotation) for field, annotation in cls.__annotations__.items()}