import React from 'react';
import { CalculationRow, OperationType } from '../types';

interface CalculatorRowProps {
  index: number;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  onFocus?: () => void;
  onEnterPress?: () => void;
  onClear?: () => void;
}

// Конфигурация полей для разных типов операций
const FIELD_CONFIG = {
  // Операции с одним полем (ввод через запятую)
  oneField: ['sum_comma', 'diff_comma', 'mul_comma', 'div_comma', 'quarter_third'],
  
  // Операции с тремя полями
  threeFields: ['chain_calc'],
  
  // Операции с двумя полями (по умолчанию)
  twoFields: ['percent_of', 'sub_percent', 'add_percent', 'mod', 'ratio', 
              'relative_ratio', 'percent_change_relative', 'add_time', 'sub_time']
};

// Получение типа операции для корректных подписей полей
const getFieldLabels = (operation: OperationType): string[] => {
  // Арифметические операции (ввод через запятую)
  if (['sum_comma', 'diff_comma', 'mul_comma', 'div_comma'].includes(operation)) {
    return ['Числа через запятую (1, 2, 3, ...)'];
  }
  
  // Операция с половиной, четвертью и т.д.
  if (operation === 'quarter_third') {
    return ['Исходное число'];
  }
  
  // Операции с процентами
  if (['percent_of', 'mod'].includes(operation)) {
    return ['Число', 'Процент'];
  }
  
  if (['add_percent', 'sub_percent'].includes(operation)) {
    return ['Число', 'Добавляемый процент'];
  }
  
  // Операции с соотношениями
  if (operation === 'ratio') {
    return ['Число 1', 'Число 2'];
  }
  
  if (operation === 'relative_ratio') {
    return ['Числитель', 'Знаменатель'];
  }
  
  // Операция с процентным изменением
  if (operation === 'percent_change_relative') {
    return ['Начальное число', 'Конечное число'];
  }
  
  // Операция с формулами a → b → c
  if (operation === 'chain_calc') {
    return ['Число a', 'Процент для b', 'Процент для c'];
  }
  
  // Операции со временем
  if (['add_time', 'sub_time'].includes(operation)) {
    return ['Время 1 (ч:мм)', 'Время 2 (ч:мм)'];
  }
  
  // По умолчанию
  return ['Значение 1', 'Значение 2', 'Значение 3'];
};

const CalculatorRow: React.FC<CalculatorRowProps> = ({
  index,
  label,
  value,
  placeholder = '',
  onChange,
  onRemove,
  showRemove = true,
  onFocus,
  onEnterPress,
  onClear
}) => {
  // Обработчик нажатия клавиш в поле ввода
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  // Обработчик очистки поля
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange(''); // По умолчанию просто очищаем поле
    }
  };

  return (
    <div className="input-row-container">
      <div className="input-row-label">
        {label}
        <button
          onClick={handleClear}
          className="clear-button"
          title="Очистить поле"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 3H8l-7 8 7 8h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
            <line x1="18" y1="9" x2="12" y2="15"></line>
            <line x1="12" y1="9" x2="18" y2="15"></line>
          </svg>
        </button>
      </div>
      <div className="flex-1 relative">
        <input
          id={`field-${index}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className="input-field"
          onKeyDown={handleKeyDown}
        />
      </div>
      
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="delete-button"
          aria-label="Удалить поле"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CalculatorRow; 