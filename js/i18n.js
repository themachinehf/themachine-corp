// THEMACHINE Corp. Language System
const translations = {
  en: {
    // Navigation
    home: "Home",
    products: "Products",
    pricing: "Pricing",
    about: "About",
    contact: "Contact",
    login: "Login",
    signup: "Sign Up",
    
    // Home
    hero_title: "AI Agents That Actually Work",
    hero_subtitle: "A fully autonomous company operated by intelligent AI agents",
    cta: "Get Started",
    features: "Features",
    autonomous: "Fully Autonomous",
    autonomous_desc: "AI agents that work 24/7 without human intervention",
    secure: "Enterprise Security",
    secure_desc: "Bank-level encryption and security protocols",
    scalable: "Infinitely Scalable",
    scalable_desc: "Grow your operations without limits",
    
    // Products
    mystic_title: "Mystic AI",
    mystic_desc: "AI-powered tarot reading and divination platform",
    forge_title: "FORGE",
    forge_desc: "AI content generation toolkit",
    social_title: "SOCIAL",
    social_desc: "Social media management automation",
    shortform_title: "SHORTFORM",
    shortform_desc: "Short-form content creation assistant",
    
    // Pricing
    monthly: "/month",
    yearly: "/year",
    save: "Save 20%",
    get_started: "Get Started",
    all_access: "All Access Pass",
    
    // Footer
    copyright: "© 2026 THEMACHINE Corp. All rights reserved.",
    
    // Common
    learn_more: "Learn More",
    free_trial: "Free Trial",
    no_card: "No credit card required"
  },
  zh: {
    // Navigation
    home: "首页",
    products: "产品",
    pricing: "价格",
    about: "关于",
    contact: "联系",
    login: "登录",
    signup: "注册",
    
    // Home
    hero_title: "真正工作的AI Agent",
    hero_subtitle: "由智能AI代理运营的全自动化公司",
    cta: "立即开始",
    features: "特性",
    autonomous: "全自动化",
    autonomous_desc: "无需人工干预，AI代理全天候工作",
    secure: "企业级安全",
    secure_desc: "银行级加密和安全协议",
    scalable: "无限扩展",
    scalable_desc: "无限制扩展您的业务",
    
    // Products
    mystic_title: "Mystic AI",
    mystic_desc: "AI驱动的塔罗牌占卜平台",
    forge_title: "FORGE",
    forge_desc: "AI内容生成工具套件",
    social_title: "SOCIAL",
    social_desc: "社交媒体自动化管理",
    shortform_title: "SHORTFORM",
    shortform_desc: "短视频内容创作助手",
    
    // Pricing
    monthly: "/月",
    yearly: "/年",
    save: "省20%",
    get_started: "立即开始",
    all_access: "全通证",
    
    // Footer
    copyright: "© 2026 THEMACHINE Corp. 保留所有权利。",
    
    // Common
    learn_more: "了解更多",
    free_trial: "免费试用",
    no_card: "无需信用卡"
  }
};

// Language state
let currentLang = localStorage.getItem('lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  translatePage();
}

function t(key) {
  return translations[currentLang][key] || translations['en'][key] || key;
}

// Translate entire page
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}

// Initialize
function initI18n() {
  // Add toggle button to all pages
  if (document.getElementById('lang-toggle')) return;
  
  const toggle = document.createElement('button');
  toggle.id = 'lang-toggle';
  toggle.className = 'lang-toggle';
  toggle.innerHTML = currentLang === 'en' ? '中文' : 'EN';
  toggle.onclick = () => {
    setLanguage(currentLang === 'en' ? 'zh' : 'en');
    toggle.innerHTML = currentLang === 'en' ? '中文' : 'EN';
  };
  
  // Add to header
  const header = document.querySelector('header') || document.body;
  if (header) {
    toggle.style.cssText = 'background:transparent;border:1px solid #333;color:#888;padding:4px 8px;border-radius:4px;cursor:pointer;margin-left:10px;font-size:11px;';
    header.appendChild(toggle);
  }
  
  // Translate on load
  translatePage();
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
