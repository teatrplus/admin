export type TranslationSchema = {
  workspace: {
    label: string
    overview: string
    homeDescription: string
    masksDescription: string
    inquiriesDescription: string
    staffDescription: string
    accountDescription: string
    landingDescription: string
    requestsDescription: string
    socialDescription: string
    loginTitle: string
    loginBody: string
    loginCaption: string
    loginStory: string
    loginFooter: string
    profile: string
    security: string
    access: string
    securityHint: string
    shortcuts: string
    open: string
    museumContent: string
  }
  inquiries: {
    title: string
    name: string
    email: string
    phone: string
    message: string
    created: string
    status: string
    todo: string
    done: string
    all: string
    empty: string
    error: string
    saveError: string
    refresh: string
    previous: string
    next: string
    complete: string
    reopen: string
    loading: string
  }
  common: {
    brand: {
      beforePlus: string
      afterPlus: string
    }
    save: string
    cancel: string
    add: string
    remove: string
    loading: string
    logout: string
    forbiddenTitle: string
    forbiddenBody: string
    backHome: string
    language: string
    toggleTheme: string
    notifications: string
    saved: string
    error: string
  }
  home: {
    greeting: string
    body: string
  }
  scopes: {
    space: string
    theater: string
  }
  auth: {
    email: string
    password: string
    submit: string
    invalid: string
  }
  nav: {
    general: string
    content: string
    homepage: string
    masks: string
    inquiries: string
    sections: {
      space: string
      theater: string
      global: string
    }
    landing: string
    requests: string
    staff: string
    account: string
    social: string
    collapse: string
    expand: string
  }
  account: {
    title: string
    profile: string
    updated: string
    validationFailed: string
  }
  landing: {
    title: string
    general: string
    venue: string
    advantages: string
    process: string
    gallery: string
    partners: string
    contacts: string
    headerPhoneManager: string
    telegramManager: string
    presentationUrl: string
    head: string
    body: string
    caption: string
    contentLocale: string
    contentLocales: {
      ru: string
      en: string
      uz: string
    }
    file: string
    youtubeUrl: string
    youtubeUrlHint: string
    youtubeVideo: string
    addYoutubeRow: string
    dropHint: string
    replaceImage: string
    contactManagers: string
    none: string
    addRow: string
    removeRow: string
    deleteImage: string
    savedToast: string
    validationHeaderPhone: string
    validationMinItems: string
    validationItemLocales: string
    validationGalleryMedia: string
    validationGalleryBoth: string
    validationYoutubeUrl: string
    validationFailed: string
    noChanges: string
    missingPhoneToast: string
    missingTelegramToast: string
  }
  requests: {
    title: string
    clientName: string
    clientPhone: string
    dateRequested: string
    manager: string
    stage: string
    unassigned: string
    archive: string
    unarchive: string
    archived: string
    unarchived: string
    archivedSection: string
    actions: string
    archiveBlocked: string
    viewBoard: string
    viewTable: string
    empty: string
    emptyArchived: string
    pageOf: string
    prevPage: string
    nextPage: string
    dateUpdated: string
    stages: Record<string, string>
  }
  staff: {
    title: string
    create: string
    edit: string
    list: string
    email: string
    password: string
    passwordConfirm: string
    passwordOptional: string
    name: string
    phoneNumber: string
    telegramUsername: string
    role: string
    scope: string
    roles: Record<string, string>
    scopes: Record<string, string>
    created: string
    updated: string
    deleted: string
    deleteConfirm: string
    editUser: string
    deleteUser: string
    validationFailed: string
  }
  theater_social_panel: {
    title: string
    body: string
    refresh: string
    started: string
    running: string
    success: string
    successAt: string
    failed: string
    inProgress: string
  }
  validation: {
    required: string
    email: string
    minLength: string
    passwordMatch: string
    url: string
  }
}
