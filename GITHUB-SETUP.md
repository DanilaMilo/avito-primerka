# 🚀 Загрузка проекта в GitHub

## 📋 Пошаговая инструкция

### 1. **Создайте репозиторий на GitHub**

1. Перейдите на [github.com](https://github.com)
2. Нажмите **"New repository"** (зеленая кнопка)
3. Заполните форму:
   - **Repository name:** `avito-primerka`
   - **Description:** `Виртуальная примерка товаров на Авито с помощью AI`
   - **Visibility:** Public (для хакатона)
   - **Initialize:** НЕ ставьте галочки (у нас уже есть файлы)
4. Нажмите **"Create repository"**

### 2. **Инициализируйте Git в проекте**

Откройте терминал в папке проекта и выполните:

```bash
# Перейдите в папку проекта
cd /Users/dvmilovanov/Projects/avito_primerka

# Инициализируйте Git репозиторий
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit: Авито Примерка - Chrome расширение для виртуальной примерки товаров"
```

### 3. **Подключите к GitHub репозиторию**

```bash
# Добавьте удаленный репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/avito-primerka.git

# Установите основную ветку
git branch -M main

# Загрузите код в GitHub
git push -u origin main
```

### 4. **Настройте репозиторий**

После загрузки:

1. **Добавьте описание** в настройках репозитория
2. **Добавьте теги:** `chrome-extension`, `ai`, `avito`, `virtual-try-on`, `hackathon`
3. **Включите Issues** для обратной связи
4. **Добавьте лицензию** (MIT License)

## 📁 Структура проекта

```
avito-primerka/
├── README.md                    # Основная документация
├── INSTALL.md                   # Быстрая установка
├── DEMO.md                      # Демонстрация возможностей
├── CATEGORY-DETECTION-GUIDE.md   # Руководство по категориям
├── test-category-detection.js   # Тесты определения категории
├── test-state-fix.js            # Тесты исправления состояния
└── extension/                    # Код расширения
    ├── manifest.json            # Конфигурация
    ├── background.js              # Фоновый скрипт
    ├── content.js               # Скрипт для страниц Авито
    ├── popup.html               # HTML интерфейса
    ├── popup.js                 # Логика интерфейса
    ├── styles.css               # Стили
    └── icons/                   # Иконки расширения
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

## 🎯 Для презентации на хакатоне

### **Ключевые моменты:**

1. **Демонстрация установки:**
   - Покажите 4 простых шага из `INSTALL.md`
   - Установите расширение в Chrome
   - Настройте API ключ

2. **Демонстрация работы:**
   - Откройте страницу товара на Авито
   - Покажите кнопку "Примерить"
   - Загрузите тестовое фото
   - Покажите результат AI генерации

3. **Технические особенности:**
   - Chrome Extension (Manifest V3)
   - Google Gemini 2.5 Flash через OpenRouter
   - Полупрозрачная кнопка с эффектом размытия
   - Сохранение состояния
   - Определение категорий товаров

### **Готовые материалы:**

- ✅ **README.md** - полная документация
- ✅ **INSTALL.md** - быстрая установка
- ✅ **DEMO.md** - демонстрация возможностей
- ✅ **Тесты** - для проверки функциональности
- ✅ **Руководства** - по настройке и отладке

## 🔧 Дополнительные настройки

### **Добавьте .gitignore:**

```bash
# Создайте файл .gitignore
echo "node_modules/
.env
*.log
.DS_Store
Thumbs.db" > .gitignore

git add .gitignore
git commit -m "Add .gitignore"
git push
```

### **Добавьте лицензию:**

```bash
# Создайте файл LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Avito Primerka

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "Add MIT License"
git push
```

## 🎉 Готово!

После выполнения всех шагов у вас будет:

- ✅ **Публичный репозиторий** на GitHub
- ✅ **Полная документация** для пользователей
- ✅ **Инструкции по установке** для хакатона
- ✅ **Готовый код** для демонстрации
- ✅ **Тесты** для проверки функциональности

**Удачи на хакатоне!** 🚀
