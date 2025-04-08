import { CalculationRow, CalculationResult, OperationType } from '../types';
import { 
  formatNumber, 
  parseValue, 
  parseNumberList, 
  gcd, 
  lcmArray,
  parseTime, 
  formatTime,
  isValidNumber,
  isValidTime,
  evaluateExpression,
  formatRatio
} from '../utils/calculatorUtils';

// Проверка валидности ввода в зависимости от выбранной операции
export function validateInput(row: CalculationRow, operation: OperationType): string | null {
  // Общие проверки для операций, требующих числовые значения
  const numericOperations = [
    OperationType.percent_of,
    OperationType.sub_percent,
    OperationType.add_percent,
    OperationType.mod,
    OperationType.relative_ratio,
    OperationType.percent_change_relative,
    OperationType.chain_calc
  ];

  // Для операции ratio делаем отдельную проверку
  if (operation === OperationType.ratio) {
    const numbers1 = parseNumberList(row.value1);
    const numbers2 = parseNumberList(row.value2);
    const allNumbers = [...numbers1, ...numbers2].filter(n => !isNaN(n));
    
    if (allNumbers.length < 2) {
      return 'Необходимо минимум два числа для расчета соотношения';
    }
    
    if (allNumbers.includes(0)) {
      return 'Ноль не может участвовать в соотношении';
    }
    
    return null;
  }

  if (numericOperations.includes(operation)) {
    if (operation !== OperationType.quarter_third && !isValidNumber(row.value1)) {
      return 'Первое значение должно быть числом';
    }

    if (operation !== OperationType.quarter_third && !isValidNumber(row.value2)) {
      return 'Второе значение должно быть числом';
    }

    if (operation === OperationType.chain_calc && !isValidNumber(row.value3 || '')) {
      return 'Третье значение должно быть числом';
    }

    // Специальные проверки
    if (operation === OperationType.relative_ratio && parseValue(row.value2) === 0) {
      return 'Делитель не может быть нулем';
    }

    if (operation === OperationType.percent_change_relative && parseValue(row.value1) === 0) {
      return 'Первое число не может быть нулем при расчете процентного изменения';
    }
  }

  // Проверка для простой арифметики
  if (operation === OperationType.simple_calc) {
    if (row.value1.trim() === '') {
      return 'Введите арифметическое выражение';
    }
    
    try {
      evaluateExpression(row.value1);
    } catch (e) {
      return 'Некорректное арифметическое выражение';
    }
  }

  // Проверки для операций со списками чисел
  const listOperations = [
    OperationType.sum_comma,
    OperationType.diff_comma,
    OperationType.mul_comma,
    OperationType.div_comma
  ];
  
  if (listOperations.includes(operation)) {
    const nums = parseNumberList(row.value1);
    if (nums.length === 0) {
      return 'Введите хотя бы одно число через запятую';
    }
    
    if (operation === OperationType.div_comma) {
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === 0) {
          return 'Деление на ноль невозможно';
        }
      }
    }
  }

  // Проверки для операций со временем
  const timeOperations = [OperationType.add_time, OperationType.sub_time];
  if (timeOperations.includes(operation)) {
    if (!isValidTime(row.value1)) {
      return 'Первое значение должно быть в формате часы:минуты или десятичные часы';
    }
    if (!isValidTime(row.value2)) {
      return 'Второе значение должно быть в формате часы:минуты или десятичные часы';
    }
  }

  return null;
}

// Вычисление соотношения между числами
export function calculateRatio(numbers: number[]): string {
  if (numbers.length < 2) {
    throw new Error('Необходимо минимум два числа для расчета соотношения');
  }

  // Находим НОД всех чисел
  let gcdValue = Math.abs(Math.round(numbers[0]));
  for (let i = 1; i < numbers.length; i++) {
    gcdValue = gcd(gcdValue, Math.abs(Math.round(numbers[i])));
  }

  // Делим все числа на НОД
  const simplifiedNumbers = numbers.map(n => Math.abs(Math.round(n)) / gcdValue);
  
  return `Соотношение ${numbers.map(formatNumber).join(' : ')} = ${simplifiedNumbers.map(n => n.toString()).join(' : ')}`;
}

// Выполнение расчета
export function calculate(row: CalculationRow, operation: OperationType): CalculationResult {
  // Проверка валидности ввода
  const validationError = validateInput(row, operation);
  if (validationError) {
    return {
      input: JSON.stringify(row),
      result: `Ошибка: ${validationError}`,
      timestamp: Date.now(),
      operation: operation
    };
  }

  try {
    let result = '';
    let fullExpression = '';
    
    // Общий знаменатель
    if (operation === OperationType.common_denominator) {
      const numbers1 = parseNumberList(row.value1);
      const numbers2 = parseNumberList(row.value2);
      const allNumbers = [...numbers1, ...numbers2].filter(n => !isNaN(n));
      
      if (allNumbers.length < 2) {
        throw new Error('Необходимо минимум два числа для поиска общего знаменателя');
      }
      
      // Округляем числа до целых и берем по модулю
      const roundedNumbers = allNumbers.map(n => Math.abs(Math.round(n)));
      
      // Находим НОД всех чисел
      let commonDivisor = roundedNumbers[0];
      for (let i = 1; i < roundedNumbers.length; i++) {
        commonDivisor = gcd(commonDivisor, roundedNumbers[i]);
      }
      
      // Вычисляем частные от деления на НОД
      const quotients = roundedNumbers.map(n => n / commonDivisor);
      
      // Формируем строку результата с HTML-тегом переноса строки
      result = `Общий знаменатель для чисел ${roundedNumbers.join(', ')} равен ${commonDivisor}<br/>`;
      result += `После сокращения: ${quotients.join(', ')}`;
    }
    
    // Простая арифметика
    if (operation === OperationType.simple_calc) {
      try {
        const calculated = evaluateExpression(row.value1);
        result = `${row.value1} = ${formatNumber(calculated)}`;
        
        return {
          input: JSON.stringify(row),
          result,
          timestamp: Date.now(),
          operation: operation,
          parameters: {
            expression: row.value1,
            result: calculated
          }
        };
      } catch (e) {
        return {
          input: JSON.stringify(row),
          result: `Ошибка: ${(e as Error).message || 'Неверное выражение'}`,
          timestamp: Date.now(),
          operation: operation,
          parameters: {
            expression: row.value1
          }
        };
      }
    }
    
    // 1) Процент от числа
    if (operation === OperationType.percent_of) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const calc = v1 * (v2 / 100);
      result = `${formatNumber(v1)} × ${v2}% = ${formatNumber(calc)}`;
    }
    
    // 2) Вычесть процент
    else if (operation === OperationType.sub_percent) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const res = v1 - (v1 * (v2 / 100));
      result = `${formatNumber(v1)} - ${v2}% = ${formatNumber(res)}`;
    }
    
    // 3) Добавить процент
    else if (operation === OperationType.add_percent) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const res = v1 + (v1 * (v2 / 100));
      result = `${formatNumber(v1)} + ${v2}% = ${formatNumber(res)}`;
    }
    
    // 4) Остаток от вычитания %
    else if (operation === OperationType.mod) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const pct = v1 * (v2 / 100);
      const ost = v1 - pct;
      result = `${v2}% от ${formatNumber(v1)} = ${formatNumber(pct)}, остаток: ${formatNumber(ost)}`;
    }
    
    // 5) Соотношение
    if (operation === OperationType.ratio) {
      // Собираем все числа из обоих полей
      const numbers1 = parseNumberList(row.value1);
      const numbers2 = parseNumberList(row.value2);
      const allNumbers = [...numbers1, ...numbers2].filter(n => !isNaN(n));
      
      if (allNumbers.length < 2) {
        throw new Error('Необходимо минимум два числа для расчета соотношения');
      }
      
      result = calculateRatio(allNumbers);
    }
    
    // 6) Соотношение долей напрямую
    else if (operation === OperationType.relative_ratio) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const ratio = v1 / v2;
      result = `Соотношение долей: ${formatNumber(v1)} / ${formatNumber(v2)} = ${ratio.toFixed(2)} : 1`;
    }
    
    // 7) Процентное изменение между числами
    else if (operation === OperationType.percent_change_relative) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const diff = v1 - v2;
      const change = Math.abs(diff) / v1 * 100;
      if (diff > 0) {
        result = `Снижение: (${formatNumber(v1)} - ${formatNumber(v2)}) / ${formatNumber(v1)} × 100 = ${change.toFixed(2)}%`;
      } else if (diff < 0) {
        result = `Рост: (${formatNumber(v2)} - ${formatNumber(v1)}) / ${formatNumber(v1)} × 100 = ${change.toFixed(2)}%`;
      } else {
        result = 'Без изменений (0%)';
      }
    }
    
    // 8) Половина, четверть, треть, пятая часть
    else if (operation === OperationType.quarter_third) {
      const v1 = parseValue(row.value1);
      const half = v1 / 2;
      const quarter = v1 / 4;
      const third = v1 / 3;
      const fifth = v1 / 5;
      result = `Половина от ${formatNumber(v1)} = ${formatNumber(half)}, четверть = ${formatNumber(quarter)}, треть = ${formatNumber(third)}, пятая часть = ${formatNumber(fifth)}`;
    }
    
    // 9) Сумма чисел через запятую
    else if (operation === OperationType.sum_comma) {
      const v1 = row.value1;
      const nums = parseNumberList(v1);
      const sum = nums.reduce((a, b) => a + b, 0);
      result = `Сумма: ${nums.map(formatNumber).join(' + ')} = ${formatNumber(sum)}`;
    }
    
    // 10) Разность
    else if (operation === OperationType.diff_comma) {
      const v1 = row.value1;
      const nums = parseNumberList(v1);
      const diff = nums.slice(1).reduce((a, b) => a - b, nums[0]);
      result = `Разность: ${nums.map(formatNumber).join(' - ')} = ${formatNumber(diff)}`;
    }
    
    // 11) Произведение
    else if (operation === OperationType.mul_comma) {
      const v1 = row.value1;
      const nums = parseNumberList(v1);
      const prod = nums.reduce((a, b) => a * b, 1);
      result = `Произведение: ${nums.map(formatNumber).join(' × ')} = ${formatNumber(prod)}`;
    }
    
    // 12) Деление по порядку
    else if (operation === OperationType.div_comma) {
      const v1 = row.value1;
      const nums = parseNumberList(v1);
      const div = nums.slice(1).reduce((a, b) => a / b, nums[0]);
      result = `Деление: ${nums.map(formatNumber).join(' / ')} = ${formatNumber(div)}`;
    }
    
    // 13) chain_calc
    else if (operation === OperationType.chain_calc) {
      const v1 = parseValue(row.value1);
      const v2 = parseValue(row.value2);
      const v3 = row.value3 ? parseValue(row.value3) : 0;
      const a = v1;
      const b = a + (a * (v2 / 100));
      const c = b - (b * (v3 / 100));
      result = `a = ${formatNumber(a)}, b = a + ${v2}% = ${formatNumber(b)}, c = b - ${v3}% = ${formatNumber(c)}`;
    }
    
    // 14) add_time, sub_time
    else if (operation === OperationType.add_time || operation === OperationType.sub_time) {
      const v1 = row.value1;
      const v2 = row.value2;
      const t1 = parseTime(v1);
      const t2 = parseTime(v2);
      
      if (operation === OperationType.add_time) {
        const total = t1 + t2;
        result = `${v1} + ${v2} = ${formatTime(total)}`;
      } else {
        const total = t1 - t2;
        result = `${v1} - ${v2} = ${formatTime(total)}`;
      }
    }

    return {
      input: JSON.stringify(row),
      result,
      timestamp: Date.now(),
      operation: operation,
      parameters: {
        value1: row.value1,
        value2: row.value2,
        value3: row.value3,
        fullExpression
      }
    };
  } catch (error) {
    return {
      input: JSON.stringify(row),
      result: `Ошибка: ${(error as Error).message || 'Неизвестная ошибка'}`,
      timestamp: Date.now(),
      operation: operation,
      parameters: {
        value1: row.value1,
        value2: row.value2,
        value3: row.value3
      }
    };
  }
} 