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
    deviceType: String,
    deviceVendor: String,
    deviceModel: String,
    language: String,
    timezone: String,
    platform: String,
    IP: String,
    country: String,
    province: String,
    city: String,
    online: Boolean,
    extensionVersion: String,
    previous_version: String,
    tool_name: String,
}, { timestamps: true });

module.exports = mongoose.models.Track || mongoose.model('Track', TrackSchema); 