const items = document.querySelectorAll('.item');
const safeCategory = document.getElementById('safe-category');
const unsafeCategory = document.getElementById('unsafe-category');
const correctImg = document.getElementById('correct-img');
const wrongImg = document.getElementById('wrong-img');
const restartButton = document.getElementById('restart-button');
const itemsContainer = document.querySelector('.items-container');

let itemStates = {
    'Visiting approved websites': false,
    'Telling an adult about something uncomfortable': false,
    'Clicking any free links': false,
    'Downloading files from websites you dont know': false,
};

const safeItems = ['Visiting approved websites', 'Telling an adult about something uncomfortable'];
const unsafeItems = ['Clicking any free links', 'Downloading files from websites you dont know'];

items.forEach(item => {
    item.addEventListener('dragstart', dragStart);
});

[safeCategory, unsafeCategory].forEach(category => {
    category.addEventListener('dragover', dragOver);
    category.addEventListener('drop', drop);
});

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.innerText);
    e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    const droppedItem = Array.from(items).find(item => item.innerText === text);
    if (droppedItem) {
        e.target.appendChild(droppedItem);
        checkMatch(droppedItem, e.target);
    }
}

function checkMatch(item, category) {
    correctImg.style.display = 'none';
    wrongImg.style.display = 'none';

    if (category.id === 'safe-category' && safeItems.includes(item.innerText)) {
        correctImg.style.display = 'block';
        itemStates[item.innerText] = true;
    } else if (category.id === 'unsafe-category' && unsafeItems.includes(item.innerText)) {
        correctImg.style.display = 'block';
        itemStates[item.innerText] = true;
    } else {
        wrongImg.style.display = 'block';
        itemStates[item.innerText] = false;
    }

    checkAllCorrect();
}

function checkAllCorrect() {
    const allCorrect = Object.values(itemStates).every(state => state);
    if (allCorrect) {
        restartButton.style.display = 'block';
    }
}

function restartGame() {
    // Reset item states
    itemStates = {
        'Visiting approved websites': false,
        'Telling an adult about something uncomfortable': false,
        'Clicking any free links': false,
        'Downloading files from websites you dont know': false,
    };

    // Move items back to the original container
    items.forEach(item => {
        itemsContainer.appendChild(item);
    });

    // Hide result images and restart button
    correctImg.style.display = 'none';
    wrongImg.style.display = 'none';
    restartButton.style.display = 'none';
}


