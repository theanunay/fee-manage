// !!! ACTION REQUIRED !!!
// 1. Deploy your Google Apps Script as a Web App
// 2. Paste the Web App URL here
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwG5Eu6pOBI2OOXdAWXQPxxiP6Jh03ZPeW5Rb5-b4H7awpL5WFbTwRajVUrFXa09D96mw/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Find UI elements
    const loadingDiv = document.getElementById('dashboard-loading');
    const contentDiv = document.getElementById('dashboard-content');
    const dueDateSpan =.getElementById('next-due-date');
    
    // --- FIX ---
    // Check if the URL is still the placeholder text.
    // If it is, don't try to fetch. Show an error message instead.
    if (WEB_APP_URL.startsWith('PASTE_')) {
        console.warn('Please paste your Web App URL into the WEB_APP_URL variable in script.js');
        if (dueDateSpan) {
            dueDateSpan.textContent = 'Please update Web App URL in script.js';
        }
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        if (contentDiv) {
            contentDiv.style.display = 'block';
        }
        return; // Stop the script from running the broken fetch
    }

    // Fetch data from our Google Apps Script API
    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(data => {
            if (data && data.status === 'success' && data.nextDueDate) {
                if (dueDateSpan) {
                    dueDateSpan.textContent = data.nextDueDate;
                }
            } else {
                if (dueDateSpan) {
                    dueDateSpan.textContent = 'Not available';
                }
            }
            // Hide loading spinner and show content
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            if (contentDiv) {
                contentDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
            if (dueDateSpan) {
                dueDateSpan.textContent = 'Error loading data';
            }
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            if (contentDiv) {
                contentDiv.style.display = 'block';
            }
        });
});
