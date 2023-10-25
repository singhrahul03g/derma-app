
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const saltRounds = process.env.BCRYPT_SALTROUNDS;

const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  POOL_MAX,
  POOL_MIN,
  POOL_ACQUIRE,
  POOL_IDLE,
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  logging: false,
  dialect: "mysql",
  operatorsAliases: false,
  pool: {
    max: parseInt(POOL_MAX),
    min: parseInt(POOL_MIN),
    acquire: POOL_ACQUIRE,
    idle: POOL_IDLE,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.role = require("../models/role.model")(sequelize, DataTypes);
db.session = require("../models/session.model")(Sequelize, sequelize, DataTypes);
db.emailTemplate = require("../models/emailTemplate.model")(sequelize, DataTypes);
db.admin = require("../models/admin.model")(Sequelize, sequelize, DataTypes);
db.user = require("../models/user.model")(Sequelize, sequelize, DataTypes);

db.admin.hasMany(db.user); // Define the foreign key relationship
db.user.belongsTo(db.admin);
db.role.hasMany(db.admin);
db.admin.belongsTo(db.role);

db.sequelize.sync({ force: true });
console.log("db inside dbConnection");

module.exports = { sequelize, db };
