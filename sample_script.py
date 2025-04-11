#!/usr/bin/env python3
"""
Sample Python script for Smart Assistance
This script takes input text and returns a processed version
"""

import sys
import json
import re
import requests
import os

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

def send_to_api(text):
    """
    Send the processed text to the API endpoint
    """
    # Get the server URL from environment or use default
    server_url = os.environ.get('NOTETAKER_SERVER_URL', 'http://localhost:3000')
    api_endpoint = f"{server_url}/api/smart-output"
    
    try:
        # Send the text to the API
        response = requests.post(
            api_endpoint,
            json={"text": text},
            headers={"Content-Type": "application/json"}
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            print(f"Successfully sent text to API: {response.json()}")
            return True
        else:
            print(f"Error sending text to API: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Exception when sending to API: {str(e)}")
        return False

def main():
    # Check if text was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Error: No text provided")
        sys.exit(1)
    
    # Get the input text from command-line arguments
    input_text = sys.argv[1]
    
    # Process the text
    result = process_text(input_text)
    
    # Try to send the result to the API
    api_success = send_to_api(result)
    
    # If API call failed, print to stdout as fallback
    if not api_success:
        print(result)
        print("\nNote: Failed to send result to API. Printed to stdout instead.")

if __name__ == "__main__":
    main() 