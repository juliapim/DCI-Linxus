const router = require("express").Router();
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation/joi_validation");

router.post('/register', async (req, res) => {
    //Validate input data using a separate joi validation file
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //Check if user already exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).send('Email already exists !')

    //Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    //Create and save user
    const user = new User({
        refs: req.body.refs,
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });
    try {
        const savedUser = await user.save();
        res.send({ user: user._id });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/login', async (req, res) => {
    //Validate input data using a separate joi validation file
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    //Check if email already exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Email does not exist !')
    //Check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) return res.status(400).send('Invalid password !');
    //Create and assign jwt
    const token = jwt.sign({_id: user.id}, process.env.SECRET_TOKEN);
    res.header('auth-token', token).send('Logged in using token: ' + token)
});

module.exports = router;