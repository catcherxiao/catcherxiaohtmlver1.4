// 初始化轮播图
const swiper = new Swiper('.swiper-container', {
    loop: true,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    touchRatio: 1,
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    }
});

// 二维码图片点击放大
document.querySelectorAll('.qr-code').forEach(img => {
    img.addEventListener('click', function() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '1001';
        
        const enlargedImg = document.createElement('img');
        enlargedImg.src = this.src;
        enlargedImg.style.maxWidth = '90%';
        enlargedImg.style.maxHeight = '90%';
        enlargedImg.style.objectFit = 'contain';
        
        overlay.appendChild(enlargedImg);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });
    });
});

// 汉堡菜单交互
const hamburger = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');
const body = document.body;

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// 点击导航链接时关闭菜单
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        body.style.overflow = '';
    });
});

// 点击页面其他区域关闭菜单
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        body.style.overflow = '';
    }
});

// AI聊天功能
document.addEventListener('DOMContentLoaded', async () => {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const fileInput = document.getElementById('fileInput');
    let currentFileId = null;

    if (!chatMessages || !chatInput || !sendButton) {
        console.error('聊天元素未找到');
        return;
    }

    const API_KEY = 'sk-9rsUBWt3OdxZeYlXtuPWkyQF06cLifQvgY7ObzziJ8kzf5ew';
    const API_URL = 'https://api.moonshot.cn/v1/chat/completions';
    const FILE_UPLOAD_URL = 'https://api.moonshot.cn/v1/files';
    const FILE_CONTENT_URL = 'https://api.moonshot.cn/v1/files/';
    
    // 从缓存获取文件ID
    function getStoredFileIds() {
        const stored = localStorage.getItem('activeFileIds');
        return stored ? JSON.parse(stored) : [];
    }

    // 保存文件ID到缓存
    function storeFileIds(fileIds) {
        localStorage.setItem('activeFileIds', JSON.stringify(fileIds));
    }

    // 上传背景知识文件
    async function uploadBackgroundData() {
        // 先检查缓存
        const storedIds = getStoredFileIds();
        if (storedIds.length > 0) {
            console.log('使用缓存的文件ID:', storedIds);
            return storedIds[0];  // 返回第一个文件ID作为背景知识
        }

        try {
            const formData = new FormData();
            const file = await fetch('data.pdf').then(res => res.blob());
            formData.append('file', file, 'data.pdf');
            
            const response = await fetch(FILE_UPLOAD_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`背景文件上传失败: ${response.status}`);
            }

            const data = await response.json();
            // 存储新上传的文件ID
            storeFileIds([data.id]);
            return data.id;
        } catch (error) {
            console.error('背景文件上传错误:', error);
            return null;
        }
    }

    // 初始化背景知识
    const backgroundFileId = await uploadBackgroundData();
    let activeFileIds = backgroundFileId ? [backgroundFileId] : [];
    
    // 清空本地存储的对话历史和文件ID
    localStorage.removeItem('conversationHistory');
    localStorage.removeItem('activeFileIds');
    
    // 添加个人背景信息作为系统提示的一部分
    const BACKGROUND_INFO = `个人信息：

    姓名：肖昌国
    出生日期：1995年09月26日
    联系电话：13260230926
    邮箱：xcg3330@163.com
    教育背景：2013年09月至2017年06月，北京化工大学（211工程院校），数学与应用数学专业
    工作经历：

    杭州智慧果科技有限公司（2022年08月至今）

    职位：创始人
    团队规模：10人+
    主要业务：直播电商、货架电商、直播代运营
    项目包括：潮玩盲盒直播、货架电商（天猫笔记本定制、拼多多/淘系/得物卡牌盲盒、拼多多玩具）、直播代运营（拼多多泡泡玛特官方店、京东今世缘自营店）
    阿里巴巴（2021年05月至2022年07月）

    职位：策略产品经理
    部门：国内贸易事业部（1688）
    项目包括：搜索体验优化（体验监测、能力建设）、价格力/价格治理、家电行业搜索行业化建设
    百度（2019年05月至2021年04月）

    职位：策略产品经理
    部门：母婴业务部
    项目包括：宝宝知道app策略建设、百度大搜母婴垂类建设、宝宝知道app搜索策略和功能建设、宝宝知道手百feed通路建设、宝宝知道app push策略优化
    腾讯（2017年07月至2019年05月）

    职位：腾讯新闻push运营
    项目包括：华为push产品策略优化、精细化用户包项目、兴趣push运营
    个人评价：

    2年电商独立创业经验，团队管理能力，熟悉直播/货架电商玩法
    3年策略产品经验，擅长搜索体验监测和评估、导购产品设计、相关性优化、策略机制设计
    数据分析能力强，精通SQL，能独立制作实验报表和进行深入的数据分析
    项目经历：

    详细描述了在各个公司的工作内容和取得的业绩，包括但不限于直播电商的运营策略、搜索体验的优化、价格治理、家电行业的搜索行业化建设、母婴业务的产品策略、以及腾讯新闻push运营的策略优化等。
    这份简历展示了肖昌国在电商、搜索产品和内容运营方面的丰富经验和专业技能。`;

    // 修改初始化对话历史
    let conversationHistory = [{
        role: 'system',
        content: `${BACKGROUND_INFO}\n\n你是 Catcher Xiao 的AI助手，你需要基于以上背景信息，以友好和专业的态度回答用户的问题。`
    }];

    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 3000;  // 增加到 3 秒
    const MAX_RETRIES = 3;
    const RATE_LIMIT_WAIT = 2000;  // 增加到 2 秒
    
    // 添加一个变量来跟踪当前请求
    let currentRequest = null;

    // 添加一个变量来存储会话期间上传的文件信息
    let sessionFileInfo = [];

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : ''}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? 'U' : 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (!isUser) {
            // 移除所有空行和只包含空白字符的行
            const cleanContent = content
                .split('\n')
                .filter(line => line.trim() !== '')  // 移除空行
                .join('\n');
            
            // 使用 marked 解析 Markdown
            messageContent.innerHTML = marked.parse(cleanContent);
            
            // 移除解析后 HTML 的空段落
            messageContent.querySelectorAll('p').forEach(p => {
                if (!p.textContent.trim()) {
                    p.remove();
                }
            });
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // 处理代码高亮
        messageContent.querySelectorAll('pre code').forEach((block) => {
            block.style.display = 'block';
            block.style.overflowX = 'auto';
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 修改获取文件内容的函数
    async function getFileContent(fileId) {
        try {
            const response = await fetch(`${FILE_CONTENT_URL}${fileId}/content`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`获取文件内容失败: ${response.status}`);
            }

            const data = await response.json();
            
            // 根据文档，返回的数据结构包含 page_content
            if (data.page_content) {
                return {
                    content: data.page_content,
                    metadata: data.metadata || {}
                };
            }
            
            return null;
        } catch (error) {
            console.error('获取文件内容错误:', error);
            return null;
        }
    }

    // 修改文件上传后的处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件类型
        const validTypes = [
            'application/pdf',
            'application/msword',                    // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (!validTypes.includes(file.type)) {
            addMessage('抱歉，只支持 PDF、Word 文档和图片文件（JPG、PNG、GIF、WebP）。');
            fileInput.value = '';
            return;
        }

        try {
            addMessage('正在上传文件...');
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(FILE_UPLOAD_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`文件上传失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('文件上传成功:', data);

            const fileContent = await getFileContent(data.id);
            
            // 将新文件信息添加到会话存储
            sessionFileInfo.push({
                id: data.id,
                name: file.name,
                type: file.type,
                content: fileContent ? fileContent.content : null,
                metadata: fileContent ? fileContent.metadata : {}
            });
            
            // 更新活动文件列表
            activeFileIds.push(data.id);
            
            console.log('当前会话文件信息:', sessionFileInfo);
            console.log('当前活动文件ID:', activeFileIds);
            
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage(`文件 "${file.name}" 上传成功！您现在可以询问关于这个文件的问题。`);
        } catch (error) {
            console.error('文件上传错误:', error);
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage('抱歉，文件上传失败。请稍后重试');
        }
        
        fileInput.value = '';
    });

    async function sendToAPI(message) {
        try {
            // 如果有正在进行的请求，中断它
            if (currentRequest) {
                console.log('中断上一个请求，开始新请求');
                currentRequest.abort = true;
            }

            // 创建新的请求上下文
            currentRequest = { abort: false };
            const thisRequest = currentRequest;

            // 检查请求间隔
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
            }

            // 如果有会话文件，添加文件信息和内容到用户消息中
            let userMessage = message;
            if (sessionFileInfo.length > 0) {
                const fileContext = sessionFileInfo.map(file => {
                    let fileInfo = `文件名: ${file.name}\n类型: ${file.type}`;
                    if (file.metadata) {
                        fileInfo += `\n元数据: ${JSON.stringify(file.metadata)}`;
                    }
                    if (file.content) {
                        fileInfo += `\n内容:\n${file.content}`;
                    }
                    return fileInfo;
                }).join('\n\n');
                userMessage = `上下文文件信息:\n${fileContext}\n\n用户问题:\n${message}`;
            }

            conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            const makeRequest = async (retryNumber = 0) => {
                try {
                    // 检查是否被中断
                    if (thisRequest.abort) {
                        throw new Error('请求被中断');
                    }

                    // 准备请求数据
                    const requestData = {
                        model: 'moonshot-v1-8k',
                        messages: conversationHistory,
                        temperature: 0.7,
                        file_ids: activeFileIds,
                        stream: false
                    };

                    console.log('发送API请求:', {
                        messages: conversationHistory,
                        file_ids: activeFileIds,
                        sessionFileInfo
                    });

                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${API_KEY}`
                        },
                        body: JSON.stringify(requestData)
                    });

                    // 再次检查是否被中断
                    if (thisRequest.abort) {
                        throw new Error('请求被中断');
                    }

                    if (response.status === 429) {
                        // 遇到速率限制时等待更长时间
                        const waitTime = RATE_LIMIT_WAIT * (retryNumber + 2);  // 递增等待时间
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        if (retryNumber < MAX_RETRIES) {
                            return makeRequest(retryNumber + 1);
                        }
                    }

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`请求失败: ${response.status}, ${errorText}`);
                    }

                    return response.json();
                } catch (error) {
                    if (error.message === '请求被中断') {
                        throw error;
                    }
                    if (error.message.includes('速率限制') && retryNumber < MAX_RETRIES) {
                        const waitTime = RATE_LIMIT_WAIT * (retryNumber + 2);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        return makeRequest(retryNumber + 1);
                    }
                    throw error;
                }
            };

            const data = await makeRequest();
            
            // 如果请求完成时没有被中断，更新对话历史
            if (!thisRequest.abort) {
                lastRequestTime = Date.now();
                const aiResponse = data.choices[0].message.content;
                conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse
                });
                currentRequest = null;
                return aiResponse;
            } else {
                throw new Error('请求被中断');
            }
        } catch (error) {
            if (error.message === '请求被中断') {
                console.log('请求已被新请求中断');
                return null;
            }
            throw error;
        }
    }

    async function handleSend() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        try {
            // 记住当前滚动位置
            const scrollPos = chatMessages.scrollTop;
            
            addMessage(message, true);
            chatInput.value = '';
            
            // 立即调整输入框高度
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            
            addMessage('正在思考...');
            
            const response = await sendToAPI(message);
            if (response !== null) {
                chatMessages.removeChild(chatMessages.lastChild);
                addMessage(response);
                
                // 恢复滚动位置并滚动到底部
                requestAnimationFrame(() => {
                    chatMessages.scrollTop = scrollPos;
                    setTimeout(() => {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }, 100);
                });
            }
        } catch (error) {
            console.error('发送消息错误:', error);
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage(`抱歉，发生了错误: ${error.message}`);
        }
        
        // 保持输入框焦点
        chatInput.focus();
    }

    sendButton.addEventListener('click', () => {
        console.log('发送按钮被点击');
        handleSend();
    });

    chatInput.addEventListener('keypress', (e) => {
        console.log('键盘按下:', e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // 监听虚拟键盘事件
    document.addEventListener('DOMContentLoaded', () => {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        // 处理输入框高度自适应
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
    });

    // 直接显示欢迎信息
    addMessage('Hi，我是Catcher Xiao 的分身，欢迎聊聊');
});