export default {
    apis: {},
    isDebug: process.env.IS_DEBUG_MODE,
    isCSR: true,
    isClientBootstraped: false,
} as {
    apis: object,
    isDebug: boolean | unknown,
    isCSR: boolean;
    isClientBootstraped: boolean,
};
