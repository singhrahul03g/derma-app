const router = require('express').Router();
const userController = require('../controllers/user.controller');
const {auth, refreshAuth} = require('../middleware/userAuth');

// router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgotPassword', userController.forgotPassword);
router.post('/changePassword', auth, userController.changePassword);
router.post('/resetPassword', auth, userController.resetPassword);
router.post('/setPassword', auth, userController.setPassword);
router.get('/refreshToken', refreshAuth, userController.refreshTokenAPI);
router.get('/logout', auth, userController.logout);
// Category routes
router.post('/addCategory', auth, userController.addCategory);
router.post('/categoriesList', auth, userController.categoriesList);
router.post('/changeCategoryStatus/:uniqueId', auth, userController.changeCategoryStatus);
router.post('/editCategory/:uniqueId', auth, userController.editCategory);
router.post('/deleteCategory', auth, userController.deleteCategory);
// Prompts routes
router.post('/addPrompt', auth, userController.addPrompt);
router.post('/promptsList', auth, userController.promptsList);
// router.post('/searchPrompt', auth, userController.searchPrompt);
router.post('/changePromptStatus/:uniqueId', auth, userController.changePromptStatus);
router.post('/editPrompt/:uniqueId', auth, userController.editPrompt);
router.post('/deletePrompt', auth, userController.deletePrompt);
// Patient routes
router.post('/addPatient', auth, userController.addPatient);
router.post('/patientsList', auth, userController.patientsList);
router.post('/editPatient/:uniqueId', auth, userController.editPatient);
router.post('/deletePatient', auth, userController.deletePatient);
router.get('/getPatientData', auth, userController.getPatientData);


module.exports = router;
