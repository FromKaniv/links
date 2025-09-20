const mainPage = document.getElementById('main-page');
const articlePage = document.getElementById('article-page');
const articlesList = document.getElementById('articles-list');
const articleContent = document.getElementById('article-content');
const backButton = document.querySelector('.back-button');
const articleTitle = document.querySelector('.article-title');

const articles = [
    { filename: 'Запуск своєї сторінки.md', date: '21.09.25' },
];

// Функція для перетворення дати з ДД.ММ.РР у РРРР-ММ-ДД для сортування
const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`20${year}-${month}-${day}`);
};

// Сортування статей за датою (від найновіших до найстаріших)
articles.sort((a, b) => parseDate(b.date) - parseDate(a.date));

// Функція для показу списку статей та приховування сторінки статті
function showMainPage() {
    mainPage.classList.add('active');
    articlePage.classList.remove('active');
}

// Функція для показу сторінки статті та приховування списку
async function showArticlePage(filename) {
    const article = articles.find(art => art.filename === filename);
    if (!article) {
        console.error('Стаття не знайдена.');
        return;
    }
    
    try {
        const response = await fetch(`articles/${article.filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);
        
        // Оновлення вмісту
        articleTitle.textContent = article.filename.replace('.md', '');
        
        articleContent.innerHTML = `
        <p class="article-date-main">Дата публікації: ${article.date}</p>
        ${htmlContent}
        `;
        
        // Показуємо сторінку статті
        mainPage.classList.remove('active');
        articlePage.classList.add('active');
        
    } catch (error) {
        console.error('Не вдалося завантажити статтю:', error);
        articleContent.innerHTML = `<p>Помилка завантаження статті.</p>`;
    }
}

// Функція для створення списку посилань на статті
function createArticlesList() {
    const ul = document.createElement('ul');
    articles.forEach(article => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        const span = document.createElement('span');
        
        a.href = '#';
        a.textContent = article.filename.replace('.md', '');
        a.setAttribute('data-file', article.filename);
        
        span.textContent = article.date;
        span.classList.add('article-date-sidebar');
        
        a.appendChild(span);
        a.addEventListener('click', (e) => {
            e.preventDefault();
            showArticlePage(article.filename);
        });
        
        li.appendChild(a);
        ul.appendChild(li);
    });
    articlesList.appendChild(ul);
}

// Додаємо обробник подій для кнопки "Назад"
backButton.addEventListener('click', (e) => {
    e.preventDefault();
    showMainPage();
});

document.addEventListener('DOMContentLoaded', createArticlesList);