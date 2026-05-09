/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Delete, 
  History, 
  RotateCcw, 
  Divide, 
  Minus, 
  Plus, 
  X, 
  Equal,
  ChevronRight
} from "lucide-react";

type Operation = "add" | "subtract" | "multiply" | "divide" | null;

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [isNewInput, setIsNewInput] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const formatNumber = (num: string): string => {
    if (num === "Error" || num === "Infinity" || num === "NaN") return num;
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleDigit = (digit: string) => {
    if (display.length >= 12 && !isNewInput) return;
    
    if (isNewInput) {
      setDisplay(digit === "." ? "0." : digit);
      setIsNewInput(false);
    } else {
      if (digit === "." && display.includes(".")) return;
      setDisplay(display + digit);
    }
  };

  const calculate = useCallback((a: number, b: number, op: Operation): number => {
    switch (op) {
      case "add": return a + b;
      case "subtract": return a - b;
      case "multiply": return a * b;
      case "divide": return b !== 0 ? a / b : NaN;
      default: return b;
    }
  }, []);

  const handleOperation = (op: Operation) => {
    const current = parseFloat(display);
    
    if (prevValue === null) {
      setPrevValue(current);
    } else if (operation) {
      const result = calculate(prevValue, current, operation);
      setPrevValue(result);
      setDisplay(String(result));
    }
    
    setOperation(op);
    setIsNewInput(true);
    setEquation(`${current} ${opToSymbol(op)}`);
  };

  const handleEqual = () => {
    if (prevValue === null || !operation) return;
    
    const current = parseFloat(display);
    const result = calculate(prevValue, current, operation);
    
    const expr = `${prevValue} ${opToSymbol(operation)} ${current}`;
    const resultStr = String(parseFloat(result.toFixed(8)));
    
    setHistory(prev => [{
      expression: expr,
      result: resultStr,
      timestamp: Date.now()
    }, ...prev].slice(0, 10));

    setDisplay(resultStr);
    setEquation("");
    setPrevValue(null);
    setOperation(null);
    setIsNewInput(true);
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
    setPrevValue(null);
    setOperation(null);
    setIsNewInput(true);
  };

  const deleteLast = () => {
    if (isNewInput) return;
    if (display.length === 1) {
      setDisplay("0");
      setIsNewInput(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const opToSymbol = (op: Operation): string => {
    switch (op) {
      case "add": return "+";
      case "subtract": return "-";
      case "multiply": return "×";
      case "divide": return "÷";
      default: return "";
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === ".") handleDigit(".");
      if (e.key === "+") handleOperation("add");
      if (e.key === "-") handleOperation("subtract");
      if (e.key === "*") handleOperation("multiply");
      if (e.key === "/") handleOperation("divide");
      if (e.key === "Enter" || e.key === "=") handleEqual();
      if (e.key === "Escape") clear();
      if (e.key === "Backspace") deleteLast();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, isNewInput, operation, prevValue]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div 
        id="calculator-container"
        className="relative w-full max-w-[380px] bg-[#1A1D23] rounded-[40px] p-6 shadow-2xl border border-slate-800 flex flex-col gap-6"
      >
        {/* Header / Brand */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Arithmos Precision
            </span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-200"
            id="btn-history"
          >
            <History size={18} />
          </button>
        </div>

        {/* Display Area */}
        <div id="display-section" className="bg-[#0A0C10] rounded-3xl p-6 min-h-[140px] flex flex-col justify-end items-end gap-1 shadow-inner border border-slate-900 overflow-hidden relative">
          <div className="text-slate-500 font-mono text-sm h-6 overflow-hidden text-right w-full">
            <AnimatePresence mode="wait">
              {equation && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  key={equation}
                >
                  {equation}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.div 
            id="main-display"
            key={display}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-mono tracking-tighter text-right w-full ${
              display.length > 9 ? 'text-4xl' : 'text-5xl'
            } font-medium`}
          >
            {formatNumber(display)}
          </motion.div>
          
          {/* Subtle Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-white/[0.02] to-transparent bg-[length:100%_4px]" />
        </div>

        {/* Controls Grid */}
        <div id="controls-grid" className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <CalcButton label="AC" onClick={clear} variant="secondary" />
          <CalcButton label="+/-" onClick={toggleSign} variant="secondary" />
          <CalcButton label="%" onClick={() => setDisplay(String(parseFloat(display) / 100))} variant="secondary" />
          <CalcButton icon={<Divide size={22} />} onClick={() => handleOperation("divide")} variant="accent" active={operation === "divide"} />

          {/* Row 2 */}
          <CalcButton label="7" onClick={() => handleDigit("7")} />
          <CalcButton label="8" onClick={() => handleDigit("8")} />
          <CalcButton label="9" onClick={() => handleDigit("9")} />
          <CalcButton icon={<X size={22} />} onClick={() => handleOperation("multiply")} variant="accent" active={operation === "multiply"} />

          {/* Row 3 */}
          <CalcButton label="4" onClick={() => handleDigit("4")} />
          <CalcButton label="5" onClick={() => handleDigit("5")} />
          <CalcButton label="6" onClick={() => handleDigit("6")} />
          <CalcButton icon={<Minus size={22} />} onClick={() => handleOperation("subtract")} variant="accent" active={operation === "subtract"} />

          {/* Row 4 */}
          <CalcButton label="1" onClick={() => handleDigit("1")} />
          <CalcButton label="2" onClick={() => handleDigit("2")} />
          <CalcButton label="3" onClick={() => handleDigit("3")} />
          <CalcButton icon={<Plus size={22} />} onClick={() => handleOperation("add")} variant="accent" active={operation === "add"} />

          {/* Row 5 */}
          <CalcButton label="0" onClick={() => handleDigit("0")} className="col-span-2" />
          <CalcButton label="." onClick={() => handleDigit(".")} />
          <CalcButton icon={<Equal size={26} />} onClick={handleEqual} variant="primary" />
        </div>

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-6 top-[88px] bottom-6 bg-[#1A1D23] rounded-3xl z-10 border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
              id="history-panel"
            >
              <div className="p-4 border-bottom border-slate-800 flex justify-between items-center bg-slate-900/50">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">History</span>
                <button onClick={() => setHistory([])} className="text-slate-500 hover:text-orange-500 transition-colors">
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-sm italic font-mono">
                    No calculations yet
                  </div>
                ) : (
                  history.map((item, i) => (
                    <motion.div 
                      key={item.timestamp}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-right border-b border-slate-800 pb-2 group"
                    >
                      <div className="text-slate-500 text-xs font-mono mb-1">{item.expression} =</div>
                      <div className="text-xl font-mono text-slate-200 group-hover:text-orange-400 transition-colors cursor-pointer" onClick={() => { setDisplay(item.result); setShowHistory(false); }}>
                        {formatNumber(item.result)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-4 text-center text-slate-500 hover:text-slate-200 text-xs uppercase tracking-widest transition-colors font-mono"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#0F1115]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

interface CalcButtonProps {
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "secondary" | "accent" | "primary";
  active?: boolean;
  className?: string;
}

function CalcButton({ label, icon, onClick, variant = "default", active = false, className = "" }: CalcButtonProps) {
  const getStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:bg-orange-500 active:scale-95 hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]";
      case "accent":
        return active 
          ? "bg-slate-100 text-[#1A1D23] shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
          : "bg-[#252A33] text-orange-500 hover:bg-[#2D333D] active:scale-95";
      case "secondary":
        return "bg-[#252A33] text-slate-400 hover:bg-[#2D333D] active:scale-95 font-medium";
      default:
        return "bg-[#1E232A] text-slate-200 hover:bg-[#252A33] active:scale-95 border border-slate-800/50 shadow-sm";
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`
        h-16 flex items-center justify-center rounded-2xl text-xl transition-all duration-150
        ${getStyles()}
        ${className}
      `}
      id={label ? `btn-${label}` : `btn-${variant}`}
    >
      {icon || label}
    </motion.button>
  );
}
