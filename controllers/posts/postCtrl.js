const expressAsyncHandler = require("express-async-handler");
const Filter = require("bad-words");
const fs = require("fs");
const Post = require("../../models/post/Post");
const validateMongodbId = require("../../utils/validateMongodb");
const User = require("../../models/user/User");

const cloudinaryUploadImg = require("../../utils/cloudinary");

// create Post----------------------
const createPostCtrl = expressAsyncHandler(async (req, res) => {
  // console.log(req.body);
  const { _id } = req.user;
  // validateMongodbId(req.body.user);
  //Check for bad words
  const filter = new Filter();
  const isProfane = filter.isProfane(req.body.title, req.body.description);
  //Block user
  if (isProfane) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });
    throw new Error(
      "Creating Failed because it contains profane words and you have been blocked"
    );
  }

  //1. get the path to img
  const localPath = `public/images/posts/${req.file.filename}`;
  //2.upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);

  // console.log(req.file);
  try {
    const post = await Post.create({
      ...req.body,
      user: _id,
      image:imgUploaded?.url,
    });
    res.json(post);
    //Remove uploaded img
   // fs.unlinkSync(localPath);
  } catch (error) {
    res.json(error);
  }
});

//--------------Fetch all posts --------------------------------//
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory =req.query.category
  try {
    //check if it has a category
    if(hasCategory){
      const posts = await Post.find({category:hasCategory}).populate("user").populate('comments').sort('-createdAt');
      res.json(posts)
    }else{
      const posts = await Post.find({}).populate("user").populate("user").populate('comments').sort("-createdAt");
    res.json(posts);
    }
    
  } catch (error) {
    res.json(error);
  }
});
//--------------Fetch a single post --------------------------------//
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findById(id).populate("user").populate('comments');
    //update number of views
    await Post.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------search post-------------------------------------//
const searchPostController = expressAsyncHandler(async (req, res) => {
  const query = req.query.q
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: new RegExp("^" + query + ".*", "i") } },
        { description: { $regex: new RegExp("^" + query + ".*", "i") } },
        { category: { $regex: new RegExp("^" + query + ".*", "i") } },
      ],
    })
    res.status(200).json(posts)
  } catch (error) {
    throw new Error(error.message)
  }
})
//--------------Update post --------------------------------//
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  console.log(req.user);
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user:req.user?._id,
      },
      {
        new: true,
      }
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//--------------Delete post --------------------------------//
const deletePostCtrl =expressAsyncHandler(async (req,res)=>{
  const {id} = req.params;
  validateMongodbId(id);
  try{
  const post =await Post.findOneAndDelete(id);
  res.json(post);
  }catch(error){
    res.json(error)
  }
  res.json("Delete")

})
//------------------------------
//Likes
//------------------------------
const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {

  //1.Find the post to be liked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //find login user
  const loginUserId =req?.user?._id;
  //find  user has liked this post
  const isLiked = post?.isLiked
  //check user is disliked
  const alreadyDisliked = post?.disLikes?.find(userId=>userId?.toString()===loginUserId?.toString())

console.log(alreadyDisliked);
//remove user from dislike array if exists
 if(alreadyDisliked){
   const post =await Post.findByIdAndUpdate(postId,{
    $pull:{disLikes:loginUserId},
    isDisLiked:false,
   },{
    new:true
   });
   res.json(post);
 }
 //Remove  user if has likees
 if(isLiked){
  const post =await Post.findByIdAndUpdate(postId,{
    $pull:{likes:loginUserId},
    isLiked:false
  },{
    new:true
  });
  res.json(post);
 }else{
  //add to likes
  const post =await Post.findByIdAndUpdate(postId,{
    $push:{likes:loginUserId},
    isLiked:true,
  },{new:true});
  res.json(post)
 }
  
});

//Dislikes

const toggleAddDislikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be disLiked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2.Find the login user
  const loginUserId = req?.user?._id;
  //3.Check if this user has already disLikes
  const isDisLiked = post?.isDisLiked;
  //4. Check if already like this post
  const alreadyLiked = post?.likes?.find(
    userId => userId.toString() === loginUserId?.toString()
  );
  //Remove this user from likes array if it exists
  if (alreadyLiked) {
    const post = await Post.findOneAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );
    res.json(post);
  }
  //Toggling
  //Remove this user from dislikes if already disliked
  if (isDisLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true }
    );
    res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { disLikes: loginUserId },
        isDisLiked: true,
      },
      { new: true }
    );
    res.json(post);
  }
});


// //-------------report a post---------------
const reportPostController = expressAsyncHandler(async(req,res) =>{
  //find the post to report
  const { postId } = req.body;
  const post = await Post.findById(postId);


   //find the login user
   const loginUserId = req?.user?._id;
   const reportUserId = post?.reports?.includes(loginUserId)
     //find the user has reported this post ?
    const isReported = post?.isReported;
    if (!isReported || !reportUserId ) {
      const post = await Post.findByIdAndUpdate(
        postId,
        {
          $push: { reports: loginUserId },
          isReported: true,
        },
        { new: true }
      );
      res.json(post);
    }else{
      res.json(post)
    }

 })
  //--------fetch reported posts---------------
const fetchReportedPostController = expressAsyncHandler(async (req, res) => {
  try {
    const posts = await Post.find({isReported:true }).populate('user');
    res.json(posts);
  } catch (error) {
    throw new Error(error.message);
  }
});


// -------------------save posts------------------------
const savePostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.body;
  const userId = req?.user?.id;
  console.log(id, userId, "gfhjkl;");
  try {
    const savedPosts = await SavedPost.findOne({ user: userId });
    if (savedPosts) {
      const isExist = savedPosts.post.includes(id);
      if (isExist) {
        const newSavedPosts = await SavedPost.findOneAndUpdate(
          { user: userId },
          { $pull: { post: id } },
          { new: true }
        );
        res.json(newSavedPosts);
      } else {
        const newSavedPosts = await SavedPost.findOneAndUpdate(
          {user: userId },
          { $push: { post: id } },
          { new: true }
        );
        res.json(newSavedPosts);
      }
    } else {
      const newSavedPosts = await SavedPost.create({
       user: userId ,
        post: id,

      });
      res.json(newSavedPosts);
    }
  } catch (error) {
    throw new Error(error.message);
  }
});

//--------fetch saved posts---------------
const fetchSavedPostController = expressAsyncHandler(async (req, res) => {
  try {
    // const posts = await SavedPost.find({ user: req.user.id }, { post: 1 });
    const posts = await SavedPost.find({ user: req.user.id }).populate("post");
    res.json(posts);
  } catch (error) {
    throw new Error(error.message);
  }
});

//------------------delete saved post---------------

const deleteSavedPostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const posts = await SavedPost.findOneAndUpdate(
      { user: userId },
      {
        $pull: { post: id },
      },
      { new: true }
    );
    res.json(posts);
  } catch (error) {
    throw new Error(error.message);
  }
});


module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddDislikeToPostCtrl,
  searchPostController,reportPostController,fetchReportedPostController,
  deleteSavedPostController,fetchSavedPostController,savePostController
  
};
