import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
    });
});

app.use((req, res,) => {
    res.status(404).json({
        success: false,
        message: 'Ruta No Encontrada',
        error: `${req.originalUrl} no encontrada`,
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: err.message,
        error: process.env.NODE_ENV === 'production' ? 'Something broke!' : err.stack,
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
