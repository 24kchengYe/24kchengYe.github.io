/**
 * 个人主页 - 主JavaScript文件
 * 数据驱动的动态内容加载
 */

// ========================================
// 配置加载器 - 从JSON文件加载所有数据
// ========================================

class ConfigLoader {
    constructor() {
        this.config = null;
        this.publications = null;
        this.datasets = null;
        this.codeTools = null;
        this.awards = null;
        this.activities = null;
    }

    /**
     * 加载所有配置文件
     */
    async loadAll() {
        try {
            const [config, publications, datasets, codeTools, awards, activities] = await Promise.all([
                this.loadConfig(),
                this.loadPublications(),
                this.loadDatasets(),
                this.loadCodeTools(),
                this.loadAwards(),
                this.loadActivities()
            ]);

            this.config = config;
            this.publications = publications;
            this.datasets = datasets;
            this.codeTools = codeTools;
            this.awards = awards;
            this.activities = activities;

            console.log('✓ All data loaded successfully');
            return true;

        } catch (error) {
            console.error('✗ Failed to load data:', error);
            return false;
        }
    }

    async loadConfig() {
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error(`Failed to load config: ${response.status}`);
        return await response.json();
    }

    async loadPublications() {
        const response = await fetch('data/publications.json');
        if (!response.ok) throw new Error(`Failed to load publications: ${response.status}`);
        return await response.json();
    }

    async loadDatasets() {
        const response = await fetch('data/datasets.json');
        if (!response.ok) throw new Error(`Failed to load datasets: ${response.status}`);
        return await response.json();
    }

    async loadCodeTools() {
        const response = await fetch('data/code-tools.json');
        if (!response.ok) throw new Error(`Failed to load code-tools: ${response.status}`);
        return await response.json();
    }

    async loadAwards() {
        const response = await fetch('data/awards.json');
        if (!response.ok) throw new Error(`Failed to load awards: ${response.status}`);
        return await response.json();
    }

    async loadActivities() {
        const response = await fetch('data/activities.json');
        if (!response.ok) throw new Error(`Failed to load activities: ${response.status}`);
        return await response.json();
    }
}

// ========================================
// 页面渲染器 - 将数据渲染到DOM
// ========================================

class PageRenderer {
    constructor(configLoader) {
        this.loader = configLoader;
    }

    /**
     * 渲染个人资料部分
     */
    renderProfile() {
        const config = this.loader.config;
        const personal = config.personal;

        document.getElementById('profile-name').textContent = personal.name;
        document.getElementById('profile-title').textContent = personal.title;
        document.getElementById('profile-affiliation').textContent = personal.affiliation;

        const profileImg = document.querySelector('.profile-photo');
        if (profileImg && personal.profile_image) {
            profileImg.src = personal.profile_image;
        }
    }

    /**
     * 渲染传记部分
     */
    renderBiography() {
        const bio = this.loader.config.biography;

        document.getElementById('bio-identity').textContent = bio.identity;
        document.getElementById('bio-education').textContent = bio.education;
        document.getElementById('bio-research').textContent = bio.research_interests;
    }

    /**
     * 渲染研究领域
     */
    renderResearchFields() {
        const fields = this.loader.config.research_fields;
        const container = document.getElementById('research-fields-list');

        if (!container) return;

        container.innerHTML = '';
        fields.forEach(field => {
            const li = document.createElement('li');
            li.textContent = field;
            container.appendChild(li);
        });
    }

    /**
     * 渲染论文部分
     */
    renderPublications() {
        const pubs = this.loader.publications.publications;

        // 分类容器
        const journalPublished = document.getElementById('pubs-journal-published');
        const conference = document.getElementById('pubs-conference');
        const underReview = document.getElementById('pubs-under-review');

        // 清空
        if (journalPublished) journalPublished.innerHTML = '';
        if (conference) conference.innerHTML = '';
        if (underReview) underReview.innerHTML = '';

        // 按类别分配
        pubs.forEach(pub => {
            const pubElement = this.createPublicationElement(pub);

            if (pub.type === 'journal' && pub.status === 'published' && journalPublished) {
                journalPublished.appendChild(pubElement);
            } else if (pub.type === 'conference' && conference) {
                conference.appendChild(pubElement);
            } else if (pub.status === 'under_review' && underReview) {
                underReview.appendChild(pubElement);
            }
        });
    }

    /**
     * 创建单篇论文元素
     */
    createPublicationElement(pub) {
        const div = document.createElement('div');
        div.className = 'paper-item';
        div.setAttribute('data-id', pub.id);

        // 构建作者列表
        const authorsStr = pub.authors.join(', ');

        // 构建badges
        const badgesHtml = pub.badges
            ? pub.badges.map(b => `<span class="paper-note">${b}</span>`).join(' ')
            : '';

        // 构建链接
        const linksHtml = Object.entries(pub.links || {})
            .map(([key, url]) => {
                const icon = this.getLinkIcon(key);
                const label = key.toUpperCase();
                return `<a href="${url}" target="_blank">${icon} ${label}</a>`;
            })
            .join('');

        div.innerHTML = `
            <img src="${pub.image || 'images/placeholder.png'}" alt="${pub.title}" class="paper-thumbnail">
            <div class="paper-info">
                <h4 class="paper-title">${pub.title}</h4>
                <p class="paper-authors">${authorsStr}</p>
                ${pub.author_note ? `<p class="author-note">${pub.author_note}</p>` : ''}
                <p class="paper-venue"><em>${pub.venue}</em>, ${pub.year}</p>
                ${badgesHtml}
                <p class="show_paper_citations" data="${pub.citation_key}">Citations: Loading...</p>
                <div class="paper-links">
                    ${linksHtml}
                </div>
            </div>
        `;

        return div;
    }

    /**
     * 获取链接图标
     */
    getLinkIcon(type) {
        const icons = {
            'pdf': '📄',
            'doi': '🔗',
            'code': '💻',
            'dataset': '📊',
            'github': '💻',
            'documentation': '📝',
            'demo': '🎮',
            'paper': '📄'
        };
        return icons[type.toLowerCase()] || '🔗';
    }

    /**
     * 渲染数据集部分
     */
    renderDatasets() {
        const datasets = this.loader.datasets.datasets;
        const container = document.getElementById('datasets-container');

        if (!container) return;

        container.innerHTML = '';

        datasets.forEach(dataset => {
            const datasetElement = this.createDatasetElement(dataset);
            container.appendChild(datasetElement);
        });
    }

    /**
     * 创建单个数据集元素
     */
    createDatasetElement(dataset) {
        const div = document.createElement('div');
        div.className = 'dataset-item';
        div.setAttribute('data-id', dataset.id);

        const linksHtml = Object.entries(dataset.links || {})
            .map(([key, url]) => {
                const icon = this.getLinkIcon(key);
                const label = key.toUpperCase();
                return `<a href="${url}" target="_blank">${icon} ${label}</a>`;
            })
            .join('');

        div.innerHTML = `
            <div class="dataset-header">
                <span class="dataset-icon">${dataset.icon || '📊'}</span>
                <h3>${dataset.name}</h3>
            </div>
            <p class="dataset-description">${dataset.description}</p>
            <p class="dataset-stats">📥 ${dataset.downloads.toLocaleString()} downloads</p>
            <div class="dataset-links">
                ${linksHtml}
            </div>
        `;

        return div;
    }

    /**
     * 渲染代码工具部分
     */
    renderCodeTools() {
        const tools = this.loader.codeTools.tools;
        const container = document.getElementById('code-container');
        const section = document.getElementById('code');

        if (!container) return;

        // 如果没有工具，隐藏整个部分
        if (tools.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (section) section.style.display = 'block';
        container.innerHTML = '';

        tools.forEach(tool => {
            const toolElement = this.createCodeToolElement(tool);
            container.appendChild(toolElement);
        });
    }

    /**
     * 创建单个代码工具元素
     */
    createCodeToolElement(tool) {
        const div = document.createElement('div');
        div.className = 'code-tool-item';
        div.setAttribute('data-id', tool.id);

        const linksHtml = Object.entries(tool.links || {})
            .map(([key, url]) => {
                const icon = this.getLinkIcon(key);
                const label = key.toUpperCase();
                return `<a href="${url}" target="_blank">${icon} ${label}</a>`;
            })
            .join('');

        div.innerHTML = `
            <div class="tool-header">
                <span class="tool-icon">${tool.icon || '🛠️'}</span>
                <h3>${tool.name}</h3>
                <span class="tool-language">${tool.language || ''}</span>
            </div>
            <p class="tool-description">${tool.description}</p>
            ${tool.stars ? `<p class="tool-stars">⭐ ${tool.stars} stars</p>` : ''}
            <div class="tool-links">
                ${linksHtml}
            </div>
        `;

        return div;
    }

    /**
     * 渲染奖项部分
     */
    renderAwards() {
        const awards = this.loader.awards.awards;
        const container = document.getElementById('awards-container');

        if (!container) return;

        container.innerHTML = '';

        // 按年份分组
        const awardsByYear = {};
        awards.forEach(award => {
            if (!awardsByYear[award.year]) {
                awardsByYear[award.year] = [];
            }
            awardsByYear[award.year].push(award);
        });

        // 按年份降序排列
        const years = Object.keys(awardsByYear).sort((a, b) => b - a);

        years.forEach(year => {
            const yearSection = document.createElement('div');
            yearSection.className = 'award-year-section';

            const yearHeader = document.createElement('h3');
            yearHeader.className = 'award-year';
            yearHeader.textContent = year;
            yearSection.appendChild(yearHeader);

            const awardList = document.createElement('ul');
            awardList.className = 'award-list';

            awardsByYear[year].forEach(award => {
                const li = document.createElement('li');
                li.className = 'award-item';
                li.innerHTML = `
                    <strong>${award.name}</strong>
                    <span class="award-org">${award.organization}</span>
                    ${award.description ? `<p class="award-desc">${award.description}</p>` : ''}
                `;
                awardList.appendChild(li);
            });

            yearSection.appendChild(awardList);
            container.appendChild(yearSection);
        });
    }

    /**
     * 渲染学术活动部分
     */
    renderActivities() {
        const activities = this.loader.activities.activities;
        const container = document.getElementById('activities-container');

        if (!container) return;

        container.innerHTML = '';

        // 渲染展览
        if (activities.exhibitions && activities.exhibitions.length > 0) {
            const section = this.createActivitySection('Exhibitions', activities.exhibitions, 'exhibition');
            container.appendChild(section);
        }

        // 渲染演讲
        if (activities.talks && activities.talks.length > 0) {
            const section = this.createActivitySection('Invited Talks', activities.talks, 'talk');
            container.appendChild(section);
        }

        // 渲染同行评审
        if (activities.peer_review && activities.peer_review.length > 0) {
            const section = this.createActivitySection('Peer Review', activities.peer_review, 'review');
            container.appendChild(section);
        }

        // 渲染技能
        if (activities.skills && activities.skills.length > 0) {
            const section = this.createSkillsSection(activities.skills);
            container.appendChild(section);
        }
    }

    /**
     * 创建活动部分
     */
    createActivitySection(title, items, type) {
        const section = document.createElement('div');
        section.className = 'activity-section';

        const header = document.createElement('h3');
        header.textContent = title;
        section.appendChild(header);

        const list = document.createElement('ul');

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = `activity-item activity-${type}`;

            if (type === 'exhibition') {
                li.innerHTML = `
                    <strong>${item.title}</strong>
                    <span>${item.year}, ${item.location || ''}</span>
                `;
            } else if (type === 'talk') {
                li.innerHTML = `
                    <strong>${item.title}</strong>
                    <span>${item.location}, ${item.year}</span>
                `;
            } else if (type === 'review') {
                li.innerHTML = `
                    <strong>${item.journal}</strong>
                    <span>${item.role}</span>
                `;
            }

            list.appendChild(li);
        });

        section.appendChild(list);
        return section;
    }

    /**
     * 创建技能部分
     */
    createSkillsSection(skills) {
        const section = document.createElement('div');
        section.className = 'skills-section';

        const header = document.createElement('h3');
        header.textContent = 'Skills';
        section.appendChild(header);

        skills.forEach(skillCategory => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'skill-category';

            const categoryTitle = document.createElement('strong');
            categoryTitle.textContent = skillCategory.category + ':';
            categoryDiv.appendChild(categoryTitle);

            const skillsList = document.createElement('span');
            skillsList.textContent = ' ' + skillCategory.items.join(', ');
            categoryDiv.appendChild(skillsList);

            section.appendChild(categoryDiv);
        });

        return section;
    }

    /**
     * 渲染联系方式
     */
    renderContact() {
        const contacts = this.loader.config.contact;
        const container = document.getElementById('contact-container');

        if (!container) return;

        container.innerHTML = '';

        contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'contact-item';

            item.innerHTML = `
                <span class="contact-icon">${contact.icon}</span>
                <div class="contact-info">
                    <strong>${contact.display}</strong>
                    <a href="${contact.link}" target="_blank">${contact.value}</a>
                </div>
            `;

            container.appendChild(item);
        });
    }
}

// ========================================
// Google Scholar 数据集成
// ========================================

class GoogleScholarIntegration {
    constructor() {
        this.gsDataBaseUrl = 'https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_USERNAME.github.io@main/';
    }

    async loadStats() {
        try {
            const response = await fetch(this.gsDataBaseUrl + 'google-scholar-stats/gs_data.json');
            if (!response.ok) throw new Error('Failed to load Google Scholar data');

            const data = await response.json();

            // 更新总引用数
            if (data && data.citedby) {
                const citationSpan = document.getElementById('news-citations');
                if (citationSpan) {
                    citationSpan.textContent = data.citedby.toLocaleString();
                }
            }

            // 更新每篇论文的引用数
            if (data && data.publications) {
                const citationEles = document.getElementsByClassName('show_paper_citations');
                Array.prototype.forEach.call(citationEles, element => {
                    const paperId = element.getAttribute('data');
                    if (data.publications[paperId]) {
                        const numCitations = data.publications[paperId].num_citations;
                        element.textContent = `Citations: ${numCitations}`;
                    } else {
                        element.textContent = 'Citations: 0';
                    }
                });
            }

            return data;

        } catch (error) {
            console.log('Google Scholar data not available:', error.message);
            return null;
        }
    }
}

// ========================================
// UI 辅助功能
// ========================================

/**
 * 平滑滚动导航
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navHeight = document.getElementById('navbar')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 回到顶部按钮
 */
function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.title = 'Back to top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 40px;
        width: 50px;
        height: 50px;
        background: #0366d6;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: none;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(3, 102, 214, 0.3);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', () => {
        backToTopBtn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'scale(1.1)';
        backToTopBtn.style.background = '#0056b3';
    });

    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'scale(1)';
        backToTopBtn.style.background = '#0366d6';
    });
}

/**
 * 图片占位符
 */
function initPaperPlaceholders() {
    const paperImages = document.querySelectorAll('.paper-thumbnail');

    paperImages.forEach(img => {
        img.addEventListener('error', function() {
            this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.style.color = 'white';
            this.style.fontSize = '48px';
            this.innerHTML = '📄';
            this.removeAttribute('src');
        });
    });

    const profilePhoto = document.querySelector('.profile-photo');
    if (profilePhoto) {
        profilePhoto.addEventListener('error', function() {
            this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.style.color = 'white';
            this.style.fontSize = '80px';
            this.innerHTML = '👤';
            this.removeAttribute('src');
        });
    }
}

// ========================================
// 主初始化函数
// ========================================

async function initApp() {
    console.log('🚀 Initializing personal homepage...');

    // 创建加载器
    const loader = new ConfigLoader();
    const success = await loader.loadAll();

    if (!success) {
        console.error('Failed to load configuration');
        return;
    }

    // 创建渲染器
    const renderer = new PageRenderer(loader);

    // 渲染所有部分
    renderer.renderProfile();
    renderer.renderBiography();
    renderer.renderResearchFields();
    renderer.renderPublications();
    renderer.renderDatasets();
    renderer.renderCodeTools();
    renderer.renderAwards();
    renderer.renderActivities();
    renderer.renderContact();

    // 初始化News生成器
    const newsGenerator = new NewsGenerator(loader.config.news_config.items_per_page);
    await newsGenerator.init();

    // 更新统计数据
    const stats = {
        total_downloads: loader.config.statistics.total_downloads.value,
        total_citations: loader.config.statistics.total_citations.value,
        highly_cited_papers: loader.config.statistics.highly_cited_papers.value
    };
    newsGenerator.updateStatistics(stats);

    // 尝试加载Google Scholar数据
    const scholar = new GoogleScholarIntegration();
    await scholar.loadStats();

    // 初始化UI辅助功能
    initSmoothScroll();
    initBackToTop();
    initPaperPlaceholders();

    console.log('✓ All modules initialized successfully');
}

// ========================================
// 页面加载完成后初始化
// ========================================

document.addEventListener('DOMContentLoaded', initApp);
