import os
import sys
from dotenv import load_dotenv
from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client
import asyncio
from google import genai
from concurrent.futures import TimeoutError
from functools import partial
import json

# Access your API key and initialize Gemini client correctly
load_dotenv("token.env")
api_key = os.getenv("API_TOKEN")
client = genai.Client(api_key=api_key)

max_iterations = 10
last_response = None
iteration = 0
iteration_response = []
user_prompt = ""

if len(sys.argv) < 2:
    print("Error: No user prompt provided")
    sys.exit(1)
    
    # Get the input text from command-line arguments
    user_prompt = sys.argv[1]

async def generate_with_timeout(client, prompt, timeout=10):
    """Generate content with a timeout"""
    print("Starting LLM generation...")
    try:
        # Convert the synchronous generate_content call to run in a thread
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
        return response
    except TimeoutError:
        print("LLM generation timed out!")
        raise
    except Exception as e:
        print(f"Error in LLM generation: {e}")
        raise

def reset_state():
    """Reset all global variables to their initial state"""
    global last_response, iteration, iteration_response
    last_response = None
    iteration = 0
    iteration_response = []

async def main():
    reset_state()  # Reset at the start of main
    print("Starting main execution...")
    try:
        # Create a single MCP server connection
        print("Establishing connection to MCP server...")
        server_params = StdioServerParameters(
            command="python",
            args=["mcp_server.py"]
        )

        async with stdio_client(server_params) as (read, write):
            print("Connection established, creating session...")
            async with ClientSession(read, write) as session:
                print("Session created, initializing...")
                await session.initialize()
                
                # Get available tools
                print("Requesting tool list...")
                tools_result = await session.list_tools()
                tools = tools_result.tools
                print(f"Successfully retrieved {len(tools)} tools")

                # Create system prompt with available tools
                print("Creating system prompt...")
                print(f"Number of tools: {len(tools)}")
                
                try:
                    # First, let's inspect what a tool object looks like
                    # if tools:
                    #     print(f"First tool properties: {dir(tools[0])}")
                    #     print(f"First tool example: {tools[0]}")
                    
                    tools_description = []
                    for i, tool in enumerate(tools):
                        try:
                            # Get tool properties
                            params = tool.inputSchema
                            desc = getattr(tool, 'description', 'No description available')
                            name = getattr(tool, 'name', f'tool_{i}')
                            
                            # Format the input schema in a more readable way
                            if 'properties' in params:
                                param_details = []
                                for param_name, param_info in params['properties'].items():
                                    param_type = param_info.get('type', 'unknown')
                                    param_details.append(f"{param_name}: {param_type}")
                                params_str = ', '.join(param_details)
                            else:
                                params_str = 'no parameters'

                            tool_desc = f"{i+1}. {name}({params_str}) - {desc}"
                            tools_description.append(tool_desc)
                            print(f"Added description for tool: {tool_desc}")
                        except Exception as e:
                            print(f"Error processing tool {i}: {e}")
                            tools_description.append(f"{i+1}. Error processing tool")
                    
                    tools_description = "\n".join(tools_description)
                    print("Successfully created tools description")
                except Exception as e:
                    print(f"Error creating tools description: {e}")
                    tools_description = "Error loading tools"
                
                print("Created system prompt...")
                system_prompt = """You are personalized agent who is expert in understanding user query and help him to plan his day.
You have access to a day planning system where you can handle **todos**, **events** and **reminders**. This system has multiple tools whose description is mentioned below which you can call once at a time.

Available tools:
_tools_description_

You have to understand the user query and based on that, think step-by-step and reason through what actions are required. **Tag each step implicitly with the type of reasoning involved**, such as "intent recognition", "date parsing", "lookup", or "planning". Then, choose the most appropriate tool for each step.
After calling a tool, **check if the response contains the expected information or format**. If it seems invalid, incomplete, or inconsistent, make another tool call to clarify, correct, or gather missing data before proceeding.

If a tool fails (returns `None`, errors, or an unexpected structure):
- Retry or call a fallback tool
- For missing or unclear user intent → call `clarify_intent` if available
- For bad or missing date values → call `get_current_date` or `validate_date_format`
- For ambiguous tool output → call `verify_tool_output` if available

You must respond with EXACTLY ONE line as a valid json object in the following format:
'{"final_iteration": "True/False", "your_comment": "your_comment", "function_name": "name-of-function-to-call", "parameters": [param1, param2, ...]}'

Above json object is a valid json object and below are meanings of keys:
1. `final_iteration`: Provide "True" if you have thought through the task and completed the task assigned to you. Otherwise, "False". **DO NOT CALL ANY FUNCTION** when this is **True**.
2. `your_comment`: Only fill this field on the **final_iteration** being **True** to summarize what was done. Leave it blank otherwise.
3. `function_name`: Name of the tool to call (from the available tools list).
4. `parameters`: A list of values passed to the tool.

**MAKE SURE TO CALL ONE TOOL AT A TIME.**

This system’s tools return values as dicts, lists of dicts, or strings. Be sure to parse them carefully and only use them when verified for the next tool call.


**EXAMPLE**
User query: Need to buy groceries tomorrow
'{"final_iteration": "False", "your_comment": "", "function_name": "get_current_date", "parameters": []}' 
'{"final_iteration": "False", "your_comment": "", "function_name": "list_todo", "parameters": ["buy groceries", "2025-04-12"]}'
'{"final_iteration": "True", "your_comment": "Created a todo for buy groceries on 12th April 2025", "function_name": "", "parameters": []}'


DO NOT include any explanations or additional text apart from the json object. Don't add ```json or ``` at the beginning or end of your response.

""".replace("_tools_description_", tools_description)
                query = user_prompt
                
                print("Starting iteration loop...")
                
                # Use global iteration variables
                global iteration, last_response
                
                while iteration < max_iterations:
                    print(f"\n--- Iteration {iteration + 1} ---")
                    if last_response is None:
                        current_query = query
                    else:
                        current_query = current_query + "\n\n" + " ".join(iteration_response)
                        current_query = current_query + "  What should I do next?"

                    # Get model's response with timeout
                    print("Preparing to generate LLM response...")
                    prompt = f"{system_prompt}\n\nQuery: {current_query}"
                    try:
                        response = await generate_with_timeout(client, prompt)
                        response_text = response.text.strip()
                        response_text = json.loads(response_text)
                        print(f"LLM Response: {response_text}")
                        
                        # Check if all keys are present in the response_text
                        if all(key in response_text for key in ['final_iteration', 'your_comment', 'function_name', 'parameters']):
                            print("DEBUG: All keys are present in the response_text")
                        else:
                            print("DEBUG: Some keys are missing in the response_text")
                            raise Exception("Some keys are missing in the response_text")

                        # for line in response_text.split('\n'):
                        #     line = line.strip()
                        #     if line.startswith("FUNCTION_CALL:"):
                        #         response_text = line
                        #         break
                        
                    except Exception as e:
                        print(f"Failed to get LLM response: {e}")
                        break


                    if response_text["final_iteration"] == "False":
                        #_, function_info = response_text.split(":", 1)
                        # parts = [p.strip() for p in function_info.split("|")]
                        # func_name, params = parts[0], parts[1:]
                        func_name = response_text["function_name"]
                        params = response_text["parameters"]
                        
                        #print(f"\nDEBUG: Raw function info: {function_info}")
                        #print(f"DEBUG: Split parts: {parts}")
                        print(f"DEBUG: Function name: {func_name}")
                        print(f"DEBUG: Raw parameters: {params}")
                        
                        try:
                            # Find the matching tool to get its input schema
                            tool = next((t for t in tools if t.name == func_name), None)
                            if not tool:
                                print(f"DEBUG: Available tools: {[t.name for t in tools]}")
                                raise ValueError(f"Unknown tool: {func_name}")

                            print(f"DEBUG: Found tool: {tool.name}")
                            print(f"DEBUG: Tool schema: {tool.inputSchema}")

                            # Prepare arguments according to the tool's input schema
                            arguments = {}
                            schema_properties = tool.inputSchema.get('properties', {})
                            print(f"DEBUG: Schema properties: {schema_properties}")

                            for param_name, param_info in schema_properties.items():
                                if not params:  # Check if we have enough parameters
                                    raise ValueError(f"Not enough parameters provided for {func_name}")
                                    
                                value = params.pop(0)  # Get and remove the first parameter
                                param_type = param_info.get('type', 'string')
                                
                                print(f"DEBUG: Converting parameter {param_name} with value {value} to type {param_type}")
                                
                                # Convert the value to the correct type based on the schema
                                if param_type == 'integer':
                                    arguments[param_name] = int(value)
                                elif param_type == 'number':
                                    arguments[param_name] = float(value)
                                elif param_type == 'array':
                                    # Handle array input
                                    if isinstance(value, str):
                                        value = value.strip('[]').split(',')
                                    arguments[param_name] = [int(x.strip()) for x in value]
                                else:
                                    arguments[param_name] = str(value)

                            print(f"DEBUG: Final arguments: {arguments}")
                            print(f"DEBUG: Calling tool {func_name}")
                            
                            result = await session.call_tool(func_name, arguments=arguments)
                            print(f"DEBUG: Raw result: {result}")
                            
                            # Get the full result content
                            if hasattr(result, 'content'):
                                print(f"DEBUG: Result has content attribute")
                                # Handle multiple content items
                                if isinstance(result.content, list):
                                    iteration_result = [
                                        item.text if hasattr(item, 'text') else str(item)
                                        for item in result.content
                                    ]
                                else:
                                    iteration_result = str(result.content)
                            else:
                                print(f"DEBUG: Result has no content attribute")
                                iteration_result = str(result)
                                
                            print(f"DEBUG: Final iteration result: {iteration_result}")
                            
                            # Format the response based on result type
                            if isinstance(iteration_result, list):
                                result_str = f"[{', '.join(iteration_result)}]"
                            else:
                                result_str = str(iteration_result)
                            
                            iteration_response.append(
                                f"In the {iteration + 1} iteration you called {func_name} with {arguments} parameters, "
                                f"and the function returned {result_str}."
                            )
                            last_response = iteration_result

                        except Exception as e:
                            print(f"DEBUG: Error details: {str(e)}")
                            print(f"DEBUG: Error type: {type(e)}")
                            import traceback
                            traceback.print_exc()
                            iteration_response.append(f"Error in iteration {iteration + 1}: {str(e)}")
                            break

                    elif response_text["final_iteration"] == "True":
                        print("\n=== Agent Execution Complete ===")
                        print(f"\n=== LLM final response is: {response_text['your_comment']} ===")
                        #print(f"final prompt to LLM is\n\n {50*'*'}\n{prompt}\n{50*'*'}")

                    iteration += 1

    except Exception as e:
        print(f"Error in main execution: {e}")
        import traceback
        traceback.print_exc()
    finally:
        reset_state()  # Reset at the end of main

if __name__ == "__main__":
    asyncio.run(main())
    
    