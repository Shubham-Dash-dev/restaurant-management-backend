const AppDataSource = require('../../database/data-source');
const MenuItem = require('./menu.entity');

const menuRepository = AppDataSource.getRepository(MenuItem);


// create new menu item 
const createMenuItem = async(itemData) =>{
    const newItem = menuRepository.create(itemData);
    return await menuRepository.save(newItem);
}

// find menu item by id (with category relation joined)
const findMenuItemById = async(id)=>{ // While finding this MenuItem, also load its related Category.//Use that relationship and fetch the related Category too.
    return await menuRepository.findOne({
        where : {id},
        relations: {
            category: true,
        },
    });
};

// find menu item by name and category
//In a restaurant, you cannot have two items named "Farmhouse Pizza" inside the "Pizza" category (it causes confusion and duplicate orders).
//However, having "Garlic Bread" in "Starters" and "Garlic Bread" in "Combos" is permissible across different categories.
const findMenuItemByNameAndCategory = async(name, categoryId)=>{
    return await menuRepository.findOne({
        where : {name,categoryId}
    })
};


// find all menu items with search, filters, sorting & pagination
const findAllMenuItems = async ({
  page = 1,
  limit = 10,
  categoryId,
  isVeg,
  isAvailable,
  search,
  sort,
}) => {
  const skip = (page - 1) * limit;
  const queryBuilder = menuRepository
    .createQueryBuilder("menuItem")
    .leftJoinAndSelect("menuItem.category", "category") //Join the Category table with MenuItem and also include the Category data in the result.
    //SELECT menuItem.*, category.*
    // FROM menu_items menuItem
    // LEFT JOIN categories category
    //    ON menuItem.category_id = category.id
    .where("menuItem.deletedAt IS NULL")
    //if category was soft-deleted, category.deletedAt is NOT null -> Excluded!
    .andWhere("category.deletedAt IS NULL");
  
    // filter by Category
  if (categoryId) {
    queryBuilder.andWhere("menuItem.categoryId = :categoryId", { categoryId });
    // AND menuItem.category_id = 'abc-123'
    // So only menu items belonging to that category are returned.
  }
  
  // filter by Veg/Non-Veg
  if (isVeg !== undefined) {
    queryBuilder.andWhere("menuItem.isVeg = :isVeg", {
      isVeg: isVeg === "true" || isVeg === true,
    });
  }
  
  // filter by kitchen availability
  if (isAvailable !== undefined) {
    queryBuilder.andWhere("menuItem.isAvailable = :isAvailable", {
      isAvailable: isAvailable === "true" || isAvailable === true,
    });
    // If we are filtering by availability (e.g. for customers), only show items of active categories:
  if (isAvailable === true || isAvailable === "true") {
    queryBuilder.andWhere("category.isActive = :catActive", { catActive: true });
  }
}
  
  // search by name or description
  if (search) {
    queryBuilder.andWhere(  // ILIKE is case-insensitive matching in PostgreSQL.
      // `%${search}%` => `%pizza%`  % means: Anything can appear before or after this word. eg : Pizza ,Cheese Pizza ,Chicken Pizza ,Pizza with extra cheese
      "(menuItem.name ILIKE :search OR menuItem.description ILIKE :search)",
      { search: `%${search}%` }
    );
  }

  // sorting (e.g. ?sort=price or ?sort=-price or ?sort=name)
  const ALLOWED_SORT_FIELDS = ["name", "price", "createdAt", "isVeg", "isAvailable"];
  if (sort) {
    const isDesc = sort.startsWith("-");
    const field = isDesc ? sort.substring(1) : sort;
    if (ALLOWED_SORT_FIELDS.includes(field)) {
      queryBuilder.orderBy(`menuItem.${field}`, isDesc ? "DESC" : "ASC");
    } else {
      queryBuilder.orderBy("menuItem.createdAt", "DESC");
    }
  }else{
    queryBuilder.orderBy("menuItem.createdAt", "DESC");
  }

  // Pagination
  return await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();
    //menuItems → current page's records
    //total     → total matching records
    //[menuItems,total]
};


// update menu item 
const updateMenuItemById = async (id, updateData) =>{
    await menuRepository.update(id,updateData);
    return await findMenuItemById(id);
}

// soft delete menu item
const softDeleteMenuItemById = async(id)=>{
    await menuRepository.update(id , {isAvailable : false});
    return await menuRepository.softDelete(id);
}

module.exports = {
    createMenuItem,
    findMenuItemById,
    findMenuItemByNameAndCategory,
    findAllMenuItems,
    updateMenuItemById,
    softDeleteMenuItemById,
}