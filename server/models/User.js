const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        savedEvents: [
            {
              eventId: { type: String, required: true },
              name: { type: String },
              date: { type: Date },
              time: { type: String },
              description: { type: String },
              address: { type: String },
              city: { type: String },
              stateCode: { type: String },
              postalcode: { type: String },
              tmurl: { type: String },
              venuename: { type: String },
            }
          ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
