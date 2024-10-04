import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export default function ExternalDictionary() {
  const [dictionaryName, setDictionaryName] = useState(null);
  const [words, setWords] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswer, setUserAnswer] = useState(''); // Stocăm răspunsul utilizatorului
  const [shuffledWords, setShuffledWords] = useState([]); // Stocăm cuvintele amestecate

  const handlePickDictionary = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain', // Permite doar fișiere .txt
      });

      if (!result.canceled && result.assets.length > 0) {
        const { uri } = result.assets[0];

        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const fileText = await response.text();
          processFileContent(fileText);
        } else {
          const file = await FileSystem.readAsStringAsync(uri);
          processFileContent(file);
        }
      } else {
        Alert.alert('Eroare', 'Niciun fișier selectat.');
      }
    } catch (error) {
      Alert.alert('Eroare', 'A eșuat selectarea fișierului');
      console.error(error);
    }
  };

  const processFileContent = (fileContent) => {
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) {
      Alert.alert('Eroare', 'Fișierul este gol sau nu conține date valide.');
      return;
    }

    const dictionaryName = lines[0];
    setDictionaryName(dictionaryName);

    const words = lines.slice(1).map(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        return { word: parts[0].trim(), translation: parts[1].trim() };
      }
      return null;
    }).filter(Boolean);

    setWords(words);
  };

  const shuffleArray = (array) => {
    let shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  // Funcție pentru a începe quiz-ul
  const startQuiz = () => {
    const shuffledWords = shuffleArray(words);
    setShuffledWords(shuffledWords);

    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setUserAnswer('');
  };

  const handleAnswer = () => {
    const correctTranslation = shuffledWords[currentQuestionIndex].translation.trim().toLowerCase();
    const userTranslation = userAnswer.trim().toLowerCase();
  
    if (userTranslation === correctTranslation) {
      setScore(score + 1); // Incrementăm scorul dacă răspunsul este corect
    }
  
    setUserAnswer(''); // Resetăm câmpul de răspuns
  
    if (currentQuestionIndex + 1 < words.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);  // Oprim quiz-ul și afișăm rezultatul
      setQuizStarted(false);  // Ne asigurăm că quiz-ul este marcat ca finalizat
    }
  };

  const showResult = () => {
    const finalScore = (score / words.length) * 100; // Calculăm procentajul scorului
    return (
      <View>
        <Text style={styles.quizResult}>Ai terminat quiz-ul!</Text>
        <Text style={styles.quizResult}>Scorul tău este: {finalScore.toFixed(2)} / 100</Text>
        <Button title="Reîncepe Quiz-ul" onPress={startQuiz} />
      </View>
    );
  };
  
  const renderQuiz = () => {
  
    const currentWord = shuffledWords[currentQuestionIndex];
  
    return (
      <View>
        <Text style={styles.question}>
          Care este traducerea cuvântului: {currentWord.word}?
        </Text>
        <TextInput
          style={styles.input}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Introdu răspunsul"
        />
        <Button title="Trimite răspuns" onPress={handleAnswer} />
      </View>
    );
  };
  

  return (
    <View style={styles.container}>
      {!quizStarted && !quizFinished && (
        <>
          <Button title="Atașează Dicționar" onPress={handlePickDictionary} />
          {dictionaryName && (
            <>
              <Text style={styles.dictionaryName}>Dicționar: {dictionaryName}</Text>
              <FlatList
                data={words}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text style={styles.word}>
                    {item.word} = {item.translation}
                  </Text>
                )}
              />
              {words.length > 0 && (
                <Button title="Pornește Quiz-ul" onPress={startQuiz} />
              )}
            </>
          )}
        </>
      )}

      {quizStarted && renderQuiz()}
      {!quizStarted && quizFinished && showResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  dictionaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  word: {
    fontSize: 16,
    paddingVertical: 5,
  },
  question: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  quizResult: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: 'green',
  },
});
