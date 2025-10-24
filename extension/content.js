// Content script для добавления кнопки "Примерить" на страницы Авито

console.log('Авито Примерка: Content script загружен');

// Ждем загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('Авито Примерка: Инициализация');
  
  // Проверяем, что мы на странице товара
  if (!isProductPage()) {
    console.log('Авито Примерка: Не страница товара');
    return;
  }
  
  // Ждем загрузки изображений товара
  waitForProductImages().then(() => {
    addTryOnButton();
    
    // Добавляем наблюдатель за изменениями DOM для повторного добавления кнопки
    observeDOMChanges();
  });
}

// Наблюдатель за изменениями DOM
function observeDOMChanges() {
  let checkInterval = null;
  
  // Функция проверки наличия кнопки
  const checkButton = () => {
    if (isProductPage() && !document.querySelector('.avito-primerka-button')) {
      console.log('Авито Примерка: Кнопка отсутствует, добавляем');
      addTryOnButton();
    }
  };
  
  // Проверяем каждые 500ms
  checkInterval = setInterval(checkButton, 500);
  
  // Также добавляем наблюдатель для более быстрого реагирования
  const observer = new MutationObserver((mutations) => {
    let shouldReaddButton = false;
    
    mutations.forEach((mutation) => {
      // Проверяем, если удалили нашу кнопку или изменили структуру галереи
      if (mutation.type === 'childList') {
        const removedNodes = Array.from(mutation.removedNodes);
        const hasOurButton = removedNodes.some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node.classList?.contains('avito-primerka-button') || 
           node.querySelector?.('.avito-primerka-button'))
        );
        
        if (hasOurButton) {
          console.log('Авито Примерка: Кнопка была удалена, передобавляем');
          shouldReaddButton = true;
        }
      }
    });
    
    if (shouldReaddButton) {
      // Небольшая задержка перед передобавлением
      setTimeout(() => {
        if (isProductPage() && !document.querySelector('.avito-primerka-button')) {
          addTryOnButton();
        }
      }, 100);
    }
  });
  
  // Наблюдаем за всем документом для более надежного отслеживания
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
  
  console.log('Авито Примерка: Наблюдатель DOM запущен');
  
  // Очищаем интервал при уходе со страницы
  window.addEventListener('beforeunload', () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    observer.disconnect();
  });
}

function isProductPage() {
  const url = window.location.href;
  const isAvito = window.location.hostname.includes('avito.ru');
  
  // Различные паттерны URL товаров на Авито
  const productPatterns = [
    /\/\d+$/,           // /1234567890
    /\/\d+\?/,          // /1234567890?param=value
    /\/\d+[a-zA-Z0-9_-]*$/, // /1234567890_abc
    /\/\d+[a-zA-Z0-9_-]*\?/ // /1234567890_abc?param=value
  ];
  
  const hasProductId = productPatterns.some(pattern => pattern.test(window.location.pathname));
  
  // Дополнительная проверка по элементам страницы
  const hasProductElements = document.querySelector('[data-marker="item-view"]') || 
                            document.querySelector('[data-marker="item-view/image"]') ||
                            document.querySelector('[data-marker="item-view/gallery"]');
  
  console.log('Авито Примерка: Проверка страницы', {
    url: url,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    isAvito: isAvito,
    hasProductId: hasProductId,
    hasProductElements: !!hasProductElements
  });
  
  return isAvito && (hasProductId || hasProductElements);
}

function waitForProductImages() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 секунд максимум
    
    const checkImages = () => {
      attempts++;
      
      // Различные селекторы для поиска изображений
      const imageSelectors = [
        '[data-marker="item-view/image"]',
        '[data-marker="item-view/gallery"]',
        '[data-marker="image-frame/image-wrapper"]',
        '.gallery img',
        '.item-view img'
      ];
      
      let imageFound = false;
      for (const selector of imageSelectors) {
        const element = document.querySelector(selector);
        if (element && (element.querySelector('img') || element.tagName === 'IMG')) {
          imageFound = true;
          break;
        }
      }
      
      if (imageFound) {
        console.log('Авито Примерка: Изображения товара найдены');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.log('Авито Примерка: Таймаут ожидания изображений');
        resolve(); // Продолжаем даже без изображений
      } else {
        setTimeout(checkImages, 100);
      }
    };
    checkImages();
  });
}

function addTryOnButton() {
  console.log('Авито Примерка: Добавляем кнопку');
  
  // Проверяем, что кнопка еще не добавлена
  if (document.querySelector('.avito-primerka-button')) {
    console.log('Авито Примерка: Кнопка уже добавлена');
    return;
  }
  
  // Пробуем найти контейнер с изображением товара на Авито
  const imageSelectors = [
    '[data-marker="item-view/gallery"]', // Основной контейнер галереи
    '[data-marker="image-frame/image-wrapper"]', // Контейнер изображения
    '[data-marker="item-view/image"]',
    '.gallery-img',
    '.item-gallery',
    '.item-photos',
    '.item-view-image'
  ];
  
  let imageContainer = null;
  for (const selector of imageSelectors) {
    imageContainer = document.querySelector(selector);
    if (imageContainer) {
      console.log('Авито Примерка: Найден контейнер изображения', selector);
      break;
    }
  }
  
  // Если не нашли специальный контейнер, ищем любой контейнер с изображениями
  if (!imageContainer) {
    const allImages = document.querySelectorAll('img');
    if (allImages.length > 0) {
      // Берем первый контейнер с изображением
      imageContainer = allImages[0].closest('div');
      console.log('Авито Примерка: Используем общий контейнер');
    }
  }
  
  if (!imageContainer) {
    console.log('Авито Примерка: Контейнер изображения не найден');
    return;
  }
  
  // Устанавливаем relative позиционирование для контейнера
  imageContainer.style.position = 'relative';
  
  // Создаем кнопку
  const button = document.createElement('button');
  button.className = 'avito-primerka-button';
  button.innerHTML = `
    <span class="avito-primerka-icon">🛍️</span>
    <span class="avito-primerka-text">Примерить</span>
  `;
  
  // Добавляем обработчик клика
  button.addEventListener('click', handleTryOnClick);
  
  // Добавляем кнопку в контейнер изображения
  imageContainer.appendChild(button);
  
  console.log('Авито Примерка: Кнопка добавлена в контейнер изображения');
}

function handleTryOnClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('Авито Примерка: Клик по кнопке примерки');
  
  // Открываем popup расширения
  chrome.runtime.sendMessage({
    action: 'openPopup'
  });
}

function getProductData() {
  console.log('Авито Примерка: Извлекаем данные о товаре');
  
  // Пробуем разные селекторы для заголовка
  const titleSelectors = [
    '[data-marker="item-view/title"]',
    'h1[data-marker="item-view/title"]',
    '.item-title',
    'h1'
  ];
  
  let title = '';
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      title = element.textContent.trim();
      break;
    }
  }
  
  // Пробуем разные селекторы для цены
  const priceSelectors = [
    '[data-marker="item-view/price"]',
    '.item-price',
    '[data-marker="item-view/price-value"]'
  ];
  
  let price = '';
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      price = element.textContent.trim();
      break;
    }
  }
  
  // Пробуем разные селекторы для описания
  const descriptionSelectors = [
    '[data-marker="item-view/description"]',
    '.item-description',
    '.item-description-text'
  ];
  
  let description = '';
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      description = element.textContent.trim();
      break;
    }
  }
  
  // Получаем изображения товара - пробуем разные селекторы для Авито
  const imageSelectors = [
    '[data-marker="image-frame/image-wrapper"] img', // Основное изображение
    '[data-marker="image-preview/item"] img', // Превью изображения
    '[data-marker="item-view/image"] img',
    '.gallery-img img',
    '.item-gallery img',
    '.item-photos img'
  ];
  
  let images = [];
  for (const selector of imageSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      images = Array.from(elements).map(img => ({
        src: img.src,
        alt: img.alt || ''
      }));
      console.log('Авито Примерка: Найдены изображения через селектор', selector, images.length);
      break;
    }
  }
  
  // Если не нашли изображения, пробуем найти любые изображения на странице
  if (images.length === 0) {
    const allImages = document.querySelectorAll('img');
    images = Array.from(allImages)
      .filter(img => img.src && !img.src.includes('data:') && !img.src.includes('logo'))
      .slice(0, 5)
      .map(img => ({
        src: img.src,
        alt: img.alt || ''
      }));
  }
  
  // Получаем тип товара из характеристик
  const productTypeSelectors = [
    '[data-marker="item-view/item-params"] li:first-child p',
    '[data-marker="item-view/item-params"] li:first-child span',
    '.item-params li:first-child p',
    '.item-params li:first-child span'
  ];
  
  let productType = '';
  for (const selector of productTypeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      const text = element.textContent.trim();
      if (text.includes('Тип товара')) {
        productType = text.replace('Тип товара:', '').trim();
        break;
      }
    }
  }
  
  // Определяем категорию товара
  const category = detectCategory(title, description);
  
  const productData = {
    title,
    price,
    description,
    images,
    category,
    productType,
    url: window.location.href
  };
  
  console.log('Авито Примерка: Данные товара', productData);
  
  return productData;
}

function detectCategory(title, description) {
  // Сначала пробуем извлечь тип товара из характеристик
  const itemParams = document.querySelector('[data-marker="item-view/item-params"]');
  let productType = '';
  
  if (itemParams) {
    // Ищем первый элемент с типом товара
    const typeElement = itemParams.querySelector('li:first-child p');
    if (typeElement) {
      const typeText = typeElement.textContent;
      const typeMatch = typeText.match(/Тип товара:\s*(.+)/);
      if (typeMatch) {
        productType = typeMatch[1].trim();
        console.log('Авито Примерка: Найден тип товара из характеристик:', productType);
      }
    }
  }
  
  // Объединяем все данные для анализа
  const text = (title + ' ' + description + ' ' + productType).toLowerCase();
  
  console.log('Авито Примерка: Анализируем текст для категории:', text);
  
  // Детекция категорий по ключевым словам
  if (text.includes('диск') || text.includes('колес') || text.includes('шина') || text.includes('резина') || text.includes('авто')) {
    return 'auto';
  }
  
  if (text.includes('футболка') || text.includes('джинсы') || text.includes('платье') || text.includes('куртка') || text.includes('обувь') || text.includes('одежда') || text.includes('головные уборы') || text.includes('шапка') || text.includes('кепка') || text.includes('шляпа') || text.includes('берет')) {
    return 'clothing';
  }
  
  if (text.includes('телефон') || text.includes('ноутбук') || text.includes('планшет') || text.includes('наушники') || text.includes('электроника')) {
    return 'electronics';
  }
  
  if (text.includes('холодильник') || text.includes('стиральная') || text.includes('микроволновка') || text.includes('пылесос') || text.includes('бытовая техника')) {
    return 'home_appliances';
  }
  
  // Мебель
  if (text.includes('стол') || text.includes('стул') || text.includes('диван') || text.includes('кровать') || text.includes('шкаф') || text.includes('мебель')) {
    return 'furniture';
  }
  
  // Спорт
  if (text.includes('спорт') || text.includes('тренажер') || text.includes('велосипед') || text.includes('лыжи')) {
    return 'sports';
  }
  
  // Книги
  if (text.includes('книга') || text.includes('журнал') || text.includes('учебник')) {
    return 'books';
  }
  
  return 'other';
}

// Обработчик сообщений от popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Авито Примерка: Получено сообщение', request);
  
  // Обработчик ping для проверки связи
  if (request.action === 'ping') {
    console.log('Авито Примерка: Ping получен, отвечаем pong');
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }
  
  if (request.action === 'getProductImage') {
    // Пробуем найти изображение товара на Авито
    const imageSelectors = [
      '[data-marker="image-frame/image-wrapper"] img', // Основное изображение
      '[data-marker="image-preview/item"] img', // Превью изображения
      '[data-marker="item-view/image"] img',
      '.gallery-img img',
      '.item-gallery img',
      '.item-photos img'
    ];
    
    let imgElement = null;
    for (const selector of imageSelectors) {
      const img = document.querySelector(selector);
      if (img && img.src) {
        imgElement = img;
        console.log('Авито Примерка: Найдено изображение через селектор', selector);
        break;
      }
    }
    
    // Если не нашли, берем первое изображение на странице
    if (!imgElement) {
      const allImages = document.querySelectorAll('img');
      for (const img of allImages) {
        if (img.src && !img.src.includes('data:') && !img.src.includes('logo')) {
          imgElement = img;
          console.log('Авито Примерка: Используем первое изображение на странице');
          break;
        }
      }
    }
    
    if (imgElement) {
      // Конвертируем изображение в base64
      convertImageToBase64(imgElement).then(base64 => {
        console.log('Авито Примерка: Изображение конвертировано в base64');
        sendResponse({
          success: true,
          imageUrl: base64,
          originalUrl: imgElement.src
        });
      }).catch(error => {
        console.error('Авито Примерка: Ошибка конвертации изображения', error);
        sendResponse({
          success: false,
          error: error.message,
          imageUrl: imgElement.src, // Fallback к оригинальному URL
          originalUrl: imgElement.src
        });
      });
      return true; // Указываем, что ответ будет асинхронным
    } else {
      console.log('Авито Примерка: Изображение товара не найдено');
      sendResponse({
        success: false,
        error: 'Изображение товара не найдено',
        imageUrl: null,
        originalUrl: null
      });
    }
  }
  
  if (request.action === 'detectCategory') {
    const productData = getProductData();
    console.log('Авито Примерка: Категория товара', productData.category);
    sendResponse({
      category: productData.category
    });
  }
  
  if (request.action === 'getProductData') {
    try {
      const productData = getProductData();
      console.log('Авито Примерка: Данные товара для popup', productData);
      sendResponse({
        success: true,
        productData: productData
      });
    } catch (error) {
      console.error('Авито Примерка: Ошибка получения данных товара:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
});

// Функция конвертации изображения в base64
// Настройки оптимизации изображений
const IMAGE_OPTIMIZATION = {
  maxWidth: 1024,        // Максимальная ширина
  maxHeight: 1024,       // Максимальная высота
  quality: 0.8,          // Качество JPEG (0.1 - 1.0)
  maxFileSize: 500000,   // Максимальный размер файла в байтах (500KB)
  enableOptimization: true // Включить оптимизацию
};

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

function convertImageToBase64(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      // Сначала пробуем загрузить изображение через fetch
      fetch(imgElement.src, {
        mode: 'cors',
        credentials: 'omit'
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
      }).then(blob => {
        // Создаем URL для blob
        const blobUrl = URL.createObjectURL(blob);

        // Создаем новое изображение
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            // Создаем canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Получаем исходные размеры
            const originalWidth = img.naturalWidth || img.width;
            const originalHeight = img.naturalHeight || img.height;
            
            console.log('Авито Примерка: Исходные размеры изображения:', originalWidth, 'x', originalHeight);

            // Оптимизируем размеры если включена оптимизация
            let finalWidth = originalWidth;
            let finalHeight = originalHeight;
            
            if (IMAGE_OPTIMIZATION.enableOptimization) {
              const optimized = optimizeImageSize(originalWidth, originalHeight, IMAGE_OPTIMIZATION.maxWidth, IMAGE_OPTIMIZATION.maxHeight);
              finalWidth = optimized.width;
              finalHeight = optimized.height;
              console.log('Авито Примерка: Оптимизированные размеры:', finalWidth, 'x', finalHeight);
            }

            // Устанавливаем размеры canvas
            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // Рисуем изображение на canvas с оптимизацией
            ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

            // Конвертируем в base64 с настройками качества
            const base64 = canvas.toDataURL('image/jpeg', IMAGE_OPTIMIZATION.quality);

            // Очищаем URL
            URL.revokeObjectURL(blobUrl);

            // Проверяем размер файла
            const fileSize = (base64.length * 3) / 4; // Примерный размер в байтах
            console.log('Авито Примерка: Размер base64:', Math.round(fileSize / 1024), 'KB');
            
            if (fileSize > IMAGE_OPTIMIZATION.maxFileSize) {
              console.warn('Авито Примерка: Размер файла превышает лимит:', Math.round(fileSize / 1024), 'KB >', Math.round(IMAGE_OPTIMIZATION.maxFileSize / 1024), 'KB');
            }

            console.log('Авито Примерка: Изображение конвертировано в base64, размер:', base64.length);
            resolve(base64);

          } catch (error) {
            URL.revokeObjectURL(blobUrl);
            throw error;
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          throw new Error('Ошибка загрузки изображения');
        };

        img.src = blobUrl;

      }).catch(error => {
        console.error('Авито Примерка: Ошибка загрузки изображения через fetch:', error);

        // Fallback: пробуем прямой способ
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const originalWidth = imgElement.naturalWidth || imgElement.width;
          const originalHeight = imgElement.naturalHeight || imgElement.height;
          
          // Оптимизируем размеры
          let finalWidth = originalWidth;
          let finalHeight = originalHeight;
          
          if (IMAGE_OPTIMIZATION.enableOptimization) {
            const optimized = optimizeImageSize(originalWidth, originalHeight, IMAGE_OPTIMIZATION.maxWidth, IMAGE_OPTIMIZATION.maxHeight);
            finalWidth = optimized.width;
            finalHeight = optimized.height;
          }

          canvas.width = finalWidth;
          canvas.height = finalHeight;

          ctx.drawImage(imgElement, 0, 0, finalWidth, finalHeight);
          const base64 = canvas.toDataURL('image/jpeg', IMAGE_OPTIMIZATION.quality);

          console.log('Авито Примерка: Fallback конвертация успешна');
          resolve(base64);

        } catch (fallbackError) {
          console.error('Авито Примерка: Fallback также не сработал:', fallbackError);
          reject(fallbackError);
        }
      });

    } catch (error) {
      console.error('Авито Примерка: Ошибка конвертации изображения:', error);
      reject(error);
    }
  });
}

// Устанавливаем флаг загрузки
window.avitoPrimerkaLoaded = true;

console.log('Авито Примерка: Content script готов');
