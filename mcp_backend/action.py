from typing import Dict, Any, List
from mcp import ClientSession

async def execute_tool_call(
    session: ClientSession,
    decision: Dict[str, Any],
    tools: List[Any]
) -> Any:
    """
    Execute a tool call based on the decision
    Returns the result of the tool execution
    """
    try:
        func_name = decision["function_name"]
        params = decision["parameters"]
        
        # Find the matching tool
        tool = next((t for t in tools if t.name == func_name), None)
        if not tool:
            raise ValueError(f"Unknown tool: {func_name}")

        # Prepare arguments according to the tool's input schema
        arguments = {}
        schema_properties = tool.inputSchema.get('properties', {})

        for param_name, param_info in schema_properties.items():
            if not params:
                raise ValueError(f"Not enough parameters provided for {func_name}")
                
            value = params.pop(0)
            param_type = param_info.get('type', 'string')
            
            # Convert the value to the correct type
            if param_type == 'integer':
                arguments[param_name] = int(value)
            elif param_type == 'number':
                arguments[param_name] = float(value)
            elif param_type == 'array':
                if isinstance(value, str):
                    value = value.strip('[]').split(',')
                arguments[param_name] = [int(x.strip()) for x in value]
            else:
                arguments[param_name] = str(value)

        # Execute the tool call
        result = await session.call_tool(func_name, arguments=arguments)
        
        # Process the result
        if hasattr(result, 'content'):
            if isinstance(result.content, list):
                return [
                    item.text if hasattr(item, 'text') else str(item)
                    for item in result.content
                ]
            return str(result.content)
        return str(result)
        
    except Exception as e:
        print(f"Error in tool execution: {e}")
        raise 