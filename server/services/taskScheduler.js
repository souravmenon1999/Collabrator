// services/taskScheduler.js
const cron = require('node-cron');
const taskCheckService = require('./taskCheckService'); // Import the task check service

// --- Configurable Interval ---
let taskInterval = '* * * * *'; // Default: Run every hour at minute 0
// For faster testing, you can change this to:
// taskInterval = '* * * * *';      // Run every minute
// taskInterval = '*/5 * * * *';    // Run every 5 minutes
// taskInterval = '*/10 * * * *';   // Run every 10 minutes


// Function to start the task scheduler
function startTaskScheduler() {
    cron.schedule(taskInterval, () => {
        console.log(`Running task due tomorrow check at: ${new Date()} - Interval: ${taskInterval}`);
        taskCheckService.checkTasksDueTomorrow(); // Call the task function from taskCheckService
    });
    console.log(`Task due tomorrow check scheduled to run with interval: ${taskInterval}`);
}

module.exports = {
    startTaskScheduler
};