const express = require('express');
const cors = require('cors');
const sseRoutes = require('./routes/sseRoutes');
const mainRoutes = require('./routes/mainRoutes'); 
const taskSchedulerService = require('./services/taskScheduler'); // Task scheduler service


require('dotenv').config(); // Load environment variables from .env

const app = express();
app.use(cors());
app.use(express.json());

const connectDB = require('./config/database');
connectDB();



// Routes
app.use('/api', mainRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    taskSchedulerService.startTaskScheduler();
});
