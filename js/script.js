console.log('Script loaded successfully');

// Supabase Configuration
const SUPABASE_URL = 'https://rrzhzrnuzfbrrwuvgxth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyemh6cm51emZicnJ3dXZneHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTM4OTUsImV4cCI6MjA2NDI4OTg5NX0.gV2zYcwcQQBESfx4g9Lr4JUmDaVgzn_LHXHmW7XLVHk';

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
} catch (error) {
    console.error('Supabase initialization failed:', error.message);
    alert('Failed to connect to database. Please try again later.');
}

// Form Submission
const form = document.getElementById('reportForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submission triggered');

        if (!supabase) {
            console.error('Supabase client not initialized');
            alert('Database connection failed. Please refresh the page.');
            return;
        }

        const name = document.getElementById('name').value;
        const date = document.getElementById('date').value;
        const location = document.getElementById('location').value;
        const description = document.getElementById('description').value;
        const file = document.getElementById('file').files[0];
        const anonymous = document.getElementById('anonymous').checked;

        const submission = {
            name: anonymous ? 'Anonymous' : (name || 'Anonymous'),
            date,
            location,
            description,
            created_at: new Date().toISOString()
        };

        try {
            console.log('Attempting to insert report:', submission);
            const { data, error } = await supabase
                .from('reports')
                .insert([submission])
                .select();
            
            if (error) {
                console.error('Insert error:', error);
                throw error;
            }

            const reportId = data[0].id;
            console.log('Report inserted, ID:', reportId);

            // Upload file if provided
            let fileUrl = null;
            if (file) {
                console.log('Uploading file:', file.name);
                const { error: uploadError } = await supabase.storage
                    .from('reports')
                    .upload(`${reportId}/${file.name}`, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('reports')
                    .getPublicUrl(`${reportId}/${file.name}`);
                fileUrl = urlData.publicUrl;
                console.log('File uploaded, URL:', fileUrl);

                const { error: updateError } = await supabase
                    .from('reports')
                    .update({ file_url: fileUrl })
                    .eq('id', reportId);
                if (updateError) throw updateError;
            }

            alert('Report submitted successfully!');
            form.reset();
        } catch (error) {
            console.error('Submission error:', error.message);
            alert(`Failed to submit report: ${error.message}`);
        }
    });
} else {
    console.error('Form element not found');
}

// Load Reports
async function loadReports() {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        const reportList = document.getElementById('reportList');
        if (reportList) {
            reportList.innerHTML = '';
            if (data) {
                console.log('Reports fetched:', data);
                data.forEach((report) => {
                    const reportCard = document.createElement('div');
                    reportCard.className = 'report-card';
                    reportCard.innerHTML = `
                        <p><strong>Name:</strong> ${report.name}</p>
                        <p><strong>Date:</strong> ${report.date}</p>
                        <p><strong>Location:</strong> ${report.location}</p>
                        <p><strong>Description:</strong> ${report.description}</p>
                        ${report.file_url ? `<p><a href="${report.file_url}" target="_blank">View Evidence</a></p>` : ''}
                    `;
                    reportList.appendChild(reportCard);
                });
            }
        } else {
            console.error('reportList element not found');
        }
    } catch (error) {
        console.error('Error loading reports:', error.message);
    }
}

// Initial load
loadReports();

// Real-Time Subscription
if (supabase) {
    supabase
        .channel('reports-channel')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'reports' },
            (payload) => {
                console.log('New report:', payload);
                loadReports();
            }
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });
} else {
    console.error('Cannot subscribe: Supabase client not initialized');
}
