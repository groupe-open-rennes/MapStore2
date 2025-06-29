/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import {
    CHANGE_MEASUREMENT_TOOL,
    CHANGE_MEASUREMENT_STATE,
    CHANGE_UOM,
    RESET_GEOMETRY,
    CHANGED_GEOMETRY,
    SET_TEXT_LABELS,
    SET_CURRENT_FEATURE,
    CHANGE_FORMAT,
    CHANGE_COORDINATES,
    UPDATE_MEASURES,
    INIT,
    SET_MEASUREMENT_CONFIG,
    SET_ANNOTATION_MEASUREMENT
} from '../actions/measurement';

import { TOGGLE_CONTROL, RESET_CONTROLS, SET_CONTROL_PROPERTY } from '../actions/controls';
import { set } from '../utils/ImmutableUtils';
import { getGeomTypeSelected } from '../utils/MeasurementUtils';
import { validateCoord, defaultUnitOfMeasure } from '../utils/MeasureUtils';
import { isPolygon } from '../utils/openlayers/DrawUtils';
import { dropRight, isEmpty, findIndex, isNumber } from 'lodash';

const defaultState = {
    lineMeasureEnabled: true,
    geomType: "LineString",
    areaMeasureEnabled: false,
    bearingMeasureEnabled: false,
    customStartEndPoint: {
        startPointOptions: {
            radius: 3,
            fillColor: "green"
        },
        endPointOptions: {
            radius: 3,
            fillColor: "red"
        }
    },
    uom: defaultUnitOfMeasure,
    lengthFormula: "haversine",
    showLabel: true,
    showSegmentLengths: true,
    currentFeature: 0,
    features: []
};
function measurement(state = defaultState, action) {
    switch (action.type) {
    case CHANGE_MEASUREMENT_TOOL: {
        const currentFeatureIndex = action.geomType !== null && findIndex(state.features, (f)=> ((f.properties?.values?.[0] || {}).type === 'bearing' ? 'Bearing' : f.geometry.type) === action.geomType);
        return Object.assign({}, state, {
            lineMeasureEnabled: action.geomType !== state.geomType && action.geomType === 'LineString',
            areaMeasureEnabled: action.geomType !== state.geomType && action.geomType === 'Polygon',
            bearingMeasureEnabled: action.geomType !== state.geomType && action.geomType === 'Bearing',
            geomType: action.geomType === state.geomType ? null : action.geomType,
            features: action.geomType === null ? [] : state.features,
            textLabels: action.geomType === null ? [] : state.textLabels,
            feature: {
                properties: {
                    disabled: true
                }
            },
            currentFeature: currentFeatureIndex !== -1 ? currentFeatureIndex : state.features?.length || 0,
            len: 0,
            area: 0,
            bearing: 0
        });
    }
    case CHANGE_MEASUREMENT_STATE: {
        let feature = action.feature;
        if (isPolygon(feature)) {
            /* in the state the polygon is always not closed (the feature come closed from the measureSupport)
             * a selector validates the feature and it closes the polygon adding first valid coord
             */
            feature = set("geometry.coordinates[0]", dropRight(feature.geometry.coordinates[0]), feature);
        }
        return Object.assign({}, state, {
            lineMeasureEnabled: action.lineMeasureEnabled,
            areaMeasureEnabled: action.areaMeasureEnabled,
            bearingMeasureEnabled: action.bearingMeasureEnabled,
            geomType: action.geomType,
            values: action.values,
            feature: set("properties.disabled", state.feature.properties.disabled, feature),
            point: action.point,
            len: action.len,
            area: action.area,
            bearing: action.bearing,
            lenUnit: action.lenUnit,
            areaUnit: action.areaUnit
        });
    }
    case UPDATE_MEASURES: {
        const {point, len, area, bearing} = action.measures;
        return {
            ...state,
            point,
            len,
            area,
            bearing
        };
    }
    case RESET_GEOMETRY: {
        let newState = set("feature.properties.disabled", true, state);
        return {
            ...newState,
            isDrawing: true,
            updatedByUI: false
        };
    }
    case CHANGE_UOM: {
        const prop = action.uom === "length" ? "lenUnit" : "lenArea";
        const {value, label} = action.value;
        return Object.assign({}, state, {
            ...((action.uom === "length" || action.uom === "area") && { [prop]: value }),
            uom: Object.assign({}, action.previousUom || state.uom, {
                [action.uom]: {
                    unit: value,
                    label
                }
            }),
            updatedByUI: true
        });
    }
    case CHANGED_GEOMETRY: {
        let {features = []} = action;
        const geomTypeSelected = getGeomTypeSelected(features);
        const currentFeature = state.features?.length === features.length ? state.currentFeature : features.length ? features.length - 1 : 0;
        return {
            ...state,
            features,
            currentFeature,
            geomTypeSelected,
            updatedByUI: false,
            isDrawing: false,
            ...(isEmpty(features) && {exportToAnnotation: false})
        };
    }
    case SET_MEASUREMENT_CONFIG: {
        let {property, value} = action;
        return {
            ...state,
            [property]: value
        };
    }
    case SET_ANNOTATION_MEASUREMENT: {
        let {features, properties} = action;
        const geomTypeSelected = getGeomTypeSelected(features);
        return {
            ...state,
            features,
            geomTypeSelected,
            updatedByUI: true,
            isDrawing: false,
            exportToAnnotation: true,
            id: properties.id,
            visibility: properties.visibility
        };
    }
    case SET_TEXT_LABELS: {
        return {
            ...state,
            textLabels: action.textLabels
        };
    }
    case SET_CURRENT_FEATURE: {
        return {
            ...state,
            currentFeature: isNumber(action.featureIndex) ? action.featureIndex : state.features.length
        };
    }
    case TOGGLE_CONTROL: {
        const {id, ...newState} = state;
        // TODO: remove this when the controls will be able to be mutually exclusive
        if (action.control === 'info') {
            return {
                ...newState,
                len: 0,
                area: 0,
                bearing: 0,
                lineMeasureEnabled: false,
                areaMeasureEnabled: false,
                bearingMeasureEnabled: false,
                feature: { properties: {
                    disabled: true
                }},
                geomType: ""
            };
        }
        if (action.control === 'measure') {
            return {
                ...newState,
                geomType: "",
                lineMeasureEnabled: false,
                areaMeasureEnabled: false,
                bearingMeasureEnabled: false
            };
        }
        return state;
    }
    case SET_CONTROL_PROPERTY: {
        if (action.control === 'measure' && action.value === false) {
            return {
                ...state,
                geomType: "",
                lineMeasureEnabled: false,
                areaMeasureEnabled: false,
                bearingMeasureEnabled: false
            };
        }
        return state;
    }
    case RESET_CONTROLS: {
        return {
            ...state,
            len: 0,
            area: 0,
            bearing: 0,
            lineMeasureEnabled: false,
            areaMeasureEnabled: false,
            bearingMeasureEnabled: false,
            feature: { properties: {
                disabled: true
            }},
            geomType: "",
            features: []
        };
    }
    case CHANGE_FORMAT: {
        return {...state, format: action.format};
    }
    case INIT: {
        return state.init
            ? state
            : {
                ...state,
                ...action.defaultOptions,
                init: true
            };
    }
    case CHANGE_COORDINATES: {
        const coordinates = action.coordinates.map(c => ([c.lon, c.lat]));
        // wrap in an array for polygon geom
        const features = state.features || [];
        const currentFeatureObj = features[state.currentFeature] || {};
        const invalidCoordinates = coordinates.filter((c) => {
            return validateCoord(c);
        }).length !== coordinates.length;

        return {
            ...state,
            feature: {
                type: "Feature",
                properties: {
                    disabled: coordinates.filter((c) => {
                        return validateCoord(c);
                    }).length !== coordinates.length
                },
                geometry: {
                    type: state.bearingMeasureEnabled ? "LineString" : state.geomType,
                    coordinates: state.areaMeasureEnabled ? [dropRight(coordinates)] : coordinates
                }
            },
            features: [
                ...features.slice(0, state.currentFeature), {
                    ...currentFeatureObj,
                    type: "Feature",
                    properties: {
                        ...(currentFeatureObj.properties || {}),
                        disabled: invalidCoordinates || state.bearingMeasureEnabled && coordinates.length < 2
                    },
                    geometry: {
                        type: state.bearingMeasureEnabled ? "LineString" : state.geomType,
                        coordinates: state.areaMeasureEnabled ? [[...coordinates, coordinates[0]]] : coordinates,
                        textLabels: currentFeatureObj?.geometry?.textLabels || [] // Persist labels on edit
                    }
                },
                ...features.slice(state.currentFeature + 1, features.length)
            ],
            updatedByUI: true
        };
    }
    default:
        return state;
    }
}

export default measurement;
