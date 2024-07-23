const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        name: String,
        age: Number,
        mobile: Number,
        studentId: Number
    }
)

const studentModel = mongoose.model('Student', studentSchema);

exports.studentModel = studentModel;
