// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSmoothScrolling();
    initializeProductDisplay();
});

/**
 * 初始化导航功能
 * 为产品中心链接和Hero区域按钮绑定点击事件
 */
function initializeNavigation() {
    // 产品中心导航链接
    const productsNavLink = document.querySelector('.nav-link.products');
    if (productsNavLink) {
        productsNavLink.addEventListener('click', function(event) {
            event.preventDefault();
            scrollToProductsAndLoad();
        });
    }

    // Hero区域的产品按钮
    const productsHeroButton = document.querySelector('.products-trigger');
    if (productsHeroButton) {
        productsHeroButton.addEventListener('click', function(event) {
            event.preventDefault();
            scrollToProductsAndLoad();
        });
    }
}

/**
 * 初始化平滑滚动功能
 * 为所有内部链接添加平滑滚动效果
 */
function initializeSmoothScrolling() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#home') {
                event.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                event.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * 初始化产品展示功能
 */
function initializeProductDisplay() {
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        // 确保产品网格为空，准备后续加载
        productGrid.innerHTML = '';
        productGrid.style.display = 'none';
    }
}

/**
 * 滚动到产品区域并加载产品数据
 */
async function scrollToProductsAndLoad() {
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
        // 平滑滚动到产品区域
        productsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // 等待滚动完成后加载产品
        setTimeout(() => {
            loadProducts();
        }, 500);
    }
}

/**
 * 加载产品数据并渲染产品卡片
 * 支持显示/隐藏切换功能
 */
async function loadProducts() {
    const grid = document.querySelector('.product-grid');
    if (!grid) {
        console.error('产品网格容器未找到');
        return;
    }

    try {
        // 检查是否已经加载了产品（通过检查是否有产品卡片）
        const existingProducts = grid.querySelectorAll('.product-card');
        if (existingProducts.length > 0 && grid.style.display === 'grid') {
            // 如果已经显示产品，则隐藏
            hideProducts(grid);
            return;
        }

        // 显示加载状态
        showLoadingState(grid);

        // 添加时间戳防止缓存
        const timestamp = new Date().getTime();
        const response = await fetch(`data/products.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 验证数据结构
        if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
            throw new Error('产品数据格式错误：缺少有效的分类信息');
        }

        const products = data.categories[0].products;
        
        if (!products || !Array.isArray(products) || products.length === 0) {
            throw new Error('产品数据格式错误：缺少有效的产品信息');
        }

        console.log(`成功加载 ${products.length} 个产品:`, products.map(p => p.name));

        // 渲染产品卡片
        renderProducts(grid, products);
        
    } catch (error) {
        console.error('加载产品数据失败:', error.message);
        showErrorState(grid, error.message);
    }
}

/**
 * 显示加载状态
 */
function showLoadingState(grid) {
    grid.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <p>正在加载产品信息...</p>
        </div>
    `;
    grid.style.display = 'block';
}

/**
 * 显示错误状态
 */
function showErrorState(grid, errorMessage) {
    grid.innerHTML = `
        <div class="error-state">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>加载失败</h3>
            <p>${errorMessage}</p>
            <button class="btn btn-primary retry-btn" onclick="loadProducts()">
                <i class="fas fa-redo"></i>重试
            </button>
        </div>
    `;
    grid.style.display = 'block';
}

/**
 * 渲染产品列表
 */
function renderProducts(grid, products) {
    const productCards = products.map(product => createProductCard(product)).join('');
    grid.innerHTML = productCards;
    grid.style.display = 'grid';
    
    // 添加渐入动画
    const cards = grid.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

/**
 * 隐藏产品列表
 */
function hideProducts(grid) {
    grid.style.display = 'none';
    // 滚动回Hero区域
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * 创建产品卡片HTML
 * @param {Object} product - 产品对象
 * @param {string} product.id - 产品ID
 * @param {string} product.name - 产品名称
 * @param {string} product.image - 产品图片路径
 * @param {string} product.desc - 产品描述
 * @param {string} product.manual - 产品手册路径
 * @param {string} product.wikiUrl - 产品Wiki链接
 * @returns {string} 产品卡片HTML字符串
 */
function createProductCard(product) {
    // 数据验证
    if (!product || typeof product !== 'object') {
        console.warn('无效的产品数据:', product);
        return '';
    }

    const {
        id = 'unknown',
        name = '未知产品',
        image = 'images/placeholder.webp',
        desc = '暂无描述',
        manual = '#',
        wikiUrl = '#'
    } = product;

    return `
        <div class="product-card" data-product-id="${id}">
            <div class="product-image-container">
                <img src="${image}" 
                     alt="${name}" 
                     onerror="this.src='images/placeholder.webp';this.alt='图片加载失败';"
                     loading="lazy">
            </div>
            <div class="product-content">
                <h3>${name}</h3>
                <p>${desc}</p>
                <div class="product-actions">
                    <a href="${manual}" 
                       download 
                       class="product-btn manual-btn"
                       title="下载产品手册">
                        <i class="fas fa-download"></i>
                        产品手册
                    </a>
                    <a href="${wikiUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="product-btn wiki-btn"
                       title="查看使用文档">
                        <i class="fas fa-external-link-alt"></i>
                        使用文档
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * 添加产品卡片的CSS样式（如果需要动态添加）
 */
function addProductCardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-state,
        .error-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem;
            background: white;
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-md);
        }
        
        .loading-spinner i {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .error-icon i {
            font-size: 2rem;
            color: #ef4444;
            margin-bottom: 1rem;
        }
        
        .error-state h3 {
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .error-state p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }
        
        .retry-btn {
            background: var(--primary-color) !important;
            color: white !important;
        }
        
        .product-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .product-btn {
            flex: 1;
            min-width: 120px;
            text-align: center;
        }
        
        .wiki-btn {
            background: var(--success-color) !important;
        }
        
        .wiki-btn:hover {
            background: #059669 !important;
        }
    `;
    document.head.appendChild(style);
}

// 在页面加载时添加样式
document.addEventListener('DOMContentLoaded', addProductCardStyles);
