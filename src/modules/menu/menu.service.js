const menuRepository = require('./menu.repository');
const categoryRepository = require('../categories/category.repository');


// create menu item (Admin & Staff)
module.exports.createMenuItem = async(itemData)=>{
   // verify category exists and is active 
   const category = await categoryRepository.findCategoryById(itemData.categoryId);
  //  console.log(category);
   if(!category || !category.isActive){
     throw new Error('Invalid or inactive category selected');
   }

   // Check duplicate dish name in same category
  const existing = await menuRepository.findMenuItemByNameAndCategory(
    itemData.name,
    itemData.categoryId
  );
  // console.log(existing);
  if (existing) {
    throw new Error("A menu item with this name already exists in this category");
  }
  const newItem = await menuRepository.createMenuItem(itemData);
  return await menuRepository.findMenuItemById(newItem.id);
}


// get all menu items (public gets available only, Staff/Admin can filter all)
module.exports.getAllMenuItems = async (queryParams , userRole) =>{
    const cleanQuery = {};
    Object.keys(queryParams).forEach((key)=>{
        cleanQuery[key.trim()] = queryParams[key];
    });

    // Ensure safe pagination bounds (page >= 1, 1 <= limit <= 100)
    const page = Math.max(1, Number(cleanQuery.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(cleanQuery.limit) || 10));
    // const page = Number(cleanQuery.page) || 1;
    // const limit = Number(cleanQuery.limit) || 10;

    // customers are only allowed to see available items 
    let isAvailableFilter = cleanQuery.isAvailable;
    if(userRole !== 'ADMIN' && userRole !== 'STAFF'){
        isAvailableFilter = true;
    }

    const [items , total] = await menuRepository.findAllMenuItems({
        ...cleanQuery,
        page,
        limit,
        isAvailable: isAvailableFilter,
    });

    return {
        items,
        total,
        page,
        limit,
        totalPages : Math.ceil(total / limit),
    };
};

// get menu item by id 
module.exports.getMenuItemById = async(id)=>{
    const item = await menuRepository.findMenuItemById(id);
    if(!item) {
        throw new Error("Menu item not found");
    } 
    return item;
}

// update menu item 
module.exports.updateMenuItem = async (id, updateData) => {
  // Step 1: Ensure the menu item actually exists in the DB
  const item = await menuRepository.findMenuItemById(id);
  if (!item) {
    throw new Error("Menu item not found");
  }
  // Step 2: If the user is moving this item to a new category,
  // verify that the new category exists and is active
  if (updateData.categoryId) {
    const category = await categoryRepository.findCategoryById(updateData.categoryId);
    if (!category || !category.isActive) {
      throw new Error("Invalid or inactive category selected");
    }
  }
  // Step 3: If the name is being updated, verify it doesn't collide with another dish
  if (updateData.name) {
  // If categoryId was changed in updateData, check in the new category; otherwise check in current category
    const catId = updateData.categoryId || item.categoryId;
    const existing = await menuRepository.findMenuItemByNameAndCategory(
      updateData.name,
      catId
    );
    // If another dish with this name exists in this category, throw duplicate error
    if (existing && existing.id !== id) {
      throw new Error("A menu item with this name already exists in this category");
    }
  }
  return await menuRepository.updateMenuItemById(id, updateData);
};


//  Toggle Kitchen Availability (Quick toggle for Chefs/Staff)
module.exports.toggleAvailability = async (id) => {
  const item = await menuRepository.findMenuItemById(id);
  if (!item) {
    throw new Error("Menu item not found");
  }
  const newAvailability = !item.isAvailable;
  return await menuRepository.updateMenuItemById(id, {
    isAvailable: newAvailability,
  });
};


//  Delete Menu Item
module.exports.deleteMenuItem = async (id) => {
  const item = await menuRepository.findMenuItemById(id);
  if (!item) {
    throw new Error("Menu item not found");
  }
  return await menuRepository.softDeleteMenuItemById(id);
};