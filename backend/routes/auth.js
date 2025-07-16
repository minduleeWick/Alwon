// const express = require('express');
// const jwt = require('jsonwebtoken');
// const router = express.Router();


// router.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   const user = USERS.find(u => u.username === username && u.password === password);

//   if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign({ id: user.id, username: user.username }, 'secretKey', { expiresIn: '1h' });
//   res.json({ token });
// });

// module.exports = router;