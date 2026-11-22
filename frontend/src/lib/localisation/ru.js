export const t = {
  review: {
    scrollColumns: "Проведите в сторону, чтобы увидеть все столбцы",
    scrollPrevious: "Предыдущие столбцы",
    scrollNext: "Следующие столбцы",
    mediaFileReadFailed: "Не удалось прочитать файл. Попробуйте выбрать его снова.",
    mediaTextSize: "Сообщение слишком большое: разрешено до 100 000 символов.",
    usbPresets: "Типовые значения порта",
    usbPresetHint: "Пресеты заполняют поле. Это не проверка подключения устройства.",
    programInvalid: "Укажите название и положительный целый номер кнопки или оставьте номер пустым.",
    programButtonConflict: "Этот номер кнопки уже назначен другой программе.",
    programDeleteConfirm: "Удалить DEV-программу «{name}»?",
    programProtected: "Начальные программы сохранены; удалять можно созданные DEV-программы.",
    programActive: "Программа «{name}» включена",
    programEnabled: "Включена",
    programEditTitle: "Настройки программы",
    programAssignTitle: "Назначить кнопку",
    programManualHint: "DEV: ручное назначение кнопок сохраняется локально. Физическое определение нажатия требует Go API.",
    programButtonNumber: "Номер кнопки",
    programButtonEmpty: "Пустое поле снимает назначение. Номер кнопки не связан со слотами реле.",
    programCopyUnavailable: "Копирование настроек между пультами ещё не подключено.",
    moveUp: "Переместить выше",
    moveDown: "Переместить ниже",
    mediaClear: "Убрать форматирование",
    mediaAddImage: "Добавить изображение",
    mediaReplaceImage: "Заменить изображение",
    mediaDeleteImage: "Удалить изображение",
    mediaPreview: "Просмотр",
    mediaEdit: "Редактировать",
    mediaLimits: "PNG, JPEG, WebP или GIF: до 2 МБ на файл, до 10 изображений, до 16 Мп. Нажмите изображение, чтобы заменить или удалить его.",
    mediaLoading: "Обработка изображения…",
    mediaFileType: "Файл должен быть настоящим PNG, JPEG, WebP или GIF.",
    mediaFileSize: "Выберите непустой файл размером до 2 МБ.",
    mediaDimensions: "Изображение слишком большое: разрешено до 16 миллионов пикселей.",
    mediaImageCount: "Разрешено до 10 изображений в сообщении.",
    mediaStorageUnavailable: "IndexedDB недоступна. Разрешите локальное хранилище браузера и откройте форму снова.",
    mediaStorageFull: "Лимит медиафайлов этого браузера — 50 МБ. Уменьшите количество изображений.",
    mediaCommandUnsupported: "Браузер не поддерживает эту команду редактора.",
    mediaVisualLocal: "DEV: текст и изображения сохраняются в этом браузере. Отображение HTML, изображений и GIF на терминале ещё не подключено.",
    telegramOpen: "Открыть Telegram",
    telegramNotConfigured: "Ссылка не настроена",
    telegramHint: "Откройте чат самостоятельно и передайте описание или скачанный отчёт. Автоматической отправки нет.",
    relaySlotsSummary: "DEV-слоты: занято {occupied}, доступно {free}. Это локальные назначения, без управления оборудованием.",
    relaySlots: "Слоты реле",
    relaySlot: "DEV-слот реле (1–12)",
    relayOccupied: "Занят",
    relayFree: "Доступен",
    relayConflict: "Конфликт",
    relayLegacy: "Старое обозначение «{value}» — выберите слот",
    relaySlotInvalid: "Выберите слот реле от 1 до 12. Старое обозначение не изменяется без вашего выбора.",
    relaySlotOccupied: "Этот слот уже назначен другому узлу. Выберите доступный слот.",
    pauseTitle: "Пауза",
    pauseDuration: "Длительность паузы, секунд",
    pauseHint: "Пауза временно приостанавливает текущую программу на заданное время. В DEV сохраняется только длительность; выполнение команды оборудованием требует Go API.",
    pauseInvalid: "Укажите положительную целую длительность паузы в секундах.",
    paypassPaymentOnly: "PayPass — способ оплаты. Реальные платежи здесь не выполняются.",
    promoGlobal: "Для всей мойки",
    promoIndividual: "Для выбранных пультов",
    promoScope: "Область действия Promo",
    promoLocalHint: "DEV: глобальная или индивидуальная конфигурация Promo. Сохранение не активирует акцию на оборудовании и не изменяет платежи.",
    promoPultHint: "Показана сохранённая DEV-конфигурация для этого пульта. Изменить область действия и выбор пультов можно в разделе «Сервис». Оборудование не изменяется.",
    promoInvalid: "Для индивидуального Promo выберите хотя бы один пульт или выключите Promo.",
    discountSinglePolicy: "Скидки не суммируются: к одному платежу может применяться только одна. Выбор при совпадении нескольких условий должен быть согласован с Go; здесь платежи не рассчитываются.",
    locationHint: "Найдите введённый адрес или выберите точку на карте. Поиск передаёт адрес сервису Photon. При необходимости адрес и координаты можно указать вручную.",
    locationSearch: "Найти на карте",
    geocodeLoading: "Поиск адреса…",
    locationMap: "Карта: выберите точку, перетаскивайте для перемещения. Стрелки перемещают карту, Enter выбирает центр.",
    mapZoomIn: "Увеличить карту",
    mapZoomOut: "Уменьшить карту",
    mapUnavailable: "Карта недоступна. Адрес и координаты можно ввести вручную; существующие данные не изменены.",
    latitude: "Широта",
    longitude: "Долгота",
    locationInvalid: "Укажите адрес для поиска или корректную пару координат: широта −90…90, долгота −180…180.",
    geocodeFailed: "Не удалось определить адрес. Проверьте сеть или введите адрес и координаты вручную.",
    geocodeNotFound: "Адрес не найден. Уточните запрос, выберите точку или введите данные вручную.",
    usbAuto: 'Автоматически (auto)',
    usbUseAuto: 'Установить auto для поля «{field}». Сохраните конфигурацию отдельно.',
    discountState: 'Состояние конфигурации',
    discountEnabled: 'Активна',
    discountDisabled: 'Неактивна',
    discountAddProgram: 'Добавить программу +',
    configUnavailable: "Сохранение недоступно: API этих настроек ещё не согласован с Go. Данные не переданы серверу или оборудованию.",
    configReadFailed: "Не удалось прочитать конфигурацию. Сохранение заблокировано, чтобы не перезаписать существующие данные.",
    configInvalid: "Проверьте значения полей конфигурации.",
    configSaveFailed: "Не удалось сохранить в браузере. Черновик остался в форме.",
    configConflict: "Конфигурация изменена в другой вкладке. Скопируйте свой черновик и откройте форму снова перед сохранением.",
    configSaved: "Конфигурация сохранена только в этом браузере. Сервер и оборудование не изменялись.",
    configSave: "Сохранить локально",
    pultConfigLocal: "DEV: локальная конфигурация этого пульта. Сохранение не подключает устройство и не передаёт команды оборудованию.",
    equipmentList: "Оборудование пульта",
    equipmentInvalid: "Укажите название и обозначение контроллера/реле. Формат связи с физическим контроллером ещё не согласован.",
    equipmentDependencies: "Удаление заблокировано: зависимости исходного модуля не описаны. Можно удалять только новые, не подключённые DEV-узлы. Журнал ТО не изменяется.",
    equipmentDeleteConfirm: "Удалить локальный узел «{name}»? Журнал ТО и другие данные останутся без изменений.",
    hours: "ч.",
    usbInvalid: "Для каждого устройства укажите непустой уникальный Slave ID и выберите тип из списка.",
    timeFrom: "От",
    timeTo: "До",
    washTimeInvalid: "Укажите время «От» и «До» в пределах одних суток; время окончания должно быть позже начала.",
    washTimeLocal: "DEV: настройки мойки сохраняются в браузере. Интервал «От/До» — в пределах одних суток; выполнение расписания оборудованием ещё не подключено.",
    mediaFormatting: "Форматирование HTML",
    mediaTag_b: "Жирный",
    mediaTag_i: "Курсив",
    mediaTag_u: "Подчёркнутый",
    mediaTag_br: "Новая строка",
    mediaHtmlLocal: "DEV: HTML сохраняется как текст без выполнения или предпросмотра. Поддержку тегов и безопасное отображение на пульте нужно согласовать с Go.",
    discountLocal: "DEV: редактор локальной конфигурации. Эти правила не применяются к платежам. Галочка включает правило, крестик выключает; изменения вступят в силу в конфигурации после сохранения.",
    discountInvalid: "Сумма должна быть неотрицательной, скидка — от 0 до 100%. Проверьте время, дни и список программ.",
    discountChooseProgram: "Выберите программу",
    discountProgramsUnavailable: "Не удалось прочитать список программ. Существующие привязки скидок не изменены.",
    discountEnable: "Включить правило в локальной конфигурации",
    discountDisable: "Выключить правило в локальной конфигурации",
    discountEdit: "Редактировать процент",
    discountClientsUnavailable: "Назначение клиентам требует согласованного API и правил применения.",
    clientIdentityRequired: 'Укажите хотя бы имя, фамилию, телефон, email или номер карты.',
    clientEmailInvalid: 'Проверьте адрес электронной почты.',
    clientFormHint: 'Достаточно одного поля для идентификации клиента. Остальные можно оставить пустыми.',
    clientSaveFailed: 'Не удалось сохранить клиента. Введённые данные остались в форме — проверьте соединение и повторите попытку.',
    cardUID: 'Номер карты',
    cardDiscount: 'Скидка, %',
    cardDiscountInvalid: 'Скидка должна быть числом от 0 до 100%.',
    adminBindConfirm: 'Привязать карту «{card}» к администратору «{admin}»?',
    adminUnbindConfirm: 'Отвязать карту администратора «{admin}»?',
    adminCardPending: 'Изменение привязки вступит в силу после нажатия «Отправить» и успешного сохранения.',
    adminCardLinked: 'Карта «{card}» привязана к администратору «{admin}».',
    adminCardUnlinked: 'Карта администратора «{admin}» отвязана.',
    maintenanceReadonly: 'Журнал технического обслуживания доступен только для просмотра.',
    usbUnavailable: 'Сохранение USB-конфигурации в оборудование ещё не подключено. Изменения не переданы пульту.',
    programWholeMoney: 'Цена и себестоимость должны быть неотрицательными целыми суммами в гривнах.',
    programLegacyMoney: 'Эта программа содержит сумму с копейками. Значения сохранены без округления; перед сохранением явно укажите целые гривны.'
  },
  header: {
    notificationCount: { one: '{count} сообщение', few: '{count} сообщения', many: '{count} сообщений', other: '{count} сообщения' }
  },
  common: {
    brand: "BIG WASH",
    loading: "Пожалуйста, подождите...",
    updated: "Обновлено",
    actions: "Действие",
    search: "поиск...",
    error: "Отчет об ошибке",
    save: "Сохранить",
    cancel: "Отмена",
    saved: "Сохранено",
    unsavedChanges: "Есть несохраненные изменения"
  },

  sidebar: {
    stats: "Статистика",
    cards: "Карты",
    clients: "Клиенты",
    ops: "Операции",
    admins: "Администраторы",
    notify: "Уведомления",
    help: "Справка",
    settings: "Настройки",
    logout: "Выход"
  },

  auth: {
    localHttpsRequired: "Для DEV-входа и регистрации с телефона нужен доверенный HTTPS. Запустите start-dev-lan.bat и откройте HTTPS-адрес из консоли. HTTP localhost работает только на компьютере с BigWash.",
    localCryptoUnavailable: "Web Crypto API недоступен. Откройте BigWash через доверенный HTTPS или localhost и проверьте поддержку браузера.",
    localOperationFailed: "Не удалось выполнить локальную авторизацию. Проверьте доступность хранилища браузера. Запрос авторизации в Go API не отправлялся.",
    loginTitle: "Авторизация",
    registerTitle: "Создать аккаунт",
    emailPlace: "Email или Телефон",
    passPlace: "Пароль",
    firstNamePlace: "Имя",
    lastNamePlace: "Фамилия",
    phonePlace: "Телефон",
    btnSignIn: "Войти",
    btnSignUp: "Регистрация",
    noAccount: "Нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    signUpDesc: "Зарегистрируйтесь и начните управлять своими автомойками",
    signInDesc: "Войдите, чтобы продолжить управление вашими автомойками"
  },

  dashboard: {
    headTitle: "Главная / Статистика",
    btnDelete: "Удалить статистику",
    btnAddEquip: "+ Оборудование",
    profit: "Прибыль",
    expenses: "Расходы",
    balance: "Баланс",
    compared: "от прошлого месяца",
    chartTitle: "Прибыль и расходы",
    periods: { day: "День", month: "Месяц", year: "Год" }
  },

  cards: {
    headTitle: "Главная / Карты",
    title: "Список карт",
    actions: {
      add: "Добавить карту",
      scan: "Определить карту",
      logs: "Журнал пополнений"
    },
    stats: {
      total: "Всего карт",
      noClient: "Карт без клиентов",
      money: "Денег на картах",
      brsm: "БРСМ-карты"
    },
    table: {
      uid: "UID",
      amount: "Денег",
      client: "Client",
      registered: "Зарегистрировано",
      lastUsed: "В последний раз использовано",
      noClient: "Не установлено"
    }
  },

  pultsModal: {
    tabs: {
      media: "Медиа",
      data: "Данные",
      equipment: "Оборудование",
      operations: "Операции",
      kassa: "Касса ПРРО",
      programs: "Программы",
      actions: "Действия",
      usb: "USB"
    },
    side: {
      totalWashes: "Всего моек",
      balance: "Баланс на пульте",
      model: "Модель",
      modelType: "Кнопочная",
      name: "Название",
      wash: "Мойка",
      login: "Логин",
      ip: "IP-адрес",
      kassaLogin: "Логин кассы",
      noData: "Нет",
      pultStatus: "Статус пульта",
      cashStatus: "Статус наличных",
      relayStatus: "Статус реле",
      buttonsBoard: "Плата кнопок",
      allGood: "Всё хорошо", // или "Все хорошо"
      error: "Ошибка",
      pinkFoam: "Розовая пена",
      launch: "Запуск",
      client: "Клиент",
      card: "Карточка"
    },
    media: {
      title: "Медиа-данные пульта",
      enableToggle: "Включить сообщение дня на экране терминала",
      msgTitle: "Текст сообщения дня",
      placeholder: "Введите сообщение для привлечения клиентов...",
      subtext: "Отображается в режиме ожидания для привлечения клиентов"
    },
    data: {
      title: "Данные пульта",
      pultName: "Название пульта:",
      timer: "Таймер на начало мойки (сек):",
      takeOffMoney: "Снимать деньги по умолчанию принудительно",
      recordMode: "Режим записи служебных карт на картсчитывателе",
      webLogin: "Логин для веб-панели пульта",
      password: "Пароль для авторизации",
      generate: "Сгенерировать"
    },
    equipment: {
      title: "Оборудование мойного поста",
      moduleName: "Название модуля:",
      controllerRelay: "Контроллер № Реле:",
      totalTime: "Суммарное время работы:",
      addMaintenance: "Добавить тип ТО",
      editNode: "Редактировать узел",
      deleteModule: "Удалить модуль",
      emulatorTitle: "Эмуляция экрана",
      activeText: "Помпа пены активна",
      addNewEquip: "Добавить новое оборудование в список +",
      journalTitle: "Журнал технического обслуживания",
      table: {
        num: "№",
        equip: "Оборудование",
        action: "Что сделано",
        plan: "Плановое (г)",
        fact: "Фактическое (г)",
        date: "Дата",
        actions: "Действие"
      }
    },
    operations: {
      title: "Финансовые операции",
      monthCash: "Фискальная каса за месяц",
      dayCash: "Фискальная каса за текущий день",
      cashLabel: "Наличные",
      cashlessLabel: "Безналичные",
      collectionBtn: "Провести инкассацию пульта ⚠️",
      cashAcceptor: "Наличкоприемник (купюры)",
      nominal: "Номинал",
      count: "Количество",
      programsReportTitle: "Использование установленных программ за последние 3 месяца",
      table: {
        num: "№",
        progName: "Название программы",
        minPrice: "Стоимость минуты",
        totalSum: "Общая сумма (грн)",
        totalTime: "Суммарное время (мин)"
      }
    },
    kassa: {
      title: "Настройка кассы ПРРО",
      enablePrro: "Включить фискализацию ПРРО",
      testMode: "Тестовый режим сервера ГНС",
      cashierLogin: "Логин кассира:",
      token: "Токен кассы (Ключ доступа API):",
      host: "Хост кассы (IP сервера):",
      port: "Порт:",
      printer: "Название принтера чеков:",
      pass: "Пароль кассира:",
      license: "Ключ лицензии ПРРО:",
      paypassTitle: "Параметры интеграции PayPass терминала",
      paypassIp: "PayPass IP адрес:",
      paypassPort: "PayPass порт:",
      paypassMid: "PayPass MID (Идентификатор мерчанта):",
      logsTitle: "Лог последних операций кассы",
      table: {
        txId: "ID транзакции",
        checkType: "Тип чека",
        opName: "Название операции",
        sum: "Сумма",
        status: "Статус отправки ГНС"
      }
    },
    programs: {
      title: "Программы",
      addProg: "Добавить программу",
      copySettings: "Скопировать настройки с другого пульта 📋",
      mainPrograms: "Программы",
      servicePrograms: "Сервисные программы",
      colName: "Название",
      colBtn: "Кнопка",
      colAction: "Действие",
      define: "Определить",
      saveProgs: "Сохранить программы",
      saveServiceProgs: "Сохранить сервисные программы"
    },
    actions: {
      title: "Действия над пультом",
      reboot: "Перезагрузить пульт",
      zPaypass: "Z-отчет PayPass",
      init: "Запустить инит",
      zVchasno: "Z-отчет VchasnoKasa",
      autoZReport: "Автоматический Z-отчет:",
      logsTitle: "Логи",
      clearLogs: "Очистить логи 🧼"
    },
    usb: {
      title: "Настройка USB",
      paypassPort: "USB порт для PayPass",
      cashPort: "USB порт для наличкоприемника",
      buttonsPort: "USB порт для платы кнопок \"ButtonBoard\"",
      barcodePort: "USB порт для сканера штрих-кода \"barCode\"",
      slaveId: "SlaveId",
      type: "Тип",
      addDevice: "Добавить девайс +"
    }
  },

  types: {
    method: "МЕТОД",
    count: "КОЛИЧЕСТВО",
    percent: "ПРОЦЕНТ",
    transType: "ТИП ТРАНЗАКЦИИ",
    sum: "СУММА",
    cash: "Наличные",
    card: "Карта",
    paypass: "PayPass",
    refill: "Пополнение",
    wash: "Мойка"
  },

  calendar: {
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  },
  // Preserve the canonical shared preview label used by translate().
  ui: {
    "programs": {
      "preview": {
        "title": "Предпросмотр"
      },
      "actions": {
        "chooseFile": "Выбрать файл",
        "delete": "Удалить программу",
        "help": "Справка",
        "edit": "Редактировать программу"
      },
      "confirm": {
        "delete": "Удалить программу «{p0}»?"
      },
      "validation": {
        "invalidFields": "Укажите название, неотрицательные цену и себестоимость и положительную длительность импульса."
      },
      "columns": {
        "dateAdded": "ДАТА ДОБАВЛЕНИЯ",
        "nameUppercase": "НАЗВАНИЕ",
        "priceUppercase": "ЦЕНА"
      },
      "saveChangesHint": "Изменения будут применены сразу после нажатия кнопки сохранения.",
      "fields": {
        "image": "Изображение",
        "description": "Описание",
        "cost": "Себестоимость (грн)",
        "billingType": "Тип тарификации",
        "durationSeconds": "Длительность (сек)",
        "priceHryvnias": "Цена (грн)",
        "pricePerPulse": "Цена за 1 импульс (грн)",
        "pricePerLitre": "Цена за литр (грн)",
        "pricePerMinute": "Цена за минуту (грн)"
      },
      "description": "Настройка активных программ мойки",
      "errors": {
        "saveFailed": "Не удалось сохранить программы в браузере. Попробуйте ещё раз.",
        "loadFailed": "Не удалось прочитать сохранённые программы. Показан начальный список."
      },
      "placeholders": {
        "search": "Поиск...",
        "price": "Цена..."
      },
      "modal": {
        "editTitle": "Редактирование: {p0}"
      },
      "billing": {
        "perMinute": "⏱ Поминутная (грн/мин)",
        "perPulse": "⚡ Импульсная (Импульс)",
        "perLitre": "💧 По объёму (грн/л)"
      }
    },
    "dashboard": {
      "demo": {
        "catalogNoticeContinuation": " Названия взяты из локальных справочников; операции остаются тестовыми.",
        "catalogNotice": "Названия взяты из локальных справочников; операции остаются тестовыми.",
        "disclaimer": "Пример для просмотра интерфейса — это не реальные финансовые данные. Показатели рассчитаны по стабильному тестовому журналу.",
        "showExample": "Пример заполненной статистики"
      },
      "telegram": {
        "botName": "BigWash Notify",
        "balancePrefix": "Баланс: ₴",
        "bonusesPrefix": "Бонусы: ₴",
        "expensesPrefix": "Расходы: ₴",
        "noRecentPayments": "За последний день нет оплат.",
        "previewLabel": "Предварительный просмотр",
        "incomePrefix": "Прибыль: ₴",
        "demoHint": "Пример уведомлений по журналу. Telegram не подключён; сообщения не отправляются.",
        "paymentPrefix": "💳 Оплата ·",
        "dailyReportPrefix": "📊 Дневной отчёт ·",
        "eventsHint": "🔔 Оплаты · Отчёты · Активность пультов",
        "title": "🤖 Телеграм-бот"
      },
      "transactions": {
        "expensesPrefix": "· Расходы: ₴",
        "incomePrefix": "· Прибыль: ₴",
        "types": {
          "expense": "Расход",
          "payment": "Оплата",
          "cardTopup": "Пополнение карты"
        },
        "recordsPrefix": "Записей:",
        "columns": {
          "clientDescription": "Клиент / описание",
          "pultProgram": "Пульт / программа",
          "typeMethod": "Тип / способ"
        },
        "title": "Транзакции"
      },
      "activePults": {
        "title": "Активные пульты",
        "activityHint": "Активность по журналу операций, а не текущее состояние оборудования.",
        "withoutOperations": "Пульты без операций",
        "withOperations": "Пульты с операциями"
      },
      "pultActivity": {
        "title": "Активность пультов"
      },
      "finance": {
        "bonusesLegendPrefix": "Бонусы · ₴",
        "expenses": "Расходы",
        "noComparison": "Нет базы сравнения",
        "income": "Прибыль",
        "title": "Прибыль и расходы",
        "fromLastMonth": "от прошлого месяца",
        "previousPeriod": "к предыдущему периоду",
        "incomeWithIcon": "💰 Прибыль",
        "balanceWithIcon": "💵 Баланс",
        "expensesWithIcon": "💸 Расходы"
      },
      "columns": {
        "percentageUppercase": "ПРОЦЕНТ",
        "percentage": "Процент",
        "countUppercase": "КОЛИЧЕСТВО",
        "methodUppercase": "МЕТОД",
        "method": "МЕТОД",
        "operationsCount": "Операций",
        "progress": "Прогресс"
      },
      "actions": {
        "deleteStatistics": "Удалить статистику"
      },
      "breadcrumb": {
        "legacy": "Главная / Статистика"
      },
      "pagination": {
        "next": "Далее →",
        "previous": "← Назад"
      },
      "periods": {
        "day": "День",
        "month": "Месяц",
        "overview": "Обзор",
        "year": "Год"
      },
      "dataSource": {
        "label": "Источник статистики",
        "apiJournal": "Журнал API",
        "localJournal": "Локальный журнал",
        "localLedgerDisclaimer": "записей. Данные могут быть неполными. Пополнения карт не учитываются как доход. Баланс = прибыль − расходы − бонусы."
      },
      "payments": {
        "title": "Способы оплаты"
      },
      "programs": {
        "title": "Самые популярные программы"
      },
      "errors": {
        "loadFailed": "Не удалось загрузить статистику API."
      },
      "empty": {
        "activity": "Нет активности за выбранный период",
        "clients": "Нет клиентов за выбранный период",
        "operations": "Нет операций за выбранный период",
        "payments": "Нет оплат за выбранный период",
        "transactions": "Нет транзакций за выбранный период"
      },
      "periodLabels": {
        "activePults": "Период: активные пульты",
        "pultActivity": "Период: активность пультов",
        "clients": "Период: клиенты",
        "payments": "Период: способы оплаты",
        "finance": "Период: прибыль и расходы",
        "programs": "Период: программы",
        "transactions": "Период: транзакции"
      },
      "states": {
        "programUnspecified": "Программа не указана",
        "pultUnspecified": "Пульт не указан"
      },
      "title": "Статистика"
    },
    "shared": {
      "loading": {
        "parenthesized": "(Загрузка...)",
        "wait": "Пожалуйста, подождите..."
      },
      "brand": {
        "washName": "BIG WASH",
        "pageTitleSuffix": "— BigWash"
      },
      "roles": {
        "service": "Сервис"
      },
      "unsavedChanges": {
        "title": "Есть несохранённые изменения"
      },
      "fields": {
        "firstName": "Имя",
        "discount": "Скидка",
        "login": "Логин",
        "name": "Название",
        "programName": "Название программы",
        "nameWithColon": "Название:",
        "optional": "Необязательно",
        "status": "Статус",
        "phone": "Телефон"
      },
      "states": {
        "active": "Активна",
        "unchanged": "Без изменений",
        "sent": "Отправлено",
        "saved": "Сохранено",
        "savedLocally": "Сохранено локально",
        "scanning": "Считывание...",
        "inactiveSpaced": "Не активна",
        "notSelected": "Не выбрано",
        "updated": "Обновлено",
        "error": "Ошибка",
        "test": "Тестовый"
      },
      "finance": {
        "balance": "Баланс",
        "bonuses": "Бонусы"
      },
      "payments": {
        "nonCashPlural": "Безналичные",
        "cashSingular": "Наличные",
        "cashPlural": "Наличные"
      },
      "actions": {
        "delete": "Удалить",
        "identify": "Определить",
        "logout": "Выход",
        "addProgram": "Добавить программу",
        "downloadJson": "Скачать JSON",
        "close": "Закрыть",
        "apply": "Применить",
        "save": "Сохранить",
        "saveChanges": "Сохранить изменения",
        "search": "Поиск",
        "edit": "Редактировать",
        "cancel": "Отменить",
        "reset": "Сбросить"
      },
      "columns": {
        "money": "Денег",
        "date": "Дата",
        "action": "Действие",
        "registered": "Зарегистрировано",
        "client": "Клиент",
        "count": "Количество",
        "pult": "Пульт",
        "amountUppercase": "СУММА",
        "amount": "Сумма",
        "number": "№"
      },
      "demo": {
        "saveDisabled": "Деморежим: изменения не сохраняются.",
        "banner": "🧪 Демонстрационный просмотр: показаны примерные данные. Backend не подключён; изменения не сохраняются."
      },
      "titles": {
        "clients": "Клиенты",
        "programs": "Программы"
      },
      "mode": {
        "localData": "Локальные данные"
      },
      "errors": {
        "invalidData": "Проверьте введённые данные.",
        "deleteFailed": "Ошибка удаления.",
        "executionFailed": "Ошибка выполнения"
      },
      "themes": {
        "light": "Светлая",
        "dark": "Тёмная"
      },
      "time": {
        "justNow": "Только что"
      },
      "units": {
        "hryvnia": "грн",
        "hryvniasPerLitre": "грн/л",
        "hryvniasPerMinute": "грн/мин",
        "pulse": "импульс",
        "pieces": "шт."
      },
      "placeholders": {
        "search": "поиск..."
      }
    },
    "service": {
      "pricing": {
        "secondWashOnly": "*Только для второй мойки"
      },
      "api": {
        "keyLabel": "API-ключ BigWash"
      },
      "kiosk": {
        "title": "Режим киоска",
        "description": "Режим терминала самообслуживания"
      },
      "payments": {
        "liqPay": "LiqPay (ПриватБанк)",
        "monobank": "Monobank Checkout",
        "qrPay": "QRPay",
        "stripe": "Stripe",
        "title": "Платёжная система",
        "qrHint": "Приём платежей через QR"
      },
      "title": "Сервис",
      "promo": {
        "enable": "Активировать рекламные акции",
        "title": "Промо"
      },
      "loyalty": {
        "brsm": "БРСМ",
        "toggle": "Включить/выключить лояльность"
      },
      "actions": {
        "saveSettings": "Сохранить настройки"
      },
      "prro": {
        "skipFiscalization": "Пропуск фискализации",
        "testOnlyHint": "Только для тестовых запусков"
      },
      "settingsTitle": "Сервисные настройки"
    },
    "pult": {
      "equipment": {
        "add": "+ Оборудование",
        "samples": {
          "operatingHours": "661.98 ч.",
          "foamPumpActive": "Помпа пены активна"
        },
        "actions": {
          "deleteModule": "Удалить модуль",
          "add": "Добавить новое оборудование в список +",
          "edit": "Редактировать узел"
        },
        "fields": {
          "controllerRelay": "Контроллер № Реле:",
          "moduleName": "Название модуля:",
          "totalOperatingTime": "Суммарное время работы:"
        },
        "title": "Оборудование мойного поста"
      },
      "samples": {
        "tenHryvnias": "10 грн",
        "washNameWithSettings": "Test Wash ⚙️",
        "loginWithCopy": "panel_1 📋",
        "clientName": "Годованець Е. О.",
        "nameWithCopy": "Пульт 1 📋"
      },
      "operations": {
        "samples": {
          "dailyPaypass": "117 900 грн",
          "monthCash": "18 010.00 грн",
          "monthNonCash": "2 690.00 грн",
          "dailyCash": "701 689 грн"
        },
        "cashInRegister": "В кассе наличными",
        "title": "Финансовые операции",
        "monthlyRegister": "Фискальная касса за месяц",
        "dailyRegister": "Фискальная касса за текущий день",
        "labels": {
          "paypass": "🔵 PayPass:",
          "nonCash": "🔵 Безналичные:",
          "cashSingular": "🟢 Наличные:",
          "cashPlural": "🟢 Наличные:"
        }
      },
      "prro": {
        "columns": {
          "transactionId": "ID транзакции",
          "operationName": "Название операции",
          "taxDeliveryStatus": "Статус отправки ГНС",
          "receiptType": "Тип чека"
        },
        "xReport": "x-отчёт",
        "fields": {
          "automaticZReport": "Автоматический Z-отчет:",
          "totalHryvnias": "Общая сумма (грн)",
          "licenseKey": "Ключ лицензии ПРРО:",
          "cashierLogin": "Логин кассира:",
          "receiptPrinter": "Название принтера чеков:",
          "denomination": "Номинал",
          "cashierPassword": "Пароль кассира:",
          "port": "Порт:",
          "taxTestMode": "Тестовый режим сервера ГНС",
          "apiToken": "Токен кассы (Ключ доступа API):",
          "enableFiscalization": "Включить фискализацию ПРРО",
          "host": "Хост кассы (IP сервера):"
        },
        "placeholders": {
          "login": "Введите логин",
          "secretToken": "Введите секретный токен"
        },
        "history": {
          "title": "Лог последних операций кассы"
        },
        "loginHint": "Логин пользователя в системе Checkbox/Вчасно",
        "settingsTitle": "Настройка кассы ПРРО",
        "options": {
          "none": "Нет"
        },
        "types": {
          "serviceWithdrawal": "Служебная выдача",
          "serviceDeposit": "Служебное внесение"
        }
      },
      "fields": {
        "ipAddress": "IP-адрес",
        "ipAddressWithColon": "IP-адрес:",
        "buttonModel": "Кнопочная",
        "loginWithColon": "Логин:",
        "washWithColon": "Мойка:",
        "model": "Модель",
        "modelWithColon": "Модель:",
        "pultName": "Название пульта:"
      },
      "status": {
        "icons": {
          "buttonBoard": "K",
          "relay": "R",
          "pult": "П"
        },
        "healthy": "Всё хорошо",
        "buttonBoard": "Плата кнопок",
        "buttonBoardWithColon": "Плата кнопок:",
        "errorWithWarning": "Ошибка ⚠️",
        "cash": "Статус наличных",
        "cashWithColon": "Статус наличных:",
        "pult": "Статус пульта",
        "pultWithColon": "Статус пульта:",
        "relay": "Статус реле",
        "relayWithColon": "Статус реле:"
      },
      "service": {
        "payPassPlus": "PayPass +",
        "pricePerMinute": "Стоимость минуты",
        "actions": {
          "save": "Сохранить сервисные программы"
        },
        "pause": "Пауза",
        "light": "Свет",
        "title": "Сервисные программы"
      },
      "paypass": {
        "fields": {
          "ipAddress": "PayPass IP адрес:",
          "merchantId": "PayPass MID (Идентификатор мерчанта):",
          "port": "PayPass порт:"
        },
        "description": "Параметры интеграции PayPass терминала"
      },
      "usb": {
        "fields": {
          "slaveId": "SlaveId",
          "deviceType": "Тип"
        },
        "ports": {
          "paypass": "USB порт для PayPass",
          "cashAcceptor": "USB порт для наличкоприемника",
          "buttonBoard": "USB порт для платы кнопок \"ButtonBoard\"",
          "barcodeScanner": "USB порт для сканера штрих-кода \"barCode\""
        },
        "devices": {
          "banknoteAcceptor": "Наличкоприемник (купюры)"
        },
        "actions": {
          "addDevice": "Добавить устройство",
          "addDeviceWithPlus": "Добавить девайс +"
        },
        "settingsTitle": "Настройка USB"
      },
      "tabs": {
        "usb": "USB",
        "data": "Данные",
        "actions": "Действия",
        "prro": "Касса ПРРО",
        "media": "Медиа",
        "equipment": "Оборудование"
      },
      "actions": {
        "paypassZReport": "Z-отчет PayPass",
        "vchasnoZReport": "Z-отчет VchasnoKasa",
        "logs": {
          "applicationFile": "bigwash.txt",
          "npmFile": "npm.txt",
          "paypassFile": "paypass.txt",
          "serverFile": "server.txt",
          "title": "Логи"
        },
        "add": "Добавить пульт",
        "title": "Действия над пультом",
        "emulateScreen": "Эмуляция экрана",
        "initialize": "Запустить инит",
        "clearLogs": "Очистить логи",
        "clearLogsWithIcon": "Очистить логи 🧼",
        "restart": "Перезагрузить пульт",
        "collectCash": "Провести инкассацию пульта",
        "collectCashWithWarning": "Провести инкассацию пульта ⚠️"
      },
      "summary": {
        "balance": "Баланс на пульте",
        "totalWashes": "Всего моек",
        "moneyOnPults": "Денег на пультах",
        "monthlyClients": "Клиентов на пульте за месяц"
      },
      "states": {
        "running": "В работе",
        "notWorking": "Не работают",
        "waiting": "Ожидание",
        "working": "Работает"
      },
      "media": {
        "placeholders": {
          "message": "Введите сообщение для привлечения клиентов..."
        },
        "idleMessageHint": "Отображается в режиме ожидания для привлечения клиентов",
        "messageJournal": "Журнал уведомлений",
        "title": "Медиа-данные пульта",
        "fields": {
          "message": "Текст сообщения дня",
          "enableMessage": "Включить сообщение дня на экране терминала"
        }
      },
      "programs": {
        "usageHint": "Использование установленных программ за последние 3 месяца",
        "actions": {
          "addWithPlus": "Добавить программу +",
          "save": "Сохранить программы",
          "move": "Переместить",
          "copySettings": "Скопировать настройки с другого пульта 📋"
        },
        "columns": {
          "button": "Кнопка",
          "totalMinutes": "Суммарное время (мин)"
        },
        "mostPopular": "Самая популярная программа",
        "mostPopularAlternate": "Самая популярная программа"
      },
      "data": {
        "title": "Данные пульта",
        "forceDeduction": "Снимать деньги по умолчанию принудительно",
        "loginHint": "Логин для веб-панели пульта",
        "cashRegisterLogin": "Логин кассы",
        "cashRegisterLoginWithColon": "Логин кассы:",
        "passwordHint": "Пароль для авторизации",
        "serviceCardWritingMode": "Режим записи служебных карт на картсчитывателе",
        "fields": {
          "startDelaySeconds": "Таймер на начало мойки (сек):"
        }
      },
      "columns": {
        "registrationDate": "Дата регистрации",
        "mode": "РЕЖИМ"
      },
      "maintenance": {
        "actions": {
          "addType": "Добавить тип ТО"
        },
        "title": "Журнал технического обслуживания",
        "columns": {
          "plannedHours": "Плановое (г)",
          "actualHours": "Фактическое (г)",
          "task": "Что сделано"
        }
      },
      "currentProgram": {
        "start": "Запуск",
        "startWithColon": "Запуск:",
        "cardWithColon": "Карта:",
        "pinkFoamWithIcon": "💧 Розовая пена"
      },
      "buttons": {
        "rangeLabel": "Кнопки 1-15"
      },
      "title": "Пульты",
      "relays": {
        "rangeLabel": "Реле 1-15"
      }
    },
    "bugReport": {
      "placeholders": {
        "reproductionSteps": "1. Открыть страницу...\n2. Нажать...",
        "subject": "Например: кнопка сохранения не работает",
        "description": "Опишите проблему: что ожидали и что произошло..."
      },
      "brand": {
        "supportCenter": "BIGWASH · ЦЕНТР ПОДДЕРЖКИ"
      },
      "categories": {
        "interface": "Интерфейс и отображение",
        "other": "Другое",
        "data": "Данные и сохранение",
        "controls": "Кнопки и функции",
        "interfaceError": "Ошибка интерфейса",
        "dataError": "Проблема с данными",
        "suggestion": "Предложение"
      },
      "history": {
        "title": "История отчётов",
        "savedReports": "Сохранённые отчёты",
        "downloadHint": "Отчёты остаются в браузере. Нажмите «Скачать», чтобы передать JSON.",
        "localReports": "Локальные отчёты",
        "manageHint": "Можно скачать или удалить любой отчёт"
      },
      "delivery": {
        "localOnly": "Без отправки на сервер"
      },
      "confirm": {
        "deleteLocalReport": "Удалить этот локальный отчёт?"
      },
      "priority": {
        "high": "Высокий",
        "critical": "Критический",
        "low": "Низкий",
        "medium": "Средний"
      },
      "help": {
        "description": "Укажите страницу, последовательность действий и ожидаемый результат. Так разработчику будет проще найти проблему.",
        "requiredFields": "Поля со звёздочкой обязательны",
        "title": "Хороший отчёт — быстрый фикс"
      },
      "validation": {
        "requiredFields": "Укажите тему (от 4 символов) и описание (от 12 символов)."
      },
      "fields": {
        "includeEnvironment": "Добавить адрес страницы и сведения о браузере",
        "category": "Категория",
        "subject": "Короткое название *",
        "priority": "Приоритет",
        "description": "Что произошло? *",
        "reproductionSteps": "Как повторить ошибку"
      },
      "actions": {
        "saveReport": "Сохранить отчёт",
        "saveLocally": "Сохранить отчёт локально"
      },
      "reportTitle": "Отчёт",
      "feedback": {
        "savedInBrowser": "Отчёт сохранён в этом браузере. Чтобы передать его разработчику, скачайте JSON.",
        "notSent": "Отчёт сохранён. Он ещё не отправлен разработчику."
      },
      "title": "Отчёт об ошибке",
      "localStorage": {
        "title": "Локальное хранение"
      },
      "errors": {
        "saveFailed": "Не удалось сохранить отчёт. Проверьте свободное место браузера."
      },
      "form": {
        "newReport": "Новый отчёт"
      },
      "description": "Опишите, что пошло не так. Сохраните отчёт и передайте его разработчику.",
      "empty": {
        "history": "Пока нет отчётов",
        "createFirstHint": "Создайте первый отчёт выше"
      }
    },
    "operations": {
      "samples": {
        "vacuumRate": "11.00 грн/мин",
        "foamRate": "20.00 грн/мин",
        "osmosisRate": "4.00 грн/мин",
        "pultName": "Pult_7"
      },
      "payments": {
        "payPass": "PayPass",
        "cashAcceptor": "Купюроприёмник"
      },
      "tabs": {
        "collections": "Инкассации",
        "payments": "Платежи"
      },
      "empty": {
        "collections": "Истории инкассаций нет. После подключения Go API здесь будут реальные поступления."
      },
      "programs": {
        "pressureWater": "Вода под давлением",
        "osmosis": "Осмос",
        "foam": "Пена",
        "pinkFoam": "Розовая пена"
      },
      "filters": {
        "all": "Все операции"
      },
      "fields": {
        "transactionDate": "Дата транзакции",
        "expenseDescription": "Описание расхода",
        "category": "Статья",
        "amountHryvnias": "Сумма, ₴",
        "paymentType": "Тип оплаты"
      },
      "details": {
        "title": "Детали операции",
        "titlePrefix": "Детали операции №"
      },
      "actions": {
        "addExpenses": "Добавить расходы",
        "addExpense": "Добавить расход",
        "addCategory": "Добавить статью",
        "title": "Действия операций",
        "saveLocally": "Сохранить локально",
        "view": "Просмотреть",
        "editCategories": "Редактировать статьи"
      },
      "columns": {
        "programCount": "Количество программ",
        "transactionTypeUppercase": "ТИП ТРАНЗАКЦИИ",
        "price": "Цена"
      },
      "localPaymentsHint": "Локальные платежи и примеры операций:",
      "placeholders": {
        "expenseDescription": "Например, ремонт"
      },
      "states": {
        "undefined": "Не определено"
      },
      "expense": {
        "newCategory": "Новая статья"
      },
      "title": "Операции",
      "types": {
        "topup": "Пополнение"
      },
      "summary": {
        "dailyAmount": "Сумма за день",
        "dailyTransactionCount": "Транзакций за день",
        "totalCount": "Всего операций"
      }
    },
    "calendar": {
      "presets": {
        "thirtyDays": "30 дней",
        "sevenDays": "7 дней",
        "today": "Сегодня",
        "thisMonth": "Этот месяц",
        "thisYear": "Этот год",
        "thisWeek": "Эта неделя"
      },
      "months": {
        "march": "Март",
        "september": "Сентябрь",
        "december": "Декабрь",
        "october": "Октябрь",
        "april": "Апрель",
        "july": "Июль",
        "november": "Ноябрь",
        "february": "Февраль",
        "august": "Август",
        "january": "Январь",
        "may": "Май",
        "june": "Июнь"
      },
      "weekdays": {
        "tuesday": "Вт",
        "sunday": "Вс",
        "monday": "Пн",
        "friday": "Пт",
        "saturday": "Сб",
        "wednesday": "Ср",
        "thursday": "Чт"
      },
      "fields": {
        "from": "От",
        "to": "До",
        "selectedRange": "Выбранный диапазон"
      },
      "actions": {
        "nextMonth": "Следующий месяц",
        "previousMonth": "Предыдущий месяц"
      },
      "help": {
        "selectFrom": "Выберите дату «От»",
        "selectTo": "Выберите дату «До»"
      },
      "period": {
        "title": "Период",
        "buttonPrefix": "Период:"
      }
    },
    "settings": {
      "brand": {
        "controlCenter": "BIGWASH · ЦЕНТР УПРАВЛЕНИЯ",
        "workspace": "BigWash · Рабочее пространство"
      },
      "api": {
        "connected": "Go API подключён"
      },
      "language": {
        "russianCode": "RU",
        "ukrainianIndicator": "UA ·",
        "title": "Язык интерфейса",
        "description": "Выберите удобный язык для BigWash",
        "primary": "Основной",
        "russianName": "Русский",
        "ukrainianName": "Українська"
      },
      "mode": {
        "offline": "Автономный режим"
      },
      "backup": {
        "safeExportHint": "Экспорт без паролей и токенов",
        "description": "Сохраните локальные данные проекта отдельным файлом",
        "title": "Резервная копия",
        "contentsHint": "Файл содержит локальные записи клиентов, администраторов, карт, программ и отчётов. Он не загружается на сервер автоматически."
      },
      "feedback": {
        "languageSaved": "Язык интерфейса сохранён.",
        "themeSaved": "Оформление сохранено.",
        "backupDownloaded": "Резервная копия JSON скачана."
      },
      "title": "Настройки",
      "description": "Персонализируйте рабочее пространство и управляйте локальными данными.",
      "actions": {
        "refreshCounts": "Обновить показатели"
      },
      "appearance": {
        "title": "Оформление",
        "lightDescription": "Светлый интерфейс",
        "description": "Тема обновляется сразу и сохраняется в браузере",
        "darkDescription": "Тёмный интерфейс"
      },
      "devMode": {
        "title": "О режиме разработки",
        "description": "Это автономная версия интерфейса. Данные хранятся в браузере текущего устройства. Для общей базы и безопасной авторизации нужен Go backend."
      },
      "summary": {
        "browserOnly": "В этом браузере"
      }
    },
    "wash": {
      "fields": {
        "deWash": "DeWash",
        "cardId": "ID для карт",
        "telegramChatId": "Telegram chat ID",
        "name": "Название мойки",
        "address": "Адрес",
        "visualization": "Визуализация",
        "byTime": "По времени",
        "theme": "Тема"
      },
      "title": "Мойка",
      "errors": {
        "saveFailed": "Не удалось сохранить настройки в браузере. Попробуйте ещё раз.",
        "loadFailed": "Не удалось прочитать настройки мойки. Показаны начальные значения."
      },
      "modal": {
        "title": "Редактирование мойки"
      },
      "actions": {
        "edit": "Редактировать мойку",
        "editWithIcon": "Редактировать мойку ✏️"
      },
      "themes": {
        "technical": "Техническое"
      }
    },
    "admin": {
      "fields": {
        "email": "E-mail",
        "emailWithColon": "Email:",
        "newPassword": "Новый пароль",
        "password": "Пароль",
        "lastName": "Фамилия",
        "passwordConfirmation": "Подтверждение пароля",
        "role": "Роль",
        "specialCard": "Спецкарта"
      },
      "placeholders": {
        "email": "example@mail.com",
        "confirmPassword": "Подтвердите пароль"
      },
      "roles": {
        "admin": "Администратор",
        "administrator": "Администратор",
        "owner": "Владелец",
        "service": "Сервис"
      },
      "titleShort": "Админы",
      "title": "Администраторы",
      "confirm": {
        "delete": "Вы уверены, что хотите удалить этого администратора?"
      },
      "filters": {
        "owners": "Владельцы",
        "all": "Все"
      },
      "actions": {
        "cancel": "Отмена",
        "submit": "Отправить",
        "add": "Добавить",
        "addShort": "Добавить администратора",
        "addAdministrator": "Добавить администратора",
        "copyEmail": "Копировать Email",
        "copyCard": "Копировать карту",
        "generatePassword": "Сгенерировать"
      },
      "modal": {
        "title": "Данные администратора"
      },
      "password": {
        "keepUnchanged": "Оставить без изменений",
        "newOnlyHint": "Только для нового пароля",
        "minimumLength": "Пароль должен содержать не менее 6 символов.",
        "mismatch": "Пароли не совпадают!"
      },
      "validation": {
        "fieldsRequired": "Заполните имя, фамилию, телефон и email."
      },
      "states": {
        "saving": "Сохранение..."
      },
      "errors": {
        "deleteFailed": "Не удалось удалить администратора. Попробуйте ещё раз.",
        "saveFailed": "Не удалось сохранить администратора. Попробуйте ещё раз.",
        "roleNotConfigured": "Роль администратора не настроена на сервере."
      },
      "empty": {
        "search": "По вашему запросу ничего не найдено"
      },
      "summary": {
        "serviceEngineers": "Сервисных инженеров"
      }
    },
    "clients": {
      "fields": {
        "emailWithColon": "E-mail:",
        "firstNameWithColon": "Имя:",
        "card": "Карта",
        "passwordWithColon": "Пароль:",
        "lastNameWithColon": "Фамилия:",
        "tag": "Тег",
        "phoneWithColon": "Телефон:"
      },
      "placeholders": {
        "email": "example@gmail.com",
        "optionalCard": "Необязательно: номер карты",
        "choose": "выбрать..."
      },
      "samples": {
        "firstName": "Єгор",
        "lastName": "Голованець"
      },
      "confirm": {
        "delete": "Вы уверены, что хотите удалить этого клиента?"
      },
      "filters": {
        "allClients": "Все клиенты",
        "withCard": "Пользователи с картой"
      },
      "modal": {
        "title": "Данные клиента"
      },
      "demo": {
        "serverSaveDisabled": "Деморежим: сохранение на сервере отключено."
      },
      "actions": {
        "add": "Добавить клиента",
        "selectExisting": "Выбрать существующий",
        "createNew": "Создать новый",
        "createAndAssign": "Создать и назначить"
      },
      "summary": {
        "withoutCard": "Клиентов без карты"
      },
      "tags": {
        "color": "Цвет:",
        "motorcycle": "Мотоцикл",
        "assign": "Назначить тег"
      },
      "pagination": {
        "previous": "Назад"
      },
      "errors": {
        "deleteFailed": "Ошибка удаления клиента"
      },
      "columns": {
        "fullName": "ФИО"
      }
    },
    "auth": {
      "fields": {
        "emailOrPhone": "Email или Телефон"
      },
      "title": "Авторизация",
      "errors": {
        "credentialsRequired": "Введите email и пароль.",
        "registrationFieldsRequired": "Заполните все поля. Пароль должен содержать не менее 6 символов.",
        "emailExists": "Пользователь с таким email уже существует.",
        "loginFailed": "Не удалось выполнить вход.",
        "networkFailed": "Не удалось связаться с сервером. Проверьте backend и API URL.",
        "invalidCredentials": "Неверный email или пароль.",
        "passwordTooShort": "Пароль должен содержать минимум 6 символов.",
        "registrationFailed": "Ошибка регистрации.",
        "serverFailed": "Ошибка сервера. Проверьте логи backend.",
        "invalidResponse": "Сервер вернул некорректный ответ авторизации."
      },
      "actions": {
        "existingAccount": "Уже есть аккаунт?",
        "signIn": "Вход",
        "noAccount": "Нет аккаунта?",
        "register": "Регистрация",
        "createAccount": "Создать аккаунт",
        "login": "Войти"
      },
      "registration": {
        "welcome": "Зарегистрируйтесь и начните управлять своими автомойками"
      },
      "states": {
        "checking": "Проверка авторизации..."
      },
      "password": {
        "show": "Показать пароль",
        "hide": "Скрыть пароль"
      },
      "feedback": {
        "registrationSuccess": "Регистрация успешна! Теперь войдите в свой аккаунт."
      },
      "login": {
        "welcome": "Войдите, чтобы продолжить управление вашими автомойками"
      }
    },
    "header": {
      "language": {
        "russianOption": "RU (Русский)",
        "ukrainianOption": "UA (Українська)"
      },
      "profile": {
        "displayName": "UserSuper",
        "avatarAlt": "Аватар"
      },
      "breadcrumb": {
        "home": "Главная"
      },
      "actions": {
        "changeTheme": "Изменить тему"
      },
      "notifications": {
        "title": "Уведомления",
        "markAllRead": "Прочитать все",
        "titleAlternate": "Уведомления",
        "word": "сообщения"
      }
    },
    "sidebar": {
      "openMenu": "Открыть меню"
    },
    "cards": {
      "columns": {
        "uid": "UID",
        "activity": "Активность"
      },
      "fields": {
        "identifier": "Идентификатор:",
        "lastUsed": "В последний раз использовано",
        "client": "Клиент:",
        "balanceHryvnias": "Сумма на счёте (₴):"
      },
      "summary": {
        "brsmCards": "БРСМ-карты",
        "withoutOwner": "Без владельца",
        "total": "Всего карт",
        "moneyOnCards": "Денег на картах",
        "totalBalance": "Общий баланс",
        "withoutClients": "Карт без клиентов"
      },
      "confirm": {
        "delete": "Вы уверены, что хотите удалить карту?"
      },
      "actions": {
        "identify": "Определить карту",
        "addToSystem": "Добавить в систему",
        "add": "Добавить карту"
      },
      "breadcrumb": {
        "legacy": "Главная / Карты"
      },
      "demo": {
        "deleteDisabled": "Деморежим: удаление недоступно."
      },
      "journal": {
        "title": "Журнал пополнений",
        "empty": "Пополнений пока нет. История сервера недоступна в автономном режиме.",
        "description": "Здесь будут отображаться сохранённые локально пополнения карт."
      },
      "title": "Карты",
      "feedback": {
        "recognized": "Карта успешно распознана"
      },
      "errors": {
        "deleteFailed": "Не удалось удалить карту",
        "saveFailed": "Ошибка: не удалось сохранить карту"
      },
      "states": {
        "notSet": "Не установлено",
        "awaitingCard": "Ожидание карты..."
      },
      "placeholders": {
        "selectClient": "Выбрать клиента"
      },
      "modal": {
        "editTitle": "Редактировать карту",
        "scanTitle": "Сканирование карты",
        "createTitle": "Создать карту"
      },
      "listTitle": "Список карт"
    },
    "discounts": {
      "registration": {
        "title": "Бонусы для новых клиентов при регистрации",
        "firstTopup": "Первое пополнение",
        "onFirstRegistration": "При первой регистрации"
      },
      "columns": {
        "discountPercentage": "ПРОЦЕНТ СКИДКИ",
        "action": "ДЕЙСТВИЕ",
        "program": "ПРОГРАММА",
        "turnoverAmount": "СУММА ОБОРОТА",
        "topupAmount": "СУММА ПОПОЛНЕНИЯ"
      },
      "schedule": {
        "percentageHint": "Процент скидки установлен в зависимости от времени и программ"
      },
      "topup": {
        "cashPaypassPercentageHint": "Процент скидки на пополнение Наличные/PayPass",
        "title": "Скидка пополнения"
      },
      "cardTopup": {
        "percentageHint": "Процент скидки на пополнение баланса карты",
        "title": "Скидка пополнения карт клиента"
      },
      "fields": {
        "weekday": "День недели",
        "timeTo": "До времени",
        "timeFrom": "Со времени",
        "percentage": "Процент %"
      },
      "actions": {
        "addRule": "Добавить скидку +"
      },
      "newClients": {
        "title": "Скидка для новых клиентов"
      },
      "turnover": {
        "title": "Скидка за оборот",
        "description": "При обороте определённой суммы на карте клиент получает фиксированный процент"
      },
      "totalTopup": {
        "title": "Скидка за суммарное пополнение",
        "description": "При суммарном пополнении карты на определённую сумму клиент получает процент"
      },
      "programs": {
        "title": "Скидка программ"
      },
      "title": "Скидки"
    }
  }
};
