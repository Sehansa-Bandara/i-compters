import './index.js';

const cors = require("cors");

app.use(cors({
    origin: "https://i-computers-frontend-rbvd.vercel.app",

    credentials: true,
}));
