require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require('./routes/responseRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(helmet());
app.use(cors({
origin: 'http://localhost:3000',credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('Mongo connected'))
  .catch(err=>console.error(err));  
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  next();
});
app.use('/auth', authRoutes);
app.use('/forms', formRoutes);
app.use('/responses', responseRoutes);
app.use('/webhooks', webhookRoutes);

app.listen(PORT, ()=>console.log('Server listening on', PORT));
