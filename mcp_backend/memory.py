from typing import List, Dict, Any
import json

class MemoryItem:
    def __init__(self, content: str, metadata: Dict[str, Any] = None):
        self.content = content
        self.metadata = metadata or {}
        self.embedding = None

class MemoryManager:
    def __init__(self):
        self.memories: List[MemoryItem] = []
        self.session_id = None

    def check_duplicate_memory(self, content: str) -> bool:
        """Check if a memory already exists in the list"""
        for memory in self.memories:
            if memory.content == content:
                return True
        return False

    def add_memory(self, content: str, metadata: Dict[str, Any] = None):
        """Add a new memory item"""
        if not self.check_duplicate_memory(content):        
            memory = MemoryItem(content, metadata)
            self.memories.append(memory)

    def retrieve_memories(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memories based on a query
        Currently uses simple text matching, but can be extended to use embeddings
        """
        relevant_memories = []
        for memory in self.memories:
            if query.lower() in memory.content.lower():
                relevant_memories.append({
                    "content": memory.content,
                    "metadata": memory.metadata
                })
        return relevant_memories[:limit]

    def clear_session_memory(self):
        """Clear all memories for the current session"""
        self.memories = []

    def save_memories(self, filepath: str):
        """Save memories to a file"""
        with open(filepath, 'w') as f:
            json.dump([{
                "content": m.content,
                "metadata": m.metadata
            } for m in self.memories], f)

    def load_memories(self, filepath: str):
        """Load memories from a file"""
        try:
            with open(filepath, 'r') as f:
                memories_data = json.load(f)
                self.memories = [
                    MemoryItem(m["content"], m["metadata"])
                    for m in memories_data
                ]
        except FileNotFoundError:
            print(f"No memory file found at {filepath}") 