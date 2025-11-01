// This script handles the submission of the admission-form
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Form Elements ---
    const form = document.getElementById('admission-form');
    const submitButton = document.getElementById('submit-button');
    const formMessage = document.getElementById('form-message');
    const gradeSelect = document.getElementById('grade'); 

    // --- Photo Elements ---
    const studentPhotoInput = document.getElementById('studentPhoto');
    const photoPreview = document.getElementById('photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoError = document.getElementById('photo-error');

    // --- Config ---
    const MAX_FILE_SIZE_MB = 2;
    const COMPRESSION_QUALITY = 0.7; // 70% quality
    const MAX_IMAGE_WIDTH = 800; // Resize to max 800px width, preserving aspect ratio

    // --- Check for Web App URL ---
    if (typeof WEB_APP_URL === 'undefined' || WEB_APP_URL.startsWith('PASTE_')) {
        console.error('WEB_APP_URL is not defined in script.js.');
        formMessage.textContent = 'Form configuration error. Please contact support.';
        formMessage.className = 'form-message-error';
        formMessage.classList.remove('hidden');
        submitButton.disabled = true;
        return;
    }
    
    // --- Load Courses into Dropdown ---
    async function loadCourses() {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getCourseList`);
            const result = await response.json();

            if (result.status === 'success' && result.data.length > 0) {
                gradeSelect.innerHTML = '<option value="" disabled selected>Select a course</option>'; // Clear "Loading"
                
                result.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.Class;
                    option.textContent = `${course.Class} (₹${course.Total_Due_Amount.toFixed(2)})`;
                    gradeSelect.appendChild(option);
                });
            } else {
                throw new Error(result.message || 'No courses found.');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            gradeSelect.innerHTML = '<option value="" disabled selected>Error loading courses</option>';
        }
    }
    
    loadCourses();

    // --- !! THIS IS THE PREVIEW CODE !! ---
    studentPhotoInput.addEventListener('change', () => {
        const file = studentPhotoInput.files[0];
        if (!file) {
            // Clear preview if no file is selected
            photoPreview.src = "";
            photoPreview.classList.add('hidden');
            photoPlaceholder.classList.remove('hidden');
            photoError.classList.add('hidden');
            return;
        }

        // 1. Check Size
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            photoError.textContent = `File is too large. Max ${MAX_FILE_SIZE_MB}MB.`;
            photoError.classList.remove('hidden');
            studentPhotoInput.value = ""; // Clear the selection
            return;
        }

        // 2. Check Type
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            photoError.textContent = 'Invalid file type. Use PNG or JPG.';
            photoError.classList.remove('hidden');
            studentPhotoInput.value = ""; // Clear the selection
            return;
        }

        // 3. Show Preview
        photoError.classList.add('hidden');
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPreview.classList.remove('hidden');
            photoPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });
    // --- !! END OF PREVIEW CODE !! ---


    // --- Form Submit Listener ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        formMessage.classList.add('hidden');

        try {
            // 2. Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.action = "submitAdmission"; // Tell Apps Script what to do

            // 3. Handle File Upload & Compression
            const file = studentPhotoInput.files[0];
            if (file) {
                // Compress the image first
                const compressedBlob = await compressImage(file, MAX_IMAGE_WIDTH, COMPRESSION_QUALITY);
                
                // Convert compressed blob to Base64
                data.photoFile = await blobToBase64(compressedBlob, file.name);
                
                // Set the correct MIME type for the compressed file
                data.photoFile.type = 'image/jpeg';

            } else {
                // This check is now backed up by the 'required' attribute in the HTML
                throw new Error("Student photo is required.");
            }

            // 4. Send data to Google Apps Script
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                redirect: 'follow',
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                // 5. Show success message
                form.reset(); 
                loadCourses(); // Reset dropdown
                photoPreview.classList.add('hidden'); // Clear preview
                photoPlaceholder.classList.remove('hidden');
                formMessage.textContent = `Registration successful! Your new Student ID is: ${result.studentID}`;
                formMessage.className = 'form-message-success';
                formMessage.classList.remove('hidden');
            } else {
                throw new Error(result.message || 'An unknown error occurred.');
            }
        } catch (error) {
            // 6. Show error message
            console.error('Error submitting form:', error);
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'form-message-error';
            formMessage.classList.remove('hidden');
        } finally {
            // 7. Restore button
            submitButton.disabled = false;
            submitButton.textContent = 'Register Student';
        }
    });

    // --- Helper function to compress image ---
    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Get blob from canvas
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality); // Always compress to JPEG
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }

    // --- Helper function to convert BLOB to Base64 ---
    function blobToBase64(blob, fileName) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve({
                    base64: base64String,
                    type: blob.type, // Will be 'image/jpeg'
                    name: fileName.replace(/\.[^/.]+$/, "") + ".jpg" // Change extension to .jpg
                });
            };
            reader.onerror = error => reject(error);
        });
    }
});

