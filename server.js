import app from './api/index.js';

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`School ID System is running at http://localhost:${port}`));
