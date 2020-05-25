import React, {useContext, memo, Fragment, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ViewStyle,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SizeContext} from '../contexts';
import {smartLog, AndroidFileStorage} from '../utils';
import AsyncImage from './AsyncImage';

type ImageDetailsType = {uri: string; name: string};
const SimpleGallery = ({
  images,
  style,
  sendImageToPreview,
}: {
  images: ImageDetailsType[];
  style: ViewStyle;
  sendImageToPreview: (index: number) => void;
}) => {
  // Contexts
  const {fontScale, dHeight, dWidth} = useContext(SizeContext);

  const styles = StyleSheet.create({
    view: {
      fontSize: 40 / fontScale,
    },
    image: {
      height: dHeight * 0.5,
      width: dWidth * 0.9,
      alignSelf: 'center',
      backgroundColor: 'blue',
    },
    imageContainer: {
      justifyContent: 'center',
      alignContent: 'center',
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
      padding: 10,
      width: dWidth * 0.5,
      height: dHeight * 0.08,
    },
    buttonText: {
      color: 'white',
      fontSize: 20 / fontScale,
    },
    buttons: {
      flexDirection: 'row',
    },
  });

  const processPresentImage = async (newIndex: number) => {
    const newImage = images[newIndex];
    const value = await AndroidFileStorage(newImage.name).get();
    let preferredUri = `https://${newImage.uri}`;
    if (value) {
      const imageType = newImage.name.split('.')[1];
      smartLog({n: newImage.name, imageType, processed: true});
      preferredUri = `data:image/${imageType};base64,${value}`;
    }
    return preferredUri;
  };

  return (
    <ScrollView>
      <View style={{...style, ...styles.view}}>
        {[images[0], images[1]].map(
          ({name}: ImageDetailsType, index: number) => {
            return (
              <Fragment key={index}>
                <TouchableOpacity
                  onPress={() => {
                    sendImageToPreview(index);
                  }}>
                  <View style={styles.imageContainer}>
                    <Text style={styles.text}> {name} </Text>
                    <AsyncImage
                      getNewUri={processPresentImage}
                      customStyles={styles.image}
                      index={index}
                    />
                  </View>
                </TouchableOpacity>
              </Fragment>
            );
          },
        )}
      </View>
    </ScrollView>
  );
};

export default memo(SimpleGallery);
