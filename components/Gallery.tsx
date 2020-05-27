/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState, useEffect, memo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ViewStyle,
  TouchableOpacity,
  TouchableHighlight,
  ToastAndroid,
} from 'react-native';
import PhotoView from 'react-native-photo-view';
import {SizeContext} from '../contexts';
import {smartLog, AndroidFileStorage, getUnique} from '../utils';
import {number} from 'prop-types';

type ImageDetailsType = {uri: string; name: string};
const Gallery = ({
  imageDetails,
  style,
  loadSavedImages,
  loadAllImages,
}: {
  imageDetails: {images: ImageDetailsType[]; type: string};
  style: ViewStyle;
  loadSavedImages: () => boolean;
  loadAllImages: () => void;
}) => {
  const {images: onlyImages, type: imageCategory} = imageDetails;
  // Contexts
  const {fontScale, dHeight, dWidth} = useContext(SizeContext);

  // States
  const [images, setImages] = useState(onlyImages);
  const firstImage = imageDetails.images[0];
  const [presentImage, setPresentImage] = useState<
    ImageDetailsType & {index: number; oUri?: string}
  >({
    uri: `https://${firstImage.uri}`,
    name: firstImage.name,
    index: 0,
    oUri: firstImage.uri,
  });
  const [actualDimension, setActualDimension] = useState<{
    aHeight: number;
    aWidth: number;
  } | null>(null);

  useEffect(() => {
    setImages(imageDetails.images);
    processPresentImage(0, imageDetails.images);
  }, [imageDetails]);

  const styles = StyleSheet.create({
    view: {
      fontSize: 40 / fontScale,
      borderColor: 'red',
      flexDirection: 'column',
      flex: 1,
    },
    image: { 
      flex: 15,
      resizeMode: 'contain',
      width: dWidth * 1,
      alignSelf: 'center',
    },
    imageContainer: {
      justifyContent: 'center',
      alignContent: 'center',
      flex: 12,
      backgroundColor: '#fff',
    },
    text: {
      fontSize: 18 / fontScale,
      textAlign: 'center',
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: 'royalblue',
      paddingTop: dHeight * 0.001,
      width: dWidth * 0.5,
    },
    buttonText: {
      color: 'white',
      fontSize: 16 / fontScale,
    },
    buttonContainer: {
      flexDirection: 'row',
      flex: 1,
    },
  });

  const processPresentImage = (newIndex: number, newImages = null) => {
    const newImage = newImages ? newImages[newIndex] : images[newIndex];

    AndroidFileStorage(newImage.name)
      .get()
      .then((value: string | null | undefined) => {
        let preferredUri = `https://${newImage.uri}`;
        if (value) {
          const imageType = newImage.name.split('.')[1];
          smartLog({n: newImage.name, imageType, processed: true});
          preferredUri = `data:image/${imageType};base64,${value}`;
        }
        setPresentImage({
          uri: preferredUri,
          name: newImage.name,
          index: newIndex,
          oUri: newImage.uri,
        });

        Image.getSize(
          preferredUri,
          (width, height) => {
            setActualDimension({aWidth: width, aHeight: height});
          },
          (error) => smartLog(error),
        );
      });
  };

  const saveImage = () => {
    //get Already Saved SavedImages
    AndroidFileStorage('savedDict')
      .get()
      .then((savedDict) => {
        let dict = savedDict;
        if (dict === 'init') {
          dict = [];
        }

        if (savedDict && savedDict !== 'init') {
          dict = JSON.parse(savedDict);
        }

        dict.push({
          uri: presentImage.oUri,
          name: presentImage.name,
        });

        dict = getUnique(dict, 'name');
        AndroidFileStorage('savedDict', JSON.stringify(dict)).set();
        // Send Out A Feedback toast
        ToastAndroid.showWithGravity(
          'Image Saved',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      })
      .catch((error) => {
        smartLog('saveImage::', {error});
      });
  };

  const deleteImage = () => {
    //get Already Saved SavedImages
    AndroidFileStorage('savedDict')
      .get()
      .then((savedDict) => {
        let dict = savedDict;
        dict = JSON.parse(savedDict);
        dict = dict.filter(function (obj) {
          return obj.name !== presentImage.name;
        });

        AndroidFileStorage('savedDict', JSON.stringify(dict)).set();

        if (!dict.length) {
          loadAllImages();
        }

        if (dict.length) {
          loadSavedImages();
        }
        smartLog({dict});
        // Send Out A Feedback toast
        ToastAndroid.showWithGravity(
          'Image Deleted',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      })
      .catch((error) => {
        smartLog('deleteImage::', {error});
      });
  };

  const onPress = (direction: 'next' | 'previous') => {
    const newIndex =
      direction === 'next' ? presentImage.index + 1 : presentImage.index - 1;
    smartLog({newIndex, length: images.length});
    if (newIndex === images.length) {
      setImages(onlyImages);
      return;
    }
    processPresentImage(newIndex);
  };

  return (
    <View style={{...style, ...styles.view}}>
      {imageCategory === 'allImages' ? (
        <View style={styles.buttonContainer}>
          <TouchableHighlight
            style={{
              ...styles.button,
              borderRightColor: 'white',
              borderRightWidth: 1 / fontScale,
            }}
            onPress={() => {
              saveImage();
            }}>
            <Text style={styles.buttonText}>Save Image</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.button}
            onPress={() => {
              loadSavedImages();
            }}>
            <Text style={styles.buttonText}>View Saved Images</Text>
          </TouchableHighlight>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableHighlight
            style={{
              ...styles.button,
              borderRightColor: 'white',
              borderRightWidth: 1 / fontScale,
            }}
            onPress={() => {
              deleteImage();
            }}>
            <Text style={styles.buttonText}>Delete Image</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.button}
            onPress={() => {
              loadAllImages();
            }}>
            <Text style={styles.buttonText}>View All Images</Text>
          </TouchableHighlight>
        </View>
      )}

      <View style={styles.imageContainer}>
        {/** <Text style={styles.text}>{presentImage.name}</Text>
         *  <Image style={styles.image} source={{uri: presentImage.uri}} />
         **/}


        <PhotoView
          source={{uri: presentImage.uri}}
          minimumZoomScale={0.5}
          maximumZoomScale={3}
          androidScaleType="fitCenter"
          onLoad={() => smartLog('Image loaded!', actualDimension)}
          style={styles.image}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          disabled={presentImage.index === 0}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            ...styles.button,
            borderRightColor: 'white',
            borderRightWidth: 1 / fontScale,
            ...(presentImage.index === 0
              ? {backgroundColor: 'rgba(65, 105, 225, 0.5)'}
              : {}),
          }}
          onPress={() => {
            onPress('previous');
          }}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={presentImage.index === images.length - 1}
          style={{
            ...styles.button,
            ...(presentImage.index === images.length - 1
              ? {backgroundColor: 'rgba(65, 105, 225, 0.5)'}
              : {}),
          }}
          onPress={() => {
            onPress('next');
          }}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Gallery;
