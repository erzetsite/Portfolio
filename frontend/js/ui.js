function populateContent(content) {
    if (!content) return;

    document.querySelectorAll('[data-content]').forEach(el => {
        const key = el.dataset.content;
        if (content[key]) {
            el.innerHTML = content[key];
        }
    });
    
    document.querySelectorAll('[data-href-content]').forEach(el => {
        const key = el.dataset.hrefContent;
        if (content[key]) {
            el.href = content[key];
        }
    });

    document.querySelectorAll('[data-href-mailto]').forEach(el => {
        const key = el.dataset.hrefMailto;
        if (content[key]) {
            el.href = `mailto:${content[key]}`;
        }
    });

    document.title = content.site_name || 'Portfolio';
}

function populateSkills(skills) {
    const container = document.getElementById('skills-container');
    if (!container || !skills) return;
    container.innerHTML = '';
    skills.split(',').forEach(skill => {
        const tag = document.createElement('div');
        tag.className = 'skill-tag';
        tag.textContent = skill.trim();
        container.appendChild(tag);
    });
}

function populateProjects(projects) {
    const grid = document.getElementById('projects-grid');
    if (!grid || !projects) return;
    grid.innerHTML = '';
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card card';
        card.innerHTML = `
            <img src="${project.image_url}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tags">
                ${project.tags.split(',').map(tag => `<span class="project-tag">${tag.trim()}</span>`).join('')}
            </div>
            <div class="project-links">
                ${project.repo_url ? `<a href="${project.repo_url}" target="_blank" rel="noopener noreferrer" class="btn">Repo</a>` : ''}
                ${project.live_url ? `<a href="${project.live_url}" target="_blank" rel="noopener noreferrer" class="btn">Live</a>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

function populateI18n(lang) {
    const translations = {
        en: {
            nav_about: 'About',
            nav_projects: 'Projects',
            nav_contact: 'Contact',
            projects_title: 'My Work',
            github_title: 'GitHub Contributions'
        },
        id: {
            nav_about: 'Tentang',
            nav_projects: 'Projek',
            nav_contact: 'Kontak',
            projects_title: 'Karya Saya',
            github_title: 'Kontribusi GitHub'
        }
    };

    const currentLang = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (currentLang[key]) {
            el.textContent = currentLang[key];
        }
    });
}

function populateGitHubStats(data) {
    const container = document.getElementById('github-stats');
    if (!container || !data) return;

    const stats = {
        'Total Contributions': data.totalContributions,
        'Followers': data.followers,
        'Public Repos': data.publicRepos
    };

    container.innerHTML = '';
    for (const [label, number] of Object.entries(stats)) {
        const statCard = document.createElement('div');
        statCard.className = 'stat-card card';
        statCard.innerHTML = `
            <div class="number">${number}</div>
            <div class="label">${label}</div>
        `;
        container.appendChild(statCard);
    }
}

function renderGitHubCalendar(weeks) {
    const calendar = document.getElementById('github-calendar');
    if (!calendar || !weeks) return;
    calendar.innerHTML = '';

    weeks.forEach(week => {
        week.contributionDays.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'contrib-day';
            dayDiv.dataset.level = day.contributionLevel.replace('LEVEL_', '');
            dayDiv.innerHTML = `<span class="tooltip">${day.contributionCount} contributions on ${day.date}</span>`;
            calendar.appendChild(dayDiv);
        });
    });
}