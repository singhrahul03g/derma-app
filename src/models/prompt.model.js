module.exports = (Sequelize, sequelize, DataTypes) => {
  const Prompt = sequelize.define(
    "prompt",
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
        defaultValue: Sequelize.UUIDV4,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUniqueNamePerUserId: async function (value) {
            const existingPrompts = await Prompt.findOne({
              where: {
                categoryId: this.categoryId,
                title: value,
              },
            });
    
            if (existingPrompts) {
              throw new Error('Prompts title must be unique.');
            }
          },
          notNull: {
            msg: "Prompts title cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
              const valueLength = value.length;
            if (valueLength <= 3) {
              throw new Error( "Prompts title must be at least 3 characters" );
            }else if(valueLength >= 50){
              throw new Error( "Prompts title must be at most 50 characters" );
            }
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      indexes: [
        {
          unique: true, // Create a unique index
          fields: ["uniqueId"], // Specify the field(s) for the index
        },
      ],
      sequelize,
      paranoid: true,
    }
  );

  // `sequelize.define` also returns the model
  console.log(Prompt === sequelize.models.prompt); // true
  return Prompt;
};
