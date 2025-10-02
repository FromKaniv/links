const mainPage = document.getElementById('main-page');
const articlePage = document.getElementById('article-page');
const articlesList = document.getElementById('articles-list');
const articleContent = document.getElementById('article-content');
const backButton = document.querySelector('.back-button');
const articleTitle = document.querySelector('.article-title');
const tagsContainer = document.getElementById('tags-container');
const articleTagsContainer = document.getElementById('article-tags');
const searchInput = document.getElementById('search-input');

let articles = [];
let activeTag = null;
let currentActiveTagButton = null;

const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`20${year}-${month}-${day}`);
};

function showMainPage() {
    articleContent.innerHTML = '';
    articleTitle.textContent = '';
    articleTagsContainer.innerHTML = '';
    
    mainPage.classList.add('active');
    articlePage.classList.remove('active');
    history.pushState(null, '', window.location.pathname.replace(window.location.hash, ''));
}

async function showArticlePage(filename) {
    const article = articles.find(art => art.filename === filename);
    if (!article) return;
    
    articleContent.innerHTML = '';
    
    try {
        const response = await fetch(`articles/${article.filename}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);
        
        const articleId = encodeURIComponent(filename.replace('.md', '').replace(/\s/g, '-'));
        
        history.pushState(null, '', `#${articleId}`);
        
        articleTitle.textContent = article.filename.replace('.md', '');
        articleContent.innerHTML = `
        <p class="article-date-main">Дата публікації: ${article.date}</p>
        ${htmlContent}
        `;
        
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(articleContent);
        }
        
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
}

function createTagsFilter() {
    const allTags = [...new Set(articles.flatMap(a => a.tags))].sort();
    
    tagsContainer.innerHTML = `
    <button class="tag-button ${!activeTag ? 'active' : ''}" data-tag="">Всі</button>
    ${allTags.map(tag => `
        <button class="tag-button ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>
        `).join('')}
        `;
        
        currentActiveTagButton = tagsContainer.querySelector('.tag-button.active');
}

function handleInitialLoad() {
    const hash = window.location.hash;
    if (hash) {
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

async function loadArticlesData() {
    try {
        const response = await fetch('articles.json');
        if (!response.ok) {
            throw new Error('Помилка завантаження файлу articles.json');
        }
        
        articles = await response.json();
        
        articles.sort((a, b) => parseDate(b.date) - parseDate(a.date));
        
        createTagsFilter();
        createArticlesList();
        handleInitialLoad();
        
    } catch (error) {
        console.error("Не вдалося завантажити дані статей:", error);
        articlesList.innerHTML = '<p class="error">Помилка завантаження даних. Спробуйте пізніше.</p>';
    }
}

backButton.addEventListener('click', e => {
    e.preventDefault();
    showMainPage();
});
searchInput.addEventListener('input', createArticlesList);

articlesList.addEventListener('click', e => {
    const clickedLink = e.target.closest('#articles-list a');
    if (clickedLink) {
        e.preventDefault();
        showArticlePage(clickedLink.dataset.file);
    }
});

tagsContainer.addEventListener('click', e => {
    const clickedButton = e.target.closest('.tag-button');
    
    if (clickedButton && clickedButton !== currentActiveTagButton) {
        if (currentActiveTagButton) {
            currentActiveTagButton.classList.remove('active');
        }
        
        activeTag = clickedButton.dataset.tag || null;
        clickedButton.classList.add('active');
        currentActiveTagButton = clickedButton;
        
        createArticlesList();
    }
});

window.addEventListener('popstate', handleInitialLoad);

document.addEventListener('DOMContentLoaded', () => {
    loadArticlesData();
});