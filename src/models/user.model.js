const { Op } = require("sequelize");
module.exports = (Sequelize, sequelize, DataTypes) => {

  const User = sequelize.define(
    "user",
    {
      // Model attributes are defined here
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      uniqueId: {
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4, // Use UUIDV4 to generate a random UUID
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Practitioner first name must be at least 3 characters long"
              );
            }
          },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Full name cannot be null."
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUnique: async (value, next) => {
            const existingRecord = await User.findOne({
              where: {
                email: value,
                deletedAt: {
                  [Op.is]: null, // Check that 'deletedAt' is null
                },
              },
            });
            if (existingRecord && existingRecord.id !== this.id) {
              return next('Email must be a unique records');
            }
            next();
          },
          isEmail: {
            msg: "Invalid email address",
          },
        },
      },
      countryCode: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Please provide an country code.',
          }
        }
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUnique: async  (value, next) => {
            const existingRecord = await User.findOne({
              where: {
                email: value,
                deletedAt: {
                  [Op.is]: null, // Check that 'deletedAt' is null
                },
              },
            });
            if (existingRecord && existingRecord.id !== this.id) {
              return next('Phone number must be a unique.');
            }
            next();
          },
          notNull: {
            msg: 'Please provide an phone number.',
          },
          isPhoneNumber: function (value) {
            // Define a regular expression for a simple phone number validation
            const phoneRegex = /^\d{10}$/;
    
            if (!phoneRegex.test(value)) {
              throw new Error('Invalid phone number format');
            }
          },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.BOOLEAN, 
        allowNull: false,
        defaultValue: 1
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
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
      paranoid: true,
    }
  );
  // `sequelize.define` also returns the model
  // console.log(User === sequelize.models.user); // true
  return User;
};
