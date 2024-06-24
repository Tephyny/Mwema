document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const letsGoBtn = document.getElementById('lets-go-btn');
    const closeBtn = document.querySelector('.close-btn');
    const optionList = document.getElementById('option-list');

    // Show the modal when the "Let's Go" button is clicked
    letsGoBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Close the modal when the user clicks the close button
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Handle option selection
    optionList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const selectedNumber = parseInt(e.target.getAttribute('data-number'));

            if (selectedNumber >= 1 && selectedNumber <= 4) {
                window.location.href = 'home1.html';
            } else if (selectedNumber >= 5 && selectedNumber <= 9) {
                window.location.href = 'home2.html';
            }
        }
    });

    // Close the modal if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
