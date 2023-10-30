
// doctor routes

const router = require('express').Router();
const doctorController = require('../controllers/doctor.controller');
const { auth, refreshAuth } = require('../middleware/doctorAuth');

router.post('/login', doctorController.login);

router.get('/doctor-list', auth, doctorController.getAllDoctors);
router.post('/doctor-add', doctorController.register);
router.get('/doctor-get/:uniqueId', auth, doctorController.getDoctorDetails);
router.put('/doctor-update/:uniqueId', auth, doctorController.editDoctor);
router.delete('/doctor-delete/:uniqueId',auth, doctorController.deleteDoctor) ;


module.exports = router;
