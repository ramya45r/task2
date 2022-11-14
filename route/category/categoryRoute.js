const express =require('express');
const { createCategoryCtrl,fetchCategoriesCtrl,fetchCategoryCtrl,updateCategoryCtrl,deleteCategoryCtrl } = require('../../controllers/category/categoryCtl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');

const categoryRoute =express.Router();

categoryRoute.post('/',authMiddleware,createCategoryCtrl);


categoryRoute.get('/',authMiddleware,fetchCategoriesCtrl);
categoryRoute.get('/:id',authMiddleware,fetchCategoryCtrl);
categoryRoute.put('/:id',authMiddleware,updateCategoryCtrl);
categoryRoute.delete('/:id',authMiddleware,deleteCategoryCtrl);
module.exports =categoryRoute;