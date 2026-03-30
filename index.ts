import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import authUser from "./routes/authRoutes";
import deliveries from "./routes/DeliveryRoutes";
import payment from "./routes/PaymentRoute";
import chat from "./routes/ChatRoute";

dotenv.config();

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/auth", authUser);
app.use("/deliveries", deliveries);
app.use("/payment", payment);
app.use("/chat", chat);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
