# 🔧 Pixel Pic 技術文檔

本文檔提供 Pixel Pic 應用程式的詳細技術說明，包括代碼架構、算法實現和開發指南。

## 📁 專案結構

```
pixel-pic/
├── index.html          # 主要 HTML 結構
├── styles.css          # CSS 樣式和響應式設計
├── script.js           # 核心 JavaScript 邏輯
├── README.md           # 使用文檔
└── TECHNICAL_DOCS.md   # 技術文檔
```

## 🏗️ 代碼架構

### 主要類別結構

#### 1. PixelPicApp 類別
```javascript
class PixelPicApp {
    constructor() {
        // DOM 元素初始化
        // 事件監聽器設定
        // 狀態變數初始化
    }
    
    // 圖片處理方法
    handleImageUpload(event)
    displayOriginalImage(image)
    showPreviewSection()
    
    // 分析相關方法
    analyzeImage()
    performImageAnalysis()
    updatePixelPreview()
    
    // 編織指導方法
    generateStitchingPattern()
    createSequentialPattern()
    updateStepDisplay()
    highlightCurrentStep()
    
    // 用戶互動方法
    handleCanvasClick(event)
    jumpToStep(stepNumber)
    nextStep()
    prevStep()
}
```

#### 2. ColorAnalysisTools 類別
```javascript
class ColorAnalysisTools {
    // 色彩空間轉換
    static rgbToXyz(r, g, b)
    static xyzToLab(x, y, z)
    static rgbToLab(r, g, b)
    static labToRgb(l, a, b)
    
    // 色彩距離計算
    static hyabDistance(lab1, lab2)
    static labDistance(lab1, lab2)
    static deltaE2000(lab1, lab2)
    
    // 格子檢測
    static detectGrid(imageData, width, height)
    static detectHorizontalLines(imageData, width, height)
    static detectVerticalLines(imageData, width, height)
    static extractCellColors(imageData, grid)
}
```

#### 3. XMeansCluster 類別
```javascript
class XMeansCluster {
    constructor(maxK = 20)
    
    // 主要聚類方法
    cluster(points)
    
    // K-means++ 初始化
    initializeKMeansPlusPlus(points, k)
    
    // BIC 計算
    calculateBIC(points, centers, assignments)
    
    // 分割改進
    improveClustering(points, centers, assignments)
}
```

#### 4. MedianCutQuantizer 類別
```javascript
class MedianCutQuantizer {
    constructor(maxColors)
    
    // 主要量化方法
    quantize(pixels)
    
    // 遞歸分割
    medianCut(box, depth)
    
    // 色彩盒子類別
    class ColorBox {
        constructor(pixels, minR, maxR, minG, maxG, minB, maxB)
        getLongestDimension()
        split()
        getAverageColor()
    }
}
```

## 🎨 色彩分析算法

### 1. HyAB X-Means 算法

#### HyAB 距離公式
```javascript
static hyabDistance(lab1, lab2) {
    const deltaL = Math.abs(lab1.l - lab2.l);
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    const deltaAB = Math.sqrt(deltaA * deltaA + deltaB * deltaB);
    
    // HyAB: L 差異使用絕對值，a*b* 使用歐幾里得距離
    return deltaL + deltaAB;
}
```

#### X-Means 自動聚類
```javascript
// 使用 BIC (Bayesian Information Criterion) 自動確定最佳聚類數
calculateBIC(points, centers, assignments) {
    const n = points.length;
    const k = centers.length;
    const dimensions = 3; // L*a*b* 三維
    
    let logLikelihood = 0;
    for (let i = 0; i < k; i++) {
        const clusterPoints = points.filter((_, idx) => assignments[idx] === i);
        if (clusterPoints.length > 0) {
            const variance = this.calculateClusterVariance(clusterPoints, centers[i]);
            logLikelihood += clusterPoints.length * Math.log(1 / Math.sqrt(2 * Math.PI * variance));
        }
    }
    
    const parameterCount = k * (dimensions + 1); // 中心點座標 + 變異數
    return logLikelihood - (parameterCount / 2) * Math.log(n);
}
```

### 2. Median Cut 算法

#### 遞歸色彩空間分割
```javascript
medianCut(box, depth) {
    if (depth === 0 || box.pixels.length <= 1) {
        return [box];
    }
    
    // 找到最長的色彩維度
    const longestDim = box.getLongestDimension();
    
    // 按該維度排序並分割
    const sortedPixels = box.pixels.sort((a, b) => a[longestDim] - b[longestDim]);
    const midPoint = Math.floor(sortedPixels.length / 2);
    
    const [leftBox, rightBox] = box.split(midPoint, longestDim);
    
    // 遞歸分割兩個子盒子
    return [
        ...this.medianCut(leftBox, depth - 1),
        ...this.medianCut(rightBox, depth - 1)
    ];
}
```

### 3. Delta E 2000 算法

#### CIE Delta E 2000 色彩差異
```javascript
static deltaE2000(lab1, lab2) {
    const L1 = lab1.l, a1 = lab1.a, b1 = lab1.b;
    const L2 = lab2.l, a2 = lab2.a, b2 = lab2.b;
    
    // 計算 Chroma
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cab = (C1 + C2) / 2;
    
    // G 因子計算
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));
    
    // 修正後的 a* 值
    const ap1 = (1 + G) * a1;
    const ap2 = (1 + G) * a2;
    
    // 極坐標轉換和差異計算
    const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1);
    const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2);
    
    // ... 完整的 Delta E 2000 公式實現
    
    return deltaE;
}
```

## 🔍 格子檢測算法

### 邊緣檢測原理

#### 梯度計算
```javascript
static detectHorizontalLines(imageData, width, height) {
    const data = imageData.data;
    const gradients = [];
    
    for (let y = 1; y < height - 1; y++) {
        let rowGradient = 0;
        for (let x = 0; x < width; x++) {
            const topIdx = ((y - 1) * width + x) * 4;
            const bottomIdx = ((y + 1) * width + x) * 4;
            
            // 計算垂直梯度（檢測水平線）
            const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
            const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
            
            rowGradient += Math.abs(topGray - bottomGray);
        }
        gradients.push({ y, strength: rowGradient / width });
    }
    
    return gradients;
}
```

#### 格線過濾和驗證
```javascript
static filterCloseLines(lines, minDistance = 5) {
    if (lines.length <= 1) return lines;
    
    const filtered = [lines[0]];
    
    for (let i = 1; i < lines.length; i++) {
        const lastAccepted = filtered[filtered.length - 1];
        if (Math.abs(lines[i].position - lastAccepted.position) >= minDistance) {
            filtered.push(lines[i]);
        }
    }
    
    return filtered;
}
```

## 🧶 編織模式算法

### 蛇形編織模式
```javascript
createSequentialPattern() {
    // 蛇形編織順序（之字形）- 從右下角開始
    const pattern = [];
    const rows = this.pixelData.length;
    const cols = this.pixelData[0].length;
    
    // 從最後一行開始，往上編織
    for (let y = rows - 1; y >= 0; y--) {
        const rowIndex = rows - 1 - y; // 計算是第幾行（從下往上）
        
        if (rowIndex % 2 === 0) {
            // 第一行（最下面）和奇數行：從右到左
            for (let x = cols - 1; x >= 0; x--) {
                pattern.push({
                    x: x,
                    y: y,
                    color: this.pixelData[y][x],
                    step: pattern.length + 1
                });
            }
        } else {
            // 偶數行：從左到右
            for (let x = 0; x < cols; x++) {
                pattern.push({
                    x: x,
                    y: y,
                    color: this.pixelData[y][x],
                    step: pattern.length + 1
                });
            }
        }
    }
    
    return pattern;
}
```

### 顏色批次計算
```javascript
calculateColorBatches() {
    const batches = [];
    let currentBatch = {
        color: this.stitchingPattern[0].color,
        startStep: 1,
        count: 1
    };
    
    for (let i = 1; i < this.stitchingPattern.length; i++) {
        const currentStep = this.stitchingPattern[i];
        
        if (this.colorsEqual(currentStep.color, currentBatch.color)) {
            currentBatch.count++;
        } else {
            // 顏色改變，儲存當前批次並開始新批次
            batches.push({...currentBatch});
            currentBatch = {
                color: currentStep.color,
                startStep: i + 1,
                count: 1
            };
        }
    }
    
    batches.push(currentBatch); // 加入最後一個批次
    return batches;
}
```

## 🎯 用戶互動系統

### 畫布點擊檢測
```javascript
handleCanvasClick(event) {
    const canvas = this.guideCanvas;
    const rect = canvas.getBoundingClientRect();
    
    // 計算點擊位置相對於 canvas 的座標
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 轉換為網格座標
    const cellSize = 20;
    const clickedCol = Math.floor(x / cellSize);
    const clickedRow = Math.floor(y / cellSize);
    
    // 根據蛇形模式計算步驟數
    const stepNumber = this.calculateStepFromPosition(clickedRow, clickedCol);
    
    if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
        this.jumpToStep(stepNumber);
    }
}
```

### 步驟跳轉邏輯
```javascript
// 新的編織模式使用直接查找的方式
handleCanvasClick(e) {
    const rect = this.guideCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = 20;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);
    
    // 找到對應的步驟（因為編織順序複雜，直接在模式中查找）
    const targetStep = this.stitchingPattern.find(step => 
        step.x === gridX && step.y === gridY
    );
    
    if (targetStep) {
        this.currentStep = targetStep.step - 1;
        this.updateStepDisplay();
        this.highlightCurrentStep();
    }
}
```

## 📱 響應式設計實現

### CSS 媒體查詢
```css
/* 平板裝置 */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .settings-panel {
        grid-template-columns: 1fr;
    }
    
    .guide-layout {
        flex-direction: column;
    }
}

/* 手機裝置 */
@media (max-width: 480px) {
    .setting-group {
        flex-direction: column;
        align-items: stretch;
    }
    
    .guide-canvas {
        max-width: 100%;
        height: auto;
    }
    
    .color-palette {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    }
}
```

### 動態畫布調整
```javascript
setupGuideCanvas() {
    const cellSize = 20;
    const cols = this.pixelData[0].length;
    const rows = this.pixelData.length;
    
    // 計算最適合的畫布尺寸
    const maxWidth = Math.min(window.innerWidth * 0.8, 800);
    const maxHeight = Math.min(window.innerHeight * 0.6, 600);
    
    const aspectRatio = cols / rows;
    let canvasWidth, canvasHeight;
    
    if (aspectRatio > maxWidth / maxHeight) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
    }
    
    this.guideCanvas.width = cols * cellSize;
    this.guideCanvas.height = rows * cellSize;
    this.guideCanvas.style.width = canvasWidth + 'px';
    this.guideCanvas.style.height = canvasHeight + 'px';
}
```

## 🔧 性能優化

### 圖片處理優化
```javascript
// 使用 Web Workers 進行耗時計算（未來實現）
performImageAnalysisAsync() {
    return new Promise((resolve, reject) => {
        const worker = new Worker('analysis-worker.js');
        
        worker.postMessage({
            imageData: this.imageData,
            method: this.getSelectedAnalysisMethod(),
            colorCount: this.colorCountSlider.value
        });
        
        worker.onmessage = (e) => {
            resolve(e.data);
        };
        
        worker.onerror = (error) => {
            reject(error);
        };
    });
}
```

### 記憶體管理
```javascript
// 清理大型物件以防止記憶體洩漏
cleanup() {
    if (this.currentImage) {
        this.currentImage.src = '';
        this.currentImage = null;
    }
    
    if (this.pixelData) {
        this.pixelData = null;
    }
    
    if (this.colorPalette) {
        this.colorPalette.length = 0;
    }
}
```

## 🧪 測試和除錯

### 控制台除錯指令
```javascript
// 在瀏覽器控制台中可用的除錯函數
window.debugPixelPic = {
    // 匯出當前狀態
    exportState: () => {
        return {
            currentStep: app.currentStep,
            totalSteps: app.totalSteps,
            colorPalette: app.colorPalette,
            pixelData: app.pixelData
        };
    },
    
    // 設定除錯模式
    enableDebug: () => {
        app.debugMode = true;
        console.log('除錯模式已啟用');
    },
    
    // 測試分析算法
    testAnalysis: (method) => {
        app.analysisMethod = method;
        app.performImageAnalysis();
    }
};
```

### 錯誤處理策略
```javascript
// 全域錯誤處理
window.addEventListener('error', (event) => {
    console.error('應用程式錯誤:', event.error);
    
    // 嘗試恢復應用程式狀態
    if (app.analyzeBtn) {
        app.analyzeBtn.disabled = false;
        app.analyzeBtn.textContent = '重新分析';
    }
});

// Promise 錯誤處理
window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 錯誤:', event.reason);
    event.preventDefault();
});
```

## 🔄 版本控制和部署

### Git 工作流程
```bash
# 開發分支
git checkout -b feature/new-analysis-method

# 提交變更
git add .
git commit -m "feat: 新增 Delta E 2000 分析方法"

# 合併到主分支
git checkout main
git merge feature/new-analysis-method

# 標記版本
git tag v1.1.0
git push origin main --tags
```

### 自動化部署腳本
```javascript
// deploy.js - 簡易部署腳本
const fs = require('fs');
const path = require('path');

// 壓縮 CSS 和 JS
function minifyFiles() {
    // 實現檔案壓縮邏輯
}

// 生成部署包
function createDeploymentPackage() {
    const files = ['index.html', 'styles.css', 'script.js'];
    // 實現打包邏輯
}

// 執行部署
minifyFiles();
createDeploymentPackage();
console.log('部署包已生成');
```

## 📊 性能指標

### 加載時間目標
- **首次載入**：< 2 秒
- **圖片分析**：< 5 秒（一般像素畫）
- **UI 響應**：< 100ms

### 記憶體使用
- **基線記憶體**：< 50MB
- **分析期間**：< 200MB
- **長期使用**：無記憶體洩漏

## 🔮 未來發展規劃

### 短期目標（1-3個月）
- ✅ 完善錯誤處理
- 🔄 新增匯出功能
- 🔄 增加更多分析算法
- 🔄 改善行動裝置體驗

### 中期目標（3-6個月）
- 📱 開發 PWA 版本
- 🔄 新增批次處理功能
- 🔄 整合社群分享功能
- 🔄 多語言支援

### 長期目標（6-12個月）
- 🤖 AI 輔助色彩建議
- 📊 編織進度追蹤
- 🛒 線材購買建議
- 👥 社群功能

---

**技術文檔版本**：1.0.0  
**最後更新**：2024年  
**維護者**：Pixel Pic 開發團隊  

如需更多技術支援或有任何問題，請參考主要的 README.md 文檔或聯繫開發團隊。 