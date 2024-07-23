const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        name: String,
        age: Number,
        schoolId: Number,
        studentId: Number,
        mobile: Number,
    }
)

const studentModel = mongoose.model('Student', studentSchema);

exports.studentModel = studentModel;
