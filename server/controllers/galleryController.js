// controllers/galleryController.js
const Gallery = require('../models/Gallery');

exports.uploadImage = async (req, res) => {
    try {
        const newImage = new Gallery(req.body);
        await newImage.save();
        res.status(201).json(newImage);
    } catch (error) {
        res.status(500).json({ error: "Failed to upload image" });
    }
};

exports.getImages = async (req, res) => {
    try {
        const images = await Gallery.find().sort({ createdAt: -1 });
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch images" });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete image" });
    }
};