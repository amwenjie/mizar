const isServer = typeof window === "undefined";
// const isServer = process.env.IS_SERVER_ENV; // process.env.RUNTIME_ENV === "server";
export default isServer;
