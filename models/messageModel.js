const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  text: String,
  AudioData:String,       
  fileUrl: String,       
  fileName: String,
  fileSize: Number,
  mimeType: String,
  duration: Number, 
  latitude: Number,   
  longitude: Number,
  url: String 
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'document', 'location'],
      required: true
    },
    content: fileSchema,
    read: { 
      type: Boolean,
      default: false
    },
    isEdited: { 
      type: Boolean,
      default: false 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", messageSchema);