module.exports = (Sequelize, sequelize, DataTypes) => {
    const Category = sequelize.define(
      "category",
      {
        // Model attributes are defined here
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uniqueId: {
          allowNull: false,
          type: DataTypes.UUID,
          defaultValue: Sequelize.UUIDV4
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isUniqueNamePerUserId: async function (value) {
              const existingCategory = await Category.findOne({
                where: {
                  userId: this.userId,
                  title: value,
                },
                // paranoid: false, // for checking the deleted row of table
              });
      
              if (existingCategory) {
                throw new Error('Category title must be unique.');
              }
            },
            notNull: {
              msg: "Category title cannot be empty."
            },
            isAtLeastThreeCharacters(value) {
                const valueLength = value.length;
              if (valueLength <= 3) {
                throw new Error( "Category title must be at least 3 characters" );
              }else if(valueLength >= 50){
                throw new Error( "Category title must be at most 50 characters" );
              }
            },
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notNull: {
              args: true,
              msg: 'Category description cannot be null.',
            },
            isAtLeast50Characters(value) {
              const valueLength = value.length;
              if (valueLength <= 50) {
                throw new Error( "Category description must be at least 50 characters" );
              }
            }
          }
        },
      },
      {
        indexes: [
          {
            unique: true, // Create a unique index
            fields: ['uniqueId'], // Specify the field(s) for the index
          },
        ],
        sequelize,
        paranoid: true
      }
    );
    console.log(Category === sequelize.models.category); // true
    return Category;
  };
  