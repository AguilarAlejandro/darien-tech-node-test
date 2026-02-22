Prompt inicial:

Goals:

1. Have a working Fastify backend in darien-tech-node-test per the instructions and requirements of darien-teceh-node-test/test.md, fulfilling all the optional/bonus features and including test coverage using Jest.
2. Have a working Next.js frontend app in darien-tech-react-test per the instructions and requirements of darien-tech-react-test/test.md, fulfilling all the optional/bonus features.
   3.Make sure both projects work with each other properly

Specifications:
Backend:

- Build a modular, clean code, properly organized following DRY principles, carefully typed backend using TypeScript, Fastify, Jest, Prisma and any other necessary technology that's needed to fulfill the requirements.
- Regarding the database, it must use PostgreSQL through Prisma, as used in the project protaps-backend. Use this backend to refer to understand how Prisma is used to define schemas and query the database. Keep every model in a separated schema file, similar ot how protaps-backend is doing so.
- Regarding the web framework, use Fastify with TypeScript. Keep API endpoints heavily typed, both the request payloads and responses. Refer to the axxon-api for guidance.
- Regarding unit and integration tests, try to cover as much as possible, but don't aim to obtain 100% coverage with unrealistic edge cases. Use Jest.

Frontend:

- Use a modern version of Next.js with TypeScript, similar to the homeflow app.
- Build a scalable web app that is also easy to maintain through UI components that are reused throughout the app.
- For buttons and simple interactions, use optimistic UI to make sure interactions are as quick as possible. Create and update forms are the exception.
- To hook up with the API use an Axios wrapper for the main HTTP methods: GET, POST, PUT, PATCH and DELETE, to allow calling the API with as few lines of code as possible.
- The color scheme must be consistent throughout the app.

Frontend and backend:

- Use Docker and Docker Compose to be able to host containers for both apps and expose them through ports that can be easily changed.
- Use docker compose yml templates to make sure all services are defined properly with all the envirnoment variables they required
- Do not worry about interconnecting the frontend and backend containers, keeping them outside a network is fine. Though the backend and database will be defined in the same docker compose template. Refer to the protaps-backend project to understand how docker should be used in a simple way.
- Apply the bonus functionalities for both projects. In the case of the backend, use the iot-simulator project as reference for what's explained in the darien-tech-node-test/test.md file (that is the repository that is mentioned)

Ask me whatever doubts you might have, and after that, build a complete and thorough plan of this implementation, from beginning to end, without any time estimates. The whole implementation plan, organized in steps, should be dumped in a markdown file for both darien-tech-node-test and darien-tech-react-test and will be used by you keep track of what's done and what's not.
