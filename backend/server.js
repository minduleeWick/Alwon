const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ✅ Routes
const customerRoutes = require('./routes/CustomerRoute');
const inventoryRoutes = require('./routes/InventoryRoute');
const paymentRoutes = require('./routes/PaymentRoute');
const userRoutes = require('./routes/UsersRoute'); // NEW - for auth & users

app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes); // NEW

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('🚀 Smart Inventory API is running...');
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Global Error Handler (optional)
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port: ${PORT}`);
});
