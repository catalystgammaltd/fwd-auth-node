import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import * as path from "path";


import config from "./config";
import { callbackHandler, authHandler } from "./auth";
import { auth } from "express-openid-connect";

import { errorHandler } from "./middlewares/errorHandler";
import { RSA_NO_PADDING } from "constants";

// Create Express server
export const app = express();

// Express configuration
app.set("port", config.PORT);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "../public")));
app.use(logger("dev"));
app.use(cookieParser(config.COOKIE_SECRET));
app.use(auth({
    authRequired: true,
    auth0Logout: true,
    idpLogout: true,
    issuerBaseURL: config.OIDC_ISSUER_BASE_URL,
    baseURL: config.OIDC_BASE_URL,
    clientID: config.OIDC_CLIENT_ID,
    secret: config.COOKIE_SECRET,
}));



app.all("*", async (req, res) => {
    // Save userinfo in a cookie
    const userInfo = await req.oidc.fetchUserInfo();
    res.cookie("userinfo", Buffer.from(JSON.stringify(userInfo)).toString('base64'), { signed:true });
    // We're good to go.
    res.status(200).send('OK');

});

app.use(errorHandler);
