  const express = require("express");
  const mongoose = require("mongoose");
  const passport = require("./config/passport");
  const authRoutes = require("./routes/auth");
  const postRoutes = require("./routes/posts");
  const matchRoutes = require("./routes/match");
  const chatRoutes = require("./routes/chat");
  const http = require("http");

  const cookieParser = require("cookie-parser");
  require("dotenv").config();

  const app = express();

  app.use(express.static("public"));

  const { Server } = require("socket.io");
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", (data) => {
      io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/match", matchRoutes);
  app.use("/api/chat", chatRoutes);

  // MongoDB
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
