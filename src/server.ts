import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export default function createHttpServer(port: number, app?: Express) {
    let tServer: http.Server | null = null;

    if (app) {
        tServer = http.createServer(app);
    } else {
        const app = express();
        app.use(cors());
        app.use(helmet());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(
            rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
            }),
        );

        app.get('/', (req, res) => {
            res.send('Made with fca-utils 💖');
        });

        tServer = http.createServer(app);
    }

    tServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
