// const isServer = typeof window === "undefined";
const isServer = JSON.parse(process.env.IS_SERVER_ENV); // process.env.RUNTIME_ENV === "server";

export default isServer;
