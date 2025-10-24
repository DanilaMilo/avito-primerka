// Background script для Chrome расширения "Авито Примерка"

console.log('Авито Примерка: Background script загружен');

// Обработка сообщений от content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Авито Примерка: Получено сообщение:', request);
  
  if (request.action === 'openPopup') {
    console.log('Авито Примерка: Открываем popup');
    
    // Открываем popup расширения
    chrome.action.openPopup().then(() => {
      console.log('Авито Примерка: Popup открыт');
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Авито Примерка: Ошибка открытия popup:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Указываем, что ответ будет асинхронным
  }
  
  if (request.action === 'getProductData') {
    console.log('Авито Примерка: Запрос данных товара');
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Отправляем сообщение в content script для получения данных
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getProductData' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Авито Примерка: Ошибка получения данных товара:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Авито Примерка: Данные товара получены:', response);
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'Активная вкладка не найдена' });
      }
    });
    
    return true; // Указываем, что ответ будет асинхронным
  }
  
  if (request.action === 'getProductImage') {
    console.log('Авито Примерка: Запрос изображения товара');
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Отправляем сообщение в content script для получения изображения
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getProductImage' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Авито Примерка: Ошибка получения изображения товара:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Авито Примерка: Изображение товара получено:', response);
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'Активная вкладка не найдена' });
      }
    });
    
    return true; // Указываем, что ответ будет асинхронным
  }
});

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Авито Примерка: Расширение установлено', details);
});

// Обработка обновления расширения
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Авито Примерка: Доступно обновление', details);
});

// Обработка ошибок
chrome.runtime.onSuspend.addListener(() => {
  console.log('Авито Примерка: Background script приостановлен');
});

console.log('Авито Примерка: Background script инициализирован');
