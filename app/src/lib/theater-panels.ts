export type TheaterPanel = {
  key: string
  label: string
  description: string
  page: string
  path?: string
  entries?: { collection: string; label: string; addLabel?: string; singleton?: boolean; image?: string }
  shared?: boolean
}

export const theaterPanels: TheaterPanel[] = [
  {
    key: 'about',
    label: 'About the theater / О театре',
    page: 't_page_about',
    path: '/about/',
    description:
      'History, photographs, quote and discovery cards. / История, фотографии, цитата и карточки других страниц.',
  },
  {
    key: 'director',
    label: 'Artistic director / Художественный руководитель',
    page: 't_page_director',
    path: '/mikhail-doloko/',
    description:
      'Biography, portrait, awards, artistic approach and mask collection. / Биография, портрет, награды, творческий подход и коллекция масок.',
  },
  {
    key: 'repertoire',
    label: 'Repertoire / Репертуар',
    page: 't_page_repertoire',
    path: '/repertoire/',
    description:
      'Page introduction and every production: cast, dates, tickets and photographs. / Вступление страницы и каждый спектакль: состав, даты, билеты и фотографии.',
    entries: {
      collection: 't_play',
      label: 'Productions / Спектакли',
      addLabel: 'Add production / Добавить спектакль',
      image: 'thumbnail',
    },
  },
  {
    key: 'team',
    label: 'Theater team / Команда театра',
    page: 't_page_team',
    path: '/team/',
    description:
      'Team page and personal profiles, including biographies, credits and galleries. / Страница команды и личные страницы: биографии, роли и галереи.',
    entries: {
      collection: 't_staff',
      label: 'People / Сотрудники',
      addLabel: 'Add person / Добавить сотрудника',
      image: 'photo',
    },
  },
  {
    key: 'courses',
    label: 'Courses / Курсы',
    page: 't_page_courses',
    path: '/theater-school/',
    description:
      'Course listing and complete course pages, from teachers to enrolment. / Список курсов и полные страницы: от преподавателей до записи.',
    entries: {
      collection: 't_course',
      label: 'Courses / Курсы',
      addLabel: 'Add course / Добавить курс',
      image: 'cover',
    },
  },
  {
    key: 'festivals',
    label: 'Festivals / Фестивали',
    page: 't_page_festivals',
    path: '/festivals/',
    description:
      'Archive, empty state and each festival’s story, programme and visitor information. / Архив, страница ожидания и каждый фестиваль: история, программа и информация для гостей.',
    entries: {
      collection: 't_festival',
      label: 'Festivals / Фестивали',
      addLabel: 'Add festival / Добавить фестиваль',
      image: 'image',
    },
  },
  {
    key: 'news',
    label: 'News / Новости',
    page: 't_page_news',
    path: '/news/',
    description:
      'News page introduction and articles with their photographs. / Вступление страницы новостей и статьи с фотографиями.',
    entries: {
      collection: 't_blog_post',
      label: 'Articles / Статьи',
      addLabel: 'Add article / Добавить статью',
      image: 'cover',
    },
  },
  {
    key: 'sponsors',
    label: 'Sponsors / Спонсорам',
    page: 't_page_sponsors',
    path: '/sponsors/',
    description:
      'Partnership proposal, audience, formats, questions and partner logos. / Предложение о сотрудничестве, аудитория, форматы, вопросы и логотипы партнёров.',
    entries: {
      collection: 't_partner',
      label: 'Partners and logos / Партнёры и логотипы',
      addLabel: 'Add partner / Добавить партнёра',
      image: 'logo',
    },
  },
  {
    key: 'contacts',
    label: 'Contacts / Контакты',
    page: 't_page_contacts',
    path: '/contact/',
    description:
      'Contacts page, phones, address, maps and social accounts used across the website. / Страница контактов, телефоны, адрес, карты и соцсети на всём сайте.',
    entries: { collection: 't_contact', label: 'Contact details / Контактные данные', singleton: true },
  },
  {
    key: 'privacy',
    label: 'Privacy policy / Политика конфиденциальности',
    page: 't_page_privacy_policy',
    path: '/privacy-policy/',
    description: 'The full text of the privacy policy. / Полный текст политики конфиденциальности.',
  },
  {
    key: 'offer',
    label: 'Public offer / Публичная оферта',
    page: 't_page_public_offer',
    path: '/public-offer/',
    description: 'The full text of the public offer. / Полный текст публичной оферты.',
  },
  {
    key: 'visit-rules',
    label: 'Visit rules / Правила посещения',
    page: 't_page_theater_visit_rules',
    path: '/theater-visit-rules/',
    description:
      'Information visitors need before coming to the theater. / Правила, с которыми зрителям нужно ознакомиться перед посещением.',
  },
  {
    key: 'settings',
    label: 'General / Общее',
    page: 't_site_settings',
    shared: true,
    description:
      'Site identity, announcement bar, search defaults and footer. / Название сайта, объявление, общие настройки поиска и подвал.',
  },
]

// Old bookmarks still lead to the page where the content is used.
const supportingPages: Record<string, string> = {
  t_link_card: 'about',
  t_sponsor_touchpoint: 'sponsors',
  t_sponsor_format: 'sponsors',
  t_course_teacher: 'courses',
  t_course_section: 'courses',
  t_festival_session: 'festivals',
  t_contact_phone: 'contacts',
  t_role: 'team',
  t_staff_role: 'team',
  t_performance: 'repertoire',
  t_media_library: 'repertoire',
}
export const findTheaterPanel = (key: string) =>
  theaterPanels.find(
    (panel) =>
      panel.key === key ||
      panel.page === key ||
      panel.entries?.collection === key ||
      panel.key === supportingPages[key],
  )
