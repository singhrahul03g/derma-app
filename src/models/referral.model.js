module.exports = (sequelize, DataTypes) => {
    const Referral = sequelize.define(
      "referral",
      {
        
      },
      {
        // Other model options go here
        //   tableName: "users",
        sequelize,
        paranoid: true,
      }
    );
    // `sequelize.define` also returns the model
    // console.log(Referral === sequelize.models.referral); // true
    return Referral;
  };
  