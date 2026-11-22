export const t = {
  review: {
    scrollColumns: "Проведіть убік, щоб переглянути всі стовпці",
    scrollPrevious: "Попередні стовпці",
    scrollNext: "Наступні стовпці",
    mediaFileReadFailed: "Не вдалося прочитати файл. Спробуйте вибрати його знову.",
    mediaTextSize: "Повідомлення завелике: дозволено до 100 000 символів.",
    usbPresets: "Типові значення порту",
    usbPresetHint: "Пресети заповнюють поле. Це не перевірка підключення пристрою.",
    programInvalid: "Вкажіть назву та додатний цілий номер кнопки або залиште номер порожнім.",
    programButtonConflict: "Цей номер кнопки вже призначено іншій програмі.",
    programDeleteConfirm: "Видалити DEV-програму «{name}»?",
    programProtected: "Початкові програми збережено; видаляти можна створені DEV-програми.",
    programActive: "Програма «{name}» увімкнена",
    programEnabled: "Увімкнена",
    programEditTitle: "Налаштування програми",
    programAssignTitle: "Призначити кнопку",
    programManualHint: "DEV: ручне призначення кнопок зберігається локально. Фізичне визначення натискання потребує Go API.",
    programButtonNumber: "Номер кнопки",
    programButtonEmpty: "Порожнє поле знімає призначення. Номер кнопки не пов’язаний зі слотами реле.",
    programCopyUnavailable: "Копіювання налаштувань між пультами ще не підключено.",
    moveUp: "Перемістити вище",
    moveDown: "Перемістити нижче",
    mediaClear: "Прибрати форматування",
    mediaAddImage: "Додати зображення",
    mediaReplaceImage: "Замінити зображення",
    mediaDeleteImage: "Видалити зображення",
    mediaPreview: "Перегляд",
    mediaEdit: "Редагувати",
    mediaLimits: "PNG, JPEG, WebP або GIF: до 2 МБ на файл, до 10 зображень, до 16 Мп. Натисніть зображення, щоб замінити чи видалити його.",
    mediaLoading: "Обробка зображення…",
    mediaFileType: "Файл має бути справжнім PNG, JPEG, WebP або GIF.",
    mediaFileSize: "Виберіть непорожній файл розміром до 2 МБ.",
    mediaDimensions: "Зображення завелике: дозволено до 16 мільйонів пікселів.",
    mediaImageCount: "Дозволено до 10 зображень у повідомленні.",
    mediaStorageUnavailable: "IndexedDB недоступна. Дозвольте локальне сховище браузера та відкрийте форму знову.",
    mediaStorageFull: "Ліміт медіафайлів цього браузера — 50 МБ. Зменште кількість зображень.",
    mediaCommandUnsupported: "Браузер не підтримує цю команду редактора.",
    mediaVisualLocal: "DEV: текст і зображення зберігаються в цьому браузері. Відображення HTML, зображень і GIF на терміналі ще не підключено.",
    telegramOpen: "Відкрити Telegram",
    telegramNotConfigured: "Посилання не налаштовано",
    telegramHint: "Відкрийте чат самостійно та передайте опис або завантажений звіт. Автоматичної відправки немає.",
    relaySlotsSummary: "DEV-слоти: зайнято {occupied}, доступно {free}. Це локальні призначення, без керування обладнанням.",
    relaySlots: "Слоти реле",
    relaySlot: "DEV-слот реле (1–12)",
    relayOccupied: "Зайнятий",
    relayFree: "Доступний",
    relayConflict: "Конфлікт",
    relayLegacy: "Старе позначення «{value}» — виберіть слот",
    relaySlotInvalid: "Виберіть слот реле від 1 до 12. Старе позначення не змінюється без вашого вибору.",
    relaySlotOccupied: "Цей слот уже призначено іншому вузлу. Виберіть доступний слот.",
    pauseTitle: "Пауза",
    pauseDuration: "Тривалість паузи, секунд",
    pauseHint: "Пауза тимчасово призупиняє поточну програму на заданий час. У DEV зберігається лише тривалість; виконання команди обладнанням потребує Go API.",
    pauseInvalid: "Вкажіть додатну цілу тривалість паузи в секундах.",
    paypassPaymentOnly: "PayPass — спосіб оплати. Реальні платежі тут не виконуються.",
    promoGlobal: "Для всієї мийки",
    promoIndividual: "Для вибраних пультів",
    promoScope: "Область дії Promo",
    promoLocalHint: "DEV: глобальна або індивідуальна конфігурація Promo. Збереження не активує акцію на обладнанні й не змінює платежі.",
    promoPultHint: "Показано збережену DEV-конфігурацію для цього пульта. Змінити область дії та вибір пультів можна у розділі «Сервіс». Обладнання не змінюється.",
    promoInvalid: "Для індивідуального Promo виберіть хоча б один пульт або вимкніть Promo.",
    discountSinglePolicy: "Знижки не сумуються: до одного платежу може застосовуватися лише одна. Вибір при збігу кількох умов має бути погоджений із Go; тут платежі не розраховуються.",
    locationHint: "Знайдіть введену адресу або виберіть точку на карті. Пошук передає адресу сервісу Photon. За потреби адресу й координати можна вказати вручну.",
    locationSearch: "Знайти на карті",
    geocodeLoading: "Пошук адреси…",
    locationMap: "Карта: виберіть точку, перетягуйте для переміщення. Стрілки переміщують карту, Enter вибирає центр.",
    mapZoomIn: "Збільшити карту",
    mapZoomOut: "Зменшити карту",
    mapUnavailable: "Карта недоступна. Адресу й координати можна ввести вручну; наявні дані не змінено.",
    latitude: "Широта",
    longitude: "Довгота",
    locationInvalid: "Вкажіть адресу для пошуку або коректну пару координат: широта −90…90, довгота −180…180.",
    geocodeFailed: "Не вдалося визначити адресу. Перевірте мережу або введіть адресу й координати вручну.",
    geocodeNotFound: "Адресу не знайдено. Уточніть запит, виберіть точку або введіть дані вручну.",
    usbAuto: 'Автоматично (auto)',
    usbUseAuto: 'Встановити auto для поля «{field}». Збережіть конфігурацію окремо.',
    discountState: 'Стан конфігурації',
    discountEnabled: 'Активна',
    discountDisabled: 'Неактивна',
    discountAddProgram: 'Додати програму +',
    configUnavailable: "Збереження недоступне: API цих налаштувань ще не узгоджено з Go. Дані не передано серверу чи обладнанню.",
    configReadFailed: "Не вдалося прочитати конфігурацію. Збереження заблоковано, щоб не перезаписати наявні дані.",
    configInvalid: "Перевірте значення полів конфігурації.",
    configSaveFailed: "Не вдалося зберегти у браузері. Чернетка залишилася у формі.",
    configConflict: "Конфігурацію змінено в іншій вкладці. Скопіюйте свою чернетку та відкрийте форму знову перед збереженням.",
    configSaved: "Конфігурацію збережено лише в цьому браузері. Сервер та обладнання не змінювалися.",
    configSave: "Зберегти локально",
    pultConfigLocal: "DEV: локальна конфігурація цього пульта. Збереження не підключає пристрій і не передає команди обладнанню.",
    equipmentList: "Обладнання пульта",
    equipmentInvalid: "Вкажіть назву та позначення контролера/реле. Формат зв’язку з фізичним контролером ще не узгоджено.",
    equipmentDependencies: "Видалення заблоковано: залежності початкового модуля не описані. Можна видаляти лише нові, не підключені DEV-вузли. Журнал ТО не змінюється.",
    equipmentDeleteConfirm: "Видалити локальний вузол «{name}»? Журнал ТО та інші дані залишаться без змін.",
    hours: "год.",
    usbInvalid: "Для кожного пристрою вкажіть непорожній унікальний Slave ID і виберіть тип зі списку.",
    timeFrom: "Від",
    timeTo: "До",
    washTimeInvalid: "Вкажіть час «Від» і «До» у межах однієї доби; час завершення має бути пізнішим за початок.",
    washTimeLocal: "DEV: налаштування мийки зберігаються у браузері. Інтервал «Від/До» — у межах однієї доби; виконання розкладу обладнанням ще не підключено.",
    mediaFormatting: "Форматування HTML",
    mediaTag_b: "Жирний",
    mediaTag_i: "Курсив",
    mediaTag_u: "Підкреслений",
    mediaTag_br: "Новий рядок",
    mediaHtmlLocal: "DEV: HTML зберігається як текст без виконання чи попереднього перегляду. Підтримку тегів і безпечне відображення на пульті потрібно узгодити з Go.",
    discountLocal: "DEV: редактор локальної конфігурації. Ці правила не застосовуються до оплат. Галочка вмикає правило, хрестик вимикає; зміни набудуть чинності у конфігурації після збереження.",
    discountInvalid: "Сума має бути невід’ємною, знижка — від 0 до 100%. Перевірте час, дні та список програм.",
    discountChooseProgram: "Виберіть програму",
    discountProgramsUnavailable: "Не вдалося прочитати список програм. Наявні прив’язки знижок не змінено.",
    discountEnable: "Увімкнути правило в локальній конфігурації",
    discountDisable: "Вимкнути правило в локальній конфігурації",
    discountEdit: "Редагувати відсоток",
    discountClientsUnavailable: "Призначення клієнтам потребує узгодженого API та правил застосування.",
    clientIdentityRequired: 'Вкажіть хоча б ім’я, прізвище, телефон, email або номер картки.',
    clientEmailInvalid: 'Перевірте адресу електронної пошти.',
    clientFormHint: 'Достатньо одного поля для ідентифікації клієнта. Решту можна залишити порожніми.',
    clientSaveFailed: 'Не вдалося зберегти клієнта. Введені дані залишилися у формі — перевірте з’єднання та спробуйте ще раз.',
    cardUID: 'Номер картки',
    cardDiscount: 'Знижка, %',
    cardDiscountInvalid: 'Знижка має бути числом від 0 до 100%.',
    adminBindConfirm: 'Прив’язати картку «{card}» до адміністратора «{admin}»?',
    adminUnbindConfirm: 'Відв’язати картку адміністратора «{admin}»?',
    adminCardPending: 'Зміна прив’язки набуде чинності після натискання «Відправити» та успішного збереження.',
    adminCardLinked: 'Картку «{card}» прив’язано до адміністратора «{admin}».',
    adminCardUnlinked: 'Картку адміністратора «{admin}» відв’язано.',
    maintenanceReadonly: 'Журнал технічного обслуговування доступний лише для перегляду.',
    usbUnavailable: 'Збереження USB-конфігурації в обладнання ще не підключено. Зміни не передано пульту.',
    programWholeMoney: 'Ціна й собівартість мають бути невід’ємними цілими сумами у гривнях.',
    programLegacyMoney: 'Ця програма містить суму з копійками. Значення збережено без округлення; перед збереженням явно вкажіть цілі гривні.'
  },
  header: {
    notificationCount: { one: '{count} повідомлення', few: '{count} повідомлення', many: '{count} повідомлень', other: '{count} повідомлення' }
  },
  common: {
    brand: "BIG WASH",
    loading: "Зачекайте...",
    updated: "Оновлено",
    actions: "Дія",
    search: "пошук...",
    error: "Звіт про помилку",
    save: "Зберегти",
    cancel: "Скасувати",
    saved: "Збережено",
    unsavedChanges: "Є незбережені зміни"
  },

  sidebar: {
    stats: "Статистика",
    cards: "Картки",
    clients: "Клієнти",
    ops: "Операції",
    admins: "Адміністратори",
    notify: "Сповіщення",
    help: "Довідка",
    settings: "Налаштування",
    logout: "Вихід"
  },

  auth: {
    localHttpsRequired: "Для DEV-входу й реєстрації з телефона потрібен довірений HTTPS. Запустіть start-dev-lan.bat та відкрийте HTTPS-адресу з консолі. HTTP localhost працює лише на комп’ютері з BigWash.",
    localCryptoUnavailable: "Web Crypto API недоступний. Відкрийте BigWash через довірений HTTPS або localhost і перевірте підтримку браузера.",
    localOperationFailed: "Не вдалося виконати локальну авторизацію. Перевірте доступність сховища браузера. Запит авторизації до Go API не надсилався.",
    loginTitle: "Авторизація",
    registerTitle: "Створити акаунт",
    emailPlace: "Email або Телефон",
    passPlace: "Пароль",
    firstNamePlace: "Ім'я",
    lastNamePlace: "Прізвище",
    phonePlace: "Телефон",
    btnSignIn: "Увійти",
    btnSignUp: "Реєстрація",
    noAccount: "Немає акаунту?",
    hasAccount: "Вже є акаунт?",
    signUpDesc: "Зареєструйтесь та почніть керувати своїми автомийками",
    signInDesc: "Увійдіть, щоб продовжити керування вашими автомийками"
  },

  dashboard: {
    headTitle: "Головна / Статистика",
    btnDelete: "Видалити статистику",
    btnAddEquip: "+ Обладнання",
    profit: "Прибуток",
    expenses: "Витрати",
    balance: "Баланс",
    compared: "від минулого місяця",
    chartTitle: "Прибуток та витрати",
    periods: { day: "День", month: "Місяць", year: "Рік" }
  },

  cards: {
    headTitle: "Головна / Картки",
    title: "Список карток",
    actions: {
      add: "Додати картку",
      scan: "Визначити картку",
      logs: "Журнал поповнень"
    },
    stats: {
      total: "Всього карток",
      noClient: "Карток без клієнтів",
      money: "Грошей на картках",
      brsm: "БРСМ-карток"
    },
    table: {
      uid: "UID",
      amount: "Грошей",
      client: "Клієнт",
      registered: "Зареєстровано",
      lastUsed: "В останнє використано",
      noClient: "Не встановлено"
    }
  },

  pultsModal: {
    tabs: {
      media: "Медіа",
      data: "Дані",
      equipment: "Обладнання",
      operations: "Операції",
      kassa: "Каса ПРРО",
      programs: "Програми",
      actions: "Дії",
      usb: "USB"
    },
    side: {
      totalWashes: "Всього мийок",
      balance: "Баланс на пульті",
      model: "Модель",
      modelType: "Кнопкова",
      name: "Назва",
      wash: "Мийка",
      login: "Логін",
      ip: "IP-адреса",
      kassaLogin: "Логін каси",
      noData: "Немає",
      pultStatus: "Статус пульта",
      cashStatus: "Статус готівки",
      relayStatus: "Статус реле",
      buttonsBoard: "Плата кнопок",
      allGood: "Все добре",
      error: "Помилка",
      pinkFoam: "Рожева піна",
      launch: "Запуск",
      client: "Клієнт",
      card: "Картка"
    },
    media: {
      title: "Медіа-дані пульта",
      enableToggle: "Увімкнути повідомлення дня на екрані терміналу",
      msgTitle: "Текст повідомлення дня",
      placeholder: "Введіть повідомлення для клієнтів...",
      subtext: "Відображається в режимі очікування для приваблення клієнтів"
    },
    data: {
      title: "Дані пульта",
      pultName: "Назва пульту:",
      timer: "Таймер на початок мийки (сек):",
      takeOffMoney: "Знімати гроші за замовчуванням примусово",
      recordMode: "Режим запису службових карток на карткозчитувачі",
      webLogin: "Логін для веб-панелі пульту",
      password: "Пароль для авторизації",
      generate: "Згенерувати"
    },
    equipment: {
      title: "Обладнання мийного поста",
      moduleName: "Назва модуля:",
      controllerRelay: "Контролер № Реле:",
      totalTime: "Сумарний час роботи:",
      addMaintenance: "Додати тип ТО",
      editNode: "Редагувати вузол",
      deleteModule: "Видалити модуль",
      emulatorTitle: "Емуляція екрану",
      activeText: "Помпа піни активна",
      addNewEquip: "Додати нове обладнання до списку +",
      journalTitle: "Журнал технічного обслуговування",
      table: {
        num: "№",
        equip: "Обладнання",
        action: "Що зроблено",
        plan: "Планове (г)",
        fact: "Фактичне (г)",
        date: "Дата",
        actions: "Дія"
      }
    },
    operations: {
      title: "Фінансові операції",
      monthCash: "Фіскальна каса за місяць",
      dayCash: "Фіскальна каса за поточний день",
      cashLabel: "Готівкові",
      cashlessLabel: "Безготівкові",
      collectionBtn: "Провести інкасацію пульта ⚠️",
      cashAcceptor: "Готівкоприймач (купюри)",
      nominal: "Номінал",
      count: "Кількість",
      programsReportTitle: "Використання встановлених програм за останні 3 місяці",
      table: {
        num: "№",
        progName: "Назва програми",
        minPrice: "Вартість хвилини",
        totalSum: "Загальна сума (грн)",
        totalTime: "Сумарний час (хв)"
      }
    },
    kassa: {
      title: "Налаштування каси ПРРО",
      enablePrro: "Увімкнути фіскалізацію ПРРО",
      testMode: "Тестовий режим серверу ДПС",
      cashierLogin: "Логін касира:",
      token: "Токен каси (Ключ доступу API):",
      host: "Хост каси (IP серверу):",
      port: "Порт:",
      printer: "Назва принтеру чеків:",
      pass: "Пароль касира:",
      license: "Ключ ліцензії ПРРО:",
      paypassTitle: "Параметри інтеграції PayPass терміналу",
      paypassIp: "PayPass IP адреса:",
      paypassPort: "PayPass порт:",
      paypassMid: "PayPass MID (Ідентифікатор мерчанта):",
      logsTitle: "Лог останніх операцій каси",
      table: {
        txId: "ID транзакції",
        checkType: "Тип чеку",
        opName: "Назва операції",
        sum: "Сума",
        status: "Статус відправки ДПС"
      }
    },
    programs: {
      title: "Програми",
      addProg: "Додати програму",
      copySettings: "Скопіювати налаштування з іншого пульта 📋",
      mainPrograms: "Програми",
      servicePrograms: "Сервісні програми",
      colName: "Назва",
      colBtn: "Кнопка",
      colAction: "Дія",
      define: "Визначити",
      saveProgs: "Зберегти програми",
      saveServiceProgs: "Зберегти сервісні програми"
    },
    actions: {
      title: "Дії над пультом",
      reboot: "Перезавантажити пульт",
      zPaypass: "Z-звіт PayPass",
      init: "Запустити ініт",
      zVchasno: "Z-звіт VchasnoKasa",
      autoZReport: "Автоматичний Z-звіт:",
      logsTitle: "Логи",
      clearLogs: "Очистити логи 🧼"
    },
    usb: {
      title: "Налаштування USB",
      paypassPort: "USB порт для PayPass",
      cashPort: "USB порт для готівкоприймача",
      buttonsPort: "USB порт для плати кнопок \"ButtonBoard\"",
      barcodePort: "USB порт для сканера штрих-коду \"barCode\"",
      slaveId: "SlaveId",
      type: "Тип",
      addDevice: "Додати девайс +"
    }
  },

  types: {
    method: "МЕТОД",
    count: "КІЛЬКІСТЬ",
    percent: "ВІДСОТОК",
    transType: "ТИП ТРАНЗАКЦІЇ",
    sum: "СУМА",
    cash: "Готівка",
    card: "Картка",
    paypass: "PayPass",
    refill: "Поповнення",
    wash: "Мийка"
  },

  calendar: {
    months: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
  },
  // Preserve the canonical shared preview label used by translate().
  ui: {
    "programs": {
      "preview": {
        "title": "Попередній перегляд"
      },
      "actions": {
        "chooseFile": "Вибрати файл",
        "delete": "Видалити програму",
        "help": "Довідка",
        "edit": "Редагувати програму"
      },
      "confirm": {
        "delete": "Видалити програму «{p0}»?"
      },
      "validation": {
        "invalidFields": "Вкажіть назву, невід’ємні ціну й собівартість та додатну тривалість імпульсу."
      },
      "columns": {
        "dateAdded": "ДАТА ДОДАВАННЯ",
        "nameUppercase": "НАЗВА",
        "priceUppercase": "ЦІНА"
      },
      "saveChangesHint": "Зміни будуть застосовані негайно після натискання кнопки збереження.",
      "fields": {
        "image": "Зображення",
        "description": "Опис",
        "cost": "Собівартість (грн)",
        "billingType": "Тип тарифікації",
        "durationSeconds": "Тривалість (сек)",
        "priceHryvnias": "Ціна (грн)",
        "pricePerPulse": "Ціна за 1 імпульс (грн)",
        "pricePerLitre": "Ціна за літр (грн)",
        "pricePerMinute": "Ціна за хвилину (грн)"
      },
      "description": "Налаштування активних програм мийки",
      "errors": {
        "saveFailed": "Не вдалося зберегти програми у браузері. Спробуйте ще раз.",
        "loadFailed": "Не вдалося прочитати збережені програми. Показано початковий список."
      },
      "placeholders": {
        "search": "Пошук...",
        "price": "Ціна..."
      },
      "modal": {
        "editTitle": "Редагування: {p0}"
      },
      "billing": {
        "perMinute": "⏱ Похвилинна (грн/хв)",
        "perPulse": "⚡ Імпульсна (Пульс)",
        "perLitre": "💧 За літраж (грн/л)"
      }
    },
    "dashboard": {
      "demo": {
        "catalogNoticeContinuation": " Назви взято з локальних довідників; операції залишаються тестовими.",
        "catalogNotice": "Назви взято з локальних довідників; операції залишаються тестовими.",
        "disclaimer": "Приклад для перегляду інтерфейсу — це не реальні фінансові дані. Показники розраховано зі стабільного тестового журналу.",
        "showExample": "Приклад заповненої статистики"
      },
      "telegram": {
        "botName": "BigWash Notify",
        "balancePrefix": "Баланс: ₴",
        "bonusesPrefix": "Бонуси: ₴",
        "expensesPrefix": "Витрати: ₴",
        "noRecentPayments": "За останній день немає оплат.",
        "previewLabel": "Попередній перегляд",
        "incomePrefix": "Прибуток: ₴",
        "demoHint": "Приклад сповіщень за журналом. Telegram не підключено; повідомлення не надсилаються.",
        "paymentPrefix": "💳 Оплата ·",
        "dailyReportPrefix": "📊 Денний звіт ·",
        "eventsHint": "🔔 Оплати · Звіти · Активність пультів",
        "title": "🤖 Телеграм Бот"
      },
      "transactions": {
        "expensesPrefix": "· Витрати: ₴",
        "incomePrefix": "· Прибуток: ₴",
        "types": {
          "expense": "Витрата",
          "payment": "Оплата",
          "cardTopup": "Поповнення картки"
        },
        "recordsPrefix": "Записів:",
        "columns": {
          "clientDescription": "Клієнт / опис",
          "pultProgram": "Пульт / програма",
          "typeMethod": "Тип / метод"
        },
        "title": "Транзакції"
      },
      "activePults": {
        "title": "Активні пульти",
        "activityHint": "Активність за журналом операцій, а не поточний стан обладнання.",
        "withoutOperations": "Пульти без операцій",
        "withOperations": "Пульти з операціями"
      },
      "pultActivity": {
        "title": "Активність пультів"
      },
      "finance": {
        "bonusesLegendPrefix": "Бонуси · ₴",
        "expenses": "Витрати",
        "noComparison": "Немає бази порівняння",
        "income": "Прибуток",
        "title": "Прибуток та витрати",
        "fromLastMonth": "від минулого місяця",
        "previousPeriod": "до попереднього періоду",
        "incomeWithIcon": "💰 Прибуток",
        "balanceWithIcon": "💵 Баланс",
        "expensesWithIcon": "💸 Витрати"
      },
      "columns": {
        "percentageUppercase": "ВІДСОТОК",
        "percentage": "Відсоток",
        "countUppercase": "КІЛЬКІСТЬ",
        "methodUppercase": "МЕТОД",
        "method": "Метод",
        "operationsCount": "Операцій",
        "progress": "Прогрес"
      },
      "actions": {
        "deleteStatistics": "Видалити статистику"
      },
      "breadcrumb": {
        "legacy": "Головна / Статистика"
      },
      "pagination": {
        "next": "Далі →",
        "previous": "← Назад"
      },
      "periods": {
        "day": "День",
        "month": "Місяць",
        "overview": "Огляд",
        "year": "Рік"
      },
      "dataSource": {
        "label": "Джерело статистики",
        "apiJournal": "Журнал API",
        "localJournal": "Локальний журнал",
        "localLedgerDisclaimer": "записів. Дані можуть бути неповними. Поповнення карток не зараховуються як дохід. Баланс = прибуток − витрати − бонуси."
      },
      "payments": {
        "title": "Методи оплати"
      },
      "programs": {
        "title": "Найпопулярніші програми"
      },
      "errors": {
        "loadFailed": "Не вдалося завантажити статистику API."
      },
      "empty": {
        "activity": "Немає активності за обраний період",
        "clients": "Немає клієнтів за обраний період",
        "operations": "Немає операцій за обраний період",
        "payments": "Немає оплат за обраний період",
        "transactions": "Немає транзакцій за обраний період"
      },
      "periodLabels": {
        "activePults": "Період: активні пульти",
        "pultActivity": "Період: активність пультів",
        "clients": "Період: клієнти",
        "payments": "Період: методи оплати",
        "finance": "Період: прибуток та витрати",
        "programs": "Період: програми",
        "transactions": "Період: транзакції"
      },
      "states": {
        "programUnspecified": "Програма не вказана",
        "pultUnspecified": "Пульт не вказано"
      },
      "title": "Статистика"
    },
    "shared": {
      "loading": {
        "parenthesized": "(Завантаження...)",
        "wait": "Зачекайте..."
      },
      "brand": {
        "washName": "BIG WASH",
        "pageTitleSuffix": "— BigWash"
      },
      "roles": {
        "service": "Сервіс"
      },
      "unsavedChanges": {
        "title": "Є незбережені зміни"
      },
      "fields": {
        "firstName": "Ім'я",
        "discount": "Знижка",
        "login": "Логін",
        "name": "Назва",
        "programName": "Назва програми",
        "nameWithColon": "Назва:",
        "optional": "Необов'язково",
        "status": "Статус",
        "phone": "Телефон"
      },
      "states": {
        "active": "Активна",
        "unchanged": "Без змін",
        "sent": "Відправлено",
        "saved": "Збережено",
        "savedLocally": "Збережено локально",
        "scanning": "Зчитування...",
        "inactiveSpaced": "Не активна",
        "notSelected": "Не обрано",
        "updated": "Оновлено",
        "error": "Помилка",
        "test": "Тестовий"
      },
      "finance": {
        "balance": "Баланс",
        "bonuses": "Бонуси"
      },
      "payments": {
        "nonCashPlural": "Безготівкові",
        "cashSingular": "Готівка",
        "cashPlural": "Готівкові"
      },
      "actions": {
        "delete": "Видалити",
        "identify": "Визначити",
        "logout": "Вихід",
        "addProgram": "Додати програму",
        "downloadJson": "Завантажити JSON",
        "close": "Закрити",
        "apply": "Застосувати",
        "save": "Зберегти",
        "saveChanges": "Зберегти зміни",
        "search": "Пошук",
        "edit": "Редагувати",
        "cancel": "Скасувати",
        "reset": "Скинути"
      },
      "columns": {
        "money": "Грошей",
        "date": "Дата",
        "action": "Дія",
        "registered": "Зареєстровано",
        "client": "Клієнт",
        "count": "Кількість",
        "pult": "Пульт",
        "amountUppercase": "СУМА",
        "amount": "Сума",
        "number": "№"
      },
      "demo": {
        "saveDisabled": "Демо-режим: зміни не зберігаються.",
        "banner": "🧪 Демонстраційний перегляд: показано приклади даних. Backend не підключено; зміни не зберігаються."
      },
      "titles": {
        "clients": "Клієнти",
        "programs": "Програми"
      },
      "mode": {
        "localData": "Локальні дані"
      },
      "errors": {
        "invalidData": "Перевірте введені дані.",
        "deleteFailed": "Помилка видалення.",
        "executionFailed": "Помилка виконання"
      },
      "themes": {
        "light": "Світла",
        "dark": "Темна"
      },
      "time": {
        "justNow": "Щойно"
      },
      "units": {
        "hryvnia": "грн",
        "hryvniasPerLitre": "грн/л",
        "hryvniasPerMinute": "грн/хв",
        "pulse": "пульс",
        "pieces": "шт."
      },
      "placeholders": {
        "search": "пошук..."
      }
    },
    "service": {
      "pricing": {
        "secondWashOnly": "*Тільки для другої мийки"
      },
      "api": {
        "keyLabel": "Ключ API BigWash"
      },
      "kiosk": {
        "title": "Режим кіоску",
        "description": "Режим терміналу самообслуговування"
      },
      "payments": {
        "liqPay": "LiqPay (ПриватБанк)",
        "monobank": "Monobank Checkout",
        "qrPay": "QRPay",
        "stripe": "Stripe",
        "title": "Платіжна система",
        "qrHint": "Прийом платежів через QR"
      },
      "title": "Сервіс",
      "promo": {
        "enable": "Активувати рекламні акції",
        "title": "Промо"
      },
      "loyalty": {
        "brsm": "БРСМ",
        "toggle": "Включити/Виключити лояльність"
      },
      "actions": {
        "saveSettings": "Зберегти налаштування"
      },
      "prro": {
        "skipFiscalization": "Пропуск фіскалізації",
        "testOnlyHint": "Тільки для тестових запусків"
      },
      "settingsTitle": "Сервісні налаштування"
    },
    "pult": {
      "equipment": {
        "add": "+ Обладнання",
        "samples": {
          "operatingHours": "661.98 год.",
          "foamPumpActive": "Помпа піни активна"
        },
        "actions": {
          "deleteModule": "Видалити модуль",
          "add": "Додати нове обладнання до списку +",
          "edit": "Редагувати вузол"
        },
        "fields": {
          "controllerRelay": "Контролер № Реле:",
          "moduleName": "Назва модуля:",
          "totalOperatingTime": "Сумарний час роботи:"
        },
        "title": "Обладнання мийного поста"
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
        "cashInRegister": "В касі готівкою",
        "title": "Фінансові операції",
        "monthlyRegister": "Фіскальна каса за місяць",
        "dailyRegister": "Фіскальна каса за поточний день",
        "labels": {
          "paypass": "🔵 PayPass:",
          "nonCash": "🔵 Безготівкові:",
          "cashSingular": "🟢 Готівка:",
          "cashPlural": "🟢 Готівкові:"
        }
      },
      "prro": {
        "columns": {
          "transactionId": "ID транзакції",
          "operationName": "Назва операції",
          "taxDeliveryStatus": "Статус відправки ДПС",
          "receiptType": "Тип чеку"
        },
        "xReport": "x-звіт",
        "fields": {
          "automaticZReport": "Автоматичний Z-звіт:",
          "totalHryvnias": "Загальна сума (грн)",
          "licenseKey": "Ключ ліцензії ПРРО:",
          "cashierLogin": "Логін касира:",
          "receiptPrinter": "Назва принтеру чеків:",
          "denomination": "Номінал",
          "cashierPassword": "Пароль касира:",
          "port": "Порт:",
          "taxTestMode": "Тестовий режим серверу ДПС",
          "apiToken": "Токен каси (Ключ доступу API):",
          "enableFiscalization": "Увімкнути фіскалізацію ПРРО",
          "host": "Хост каси (IP серверу):"
        },
        "placeholders": {
          "login": "Введіть логін",
          "secretToken": "Введіть секретний токен"
        },
        "history": {
          "title": "Лог останніх операцій каси"
        },
        "loginHint": "Логін користувача у системі Checkbox/Вчасно",
        "settingsTitle": "Налаштування каси ПРРО",
        "options": {
          "none": "Немає"
        },
        "types": {
          "serviceWithdrawal": "Службове видання",
          "serviceDeposit": "Службове внесення"
        }
      },
      "fields": {
        "ipAddress": "IP-адреса",
        "ipAddressWithColon": "IP-адреса:",
        "buttonModel": "Кнопкова",
        "loginWithColon": "Логін:",
        "washWithColon": "Мийка:",
        "model": "Модель",
        "modelWithColon": "Модель:",
        "pultName": "Назва пульту:"
      },
      "status": {
        "icons": {
          "buttonBoard": "K",
          "relay": "R",
          "pult": "П"
        },
        "healthy": "Все добре",
        "buttonBoard": "Плата кнопок",
        "buttonBoardWithColon": "Плата кнопок:",
        "errorWithWarning": "Помилка ⚠️",
        "cash": "Статус готівки",
        "cashWithColon": "Статус готівки:",
        "pult": "Статус пульта",
        "pultWithColon": "Статус пульта:",
        "relay": "Статус реле",
        "relayWithColon": "Статус реле:"
      },
      "service": {
        "payPassPlus": "PayPass +",
        "pricePerMinute": "Вартість хвилини",
        "actions": {
          "save": "Зберегти сервісні програми"
        },
        "pause": "Пауза",
        "light": "Світло",
        "title": "Сервісні програми"
      },
      "paypass": {
        "fields": {
          "ipAddress": "PayPass IP адреса:",
          "merchantId": "PayPass MID (Ідентифікатор мерчанта):",
          "port": "PayPass порт:"
        },
        "description": "Параметри інтеграції PayPass терміналу"
      },
      "usb": {
        "fields": {
          "slaveId": "SlaveId",
          "deviceType": "Тип"
        },
        "ports": {
          "paypass": "USB порт для PayPass",
          "cashAcceptor": "USB порт для готівкоприймача",
          "buttonBoard": "USB порт для плати кнопок \"ButtonBoard\"",
          "barcodeScanner": "USB порт для сканера штрих-коду \"barCode\""
        },
        "devices": {
          "banknoteAcceptor": "Готівкоприймач (купюри)"
        },
        "actions": {
          "addDevice": "Додати девайс",
          "addDeviceWithPlus": "Додати девайс +"
        },
        "settingsTitle": "Налаштування USB"
      },
      "tabs": {
        "usb": "USB",
        "data": "Дані",
        "actions": "Дії",
        "prro": "Каса ПРРО",
        "media": "Медіа",
        "equipment": "Обладнання"
      },
      "actions": {
        "paypassZReport": "Z-звіт PayPass",
        "vchasnoZReport": "Z-звіт VchasnoKasa",
        "logs": {
          "applicationFile": "bigwash.txt",
          "npmFile": "npm.txt",
          "paypassFile": "paypass.txt",
          "serverFile": "server.txt",
          "title": "Логи"
        },
        "add": "Додати пульт",
        "title": "Дії над пультом",
        "emulateScreen": "Емуляція екрану",
        "initialize": "Запустити ініт",
        "clearLogs": "Очистити логи",
        "clearLogsWithIcon": "Очистити логи 🧼",
        "restart": "Перезавантажити пульт",
        "collectCash": "Провести інкасацію пульта",
        "collectCashWithWarning": "Провести інкасацію пульта ⚠️"
      },
      "summary": {
        "balance": "Баланс на пульті",
        "totalWashes": "Всього мийок",
        "moneyOnPults": "Грошей на пультах",
        "monthlyClients": "Клієнтів на пульті за місяць"
      },
      "states": {
        "running": "В роботі",
        "notWorking": "Не працюють",
        "waiting": "Очікування",
        "working": "Працює"
      },
      "media": {
        "placeholders": {
          "message": "Введіть повідомлення для клієнтів..."
        },
        "idleMessageHint": "Відображається в режимі очікування для приваблення клієнтів",
        "messageJournal": "Журнал повідомлень",
        "title": "Медіа-дані пульта",
        "fields": {
          "message": "Текст повідомлення дня",
          "enableMessage": "Увімкнути повідомлення дня на екрані терміналу"
        }
      },
      "programs": {
        "usageHint": "Використання встановлених програм за останні 3 місяці",
        "actions": {
          "addWithPlus": "Додати програму +",
          "save": "Зберегти програми",
          "move": "Перемістити",
          "copySettings": "Скопіювати налаштування з іншого пульта 📋"
        },
        "columns": {
          "button": "Кнопка",
          "totalMinutes": "Сумарний час (хв)"
        },
        "mostPopular": "Найпопулярніша програма",
        "mostPopularAlternate": "Найпопулярніша программа"
      },
      "data": {
        "title": "Дані пульта",
        "forceDeduction": "Знімати гроші за замовчуванням примусово",
        "loginHint": "Логін для веб-панелі пульту",
        "cashRegisterLogin": "Логін каси",
        "cashRegisterLoginWithColon": "Логін каси:",
        "passwordHint": "Пароль для авторизації",
        "serviceCardWritingMode": "Режим запису службових карток на карткозчитувачі",
        "fields": {
          "startDelaySeconds": "Таймер на початок мийки (сек):"
        }
      },
      "columns": {
        "registrationDate": "Дата реєстрації",
        "mode": "РЕЖИМ"
      },
      "maintenance": {
        "actions": {
          "addType": "Додати тип ТО"
        },
        "title": "Журнал технічного обслуговування",
        "columns": {
          "plannedHours": "Планове (г)",
          "actualHours": "Фактичне (г)",
          "task": "Що зроблено"
        }
      },
      "currentProgram": {
        "start": "Запуск",
        "startWithColon": "Запуск:",
        "cardWithColon": "Картка:",
        "pinkFoamWithIcon": "💧 Рожева піна"
      },
      "buttons": {
        "rangeLabel": "Кнопки 1-15"
      },
      "title": "Пульти",
      "relays": {
        "rangeLabel": "Реле 1-15"
      }
    },
    "bugReport": {
      "placeholders": {
        "reproductionSteps": "1. Відкрити сторінку...\n2. Натиснути...",
        "subject": "Наприклад: кнопка збереження не працює",
        "description": "Опишіть проблему: чого очікували та що сталося..."
      },
      "brand": {
        "supportCenter": "BIGWASH · ЦЕНТР ПІДТРИМКИ"
      },
      "categories": {
        "interface": "Інтерфейс та відображення",
        "other": "Інше",
        "data": "Дані та збереження",
        "controls": "Кнопки та функції",
        "interfaceError": "Помилка інтерфейсу",
        "dataError": "Проблема з даними",
        "suggestion": "Пропозиція"
      },
      "history": {
        "title": "Історія звітів",
        "savedReports": "Збережені звіти",
        "downloadHint": "Звіти залишаються у браузері. Натисніть «Завантажити», щоб передати JSON.",
        "localReports": "Локальні звіти",
        "manageHint": "Можна завантажити або видалити будь-який звіт"
      },
      "delivery": {
        "localOnly": "Без надсилання на сервер"
      },
      "confirm": {
        "deleteLocalReport": "Видалити цей локальний звіт?"
      },
      "priority": {
        "high": "Високий",
        "critical": "Критичний",
        "low": "Низький",
        "medium": "Середній"
      },
      "help": {
        "description": "Вкажіть сторінку, послідовність дій та очікуваний результат. Так розробнику буде легше знайти проблему.",
        "requiredFields": "Поля із зірочкою обов’язкові",
        "title": "Хороший звіт — швидке виправлення"
      },
      "validation": {
        "requiredFields": "Вкажіть тему (від 4 символів) та опис (від 12 символів)."
      },
      "fields": {
        "includeEnvironment": "Додати адресу сторінки та відомості про браузер",
        "category": "Категорія",
        "subject": "Коротка назва *",
        "priority": "Пріоритет",
        "description": "Що сталося? *",
        "reproductionSteps": "Як повторити помилку"
      },
      "actions": {
        "saveReport": "Зберегти звіт",
        "saveLocally": "Зберегти звіт локально"
      },
      "reportTitle": "Звіт",
      "feedback": {
        "savedInBrowser": "Звіт збережено у цьому браузері. Щоб передати його розробнику, завантажте JSON.",
        "notSent": "Звіт збережено. Він ще не надісланий розробнику."
      },
      "title": "Звіт про помилку",
      "localStorage": {
        "title": "Локальне збереження"
      },
      "errors": {
        "saveFailed": "Не вдалося зберегти звіт. Перевірте вільне місце браузера."
      },
      "form": {
        "newReport": "Новий звіт"
      },
      "description": "Опишіть, що пішло не так. Збережіть звіт і передайте його розробнику.",
      "empty": {
        "history": "Поки немає звітів",
        "createFirstHint": "Створіть перший звіт вище"
      }
    },
    "operations": {
      "samples": {
        "vacuumRate": "11.00 грн/хв",
        "foamRate": "20.00 грн/хв",
        "osmosisRate": "4.00 грн/хв",
        "pultName": "Pult_7"
      },
      "payments": {
        "payPass": "PayPass",
        "cashAcceptor": "Готівкоприймач"
      },
      "tabs": {
        "collections": "Інкасації",
        "payments": "Платежі"
      },
      "empty": {
        "collections": "Історії інкасацій немає. Після підключення Go API тут будуть реальні надходження."
      },
      "programs": {
        "pressureWater": "Вода під тиском",
        "osmosis": "Осмос",
        "foam": "Піна",
        "pinkFoam": "Рожева піна"
      },
      "filters": {
        "all": "Всі операції"
      },
      "fields": {
        "transactionDate": "Дата транзакції",
        "expenseDescription": "Опис витрати",
        "category": "Стаття",
        "amountHryvnias": "Сума, ₴",
        "paymentType": "Тип оплати"
      },
      "details": {
        "title": "Деталі операції",
        "titlePrefix": "Деталі операції #"
      },
      "actions": {
        "addExpenses": "Додати витрати",
        "addExpense": "Додати витрату",
        "addCategory": "Додати статтю",
        "title": "Дії операцій",
        "saveLocally": "Зберегти локально",
        "view": "Переглянути",
        "editCategories": "Редагувати статті"
      },
      "columns": {
        "programCount": "Кількість програм",
        "transactionTypeUppercase": "ТИП ТРАНЗАКЦІЇ",
        "price": "Ціна"
      },
      "localPaymentsHint": "Локальні платежі та приклади операцій:",
      "placeholders": {
        "expenseDescription": "Наприклад, ремонт"
      },
      "states": {
        "undefined": "Не визначено"
      },
      "expense": {
        "newCategory": "Нова стаття"
      },
      "title": "Операції",
      "types": {
        "topup": "Поповнення"
      },
      "summary": {
        "dailyAmount": "Сума за день",
        "dailyTransactionCount": "Транзакцій за день",
        "totalCount": "Усього операцій"
      }
    },
    "calendar": {
      "presets": {
        "thirtyDays": "30 днів",
        "sevenDays": "7 днів",
        "today": "Сьогодні",
        "thisMonth": "Цей місяць",
        "thisYear": "Цей рік",
        "thisWeek": "Цей тиждень"
      },
      "months": {
        "march": "Березень",
        "september": "Вересень",
        "december": "Грудень",
        "october": "Жовтень",
        "april": "Квітень",
        "july": "Липень",
        "november": "Листопад",
        "february": "Лютий",
        "august": "Серпень",
        "january": "Січень",
        "may": "Травень",
        "june": "Червень"
      },
      "weekdays": {
        "tuesday": "Вт",
        "sunday": "Нд",
        "monday": "Пн",
        "friday": "Пт",
        "saturday": "Сб",
        "wednesday": "Ср",
        "thursday": "Чт"
      },
      "fields": {
        "from": "Від",
        "to": "До",
        "selectedRange": "Обраний діапазон"
      },
      "actions": {
        "nextMonth": "Наступний місяць",
        "previousMonth": "Попередній місяць"
      },
      "help": {
        "selectFrom": "Оберіть дату «Від»",
        "selectTo": "Оберіть дату «До»"
      },
      "period": {
        "title": "Період",
        "buttonPrefix": "Період:"
      }
    },
    "settings": {
      "brand": {
        "controlCenter": "BIGWASH · ЦЕНТР КЕРУВАННЯ",
        "workspace": "BigWash · Робочий простір"
      },
      "api": {
        "connected": "Go API підключено"
      },
      "language": {
        "russianCode": "RU",
        "ukrainianIndicator": "UA ·",
        "title": "Мова інтерфейсу",
        "description": "Оберіть зручну мову для BigWash",
        "primary": "Основна",
        "russianName": "Русский",
        "ukrainianName": "Українська"
      },
      "mode": {
        "offline": "Автономний режим"
      },
      "backup": {
        "safeExportHint": "Експорт без паролів і токенів",
        "description": "Збережіть локальні дані проєкту окремим файлом",
        "title": "Резервна копія",
        "contentsHint": "Файл містить локальні записи клієнтів, адміністраторів, карт, програм та звітів. Він не надсилається на сервер автоматично."
      },
      "feedback": {
        "languageSaved": "Мову інтерфейсу збережено.",
        "themeSaved": "Оформлення збережено.",
        "backupDownloaded": "Резервну копію JSON завантажено."
      },
      "title": "Налаштування",
      "description": "Налаштуйте робочий простір та керуйте локальними даними.",
      "actions": {
        "refreshCounts": "Оновити показники"
      },
      "appearance": {
        "title": "Оформлення",
        "lightDescription": "Світлий інтерфейс",
        "description": "Тема оновлюється відразу та зберігається у браузері",
        "darkDescription": "Темний інтерфейс"
      },
      "devMode": {
        "title": "Про режим розробки",
        "description": "Це автономна версія інтерфейсу. Дані зберігаються у браузері поточного пристрою. Для спільної бази та безпечної авторизації потрібен Go backend."
      },
      "summary": {
        "browserOnly": "У цьому браузері"
      }
    },
    "wash": {
      "fields": {
        "deWash": "DeWash",
        "cardId": "ID для карт",
        "telegramChatId": "Telegram chat ID",
        "name": "Ім'я мийки",
        "address": "Адреса",
        "visualization": "Візуалізація",
        "byTime": "За часом",
        "theme": "Тема"
      },
      "title": "Мийка",
      "errors": {
        "saveFailed": "Не вдалося зберегти налаштування у браузері. Спробуйте ще раз.",
        "loadFailed": "Не вдалося прочитати налаштування мийки. Показано початкові значення."
      },
      "modal": {
        "title": "Редагування мийки"
      },
      "actions": {
        "edit": "Редагувати мийку",
        "editWithIcon": "Редагувати мийку ✏️"
      },
      "themes": {
        "technical": "Технічне"
      }
    },
    "admin": {
      "fields": {
        "email": "E-mail",
        "emailWithColon": "Email:",
        "newPassword": "Новий пароль",
        "password": "Пароль",
        "lastName": "Прізвище",
        "passwordConfirmation": "Підтвердження паролю",
        "role": "Роль",
        "specialCard": "Спец карта"
      },
      "placeholders": {
        "email": "example@mail.com",
        "confirmPassword": "Підтвердіть пароль"
      },
      "roles": {
        "admin": "Адмін",
        "administrator": "Адміністратор",
        "owner": "Власник",
        "service": "Сервіс"
      },
      "titleShort": "Адміни",
      "title": "Адміністратори",
      "confirm": {
        "delete": "Ви впевнені, що хочете видалити цього адміністратора?"
      },
      "filters": {
        "owners": "Власники",
        "all": "Всі"
      },
      "actions": {
        "cancel": "Відміна",
        "submit": "Відправити",
        "add": "Додати",
        "addShort": "Додати адміна",
        "addAdministrator": "Додати адміністратора",
        "copyEmail": "Копіювати Email",
        "copyCard": "Копіювати карту",
        "generatePassword": "Згенерувати"
      },
      "modal": {
        "title": "Дані адміна"
      },
      "password": {
        "keepUnchanged": "Залишити без змін",
        "newOnlyHint": "Лише для нового пароля",
        "minimumLength": "Пароль має містити щонайменше 6 символів.",
        "mismatch": "Паролі не співпадають!"
      },
      "validation": {
        "fieldsRequired": "Заповніть ім’я, прізвище, телефон та email."
      },
      "states": {
        "saving": "Збереження..."
      },
      "errors": {
        "deleteFailed": "Не вдалося видалити адміністратора. Спробуйте ще раз.",
        "saveFailed": "Не вдалося зберегти адміністратора. Спробуйте ще раз.",
        "roleNotConfigured": "Роль адміністратора не налаштована на сервері."
      },
      "empty": {
        "search": "Нічого не знайдено за вашим запитом"
      },
      "summary": {
        "serviceEngineers": "Сервісних інженерів"
      }
    },
    "clients": {
      "fields": {
        "emailWithColon": "E-mail:",
        "firstNameWithColon": "Ім'я:",
        "card": "Картка",
        "passwordWithColon": "Пароль:",
        "lastNameWithColon": "Прізвище:",
        "tag": "Тег",
        "phoneWithColon": "Телефон:"
      },
      "placeholders": {
        "email": "example@gmail.com",
        "optionalCard": "Необов’язково: номер картки",
        "choose": "обрати..."
      },
      "samples": {
        "firstName": "Єгор",
        "lastName": "Голованець"
      },
      "confirm": {
        "delete": "Ви впевнені, що хочете видалити цього клієнта?"
      },
      "filters": {
        "allClients": "Всі клієнти",
        "withCard": "Користувачі з карткою"
      },
      "modal": {
        "title": "Дані клієнта"
      },
      "demo": {
        "serverSaveDisabled": "Демо-режим: сохранение на сервере отключено."
      },
      "actions": {
        "add": "Додати клієнта",
        "selectExisting": "Обрати існуючий",
        "createNew": "Створити новий",
        "createAndAssign": "Створити та назначити"
      },
      "summary": {
        "withoutCard": "Клієнтів без картки"
      },
      "tags": {
        "color": "Колір:",
        "motorcycle": "Мотоцикл",
        "assign": "Назначити тег"
      },
      "pagination": {
        "previous": "Назад"
      },
      "errors": {
        "deleteFailed": "Помилка видалення клієнта"
      },
      "columns": {
        "fullName": "ФІО"
      }
    },
    "auth": {
      "fields": {
        "emailOrPhone": "Email або Телефон"
      },
      "title": "Авторизація",
      "errors": {
        "credentialsRequired": "Введіть email та пароль.",
        "registrationFieldsRequired": "Заповніть усі поля. Пароль має містити щонайменше 6 символів.",
        "emailExists": "Користувач із таким email вже існує.",
        "loginFailed": "Не вдалося виконати вхід.",
        "networkFailed": "Не вдалося зв’язатися із сервером. Перевірте backend та API URL.",
        "invalidCredentials": "Невірний email або пароль.",
        "passwordTooShort": "Пароль повинен містити мінімум 6 символів.",
        "registrationFailed": "Помилка реєстрації.",
        "serverFailed": "Помилка сервера. Перевірте логи backend.",
        "invalidResponse": "Сервер повернув некоректну відповідь авторизації."
      },
      "actions": {
        "existingAccount": "Вже є акаунт?",
        "signIn": "Вхід",
        "noAccount": "Немає акаунту?",
        "register": "Реєстрація",
        "createAccount": "Створити акаунт",
        "login": "Увійти"
      },
      "registration": {
        "welcome": "Зареєструйтесь та почніть керувати своїми автомийками"
      },
      "states": {
        "checking": "Перевірка авторизації..."
      },
      "password": {
        "show": "Показати пароль",
        "hide": "Приховати пароль"
      },
      "feedback": {
        "registrationSuccess": "Реєстрація успішна! Тепер увійдіть у свій акаунт."
      },
      "login": {
        "welcome": "Увійдіть, щоб продовжити керування вашими автомийками"
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
        "home": "Головна"
      },
      "actions": {
        "changeTheme": "Змінити тему"
      },
      "notifications": {
        "title": "Повідомлення",
        "markAllRead": "Прочитати всі",
        "titleAlternate": "Сповіщення",
        "word": "повідомлення"
      }
    },
    "sidebar": {
      "openMenu": "Відкрити меню"
    },
    "cards": {
      "columns": {
        "uid": "UID",
        "activity": "Активність"
      },
      "fields": {
        "identifier": "Ідентифікатор:",
        "lastUsed": "В останнє використано",
        "client": "Клієнт:",
        "balanceHryvnias": "Сума на рахунку (₴):"
      },
      "summary": {
        "brsmCards": "БРСМ-карток",
        "withoutOwner": "Без власника",
        "total": "Всього карток",
        "moneyOnCards": "Грошей на картках",
        "totalBalance": "Загальний баланс",
        "withoutClients": "Карток без клієнтів"
      },
      "confirm": {
        "delete": "Ви впевнені, що хочете видалити картку?"
      },
      "actions": {
        "identify": "Визначити картку",
        "addToSystem": "Додати до системи",
        "add": "Додати картку"
      },
      "breadcrumb": {
        "legacy": "Головна / Картки"
      },
      "demo": {
        "deleteDisabled": "Демо-режим: видалення недоступне."
      },
      "journal": {
        "title": "Журнал поповнень",
        "empty": "Поповнень ще немає. Історія сервера недоступна в автономному режимі.",
        "description": "Тут відображатимуться локально збережені поповнення карток."
      },
      "title": "Картки",
      "feedback": {
        "recognized": "Картку розпізнано успішно"
      },
      "errors": {
        "deleteFailed": "Не вдалося видалити картку",
        "saveFailed": "Помилка: Не вдалося зберегти картку"
      },
      "states": {
        "notSet": "Не встановлено",
        "awaitingCard": "Очікування картки..."
      },
      "placeholders": {
        "selectClient": "Обрати клієнта"
      },
      "modal": {
        "editTitle": "Редагувати картку",
        "scanTitle": "Сканування картки",
        "createTitle": "Створити картку"
      },
      "listTitle": "Список карток"
    },
    "discounts": {
      "registration": {
        "title": "Бонуси для нових клієнтів при реєстрації",
        "firstTopup": "Перше поповнення",
        "onFirstRegistration": "При першій реєстрації"
      },
      "columns": {
        "discountPercentage": "ВІДСОТОК ЗНИЖКИ",
        "action": "ДІЯ",
        "program": "ПРОГРАМА",
        "turnoverAmount": "СУМА ОБОРОТУ",
        "topupAmount": "СУМА ПОПОВНЕННЯ"
      },
      "schedule": {
        "percentageHint": "Відсоток знижки встановлено згідно часу та програм"
      },
      "topup": {
        "cashPaypassPercentageHint": "Відсоток знижки на поповнення Готівка/PayPass",
        "title": "Знижка поповнення"
      },
      "cardTopup": {
        "percentageHint": "Відсоток знижки на поповнення балансу картки",
        "title": "Знижка поповнення карт клієнта"
      },
      "fields": {
        "weekday": "День тижня",
        "timeTo": "До часу",
        "timeFrom": "З часу",
        "percentage": "Процент %"
      },
      "actions": {
        "addRule": "Додати знижку +"
      },
      "newClients": {
        "title": "Знижка для нових клієнтів"
      },
      "turnover": {
        "title": "Знижка за оборотом",
        "description": "При обороті певної суми на карті клієнт отримує фіксований відсоток"
      },
      "totalTopup": {
        "title": "Знижка за сумарним поповненням",
        "description": "При сумарному поповненні картки на певну суму клієнт отримує відсоток"
      },
      "programs": {
        "title": "Знижка програм"
      },
      "title": "Знижки"
    }
  }
};
