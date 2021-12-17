//node
import crypto from "crypto";
import * as path from "path";

// Externals
import { createLightship } from 'lightship';
import { Command, Option } from "commander";
import express from "express";
import { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { auth } from "express-openid-connect";
import winston, { createLogger } from "winston";

// Internals
import { version } from '../package.json';
import helmet from "helmet";


/**
 * Set up application logger
 */
const log = createLogger({
    level: 'debug',
    exitOnError: false,
    transports: [new winston.transports.Console()],
});


/**
 * Sety up CLI options & config
 */
const program = new Command();
program
    .version(version)
    .addOption(
        new Option('-p, --port <port>', 'Port to run the service on')
        .default(3000)
        .env('PORT')
        .makeOptionMandatory())
    .addOption(
        new Option('--probes <port>', 'Port to serve /live, /health and /ready probes on.')
        .default(9090)
        .env('PROBES_PORT'))
    .addOption(
        new Option('--cookie-secret <secret>', 'Cookie secret to use in auth. Will be autogenerated if not provided')
        .default(Buffer.from(crypto.randomBytes(64)).toString('base64'))
        .env('COOKIE_SECRET'))
    .addOption(
        new Option('--callback-path <path>', 'The callback path to receive idp responses on')
        .default('/callback')
        .env('CALLBACK_PATH')
        .makeOptionMandatory())
    .addOption(
        new Option('--oidc-client-id <id>', 'The OIDC client id.')
        .env('OIDC_CLIENT_ID')
        .makeOptionMandatory())
    .addOption(
        new Option('--oidc-client-secret <secret>', 'The OIDC client secret.')
        .env('OIDC_CLIENT_SECRET')
        .makeOptionMandatory())
    .addOption(
        new Option('--oidc-base-url <baseUrl>', 'The base URL for the auth process (eg: https://auth.example.com).')
        .env('OIDC_BASE_URL')
        .makeOptionMandatory())
    .addOption(
        new Option('--oidc-issuer-url <issuerUrl>', 'The OIDC issuer url (eg: https://catalystgamma.eu.auth0.com).')
        .env('OIDC_ISSUER_URL')
        .makeOptionMandatory())
    .addOption(
        new Option('--common-auth-domain <domain>', 'The common auth domain to be used for authentication cookies')
        .env('COMMON_AUTH_DOMAIN')
        .makeOptionMandatory())
    .showHelpAfterError();

program.parse(process.argv);
const config = program.opts();

/**
 * Set up watcher that provides /live, /health and /ready endpoints
 */
const lightship = createLightship({
    port: config.probes,
    
});


/**
 * Create express app
 */
export const app = express();
app.use(helmet());

const redir_cookie_name = '_fwd_auth_redir';
const default_landing = "https://app.catalystgamma.com";


console.log(config);

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "../public")));
app.use(logger("dev"));
app.use(cookieParser(config.cookieSecret));
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    idpLogout: true,
    issuerBaseURL: config.oidcIssuerUrl,
    baseURL: config.oidcBaseUrl,
    clientID: config.oidcClientId,
    secret: config.cookieSecret,
    routes: {
        // We want to handle these manually to account for forwarding
        login: false,
        postLogoutRedirect: default_landing,
        callback: config.callbackPath,
    },
    session:{
        cookie:{
            domain: config.commonAuthDomain,
        },
    },
}));

/**
 * Error handling
 */
 declare type WebError = Error & { status?: number };
 app.use((err: WebError, req: Request, res: Response, next: NextFunction): void => {
     // set locals, only providing error in development
     res.locals.message = err.message;
     
     log.error("Unexpected error occured", err);
     // console.log(req);
     // console.log(res);
     
     // render the error page
     res.status(err.status || 500);
     res.render("error", { title: err.name, message: err.message });
 });

const defaultAuthorizationParams = {
    response_type: 'id_token',
    response_mode: 'form_post',
    // audience: "https://api.staging.catalystgamma.com",
    scope: 'openid profile email offline_access',
};

interface FwdArgs {
    host: string
    method: string
    port: string
    prefix: string
    proto: string
}

function urlFromFwdArgs(fwdArgs:FwdArgs): string{
    const url = `${fwdArgs.proto}://${fwdArgs.host}:${fwdArgs.port}${fwdArgs.prefix}`;
    return url;
}

app.get('/favicon.ico', (req, res) => { res.status(404).send('Not found'); });


app.all('*', async (req, res) => {

    if(req.path.startsWith("/callback")){
        res.status(400).render('error', { 
            status: 400,
            title: "Bad Request 400",
            message: "General handler should not receive auth callbacks!",
        });
    }

    if(req.oidc.isAuthenticated()){
        const subscriber = req.oidc.user?.sub;
        log.debug({ subscriber: subscriber });
        // Reply with 200, but show bad droids, 
        // since page should never be seem by client.
        res
            .header('X-Forwarded-User', subscriber)
            .status(200)
            .render('bad-droids', { targetUrl: default_landing });
    }else{
        log.info("Request unauthenticated. Triggering login flow.");

        // Set up redirect cookie
        const fwdArgs : FwdArgs = {
            "host": req.header('x-forwarded-host'),
            "method":req.header('x-forwarded-method'),
            "port":req.header('x-forwarded-port'),
            "prefix":req.header('x-forwarded-prefix'),
            "proto":req.header('x-forwarded-proto'),
        };

        // Trigger login
        const loginArgs = { 
            returnTo: urlFromFwdArgs(fwdArgs),
            authorizationParams: defaultAuthorizationParams,
        };
        log.info(loginArgs);
        res.oidc.login(loginArgs);
    }
});






/**
 * Run server and handle errors
 */

const server = app.listen(config.port, () => {
    const addr = server.address();
    log.info(`Listening on ${config.port}`);
    lightship.signalReady();
});

server.on("error", (error: NodeJS.ErrnoException) => {
    // lightship.shutdown();
    log.error("Fatal error.");

    if (error.syscall !== "listen") {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(`${config.port} requires elevated privileges`);
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(`${config.port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});
