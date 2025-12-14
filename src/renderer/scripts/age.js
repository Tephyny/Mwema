document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const letsGoBtn = document.getElementById('lets-go-btn');
    const closeBtn = document.querySelector('.modal-close');
    const optionList = document.getElementById('option-list');

    // Helper to open modal with transition
    const openModal = () => {
        modal.classList.add('active'); // CSS handles the transition
    };

    // Helper to close modal
    const closeModal = () => {
        modal.classList.remove('active');
    };

    // Show the modal
    if (letsGoBtn) {
        letsGoBtn.addEventListener('click', openModal);
    }

    // Close the modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Handle option selection using event delegation
    if (optionList) {
        optionList.addEventListener('click', (e) => {
            // Check if clicked element is an age option
            if (e.target.classList.contains('age-option')) {
                const selectedNumber = parseInt(e.target.getAttribute('data-number'));

                if (selectedNumber >= 1 && selectedNumber <= 4) {
                    window.location.href = 'home1.html';
                } else if (selectedNumber >= 5 && selectedNumber <= 9) {
                    window.location.href = 'home2.html';
                }
            }
        });
    }

    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Optional: Add ESC key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});
