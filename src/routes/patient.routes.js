
// patient routes

const router = require('express').Router();
const patientController = require('../controllers/patient.controller');
const { auth, refreshAuth } = require('../middleware/patientAuth');

router.post('/patient-add', patientController.register);
router.post('/login', patientController.login);

router.get('/patient-list', auth, patientController.getAllPatients);
router.get('/patient-get/:uniqueId', auth, patientController.getPatientDetails);
router.put('/patient-update/:uniqueId', auth, patientController.editPatient);
router.delete('/patient-delete/:uniqueId',auth, patientController.deletePatient) ;


module.exports = router;
