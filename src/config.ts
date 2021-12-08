import crypto from "crypto";


interface Config {
    PORT: number
    PROBES_PORT: number,
    COOKIE_SECRET: string
    CALLBACK_PATH: string
    OIDC_CLIENT_ID: string
    OIDC_CLIENT_SECRET: string
    OIDC_BASE_URL: string
    OIDC_ISSUER_BASE_URL: string
}

const config : Config = { 
    PORT: parseInt(process.env.PORT) || 3000,
    PROBES_PORT: parseInt(process.env.PROBES_PORT) || 9090,
    COOKIE_SECRET:  process.env.COOKIE_SECRET || Buffer.from(crypto.randomBytes(64)).toString('base64'),
    CALLBACK_PATH: process.env.CALLBACK_PATH || "/callback",
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || "KWzNWn6lWu4kh8pxxdmqRPJgOoSvCr4Q",
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
    OIDC_BASE_URL: process.env.OIDC_BASE_URL || "https://auth2.staging.catalystgamma.com",
    OIDC_ISSUER_BASE_URL: process.env.OIDC_ISSUER_BASE_URL || "https://catalystgamma.eu.auth0.com/",
};

export default config;
