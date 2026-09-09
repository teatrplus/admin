/// <reference path="../pb_data/types.d.ts" />
// Homepage editorial content, copied verbatim from the RU/EN/UZ website dictionaries.
// Uses only the fields introduced by the staged homepage/contact migrations.
migrate(
  (app) => {
    if (app.countRecords('t_page_home') || app.countRecords('_copy_block') || app.countRecords('_button')) {
      throw new Error('Homepage seed expects empty page/copy/button collections; reconcile existing content first.')
    }
    const contacts = app.findRecordsByFilter('t_contact', '', 'created', 2)
    if (contacts.length > 1) throw new Error('Homepage seed expects at most one t_contact record.')
    const contact = contacts[0] || new Record(app.findCollectionByNameOrId('t_contact'))
    const instagramUrl = 'https://www.instagram.com/teatr__plus/'
    if (contact.getString('instagram_url') && contact.getString('instagram_url') !== instagramUrl) {
      throw new Error('Existing Instagram URL differs from the requested seed; reconcile it first.')
    }
    contact.set('instagram_url', instagramUrl)
    app.save(contact)

    const save = (collection, data) => {
      const record = new Record(app.findCollectionByNameOrId(collection), data)
      app.save(record)
      return record.id
    }
    const blocks = [
      {
        title_ru: 'Театр+',
        lede_ru:
          '«Театр +» — иммерсивный театр нового поколения, отличительной чертой которого является активное вовлечение зрителя в сценическое действие. Идея создания театра принадлежит художественному руководителю Михаилу Долóко.',
        description_ru:
          'Театр+ был основан и открыт в ноябре 2025 года и за столь короткий период успел завоевать любовь и признание зрителей Ташкента и гостей столицы.\n\nВ репертуаре театра представлены спектакли — «Сундук Деда Мороза», «Краски» и «Мастерская игрушек», а уже в 2026 году планируется премьера новых постановок.',
        title_en: 'Theater+',
        lede_en:
          'Theater+ is a new-generation immersive theater whose hallmark is actively involving the audience in the performance. The idea for the theater belongs to artistic director Mikhail Doloko.',
        description_en:
          'Theater+ was founded and opened in November 2025 and, in a short time, has won the affection of Tashkent audiences and visitors to the capital.\n\nThe repertoire includes Father Frost’s Chest, Paints, and Toy Workshop, with new premieres planned for 2026.',
        title_uz: 'Teatr+',
        lede_uz:
          '«Teatr +» — tomoshabinni sahnaviy harakatga faol jalb qilish bilan ajralib turadigan yangi avlod immersiv teatri. Teatrni yaratish g‘oyasi badiiy rahbar Mixail Dolokoga tegishli.',
        description_uz:
          'Teatr+ 2025 yil noyabrida tashkil etilib ochilgan va qisqa vaqt ichida Toshkent tomoshabinlari hamda mehmonlarining sevgisini qozongan.\n\nTeatr repertuarida «Qorbobo sandig‘i», «Bo‘yoqlar» va «O‘yinchoqlar ustaxonasi» spektakllari mavjud, 2026 yilda yangi premiyeralar rejalashtirilgan.',
      },
      {
        title_ru: '2025',
        description_ru: 'Год основания',
        title_en: '2025',
        description_en: 'Year founded',
        title_uz: '2025',
        description_uz: 'Tashkil etilgan yil',
      },
      {
        title_ru: '3',
        description_ru: 'Спектакля в репертуаре',
        title_en: '3',
        description_en: 'Shows in repertoire',
        title_uz: '3',
        description_uz: 'Repertuardagi spektakllar',
      },
      {
        title_ru: '3+',
        description_ru: 'Минимальный возраст',
        title_en: '3+',
        description_en: 'Minimum age',
        title_uz: '3+',
        description_uz: 'Minimal yosh',
      },
      {
        title_ru: 'Вы ещё не с нами в ленте?',
        description_ru:
          'Репетиции, грим, первый поклон — то, что живёт за кулисами и не помещается на афишу. Заходите, не дайте следующему проскочить мимо.',
        title_en: 'Not in the feed with us yet?',
        description_en:
          'Rehearsals, greasepaint, the first bow — the living bits that stay backstage and never fit a poster. Come in, don’t let the next one slip by.',
        title_uz: 'Lentada hali biz bilan emassizmi?',
        description_uz:
          'Mashqlar, grim, birinchi ta’zim — sahna ortida yashaydigan va afishaga sig‘maydigan narsalar. Kiring, keyingisini o‘tkazib yubormang.',
      },
      {
        title_ru: 'Ждем вас на наши спектакли в Театр+!',
        lede_ru: 'Живите в плюсе!',
        title_en: 'We look forward to seeing you at Theater+!',
        lede_en: 'Live in the plus!',
        title_uz: 'Sizni Teatr+ spektakllariga kutamiz!',
        lede_uz: 'Plusda yashang!',
      },
      {
        title_ru: 'Театр должен быть честным',
        lede_ru: 'Михаил Долóко',
        description_ru: 'Художественный руководитель театра',
        title_en: 'Theater must be honest',
        lede_en: 'Mikhail Doloko',
        description_en: 'Artistic director',
        title_uz: 'Teatr halol bo‘lishi kerak',
        lede_uz: 'Mixail Doloko',
        description_uz: 'Teatr badiiy rahbari',
      },
    ].map((data) => save('_copy_block', data))
    const buttons = [
      {
        label_ru: 'Подписаться в Instagram',
        label_en: 'Follow on Instagram',
        label_uz: 'Instagram’da obuna bo‘ling',
        url: 'https://www.instagram.com/teatr__plus/',
      },
      {
        label_ru: 'Купить билеты',
        label_en: 'Buy tickets',
        label_uz: 'Chipta sotib olish',
        url: 'https://iticket.uz/ru/venues/theatre-form-zarafshan-ch',
      },
      {
        label_ru: 'О Михаиле',
        label_en: 'About Mikhail',
        label_uz: 'Mixail haqida',
        url: 'https://theaterplus.uz/mikhail-doloko/',
      },
    ].map((data) => save('_button', data))
    const masks = app.findRecordsByFilter('t_mask', 'legacy_slug = "023"', '', 2)
    if (masks.length !== 1) throw new Error('Homepage seed requires museum mask 023.')
    const plays = app.findRecordsByFilter('t_play', '', 'created', 11)
    if (plays.length > 10) throw new Error('Select up to ten featured plays before seeding the homepage.')
    const page = new Record(app.findCollectionByNameOrId('t_page_home'), {
      featured_plays: plays.map((play) => play.id),
      about_block: blocks[0],
      about_info_blocks: blocks.slice(1, 4),
      about_mask: masks[0].id,
      instagram_block: blocks[4],
      instagram_button: buttons[0],
      cta_block: blocks[5],
      cta_button: buttons[1],
      bottom_block: blocks[6],
      bottom_button: buttons[2],
    })
    const assets = __hooks + '/../pb_migrations/home-assets/'
    page.set('instagram_avatar', $filesystem.fileFromPath(assets + 'logo.png'))
    page.set('bottom_image', $filesystem.fileFromPath(assets + 'mikhail.png'))
    app.save(page)
    for (const name of ['t_page_home', '_copy_block', '_button', 't_contact']) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = ''
      collection.viewRule = ''
      app.save(collection)
    }
  },
  (app) => {
    // Preserve editorial records/files on rollback, as with the museum content seed.
    for (const name of ['t_page_home', '_copy_block', '_button', 't_contact']) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = null
      collection.viewRule = null
      app.save(collection)
    }
  },
)
