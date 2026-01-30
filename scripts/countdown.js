


// Обратный отсчёт до 27 февраля 2026, 15:30
document.addEventListener('DOMContentLoaded', function () {
  const targetDate = new Date('2026-02-27T15:30:00').getTime();

  const daysEl = document.querySelector('.days');
  const hoursEl = document.querySelector('.hours');
  const minutesEl = document.querySelector('.minutes');
  const secondsEl = document.querySelector('.seconds');

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff < 0) {
      // Дата прошла
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // Обновляем сразу
  updateCountdown();

  // Каждую секунду
  const timer = setInterval(updateCountdown, 1000);

  // Оптимизация: останавливаем таймер при уходе со страницы
  window.addEventListener('beforeunload', () => clearInterval(timer));
});

// === Копирование номера ===
document.getElementById('copyBtn')?.addEventListener('click', function () {
  const text = '+7 (923) 368-15-11';
  navigator.clipboard.writeText(text).then(() => {
    const original = this.innerHTML;
    this.innerHTML = '<span>✓ Скопировано!</span>';
    setTimeout(() => {
      this.innerHTML = original;
    }, 2000);
  }).catch(err => {
    console.error('Не удалось скопировать: ', err);
  });
});


// === RSVP ===
let formData = {
  name: '',
  presence: null, // true / false
  willDrink: null, // true / false
  alcohol: []
};

function showStep(stepId) {
  document.querySelectorAll('.rsvp-step').forEach(el => el.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}

function nextStep(currentStep) {
  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  
  if (currentStep === 1) {
    if (!name) {
      nameInput.style.borderColor = 'red';
      setTimeout(() => nameInput.style.borderColor = '#ddd', 1500);
      return;
    }
    formData.name = name;
    showStep('step-2');
  }
}

function handlePresence(isComing) {
  formData.presence = isComing;
  if (!isComing) {
    showStep('step-no');
    // Можно отправить данные на сервер: { name, presence: false }
    return;
  }
  showStep('step-3');
}

function handleAlcohol(willDrink) {
  formData.willDrink = willDrink;
  if (!willDrink) {
    showStep('step-thanks');
    // Отправить: { name, presence: true, willDrink: false }
    return;
  }
  showStep('step-4');
}



// === Настройки Telegram ===
const TELEGRAM_TOKEN = '8276352941:AAE53CQ8YU2KQQZ6WzhP4YizX8pl6_TJWb8'; // ← замените!
const TELEGRAM_CHAT_ID = '594146160';  // ← замените!

async function sendToTelegram(data) {
  const message = `
💍 *Свадьба Светланы и Вячеслава 27.02.2026*  
👤 Имя: ${data.name}
✅ Присутствие: ${data.presence ? 'Да' : 'Нет'}
🍷 Алкоголь: ${data.willDrink !== null ? (data.willDrink ? 'Да' : 'Нет') : '—'}
🍸 Предпочтения: ${data.alcohol.length ? data.alcohol.join(', ') : '—'}
📅 ${new Date().toLocaleString('ru-RU')}
  `.trim();

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // ✅ Успех — продолжаем как раньше
    return true;

  } catch (err) {
    console.error('❌ Ошибка отправки в Telegram:', err);

    // ❗ Показываем пользователю дружелюбное сообщение
    const errorMsg = document.createElement('div');
    errorMsg.className = 'alert alert-danger rsvp-alert mt-3 mx-auto';
    errorMsg.style.maxWidth = '500px';
    errorMsg.innerHTML = `
      <strong>Ой!</strong> Что-то пошло не так 😕<br>
      Попробуйте позже или напишите Вячеславу лично.
    `;
    
    // Вставляем под кнопкой (или под формой)
    const currentStep = document.querySelector('.rsvp-step.active');
    currentStep.appendChild(errorMsg);

    // Авто-скрытие через 5 секунд (опционально)
    setTimeout(() => {
      errorMsg.style.opacity = '0';
      errorMsg.style.transition = 'opacity 0.5s';
      setTimeout(() => errorMsg.remove(), 500);
    }, 5000);

    return false;
  }
}

// === Обновлённые функции ===
function handlePresence(isComing) {
  formData.presence = isComing;
  formData.willDrink = null;
  formData.alcohol = [];

  // Отправляем сразу при отказе
  if (!isComing) {
    sendToTelegram(formData);
    showStep('step-no');
    return;
  }
  showStep('step-3');
}

function handleAlcohol(willDrink) {
  formData.willDrink = willDrink;
  formData.alcohol = [];

  if (!willDrink) {
    sendToTelegram(formData);
    showStep('step-thanks');
    return;
  }
  showStep('step-4');
}


function submitForm() {
  const checkboxes = document.querySelectorAll('#step-4 .form-check-input:checked');
  formData.alcohol = Array.from(checkboxes).map(cb => cb.value);

  sendToTelegram(formData);
  showStep('step-thanks');
}

// === Режим подтверждения по ссылке (ConfirmSession) ===
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const isConfirmSession = urlParams.get('ConfirmSession') === 'true';
  const rawName = urlParams.get('name');
  const guestName = rawName 
    ? decodeURIComponent(rawName.replace(/\+/g, ' ')) 
    : 'родные и близкие';

  if (isConfirmSession) {
    document.body.classList.add('confirm-session-mode');

    const overlay = document.createElement('div');
    overlay.className = 'confirm-session-overlay';
    overlay.innerHTML = `
      <h2 class="confirm-session-title">${guestName}!<br>Подтвердите, пожалуйста, участие на нашей свадьбе</h2>
      <div class="confirm-buttons">
        <button id="confirmBtn">Подвердить участие!</button>
        <button id="declineBtn">Не смогу присутствовать</button>
      </div>
      <div id="result"></div>
    `;
    document.body.appendChild(overlay);

    // Общая функция отправки статуса
    async function sendStatus(statusText) {
      const message = `
💍 *Свадьба Светланы и Вячеслава — 27.02.2026*  
Подтверждение участия

👤 Имя: ${guestName}
📊 Ответ: ${statusText}
📅 Дата: ${new Date().toLocaleString('ru-RU')}
      `.trim();

      const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
          })
        });

        const resultDiv = document.getElementById('result');
        if (response.ok) {
          document.querySelector('.confirm-buttons').style.display = 'none';
          resultDiv.innerHTML = statusText === 'Подвердить участие!'
            ? '<h2 class="confirm-session-title">Спасибо за подтверждение! ❤️<br>Мы будем ждать вас!</h2>'
            : '<h2 class="confirm-session-title">Жаль, что вы не сможете прийти 😢<br>Но спасибо, что сообщили!</h2>';
        } else {
          throw new Error('Ошибка Telegram API');
        }
      } catch (err) {
        console.error('Ошибка отправки:', err);
        document.getElementById('result').innerHTML = '❌ Не удалось отправить. Попробуйте позже.';
      }
    }

    // Кнопка "Подтверждаю"
    document.getElementById('confirmBtn').addEventListener('click', () => {
      sendStatus('Подвердить участие!');
    });

    // Кнопка "Не смогу"
    document.getElementById('declineBtn').addEventListener('click', () => {
      sendStatus('Не смогу присутствовать');
    });
  }
});

