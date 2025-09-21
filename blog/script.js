const mainPage = document.getElementById('main-page');
const articlePage = document.getElementById('article-page');
const articlesList = document.getElementById('articles-list');
const articleContent = document.getElementById('article-content');
const backButton = document.querySelector('.back-button');
const articleTitle = document.querySelector('.article-title');
const tagsContainer = document.getElementById('tags-container');
const articleTagsContainer = document.getElementById('article-tags');
const searchInput = document.getElementById('search-input');

const articles = [
    { filename: 'Запуск власної вебсторінки.md', date: '21.09.25', tags: ['Технології'] },
{ filename: 'Моя мовна позиція.md', date: '22.09.25', tags: ['Філологія'] },
];

// Дата у формат для сортування
const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`20${year}-${month}-${day}`);
};

// Сортування статей (новіші зверху)
articles.sort((a, b) => parseDate(b.date) - parseDate(a.date));

let activeTag = null;

// Повернення на головну
function showMainPage() {
    mainPage.classList.add('active');
    articlePage.classList.remove('active');
    history.pushState(null, '', window.location.pathname.replace(window.location.hash, ''));
}

// Відкриття статті
async function showArticlePage(filename) {
    const article = articles.find(art => art.filename === filename);
    if (!article) return;
    
    try {
        const response = await fetch(`articles/${article.filename}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);
        
        // Створення ідентифікатора з назви файлу для URL
        const articleId = encodeURIComponent(filename.replace('.md', '').replace(/\s/g, '-'));
        
        // Зміна URL в адресному рядку без перезавантаження
        history.pushState(null, '', `#${articleId}`);
        
        articleTitle.textContent = article.filename.replace('.md', '');
        articleContent.innerHTML = `
        <p class="article-date-main">Дата публікації: ${article.date}</p>
        ${htmlContent}
        `;
        
        articleTagsContainer.innerHTML = article.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
        
        mainPage.classList.remove('active');
        articlePage.classList.add('active');
    } catch (err) {
        console.error(err);
        articleContent.innerHTML = `<p>Помилка завантаження статті.</p>`;
    }
}

// Список статей
function createArticlesList() {
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredArticles = articles.filter(article => {
        const tagMatch = !activeTag || article.tags.includes(activeTag);
        const searchMatch = !searchTerm || article.filename.replace('.md', '').toLowerCase().includes(searchTerm);
        return tagMatch && searchMatch;
    });
    
    articlesList.innerHTML = filteredArticles.length
    ? `<ul>${filteredArticles.map(article => `
        <li>
        <a href="#" data-file="${article.filename}">
        ${article.filename.replace('.md', '')}
        <span class="article-date-sidebar">${article.date}</span>
        <div class="article-tags-sidebar">
        ${article.tags.map(tag => `<span>${tag}</span>`).join('')}
        </div>
        </a>
        </li>`).join('')}
        </ul>`
        : `<p class="no-articles">Немає елементів</p>`;
        
        document.querySelectorAll('#articles-list a').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                showArticlePage(a.dataset.file);
            });
        });
}

// Фільтр тегів
function createTagsFilter() {
    const allTags = [...new Set(articles.flatMap(a => a.tags))].sort();
    
    tagsContainer.innerHTML = `
    <button class="tag-button ${!activeTag ? 'active' : ''}" data-tag="">Всі</button>
    ${allTags.map(tag => `
        <button class="tag-button ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>
        `).join('')}
        `;
        
        document.querySelectorAll('.tag-button').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTag = btn.dataset.tag || null;
                createTagsFilter();
                createArticlesList();
            });
        });
}

// Обробка URL з хешем при завантаженні
function handleInitialLoad() {
    const hash = window.location.hash;
    if (hash) {
        // Декодуємо URL, замінюємо дефіси на пробіли, щоб знайти файл
        const filename = decodeURIComponent(hash.substring(1)).replace(/-/g, ' ') + '.md';
        const articleToLoad = articles.find(art => art.filename.toLowerCase() === filename.toLowerCase());
        if (articleToLoad) {
            showArticlePage(articleToLoad.filename);
        } else {
            showMainPage();
        }
    } else {
        showMainPage();
    }
}

// Події
backButton.addEventListener('click', e => {
    e.preventDefault();
    showMainPage();
});
searchInput.addEventListener('input', createArticlesList);

window.addEventListener('popstate', () => {
    handleInitialLoad();
});

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    createTagsFilter();
    createArticlesList();
    handleInitialLoad(); // Викликаємо одразу для обробки хешу
});