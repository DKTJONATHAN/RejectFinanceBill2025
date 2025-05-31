// Supabase Configuration
const SUPABASE_URL = 'https://rrzhzrnuzfbrrwuvgxth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyemh6cm51emZicnJ3dXZneHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTM4OTUsImV4cCI6MjA2NDI4OTg5NX0.gV2zYcwcQQBESfx4g9Lr4JUmDaVgzn_LHXHmW7XLVHk';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Form Submission
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();

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
        // Store metadata in Supabase database
        const { data, error } = await supabase
            .from('reports')
            .insert([submission])
            .select();
        
        if (error) throw error;

        const reportId = data[0].id;

        // Upload file to Supabase Storage if provided
        let fileUrl = null;
        if (file) {
            const { error: uploadError } = await supabase.storage
                .from('reports')
                .upload(`${reportId}/${file.name}`, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('reports')
                .getPublicUrl(`${reportId}/${file.name}`);
            fileUrl = urlData.publicUrl;

            await supabase
                .from('reports')
                .update({ file_url: fileUrl })
                .eq('id', reportId);
        }

        alert('Report submitted successfully!');
        document.getElementById('reportForm').reset();
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Error submitting report. Please try again.');
    }
});

// Real-Time Display
const reportList = document.getElementById('reportList');
supabase
    .channel('reports-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        reportList.innerHTML = '';
        supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching reports:', error);
                    return;
                }
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
                    reportList.prepend(reportCard);
                });
            });
    })
    .subscribe();
