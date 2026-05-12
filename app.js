const tg = window.Telegram.WebApp;
tg.expand();

let verbs = [];
let currentVerb = null;
let score = 0;

async function init() {
    try {
        // Пытаемся загрузить JSON
        const response = await fetch('verbs_tab.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        verbs = await response.json();
        nextQuestion();
    } catch (e) {
        console.error(e);
        document.getElementById('question-area').innerText = `Fehler: ${e.message}. Проверьте, что verbs_tab.json загружен на GitHub.`;
    }
}

function nextQuestion() {
    if (verbs.length === 0) return;
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
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        nextQuestion();
    } else {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        alert(`Falsch! Richtig ist: ${currentVerb.correct}`);
        nextQuestion();
    }
}

init();