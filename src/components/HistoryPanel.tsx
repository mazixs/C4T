import React, { useState, useEffect, useRef } from 'react';
import { CalculationResult, OperationType } from '../types';

// Интерфейс пропсов для компонента HistoryPanel
interface HistoryPanelProps {
  history: CalculationResult[];
  onInsertFromHistory: (value: string) => void;
  activeOperation: OperationType;
}

// Получение количества полей для операции
const getFieldCount = (operation: OperationType): number => {
  // Операции с одним полем
  if (operation === OperationType.simple_calc) {
    return 1;
  }
  
  // По умолчанию - операции с двумя полями
  return 2;
};

// Получение названий полей в зависимости от операции
const getFieldLabels = (operation: OperationType): string[] => {
  // Простая арифметика
  if (operation === OperationType.simple_calc) {
    return ['Выражение'];
  }
  
  // Операции с процентами
  if (operation === OperationType.percent_of || operation === OperationType.mod) {
    return ['Число', 'Процент'];
  }
  
  if (operation === OperationType.add_percent || operation === OperationType.sub_percent) {
    return ['Число', 'Добавляемый процент'];
  }
  
  // Операции с соотношениями
  if (operation === OperationType.ratio) {
    return ['Число 1', 'Число 2'];
  }
  
  if (operation === OperationType.relative_ratio) {
    return ['Числитель', 'Знаменатель'];
  }
  
  // Операция с процентным изменением
  if (operation === OperationType.percent_change_relative) {
    return ['Начальное число', 'Конечное число'];
  }
  
  // Операции со временем
  if (operation === OperationType.add_time || operation === OperationType.sub_time) {
    return ['Время 1', 'Время 2'];
  }
  
  // По умолчанию
  return ['Значение 1', 'Значение 2'];
};

// Получение читаемого названия операции
const getOperationName = (operationType: OperationType | undefined): string => {
  const OPERATION_NAMES: Record<string, string> = {
    'percent_of': 'Процент от числа',
    'sub_percent': 'Вычитание процента',
    'add_percent': 'Добавление процента',
    'mod': 'Остаток от вычитания %',
    'ratio': 'Соотношение',
    'relative_ratio': 'Соотношение долей напрямую',
    'percent_change_relative': 'Процентное изменение',
    'quarter_third': 'Половина, четверть, треть и т.д.',
    'sum_comma': 'Сумма чисел',
    'diff_comma': 'Разность чисел',
    'mul_comma': 'Произведение чисел',
    'div_comma': 'Деление чисел',
    'chain_calc': 'Формулы a → b → c',
    'simple_calc': 'Простая арифметика',
    'add_time': 'Сложение времени',
    'sub_time': 'Вычитание времени'
  };
  
  return operationType ? (OPERATION_NAMES[operationType] || 'Расчет') : 'Расчет';
};

// Форматирование числа для отображения (сохраняем пробелы для разделения тысяч)
const formatNumberForDisplay = (number: string): string => {
  return number.trim();
};

// Извлечение и форматирование чисел из текста результата
const extractNumbersFromResult = (result: string): string[] => {
  // Регулярное выражение для поиска чисел (включая числа с пробелами между цифрами)
  const regex = /(-?\d+(?:\s\d+)*(?:[.,]\d+)?|:\d+)/g;
  const matches = result.match(regex);
  
  if (!matches) return [];
  
  return matches.map(match => formatNumberForDisplay(match));
};

// Форматирование результата в зависимости от типа операции
const formatResult = (item: CalculationResult): string => {
  if (item.operation === OperationType.ratio) {
    // Для соотношений оставляем как есть, так как теперь они уже отформатированы правильно
    return item.result;
  }
  return item.result;
};

// Рендер элемента истории с кликабельными числами
const renderHistoryItem = (item: CalculationResult, handleNumberClick: (value: string) => void) => {
  const combinedExpression = formatResult(item);
  const numbers = extractNumbersFromResult(combinedExpression);
  
  // Поиск и выделение чисел для кликабельности
  let lastIndex = 0;
  const parts = [];
  
  numbers.forEach((number: string, index: number) => {
    const numberIndex = combinedExpression.indexOf(number, lastIndex);
    
    if (numberIndex !== -1) {
      // Добавляем текст до числа
      if (numberIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}-${item.timestamp}`}>
            {combinedExpression.substring(lastIndex, numberIndex)}
          </span>
        );
      }
      
      // Добавляем кликабельное число
      parts.push(
        <span 
          key={`number-${index}-${item.timestamp}`}
          className="history-number" 
          onClick={() => handleNumberClick(number)}
        >
          {number}
        </span>
      );
      
      lastIndex = numberIndex + number.length;
    }
  });
  
  // Добавляем оставшийся текст
  if (lastIndex < combinedExpression.length) {
    parts.push(
      <span key={`text-end-${item.timestamp}`}>
        {combinedExpression.substring(lastIndex)}
      </span>
    );
  }
  
  return (
    <div key={item.timestamp} className="history-item">
      <div className="history-operation">{getOperationName(item.operation)}</div>
      <div className="history-expression">{parts}</div>
    </div>
  );
};

/**
 * Компонент панели истории вычислений
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onInsertFromHistory, activeOperation }) => {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  
  // Получаем количество полей и их названия для текущей операции
  const fieldCount = getFieldCount(activeOperation);
  const fieldLabels = getFieldLabels(activeOperation);
  
  // Таймаут сообщения о копировании
  useEffect(() => {
    if (copiedMessage) {
      const timer = setTimeout(() => {
        setCopiedMessage(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copiedMessage]);
  
  // Обработка клика по числу в истории
  const handleNumberClick = (number: string) => {
    onInsertFromHistory(number);
  };
  
  // Универсальный метод копирования, работающий на всех устройствах
  const copyTextToClipboard = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Сначала пробуем использовать современный Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => resolve(true))
          .catch(() => {
            // Если современный метод не сработал, используем fallback
            fallbackCopyTextToClipboard(text);
            resolve(true);
          });
      } else {
        // Для устройств без поддержки Clipboard API
        fallbackCopyTextToClipboard(text);
        resolve(true);
      }
    });
  };

  // Резервный метод копирования через временный элемент
  const fallbackCopyTextToClipboard = (text: string): void => {
    try {
      // Создаем временный элемент
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Скрываем элемент, но оставляем его в DOM
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Выбираем и копируем текст
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      
      // Удаляем временный элемент
      document.body.removeChild(textArea);
      
      if (!successful) {
        console.error('Не удалось скопировать текст');
      }
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  // Копировать всю историю в буфер обмена
  const copyAllHistory = () => {
    if (history.length === 0) {
      setCopiedMessage('История пуста');
      return;
    }
    
    const formattedHistory = history
      .map(item => {
        const opName = getOperationName(item.operation);
        return `${opName}: ${item.result}`;
      })
      .join('\n');
    
    copyTextToClipboard(formattedHistory)
      .then(() => setCopiedMessage('История скопирована'))
      .catch(() => {
        setCopiedMessage('Ошибка копирования');
        console.error('Ошибка копирования в буфер обмена');
      });
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>История вычислений</h2>
        <button 
          className="copy-history-button"
          onClick={copyAllHistory}
          title="Скопировать всю историю"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Копировать
        </button>
      </div>
      
      {copiedMessage && (
        <div className="copied-message">{copiedMessage}</div>
      )}
      
      <div className="history-items">
        {history.length === 0 ? (
          <div className="history-empty">История пуста</div>
        ) : (
          history
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((item) => renderHistoryItem(item, handleNumberClick))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel; 