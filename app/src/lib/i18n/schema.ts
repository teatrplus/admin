export type TranslationSchema = {
  common: {
    appName: string
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
    title: string
    email: string
    password: string
    submit: string
    invalid: string
  }
  nav: {
    sections: {
      space: string
      global: string
    }
    landing: string
    requests: string
    staff: string
    account: string
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
    venues: string
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
    validationGalleryFile: string
    validationFailed: string
    noChanges: string
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
  validation: {
    required: string
    email: string
    minLength: string
    passwordMatch: string
    url: string
  }
}
