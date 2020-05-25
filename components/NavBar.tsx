import React, {useContext} from 'react';
import {View, Text, ViewStyle, StyleSheet} from 'react-native';
import {SizeContext} from '../contexts';

function NavBar({page, customStyles}: {page: string; customStyles: ViewStyle}) {
  const {dHeight, dWidth, fontScale} = useContext(SizeContext);

  const styles = StyleSheet.create({
    text: {
      fontSize: 14 / fontScale,
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      paddingTop: dHeight * 0.006,
      color: 'white',
      textTransform: 'capitalize',
    },
  });

  return (
    <View style={customStyles}>
      <Text style={styles.text}> {page}</Text>
    </View>
  );
}

export default NavBar;
