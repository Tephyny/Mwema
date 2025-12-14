const cards = [
    'Truth', 'Truth',
    'Honesty', 'Honesty',
    'Integrity', 'Integrity',
    'Trust', 'Trust',
    'Loyalty', 'Loyalty',
    'Respect', 'Respect'
  ];
  
  let hasFlippedCard = false;
  let lockBoard = false;
  let firstCard, secondCard;
  let matches = 0;
  
  const memoryGrid = document.querySelector('.memory-grid');
  const matchImage = document.getElementById('match-image');
  const restartBtn = document.getElementById('restart-btn');
  
  cards.sort(() => 0.5 - Math.random()).forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('memory-card');
    cardElement.textContent = card;
    cardElement.addEventListener('click', flipCard);
    memoryGrid.appendChild(cardElement);
  });
  
  function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
  
    this.classList.add('flipped');
    if (!hasFlippedCard) {
      hasFlippedCard = true;
      firstCard = this;
      return;
    }
    secondCard = this;
    checkForMatch();
  }
  
  function checkForMatch() {
    let isMatch = firstCard.textContent === secondCard.textContent;
    if (isMatch) {
      disableCards();
      matches += 2;
      matchImage.style.display = 'block';
      setTimeout(() => {
        matchImage.style.display = 'none';
      }, 1000);
      if (matches === cards.length) {
        restartBtn.style.display = 'block';
      }
    } else {
      unflipCards();
    }
  }
  
  function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
  }
  
  function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetBoard();
    }, 1500);
  }
  
  function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
  }
  
  function restartGame() {
    matches = 0;
    memoryGrid.innerHTML = '';
    restartBtn.style.display = 'none';
    cards.sort(() => 0.5 - Math.random()).forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('memory-card');
      cardElement.textContent = card;
      cardElement.addEventListener('click', flipCard);
      memoryGrid.appendChild(cardElement);
    });
  }
  