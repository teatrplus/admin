import * as v from 'valibot'
import type { BaseSchema, BaseIssue, BaseValidation, InferOutput } from 'valibot'

export type FieldErrors = Record<string, string>

export const mapValibotIssues = (issues: [BaseIssue<unknown>, ...BaseIssue<unknown>[]]): FieldErrors => {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const key = issue.path?.map((part) => String(part.key)).join('.') || '_form'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }
  return errors
}

export const validateSchema = <TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
  schema: TSchema,
  input: unknown,
): { success: true; output: InferOutput<TSchema> } | { success: false; errors: FieldErrors } => {
  const result = v.safeParse(schema, input)
  if (result.success) {
    return { success: true, output: result.output }
  }
  return { success: false, errors: mapValibotIssues(result.issues) }
}

export const formDataToObject = (formData: FormData): Record<string, unknown> => {
  const output: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (value.size === 0 && !value.name) continue
      const current = output[key]
      if (current === undefined) {
        output[key] = value
      } else if (Array.isArray(current)) {
        current.push(value)
      } else {
        output[key] = [current, value]
      }
      continue
    }

    const current = output[key]
    if (current === undefined) {
      output[key] = value
    } else if (Array.isArray(current)) {
      current.push(value)
    } else {
      output[key] = [current, value]
    }
  }

  return output
}

export const objectToFormData = (input: Record<string, unknown>): FormData => {
  const formData = new FormData()

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) {
          formData.append(key, item)
        } else if (item !== undefined && item !== null) {
          formData.append(key, String(item))
        }
      }
      continue
    }

    if (value instanceof File) {
      formData.set(key, value)
    } else {
      formData.set(key, String(value))
    }
  }

  return formData
}

export type FormState<T extends Record<string, unknown>> = {
  values: T
  errors: FieldErrors
  touched: Record<string, boolean>
  set: <K extends keyof T>(key: K, value: T[K]) => void
  touch: (key: keyof T) => void
  reset: (next?: Partial<T>) => void
  toFormData: () => FormData
  validate: (
    schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  ) => { success: true } | { success: false }
}

export const createFormState = <T extends Record<string, unknown>>(initial: T): FormState<T> => {
  let values = $state({ ...initial }) as T
  let errors = $state<FieldErrors>({})
  let touched = $state<Record<string, boolean>>({})

  return {
    get values() {
      return values
    },
    get errors() {
      return errors
    },
    get touched() {
      return touched
    },
    set(key, value) {
      values = { ...values, [key]: value }
      delete errors[String(key)]
    },
    touch(key) {
      touched = { ...touched, [String(key)]: true }
    },
    reset(next) {
      values = { ...(next ? { ...initial, ...next } : initial) } as T
      errors = {}
      touched = {}
    },
    toFormData() {
      return objectToFormData(values)
    },
    validate(schema) {
      const result = validateSchema(schema, values)
      if (!result.success) {
        errors = result.errors
        return { success: false }
      }
      errors = {}
      return { success: true }
    },
  }
}
