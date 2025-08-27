document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const langSwitcher = document.getElementById('lang-switcher');
    const loader = document.getElementById('loader');

    let currentLang = localStorage.getItem('lang') || 'en';

    // --- Theme Management ---
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- Language Management ---
    const updateLangUI = () => {
        langSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
        loadAllData(currentLang);
    };

    langSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.dataset.lang;
            if (lang !== currentLang) {
                currentLang = lang;
                localStorage.setItem('lang', currentLang);
                updateLangUI();
            }
        }
    });

    // --- Data Loading ---
    async function loadAllData(lang) {
        loader.style.display = 'flex';
        
        const contentData = await fetchContent(lang);
        if (contentData) {
            populateContent(contentData.Home);
            populateContent(contentData.About);
            populateSkills(contentData.About.skills_list);
            populateProjects(contentData.Projects);
            populateContent(contentData.Contact);
            
            document.getElementById('social-github-link').href = contentData.Contact.social_github;
            document.getElementById('social-linkedin-link').href = contentData.Contact.social_linkedin;

        }
        
        populateI18n(lang);

        const githubData = await fetchGitHubData();
        if (githubData) {
            populateGitHubStats(githubData);
            renderGitHubCalendar(githubData.contributionCalendar.weeks);
        }
        
        // Hide loader after a short delay to prevent flash
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
        }, 300);
    }

    // --- Initial Load ---
    updateLangUI();
});