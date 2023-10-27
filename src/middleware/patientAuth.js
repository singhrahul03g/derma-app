

const JWT = require("jsonwebtoken");
const errorHandler = require("../helpers/errorHandler");
const { findToken } = require("../helpers/adminSession");
const { db } = require("../config/dbConnection");
const Session = db.session


const auth = async (req, res, next) => {

  
  console.log("headers")

  // const session = await Session.findAll();
  // Get the JWT token from the request headers, cookies, or wherever you have stored it
  //  const adminsession = await findToken(session[0].id,session[0].accessToken,session[0].type)


  let headers = req.headers;

  let token = headers.authorization;

  // let type = adminsession.dataValues.type;

  console.log(headers,"headers")

  if (!token) {

    // Token is missing, user is not authenticated

    return next(errorHandler(401, "Invalid credentails"));
  }


  try {

    const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
    const currentTimestamp = Math.floor(Date.now() / 1000);


    // if(type === undefined){

    //   let sessionToken = await findToken(decoded.id, token, decoded.roleName);
    //   if (sessionToken === null) {
    //     return next(errorHandler(403, "Invalid credentails"));
    //   }
    // }

    if (decoded.exp > currentTimestamp) {
      req.user = decoded;
      return next();
    }
  } catch (error) {
    console.log(error, "error========")
    return next(errorHandler(403, "Invalid credentails"));
  }
};

const refreshAuth = async (req, res, next) => {
  // Get the JWT token from the request headers, cookies, or wherever you have stored it
  let header = req.headers;
  let token = header.authorization;
  let type = header.type;
  
  if (!token) {
    // Token is missing, user is not authenticated
    return next(errorHandler(401, "Invalid credentails"));
  }
  try {
    const decoded = JWT.verify(token, process.env.REFRESH_SECRET_KEY);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if(type === undefined){
      let sessionToken = await findToken(decoded.id, token, decoded.roleName);
      // console.log("token ==> ", token, sessionToken)
      if (sessionToken === null) {
        return next(errorHandler(401, "Invalid credentails"));
      }
    }

    if (decoded.exp > currentTimestamp) {
      req.user = decoded;
      req.refreshToken = token;
      return next();
    }
  } catch (error) {
    return next(errorHandler(401, "Invalid credentails"));
  }
};

module.exports = {
  auth,
  refreshAuth
};
