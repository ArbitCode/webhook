require('dotenv').config()
const express       = require('express')
const bodyParser    = require('body-parser')
const mongoose      = require('mongoose')
const { body, validationResult } = require('express-validator')
const { studentModel }  = require('./models/studentModel')
const db                = mongoose.connect(process.env.MONGODB_URL_SCHOOL_DATA);
const app               = express()


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send({msg:'Welcome to Ronaldo School'})
})

app.post('/RegisterStudent',
    // validate
    [
        [
            body("name").notEmpty().trim(),
            body("age").notEmpty().trim(),
            body("mobile").notEmpty().trim()
        ]
    ],
    
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log("register student error");
            return res.status(404).json({"error": errors.array()});
        }
        let data = req.body
        // check if the student exists
        let studentDetails = await studentModel.findOne({ "mobile": data.mobile })
        if (studentDetails)
        {
            console.log("student already registered")
            res.status(202).json({ "result": "student already registered" })
            return;
        }
        else {
            studentDetails = new studentModel(
                {
                    "name": data.name,
                    "age": data.age,
                    "mobile": data.mobile
                }
            )
            let savedStudentData = await studentDetails.save();
            if (savedStudentData)
            {
                console.log("student saved successfully")
                res.status(200).json({ "result": "student saved successfully" })
            }
            else{
                console.log("student not saved successfully")
                res.status(400).json({ "result": "student not saved successfully" })
            }
        }
})


app.listen(process.env.PORT, () => {
    console.log('Ronaldo Server is running on port ' + process.env.PORT)
})

mongoose.connection.on('connected', () => { 
    console.log('Mongoose default connection open to ' + process.env.MONGODB_URL_SCHOOL_DATA)
})

