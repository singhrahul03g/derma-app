// admin routes

const router = require('express').Router();
const doctorController = require('../controllers/doctor.controller');
const { auth, refreshAuth } = require('../middleware/doctorAuth');


// list admins, edit admin and delete admin routes
// edit paths and add unique id

router.get('/getAllAdmins', auth, doctorController.getAllAdmins);
router.get('/adminDetails/:id', auth, doctorController.getAllAdmins);
router.put('/editAdmin/:uniqueId', auth, doctorController.editAdmin);
router.delete('/deleteAdmin/:uniqueId',auth, doctorController.deleteAdmin) ;


module.exports = router;
