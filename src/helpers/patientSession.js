const { Op } = require("sequelize");
const { db } = require("../config/dbConnection");
const Session = db.session;
const Patient = db.patient;

/**
 * Find any token inside session table in database
 * with id and type of patient and token inside request
 */

const findToken = async (id, token, type) => {
  try {
    const patientData = await Patient.findOne({
      where: {
        id
      },
    });

  
    if (patientData) {
   
      const patientSessionData = await Session.findOne({
        where: {
          id: id,
          type: type,
          [Op.or]: [{ accessToken: token }, { refreshToken: token }],
        },
      });
    
      return patientSessionData;
    } else {
      return null;
    }
  } catch (error) {
    console.log(" error catch block find token")
    return null;
  }
};

/*

 * Find session with id in session table and also create
 * new if not exits with id and type of patient
 */

const findAndCreateSessionWithID = async (id, type) => {
  try {
    const patientData = await Patient.findOne({
      where: {  
        id
      },
    });
    if (patientData) {
      const patientFindorCreateSessionData = await Session.findOrCreate({
        where: {
          sessionUserId: id,
          type: type,
        },
        default: {
          accessToken: null,
          refreshToken: null,
        },
      });
      return patientFindorCreateSessionData;
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
    const patientData = await Patient.findOne({
      where: {
        id
      },
    });
    if (patientData) {
      const patientUpdatedSessionData = await Session.update(
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
      return patientUpdatedSessionData;
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
