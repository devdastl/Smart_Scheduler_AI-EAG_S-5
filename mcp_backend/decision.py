from typing import Dict, Any, List
from google import genai
from perception import perceive_input
from system_prompt_template import system_prompt

async def make_decision(
    client: genai.Client,
    current_query: str,
    tools_description: str,
    memory_manager: Any
) -> Dict[str, Any]:
    """
    Make a decision about the next action based on:
    - Current query
    - Available tools
    - Retrieved memories
    """
    try:
        # Get relevant memories
        relevant_memories = memory_manager.retrieve_memories(current_query)
        
        # Create context with tools and memories
        context = {
            "tools": tools_description,
            "memories": relevant_memories,
            "query": current_query
        }
        
        # Get decision from LLM
        decision = await perceive_input(client, current_query, system_prompt.replace("_tools_description_", tools_description))
        
        # Validate decision structure
        required_keys = ['final_iteration', 'your_comment', 'function_name', 'parameters']
        if not all(key in decision for key in required_keys):
            raise ValueError("Invalid decision structure from LLM")
            
        return decision
        
    except Exception as e:
        print(f"Error in decision making: {e}")
        raise 