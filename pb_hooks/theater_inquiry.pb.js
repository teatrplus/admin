/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  const name = e.record.getString('name').trim()
  const phone = e.record.getString('phone').trim()
  const email = e.record.getString('email').trim()
  const message = e.record.getString('message').trim()
  if (!email && !phone) throw new BadRequestError('Enter an email address or phone number.')
  if (!message) throw new BadRequestError('Enter your message.')
  const digits = phone.replace(/\D/g, '')
  if (name.length < 2 || name.toLowerCase() === name.toUpperCase()) {
    throw new BadRequestError('Enter a valid name.')
  }
  if (phone && (!/^[+0-9 ().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) {
    throw new BadRequestError('Enter a valid phone number.')
  }
  e.record.set('name', name)
  e.record.set('email', email)
  e.record.set('phone', phone)
  e.record.set('message', message)
  e.next()
}, 't_inquiry')
