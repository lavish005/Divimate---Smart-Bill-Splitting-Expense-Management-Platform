import Message from "../models/Message.js";
import Group from "../models/Group.js";

// GET /api/chat/:groupId — fetch messages for a group
export const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log("\n💬 [GET MESSAGES] Group:", groupId, "User:", req.user.name);

    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === req.user.id
    );
    if (!isMember)
      return res.status(403).json({ msg: "You are not a member of this group" });

    const member = group.members.find(
      (m) => m.userId.toString() === req.user.id
    );
    if (member?.blocked) {
      return res.status(403).json({ msg: "You are blocked in this group" });
    }

    const messages = await Message.find({ group: groupId })
      .populate("sender", "name")
      .sort({ createdAt: 1 })
      .limit(200);

    console.log("✅ [MESSAGES FETCHED] Count:", messages.length);

    res.json(messages);
  } catch (error) {
    console.error("❌ Fetch messages error:", error.message);
    res.status(500).json({ msg: "Error fetching messages" });
  }
};

// POST /api/chat/:groupId — send a message (REST fallback, primary is socket)
export const sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;

    console.log("\n💬 [SEND MESSAGE] Group:", groupId);
    console.log("👤 From:", req.user.name);
    console.log("📝 Message:", text?.substring(0, 50) + (text?.length > 50 ? "..." : ""));

    if (!text?.trim())
      return res.status(400).json({ msg: "Message text is required" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === req.user.id
    );
    if (!isMember)
      return res.status(403).json({ msg: "You are not a member of this group" });

    const member = group.members.find(
      (m) => m.userId.toString() === req.user.id
    );
    if (member?.blocked) {
      return res.status(403).json({ msg: "You are blocked in this group" });
    }

    const message = await Message.create({
      group: groupId,
      sender: req.user.id,
      text: text.trim(),
    });

    const populated = await message.populate("sender", "name");

    console.log("✅ [MESSAGE SENT] ID:", message._id);

    // Broadcast to group room via socket
    req.io?.to(groupId).emit("newMessage", populated);

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ Send message error:", error.message);
    res.status(500).json({ msg: "Error sending message" });
  }
};
