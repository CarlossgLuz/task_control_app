import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@task_control_app:tasks';
const Tab = createBottomTabNavigator();

function ScreenContainer({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

function EmptyList({ message }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function TaskItem({ item, onComplete, onRemove, showCompleteButton }) {
  return (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>

      <View style={styles.taskActions}>
        {showCompleteButton ? (
          <Pressable
            style={[styles.iconButton, styles.completeButton]}
            onPress={() => onComplete(item.id)}
          >
            <Ionicons name="checkmark" size={20} color="#ffffff" />
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.iconButton, styles.removeButton]}
          onPress={() => onRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

function AddTaskScreen({ taskTitle, setTaskTitle, onAddTask }) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Adicionar Tarefa</Text>
      <Text style={styles.subtitle}>Digite uma atividade e toque em adicionar.</Text>

      <TextInput
        value={taskTitle}
        onChangeText={setTaskTitle}
        placeholder="Ex.: Estudar React Native"
        style={styles.input}
      />

      <Pressable style={styles.addButton} onPress={onAddTask}>
        <Text style={styles.addButtonText}>Adicionar</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function TasksScreen({ tasks, onCompleteTask, onRemoveTask }) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Lista de Tarefas</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onComplete={onCompleteTask}
            onRemove={onRemoveTask}
            showCompleteButton
          />
        )}
        ListEmptyComponent={<EmptyList message="Nenhuma tarefa pendente." />}
        contentContainerStyle={tasks.length === 0 ? styles.flatListEmpty : styles.flatListContent}
      />
    </ScreenContainer>
  );
}

function CompletedTasksScreen({ tasks, onRemoveTask }) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Tarefas Concluídas</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem item={item} onRemove={onRemoveTask} showCompleteButton={false} />
        )}
        ListEmptyComponent={<EmptyList message="Nenhuma tarefa concluída." />}
        contentContainerStyle={tasks.length === 0 ? styles.flatListEmpty : styles.flatListContent}
      />
    </ScreenContainer>
  );
}

export default function App() {
  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        Alert.alert('Erro', 'Nao foi possivel carregar as tarefas salvas.');
      } finally {
        setIsLoaded(true);
      }
    }

    loadTasks();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel salvar as tarefas.');
    });
  }, [isLoaded, tasks]);

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const addTask = () => {
    const formattedTitle = taskTitle.trim();

    if (!formattedTitle) {
      Alert.alert('Aviso', 'Digite uma tarefa antes de adicionar.');
      return;
    }

    const newTask = {
      id: String(Date.now()),
      title: formattedTitle,
      completed: false,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setTaskTitle('');
  };

  const completeTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: true } : task
      )
    );
  };

  const removeTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: styles.tabBar,
            tabBarIcon: ({ color, size }) => {
              const icons = {
                Adicionar: 'add-circle-outline',
                Tarefas: 'list-outline',
                Concluidas: 'checkmark-done-outline',
              };

              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Adicionar">
            {() => (
              <AddTaskScreen
                taskTitle={taskTitle}
                setTaskTitle={setTaskTitle}
                onAddTask={addTask}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Tarefas">
            {() => (
              <TasksScreen
                tasks={pendingTasks}
                onCompleteTask={completeTask}
                onRemoveTask={removeTask}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Concluidas">
            {() => (
              <CompletedTasksScreen tasks={completedTasks} onRemoveTask={removeTask} />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  flatListContent: {
    paddingBottom: 24,
  },
  flatListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
  },
  taskItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#16a34a',
  },
  removeButton: {
    backgroundColor: '#dc2626',
  },
  tabBar: {
    height: 62,
    paddingBottom: 8,
    paddingTop: 8,
  },
});
