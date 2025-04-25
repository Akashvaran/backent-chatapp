const express = require("express");
const { getMessages} = require("../controllers/messageController");
const protectRoutes = require("../middleware/verfication");

const messageRouter = express.Router();

messageRouter.get("/messages/:sender/:receiver", protectRoutes, getMessages);



module.exports = messageRouter;
