'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface ToDoListProps {
  userId: string;
}

interface Todo {
  id: string;
  text: string;
}

export default function ToDoList({ userId }: ToDoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Todo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
      }));
      setTodos(fetched);
    }, (error) => {
      console.warn('ToDo list permission error:', error);
      // Don't break the app if todos can't be loaded
    });

    return () => unsubscribe();
  }, [userId]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await addDoc(collection(db, 'todos'), {
      userId,
      text: newTodo.trim(),
      timestamp: new Date(),
    });
    setNewTodo('');
  };

  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, 'todos', id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Todo Form */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new career task..."
          className="flex-1 bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]/20"
        />
        <Button
          onClick={addTodo}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
          disabled={!newTodo.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">No tasks yet. Add your first career goal!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex justify-between items-center bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 rounded-lg hover:bg-[var(--surface-card)] transition-all duration-300 group"
            >
              <span className="text-[var(--foreground)] flex-1">{todo.text}</span>
              <Button
                onClick={() => deleteTodo(todo.id)}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
