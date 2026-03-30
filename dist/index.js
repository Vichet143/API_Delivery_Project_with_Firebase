"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const DeliveryRoutes_1 = __importDefault(require("./routes/DeliveryRoutes"));
const PaymentRoute_1 = __importDefault(require("./routes/PaymentRoute"));
const ChatRoute_1 = __importDefault(require("./routes/ChatRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use("/auth", authRoutes_1.default);
app.use("/deliveries", DeliveryRoutes_1.default);
app.use("/payment", PaymentRoute_1.default);
app.use("/chat", ChatRoute_1.default);
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
