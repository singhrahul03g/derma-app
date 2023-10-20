const fs = require("fs");
const bcrypt = require("bcrypt");
const path = require("path");

const { db } = require("../config/dbConnection");

const Admin = db.admin;
const EmailTemplate = db.emailTemplate;
const Role = db.role;
const saltRounds = process.env.BCRYPT_SALTROUNDS;

const roleseeding1 = async (req, res) => {
  await Role.create([
    { name: "superAdmin" },
    { name: "admin" },
    { name: "practitioner" }
  ]);
}

const roleseeding  = async (req, res) => {
  Role.findOne({
    where: { name: "superAdmin" }, // Specify the search criteria
  }).then((role) => {
    if (!role) {
      Role.bulkCreate([
        { name: "superAdmin" },
        { name: "admin" },
        { name: "practitioner" },
        // Add more roles here
      ])
        .then(async (roles) => {
          // console.log("roles");
          // console.log(roles);
          const salt = await bcrypt.genSalt(parseInt(saltRounds));
          let adminDetails = {
            name: "Testing Admin",
            email: "abc123@yopmail.com",
            password: await bcrypt.hash("123456", salt),
          };
          let admin = await Admin.create(adminDetails);
          let { uniqueId, id, name, email } = admin.dataValues;
          admin.update({
            roleId: roles[0].dataValues.id,
          });
          return res.status(200).json({ msg: "Admin inserted successfully." });
        })
        .catch((error) => {
          //   console.error("Error inserting roles:", error);
          return res.status(400).json({ msg: "Error inserting roles" });
        });
    }
  }).catch((error) => {
    //   console.error("Error inserting roles:", error);
    return res.status(400).json({ msg: "Error inserting roles" });
  });;
};

const emailTemplateseeding = async (req, res) => {
  let templates = ["welcome", "forgotPassword"];
  let templateData = [];
  templates.forEach((value) => {
    let content =
      path.resolve(path.dirname("")) +
      "/src/email_templates/" +
      value +
      ".html";
    let data = fs.readFileSync(content);
    let html = data.toString();
    let templateDetails = {
      title: value,
      slug: `${value}_template`,
      context: html,
    };
    //   console.log(templateDetails)
    templateData.push(templateDetails);
  });
  EmailTemplate.bulkCreate(templateData)
    .then((template) => {
      // console.log("Templates: ", template);
      return res
        .status(200)
        .json({ msg: "Email templates seeded successfully." });
    })
    .catch((err) => {
      return res.status(400).json({ msg: "Error in creating seeding" });
    });
};

module.exports = {
  roleseeding,
  emailTemplateseeding,
};
