import * as express from 'express';



interface Identity {}


function getIdentity(req:express.Request) : Identity{
    return {};
}

function mintCSRFCookie(): string{
    return "";
}

function buildAuthRedirectURL(req:express.Request): string {
    return "";
}




export function callbackHandler (req:express.Request, res:express.Response){
    res.status(401).json({ error:"Unauthorized" });
}

export function authHandler (req:express.Request, res:express.Response){
    res.status(401).json({ error:"Unauthorized" });

    const id = getIdentity(req);
    if(!id){
        res.cookie('__fwd_auth_csrf', mintCSRFCookie(), { signed: true });
        res.redirect(buildAuthRedirectURL(req));
    }
    
}
