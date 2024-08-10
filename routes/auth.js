const express = require('express');

const{registerUser,loginUser,getMe,forgotPassword,resetPassword,updateDetails,logOut} = require('../controllers/auth');

const router = express.Router();

const {protect } = require('../middleware/auth');

router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/logout',logOut);
router.get('/me',protect,getMe);
router.post('/forgotPassword',forgotPassword);
router.put('/resetPassword/:resetToken',resetPassword);
router.put('/updateDetails',protect,updateDetails);

module.exports = router;