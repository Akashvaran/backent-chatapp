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
  longitude: Number
}, { _id: false });

const GroupMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatGroup",
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'document', 'location'],
      required: true
    },
    content: fileSchema,
    
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser"
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    isDeletedMe: {
      type: Boolean,
      default: false
    },
    isDeletedEvery: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupChatMessage", GroupMessageSchema);
module.exports = GroupMessage;
