/// <reference path="../pb_data/types.d.ts" />
// Source captured from authenticated WordPress pages on 2026-09-07.
// Russian source and editorial decisions: docs/course-source-ru.json and docs/courses.md.
migrate(
  (app) => {
    const seed = {
      teachers: [
        {
          id: 'courseteacher01',
          staff: '0e23f88702e8a8c',
          name_ru: 'Шерзод Сисматов',
          name_en: 'Sherzod Sismatov',
          name_uz: 'Sherzod Sismatov',
          role_ru: 'Преподаватель актёрского мастерства',
          role_en: 'Acting teacher',
          role_uz: 'Aktyorlik mahorati o‘qituvchisi',
          bio_ru: 'Артист Театр+.',
          bio_en: 'Theater+ performer.',
          bio_uz: 'Teatr+ aktyori.',
        },
        {
          id: 'courseteacher02',
          name_ru: 'Данте Рустав',
          name_en: 'Dante Rustav',
          name_uz: 'Dante Rustav',
          role_ru: 'Куратор лаборатории анимации',
          role_en: 'Animation laboratory curator',
          role_uz: 'Animatsiya laboratoriyasi kuratori',
          bio_ru:
            'Участник продюсерского объединения WE ARE CENTRAL ASIA и Международного фестиваля анимационных фильмов TIAF.',
          bio_en:
            'Member of the WE ARE CENTRAL ASIA production collective and the TIAF International Animation Film Festival.',
          bio_uz:
            'WE ARE CENTRAL ASIA prodyuserlik birlashmasi va TIAF xalqaro animatsion filmlar festivali ishtirokchisi.',
        },
        {
          id: 'courseteacher03',
          name_ru: 'Михаил ДолОко',
          name_en: 'Mikhail Doloko',
          name_uz: 'Mixail Doloko',
          role_ru: 'Руководитель курса ораторского искусства',
          role_en: 'Public speaking course director',
          role_uz: 'Notiqlik kursi rahbari',
          bio_ru: 'Художественный руководитель Театр+.',
          bio_en: 'Artistic director of Theater+.',
          bio_uz: 'Teatr+ badiiy rahbari.',
        },
        {
          id: 'courseteacher04',
          name_ru: 'Ашот Даниэлян',
          name_en: 'Ashot Danielyan',
          name_uz: 'Ashot Danielyan',
          role_ru: 'Куратор школы поэзии',
          role_en: 'Poetry school curator',
          role_uz: 'She’riyat maktabi kuratori',
          bio_ru:
            'Лектор с международным опытом, который поможет освоить основы поэтического мастерства и научиться уверенно выражать свои мысли через творчество.',
          bio_en:
            'A lecturer with international experience who helps students learn the craft of poetry and express their thoughts confidently through creative work.',
          bio_uz:
            'Xalqaro tajribaga ega ma’ruzachi. She’riyat mahorati asoslarini o‘rganishga va ijod orqali fikrlarni ishonch bilan ifodalashga yordam beradi.',
        },
      ],
      courses: [
        {
          id: 'theatercourse01',
          slug: 'acting',
          published: true,
          sort_order: 10,
          enrollment_status: 'enquire',
          contact_phone: '+998712321552',
          teachers: ['courseteacher01'],
          source_url: 'https://teatrplus.uz/theater-school/kurs-aktyorskogo-masterstva/',
          enrollment_note_ru: 'Свяжитесь с нами, чтобы узнать актуальные даты набора и стоимость курса.',
          enrollment_note_en: 'Contact us for the next intake dates and course fees.',
          enrollment_note_uz: 'Qabul sanalari va kurs narxini bilish uchun biz bilan bog‘laning.',
          title_ru: 'Курс актёрского мастерства',
          title_en: 'Acting course',
          title_uz: 'Aktyorlik mahorati kursi',
          discipline_ru: 'Актёрское мастерство',
          discipline_en: 'Acting',
          discipline_uz: 'Aktyorlik mahorati',
          summary_ru:
            'Свободно говорить, проявлять себя и понимать свои эмоции. Живая импровизация в тёплой, поддерживающей атмосфере.',
          summary_en:
            'Speak freely, express yourself and understand your emotions through live improvisation in a supportive space.',
          summary_uz:
            'Erkin gapirish, o‘zingizni namoyon etish va his-tuyg‘ularni tushunish. Iliq muhitda jonli improvizatsiya.',
          audience_ru: 'Дети и подростки от 9 лет',
          audience_en: 'Children and teenagers aged 9+',
          audience_uz: '9 yoshdan bolalar va o‘smirlar',
          description_ru:
            'Если ваш ребёнок стесняется, боится выражать эмоции, не всегда может отстоять своё мнение или просто хочет раскрыть свой творческий потенциал — этот курс создан именно для него.\n\nЗдесь дети учатся свободно говорить, проявлять себя, понимать свои чувства и желания. Мы развиваем уверенность, внимание, воображение, эмоциональный интеллект — те навыки, которые помогают ребёнку чувствовать себя сильнее и спокойнее в школе, дома и среди сверстников.\n\nВ основе программы лежит классическая система актёрского мастерства, которую используют театральные школы по всему миру — от Москвы до Нью-Йорка. Главный инструмент — этюдный метод: без заученных текстов, без жёстких рамок. Только живая импровизация, в которой ребёнок учится быть собой, раскрепощается и избавляется от внутренних зажимов.',
          description_en:
            'For a child who feels shy, finds it difficult to express emotions or stand up for their opinion, or simply wants to explore their creativity.\n\nChildren learn to speak freely, express themselves and understand their feelings and wishes. We develop confidence, attention, imagination and emotional intelligence — skills that help at school, at home and with friends.\n\nThe programme draws on classical actor training used by theatre schools around the world. At its heart is the étude method: live improvisation without memorised scripts or rigid rules, giving children room to be themselves.',
          description_uz:
            'Farzandingiz tortinchoq bo‘lsa, hislarini ifodalash yoki o‘z fikrini himoya qilishga qiynalsa yoxud ijodiy qobiliyatini ochishni istasa, bu kurs unga mos.\n\nBolalar erkin gapirish, o‘zini namoyon etish, hislari va istaklarini tushunishni o‘rganadilar. Ishonch, diqqat, tasavvur va hissiy intellektni rivojlantiramiz — bu ko‘nikmalar maktabda, uyda va tengdoshlar orasida yordam beradi.\n\nDastur dunyo teatr maktablarida qo‘llanadigan klassik aktyorlik tizimiga asoslanadi. Asosiy usul — etyud: yodlangan matn va qat’iy cheklovlarsiz jonli improvizatsiya. Bola o‘zini erkin his qilishni o‘rganadi.',
          min_age: 9,
          session_minutes: 90,
          schedule_ru: 'Понедельник и четверг, 18:00–19:30',
          schedule_en: 'Monday and Thursday, 18:00–19:30',
          schedule_uz: 'Dushanba va payshanba, 18:00–19:30',
          location_ru: 'Театр+, Ташкент',
          location_en: 'Theater+, Tashkent',
          location_uz: 'Teatr+, Toshkent',
          sections: [
            {
              kind: 'outcomes',
              title_ru: 'Что получит ребёнок',
              title_en: 'What children gain',
              title_uz: 'Bola nimalarni o‘rganadi',
              body_ru: '',
              body_en: '',
              body_uz: '',
              items_ru:
                'Развивают уверенность в себе и своих возможностях\nУчатся красиво, чётко и выразительно говорить\nРазвивают внимание, память и концентрацию\nТренируют воображение и творческое мышление\nЛучше понимают свои эмоции и учатся управлять ими\nСтановятся более открытыми в общении\nПреодолевают страх публичных выступлений\nУчатся убеждать, вдохновлять и оказывать влияние на людей',
              items_en:
                'Confidence in themselves and their abilities\nClear, expressive speech\nAttention, memory and concentration\nImagination and creative thinking\nUnderstanding and managing emotions\nMore open communication\nPractice overcoming stage fright\nLearning to persuade and inspire',
              items_uz:
                'O‘ziga va imkoniyatlariga ishonch\nAniq, ravon va ifodali nutq\nDiqqat, xotira va e’tiborni jamlash\nTasavvur va ijodiy fikrlash\nHis-tuyg‘ularni tushunish va boshqarish\nMuloqotda ochiqlik\nOmma oldida chiqish qo‘rquvini yengish\nIshontirish va ilhomlantirish',
            },
            {
              kind: 'about',
              title_ru: 'Не только для сцены',
              title_en: 'Beyond the stage',
              title_uz: 'Sahnadan tashqarida ham',
              body_ru:
                'Актёрское мастерство развивает навыки, которые остаются с человеком на всю жизнь. Умение уверенно говорить, выступать перед людьми, работать в команде, слышать собеседника и управлять своими эмоциями помогает не только на сцене, но и в школе, в общении с друзьями и в будущем — в любой профессии.\n\nВо время занятий дети постепенно избавляются от внутренней скованности, начинают легче знакомиться с новыми людьми, увереннее выражают своё мнение и учатся спокойно воспринимать внимание окружающих.\n\nМы создаём условия, в которых каждый ребёнок чувствует себя принятым и может проявить себя без страха ошибиться.',
              body_en:
                'Speaking with confidence, performing in front of others, working as a team, listening and managing emotions are useful throughout life.\n\nChildren gradually become more comfortable meeting people, expressing opinions and being the centre of attention. We create an environment where every child feels accepted and can try things without fear of making a mistake.',
              body_uz:
                'Ishonch bilan gapirish, odamlar oldida chiqish, jamoada ishlash, tinglash va hislarni boshqarish hayot davomida kerak bo‘ladi.\n\nMashg‘ulotlarda bolalar yangi odamlar bilan tanishishga, o‘z fikrini aytishga va boshqalarning e’tiborini xotirjam qabul qilishga o‘rganadilar. Har bir bola o‘zini qabul qilingan his etishi va xato qilishdan qo‘rqmay sinab ko‘rishi uchun sharoit yaratamiz.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
            {
              kind: 'format',
              title_ru: 'Как проходят занятия',
              title_en: 'How classes work',
              title_uz: 'Mashg‘ulotlar qanday o‘tadi',
              body_ru:
                'Занятия проходят два раза в неделю по 1,5 часа, на территории «Театр+».\n\nАтмосфера — безопасная, тёплая и творческая: ребёнок чувствует поддержку, слышимость и уважение.',
              body_en:
                'Two 90-minute classes each week at Theater+.\n\nA warm, creative and supportive atmosphere where children feel heard and respected.',
              body_uz:
                'Teatr+ hududida haftasiga ikki marta, 90 daqiqadan mashg‘ulot.\n\nBola qo‘llab-quvvatlash, e’tibor va hurmatni his qiladigan iliq va ijodiy muhit.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
          ],
        },
        {
          id: 'theatercourse02',
          slug: 'animation-laboratory',
          published: true,
          sort_order: 20,
          enrollment_status: 'enquire',
          contact_phone: '+998712321552',
          teachers: ['courseteacher02'],
          source_url: 'https://teatrplus.uz/theater-school/laboratoriya-taktilnoj-animaczii-i-media-arta/',
          enrollment_note_ru: 'Свяжитесь с нами, чтобы узнать актуальные даты набора и стоимость курса.',
          enrollment_note_en: 'Contact us for the next intake dates and course fees.',
          enrollment_note_uz: 'Qabul sanalari va kurs narxini bilish uchun biz bilan bog‘laning.',
          title_ru: 'Лаборатория тактильной анимации и медиа-арта',
          title_en: 'Tactile animation & media art laboratory',
          title_uz: 'Taktil animatsiya va media-art laboratoriyasi',
          discipline_ru: 'Анимация и медиа-арт',
          discipline_en: 'Animation & media art',
          discipline_uz: 'Animatsiya va media-art',
          summary_ru: 'Бумага — декорация. Предметы — актёры. Создайте собственный фильм: от первой идеи до премьеры.',
          summary_en:
            'Paper becomes scenery. Objects become actors. Make a film of your own, from the first idea to the premiere.',
          summary_uz:
            'Qog‘oz — dekoratsiya. Buyumlar — aktyorlar. Ilk g‘oyadan premyeragacha o‘z filmingizni yarating.',
          audience_ru: 'Дети 9–12 лет и подростки 12–16 лет',
          audience_en: 'Children 9–12 and teenagers 12–16',
          audience_uz: '9–12 yoshli bolalar va 12–16 yoshli o‘smirlar',
          description_ru:
            'В основе нашего курса — идея объединить театр и анимацию.\n\nВ театре главное — живое присутствие, эмоции и момент, который происходит здесь и сейчас. В анимации мы сохраняем этот принцип через ручную работу, реальные материалы и внимание к каждой детали. Мы ценим естественную фактуру, следы рук автора и настоящие объекты, создавая анимацию, которая отличается от безупречной, но безликой цифровой картинки.\n\nМы учим смотреть на каждый кадр как на театральную сцену. Бумага становится декорацией, куклы и предметы — актерами, а руки аниматора помогают оживить историю и передать характер персонажей.',
          description_en:
            'The laboratory brings theatre and animation together. Theatre is about live presence, emotion and the here and now. We carry that into animation through handwork, real materials and attention to detail. Natural textures and the maker’s touch give each film its own character.\n\nWe treat every frame as a theatre stage. Paper becomes scenery; puppets and objects become actors. The animator’s hands bring a story to life and reveal its characters.',
          description_uz:
            'Laboratoriya teatr va animatsiyani birlashtiradi. Teatrda jonli ishtirok, his-tuyg‘ular va ayni damdagi voqea muhim. Animatsiyada bu tamoyilni qo‘l mehnati, haqiqiy materiallar va har bir detalga e’tibor orqali saqlaymiz. Tabiiy faktura va muallif qo‘lining izi filmga o‘ziga xoslik beradi.\n\nHar bir kadrga teatr sahnasi kabi qaraymiz. Qog‘oz dekoratsiyaga, qo‘g‘irchoq va buyumlar aktyorlarga aylanadi. Animatorning qo‘llari voqeani jonlantirib, qahramonlar xarakterini ochadi.',
          min_age: 9,
          max_age: 16,
          session_count: 16,
          session_minutes: 120,
          duration_ru: '16 практических занятий',
          duration_en: '16 practical classes',
          duration_uz: '16 ta amaliy mashg‘ulot',
          schedule_ru: '8 занятий в месяц по 2 часа',
          schedule_en: '8 classes per month, 2 hours each',
          schedule_uz: 'Oyiga 8 ta mashg‘ulot, har biri 2 soat',
          sections: [
            {
              kind: 'program',
              title_ru: 'От идеи до премьеры',
              title_en: 'From idea to premiere',
              title_uz: 'G‘oyadan premyeragacha',
              body_ru: '',
              body_en: '',
              body_uz: '',
              items_ru:
                'Изучение ключевых законов движения и освоение нескольких классических ручных техник анимации\nУмение работать в условиях художественных ограничений, соединять разрозненные смысловые части в единый сквозной сюжет\nЭкспериментальная работа с бумагой и текстурами, включая тонировку естественными эко-материалами: кофе и чаем\nЗапись звуков — фоли-эффектов — и создание оригинального аудиоряда\nМонтаж, цветокоррекция и финальная сборка всех элементов в готовый фильм\nРазвитие навыков общения и совместная работа над междисциплинарным проектом',
              items_en:
                'Explore the laws of movement and classical handmade animation techniques\nWork within artistic constraints and connect separate ideas into one story\nExperiment with paper and textures, including natural staining with coffee and tea\nRecord Foley effects and create an original soundtrack\nEdit, colour-grade and assemble the finished film\nBuild communication and collaboration skills on a shared interdisciplinary project',
              items_uz:
                'Harakat qonunlari va klassik qo‘lda animatsiya texnikalarini o‘rganish\nBadiiy cheklovlar doirasida ishlash va alohida g‘oyalarni yaxlit syujetga birlashtirish\nQog‘oz va fakturalar, jumladan qahva va choy bilan tabiiy bo‘yash tajribalari\nFoli tovush effektlarini yozish va original ovoz qatorini yaratish\nMontaj, ranglarni tuzatish va tayyor filmni yig‘ish\nUmumiy fanlararo loyihada muloqot va jamoaviy ish ko‘nikmalarini rivojlantirish',
            },
            {
              kind: 'format',
              title_ru: 'Практический интенсив',
              title_en: 'A practical intensive',
              title_uz: 'Amaliy intensiv',
              body_ru:
                'Интенсив рассчитан на 16 практических занятий: 8 занятий в месяц по 2 часа. Программа представляет собой полный цикл кинопроизводства — от идеи до премьеры.',
              body_en:
                '16 practical classes, with eight two-hour sessions each month. The programme follows the complete filmmaking process, from an idea to its premiere.',
              body_uz:
                '16 ta amaliy mashg‘ulot: oyiga 8 marta, 2 soatdan. Dastur kino yaratishning to‘liq jarayonini — g‘oyadan premyeragacha — qamrab oladi.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
          ],
        },
        {
          id: 'theatercourse03',
          slug: 'speak-with-confidence',
          published: true,
          sort_order: 30,
          enrollment_status: 'waitlist',
          contact_phone: '+998712321552',
          teachers: ['courseteacher03'],
          source_url: 'https://teatrplus.uz/theater-school/oratorskoe-iskusstvo-govoryu-uverenno/',
          enrollment_note_ru:
            'Набор временно закрыт. Свяжитесь с нами, чтобы узнать о следующей группе и листе ожидания.',
          enrollment_note_en: 'Enrollment is temporarily closed. Contact us about the next group and the waiting list.',
          enrollment_note_uz: 'Qabul vaqtincha yopiq. Keyingi guruh va kutish ro‘yxati haqida biz bilan bog‘laning.',
          title_ru: 'Ораторское искусство. Говорю уверенно',
          title_en: 'Public speaking. Speak with confidence',
          title_uz: 'Notiqlik san’ati. Ishonch bilan gapiraman',
          discipline_ru: 'Речь и коммуникация',
          discipline_en: 'Speech & communication',
          discipline_uz: 'Nutq va muloqot',
          summary_ru:
            'Ясно выражать мысли, удерживать внимание и находить слова без подготовки. Практика для бизнеса и повседневного общения.',
          summary_en:
            'Express ideas clearly, hold an audience’s attention and find your words without a script. Practice for business and everyday life.',
          summary_uz:
            'Fikrni aniq ifodalash, tinglovchi e’tiborini ushlash va tayyorgarliksiz so‘z topish. Biznes va kundalik muloqot uchun amaliyot.',
          audience_ru: 'Предприниматели, руководители, эксперты и специалисты',
          audience_en: 'Entrepreneurs, managers, experts and professionals',
          audience_uz: 'Tadbirkorlar, rahbarlar, ekspertlar va mutaxassislar',
          description_ru:
            '«Ораторское искусство. Говорю уверенно» — это не просто курс по публичным выступлениям. Это комплексная система развития речи, коммуникации и навыков влияния, которая помогает уверенно выражать свои мысли, убеждать, вести переговоры и эффективно взаимодействовать с людьми в любой ситуации.\n\nКурс создан для тех, кто хочет говорить ясно, уверенно и убедительно, независимо от того, выступает ли он перед большой аудиторией, проводит переговоры, управляет командой или ежедневно общается с клиентами и партнерами.\n\nВо время обучения вы научитесь грамотно строить речь, управлять голосом и дыханием, избавитесь от страха публичных выступлений, разовьете уверенность в себе, освоите техники импровизации и аргументации, научитесь удерживать внимание аудитории и доносить свои идеи так, чтобы вас понимали и слышали.',
          description_en:
            'A comprehensive course in speech, communication and persuasion: express your thoughts, negotiate and connect with people confidently.\n\nFor anyone who wants to speak clearly and persuasively, whether presenting to a large audience, leading a team or talking with clients and partners.\n\nYou will practise structuring a speech, working with voice and breath, handling stage fright, improvising, building arguments and holding attention so your ideas are heard and understood.',
          description_uz:
            'Nutq, muloqot va ishontirish ko‘nikmalarini rivojlantiruvchi kurs: fikrlarni ishonch bilan ifodalash, muzokara olib borish va odamlar bilan samarali aloqa o‘rnatish.\n\nKatta auditoriya oldida chiqish, jamoani boshqarish yoki mijoz va hamkorlar bilan suhbatda aniq va ishonarli gapirishni istaganlar uchun.\n\nNutqni tuzish, ovoz va nafas bilan ishlash, sahna hayajonini yengish, improvizatsiya, dalillash va auditoriya e’tiborini ushlashni mashq qilasiz.',
          sections: [
            {
              kind: 'audience',
              title_ru: 'Для кого этот курс',
              title_en: 'Who it is for',
              title_uz: 'Kurs kimlar uchun',
              body_ru: '',
              body_en: '',
              body_uz: '',
              items_ru:
                'Предпринимателям\nРуководителям\nЭкспертам и специалистам\nВсем, кто работает с людьми и стремится к профессиональному и личностному росту',
              items_en:
                'Entrepreneurs\nManagers and team leaders\nExperts and specialists\nAnyone working with people and seeking professional and personal growth',
              items_uz:
                'Tadbirkorlar\nRahbarlar\nEkspertlar va mutaxassislar\nOdamlar bilan ishlaydigan, kasbiy va shaxsiy rivojlanishga intilganlar',
            },
            {
              kind: 'outcomes',
              title_ru: 'Что вы получите',
              title_en: 'What you will gain',
              title_uz: 'Nimalarni o‘rganasiz',
              body_ru: '',
              body_en: '',
              body_uz: '',
              items_ru:
                'Говорить уверенно и без лишнего волнения\nЧётко формулировать и структурировать свои мысли\nУправлять голосом, речью и языком тела\nУверенно выступать перед любой аудиторией\nБыстро ориентироваться в неожиданных ситуациях\nГрамотно аргументировать свою позицию\nЭффективно вести переговоры\nУбеждать, вдохновлять и оказывать влияние на людей',
              items_en:
                'Speak confidently with less anxiety\nExpress and structure thoughts clearly\nWork with voice, speech and body language\nPresent confidently to an audience\nRespond to unexpected situations\nBuild a convincing argument\nNegotiate effectively\nPersuade and inspire',
              items_uz:
                'Ortiqcha hayajonsiz, ishonch bilan gapirish\nFikrlarni aniq ifodalash va tartiblash\nOvoz, nutq va tana tilini boshqarish\nAuditoriya oldida ishonch bilan chiqish\nKutilmagan vaziyatda tez yo‘l topish\nO‘z nuqtayi nazarini asoslash\nSamarali muzokara olib borish\nIshontirish va ilhomlantirish',
            },
            {
              kind: 'program',
              title_ru: 'Основа коммуникации',
              title_en: 'Communication foundations',
              title_uz: 'Muloqot asoslari',
              body_ru:
                'Фундамент эффективной речи начинается с правильной базы. В этом блоке вы освоите постановку речи, научитесь работать с дыханием и голосом, улучшите дикцию и научитесь логично выстраивать свои мысли, чтобы говорить понятно, последовательно и уверенно.\n\n\n\nИзучаемые темы:\nпостановка речи;\nдыхание и голос;\nразвитие дикции;\nструктура и логика мысли.',
              body_en:
                'Develop speech, breath, voice and diction. Learn to organise thoughts logically and speak clearly and consistently.',
              body_uz:
                'Nutq, nafas, ovoz va diksiyani rivojlantirish. Fikrlarni mantiqan tuzish, aniq va izchil gapirish.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
            {
              kind: 'program',
              title_ru: 'Уверенность и публичные выступления',
              title_en: 'Confidence & public speaking',
              title_uz: 'Ishonch va omma oldida chiqish',
              body_ru:
                'Этот блок посвящен развитию внутренней уверенности и навыков выступления перед аудиторией. Вы научитесь справляться со страхом сцены и волнением, использовать язык тела как инструмент влияния и устанавливать контакт с аудиторией.\n\n\n\nПрактические упражнения:\n«Одна мысль — одна минута»;\n«Говори без пауз»;\n«Объясни сложное простым языком»;\nвыход на сцену;\nимпровизированные выступления;\nудержание внимания аудитории.',
              body_en:
                'Work with stage fright, body language and audience connection. Exercises include “One thought, one minute”, speaking without pauses, explaining complex ideas simply, stage practice, improvised speeches and holding attention.',
              body_uz:
                'Sahna qo‘rquvi, tana tili va auditoriya bilan aloqa ustida ishlash. Mashqlar: “Bir fikr — bir daqiqa”, pauzasiz gapirish, murakkab fikrni sodda tushuntirish, sahnaga chiqish, improvizatsion nutq va e’tiborni ushlash.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
            {
              kind: 'program',
              title_ru: 'Импровизация и логика речи (ключевой блок)',
              title_en: 'Improvisation & clear thinking',
              title_uz: 'Improvizatsiya va nutq mantiqi',
              body_ru:
                'Главная особенность курса — развитие способности быстро мыслить и уверенно говорить без подготовки. Именно здесь формируются навыки, которые помогают чувствовать себя уверенно в переговорах, интервью, деловых встречах и любых непредвиденных ситуациях.\n\n\n\nВ программе:\nдебаты;\nупражнение «Адвокаты и прокуроры»;\nзащита собственной позиции;\n«Продай идею за одну минуту»;\nимпровизация без подготовки;\nкомандные упражнения «Собери команду»\n\nПрактика направлена на развитие:\nскорости мышления;\nчеткости речи;\nгибкости мышления;\nуверенности в любой коммуникации.',
              body_en:
                'Think quickly and speak without preparation in negotiations, interviews and unexpected situations. Practise debates, “Advocates and prosecutors”, defending a position, “Sell an idea in one minute”, impromptu speaking and “Build a team”. Develop speed, clarity, flexible thinking and confidence.',
              body_uz:
                'Muzokara, suhbat va kutilmagan vaziyatlarda tez fikrlash va tayyorgarliksiz gapirish. Debatlar, “Advokatlar va prokurorlar”, o‘z fikrini himoya qilish, “G‘oyani bir daqiqada sot”, improvizatsiya va “Jamoa tuz” mashqlari. Fikrlash tezligi, nutq aniqligi, moslashuvchanlik va ishonchni rivojlantirish.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
            {
              kind: 'program',
              title_ru: 'Переговоры и влияние',
              title_en: 'Negotiation & persuasion',
              title_uz: 'Muzokara va ishontirish',
              body_ru:
                'Заключительный блок посвящен искусству убеждения и ведения переговоров. Вы освоите методы аргументации, научитесь управлять диалогом, работать с возражениями и сохранять сильную позицию даже в сложных переговорах.\n\n\n\nПрактика включает:\nпереговорные сценарии;\nразбор конфликтных ситуаций;\nработу в условиях давления;\nтехники защиты своей позиции.',
              body_en:
                'Learn argumentation, guide a conversation, work with objections and hold your position in difficult negotiations. Practise negotiation scenarios, conflict analysis, working under pressure and defending your position.',
              body_uz:
                'Dalillash, suhbatni boshqarish, e’tirozlar bilan ishlash va murakkab muzokarada o‘z pozitsiyasini saqlash. Muzokara ssenariylari, nizoli vaziyatlar tahlili, bosim ostida ishlash va o‘z pozitsiyasini himoya qilish mashqlari.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
            {
              kind: 'format',
              title_ru: 'Формат обучения',
              title_en: 'Learning format',
              title_uz: 'Ta’lim shakli',
              body_ru:
                'Курс построен на сочетании теории и большого количества практики. Каждое занятие включает упражнения, выступления, разборы и обратную связь, благодаря чему новые навыки сразу закрепляются в реальных ситуациях общения. «Ораторское искусство. Говорю уверенно» — это инвестиция в навык, который влияет на карьеру, бизнес и личную жизнь. Умение говорить уверенно, убеждать и вдохновлять открывает новые возможности, помогает добиваться целей и производить сильное впечатление в любой коммуникации.',
              body_en:
                'Theory with plenty of practice: exercises, presentations, analysis and feedback in every class help you apply new skills to real conversations.\n\nConfident speech and the ability to persuade and inspire support your career, business and personal life.',
              body_uz:
                'Nazariya va ko‘p amaliyot: har bir mashg‘ulotdagi mashqlar, chiqishlar, tahlil va fikr-mulohaza yangi ko‘nikmalarni haqiqiy muloqotda qo‘llashga yordam beradi.\n\nIshonchli nutq, ishontirish va ilhomlantirish qobiliyati kasb, biznes va shaxsiy hayotda yangi imkoniyatlar ochadi.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
          ],
        },
        {
          id: 'theatercourse04',
          slug: 'poetry-school',
          published: true,
          sort_order: 40,
          enrollment_status: 'enquire',
          contact_phone: '+998712321552',
          teachers: ['courseteacher04'],
          source_url: 'https://teatrplus.uz/theater-school/shkola-poezii-2/',
          enrollment_note_ru: 'Свяжитесь с нами, чтобы узнать актуальные даты набора и стоимость курса.',
          enrollment_note_en: 'Contact us for the next intake dates and course fees.',
          enrollment_note_uz: 'Qabul sanalari va kurs narxini bilish uchun biz bilan bog‘laning.',
          title_ru: 'Школа поэзии',
          title_en: 'Poetry school',
          title_uz: 'She’riyat maktabi',
          discipline_ru: 'Поэзия',
          discipline_en: 'Poetry',
          discipline_uz: 'She’riyat',
          summary_ru:
            'Найдите собственный голос. От первых строк до выразительного чтения перед слушателями — с поддержкой и обратной связью.',
          summary_en:
            'Find your own voice. From your first lines to reading aloud, with encouragement and thoughtful feedback.',
          summary_uz:
            'O‘z ovozingizni toping. Ilk satrlardan tinglovchi oldida ifodali o‘qishgacha — ko‘mak va fikr-mulohaza bilan.',
          audience_ru: 'Для тех, кто пишет стихи или только хочет начать',
          audience_en: 'For those who write poetry or want to begin',
          audience_uz: 'She’r yozadigan yoki boshlashni istaganlar uchun',
          description_ru:
            'Поэзия — это гораздо больше, чем рифмы и красивые строки. Это способ услышать себя, разобраться в своих чувствах и превратить эмоции в искусство.\n\nКурс поэзии — это пространство для творчества, самовыражения и личного роста.',
          description_en:
            'Poetry is more than rhyme and beautiful lines. It is a way to listen to yourself, understand your feelings and turn emotion into art.\n\nThe course offers space for creativity, self-expression and personal growth.',
          description_uz:
            'She’riyat qofiya va chiroyli satrlardan ko‘proq narsadir. U o‘zingizni tinglash, hislarni tushunish va tuyg‘ularni san’atga aylantirish usuli.\n\nKurs ijod, o‘zini ifodalash va shaxsiy o‘sish uchun makon.',
          duration_ru: '1 месяц практических занятий',
          duration_en: '1 month of practical classes',
          duration_uz: '1 oylik amaliy mashg‘ulotlar',
          sections: [
            {
              kind: 'outcomes',
              title_ru: 'На курсе вы',
              title_en: 'On the course, you will',
              title_uz: 'Kurs davomida siz',
              body_ru: '',
              body_en: '',
              body_uz: '',
              items_ru:
                'Научитесь писать яркие и выразительные стихи\nРазовьёте творческое мышление и воображение\nРазберёте приёмы Шекспира, Есенина, Бродского и других великих поэтов и узнаете, как применять их в собственном творчестве\nНаучитесь уверенно выступать перед публикой, выразительно читать свои стихи и удерживать внимание слушателей\nСтанете увереннее, научившись ясно и смело выражать мысли и чувства\nПолучите поддержку, вдохновение и обратную связь',
              items_en:
                'Learn to write vivid, expressive poetry\nDevelop imagination and creative thinking\nExplore the techniques of Shakespeare, Yesenin, Brodsky and other great poets, and apply them to your own work\nPractise performing, reading your poems expressively and holding listeners’ attention\nBuild confidence in expressing thoughts and feelings clearly\nReceive support, inspiration and feedback',
              items_uz:
                'Yorqin va ifodali she’rlar yozishni o‘rganasiz\nIjodiy fikrlash va tasavvurni rivojlantirasiz\nShekspir, Yesenin, Brodskiy va boshqa buyuk shoirlar usullarini tahlil qilib, o‘z ijodingizda qo‘llaysiz\nOmma oldida chiqish, she’rlarni ifodali o‘qish va tinglovchi e’tiborini ushlashni mashq qilasiz\nFikr va hislarni aniq, dadil ifodalashga ishonch orttirasiz\nKo‘mak, ilhom va fikr-mulohaza olasiz',
            },
            {
              kind: 'about',
              title_ru: 'Услышать себя',
              title_en: 'Listen to yourself',
              title_uz: 'O‘zingizni tinglang',
              body_ru:
                'Поэзия помогает проживать эмоции, лучше понимать себя, снимать внутреннее напряжение и находить новые смыслы.\n\nНеважно, писали ли вы раньше или только мечтаете начать. Главное — желание творить.\n\nПрикоснитесь к секретам великих поэтов, найдите собственный голос и откройте в себе автора, которого будут читать, слушать и запоминать.',
              body_en:
                'Poetry offers a way to explore emotions, understand yourself, release tension and find new meaning.\n\nYou may have written before or only dreamed of starting. What matters is the desire to create.\n\nExplore the craft of great poets, find your voice and discover the author within you.',
              body_uz:
                'She’riyat hislarni anglash, o‘zini yaxshiroq tushunish, ichki taranglikni kamaytirish va yangi ma’no topishga yordam beradi.\n\nAvval yozganmisiz yoki endi boshlamoqchimisiz — muhimi, ijod qilish istagi.\n\nBuyuk shoirlar mahoratini o‘rganing, o‘z ovozingizni toping va ichingizdagi muallifni kashf eting.',
              items_ru: '',
              items_en: '',
              items_uz: '',
            },
          ],
        },
      ],
    }
    const saveNew = (name, data) => {
      if (app.findRecordsByFilter(name, 'id = {:id}', '', 1, 0, { id: data.id }).length) return
      const record = new Record(app.findCollectionByNameOrId(name))
      for (const key of Object.keys(data)) record.set(key, data[key])
      app.save(record)
    }
    for (const teacher of seed.teachers) saveNew('t_course_teacher', teacher)
    for (const item of seed.courses) {
      const { sections, ...course } = item
      saveNew('t_course', course)
      sections.forEach((section, index) =>
        saveNew('t_course_section', {
          ...section,
          id: `cs${course.sort_order}${String(index + 1).padStart(11, '0')}`,
          course: course.id,
          sort_order: (index + 1) * 10,
        }),
      )
    }
  },
  () => {
    // Keep imported content and subsequent editorial changes.
  },
)
