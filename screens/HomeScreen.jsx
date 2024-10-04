import React from 'react';
import { SafeAreaView, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView>
      <Text>Welcome to the Home Screen!</Text>
      <Button
        title="Go to Dictionary"
        onPress={() => navigation.navigate('Dictionary')}
      />
      <Button
        title="Go to External Dictionary"
        onPress={() => navigation.navigate('ExternalDictionary')}
      />
    </SafeAreaView>
  );
}
