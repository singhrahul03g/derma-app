module.exports = (Sequelize, sequelize, DataTypes) => {
  const Patient = sequelize.define(
    "patient",
    {
      // Model attributes are defined here
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
                "Patient's first name must be at least 3 characters long"
              );
            }
          }
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
      claimNumber: {
        type: DataTypes.STRING(145),
        allowNull: false,
        validate: {
          notNull: {
            msg: "Claim Number cannot be empty."
          },
          isUniqueNamePerUserId: async function (value) {
            const existingPatient = await Patient.findOne({
              where: {
                userId: this.userId,
                claimNumber: value,
              },
            });
    
            if (existingPatient) {
              throw new Error("Claim Number must be unique.");
            }
          },
        },
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true, // Ensures that the value is a valid date
        },
      },
      dateOfInjury: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true, // Ensures that the value is a valid date
        },
      },
      preInjuryRole: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            arg: true,
            msg: "Pre-Injury Role cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's pre-Injury role must be at least 3 characters long"
              );
            }
          }
        },
      },
      workStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Work status cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's work status must be at least 3 characters long"
              );
            }
          }
        },
      },
      preInjuryEmployer: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Pre-Injury Employer cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's pre-Injury employer must be at least 3 characters long"
              );
            }
          }
        },
      },
      currentWorkCapacity: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Current work capacity cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's current work capacity must be at least 3 characters long"
              );
            }
          }
        },
      },
      preInjuryHours: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Pre-Injury Hours cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's pre-Injury hours must be at least 3 characters long"
              );
            }
          }
        },
      },
      currentCapacityHours: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Current capacity hours cannot be empty."
          },
          isAtLeastThreeCharacters(value) {
            if (value.length < 3) {
              throw new Error(
                "Patient's current capacity hours must be at least 3 characters long"
              );
            }
          }
        },
      },
      diagnosis: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Diagnosis cannot be empty."
          },
          isAtLeastTenCharacters(value) {
            if (value.length < 10) {
              throw new Error(
                "Diagnosis must be at least 10 characters long"
              );
            }
          }
        },
      },
      // address: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   validate: {
      //     notNull: {
      //       msg: "Address cannot be empty."
      //     },
      //   },
      // },
    },
    {
      // Other model options go here
      //   tableName: "users",
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
  console.log(Patient === sequelize.models.patient); // true
  return Patient;
};
