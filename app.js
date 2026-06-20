const state = {
    articles: [],
    currentArticle: null,
    maxArticles: 8,
    editorFrame: null,
    editorDoc: null,
    editorBody: null,
    isEditorReady: false,
    pendingContent: null,
    pendingStyles: null,
    // 面板模式：'mouse'（鼠标模式，默认）或 'fixed'（固定模式）
    panelMode: 'mouse',
    isArticleListCollapsed: false,
    // 鼠标悬停状态跟踪
    isMouseOverPanel: false,
    // mouseleave 的 setTimeout ID，用于取消
    panelMouseLeaveTimeout: null
};

const elements = {
    articleList: document.getElementById('articleList'),
    articleCount: document.getElementById('articleCount'),
    articleTitle: document.getElementById('articleTitle'),
    articleAuthor: document.getElementById('articleAuthor'),
    articleUrl: document.getElementById('articleUrl'),
    fetchArticleBtn: document.getElementById('fetchArticleBtn'),
    saveBtn: document.getElementById('saveBtn'),
    exportBtn: document.getElementById('exportBtn'),
    previewBtn: document.getElementById('previewBtn'),
    clearBtn: document.getElementById('clearBtn'),
    previewModal: document.getElementById('previewModal'),
    previewContent: document.getElementById('previewContent'),
    previewTitle: document.getElementById('previewTitle'),
    closePreview: document.getElementById('closePreview'),
    exportModal: document.getElementById('exportModal'),
    closeExport: document.getElementById('closeExport'),
    singleTab: document.getElementById('singleTab'),
    batchTab: document.getElementById('batchTab'),
    singleTabContent: document.getElementById('singleTabContent'),
    batchTabContent: document.getElementById('batchTabContent'),
    toggleArticleList: document.getElementById('toggleArticleList'),
    toggleIcon: document.getElementById('toggleIcon'),
    articleListPanel: document.getElementById('articleListPanel'),
    articleListCard: document.getElementById('articleListCard'),
    editorFrame: document.getElementById('editorFrame'),
    editorToolbar: document.getElementById('editorToolbar'),
    headingSelect: document.getElementById('headingSelect'),
    foreColorPicker: document.getElementById('foreColorPicker'),
    backColorPicker: document.getElementById('backColorPicker'),
    modeMouse: document.getElementById('modeMouse'),
    modeFixed: document.getElementById('modeFixed')
};

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[34m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m'
    };
    console.log(`${colors[type]}[wxEditor] ${message}\x1b[0m`);
}

/* ---------- iframe 编辑器初始化 ---------- */

function initIframeEditor() {
    log('正在初始化 iframe 编辑器...', 'info');
    
    state.editorFrame = elements.editorFrame;
    
    state.editorFrame.addEventListener('load', function() {
        try {
            state.editorDoc = state.editorFrame.contentDocument || state.editorFrame.contentWindow.document;
            state.editorBody = state.editorDoc.body;
            state.isEditorReady = true;
            
            log('iframe 编辑器加载完成', 'success');
            
            // 初始化 html 和 body 的 overflow，防止双滚动条
            if (state.editorDoc && state.editorDoc.documentElement) {
                state.editorDoc.documentElement.style.overflow = 'hidden';
                state.editorDoc.documentElement.style.height = '100%';
            }
            if (state.editorBody) {
                state.editorBody.style.overflowY = 'hidden';
                state.editorBody.style.overflowX = 'hidden';
            }
            
            // 如果有待处理的内容，写入
            if (state.pendingContent !== null) {
                setEditorContent(state.pendingContent, state.pendingStyles);
                state.pendingContent = null;
                state.pendingStyles = null;
            }
            
            // 监听内容变化，自动调整高度
            if (state.editorBody) {
                const resizeObserver = new (state.editorFrame.contentWindow.ResizeObserver || ResizeObserver)(function() {
                    autoResizeEditorFrame();
                });
                resizeObserver.observe(state.editorBody);
            }
            
            // 初始调整高度
            autoResizeEditorFrame();
            
            // 绑定工具栏事件
            initToolbarEvents();
        } catch (e) {
            log('iframe 编辑器初始化错误: ' + e.message, 'error');
        }
    });
}

/* ---------- 工具栏事件 ---------- */

function initToolbarEvents() {
    // execCommand 按钮
    elements.editorToolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const cmd = this.dataset.cmd;
            execEditorCommand(cmd);
        });
    });
    
    // 标题选择
    if (elements.headingSelect) {
        elements.headingSelect.addEventListener('change', function() {
            const tag = this.value;
            if (tag) {
                execEditorCommand('formatBlock', '<' + tag + '>');
            } else {
                execEditorCommand('formatBlock', '<div>');
            }
        });
    }
    
    // 文字颜色
    if (elements.foreColorPicker) {
        elements.foreColorPicker.addEventListener('input', function() {
            execEditorCommand('foreColor', this.value);
        });
    }
    
    // 背景颜色
    if (elements.backColorPicker) {
        elements.backColorPicker.addEventListener('input', function() {
            execEditorCommand('hiliteColor', this.value);
        });
    }
    
    // 插入链接
    const insertLinkBtn = document.getElementById('insertLinkBtn');
    if (insertLinkBtn) {
        insertLinkBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = prompt('请输入链接地址:', 'https://');
            if (url) {
                execEditorCommand('createLink', url);
            }
        });
    }
    
    // 插入图片
    const insertImageBtn = document.getElementById('insertImageBtn');
    if (insertImageBtn) {
        insertImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = prompt('请输入图片地址:', 'https://');
            if (url) {
                execEditorCommand('insertImage', url);
            }
        });
    }
}

function execEditorCommand(command, value = null) {
    if (!state.editorDoc || !state.editorBody) {
        log('编辑器未就绪', 'warning');
        return;
    }
    
    state.editorBody.focus();
    
    try {
        if (value !== null) {
            state.editorDoc.execCommand(command, false, value);
        } else {
            state.editorDoc.execCommand(command, false, null);
        }
    } catch (e) {
        log('execCommand 失败: ' + command + ' - ' + e.message, 'error');
    }
}

/* ---------- 内容读写 ---------- */

function getEditorContent() {
    if (state.editorBody) {
        return state.editorBody.innerHTML;
    }
    return '';
}

function setEditorContent(html, styles = null) {
    if (state.editorBody) {
        // 注入 CSS
        if (styles && styles.length > 0) {
            injectArticleStyles(styles);
        }
        // 写入内容
        state.editorBody.innerHTML = html || '';
        log('编辑器内容已更新（iframe body.innerHTML）', 'success');
        
        // 自动调整 iframe 高度以适应内容
        setTimeout(autoResizeEditorFrame, 100);
        return true;
    }
    // 编辑器未就绪，等待
    state.pendingContent = html;
    state.pendingStyles = styles;
    log('编辑器未就绪，内容已放入待处理队列', 'warning');
    return false;
}

function autoResizeEditorFrame() {
    if (!state.editorDoc || !state.editorFrame) return;
    try {
        const body = state.editorDoc.body;
        const docEl = state.editorDoc.documentElement;
        const contentHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            docEl.scrollHeight,
            docEl.offsetHeight
        );
        
        const MAX_HEIGHT = 600;
        const PADDING = 32; // body 有 padding: 16px (上下各16px)
        
        // 确保 html 永远不可滚动（防止双滚动条）
        docEl.style.overflow = 'hidden';
        docEl.style.height = '100%';
        
        if (contentHeight > MAX_HEIGHT) {
            // 内容超过最大高度：固定 iframe 高度，仅 body 内部滚动
            state.editorFrame.style.height = MAX_HEIGHT + 'px';
            body.style.overflowY = 'auto';
            body.style.overflowX = 'hidden';
            body.style.height = (MAX_HEIGHT - PADDING) + 'px';
            log('启用 body 内部滚动条，iframe高度: ' + MAX_HEIGHT + 'px', 'info');
        } else {
            // 内容未超过最大高度：自适应高度，无滚动条
            const newHeight = Math.max(400, contentHeight + PADDING);
            state.editorFrame.style.height = newHeight + 'px';
            body.style.overflowY = 'hidden';
            body.style.overflowX = 'hidden';
            body.style.height = 'auto';
            log('自适应高度: ' + newHeight + 'px', 'info');
        }
    } catch(e) {
        log('自动调整高度失败: ' + e.message, 'warning');
    }
}

function injectArticleStyles(styles) {
    if (!state.editorDoc) return;
    
    const styleEl = state.editorDoc.getElementById('article-styles');
    if (styleEl) {
        // 直接合并注入，服务端已完成 CSS 清理
        const combinedCss = styles.join('\n\n');
        styleEl.textContent = combinedCss;
        log('已注入 ' + styles.length + ' 个 style 块到 iframe（' + combinedCss.length + ' 字节）', 'success');
    }
}

function clearEditorStyles() {
    if (!state.editorDoc) return;
    const styleEl = state.editorDoc.getElementById('article-styles');
    if (styleEl) {
        styleEl.textContent = '';
    }
}

/* ---------- 文章管理 ---------- */

function generateId() {
    return Date.now().toString(32) + Math.random().toString(32).substr(2);
}

function createArticle(url, title, author, content, styles) {
    return {
        id: generateId(),
        title: title || '未命名文章',
        author: author || '',
        url: url || '',
        content: content || '',
        styles: styles || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function renderArticleList() {
    if (state.articles.length === 0) {
        elements.articleList.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <svg class="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-sm">还没有采集文章</p>
                <p class="text-xs mt-1">在左侧输入链接开始采集</p>
            </div>
        `;
    } else {
        elements.articleList.innerHTML = state.articles.map((article, index) => `
            <div class="article-card p-3 cursor-pointer hover:bg-gray-50 transition-all ${state.currentArticle?.id === article.id ? 'bg-blue-50 border-l-3 border-blue-500' : 'border-l-3 border-transparent'}" data-id="${article.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">${index + 1}</span>
                            <h4 class="font-medium text-gray-900 truncate text-sm">${escapeHtml(article.title)}</h4>
                        </div>
                        <!-- 不显示作者信息 -->
                    </div>
                    <button class="delete-btn ml-2 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded flex-shrink-0" data-id="${article.id}">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        elements.articleList.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    const id = card.dataset.id;
                    const article = state.articles.find(a => a.id === id);
                    if (article) {
                        loadArticle(article);
                    }
                }
            });
        });

        elements.articleList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteArticle(btn.dataset.id);
            });
        });
    }
    elements.articleCount.textContent = `${state.articles.length}/${state.maxArticles}`;
}

function loadArticle(article) {
    log(`正在加载文章: ${article.title}`, 'info');
    
    state.currentArticle = article;
    elements.articleTitle.value = article.title;
    // 不加载作者信息
    elements.articleAuthor.value = '';
    elements.articleUrl.value = article.url;
    
    if (article.content) {
        log(`内容长度: ${article.content.length}`, 'info');
    }
    
    // 加载内容时同时加载样式
    setEditorContent(article.content, article.styles);
    
    renderArticleList();
}

function updateCurrentArticle() {
    if (!state.currentArticle) return;
    
    const index = state.articles.findIndex(a => a.id === state.currentArticle.id);
    if (index !== -1) {
        state.articles[index] = {
            ...state.articles[index],
            title: elements.articleTitle.value,
            // 不保存作者信息
            author: '',
            content: getEditorContent(),
            updatedAt: new Date().toISOString()
        };
        state.currentArticle = state.articles[index];
        renderArticleList();
    }
}

function addArticle(article) {
    if (state.articles.length >= state.maxArticles) {
        alert(`最多只能采集 ${state.maxArticles} 篇文章！`);
        return;
    }
    state.articles.unshift(article);
    loadArticle(article);
    saveToLocalStorage();
}

function deleteArticle(id) {
    if (confirm('确定要删除这篇文章吗？')) {
        state.articles = state.articles.filter(a => a.id !== id);
        if (state.currentArticle?.id === id) {
            state.currentArticle = null;
            clearEditor();
        }
        renderArticleList();
        saveToLocalStorage();
    }
}

function clearEditor() {
    elements.articleTitle.value = '';
    // 不清除作者字段（保留但不使用）
    elements.articleAuthor.value = '';
    elements.articleUrl.value = '';
    if (state.editorBody) {
        state.editorBody.innerHTML = '';
    }
    clearEditorStyles();
    // 重置iframe高度为默认值，然后自动调整
    if (state.editorFrame) {
        state.editorFrame.style.height = '400px';
        // 延迟调用 autoResizeEditorFrame 确保内容已清空
        setTimeout(autoResizeEditorFrame, 100);
    }
    state.currentArticle = null;
    renderArticleList();
}

function preview() {
    const title = elements.articleTitle.value || '未命名文章';
    const content = getEditorContent();
    
    elements.previewTitle.textContent = title;
    
    // 不显示作者信息
    elements.previewContent.innerHTML = `
        <div class="wechat-content">${content}</div>
    `;
    elements.previewModal.classList.remove('hidden');
}

function exportArticle(format) {
    const article = state.currentArticle;
    if (!article) {
        alert('请先选择文章！');
        return;
    }

    let content, filename, type;
    const safeTitle = article.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);

    switch (format) {
        case 'html':
            content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #333; }
        h1 { font-size: 28px; margin-bottom: 10px; color: #111; }
        .meta { color: #666; font-size: 14px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        img { max-width: 100%; height: auto; margin: 20px 0; }
        p { margin-bottom: 1.5em; }
    </style>
</head>
<body>
    <h1>${escapeHtml(article.title)}</h1>
    <div class="meta">
        ${article.author ? `作者：${escapeHtml(article.author)}<br>` : ''}
        ${article.url ? `原文链接：<a href="${article.url}" target="_blank">${article.url}</a>` : ''}
    </div>
    ${article.content}
</body>
</html>`;
            filename = `${safeTitle}.html`;
            type = 'text/html';
            break;
        case 'markdown':
            content = `# ${article.title}\n\n${article.author ? `**作者：** ${article.author}\n\n` : ''}${simpleHtmlToMarkdown(article.content)}`;
            filename = `${safeTitle}.md`;
            type = 'text/markdown';
            break;
        case 'json':
            content = JSON.stringify(article, null, 2);
            filename = `${safeTitle}.json`;
            type = 'application/json';
            break;
    }

    downloadFile(content, filename, type);
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    localStorage.setItem('wxEditor_articles', JSON.stringify(state.articles));
    log('文章已保存到本地存储', 'success');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('wxEditor_articles');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 兼容旧数据：没有 styles 字段的旧文章
            state.articles = parsed.map(a => ({
                ...a,
                styles: a.styles || []
            }));
            log(`从本地存储加载了 ${state.articles.length} 篇文章`, 'success');
            if (state.articles.length > 0) {
                state.pendingContent = state.articles[0].content;
                state.pendingStyles = state.articles[0].styles;
                state.currentArticle = state.articles[0];
                elements.articleTitle.value = state.articles[0].title;
                elements.articleAuthor.value = state.articles[0].author;
                elements.articleUrl.value = state.articles[0].url;
            }
        } catch (e) {
            log('加载本地存储失败: ' + e.message, 'error');
            state.articles = [];
        }
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getUrlsFromInputs() {
    const urls = [];
    const singleTabContent = document.getElementById('singleTabContent');
    const batchTabContent = document.getElementById('batchTabContent');
    
    if (!singleTabContent.classList.contains('hidden')) {
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById('fetchUrl' + i);
            if (input) {
                const value = input.value.trim();
                if (value && value.includes('mp.weixin.qq.com')) {
                    urls.push(value);
                }
            }
        }
    } else {
        const textarea = document.getElementById('batchFetchUrls');
        if (textarea) {
            const content = textarea.value.trim();
            if (content) {
                const lines = content.split('\n');
                for (const line of lines) {
                    const url = line.trim();
                    if (url && url.includes('mp.weixin.qq.com')) {
                        urls.push(url);
                    }
                }
            }
        }
    }
    return urls.slice(0, 8);
}

function clearUrlInputs() {
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById('fetchUrl' + i);
        if (input) {
            input.value = '';
        }
    }
    const textarea = document.getElementById('batchFetchUrls');
    if (textarea) {
        textarea.value = '';
    }
}

async function fetchSingleArticle(url) {
    log(`开始采集: ${url}`, 'info');
    
    const requestBody = JSON.stringify({ url: url });
    const response = await fetch('fetch_article.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: requestBody
    });
    
    const responseText = await response.text();
    return JSON.parse(responseText);
}

async function fetchArticleFromPHP() {
    const urls = getUrlsFromInputs();
    
    if (urls.length === 0) {
        alert('请至少输入一个有效的微信公众号文章链接！');
        return;
    }
    
    const availableSlots = state.maxArticles - state.articles.length;
    if (urls.length > availableSlots) {
        alert(`当前还可以采集 ${availableSlots} 篇文章，请减少链接数量！`);
        return;
    }
    
    const progressDiv = document.getElementById('fetchProgress');
    const progressBar = document.getElementById('fetchProgressBar');
    const fetchStatus = document.getElementById('fetchStatus');
    const fetchBtn = elements.fetchArticleBtn;
    
    progressDiv.classList.remove('hidden');
    fetchBtn.disabled = true;
    fetchBtn.classList.add('opacity-50');
    
    let successCount = 0;
    let failCount = 0;
    const failedUrls = [];
    
    try {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const progress = ((i + 1) / urls.length) * 100;
            
            progressBar.style.width = `${progress}%`;
            fetchStatus.textContent = `正在采集第 ${i + 1}/${urls.length} 篇文章...`;
            
            log(`正在采集第 ${i + 1}/${urls.length} 篇: ${url}`, 'info');
            
            try {
                const result = await fetchSingleArticle(url);
                
                if (result.success) {
                    log(`解析到的内容长度: ${result.data.content ? result.data.content.length : 0}`, 'success');
                    
                    const article = createArticle(
                        url,
                        result.data.title,
                        result.data.author,
                        result.data.content,
                        result.data.styles || []
                    );
                    addArticle(article);
                    successCount++;
                    
                    log(`第 ${i + 1} 篇采集成功: ${result.data.title}`, 'success');
                } else {
                    failCount++;
                    failedUrls.push({ url: url, error: result.message });
                    log(`第 ${i + 1} 篇采集失败: ${result.message}`, 'error');
                }
            } catch (err) {
                failCount++;
                failedUrls.push({ url: url, error: err.message });
                log(`第 ${i + 1} 篇采集异常: ${err.message}`, 'error');
            }
        }
        
        progressBar.style.width = '100%';
        
        if (successCount > 0 && failCount === 0) {
            fetchStatus.textContent = `✅ 全部 ${successCount} 篇采集成功！`;
        } else if (successCount > 0 && failCount > 0) {
            fetchStatus.textContent = `⚠️ 部分成功：成功 ${successCount} 篇，失败 ${failCount} 篇`;
        } else {
            fetchStatus.textContent = `❌ 全部 ${failCount} 篇采集失败`;
        }
        
        setTimeout(() => {
            progressDiv.classList.add('hidden');
            progressBar.style.width = '0%';
            clearUrlInputs();
        }, 1500);
        
        let alertMsg = '';
        if (successCount > 0) {
            alertMsg += `✅ 成功采集 ${successCount} 篇文章！\n`;
        }
        if (failCount > 0) {
            alertMsg += `❌ 失败 ${failCount} 篇文章：\n`;
            for (const failed of failedUrls) {
                alertMsg += `  - ${failed.url}\n    错误: ${failed.error}\n`;
            }
        }
        alert(alertMsg || '采集完成');
        
    } catch (err) {
        log('批量采集失败: ' + err.message, 'error');
        alert(`采集失败：${err.message}`);
        
        progressDiv.classList.add('hidden');
        progressBar.style.width = '0%';
        
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.classList.remove('opacity-50');
    }
}

function initEvents() {
    elements.articleTitle.addEventListener('input', updateCurrentArticle);
    elements.articleAuthor.addEventListener('input', updateCurrentArticle);
    
    elements.saveBtn.addEventListener('click', () => {
        updateCurrentArticle();
        saveToLocalStorage();
        alert('保存成功！');
    });
    
    elements.exportBtn.addEventListener('click', () => {
        elements.exportModal.classList.remove('hidden');
    });
    
    document.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', () => {
            exportArticle(btn.dataset.format);
            elements.exportModal.classList.add('hidden');
        });
    });
    
    elements.closeExport.addEventListener('click', () => {
        elements.exportModal.classList.add('hidden');
    });
    
    elements.exportModal.addEventListener('click', (e) => {
        if (e.target === elements.exportModal) {
            elements.exportModal.classList.add('hidden');
        }
    });
    
    elements.previewBtn.addEventListener('click', preview);
    elements.closePreview.addEventListener('click', () => {
        elements.previewModal.classList.add('hidden');
    });
    elements.previewModal.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            elements.previewModal.classList.add('hidden');
        }
    });
    
    elements.clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空当前内容吗？')) {
            clearEditor();
        }
    });
    
    elements.fetchArticleBtn.addEventListener('click', fetchArticleFromPHP);
    const batchFetchBtn = document.getElementById('batchFetchBtn');
    if (batchFetchBtn) {
        batchFetchBtn.addEventListener('click', fetchArticleFromPHP);
    }
    
    elements.singleTab.addEventListener('click', () => switchTab('single'));
    elements.batchTab.addEventListener('click', () => switchTab('batch'));
    
    elements.toggleArticleList.addEventListener('click', toggleArticleListPanel);
    
    // 模式切换事件
    initModeToggle();
}

function switchTab(tab) {
    if (tab === 'single') {
        elements.singleTab.classList.add('bg-white', 'text-gray-900', 'rounded-md', 'shadow-sm');
        elements.singleTab.classList.remove('text-gray-600', 'hover:text-gray-900');
        elements.batchTab.classList.remove('bg-white', 'text-gray-900', 'rounded-md', 'shadow-sm');
        elements.batchTab.classList.add('text-gray-600', 'hover:text-gray-900');
        elements.singleTabContent.classList.remove('hidden');
        elements.batchTabContent.classList.add('hidden');
    } else {
        elements.batchTab.classList.add('bg-white', 'text-gray-900', 'rounded-md', 'shadow-sm');
        elements.batchTab.classList.remove('text-gray-600', 'hover:text-gray-900');
        elements.singleTab.classList.remove('bg-white', 'text-gray-900', 'rounded-md', 'shadow-sm');
        elements.singleTab.classList.add('text-gray-600', 'hover:text-gray-900');
        elements.batchTabContent.classList.remove('hidden');
        elements.singleTabContent.classList.add('hidden');
    }
}

function toggleArticleListPanel() {
    // 如果是鼠标模式，切换到固定模式并展开面板
    if (state.panelMode === 'mouse') {
        setPanelMode('fixed');
        // 确保面板是展开状态
        if (state.isArticleListCollapsed) {
            state.isArticleListCollapsed = false;
            elements.articleList.classList.remove('hidden');
            elements.articleListPanel.classList.remove('lg:col-span-1');
            elements.articleListPanel.classList.add('lg:col-span-2');
            elements.toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
        }
        return;
    }
    
    // 固定模式：正常的展开/收起切换
    state.isArticleListCollapsed = !state.isArticleListCollapsed;
    
    if (state.isArticleListCollapsed) {
        elements.articleList.classList.add('hidden');
        elements.articleListPanel.classList.remove('lg:col-span-2');
        elements.articleListPanel.classList.add('lg:col-span-1');
        elements.toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
    } else {
        elements.articleList.classList.remove('hidden');
        elements.articleListPanel.classList.remove('lg:col-span-1');
        elements.articleListPanel.classList.add('lg:col-span-2');
        elements.toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
    }
}

function initModeToggle() {
    // 模式切换按钮事件
    if (elements.modeMouse) {
        elements.modeMouse.addEventListener('click', () => {
            setPanelMode('mouse');
        });
    }
    if (elements.modeFixed) {
        elements.modeFixed.addEventListener('click', () => {
            setPanelMode('fixed');
        });
    }
    
    // 根据当前模式初始化
    setPanelMode(state.panelMode);
}

function setPanelMode(mode) {
    state.panelMode = mode;
    
    if (mode === 'mouse') {
        // 鼠标模式：样式更新
        if (elements.modeMouse) {
            elements.modeMouse.classList.add('bg-blue-50', 'text-blue-600');
            elements.modeMouse.classList.remove('bg-gray-50', 'text-gray-500');
        }
        if (elements.modeFixed) {
            elements.modeFixed.classList.remove('bg-blue-50', 'text-blue-600');
            elements.modeFixed.classList.add('bg-gray-50', 'text-gray-500');
        }
        
        // 添加鼠标事件 — 只绑定到卡片区域（articleListCard），不绑定到整列空白区域
        if (elements.articleListCard) {
            elements.articleListCard.addEventListener('mouseenter', handleMouseEnter);
            elements.articleListCard.addEventListener('mouseleave', handleMouseLeave);
            elements.articleListCard.setAttribute('data-mode', 'mouse');
        }
        
        log('切换到鼠标模式', 'info');
    } else {
        // 固定模式：样式更新
        if (elements.modeFixed) {
            elements.modeFixed.classList.add('bg-blue-50', 'text-blue-600');
            elements.modeFixed.classList.remove('bg-gray-50', 'text-gray-500');
        }
        if (elements.modeMouse) {
            elements.modeMouse.classList.remove('bg-blue-50', 'text-blue-600');
            elements.modeMouse.classList.add('bg-gray-50', 'text-gray-500');
        }
        
        // 移除鼠标事件
        if (elements.articleListCard) {
            elements.articleListCard.removeEventListener('mouseenter', handleMouseEnter);
            elements.articleListCard.removeEventListener('mouseleave', handleMouseLeave);
            elements.articleListCard.removeAttribute('data-mode');
        }
        
        // 切换到固定模式时，取消所有 pending 的 mouseleave 定时器
        if (state.panelMouseLeaveTimeout) {
            clearTimeout(state.panelMouseLeaveTimeout);
            state.panelMouseLeaveTimeout = null;
        }
        state.isMouseOverPanel = false;
        
        log('切换到固定模式', 'info');
    }
}

function handleMouseEnter() {
    if (state.panelMode !== 'mouse') return;
    
    // 标记鼠标在面板上
    state.isMouseOverPanel = true;
    
    // 如果之前有 mouseleave 的定时器，取消它（防止鼠标快速进出导致的闪烁）
    if (state.panelMouseLeaveTimeout) {
        clearTimeout(state.panelMouseLeaveTimeout);
        state.panelMouseLeaveTimeout = null;
    }
    
    // 鼠标进入，展开面板
    if (state.isArticleListCollapsed) {
        state.isArticleListCollapsed = false;
        elements.articleList.classList.remove('hidden');
        elements.articleListPanel.classList.remove('lg:col-span-1');
        elements.articleListPanel.classList.add('lg:col-span-2');
        elements.toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
        log('鼠标进入面板，展开', 'info');
    }
}

function handleMouseLeave() {
    if (state.panelMode !== 'mouse') return;
    
    // 标记鼠标已离开面板
    state.isMouseOverPanel = false;
    
    // 延迟 300ms 后收缩，但如果期间 mouseenter 触发会取消这个定时器
    state.panelMouseLeaveTimeout = setTimeout(() => {
        // 再次检查：如果定时器执行时鼠标已经重新进入，则不收缩
        if (state.panelMode !== 'mouse' || state.isMouseOverPanel) {
            return;
        }
        
        if (!state.isArticleListCollapsed) {
            state.isArticleListCollapsed = true;
            elements.articleList.classList.add('hidden');
            elements.articleListPanel.classList.remove('lg:col-span-2');
            elements.articleListPanel.classList.add('lg:col-span-1');
            elements.toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
            log('鼠标离开面板，收缩', 'info');
        }
        
        state.panelMouseLeaveTimeout = null;
    }, 300);
}

function init() {
    log('正在初始化应用...', 'info');
    initEvents();
    initIframeEditor();
    loadFromLocalStorage();
    renderArticleList();
    
    log('应用初始化完成', 'success');
}

document.addEventListener('DOMContentLoaded', init);
