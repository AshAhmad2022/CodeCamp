const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');
const fileupload = require('express-fileupload');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

//Load environment variables
dotenv.config({path: './config/config.env'});

//Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

app.use(express.json());

if(process.env.NODE_ENV==='development')
    {
        app.use(morgan('dev'));
    }

//File uploading
app.use(fileupload());

//Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

//Set static folder
app.use(express.static(path.join(__dirname,'public')));

// Prevent XSS attacks
app.use(xss());

//Rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000,//10 mins
    max: 100
});

app.use(limiter);

//Prevent http param pollution
app.use(hpp());

// Mount routers
app.use('/api/v1/bootcamps',bootcamps);
app.use('/api/v1/courses',courses);
app.use('/api/v1/auth',auth);
app.use('/api/v1/users',users);
app.use('/api/v1/reviews',reviews);

//error handling has to be after router mounting
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT,
    (console.log(`Server in ${process.env.NODE_ENV} mode on port ${PORT}`))
);