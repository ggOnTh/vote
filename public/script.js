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

    // Google Apps Script Web App URL (생성한 웹 앱 URL을 여기에 입력하세요)
    // 예: 'https://script.google.com/macros/s/AKfycby.../exec'
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxQWq21Vf-IZ0MkSJrKZY8A5RlfRtp1L8riJiZ936eV0RCBaaALjq5Q9LkvijZUUsKr/exec';

    // Handle Vote (Submits to Google Apps Script Web App)
    voteBtn.addEventListener('click', async () => {
        if (!selectedMenu) return;

        voteBtn.disabled = true;
        voteBtn.textContent = '투표 처리 중...';
        menuCards.forEach(c => c.style.pointerEvents = 'none');

        try {
            if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
                console.warn('Google Apps Script URL이 설정되지 않았습니다. 시뮬레이션으로 진행합니다.');
                votes[selectedMenu]++;
                voteBtn.textContent = '참여 완료 (Mock)';
                updateResults();
                resultsSection.classList.add('show');
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            // Call the Google Apps Script Web App
            // Google Apps Script는 리다이렉트를 포함하므로 브라우저 CORS 제약을 피하기 위해 'no-cors' 모드를 흔히 사용합니다.
            await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `menu=${selectedMenu}`
            });

            // no-cors 모드에서는 response.ok (opaque)를 직접 확인할 수 없으므로,
            // 에러가 throw 되지 않았다면 성공으로 간주하고 UI를 갱신합니다.
            voteBtn.textContent = '참여 완료';

            // 시트에 데이터가 반영되는 약간의 지연 시간을 고려하여 1.5초 후 갱신
            setTimeout(async () => {
                await fetchVoteData();
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1500);

        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('투표 중 네트워크 오류가 발생했습니다.');
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
