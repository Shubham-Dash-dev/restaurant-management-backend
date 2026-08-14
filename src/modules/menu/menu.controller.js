const menuService = require('./menu.service');
const { sendSuccess, sendError } = require('../../utils/responseHandler');


module.exports.createMenuItem = async(req,res,next)=>{
    try{
       const item = await menuService.createMenuItem(req.body);
       return sendSuccess(res,201,"Menu item created successfully",item);
    }catch(error){
       return sendError(res,400,error.message,error);
    }
}


module.exports.getAllMenuItems = async(req,res,next)=>{
    try{
        const userRole = req.user ? req.user.role : null;
        const result = await menuService.getAllMenuItems(req.query, userRole);
        return sendSuccess(res, 200, "Menu items fetched successfully", result);

    }catch(error){
        return sendError(res, 400, error.message , error);
    }
};


module.exports.getMenuItemById = async(req,res,next)=>{
    try{
       const item = await menuService.getMenuItemById(req.params.id);
       return sendSuccess(res,200, "Menu item fetched successfully", item);
    }catch(error){
       return sendError(res, 404, error.message, error);
    }
};


module.exports.updateMenuItem = async(req,res,next)=>{
    try{
       const item = await menuService.updateMenuItem(req.params.id,req.body);
       return sendSuccess(res, 200 , "Menu item updated successfully", item);
    }catch(error){
       return sendError(res,400,error.message, error);
    }
}


module.exports.toggleAvailability = async(req,res,next)=>{
    try{
        const item = await menuService.toggleAvailability(req.params.id);
        return sendSuccess(res, 200,`Menu item is now ${item.isAvailable ? "Available" : "Out of Stock"}`, item);
    }catch(error){
        return sendError(res, 400, error.message, error);
    }
}


module.exports.deleteMenuItem = async(req,res,next)=>{
    try{
        await menuService.deleteMenuItem(req.params.id);
        return sendSuccess(res, 200, "Menu item deleted successfully");
    }catch(error){
        return sendError(res, 404, error.message, error);
    }
};