import express from "express";

import dgram from "dgram";
import os from "os";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { initSocket } from "./services/socket.js";

const PORT = process.env.PORT;
const app = express();

app.use(express.raw({ type: "image/jpeg", limit: "10mb" }));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

import patientRouter from "./modules/patient/router.js";
import nurseRouter from "./modules/nurse/router.js";
import adminRouter from "./modules/admin/router.js";
import recRouter from "./modules/recognition/router.js";
import { createDefaultAdmin } from "./createAdmin.js";

app.use("/patient", patientRouter);
app.use("/nurse", nurseRouter);
app.use("/recognition", recRouter);
app.use("/admin", adminRouter);

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}
const udpServer = dgram.createSocket("udp4");
const UDP_PORT = 41234;

udpServer.bind(() => {
  udpServer.setBroadcast(true);
  console.log("UDP discovery active");
});

setInterval(() => {
  const payload = {
    name: "project-server",
    ip: getLocalIP(),
    port: PORT,
  };

  const message = Buffer.from(JSON.stringify(payload));

  udpServer.send(message, 0, message.length, UDP_PORT, "255.255.255.255");
}, 2000);

app.get("/", (req, res) => {
  res.render("login");
});
app.get("/admin", (req, res) => {
  res.render("adminDashboard");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/image", (req, res) => {
  res.sendFile(process.cwd() + "/latest.jpg");
});
createDefaultAdmin();
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    res.status(500).json({ errMessage: err });
  }
});

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, "0.0.0.0", () => console.log(`Server running on ${PORT}`));
