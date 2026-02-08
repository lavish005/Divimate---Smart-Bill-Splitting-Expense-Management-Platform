import Group from "../models/Group.js";
import User from "../models/User.js";

// ✅ Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const adminId = req.user.id; // from JWT

    if (!name) return res.status(400).json({ msg: "Group name is required" });

    // fetch full user info (so we can store name and type)
    const adminUser = await User.findById(adminId);

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
    }

    res.json({ msg: "✅ Member added successfully", group });
  } catch (error) {
    console.error("❌ Add member error:", error.message);
    res.status(500).json({ msg: "Server error while adding member" });
  }
};

// ✅ Get all groups of logged-in user
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({ "members.userId": userId })
      .populate("admin", "name email")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error("❌ Fetch groups error:", error.message);
    res.status(500).json({ msg: "Error fetching groups" });
  }
};
