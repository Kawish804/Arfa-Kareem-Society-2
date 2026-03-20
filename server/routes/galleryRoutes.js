// routes/galleryRoutes.js
const express = require('express');
const router = express.Router();
const { uploadImage, getImages, deleteImage } = require('../controllers/galleryController');

router.post('/upload', uploadImage);
router.get('/all', getImages);
router.delete('/:id', deleteImage);

module.exports = router;