from typing import Dict, Any, List
from mcp import ClientSession
from model import *

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
        pydantic_model_class = None

        #check if function requires input argument
        if 'input' in schema_properties.keys():
            pydantic_model_name = schema_properties['input']['$ref'].split("/")[-1]
            model_input_schema = get_pydantic_field_types(pydantic_model_name)
            pydantic_model_class = globals()[pydantic_model_name]

            for argument in model_input_schema.keys():
                if not argument in params.keys():
                    raise ValueError(f"{argument} parameter in not provided for {func_name}")

                param_type = model_input_schema[argument]
                value = params[argument]

                #Convert the value to the correct type
                if 'int' in param_type:
                    params[argument] = int(value)
                elif 'float' in param_type:
                    params[argument] = float(value)
                elif 'list' in param_type:
                    if isinstance(value, str):
                        value = value.strip('[]').split(',')
                    params[argument] = [int(x.strip()) for x in value]
                else:
                    params[argument] = str(value)

        # Execute the tool call
        result = await session.call_tool(func_name, arguments=params) if pydantic_model_class is None \
        else await session.call_tool(func_name, arguments={"input":pydantic_model_class(**params)})
        
        # Process the result
        if hasattr(result, 'content'):
            if isinstance(result.content, list):
                return [
                    item.text if hasattr(item, 'text') else str(item)
                    for item in result.content
                ][0]
            return str(result.content)
        return str(result)
        
    except Exception as e:
        print(f"Error in tool execution: {e}")
        raise 