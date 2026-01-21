// Story Library Script

// Since nodeIntegration is true, we can use ipcRenderer directly
const { ipcRenderer } = require('electron');

let allStories = [];
let currentStoryForModal = null;

document.addEventListener('DOMContentLoaded', async () => {
    const emptyState = document.getElementById('empty-state');
    const storiesGrid = document.getElementById('stories-grid');
    const storyModal = document.getElementById('story-modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMetadata = document.getElementById('modal-metadata');
    const modalContent = document.getElementById('modal-content');
    const modalPlayBtn = document.getElementById('modal-play-btn');
    const modalStopBtn = document.getElementById('modal-stop-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');

    // Load stories on page load
    await loadStories();

    // Close modal
    closeModal.addEventListener('click', () => {
        storyModal.style.display = 'none';
        ipcRenderer.send('stop-reading'));
        modalStopBtn.style.display = 'none';
        modalPlayBtn.style.display = 'flex';
    });

    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === storyModal) {
            storyModal.style.display = 'none';
            ipcRenderer.send('stop-reading'));
            modalStopBtn.style.display = 'none';
            modalPlayBtn.style.display = 'flex';
        }
    });

    // Modal TTS controls
    modalPlayBtn.addEventListener('click', () => {
        if (currentStoryForModal) {
            ipcRenderer.send('read-story',currentStoryForModal.content);
            modalPlayBtn.style.display = 'none';
            modalStopBtn.style.display = 'flex';
        }
    });

    modalStopBtn.addEventListener('click', () => {
        ipcRenderer.send('stop-reading'));
        modalStopBtn.style.display = 'none';
        modalPlayBtn.style.display = 'flex';
    });

    modalDeleteBtn.addEventListener('click', async () => {
        if (currentStoryForModal && confirm('Are you sure you want to delete this story?')) {
            try {
                await ipcRenderer.invoke('delete-story',currentStoryForModal.id);
                storyModal.style.display = 'none';
                await loadStories(); // Reload stories
            } catch (error) {
                console.error('Error deleting story:', error);
                alert('Failed to delete story. Please try again.');
            }
        }
    });

    // TTS event listeners
    ipcRenderer.on('tts-finished',() => {
        modalStopBtn.style.display = 'none';
        modalPlayBtn.style.display = 'flex';
    });

    ipcRenderer.on('tts-error',((error) => {
        console.error('TTS Error:', error);
        modalStopBtn.style.display = 'none';
        modalPlayBtn.style.display = 'flex';
    });

    /**
     * Load all saved stories
     */
    async function loadStories() {
        try {
            allStories = await ipcRenderer.invoke('get-saved-stories'));

            if (allStories.length === 0) {
                // Show empty state
                emptyState.style.display = 'block';
                storiesGrid.style.display = 'none';
            } else {
                // Show stories grid
                emptyState.style.display = 'none';
                storiesGrid.style.display = 'grid';
                renderStories();
            }
        } catch (error) {
            console.error('Error loading stories:', error);
            alert('Failed to load stories. Please try again.');
        }
    }

    /**
     * Render stories to the grid
     */
    function renderStories() {
        storiesGrid.innerHTML = '';

        allStories.forEach(story => {
            const storyCard = createStoryCard(story);
            storiesGrid.appendChild(storyCard);
        });
    }

    /**
     * Create a story card element
     */
    function createStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'box story-library-card';
        card.style.cursor = 'pointer';

        const date = new Date(story.date);
        const dateStr = date.toLocaleDateString();

        // Get first 100 characters for preview
        const preview = story.content.substring(0, 100) + (story.content.length > 100 ? '...' : '');

        card.innerHTML = `
            <div style="padding: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class='bx bx-user' style="font-size: 1.2rem; color: var(--secondary);"></i>
                    <h3 style="margin: 0; font-size: 1.3rem; color: var(--primary);">${escapeHtml(story.childName)}</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <i class='bx bx-badge-check' style="font-size: 1rem; color: var(--accent);"></i>
                    <span style="font-size: 0.9rem; color: var(--text-muted);">${escapeHtml(story.value)}</span>
                    <span style="margin-left: auto; font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span>
                </div>
                <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6; margin: 0;">
                    ${escapeHtml(preview)}
                </p>
                <button style="margin-top: 1rem; padding: 0.5rem 1rem; border-radius: var(--radius-sm); background: var(--secondary); color: white; border: none; cursor: pointer; width: 100%;">
                    📖 Read Full Story
                </button>
            </div>
        `;

        card.addEventListener('click', () => openStoryModal(story));

        return card;
    }

    /**
     * Open story in modal
     */
    function openStoryModal(story) {
        currentStoryForModal = story;
        const date = new Date(story.date);
        const dateStr = date.toLocaleString();

        modalTitle.textContent = `📖 ${story.childName}'s Story`;
        modalMetadata.innerHTML = `
            <strong>Character Value:</strong> ${escapeHtml(story.value)} &nbsp;|&nbsp; 
            <strong>Created:</strong> ${dateStr}
        `;
        modalContent.textContent = story.content;

        storyModal.style.display = 'flex';
        modalPlayBtn.style.display = 'flex';
        modalStopBtn.style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
