export default {
    apis: {},
    isDebug: JSON.parse(process.env.IS_DEBUG_MODE),
    isCSR: true,
    isClientBootstraped: false,
} as {
    apis: object,
    isDebug: boolean,
    isCSR: boolean;
    isClientBootstraped: boolean,
};
