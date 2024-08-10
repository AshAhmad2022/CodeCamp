const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const crypto = require('crypto');

//@desc    Register user
//@route   POST/api/v1/auth/register
//@access  Public
exports.registerUser = asyncHandler(async(req,res,next) => {

    const {name,email,password,role} = req.body;

    //Create user
    const user = await User.create({name,email,password,role});

    //Create web token
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
        success: true,
        token: token
    });
});

//@desc       Login user
//@route      POST/api/v1/auth/login
//@access     Private
exports.loginUser = asyncHandler(async(req,res,next) => {
    const {email,password} = req.body;
       
    //Validate eamil and password
    if(!email||!password)
    {
        return next(new ErrorResponse(`Please provide and email and password`,404));
    }
    
    //Check for user
    const user = await User.findOne({email: email}).select('+password');
        
    if(!user)
    {
        return next(new ErrorResponse(`Inavalid credentials`,401));
    }
    
    //Check is password matches
    const isMatch = await user.matchPassword(password);

    if(!isMatch)
        {
            return next(new ErrorResponse(`Inavalid credentials`,401));
        }


    //Create web token
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
        success: true,
        token: token
    });

});


//@desc    Log user out
//@route   GET/api/v1/auth/logout
//@access  Private
exports.logOut = asyncHandler(async(req,res,next) => {
        res.cookie('token','none',{
          expires: new Date(Date.now()-10*1000),
          httpOnly: true
        });
        res.status(200).json({
          success: true,
          data: {}
        });
});

//@desc    Get current logged in user
//@route   GET/api/v1/auth/me
//@access  Private

exports.getMe = asyncHandler(async(req,res,next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updateDetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };
  
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({
      success: true,
      data: user,
    });
  });

//@desc    Forgot password
//@route   POST/api/v1/auth/forgotPassword
//@access  Public

exports.forgotPassword = asyncHandler(async(req,res,next) => {
    const user = await User.findOne({email: req.body.email});
    if(!user)
    {
        return next(new ErrorResponse(`There is no user with that email`,404));
    }


    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    //reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({validateBeforeSave: false});
    return next(new ErrorResponse('Email could not be sent',500));
  }
});


//@desc   Reset password
//@route  PUT/api/v1/auth/resetPassword/:resetToken
//@access Private
exports.resetPassword = asyncHandler(async(req,res,next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    });
    
    if(!user)
    {
        return next(new ErrorResponse('Invalid token',400));
    }

    //Set password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({
        success: true,
        data: user
    });
});
