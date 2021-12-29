const jwt = require('jsonwebtoken')
const redis = require('redis')

// setup redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_URI || 'localhost',
  // port: process.env.REDIS_PORT,
  // password: process.env.REDIS_PASSWORD,
})

const handleSignin = (db, bcrypt) => (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return Promise.reject('incorrect form submission')
  }

  return db
    .select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash)
      if (isValid) {
        return db
          .select('*')
          .from('users')
          .where('email', '=', email)
          .then((user) => user[0])
          .catch((err) => Promise.reject(err))
      } else {
        Promise.reject('wrong credentials')
      }
    })
    .catch((err) => Promise.reject(err))
}

const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers

  redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(400).json('Unauthorized')
    }

    return res.json({ id: reply })
  })
}

const setToken = (token, id) => {
  return new Promise((resolve, reject) => {
    redisClient.set(token, id, 'EX', 60 * 60 * 24, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(token)
      }
    })
  })
}

// store user's session in redis database
const storeSession = (key, value) => {
  return new Promise((resolve, reject) => {
    redisClient.set(key, value, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(key)
      }
    })
  })
}

const createSessions = (user) => {
  console.log('createSessions')

  // create jwt token, and return session
  const { id, email } = user
  const jwtToken = jwt.sign(
    {
      id,
      email,
    },
    process.env.JWT_SECRET || 'supersecretkey',
    {
      expiresIn: '6h',
    },
  )

  return setToken(jwtToken, id)
    .then(() => ({
      success: 'true',
      userId: id,
      token: jwtToken,
    }))
    .catch((err) => Promise.reject(err))
}

const signinWithAuth = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers

  return authorization
    ? getAuthTokenId(req, res)
    : handleSignin(db, bcrypt)(req, res)
        .then((data) =>
          data.id && data.email
            ? createSessions(data)
            : Promise.reject(`${data} has some issues`),
        )
        .then((session) => res.json(session))
        .catch((err) => res.status(400).json('something went wrong'))
}

module.exports = {
  handleSignin: handleSignin,
  signinWithAuth: signinWithAuth,
}
