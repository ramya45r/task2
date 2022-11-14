const express = require("express");
const {
  userRegisterCtrl,
  loginUserCtl,
  fetchUsersCtrl,
  deleteUsersCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unBlockUserCtrl,
  profilePhotoUploadCtrl,
  allUsersSearch,   coverPhotoUploadController
  
} = require("../../controllers/users/usersCtrl");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const {
  PhotoUpload,profilePhotoResize, coverPhotoResize
} = require("../../middlewares/upload/profilePhotoUpload");

const userRoutes = express.Router();
userRoutes.post("/register", userRegisterCtrl);
userRoutes.post("/login", loginUserCtl);
userRoutes.get("/", fetchUsersCtrl);
userRoutes.get("/profile/:id", authMiddleware, userProfileCtrl);
userRoutes.put("/", authMiddleware, updateUserCtrl);

//=======================Follow & Unfollow users==========================================//
userRoutes.put("/follow", authMiddleware, followingUserCtrl);
userRoutes.put("/unfollow", authMiddleware, unfollowUserCtrl);

//=======================Block & Unblock users ===========================================//
userRoutes.put("/block-user/:id", authMiddleware, blockUserCtrl);
userRoutes.put("/unblock-user/:id", authMiddleware, unBlockUserCtrl);

//=======================Unfollow users ===========================================//
userRoutes.put(
  "/profilephoto-upload",
  authMiddleware,
  PhotoUpload.single('image'),
  profilePhotoResize,
  profilePhotoUploadCtrl
);
userRoutes.put("/coverphoto-upload",authMiddleware,PhotoUpload.single("image"),coverPhotoResize, coverPhotoUploadController );
userRoutes.put("/password", authMiddleware, updateUserPasswordCtrl);
userRoutes.delete("/:id", deleteUsersCtrl);
userRoutes.get("/:id", fetchUserDetailsCtrl);
userRoutes.get("/chatUser/search",authMiddleware,allUsersSearch );
module.exports = userRoutes;
