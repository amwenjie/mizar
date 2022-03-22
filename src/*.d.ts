declare module '*.css' {
    const content: any;
    export default content;
}
declare module 'redux-thunk' {
    const thunk: {
        default: (...args) => any;
    } | ((...args) => any);
    export default thunk;
}