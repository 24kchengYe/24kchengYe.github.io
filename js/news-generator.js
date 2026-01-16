/**
 * News Generator
 * 自动加载和分页显示News，包括置顶统计行
 */

class NewsGenerator {
    constructor(itemsPerPage = 10) {
        this.newsData = [];
        this.currentPage = 1;
        this.itemsPerPage = itemsPerPage;
        this.totalPages = 1;

        // DOM元素
        this.newsContainer = null;
        this.paginationContainer = null;
        this.statsLine = null;
    }

    /**
     * 初始化News生成器
     */
    async init() {
        try {
            // 获取DOM元素
            this.newsContainer = document.getElementById('news-container');
            this.paginationContainer = document.getElementById('news-pagination');
            this.statsLine = document.getElementById('stats-line-container');

            if (!this.newsContainer) {
                console.error('News container not found');
                return false;
            }

            // 加载News数据
            await this.loadNews();

            // 渲染置顶News（统计数据行）
            if (this.statsLine && this.pinnedNews.length > 0) {
                const pinnedItem = this.pinnedNews[0];
                this.statsLine.innerHTML = pinnedItem.content;
            }

            // 渲染第一页
            this.renderPage(1);

            // 渲染分页控制
            this.renderPagination();

            return true;

        } catch (error) {
            console.error('Failed to initialize NewsGenerator:', error);
            return false;
        }
    }

    /**
     * 从JSON文件加载News数据
     */
    async loadNews() {
        try {
            const response = await fetch('data/news.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const allNews = data.news || [];

            // 分离置顶和普通News
            this.pinnedNews = allNews.filter(item => item.pinned);
            this.newsData = allNews.filter(item => !item.pinned);

            // 按日期降序排序（最新的在前）
            this.newsData.sort((a, b) => {
                if (a.date === b.date) return 0;
                return new Date(b.date) - new Date(a.date);
            });

            // 计算总页数
            this.totalPages = Math.ceil(this.newsData.length / this.itemsPerPage);

            console.log(`Loaded ${this.newsData.length} news items (${this.pinnedNews.length} pinned)`);

        } catch (error) {
            console.error('Failed to load news:', error);
            // 显示错误信息
            if (this.newsContainer) {
                this.newsContainer.innerHTML = '<p class="error">⚠️ Failed to load news</p>';
            }
        }
    }

    /**
     * 渲染指定页的News
     */
    renderPage(page) {
        if (!this.newsContainer) return;

        // 验证页码
        if (page < 1) page = 1;
        if (page > this.totalPages) page = this.totalPages;

        this.currentPage = page;

        // 计算当前页的数据范围
        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.newsData.slice(start, end);

        // 清空容器
        this.newsContainer.innerHTML = '';

        // 如果没有数据
        if (pageItems.length === 0) {
            this.newsContainer.innerHTML = '<p class="no-data">No news available</p>';
            return;
        }

        // 渲染News条目
        pageItems.forEach(item => {
            const newsElement = this.createNewsElement(item);
            this.newsContainer.appendChild(newsElement);
        });

        // 更新分页控制的激活状态
        this.updatePaginationState();
    }

    /**
     * 创建单个News元素
     */
    createNewsElement(item) {
        const div = document.createElement('div');
        div.className = 'news-item';

        // 添加类型标识
        if (item.type) {
            div.classList.add(`news-${item.type}`);
        }

        // 格式化日期
        const dateStr = this.formatDate(item.date);

        // 构建HTML
        div.innerHTML = `
            <span class="news-date">${dateStr}</span>
            <span class="news-content">${item.content}</span>
        `;

        // 如果有关联ID，添加点击事件
        if (item.related_id) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                this.handleNewsClick(item);
            });
        }

        return div;
    }

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (dateStr === 'auto') {
            return '📊';  // 统计行使用特殊标记
        }

        try {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * 处理News点击事件
     */
    handleNewsClick(item) {
        // 根据related_id滚动到对应部分
        if (item.related_id) {
            // 尝试找到对应元素
            const targetElement = document.querySelector(`[data-id="${item.related_id}"]`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 添加高亮效果
                targetElement.classList.add('highlight');
                setTimeout(() => {
                    targetElement.classList.remove('highlight');
                }, 2000);
            }
        }
    }

    /**
     * 渲染分页控制
     */
    renderPagination() {
        if (!this.paginationContainer) return;

        // 如果只有一页或没有数据，隐藏分页
        if (this.totalPages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        this.paginationContainer.style.display = 'flex';
        this.paginationContainer.innerHTML = '';

        // 上一页按钮
        const prevBtn = this.createPageButton('« Prev', this.currentPage - 1, this.currentPage === 1);
        this.paginationContainer.appendChild(prevBtn);

        // 页码按钮
        const pageButtons = this.generatePageButtons();
        pageButtons.forEach(btn => {
            this.paginationContainer.appendChild(btn);
        });

        // 下一页按钮
        const nextBtn = this.createPageButton('Next »', this.currentPage + 1, this.currentPage === this.totalPages);
        this.paginationContainer.appendChild(nextBtn);
    }

    /**
     * 生成页码按钮（智能省略）
     */
    generatePageButtons() {
        const buttons = [];
        const maxButtons = 7;  // 最多显示7个页码按钮

        if (this.totalPages <= maxButtons) {
            // 如果总页数少，显示所有页码
            for (let i = 1; i <= this.totalPages; i++) {
                buttons.push(this.createPageButton(i, i, false, i === this.currentPage));
            }
        } else {
            // 智能显示：首页 ... 当前页附近 ... 末页
            const showFirst = 1;
            const showLast = this.totalPages;
            const showAround = 1;  // 当前页前后显示1个

            // 添加首页
            buttons.push(this.createPageButton(1, 1, false, this.currentPage === 1));

            // 判断是否需要前省略号
            if (this.currentPage - showAround > 2) {
                buttons.push(this.createEllipsis());
            }

            // 当前页附近
            const rangeStart = Math.max(2, this.currentPage - showAround);
            const rangeEnd = Math.min(this.totalPages - 1, this.currentPage + showAround);

            for (let i = rangeStart; i <= rangeEnd; i++) {
                buttons.push(this.createPageButton(i, i, false, i === this.currentPage));
            }

            // 判断是否需要后省略号
            if (this.currentPage + showAround < this.totalPages - 1) {
                buttons.push(this.createEllipsis());
            }

            // 添加末页
            if (this.totalPages > 1) {
                buttons.push(this.createPageButton(this.totalPages, this.totalPages, false, this.currentPage === this.totalPages));
            }
        }

        return buttons;
    }

    /**
     * 创建分页按钮
     */
    createPageButton(text, page, disabled = false, active = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'page-btn';

        if (disabled) {
            button.disabled = true;
            button.classList.add('disabled');
        }

        if (active) {
            button.classList.add('active');
        }

        if (!disabled) {
            button.addEventListener('click', () => {
                this.renderPage(page);
                this.updatePaginationState();
                // 滚动到News部分顶部
                document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
            });
        }

        return button;
    }

    /**
     * 创建省略号
     */
    createEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.className = 'page-ellipsis';
        return span;
    }

    /**
     * 更新分页控制的激活状态
     */
    updatePaginationState() {
        if (!this.paginationContainer) return;

        // 重新渲染分页（简单方式）
        this.renderPagination();
    }

    /**
     * 更新统计数据（从Google Scholar）
     */
    updateStatistics(stats) {
        if (!this.statsLine) return;

        // 更新下载量
        const downloadsSpan = document.getElementById('news-downloads');
        if (downloadsSpan && stats.total_downloads !== undefined) {
            downloadsSpan.textContent = this.formatNumber(stats.total_downloads);
        }

        // 更新引用数
        const citationsSpan = document.getElementById('news-citations');
        if (citationsSpan && stats.total_citations !== undefined) {
            citationsSpan.textContent = this.formatNumber(stats.total_citations);
        }

        // 更新高引论文数
        const highlyCitedSpan = document.getElementById('news-highly-cited');
        if (highlyCitedSpan && stats.highly_cited_papers !== undefined) {
            highlyCitedSpan.textContent = stats.highly_cited_papers;
        }
    }

    /**
     * 格式化数字（添加千位分隔符或+后缀）
     */
    formatNumber(num) {
        if (num >= 1000) {
            return Math.floor(num / 1000) + ',' + String(num % 1000).padStart(3, '0') + '+';
        }
        return num.toString();
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsGenerator;
}
