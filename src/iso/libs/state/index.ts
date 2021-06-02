const state: {
    apis: object;
    isDebug: boolean | unknown;
    isCSR: boolean;
    isClientBootstraped: boolean;
} = {
    apis: {},
    isDebug: process.env.IS_DEBUG_MODE,
    isCSR: true,
    isClientBootstraped: false,
};
export default state;