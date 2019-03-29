process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() == 'production') ? 'production' : 'development';

const express = require('express');
const passport = require('passport');
const GithubPassport = require('passport-github');
const knexFile = require('./knexfile');
const knex = require('knex')(knexFile[process.env.NODE_ENV]);
const bodyParser = require('body-parser');
const Cache = require('./Cache');

const sessionCache = new Cache();

const app = express();

const port = 8080;

app.use(bodyParser.json());
app.use(passport.initialize());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GithubPassport.Strategy({
    clientID: 'd190c2d61e61b7d37449',
    clientSecret: '722afa1814b305db058057e5976cfc03d44f0b26',
    callbackURL: `http://localhost:${port}/auth/github/callback`,
  }, async (accessToken, refreshToken, profile, cb) => {
    try {
      try {
        await knex.insert({
          githubId: profile.id,
        }).into('users');
      } catch(err) {
        // maybe error is duplicated key
      }

      const user = await knex.select().from('users').where({
        githubId: profile.id,
      }).first();

      console.log(user);

      return cb(null, {
        ...user,
        accessToken,
      });
    } catch (err) {
      return cb(err);
    }
  }));


app.get('/auth/github', passport.authenticate('github', {
  session: false,
}));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/github' }),
  (req, res) => {
    console.log(req.user.accessToken);

    sessionCache.save(req.user.accessToken, req.user);
    res.send(`Successfully logged in. Your accessToken is ${req.user.accessToken}`);
  });

function Authorize(req, res, next) {
  try {
    console.log(req.headers);
    const { authorization: authorizationHeader } = req.headers;

    if (!authorizationHeader) {
      res.send('You should put Authorization in header.').status(401);
      return;
    }

    //<type> <credentials>
    const [type, accessToken] = authorizationHeader.split(' ');

    if (type.toLowerCase() !== 'Bearer'.toLowerCase()) {
      res.send('Authorization header type must be Bearer.').status(401);
      return;
    }

    const session = sessionCache.get(accessToken);

    if (!session) {
      res.send('No session found.').status(401);
      return;
    }

    req.session = session;
    next();
  } catch(err) {
    console.error(err);
    res.sendStatus(500);
  }
}

app.post('/post', Authorize, async (req, res) => {
  const {
    content,
  } = req.body;

  const userId = req.session.id;

  console.log(`content : ${content}`);
  console.log(`userId : ${userId}`);

  try {
    await knex.insert({
      content,
      writerId: userId,
    }).into('posts');

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(port, (err) => {
  if(err) {
    throw err;
  }
  console.log(`server starts with port ${port}`);
});
