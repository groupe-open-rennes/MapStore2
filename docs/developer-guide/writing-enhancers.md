# Writing Enhancers

MapStore2 uses **enhancers** as a pattern to add reusable behaviors to React components without modifying their implementation.

Enhancers are Higher-Order Components (HOC), typically composed using [recompose](https://github.com/acdlite/recompose). They allow separating concerns (loading state, localization, scroll behavior, etc.) from the rendering logic.

## When to use enhancers

Use an enhancer when:

- you want to add the same behavior to multiple components (e.g. loading mask, localized props)
- you want to keep the base component simple and stateless
- you want to compose several independent behaviors together

## Basic pattern

```javascript
import { compose, withState, withHandlers } from "recompose";

// Base component: only responsible for rendering
const MyComponent = ({ value, onChange }) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} />
);

// Enhancer: adds local state management
const enhance = compose(
    withState("value", "onChange", ""),
);

export default enhance(MyComponent);
```

## Composing multiple enhancers

```javascript
import { compose, withState, defaultProps } from "recompose";

const enhance = compose(
    defaultProps({ placeholder: "Type something..." }),
    withState("value", "setValue", "")
);

export default enhance(MyComponent);
```

## Examples from the MapStore2 codebase

Enhancers are located in `web/client/components/misc/enhancers/`.

### withControllableState

Adds local state only when the parent component does not already provide the corresponding prop:

```javascript
import { branch, withState } from "recompose";

// If `value` is already provided, the component is used as-is.
// Otherwise a local state is created.
export default (propName, handlerName, initialValue) =>
    branch(
        (props) => props[propName] === undefined,
        withState(propName, handlerName, initialValue)
    );
```

### localizedProps

Translates specific string props using the application locale, injected via context:

```javascript
import { getContext, mapProps, compose } from "recompose";

export default (propNames, localizedKey = "label") =>
    compose(
        getContext({ messages: PropTypes.object, locale: PropTypes.string }),
        mapProps(({ messages, locale, ...props }) => ({
            ...props,
            // translate the listed prop names
        }))
    );
```

## Guidelines

- Keep base components **pure and stateless** wherever possible; delegate state and behavior to enhancers.
- **Compose** small enhancers rather than writing large HOCs.
- Prefer **explicit prop naming** so that composed components remain readable.
- When using `branch`, make sure both branches receive the same prop interface.
- For new code, consider whether a **React Hook** is a simpler alternative to a recompose enhancer; hooks are preferred in modern MapStore2 components.

## See also

- [Writing Plugins](plugins-howto.md)
- [ReactJS and Redux introduction](reactjs-and-redux-introduction.md)
- [recompose API documentation](https://github.com/acdlite/recompose/blob/master/docs/API.md)
