const {
    get: _get
  } = require('lodash');

const dataReceiver=async(data)=>{

    console.log(data);
    console.log(_get(data,'user'));
    console.log(_get(data,'totalPoints'));
}
module.exports = {
    dataReceiver
  };
  