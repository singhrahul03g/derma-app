const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { auth, refreshAuth } = require('../middleware/adminAuth');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.post('/forgotPassword', adminController.forgotPassword);
router.post('/resetPassword', auth, adminController.resetPassword);
router.post('/changePassword', auth, adminController.changePassword);
router.post('/addPractitioner', auth, adminController.addPractitioner);
router.post('/practitionersList', auth, adminController.practitionersList);
router.post('/deletePractitioner', auth, adminController.deletePractitioner);
router.post('/edit/:uniqueId', auth, adminController.editPractitioner);
router.post('/changeStatus/:uniqueId', auth, adminController.changeStatus);
router.get('/logout', auth, adminController.logout);
router.get('/refreshToken', refreshAuth, adminController.refreshTokenAPI);

module.exports = router;
