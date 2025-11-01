// This script handles the submission of the new payment form
document.addEventListener('DOMContentLoaded', () => {
    // --- FORM SUBMISSION ELEMENTS ---
    const form = document.getElementById('payment-form');
    const submitButton = document.getElementById('submit-button');
    const formMessage = document.getElementById('form-message');
    const fileInput = document.getElementById('receiptFile');

    // --- NEW: STUDENT LOOKUP ELEMENTS ---
    const getDetailsButton = document.getElementById('get-details-button');
    const studentIdInput = document.getElementById('studentID');
    const studentNameInput = document.getElementById('studentName');
    
    // --- NEW: DISPLAY ELEMENTS ---
    const detailsContainer = document.getElementById('student-details-container');
    const detailsLoading = document.getElementById('student-details-loading');
    const detailsError = document.getElementById('student-details-error');
    const detailsSuccess = document.getElementById('student-details-success');
    const displayCourseName = document.getElementById('display-course-name'); // Added this
    const displayTotalDue = document.getElementById('display-total-due');
    const displayBalanceDue = document.getElementById('display-balance-due');


    // Make sure the main script.js file has loaded and WEB_APP_URL is available
    if (typeof WEB_APP_URL === 'undefined' || WEB_APP_URL.startsWith('PASTE_')) {
        console.error('WEB_APP_URL is not defined in script.js.');
        formMessage.textContent = 'Form configuration error. Please contact support.';
        formMessage.className = 'form-message-error';
        formMessage.classList.remove('hidden');
        getDetailsButton.disabled = true;
        submitButton.disabled = true;
        return;
    }

    // --- NEW: EVENT LISTENER FOR "GET DETAILS" BUTTON ---
    getDetailsButton.addEventListener('click', () => {
        const studentID = studentIdInput.value.trim();
        if (!studentID) {
            alert('Please enter a Student ID.');
            return;
        }

        // 1. Show loading spinner
        detailsContainer.classList.remove('hidden');
        detailsLoading.classList.remove('hidden');
        detailsError.classList.add('hidden');
        detailsSuccess.classList.add('hidden');
        getDetailsButton.disabled = true;

        // 2. Fetch data from our Google Apps Script (using GET)
        fetch(`${WEB_APP_URL}?action=getStudentDetails&id=${studentID}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // 3. Populate the fields
                    studentNameInput.value = data.studentName;
                    displayCourseName.textContent = data.courseName; // Added this
                    displayTotalDue.textContent = `₹${data.totalDue}`;
                    displayBalanceDue.textContent = `₹${data.balanceDue}`;

                    // 4. Show the success details
                    detailsSuccess.classList.remove('hidden');
                    detailsError.classList.add('hidden');
                } else {
                    // 5. Show an error
                    throw new Error(data.message || 'Student ID not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching student details:', error);
                detailsError.textContent = `Error: ${error.message}`;
                detailsError.classList.remove('hidden');
                detailsSuccess.classList.add('hidden');
                studentNameInput.value = ""; // Clear name field on error
            })
            .finally(() => {
                // 6. Hide loading and re-enable button
                detailsLoading.classList.add('hidden');
                getDetailsButton.disabled = false;
            });
    });

    // --- EXISTING: EVENT LISTENER FOR FORM SUBMISSION ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 

        // 1. Show a loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';
        formMessage.classList.add('hidden');

        // 2. Get the file
        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a file to upload.");
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Payment Confirmation';
            return;
        }

        // 3. Convert file to Base64 string
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fileData = {
                base64: reader.result.split(',')[1], // Get only the Base64 part
                type: file.type,
                name: file.name
            };

            // 4. Get other form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.receiptFile = fileData; // Replace the file object with our Base64 object
            
            // Add an 'action' field to tell Apps Script what to do
            data.action = "submitPayment"; 

            // 5. Send all data to Google Apps Script
            sendDataToAppsScript(data);
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            formMessage.textContent = 'Error reading file. Please try again.';
            formMessage.className = 'form-message-error';
            formMessage.classList.remove('hidden');
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Payment Confirmation';
        };
    });

    function sendDataToAppsScript(data) {
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
                // 6. Show success message
                form.reset(); 
                detailsContainer.classList.add('hidden'); // Hide details box
                studentNameInput.value = ""; // Clear name field
                formMessage.textContent = 'Payment confirmation submitted successfully!';
                formMessage.className = 'form-message-success';
                formMessage.classList.remove('hidden');
            } else {
                // 7. Show error message
                throw new Error(result.message || 'An unknown error occurred.');
            }
        })
        .catch(error => {
            // 7. Show error message
            console.error('Error submitting form:', error);
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'form-message-error';
            formMessage.classList.remove('hidden');
        })
        .finally(() => {
            // 8. Restore button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Payment Confirmation';
        });
    }
});

