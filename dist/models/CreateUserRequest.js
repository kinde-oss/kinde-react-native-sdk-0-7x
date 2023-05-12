Object.defineProperty(exports,"__esModule",{value:true});exports.CreateUserRequestFromJSON=CreateUserRequestFromJSON;exports.CreateUserRequestFromJSONTyped=CreateUserRequestFromJSONTyped;exports.CreateUserRequestToJSON=CreateUserRequestToJSON;exports.instanceOfCreateUserRequest=instanceOfCreateUserRequest;var _ApiClient=require("../ApiClient");var _CreateUserRequestIdentitiesInner=require("./CreateUserRequestIdentitiesInner");var _CreateUserRequestProfile=require("./CreateUserRequestProfile");function instanceOfCreateUserRequest(value){var isInstance=true;return isInstance;}function CreateUserRequestFromJSON(json){return CreateUserRequestFromJSONTyped(json,false);}function CreateUserRequestFromJSONTyped(json,ignoreDiscriminator){if(json===undefined||json===null){return json;}return{profile:!(0,_ApiClient.exists)(json,'profile')?undefined:(0,_CreateUserRequestProfile.CreateUserRequestProfileFromJSON)(json['profile']),identities:!(0,_ApiClient.exists)(json,'identities')?undefined:json['identities'].map(_CreateUserRequestIdentitiesInner.CreateUserRequestIdentitiesInnerFromJSON)};}function CreateUserRequestToJSON(value){if(value===undefined){return undefined;}if(value===null){return null;}return{profile:(0,_CreateUserRequestProfile.CreateUserRequestProfileToJSON)(value.profile),identities:value.identities===undefined?undefined:value.identities.map(_CreateUserRequestIdentitiesInner.CreateUserRequestIdentitiesInnerToJSON)};}