/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    if (app.countRecords('t_staff') > 0) {
      return
    }

    const people = [
      {
        id: 'a4268c42c7d9f2e',
        gender: 'male',
        role: 'production',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/antonov-artem-scaled.jpg',
        name_en: 'Antonov Artyom',
        name_ru: 'Антонов Артём',
        name_uz: 'Antonov Artyom',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Lighting designer',
        description_ru: 'Художник по свету',
        description_uz: 'Yoritish bo‘yicha rassom',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '9730b4b62a1e8af',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/06/baxodirov-behruzbek-scaled.jpg',
        name_en: 'Bakhodirov Bekhruzbek',
        name_ru: 'Баходиров Бехрузбек',
        name_uz: 'Bahodirov Behruzbek',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en:
          '“Toy Workshop” — Ball.\n“Colors” — Little Flame.\n“Grandfather Frost’s Chest” — Nekhochukha.\nAchievements:\nInternational Master of Sports in Sports Acrobatics.\nTwo-time Asian Champion.\nMultiple champion and medalist of international tournaments.',
        description_ru:
          '«Мастерская игрушек» — Мячик\n«Краски» — Огонёк\n«Сундук деда мороза» — Нехочуха\nМастер спорта международного класса по спортивной акробатике;\nДвукратный чемпион Азии;\nМногократный чемпион и призер международных турниров',
        description_uz:
          '“O‘yinchoqlar ustaxonasi” – To‘pcha.\n“Bo‘yoqlar” – Olovcha.\n“Qorbobo sandig‘i – Xohlamasvoy.\nXalqaro toifadagi sport ustasi (sport akrobatikasi).\nOsiyo chempioni (2 karra).\nXalqaro musobaqalar g‘olibi va ko‘p karrali sovrindori.',
        quote_en:
          'Only those who dare to take a step despite fear and doubt can reach great heights in sports. The same is true in life.',
        quote_ru: '',
        quote_uz:
          'Sportda faqat qo‘rquv va shubhalariga qaramay oldinga qadam tashlagan inson cho‘qqiga erishadi. Hayotda ham xuddi shunday.',
      },
      {
        id: '85133d818ac308e',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/06/bazarov_feruz-scaled.jpg',
        name_en: 'Bazarov Feruz',
        name_ru: 'Базаров Феруз',
        name_uz: 'Bazarov Feruz',
        education_en: 'Culture College.\nUzbek State Institute of Arts and Culture.\nDrama Theatre and Film Actor.',
        education_ru:
          'Колледж культуры.\nУзбекский государственный институт искусств и культуры. Актер драматического театра и кино.',
        education_uz:
          'Madaniyat kolleji.\nO‘zbekiston davlat san’at va madaniyat instituti. Drama teatri vakino aktyori.',
        description_en: '“Colors” — Pea.\n“Toy Workshop” — Dobrodelus.',
        description_ru: '«Краски» — Горох .\n«Мастерская игрушек» — Доброделус',
        description_uz: '“Bo‘yoqlar” – No‘xat.\n“O‘yinchoqlar ustaxonasi” – Dobrodelus.',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '8ba044e8cd0530a',
        gender: 'male',
        role: 'production',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/bekmansurov-danis-scaled.jpg',
        name_en: 'Bekmansurov Danis',
        name_ru: 'Бекмансуров Данис',
        name_uz: 'Bekmansurov Danis',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Head of production department',
        description_ru: 'Заведующий постановочной части',
        description_uz: 'Sahnalashtirish bo’limi mudiri',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '8897bb70e85baca',
        gender: 'female',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/bekmansurova-anna-scaled.jpg',
        name_en: 'Bekmansurova Anna',
        name_ru: 'Бекмансурова Анна',
        name_uz: 'Bekmansurova Anna',
        education_en: 'Labirus Theatre Studio',
        education_ru: 'Театральная студия «Лабирус»',
        education_uz: '“Labirus” teatr studiyasi.',
        description_en:
          '“Ded Moroz’s Chest” — New Year’s Ornament Pine Cone and Little Cook.\n“Colors” — Green Paint.\n“Toy Workshop ” — Doll Domisolka .',
        description_ru:
          '«Сундук Деда Мороза» — Новогодняя игрушка Шишечка и Поварëнок\n«Краски» — Зелёная краска\n«Мастерская игрушек» — кукла Домисолька',
        description_uz:
          '“Qorbobo sandig‘i” – Yangi yil o‘yinchog‘i Shishacha vaOshpazcha.\n“Bo‘yoqlar” – Yashil bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Domisolka qo‘g‘irchog‘i.',
        quote_en:
          '“Start by doing what is necessary. Then do what is possible. And suddenly you will find yourself doing the impossible.”',
        quote_ru:
          '«Начинайте делать то, что нужно. Затем делайте то, что возможно. И ы внезапно обнаружите, что делаете невозможное»',
        quote_uz:
          'Avval qilinishi kerak bo‘lgan ishni boshlang. Keyin imkoningiz yetganini qiling. Bir kun kelib esa, o‘zingizni imkonsizdek tuyulgan ishni bajarayotganingizni ko‘rasiz.',
      },
      {
        id: 'd23919f619e4d76',
        gender: 'female',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/greyt-sofiya-scaled.jpg',
        name_en: 'Greyt Sofia',
        name_ru: 'Грейт София',
        name_uz: 'Greyt Sofiya',
        education_en: 'Hamza Music School',
        education_ru: 'Музыкальная школа имени Хамзы',
        education_uz: 'Hamza nomidagi musiqa maktabi.',
        description_en: '“Ded Moroz’s Chest” — Snow Maiden.\n“Colors” — Blue Paint.\n“Toy Workshop” — Teddy Bear.',
        description_ru: '«Сундук деда Мороза» — Снегурочка\n«Краски» — Синяя краска\n«Мастерская игрушек» — Мишка',
        description_uz:
          '“Bo‘yoqlar” – Ko‘k bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Ayiqcha.\n“Qorbobo sandig‘i” – Qorqiz.',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '27e8246ffa0e66b',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/iskandar-sardor-scaled.jpg',
        name_en: 'Iskandar Sardor',
        name_ru: 'Искандар Сардор',
        name_uz: 'Iskandar Sardor',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: '“Ded Moroz’s Chest” — Cook\n“Colors” — Blue Paint',
        description_ru: '«Сундук Деда Мороза» — Повар\n«Краски» — Синяя краска',
        description_uz: '“Qorbobo sandig‘i” – Oshpaz.\n“Bo‘yoqlar” – Ko‘k bo‘yoq',
        quote_en: '“Happiness doesn’t wait.”',
        quote_ru: '«Счастье не терпит ожиданий»',
        quote_uz: 'Baxt kutishni yoqtirmaydi.',
      },
      {
        id: '9a80fa1ca1ba16a',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/ivanov-ilya-scaled.jpg',
        name_en: 'Ilya Ivanov',
        name_ru: 'Иванов Илья',
        name_uz: 'Ivanov Ilya',
        education_en: 'Mikhail Doloko’s Acting Course',
        education_ru: 'Курс Михаила Долоко по актерскому мастерству',
        education_uz: 'Mixail Dolokoning aktyorlik mahorati kursi.',
        description_en: '“Colors” — Little Flame, Shadow, Little Drop.\n“Toy Workshop” — Wooden Boy – Prince.',
        description_ru: '«Краски» — Огонек, Тень, Капелька\n«Мастерская Игрушек» — Деревянный Мальчик – Принц',
        description_uz: '“Bo‘yoqlar” – Olovcha, Soya, Tomchi. “O‘yinchoqlar ustaxonasi” – Yog‘och shahzoda.',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: 'd8f68c6e5cc2d6b',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/mukhammadov-ruzimukhammad-scaled.jpg',
        name_en: 'Mahamadov Ruzimuhammad',
        name_ru: 'Махамадов Рузимухаммад',
        name_uz: 'Mahamadov Ruzimuhammad',
        education_en: '',
        education_ru: 'Колледж Культуры\nГосударственный Институт искусств и культуры',
        education_uz: '',
        description_en: '“Grandfather Frost’s Chest” — Cook\n“Colors” — Blue Paint',
        description_ru: '«Сундук Деда мороза» — Али\n«Краски» — Кузнечик',
        description_uz:
          'Ta’lim:\nMadaniyat kolleji.\nO‘zbekiston davlat san’at va madaniyat instituti.\n“Qorbobo sandig‘i” – Ali.\n“Bo‘yoqlar” – Chigirtka.',
        quote_en: 'Happiness doesn’t wait',
        quote_ru: '«Жить так, чтобы добро, которое я оставил, пережило меня»',
        quote_uz: 'Shunday umr kechirki, ortingda qoldirgan ezguliging sendan keyin ham yashasin.',
      },
      {
        id: '7ab668887d4c4de',
        gender: 'male',
        role: 'administration',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/06/DOLOKO-scaled.jpg',
        name_en: 'Mikhail DolOko',
        name_ru: 'Михаил Долоко',
        name_uz: 'Mixail DolOko',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Artistic Director',
        description_ru: 'Художественный руководитель',
        description_uz: 'Badiiy rahbar',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '499cf6ffc12f75d',
        gender: 'female',
        role: 'administration',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/moshkova-olga-scaled.jpg',
        name_en: 'Moshkova Olga',
        name_ru: 'Мошкова Ольга',
        name_uz: 'Moshkova Olga',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Cashier',
        description_ru: 'Кассир',
        description_uz: 'Kassir',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '4de9fc20001ed0b',
        gender: 'female',
        role: 'actor',
        photo: '',
        name_en: 'Nartajiyeva Sayyodahon',
        name_ru: 'Нартаджиева Сайёдахон',
        name_uz: 'Nartajiyeva Sayyodahon',
        education_en: 'State Conservatory of Uzbekistan',
        education_ru: 'Государственная Консерватория Узбекистана',
        education_uz: 'O‘zbekiston davlat konservatoriyasi.',
        description_en: '“Paints” — Yellow Paint\n“Toy Workshop” — Matryoshka Doll (String), Song',
        description_ru: '«Краски» — Желтая краска\n«Мастерская игрушек» — Матрешки- струнка, песенка',
        description_uz: '“Bo‘yoqlar” – Sariq bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Matryoshkalar: Torcha va Qo‘shiqcha.',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: 'e1773687407f55a',
        gender: 'female',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/natalya-rubcova-scaled.jpg',
        name_en: 'Rubtsova Natalya',
        name_ru: 'Наталья Рубцова',
        name_uz: 'Rubtsova Natalya',
        education_en: 'Mikhail Doloko Acting Course',
        education_ru: 'Курс Актерского Мастерства Михаила Долоко.',
        education_uz: 'Mixail Dolokoning aktyorlik mahorati kursi.',
        description_en:
          '“Colours” — Black Paint\n“Toy Workshop” — String Doll\n“Ded Moroz’s Chest” — Christmas Tree\nOther projects:\nPerformer with Sugar Theatre (performative theatre)\nProjects: Sublimation, Regeneration, Square\nMember of the Poetry Slam community as a spoken word performer',
        description_ru:
          '«Краски» — Черная краска\n«Мастерская игрушек» — Кукла Струнка\n«Сундук Деда Мороза» — Ёлка\nДругие проекты:\nУчастница перформативного театра Sugar theatre\nПроекты: Sublimation, Regeneration, Квадрат\nУчастница поэтического сообщества Poetry Slam — чтец',
        description_uz:
          '“Bo‘yoqlar” – Qora bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Strunka qo‘g‘irchog‘i.\n“Qorbobo sandig‘i” – Archa.\nBoshqa loyihalari:\nУчастница перформативного театра Sugar theatre\nПроекты: Sublimation, Regeneration, Квадрат\nSugar Theatre performativ teatrining ishtirokchisi.\nLoyihalar: Sublimation, Regeneration, Kvadrat.\nPoetry Slam she’riyat hamjamiyati ishtirokchisi',
        quote_en: 'For me, the stage is the place where I can truly be myself.',
        quote_ru: 'Для меня сцена — это то место, где я могу быть максимально собой.',
        quote_uz: 'Men uchun sahna — o‘zligimni erkin namoyon qila oladigan maskan.',
      },
      {
        id: '22144e479f11bf9',
        gender: 'female',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/neskubo-viktoriya-scaled.jpg',
        name_en: 'Neskubo Viktoria',
        name_ru: 'Нескубо Виктория',
        name_uz: 'Neskubo Viktoriya',
        education_en:
          'Higher School of Olympic Reserve (RSDYuSShOR) in Rhythmic Gymnastics\nMaster of Sports in Rhythmic Gymnastics',
        education_ru:
          'Высшая школа олимпийского резерва (РСДЮСШОР) по художественной гимнастике.\nМастер спорта по художественной гимнастике.',
        education_uz:
          'Badiiy gimnastika bo‘yicha Olimpiya zaxiralari oliy maktabi(RIBO‘ZSM).\nBadiiy gimnastika bo‘yicha sport ustasi.',
        description_en: '“Colours”— Fiery Red Paint\n“Toy Workshop” — Rose',
        description_ru: '«Краски» — огненная Красная краска.\n«Мастерская игрушек» — Роза.',
        description_uz: '“Bo‘yoqlar” – Olovrang Qizil bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Atirgul.',
        quote_en: '“You don’t need to change your entire life; it’s enough to change your attitude toward it.”',
        quote_ru: '«Не нужно пытаться изменить всю свою жизнь, достаточно лишь изменить свое отношение к ней»',
        quote_uz:
          'Butun hayotingizni o‘zgartirishga urinmang. Hayotga bo‘lgan munosabatingizni o‘zgartirishning o‘zi kifoya.',
      },
      {
        id: '1998053eeda2fb3',
        gender: 'female',
        role: 'administration',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/nozdrina-yana-scaled.jpg',
        name_en: 'Nozdrina Yana',
        name_ru: 'Ноздрина Яна',
        name_uz: 'Nozdrina Yana',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Administrator',
        description_ru: 'Администратор',
        description_uz: 'Administrator',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '4d9da6ceac2966d',
        gender: 'male',
        role: 'production',
        photo: '',
        name_en: 'Pikalov Evgeny',
        name_ru: 'Пикалов Евгений',
        name_uz: 'Pikalov Yevgeniy',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Sound engineer',
        description_ru: 'Звукорежиссёр',
        description_uz: 'Ovoz rejissyori',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '003b8b99570890b',
        gender: 'female',
        role: 'actor',
        photo: '',
        name_en: 'Popova Yana',
        name_ru: 'Попова Яна',
        name_uz: 'Popova Yana',
        education_en:
          'Merzhanov College at the S. V. Rachmaninoff Tambov State Musical Pedagogical Institute, majoring in Choral Conducting (Tambov, Russia)\nG. R. Derzhavin Tambov State University, majoring in Theatre and Film Acting (Tambov, Russia)',
        education_ru:
          'Колледж В.К. Мержанова при ТГМПИ им. С.В. Рахманинова по специальности дирижер академическим хором (Россия, г. Тамбов).\nТГУ им. Г.Р. Державина по специальности «Актриса театра и кино» (Россия, г. Тамбов).',
        education_uz:
          'S. V. Raxmaninov nomidagi TВMPI huzuridagi V. K. Merjanovkolleji. Mutaxassisligi – akademik xor dirijyori (Tambov, Rossiya).\nG. R. Derjavin nomidagi TDU. Mutaxassisligi – teatr va kino aktrisasi (Tambov, Rossiya).',
        description_en:
          'Paints — Yellow Paint\nToy Workshop — Song Doll\nAwards:\nLaureate of All-Russian and International Choral Conducting Competitions (2017, 2018, 2019) — Moscow, Cheboksary\nLaureate of All-Russian Academic and Pop Vocal Competitions — Moscow',
        description_ru:
          '«Краски» — Жёлтая краска\n«Мастерская игрушек» — Кукла Песенка\nЛауреат всероссийских и международных конкурсов хоровых дирижеров (2017, 2018 и 2019 года) (Москва, Чебоксары)\nЛауреат всероссийских конкурсов по академическому и эстрадному вокалу. (Москва)',
        description_uz:
          '“Bo‘yoqlar” – Sariq bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Pesenka qo‘g‘irchog‘i.\nButunrossiya va xalqaro xor dirijyorlari tanlovlari laureati(2017, 2018 va 2019-yillar, Moskva va Cheboksari).\nAkademik va estrada vokali bo‘yicha Butunrossiya tanlovlarilaureati (Moskva).',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: 'a6d29d8949f092c',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/rustamaliyev-ogabek-scaled.jpg',
        name_en: 'Rustamaliyev Ogabek',
        name_ru: 'Рустамалиев Огабек',
        name_uz: 'Rustamaliyev Og‘abek',
        education_en: 'Institute of Arts and Culture',
        education_ru: 'Институт искусств и культуры',
        education_uz: 'San’at va madaniyat instituti.',
        description_en: '“Colours”— Painter\n“Toy Workshop” — Soldier',
        description_ru: '«Краски» — Художник\n«Мастерская игрушек» — Солдат',
        description_uz: '“Bo‘yoqlar” – Rassom.\n“O‘yinchoqlar ustaxonasi” – Askar',
        quote_en: '“Loyalty and sincerity are the foundation of human relationships.”',
        quote_ru: '«Верность и искренность — вот основа человеческих отношений»',
        quote_uz: 'Sadoqat va samimiyat — insoniy munosabatlarning eng mustahkam poydevoridir.',
      },
      {
        id: '33e441fa29d2aff',
        gender: 'female',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/sheyter-karolina-scaled.jpg',
        name_en: 'Sheyter Karolina',
        name_ru: 'Шэйтер Каролина',
        name_uz: 'Sheyter Karolina',
        education_en:
          'S. A. Gerasimov All-Russian State Institute of Cinematography (VGIK)\nWorkshop of Rustam Abdullaevich Sagdullaev',
        education_ru:
          'Всероссийский государственный институт кинематографии имени С.А.Герасимова — мастерская Сагдуллаева Рустама Абдуллаевича',
        education_uz:
          'S. A. Gerasimov nomidagi Butunrossiya davlat kinematografiyainstituti (BDKU), Rustam Abdullayevich Sagdullayevustaxonasi.',
        description_en:
          '“Colours” — Green Paint / Black Paint\n“Toy Workshop” — Teddy Bear\nGraduation performances:\nKing Lear by William Shakespeare — Regan\nBalzaminov’s Marriage by Alexander Ostrovsky — Matryona\nCount Nulin by Alexander Pushkin — Natalya Pavlovna',
        description_ru:
          '«Краски» — Зеленая/Черная краска\n«Мастерская игрушек» — Мишка\nДипломные спектакли:\n«Король Лир» — Шекспир -роль — Регана\n«Женитьба Бальзаминова» — Островский -роль — Матрена\n«Граф Нулин» — Наталья Павловна',
        description_uz:
          '“Bo‘yoqlar” – Yashil bo‘yoq / Qora bo‘yoq.\n“O‘yinchoqlar ustaxonasi” – Ayiqcha.\nDiplom spektakllari:\n“Qirol Lir” (Uilyam Shekspir) – Regana.\n“Balzaminovning uylanishi” (Aleksandr Ostrovskiy) – Matryona.\n“Graf Nulin” – Natalya Pavlovna.',
        quote_en:
          '“I cry out: I feel, I suffer, I am happy, I am excited. Only my own mystery interests me. Above all, I seek myself within my great emptiness.”',
        quote_ru:
          '«Я кричу: я чувствую, я страдаю, я счастлива, я взволнована. Только моя загадка интересует меня. Больше всего я ищу себя в своей великой пустоте»',
        quote_uz:
          'Va men hayqiraman: men his etaman, men azob chekaman, men baxtliman, men hayajondaman. Meni faqat o‘zimning sirim qiziqtiradi. Eng ko‘p esa buyuk bo‘shlig‘im ichida o‘zimni izlayman.',
      },
      {
        id: 'e946351f9238991',
        gender: 'female',
        role: 'production',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/shukurova-djamilya-scaled.jpg',
        name_en: 'Shukurova Jamilya',
        name_ru: 'Шукурова Джамиля',
        name_uz: 'Shukurova Jamilya',
        education_en: '',
        education_ru: '',
        education_uz: '',
        description_en: 'Wardrobe supervisor',
        description_ru: 'Костюмер',
        description_uz: 'Kostyumer',
        quote_en: '',
        quote_ru: '',
        quote_uz: '',
      },
      {
        id: '0e23f88702e8a8c',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/sismatov-sherzod-scaled.jpg',
        name_en: 'Sismatov Sherzod',
        name_ru: 'Сисматов Шерзод',
        name_uz: 'Sismatov Sherzod',
        education_en: 'Youth Theatre of Uzbekistan',
        education_ru: 'Молодёжный театр Узбекистана.',
        education_uz: 'O‘zbekiston Yoshlar teatri.',
        description_en:
          'Colors — Frog, Leaf, Sunbeam, Fish\nGrandfather Frost’s Chest — Right Ear\nToy Workshop — Kotofey Kotofeyich\nParticipated in the international 24RESTart festival as an actor.',
        description_ru:
          '«Краски» — Лягушка, Листик, Лучик, Рыбка.\n«Сундук деда мороза» — Правое ухо\n«Мастерская игрушек» — Котофей Котофеич\nУчаствовал в международном фестивале 24RESTart, в качестве актера',
        description_uz:
          '“Bo‘yoqlar” – Qurbaqa, Bargcha, Quyosh nuri va Baliqcha.\n“Qorbobo sandig‘i” – O‘ng quloq.\n“O‘yinchoqlar ustaxonasi” – Kotofey Kotofeyich.\n24RESTart xalqaro festivalida aktyor sifatida ishtirok etgan.',
        quote_en: 'Stay away from normality.',
        quote_ru: '«Держись подальше от нормальности»',
        quote_uz: 'Oddiylikdan yiroq bo‘l.',
      },
      {
        id: '155b07b2c16e40c',
        gender: 'male',
        role: 'actor',
        photo: 'https://teatrplus.uz/wp-content/uploads/2026/07/vasilev-igor-scaled.jpg',
        name_en: 'Vasilyev Igor',
        name_ru: 'Васильев Игорь',
        name_uz: 'Vasilyev Igor',
        education_en: 'Tambov State University named after G. R. Derzhavin',
        education_ru: 'ТГУ им. Г.Р. Державина.',
        education_uz: 'G. R. Derjavin nomidagi TDU',
        description_en:
          '“Colors” — Frog, Leaf, Sunbeam, Fish.\n“Toy Workshop” — Robot.\n“Ded Moroz’s Chest” — Left Ear.',
        description_ru:
          '«Краски» — Лягушка, Листочек, Лучик, Рыба\n«Мастерская игрушек» — Робот\n«Сундук Деда Мороза» — Левое Ухо',
        description_uz:
          '“Bo‘yoqlar” – Qurbaqa, Bargcha, Quyosh nuri va Baliq.\n“O‘yinchoqlar ustaxonasi” – Robot.\n“Qorbobo sandig‘i” – Chap quloq',
        quote_en:
          'To those who can hear me, I say: do not despair. We shall overcome this cruelty, the greed and hatred of those who stand in the way of human progress. Hatred will pass, dictators will die, and the power they took from the people will return to the people. And so long as men die, liberty will never perish…',
        quote_ru:
          'Тем, кто меня слышит, я говорю: «Не впадайте в отчаяние». Мы преодолеем эту жестокость, жадность и злость тех, кто препятствует человеческому прогрессу: ненависть пройдет, диктаторы умрут, а власть, которую они отобрали у людей, вернется к людям, и пока люди умирают, свобода никогда не умрет . . .',
        quote_uz:
          'Meni eshitayotganlarga shuni aytaman: “umidsizlikka tushmang”. Biz insoniyat taraqqiyotiga to‘sqinlik qilayotgan shafqatsizlik, ochko‘zlik va nafratni yengamiz. Nafrat yo‘qoladi, zolimlar ketadi, odamlardan tortib olingan hokimiyat yana odamlarga qaytadi. Insonlar o‘lar ekan, erkinlik abadiy yashaydi…',
      },
    ]

    for (const person of people) {
      const record = new Record(collection)
      record.set('id', person.id)
      record.set('gender', person.gender)
      record.set('role', person.role)
      record.set('name_en', person.name_en)
      record.set('name_ru', person.name_ru)
      record.set('name_uz', person.name_uz)
      record.set('education_en', person.education_en)
      record.set('education_ru', person.education_ru)
      record.set('education_uz', person.education_uz)
      record.set('description_en', person.description_en)
      record.set('description_ru', person.description_ru)
      record.set('description_uz', person.description_uz)
      record.set('quote_en', person.quote_en)
      record.set('quote_ru', person.quote_ru)
      record.set('quote_uz', person.quote_uz)

      // Network downloads in migrations can repeat after a transaction rollback.
      // Import media explicitly; opt in only for a deliberate initial seed.
      if (person.photo && $os.getenv('THEATER_SEED_REMOTE_PHOTOS') === '1') {
        try {
          record.set('photo', $filesystem.fileFromURL(person.photo, 60))
        } catch (err) {
          console.log('t_staff photo skipped', person.name_ru, person.photo, err)
        }
      }

      app.save(record)
    }
  },
  (app) => {
    const ids = [
      'a4268c42c7d9f2e',
      '9730b4b62a1e8af',
      '85133d818ac308e',
      '8ba044e8cd0530a',
      '8897bb70e85baca',
      'd23919f619e4d76',
      '27e8246ffa0e66b',
      '9a80fa1ca1ba16a',
      'd8f68c6e5cc2d6b',
      '7ab668887d4c4de',
      '499cf6ffc12f75d',
      '4de9fc20001ed0b',
      'e1773687407f55a',
      '22144e479f11bf9',
      '1998053eeda2fb3',
      '4d9da6ceac2966d',
      '003b8b99570890b',
      'a6d29d8949f092c',
      '33e441fa29d2aff',
      'e946351f9238991',
      '0e23f88702e8a8c',
      '155b07b2c16e40c',
    ]
    for (const id of ids) {
      try {
        const record = app.findRecordById('t_staff', id)
        app.delete(record)
      } catch (err) {}
    }
  },
)
