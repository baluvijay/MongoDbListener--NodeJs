
const mongoose = require('mongoose');

const { Types: { ObjectId } } = mongoose;


const isValidOid = (id) => ObjectId.isValid(id);
const isOidInstance = (id) => id instanceof ObjectId;
const toOid = (hexStringOrOid) => (ObjectId.isValid(hexStringOrOid) ?
  ObjectId.createFromHexString(hexStringOrOid.valueOf()) : hexStringOrOid);
const newOid = () => new ObjectId();

const toOids = (oidArray, fieldName) => {
  if (!oidArray || oidArray.length === 0) return [];
  if (!fieldName) {
    return oidArray.map(x => toOid(x));
  } else {
    return oidArray.map(x => toOid(x[fieldName]));
  }
};
const toStr = (obj) => {
  if (obj) {
    return obj.toString();
  }
  return '';
};
const toStrs = (strArray, fieldName) => {
  if (!strArray || strArray.length === 0) return [];
  if (!fieldName) {
    return strArray.map(x => toStr(x));
  } else {
    return strArray.map(x => toStr(x[fieldName]));
  }
};




module.exports = {
  toOid,
  toOids,
  toStr,
  toStrs,
  newOid,
  isValidOid,
  isOidInstance,
};
