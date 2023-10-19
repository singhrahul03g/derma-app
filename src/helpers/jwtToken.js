const JWT = require("jsonwebtoken");

const generateToken = (payload) => {

    let secretKey = process.env.JWT_SECRET_KEY;
    let expiresIn = '3h';
    // let expiresIn = '10s';
    
    // console.log(payload, secretKey, expiresIn);

    return JWT.sign(payload, secretKey, { expiresIn });

};
const refreshToken = (payload) => {

    let refreshSecretKey = process.env.REFRESH_SECRET_KEY;
    let expiresIn = '2d';
    // let expiresIn = '30s';

    
    // console.log(payload, refreshSecretKey, expiresIn);

    return JWT.sign(payload, refreshSecretKey, { expiresIn });

};
module.exports = {
    generateToken,
    refreshToken
}

