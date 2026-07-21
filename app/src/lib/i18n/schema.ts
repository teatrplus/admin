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
    saved: string
    error: string
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
    landing: string
    requests: string
    staff: string
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
    headerPhoneNumber: string
    telegramManagerUrl: string
    presentationUrl: string
    head: string
    body: string
    caption: string
    file: string
    contactManagers: string
    addRow: string
    removeRow: string
  }
  requests: {
    title: string
    clientName: string
    clientPhone: string
    dateRequested: string
    manager: string
    stage: string
    unassigned: string
    stages: Record<string, string>
  }
  staff: {
    title: string
    create: string
    list: string
    email: string
    password: string
    passwordConfirm: string
    name: string
    phoneNumber: string
    role: string
    scope: string
    roles: Record<string, string>
    scopes: Record<string, string>
    created: string
  }
  validation: {
    required: string
    email: string
    minLength: string
    passwordMatch: string
    url: string
  }
}
