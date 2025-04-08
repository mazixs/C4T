import { CalculationResult } from '../types';

const HISTORY_KEY = 'calc_history';

// Получение истории расчетов из localStorage
export function getHistory(): CalculationResult[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Ошибка при получении истории из localStorage:', error);
    return [];
  }
}

// Добавление нового результата в историю
export function addToHistory(result: CalculationResult): CalculationResult[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = getHistory();
    
    // Проверка на дубликаты
    if (!history.some(item => item.result === result.result)) {
      const newHistory = [...history, result];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    }
    
    return history;
  } catch (error) {
    console.error('Ошибка при добавлении в историю:', error);
    return getHistory();
  }
}

// Очистка истории
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Ошибка при очистке истории:', error);
  }
}

// Экспорт истории в текстовый файл
export function exportHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getHistory();
    if (history.length === 0) {
      alert('История пуста');
      return;
    }
    
    const content = history.map(item => item.result).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'calculator_history.txt';
    a.click();
  } catch (error) {
    console.error('Ошибка при экспорте истории:', error);
    alert('Произошла ошибка при экспорте истории');
  }
} 