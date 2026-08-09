const { sendSuccess, sendError } = require("../../utils/responseHandler");
const authService = require("./auth.service");

module.exports.register = async(req,res,next)=>{
    try{
        const result = await authService.register(req.body);
        return sendSuccess(res,201,"User registered successfully",result);
        
    }catch(error){
        return sendError(res,400,error.message,error)
    }
}

module.exports.login = async(req,res,next)=>{
  try{
    const result = await authService.login(req.body);
    return sendSuccess(res,200,"Login successful",result);
  }catch(error){
    return sendError(res,400,error.message,error)
  }

}

module.exports.refreshToken = async(req,res,next)=>{
 try{
    const {refreshToken} = req.body;
   const result = await authService.refreshToken(refreshToken);
   return sendSuccess(res,200,"Token refreshed successfully",result);

 }catch(error){
    return sendError(res,400,error.message,error)
 }

}

// Logout
module.exports.logout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.body.userId;
    // req.body.userId is invalid because we already have protect middleware in
    // logout route so if we try to send only body with userId it will throw an error you are not logged in .
    // so there is no sense of adding this req.body.userId this code will always required bearer token 
    // after sending it , it will attach user to req.user and we can easily get req.user.id
    await authService.logout(userId);
    return sendSuccess(res, 200, "Logout successful");
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};


// Get Profile
module.exports.getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, 200, "Profile fetched successfully", user);
  } catch (error) {
    return sendError(res, 404, error.message, error);
  }
};


// Update Profile
module.exports.updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 200, "Profile updated successfully", updatedUser);
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};


// Change Password
module.exports.changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, 200, "Password changed successfully. Please log in again.");
  } catch (error) {
    return sendError(res, 400, error.message, error);
  }
};