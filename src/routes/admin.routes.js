
// admin routes

const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { auth, refreshAuth } = require('../middleware/adminAuth');

// list admins, edit admin and delete admin routes
// edit paths and add unique id

router.post('/admin-add', adminController.adminAdd);
router.post('/login', adminController.login);
router.get('/admin-list', auth, adminController.getAllAdmins);
router.get('/admin-get/:uniqueId', auth, adminController.getAdminDetails);
router.put('/admin-update/:uniqueId', auth, adminController.editAdmin);
router.delete('/admin-delete/:uniqueId',auth, adminController.deleteAdmin) ;


router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password', auth, adminController.resetPassword);
router.post('/change-password', auth, adminController.changePassword);

router.post('/add-doctor', auth, adminController.addDoctor);
router.post('/doctor-list', auth, adminController.doctorsList);
router.post('/doctor-delete', auth, adminController.deleteDoctor);
router.post('/doctor-update/:uniqueId', auth, adminController.updateDoctor);

router.post('/logout', auth, adminController.logout);

router.post('/change-status/:uniqueId', auth, adminController.changeStatus);
router.get('/refresh-token', refreshAuth, adminController.refreshTokenAPI);

// doctor account updates by admin

module.exports = router;
