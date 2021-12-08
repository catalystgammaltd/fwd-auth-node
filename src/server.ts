import { app } from "./app";
import { createLightship } from 'lightship';
import config from "./config";
  
const port = app.get("port");

// Set up /live, /health and /ready endpoints for kubernetes.
const lightship = createLightship({
    port: config.PROBES_PORT,
    
});

const server = app.listen(port, () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind}`);
    lightship.signalReady();
});


server.on("error", (error: NodeJS.ErrnoException) => {
    lightship.shutdown();

    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Taken care of by lightship
// process.on('SIGTERM', () => {
//     console.error('SIGTERM signal received: closing HTTP server');
//     server.close(() => {
//         lightship.shutdown();
//         console.error('HTTP server closed');
//     });
// });

export default server;
