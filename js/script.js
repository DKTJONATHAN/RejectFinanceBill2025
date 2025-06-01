// Reference to the form
const reportForm = document.getElementById('reportForm');

// Function to close the pop-up
function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Handle report form submission
reportForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Get form data
    const name = document.getElementById('name').value.trim();
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];
    const isAnonymous = document.getElementById('anonymous').checked;
    const popup = document.getElementById('reportPopup');
    const popupMessage = document.getElementById('reportPopupMessage');
    const form = document.getElementById('reportForm');
    const submitButton = form.querySelector('button');

    // Validate required fields
    if (!date || !location || !description) {
        popupMessage.textContent = 'Please fill in all required fields';
        popup.classList.add('error');
        popup.style.display = 'flex';
        return;
    }

    // Set the created_at field value
    document.getElementById('created_at').value = new Date().toISOString();

    submitButton.disabled = true;

    try {
        // Note: Google Forms/Google Apps Script does not support direct file uploads.
        // We'll include a placeholder message in the 'evidence_url' field.
        const formData = new FormData(form);
        if (file) {
            formData.set('evidence_url', '[File uploaded - see manual upload instructions]');
        } else {
            formData.set('evidence_url', 'No file uploaded');
        }

        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        const result = await response.json();

        if (result.result === 'success') {
            popupMessage.textContent = isAnonymous || !name
                ? 'Successfully reported anonymously'
                : `Thank you ${name} for reporting`;
            popup.classList.remove('error');
            popup.style.display = 'flex';
            form.reset();
            setTimeout(() => closePopup('reportPopup'), 3000);
        } else {
            popupMessage.textContent = `Error: ${result.message || 'Could not submit report'}`;
            popup.classList.add('error');
            popup.style.display = 'flex';
        }
    } catch (error) {
        popupMessage.textContent = 'Error: Could not submit report. Please try again.';
        popup.classList.add('error');
        popup.style.display = 'flex';
        console.error('Submission error:', error);
    } finally {
        submitButton.disabled = false;
    }
});
