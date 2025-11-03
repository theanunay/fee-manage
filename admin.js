// This script handles all logic for the admin.html page
document.addEventListener('DOMContentLoaded', () => {
    // --- Page Elements ---
    const modal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('admin-password');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logout-button');

    // --- Unverified Payments Elements ---
    const unverifiedLoading = document.getElementById('unverified-loading');
    const unverifiedError = document.getElementById('unverified-error');
    const unverifiedContainer = document.getElementById('unverified-table-container');
    const noUnverifiedData = document.getElementById('no-unverified-data');

    // --- All Students Elements ---
    const studentsLoading = document.getElementById('students-loading');
    const studentsError = document.getElementById('students-error');
    const studentsContainer = document.getElementById('students-table-container');
    const noStudentsData = document.getElementById('no-students-data');

    // --- NEW: Course Management Elements ---
    const coursesLoading = document.getElementById('courses-loading');
    const coursesError = document.getElementById('courses-error');
    const courseContainer = document.getElementById('course-table-container');
    const noCoursesData = document.getElementById('no-courses-data');
    const addCourseForm = document.getElementById('add-course-form');
    const addCourseButton = document.getElementById('add-course-button');
    const addCourseMessage = document.getElementById('add-course-message');
    const newCourseName = document.getElementById('new-course-name');
    const newCourseAmount = document.getElementById('new-course-amount');


    // --- Check for Web App URL ---
    if (typeof WEB_APP_URL === 'undefined' || WEB_APP_URL.startsWith('PASTE_')) {
        console.error('WEB_APP_URL is not defined in script.js.');
        alert('CRITICAL ERROR: WEB_APP_URL not found. Please check script.js.');
        return;
    }

    // --- Password & Session Logic ---

    if (sessionStorage.getItem('adminPassword')) {
        modal.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        logoutButton.classList.remove('hidden');
        fetchAllData(sessionStorage.getItem('adminPassword'));
    } else {
        modal.classList.remove('hidden');
    }

    passwordSubmit.addEventListener('click', () => {
        const password = passwordInput.value;
        if (!password) {
            passwordError.textContent = 'Please enter a password.';
            passwordError.classList.remove('hidden');
            return;
        }
        
        sessionStorage.setItem('adminPassword', password);
        passwordError.classList.add('hidden');
        passwordSubmit.disabled = true;
        passwordSubmit.textContent = 'Logging in...';

        fetchAllData(password);
    });

    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('adminPassword');
        window.location.reload();
    });

    // --- Data Fetching ---

    function fetchAllData(password) {
        fetchUnverifiedPayments(password);
        fetchAllStudents(password);
        fetchCourseList(password); // NEW
    }

    async function fetchUnverifiedPayments(password) {
        unverifiedLoading.classList.remove('hidden');
        unverifiedError.classList.add('hidden');
        unverifiedContainer.classList.add('hidden');
        noUnverifiedData.classList.add('hidden');

        try {
            const response = await fetch(`${WEB_APP_URL}?action=getAdminData&type=unverified`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            const result = await handleResponse(response);

            if (result.data && result.data.length > 0) {
                unverifiedContainer.innerHTML = createTable(result.data, true, false); // true=verify, false=delete
                unverifiedContainer.classList.remove('hidden');
            } else {
                noUnverifiedData.classList.remove('hidden');
            }
        } catch (error) {
            unverifiedError.textContent = `Error: ${error.message}`;
            unverifiedError.classList.remove('hidden');
            if (error.message.includes('Incorrect password')) {
                handleLoginError();
            }
        } finally {
            unverifiedLoading.classList.add('hidden');
        }
    }

    async function fetchAllStudents(password) {
        studentsLoading.classList.remove('hidden');
        studentsError.classList.add('hidden');
        studentsContainer.classList.add('hidden');
        noStudentsData.classList.add('hidden');

        try {
            const response = await fetch(`${WEB_APP_URL}?action=getAdminData&type=all`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            const result = await handleResponse(response);

            if (result.data && result.data.length > 0) {
                studentsContainer.innerHTML = createTable(result.data, false, false);
                studentsContainer.classList.remove('hidden');
            } else {
                noStudentsData.classList.remove('hidden');
            }
        } catch (error)
 {
            studentsError.textContent = `Error: ${error.message}`;
            studentsError.classList.remove('hidden');
        } finally {
            studentsLoading.classList.add('hidden');
        }
    }

    // NEW: Fetch Course List
    async function fetchCourseList(password) {
        coursesLoading.classList.remove('hidden');
        coursesError.classList.add('hidden');
        courseContainer.classList.add('hidden');
        noCoursesData.classList.add('hidden');

        try {
            // Re-using the public 'getCourseList' endpoint, but sending auth
            // so it fails if the password is wrong on initial login.
            const response = await fetch(`${WEB_APP_URL}?action=getCourseList`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            const result = await handleResponse(response);

            if (result.data && result.data.length > 0) {
                courseContainer.innerHTML = createTable(result.data, false, true); // false=verify, true=delete
                courseContainer.classList.remove('hidden');
            } else {
                noCoursesData.classList.remove('hidden');
            }
        } catch (error) {
            coursesError.textContent = `Error: ${error.message}`;
            coursesError.classList.remove('hidden');
        } finally {
            coursesLoading.classList.add('hidden');
        }
    }


    // --- Action Logic (Event Delegation) ---

    // Verify Payment
    unverifiedContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('verify-button')) {
            const button = e.target;
            const rowData = JSON.parse(decodeURIComponent(button.dataset.row));
            
            if (!confirm(`Verify this payment?\n\nStudent: ${rowData.Student_Name}\nAmount: ₹${rowData.Amount_Paid}\nTxn ID: ${rowData.Transaction_ID}`)) {
                return;
            }

            button.disabled = true;
            button.textContent = 'Verifying...';

            try {
                const password = sessionStorage.getItem('adminPassword');
                await postAdminAction('verifyPayment', rowData);
                
                button.closest('tr').remove();
                fetchAllStudents(password); // Refresh student dashboard
                
            } catch (error) {
                alert(`Error verifying payment: ${error.message}`);
                button.disabled = false;
                button.textContent = 'Verify';
            }
        }
    });

    // NEW: Delete Course
    courseContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-button')) {
            const button = e.target;
            const rowData = JSON.parse(decodeURIComponent(button.dataset.row));

            if (!confirm(`DELETE this course?\n\nCourse: ${rowData.Class}\nAmount: ₹${rowData.Total_Due_Amount}\n\nThis action is permanent and will delete the row from 'Fee_Structure'.`)) {
                return;
            }

            button.disabled = true;
            button.textContent = 'Deleting...';

            try {
                await postAdminAction('deleteCourse', rowData);
                button.closest('tr').remove();
            } catch (error) {
                alert(`Error deleting course: ${error.message}`);
                button.disabled = false;
                button.textContent = 'Delete';
            }
        }
    });

    // NEW: Add Course
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseName = newCourseName.value;
        const courseAmount = newCourseAmount.value;
        
        addCourseButton.disabled = true;
        addCourseButton.textContent = 'Adding...';
        addCourseMessage.classList.add('hidden');

        try {
            const data = {
                courseName: courseName,
                totalDue: courseAmount
            };
            await postAdminAction('addCourse', data);

            addCourseMessage.textContent = 'Course added successfully!';
            addCourseMessage.className = 'text-sm text-center text-green-600';
            addCourseMessage.classList.remove('hidden');
            
            // Refresh course list and clear form
            fetchCourseList(sessionStorage.getItem('adminPassword'));
            addCourseForm.reset();

        } catch (error) {
            addCourseMessage.textContent = `Error: ${error.message}`;
            addCourseMessage.className = 'text-sm text-center text-red-600';
            addCourseMessage.classList.remove('hidden');
        } finally {
            addCourseButton.disabled = false;
            addCourseButton.textContent = 'Add Course';
            setTimeout(() => addCourseMessage.classList.add('hidden'), 3000);
        }
    });

    // NEW: Generic function for POSTing admin actions
    async function postAdminAction(action, data) {
        const password = sessionStorage.getItem('adminPassword');
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${password}`
            },
            body: JSON.stringify({
                action: action,
                data: data
            })
        });
        return await handleResponse(response);
    }


    // --- Helper Functions ---

    async function handleResponse(response) {
        if (!response.ok) {
            if (response.status === 401) throw new Error('Incorrect password or session expired.');
            const errorText = await response.text();
            throw new Error(`Server error: ${response.statusText} (${errorText})`);
        }
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(result.message);
        }
        
        if (modal.classList.contains('hidden') === false) {
            modal.classList.add('hidden');
            dashboardContent.classList.remove('hidden');
            logoutButton.classList.remove('hidden');
        }
        
        return result;
    }

    function handleLoginError() {
        sessionStorage.removeItem('adminPassword');
        passwordError.textContent = 'Incorrect password.';
        passwordError.classList.remove('hidden');
        passwordSubmit.disabled = false;
        passwordSubmit.textContent = 'Login';
        modal.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
        logoutButton.classList.add('hidden');
    }

    // Updated to handle both verify and delete buttons
    function createTable(data, includeVerifyButton, includeDeleteButton) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const visibleHeaders = headers.filter(h => h !== 'RowIndex');
        
        let table = '<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50">';
        table += '<tr>';
        visibleHeaders.forEach(header => {
            table += `<th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header.replace(/_/g, ' ')}</th>`;
        });
        if (includeVerifyButton || includeDeleteButton) {
            table += `<th scope="col" class="relative px-4 py-3"><span class="sr-only">Actions</span></th>`;
        }
        table += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

        data.forEach(row => {
            table += '<tr>';
            visibleHeaders.forEach(header => {
                let cellData = row[header];
                if (typeof cellData === 'string' && cellData.startsWith('http')) {
                    cellData = `<a href="${cellData}" target="_blank" class="text-indigo-600 hover:text-indigo-900">View</a>`;
                }
                if (['Amount_Paid', 'Balance_Due', 'Total_Due_Amount', 'Total_Fees_Due'].includes(header)) {
                    cellData = `₹${parseFloat(cellData).toFixed(2)}`;
                }
                table += `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${cellData}</td>`;
            });

            if (includeVerifyButton || includeDeleteButton) {
                const rowData = encodeURIComponent(JSON.stringify(row));
                table += `<td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">`;
                if (includeVerifyButton) {
                    table += `<button class="verify-button bg-indigo-600 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-700" data-row="${rowData}">Verify</button>`;
                }
                if (includeDeleteButton) {
                    table += `<button class="delete-button bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700" data-row="${rowData}">Delete</button>`;
                }
                table += `</td>`;
            }
            table += '</tr>';
        });

        table += '</tbody></table>';
        return table;
    }
});

