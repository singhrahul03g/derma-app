module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define(
      "role",
      {
        // Model attributes are defined here
        name: {
          type: DataTypes.STRING,
          unique: {
            name: "uniqueName",
            message: "Role name must be unique.",
          },
          allowNull: false,
          validate: {
            isIn: {
              args: [["doctor", "nurse", 'staff']],
              msg: "Please select proper role for user"
            }
          }
        }
      },
      {
        sequelize
      }
    );
  
    return Role;
  };
  