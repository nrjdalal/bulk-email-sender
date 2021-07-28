/*
# transport information
HOST=
PORT=
SECURE=
USERNAME=
USERPASS=

# sender information
FROM_NAME=
FROM_MAIL=

# receivers (comma seperated values, list file or xlsx file)
TO_MAIL=

# subject as a string
SUBJECT=

# content as a filename or string
HTML=

# delay between emails in ms
DELAY=
*/

require('dotenv').config()
const nodemailer = require('nodemailer')
const fs = require('fs')
const validate = require('validate.js')

const sender = async (content, to) => {
  let transporter = nodemailer.createTransport({
    host: process.env.HOST || 'smtp.gmail.com',
    port: process.env.PORT || 465,
    secure: process.env.SECURE || true,
    auth: {
      user: process.env.USERNAME,
      pass: process.env.USERPASS,
    },
  })
  let info = await transporter.sendMail({
    from: `${process.env.FROM_NAME || 'MAILER'} <${process.env.FROM_MAIL}>`,
    to: to,
    subject: process.env.SUBJECT,
    html: content,
  })
  console.log('Message sent:', info.messageId)
}

const emailList = async (content, toEmails, delay) => {
  // email validator
  const isEmail = (email) => {
    const res = validate({ from: email }, { from: { email: true } })
    if (res) {
      return false
    } else {
      return true
    }
  }
  // delay timer
  const timer = (ms) => new Promise((res) => setTimeout(res, ms))
  // email sender
  fs.readFile(process.cwd() + `/${toEmails}`, 'utf8', (err, res) => {
    if (err) {
      toEmails = toEmails.replace(/ /g, '')
      // to single email
      if (isEmail(toEmails)) {
        sender(content, toEmails)
      }
      // to comma separated emails
      if (toEmails.includes(',')) {
        async function sendmail() {
          for (x of toEmails.split(',')) {
            if (isEmail(x)) {
              sender(content, x)
              await timer(delay)
            }
          }
        }
        sendmail()
      }
    } else {
      // list file
      async function sendmail() {
        for (x of res.split('\n')) {
          if (isEmail(x)) {
            sender(content, x)
            await timer(delay)
          }
        }
      }
      sendmail()
    }
  })
}

fs.readFile(process.cwd() + `/${process.env.HTML}`, 'utf8', (err, res) => {
  if (err) {
    // email as string
    emailList(process.env.HTML, process.env.TO_MAIL, 5000)
  } else {
    // email as html file
    emailList(res, process.env.TO_MAIL, 5000)
  }
})
