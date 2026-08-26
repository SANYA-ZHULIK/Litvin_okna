// ============================
// МОБИЛЬНОЕ МЕНЮ
// ============================
const menuOpen = document.getElementById('menuOpen');
const menuClose = document.getElementById('menuClose');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu() {
  mobileMenu.classList.add('open');
  menuOverlay.classList.add('open');
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  menuOverlay.classList.remove('open');
}

if (menuOpen) {
  menuOpen.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
}
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

// ============================
// REVEAL АНИМАЦИИ ПРИ СКРОЛЛЕ
// ============================
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));

// ============================
// КАЛЬКУЛЯТОР
// ============================
const BASE_PRICE = 9000;
const MOUNT_PRICE = 3200;

let multiplierOpen = 1;
let multiplierGlass = 1;
let mountEnabled = true;

function calcUpdate() {
  const w = document.getElementById('rangeW')?.value / 100 || 1.2;
  const h = document.getElementById('rangeH')?.value / 100 || 1.4;
  
  const valW = document.getElementById('valW');
  const valH = document.getElementById('valH');
  if (valW) valW.innerText = Math.round(w * 100);
  if (valH) valH.innerText = Math.round(h * 100);
  
  const area = w * h;
  const winPrice = Math.round(area * BASE_PRICE * multiplierOpen * multiplierGlass);
  const total = winPrice + (mountEnabled ? MOUNT_PRICE : 0);
  
  const calcPrice = document.getElementById('calcPrice');
  if (calcPrice) calcPrice.innerHTML = total.toLocaleString('ru-RU') + ' <span>₽</span>';
}

window.setToggle = function(groupId, btn) {
  const buttons = document.querySelectorAll(`#${groupId} .toggle-btn`);
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const val = parseFloat(btn.dataset.val);
  if (groupId === 'openType') multiplierOpen = val;
  if (groupId === 'glassType') multiplierGlass = val;
  if (groupId === 'mountType') mountEnabled = val === 1;
  
  calcUpdate();
};

const rangeW = document.getElementById('rangeW');
const rangeH = document.getElementById('rangeH');

if (rangeW) rangeW.addEventListener('input', calcUpdate);
if (rangeH) rangeH.addEventListener('input', calcUpdate);

// Дополнительная привязка для надёжности
document.addEventListener('DOMContentLoaded', function() {
  calcUpdate();
  
  // На случай, если onclick не сработает
  const allToggleBtns = document.querySelectorAll('.toggle-btn');
  allToggleBtns.forEach(btn => {
    if (!btn.hasAttribute('data-bound')) {
      btn.setAttribute('data-bound', 'true');
      btn.addEventListener('click', function(e) {
        const groupId = this.closest('.toggle-group')?.id;
        if (groupId && window.setToggle) {
          window.setToggle(groupId, this);
        }
      });
    }
  });
});

// Конфигурация Telegram бота
// Замените на свои данные: chat_id и token вашего бота
const TELEGRAM_CONFIG = {
  botToken: '8990574523:AAFcYLamJ3RSqSZb_eYOPkOYUmxCe6lpkVg',
  chatId: '1117178124',
  sendMessageUrl: 'https://api.telegram.org/bot{token}/sendMessage'
};

// ============================
// ОТПРАВКА ЗАЯВКИ В TELEGRAM
// ============================
async function sendToTelegram(formData) {
  const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
  
  const text = [
    'Новая заявка с сайта',
    '',
    `Имя: ${formData.name}`,
    `Телефон: ${formData.phone}`,
    formData.address ? `Адрес: ${formData.address}` : '',
    formData.message ? `Комментарий: ${formData.message}` : '',
    '',
    `Время: ${new Date().toLocaleString('ru-RU')}`
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: text
      })
    });

    const data = await response.json();
    console.log('Telegram API ответ:', {
      status: response.status,
      ok: data.ok,
      description: data.description,
      full: data
    });
    
    return {
      ok: data.ok === true || data.ok === 1 || String(data.ok) === 'true' || data.message_id,
      raw: data
    };
  } catch (error) {
    console.error('Ошибка сети при отправке в Telegram:', error);
    return {
      ok: false,
      raw: { error: error.message }
    };
  }
}

// ============================
// ФОРМА В ГЕРОЕ (если есть)
// ============================
const heroForm = document.getElementById('heroForm');

if (heroForm) {
  heroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('heroName')?.value.trim() || '';
    const phone = document.getElementById('heroPhone')?.value.trim() || '';
    const address = document.getElementById('heroAddress')?.value.trim() || '';
    
    if (!name || !phone) {
      alert('Пожалуйста, укажите имя и телефон');
      return;
    }
    
    const submitBtn = heroForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
      const result = await sendToTelegram({ name, phone, address });
      if (result.ok) {
        showNotification('Спасибо! Я свяжусь с вами в ближайшее время.', 'success');
        heroForm.reset();
      } else {
        console.error('Telegram API error:', result.raw);
        throw new Error(result.raw.description || 'Не удалось отправить');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showNotification('Произошла ошибка. Позвоните по номеру +7 (999) 123-45-67', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ============================
// ОСНОВНАЯ ФОРМА ЗАЯВОК
// ============================
const leadForm = document.getElementById('leadForm');
const successMessage = document.getElementById('formSuccess');

if (leadForm) {
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('userName')?.value.trim() || '';
    const phone = document.getElementById('userPhone')?.value.trim() || '';
    const address = document.getElementById('userAddress')?.value.trim() || '';
    const message = document.getElementById('userMessage')?.value.trim() || '';
    
    if (!name || !phone) {
      alert('Пожалуйста, укажите имя и телефон');
      return;
    }
    
    const submitBtn = leadForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
      const result = await sendToTelegram({ name, phone, address, message });
      if (result.ok) {
        showNotification('Спасибо! Я свяжусь с вами в ближайшее время.', 'success');
        leadForm.reset();
      } else {
        console.error('Telegram API error:', result.raw);
        throw new Error(result.raw.description || 'Не удалось отправить');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showNotification('Произошла ошибка. Позвоните по номеру +7 (999) 123-45-67', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.dataset.originalText = btn.textContent;
  btn.textContent = isLoading ? 'Отправка...' : btn.dataset.originalText;
}

function showNotification(message, type = 'success') {
  const existing = document.querySelector('.form-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `form-notification form-notification--${type}`;
  notification.innerHTML = type === 'success' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ${message}`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
  
  notification.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    border-radius: 10px;
    margin-top: 16px;
    font-family: 'Manrope', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  
  if (type === 'success') {
    notification.style.cssText += `
      background: rgba(197, 227, 132, 0.15);
      color: #c5e384;
      border: 1px solid rgba(197, 227, 132, 0.3);
    `;
  } else {
    notification.style.cssText += `
      background: rgba(248, 61, 61, 0.15);
      color: #F83D3D;
      border: 1px solid rgba(248, 61, 61, 0.3);
    `;
  }
  
  const formSection = document.getElementById('form-section');
  formSection.querySelector('.form-container').appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Добавить стили для анимации
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// ============================
// ПРОКРУТКА К ФОРМЕ
// ============================
window.scrollToForm = function() {
  const formSection = document.getElementById('form-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth' });
  }
};

// ============================
// КНОПКА НАВЕРХ
// ============================
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  if (scrollTopBtn) {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
  }
});

// ============================
// ПРОЗРАЧНАЯ ШАПКА ПРИ СКРОЛЛЕ
// ============================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ============================
// ЛОУДЕР
// ============================
window.addEventListener('load', function() {
  const loader = document.getElementById('loaderWrapper');
  if (loader) {
    setTimeout(function() {
      loader.classList.add('hide');
    }, 800);
  }
});