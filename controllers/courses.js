const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

//@desc   get courses
//@route  GET/api/v1/courses
//@route  GET/api/v1/bootcamps/:bootcampId/courses
//@access Public

exports.getCourses = asyncHandler(async(req,res,next) => {
    let query;
    if(req.params.bootcampId){
        query = Course.find({bootcamp: req.params.bootcampId});
    }
    else
    {
        query = Course.find().populate({
            path: 'bootcamp',
            select: 'name description'
        });
    }
    const courses = await query;
    res.status(200).json({
        success: true,
        data: courses
    });
});

//@desc    Get a single course
//@route   GET/api/v1/courses/:id
//@access  Public

exports.getCourse = asyncHandler( async(req,res,next) => {
      const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
      });
      if(!course)
        {
            return next(new ErrorResponse(`No course with the id of ${req.params.id}`),404);
        }
    res.status(200).json({
        success: true,
        data: course
    })
});

//@desc     Add a course
//@route    POST/api/v1/bootcamps/:bootcampId/courses
//@access   Private

exports.addCourse = asyncHandler (async(req,res,next) => {
       req.body.bootcamp = req.params.bootcampId;
       req.body.user = req.user.id;
       const bootcamp = await Bootcamp.findById(req.params.bootcampId);
       
       if(!bootcamp)
        {
            return next(new ErrorResponse(`No bootcamp with id ${req.params.bootcampId}`),404);
        }
    
        //Make sure the logged-in user is the bootcamp owner 
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin')
        {
            return next(new ErrorResponse(`User ${req.user.id} is unauthorized to add course to bootcamp ${bootcamp._id}`,401))
        }

        const course = await Course.create(req.body);
        res.status(200).json({
            success: true,
            data: course
        });
});

//@desc     Update course
//@routes   PUT/api/v1/courses/:id
//@access   Private

exports.updateCourse = asyncHandler(async(req,res,next) => {
    let course = await Course.findById(req.params.id);

    if(!course)
        {
            return next(new ErrorResponse(`No course found with id of ${req.params.id}`));
        }
        
        if(course.user.toString() !== req.user.id && req.user.role !== 'admin')
            {
                return next(new ErrorResponse(`User ${req.user.id} is unauthorized update course ${course._id}`,401))
            }

    
    course = await Course.findByIdAndUpdate(req.params.id,req.body,{
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: course
    });
});

//@desc      Delete course
//@routes    DELETE/api/v1/courses/:id
//@access    Private

exports.deleteCourse = asyncHandler (async(req,res,next) => {
    const course = await Course.findById(req.params.id);
    if(!course)
        {
            return next(new ErrorResponse(`No course with id of ${req.params.id}`),404);
        }
        if(course.user.toString() !== req.user.id && req.user.role !== 'admin')
            {
                return next(new ErrorResponse(`User ${req.user.id} is unauthorized delete course ${course._id}`,401))
            }


    await course.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});