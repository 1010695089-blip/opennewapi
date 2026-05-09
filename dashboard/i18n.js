(() => {
  const storageKey = 'astra_lang';
  let currentLang = localStorage.getItem(storageKey) || 'en';
  let observer;
  let applying = false;

  const zh = new Map(Object.entries({
    'Private AI Router': '私有 AI 路由器',
    'Private command console for routing Claude, OpenAI, Gemini & Ollama': '用于路由 Claude、OpenAI、Gemini 与 Ollama 的私有控制台',
    'Overview': '总览',
    'Command Center': '指挥中心',
    'Traffic Ledger': '流量台账',
    'Configuration': '配置',
    'Upstreams': '上游通道',
    'Profiles': '配置档案',
    'API Keys': 'API 密钥',
    'System': '系统',
    'Cloudflare': 'Cloudflare',
    'Online': '在线',
    'Offline': '离线',
    'Settings': '设置',
    'Field Manual': '使用手册',
    'Connecting...': '连接中...',
    'Password': '密码',
    'Enter your password': '输入密码',
    'Create a password': '创建密码',
    'Choose a password': '设置密码',
    'This password protects your dashboard. You can change it later in settings.': '此密码用于保护控制台，之后可在设置中修改。',
    'Enter your password': '输入密码',
    'Password must be at least 8 characters': '密码至少需要 8 个字符',
    'Setup failed': '初始化失败',
    'Wrong password': '密码错误',
    'Could not connect to server': '无法连接服务器',
    'Connected': '已连接',
    'Add a Provider': '添加上游通道',
    'Connect Claude, OpenAI, Gemini, or Ollama': '连接 Claude、OpenAI、Gemini 或 Ollama',
    'Create a Profile': '创建配置档案',
    'Routable behavior with a system prompt and endpoint': '带系统提示词和端点的可路由行为',
    'Generate an API Key': '生成 API 密钥',
    'Create an': '创建一个',
    'key for your apps': '密钥供应用使用',
    'Open Console': '打开控制台',
    'Active connections': '活跃连接',
    'AI endpoints': 'AI 端点',
    'Active keys': '活跃密钥',
    'Requests Today': '今日请求',
    'total': '总计',
    'Memory': '内存',
    'Uptime': '运行时间',
    'View All': '查看全部',
    'View All →': '查看全部 →',
    'No upstreams configured': '尚未配置上游通道',
    'No profiles created': '尚未创建配置档案',
    'Recent Requests': '最近请求',
    'No requests yet': '暂无请求',
    'No API keys': '暂无 API 密钥',
    'LLM Upstreams': 'LLM 上游通道',
    'configured': '已配置',
    'Add Upstream': '添加上游通道',
    'Search upstreams...': '搜索上游通道...',
    'All Types': '全部类型',
    'All Health': '全部健康状态',
    'Healthy': '健康',
    'Degraded': '降级',
    'Down': '不可用',
    'All Status': '全部状态',
    'Enabled': '已启用',
    'Disabled': '已禁用',
    'Clear': '清除',
    'selected': '已选择',
    'Health Check': '健康检查',
    'Enable': '启用',
    'Disable': '禁用',
    'Delete': '删除',
    'Deselect all': '取消全选',
    'Name': '名称',
    'Type': '类型',
    'Priority': '优先级',
    'Health': '健康',
    'Last Check': '上次检查',
    'On': '开',
    'Off': '关',
    'Run Health Sweep': '运行健康扫描',
    'No upstreams found': '未找到上游通道',
    'Try adjusting your filters.': '请尝试调整筛选条件。',
    'Add an upstream to start routing AI requests.': '添加上游通道后即可开始路由 AI 请求。',
    'Routable AI behaviors with prompts and dedicated endpoints': '带提示词和专属端点的可路由 AI 行为',
    'Add Profile': '添加配置档案',
    'Endpoint': '端点',
    'Upstream': '上游通道',
    'Model': '模型',
    'Status': '状态',
    'Active': '激活',
    'No profiles configured': '尚未配置档案',
    'Create a profile to define an AI endpoint with a system prompt.': '创建配置档案，用系统提示词定义一个 AI 端点。',
    'Issue and revoke access tokens for consumers': '为调用方签发和撤销访问令牌',
    'Create Key': '创建密钥',
    'Prefix': '前缀',
    'Format': '格式',
    'Rate Limit': '速率限制',
    'Requests': '请求数',
    'Last Used': '上次使用',
    'Revoked': '已撤销',
    'All profiles': '全部配置档案',
    'Create a key to authenticate API consumers.': '创建密钥用于 API 调用方认证。',
    'Last 30 days': '最近 30 天',
    'Total Requests': '总请求数',
    'Input Tokens': '输入 Token',
    'Output Tokens': '输出 Token',
    '30-day period': '30 天周期',
    'Daily Breakdown': '每日明细',
    'Date': '日期',
    'Input': '输入',
    'Output': '输出',
    'Usage by Profile': '按配置档案统计',
    'Tokens': 'Token',
    'No data': '暂无数据',
    'Search by model, profile, upstream, error...': '按模型、配置档案、上游通道、错误搜索...',
    'All Profiles': '全部配置档案',
    'All Upstreams': '全部上游通道',
    'Success': '成功',
    'Error': '错误',
    'Rate Limited': '速率受限',
    'Budget Exceeded': '预算超限',
    'rows': '行',
    'Time': '时间',
    'Key': '密钥',
    'Profile': '配置档案',
    'In': '输入',
    'Out': '输出',
    'Latency': '延迟',
    'OK': '正常',
    'error': '错误',
    'No requests found': '未找到请求',
    'Send a request to see it logged here.': '发送请求后会在这里显示日志。',
    'Showing': '显示',
    'of': '共',
    'Edge Tunnel': '边缘隧道',
    'Cloudflare tunnel and DNS controls for external access': '用于外部访问的 Cloudflare 隧道与 DNS 控制',
    'Add an Upstream': '添加上游通道',
    'Edit Configuration': '编辑配置',
    'Setup Cloudflare': '设置 Cloudflare',
    'Needs Zone:DNS:Edit and Account:Cloudflare Tunnel:Edit permissions. Enter token and click Connect to auto-populate fields below.': '需要 Zone:DNS:Edit 和 Account:Cloudflare Tunnel:Edit 权限。输入令牌并点击连接，可自动填充下方字段。',
    'Connect': '连接',
    'Save Cloudflare Settings': '保存 Cloudflare 设置',
    'General gateway configuration': '通用网关配置',
    'Console Name': '控制台名称',
    'Timezone': '时区',
    'Save Settings': '保存设置',
    'Change Password': '修改密码',
    'Current Password': '当前密码',
    'New Password': '新密码',
    'Min 4 characters': '至少 4 个字符',
    'API Endpoints': 'API 端点',
    'Chat (OpenAI-compat)': '聊天接口（兼容 OpenAI）',
    'Profile-specific': '指定配置档案',
    'Models': '模型',
    'Quick Test': '快速测试',
    'Copy this to test your gateway:': '复制以下命令测试网关：',
    'Quick Start': '快速开始',
    'Installation': '安装',
    'Architecture': '架构',
    'Authentication': '认证',
    'API Reference': 'API 参考',
    'Streaming': '流式输出',
    'CLI Reference': 'CLI 参考',
    'OpenClaw': 'OpenClaw',
    'SDK Examples': 'SDK 示例',
    'Deployment': '部署',
    'Key Concepts': '核心概念',
    'Fallback Chain': '故障转移链',
    'From zero to a working AI endpoint in 4 steps:': '4 步从零创建可用 AI 端点：',
    'Add an upstream': '添加上游通道',
    'Create a profile': '创建配置档案',
    'Generate an API key': '生成 API 密钥',
    'Send a request': '发送请求',
    'Requirements': '环境要求',
    'One-liner': '一键安装',
    'Manual': '手动安装',
    'Development': '开发',
    'Priority & Fallback': '优先级与故障转移',
    'Token Auto-Refresh': 'Token 自动刷新',
    'Authentication Modes': '认证模式',
    'OAuth Login (Subscription-based)': 'OAuth 登录（订阅账号）',
    'API Key (Pay-per-token)': 'API Key（按量计费）',
    'Upstream & Model': '上游通道与模型',
    'System Prompt': '系统提示词',
    'Temperature': '温度',
    'Max Tokens': '最大 Token',
    'Profile Resolution': '配置档案解析',
    'Usage': '用法',
    'Response Headers': '响应头',
    'Logged Fields': '记录字段',
    'Filtering': '筛选',
    'Setup': '设置',
    'API Token Permissions': 'API Token 权限',
    'How it works': '工作原理',
    'Multi-account stacking': '多账号叠加',
    'Python': 'Python',
    'Node.js / TypeScript': 'Node.js / TypeScript',
    'curl': 'curl',
    'Environment Variables': '环境变量',
    'Add Provider': '添加上游通道',
    'Add Ollama': '添加 Ollama',
    'Auto-detect Local Ollama': '自动检测本地 Ollama',
    'Connect to Ollama running on this machine': '连接本机运行的 Ollama',
    'Or configure manually': '或手动配置',
    'Base URL': '基础 URL',
    'Add Manually': '手动添加',
    'Add Claude': '添加 Claude',
    'Import from this computer': '从本机导入',
    'Auto-detect Claude Code subscription': '自动检测 Claude Code 订阅',
    'Login with another account': '使用其他账号登录',
    'Paste OAuth Token': '粘贴 OAuth Token',
    'Enter API Key': '输入 API Key',
    'Login with': '登录',
    'Use your subscription via OAuth': '通过 OAuth 使用订阅账号',
    'Default Model': '默认模型',
    'Default': '默认',
    'default': '默认',
    'Fetch Models': '拉取模型',
    'Add Provider': '添加上游通道',
    'Opening browser...': '正在打开浏览器...',
    'Sign in to Claude in the browser window...': '请在浏览器窗口中登录 Claude...',
    'Auth failed': '认证失败',
    'Add Claude Account': '添加 Claude 账号',
    'OAuth Token': 'OAuth Token',
    'Refresh Token': '刷新 Token',
    'Enables auto-refresh when the access token expires': '访问令牌过期时可自动刷新',
    'Adding...': '添加中...',
    'Connecting...': '连接中...',
    'No models found — type manually': '未找到模型，请手动输入',
    'Connected': '已连接',
    'Edit Upstream': '编辑上游通道',
    'API Key / OAuth Token': 'API Key / OAuth Token',
    'Only fill if you want to change the credentials': '仅在需要更换凭据时填写',
    'Advanced': '高级',
    'Timeout': '超时',
    'Stream Timeout': '流式超时',
    'Save Changes': '保存更改',
    'Upstream added': '上游通道已添加',
    'Upstream updated': '上游通道已更新',
    'Upstream deleted': '上游通道已删除',
    'Running health checks...': '正在运行健康检查...',
    'Health checks complete': '健康检查完成',
    'Add Profile': '添加配置档案',
    'Slug': 'Slug',
    'Use default (highest priority)': '使用默认（最高优先级）',
    'Loading models...': '正在加载模型...',
    'Profile Instructions': '配置档案指令',
    'Tell the AI how to behave. This is the system prompt injected before every message.': '告诉 AI 应如何响应。此内容会作为系统提示词注入到每次消息之前。',
    '0 = precise, 1 = creative': '0 = 精确，1 = 创意',
    'Create Profile': '创建配置档案',
    'Type model name manually': '手动输入模型名',
    'Could not fetch models — type manually': '无法拉取模型，请手动输入',
    'Profile saved': '配置档案已保存',
    'Edit Profile': '编辑配置档案',
    'Delete this profile?': '删除这个配置档案？',
    'Profile deleted': '配置档案已删除',
    'OpenAI Compatible': '兼容 OpenAI',
    'Anthropic Compatible': '兼容 Anthropic',
    'OpenClaw Key': 'OpenClaw 密钥',
    'Works with any OpenAI SDK or app — /v1/chat/completions': '适用于任意 OpenAI SDK 或应用：/v1/chat/completions',
    'Works with Anthropic SDK — /v1/messages': '适用于 Anthropic SDK：/v1/messages',
    'Profile Access': '配置档案访问权限',
    'All Profiles': '全部配置档案',
    'Generate Key': '生成密钥',
    'Save this key now. It will not be shown again.': '请立即保存此密钥，之后不会再次显示。',
    'Copy Key': '复制密钥',
    'Copied!': '已复制！',
    'Revoke this key? It will stop working immediately.': '撤销这个密钥？它会立即停止工作。',
    'Delete this key permanently?': '永久删除这个密钥？',
    'Settings saved': '设置已保存',
    'Password changed': '密码已修改',
    'Password must be at least 4 characters': '密码至少需要 4 个字符',
    'Cloudflare settings saved': 'Cloudflare 设置已保存',
    'Request ID': '请求 ID',
    'Could fetch detail here, for now just show the request ID': '这里可扩展详情，目前仅显示请求 ID'
  }));

  const regexRules = [
    [/^(\d+)s ago$/, '$1 秒前'],
    [/^(\d+)m ago$/, '$1 分钟前'],
    [/^(\d+)h ago$/, '$1 小时前'],
    [/^(\d+)d ago$/, '$1 天前'],
    [/^(\d+) total requests$/, '$1 个总请求'],
    [/^(\d+) request$/, '$1 个请求'],
    [/^(\d+) requests$/, '$1 个请求'],
    [/^(\d+) upstream configured$/, '$1 个上游通道已配置'],
    [/^(\d+) upstreams configured$/, '$1 个上游通道已配置'],
    [/^(\d+) models available$/, '$1 个模型可用'],
    [/^(\d+) rows$/, '$1 行'],
    [/^(\d+) selected$/, '已选择 $1 项'],
    [/^(\d+) total$/, '总计 $1'],
    [/^Showing (\d+).+?(\d+) of ([\d,]+)$/, '显示 $1-$2，共 $3'],
    [/^Connected \((\d+) conn\)$/, '已连接（$1 个连接）'],
    [/^Connected \((\d+) conns\)$/, '已连接（$1 个连接）']
  ];

  const skipTags = new Set(['SCRIPT', 'STYLE', 'SVG', 'PATH', 'PRE']);
  const codeLike = new Set(['CODE', 'KBD', 'SAMP']);

  function translateText(text) {
    if (currentLang === 'en') return text;
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (!trimmed) return text;
    if (zh.has(trimmed)) return text.replace(trimmed, zh.get(trimmed));
    for (const [pattern, replacement] of regexRules) {
      if (pattern.test(trimmed)) return text.replace(trimmed, trimmed.replace(pattern, replacement));
    }
    return text;
  }

  function shouldSkip(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return true;
    if (el.closest('[data-i18n-skip], pre, .code-block')) return true;
    if (codeLike.has(el.tagName) && !el.classList.contains('badge')) return true;
    return false;
  }

  function translateTextNode(node) {
    if (shouldSkip(node)) return;
    if (node.nodeType !== Node.TEXT_NODE) return;
    if (node.nodeValue.trim() === '') return;
    if (!node.__i18nSource) node.__i18nSource = node.nodeValue;
    node.nodeValue = currentLang === 'en' ? node.__i18nSource : translateText(node.__i18nSource);
  }

  function translateAttr(el, attr) {
    if (!el.hasAttribute(attr) || shouldSkip(el)) return;
    const sourceName = `data-i18n-source-${attr}`;
    if (!el.hasAttribute(sourceName)) el.setAttribute(sourceName, el.getAttribute(attr));
    const source = el.getAttribute(sourceName);
    el.setAttribute(attr, currentLang === 'en' ? source : translateText(source));
  }

  function walk(root) {
    if (!root || applying) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root);
      } else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
        const rootEl = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
        if (rootEl && !skipTags.has(rootEl.tagName || '')) {
          const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
          });
          while (walker.nextNode()) translateTextNode(walker.currentNode);
          const attrNodes = rootEl.querySelectorAll?.('[placeholder], [title], [aria-label], option') || [];
          attrNodes.forEach(el => {
            translateAttr(el, 'placeholder');
            translateAttr(el, 'title');
            translateAttr(el, 'aria-label');
          });
        }
      }
      document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
      document.title = currentLang === 'zh' ? 'Astra Relay 控制台' : 'Astra Relay';
      document.querySelectorAll('[data-lang-option]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.langOption === currentLang);
      });
    } finally {
      applying = false;
    }
  }

  function schedule(root = document.body) {
    if (currentLang === 'en') return;
    window.requestAnimationFrame(() => walk(root));
  }

  function setLanguage(lang) {
    currentLang = lang === 'zh' ? 'zh' : 'en';
    localStorage.setItem(storageKey, currentLang);
    walk(document.body);
  }

  function init() {
    walk(document.body);
    observer = new MutationObserver(mutations => {
      if (applying || currentLang === 'en') return;
      const target = mutations.find(m => m.addedNodes.length)?.target || document.body;
      schedule(target);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.AstraI18n = {
    init,
    setLanguage,
    apply: walk,
    getLanguage: () => currentLang,
  };
})();
