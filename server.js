const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { port } = require("../config/config");

const adminRouter = require('../routes/admin');
const userRouter = require('../routes/user');

const app = express();

// Use environment variable or fallback to 5173 (for dev)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Enable CORS
app.use(cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(bodyParser.json());

// API Routes
app.use("/admin", adminRouter);
app.use("/user", userRouter);

// =================== Serve React in Production ===================
const distPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});
// ================================================================

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
