import { connect as reduxConnect, type ConnectedComponent } from "react-redux";
import { registerRedux } from "./libs/metaCollector";
import getLogger from "./utils/logger";
import { Reducer } from "redux";
import { type ComponentType, type ElementType } from "react";

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
            // 同一个组件，如果reducer和reducerName都重复则不需要重复注册，有不重复的情况就应该注册
            const sameComponentEntity = reducerEntityList.find(
                reducerEntity => reducerEntity.component === component);
            if (sameComponentEntity) {
                // 组件已经存在，reducerName或者reducer不同
                registerRedux(reducer, reducerName, reduxComponent, subComponents);
                reducerEntityList.push({ reducerName, reducer, component });
            } else {
                const sameReducerNameEntity = reducerEntityList.find(
                    reducerEntity => reducerEntity.reducerName === reducerName);
                // 组件不存在，是一个新的组件
                if (sameReducerNameEntity) {
                    // 如果reducerName有重复，则提示用户，且不注册
                    logger.warn("reducer name重复了，该组件将不会注册入redux，请修改reducer name：", reducerName);
                } else {
                    // 允许不同的组件，不同的reduerName，但使用相同的reducer
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
    component: ElementType,
): ConnectedComponent<ComponentType<any>, any> {
    // 先去池子里找
    const findedComponentEntity = componentEntityList.find(
        componentEntity => componentEntity.component === component);
    if (findedComponentEntity) {
        // 池子里找到了则返回
        return findedComponentEntity.reduxComponent;
    } else {
        // 没有找到则创建然后放入池子
        const reduxComponent = reduxConnect<TStateProps, TDispatchProps, TOwnProps>(
            mapStateToProps,
            mapDispatchToProps,
            mergeProps,
            options
        )(component as ComponentType);
        componentEntityList.push({ reduxComponent, component });
        return reduxComponent;
    }
}

export { 
    reduxConnect,
    mizarConnect as connect,
};
