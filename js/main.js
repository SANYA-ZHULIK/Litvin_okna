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
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });
}
if (menuClose) menuClose.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

// ============================
// REVEAL АНИМАЦИИ
// ============================
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
revealElements.forEach(el => revealObserver.observe(el));

// ============================
// КАЛЬКУЛЯТОР
// ============================
const BASE_PRICE = 9000;   // ₽ за м²
const MOUNT_PRICE = 3200;  // ₽ за монтаж

let multiplierOpen = 1;
let multiplierGlass = 1;
let mountEnabled = true;

function calcUpdate() {
  const w = (document.getElementById('rangeW')?.value || 120) / 100;
  const h = (document.getElementById('rangeH')?.value || 140) / 100;

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

document.addEventListener('DOMContentLoaded', function() {
  calcUpdate();
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    if (!btn.hasAttribute('data-bound')) {
      btn.setAttribute('data-bound', 'true');
      btn.addEventListener('click', function() {
        const groupId = this.closest('.toggle-group')?.id;
        if (groupId && window.setToggle) window.setToggle(groupId, this);
      });
    }
  });
});

// ============================
// КОНФИГУРАЦИЯ
// ============================
const TELEGRAM_CONFIG = {
  botToken: '8990574523:AAFcYLamJ3RSqSZb_eYOPkOYUmxCe6lpkVg',
  chatId: '1117178124'
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywsc0r7Y9v8KvHYd6GEubJyhr7-is0SDu7lXpwu2L4VNk2UdJYd_s3cGbNlwj0FpqX/exec';

// ============================
// ОТПРАВКА В TELEGRAM
// ============================
async function sendToTelegram(formData) {
  const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
  const now = new Date();
  const date = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const text = [
    '*НОВАЯ ЗАЯВКА С САЙТА*',
    '',
    `Имя: ${formData.name}`,
    `Телефон: ${formData.phone}`,
    formData.address ? `Адрес: ${formData.address}` : '',
    formData.message ? `Комментарий: ${formData.message}` : '',
    '',
    `Дата: ${date}`,
    `Время: ${time}`
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const data = await response.json();
    console.log('Telegram:', data.ok ? '✅' : '❌', data);
    return { ok: data.ok === true };
  } catch (error) {
    console.error('Telegram error:', error);
    return { ok: false };
  }
}

// ============================
// ОТПРАВКА В GOOGLE ТАБЛИЦУ
// ============================
async function sendToGoogleSheet(formData) {
  try {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        address: formData.address || '',
        message: formData.message || '',
        date: date,
        time: time
      })
    });
    console.log('✅ Отправлено в Google Таблицу');
    return { ok: true };
  } catch (error) {
    console.error('❌ Google Таблица ошибка:', error);
    return { ok: false };
  }
}

// ============================
// ОБЩАЯ ОТПРАВКА
// ============================
async function sendOrder(formData) {
  const results = {
    telegram: await sendToTelegram(formData),
    google: await sendToGoogleSheet(formData)
  };
  console.log('📦 Результаты отправки:', results);
  return results.telegram.ok || results.google.ok;
}

// ============================
// МОДАЛЬНОЕ ОКНО ФОРМЫ
// ============================
const leadModalOverlay = document.getElementById('leadModalOverlay');
const leadForm = document.getElementById('leadForm');
const formNotificationSlot = document.getElementById('formNotificationSlot');

window.openLeadModal = function() {
  if (!leadModalOverlay) return;
  leadModalOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  // фокус на первое поле
  setTimeout(() => {
    const firstInput = leadForm?.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 350);
};

window.closeLeadModal = function(e) {
  // если передан event от клика по оверлею — закрываем только если клик был по самому оверлею
  if (e && e.target !== leadModalOverlay && e.type === 'click') return;
  if (!leadModalOverlay) return;
  leadModalOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
};

// Закрытие по Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && leadModalOverlay?.classList.contains('open')) {
    closeLeadModal();
  }
});

// ============================
// ОТПРАВКА ФОРМЫ ЗАЯВКИ
// ============================
if (leadForm) {
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('userName')?.value.trim() || '';
    const phone = document.getElementById('userPhone')?.value.trim() || '';
    const address = document.getElementById('userAddress')?.value.trim() || '';
    const message = document.getElementById('userMessage')?.value.trim() || '';

    if (!name || !phone) {
      showNotification('Пожалуйста, укажите имя и телефон', 'error');
      return;
    }
    if (!/^[\d\s\+\-\(\)]{10,}$/.test(phone)) {
      showNotification('Проверьте номер телефона', 'error');
      return;
    }

    if (!document.getElementById('userConsent')?.checked) {
      showNotification('Необходимо согласие на обработку персональных данных', 'error');
      return;
    }

    const submitBtn = leadForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const ok = await sendOrder({ name, phone, address, message });
      if (ok) {
        showNotification('Спасибо! Я свяжусь с вами в ближайшее время.', 'success');
        leadForm.reset();
        setTimeout(() => closeLeadModal(), 2500);
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Form error:', error);
      showNotification('Произошла ошибка. Позвоните по номеру +7 (915) 339-65-65', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.textContent = isLoading ? 'Отправка...' : (btn.dataset.originalText || 'Отправить');
}

function showNotification(message, type = 'success') {
  if (!formNotificationSlot) return;
  formNotificationSlot.innerHTML = '';
  const notification = document.createElement('div');
  notification.className = `form-notification form-notification--${type}`;
  notification.innerHTML = type === 'success'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ${message}`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
  formNotificationSlot.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ============================
// КНОПКА НАВЕРХ
// ============================
const scrollTopBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
  if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
});

// ============================
// ПРОЗРАЧНАЯ ШАПКА
// ============================
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================
// ЛОУДЕР
// ============================
window.addEventListener('load', function() {
  const loader = document.getElementById('loaderWrapper');
  if (loader) setTimeout(() => loader.classList.add('hide'), 800);
});

// ============================
// ОТЗЫВЫ
// ============================
const REVIEWS = [
  { initials: 'АК', author: 'Анна К.',   date: 'Митино, июнь 2025',     stars: 5, text: 'Поставили три окна за один день. Замерили быстро, цена совпала с предварительным расчётом. Никаких скрытых платежей, всё чётко.' },
  { initials: 'ДМ', author: 'Дмитрий М.', date: 'Химки, май 2025',        stars: 5, text: 'Остеклили лоджию тёплым вариантом. Теперь это полноценная комната, не дует даже зимой. Работают аккуратно, убрали за собой.' },
  { initials: 'ЕС', author: 'Елена С.',   date: 'Зеленоград, апрель 2025', stars: 5, text: 'Заказала натяжной потолок с подсветкой. Мастер приехал в удобное время, монтаж занял 4 часа. Выглядит очень современно.' },
  { initials: 'ИП', author: 'Игорь П.',   date: 'Куркино, март 2025',    stars: 5, text: 'Делали балкон под ключ — вынос, утепление, остекление. Сроки держали, качество отличное. Рекомендую.' },
  { initials: 'МН', author: 'Марина Н.',  date: 'Строгино, февраль 2025', stars: 5, text: 'Заменили все окна в квартире. Старые рамы вынесли, новые поставили, остатки убрали. Очень довольна результатом.' },
  { initials: 'СВ', author: 'Сергей В.',  date: 'Москва, январь 2025',   stars: 5, text: 'Гарантия 5 лет — это звучит уверенно. Окна стоят уже полгода, проблем нет. Зимой стало значительно теплее.' }
];

function getRandomReviews(count) {
  const shuffled = [...REVIEWS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  grid.style.opacity = '0';
  grid.style.transform = 'translateY(12px)';
  grid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  setTimeout(() => {
    grid.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${r.initials}</div>
          <div class="review-meta">
            <div class="review-author">${r.author}</div>
            <div class="review-date">${r.date}</div>
          </div>
        </div>
        <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        <p class="review-text">${r.text}</p>
      </div>
    `).join('');
    grid.style.opacity = '1';
    grid.style.transform = 'translateY(0)';
  }, 300);
}

function shuffleReviews() {
  renderReviews(getRandomReviews(3));
}

document.addEventListener('DOMContentLoaded', function() {
  shuffleReviews();
  setInterval(shuffleReviews, 5000);
});