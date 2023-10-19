module.exports = (Sequelize, sequelize, DataTypes) => {
    const Session = sequelize.define(
      "session",
      {
        // Model attributes are defined here
        type: {
          type: Sequelize.STRING(145),
          allowNull: false,
          validate: {
            isIn: {
              args: [["superAdmin", "admin", 'practitioner']],
              msg: "Please select proper role for user"
            }
          }
        },
        accessToken: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        refreshToken: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        sessionUserId: {
          type: DataTypes.INTEGER
        }
      },
      {
        sequelize
      }
    );
    Session.associate = function (models) {
      Session.hasOne( models.admins, { as: 'adminId', foreignKey: 'sessionUserId' } );
      Session.hasOne( models.user, { as: 'userId', foreignKey: 'sessionUserId' } );
    }

    return Session;
  };
  