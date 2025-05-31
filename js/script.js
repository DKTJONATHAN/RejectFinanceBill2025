console.log('Script loaded successfully');

// Supabase Configuration
const SUPABASE_URL = 'https://rrzhzrnuzfbrrwuvgxth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyemh6cm51emZicnJ3dXZneHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTM4OTUsImV4cCI6MjA2NDI4OTg5NX0.gV2zYcwcQQBESfx4g9Lr4JUmDaVgzn_LHXHmW7XLVHk';
try {
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
} catch (error) {
    console.error('Supabase initialization failed:', error.message);
}

// Form Submission
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submission triggered');

    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
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
        
        if (error) throw error;

        console.log('Report inserted:', data);
        alert('Report submitted successfully!');
        document.getElementById('reportForm').reset();
    } catch (error) {
        console.error('Submission error:', error.message);
        alert(`Failed to submit report: ${error.message}`);
    }
});

// Load Reports
async function loadReports() {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        const reportList = document.getElementById('reportList');
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
                `;
                reportList.appendChild(reportCard);
            });
        }
    } catch (error) {
        console.error('Error loading reports:', error.message);
    }
}

// Initial load
loadReports();

// Real-Time Subscription
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
