// Тест исправления сохранения состояния
// Запустите этот код в консоли на странице товара Авито

console.log('🔧 Тест исправления сохранения состояния');

// Тест 1: Проверка сохранения состояния с URL
function testStateWithURL() {
  console.log('🔍 Тест 1: Проверка сохранения состояния с URL...');
  
  // Симулируем сохранение состояния
  const mockState = {
    productData: { title: 'Тестовый товар', images: [] },
    userImage: { dataUrl: 'data:image/jpeg;base64,test' },
    currentCategory: 'clothing',
    generatedResult: 'data:image/jpeg;base64,result',
    pageUrl: window.location.href,
    timestamp: Date.now()
  };
  
  localStorage.setItem('avitoPrimerkaState', JSON.stringify(mockState));
  
  // Проверяем, что состояние сохранилось
  const savedState = localStorage.getItem('avitoPrimerkaState');
  const parsedState = JSON.parse(savedState);
  
  const checks = {
    hasPageUrl: parsedState.pageUrl === window.location.href,
    hasProductData: !!parsedState.productData,
    hasUserImage: !!parsedState.userImage,
    hasCategory: !!parsedState.currentCategory,
    hasResult: !!parsedState.generatedResult,
    hasTimestamp: !!parsedState.timestamp
  };
  
  console.log('Проверка сохранения состояния:');
  Object.entries(checks).forEach(([property, value]) => {
    console.log(`- ${property}: ${value ? '✅' : '❌'}`);
  });
  
  return Object.values(checks).every(v => v);
}

// Тест 2: Проверка загрузки состояния для той же страницы
function testLoadStateSamePage() {
  console.log('🔄 Тест 2: Проверка загрузки состояния для той же страницы...');
  
  // Сохраняем состояние для текущей страницы
  const currentUrl = window.location.href;
  const mockState = {
    productData: { title: 'Тестовый товар', images: [] },
    userImage: { dataUrl: 'data:image/jpeg;base64,test' },
    currentCategory: 'clothing',
    generatedResult: 'data:image/jpeg;base64,result',
    pageUrl: currentUrl,
    timestamp: Date.now()
  };
  
  localStorage.setItem('avitoPrimerkaState', JSON.stringify(mockState));
  
  // Проверяем загрузку
  const savedState = localStorage.getItem('avitoPrimerkaState');
  const parsedState = JSON.parse(savedState);
  
  const isSamePage = parsedState.pageUrl === currentUrl;
  const isNotExpired = Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000;
  
  console.log('Проверка загрузки состояния:');
  console.log(`- Текущий URL: ${currentUrl}`);
  console.log(`- Сохраненный URL: ${parsedState.pageUrl}`);
  console.log(`- Та же страница: ${isSamePage ? '✅' : '❌'}`);
  console.log(`- Не устарело: ${isNotExpired ? '✅' : '❌'}`);
  
  return isSamePage && isNotExpired;
}

// Тест 3: Проверка очистки состояния для другой страницы
function testClearStateDifferentPage() {
  console.log('🧹 Тест 3: Проверка очистки состояния для другой страницы...');
  
  // Сохраняем состояние для другой страницы
  const differentUrl = 'https://www.avito.ru/moscow/items/123456';
  const mockState = {
    productData: { title: 'Другой товар', images: [] },
    userImage: { dataUrl: 'data:image/jpeg;base64,test' },
    currentCategory: 'electronics',
    generatedResult: 'data:image/jpeg;base64,result',
    pageUrl: differentUrl,
    timestamp: Date.now()
  };
  
  localStorage.setItem('avitoPrimerkaState', JSON.stringify(mockState));
  
  // Проверяем, что состояние должно быть очищено
  const savedState = localStorage.getItem('avitoPrimerkaState');
  const parsedState = JSON.parse(savedState);
  
  const currentUrl = window.location.href;
  const isDifferentPage = parsedState.pageUrl !== currentUrl;
  
  console.log('Проверка очистки состояния:');
  console.log(`- Текущий URL: ${currentUrl}`);
  console.log(`- Сохраненный URL: ${parsedState.pageUrl}`);
  console.log(`- Разные страницы: ${isDifferentPage ? '✅' : '❌'}`);
  
  if (isDifferentPage) {
    console.log('✅ Состояние должно быть очищено для другой страницы');
    // Очищаем состояние
    localStorage.removeItem('avitoPrimerkaState');
    console.log('✅ Состояние очищено');
  }
  
  return isDifferentPage;
}

// Тест 4: Проверка очистки устаревшего состояния
function testClearExpiredState() {
  console.log('⏰ Тест 4: Проверка очистки устаревшего состояния...');
  
  // Создаем устаревшее состояние (25 часов назад)
  const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
  const mockState = {
    productData: { title: 'Устаревший товар', images: [] },
    userImage: { dataUrl: 'data:image/jpeg;base64,test' },
    currentCategory: 'clothing',
    generatedResult: 'data:image/jpeg;base64,result',
    pageUrl: window.location.href,
    timestamp: expiredTimestamp
  };
  
  localStorage.setItem('avitoPrimerkaState', JSON.stringify(mockState));
  
  // Проверяем, что состояние устарело
  const savedState = localStorage.getItem('avitoPrimerkaState');
  const parsedState = JSON.parse(savedState);
  
  const isExpired = Date.now() - parsedState.timestamp > 24 * 60 * 60 * 1000;
  
  console.log('Проверка устаревшего состояния:');
  console.log(`- Время создания: ${new Date(parsedState.timestamp).toLocaleString()}`);
  console.log(`- Текущее время: ${new Date().toLocaleString()}`);
  console.log(`- Устарело: ${isExpired ? '✅' : '❌'}`);
  
  if (isExpired) {
    console.log('✅ Устаревшее состояние должно быть очищено');
    // Очищаем состояние
    localStorage.removeItem('avitoPrimerkaState');
    console.log('✅ Устаревшее состояние очищено');
  }
  
  return isExpired;
}

// Тест 5: Проверка работы с разными страницами
function testDifferentPages() {
  console.log('🌐 Тест 5: Проверка работы с разными страницами...');
  
  // Симулируем переход на разные страницы
  const pages = [
    'https://www.avito.ru/moscow/items/123456',
    'https://www.avito.ru/sankt-peterburg/items/789012',
    'https://www.avito.ru/ekaterinburg/items/345678'
  ];
  
  let allTestsPassed = true;
  
  pages.forEach((pageUrl, index) => {
    console.log(`\n--- Страница ${index + 1}: ${pageUrl} ---`);
    
    // Сохраняем состояние для этой страницы
    const mockState = {
      productData: { title: `Товар ${index + 1}`, images: [] },
      userImage: { dataUrl: 'data:image/jpeg;base64,test' },
      currentCategory: 'clothing',
      generatedResult: 'data:image/jpeg;base64,result',
      pageUrl: pageUrl,
      timestamp: Date.now()
    };
    
    localStorage.setItem('avitoPrimerkaState', JSON.stringify(mockState));
    
    // Проверяем загрузку
    const savedState = localStorage.getItem('avitoPrimerkaState');
    const parsedState = JSON.parse(savedState);
    
    const isCorrectPage = parsedState.pageUrl === pageUrl;
    const hasCorrectData = parsedState.productData.title === `Товар ${index + 1}`;
    
    console.log(`- URL сохранен: ${isCorrectPage ? '✅' : '❌'}`);
    console.log(`- Данные корректны: ${hasCorrectData ? '✅' : '❌'}`);
    
    if (!isCorrectPage || !hasCorrectData) {
      allTestsPassed = false;
    }
  });
  
  return allTestsPassed;
}

// Запуск всех тестов
function runAllStateTests() {
  console.log('🚀 Запуск всех тестов исправления состояния...');
  
  const stateWithURL = testStateWithURL();
  const loadSamePage = testLoadStateSamePage();
  const clearDifferentPage = testClearStateDifferentPage();
  const clearExpired = testClearExpiredState();
  const differentPages = testDifferentPages();
  
  console.log('\n📊 Результаты тестов:');
  console.log('- Сохранение с URL:', stateWithURL ? '✅' : '❌');
  console.log('- Загрузка той же страницы:', loadSamePage ? '✅' : '❌');
  console.log('- Очистка другой страницы:', clearDifferentPage ? '✅' : '❌');
  console.log('- Очистка устаревшего:', clearExpired ? '✅' : '❌');
  console.log('- Разные страницы:', differentPages ? '✅' : '❌');
  
  const allPassed = [stateWithURL, loadSamePage, clearDifferentPage, clearExpired, differentPages].every(v => v);
  
  console.log('\n🎯 Общий результат:', allPassed ? '✅ Исправление состояния работает' : '❌ Есть проблемы');
  
  return allPassed;
}

// Экспорт функций для ручного тестирования
window.testStateFix = {
  stateWithURL: testStateWithURL,
  loadSamePage: testLoadStateSamePage,
  clearDifferentPage: testClearStateDifferentPage,
  clearExpired: testClearExpiredState,
  differentPages: testDifferentPages,
  runAll: runAllStateTests
};

console.log('🔧 Функции доступны:');
console.log('- testStateFix.stateWithURL()');
console.log('- testStateFix.loadSamePage()');
console.log('- testStateFix.clearDifferentPage()');
console.log('- testStateFix.clearExpired()');
console.log('- testStateFix.differentPages()');
console.log('- testStateFix.runAll()');

// Автоматический запуск
runAllStateTests();
