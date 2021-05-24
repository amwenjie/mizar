const isDebug = JSON.parse(process.env.IS_DEBUG_MODE); // process.env.NODE_ENV === "development";
export default isDebug;
