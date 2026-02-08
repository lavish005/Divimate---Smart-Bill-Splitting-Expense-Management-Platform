import Notification from "../models/Notification.js";

export const sendNotification = async (userId, message, type, io) => {
  const note = await Notification.create({
    user: userId,
    message,
    type
  });

  if (io) {
    io.to(userId.toString()).emit("newNotification", note);
  }

  return note;
};
