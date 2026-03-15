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

    // Handle Vote (Submits to Vercel Serverless Function that writes to Google Sheets)
    voteBtn.addEventListener('click', async () => {
        if (!selectedMenu) return;

        voteBtn.disabled = true;
        voteBtn.textContent = '투표 처리 중...';
        menuCards.forEach(c => c.style.pointerEvents = 'none');
        
        try {
            // Live Server (포트 5500 또는 확장프로그램 기본 설정) 환경에서는 Vercel Function이 동작하지 않습니다.
            const isLocalStaticServer = window.location.port !== '' && !window.location.port.startsWith('3000');
            
            if (isLocalStaticServer) {
                console.warn('현재 순수 정적(HTML) 라이브 서버에서는 Vercel \'/api/vote\' 실행 불가. 서버 연결을 시뮬레이션 합니다.');
                votes[selectedMenu]++;
                voteBtn.textContent = '참여 완료 (Mock)';
                updateResults();
                resultsSection.classList.add('show');
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            // Call the Vercel Serverless Function to write the vote
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ menu: selectedMenu })
            });

            if (response.ok) {
                // Success! Refresh data from the sheet.
                voteBtn.textContent = '참여 완료';
                await fetchVoteData(); // Read updated CSV and apply UI
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                alert('투표 처리에 실패했습니다. 서버 설정(환경변수 등)을 확인하세요.');
                
                // Fallback UX in case of error
                voteBtn.textContent = '참여 완료 (임시 반영)';
                votes[selectedMenu]++;
                updateResults();
                resultsSection.classList.add('show');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('네트워크 오류가 발생했습니다.');
            voteBtn.disabled = false;
            voteBtn.textContent = '투표하기';
            menuCards.forEach(c => c.style.pointerEvents = 'auto');
        }
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
