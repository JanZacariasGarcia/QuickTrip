import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    time: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    cost: { type: String, required: true },
    duration: { type: String, required: true },
    tips: { type: String }
});

const mealSchema = new mongoose.Schema({
    time: { type: String, required: true }, // lunch, dinner, etc.
    restaurant: { type: String, required: true },
    cuisine: { type: String, required: true },
    location: { type: String, required: true },
    cost: { type: String, required: true }
});

const daySchema = new mongoose.Schema({
    day: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    theme: { type: String, required: true },
    activities: [activitySchema],
    meals: [mealSchema],
    totalEstimatedCost: { type: String, required: true }
});

const transportationSchema = new mongoose.Schema({
    getting_around: { type: String, required: true },
    recommendations: [{ type: String }]
});

const preferencesSchema = new mongoose.Schema({
    activityLevel: {
        type: String,
        enum: ['relaxed', 'intermediate', 'active'],
        default: 'intermediate'
    },
    duration: {
        type: String,
        enum: ['half-day', 'full-day', 'multi-day'],
        default: 'full-day'
    },
    interests: [{ type: String }],
    budget: {
        type: String,
        enum: ['budget', 'moderate', 'luxury'],
        default: 'moderate'
    }
});

const itinerarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    destination: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD format
    endDate: { type: String, required: true }, // YYYY-MM-DD format
    duration: { type: Number, required: true }, // number of days
    preferences: preferencesSchema,
    days: [daySchema],
    totalEstimatedCost: { type: String },
    generalTips: [{ type: String }],
    transportation: transportationSchema,
    rawContent: { type: String }, // fallback for unparsed AI content
    error: { type: String }, // error message if parsing failed
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
itinerarySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;