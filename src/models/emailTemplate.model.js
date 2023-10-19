module.exports = (sequelize, DataTypes) => {
    const Email_Templates = sequelize.define(
      "emailTemplates",
      {
        // Model attributes are defined here
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          unique: {
            name: "uniqueTitle",
            message: "Email template title must be unique.",
          },
          allowNull: false,
          validate: {
            isAtLeastThreeCharacters(value) {
                const valueLength = value.length;
              if (valueLength <= 3) {
                throw new Error( "Email template title must be at least 3 characters" );
              }else if(valueLength >= 50){
                throw new Error( "Email template title must be at most 50 characters" );
              }
            },
          },
        },
        slug: {
          type: DataTypes.STRING,
          unique: {
            name: "uniqueSlug",
            message: "Email template slug must be unique.",
          },
          allowNull: false,
          validate: {
            isAtLeastThreeCharacters(value) {
                const valueLength = value.length;
              if (valueLength <= 5) {
                throw new Error( "Email template slug must be at least 5 characters" );
              }
            },
          },
        },
        context: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            isAtLeastThreeCharacters(value) {
                const valueLength = value.length;
              if (valueLength <= 3) {
                throw new Error( "Email template context must be at least 3 characters" );
              }
            },
          },
        }
      },
      {
        sequelize,
        paranoid: true
      }
    );
  
    // `sequelize.define` also returns the model
    console.log(Email_Templates === sequelize.models.emailTemplates); // true
    return Email_Templates;
  };
  