const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");

app.use(express.json());

const users = [];
const highScores = [];

function generateToken(user) {
  return jwt.sign({ userHandle: user.userHandle }, "secretkey", { expiresIn: "1h" });
}

app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid userHandle or password");
  }

  const user = { userHandle, password };
  users.push(user);
  res.status(201).send("User registered successfully");
});

app.post("/login", (req, res) => {
  const { userHandle, password } = req.body;

  if (typeof userHandle !== 'string' || typeof password !== 'string') {
    return res.status(400).send("Both userHandle and password should be of type string");
  }

  if (!userHandle || !password) {
    return res.status(400).send("Both userHandle and password are required");
  }

  const allowedFields = ['userHandle', 'password'];
  const extraFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
  if (extraFields.length > 0) {
    return res.status(400).send("Request contains additional fields");
  }

  const user = users.find((u) => u.userHandle === userHandle && u.password === password);
  if (!user) {
    return res.status(401).send("Unauthorized, incorrect username or password");
  }

  const token = generateToken(user);
  res.status(200).send({ jsonWebToken: token });
});

app.post("/high-scores", (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Unauthorized, JWT token is missing or invalid");
  }

  try {
    jwt.verify(token, "secretkey");
  } catch (e) {
    return res.status(401).send("Unauthorized, JWT token is invalid");
  }

  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).send("Invalid high score data");
  }

  const highScore = { level, userHandle, score, timestamp };
  highScores.push(highScore);
  res.status(201).send("High score posted successfully");
});

app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;

  if (!level) {
    return res.status(400).send("Level is required");
  }

  const scoresForLevel = highScores.filter((score) => score.level === level);
  scoresForLevel.sort((a, b) => b.score - a.score);
  const startIndex = (page - 1) * 20;
  const paginatedScores = scoresForLevel.slice(startIndex, startIndex + 20);

  res.status(200).json(paginatedScores);
});

let serverInstance = null;
module.exports = {
  start: function () {
    if (!serverInstance) {
      serverInstance = app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`);
      });
    }
  },
  close: function () {
    if (serverInstance) {
      serverInstance.close();
      serverInstance = null;
    }
  },
};
