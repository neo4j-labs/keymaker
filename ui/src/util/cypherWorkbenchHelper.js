
import { getDynamicConfigValue } from "../dynamicConfig";

export const encodeObject = (obj) => btoa(JSON.stringify(obj));

export const getQueryParams = (properties) => {
    properties = properties || {};
    const { dataModelKey, metadata, dbConnection, keymakerInfo } = properties;
    
    var queryParams = { mode: 'keymaker' };

    if (dataModelKey) {
        queryParams.dataModelKey = dataModelKey;
    }
    if (metadata) {
        queryParams.metadata = encodeObject(metadata);
    }
    if (dbConnection) {
        queryParams.dbConnection = encodeObject(dbConnection);
    }
    if (keymakerInfo) {
        queryParams.keymakerInfo = encodeObject(keymakerInfo);
    }

    return Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).join('&');
}

export const getCypherWorkbenchURL = (properties) => {
    properties = properties || {};
    const { cypherBuilderKey } = properties;
    var url = `${getDynamicConfigValue('REACT_APP_CYPHER_WORKBENCH_BASE_URL')}${getDynamicConfigValue('REACT_APP_CYPHER_BUILDER_URI')}`;
    if (cypherBuilderKey) {
        url += `/${cypherBuilderKey}`;
    }
    url += `?${getQueryParams(properties)}`;
    return url;
}