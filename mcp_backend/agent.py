import os
import sys
import asyncio
from dotenv import load_dotenv
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from perception import perceive_input
from decision import make_decision
from action import execute_tool_call
from memory import MemoryManager
from google import genai

# Load environment variables
load_dotenv("../token.env")
api_key = os.getenv("API_TOKEN")
client = genai.Client(api_key=api_key)

class Agent:
    def __init__(self):
        self.memory_manager = MemoryManager()
        self.max_iterations = 15
        self.iteration = 0
        self.last_response = None
        self.iteration_response = []

    def reset_state(self):
        """Reset all state variables to their initial state"""
        self.last_response = None
        self.iteration = 0
        self.iteration_response = []
        self.memory_manager.clear_session_memory()

    async def run(self, user_prompt):
        """Main execution loop for the agent"""
        self.reset_state()
        print("Starting main execution...")
        
        try:
            # Create MCP server connection
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

                    # Main execution loop
                    while self.iteration < self.max_iterations:
                        print(f"\n--- Iteration {self.iteration + 1} ---")
                        
                        # Perception phase
                        current_query = user_prompt if self.last_response is None else \
                            f"{user_prompt}\n\n{' '.join(self.iteration_response)}\nWhat should I do next?"
                        
                        # Decision phase
                        decision = await make_decision(client, current_query, tools, self.memory_manager)
                        
                        if decision["final_iteration"] == "True":
                            print("\n=== Agent Execution Complete ===")
                            print(f"\n=== LLM final response is: {decision['your_comment']} ===")
                            return decision['your_comment']
                        
                        # Action phase
                        tool_result = await execute_tool_call(session, decision, tools)
                        
                        # Update memory and state
                        self.iteration_response.append(
                            f"In the {self.iteration + 1} iteration you called {decision['function_name']} "
                            f"with {decision['parameters']} parameters, and the function returned {tool_result}."
                        )
                        self.last_response = tool_result
                        self.iteration += 1

        except Exception as e:
            print(f"Error in main execution: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.reset_state()

async def main():
    if len(sys.argv) < 2:
        print("Error: No user prompt provided")
        sys.exit(1)
    
    user_prompt = sys.argv[1]
    agent = Agent()
    result = await agent.run(user_prompt)
    return result

if __name__ == "__main__":
    asyncio.run(main()) 