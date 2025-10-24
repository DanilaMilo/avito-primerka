// Popup script для обработки загрузки фото и генерации примерки

console.log('Авито Примерка: Popup загружен');

// API ключ OpenRouter (замените на свой)
const OPENROUTER_API_KEY = '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';

// Состояние приложения
let productData = null;
let userImage = null;
let currentCategory = 'other';
let generatedResult = null; // Добавляем для сохранения результата

// Настройки оптимизации изображений
const IMAGE_OPTIMIZATION = {
  maxWidth: 1024,        // Максимальная ширина
  maxHeight: 1024,       // Максимальная высота
  quality: 0.8,          // Качество JPEG (0.1 - 1.0)
  maxFileSize: 500000,   // Максимальный размер файла в байтах (500KB)
  enableOptimization: true, // Включить оптимизацию
  aspectRatio: '1:1'     // Соотношение сторон для генерации (1:1, 16:9, 4:3, etc.)
};

// Настройки API для экономии расходов
const API_OPTIMIZATION = {
  maxTokens: 50,         // Ограничение токенов в ответе
  temperature: 0.7,       // Снижение для предсказуемости
  topP: 0.8,             // Ограничение выбора токенов
  verbosity: 'low'       // Краткие ответы
};

// Функции для сохранения и загрузки состояния
function saveState() {
  // Получаем текущий URL страницы
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      
      const state = {
        productData,
        userImage,
        currentCategory,
        generatedResult,
        pageUrl: currentUrl, // Добавляем URL страницы
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('avitoPrimerkaState', JSON.stringify(state));
        console.log('Авито Примерка: Состояние сохранено для URL:', currentUrl);
      } catch (error) {
        console.error('Авито Примерка: Ошибка сохранения состояния:', error);
      }
    }
  });
}

function loadState() {
  return new Promise((resolve) => {
    try {
      const savedState = localStorage.getItem('avitoPrimerkaState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Получаем текущий URL страницы
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            const currentUrl = tabs[0].url;
            
            // Проверяем, что состояние не слишком старое (24 часа)
            const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
            const isNotExpired = Date.now() - state.timestamp < maxAge;
            const isSamePage = state.pageUrl === currentUrl;
            
            if (isNotExpired && isSamePage) {
              productData = state.productData;
              userImage = state.userImage;
              currentCategory = state.currentCategory;
              generatedResult = state.generatedResult;
              
              console.log('Авито Примерка: Состояние загружено для той же страницы');
              resolve(true);
            } else if (!isSamePage) {
              console.log('Авито Примерка: Другая страница, очищаем состояние');
              clearState();
              resolve(false);
            } else {
              console.log('Авито Примерка: Состояние устарело, очищаем');
              clearState();
              resolve(false);
            }
          } else {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('Авито Примерка: Ошибка загрузки состояния:', error);
      resolve(false);
    }
  });
}

function clearState() {
  try {
    localStorage.removeItem('avitoPrimerkaState');
    console.log('Авито Примерка: Состояние очищено');
  } catch (error) {
    console.error('Авито Примерка: Ошибка очистки состояния:', error);
  }
}

// Восстановление UI из сохраненного состояния
function restoreUI() {
  if (productData) {
    displayProductInfo(productData);
    showCategoryInfo();
  }
  
  if (userImage) {
    displayImagePreview(userImage);
    showGenerationSection();
  }
  
  if (generatedResult) {
    displayResult(generatedResult);
  }
  
  // Сохраняем состояние при изменениях
  saveState();
}

// Элементы DOM
const elements = {
  closeButton: document.getElementById('closeButton'),
  productInfo: document.getElementById('productInfo'),
  productImage: document.getElementById('productImage'),
  productTitle: document.getElementById('productTitle'),
  productPrice: document.getElementById('productPrice'),
  productCategory: document.getElementById('productCategory'),
  uploadArea: document.getElementById('uploadArea'),
  fileInput: document.getElementById('fileInput'),
  uploadButton: document.getElementById('uploadButton'),
  imagePreview: document.getElementById('imagePreview'),
  previewImage: document.getElementById('previewImage'),
  removeImage: document.getElementById('removeImage'),
  instructions: document.getElementById('instructions'),
  categoryInfo: document.getElementById('categoryInfo'),
  categoryName: document.getElementById('categoryName'),
  categoryDescription: document.getElementById('categoryDescription'),
  generationSection: document.getElementById('generationSection'),
  generateButton: document.getElementById('generateButton'),
  resultSection: document.getElementById('resultSection'),
  resultImage: document.getElementById('resultImage'),
  saveButton: document.getElementById('saveButton'),
  regenerateButton: document.getElementById('regenerateButton'),
  statusMessage: document.getElementById('statusMessage')
};

// Проверка, что мы на странице товара Авито
async function checkIfAvitoProductPage() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url;
        const isAvito = url.includes('avito.ru');
        const isProductPage = /\d{10,}/.test(url);
        resolve(isAvito && isProductPage);
      } else {
        resolve(false);
      }
    });
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('Авито Примерка: Инициализация popup');
  
  setupEventListeners();
  
  // Сначала проверяем, что мы на странице товара Авито
  const isAvitoProductPage = await checkIfAvitoProductPage();
  if (!isAvitoProductPage) {
    console.log('Авито Примерка: Не страница товара Авито, очищаем состояние');
    clearState();
    showError('Откройте страницу товара на Авито для использования расширения');
    return;
  }
  
  // Пытаемся загрузить сохраненное состояние
  const stateLoaded = await loadState();
  
  if (stateLoaded && productData) {
    console.log('Авито Примерка: Восстанавливаем состояние');
    restoreUI();
  } else {
    console.log('Авито Примерка: Загружаем данные товара');
    loadProductData();
  }
}

function setupEventListeners() {
  // Закрытие popup
  elements.closeButton.addEventListener('click', () => {
    window.close();
  });

  // Загрузка файла
  elements.uploadButton.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', handleFileUpload);

  // Удаление изображения
  elements.removeImage.addEventListener('click', removeUserImage);

  // Генерация примерки
  elements.generateButton.addEventListener('click', generateTryOn);

  // Сохранение результата
  elements.saveButton.addEventListener('click', saveResult);

  // Повторная генерация
  elements.regenerateButton.addEventListener('click', generateTryOn);
}

async function loadProductData() {
  try {
    console.log('Авито Примерка: Загружаем данные о товаре...');
    
    // Получаем данные о товаре из content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('Авито Примерка: Активная вкладка:', tab.url);
    
    // Проверяем, что мы на Авито
    if (!tab.url.includes('avito.ru')) {
      showError('Откройте страницу товара на Авито');
      return;
    }
    
    // Проверяем, что content script загружен
    try {
      const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      if (!pingResponse) {
        throw new Error('Content script не отвечает на ping');
      }
    } catch (pingError) {
      console.error('Авито Примерка: Content script не отвечает:', pingError);
      showError('Расширение не может подключиться к странице. Обновите страницу и попробуйте снова.');
      return;
    }
    
    // Добавляем таймаут для сообщения
    const response = await Promise.race([
      chrome.tabs.sendMessage(tab.id, { action: 'getProductData' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Content script не отвечает')), 5000)
      )
    ]);
    
    console.log('Авито Примерка: Ответ от content script:', response);
    
    if (response && response.success && response.productData) {
      productData = response.productData;
      console.log('Авито Примерка: Данные товара получены:', productData);
      displayProductInfo();
      showCategoryInfo();
    } else if (response && response.success === false) {
      console.error('Авито Примерка: Ошибка в content script:', response.error);
      showError('Ошибка получения данных товара: ' + response.error);
    } else {
      console.error('Авито Примерка: Нет данных о товаре в ответе');
      showError('Не удалось загрузить данные о товаре. Убедитесь, что вы на странице товара Авито.');
    }
  } catch (error) {
    console.error('Авито Примерка: Ошибка загрузки данных товара:', error);
    
    // Показываем более детальную ошибку
    if (error.message.includes('Could not establish connection')) {
      showError('Расширение не может подключиться к странице. Обновите страницу и попробуйте снова.');
    } else {
      showError('Ошибка загрузки данных товара: ' + error.message);
    }
  }
}

function displayProductInfo() {
  if (!productData) return;

  elements.productImage.src = productData.images[0]?.src || '';
  elements.productTitle.textContent = productData.title;
  
  elements.productInfo.style.display = 'block';
  
  // Сохраняем состояние
  saveState();
}

function formatPrice(price) {
  if (!price) return 'Цена не указана';
  return price;
}

function showCategoryInfo() {
  if (!productData) return;

  currentCategory = productData.category;
  
  const categoryInfo = getCategoryInfo(currentCategory);
  
  elements.categoryName.textContent = categoryInfo.name;
  elements.categoryDescription.textContent = categoryInfo.description;
  elements.categoryInfo.style.display = 'block';
  
  // Сохраняем состояние
  saveState();
}

function getCategoryInfo(category) {
  const categories = {
    'auto': {
      name: 'Автозапчасти',
      description: 'Загрузите фото вашего автомобиля для примерки дисков/шин'
    },
    'clothing': {
      name: 'Одежда',
      description: 'Загрузите ваше фото для примерки одежды'
    },
    'electronics': {
      name: 'Электроника',
      description: 'Загрузите фото для демонстрации использования гаджета'
    },
    'home_appliances': {
      name: 'Бытовая техника',
      description: 'Загрузите фото интерьера для размещения прибора'
    },
    'furniture': {
      name: 'Мебель',
      description: 'Загрузите фото комнаты для размещения мебели'
    },
    'sports': {
      name: 'Спорт',
      description: 'Загрузите фото для демонстрации спортивного товара'
    },
    'books': {
      name: 'Книги',
      description: 'Загрузите фото для демонстрации книги'
    },
    'other': {
      name: 'Другое',
      description: 'Загрузите фото для демонстрации товара'
    }
  };
  
  return categories[category] || categories['other'];
}

// Функция оптимизации размера изображения
function optimizeImageSize(width, height, maxWidth, maxHeight) {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

// Функция сжатия изображения
function compressImage(file, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Получаем исходные размеры
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;
    
    console.log('Авито Примерка: Исходные размеры пользовательского изображения:', originalWidth, 'x', originalHeight);
    
    // Оптимизируем размеры если включена оптимизация
    let finalWidth = originalWidth;
    let finalHeight = originalHeight;
    
    if (IMAGE_OPTIMIZATION.enableOptimization) {
      const optimized = optimizeImageSize(originalWidth, originalHeight, IMAGE_OPTIMIZATION.maxWidth, IMAGE_OPTIMIZATION.maxHeight);
      finalWidth = optimized.width;
      finalHeight = optimized.height;
      console.log('Авито Примерка: Оптимизированные размеры пользовательского изображения:', finalWidth, 'x', finalHeight);
    }
    
    // Устанавливаем размеры canvas
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    // Рисуем изображение на canvas с оптимизацией
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    
    // Конвертируем в base64 с настройками качества
    const base64 = canvas.toDataURL('image/jpeg', IMAGE_OPTIMIZATION.quality);
    
    // Проверяем размер файла
    const fileSize = (base64.length * 3) / 4; // Примерный размер в байтах
    console.log('Авито Примерка: Размер пользовательского изображения:', Math.round(fileSize / 1024), 'KB');
    
    if (fileSize > IMAGE_OPTIMIZATION.maxFileSize) {
      console.warn('Авито Примерка: Размер пользовательского изображения превышает лимит:', Math.round(fileSize / 1024), 'KB >', Math.round(IMAGE_OPTIMIZATION.maxFileSize / 1024), 'KB');
    }
    
    callback(base64);
  };
  
  img.onerror = () => {
    console.error('Авито Примерка: Ошибка загрузки пользовательского изображения');
    callback(null);
  };
  
  img.src = URL.createObjectURL(file);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Валидация файла
  if (!validateFile(file)) return;

  console.log('Авито Примерка: Загружается пользовательское изображение, размер:', Math.round(file.size / 1024), 'KB');
  
  // Сжимаем изображение
  compressImage(file, (compressedBase64) => {
    if (compressedBase64) {
      userImage = {
        file: file,
        dataUrl: compressedBase64
      };
      displayImagePreview(compressedBase64);
      showGenerationSection();
      
      console.log('Авито Примерка: Пользовательское изображение сжато и готово');
    } else {
      alert('Ошибка обработки изображения');
    }
  });
}

function validateFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    showError('Недопустимый формат файла. Используйте JPEG, PNG или WebP.');
    return false;
  }

  if (file.size > maxSize) {
    showError('Файл слишком большой. Максимальный размер: 10MB.');
    return false;
  }

  return true;
}

function displayImagePreview(dataUrl) {
  elements.previewImage.src = dataUrl;
  elements.uploadArea.style.display = 'none';
  elements.imagePreview.style.display = 'block';
  
  // Сохраняем состояние
  saveState();
}

function removeUserImage() {
  userImage = null;
  elements.fileInput.value = '';
  elements.uploadArea.style.display = 'block';
  elements.imagePreview.style.display = 'none';
  elements.generationSection.style.display = 'none';
  elements.resultSection.style.display = 'none';
}

function showGenerationSection() {
  elements.generationSection.style.display = 'block';
}

async function generateTryOn() {
  if (!userImage || !productData) {
    showError('Необходимо загрузить фото');
    return;
  }

  if (OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    showError('Необходимо настроить API ключ OpenRouter');
    return;
  }

  updateGenerateButton(true);
  showStatus('Генерируем примерку...');

  try {
    console.log('Авито Примерка: Начинаем генерацию примерки...');
    
    // Получаем изображение товара
    console.log('Авито Примерка: Получаем изображение товара...');
    const productImage = await getProductImage();
    console.log('Авито Примерка: Изображение товара получено, размер:', productImage.length);
    
    // Генерируем примерку
    console.log('Авито Примерка: Отправляем запрос на генерацию...');
    const result = await generateImage(productImage, userImage.dataUrl);
    console.log('Авито Примерка: Генерация завершена');
    
    // Показываем результат
    displayResult(result);
    showStatus('Примерка сгенерирована успешно!');
    
  } catch (error) {
    console.error('Авито Примерка: Ошибка генерации:', error);
    
    // Более детальные сообщения об ошибках
    if (error.message.includes('Таймаут')) {
      showError('Превышено время ожидания. Попробуйте обновить страницу и повторить попытку.');
    } else if (error.message.includes('Content script не отвечает')) {
      showError('Расширение не может подключиться к странице. Обновите страницу и попробуйте снова.');
    } else if (error.message.includes('Изображение товара не найдено')) {
      showError('Не удалось найти изображение товара на странице. Убедитесь, что вы на странице товара Авито.');
    } else if (error.message.includes('Превышен лимит запросов')) {
      showError('Превышен лимит запросов к API. Подождите несколько минут и попробуйте снова.');
    } else if (error.message.includes('Неверный API ключ')) {
      showError('Неверный API ключ OpenRouter. Проверьте настройки в коде расширения.');
    } else if (error.message.includes('Недостаточно средств')) {
      showError('Недостаточно средств на балансе OpenRouter. Пополните счет.');
    } else if (error.message.includes('Некорректный запрос')) {
      showError('Некорректный запрос к API. Возможно, изображения слишком большие. Попробуйте загрузить изображения меньшего размера.');
    } else if (error.message.includes('Ошибка сервера API')) {
      showError('Ошибка сервера API. Попробуйте позже.');
    } else {
      showError('Не удалось сгенерировать примерку: ' + error.message);
    }
  } finally {
    updateGenerateButton(false);
  }
}

async function getProductImage() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('Не удалось найти активную вкладку'));
        return;
      }

      // Добавляем таймаут для сообщения
      const timeout = setTimeout(() => {
        reject(new Error('Таймаут: Content script не отвечает'));
      }, 10000);

      chrome.tabs.sendMessage(tabs[0].id, { action: 'getProductImage' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.error('Авито Примерка: Ошибка runtime:', chrome.runtime.lastError);
          reject(new Error('Ошибка связи с content script: ' + chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success && response.imageUrl) {
          console.log('Авито Примерка: Получено изображение товара');
          resolve(response.imageUrl);
        } else if (response && response.success === false) {
          console.error('Авито Примерка: Ошибка в content script:', response.error);
          reject(new Error('Ошибка получения изображения: ' + response.error));
        } else {
          console.error('Авито Примерка: Неожиданный ответ от content script:', response);
          reject(new Error('Не удалось получить изображение товара'));
        }
      });
    });
  });
}

async function generateImage(productImage, userImage, retryCount = 0) {
  const prompt = getPromptForCategory(currentCategory);
  const maxRetries = 2;
  
  console.log(`Авито Примерка: Отправляем запрос в OpenRouter... (попытка ${retryCount + 1}/${maxRetries + 1})`);
  console.log('Авито Примерка: Промпт:', prompt);
  console.log('Авито Примерка: Первое изображение (пользователь):', userImage.substring(0, 50) + '...');
  console.log('Авито Примерка: Второе изображение (товар):', productImage.substring(0, 50) + '...');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
       body: JSON.stringify({
         model: 'google/gemini-2.5-flash-image',
         messages: [{
           role: 'user',
           content: [
             { type: 'text', text: prompt },
             { type: 'image_url', image_url: { url: userImage } },
             { type: 'image_url', image_url: { url: productImage } }
           ]
         }],
         modalities: ['image', 'text'],
         image_config: {
           aspect_ratio: IMAGE_OPTIMIZATION.aspectRatio
         },
         // Параметры для экономии расходов
         max_tokens: API_OPTIMIZATION.maxTokens,
         temperature: API_OPTIMIZATION.temperature,
         top_p: API_OPTIMIZATION.topP,
         verbosity: API_OPTIMIZATION.verbosity
       })
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    // Специальная обработка для разных ошибок
    if (response.status === 429) {
      if (retryCount < maxRetries) {
        console.log(`Авито Примерка: Лимит запросов, повторяем через ${(retryCount + 1) * 2} секунд...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return generateImage(productImage, userImage, retryCount + 1);
      }
      errorMessage = 'Превышен лимит запросов к API. Попробуйте через несколько минут.';
    } else if (response.status === 401) {
      errorMessage = 'Неверный API ключ. Проверьте настройки OpenRouter.';
    } else if (response.status === 402) {
      errorMessage = 'Недостаточно средств на балансе OpenRouter.';
    } else if (response.status === 400) {
      errorMessage = 'Некорректный запрос. Возможно, изображения слишком большие.';
    } else if (response.status >= 500) {
      if (retryCount < maxRetries) {
        console.log(`Авито Примерка: Ошибка сервера, повторяем через ${(retryCount + 1) * 2} секунд...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return generateImage(productImage, userImage, retryCount + 1);
      }
      errorMessage = 'Ошибка сервера API. Попробуйте позже.';
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Неожиданный ответ от API');
  }

  const message = data.choices[0].message;
  console.log('Авито Примерка: Получен ответ от API:', message);
  
  // Проверяем, есть ли изображения в ответе
  if (message.images && message.images.length > 0) {
    const imageUrl = message.images[0].image_url.url;
    console.log('Авито Примерка: Получено изображение от API:', imageUrl.substring(0, 50) + '...');
    return imageUrl;
  }
  
  // Если нет изображений, создаем fallback изображение
  console.log('Авито Примерка: API не вернул изображение, создаем fallback');
  const fallbackText = message.content || 'Результат примерки не получен';
  return createFallbackImage(fallbackText);
}

function createFallbackImage(text) {
  console.log('Авито Примерка: Создаем fallback изображение из текста');
  
  // Создаем canvas для генерации изображения
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Устанавливаем размеры
  canvas.width = 512;
  canvas.height = 512;
  
  // Фон
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Текст
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Разбиваем текст на строки
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > canvas.width - 40) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  // Рисуем строки
  const lineHeight = 20;
  const startY = (canvas.height - (lines.length * lineHeight)) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });
  
  // Добавляем заголовок
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Результат примерки', canvas.width / 2, 50);
  
  // Конвертируем в base64
  const base64 = canvas.toDataURL('image/png');
  console.log('Авито Примерка: Fallback изображение создано');
  
  return base64;
}

function getPromptForCategory(category) {
  // Получаем данные о товаре
  const productName = productData?.title || 'товар';
  const productType = productData?.productType || '';
  
  console.log('Авито Примерка: Создаем промпт для товара:', {
    category,
    productName,
    productType
  });
  
  // Создаем базовый промпт с конкретными данными на русском языке
  let basePrompt = `Возьми первое изображение и добавь туда ТОЛЬКО конкретный объект - "${productName}"`;
  
  if (productType) {
    basePrompt += ` (тип: ${productType})`;
  }
  
  // Добавляем категорию и конкретные инструкции на русском языке
  const categoryInstructions = {
    'auto': 'Покажи как эта автозапчасть (со второго изображения) будет выглядеть на автомобиле человека (первое изображение). Создай реалистичную композицию с правильными пропорциями и освещением.',
    'clothing': 'Покажи как эта одежда (со второго изображения) будет выглядеть на этом человеке (первое изображение). Создай реалистичную композицию с правильной посадкой и естественным видом.',
    'electronics': 'Покажи как это электронное устройство (со второго изображения) будет использоваться этим человеком (первое изображение). Создай реалистичную композицию, показывающую естественное использование.',
    'home_appliances': 'Покажи как эта бытовая техника (со второго изображения) будет выглядеть в доме человека (первое изображение). Создай реалистичную композицию с правильным размещением.',
    'furniture': 'Покажи как эта мебель (со второго изображения) будет выглядеть в комнате человека (первое изображение). Создай реалистичную композицию с правильными пропорциями.',
    'sports': 'Покажи как это спортивное оборудование (со второго изображения) будет использоваться этим человеком (первое изображение). Создай реалистичную и динамичную композицию.',
    'books': 'Покажи как эта книга (со второго изображения) будет держаться этим человеком (первое изображение). Создай реалистичную композицию, показывающую естественное взаимодействие.',
    'other': 'Покажи как этот товар (со второго изображения) будет использоваться этим человеком (первое изображение). Создай реалистичную композицию, показывающую естественное использование.'
  };
  
  const instruction = categoryInstructions[category] || categoryInstructions['other'];
  const fullPrompt = `${basePrompt} со второго изображения. ${instruction}`;
  
  console.log('Авито Примерка: Финальный промпт:', fullPrompt);
  console.log('Авито Примерка: Полный промпт для отправки в API:', fullPrompt);
  
  return fullPrompt;
}

function displayResult(result) {
  console.log('Авито Примерка: Отображаем результат:', typeof result, result?.length);
  
  // Сохраняем результат в глобальной переменной
  generatedResult = result;
  
  // Очищаем предыдущий результат
  elements.resultImage.style.display = 'block';
  elements.resultImage.alt = 'Результат примерки';
  
  // Удаляем предыдущий текст результата
  const existingText = elements.resultSection.querySelector('.result-text');
  if (existingText) {
    existingText.remove();
  }
  
  // Если результат - это URL изображения
  if (result && (result.startsWith('http') || result.startsWith('data:'))) {
    console.log('Авито Примерка: Устанавливаем изображение результата');
    
    // Добавляем обработчики событий для изображения
    elements.resultImage.onload = () => {
      console.log('Авито Примерка: Изображение загружено успешно');
      elements.resultImage.style.display = 'block';
    };
    
    elements.resultImage.onerror = () => {
      console.error('Авито Примерка: Ошибка загрузки изображения');
      elements.resultImage.style.display = 'none';
      
      // Показываем текстовое сообщение об ошибке
      const errorText = document.createElement('div');
      errorText.textContent = 'Ошибка загрузки изображения. Попробуйте снова.';
      errorText.className = 'result-text error';
      elements.resultSection.appendChild(errorText);
    };
    
    elements.resultImage.src = result;
  } else {
    // Если результат - это описание, показываем его
    console.log('Авито Примерка: Показываем текстовый результат');
    elements.resultImage.style.display = 'none';
    const resultText = document.createElement('div');
    resultText.textContent = result || 'Результат не получен';
    resultText.className = 'result-text';
    elements.resultSection.appendChild(resultText);
  }
  
  elements.resultSection.style.display = 'block';
  console.log('Авито Примерка: Секция результата отображена');
  
  // Сохраняем состояние
  saveState();
}

function updateGenerateButton(isGenerating) {
  const buttonText = elements.generateButton.querySelector('.button-text');
  const spinner = elements.generateButton.querySelector('.loading-spinner');

  if (isGenerating) {
    buttonText.textContent = 'Генерируем...';
    spinner.style.display = 'inline-block';
    elements.generateButton.disabled = true;
  } else {
    buttonText.textContent = 'Сгенерировать примерку';
    spinner.style.display = 'none';
    elements.generateButton.disabled = false;
  }
}

async function saveResult() {
  try {
    console.log('Авито Примерка: Сохраняем результат...');
    
    // Проверяем, что есть изображение для сохранения
    if (!elements.resultImage.src) {
      showError('Нет изображения для сохранения');
      return;
    }
    
    // Скачиваем изображение
    await downloadImage(elements.resultImage.src, 'avito-primerka-result.png');
    
    // Сохраняем в локальное хранилище
    const history = await chrome.storage.local.get(['generationHistory']) || [];
    const newHistory = history.generationHistory || [];
    
    newHistory.unshift({
      productData: productData,
      userImage: userImage.dataUrl,
      resultImage: elements.resultImage.src,
      category: currentCategory,
      timestamp: Date.now()
    });
    
    // Ограничиваем историю до 10 записей
    if (newHistory.length > 10) {
      newHistory.splice(10);
    }
    
    await chrome.storage.local.set({ generationHistory: newHistory });
    
    showStatus('Результат сохранен и скачан!');
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showError('Не удалось сохранить результат: ' + error.message);
  }
}

async function downloadImage(imageSrc, filename) {
  try {
    console.log('Авито Примерка: Скачиваем изображение...');
    console.log('Авито Примерка: Тип изображения:', imageSrc.substring(0, 50));
    
    // Проверяем, что это base64 изображение
    if (!imageSrc.startsWith('data:image/')) {
      throw new Error('Некорректный формат изображения');
    }
    
    // Создаем blob из base64
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    
    // Создаем URL для blob
    const blobUrl = URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Добавляем ссылку в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Очищаем URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    
    console.log('Авито Примерка: Изображение скачано');
  } catch (error) {
    console.error('Ошибка скачивания:', error);
    throw new Error('Не удалось скачать изображение: ' + error.message);
  }
}

function showStatus(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = 'status-message success';
}

function showError(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = 'status-message error';
}

console.log('Авито Примерка: Popup готов');
