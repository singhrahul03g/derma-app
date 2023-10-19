const { Op } = require('sequelize');

const { db } = require("../config/dbConnection");
const Session = db.session;
const User = db.user;

/**
 * Find any token inside session table in database 
 * with id and type of user and token inside request 
 */
const findToken = async (id, token, type) => {
  try {
    const userData = await User.findOne({
      where: {
        id,
        status: 1
      }
    })
    if(userData) {
      const userSessionData = await Session.findOne({
        where: {
          sessionUserId: id,
          type: type,
          [Op.or]: [
            { accessToken: token },
            { refreshToken: token },
          ],
        }
      });
      return userSessionData;
    }else{
      return null;
    }
  } catch (error) {
    // console.log(error)
    return null;
  }
}

/**
 * Find session with id in session table and also create
 * new if not exits with id and type of user
 */
const findAndCreateSessionWithID = async (id, type) => {
  try {
    const userData = await User.findOne({
      where: {
        id,
        status: 1
      }
    })
    if(userData) {
      const userFindorCreateSessionData = await Session.findOrCreate(
        {
          where: {
            sessionUserId: id,
            type: type
          },
          default: {
            accessToken: null,
            refreshToken: null
          }
        }
      );
      return userFIndorCreateSessionData;
    }else{
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
    const userData = await User.findOne({
      where: {
        id,
        status: 1
      }
    })
    if(userData) {
      const userUpdatedSessionData = await Session.update(
        {
          accessToken: token,
          refreshToken: refreshJWTToken,
          updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        },
        {
          where: {
            sessionUserId: id,
            type: type
          },
        }
      );
      return userUpdatedSessionData;
    }else{
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
  return Session.update(
    {
      accessToken: null,
      refreshToken: null,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    }
  );
};


module.exports = {
  findToken,
  findAndCreateSessionWithID,
  updateSessionWithID,
  clearAllSession
};
