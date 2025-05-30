const Group = require("../models/groupModel");
const AuthModel = require("../models/authModel");
const Message = require("../models/groupMessageModel");

exports.createGroup = async (req, res, next) => {

  try {
    const { name, description, members, createdBy } = req.body;

    const validMembers = await AuthModel.find({
      _id: { $in: members }
    });

    if (validMembers.length !== members.length) {
      return res.status(400).json({
        status: "fail",
        message: "One or more members are invalid"
      });
    }

    const group = await Group.create({
      name,
      description,
      createdBy,
      members: members.map(member => ({
        user: member,
        role: "member"
      }))
    });

    res.status(201).json({
      status: "success",
      data: {
        group
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserGroups = async (req, res, next) => {
  try {
    
    const userId = req.params.id;

    const groups = await Group.find({
      $or: [
        { "members.user": userId },
        { createdBy: userId },
      ],
    })
      .populate("createdBy", "name email")
      .populate("admins", "name email")
      .populate("members.user", "name email")



    res.status(200).json({
      status: "success",
      results: groups.length,
      data: { groups },
    });
  } catch (err) {
    next(err);
  }
};


exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id; 

    if (!groupId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Group ID is required',
      });
    }

    const messages = await Message.find({
      group: groupId,
      isDeletedEvery: { $ne: true }
    })
      .populate('sender', 'name _id')
      .populate('readBy', 'name _id')
      .sort({ createdAt: -1 });

    const formattedMessages = messages.map(msg => {
      const deletedFor = [];

      if (msg.isDeletedMe && !msg.readBy.includes(userId)) {
        deletedFor.push(userId.toString());
      }

      return {
        ...msg.toObject(),
        deletedFor
      };
    });
console.log(formattedMessages);

    res.status(200).json({
      status: 'success',
      messages: formattedMessages
    });
  } catch (err) {
    console.error('Error fetching group messages:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching group messages',
    });
  }
};