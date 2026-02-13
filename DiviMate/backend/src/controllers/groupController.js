import Group from "../models/Group.js";
import User from "../models/User.js";
import { sendGroupInviteEmail } from "../services/notificationService.js";
import { sendNotification } from "../utils/notify.js";

// ✅ Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const adminId = req.user.id; // from JWT

    console.log("\n👥 [CREATE GROUP] User:", req.user.name);
    console.log("📝 Group name:", name);
    console.log("📝 Description:", description || "None");

    if (!name) return res.status(400).json({ msg: "Group name is required" });

    // fetch full user info (so we can store name and type)
    const adminUser = await User.findById(adminId);

    if (!adminUser) {
      return res.status(404).json({ msg: "Admin user not found" });
    }

    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members: [
        {
          userId: adminId,
          name: adminUser.name,
          type: adminUser.dietType
        }
      ]
    });

    console.log("✅ [GROUP CREATED] ID:", group._id);
    console.log("👤 Admin:", adminUser.name);

    res.status(201).json({ msg: "✅ Group created successfully", group });
  } catch (error) {
    console.error("❌ Group creation error:", error.message);
    res.status(500).json({ msg: "Server error while creating group" });
  }
};

// ✅ Add a member to group
export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    console.log("\n➕ [ADD MEMBER] Group:", groupId);
    console.log("👤 New member ID:", userId);
    console.log("👤 Added by:", req.user.name);

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id)
      return res.status(403).json({ msg: "Only admin can add members" });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ msg: "User not found" });

    const alreadyExists = group.members.some(
      (m) => m.userId.toString() === userId
    );
    if (!alreadyExists) {
      group.members.push({
        userId,
        name: userToAdd.name,
        type: userToAdd.dietType
      });
      await group.save();
      console.log("✅ [MEMBER ADDED] User:", userToAdd.name, "added to group:", group.name);
    } else {
      console.log("⚠️ [MEMBER EXISTS] User already in group");
    }

    res.json({ msg: "✅ Member added successfully", group });
  } catch (error) {
    console.error("❌ Add member error:", error.message);
    res.status(500).json({ msg: "Server error while adding member" });
  }
};

// ✅ Invite member by email
export const inviteMemberByEmail = async (req, res) => {
  try {
    const { groupId, email } = req.body;

    console.log("\n📧 [INVITE MEMBER] Email:", email);
    console.log("📧 Group ID:", groupId);
    console.log("👤 Invited by:", req.user.name);

    if (!groupId || !email)
      return res.status(400).json({ msg: "Group ID and email are required" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id)
      return res.status(403).json({ msg: "Only admin can invite members" });

    // Check if user exists on DiviMate
    const invitedUser = await User.findOne({ email });

    if (invitedUser) {
      // Already registered — add them directly
      const alreadyExists = group.members.some(
        (m) => m.userId.toString() === invitedUser._id.toString()
      );
      if (alreadyExists)
        return res.status(400).json({ msg: "User is already in this group" });

      group.members.push({
        userId: invitedUser._id,
        name: invitedUser.name,
        type: invitedUser.dietType,
      });
      await group.save();
      console.log("✅ [INVITE] User already registered, added directly:", invitedUser.name);

      // Notify them in-app
      try {
        const inviter = await User.findById(req.user.id).select("name");
        await sendNotification(
          invitedUser._id,
          `${inviter?.name || "Someone"} added you to "${group.name}".`,
          "info",
          req.io
        );
      } catch (err) {
        console.error("⚠️ Invite notification failed:", err.message);
      }
    }

    // Always send email (existing user gets "you were added", new user gets "join DiviMate")
    try {
      const inviter = await User.findById(req.user.id).select("name");
      await sendGroupInviteEmail(
        email,
        group.name,
        inviter?.name || "A friend",
        !!invitedUser
      );
      console.log("📧 [INVITE EMAIL SENT] To:", email);
    } catch (err) {
      console.error("⚠️ Invite email failed:", err.message);
    }

    return res.json({
      msg: invitedUser
        ? `${invitedUser.name} added to the group & notified via email`
        : `Invite sent to ${email}. They'll need to sign up first.`,
      group,
      userExists: !!invitedUser,
    });
  } catch (error) {
    console.error("❌ Invite member error:", error.message);
    res.status(500).json({ msg: "Server error while inviting member" });
  }
};

// ✅ Search users by email (for adding members)
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    console.log("\n🔍 [SEARCH USER] Search query:", email, "by:", req.user.name);
    if (!email) return res.status(400).json({ msg: "Email query is required" });

    const users = await User.find({
      email: { $regex: email, $options: "i" },
    })
      .select("name email dietType _id")
      .limit(5);

    console.log("✅ [SEARCH RESULTS] Found", users.length, "users");

    res.json(users);
  } catch (error) {
    console.error("❌ Search user error:", error.message);
    res.status(500).json({ msg: "Error searching users" });
  }
};

// ✅ Get all groups of logged-in user
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("\n👥 [GET MY GROUPS] User:", req.user.name);
    const groups = await Group.find({ "members.userId": userId })
      .populate("admin", "name email")
      .sort({ createdAt: -1 });

    console.log("✅ [MY GROUPS] Found", groups.length, "groups");

    res.json(groups);
  } catch (error) {
    console.error("❌ Fetch groups error:", error.message);
    res.status(500).json({ msg: "Error fetching groups" });
  }
};

// ✅ Block a member (Admin only)
export const blockMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;

    console.log("\n🚫 [BLOCK MEMBER] Request");
    console.log("👥 Group:", groupId);
    console.log("👤 Member to block:", memberId);
    console.log("👤 Blocked by:", req.user.name);

    if (!groupId || !memberId) {
      return res.status(400).json({ msg: "Group ID and member ID are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only admin can block members" });
    }

    if (group.admin.toString() === memberId) {
      return res.status(400).json({ msg: "Admin cannot be blocked" });
    }

    const member = group.members.find(
      (m) => m.userId.toString() === memberId
    );

    if (!member) return res.status(404).json({ msg: "Member not found" });

    member.blocked = true;
    member.blockedAt = new Date();
    member.blockedBy = req.user.id;

    await group.save();
    console.log("✅ [MEMBER BLOCKED] Successfully blocked member in group");
    res.json({ msg: "Member blocked", group });
  } catch (error) {
    console.error("❌ Block member error:", error.message);
    res.status(500).json({ msg: "Server error while blocking member" });
  }
};

// ✅ Unblock a member (Admin only)
export const unblockMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;

    console.log("\n✅ [UNBLOCK MEMBER] Request");
    console.log("👥 Group:", groupId);
    console.log("👤 Member to unblock:", memberId);
    console.log("👤 Unblocked by:", req.user.name);

    if (!groupId || !memberId) {
      return res.status(400).json({ msg: "Group ID and member ID are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only admin can unblock members" });
    }

    const member = group.members.find(
      (m) => m.userId.toString() === memberId
    );

    if (!member) return res.status(404).json({ msg: "Member not found" });

    member.blocked = false;
    member.blockedAt = null;
    member.blockedBy = null;

    await group.save();
    console.log("✅ [MEMBER UNBLOCKED] Successfully unblocked member in group");
    res.json({ msg: "Member unblocked", group });
  } catch (error) {
    console.error("❌ Unblock member error:", error.message);
    res.status(500).json({ msg: "Server error while unblocking member" });
  }
};
