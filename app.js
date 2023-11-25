const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

//API 1

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hasedPassword = await bcrypt.hash(password, 10)
  const getUserName = `
    SELECT *
    FROM user
    WHERE username = '${username}'`
  const dbUserName = await db.get(getUserName)
  if (dbUserName === undefined) {
    const createNewUserQuery = `
    INSERT INTO user(username, name, password, gender, location)
    VALUES (
      '${username}',
      '${name}',
      '${hasedPassword}',
      '${gender}',
      '${location}'
    )`

    if (password.length < 5) {
      response.send('Password is too short')
    } else {
      const dbResponse = await db.run(createNewUserQuery)
      response.send('User created successfully')
      console.log(dbResponse)
    }
  } else {
    response.send('User already exists')
  }
})

// API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserName = `
    SELECT *
    FROM user
    WHERE username = '${username}'`
  const dbUserName = await db.get(getUserName)
  console.log(dbUserName)
  if (dbUserName === undefined) {
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbUserName.password,
    )
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.send('Invalid password')
    }
  }
})

//API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserName = `
    SELECT *
    FROM user
    WHERE username = '${username}';`
  const dbUserName = await db.get(getUserName)
  console.log(dbUserName)
  if (dbUserName === undefined) {
    response.send('User not registered')
  } else {
    const isCurrentPasswordMatched = await bcrypt.compare(
      oldpassword,
      dbUserName.password,
    )
    if (isCurrentPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.send('Password is too short')
      } else {
        const newPasswordEncrypt = await bcrypt.hash(newPassword, 10)
        const updateQUery = `
        UPDATE user
        SET
        password = ${newPasswordEncrypt}
        WHERE username = '${username}';`
        await db.run(updateQUery)
        response.send('Password updated')
      }
    } else {
      response.send('Invalid current password')
    }
  }
})

module.exports = app
