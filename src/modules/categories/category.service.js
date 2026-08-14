const categoryRepository = require('./category.repository');

// create category 
module.exports.createCategory = async(categoryData)=>{
const existing = await categoryRepository.findCategoryByName(categoryData.name);
if(existing){
    throw new Error("Category with this name already exists");
}
return await categoryRepository.createCategory(categoryData);

}

// get all categories (public gets active only , admin can view all)
module.exports.getAllCategories = async(userRole)=>{
    // if user is customer => only active categories must be shown to user 
    // if user is admin => all categories must be shown to admin 
    const onlyActive = userRole !== "ADMIN" && userRole !== "STAFF";
    return await categoryRepository.findAllCategories(onlyActive);
}

// get category by id
module.exports.getCategoryById = async(id)=>{
    const category =  await categoryRepository.findCategoryById(id);
    if(!category){
        throw new Error("Category not found");
    }
    return category;
}

// update category 
module.exports.updateCategory = async(id, updateData)=>{
  const category = await categoryRepository.findCategoryById(id);
  if(!category){
    throw new Error("Category not found");
  }  

  if(updateData.name && updateData.name !== category.name){
    const existing = await categoryRepository.findCategoryByName(updateData.name);
    if(existing) {
        throw new Error("Category with this name already exists");
    }
  }

  return await categoryRepository.updateCategoryById(id,updateData);

}

//delete category 
module.exports.deleteCategory = async(id)=>{
     const category = await categoryRepository.findCategoryById(id);
    if(!category){
        throw new Error("Category not found");
    } 
    return await categoryRepository.softDeleteCategoryById(id);

}