/// <reference path="../pb_data/types.d.ts" />
// Keep the media beside this migration: a fresh deployment must not depend on the website checkout.
migrate(
  (app) => {
    const admin =
      "@request.auth.id != '' && @request.auth.collectionName = '_user_staff' && @request.auth.role = 'admin'"
    const masks = app.findCollectionByNameOrId('t_mask')
    const page = app.findCollectionByNameOrId('t_page_masks')
    masks.fields.add(new TextField({ name: 'slug', required: true, max: 80, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }))
    masks.fields.add(new NumberField({ name: 'sort_order', min: 0, onlyInt: true }))
    masks.fields.add(
      new FileField({
        name: 'image',
        required: true,
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        thumbs: ['460x0', '1080x0'],
      }),
    )
    // These collections were introduced empty. Refuse to guess URLs for pre-existing editorial records.
    if (app.countRecords('t_mask') > 0 || app.countRecords('t_page_masks') > 0)
      throw new Error('Museum seed expects empty collections; export and reconcile existing content first.')
    masks.indexes.push('CREATE UNIQUE INDEX idx_t_mask_slug ON t_mask (slug)')
    page.fields.add(new TextField({ name: 'singleton', required: true, pattern: '^museum$', max: 6 }))
    page.indexes.push('CREATE UNIQUE INDEX idx_t_page_masks_singleton ON t_page_masks (singleton)')
    for (const name of [
      'kicker',
      'back_label',
      'serial_label',
      'hall_title',
      'excursion_kicker',
      'excursion_photo_alt',
      'excursion_gallery_label',
      'previous_photo_label',
      'next_photo_label',
      'mask_image_alt',
      'meta_title',
      'meta_description',
      'mask_meta_title',
      'mask_meta_description',
    ]) {
      for (const locale of ['ru', 'en', 'uz']) page.fields.add(new TextField({ name: name + '_' + locale, max: 5000 }))
    }
    page.fields.add(
      new FileField({
        name: 'excursion_photos',
        maxSelect: 30,
        maxSize: 10485760,
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        thumbs: ['1200x0'],
      }),
    )
    // Public museum content; only staff admins (or PocketBase superusers) may edit it.
    for (const collection of [masks, page]) {
      collection.listRule = ''
      collection.viewRule = ''
      collection.createRule = admin
      collection.updateRule = admin
      collection.deleteRule = null
      app.save(collection)
    }
    const assets = __hooks + '/../pb_migrations/museum-assets/'
    for (const data of [
      {
        id: 'museummask00004',
        slug: '004',
        sort_order: 1,
        name_ru: 'Плут',
        description_ru:
          'Говорят, продавал одно место дважды и сам в нём сидел. Первому достался вид на сцену. Второму — разговор с человеком, который вставать не собирался. К приходу билетёра Плут уже сидел на галёрке и считал. С двумя билетами в одной руке его так никто и не взял. Он смешной так, как смешна закрытая дверь, когда вы опаздываете, — и достаточно хитёр, чтобы при этом выглядеть виноватым. Улыбка осталась вещественным доказательством: чуть слишком довольная, чуть слишком готовая продать вам тот же вечер ещё раз. Постоите перед ним подольше — полезете в карман проверить.',
        name_en: 'Trick',
        description_en:
          'They say he sold the same seat twice and sat in it himself. The first buyer got the view of the stage. The second got a conversation with a stranger who would not move. By the time the usher arrived, Trick was already in the cheap seats, counting. Nobody ever caught him with both tickets in one hand. He is funny in the way a locked door is funny when you are late — and cunning enough to look sorry about it. The smile is the only evidence that remains: a little too pleased, a little too ready to sell you the same evening again. Stand in front of him long enough and you will want to check your pocket.',
        name_uz: 'Ayyor',
        description_uz:
          'Aytishlaricha, u bir o‘rindiqni ikki marta sotib, o‘zi ham o‘tirgan. Birinchisiga sahna ko‘riniqi nasib etgan. Ikkinchisiga — o‘rnidan turmoqchi bo‘lmagan notanish bilan suhbat. Chipta nazoratchisi kelganida Ayyor allaqachon arzon o‘rindiqlarda o‘tirib, sanab o‘tirgan edi. Ikki chipta bir qo‘lida ekanini hech kim ushlamagan. U kechikkaningizda yopiq eshik qanday kulgili bo‘lsa, shunday kulgili — va shu bilan birga aybdor ko‘rinadigan darajada ayyor. Tabassum — qolgan yagona dalil: biroz ortiqcha mamnun, xuddi shu oqshomni yana bir bor sotishga tayyor. Oldida uzoqroq tursangiz, cho‘ntagingizni tekshirib ko‘rasiz.',
      },
      {
        id: 'museummask00007',
        slug: '007',
        sort_order: 2,
        name_ru: 'Весна',
        description_ru:
          'Пришла с холода и до сих пор не решила, оставаться ли. Ящика в описи нет, письма в деле нет. Есть женщина, которая смотрит мимо, — будто весть идёт кружной дорогой, и она согласилась подождать. Тоска на ней как погода, не как грим. Дети замолкают сами. Взрослые начинают фразу и оставляют её на полу. Она ничего не просит — в этом и тайна: лицо, которое уже ушло, и тело, которое висит на стене до закрытия. Утром уборщица говорит, что в комнате позже, чем на часах.',
        name_en: 'Vesna',
        description_en:
          'She came in from the cold and never quite decided to stay. There is no crate in the inventory, no letter in the file. What we have is a woman who looks past you, as if a message is taking the long way round and she has agreed to wait. Melancholy sits on her like weather, not like paint. Children go quiet without being asked. Adults start a sentence and leave it on the floor. She does not ask for anything, which is the mystery: a face that has already left, and a body that remains on the wall until closing. In the morning the cleaner says the room feels later than the clocks.',
        name_uz: 'Bahor',
        description_uz:
          'U sovuqdan kirib kelgan va qolish-qolmaslikni hali ham hal qilmagan. Ro‘yxatda sandiq yo‘q, ishda maktub yo‘q. Bor narsa — sizdan o‘tib qaraydigan ayol, go‘yo xabar aylanma yo‘ldan kelyapti va u kutishga rozi bo‘lgan. Qayg‘u unda grim emas, ob-havo kabi. Bolalar o‘zlaridan jim bo‘lishadi. Kattalar gapni boshlab, uni yerga tashlab ketishadi. U hech narsa so‘ramaydi — sir shunda: allaqachon ketgan yuz va yopilgunicha devorda qoladigan tana. Ertalab farrosh aytadi: xonada soatdagidan kechroq.',
      },
      {
        id: 'museummask00011',
        slug: '011',
        sort_order: 3,
        name_ru: 'Царь-Зверь',
        description_ru:
          'Наполовину государь, наполовину тот зверь, которого государи боятся. Корона села однажды вечером — и с тех пор не спрашивает разрешения. В металле виден двор. В пасти — охота. Он царственный в старом смысле: не вежливый, не выбранный, просто есть, и комната сама собой строится вокруг него. Экскурсоводы понижают голос, сами того не замечая. Один ребёнок поклонился. Мы его не поправляли. Если это зверь — то тот, кто держит царство, потому что больше некому. Если государь — он помнит лес. Моль, которая его короновала, если она была, за сметой так и не вернулась.',
        name_en: 'Crown-Beast',
        description_en:
          'Half a king, half the animal a king is afraid of. The crown sat down one evening and has not asked permission since. You can see the court in the metal and the hunt in the mouth. He is regal in the old sense: not polite, not elected, simply there, and the rest of the room arranges itself around him. Guides lower their voices without noticing. A child once bowed; we did not correct the child. If he is a beast, he is the kind that keeps a kingdom because no one else will. If he is a king, he remembers the forest. The moths that crowned him, if they existed, have not come back for the budget.',
        name_uz: 'Shoh-hayvon',
        description_uz:
          'Yarmi podshoh, yarmi podshohlar qo‘rqqan hayvon. Toj bir oqshom o‘tirib qolgan — o‘shandan beri ruxsat so‘ramaydi. Metallda saroy ko‘rinadi. Og‘izda — ov. U eski ma’noda shohona: xushmuomala emas, saylanmagan, shunchaki bor, va xona o‘z-o‘zidan uning atrofida tiziladi. Ekskursiya yo‘lboshchilari ovozini pasaytiradi, o‘zlari sezmay. Bir bola ta’zim qildi. Biz uni to‘g‘rilamadik. Agar hayvon bo‘lsa — saltanatni boshqa hech kim ushlab turolmagani uchun ushlab turadigan hayvon. Agar podshoh bo‘lsa — o‘rmonni eslaydi. Uni toj kiydirgan kuya, agar bo‘lgan bo‘lsa, smeta uchun qaytib kelmagan.',
      },
      {
        id: 'museummask00012',
        slug: '012',
        sort_order: 4,
        name_ru: 'Долгий',
        description_ru:
          'Вымахал выше ссоры. Что бы ни кричали в фойе, это уже где-то у коленей, и он не вмешивается. Дерево светлое. Лицо спокойное не пустотой — скорее как у человека, который новость уже слышал и решил, что она может подождать. Он очень высокий. Его снимают сбоку, потом в фас, потом перестают разговаривать. Племенной, если это слово ещё значит лицо, которое принадлежит месту сильнее, чем сезону. Самый тихий в доме. Остальные маски стоят будто чуть дальше — как будто тоже договорились не повышать голос.',
        name_en: 'Still',
        description_en:
          'He grew past the argument. Whatever is being shouted in the foyer happens somewhere around his knees, and he does not join in. The wood is light. The face is calm in a way that is not empty — more like a person who has already heard the news and decided it can wait. He is very long. People photograph him from the side, then from the front, then they stop talking. Tribal, if that word still means a face that belongs to a place more than to a season. He is the quietest thing in the house. Even the other masks seem to stand a little further off, as if they too have agreed not to raise their voices.',
        name_uz: 'Sokin',
        description_uz:
          'U janjaldan baland o‘sgan. Foyeda nima deb qichqirishmasin, bu allaqachon tizzalari atrofida, va u aralashmaydi. Yog‘och och rang. Yuz bo‘shliqdan emas, tinch — xuddi xabarni eshitib, u kutishi mumkin deb qaror qilgan odamnikidek. U juda uzun. Uni yondan, keyin oldindan suratga olishadi, keyin gapirishni to‘xtatishadi. Qabila niqobi, agar bu so‘z hali ham fasldan ko‘ra makonga tegishli yuzni anglatsa. Uydagi eng jim narsa. Qolgan niqoblar ham biroz uzoqroq turadi — go‘yo ular ham ovozini ko‘tarmaslikka kelishib olishgan.',
      },
      {
        id: 'museummask00013',
        slug: '013',
        sort_order: 5,
        name_ru: 'Ненастье',
        description_ru:
          'Заглянул в то, что будет, и погода там ему не понравилась. Видение прошло. С лица — не сошло. Выше Долгого, темнее, испещрён, как карта, которую слишком часто складывали. Шаман, если нужно слово, — не открыточный, а тот, кто вернулся из будущего с головной болью и без желания объяснять. На дороге сидело что-то нехорошее, и он это разглядел. Остальное не обсуждает. Гости смеются, потом нет. Он не зол. Он в курсе. Постойте минуту: в комнате делается час до дождя, когда улица ещё не решила бежать.',
        name_en: 'Bad Weather',
        description_en:
          'He looked into what comes next and did not like the weather. The vision passed. The face did not. Taller than Still, darker, marked like a map someone folded too many times. Call him a shaman if you need the word — not the postcard kind, the kind who came back from the future with a headache and no interest in explaining. Something unpleasant sat in the path and he saw it clearly. He will not discuss the rest. Visitors laugh, then they do not. He is not angry. He is informed. Stand there a minute: the room feels like the hour before rain, when the street has not yet decided to run.',
        name_uz: 'Alomat',
        description_uz:
          'U keyin nima bo‘lishiga qaradi va ob-havo yoqmadi. Ko‘rinish o‘tdi. Yuzdan tushmadi. Sokindan baland, qoraroq, haddan tashqari ko‘p buklangan xarita kabi naqshli. Agar so‘z kerak bo‘lsa — shaman, otkritkadagisi emas, kelajakdan bosh og‘rig‘i va tushuntirish istagisiz qaytgani. Yo‘lda yoqimsiz narsa o‘tirgan edi, u buni aniq ko‘rdi. Qolganini gapirmaydi. Mehmonlar kulishadi, keyin yo‘q. U jahldor emas. U xabardor. Bir daqiqa turing: xonada yomg‘irdan oldingi soat bo‘ladi, ko‘cha hali yugurishga qaror qilmagan payt.',
      },
      {
        id: 'museummask00022',
        slug: '022',
        sort_order: 6,
        name_ru: 'Дразнила',
        description_ru:
          'Показывает язык — и, кажется, ждёт ответа. Разноцветный колпак, завитки на щеках, открытая улыбка: у этого клоуна всё готово к маленькой шалости. В его дразнилке нет злости. Скорее приглашение на минуту забыть, что вы взрослый и в музее полагается держаться серьёзно. Можно показать язык в ответ. Можно просто улыбнуться. Он выглядит так, будто оба варианта его вполне устраивают.',
        name_en: 'Tease',
        description_en:
          'He sticks out his tongue and seems to wait for an answer. A colourful cap, curls on his cheeks, an open grin: this clown is ready for a little mischief. There is no malice in his teasing. It feels like an invitation to forget, for a moment, that you are a grown-up and museums are supposed to be serious. Stick your tongue out back. Or just smile. He looks perfectly happy with either reply.',
        name_uz: 'Hazilkash',
        description_uz:
          'Tilini chiqarib, go‘yo javob kutadi. Rang-barang qalpoq, yonoqlardagi gajaklar, ochiq tabassum: bu masxaraboz kichik bir sho‘xlikka tayyor. Uning hazilida yomon niyat yo‘q. Go‘yo bir zumga katta odam ekaningizni, muzeyda jiddiy turish kerakligini unutishga chorlaydi. Javoban til chiqarish ham mumkin. Shunchaki kulib qo‘yish ham. Qaysi birini tanlamang, u mamnundek ko‘rinadi.',
      },
      {
        id: 'museummask00023',
        slug: '023',
        sort_order: 7,
        name_ru: 'Сударыня',
        description_ru:
          'Улыбается так, будто вас давно ждали. Алый бархат, золотые складки, бирюзовые узоры — наряд для большого выхода, а тепло совсем домашнее. В этой даме есть и грация, и материнская нежность. Чуть склонённая голова словно предлагает подойти поближе. Перед такой улыбкой легко представить простое: «Ну, рассказывай». И кажется, что можно рассказать всё, не подбирая слов и не стараясь выглядеть лучше, чем есть.',
        name_en: 'Gracious Lady',
        description_en:
          'She smiles as though she has been waiting for you. Scarlet velvet, golden folds, turquoise flourishes: dressed for a grand entrance, with the warmth of home. There is grace in this lady, and a motherly tenderness. Her gently tilted head seems to invite you closer. You can almost hear a simple “Tell me about it.” And it feels as though you could tell her everything, without choosing your words or trying to look better than you are.',
        name_uz: 'Mehribon xonim',
        description_uz:
          'Go‘yo sizni anchadan beri kutgandek tabassum qiladi. Qirmizi baxmal, oltin burmalar, feruza naqshlar — tantanaga mos libos, ammo undagi iliqlik xuddi uydagidek. Bu xonimda nazokat ham, onalarcha mehr ham bor. Boshini sal egib, go‘yo yaqinroq kelishga undaydi. Bu tabassumdan oddiygina «Qani, gapir» degan so‘zlarni eshitgandek bo‘lasiz. Unga so‘z tanlamay, o‘zingizni aslidan yaxshiroq ko‘rsatishga urinmay, hammasini aytib berish mumkindek tuyuladi.',
      },
    ]) {
      const record = new Record(masks, data)
      record.set('image', $filesystem.fileFromPath(assets + 'mask-' + data.slug + '.png'))
      app.save(record)
    }
    const record = new Record(page, {
      id: 'museum000000001',
      singleton: 'museum',
      museum_button_url:
        'https://yandex.uz/maps/10335/tashkent/?from=mapframe&ll=69.273666,41.312344&mode=routes&rtext=~41.312716,69.273436&rtt=auto&ruri=~ymapsbm1://org?oid%3D82348125576&source=mapframe&z=19.08',
      excursion_button_url: 'https://iticket.uz/{locale}/venues/theatre-form-zarafshan-ch',
      kicker_ru: 'Ташкент',
      title_ru: 'Первый музей масок в СНГ',
      lede_ru: 'Первый в странах СНГ музей театральных масок находится в Ташкенте — в Театр+.',
      description_ru:
        'Девяносто масок. Театр открылся в ноябре 2025 года и уже собрал коллекцию, какой нет ни у одного театра в регионе. Приходите посмотреть. Для этого билет не нужен.',
      back_label_ru: 'В музей',
      serial_label_ru: '№ {id}',
      hall_title_ru: 'Коллекция',
      museum_title_ru: 'У нас их больше девяноста!',
      museum_description_ru:
        'На этой странице их только семь. Остальные ждут в театре. Войти и посмотреть можно бесплатно: экскурсия для этого не нужна. Платите, только если хотите экскурсию.',
      museum_button_label_ru: 'Как добраться',
      excursion_kicker_ru: 'С Михаилом Долóко',
      excursion_title_ru: 'Экскурсия как спектакль',
      excursion_description_ru:
        'Художественный руководитель Михаил Долóко не водит вдоль витрин и не читает справку. Он играет. Дети уходят с тем, что остаётся надолго: запах грима, секрет, смех, которого не ждали. Экскурсия платная. Смотреть маски по-прежнему можно просто так.',
      excursion_button_label_ru: 'Купить билет',
      excursion_photo_alt_ru: 'Экскурсия с Михаилом Долóко в музее масок Театр+',
      excursion_gallery_label_ru: 'Фотографии с экскурсии',
      previous_photo_label_ru: 'Предыдущая фотография',
      next_photo_label_ru: 'Следующая фотография',
      mask_image_alt_ru: '{name}. Маска {id} из первого музея масок в СНГ — Театр+.',
      meta_title_ru: 'Первый музей масок в СНГ — Театр+ Ташкент',
      meta_description_ru:
        'Первый музей театральных масок в СНГ — в Театр+ в Ташкенте: 90 масок, свободный вход в коллекцию и экскурсии с художественным руководителем Михаилом Долóко.',
      mask_meta_title_ru: '{name} — маска {id} — Театр+ Ташкент',
      mask_meta_description_ru:
        '{name} — маска {id} в первом музее масок СНГ, Театр+ в Ташкенте. Вход свободный. Экскурсии с Михаилом Долóко.',
      kicker_en: 'Tashkent',
      title_en: 'First mask museum in the CIS',
      lede_en:
        'The first museum of theatrical masks in the CIS — the post-Soviet countries — is here, inside Theater+ in Tashkent.',
      description_en:
        'Ninety masks. The house opened in November 2025, and already holds a collection no other theater in the region has put on a wall. Come and look. You do not need a ticket for that.',
      back_label_en: 'To the museum',
      serial_label_en: 'No. {id}',
      hall_title_en: 'Collection',
      museum_title_en: 'Come see all ninety',
      museum_description_en:
        'Seven of them are on this page. The rest wait in the house. Walk in whenever you like — looking is free. You pay only if you want the tour.',
      museum_button_label_en: 'Come to us',
      excursion_kicker_en: 'With Mikhail Doloko',
      excursion_title_en: 'A tour that is a performance',
      excursion_description_en:
        'Mikhail Doloko does not walk you down a corridor of facts. He plays. Children leave with an evening that stays with them — paint still on the air, a secret, a laugh they did not see coming. The excursion is a paid show. Seeing the masks is still free.',
      excursion_button_label_en: 'Buy a ticket',
      excursion_photo_alt_en: 'Excursion with Mikhail Doloko at the Theater+ mask museum',
      excursion_gallery_label_en: 'Photographs from the excursion',
      previous_photo_label_en: 'Previous photograph',
      next_photo_label_en: 'Next photograph',
      mask_image_alt_en: '{name}. Mask {id} from the first mask museum in the CIS at Theater+.',
      meta_title_en: 'First mask museum in the CIS — Theater+ Tashkent',
      meta_description_en:
        'The first mask museum in the CIS is at Theater+ in Tashkent: 90 theatrical masks, free entry to the collection, and excursions with artistic director Mikhail Doloko.',
      mask_meta_title_en: '{name} — mask {id} — Theater+ Tashkent',
      mask_meta_description_en:
        '{name} is mask {id} at the first mask museum in the CIS — Theater+, Tashkent. Free to visit. Tours with Mikhail Doloko.',
      kicker_uz: 'Toshkent',
      title_uz: 'MDHdagi birinchi niqoblar muzeyi',
      lede_uz: 'Mustaqil Davlatlar Hamdo‘stligidagi birinchi teatr niqoblari muzeyi shu yerda — Toshkentda, Teatr+da.',
      description_uz:
        'To‘qson niqob. Teatr 2025 yil noyabrida ochilgan va mintaqadagi hech bir teatr devorga osmagan kolleksiyani allaqachon to‘plagan. Kelib ko‘ring. Buning uchun chipta shart emas.',
      back_label_uz: 'Muzeyga',
      serial_label_uz: '№ {id}',
      hall_title_uz: 'Kolleksiya',
      museum_title_uz: 'Kelib ko‘ring — ular to‘qson ta',
      museum_description_uz:
        'Bu sahifada — yettita. Qolganlari teatrda kutadi. Kirib ko‘rish bepul: buning uchun ekskursiya shart emas. Faqat ekskursiyani xohlasangiz to‘laysiz.',
      museum_button_label_uz: 'Yo‘lni ko‘rish',
      excursion_kicker_uz: 'Mixail Doloko bilan',
      excursion_title_uz: 'Ekskursiya — spektakl kabi',
      excursion_description_uz:
        'Badiiy rahbar Mixail Doloko vitrina bo‘ylab yuritib, ma’lumot o‘qib bermaydi. U o‘ynaydi. Bolalar uzoq saqlanadigan oqshom bilan ketadi: grim hidi, sir, kutilmagan kulgi. Ekskursiya pullik. Niqoblarni baribir bepul ko‘rish mumkin.',
      excursion_button_label_uz: 'Chipta sotib olish',
      excursion_photo_alt_uz: 'Teatr+ niqoblar muzeyida Mixail Doloko bilan ekskursiya',
      excursion_gallery_label_uz: 'Ekskursiya fotosuratlari',
      previous_photo_label_uz: 'Oldingi fotosurat',
      next_photo_label_uz: 'Keyingi fotosurat',
      mask_image_alt_uz: '{name}. MDHdagi birinchi niqoblar muzeyi — Teatr+dagi {id} niqobi.',
      meta_title_uz: 'MDHdagi birinchi niqoblar muzeyi — Teatr+ Toshkent',
      meta_description_uz:
        'MDHdagi birinchi teatr niqoblari muzeyi Teatr+da, Toshkentda: 90 niqob, kolleksiyaga bepul kirish va badiiy rahbar Mixail Doloko bilan ekskursiyalar.',
      mask_meta_title_uz: '{name} — niqob {id} — Teatr+ Toshkent',
      mask_meta_description_uz:
        '{name} — MDHdagi birinchi niqoblar muzeyidagi {id} niqobi, Teatr+, Toshkent. Kirish bepul. Mixail Doloko bilan ekskursiyalar.',
    })
    record.set(
      'excursion_photos',
      [1, 2, 3, 4].map((n) => $filesystem.fileFromPath(assets + 'tour-' + n + '.jpg')),
    )
    app.save(record)
  },
  (app) => {
    // Keep editorial content and uploaded files on rollback. Lock access instead of deleting them.
    for (const name of ['t_mask', 't_page_masks']) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = null
      collection.viewRule = null
      collection.createRule = null
      collection.updateRule = null
      collection.deleteRule = null
      app.save(collection)
    }
  },
)
