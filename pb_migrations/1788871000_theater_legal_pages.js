/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Generic starter copy. Review operational and legal details before publication.
    const pages = [
      {
        name: 't_page_privacy_policy',
        content_ru: `Эта политика объясняет, как сайт Театра+ использует сведения, которые вы передаёте при обращении в театр.

Форма обратной связи запрашивает имя, сообщение и хотя бы один способ связи: электронную почту или телефон. Эти сведения нужны, чтобы рассмотреть обращение и ответить вам. Не указывайте в сообщении платёжные данные, пароли и другую конфиденциальную информацию.

Обращения доступны сотрудникам, которые работают с запросами посетителей, и администраторам системы. Сведения из формы не публикуются на сайте. По вопросам доступа к вашим данным, их исправления или удаления свяжитесь с театром: info@teatrplus.uz.

Сайт сохраняет выбранные язык и тему оформления в локальном хранилище браузера. Удалить эти настройки можно через настройки браузера. Технические журналы сервера могут содержать сведения о запросах, необходимые для работы и защиты сайта.

Покупка билетов проходит на сайте билетного оператора. Его правила обработки данных и оплаты действуют на его площадке. Переходя в социальные сети или картографические сервисы, ознакомьтесь с их политиками конфиденциальности.`,
        content_en: `This policy explains how the Theater+ website uses information you provide when contacting the theater.

The contact form asks for your name, message and at least one contact method: email or phone. These details help us handle your inquiry and reply to you. Please do not include payment details, passwords or other sensitive information in your message.

Inquiries are accessible to staff handling visitor requests and system administrators. Information submitted through the form is not published on the website. To ask about access to your information, corrections or deletion, contact the theater at info@teatrplus.uz.

The website saves your language and theme preferences in your browser's local storage. You can remove these preferences in your browser settings. Technical server logs may contain request information needed to operate and protect the website.

Ticket purchases take place on the ticket operator's website, where its own data and payment policies apply. When following links to social networks or map services, please read their privacy policies.`,
        content_uz: `Ushbu siyosat Teatr+ saytida teatrga murojaat qilganingizda taqdim etgan ma’lumotlaringizdan qanday foydalanilishini tushuntiradi.

Aloqa shaklida ism, xabar va kamida bitta aloqa usuli — elektron pochta yoki telefon raqami so‘raladi. Bu ma’lumotlar murojaatingizni ko‘rib chiqish va sizga javob berish uchun kerak. Xabarga to‘lov ma’lumotlari, parollar yoki boshqa maxfiy ma’lumotlarni kiritmang.

Murojaatlardan tashrif buyuruvchilar so‘rovlari bilan ishlaydigan xodimlar va tizim administratorlari foydalanishi mumkin. Shakl orqali yuborilgan ma’lumotlar saytda e’lon qilinmaydi. Ma’lumotlaringiz bilan tanishish, ularni tuzatish yoki o‘chirish masalalari bo‘yicha info@teatrplus.uz manziliga yozing.

Sayt tanlangan til va rang mavzusini brauzerning mahalliy xotirasida saqlaydi. Ularni brauzer sozlamalari orqali o‘chirishingiz mumkin. Serverning texnik jurnallarida sayt ishlashi va himoyasi uchun zarur so‘rov ma’lumotlari bo‘lishi mumkin.

Chiptalar chipta operatorining saytida sotib olinadi. U yerda operatorning ma’lumotlarni qayta ishlash va to‘lov qoidalari amal qiladi. Ijtimoiy tarmoqlar yoki xarita xizmatlariga o‘tganda ularning maxfiylik siyosati bilan tanishing.`,
      },
      {
        name: 't_page_public_offer',
        content_ru: `Театр+ приглашает зрителей на спектакли и другие мероприятия, опубликованные в афише. Перед покупкой билета ознакомьтесь с описанием события и условиями продажи.

Дата, время, место проведения, возрастные рекомендации и стоимость указываются на странице мероприятия и при оформлении заказа. Проверьте выбранное событие, количество билетов и итоговую сумму до оплаты. Просмотр сайта и отправка обращения сами по себе не являются покупкой или бронированием.

При покупке через iTicket оформление заказа и оплата происходят на площадке оператора по его условиям. Сохраните билет и подтверждение оплаты. По вопросам заказа обращайтесь к продавцу, указанному в подтверждении покупки.

Билет даёт право посетить указанное в нём мероприятие с соблюдением правил театра. Пожалуйста, сохраняйте код билета читаемым и не передавайте его посторонним. Условия посещения детьми и необходимость отдельного билета уточняйте до покупки.

При отмене, переносе мероприятия или необходимости возврата обратитесь к продавцу билета. Возможность, порядок и сроки возврата определяются применимыми условиями продажи и законодательством. Вопросы о мероприятиях можно направить на info@teatrplus.uz или задать кассе по телефону +998 71 232-15-52.`,
        content_en: `Theater+ welcomes visitors to the performances and other events listed in its programme. Please read the event description and sales terms before buying a ticket.

The event page and checkout provide the date, time, venue, age guidance and price. Check the selected event, ticket quantity and total before paying. Browsing this website or submitting an inquiry does not by itself constitute a purchase or reservation.

For purchases through iTicket, ordering and payment take place on the operator's platform under its terms. Keep your ticket and payment confirmation. Send order inquiries to the seller identified in your purchase confirmation.

A ticket provides admission to the event shown on it, subject to the theater's visitor rules. Keep the ticket code readable and do not share it publicly. Check children's admission conditions and whether a separate ticket is needed before buying.

If an event is cancelled or rescheduled, or you need a refund, contact the ticket seller. Refund eligibility, procedure and timing depend on the applicable sales terms and law. For event inquiries, email info@teatrplus.uz or call the box office on +998 71 232-15-52.`,
        content_uz: `Teatr+ tomoshabinlarni afishada e’lon qilingan spektakllar va boshqa tadbirlarga taklif qiladi. Chipta sotib olishdan oldin tadbir tavsifi va savdo shartlari bilan tanishing.

Sana, vaqt, manzil, yosh bo‘yicha tavsiyalar va narx tadbir sahifasida hamda buyurtmani rasmiylashtirishda ko‘rsatiladi. To‘lovdan oldin tanlangan tadbir, chiptalar soni va jami summani tekshiring. Saytni ko‘rish yoki murojaat yuborishning o‘zi xarid yoki band qilish hisoblanmaydi.

iTicket orqali xarid qilinganda buyurtma va to‘lov operator platformasida uning shartlari asosida amalga oshiriladi. Chipta va to‘lov tasdig‘ini saqlang. Buyurtma bo‘yicha savollar bilan xarid tasdig‘ida ko‘rsatilgan sotuvchiga murojaat qiling.

Chipta teatrga tashrif qoidalariga rioya qilgan holda unda ko‘rsatilgan tadbirga kirish huquqini beradi. Chipta kodi o‘qiladigan holatda bo‘lsin va uni begonalarga tarqatmang. Bolalar uchun kirish shartlari va alohida chipta zarurligini xariddan oldin aniqlang.

Tadbir bekor qilinsa, boshqa sanaga ko‘chirilsa yoki pulni qaytarish kerak bo‘lsa, chipta sotuvchisiga murojaat qiling. Qaytarish imkoniyati, tartibi va muddati tegishli savdo shartlari hamda qonunchilikka bog‘liq. Tadbirlar bo‘yicha info@teatrplus.uz manziliga yozing yoki kassaga +998 71 232-15-52 raqami orqali qo‘ng‘iroq qiling.`,
      },
      {
        name: 't_page_theater_visit_rules',
        content_ru: `Пожалуйста, приходите в Театр+ заранее, чтобы спокойно пройти проверку билетов и занять свои места. Подготовьте электронный или бумажный билет с читаемым кодом. Если вы опоздали, дождитесь указаний сотрудника о подходящем моменте для входа.

Учитывайте возрастные рекомендации мероприятия. Дети должны находиться под присмотром сопровождающих взрослых. Если вам нужна помощь при входе или размещении, заранее свяжитесь с администрацией по телефону +998 92 045-63-36.

Во время спектакля переведите телефон в беззвучный режим. Не разговаривайте громко и не мешайте другим зрителям. Фото- и видеосъёмку согласуйте с сотрудниками; не используйте вспышку. Участие в интерактивных сценах добровольно — следуйте приглашениям артистов.

Бережно относитесь к маскам, декорациям и оборудованию. Не трогайте экспонаты и не выходите на сцену без приглашения. Уточните у сотрудников, где разрешены еда и напитки. Курение и использование электронных сигарет в помещениях не допускаются.

Не приносите опасные предметы, не перекрывайте проходы и выходы. При тревоге следуйте указаниям сотрудников. Если вам стало плохо, вы потеряли вещь или заметили опасность, сразу обратитесь к ближайшему сотруднику. Спасибо за уважение к зрителям и команде театра.`,
        content_en: `Please arrive at Theater+ early enough to have your ticket checked and find your seat. Have a digital or printed ticket with a readable code ready. If you arrive late, wait for staff to indicate a suitable moment to enter.

Observe the event's age guidance. Children must remain under the supervision of accompanying adults. If you need assistance with entry or seating, contact the administration in advance on +998 92 045-63-36.

Silence your phone during the performance. Avoid loud conversations and disturbing other visitors. Ask staff about photography and recording, and do not use flash. Participation in interactive scenes is voluntary; follow the performers' invitations.

Treat masks, scenery and equipment with care. Do not touch exhibits or enter the stage without an invitation. Ask staff where food and drinks are permitted. Smoking and vaping are not permitted indoors.

Do not bring dangerous items or block aisles and exits. Follow staff instructions in an emergency. If you feel unwell, lose an item or notice a hazard, tell the nearest staff member promptly. Thank you for respecting fellow visitors and the theater team.`,
        content_uz: `Chiptangizni tekshirtirish va joyingizni topishga vaqt yetishi uchun Teatr+ga oldinroq keling. Kodi o‘qiladigan elektron yoki qog‘oz chiptani tayyorlang. Kechiksangiz, kirish uchun qulay paytni xodim ko‘rsatishini kuting.

Tadbirning yosh bo‘yicha tavsiyalarini hisobga oling. Bolalar hamroh kattalar nazoratida bo‘lishi kerak. Kirish yoki joylashishda yordam kerak bo‘lsa, oldindan ma’muriyat bilan +998 92 045-63-36 raqami orqali bog‘laning.

Spektakl vaqtida telefonni ovozsiz rejimga o‘tkazing. Baland ovozda gaplashmang va boshqa tomoshabinlarga xalaqit bermang. Suratga olish va video yozishni xodimlar bilan kelishing, chaqnoqdan foydalanmang. Interaktiv sahnalarda qatnashish ixtiyoriy; artistlarning takliflariga amal qiling.

Niqoblar, dekoratsiyalar va jihozlarga ehtiyotkorlik bilan munosabatda bo‘ling. Taklifsiz eksponatlarga tegmang va sahnaga chiqmang. Ovqat va ichimliklarga qayerda ruxsat berilishini xodimlardan so‘rang. Bino ichida chekish va elektron sigaretlardan foydalanish mumkin emas.

Xavfli buyumlar olib kelmang, yo‘lak va chiqishlarni to‘smang. Favqulodda vaziyatda xodimlar ko‘rsatmalariga amal qiling. O‘zingizni yomon his qilsangiz, buyumingiz yo‘qolsa yoki xavfni sezsangiz, darhol eng yaqin xodimga xabar bering. Tomoshabinlar va teatr jamoasiga hurmatingiz uchun rahmat.`,
      },
    ]

    for (const page of pages) {
      const collection = new Collection({
        name: page.name,
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      })
      for (const locale of ['en', 'ru', 'uz']) {
        collection.fields.add(new TextField({ name: `content_${locale}`, required: true, max: 100000 }))
      }
      app.save(collection)
      const record = new Record(collection)
      for (const locale of ['en', 'ru', 'uz']) record.set(`content_${locale}`, page[`content_${locale}`])
      app.save(record)
    }
  },
  () => {
    // Preserve edited documents on rollback.
  },
)
