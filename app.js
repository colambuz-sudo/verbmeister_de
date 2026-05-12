const tg = window.Telegram.WebApp;
tg.expand();

let verbs = [];
let currentVerb = null;
let score = 0;

async function init() {
    try {
        const response = await fetch('verbs_tab.json');
        verbs = await response.json();
        nextQuestion();
    } catch (e) {
        document.getElementById('question-area').innerText = "Fehler beim Laden der Verben.";
    }
}

function nextQuestion() {
    currentVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const options = generateOptions(currentVerb);
    
    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="verb-infinitive">${currentVerb.infinitive}</div>
        <p>${currentVerb.translate}</p>
        <div id="options"></div>
    `;
    
    const optionsDiv = document.getElementById('options');
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt);
        optionsDiv.appendChild(btn);
    });
}

function generateOptions(correctVerb) {
    let opts = [correctVerb.correct];
    while(opts.length < 4) {
        let randomVerb = verbs[Math.floor(Math.random() * verbs.length)].correct;
        if(!opts.includes(randomVerb)) opts.push(randomVerb);
    }
    return opts.sort(() => Math.random() - 0.5);
}

function checkAnswer(selected) {
    if (selected === currentVerb.correct) {
        score++;
        tg.HapticFeedback.notificationOccurred('success');
        nextQuestion();
    } else {
        tg.HapticFeedback.notificationOccurred('error');
        alert(`Falsch! Richtig ist: ${currentVerb.correct}`);
        nextQuestion();
    }
}

init();