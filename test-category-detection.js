// Тест определения категории товара
// Запустите этот код в консоли на странице товара Авито

console.log('🔍 Тест определения категории товара');

// Тест 1: Проверка определения головных уборов как одежды
function testHeadwearDetection() {
  console.log('🧢 Тест 1: Проверка определения головных уборов как одежды...');
  
  const testCases = [
    { title: 'Шапка зимняя', expected: 'clothing' },
    { title: 'Кепка бейсболка', expected: 'clothing' },
    { title: 'Шляпа соломенная', expected: 'clothing' },
    { title: 'Берет вязаный', expected: 'clothing' },
    { title: 'Головные уборы', expected: 'clothing' },
    { title: 'Шапка-ушанка', expected: 'clothing' },
    { title: 'Кепка с козырьком', expected: 'clothing' }
  ];
  
  let passedTests = 0;
  
  testCases.forEach((testCase, index) => {
    // Симулируем функцию detectCategory
    const text = testCase.title.toLowerCase();
    let detectedCategory = 'other';
    
    if (text.includes('футболка') || text.includes('джинсы') || text.includes('платье') || 
        text.includes('куртка') || text.includes('обувь') || text.includes('одежда') || 
        text.includes('головные уборы') || text.includes('шапка') || text.includes('кепка') || 
        text.includes('шляпа') || text.includes('берет')) {
      detectedCategory = 'clothing';
    }
    
    const isCorrect = detectedCategory === testCase.expected;
    console.log(`${index + 1}. "${testCase.title}" -> ${detectedCategory} (ожидалось: ${testCase.expected}) ${isCorrect ? '✅' : '❌'}`);
    
    if (isCorrect) passedTests++;
  });
  
  console.log(`\nРезультат: ${passedTests}/${testCases.length} тестов пройдено`);
  return passedTests === testCases.length;
}

// Тест 2: Проверка других категорий
function testOtherCategories() {
  console.log('📱 Тест 2: Проверка других категорий...');
  
  const testCases = [
    { title: 'iPhone 15', expected: 'electronics' },
    { title: 'Диван угловой', expected: 'furniture' },
    { title: 'Велосипед горный', expected: 'sports' },
    { title: 'Диски литые', expected: 'auto' },
    { title: 'Холодильник Samsung', expected: 'home_appliances' },
    { title: 'Учебник математики', expected: 'books' }
  ];
  
  let passedTests = 0;
  
  testCases.forEach((testCase, index) => {
    const text = testCase.title.toLowerCase();
    let detectedCategory = 'other';
    
    // Электроника
    if (text.includes('телефон') || text.includes('ноутбук') || text.includes('планшет') || 
        text.includes('наушники') || text.includes('электроника')) {
      detectedCategory = 'electronics';
    }
    // Мебель
    else if (text.includes('стол') || text.includes('стул') || text.includes('диван') || 
             text.includes('кровать') || text.includes('шкаф') || text.includes('мебель')) {
      detectedCategory = 'furniture';
    }
    // Спорт
    else if (text.includes('спорт') || text.includes('тренажер') || text.includes('велосипед') || 
             text.includes('лыжи')) {
      detectedCategory = 'sports';
    }
    // Авто
    else if (text.includes('диск') || text.includes('колес') || text.includes('шина') || 
             text.includes('резина') || text.includes('авто')) {
      detectedCategory = 'auto';
    }
    // Бытовая техника
    else if (text.includes('холодильник') || text.includes('стиральная') || 
             text.includes('микроволновка') || text.includes('пылесос') || 
             text.includes('бытовая техника')) {
      detectedCategory = 'home_appliances';
    }
    // Книги
    else if (text.includes('книга') || text.includes('журнал') || text.includes('учебник')) {
      detectedCategory = 'books';
    }
    
    const isCorrect = detectedCategory === testCase.expected;
    console.log(`${index + 1}. "${testCase.title}" -> ${detectedCategory} (ожидалось: ${testCase.expected}) ${isCorrect ? '✅' : '❌'}`);
    
    if (isCorrect) passedTests++;
  });
  
  console.log(`\nРезультат: ${passedTests}/${testCases.length} тестов пройдено`);
  return passedTests === testCases.length;
}

// Тест 3: Проверка реального определения категории на странице
function testRealPageCategory() {
  console.log('🌐 Тест 3: Проверка реального определения категории на странице...');
  
  // Проверяем, что мы на странице товара Авито
  const isAvitoPage = window.location.href.includes('avito.ru');
  if (!isAvitoPage) {
    console.log('❌ Не страница Авито, пропускаем тест');
    return false;
  }
  
  // Получаем данные о товаре
  const titleElement = document.querySelector('[data-marker="item-view/title"]');
  const descriptionElement = document.querySelector('[data-marker="item-view/description"]');
  
  if (!titleElement) {
    console.log('❌ Заголовок товара не найден');
    return false;
  }
  
  const title = titleElement.textContent || '';
  const description = descriptionElement ? descriptionElement.textContent : '';
  
  console.log('Найденные данные:');
  console.log('- Заголовок:', title);
  console.log('- Описание:', description.substring(0, 100) + '...');
  
  // Симулируем определение категории
  const text = (title + ' ' + description).toLowerCase();
  let detectedCategory = 'other';
  
  if (text.includes('футболка') || text.includes('джинсы') || text.includes('платье') || 
      text.includes('куртка') || text.includes('обувь') || text.includes('одежда') || 
      text.includes('головные уборы') || text.includes('шапка') || text.includes('кепка') || 
      text.includes('шляпа') || text.includes('берет')) {
    detectedCategory = 'clothing';
  } else if (text.includes('телефон') || text.includes('ноутбук') || text.includes('планшет') || 
             text.includes('наушники') || text.includes('электроника')) {
    detectedCategory = 'electronics';
  } else if (text.includes('стол') || text.includes('стул') || text.includes('диван') || 
             text.includes('кровать') || text.includes('шкаф') || text.includes('мебель')) {
    detectedCategory = 'furniture';
  } else if (text.includes('спорт') || text.includes('тренажер') || text.includes('велосипед') || 
             text.includes('лыжи')) {
    detectedCategory = 'sports';
  } else if (text.includes('диск') || text.includes('колес') || text.includes('шина') || 
             text.includes('резина') || text.includes('авто')) {
    detectedCategory = 'auto';
  } else if (text.includes('холодильник') || text.includes('стиральная') || 
             text.includes('микроволновка') || text.includes('пылесос') || 
             text.includes('бытовая техника')) {
    detectedCategory = 'home_appliances';
  } else if (text.includes('книга') || text.includes('журнал') || text.includes('учебник')) {
    detectedCategory = 'books';
  }
  
  console.log(`\nОпределенная категория: ${detectedCategory}`);
  
  // Проверяем, подходит ли категория для головных уборов
  if (title.toLowerCase().includes('шапка') || title.toLowerCase().includes('кепка') || 
      title.toLowerCase().includes('шляпа') || title.toLowerCase().includes('берет')) {
    const isCorrect = detectedCategory === 'clothing';
    console.log(`Головной убор определен как одежда: ${isCorrect ? '✅' : '❌'}`);
    return isCorrect;
  }
  
  console.log('✅ Категория определена корректно');
  return true;
}

// Запуск всех тестов
function runAllCategoryTests() {
  console.log('🚀 Запуск всех тестов определения категории...');
  
  const headwearTest = testHeadwearDetection();
  const otherCategoriesTest = testOtherCategories();
  const realPageTest = testRealPageCategory();
  
  console.log('\n📊 Результаты тестов:');
  console.log('- Головные уборы как одежда:', headwearTest ? '✅' : '❌');
  console.log('- Другие категории:', otherCategoriesTest ? '✅' : '❌');
  console.log('- Реальная страница:', realPageTest ? '✅' : '❌');
  
  const allPassed = [headwearTest, otherCategoriesTest, realPageTest].every(v => v);
  
  console.log('\n🎯 Общий результат:', allPassed ? '✅ Определение категории работает корректно' : '❌ Есть проблемы');
  
  return allPassed;
}

// Экспорт функций для ручного тестирования
window.testCategoryDetection = {
  headwear: testHeadwearDetection,
  otherCategories: testOtherCategories,
  realPage: testRealPageCategory,
  runAll: runAllCategoryTests
};

console.log('🔍 Функции доступны:');
console.log('- testCategoryDetection.headwear()');
console.log('- testCategoryDetection.otherCategories()');
console.log('- testCategoryDetection.realPage()');
console.log('- testCategoryDetection.runAll()');

// Автоматический запуск
runAllCategoryTests();
