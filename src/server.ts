import express, { Express } from 'express';
import https from 'https';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export default function createHttpsServer(port: number, app?: Express) {
    let tServer: https.Server | null = null;

    if (app) {
        tServer = https.createServer(app);
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

        tServer = https.createServer(app);
    }

    tServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
