const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatSchema = new Schema(
    {
        message: { 
            type: String, 
            required: true,
            trim: true
        },
        sender: { 
            type: String, 
            required: true,
            enum: ['user', 'admin']
        },
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User',
            required: function() {
                return this.sender === 'user';
            }
        },
        adminId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User',
            required: function() {
                return this.sender === 'admin';
            }
        },
        isRead: { 
            type: Boolean, 
            default: false 
        },
    },
    {
        timestamps: true,
        collection: 'chats'
    }
);

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ isRead: 1, sender: 1 });

module.exports = mongoose.model('chat', chatSchema);

