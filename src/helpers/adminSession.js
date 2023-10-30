const { Op } = require("sequelize");
const { db } = require("../config/dbConnection");
const Session = db.session;
const Admin = db.admin;

/**
 * Find any token inside session table in database
 * with id and type of admin and token inside request
 */
const findToken = async (id, token, type) => {

  // console.log("in findTokjenid, token, type =====> ", id, token, type);

  try {
    const adminData = await Admin.findOne({
      where: {
        id
      },
    });

    // console.log("adminData =====> ", adminData);

    if (adminData) {

      // console.log("inside if block adminData =====> ",);

      const adminSessionData = await Session.findOne({
        where: {
          id: id,
          type: type,
          [Op.or]: [{ accessToken: token }, { refreshToken: token }],
        },
      });
      // console.log("admin session Data =====> ", adminSessionData);
      
      return adminSessionData;
    } else {
      return null;
    }
  } catch (error) {
    console.log(" error catch block find token")
    return null;
  }
};

/**
 * Find session with id in session table and also create
 * new if not exits with id and type of admin
 */

const findAndCreateSessionWithID = async (id, type) => {
  try {
    const adminData = await Admin.findOne({
      where: {
        id
      },
    });
    if (adminData) {
      const adminFindorCreateSessionData = await Session.findOrCreate({
        where: {
          sessionUserId: id,
          type: type,
        },
        default: {
          accessToken: null,
          refreshToken: null,
        },
      });
      return adminFindorCreateSessionData;
    } else {
      return null;
    }
  } catch (error) {
    // console.log(error)
    return null;
  }
};

/**
 * Update access and refresh token with id and type
 *  inisde session table
 */

const updateSessionWithID = async (id, token, refreshJWTToken, type) => {
  try {
    
    const adminData = await Admin.findOne({
      where: {
        id
      },
    });

    if (adminData) {
      const adminUpdatedSessionData = await Session.update(
        {
          accessToken: token,
          refreshToken: refreshJWTToken,
          updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        },
        {
          where: {
            sessionUserId: id,
            type: type,
          },
        }
      );
      return adminUpdatedSessionData;
    } else {
      return null;
    }
  } catch (error) {
    // console.log(error)
    return null;
  }
};

/**
 * clear all access and refresh tokens inisde session table
 */
const clearAllSession = () => {
  return Session.update({
    accessToken: null,
    refreshToken: null,
    updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  });
};

module.exports = {
  findToken,
  findAndCreateSessionWithID,
  updateSessionWithID,
  clearAllSession,
};
