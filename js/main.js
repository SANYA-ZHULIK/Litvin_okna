// МОБИЛЬНОЕ МЕНЮ
// ============================
const menuOpen = document.getElementById('menuOpen');
const menuClose = document.getElementById('menuClose');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu() {
  mobileMenu.classList.add('open');
  menuOverlay.classList.add('open');
  document.body.classList.add('menu-open');
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  menuOverlay.classList.remove('open');
  document.body.classList.remove('menu-open');
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
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

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
        showNotification('Спасибо! С вами свяжуться в ближайшее время.', 'success');
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
  { initials: 'АК', author: 'Elena',   date: 'Митино, июнь 2025',     stars: 5, text: 'Поставили три окна за один день. Замерили быстро, цена совпала с предварительным расчётом. Никаких скрытых платежей, всё чётко.' },
  { initials: 'ДМ', author: 'Dimon Limon', date: 'Химки, май 2026',        stars: 5, text: 'Остеклили лоджию тёплым вариантом. Теперь это полноценная комната, не дует даже зимой. Работают аккуратно, убрали за собой.' },
  { initials: 'ЕС', author: 'Елена Козлова',   date: 'Зеленоград, апрель 2023', stars: 5, text: 'Заказала натяжной потолок с подсветкой. Мастер приехал в удобное время, монтаж занял 4 часа. Выглядит очень современно.' },
  { initials: 'ИП', author: 'Игорь Павлов',   date: 'Куркино, март 2023',    stars: 4, text: 'Делали балкон под ключ — вынос, утепление, остекление. Сроки держали, качество отличное. Рекомендую.' },
  { initials: 'МН', author: 'Victorovna',  date: 'Строгино, февраль 2024', stars: 5, text: 'Заменили все окна в квартире. Старые рамы вынесли, новые поставили, остатки убрали. Очень довольна результатом.' },

  

{ initials: 'МН', author: '_Seleba_', date: 'Алексеевский, март 2024', stars: 5, text: 'Наконец-то поменяли окна, которые уже давно просились на замену. Ребята приехали вовремя, всё сделали за день. После себя даже мусор собрали.' },
{ initials: 'СГ', author: 'Санин Георгий', date: 'Строгино, июнь 2026', stars: 5, text: 'Заказывал окна в две комнаты. С замером проблем не было, всё объяснили по-человечески, без навязывания лишнего. Поставили нормально, ничего не дует.' },
{ initials: 'ФВ', author: 'Фитин Виктор', date: 'Братеево, август 2023', stars: 5, text: 'Обращался по совету знакомого. Нужно было заменить старые окна в квартире. Сделали быстро, аккуратно, откосы тоже привели в порядок. В целом остался доволен.' },
{ initials: 'К', author: 'Кирилл', date: 'Донской, сентябрь 2025', stars: 5, text: 'Всё прошло без каких-то приключений)) Приехали, замерили, через время приехали уже ставить. Окна стоят ровно, ручки работают, нигде не продувает.' },
{ initials: 'Н', author: 'Ника', date: 'Замоскворечье, октябрь 2022', stars: 5, text: 'Ставили окна ещё в 2022 году, решила оставить отзыв спустя время. За всё это время никаких проблем не появилось. Зимой действительно стало намного теплее.' },
{ initials: 'Е', author: 'Елисей', date: 'Ховрино, март 2022', stars: 5, text: 'Нужно было быстро поменять окно в детской. Сроки были важны, потому что дома маленький ребёнок. Справились довольно быстро, результатом довольны.' },
{ initials: 'ГВ', author: 'Гаврин В.', date: 'Царицыно, июль 2024', stars: 5, text: 'Хорошая работа. Отдельно понравилось, что мастера не торопились лишь бы закончить, а нормально всё проверили после установки. Окно открывается и закрывается без проблем.' },
{ initials: 'С', author: 'Сава', date: 'Черёмушки, август 2026', stars: 5, text: 'Поменяли балконный блок и окно на кухне. По цене вышло примерно так, как и рассчитывали изначально. Монтажники адекватные, сделали всё за один день.' },
{ initials: 'АС', author: 'Алексей С.', date: 'Отрадное, ноябрь 2025', stars: 4, text: 'В целом всё хорошо. Самими окнами и установкой доволен, но пришлось немного подождать по срокам. В остальном вопросов нет, мастера сделали аккуратно.' },
{ initials: 'Л', author: 'Лера', date: 'Сокол, май 2024', stars: 5, text: 'Заказывала окно в спальню. Очень переживала за монтаж, потому что раньше был неудачный опыт. Здесь всё прошло спокойно, старое окно сняли, новое поставили, квартиру не разворотили :)' },
{ initials: 'РК', author: 'Роман К.', date: 'Таганский, декабрь 2023', stars: 5, text: 'Меняли окна во всей квартире. Работы получилось много, но ребята закончили за два дня. После установки всё показали, рассказали как ухаживать. Пока нареканий нет.' },
{ initials: 'А', author: 'Алина', date: 'Марфино, февраль 2025', stars: 5, text: 'Очень боялась, что будет куча пыли и грязи. На удивление, после монтажа всё убрали, мне осталось только протереть подоконник. Окном довольна.' },
{ initials: 'ДП', author: 'Денис П.', date: 'Люблино, октябрь 2024', stars: 4, text: 'Нормальная компания, работу сделали хорошо. По срокам немного задержались, поэтому 4 звезды. Сам монтаж без вопросов, всё аккуратно.' },
{ initials: 'В', author: 'Виктор', date: 'Раменки, январь 2026', stars: 5, text: 'Поставили три окна за один день. Я даже не ожидал, что так быстро получится. Ребята знают свою работу, всё подогнали, проверили и объяснили.' },
{ initials: 'ОК', author: 'Ольга К.', date: 'Кунцево, июнь 2023', stars: 5, text: 'Заказывали окно на кухню и балконную дверь. Сначала хотели только окно, но после замера решили поменять всё сразу. Получилось хорошо, стало заметно тише.' },
{ initials: 'М', author: 'Макс', date: 'Печатники, апрель 2022', stars: 5, text: 'Прошло уже достаточно времени после установки, поэтому пишу не сразу. Окна как новые, ничего не разболталось, зимой тепло. Спасибо мастерам.' },
{ initials: 'Ю', author: 'Юлия', date: 'Бибирево, сентябрь 2025', stars: 5, text: 'Всё понравилось. От первого звонка до установки общались нормально, без каких-то странностей. Окно поставили аккуратно, подоконник тоже сделали.' },
{ initials: 'НВ', author: 'Николай В.', date: 'Фили, февраль 2024', stars: 5, text: 'Меняли старые деревянные окна на пластиковые. Разница огромная, особенно по шуму с улицы. Монтажники приехали вовремя и всё сделали за день.' },
{ initials: 'КМ', author: 'Ксения М.', date: 'Измайлово, июль 2026', stars: 5, text: 'Обращались второй раз, теперь уже для родителей. Первый заказ был несколько лет назад. В этот раз тоже всё нормально, поэтому решила написать отзыв.' },
{ initials: 'П', author: 'Павел', date: 'Южное Бутово, март 2023', stars: 5, text: 'Нужно было заменить одно окно, без большого заказа. Тем не менее отнеслись нормально, не было ощущения, что маленький заказ никому не нужен. Сделали хорошо.' },
{ initials: 'Т', author: 'Татьяна', date: 'Северное Медведково, ноябрь 2024', stars: 5, text: 'Окна заказывала для мамы. Сама присутствовать при монтаже не смогла, но всё сделали как договаривались. Мама сказала, что мастера хорошие и аккуратные.' },
{ initials: 'И', author: 'Илья', date: 'Выхино, май 2025', stars: 4, text: 'По самой работе претензий нет, окно поставили хорошо. Немного затянули с датой установки, поэтому снимаю одну звезду. В остальном всё устроило.' },
{ initials: 'АВ', author: 'Андрей В.', date: 'Ясенево, август 2023', stars: 5, text: 'Хорошо сделали, что ещё сказать. Старое окно демонтировали, новое поставили, откосы сделали. После дождя нигде не течёт, зимой тоже всё было нормально.' },
{ initials: 'Р', author: 'Рита', date: 'Солнцево, октябрь 2022', stars: 5, text: 'Заказывали остекление лоджии. Получилось намного лучше, чем я представляла. Теперь там можно нормально находиться даже в прохладную погоду.' },
  
  { initials: 'СВ', author: 'Васецкий Сергей',  date: 'Москва, январь 2022',   stars: 4, text: 'Гарантия 5 лет — это звучит уверенно. Окна стоят уже полгода, проблем нет. Зимой стало значительно теплее.' }
];



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
// ============================
// ПОКАЗ ОТЗЫВОВ ПО ПОРЯДКУ
// ============================

let reviewsIndex = 0;
const reviewsPerPage = 3;
const reviewsInterval = 10000;

function showNextReviews() {
  if (!REVIEWS.length) return;

  // Берём следующие 3 отзыва
  const currentReviews = [];

  for (let i = 0; i < reviewsPerPage; i++) {
    currentReviews.push(
      REVIEWS[(reviewsIndex + i) % REVIEWS.length]
    );
  }

  renderReviews(currentReviews);

  // Переходим к следующей тройке
  reviewsIndex += reviewsPerPage;

  // Если дошли до конца — начинаем сначала
  if (reviewsIndex >= REVIEWS.length) {
    reviewsIndex = 0;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Сначала показываем первые 3
  showNextReviews();

  // Затем каждые 5 секунд следующие 3
  setInterval(showNextReviews, reviewsInterval);
});

// ============================
// ГАЛЕРЕЯ РАБОТ: у каждой работы несколько фото
// ============================
(function () {
  const cards = Array.from(document.querySelectorAll('.work-card'));
  const lb = document.getElementById('lightbox');
  if (!cards.length || !lb) return;

  const img = lb.querySelector('.lightbox-img');
  const counter = lb.querySelector('.lightbox-counter');
  const captionEl = lb.querySelector('.lightbox-caption');
  const thumbsEl = lb.querySelector('.lightbox-thumbs');
  const btnClose = lb.querySelector('.lightbox-close');
  const btnPrev = lb.querySelector('.lightbox-prev');
  const btnNext = lb.querySelector('.lightbox-next');

  let photos = [];   // фото открытой работы
  let current = 0;
  let activeCard = null;
  let animating = false;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const wrap = (i) => (i + photos.length) % photos.length;

  // Список фото работы: обложка + data-photos.
  // Имена без папки (например, "rehau_803.jpg") берутся из той же папки, что и обложка.
  // Обложку не обязательно дублировать в data-photos: она всегда идёт первой.
  function getPhotos(card) {
    const cover = card.querySelector('img');
    const coverSrc = cover ? (cover.getAttribute('src') || '') : '';
    const dir = coverSrc.includes('/') ? coverSrc.slice(0, coverSrc.lastIndexOf('/') + 1) : '';
    const list = (card.dataset.photos || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.includes('/') ? s : dir + s));
    if (coverSrc) list.unshift(coverSrc);
    return Array.from(new Set(list));
  }

  // проверяем, что файл есть: несуществующие фото в просмотр не попадут
  function probe(src) {
    return new Promise((resolve) => {
      const test = new Image();
      test.onload = () => resolve(src);
      test.onerror = () => {
        console.warn('Фото не найдено (проверьте путь и регистр имени):', test.src);
        resolve(null);
      };
      test.src = src;
    });
  }

  // обложки без файла = заготовки
  function markNoPhoto(card) {
    card.classList.add('no-photo');
    const cover = card.querySelector('img');
    if (cover) cover.style.display = 'none';
    const badge = card.querySelector('.work-count');
    if (badge) badge.remove();
  }

  // Обложка не загрузилась: пробуем следующие фото этой работы, и если ни одного нет, показываем заготовку
  async function recoverCover(card, cover) {
    const failed = cover.getAttribute('src');
    for (const src of getPhotos(card).filter((s) => s !== failed)) {
      if (await probe(src)) { cover.src = src; return; }
    }
    markNoPhoto(card);
  }

  cards.forEach((card) => {
    const cover = card.querySelector('img');
    if (!cover) return markNoPhoto(card);

    cover.addEventListener('error', () => {
      console.warn('Обложка не найдена (проверьте путь и регистр имени):', cover.src);
      recoverCover(card, cover);
    });
    if (cover.complete && cover.naturalWidth === 0 && cover.getAttribute('src')) recoverCover(card, cover);

    // значок с количеством фото (по списку в HTML)
    const count = getPhotos(card).length;
    if (count > 1) {
      const badge = document.createElement('span');
      badge.className = 'work-count';
      badge.innerHTML = '<i class="fa fa-images"></i> ' + count;
      badge.setAttribute('aria-label', count + ' фото');
      card.appendChild(badge);
    }
  });

  // ---------- положение и анимация фото ----------
  function setImg(x, opacity, animate) {
    img.style.transition = animate
      ? 'transform 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.26s ease'
      : 'none';
    img.style.transform = 'translate3d(' + x + 'px, 0, 0)';
    img.style.opacity = opacity;
  }

  // просто показать фото с номером i (без анимации)
  function show(i) {
    if (!photos.length) return;
    current = wrap(i);
    img.src = photos[current];
    const title = activeCard.querySelector('.work-title');
    img.alt = (title ? title.textContent : 'Фото работы') + ', фото ' + (current + 1);
    counter.textContent = photos.length > 1 ? (current + 1) + ' / ' + photos.length : '';
    btnPrev.hidden = btnNext.hidden = photos.length < 2;

    Array.from(thumbsEl.children).forEach((t, idx) => {
      t.classList.toggle('active', idx === current);
      if (idx === current) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  // листание с анимацией: dir = 1 (дальше, фото уезжает влево) или -1 (назад)
  async function slideTo(index, dir) {
    if (animating || photos.length < 2) return;
    if (reduceMotion) { show(index); return; }
    animating = true;
    const shift = window.innerWidth * 0.45;

    setImg(-dir * shift, 0, true);            // 1. текущее фото уезжает и гаснет
    await wait(240);
    if (!lb.classList.contains('open')) { animating = false; return; }

    show(index);                               // 2. меняем фото
    try { await img.decode(); } catch (e) {}
    setImg(dir * shift, 0, false);             //    ставим его с противоположной стороны
    img.getBoundingClientRect();               //    (чтобы браузер применил позицию без анимации)

    setImg(0, 1, true);                        // 3. новое фото выезжает на место
    await wait(260);
    animating = false;
  }

  const goNext = () => slideTo(current + 1, 1);
  const goPrev = () => slideTo(current - 1, -1);

  function buildCaption(card) {
    captionEl.replaceChildren();
    const cap = card.querySelector('.work-caption');
    if (cap) Array.from(cap.children).forEach((n) => captionEl.appendChild(n.cloneNode(true)));
  }

  function buildThumbs() {
    thumbsEl.replaceChildren();
    if (photos.length < 2) return;
    photos.forEach((src, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lightbox-thumb';
      b.setAttribute('aria-label', 'Фото ' + (idx + 1));
      const t = document.createElement('img');
      t.src = src;
      t.alt = '';
      b.appendChild(t);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (idx !== current) slideTo(idx, idx > current ? 1 : -1);
      });
      thumbsEl.appendChild(b);
    });
  }

  async function openWork(card) {
    const found = await Promise.all(getPhotos(card).map(probe));
    photos = found.filter(Boolean);
    if (!photos.length) return;
    activeCard = card;
    animating = false;
    setImg(0, 1, false);
    buildCaption(card);
    buildThumbs();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    show(0);
    btnClose.focus();
  }

  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    animating = false;
  }

  cards.forEach((card) => card.addEventListener('click', () => {
    if (card.classList.contains('no-photo')) return;
    openWork(card);
  }));
  btnClose.addEventListener('click', closeLb);
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  // ---------- свайп: фото едет за пальцем ----------
  let startX = null, startY = 0, dragX = 0, axis = null;

  lb.addEventListener('touchstart', (e) => {
    startX = null;
    if (animating || e.touches.length > 1) return;
    // полоску миниатюр и кнопки не считаем свайпом по фото
    if (e.target.closest('.lightbox-thumbs, .lightbox-nav, .lightbox-close')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragX = 0;
    axis = null;
  }, { passive: true });

  lb.addEventListener('touchmove', (e) => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (axis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis !== 'x') return;
    dragX = photos.length > 1 ? dx : dx * 0.25;   // если фото одно, фото лишь слегка «пружинит»
    const fade = 1 - Math.min(Math.abs(dragX) / (window.innerWidth * 0.9), 0.45);
    setImg(dragX, fade, false);
  }, { passive: true });

  function endSwipe() {
    if (startX === null) return;
    const dx = dragX, wasHorizontal = axis === 'x';
    startX = null; axis = null; dragX = 0;
    if (!wasHorizontal) return;
    const threshold = Math.min(70, window.innerWidth * 0.18);
    if (photos.length > 1 && Math.abs(dx) > threshold) {
      slideTo(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    } else {
      setImg(0, 1, true);                         // не дотянули: возвращаем на место
    }
  }
  lb.addEventListener('touchend', endSwipe);
  lb.addEventListener('touchcancel', endSwipe);
})();