const express = require('express');
const app = express();
const userRouter = require('./routes/UserRouter');

app.use(express.json());
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
