# MapStore API usage

You can include MapStore in your application and interact with it via its [JavaScript API](https://mapstore.geosolutionsgroup.com/mapstore/docs/api/jsapi)

## How to use

1. Create a map using the standard installation
1. Go to Share -> Embed
1. Copy the API html code and paste it in your application page

The map will now load inside your application

    NOTE: If the map is using a Google Maps background you will have to provide your own API key.
    Add `&key=YOUR_API_KEY` in the <script> src value

## Core API methods

The embedded API exposes utility methods to create the map, listen to events and trigger actions:

- `MapStore2.create(containerId, options, pluginsDef, component)` to instantiate the embedded app
- `MapStore2.onAction(type, listener)` / `MapStore2.offAction(type, listener)` to subscribe/unsubscribe to dispatched actions
- `MapStore2.onStateChange(listener, selector)` / `MapStore2.offStateChange(listener)` to observe state updates
- `MapStore2.triggerAction(action)` to dispatch an action to the application store
- `MapStore2.withPlugins(plugins, options)` to create an API instance bound to a custom plugins set

## Example: create an embedded map

```javascript
MapStore2.create('map', {
    plugins: ['Map', 'ZoomIn', 'ZoomOut', 'ScaleBox'],
    configUrl: '/configs/map.json'
});
```

## Example: listen to map actions

```javascript
const onMapViewChange = (action) => {
    console.log('New zoom level:', action.zoom);
};

MapStore2.onAction('CHANGE_MAP_VIEW', onMapViewChange);

// Later, to cleanup listeners
MapStore2.offAction('CHANGE_MAP_VIEW', onMapViewChange);
```

## Example: listen to state changes with selector

```javascript
const onMapState = (mapState) => {
    console.log('Current center:', mapState.center);
};

MapStore2.onStateChange(
    onMapState,
    (state) => (state.map && state.map.present) || state.map || {}
);

// Later, to cleanup listeners
MapStore2.offStateChange(onMapState);
```

## Example: trigger an action

```javascript
MapStore2.triggerAction({
    type: 'ZOOM_TO_EXTENT',
    extent: {
        minx: '-124.731422',
        miny: '24.955967',
        maxx: '-66.969849',
        maxy: '49.371735'
    },
    crs: 'EPSG:4326'
});
```

## Recommended practices

- Prefer `configUrl` for runtime configuration managed outside the bundle.
- Keep listeners scoped and always unregister them (`offAction`, `offStateChange`) when no longer needed.
- Use `onStateChange` with a selector to limit updates to the state fragment you really need.
- Use `withPlugins` to expose a minimal embedded experience focused on your integration scenario.
