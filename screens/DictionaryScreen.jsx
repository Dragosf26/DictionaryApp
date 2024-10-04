import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DictionaryScreen() {
  const [dictionary, setDictionary] = useState({});
  const [newChapter, setNewChapter] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapterList, setChapterList] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledWords, setShuffledWords] = useState([]); // Stocăm cuvintele amestecate

  // Load dictionaries on component mount
  useEffect(() => {
    loadDictionaries();
  }, []);

  // Update chapter list when dictionary is modified
  useEffect(() => {
    if (dictionary) {
      setChapterList(Object.keys(dictionary));
    }
  }, [dictionary]);

  // Load dictionaries from AsyncStorage
  const loadDictionaries = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('dictionaries');
      const loadedDictionary = jsonValue != null ? JSON.parse(jsonValue) : {};
      setDictionary(loadedDictionary);
    } catch (e) {
      Alert.alert('Eroare', 'Nu s-a putut încărca dicționarul');
    }
  };

  // Save dictionaries to AsyncStorage
  const saveDictionaries = async (newDictionary) => {
    try {
      const jsonValue = JSON.stringify(newDictionary);
      await AsyncStorage.setItem('dictionaries', jsonValue);
    } catch (e) {
      Alert.alert('Eroare', 'Nu s-a putut salva dicționarul');
    }
  };

  // Add a new chapter
  const handleAddChapter = () => {
    if (newChapter && !dictionary[newChapter]) {
      const newDictionary = { ...dictionary, [newChapter]: [] };
      setDictionary(newDictionary);
      setChapterList((prev) => [...prev, newChapter]);
      setSelectedChapter(newChapter); // Select the newly added chapter
      saveDictionaries(newDictionary); // Save the updated dictionary
      setNewChapter(''); // Reset the input field for new chapters
    } else {
      Alert.alert('Eroare', 'Capitolul există deja sau numele este gol.');
    }
  };

  // Delete a selected chapter
  const handleDeleteChapter = () => {
    if (!selectedChapter) {
      Alert.alert('Eroare', 'Nu ai selectat niciun capitol pentru ștergere.');
      return;
    }

    // Remove selected chapter
    const { [selectedChapter]: _, ...remainingChapters } = dictionary;
    setDictionary(remainingChapters);
    saveDictionaries(remainingChapters);

    setSelectedChapter(''); // Reset the selected chapter
    Alert.alert('Succes', `Capitolul "${selectedChapter}" a fost șters.`);
  };

  // Add a word to the selected chapter
  const handleAddWord = () => {
    if (newWord && newTranslation && selectedChapter) {
      const updatedWords = [...dictionary[selectedChapter], { word: newWord, translation: newTranslation }];
      const newDictionary = { ...dictionary, [selectedChapter]: updatedWords };
      setDictionary(newDictionary);
      saveDictionaries(newDictionary);
      setNewWord(''); // Reset word input
      setNewTranslation(''); // Reset translation input
    } else {
      Alert.alert('Eroare', 'Completează cuvântul și traducerea sau selectează un capitol.');
    }
  };

  const handleDeleteWord = (index) => {
    if (selectedChapter) {
      const updatedWords = dictionary[selectedChapter].filter((_, i) => i !== index);
      const newDictionary = { ...dictionary, [selectedChapter]: updatedWords };
      setDictionary(newDictionary);
      saveDictionaries(newDictionary);
    }
  };

  // Shuffle function to randomize words array (Fisher-Yates Shuffle)
  const shuffleArray = (array) => {
    let shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  // Start quiz with shuffled words
  const handleStartQuiz = () => {
    const words = dictionary[selectedChapter];
    if (words && words.length > 0) {
      const shuffled = shuffleArray(words); // Amestecăm cuvintele
      setShuffledWords(shuffled); // Salvăm lista amestecată
      setQuizStarted(true);
      setQuizFinished(false);
      setCurrentQuestionIndex(0);
      setScore(0);
      setUserAnswer('');
    } else {
      Alert.alert('Eroare', 'Nu există cuvinte în capitolul selectat.');
    }
  };

  // Handle user's answer
  const handleAnswer = () => {
    const correctTranslation = shuffledWords[currentQuestionIndex].translation.trim().toLowerCase();
    const userTranslation = userAnswer.trim().toLowerCase();

    if (userTranslation === correctTranslation) {
      setScore(score + 1); // Increment score if correct
    }

    setUserAnswer(''); // Clear the input field

    if (currentQuestionIndex + 1 < shuffledWords.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1); // Move to next question
    } else {
      setQuizFinished(true); // End the quiz
      setQuizStarted(false); // Mark quiz as finished
    }
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

  const handleRestartQuiz = () => {
    handleStartQuiz();
  };

  return (
    <View style={styles.container}>
      {!quizStarted && !quizFinished && (
        <>
          <Text style={styles.title}>Capitole:</Text>
          <FlatList
            data={chapterList}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedChapter(item)}>
                <Text style={[styles.chapter, selectedChapter === item && styles.selectedChapter]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />

          <TextInput
            placeholder="Nume capitol nou"
            value={newChapter}
            onChangeText={setNewChapter}
            style={styles.input}
          />
          <Button title="Adaugă capitol" onPress={handleAddChapter} />

          {selectedChapter && (
            <>
              <Button title="Șterge capitolul selectat" color="red" onPress={handleDeleteChapter} />
              <TextInput
                placeholder="Cuvânt"
                value={newWord}
                onChangeText={setNewWord}
                style={styles.input}
              />
              <TextInput
                placeholder="Traducere"
                value={newTranslation}
                onChangeText={setNewTranslation}
                style={styles.input}
              />
              <Button title="Adaugă cuvânt" onPress={handleAddWord} />
              <Button title="Pornește Quiz-ul" onPress={handleStartQuiz} />
            </>
          )}

          {selectedChapter && (
            <>
              <Text style={styles.title}>Cuvintele din {selectedChapter}:</Text>
              <FlatList
                data={dictionary[selectedChapter]}
                renderItem={({ item, index }) => (
                  <View style={styles.wordContainer}>
                    <Text style={styles.wordText}>{item.word} = {item.translation}</Text>
                    <Button title="Șterge" color="red" onPress={() => handleDeleteWord(index)} />
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </>
          )}
        </>
      )}

      {quizStarted && renderQuiz()}

      {!quizStarted && quizFinished && (
        <View>
          <Text style={styles.quizResult}>Quiz terminat!</Text>
          <Text style={styles.quizResult}>Scor: {score} / {dictionary[selectedChapter].length}</Text>
          <Button title="Reîncepe Quiz-ul" onPress={handleRestartQuiz} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
  chapter: {
    fontSize: 18,
    padding: 10,
    backgroundColor: '#eee',
    marginBottom: 5,
  },
  selectedChapter: {
    backgroundColor: '#d3d3d3',
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  wordText: {
    fontSize: 16,
  },
  question: {
    fontSize: 18,
    marginBottom: 10,
  },
  quizResult: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
});

