import React from 'react'

const
    merge = (...objs) => Object.assign({}, ...Object.keys(objs)
        .filter((key) => objs[key] && objs[key].constructor === Object)
        .map((key) => objs[key])),

    keyMirror = (str) => merge(...str.split(' ').map((it) => ({ [it]: it }))),

    compose = (...funcs) => (...defaultArgs) =>
        funcs.concat().reverse().reduce((args = [], func) => [func(...args)], defaultArgs)[0],

    pick = (hash, data = {}) => Object.assign({},
        ...Object.keys(data)
            .filter((key) => hash[key])
            .map((key) => ({ [key]: data[key] }))
    ),

    specs = keyMirror('getInitialState getDefaultProps propTypes mixins statics displayName'),
    lifecycles = keyMirror('componentWillMount componentDidMount componentWillReceiveProps shouldComponentUpdate componentWillUpdate componentDidUpdate componentWillUnmount'),
    helpers = keyMirror('receivedProps'),

    formatComponentData = (data) => [
        pick(specs, data),
        pick(lifecycles, data),
        pick(helpers, data)
    ],

    asInternal = (f) => {
        f.__functionalReact = true

        return f
    },

    isInternal = (f) => f && f.__functionalReact,

    mergeComponentSpecs = (methods, newMethods = {}) =>
        merge(methods, ...Object.keys(newMethods).map((key) => ({
            [key]: methods[key]
                ? methods[key].concat(newMethods[key])
                : newMethods[key],
            }))),

    accumulateComponent = (componentMethods = {}, componentF) => {
        if (!componentF) {
            return asInternal((componentF, newComponentMethods) =>
                accumulateComponent(mergeComponentSpecs(componentMethods, newComponentMethods), componentF))
        }

        return isInternal(componentF)
            ? asInternal((newComponentF, newComponentMethods) =>
                componentF(newComponentF, mergeComponentSpecs(componentMethods, newComponentMethods)))
            : makeComponent(...formatComponentData(componentMethods), componentF)
    },

    callComponentMethods = (funcs = [], self, ...args) => {
        const funcsData = funcs.map((func) =>
            func(self, ...args))

        return funcsData
    },

    makeComponent = (specs, lifecycles, helpers, component) => {
        const
            { displayName, getInitialState, getDefaultProps, propTypes, mixins, statics } = specs,
            { componentWillReceiveProps = [] } = lifecycles,
            { receivedProps = [] } = helpers

        return React.createClass({
            displayName: displayName ? displayName.join('.') : 'ReactFunctionalComponent',

            getInitialState() {
                return getInitialState
                    ? merge(...callComponentMethods(getInitialState))
                    : null
            },

            getDefaultProps() {
                return getDefaultProps
                    ? merge(...callComponentMethods(getDefaultProps))
                    : null
            },

            propTypes: propTypes && merge(...propTypes),

            mixins: mixins && Array.prototype.concat(...mixins),

            statics: statics && merge(...specs.statics),

            componentWillMount() {
                this.__call = (funcs, ...args) => funcs && callComponentMethods(funcs, this, ...args, this.props, this.state)
                this.__call(lifecycles.componentWillMount)
            },

            componentDidMount() {
                this.__call(lifecycles.componentDidMount)
            },

            componentWillReceiveProps(nextProps) {
                const receivedPropsFuncs = Array.prototype.concat(
                    ...receivedProps.map((props) => {
                        return Object.keys(props)
                            .filter((propName) => this.props[propName] !== nextProps[propName])
                            .map((propName) => props[propName])
                    }).concat(componentWillReceiveProps)
                )

                this.__call(receivedPropsFuncs, nextProps)
            },

            shouldComponentUpdate(nextProps, nextState) {
                const { shouldComponentUpdate } = lifecycles

                return  shouldComponentUpdate
                    ? this.__call(shouldComponentUpdate, nextProps, nextState)
                        .filter(Boolean).length
                    : true
            },

            componentWillUpdate(nextProps, nextState) {
                this.__call(lifecycles.componentWillUpdate, nextProps, nextState)
            },

            componentDidUpdate(prevProps, prevState) {
                this.__call(lifecycles.componentDidUpdate, prevProps, prevState)
            },

            componentWillUnmount() {
                this.__call(lifecycles.componentWillUnmount)
            },

            render() {
                return React.createElement(component, { ...this.props, ...this.state })
            }
        })
    },

    specsToArrays = (specs) =>
        merge(...Object.keys(specs).map((key) => ({ [key]: [specs[key]] }))),

    makeLiftedFunction = (name) => (componentMethod, f) =>
        accumulateComponent({ [name]: [componentMethod] }, f)

/**
 * Specs
 */
export const getInitialState = makeLiftedFunction('getInitialState')
export const getDefaultProps = makeLiftedFunction('getDefaultProps')
export const propTypes = makeLiftedFunction('propTypes')
export const mixins = makeLiftedFunction('mixins')
export const statics = makeLiftedFunction('statics')
export const displayName = makeLiftedFunction('displayName')

/**
 * Lifecycle methods
 */
export const componentWillMount = makeLiftedFunction('componentWillMount')
export const componentDidMount = makeLiftedFunction('componentDidMount')
export const componentWillReceiveProps = makeLiftedFunction('componentWillReceiveProps')
export const shouldComponentUpdate = makeLiftedFunction('shouldComponentUpdate')
export const componentWillUpdate = makeLiftedFunction('componentWillUpdate')
export const componentDidUpdate = makeLiftedFunction('componentDidUpdate')
export const componentWillUnmount = makeLiftedFunction('componentWillUnmount')

/**
 * Helpers
 */
export const combine = (...funcs) => compose(...funcs)()

export const createClass = (specs, f) => accumulateComponent(specsToArrays(specs), f)
export const addSpecs = (specs, f) => {
    console.warn('addSpecs has been renamed to createClass and will be removed in the next major version.')
    return createClass(specs, f)
}

export const onPropChange = (receivedProps, f) => {
    console.warn('onPropChange has been deprecated and will be removed in the next major version.')
    return accumulateComponent(specsToArrays({ receivedProps }), f)
}
