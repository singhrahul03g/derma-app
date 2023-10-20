const bcrypt = require("bcrypt");
const path = require("path");
const { Op } = require("sequelize");
const _ = require("lodash");

const errorHandler = require("../helpers/errorHandler");
const { db, sequelize } = require("../config/dbConnection");
const { generateToken, refreshToken } = require("../helpers/jwtToken");
const { mailDetails, sendMail } = require("../helpers/emailTransporter");
const {
  findAndCreateSessionWithID,
  updateSessionWithID,
} = require("../helpers/userSession");

const User = db.user;
const Roles = db.role;
const Categories = db.category;
const Prompts = db.prompt;
const Patients = db.patient;
const saltRounds = process.env.BCRYPT_SALTROUNDS;

// Get html of template
async function getHtmlContent(templateName, replaceData) {
  return await db.emailTemplate
    .findOne({ where: { slug: templateName } })
    .then((template) => {
      const data = template.dataValues.context;
      let html = data.toString();

      _.keys(replaceData).forEach((key) => {
        html = html.replace(key, replaceData[key]);
      });
      return html;
    });
}

// Login of admin
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email === "undefined" || typeof password === "undefined") {
    return next(errorHandler(400, "Invalid request"));
  }
  // Authenticate the user (you can use bcrypt or other methods for password hashing)
  const user = await User.findOne({
    include: [
      {
        model: Roles,
      },
    ],
    where: { email },
  });

  if (!user) {
    return next(errorHandler(401, "Invalid credentials"));
  } else {
    const dbData = user.dataValues;
    bcrypt.compare(password, dbData.password, async (error, response) => {
      if (response) {
        // console.log(dbData);
        let {
          id,
          uniqueId,
          firstName,
          lastName,
          email,
          countryCode,
          phoneNumber,
          address,
        } = dbData;
        let userName = `${firstName}${!lastName ? "" : " " + lastName}`;
        let roleName = user.dataValues.role.dataValues.name;

        await findAndCreateSessionWithID(id, roleName);

        const token = generateToken({
          id,
          uniqueId,
          firstName,
          lastName,
          email,
          countryCode,
          phoneNumber,
          address,
          userName,
          roleName,
        });
        const refreshJWTToken = refreshToken({
          id,
          uniqueId,
          firstName,
          lastName,
          email,
          countryCode,
          phoneNumber,
          address,
          userName,
          roleName,
        });
        await updateSessionWithID(id, token, refreshJWTToken, roleName);

        return res.status(200).json({
          token: token,
          // expiresIn: "3h",
          refreshToken: refreshJWTToken,
          // refreshExpiresIn: "2d",
          msg: "Login successfully.",
        });
      } else {
        return next(errorHandler(401, "Invalid credentials"));
      }
    });
  }
};

/**
 * Forgot password function firstly check the expire time
 * and can be access from outside api
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (typeof email === "undefined") {
    return next(errorHandler(400, "Invalid request"));
  }
  const user = await User.findOne({
    include: [
      {
        model: db.role,
        attribute: ["name"],
      },
    ],
    where: { email },
  });
  // console.log(user);
  if (!user) {
    return res.status(200).json({ msg: "Email sent successfully." });
  } else {
    let {
      id,
      uniqueId,
      firstName,
      lastName,
      email,
      countryCode,
      phoneNumber,
      address,
    } = user;
    let userName = `${firstName}${!lastName ? "" : " " + lastName}`;
    let roleName = user.dataValues.role.dataValues.name;

    await findAndCreateSessionWithID(id, roleName);
    await updateSessionWithID(id, null, null, roleName);

    const token = generateToken({
      id,
      uniqueId,
      firstName,
      lastName,
      email,
      countryCode,
      phoneNumber,
      address,
      roleName,
      userName,
    });
    user.update({
      token: token,
    });
    // console.log(token);
    const url = process.env.FRONTEND_URL;
    let activationURL = path.join(url, `resetPassword?token=${token}`);

    let replaceData = {
      NAME: userName,
      URL: activationURL,
    };

    html = await getHtmlContent("forgotPassword_template", replaceData);

    const mailData = mailDetails(
      "Reset Password",
      `Reset your password ${firstName}`,
      email,
      html
    );
    sendMail(mailData);

    return res.status(200).json({ msg: "Email sent successfully." });
  }
};

/**
 * Change password function firstly check the expire time
 * and can be access from inside api
 */
const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const email = req.user.email;

  if (
    typeof oldPassword === "undefined" &&
    typeof newPassword === "undefined"
  ) {
    return next(errorHandler(400, "Invalid request"));
  }

  let user = await User.findOne({
    include: [
      {
        model: Roles,
      },
    ],
    where: {
      email,
      token: null,
    },
  });
  // console.log(user);
  if (!user) {
    return res.status(400).json({ msg: "Error updating password." }); // Change password(400).json({ msg: "user not found." });
  } else {
    const dbData = user.dataValues;
    bcrypt.compare(oldPassword, dbData.password, async (error, response) => {
      if (response) {
        const roleName = dbData.role.dataValues.name;
        // let newPassword = newPassword;
        User.prototype.updatePassword = async function (newPassword) {
          const salt = await bcrypt.genSalt(parseInt(saltRounds));
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          this.password = hashedPassword;
          this.token = null;
          await this.save();
        };
        await findAndCreateSessionWithID(dbData.id, roleName);
        await updateSessionWithID(dbData.id, null, null, roleName);

        user.updatePassword(newPassword);
        return res.status(200).json({ msg: "Password updated successfully" });
      } else {
        return next(errorHandler(401, "Invalid credentials"));
      }
    });
  }
};

/**
 * Reset and set password function firstly check the expire time
 * and then check the admin database for having token or null
 */
const resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const email = req.user.email;

  if (typeof password === "undefined") {
    return next(errorHandler(400, "Invalid request"));
  }

  let user = await User.findOne({
    where: {
      email,
      token: {
        [Op.not]: null,
      },
    },
  });
  if (!user) {
    return res.status(400).json({ msg: "Error updating password." });
  } else {
    let newPassword = password;
    User.prototype.updatePassword = async function (newPassword) {
      const salt = await bcrypt.genSalt(parseInt(saltRounds));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      this.password = hashedPassword;
      this.token = null;
      await this.save();
    };

    user.updatePassword(newPassword);
    return res.status(200).json({ msg: "Password updated successfully" });
  }
};
const setPassword = async (req, res, next) => {
  const { password } = req.body;
  const email = req.user.email;

  if (typeof password === "undefined") {
    return next(errorHandler(400, "Invalid request"));
  }

  let user = await User.findOne({
    where: {
      email,
      password: {
        [Op.is]: null,
      },
      token: {
        [Op.not]: null,
      },
    },
  });
  if (!user) {
    return res.status(400).json({ msg: "Error updating password." });
  } else {
    let newPassword = password;
    User.prototype.updatePassword = async function (newPassword) {
      const salt = await bcrypt.genSalt(parseInt(saltRounds));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      this.password = hashedPassword;
      this.token = null;
      await this.save();
    };

    user.updatePassword(newPassword);
    return res.status(200).json({ msg: "Set password successfully" });
  }
};

/**
 * Refresh token will update the new token and refresh tokens in session table
 */
const refreshTokenAPI = async (req, res) => {
  let {
    id,
    uniqueId,
    firstName,
    lastName,
    email,
    countryCode,
    phoneNumber,
    address,
    roleName,
    userName,
  } = req.user;
  let refreshToken = req.refreshToken;

  try {
    await findAndCreateSessionWithID(id, roleName);
    const token = generateToken({
      id,
      uniqueId,
      firstName,
      lastName,
      email,
      countryCode,
      phoneNumber,
      address,
      roleName,
      userName,
    });
    await updateSessionWithID(id, token, refreshToken, roleName);

    return res.status(200).json({
      token: token,
      msg: "Token is updated successfully.",
    });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

/**
 * Logout will null user's session token and refresh token in session table
 */
const logout = async (req, res) => {
  let userData = req.user;
  const { id, roleName } = userData;
  await updateSessionWithID(id, null, null, roleName);
  return res.json({
    status: 200,
    msg: "Logout succesfully.",
  });
};

/**
 * Add new category to categories table
 */
const addCategory = async (req, res, next) => {
  let { title, description } = req.body;
  let userData = req.user;
  let categoryDetails = {
    title,
    description,
    userId: userData.id,
  };
  try {
    await Categories.create(categoryDetails);
    return res.json({
      status: 200,
      msg: "Added category succesfully.",
    });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

/**
 * Active and deactive category status
 */
const changeCategoryStatus = async (req, res, next) => {
  const { uniqueId } = req.params;
  let { status } = req.body;
  if (status !== 0 || status !== 1) {
    return res
      .status(404)
      .json({ message: `Please provide a proper status for category.` });
  }
  try {
    const statusData = await Categories.findOne({
      where: {
        uniqueId,
      },
    });
    if (statusData !== null) {
      await statusData.update({ status });

      return res
        .status(200)
        .json({
          message: `Category is ${
            status === 0 ? "deactivated" : "actived"
          }.`,
        });
    }
    return res.status(404).json({ message: `Category is not found.` });
  } catch (err) {
    err.errors.forEach((err) => {
      next(errorHandler(400, err.message));
    });
  }
};

/**
 * Edit category to categories table
 */
const editCategory = async (req, res, next) => {
  let { uniqueId } = req.params;
  let { title, description } = req.body;
  try {
    const category = await Categories.findOne({ where: { uniqueId } });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (title) category.title = title;
    if (description) category.description = description;

    await category.save();

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

// Category List
const categoriesList = async (req, res, next) => {
  const { searchText } = req.body;
  let { id } = req.user;
  let searchBy = {};
  if(searchText !== undefined && searchText !== ""){
    searchBy[Op.or] = [
      {
        title: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },
      {
        description: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },

    ]
  }
  searchBy.userId = id
  await Categories.findAndCountAll({
    where: searchBy,
    include: [User],
    order: [["updatedAt", "DESC"]],
  })
    .then((data) => {
      const {count, rows} = data
      const categoriesData = [];
      rows.forEach((category) => {
        let categoryArr = {};
        let { title, uniqueId, description } = category.dataValues;
        categoryArr["title"] = title;
        categoryArr["uniqueId"] = uniqueId;
        categoryArr["description"] = description;
        categoriesData.push(categoryArr);
      });
      return res.status(200).json({
        totalCount: count,
        data: categoriesData,
        msg: "Categories list.",
      });
    })
    .catch((err) => {
      // console.log(err);
      if (!err.errors) {
        return next(
          errorHandler(500, "Server internal error. Please try after some time.")
        );
      } else {
        return err.errors.forEach((err) => {
          next(errorHandler(400, err.message));
        });
      }
    });
    
};

// Delete category
const deleteCategory = async (req, res, next) => {
  const { uniqueId } = req.body;
  try {
    const categories = await Categories.findOne({
      where: {
        uniqueId
      }
    });
    if(categories){
      const categoryUpdate = await categories.update({
        uniqueId: `${categories.id} is deleted`
      });
      const categoryDesotry = await categories.destroy();
      return res.status(200).json({
        msg: "Category deleted succesfully.",
      });
    }else{
      return res.status(404).json({
        msg: "Not found",
      });
    }
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

/**
 * Add new prompt in prompts table
 */
const addPrompt = async (req, res, next) => {
  let { title, description, categoryUniqueId } = req.body;
  let { id } = req.user;
  try {
    const category = await Categories.findOne({
      where: {
        uniqueId: categoryUniqueId,
        userId: id
      },
      attributes: ["id"],
    });
    if(category){
      let promptDetails = {
        title,
        description,
        categoryId: category.id,
      };
      await Prompts.create(promptDetails);
      return res.status(200).json({
        msg: "Prompt added succesfully.",
      });
    }else{
      return res.status(404).json({
        msg: "Not found",
      });
    }
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

/**
 * Edit prompt to prompts table
 */
const editPrompt = async (req, res, next) => {
  let { uniqueId } = req.params;
  let { title, description, categoryUniqueId } = req.body;
  try {
    const category = await Categories.findOne({
      where: {
        uniqueId: categoryUniqueId,
      },
      attributes: ["id"],
    });
    const prompt = await Prompts.findOne({ where: { uniqueId } });
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }
    if (title) prompt.title = title;
    if (description) prompt.description = description;
    if (categoryUniqueId) prompt.categoryId = category.id;

    await prompt.save();

    return res.status(200).json({ message: "Prompt updated successfully" });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

/**
 * Active and deactive category status
 */
const changePromptStatus = async (req, res, next) => {
  const { uniqueId } = req.params;
  let { status } = req.body;
  if (status !== 0 || status !== 1) {
    return res
      .status(404)
      .json({ message: `Please provide a proper status for prompt.` });
  }
  try {
    const statusData = await Prompts.findOne({
      where: {
        uniqueId
      },
    });
    if (statusData !== null) {
      await statusData.update({ status });

      return res
        .status(200)
        .json({
          message: `Prompt is ${
            status === 0 ? "deactivated" : "actived"
          }.`,
        });
    }
    return res.status(404).json({ message: `Prompt is not found.` });
  } catch (err) {
    err.errors.forEach((err) => {
      next(errorHandler(400, err.message));
    });
  }
};

// Delete prompt
const deletePrompt = async (req, res, next) => {

  const { uniqueId } = req.body;
  try {
    const prompts = await Prompts.findOne({
      where: {
        uniqueId
      }
    });
    if(prompts){
      await prompts.update({
        uniqueId: `${prompts.id} is deleted`
      });

      await prompts.destroy();

      return res.status(200).json({
        msg: "Prompt deleted succesfully.",
      });
    }else{
      return res.status(404).json({
        msg: "Not found",
      });
    }
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

// Search in prompts table
const promptsList = async (req, res, next) => {
  const { searchText, category, sort, limit, page } = req.body;
  let { id } = req.user;
  let searchBy = {};
  let order = sort ? sort : "desc";
  if(searchText !== undefined && searchText !== ""){
    searchBy[Op.or] = [
      {
        title: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },
      {
        description: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },

    ]
  }
  if(category !== undefined && category !== ""){
    searchBy.categoryId = category
  }
  try {
    const {count, rows} = await Prompts.findAndCountAll({
      where: searchBy,
      include: [
        {
          model: Categories,
          required: true,
          where: {
            userId: id
          }
        }
      ],
      order: [["createdAt", `${order}`]],
      offset: page ? (page - 1) * limit : 0,
      limit: limit ? limit : 10
    });
    if(rows){
      const promptsData = [];
      rows.forEach((prompt) => {
        let promptArr = {};
        let { title, uniqueId, description, categoryId, category } = prompt.dataValues;
        promptArr["categoryId"] = categoryId;
        promptArr["categoryTitle"] = category.title;
        promptArr["title"] = title;
        promptArr["uniqueId"] = uniqueId;
        promptArr["description"] = description;
        promptsData.push(promptArr);
      });
      return res.status(200).json({
        totalCount: count,
        data: promptsData,
        msg: "Prompt searched successfully.",
      });
    }else{
      return res.status(404).json({
        msg: "No data",
      });
    }
  } catch (err) {
    // console.log(err)
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
}

/**
 * Add new patient in prompts table
 */
const addPatient = async (req, res, next) => {
  let {
    firstName,
    lastName,
    dateOfBirth,
    dateOfInjury,
    claimNumber,
    preInjuryRole,
    workStatus,
    preInjuryEmployer,
    currentWorkCapacity,
    preInjuryHours,
    currentCapacityHours,
    diagnosis
  } = req.body;
  let userData = req.user;
  let fullName = `${firstName}${!lastName ? "" : " " + lastName}`;
  let patientDetails = {
    firstName,
    lastName,
    fullName,
    dateOfBirth,
    dateOfInjury,
    claimNumber,
    preInjuryRole,
    workStatus,
    preInjuryEmployer,
    currentWorkCapacity,
    preInjuryHours,
    currentCapacityHours,
    diagnosis,
    userId: userData.id
  };
  try {
    await Patients.create(patientDetails);
    return res.json({
      status: 200,
      msg: "Added patient succesfully.",
    });
  } catch (err) {
    // console.log(err)
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

// Patient List
const patientsList = async (req, res, next) => {
  const { searchText, dob, sort, limit, page } = req.body;
  let { id } = req.user;
  let searchBy = {};
  let order = sort ? sort : "desc";
  if(searchText !== undefined && searchText !== ""){
    searchBy[Op.or] = [
      {
        firstName: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },
      {
        lastName: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },
      {
        fullName: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },
      {
        diagnosis: {
          [Op.like]: sequelize.fn('LOWER', `%${searchText.toLowerCase()}%`),
        },
      },

    ]
  }
  if(dob !== undefined && dob !== ""){
    searchBy.dateOfBirth = {
      [Op.lte]: new Date(dob)
    }
  }
  searchBy.userId = {
    [Op.eq]: id
  }
  await Patients.findAndCountAll({
    where: searchBy,
    include: [User],
    order: [["createdAt", `${order}`]],
    offset: page ? (page - 1) * limit : 0,
    limit: limit ? limit : 10
  })
    .then((data) => {
      const {count, rows} = data
      const patientsData = [];
      rows.forEach((patient) => {
        // console.log("patient.fullName => ", patient)
        let patientArr = {};
        let {
          uniqueId,
          firstName,
          lastName,
          fullName,
          dateOfBirth,
          dateOfInjury,
          claimNumber,
          preInjuryRole,
          workStatus,
          preInjuryEmployer,
          currentWorkCapacity,
          preInjuryHours,
          currentCapacityHours,
          diagnosis
        } = patient.dataValues;
        
        patientArr["uniqueId"] = uniqueId;
        patientArr["firstName"] = firstName;
        patientArr["lastName"] = lastName;
        patientArr["fullName"] = fullName;
        patientArr["claimNumber"] = claimNumber;
        patientArr["dateOfBirth"] = dateOfBirth;
        patientArr["dateOfInjury"] = dateOfInjury;
        patientArr["preInjuryRole"] = preInjuryRole;
        patientArr["preInjuryEmployer"] = preInjuryEmployer;
        patientArr["preInjuryHours"] = preInjuryHours;
        patientArr["currentCapacityHours"] = currentCapacityHours;
        patientArr["workStatus"] = workStatus;
        patientArr["currentWorkCapacity"] = currentWorkCapacity;
        patientArr["diagnosis"] = diagnosis;
        patientsData.push(patientArr);
      });
      return res.status(200).json({
        totalCount: count,
        data: patientsData,
        msg: "Patients list.",
      });
    })
    .catch((err) => {
      // console.log(err);
      if (!err.errors) {
        return next(
          errorHandler(500, "Server internal error. Please try after some time.")
        );
      } else {
        return err.errors.forEach((err) => {
          next(errorHandler(400, err.message));
        });
      }
    });
};

// Get the data of patient 
const getPatientData = async (req, res, next) => {
  let header = req.headers;
  let uniqueId = header.uniqueid;
  if (!uniqueId) {
    return res.status(400).json({ message: "Data is request is not correct" });
  }
  try {
    const patient = await Patients.findOne({ where: { uniqueId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    return res.status(200).json({ 
      data: patient,
      message: "Patient data" 
    });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
}

// Edit patient
const editPatient = async (req, res, next) => {
  let { uniqueId } = req.params;
  let {
    firstName,
    lastName,
    dateOfBirth,
    dateOfInjury,
    claimNumber,
    preInjuryRole,
    workStatus,
    preInjuryEmployer,
    currentWorkCapacity,
    preInjuryHours,
    currentCapacityHours,
    diagnosis
  } = req.body;
  try {
    const patient = await Patients.findOne({ where: { uniqueId } });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (dateOfInjury) patient.dateOfInjury = dateOfInjury;
    if (claimNumber) patient.claimNumber = claimNumber;
    if (preInjuryRole) patient.preInjuryRole = preInjuryRole;
    if (workStatus) patient.workStatus = workStatus;
    if (preInjuryEmployer) patient.preInjuryEmployer = preInjuryEmployer;
    if (currentWorkCapacity) patient.currentWorkCapacity = currentWorkCapacity;
    if (preInjuryHours) patient.preInjuryHours = preInjuryHours;
    if (currentCapacityHours) patient.currentCapacityHours = currentCapacityHours;
    if (diagnosis) patient.diagnosis = diagnosis;

    await patient.save();

    return res.status(200).json({ message: "Patient updated successfully" });
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

// Delete patient
const deletePatient = async (req, res, next) => {

  const { uniqueId } = req.body;
  try {
    const patient = await Patients.findOne({
      where: {
        uniqueId
      }
    });
    if(patient){
      await patient.update({
        uniqueId: `${patient.id} is deleted`
      });

      await patient.destroy();

      return res.status(200).json({
        msg: "Patient deleted succesfully.",
      });
    }else{
      return res.status(404).json({
        msg: "Not found",
      });
    }
  } catch (err) {
    if (!err.errors) {
      return next(
        errorHandler(500, "Server internal error. Please try after some time.")
      );
    } else {
      return err.errors.forEach((err) => {
        next(errorHandler(400, err.message));
      });
    }
  }
};

module.exports = {
  login,
  forgotPassword,
  changePassword,
  resetPassword,
  setPassword,
  logout,
  refreshTokenAPI,
  addCategory,
  editCategory,
  changeCategoryStatus,
  categoriesList,
  deleteCategory,
  addPrompt,
  editPrompt,
  changePromptStatus,
  promptsList,
  deletePrompt,
  addPatient,
  patientsList,
  editPatient,
  deletePatient,
  getPatientData
};
