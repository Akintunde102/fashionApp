import React from 'react';
import {PermissionsAndroid} from 'react-native';
import {smartLog} from '../utils';

const RequestCameraPermission = async () => {
  try {
    const fileReadAccess = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'I need your File Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    if (fileReadAccess === PermissionsAndroid.RESULTS.GRANTED) {
      smartLog('You can read storage');
    } else {
      smartLog('Not Allowed');
    }

    const fileWriteAccess = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'I need your Write File Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    if (fileWriteAccess === PermissionsAndroid.RESULTS.GRANTED) {
      smartLog('You can read storage');
    } else {
      smartLog('Not Allowed');
    }
  } catch (err) {
    console.warn(err);
  }
};

export default RequestCameraPermission;
