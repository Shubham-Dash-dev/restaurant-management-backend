const AppDataSource = require('../../database/data-source');
const Category = require('./category.entity');

const categoryRepository = AppDataSource.getRepository(Category);

//find category by name
const findCategoryByName = async(name)=>{
    return await categoryRepository.findOne({
        where : {name}
    })
};

//find category by id
const findCategoryById = async(id)=>{
    return await categoryRepository.findOne({
        where : {id}
    })
}

// create new category 
const createCategory = async(categoryData)=>{
    const newCategory = categoryRepository.create(categoryData);

    return await categoryRepository.save(newCategory);
};


//find all categories with active filter 
const findAllCategories = async(onlyActive = true)=>{
    const queryBuilder = categoryRepository.createQueryBuilder("category").where("category.deletedAt IS NULL");
    // if onlyActive is true then fetch only active categories = customer // otherwise all categories = admin 
    if(onlyActive){
        queryBuilder.andWhere("category.isActive = :isActive", { isActive: true });
    }
    queryBuilder.orderBy("category.name", "ASC");
    return await queryBuilder.getMany();
};


//update category 
const updateCategoryById = async(id,updateData)=>{
    await categoryRepository.update(id,updateData);
    return await findCategoryById(id);
}


// soft delete category 
const softDeleteCategoryById = async(id)=>{
   await categoryRepository.update(id,{
    isActive:false
   });
   
    return await categoryRepository.softDelete(id);
    
}

module.exports = {
    findCategoryByName,
    findCategoryById,
    createCategory,
    findAllCategories,
    updateCategoryById,
    softDeleteCategoryById
}