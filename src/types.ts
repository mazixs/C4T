// Типы операций
export enum OperationType {
  // Базовые операции
  add = 'add',
  sub = 'sub',
  mul = 'mul',
  div = 'div',
  
  // Проценты
  percent_of = 'percent_of',
  add_percent = 'add_percent',
  sub_percent = 'sub_percent',
  
  // Модуль
  mod = 'mod',
  
  // Соотношения
  ratio = 'ratio',
  relative_ratio = 'relative_ratio',
  
  // Изменения
  percent_change = 'percent_change',
  percent_change_relative = 'percent_change_relative',
  
  // Время
  add_time = 'add_time',
  sub_time = 'sub_time',
  
  // Простые арифметические операции
  simple_calc = 'simple_calc',
  
  // Операции с числами через запятую
  sum_comma = 'sum_comma',
  diff_comma = 'diff_comma',
  mul_comma = 'mul_comma',
  div_comma = 'div_comma',
  
  // Дополнительные операции
  quarter_third = 'quarter_third',
  chain_calc = 'chain_calc',
  
  // Общий знаменатель
  common_denominator = 'common_denominator',
  
  // Новые типы операций
  time_add = 'time_add',
  time_sub = 'time_sub'
}

// Строка ввода для расчетов
export interface CalculationRow {
  value1: string;
  value2: string;
  value3?: string; // Для операций с 3 аргументами
}

// Результат вычислений
export interface CalculationResult {
  operation: OperationType;       // Тип выполненной операции (больше не опциональное поле)
  parameters?: Record<string, any>; // Параметры операции
  input?: string;                  // Входные данные в формате JSON
  result: string;                  // Результат в виде строки
  timestamp: number;               // Временная метка создания
}

// Тип данных для хранения истории расчетов
export type CalculationHistory = CalculationResult[]; 