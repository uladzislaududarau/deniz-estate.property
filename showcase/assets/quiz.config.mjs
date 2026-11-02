export const policyVersion = '2026-11-02';
export const steps = [
  { id: 'regions', multiple: true, exclusive: 'undecided', title: { ru: 'В каком регионе Испании вы рассматриваете недвижимость?', en: 'Which areas of Spain are you considering?' }, options: [
    ['costa-blanca', 'Коста-Бланка', 'Costa Blanca'],
    ['costa-del-sol', 'Коста-дель-Соль / Марбелья', 'Costa del Sol / Marbella'],
    ['barcelona', 'Барселона и окрестности', 'Barcelona and surroundings'],
    ['costa-brava', 'Коста-Брава', 'Costa Brava'],
    ['mallorca', 'Майорка', 'Mallorca'],
    ['undecided', 'Пока не определился', 'Not sure yet']
  ] },
  { id: 'purpose', title: { ru: 'Для чего вы выбираете недвижимость?', en: 'What is your main reason for buying?' }, options: [
    ['residence-permit', 'Для получения ВНЖ', 'Residence permit'],
    ['permanent-home', 'Для постоянного проживания', 'Permanent home'],
    ['investment', 'Для инвестиций', 'Investment'],
    ['rental', 'Для сдачи в аренду', 'Rental income']
  ] },
  { id: 'propertyType', title: { ru: 'Какой тип объекта вас интересует?', en: 'What type of property interests you?' }, options: [
    ['apartment', 'Квартира / апартаменты', 'Apartment'],
    ['villa', 'Вилла / дом', 'Villa / house'],
    ['penthouse', 'Пентхаус', 'Penthouse'],
    ['townhouse', 'Таунхаус', 'Townhouse'],
    ['commercial', 'Коммерческая недвижимость', 'Commercial property']
  ] },
  { id: 'budgets', multiple: true, title: { ru: 'Какой бюджет вы рассматриваете?', en: 'What budget are you considering?' }, options: [
    ['under-100k', 'До 100 000 €', 'Under €100,000'],
    ['100k-200k', '100 000–200 000 €', '€100,000–200,000'],
    ['200k-300k', '200 000–300 000 €', '€200,000–300,000'],
    ['300k-500k', '300 000–500 000 €', '€300,000–500,000'],
    ['500k-1m', '500 000–1 000 000 €', '€500,000–1,000,000'],
    ['1m-plus', '1 000 000 € и выше', '€1,000,000 and above']
  ] },
  { id: 'timeline', title: { ru: 'Когда планируете приобретать?', en: 'When are you planning to buy?' }, options: [
    ['soon', 'В ближайшее время', 'As soon as possible'],
    ['3-6-months', 'Через 3–6 месяцев', 'In 3–6 months'],
    ['6-plus-months', 'Более чем через 6 месяцев', 'In more than 6 months']
  ] }
];
export const links = {
  website: { ru: 'https://deniz-estate.com/ru/', en: 'https://deniz-estate.com/en/' },
  // Ссылки взяты из HTML основного сайта deniz-estate.com/ru/ 01.11.2026.
  social: [
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCDrxhkUSjOAefEn3L7ngpKQ' }
  ]
};
export const copy = {
  ru: {
    close: 'Закрыть', back: 'Назад', next: 'Продолжить', send: 'Получить', sending: 'Сохраняем заявку…',
    step: 'Шаг', of: 'из', single: 'Выберите один вариант — перейдём к следующему вопросу.', multiple: 'Можно выбрать один или несколько вариантов.',
    contactTitle: 'Подбор объектов недвижимости в Испании по вашим критериям готов',
    contactIntro: 'Укажите удобный способ получения.',
    name: 'Ваше имя', namePlaceholder: 'Введите ваше имя', invalidName: 'Укажите ваше имя буквами, до 80 символов.',
    messenger: 'Удобный способ связи', phone: 'Ваш номер WhatsApp', telegram: 'Телефон Telegram или username',

    telegramHint: 'Например @username или номер телефона с кодом страны.',
    phoneHint: 'Выберите страну и введите ваш номер телефона без кода страны.',
    consentBefore: 'Я соглашаюсь с ', consentLink: 'условиями обработки персональных данных',
    consentAfter: ' для получения информации по объектам недвижимости от компании Deniz Estate Limited.',
    dataNote: 'Контакт и ответы используются Deniz Estate для обработки вашего запроса.',
    country: 'Страна и телефонный код', nationalPlaceholder: 'Номер телефона', countryDetected: 'Страну можно изменить.', countryFallback: '', countryLoadError: 'Введите номер целиком с кодом страны, начиная с +.', invalidCountryPhone: 'Проверьте номер и выбранную страну: количество цифр не соответствует формату.',
    invalidPhone: 'Проверьте номер телефона и выбранную страну.',
    invalidTelegram: 'Введите Telegram username (от 5 символов) или номер с кодом страны.',
    consentError: 'Подтвердите согласие на обработку персональных данных.',
    networkError: 'Не удалось сохранить заявку. Проверьте соединение и попробуйте ещё раз. Ваши ответы сохранены.',
    rateError: 'Слишком много попыток. Попробуйте отправить заявку немного позже.',
    successTitle: 'Благодарим за ваш запрос.',
    successText: 'В ближайшее время мы вышлем вам подборку объектов недвижимости в Испании по вашим критериям выбранным вами способом получения.',
    successMore: 'Также предлагаем вам ознакомиться с проектами недвижимости, доступными на нашем основном сайте.',
    website: 'Перейти на основной сайт', youtube: 'Просмотреть YouTube', privacyTitle: 'Обработка персональных данных',
    privacyIntro: 'Передавая контакт и ответы, вы разрешаете Deniz Estate использовать их для подготовки предложения по недвижимости и связи с вами в выбранном мессенджере.',
    privacyUse: 'В заявку входят ваше имя, цель покупки, тип недвижимости, бюджет, срок покупки и контакт. Они используются для обработки вашего обращения. Это согласие не включает рекламную рассылку.',
    privacyStorage: 'Страна по IP используется для подстановки телефонного кода. Доступ к заявке предназначен уполномоченным сотрудникам Deniz Estate. Для связи используется выбранный вами WhatsApp или Telegram; после подключения CRM заявки будут обрабатываться в Kommo. Эти сервисы обрабатывают данные по собственным правилам.',
    privacyContact: 'По вопросам доступа, исправления, удаления данных и отзыва согласия обратитесь через контакты на основном сайте Deniz Estate.',
    privacyDraft: 'Предварительные условия для проверки формы. Перед публичным запуском будут добавлены реквизиты оператора, сроки хранения и полная политика.',
    returnQuiz: 'Вернуться к подборке'
  },
  en: {
    close: 'Close', back: 'Back', next: 'Continue', send: 'Receive', sending: 'Saving your request…',
    step: 'Step', of: 'of', single: 'Choose one option to continue.', multiple: 'You can select one or more options.',
    contactTitle: 'Selection of properties in Spain according to your criteria is ready',
    contactIntro: 'Choose your preferred delivery method.',
    name: 'Your name', namePlaceholder: 'Enter your name', invalidName: 'Enter your name using letters, up to 80 characters.',
    messenger: 'Preferred contact method', phone: 'Your WhatsApp number', telegram: 'Telegram phone number or username',
     telegramHint: 'For example @username or a phone number with country code.',
    phoneHint: 'Choose your country and enter your phone number without the country code.',
    consentBefore: 'I agree to the ', consentLink: 'personal data processing terms', consentAfter: ' to receive property information from Deniz Estate Limited.',
    dataNote: 'Deniz Estate uses your contact details and answers to handle your request.',
    country: 'Country and calling code', nationalPlaceholder: 'Phone number', countryDetected: 'You can change the country.', countryFallback: '', countryLoadError: 'Enter the full international number starting with +.', invalidCountryPhone: 'Check your number and country: the number length does not match the format.',
    invalidPhone: 'Check your phone number and selected country.', invalidTelegram: 'Enter a Telegram username (at least 5 characters) or an international phone number.',
    consentError: 'Please agree to the personal data processing terms.',
    networkError: 'We could not save your request. Check your connection and try again. Your answers are saved.',
    rateError: 'Too many attempts. Please try again a little later.',
    successTitle: 'Thank you for your request.', successText: 'We will send your selection shortly using your chosen method.',
    successMore: 'We also invite you to explore our property projects on the main website.', website: 'Explore our main website', youtube: 'Watch YouTube',
    privacyTitle: 'Personal data processing', privacyIntro: 'By providing your contact details and answers, you allow Deniz Estate to use them to prepare a property selection and contact you via your chosen messenger.',
    privacyUse: 'Your request includes your name, purchase purpose, property type, budget, purchase timeframe and contact. These details are used to handle your enquiry. This consent does not include marketing subscriptions.',
    privacyStorage: 'Your IP country is used to suggest a phone calling code. Access to your request is intended for authorised Deniz Estate staff. Communication uses your chosen WhatsApp or Telegram account; once connected, requests will be processed in Kommo CRM. These services process data under their own terms.',
    privacyContact: 'To request access, correction, deletion or withdrawal of consent, use the contact details on the main Deniz Estate website.',
    privacyDraft: 'Draft terms for form review. Operator details, retention periods and the full policy will be added before public launch.', returnQuiz: 'Return to your selection'
  }
};
