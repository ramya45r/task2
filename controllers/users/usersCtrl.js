const expressAsyncHandler = require("express-async-handler");
const fs = require("fs")
const generateToken = require("../../config/token/generateToken");
const User = require("../../models/user/User");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const validateMongodbId = require("../../utils/validateMongodb");

//=========================Register user ===========================================//
const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  // console.log(req.body);

  //User Exists
  const userExists = await User.findOne({ email: req?.body?.email });
  if (userExists) throw new Error("User already exists");
  try {
    //Register user
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//=========================Login User ===========================================//
const loginUserCtl = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //check if user exists
  const userFound = await User.findOne({ email });
  //check password is match
  if (userFound && (await userFound.isPasswordMatched(password))) {
    res.json({
      _id: userFound?._id,
      firstName: userFound?.firstName,
      lastName: userFound.lastName,
      email: userFound?.email,
      profilePhoto: userFound?.profilePhoto,
      isAdmin: userFound?.isAdmin,
      token: generateToken(userFound?._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Login Credentials");
  }
});

//=========================Get all users ===========================================//
const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  console.log(1234567898765);
  try {
    const users = await User.find({}).populate('posts');
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//=========================Delete User ===========================================//
const deleteUsersCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  //check if user id is valid
  validateMongodbId(id);
  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json(deleteUser);
  } catch (error) {
    res.json(error);
  }
});

//=========================User Details ===========================================//
const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateMongodbId(id);
  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//=========================User Profile ============================================//
const userProfileCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  //1.find the login user
  //2.check this particular user if the login user exists in the array of viewedby
  //get the login user
  const loginUserId = req?.user?._id?.toString();
  console.log(loginUserId);
  try {
    const myProfile = await User.findById(id)
      .populate("posts")
      .populate("viewedBy")
      .populate("followers")
      .populate("following");
    const alreadyViewed = myProfile?.viewedBy?.find((user) => {
      return user?._id?.toString() === loginUserId;
    });
    if (alreadyViewed) {
      res.json(myProfile);
    } else {
      const profile = await User.findByIdAndUpdate(myProfile?._id, {
        $push: { viewedBy: loginUserId },
      });
      res.json(profile);
    }
  } catch (error) {
    res.json(error);
  }
});

//=========================Update Profile ===========================================//

const updateUserCtrl = expressAsyncHandler(async (req, res, next) => {
  const { _id } = req?.user;
  // //block user
  // blockUser(req?.user);
  validateMongodbId(_id);
  const user = await User.findByIdAndUpdate(
    _id,
    {
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      bio: req?.body?.bio,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.json(user);
});

//=========================Update password ===========================================//

const updateUserPasswordCtrl = expressAsyncHandler(async (req, res) => {
  //destructure the login user
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId(_id);
  //Find the user by id
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  }
  res.json(user);
});

//=========================Follow users ===========================================//

const followingUserCtrl = expressAsyncHandler(async (req, res) => {
  //find the user you want to follow and update it's followers field
  const { followId } = req.body;
  const loginUserId = req.user.id;

  const targetUser = await User.findById(followId);

  //find the useer and check if the login id exist
  const alreadyFollowing = targetUser?.followers?.find(
    (user) => user?.toString() === loginUserId.toString()
  );
  if (alreadyFollowing) throw new Error("you have already followed this user");
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: loginUserId },
    },
    { new: true }
  );
  //  //Update the login user following field
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { following: followId },
      isFollowing: true,
    },
    { new: true }
  );
  res.json("Successfully follow the user");
});

//=========================Unfollow users ===========================================//

const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unFollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unFollowId,
    {
      $pull: { followers: loginUserId },
      isFollowing: false,
    },
    { new: true }
  );
  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unFollowId },
    },
    { new: true }
  );
  res.json("you have successfully unfollowed this user");
});

//=========================Block users ===========================================//

const blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true,
    },
    {
      new: true,
    }
  );
  res.json(user);
});

//=========================Unblock users ===========================================//

const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false,
    },
    { new: true }
  );
  res.json(user);
});
//=========================Profile photo upload===========================================//

const  profilePhotoUploadCtrl = expressAsyncHandler(async(req,res)=>{
  // find the login user
  // console.log(req.user);

  const {_id}= req?.user;
  //block user
  // blockUser(req?.user)

  //get the path to the image
  const localPath = `public/images/profile/${req.file.filename}` ;
  // upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);
  // console.log(imgUploaded);
  const foundUser = await User.findByIdAndUpdate(_id,{
    profilePhoto: imgUploaded?.url,
  },{new:true})

  //remove the saved image
  fs.unlinkSync(localPath)
  // res.json(foundUser);
  res.json(imgUploaded);
})
//search
const allUsersSearch =expressAsyncHandler(async(req,res) =>{
  console.log(req.user._id);
  console.log(req.query.search);
  const keyword=req.query.search? {
    $or:[
      {firstName:{$regex:req.query.search,$options:"i"}},
      {email:{$regex:req.query.search,$options:"i"}}
    ],
  }
  :{};
  console.log(keyword);
  const users=await User.find(keyword)
  .find({_id:{$ne:req.user._id}})
  res.send(users)
  console.log(users);
})

//----------cover photo upload----------

const coverPhotoUploadController = expressAsyncHandler(async (req, res) => {
  // find the login user
  // console.log(req.user);

  const { _id } = req?.user;

  //get the path to the image
  const localPath = `public/images/profile/${req.file.filename}`;
  // upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);
  // console.log(imgUploaded);
  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      coverPhoto: imgUploaded?.url,
    },
    { new: true }
  );

  //remove the saved image
  fs.unlinkSync(localPath);
  // res.json(foundUser);
  res.json(imgUploaded);
});
module.exports = {
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
  allUsersSearch,coverPhotoUploadController 
};
