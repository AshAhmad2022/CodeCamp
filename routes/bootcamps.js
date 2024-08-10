const express = require('express');

const {
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    uploadBootcampPhoto
} = require('../controllers/bootcamps');

const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

router.use('/:bootcampId/courses',courseRouter);
router.use('/:bootcampId/reviews',reviewRouter);

router.route('/:id/photo').put(protect,authorize('publisher','admin'),uploadBootcampPhoto);

router.route('/')
.get(getBootcamps)
.post(protect,authorize('publisher','admin'),createBootcamp);

router.route('/:id')
.get(getBootcamp)
.put(protect,authorize('publisher','admin'),updateBootcamp)
.delete(protect,authorize('publisher','admin'),deleteBootcamp);

module.exports = router;