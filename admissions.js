// This script handles the submission of the new HTML form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admission-form');
    const submitButton = document.getElementById('submit-button');
    const formMessage = document.getElementById('form-message');

    // Make sure the main script.js file has loaded and WEB_APP_URL is available
    if (typeof WEB_APP_URL === 'undefined') {
        console.error('WEB_APP_URL is not defined. Make sure script.js is loaded.');
        formMessage.textContent = 'Form configuration error. Please contact support.';
        formMessage.className = 'form-message-error'; // Use class from style.css
        formMessage.classList.remove('hidden');
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the form from submitting the old way

        // 1. Show a loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        formMessage.classList.add('hidden');

        // 2. Get all form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // --- NEW ---
        // Add an 'action' field to tell Apps Script which form this is
        data.action = "submitAdmission";

        // 3. Send the data to our Google Apps Script
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            redirect: 'follow',
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // 4. Show success message
                form.reset(); // Clear the form
                formMessage.textContent = `Registration successful! Your new StudentID is: ${result.studentID}`;
                formMessage.className = 'form-message-success';
                formMessage.classList.remove('hidden');
            } else {
                // 5. Show error message
                throw new Error(result.message || 'An unknown error occurred.');
            }
        })
        .catch(error => {
            // 5. Show error message
            console.error('Error submitting form:', error);
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'form-message-error';
            formMessage.classList.remove('hidden');
        })
        .finally(() => {
            // 6. Restore button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Registration';
        });
    });
});

