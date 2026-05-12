const tg = window.Telegram?.WebApp || {
    expand() {},
    HapticFeedback: null
};
tg.expand();

const QUIZ_SIZE = 15;
const QUIZ_TITLES = {
    forms: "Формы глаголов",
    translation: "Перевод -> формы"
};

let verbs = [];
let quizType = null;
let quizVerbs = [];
let questionIndex = 0;
let currentVerb = null;
let correctOption = null;
let score = 0;
let wrongAnswers = [];

async function init() {
    try {
        const response = await fetch('verbs_tab.json?v=20260513-3', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        verbs = await response.json();
        showHome();
    } catch (e) {
        console.error(e);
        document.getElementById('question-area').innerText = `Fehler: ${e.message}. Проверьте, что verbs_tab.json загружен на GitHub.`;
    }
}

function showHome() {
    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="verb-infinitive">VerbMeister DE</div>
        <p>Выбери викторину</p>
        <button class="option-btn" id="forms-quiz">${QUIZ_TITLES.forms}</button>
        <button class="option-btn" id="translation-quiz">${QUIZ_TITLES.translation}</button>
        <button class="option-btn" id="help-btn">❓ Помощь</button>
    `;

    document.getElementById('forms-quiz').onclick = () => startQuiz('forms');
    document.getElementById('translation-quiz').onclick = () => startQuiz('translation');
    document.getElementById('help-btn').onclick = showHelp;
}

function showHelp() {
    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="verb-infinitive">Помощь</div>
        <p><strong>${QUIZ_TITLES.forms}</strong><br>
        Вы видите инфинитив и выбираете правильные формы Präteritum и Partizip II.</p>
        <p><strong>${QUIZ_TITLES.translation}</strong><br>
        Вы видите русский перевод и выбираете строку со всеми тремя немецкими формами.</p>
        <p>В каждой викторине 15 случайных глаголов. После ответа показываются правильные формы и перевод, в конце - результат и список ошибок.</p>
        <button class="option-btn" id="home-btn">Домой</button>
    `;

    document.getElementById('home-btn').onclick = showHome;
}

function startQuiz(type) {
    quizType = type;
    quizVerbs = shuffle([...verbs]).slice(0, Math.min(QUIZ_SIZE, verbs.length));
    questionIndex = 0;
    score = 0;
    wrongAnswers = [];
    nextQuestion();
}

function nextQuestion() {
    if (questionIndex >= quizVerbs.length) {
        showStats();
        return;
    }

    currentVerb = quizVerbs[questionIndex];
    const options = buildOptions(currentVerb, quizType);
    const questionText = quizType === 'translation'
        ? currentVerb.translate
        : currentVerb.infinitive;

    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="stats">${questionIndex + 1}/${quizVerbs.length} · ${QUIZ_TITLES[quizType]}</div>
        <div class="verb-infinitive">${questionText}</div>
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

function buildOptions(verb, type) {
    if (type === 'translation') {
        correctOption = formatVerbForms(verb);
        const wrongOptions = verbs
            .filter(item => item.infinitive !== verb.infinitive)
            .map(formatVerbForms);

        return shuffle([correctOption, ...shuffle(wrongOptions).slice(0, 3)]);
    }

    correctOption = verb.correct;
    return buildFormOptions(verb);
}

function buildFormOptions(verb) {
    const options = [verb.correct];
    const wrongOptions = generateWrongFormOptions(verb);

    wrongOptions.forEach(option => {
        if (options.length < 4 && !options.includes(option)) {
            options.push(option);
        }
    });

    while (options.length < 4) {
        const randomOption = verbs[Math.floor(Math.random() * verbs.length)].correct;
        if (!options.includes(randomOption)) {
            options.push(randomOption);
        }
    }

    return shuffle(options);
}

function generateWrongFormOptions(verb) {
    const [past, participle] = splitAnswer(verb.correct);
    const [weakPast, weakParticiple] = buildWeakForms(verb.infinitive);
    const mutatedPast = mutatePastForm(past, verb.infinitive);
    const mutatedParticiple = mutateParticiple(participle, verb.infinitive);

    return shuffle([
        `${weakPast} - ${weakParticiple}`,
        `${weakPast} - ${participle}`,
        `${past} - ${weakParticiple}`,
        `${mutatedPast} - ${participle}`,
        `${past} - ${mutatedParticiple}`,
        `${mutatedPast} - ${mutatedParticiple}`
    ]).filter((option, index, array) => option !== verb.correct && array.indexOf(option) === index);
}

function checkAnswer(selected) {
    const isCorrect = selected === correctOption;

    if (isCorrect) {
        score++;
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } else {
        wrongAnswers.push(currentVerb);
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    }

    questionIndex++;
    showAnswer(isCorrect);
}

function showAnswer(isCorrect) {
    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="verb-infinitive">${isCorrect ? '✅ Richtig!' : '❌ Falsch!'}</div>
        <p>${formatVerbDetails(currentVerb).replace('\n', '<br>')}</p>
        <button class="option-btn" id="next-btn">${questionIndex >= quizVerbs.length ? 'Ergebnis' : 'Weiter'}</button>
    `;

    document.getElementById('next-btn').onclick = nextQuestion;
}

function showStats() {
    const wrongList = wrongAnswers.length
        ? wrongAnswers.map(item => `<li>${formatVerbDetails(item).replace('\n', '<br>')}</li>`).join('')
        : '<li>Keine Fehler.</li>';

    const container = document.getElementById('question-area');
    container.innerHTML = `
        <div class="verb-infinitive">Fertig!</div>
        <p>Ergebnis: ${score} von ${quizVerbs.length} richtig.</p>
        <div class="stats">Fehler:</div>
        <ul style="text-align: left;">${wrongList}</ul>
        <button class="option-btn" id="again-btn">Еще раз</button>
        <button class="option-btn" id="home-btn">Домой</button>
    `;

    document.getElementById('again-btn').onclick = () => startQuiz(quizType);
    document.getElementById('home-btn').onclick = showHome;
}

function formatVerbForms(verb) {
    const [past, participle] = splitAnswer(verb.correct);
    return `${verb.infinitive} - ${past} - ${participle}`;
}

function formatVerbDetails(verb) {
    return `${formatVerbForms(verb)}\n${verb.translate}`;
}

function splitAnswer(answer) {
    return answer.split(' - ', 2).map(part => part.trim());
}

function getStem(infinitive) {
    if (infinitive.endsWith('en')) return infinitive.slice(0, -2);
    if (infinitive.endsWith('n')) return infinitive.slice(0, -1);
    return infinitive;
}

function buildWeakForms(infinitive) {
    const stem = getStem(infinitive);
    const ending = infinitive.endsWith('ein') ? 'nte' : stem.endsWith('d') || stem.endsWith('t') ? 'ete' : 'te';
    const participleEnding = stem.endsWith('d') || stem.endsWith('t') ? 'et' : 't';

    return [`${stem}${ending}`, `ge${stem}${participleEnding}`];
}

function mutatePastForm(past, infinitive) {
    const stem = getStem(infinitive);

    if (past.endsWith('te')) return past.slice(0, -2);
    if (past.endsWith('t')) return `${past}e`;
    if (past.includes(' ')) {
        const [firstPart, ...rest] = past.split(' ');
        return `${firstPart}te ${rest.join(' ')}`;
    }
    if (infinitive.endsWith('ein')) return `${stem}nte`;

    return `${stem}te`;
}

function mutateParticiple(participle, infinitive) {
    const stem = getStem(infinitive);

    if (participle.startsWith('ge') && participle.endsWith('en')) return `${participle.slice(0, -2)}t`;
    if (participle.endsWith('t')) return `${participle.slice(0, -1)}en`;
    if (participle.startsWith('ge')) return participle.slice(2);

    return `ge${stem}t`;
}

function shuffle(items) {
    return items
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.value);
}

init();
