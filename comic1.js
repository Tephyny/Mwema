const panels = document.querySelectorAll('.comic-panel');
const caption = document.getElementById('caption');
let currentPanelIndex = 0;

document.getElementById('prev-arrow').addEventListener('click', showPreviousPanel);
document.getElementById('next-arrow').addEventListener('click', showNextPanel);

function showPanel(index) {
    panels.forEach((panel, i) => {
        panel.classList.remove('previous', 'active', 'next');
        if (i === index) {
            panel.classList.add('active');
            caption.innerText = panel.getAttribute('data-caption');
        } else if (i < index) {
            panel.classList.add('previous');
        } else {
            panel.classList.add('next');
        }
    });
}

function showPreviousPanel() {
    currentPanelIndex = (currentPanelIndex > 0) ? currentPanelIndex - 1 : panels.length - 1;
    showPanel(currentPanelIndex);
}

function showNextPanel() {
    currentPanelIndex = (currentPanelIndex < panels.length - 1) ? currentPanelIndex + 1 : 0;
    showPanel(currentPanelIndex);
}

// Initially display the first panel
showPanel(currentPanelIndex);
