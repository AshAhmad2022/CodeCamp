const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');
const path = require('path');

// @desc  Get all bootcamps
// @route  GET/api/v1/bootcamps
//@access Public
exports.getBootcamps = asyncHandler(async (req,res,next) => {
        const bootcamps =  await Bootcamp.find().populate('courses');
        res.status(200).json({
            success: true,
            data: bootcamps
        });     
});

// @desc  Get single bootcamp
// @route  GET/api/v1/bootcamps/:id
//@access Public
exports.getBootcamp = asyncHandler(  async (req,res,next) => {

        const bootcamp = await Bootcamp.findById(req.params.id);
        
        if(!bootcamp)
            {
                return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
            }

        res.status(200).json({
            success: true,
            data: bootcamp
        });
});

// @desc  Create new bootcamp
// @route  POST/api/v1/bootcamps
//@access Private
exports.createBootcamp = asyncHandler( async (req,res,next) => {
    req.body.user = req.user.id;

    //Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({user: req.user.id});

    //If the user is not an admin, they can only add one bootcamp
    if(publishedBootcamp && req.user.role!=='admin')
    {
        return next(new ErrorResponse(`The user with ${req.user.id} has already published a bootcamp`,400));
    }
    const bootcamp =  await Bootcamp.create(req.body);
    res.status(201).json({
        success: true,
        data: bootcamp
    });
});

// @desc  Update bootcamp
// @route  PUT/api/v1/bootcamps/:id
//@access Private
exports.updateBootcamp = asyncHandler( async (req,res,next) => {
   let bootcamp = await Bootcamp.findById(req.params.id);

   if(!bootcamp)
    {
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }
    //Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin')
    {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`,401));
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id,req.body,{
        new: true,
        runValidators: true
    });
    res.status(200).json({success: true, data: bootcamp});

});

// @desc  Delete bootcamp
// @route  DELETE/api/v1/bootcamps/:id
//@access Private
exports.deleteBootcamp = asyncHandler( async (req,res,next) => {
        const bootcamp = await Bootcamp.findById(req.params.id);
     
        if(!bootcamp)
         {
            return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));   
         }

         if(bootcamp.user.toString()!== req.user.id && req.user.role!=='admin')
            {
                return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp`,401));
            }

         await Bootcamp.deleteOne({_id: req.params.id});

         res.status(200).json({success: true, data: {}});
});

//@desc    Upload photo for bootcamp
//@route   PUT/api/v1/bootcamps/:id/photo
//@access  Private

exports.uploadBootcampPhoto = asyncHandler(async(req,res,next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp)
        {
            return next(new ErrorResponse(`No bootcamp with id of ${req.params.id}`,404));
        }
        if(bootcamp.user.toString()!== req.user.id && req.user.role!=='admin')
            {
                return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp`,401));
            }
    if(!req.files)
        {
            return next(new ErrorResponse(`Please upload a file`,400));
        }
    const file = req.files.file;
    
    //Make sure image is a photo
    if(!file.mimetype.startsWith('image'))
        {
            return next(new ErrorResponse(`Please upload an image file`,400));
        }
    
    //Check filesize
    if(file.size>process.env.MAX_FILE_UPLOAD)
        {
            return next(new ErrorResponse(`Please upload an image with file size less than ${process.env.MAX_FILE_UPLOAD}`,400));
        }
    
    //Create custom filename to avoid overriding
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err => {
        if(err)
            {
                console.log(err);
                return next(new ErrorResponse(`Problem with file upload`,500));
            }
        await Bootcamp.findByIdAndUpdate(req.params.id,{photo: file.name});
        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});
