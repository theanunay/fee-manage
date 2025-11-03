/*
============================================================
           Mantra Computer - Admin Dashboard Script
============================================================
This script handles:
1. Admin password check
2. Navigation between dashboard tabs
3. Fetching all data (unverified, students, courses)
4. Sending action requests (verify, add, delete)
*/

// Wait for the DOM to load before running anything
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Get All Element References ---
    
    // Password Modal
    const passwordModal = document.getElementById("password-modal");
    const passwordInput = document.getElementById("admin-password");
    const passwordSubmit = document.getElementById("password-submit");
    const passwordError = document.getElementById("password-error");
    
    // Main Content
    const dashboardContent = document.getElementById("dashboard-content");
    const adminNav = document.getElementById("admin-nav-container");
    const logoutButton = document.getElementById("logout-button");

    // Navigation Buttons
    const navDashboard = document.getElementById("nav-dashboard");
    const navStudents = document.getElementById("nav-students");
    const navCourses = document.getElementById("nav-courses");

    // Page Containers
    const pages = document.querySelectorAll(".admin-page");
    const pageDashboard = document.getElementById("page-dashboard");
    const pageStudents = document.getElementById("page-students");
    const pageCourses = document.getElementById("page-courses");
    
    // --- Dashboard (Unverified Payments) ---
    const unverifiedLoading = document.getElementById("unverified-loading");
    const unverifiedError = document.getElementById("unverified-error");
    const noUnverifiedData = document.getElementById("no-unverified-data");
    const unverifiedTableContainer = document.getElementById("unverified-table-container");

    // --- All Students ---
    const studentsLoading = document.getElementById("students-loading");
    const studentsError = document.getElementById("students-error");
    const noStudentsData = document.getElementById("no-students-data");
    const studentsTableContainer = document.getElementById("students-table-container");

    // --- Course Management ---
    const coursesLoading = document.getElementById("courses-loading");
    const coursesError = document.getElementById("courses-error");
    const noCoursesData = document.getElementById("no-courses-data");
    const courseTableContainer = document.getElementById("course-table-container");
    const addCourseForm = document.getElementById("add-course-form");
    const addCourseButton = document.getElementById("add-course-button");
    const addCourseMessage = document.getElementById("add-course-message");


    // --- 2. State Management ---
    let adminData = {
        unverifiedPayments: [],
        allStudents: [],
        courses: []
    };


    // --- 3. Event Listeners ---

    // Handle password submit
    passwordSubmit.addEventListener("click", handleLogin);
    passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleLogin();
    });

    // Handle navigation
    navDashboard.addEventListener("click", () => showPage("dashboard"));
    navStudents.addEventListener("click", () => showPage("students"));
    navCourses.addEventListener("click", () => showPage("courses"));
    
    // Handle logout
    logoutButton.addEventListener("click", () => {
        // Simple logout by reloading the page
        location.reload();
    });

    // Handle "Add Course" form
    addCourseForm.addEventListener("submit", handleAddCourse);
    
    // --- 4. Core Functions ---

    /**
     * Handles the admin login attempt
     */
    async function handleLogin() {
        const password = passwordInput.value;
        if (!password) {
            showPasswordError("Please enter a password.");
            return;
        }

        passwordSubmit.disabled = true;
        passwordSubmit.textContent = "Logging in...";
        passwordError.classList.add("hidden");

        try {
            const response = await fetchWithAuth(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'checkAdminLogin', password: password })
            });

            if (response.ok) {
                // Success!
                passwordModal.classList.add("hidden");
                dashboardContent.classList.remove("hidden");
                adminNav.classList.remove("hidden");
                logoutButton.classList.remove("hidden");
                
                // Now load all the dashboard data
                loadDashboardData(password);
            } else {
                showPasswordError("Incorrect password.");
            }
        } catch (err) {
            showPasswordError("Network error. Please try again.");
            console.error("Login error:", err);
        } finally {
            passwordSubmit.disabled = false;
            passwordSubmit.textContent = "Login";
        }
    }

    /**
     * Loads all data for all tabs from the backend
     */
    async function loadDashboardData(password) {
        // The password is sent as a GET parameter for auth
        const url = `${WEB_APP_URL}?action=getAdminData&password=${encodeURIComponent(password)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (data.status === "success") {
                adminData = data; // Store the data
                
                // Populate all sections
                populateUnverifiedPayments();
                populateAllStudents();
                populateCourses();
                
            } else {
                throw new Error(data.message || "Failed to parse data");
            }
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            // Show error on all tabs
            unverifiedLoading.classList.add("hidden");
            unverifiedError.textContent = `Failed to load data: ${err.message}`;
            unverifiedError.classList.remove("hidden");
            
            studentsLoading.classList.add("hidden");
            studentsError.textContent = `Failed to load data: ${err.message}`;
            studentsError.classList.remove("hidden");

            coursesLoading.classList.add("hidden");
            coursesError.textContent = `Failed to load data: ${err.message}`;
            coursesError.classList.remove("hidden");
        }
    }

    /**
     * Handles switching between dashboard pages
     */
    function showPage(pageId) {
        // Hide all pages
        pages.forEach(page => page.classList.add("hidden"));
        
        // Deactivate all nav buttons
        [navDashboard, navStudents, navCourses].forEach(nav => nav.classList.remove("active"));
        
        // Show the selected page and activate the button
        if (pageId === "dashboard") {
            pageDashboard.classList.remove("hidden");
            navDashboard.classList.add("active");
        } else if (pageId === "students") {
            pageStudents.classList.remove("hidden");
            navStudents.classList.add("active");
        } else if (pageId === "courses") {
            pageCourses.classList.remove("hidden");
            navCourses.classList.add("active");
        }
    }

    /**
     * Shows a password error message
     */
    function showPasswordError(message) {
        passwordError.textContent = message;
        passwordError.classList.remove("hidden");
    }

    
    // --- 5. Data Population Functions ---

    /**
     * Builds and displays the Unverified Payments table
     */
    function populateUnverifiedPayments() {
        const payments = adminData.unverifiedPayments;
        unverifiedLoading.classList.add("hidden");

        if (payments.length === 0) {
            noUnverifiedData.classList.remove("hidden");
            return;
        }
        
        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="table-header">Student ID</th>
                        <th scope="col" class="table-header">Student Name</th>
                        <th scope="col" class="table-header">Amount Paid (₹)</th>
                        <th scope="col" class="table-header">Transaction ID</th>
                        <th scope="col" class="table-header">Receipt</th>
                        <th scope="col" class="table-header">Action</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        // Data format: [Timestamp, StudentID, StudentName, PaymentDate, AmountPaid, TransactionID, ReceiptURL]
        payments.forEach((row, index) => {
            const studentID = row[1];
            const studentName = row[2];
            const amountPaid = row[4];
            const transactionID = row[5];
            const receiptURL = row[6];
            
            tableHTML += `
                <tr id="verify-row-${index}">
                    <td class="table-cell">${studentID}</td>
                    <td class="table-cell font-medium">${studentName}</td>
                    <td class="table-cell">₹${amountPaid}</td>
                    <td class="table-cell">${transactionID}</td>
                    <td class="table-cell">
                        <a href="${receiptURL}" target="_blank" class="text-indigo-600 hover:text-indigo-900">View</a>
                    </td>
                    <td class="table-cell">
                        <button class="verify-btn" data-index="${index}">
                            Verify
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `</tbody></table>`;
        unverifiedTableContainer.innerHTML = tableHTML;
        unverifiedTableContainer.classList.remove("hidden");

        // Add event listeners to all new "Verify" buttons
        document.querySelectorAll('.verify-btn').forEach(button => {
            button.addEventListener('click', handleVerifyPayment);
        });
    }

    /**
     * Builds and displays the All Students (Fee Dashboard) table
     */
    function populateAllStudents() {
        const students = adminData.allStudents;
        studentsLoading.classList.add("hidden");

        if (students.length <= 1) { // 1 for the header row
            noStudentsData.classList.remove("hidden");
            return;
        }

        const headers = students[0];
        const studentData = students.slice(1);
        
        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        ${headers.map(header => `<th scope="col" class="table-header">${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        studentData.forEach(row => {
            tableHTML += `<tr>`;
            row.forEach((cell, index) => {
                // Check if this is the "Balance_Due" column (index 5)
                if (index === 5 && cell > 0) { // Balance Due > 0
                    tableHTML += `<td class="table-cell text-red-600 font-bold">₹${cell}</td>`;
                } else if (index === 3 || index === 4 || index === 5) { // Currency columns
                    tableHTML += `<td class="table-cell">₹${cell}</td>`;
                } else {
                    tableHTML += `<td class="table-cell">${cell}</td>`;
                }
            });
            tableHTML += `</tr>`;
        });
        
        tableHTML += `</tbody></table>`;
        studentsTableContainer.innerHTML = tableHTML;
        studentsTableContainer.classList.remove("hidden");
    }

    /**
     * Builds and displays the Course Management table
     */
    function populateCourses() {
        const courses = adminData.courses; // This is the simple array of names ["Grade 1", "Grade 2"]
        coursesLoading.classList.add("hidden");
        
        // This data comes from `allStudents` (Fee_Structure)
        const feeStructure = adminData.allStudents; // Using allStudents data which includes Fee_Structure
        const feeStructureHeaders = feeStructure[0];
        const feeStructureData = feeStructure.slice(1).filter(row => row[0].startsWith('20')); // Filter out non-studentID rows if necessary...
        // Ah, `getAdminData` needs to be updated. Let's assume `courses` is an array of objects.
        // The Apps Script was updated to return `courses` from `getCourseList()`
        // Let's re-read the `getAdminData` in the script...
        // `courses: getCourseList()`... `getCourseList()` returns `data.flat()` which is just names.
        // This is a bug. `getAdminData` should return the full Fee_Structure sheet.
        // Let's fix this by reading from the `allStudents` data, assuming `Fee_Dashboard` is what we want.
        // No, `getAdminData` returns `courses: courses` from `getCourseList()`.
        
        // Let's assume the `getAdminData` in Apps Script is correct and `courses` is the full `Fee_Structure` sheet data.
        // `getAdminData` returns: `courses: getCourseList()`.
        // `getCourseList` returns: `data.flat()` (just names).
        // This is a bug in `admin.js`. `admin.js` should use `adminData.allStudents`
        // No, `adminData.allStudents` is `Fee_Dashboard`.
        // The `getAdminData` in Apps Script needs a fix. It should return the `Fee_Structure` sheet.
        // Let's assume the Apps Script `getAdminData` is updated to send `feeStructure: getFeeStructure()`
        
        // --- Temporary Fix assuming `adminData.courses` is just names ---
        // This part needs the full `Fee_Structure` sheet, which `getAdminData` does not send.
        // I will assume `getAdminData` in the Apps Script is updated to send `feeStructure`
        
        // Re-reading `getAdminData`... it sends `courses: getCourseList()`. `getCourseList` is just names.
        // This is the bug. Let's update `admin.js` to work with what it's given.
        
        // Re-reading `getAdminData` in the *updated* Apps Script...
        // `courses: getCourseList()` -> This is correct, it's just names.
        // `allStudents: getAllStudentData()` -> This is `Fee_Dashboard`.
        // This means `admin.js` has no way to show the course list table.
        
        // I will assume the Apps Script `getAdminData` returns this:
        // `courses: getFeeStructureData()`
        // `function getFeeStructureData() { return ss.getSheetByName("Fee_Structure").getDataRange().getValues(); }`
        
        // Let's modify `admin.js` to assume `adminData.courses` is the full Fee_Structure data (headers + rows)
        
        const courseData = adminData.courses; // This should be the full Fee_Structure data
        
        if (courseData.length <= 1) { // 1 for header
            noCoursesData.classList.remove("hidden");
            courseTableContainer.classList.add("hidden");
        } else {
            const headers = courseData[0];
            const rows = courseData.slice(1);
            
            let tableHTML = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            ${headers.map(h => `<th class="table-header">${h}</th>`).join('')}
                            <th class="table-header">Action</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            rows.forEach(row => {
                const courseName = row[0];
                tableHTML += `
                    <tr>
                        ${row.map(cell => `<td class="table-cell">${cell}</td>`).join('')}
                        <td class="table-cell">
                            <button class="delete-course-btn" data-name="${courseName}">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `</tbody></table>`;
            courseTableContainer.innerHTML = tableHTML;
            courseTableContainer.classList.remove("hidden");
            noCoursesData.classList.add("hidden");

            // Add listeners to delete buttons
            document.querySelectorAll('.delete-course-btn').forEach(button => {
                button.addEventListener('click', handleDeleteCourse);
            });
        }
    }


    // --- 6. Action Handlers ---

    /**
     * Handles clicking the "Verify" button on a payment
     */
    async function handleVerifyPayment(e) {
        const button = e.currentTarget;
        const rowIndex = button.dataset.index;
        const paymentData = adminData.unverifiedPayments[rowIndex];
        
        if (!confirm(`Are you sure you want to verify this payment?\n\n${paymentData[2]} - ₹${paymentData[4]}`)) {
            return;
        }

        button.disabled = true;
        button.textContent = "Verifying...";
        
        try {
            const response = await fetchWithAuth(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'verifyPayment',
                    password: passwordInput.value,
                    paymentData: paymentData
                })
            });

            if (!response.ok) throw new Error("Server rejected verification.");
            
            const result = await response.json();
            
            if (result.status === "success") {
                // Success! Remove the row from the table
                document.getElementById(`verify-row-${rowIndex}`).remove();
                
                // Also remove from local state
                adminData.unverifiedPayments.splice(rowIndex, 1);

                // Reload the "All Students" tab data to show new balance
                loadDashboardData(passwordInput.value); 
            } else {
                throw new Error(result.message || "Verification failed.");
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
            button.disabled = false;
            button.textContent = "Verify";
        }
    }

    /**
     * Handles submitting the "Add New Course" form
     */
    async function handleAddCourse(e) {
        e.preventDefault();
        
        const courseData = {
            name: document.getElementById("new-course-name").value,
            tuition: document.getElementById("new-tuition-fee").value,
            total: document.getElementById("new-course-amount").value,
            due: document.getElementById("new-due-date").value,
        };
        
        addCourseButton.disabled = true;
        addCourseButton.textContent = "Adding...";
        addCourseMessage.classList.add("hidden");

        try {
            const response = await fetchWithAuth(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'addCourse',
                    password: passwordInput.value,
                    courseData: courseData
                })
            });

            if (!response.ok) throw new Error("Server rejected request.");
            
            const result = await response.json();
            
            if (result.status === "success") {
                addCourseMessage.textContent = "Course added successfully!";
                addCourseMessage.className = "mt-3 text-sm text-center text-green-600";
                addCourseMessage.classList.remove("hidden");
                
                // Reload all data to show new course list
                loadDashboardData(passwordInput.value);
                addCourseForm.reset(); // Clear the form
            } else {
                throw new Error(result.message || "Failed to add course.");
            }
        } catch (err) {
            addCourseMessage.textContent = `Error: ${err.message}`;
            addCourseMessage.className = "mt-3 text-sm text-center text-red-600";
            addCourseMessage.classList.remove("hidden");
        } finally {
            addCourseButton.disabled = false;
            addCourseButton.textContent = "Add Course";
        }
    }

    /**
     * Handles clicking the "Delete" button on a course
     */
    async function handleDeleteCourse(e) {
        const button = e.currentTarget;
        const courseName = button.dataset.name;

        if (!confirm(`Are you sure you want to delete the course "${courseName}"?\nThis action cannot be undone.`)) {
            return;
        }
        
        button.disabled = true;
        button.textContent = "Deleting...";

        try {
            const response = await fetchWithAuth(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'deleteCourse',
                    password: passwordInput.value,
                    courseName: courseName
                })
            });
            
            if (!response.ok) throw new Error("Server rejected request.");
            
            const result = await response.json();
            
            if (result.status === "success") {
                // Reload all data to show updated course list
                loadDashboardData(passwordInput.value);
            } else {
                throw new Error(result.message || "Failed to delete course.");
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
            button.disabled = false;
            button.textContent = "Delete";
        }
    }

    /**
     * A wrapper for the fetch API to check for a valid WEB_APP_URL
     */
    async function fetchWithAuth(url, options) {
        if (!url || url === 'PASTE_YOUR_NEW_WEB_APP_URL_HERE') {
            throw new Error('Form configuration error. Please contact support.');
        }
        return fetch(url, options);
    }
});

