const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'souravmenon1999@gmail.com',
        pass: 'oaua qpmt bman swss'
    }
});

const sendTaskAssignmentEmail = (to, title, dueDate) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject: 'New Task Assigned',
        text: `A new task "${title}" has been assigned to you. Due date: ${dueDate}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};


// **[NEW FUNCTION: sendTaskReminderEmail]**
const sendTaskReminderEmail = (to, title, dueDate, description) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject: 'Task Reminder: Task Due Soon', // Reminder-specific subject
        text: `Reminder: Task "${title}" is due soon.\n\nDescription: ${description}\n\nDue date: ${dueDate}` // Reminder-specific text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending reminder email:', error); // Differentiate log messages
        } else {
            console.log('Reminder email sent:', info.response);
        }
    });
};

module.exports = {
    sendTaskAssignmentEmail,
    sendTaskReminderEmail,
};