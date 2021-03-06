import { connect as reduxConnect, type ConnectedComponent } from "react-redux";
import { Reducer } from "redux";
import { ReactElement, type ComponentType, type ElementType } from "react";
import { registerRedux } from "./libs/metaCollector.js";
import getLogger from "./utils/logger.js";

const logger = getLogger().getLogger("iso/connect");

const componentEntityList = [];
const reducerEntityList = [];

export interface IMizarComponentEnhancerWithProps {
    (component: ElementType): ElementType
    (component: ElementType, reducer: Reducer): ElementType
    (component: ElementType, reducerName: string): ElementType
    (component: ElementType, subComponents: ElementType[]): ElementType
    (component: ElementType, reducer: Reducer, reducerName: string): ElementType
    (component: ElementType, reducer: Reducer, subComponents: ElementType[]): ElementType
    (component: ElementType, reducerName: string, subComponents: ElementType[]): ElementType
    (component: ElementType, reducer: Reducer, reducerName: string, subComponents: ElementType[]): ElementType
}

export interface IMizarConnect {
    (
        mapStateToProps?,
        mapDispatchToProps?,
        mergeProps?,
        options?
    ): IMizarComponentEnhancerWithProps;
}

const mizarConnect: IMizarConnect = function mizarConnect<TStateProps, TDispatchProps, TOwnProps>(
    mapStateToProps?,
    mapDispatchToProps?,
    mergeProps?,
    options?,
) {
    return (component, reducer?, reducerName?, subComponents?) => {
        if (!mapStateToProps) {
            mapStateToProps = state => {
                return {
                    ...state[reducerName],
                };
            };
        }
        const reduxComponent = getReduxComponent(
            mapStateToProps,
            mapDispatchToProps,
            mergeProps,
            options,
            component,
        );
        const findedReducerEntity = reducerEntityList.find(
            reducerEntity => (
                reducerEntity.component === component
                && reducerEntity.reducerName === reducerName
                && reducerEntity.reducer === reducer
            )
        );
        if (!findedReducerEntity) {
            // ????????????????????????reducer???reducerName????????????????????????????????????????????????????????????????????????
            const sameComponentEntity = reducerEntityList.find(
                reducerEntity => reducerEntity.component === component);
            if (sameComponentEntity) {
                // ?????????????????????reducerName??????reducer??????
                registerRedux(reducer, reducerName, reduxComponent, subComponents);
                reducerEntityList.push({ reducerName, reducer, component });
            } else {
                const sameReducerNameEntity = reducerEntityList.find(
                    reducerEntity => reducerEntity.reducerName === reducerName);
                // ???????????????????????????????????????
                if (sameReducerNameEntity) {
                    // ??????reducerName??????????????????????????????????????????
                    logger.warn("reducer name???????????????????????????????????????redux????????????reducer name???", reducerName);
                } else {
                    // ?????????????????????????????????reduerName?????????????????????reducer
                    registerRedux(reducer, reducerName, reduxComponent, subComponents);
                    reducerEntityList.push({ reducerName, reducer, component });
                }
            }
        }
        return reduxComponent;
    };
}

function getReduxComponent<TStateProps, TDispatchProps, TOwnProps>(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    options,
    component,
): ConnectedComponent<ComponentType<any>, any> {
    // ??????????????????
    const findedComponentEntity = componentEntityList.find(
        componentEntity => componentEntity.component === component);
    if (findedComponentEntity) {
        // ???????????????????????????
        return findedComponentEntity.reduxComponent;
    } else {
        // ???????????????????????????????????????
        const reduxComponent = reduxConnect<TStateProps, TDispatchProps, TOwnProps>(
            mapStateToProps,
            mapDispatchToProps,
            mergeProps,
            options
        )(component);
        componentEntityList.push({ reduxComponent, component });
        return reduxComponent;
    }
}

export { 
    reduxConnect,
    mizarConnect as connect,
};
