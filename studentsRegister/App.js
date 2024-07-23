const express           = require('express');
const bodyParser        = require('body-parser');
const mongoose          = require('mongoose');
const axios             = require('axios');
const { schoolModel }   = require('./models/schoolModel');
const { studentModel }  = require('./models/studentModel');
const { body, validationResult }
                        = require('express-validator')
                        
require('dotenv').config()

                        
const db = mongoose.connect(process.env.MONGODB_URL_STUDENT_DATA);

const app = express();

const PORT =  process.env.PORT || 3100;

// Parse body as JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log( `GET /`)
    res.send('Welcome to Student Data Application')
});

app.post('/registerSchool',
    // validate input
    [
        [
            body("name").notEmpty().trim(),
            body("city").notEmpty().trim(),
            body("pinCode").notEmpty().trim(),
            body("mobile").notEmpty().trim(),
            body("schoolId").notEmpty().trim()
        ]
    ],
    
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log("register student error");
            return res.status(404).json({ "error": errors.array() });
        }
        let data = req.body
        // check if the student exists
        let schoolDetails = await schoolModel.findOne({ "schoolId": data.schoolId })
        if (schoolDetails) {
            console.log("school already registered");
            res.status(400).json({ "result": "school already registered" })
            return;
        }
        else {
            schoolDetails = new schoolModel(
                {
                "name" : data.name,
                "city" : data.city,
                "pinCode" : data.pinCode,
                "email" : data.email,
                "mobile" : data.mobile,
                "schoolId" : data.schoolId
                }
            )
            let savedSchoolData = await schoolDetails.save();
            if (savedSchoolData) {
                console.log("school saved successfully")
                res.status(200).json({ "result": "school saved successfully" })
            }
            else {
                console.log("school not saved successfully")
                res.status(400).json({ "result": "school not saved successfully" })
            }
        }
    }
)

app.post('/registerStudent',
    // validate input
    [
        [
            body("name").notEmpty().trim(),
            body("age").notEmpty().trim(),
            body("schoolId").notEmpty().trim(),
            body("mobile").notEmpty().trim(),
        ]
    ],
    async (req, res) =>{
        const error = validationResult(req);
        if (!error.isEmpty()) { 
            console.log("Invalid input")
            return res.status(400).json({error:error.array()});
        }
        let data = req.body;
        let schoolDetails = await schoolModel.findOne({ "schoolId": data.schoolId });
        if (schoolDetails)
        {
            let studentDetails = await studentModel.findOne({ "mobile": data.mobile })
            if (studentDetails)
            {
                console.log("student already registered")
                res.status(202).json({ "result": "student already registered" })
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
            
            // call webhook to update
            let webhookURL = ""
            for (let i = 0; i < schoolDetails.webhookDetails.length; i++)
            {
                if (schoolDetails.webhookDetails[i].eventName === "newStudentAdd") {
                    webhookURL = schoolDetails.webhookDetails[i].eventEndpointURL
                    if (webhookURL != null && webhookURL.length > 0) {
                        let result = await axios.post(
                            webhookURL,
                            {
                                name: studentDetails.name,
                                age: studentDetails.age,
                                studentId: studentDetails.studentId,
                                mobile: studentDetails.mobile
                            },
                            {
                                headers: {
                                    'content-type': 'application/json'
                                }
                            }
                        );
                        console.log("webhook data sent: " + result.data.result);
                    }
                }
            }
        }
        else {
            res.status(404).json({result: "school not found"})
        }
    }
)


app.post('/registerWebhook',
    [
        [
            body("schoolId").notEmpty().trim(),
            body("eventName").notEmpty().trim(),
            body("eventEndpointURL").notEmpty().trim()
        ]
    ],
    
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let data = req.body
        let schoolDetails = await schoolModel.findOne({ "schoolId": data.schoolId });
        if (schoolDetails) {
            let index = 0;
            if (schoolDetails.webhookDetails == null) {
                schoolDetails.webhookDetails = [];
            }
            const isPresent = (event) => event.eventName == data.eventName;
            index = schoolDetails.webhookDetails.findIndex(isPresent)
            if (index >= 0) {
                schoolDetails.webhookDetails[index].eventEndpointURL = data.eventEndpointURL
            }
            else {
                schoolDetails.webhookDetails.push({
                    eventName: data.eventName,
                    eventEndpointURL: data.eventEndpointURL
                })
                index = schoolDetails.webhookDetails.findIndex(isPresent)
            }
            schoolDetails = await schoolModel.findOneAndUpdate(
                {
                    "schoolId": schoolDetails.schoolId,
                },
                schoolDetails,
                {
                    returnOriginal: false
                }
            )
            res.status(200).json(
                {
                    "event": {
                        schoolId: schoolDetails.schoolId,
                        eventName: schoolDetails.webhookDetails[index].eventName,
                        eventEndpointURL: schoolDetails.webhookDetails[index].eventEndpointURL
                        },
                    result: "successfully updated"
                }
            );
            console.log("registerWebhook updated");
        }
        else
        {
            console.log("No school details")
            res.status(404).json({result: "No school details"})
            return;
        }
})


app.listen(process.env.PORT, () => { 
    console.log(`Student server is running at http://localhost:${process.env.PORT}`);
});


mongoose.connection.on('connected', () => { 
    console.log('Mongoose default connection open to ' + process.env.MONGODB_URL_STUDENT_DATA);
})
