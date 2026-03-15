document.addEventListener('DOMContentLoaded', () => {
    const menuCards = document.querySelectorAll('.menu-card');
    const voteBtn = document.getElementById('voteBtn');
    const resultsSection = document.getElementById('results');
    let selectedMenu = null;

    // Google Sheets CSV export URL
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1EQlzr9hgwljmjys8gNihwb299-ATdPe2ssN9k3tkMU4/gviz/tq?tqx=out:csv';

    const votes = {
        bibimbap: 0,
        tonkatsu: 0,
        gukbap: 0,
        salad: 0
    };

    // Mapping Korean names or sheet values to internal IDs
    const menuMap = {
        '비빔밥': 'bibimbap',
        '돈까스': 'tonkatsu',
        '국밥': 'gukbap',
        '샐러드': 'salad',
        'Bibimbap': 'bibimbap',
        'Tonkatsu': 'tonkatsu',
        'Gukbap': 'gukbap',
        'Salad': 'salad'
    };

    async function fetchVoteData() {
        try {
            const response = await fetch(SHEET_URL);
            const csvText = await response.text();
            
            // Simple CSV parsing (assuming menu is in the second column based on subagent analysis)
            // Rows are generally: "timestamp","menu","voter"
            const lines = csvText.split('\n').slice(1); // Skip header
            
            // Reset votes
            Object.keys(votes).forEach(key => votes[key] = 0);
            
            lines.forEach(line => {
                if (!line.trim()) return;
                // Match content inside quotes
                const columns = line.match(/"([^"]*)"/g);
                if (columns && columns.length >= 2) {
                    const menuValue = columns[1].replace(/"/g, ''); // Second column
                    const menuId = menuMap[menuValue];
                    if (menuId) {
                        votes[menuId]++;
                    }
                }
            });

            updateResults();
            resultsSection.classList.add('show');
        } catch (error) {
            console.error('Error fetching data from Google Sheets:', error);
            // If error, just show 0 votes as requested
            updateResults();
            resultsSection.classList.add('show');
        }
    }

    // Initial load
    fetchVoteData();

    // Menu Selection
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            menuCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMenu = card.dataset.id;
            voteBtn.disabled = false;
        });
    });

    // Handle Vote (Current implementation just shows updated data from sheet)
    voteBtn.addEventListener('click', () => {
        if (!selectedMenu) return;

        // In a real app, this would submit to a Form/API that writes to the sheet.
        // For now, we simulate the submission and refresh from the sheet.
        voteBtn.disabled = true;
        voteBtn.textContent = '참여 완료';
        menuCards.forEach(c => c.style.pointerEvents = 'none');
        
        // Refresh data to show latest state from sheet
        fetchVoteData();
        
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function updateResults() {
        const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
        
        Object.keys(votes).forEach(id => {
            const count = votes[id];
            const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
            const resultItem = document.querySelector(`.result-item[data-for="${id}"]`);
            
            if (resultItem) {
                const percentageSpan = resultItem.querySelector('.percentage');
                const progressBar = resultItem.querySelector('.progress-bar-fill');
                
                percentageSpan.textContent = `${percentage}% (${count}표)`;
                
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 100);
            }
        });
    }
});
