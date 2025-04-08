import React from 'react';

interface CalculationResultProps {
  result: string;
}

const CalculationResult: React.FC<CalculationResultProps> = ({ result }) => {
  // Проверяем, является ли результат вычислением общего знаменателя
  if (result.includes('Общий знаменатель')) {
    const [firstLine, secondLine] = result.split('<br/>');
    return (
      <div className="flex flex-col gap-1">
        <span>{firstLine}</span>
        <span>{secondLine}</span>
      </div>
    );
  }

  // Для остальных результатов просто возвращаем текст
  return <span>{result}</span>;
};

export default CalculationResult; 