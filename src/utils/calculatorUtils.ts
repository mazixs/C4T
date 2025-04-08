import { CalculationRow, OperationType } from '../types';

// Форматирование чисел в формате RU
export function formatNumber(num: number): string {
  try {
    return Number(num).toLocaleString('ru-RU');
  } catch (error) {
    console.error('Ошибка форматирования числа:', error);
    return String(num);
  }
}

// Парсинг числа с учетом русской локали
export function parseValue(val: string): number {
  if (!val || val.trim() === '') return 0;
  
  try {
    return parseFloat(val.replace(/\s/g, '').replace(',', '.'));
  } catch (error) {
    console.error('Ошибка парсинга числа:', error);
    return 0;
  }
}

// Парсинг списка чисел, разделенных запятыми
export function parseNumberList(str: string): number[] {
  if (!str || str.trim() === '') return [];
  
  try {
    return str.split(',')
      .map(s => parseValue(s.trim()))
      .filter(x => !isNaN(x));
  } catch (error) {
    console.error('Ошибка парсинга списка чисел:', error);
    return [];
  }
}

// Вычисление НОД (наибольшего общего делителя)
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Вычисление НОК (наименьшего общего кратного) двух чисел
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// Вычисление НОК для массива чисел
export function lcmArray(numbers: number[]): number {
  return numbers.reduce((a, b) => lcm(a, b));
}

// Парсинг времени в минутах
export function parseTime(str: string): number {
  if (!str || str.trim() === '') return 0;
  
  try {
    // Преобразуем запятую в точку для корректного парсинга десятичных чисел
    const normalizedStr = str.replace(',', '.');
    
    if (normalizedStr.includes(':')) {
      const [hh, mm] = normalizedStr.split(':').map(x => parseFloat(x) || 0);
      return hh * 60 + mm;
    } else {
      // Десятичные часы
      return parseFloat(normalizedStr) * 60;
    }
  } catch (error) {
    console.error('Ошибка парсинга времени:', error);
    return 0;
  }
}

// Форматирование минут в часы:минуты с поддержкой дней
export function formatTime(m: number): string {
  try {
    // Получаем абсолютное значение минут (для обработки отрицательных значений)
    const absoluteMinutes = Math.abs(m);
    const sign = m < 0 ? '-' : '';
    
    // Количество дней в минутах
    const days = Math.floor(absoluteMinutes / (24 * 60));
    
    // Оставшиеся часы и минуты
    const hh = Math.floor((absoluteMinutes % (24 * 60)) / 60);
    const mm = Math.round(absoluteMinutes % 60);
    
    // Базовый формат времени
    const basicFormat = `${sign}${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    
    // Расширенный формат с днями (если есть)
    if (days > 0) {
      const dayText = days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней');
      return `${basicFormat} (${days} ${dayText}, ${hh} ч., ${mm} мин.)`;
    }
    
    return basicFormat;
  } catch (error) {
    console.error('Ошибка форматирования времени:', error);
    return '0:00';
  }
}

// Проверяет, является ли строка валидным числом
export function isValidNumber(str: string): boolean {
  if (!str || str.trim() === '') return false;
  
  const parsed = parseValue(str);
  return !isNaN(parsed) && isFinite(parsed);
}

// Проверяет, является ли строка валидным временем
export function isValidTime(str: string): boolean {
  if (!str || str.trim() === '') return false;
  
  try {
    if (str.includes(':')) {
      const [hh, mm] = str.split(':');
      return !isNaN(Number(hh)) && !isNaN(Number(mm)) && Number(mm) >= 0 && Number(mm) < 60;
    } else {
      return !isNaN(parseFloat(str));
    }
  } catch {
    return false;
  }
}

// Вычисляет простое арифметическое выражение
export function evaluateExpression(expression: string): number {
  // Очищаем входные данные и заменяем специальные символы на JS-операторы
  let cleanExpr = expression
    .replace(/\s+/g, '')       // удаляем пробелы
    .replace(/,/g, '.')        // заменяем запятые на точки
    .replace(/×/g, '*')        // заменяем символ умножения на *
    .replace(/÷/g, '/')        // заменяем символ деления на /
    .replace(/(\d)([×*])(\d)/g, '$1*$3') // гарантируем корректный синтаксис умножения
    .replace(/(\d)([÷\/])(\d)/g, '$1/$3'); // гарантируем корректный синтаксис деления
  
  // Проверяем, что выражение содержит только допустимые символы
  if (!/^[0-9+\-*/().,\s]*$/.test(cleanExpr)) {
    throw new Error('Выражение содержит недопустимые символы');
  }
  
  // Проверяем на безопасность (не содержит eval или других опасных конструкций)
  if (/eval|function|=>|new|this|class|window|document|global/i.test(cleanExpr)) {
    throw new Error('Выражение содержит запрещенные конструкции');
  }
  
  try {
    // Используем Function для безопасного вычисления выражения
    // Function создает новый контекст, защищая от атак на основе eval
    const calculateFn = new Function('return ' + cleanExpr);
    const result = calculateFn();
    
    // Проверяем результат на число
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Результат не является числом');
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при вычислении выражения:', error);
    throw new Error('Неверное арифметическое выражение');
  }
}

// Форматирование отношения с упрощением
export function formatRatio(a: number, b: number): string {
  if (b === 0) {
    throw new Error('Деление на ноль невозможно');
  }

  // Находим НОД для сокращения дроби
  const d = gcd(Math.round(a), Math.round(b));
  
  // Делим обе части на НОД
  const ratio1 = Math.round(a) / d;
  const ratio2 = Math.round(b) / d;
  
  return `${ratio1} : ${ratio2}`;
} 