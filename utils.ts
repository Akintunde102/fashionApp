import {useRef, useEffect} from 'react';
import {PermissionsAndroid, Alert} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'react-native-fetch-blob';
import config from './config';
import credentials from './app.credentials';

export const smartLog = (...data) => {
  config.log && console.log(...data);
};

export const topLog = (...data) => {
  config.topLog && console.log('topLog::', ...data);
};

export const RequestCameraPermission = async () => {
  let fullyGranted = false;
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

    if (
      fileWriteAccess === PermissionsAndroid.RESULTS.GRANTED &&
      fileReadAccess === PermissionsAndroid.RESULTS.GRANTED
    ) {
      fullyGranted = true;
    }
  } catch (err) {
    console.warn(err);
    fullyGranted = false;
  }
  return fullyGranted;
};

export function useInterval(callback: Function, delay: number | null) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**This converts time In Seconds to An Object  that is usable for React Native Manipulation
 *
 * @param timeInSeconds
 */
export const formatTimeForDisplay = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds - minutes * 60;
  const timeObj = {
    minutes: minutes >= 100 ? minutes : ('0' + minutes).slice(-2),
    seconds: ('0' + seconds).slice(-2),
  };
  const formattedDisplay = `${timeObj.minutes}:${timeObj.seconds}`;
  const digitNumber = formattedDisplay.toString().length;
  return {
    ...timeObj,
    formattedDisplay,
    digitNumber,
  };
};

export async function getImageDict() {
  try {
    let response = await fetch('http://localhost:8000/images/dict');
    let json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
  }
}

export function keyStorage(
  key?: string | number,
  value?: string,
  debug: boolean = false,
) {
  const storageKey = `@${credentials.appName}:${key}`;
  return {
    get: async function () {
      try {
        const val = await AsyncStorage.getItem(storageKey);
        debug &&
          smartLog('FILE RETRIEVED!!', {
            storageKey,
            val,
          });
        return val;
      } catch (error) {
        Alert.alert('asyncStorageError', `error:${error}, key:${storageKey}`);
      }
    },
    set: async function () {
      try {
        if (!value) {
          throw 'value is not given in setOperation';
        }
        await AsyncStorage.setItem(storageKey, value);
        debug &&
          smartLog('FILE STORED!!', {
            storageKey,
            value,
          });
        return value;
      } catch (error) {
        Alert.alert('asyncStorageError', `error:${error}, value:${value}`);
      }
    },
    getAllKeys: async function () {
      let keys: string[] = [];
      try {
        keys = await AsyncStorage.getAllKeys();
      } catch (error) {
        Alert.alert('asyncStorageError:: getAllKeys', `error:${error},`);
      }
      return keys;
    },
    clear: async function () {
      try {
        await AsyncStorage.clear();
        return true;
      } catch (error) {
        Alert.alert('asyncStorageError:: clearKeys', `error:${error},`);
        return false;
      }
    },
  };
}

export function AndroidFileStorage(
  key?: string | number,
  value?: string,
  debug: boolean = false,
) {
  const DocumentDir = RNFetchBlob.fs.dirs.DocumentDir;
  const storagePath = `${DocumentDir}/${credentials.appName}_persistStore`;
  const encoding = 'utf8';
  const pathForKey = `${storagePath}/${key}`;

  smartLog('AndroidFileStorage::', {storagePath});
  // Create Folder If Not Exist
  RNFetchBlob.fs.isDir(storagePath).then((isDir: boolean) => {
    if (!isDir) {
      smartLog(`Folder${storagePath} does not exist`);
      smartLog('Creating Folder....');

      RNFetchBlob.fs
        .mkdir(storagePath)
        .then(() => {
          smartLog(`Folder '${storagePath}' created`);
        })
        .catch((err: string) => {
          smartLog(`isDir Error: ${err}`);
        });
    }
  });

  return {
    exists: (callback?: Function) =>
      new Promise((resolve, reject) =>
        RNFetchBlob.fs.exists(pathForKey).then((isExist: boolean) => {
          if (!isExist) {
            smartLog(`File${pathForKey} does not exist`);
            resolve(false);
            return;
          }
          resolve(pathForKey);
          return;
        }),
      ),
    set: (callback?: Function) =>
      new Promise((resolve, reject) =>
        RNFetchBlob.fs
          .writeFile(pathForKey, value, encoding)
          .then(() => {
            if (callback) {
              callback();
            }
            resolve(true);
          })
          .catch((error: string) => {
            smartLog('AndroidFileStorage: set', error);
            if (callback) {
              callback(error && error);
            }
            reject(error);
          }),
      ),
    get: (callback?: Function) =>
      new Promise((resolve, reject) => {
        // Create Check if File Exists
        RNFetchBlob.fs.exists(pathForKey).then((isExist: boolean) => {
          if (!isExist) {
            smartLog(`File${pathForKey} does not exist`);
            resolve(false);
            return;
          }
        });

        RNFetchBlob.fs
          .readFile(pathForKey, encoding)
          .then((data: string) => {
            if (callback) {
              callback(null, data);
            }
            resolve(data);
          })
          .catch((error: string) => {
            smartLog('AndroidFileStorage: get', error);
            if (callback) {
              callback(error);
            }
            reject(error);
          });
      }),
    remove: (callback?: Function) =>
      new Promise((resolve, reject) =>
        RNFetchBlob.fs
          .unlink(pathForKey)
          .then(() => {
            if (callback) {
              callback();
            }
            resolve(true);
          })
          .catch((error: string) => {
            smartLog('AndroidFileStorage: remove', error);
            if (callback) {
              callback(error);
            }
            reject(error);
          }),
      ),
    getAll: (callback?: Function) =>
      new Promise((resolve, reject) =>
        RNFetchBlob.fs
          .exists(storagePath)
          .then((exists: boolean) =>
            exists ? Promise.resolve() : RNFetchBlob.fs.mkdir(storagePath),
          )
          .then(() =>
            RNFetchBlob.fs.ls(storagePath).then((files: string) => {
              if (callback) {
                callback(null, files);
              }
              resolve(files);
            }),
          )
          .catch((error: string) => {
            smartLog('AndroidFileStorage: getAll', error);
            if (callback) {
              callback(error);
            }
            reject(error);
          }),
      ),
    clear: (callback?: Function) =>
      new Promise((resolve, reject) =>
        RNFetchBlob.fs
          .exists(storagePath)
          .then((exists: boolean) =>
            exists ? Promise.resolve() : RNFetchBlob.fs.mkdir(storagePath),
          )
          .then(() =>
            RNFetchBlob.fs.ls(storagePath).then(async (files: string) => {
              if (callback) {
                callback(null, files);
              }
              for (let index = 0; index < files.length; index++) {
                await RNFetchBlob.fs.unlink(`${storagePath}/${files[index]}`);
                smartLog('removed', files[index], {
                  file: `${storagePath}/${files[index]}`,
                });
              }
              resolve(true);
            }),
          )
          .catch((error: string) => {
            if (callback) {
              callback(error);
            }
            reject(error);
          }),
      ),
  };
}

export async function saveDict() {
  const response = await fetch(`https://${config.imageServer}/images/dict`);
  const json = await response.json();
  const stringedJson = JSON.stringify(json);
  await keyStorage('dictStored', stringedJson, true).set();
  return json;
}

export async function fetchAndSave() {
  try {
    const json = await keyStorage('dictStored').get();
    if (!json) {
      smartLog('error: dict not yet stored');
      return;
    }
    const parsedJSON = JSON.parse(json);
    for (let index = 0; index < parsedJSON.length; index++) {
      const {uri, name} = parsedJSON[index];
      const imageStored = await AndroidFileStorage(name).exists();
      if (imageStored) {
        smartLog({
          status: 'All Already Logged',
          uri,
          imageStored,
          name,
        });
        continue;
      }
      const res = await RNFetchBlob.fetch(
        'GET',
        `https://${config.imageServer}/images/${name}`,
      );
      smartLog(JSON.stringify({name, uri}));
      await AndroidFileStorage(name, res.data).set();
    }
    await keyStorage('allStored', 'true').set();
  } catch (error) {
    smartLog('scan file error', {error});
  }
}

export async function getImages() {
  smartLog('getImages');
  const dictStored = await keyStorage('dictStored', '', true).get();
  if (!dictStored) {
    Alert.alert('Data Error', 'Dict Does not Exist yet');
    return;
  }
  const images = [];
  const parsedDict = JSON.parse(dictStored);
  const dictKeys = Object.keys(parsedDict);
  for (let index = 0; index < dictKeys.length; index++) {
    const each = dictKeys[index];
    const base64Image = await AndroidFileStorage(each).get();
    const imageType = parsedDict[each].split('.')[1];
    const uri = `data:image/${imageType};base64,${base64Image}`;
    images.push({
      uri,
      imageName: parsedDict[each],
    });
  }
  return images;
}

export function getUnique(arr: any[], comp: string) {
  // store the comparison  values in array
  const unique = arr
    .map((e) => e[comp])

    // store the indexes of the unique objects
    .map((e, i, final) => final.indexOf(e) === i && i)

    // eliminate the false indexes & return unique objects
    .filter((e) => arr[e])
    .map((e) => arr[e]);

  return unique;
}
