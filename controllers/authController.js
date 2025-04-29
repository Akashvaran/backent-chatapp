const AuthModel = require("../models/authModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const signup = async (req, res, next) => {
    console.log(req.body);

    const { name, email, mobile, password } = req.body;

    try {
        const existingUser = await AuthModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new AuthModel({ name, email, mobile, password: hashPassword });

        await newUser.save();

        const token = generateToken(newUser._id, newUser.email);
        res.cookie("jwt", token, { maxAge: 3600000, httpOnly: true });
      
      
        res.status(201).json({
            message: "User signed up successfully",
            user: { id: newUser._id, name: newUser.name },
            token
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    console.log(req.body);

    const { email, password } = req.body;

    try {
        const user = await AuthModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id, user.email);
        res.cookie("jwt", token, { maxAge: 3600000, httpOnly: true });
        console.log(token);
        res.status(200).json({
            message: "Login successful",
            user: { id: user._id, name: user.name },
            token
        });
    } catch (err) {
        next(err);
    }


};



const getAllUsers = async (req, res, next) => {
  try {
    console.log("function is running");
    const userId = req.user.id;

    const allUsersWithUnread = await AuthModel.aggregate([

      {
        $lookup: {
          from: "chatmessages",
          let: { senderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$senderId"] },
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$read", false] }
                  ]
                }
              }
            },
            { $count: "unreadCount" }
          ],
          as: "unreadInfo"
        }
      },
      {
        $lookup: {
          from: "chatmessages",
          let: { senderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$senderId"] },
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                type: 1,
                content: 1,
                createdAt: 1,
                read: 1
              }
            }
          ],
          as: "lastMessageInfo"
        }
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadInfo.unreadCount", 0] }, 0] },
          lastMessage: { $arrayElemAt: ["$lastMessageInfo", 0] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          unreadCount: 1,
          lastMessage: {
            $cond: {
              if: { $gt: [{ $size: "$lastMessageInfo" }, 0] },
              then: {
                type: "$lastMessage.type",
                content: "$lastMessage.content",
                createdAt: "$lastMessage.createdAt",
                read: "$lastMessage.read"
              },
              else: null
            }
          }
        }
      }
    ]);

    console.log(allUsersWithUnread);
    res.status(200).json(allUsersWithUnread);
  } catch (error) {
    console.error("Error fetching users with unread messages:", error);
    next(error);
  }
};




const Verify = async (req, res) => {
    // console.log(req.body)
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ status: false, msg: "Not authorized" });
        }
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ status: true, user: decodedData });
    } catch (err) {
        res.status(401).json({ status: false, msg: "Invalid token" });
    }
};

const logout = async (req, res, next) => {
    try {

        res.cookie("jwt", "", { maxAge: 1, httpOnly: true });

        res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    signup,
    login,
    getAllUsers,
    Verify,
    logout
};
