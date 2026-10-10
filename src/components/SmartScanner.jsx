import { useState, useRef } from 'react';
import { FileText, Loader2, CheckCircle2, ImagePlus } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { scanReceipt } from '../utils/agentBot';
import Tesseract from 'tesseract.js';

export default function SmartScanner() {
  const { dispatch } = useApp();
  const [text, setText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [result, setResult] = useState(null);
  const [insight, setInsight] = useState(null);
  const fileInputRef = useRef(null);

  const processImageFile = async (file) => {
    if (!file) return;

    setIsReadingImage(true);
    setResult('Extracting text from image...');
    
    try {
      const { data: { text: extractedText } } = await Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m) }
      );
      
      if (extractedText.trim()) {
        setText((prev) => prev ? prev + '\n' + extractedText : extractedText);
        setResult('Image text extracted successfully! Click Analyze to log it.');
      } else {
        setResult('Could not read any text from the image.');
      }
    } catch (error) {
      console.error(error);
      setResult('Failed to read image.');
    } finally {
      setIsReadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
    processImageFile(e.target.files?.[0]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleScan = async () => {
    if (!text.trim()) return;
    setIsScanning(true);
    setResult(null);
    setInsight(null);

    try {
      const parsedData = await scanReceipt(text);
      if (parsedData && parsedData.activities && parsedData.activities.length > 0) {
        parsedData.activities.forEach(activity => {
          // Add default fields needed by the app
          const newActivity = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            date: new Date().toISOString(),
            ...activity,
          };
          dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
        });
        setResult(`Successfully logged ${parsedData.activities.length} activit${parsedData.activities.length === 1 ? 'y' : 'ies'}!`);
        if (parsedData.insight) {
          setInsight(parsedData.insight);
        }
        setText('');
      } else {
        setResult('Could not find any carbon-related activities in the text.');
      }
    } catch (error) {
      console.error(error);
      setResult('Failed to scan. Please check your API keys or try again.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                Smart Bill & Receipt Scanner
                
                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isReadingImage || isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                  {isReadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {isReadingImage ? 'Reading...' : 'Upload Image'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Paste text or upload an image of your receipt. The AI will extract and log it automatically.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste receipt text or Ctrl+V to paste an image directly here..."
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                {result && !isReadingImage && (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {result}
                  </>
                )}
                {isReadingImage && (
                  <span className="text-blue-500">{result}</span>
                )}
              </div>
              <button
                onClick={handleScan}
                disabled={!text.trim() || isScanning || isReadingImage}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Analyze & Log
                  </>
                )}
              </button>
            </div>

            {/* Insight Box */}
            {insight && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Insight</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {insight}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
