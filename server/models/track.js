const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
    userId: String,
    event: String,
    pageUrl: String,
    pageTitle: String,
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    language: String,
    platform: String,
    IP: String,
    country: String,
    province: String,
    city: String,
    extensionVersion: String,
    tool_name: String,
}, { timestamps: true });

TrackSchema.index({ userId: 1 });
TrackSchema.index({ tool_name: 1 });
TrackSchema.index({ event: 1 });

mongoose.set('autoIndex', false);

module.exports = mongoose.models.Track || mongoose.model('Track', TrackSchema); 