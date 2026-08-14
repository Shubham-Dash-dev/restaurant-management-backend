const categoryService = require('./category.service');
const { sendSuccess, sendError } = require("../../utils/responseHandler");


module.exports.createCategory = async(req,res,next)=>{
   try{ 
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res,201,'Category created successfully',category);
   }catch(error){
    return sendError(res,400,error.message,error);
   }
}

module.exports.getAllCategories = async(req,res,next)=>{
    try{
        const userRole = req.user ? req.user.role : null;
        const categories = await categoryService.getAllCategories(userRole);
        return sendSuccess(res,200,"Categories fetched successfully",categories);
    }catch(error){
        return sendError(res,400,error.message,error);
    }
}

module.exports.getCategoryById = async(req,res,next)=>{
    try{
      const category = await categoryService.getCategoryById(req.params.id);
      return sendSuccess(res,200,"Category fetched successfully",category);
    }catch(error){
        return sendError(res,404,error.message,error)
    }
}

module.exports.updateCategory = async(req,res,next)=>{
    try{
     const category = await categoryService.updateCategory(req.params.id,req.body);
     return sendSuccess(res,200,"Category updated successfully",category);
    }catch(error){
      return sendError(res,400,error.message,error);
    }
}

module.exports.deleteCategory = async(req,res,next)=>{
    try{
        await categoryService.deleteCategory(req.params.id);
        return sendSuccess(res, 200, "Category deleted successfully");
    }catch(error){
        return sendError(res,400,error.message,error);
    }
}