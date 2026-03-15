document.addEventListener('DOMContentLoaded', () => {
    const menuCards = document.querySelectorAll('.menu-card');
    const voteBtn = document.getElementById('voteBtn');
    const resultsSection = document.getElementById('results');
    let selectedMenu = null;

    // Initial mock data for voting
    const votes = {
        bibimbap: 12,
        tonkatsu: 18,
        gukbap: 25,
        salad: 8
    };

    // Menu Selection
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove previous selection
            menuCards.forEach(c => c.classList.remove('selected'));
            
            // Add new selection
            card.classList.add('selected');
            selectedMenu = card.dataset.id;
            
            // Enable vote button
            voteBtn.disabled = false;
        });
    });

    // Handle Vote
    voteBtn.addEventListener('click', () => {
        if (!selectedMenu) return;

        // Increment vote
        votes[selectedMenu]++;
        
        // Disable interactions
        voteBtn.disabled = true;
        voteBtn.textContent = '참여 완료';
        menuCards.forEach(c => c.style.pointerEvents = 'none');

        // Show results
        updateResults();
        resultsSection.classList.add('show');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function updateResults() {
        const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
        
        Object.keys(votes).forEach(id => {
            const percentage = Math.round((votes[id] / totalVotes) * 100);
            const resultItem = document.querySelector(`.result-item[data-for="${id}"]`);
            
            if (resultItem) {
                const percentageSpan = resultItem.querySelector('.percentage');
                const progressBar = resultItem.querySelector('.progress-bar-fill');
                
                percentageSpan.textContent = `${percentage}% (${votes[id]}표)`;
                
                // Animate progress bar
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 100);
            }
        });
    }
});
