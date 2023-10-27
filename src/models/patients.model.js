module.exports = (Sequelize, sequelize, DataTypes) => {
    const Patient = sequelize.define(
      "patient",
      {
        // Model attributes are defined here
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        uniqueId: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4, // Use UUIDV4 to generate a random UUID
        },
        name: {
          type: DataTypes.STRING(145),
          // unique: {
          //   name: "uniqueName",
          //   message: "Patient name must be unique.",
          // },
          allowNull: false,
          validate: {
            isAtLeastThreeCharacters(value) {
                const valueLength = value.length;
              if (valueLength <= 3) {
                throw new Error( "Patient name must be at least 3 characters" );
              }else if(valueLength >= 50){
                throw new Error( "Patient name must be at most 50 characters" );
              }
            },
          },
        },
        email: {
          type: DataTypes.STRING(145),
          unique: {
            name: "uniqueEmail",
            message: "Email must be unique.",
          },
          allowNull: false,
          validate: {
            isEmail: {
              message: "Invalid email address",
            },
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: true
        }
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
  
    // `sequelize.define` also returns the model
    // console.log(Patient === sequelize.models.patient); // true
    return Patient;
  };
  