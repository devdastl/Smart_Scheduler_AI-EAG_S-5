import json
from typing import Dict, Any
from google import genai
import asyncio

def clean_code_block(text: str) -> str:
    """Clean JSON code block from LLM response"""
    if text.startswith("```json"):
        text = text[len("```json"):]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

async def generate_with_timeout(client: genai.Client, prompt: str, timeout: int = 10) -> str:
    """Generate content with a timeout"""
    print("Starting LLM generation...")
    try:
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None, 
                lambda: client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
            ),
            timeout=timeout
        )
        print("LLM generation completed")
        return response.text.strip()
    except Exception as e:
        print(f"Error in LLM generation: {e}")
        raise

async def perceive_input(client: genai.Client, user_input: str, system_prompt: str) -> Dict[str, Any]:
    """
    Process user input and extract key information using LLM
    Returns a structured perception result
    """
    try:
        prompt = f"{system_prompt}\n\nQuery: {user_input}"
        response_text = await generate_with_timeout(client, prompt)
        response_text = clean_code_block(response_text)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error in perception: {e}")
        raise 