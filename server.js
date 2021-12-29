const express = require('express')
const bodyParser = require('body-parser') // latest version of exressJS now comes with Body-Parser!
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const morgan = require('morgan')

const register = require('./controllers/register')
const signin = require('./controllers/signin')
const profile = require('./controllers/profile')
const image = require('./controllers/image')

// ashish's code line
const config = require('config')
const dbConfig = config.get('SmartBrain.dbConfig')

console.log('uri', process.env.DATABASE_URI)
const db = knex({
  // connect to your own database here:
  client: dbConfig.client,
  connection: process.env.DATABASE_URI,
  // || {
  //   host: dbConfig.host,
  //   user: dbConfig.user,
  //   password: dbConfig.password,
  //   database: dbConfig.database,
  //   port: dbConfig.port,
  // },
})

const app = express()

app.use(morgan('combined'))
app.use(cors())
app.use(express.json()) // latest version of exressJS now comes with Body-Parser!

app.get('/', (req, res) => {
  res.send("It's working!")
})
app.post('/signin', signin.signinWithAuth(db, bcrypt))
app.post('/register', (req, res) => {
  register.handleRegister(req, res, db, bcrypt)
})
app.get('/profile/:id', (req, res) => {
  profile.handleProfileGet(req, res, db)
})
app.put('/profile/:id', (req, res) => {
  profile.handleProfileUpdate(req, res, db)
})

app.put('/image', (req, res) => {
  image.handleImage(req, res, db)
})
app.post('/imageurl', (req, res) => {
  image.handleApiCall(req, res)
})

app.listen(3000, () => {
  console.log('app is running on port 3000')
})
