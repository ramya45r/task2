const express = require('express');
const { createPostCtrl,fetchPostsCtrl ,fetchPostCtrl,updatePostCtrl,fetchReportedPostController,savePostController,deletePostCtrl,reportPostController,toggleAddLikeToPostCtrl,toggleAddDislikeToPostCtrl,fetchSavedPostController,deleteSavedPostController} = require('../../controllers/posts/postCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const { PhotoUpload,postImgResize } = require('../../middlewares/upload/profilePhotoUpload');


const postRoute =express.Router();

postRoute.post("/",authMiddleware, PhotoUpload.single('image'),
postImgResize,
createPostCtrl);
postRoute.put('/likes',authMiddleware,toggleAddLikeToPostCtrl )
postRoute.put('/dislikes',authMiddleware,toggleAddDislikeToPostCtrl )
postRoute.get('/',fetchPostsCtrl);
postRoute.get('/:id',fetchPostCtrl);
postRoute.put('/:id',authMiddleware,updatePostCtrl);
postRoute.delete('/:id',authMiddleware,deletePostCtrl);

postRoute.post("/report-post",authMiddleware, reportPostController);
postRoute.get("/reported-list",fetchReportedPostController);


postRoute.post("/save",authMiddleware,savePostController);
postRoute.get("/saved-list",authMiddleware,fetchSavedPostController);
postRoute.delete("/saved/:id",authMiddleware,deleteSavedPostController);

// postRoute.get("/search-post",searchPostController);

module.exports= postRoute;