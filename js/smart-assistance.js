/**
 * Smart Assistance Module
 * Handles the functionality for the Smart Assistance section
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const smartInput = document.getElementById('smart-input');
    const smartOutput = document.getElementById('smart-output');
    const smartSubmit = document.getElementById('smart-submit');

    // Add event listener to the submit button
    if (smartSubmit) {
        smartSubmit.addEventListener('click', handleSmartSubmit);
    }

    // Function to handle the submit button click
    function handleSmartSubmit() {
        const inputText = smartInput.value.trim();
        
        if (!inputText) {
            alert('Please enter some text before submitting.');
            return;
        }

        // Call the API to process the input
        processSmartInput(inputText);
    }

    // Function to process the input using the API
    function processSmartInput(text) {
        // First, send the input to the server
        fetch('/api/input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Input sent successfully:', data);
            
            // Now, execute the Python script with the input text
            executePythonScript(text);
        })
        .catch(error => {
            console.error('Error sending input:', error);
            smartOutput.value = 'Error processing your request. Please try again.';
        });
    }

    // Function to execute the Python script
    function executePythonScript(text) {
        // Show processing message
        smartOutput.value = 'Processing...';
        
        // Call the API to execute the Python script
        fetch('/api/execute-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                smartOutput.value = `Error: ${data.error}`;
            } else {
                // Update the output text
                updateSmartOutput(data.text);
            }
        })
        .catch(error => {
            console.error('Error executing Python script:', error);
            smartOutput.value = 'Error executing Python script. Please try again.';
        });
    }

    // Function to update the output text
    function updateSmartOutput(text) {
        // Send the output text to the server
        fetch('/api/output', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Output sent successfully:', data);
            
            // Update the output text area
            smartOutput.value = text;
        })
        .catch(error => {
            console.error('Error sending output:', error);
            smartOutput.value = 'Error updating output. Please try again.';
        });
    }

    // Function to periodically check for updates to the output
    function checkForOutputUpdates() {
        fetch('/api/output')
            .then(response => response.json())
            .then(data => {
                if (data.text && data.text !== smartOutput.value) {
                    smartOutput.value = data.text;
                }
            })
            .catch(error => {
                console.error('Error checking for output updates:', error);
            });
    }

    // Check for output updates every 5 seconds
    setInterval(checkForOutputUpdates, 5000);
}); 