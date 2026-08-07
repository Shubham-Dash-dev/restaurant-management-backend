const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const userEntity = new EntitySchema({
    name: "User",
    tableName: "users",

    columns: {
        
        ...BaseEntity,

        fullName: {
            name: "full_name",
            type: "varchar",
            length: 100,
            nullable: false,
        },

        email: {
            type: "varchar",
            length: 150,
            unique: true,
            nullable: false,
        },

        password: {
            name: "password_hash",
            type: "varchar",
            length: 255,
            nullable: false,
        },

        phone: {
            type: "varchar",
            length: 15,
            unique: true,
            nullable: true,
        },

        role: {
            type: "enum",
            enum: ["ADMIN", "STAFF", "CUSTOMER"],
            default: "CUSTOMER",
            nullable: false,
        },

        isActive: {
            name: "is_active",
            type: "boolean",
            default: true,
            nullable: false,
        },

        refreshToken: {
            name: "refresh_token",
            type: "varchar",
            nullable: true,
        },

        deletedAt: {
            name: "deleted_at",
            type: "timestamp",
            deleteDate: true,
            nullable: true,
        },
    },
});


module.exports = userEntity;