// models/SavedFlight.js
import mongoose from 'mongoose';

const savedFlightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for faster user queries
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: false,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    pageUrl: {
        type: String,
        required: true,
        trim: true
    },
    departureDate: {
        type: String, // Store as string to match your date format
        required: true
    },
    returnDate: {
        type: String, // Store as string to match your date format
        required: true
    },
    scrapedAt: {
        type: Date,
        default: Date.now,
        index: true // Index for sorting by scraping time
    },
    // TTL index - MongoDB will automatically delete documents after 5 days
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 5 // 5 days in seconds
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Compound index to prevent duplicate saves and optimize queries
savedFlightSchema.index({
    userId: 1,
    city: 1,
    departureDate: 1,
    returnDate: 1
}, {
    unique: true // Prevent saving the same flight twice
});

// Index to clean up flights after departure date (for manual cleanup)
savedFlightSchema.index({ departureDate: 1 });

// Pre-save middleware to validate departure date is not in the past
savedFlightSchema.pre('save', function(next) {
    const departureDate = new Date(this.departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate < today) {
        const error = new Error('Cannot save flights with past departure dates');
        error.name = 'ValidationError';
        return next(error);
    }

    next();
});

// Static method to clean up expired flights
savedFlightSchema.statics.cleanupExpiredFlights = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.deleteMany({
        departureDate: { $lt: today.toISOString().split('T')[0] }
    });
};

// Instance method to check if flight is expiring soon
savedFlightSchema.methods.isExpiringSoon = function() {
    const departureDate = new Date(this.departureDate);
    const today = new Date();
    const diffTime = departureDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 2 && diffDays >= 0;
};

// Instance method to get days until departure
savedFlightSchema.methods.getDaysUntilDeparture = function() {
    const departureDate = new Date(this.departureDate);
    const today = new Date();
    const diffTime = departureDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default mongoose.model('SavedFlight', savedFlightSchema);