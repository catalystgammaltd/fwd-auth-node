# Traefik foward auth handler in node

This service will act as a OIDC aware [forward authentication proxy](https://doc.traefik.io/traefik/middlewares/http/forwardauth/) for [Traefik](https://traefik.io/traefik/), allowing traffic to be authenticated as part of Traefik middleware chain.

It is written in Typescript and inspired by similar efforts by [thomseddon](https://github.com/thomseddon/traefik-forward-auth) and others.


## Todo

- [ ] Write up a kustomization example of deploying this service
- [ ] Write a usage guide
- [ ] Publish image
- [ ] Build test suite
- [ ] Automatically refersh tokens

## Build and run
```
cd <project_name>
npm install
```

- Build and run the project

```
npm run build
npm start
```

Navigate to `http://localhost:3000`

### Using the debugger in VS Code

Debugging is one of the places where VS Code really shines over other editors.
Node.js debugging in VS Code is easy to setup and even easier to use.
This project comes pre-configured with everything you need to get started.

When you hit `F5` in VS Code, it looks for a top level `.vscode` folder with a `launch.json` file.
In this file, you can tell VS Code exactly what you want to do:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach by Process ID",
  "processId": "${command:PickProcess}",
  "protocol": "inspector"
}
```

This is mostly identical to the "Node.js: Attach by Process ID" template with one minor change.
We added `"protocol": "inspector"` which tells VS Code that we're using the latest version of Node which uses a new debug protocol.

With this file in place, you can hit `F5` to attach a debugger.
You will probably have multiple node processes running, so you need to find the one that shows `node dist/server.js`.
Now just set your breakpoints and go!
