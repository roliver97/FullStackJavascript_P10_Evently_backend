const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    hour: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Music', 'Tech', 'Sports', 'Culture', 'Gastronomy', 'Other'],
      default: 'Other'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    poster: {
      type: String
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attendees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      default: []
    },
    favorites: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'events'
  }
)

const Event = mongoose.model('Event', eventSchema, 'events')
module.exports = Event
