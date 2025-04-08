'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CalculationRow, CalculationResult as CalcResultType, OperationType } from '../types';
import CalculatorRow from './CalculatorRow';
import HistoryPanel from './HistoryPanel';
import { calculate } from '../services/calculatorService';
import { getHistory, addToHistory, clearHistory, exportHistory } from '../services/historyService';
import CalculationResult from './CalculationResult';

// Категории операций для улучшения UX
const OPERATION_CATEGORIES = {
  percentages: {
    label: 'Процентные вычисления',
    operations: [
      'percent_of',
      'sub_percent',
      'add_percent',
      'mod',
      'percent_change_relative'
    ]
  },
  ratios: {
    label: 'Соотношения',
    operations: [
      'ratio',
      'relative_ratio',
      'common_denominator'
    ]
  },
  arithmetic: {
    label: 'Арифметические операции',
    operations: [
      'quarter_third',
      'sum_comma',
      'diff_comma',
      'mul_comma',
      'div_comma',
      'chain_calc',
      'simple_calc'
    ]
  },
  time: {
    label: 'Операции со временем',
    operations: [
      'add_time',
      'sub_time'
    ]
  }
};

const OPERATION_LABELS: Record<OperationType, string> = {
  percent_of: 'Процент от числа',
  sub_percent: 'Вычесть процент',
  add_percent: 'Добавить процент',
  mod: 'Остаток от вычитания %',
  ratio: 'Соотношение',
  relative_ratio: 'Соотношение долей напрямую',
  percent_change_relative: 'Процентное изменение между числами',
  quarter_third: 'Половина, четверть, треть и пятая часть',
  sum_comma: 'Сумма чисел через запятую',
  diff_comma: 'Разность (от первого вычесть остальные)',
  mul_comma: 'Произведение чисел',
  div_comma: 'Деление по порядку',
  chain_calc: 'Формулы: a → b → c',
  simple_calc: 'Простая арифметика (800+800+950-250)',
  add_time: 'Сложить время',
  sub_time: 'Вычесть время',
  common_denominator: 'Общий знаменатель'
};

// Конфигурация полей для разных типов операций
const FIELD_CONFIG = {
  // Операции с одним полем (ввод через запятую)
  oneField: ['sum_comma', 'diff_comma', 'mul_comma', 'div_comma', 'quarter_third', 'simple_calc'],
  
  // Операции с тремя полями
  threeFields: ['chain_calc'],
};

const operationButtons = [
  { type: OperationType.add, label: '+' },
  { type: OperationType.sub, label: '-' },
  { type: OperationType.mul, label: '×' },
  { type: OperationType.div, label: '÷' },
  { type: OperationType.ratio, label: ':' },
  { type: OperationType.common_denominator, label: 'НОК' },
  { type: OperationType.time_add, label: 'Время +' },
  { type: OperationType.time_sub, label: 'Время -' },
];

const Calculator: React.FC = () => {
  const [operation, setOperation] = useState<OperationType>('percent_of');
  const [rows, setRows] = useState<CalculationRow[]>([{ value1: '', value2: '' }]);
  const [results, setResults] = useState<string[]>([]);
  const [history, setHistory] = useState<CalcResultType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number>(0);
  const [isActionsOpen, setIsActionsOpen] = useState<boolean>(false);
  
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка истории при инициализации
  useEffect(() => {
    setHistory(getHistory());
  }, []);
  
  // Закрытие выпадающего меню по клику вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // При изменении операции обновляем строки ввода и адаптируем их под новую операцию
  useEffect(() => {
    // Проверяем тип операции для нужного количества полей
    const isOneField = FIELD_CONFIG.oneField.includes(operation);
    const isThreeFields = FIELD_CONFIG.threeFields.includes(operation);
    
    // Обновляем текущие строки в соответствии с новой операцией
    const updatedRows = rows.map(row => {
      const newRow: CalculationRow = { ...row };
      
      // Для операций с одним полем очищаем второе поле
      if (isOneField) {
        newRow.value2 = '';
      }
      
      // Для операций с тремя полями добавляем третье поле, если его нет
      if (isThreeFields && !newRow.value3) {
        newRow.value3 = '';
      }
      
      // Для операций не с тремя полями удаляем третье поле, если оно есть
      if (!isThreeFields && newRow.value3 !== undefined) {
        delete newRow.value3;
      }
      
      return newRow;
    });
    
    setRows(updatedRows);
    setResults([]);
    setError(null);
  }, [operation]);

  // Обработка изменения операции
  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOperation(e.target.value as OperationType);
  };

  // Обработка изменения строки ввода
  const handleRowChange = (index: number, updatedRow: CalculationRow) => {
    const newRows = [...rows];
    newRows[index] = updatedRow;
    setRows(newRows);
  };

  // Установка активной строки и поля при клике на ввод
  const handleRowFocus = (index: number, fieldIndex: number) => {
    setActiveRowIndex(index);
    setActiveFieldIndex(fieldIndex);
  };

  // Добавление новой строки ввода
  const addRow = () => {
    const isOneField = FIELD_CONFIG.oneField.includes(operation);
    const isThreeFields = FIELD_CONFIG.threeFields.includes(operation);
    
    const newRow: CalculationRow = { 
      value1: '', 
      value2: isOneField ? '' : '', // Пустое второе поле для всех типов операций для единообразия
    };
    
    // Добавляем третье поле только для операций с тремя полями
    if (isThreeFields) {
      newRow.value3 = '';
    }
    
    setRows([...rows, newRow]);
  };

  // Удаление строки ввода
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
      
      // Если удаляем активную строку, устанавливаем первую как активную
      if (index === activeRowIndex) {
        setActiveRowIndex(0);
      } else if (index < activeRowIndex) {
        // Если удаляем строку перед активной, корректируем индекс
        setActiveRowIndex(activeRowIndex - 1);
      }
    }
  };

  // Расчет для всех строк
  const calculateAll = () => {
    setError(null);
    
    if (rows.length === 0) {
      setError('Добавьте хотя бы одну строку для расчета');
      return;
    }
    
    const newResults: string[] = [];
    let newHistory = [...history];
    
    rows.forEach(row => {
      const result = calculate(row, operation);
      
      if (result) {
        newResults.push(result.result);
        
        // Если это не ошибка, добавляем в историю
        if (!result.result.startsWith('Ошибка:')) {
          newHistory = addToHistory(result);
        }
      }
    });
    
    setResults(newResults);
    setHistory(newHistory);
  };

  // Вставка значения из истории в активную строку и выбранное поле
  const insertFromHistory = (value: string) => {
    if (rows.length > 0 && activeRowIndex < rows.length) {
      const newRows = [...rows];
      const activeRow = { ...newRows[activeRowIndex] };
      
      // Вставляем значение в активное поле
      if (activeFieldIndex === 0) {
        activeRow.value1 = activeRow.value1 + value;
      } else if (activeFieldIndex === 1 && !FIELD_CONFIG.oneField.includes(operation)) {
        activeRow.value2 = activeRow.value2 + value;
      } else if (activeFieldIndex === 2 && FIELD_CONFIG.threeFields.includes(operation) && activeRow.value3 !== undefined) {
        activeRow.value3 = activeRow.value3 + value;
      }
      
      newRows[activeRowIndex] = activeRow;
      setRows(newRows);
    }
  };

  // Очистка истории
  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    setIsActionsOpen(false);
  };
  
  // Функция для копирования результата в буфер обмена
  const shareResults = () => {
    if (results.length === 0) {
      setError('Нет результатов для копирования');
      return;
    }
    
    const textToCopy = results.join('\n');
    
    try {
      navigator.clipboard.writeText(textToCopy);
      setError('Результаты скопированы в буфер обмена');
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      setError('Не удалось скопировать результаты');
    }
    
    setIsActionsOpen(false);
  };
  
  // Переключение состояния выпадающего меню
  const toggleActionsDropdown = () => {
    setIsActionsOpen(!isActionsOpen);
  };

  // Получение меток полей в зависимости от типа операции
  const getFieldLabels = (op: OperationType): [string, string, string] => {
    switch (op) {
      case 'percent_of':
        return ['Число', 'Процент', ''];
      case 'add_percent':
        return ['Число', 'Процент', ''];
      case 'sub_percent':
        return ['Число', 'Процент', ''];
      case 'mod':
        return ['Число', 'Процент', ''];
      case 'ratio':
        return ['Число 1', 'Число 2', ''];
      case 'relative_ratio':
        return ['Числитель', 'Знаменатель', ''];
      case 'percent_change_relative':
        return ['Начальное число', 'Конечное число', ''];
      case 'add_time':
        return ['Время 1', 'Время 2', ''];
      case 'sub_time':
        return ['Время 1', 'Время 2', ''];
      case 'simple_calc':
        return ['Арифметическое выражение', '', ''];
      default:
        return ['Число 1', 'Число 2', 'Число 3'];
    }
  };

  // Обработчик нажатия клавиши Enter для расчета
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      calculateAll();
    }
  };

  // Функция return
  return (
    <div className="max-w-5xl mx-auto px-4 py-2" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card">
            <h1 className="calculator-title">Умный калькулятор</h1>
            
            {/* Выбор операции */}
            <div className="mb-4">
              <h3 className="text-base font-medium mb-2">Выберите операцию:</h3>
              <div className="py-2">
                {Object.entries(OPERATION_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category.label}</h4>
                    <div className="operations-container">
                      {category.operations.map((op) => (
                        <button
                          key={op}
                          onClick={() => handleOperationChange({ target: { value: op } } as React.ChangeEvent<HTMLSelectElement>)}
                          className={`operation-button ${operation === op ? 'active' : ''}`}
                          style={operation === op ? {
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderColor: '#3b82f6',
                            fontWeight: 600,
                            boxShadow: '0 0 0 2px #93c5fd'
                          } : {}}
                        >
                          {OPERATION_LABELS[op as OperationType]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 my-4">
              {rows.map((row, index) => {
                const showOneField = FIELD_CONFIG.oneField.includes(operation);
                const showThreeFields = FIELD_CONFIG.threeFields.includes(operation);
                const fieldLabels = getFieldLabels(operation);
                
                return (
                  <div key={index} className={`input-row ${index === activeRowIndex ? 'active' : ''}`}>
                    {/* Первое поле (всегда видимо) */}
                    <CalculatorRow
                      index={index * 3}
                      label={fieldLabels[0]}
                      value={row.value1}
                      placeholder={fieldLabels[0]}
                      onChange={(value) => handleRowChange(index, { ...row, value1: value })}
                      showRemove={rows.length > 1}
                      onRemove={() => removeRow(index)}
                      onFocus={() => handleRowFocus(index, 0)}
                      onEnterPress={calculateAll}
                      onClear={() => handleRowChange(index, { ...row, value1: '' })}
                    />
                    
                    {/* Второе поле (скрыто для oneField операций) */}
                    {!showOneField && (
                      <CalculatorRow
                        index={index * 3 + 1}
                        label={fieldLabels[1]}
                        value={row.value2}
                        placeholder={fieldLabels[1]}
                        onChange={(value) => handleRowChange(index, { ...row, value2: value })}
                        showRemove={false}
                        onFocus={() => handleRowFocus(index, 1)}
                        onEnterPress={calculateAll}
                        onClear={() => handleRowChange(index, { ...row, value2: '' })}
                      />
                    )}
                    
                    {/* Третье поле (видимо только для threeFields операций) */}
                    {showThreeFields && row.value3 !== undefined && (
                      <CalculatorRow
                        index={index * 3 + 2}
                        label={fieldLabels[2]}
                        value={row.value3}
                        placeholder={fieldLabels[2]}
                        onChange={(value) => handleRowChange(index, { ...row, value3: value })}
                        showRemove={false}
                        onFocus={() => handleRowFocus(index, 2)}
                        onEnterPress={calculateAll}
                        onClear={() => handleRowChange(index, { ...row, value3: '' })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Кнопка расчета */}
            <div className="flex flex-wrap justify-center gap-2 my-4">
              <button 
                onClick={calculateAll} 
                className="btn btn-success"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Рассчитать
              </button>
              
              <button 
                onClick={addRow} 
                className="btn btn-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Добавить строку
              </button>

              <div className="relative inline-block">
                <button
                  onClick={toggleActionsDropdown}
                  className="btn btn-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  Действия
                </button>
                
                {isActionsOpen && (
                  <div className="fixed-tooltip mt-2 absolute right-0 z-10" ref={actionsDropdownRef}>
                    <button onClick={shareResults} className="w-full text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Копировать результаты
                    </button>
                    <button onClick={exportHistory} className="w-full text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Экспорт истории
                    </button>
                    <button onClick={handleClearHistory} className="w-full text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Очистить историю
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className={`p-3 mb-4 rounded text-sm ${error.startsWith('Ошибка:') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}>
                {error}
              </div>
            )}
            
            {results.length > 0 && (
              <div className="result-panel">
                {results.map((result, index) => (
                  <div key={index} className={result.startsWith('Ошибка:') ? 'text-red-600' : ''}>
                    <CalculationResult result={result} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <HistoryPanel 
            history={history} 
            onInsertFromHistory={insertFromHistory} 
            activeOperation={operation}
          />
        </div>
      </div>
    </div>
  );
};

export default Calculator; 