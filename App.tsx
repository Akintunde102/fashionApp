/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useContext, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Text,
  Alert,
  ToastAndroid,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import NetInfo from '@react-native-community/netinfo';
//import {Timer, InputForm} from './components';
import {SizeContextProvider, SizeContext} from './contexts';
import {Gallery, CirclesLoader, NavBar} from './components';
import {
  AndroidFileStorage,
  keyStorage,
  fetchAndSave,
  smartLog,
  saveDict,
  useInterval,
} from './utils';

type ImageDictType = {
  images: {uri: string; name: string}[];
  type: 'allImages' | 'savedImages';
};

function App() {
  // States and Contexts Calls
  const {dHeight, dWidth, fontScale} = useContext(SizeContext);
  const [ready, setReady] = useState<boolean>(false);
  const [imageDict, setImageDict] = useState<ImageDictType>({
    images: [],
    type: 'allImages',
  });
  const [internetState, setInternetState] = useState<boolean | null>(null);
  const [presentPage, setPresentPage] = useState<string>(
    'Naija Fashion Styles',
  );
  // To Hide Splash Screen when JS is done loading
  useEffect(() => {
    SplashScreen.hide();
  });

  useInterval(
    () => {
      NetInfo.fetch().then((internet) => {
        smartLog({internet});
        setInternetState(internet.isInternetReachable);
      });
    },
    internetState ? null : 1000,
  );

  // to get Image Dict
  useEffect(() => {
    async function prepareStorage() {
      const allCleared = await AndroidFileStorage().clear();
      const keyStorageClear = await keyStorage().clear();
      console.log({allCleared, keyStorageClear});

      keyStorage('dictStored')
        .get()
        .then(async (dictStored) => {
          let dict = dictStored;
          const allStored = await keyStorage('allStored').get();
          smartLog({allStored, jey: 1, dictStored: dict});
          if (dictStored && allStored) {
            return;
          }

          if (!dictStored) {
            dict = await saveDict();

            if (dict) {
              setImageDict({images: dict, type: 'allImages'});
            }

            if (!dict) {
              Alert.alert('Something Bad happened');
            }
            // initialise Saved Images Dict
            const savedImagesDict = await AndroidFileStorage(
              'savedDict',
              'init',
            ).set();
            smartLog({savedImagesDict});
            setReady(true);
          }
          if (!allStored) {
            fetchAndSave();
            smartLog('fetching, saving');
          }
          return dict;
        })
        .catch((error) => {
          smartLog('dictStored, allStored check error', error);
        });
    }
    prepareStorage();
  }, []);

  const styles = StyleSheet.create({
    app: {
      height: dHeight,
      width: dWidth,
      borderTopColor: '#000',
      borderTopWidth: 1,
    },
    inputForm: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderRadius: 2,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
    loader: {
      width: dWidth * 0.5,
      height: dHeight * 0.2,
      paddingLeft: dWidth * 0.1,
      paddingRight: dWidth * 0.1,
      paddingTop: dHeight * 0.03,
      marginTop: dHeight * 0.3,
      marginBottom: dHeight * 0.3,
      justifyContent: 'center',
      alignContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(65, 105, 255, 0.9)',
      elevation: 4,
      shadowOffset: {width: 1, height: 19},
    },
    loadingText: {
      fontSize: 10 / fontScale,
      color: 'white',
      textAlign: 'center',
      paddingBottom: 10 / fontScale,
    },
    loaderIcon: {
      alignSelf: 'center',
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: 'royalblue',
      padding: 10,
      width: dWidth * 0.5,
      height: dHeight * 0.08,
    },
    buttonText: {
      color: 'white',
      fontSize: 20 / fontScale,
    },
    navBar: {
      height: dHeight * 0.05,
      backgroundColor: '#002366',
      borderBottomColor: '#000',
      borderBottomWidth: 2,
      borderRadius: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 1,
    },
  });

  const loadSavedImages = () => {
    AndroidFileStorage('savedDict')
      .get()
      .then((savedDict) => {
        if (savedDict === 'init') {
          // Send Out A Feedback toast
          ToastAndroid.showWithGravity(
            'No Saved Image Yet',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
          return false;
        }

        smartLog({a: savedDict, b: JSON.parse(savedDict)});

        const parsedDict =  JSON.parse(savedDict);
        if (parsedDict.length === 0) {
          // Send Out A Feedback toast
          ToastAndroid.showWithGravity(
            'All Saved Images Have Been Deleted',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
          return false;
        }
        setImageDict({
          images: parsedDict,
          type: 'savedImages',
        });
        smartLog('loadSavedImages::', {
          images: parsedDict,
        });
        setPresentPage('Naija Fashion Styles | Saved Styles');
        return true;
      })
      .catch((error: string) => {
        smartLog('loadSavedImages:: err', {error});
      });
  };

  const loadAllImages = () => {
    keyStorage('dictStored')
      .get()
      .then((dictStored) => {
        setImageDict({images: JSON.parse(dictStored), type: 'allImages'});
        setPresentPage('Naija Fashion Styles | All Images');
      })
      .catch((error: string) => {
        smartLog('loadAllImages:: err', {error});
      });
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        hidden={false}
        backgroundColor="#fff"
      />
      <SafeAreaView>
        <KeyboardAvoidingView behavior="height">
          <View style={styles.app}>
            <NavBar page={presentPage} customStyles={styles.navBar} />
            <SizeContextProvider>
              {ready ? (
                <View>
                  <Gallery
                    loadSavedImages={loadSavedImages}
                    loadAllImages={loadAllImages}
                    imageDetails={imageDict}
                    style={{}}
                  />
                </View>
              ) : (
                <View style={styles.loader}>
                  <Text style={styles.loadingText}>
                    <Text style={{marginBottom: 10, fontStyle: 'italic'}}> Images Loading </Text> Please Make Sure Your Internet is On
                  </Text>
                  {internetState !== null && internetState === false && (
                    <Text
                      style={{
                        ...styles.loadingText,
                        color: 'red',
                      }}>
                      Please Turn On Your Internet
                    </Text>
                  )}
                  <View style={styles.loaderIcon}>
                    <CirclesLoader />
                  </View>
                </View>
              )}
            </SizeContextProvider>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

export default App;
