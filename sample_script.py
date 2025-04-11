#!/usr/bin/env python3
"""
Sample Python script for Smart Assistance
This script takes input text and returns a processed version
"""

import sys
import json
import re

def process_text(text):
    """
    Process the input text and return a response
    This is a simple example that counts words and characters
    """
    # Count words and characters
    word_count = len(text.split())
    char_count = len(text)
    
    # Find the longest word
    words = text.split()
    longest_word = max(words, key=len) if words else ""
    
    # Create a response
    response = f"""
Input Text: "{text}"

Analysis:
- Word count: {word_count}
- Character count: {char_count}
- Longest word: "{longest_word}" ({len(longest_word)} characters)

This is a sample response from the Python script.
You can modify this script to perform any text processing you need.
"""
    
    return response

def main():
    # Check if text was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Error: No text provided")
        sys.exit(1)
    
    # Get the input text from command-line arguments
    input_text = sys.argv[1]
    
    # Process the text
    result = process_text(input_text)
    
    # Print the result
    print(result)

if __name__ == "__main__":
    main() 