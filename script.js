/*
  --- MAIN SCRIPT ---
  This file holds the central configuration for your web app.
*/

// !!! IMPORTANT !!!
// 1. Deploy your Google Apps Script file ("sendReceiptEmail.js").
// 2. Copy the "Web app URL" it gives you.
// 3. Paste that URL here inside the quotes.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzrZr_t-b7htCME1z8U6zGFzY8pO67mQcGpISWgpQ57RWH2XkzT81eR3X9pWnih15mpww/exec';

// --- Homepage Dashboard (for index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the homepage
    const dueDateElement = document.getElementById('next-due-date');
    if (!dueDateElement) {
        return; // Not the homepage, do nothing.
    }

    if (typeof WEB_APP_URL === 'undefined' || WEB_APP_URL.startsWith('PASTE_')) {
        console.error('WEB_APP_URL is not defined in script.js.');
        dueDateElement.textContent = 'Error: Config';
        return;
    }

    // Fetch the next due date from Google Apps Script
    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.nextDueDate) {
                dueDateElement.textContent = data.nextDueDate;
            } else {
                dueDateElement.textContent = 'TBA';
            }
        })
        .catch(error => {
            console.error('Error fetching due date:', error);
            dueDateElement.textContent = 'Error';
        });
});

