function chooseOption(scenarioId, choice) {
    const result = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const scenarios = document.querySelectorAll('.scenario');
    const restartButton = document.getElementById('restart-button');

    const correctChoices = {
        1: 'refuse',
        2: 'refuse',
        3: 'refuse',
        4: 'refuse',
        5: 'refuse'
    };

    const images = {
        1: {
            correct: 'images/correct1.png',
            incorrect: 'images/incorrect.png'
        },
        2: {
            correct: 'images/correct1.png',
            incorrect: 'images/incorrect.png'
        },
        3: {
            correct: 'images/correct1.png',
            incorrect: 'images/incorrect.png'
        },
        4: {
            correct: 'images/correct1.png',
            incorrect: 'images/incorrect.png'
        },
        5: {
            correct: 'images/correct1.png',
            incorrect: 'images/incorrect.png'
        }
    };

    if (choice === correctChoices[scenarioId]) {
        result.innerText = 'Great choice! You handled the situation well.';
        result.style.color = 'var(--correct-color)';
        resultImage.innerHTML = `<img src="${images[scenarioId].correct}" alt="Correct Choice">`;
        if (scenarioId < scenarios.length) {
            scenarios[scenarioId - 1].style.display = 'none';
            scenarios[scenarioId].style.display = 'block';
        } else {
            result.innerText += ' You have completed all the scenarios!';
            restartButton.style.display = 'block';
        }
    } else {
        result.innerText = 'Not the best choice. Try again!';
        result.style.color = 'var(--incorrect-color)';
        resultImage.innerHTML = `<img src="${images[scenarioId].incorrect}" alt="Incorrect Choice">`;
    }
}

function restartGame() {
    const scenarios = document.querySelectorAll('.scenario');
    const result = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const restartButton = document.getElementById('restart-button');

    scenarios.forEach((scenario, index) => {
        scenario.style.display = index === 0 ? 'block' : 'none';
    });
    result.innerText = '';
    resultImage.innerHTML = '';
    restartButton.style.display = 'none';
}

// Initially display the first scenario
document.querySelector('.scenario').style.display = 'block';
